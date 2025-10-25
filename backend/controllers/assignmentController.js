const Assignment = require('../models/Assignment');
const AgentActivity = require('../models/AgentActivity');
const { runPythonAgent } = require('../utils/agentBridge');

// Create a draft assignment
async function createAssignment(req, res) {
  try {
    const body = req.body || {};
    const doc = await Assignment.create({
      title: body.title,
      description: body.description,
      type: body.type || 'quiz',
      kind: body.kind || 'assignment',
      createdBy: req.user._id,
      scholar: body.scholar || undefined,
      dueDate: body.dueDate || undefined,
      quizWindowStart: body.quizWindowStart || undefined,
      quizWindowEnd: body.quizWindowEnd || undefined,
      durationMinutes: body.durationMinutes || undefined,
      aiSpec: body.aiSpec || undefined,
      questions: body.questions || [],
      sources: body.sources || [],
    });
    res.json({ ok: true, assignment: doc });
  } catch (e) {
    res.status(400).json({ ok: false, error: e.message });
  }
}

// Update assignment (title, description, questions, type, dueDate, aiSpec)
async function updateAssignment(req, res) {
  const { id } = req.params;
  try {
    const assignment = await Assignment.findById(id);
    if (!assignment) return res.status(404).json({ ok: false, error: 'Assignment not found' });
    if (String(assignment.createdBy) !== String(req.user._id) && req.user.role !== 'admin') {
      return res.status(403).json({ ok: false, error: 'Forbidden' });
    }
    const body = req.body || {};
    ['title','description','type','kind','dueDate','quizWindowStart','quizWindowEnd','durationMinutes','questions','aiSpec','sources','status'].forEach(k => {
      if (typeof body[k] !== 'undefined') assignment[k] = body[k];
    });
    await assignment.save();
    res.json({ ok: true, assignment });
  } catch (e) {
    res.status(400).json({ ok: false, error: e.message });
  }
}

// Generate questions with AI (Gemini via Python agent)
async function generateAssignmentAI(req, res) {
  const { id } = req.params;
  try {
    const assignment = await Assignment.findById(id);
    if (!assignment) return res.status(404).json({ ok: false, error: 'Assignment not found' });
    if (String(assignment.createdBy) !== String(req.user._id) && req.user.role !== 'admin') {
      return res.status(403).json({ ok: false, error: 'Forbidden' });
    }

    const payload = {
      model: process.env.GEMINI_MODEL || 'gemini-2.5-flash',
      aiSpec: assignment.aiSpec || {},
      title: assignment.title,
      description: assignment.description,
      type: assignment.type,
    };

    const result = await runPythonAgent('assignment_creator.py', payload, { timeoutMs: 90000 });

    const activity = await AgentActivity.create({
      kind: 'generation',
      assignment: assignment._id,
      agent: 'gemini-assignment-creator',
      inputSummary: JSON.stringify(payload).slice(0, 500),
      outputSummary: result.ok ? JSON.stringify(result.data).slice(0, 500) : result.error?.slice(0, 500),
      status: result.ok ? 'success' : 'error',
      error: result.ok ? undefined : result.error,
      latencyMs: result.latencyMs,
      model: payload.model,
    });

    if (!result.ok) return res.status(502).json({ ok: false, error: 'AI generation failed', detail: result.error });

    // Expect agent to return { questions: [...], sources: [...] }
    const { questions = [], sources = [] } = result.data || {};
    assignment.questions = questions;
    assignment.sources = sources;
    await assignment.save();

    res.json({ ok: true, assignment, activityId: activity._id });
  } catch (e) {
    res.status(500).json({ ok: false, error: e.message });
  }
}

// Publish assignment
async function publishAssignment(req, res) {
  const { id } = req.params;
  try {
    const assignment = await Assignment.findById(id);
    if (!assignment) return res.status(404).json({ ok: false, error: 'Assignment not found' });
    if (String(assignment.createdBy) !== String(req.user._id) && req.user.role !== 'admin') {
      return res.status(403).json({ ok: false, error: 'Forbidden' });
    }
    assignment.status = 'published';
    await assignment.save();
    res.json({ ok: true, assignment });
  } catch (e) {
    res.status(400).json({ ok: false, error: e.message });
  }
}

