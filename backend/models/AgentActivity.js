const mongoose = require('mongoose');

const AgentActivitySchema = new mongoose.Schema({
  kind: { type: String, enum: ['generation', 'grading', 'feedback'], required: true },
  assignment: { type: mongoose.Schema.Types.ObjectId, ref: 'Assignment' },
  submission: { type: mongoose.Schema.Types.ObjectId, ref: 'Submission' },
  agent: { type: String, default: 'gemini-agent' },
  inputSummary: { type: String },
  outputSummary: { type: String },
  status: { type: String, enum: ['success', 'error'], required: true },
  error: { type: String },
  latencyMs: { type: Number },
  model: { type: String },
  tokensIn: { type: Number },
  tokensOut: { type: Number }
}, { timestamps: true });

AgentActivitySchema.index({ createdAt: -1 });

module.exports = mongoose.model('AgentActivity', AgentActivitySchema);
