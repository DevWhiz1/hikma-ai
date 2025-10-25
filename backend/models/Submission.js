const mongoose = require('mongoose');

const AnswerSchema = new mongoose.Schema({
  questionId: { type: mongoose.Schema.Types.ObjectId, required: true },
  answerText: { type: String },
  selectedOption: { type: mongoose.Schema.Types.Mixed }, // index or value
  attachments: [{ url: String, name: String }]
}, { _id: false });

const ScoreSchema = new mongoose.Schema({
  questionId: { type: mongoose.Schema.Types.ObjectId, required: true },
  score: { type: Number, required: true },
  feedback: { type: String },
}, { _id: false });

const SubmissionSchema = new mongoose.Schema({
  assignment: { type: mongoose.Schema.Types.ObjectId, ref: 'Assignment', required: true },
  student: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  answers: [AnswerSchema],
  status: { type: String, enum: ['in_progress', 'submitted', 'graded', 'resubmission-requested'], default: 'submitted' },
  startedAt: { type: Date },
  endAt: { type: Date },
  submittedAt: { type: Date },
  autoSubmitted: { type: Boolean, default: false },
  grade: { type: Number, min: 0, max: 100 },
  feedback: { type: String },
  gradedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  aiGrading: {
    model: String,
    version: String,
    totalScore: Number,
    perQuestion: [ScoreSchema],
    reasoning: String
  },
  manualGrading: {
    totalScore: Number,
    perQuestion: [ScoreSchema],
    feedback: String,
    by: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
    at: Date
  },
  override: {
    overridden: { type: Boolean, default: false },
    by: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
    reason: String,
    at: Date
  }
}, { timestamps: true });

SubmissionSchema.index({ assignment: 1, student: 1 }, { unique: true });
SubmissionSchema.index({ createdAt: -1 });

module.exports = mongoose.model('Submission', SubmissionSchema);
