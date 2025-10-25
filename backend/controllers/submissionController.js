const Assignment = require('../models/Assignment');
const Submission = require('../models/Submission');
const AgentActivity = require('../models/AgentActivity');
const { runPythonAgent } = require('../utils/agentBridge');

// Start a quiz attempt (creates an in-progress submission with a per-student deadline)
async function startAttempt(req, res) {
  const { id } = req.params; // assignment id
  try {
    const assignment = await Assignment.findById(id);
    if (!assignment) return res.status(404).json({ ok: false, error: 'Assignment not found' });
    if (assignment.status !== 'published') return res.status(400).json({ ok: false, error: 'Quiz not open' });
    if (assignment.kind !== 'quiz') return res.status(400).json({ ok: false, error: 'Only quizzes can be started' });
    if (!assignment.durationMinutes) return res.status(400).json({ ok: false, error: 'Quiz duration not set' });

    const now = new Date();
    if (assignment.quizWindowStart && now < assignment.quizWindowStart) {
      return res.status(403).json({ ok: false, error: 'Quiz has not started' });
    }
    if (assignment.quizWindowEnd && now > assignment.quizWindowEnd) {
      return res.status(403).json({ ok: false, error: 'Quiz window has ended' });
    }

    let submission = await Submission.findOne({ assignment: id, student: req.user._id, status: 'in_progress' });
    if (!submission) {
      const endAt = new Date(now.getTime() + assignment.durationMinutes * 60 * 1000);
      submission = await Submission.create({
        assignment: id,
        student: req.user._id,
        status: 'in_progress',
        startedAt: now,
        endAt,
      });
    }

    res.json({ ok: true, submission });
  } catch (e) {
    res.status(400).json({ ok: false, error: e.message });
  }
}

// Submit answers for an assignment or quiz
async function submitAnswers(req, res) {
  const { id } = req.params; // assignment id
  try {
    const assignment = await Assignment.findById(id);
    if (!assignment) return res.status(404).json({ ok: false, error: 'Assignment not found' });
    if (assignment.status !== 'published') return res.status(400).json({ ok: false, error: 'Not open' });

    const answers = req.body?.answers || [];
    const now = new Date();

    if (assignment.kind === 'assignment') {
      if (assignment.dueDate && now > assignment.dueDate) {
        return res.status(403).json({ ok: false, error: 'Deadline passed. Submission not accepted.' });
      }
      const doc = await Submission.findOneAndUpdate(
        { assignment: id, student: req.user._id },
        { answers, status: 'submitted', submittedAt: now },
        { upsert: true, new: true }
      );
      return res.json({ ok: true, submission: doc });
    }

    // Quiz flow
    if (assignment.kind === 'quiz') {
      // Respect quiz window
      if (assignment.quizWindowStart && now < assignment.quizWindowStart) {
        return res.status(403).json({ ok: false, error: 'Quiz has not started' });
      }
      if (assignment.quizWindowEnd && now > assignment.quizWindowEnd) {
        // Auto-submit with whatever was sent (or empty)
        const doc = await Submission.findOneAndUpdate(
          { assignment: id, student: req.user._id },
          { answers, status: 'submitted', submittedAt: now, autoSubmitted: true },
          { upsert: true, new: true }
        );
        return res.json({ ok: true, submission: doc });
      }

      let submission = await Submission.findOne({ assignment: id, student: req.user._id });
      if (!submission || !submission.startedAt || !submission.endAt) {
        // If user skipped explicit start, start now but keep duration from now
        const endAt = new Date(now.getTime() + (assignment.durationMinutes || 0) * 60 * 1000);
        submission = await Submission.findOneAndUpdate(
          { assignment: id, student: req.user._id },
          { status: 'in_progress', startedAt: now, endAt },
          { upsert: true, new: true }
        );
      }

      const timeOver = submission.endAt && now > submission.endAt;
      const update = {
        answers,
        status: 'submitted',
        submittedAt: now,
        autoSubmitted: timeOver ? true : submission.autoSubmitted,
      };
      submission.set(update);
      await submission.save();
      return res.json({ ok: true, submission });
    }

    return res.status(400).json({ ok: false, error: 'Unsupported kind' });
  } catch (e) {
    res.status(400).json({ ok: false, error: e.message });
  }
}