// Close assignment
async function closeAssignment(req, res) {
  const { id } = req.params;
  try {
    const assignment = await Assignment.findById(id);
    if (!assignment) return res.status(404).json({ ok: false, error: 'Assignment not found' });
    if (String(assignment.createdBy) !== String(req.user._id) && req.user.role !== 'admin') {
      return res.status(403).json({ ok: false, error: 'Forbidden' });
    }
    assignment.status = 'closed';
    await assignment.save();
    res.json({ ok: true, assignment });
  } catch (e) {
    res.status(400).json({ ok: false, error: e.message });
  }
}

// List assignments (scholar sees theirs; student sees published)
async function listAssignments(req, res) {
  try {
    const role = req.user.role;
    let query = {};
    if (role === 'scholar' || role === 'admin') {
      query = { createdBy: req.user._id };
    } else {
      query = { status: 'published' };
    }
    const docs = await Assignment.find(query).sort({ createdAt: -1 }).lean();
    res.json({ ok: true, assignments: docs });
  } catch (e) {
    res.status(500).json({ ok: false, error: e.message });
  }
}

// Get assignment detail (students can view if published, owners always can)
async function getAssignment(req, res) {
  const { id } = req.params;
  try {
    const doc = await Assignment.findById(id).lean();
    if (!doc) return res.status(404).json({ ok: false, error: 'Not found' });
    const owner = String(doc.createdBy) === String(req.user._id);
    if (!owner && doc.status !== 'published' && req.user.role !== 'admin') {
      return res.status(403).json({ ok: false, error: 'Forbidden' });
    }
    res.json({ ok: true, assignment: doc });
  } catch (e) {
    res.status(500).json({ ok: false, error: e.message });
  }
}

module.exports = {
  createAssignment,
  generateAssignmentAI,
  publishAssignment,
  closeAssignment,
  listAssignments,
  getAssignment,
  updateAssignment,
  addQuestion,
  updateQuestion,
  deleteQuestion,
};

// Add a question manually
async function addQuestion(req, res) {
  const { id } = req.params; // assignment id
  try {
    const assignment = await Assignment.findById(id);
    if (!assignment) return res.status(404).json({ ok: false, error: 'Assignment not found' });
    if (String(assignment.createdBy) !== String(req.user._id) && req.user.role !== 'admin') {
      return res.status(403).json({ ok: false, error: 'Forbidden' });
    }
    const q = req.body || {};
    if (!q.type || !q.prompt) return res.status(400).json({ ok: false, error: 'Missing type or prompt' });
    assignment.questions.push({
      type: q.type,
      prompt: q.prompt,
      options: q.options || [],
      answer: typeof q.answer !== 'undefined' ? q.answer : undefined,
      rubric: q.rubric || undefined,
    });
    await assignment.save();
    res.json({ ok: true, assignment });
  } catch (e) {
    res.status(400).json({ ok: false, error: e.message });
  }
}

// Update a question
async function updateQuestion(req, res) {
  const { id, qid } = req.params;
  try {
    const assignment = await Assignment.findById(id);
    if (!assignment) return res.status(404).json({ ok: false, error: 'Assignment not found' });
    if (String(assignment.createdBy) !== String(req.user._id) && req.user.role !== 'admin') {
      return res.status(403).json({ ok: false, error: 'Forbidden' });
    }
    const idx = assignment.questions.findIndex(q => String(q._id) === String(qid));
    if (idx === -1) return res.status(404).json({ ok: false, error: 'Question not found' });
    const q = assignment.questions[idx];
    const body = req.body || {};
    ['type','prompt','options','answer','rubric'].forEach(k => { if (typeof body[k] !== 'undefined') q[k] = body[k]; });
    await assignment.save();
    res.json({ ok: true, assignment });
  } catch (e) {
    res.status(400).json({ ok: false, error: e.message });
  }
}

// Delete a question
async function deleteQuestion(req, res) {
  const { id, qid } = req.params;
  try {
    const assignment = await Assignment.findById(id);
    if (!assignment) return res.status(404).json({ ok: false, error: 'Assignment not found' });
    if (String(assignment.createdBy) !== String(req.user._id) && req.user.role !== 'admin') {
      return res.status(403).json({ ok: false, error: 'Forbidden' });
    }
    assignment.questions = assignment.questions.filter(q => String(q._id) !== String(qid));
    await assignment.save();
    res.json({ ok: true, assignment });
  } catch (e) {
    res.status(400).json({ ok: false, error: e.message });
  }
}
