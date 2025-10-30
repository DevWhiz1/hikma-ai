const Assignment = require('../models/Assignment');
const Submission = require('../models/Submission');
const AgentActivity = require('../models/AgentActivity');
const { runPythonAgent } = require('../utils/agentBridge');
const NotificationService = require('../services/notificationService');

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
      
      // 🚀 FIX: Check if already submitted - prevent resubmission
      const existingSubmission = await Submission.findOne({ assignment: id, student: req.user._id });
      if (existingSubmission && (existingSubmission.status === 'submitted' || existingSubmission.status === 'graded')) {
        return res.status(403).json({ ok: false, error: 'Assignment already submitted. Resubmission is not allowed.' });
      }
      
      const doc = await Submission.findOneAndUpdate(
        { assignment: id, student: req.user._id },
        { answers, status: 'submitted', submittedAt: now },
        { upsert: true, new: true }
      );
      
      // 🚀 NEW: Notify scholar that student has submitted
      try {
        await NotificationService.notifyScholarSubmissionReceived(assignment, doc, req.user);
      } catch (notifErr) {
        console.error('[submitAnswers] Scholar notification failed:', notifErr.message);
        // Don't fail submission if notification fails
      }
      
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
        // 🚀 FIX: Check if already submitted - prevent resubmission
        const existingQuiz = await Submission.findOne({ assignment: id, student: req.user._id });
        if (existingQuiz && (existingQuiz.status === 'submitted' || existingQuiz.status === 'graded')) {
          return res.status(403).json({ ok: false, error: 'Quiz already submitted. Resubmission is not allowed.' });
        }
        const doc = await Submission.findOneAndUpdate(
          { assignment: id, student: req.user._id },
          { answers, status: 'submitted', submittedAt: now, autoSubmitted: true },
          { upsert: true, new: true }
        );
        return res.json({ ok: true, submission: doc });
      }

      let submission = await Submission.findOne({ assignment: id, student: req.user._id });
      
      // 🚀 FIX: Check if already submitted - prevent resubmission
      if (submission && (submission.status === 'submitted' || submission.status === 'graded')) {
        return res.status(403).json({ ok: false, error: 'Quiz already submitted. Resubmission is not allowed.' });
      }
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
      
      // 🚀 NEW: Notify scholar that student has submitted (for quiz)
      try {
        await NotificationService.notifyScholarSubmissionReceived(assignment, submission, req.user);
      } catch (notifErr) {
        console.error('[submitAnswers] Scholar notification failed:', notifErr.message);
        // Don't fail submission if notification fails
      }
      
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

    if (!result.ok) {
      console.error('[gradeSubmissionAI] AI grading failed:', result.error);
      return res.status(502).json({ ok: false, error: 'AI grading failed', detail: result.error });
    }

    const { totalScore, perQuestion = [], feedback, model, version, hasEssays } = result.data || {};
    
    // 🚀 FIX: Handle essay questions - add them to perQuestion with null scores for manual grading
    const essayQuestions = assignment.questions.filter(q => q.type === 'essay');
    const essayQuestionIds = essayQuestions.map(q => String(q._id));
    
    // Add essay questions with null scores to perQuestion array if not already present
    const existingQuestionIds = perQuestion.map(pq => String(pq.questionId));
    essayQuestions.forEach(essayQ => {
      const essayQId = String(essayQ._id);
      if (!existingQuestionIds.includes(essayQId)) {
        // 🚀 FIX: Don't include score field at all for essays (omitted = undefined) to avoid Mongoose validation
        perQuestion.push({
          questionId: essayQId,
          feedback: 'Essay question - requires manual grading'
          // score field is intentionally omitted for essay questions
        });
      }
    });
    
    // 🚀 FIX: Calculate totalScore only from gradable (non-essay) questions
    const gradablePerQuestion = perQuestion.filter(pq => pq.score !== null && pq.score !== undefined);
    let finalTotalScore = totalScore;
    
    // If gradable per-question scores exist, calculate totalScore from them
    if (gradablePerQuestion && gradablePerQuestion.length > 0) {
      const sumScores = gradablePerQuestion.reduce((sum, pq) => {
        const score = typeof pq.score === 'number' ? pq.score : 0;
        return sum + Math.max(0, Math.min(10, score)); // Ensure score is 0-10
      }, 0);
      const maxPossible = gradablePerQuestion.length * 10;
      if (maxPossible > 0) {
        finalTotalScore = Math.round((sumScores / maxPossible) * 100);
      } else {
        finalTotalScore = 0;
      }
    } else if (typeof totalScore !== 'number' || isNaN(totalScore) || totalScore < 0 || totalScore > 100) {
      // If totalScore is invalid and no gradable per-question scores, check if there are essays
      if (essayQuestions.length > 0 && gradablePerQuestion.length === 0) {
        // Only essays - don't set a grade yet, wait for manual grading
        finalTotalScore = null;
      } else {
        finalTotalScore = 0;
      }
    }
    
    // Ensure finalTotalScore is between 0-100 if it's a number
    if (finalTotalScore !== null && typeof finalTotalScore === 'number') {
      finalTotalScore = Math.max(0, Math.min(100, Math.round(finalTotalScore)));
    }
    
    // If there are essays that need manual grading, don't mark as fully graded yet
    const hasUngradedEssays = perQuestion.some(pq => pq.score === null || pq.score === undefined);
    
    submission.status = hasUngradedEssays ? 'submitted' : 'graded'; // Keep as submitted if essays need grading
    submission.grade = finalTotalScore; // Can be null if only essays
    submission.feedback = feedback || '';
    submission.aiGrading = { 
      totalScore: finalTotalScore, // Can be null
      perQuestion, // Includes essays with null scores
      reasoning: feedback, 
      model, 
      version,
      hasEssays: hasEssays || essayQuestions.length > 0
    };
    submission.gradedBy = req.user._id;
    
    try {
      await submission.save();
      console.log(`[gradeSubmissionAI] Successfully graded submission ${submission._id}`);
    } catch (saveError) {
      console.error('[gradeSubmissionAI] Failed to save submission:', saveError.message);
      console.error('[gradeSubmissionAI] Save error details:', saveError);
      return res.status(500).json({ ok: false, error: 'Failed to save grading results', detail: saveError.message });
    }

    // 🚀 FIX: Populate submission before returning to ensure student info is included
    const populatedSubmission = await Submission.findById(submission._id)
      .populate('student', 'name email _id')
      .populate('gradedBy', 'name')
      .lean();

    res.json({ ok: true, submission: populatedSubmission || submission, activityId: activity._id });
  } catch (e) {
    console.error('[gradeSubmissionAI] Unexpected error:', e);
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
    // 🚀 FIX: Populate student information to show name instead of ObjectId
    const list = await Submission.find({ assignment: id })
      .populate('student', 'name email _id')
      .populate('gradedBy', 'name')
      .sort({ createdAt: -1 })
      .lean();
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
    // 🚀 FIX: Populate student information to show name instead of ObjectId
    const list = await Submission.find(q)
      .populate('student', 'name email _id')
      .populate('gradedBy', 'name')
      .populate('assignment', 'title kind')
      .sort({ createdAt: -1 })
      .lean();
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
