const mongoose = require('mongoose');

const QuestionSchema = new mongoose.Schema({
  type: { type: String, enum: ['mcq', 'short-answer', 'true-false', 'essay'], required: true },
  prompt: { type: String, required: true },
  options: [{ type: String }], // for mcq
  answer: { type: mongoose.Schema.Types.Mixed }, // mcq: index or value; short: text; essay: rubric id
  rubric: {
    criteria: [{ name: String, maxPoints: Number, description: String }],
    totalPoints: Number
  },
}, { _id: true });

const AssignmentSchema = new mongoose.Schema({
  title: { type: String, required: true },
  description: { type: String }, // markdown supported
  // format/type of questions (kept for backwards compatibility)
  type: { type: String, enum: ['quiz', 'essay', 'short-answer', 'multi-part'], default: 'quiz' },
  // kind distinguishes assignment (deadline) vs quiz (timed attempt)
  kind: { type: String, enum: ['assignment', 'quiz'], default: 'assignment', index: true },
  scholar: { type: mongoose.Schema.Types.ObjectId, ref: 'Scholar' },
  createdBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  // Enrollment-based access control: only students in this enrollment can see/submit
  enrollmentId: { type: mongoose.Schema.Types.ObjectId, ref: 'Enrollment', required: true, index: true },
  // Assignment deadline
  dueDate: { type: Date },
  // Quiz timing
  quizWindowStart: { type: Date },
  quizWindowEnd: { type: Date },
  durationMinutes: { type: Number },
  status: { type: String, enum: ['draft', 'published', 'closed'], default: 'draft' },
  aiSpec: {
    topic: String,
    gradeLevel: String,
    difficulty: { type: String, enum: ['easy', 'medium', 'hard'] },
    numQuestions: { type: Number, default: 5 },
    mcqCount: { type: Number },
    shortAnswerCount: { type: Number },
    trueFalseCount: { type: Number },
    essayCount: { type: Number },
    language: { type: String, default: 'en' }
  },
  questions: [QuestionSchema],
  sources: [{ type: String }],
  metadata: { type: Map, of: String },
}, { timestamps: true });

AssignmentSchema.index({ createdBy: 1, status: 1, dueDate: -1 });
AssignmentSchema.index({ enrollmentId: 1, status: 1, kind: 1 });

module.exports = mongoose.model('Assignment', AssignmentSchema);