// Grade a submission using AI
async function gradeSubmissionAI(req, res) {
  const { id } = req.params; // submission id
  try {
    const submission = await Submission.findById(id);
    if (!submission) return res.status(404).json({ ok: false, error: 'Submission not found' });
    if (submission.status === 'graded') {
      return res.status(400).json({ ok: false, error: 'Submission already graded' });
    }

    // Only scholar owner (assignment creator) or admin can trigger AI grade
    const assignment = await Assignment.findById(submission.assignment);
    const isOwner = String(assignment.createdBy) === String(req.user._id);
    if (!isOwner && req.user.role !== 'admin') return res.status(403).json({ ok: false, error: 'Forbidden' });

    const payload = {
      model: process.env.GEMINI_MODEL || 'gemini-2.5-flash',
      assignment: {
        id: String(assignment._id),
        title: assignment.title,
        description: assignment.description,
        type: assignment.type,
        questions: assignment.questions,
      },
      submission: {
        id: String(submission._id),
        answers: submission.answers,
      }
    };

    const result = await runPythonAgent('assignment_grader.py', payload, { timeoutMs: 120000 });

    const activity = await AgentActivity.create({
      kind: 'grading',
      assignment: assignment._id,
      submission: submission._id,
      agent: 'gemini-assignment-grader',
      inputSummary: JSON.stringify({ assignment: payload.assignment, submission: { id: payload.submission.id, answersCount: payload.submission.answers?.length || 0 } }).slice(0, 500),
      outputSummary: result.ok ? JSON.stringify(result.data).slice(0, 500) : result.error?.slice(0, 500),
      status: result.ok ? 'success' : 'error',
      error: result.ok ? undefined : result.error,
      latencyMs: result.latencyMs,
      model: payload.model,
    });

    if (!result.ok) return res.status(502).json({ ok: false, error: 'AI grading failed', detail: result.error });

    const { totalScore, perQuestion = [], feedback, model, version } = result.data || {};
    submission.status = 'graded';
    submission.grade = typeof totalScore === 'number' ? totalScore : undefined;
    submission.feedback = feedback || '';
    submission.aiGrading = { totalScore, perQuestion, reasoning: feedback, model, version };
    submission.gradedBy = req.user._id;
    await submission.save();

    res.json({ ok: true, submission, activityId: activity._id });
  } catch (e) {
    res.status(500).json({ ok: false, error: e.message });
  }
}

// Human override
async function overrideGrade(req, res) {
  const { id } = req.params; // submission id
  try {
    const submission = await Submission.findById(id);
    if (!submission) return res.status(404).json({ ok: false, error: 'Submission not found' });
    const assignment = await Assignment.findById(submission.assignment);
    const isOwner = String(assignment.createdBy) === String(req.user._id);
    if (!isOwner && req.user.role !== 'admin') return res.status(403).json({ ok: false, error: 'Forbidden' });

    const { grade, feedback, reason } = req.body || {};
    if (typeof grade === 'number') submission.grade = grade;
    if (typeof feedback === 'string') submission.feedback = feedback;
    submission.override = { overridden: true, by: req.user._id, reason: reason || 'manual override', at: new Date() };
    submission.status = 'graded';
    await submission.save();

    res.json({ ok: true, submission });
  } catch (e) {
    res.status(400).json({ ok: false, error: e.message });
  }
}

// List submissions for an assignment (owner only)
async function listSubmissionsForAssignment(req, res) {
  const { id } = req.params; // assignment id
  try {
    const assignment = await Assignment.findById(id);
    if (!assignment) return res.status(404).json({ ok: false, error: 'Assignment not found' });
    const isOwner = String(assignment.createdBy) === String(req.user._id);
    if (!isOwner && req.user.role !== 'admin') return res.status(403).json({ ok: false, error: 'Forbidden' });
    const list = await Submission.find({ assignment: id }).sort({ createdAt: -1 }).lean();
    res.json({ ok: true, submissions: list });
  } catch (e) {
    res.status(500).json({ ok: false, error: e.message });
  }
}

// Get my submissions (student)
async function listMySubmissions(req, res) {
  try {
    const list = await Submission.find({ student: req.user._id }).sort({ createdAt: -1 }).lean();
    res.json({ ok: true, submissions: list });
  } catch (e) {
    res.status(500).json({ ok: false, error: e.message });
  }
}

module.exports = {
  submitAnswers,
  startAttempt,
  gradeSubmissionAI,
  overrideGrade,
  listSubmissionsForAssignment,
  listMySubmissions,
};
// List submissions inbox for scholar (across their assignments)
async function listSubmissionsInbox(req, res) {
  try {
    const Assignment = require('../models/Assignment');
    const myAssignments = await Assignment.find({ createdBy: req.user._id }).select('_id').lean();
    const ids = myAssignments.map(a => a._id);
    if (ids.length === 0) return res.json({ ok: true, submissions: [] });
    const status = req.query.status;
    const q = { assignment: { $in: ids } };
    if (status) q.status = status;
    const list = await Submission.find(q).sort({ createdAt: -1 }).lean();
    res.json({ ok: true, submissions: list });
  } catch (e) {
    res.status(500).json({ ok: false, error: e.message });
  }
}

module.exports.listSubmissionsInbox = listSubmissionsInbox;

// Manual grading endpoint (set per-question and total)
async function manualGradeSubmission(req, res) {
  const { id } = req.params; // submission id
  try {
    const submission = await Submission.findById(id);
    if (!submission) return res.status(404).json({ ok: false, error: 'Submission not found' });
    const assignment = await Assignment.findById(submission.assignment);
    const isOwner = String(assignment.createdBy) === String(req.user._id);
    if (!isOwner && req.user.role !== 'admin') return res.status(403).json({ ok: false, error: 'Forbidden' });

    const { totalScore, perQuestion = [], feedback } = req.body || {};
    submission.manualGrading = {
      totalScore: typeof totalScore === 'number' ? totalScore : undefined,
      perQuestion: Array.isArray(perQuestion) ? perQuestion : [],
      feedback: typeof feedback === 'string' ? feedback : undefined,
      by: req.user._id,
      at: new Date(),
    };
    // Also set surface grade/status for convenience
    if (typeof totalScore === 'number') submission.grade = totalScore;
    if (typeof feedback === 'string') submission.feedback = feedback;
    submission.status = 'graded';
    submission.gradedBy = req.user._id;
    await submission.save();

    res.json({ ok: true, submission });
  } catch (e) {
    res.status(400).json({ ok: false, error: e.message });
  }
}

module.exports.manualGradeSubmission = manualGradeSubmission;
