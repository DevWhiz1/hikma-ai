const mongoose = require('mongoose');

const scholarSchema = new mongoose.Schema({
  user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true, index: true },
  bio: { type: String },
  specializations: [{ type: String }],
  languages: [{ type: String }],
  experienceYears: { type: Number },
  qualifications: { type: String },
  demoVideoUrl: { type: String },
  photoUrl: { type: String },
  approved: { type: Boolean, default: false },
  createdAt: { type: Date, default: Date.now }
});

module.exports = mongoose.model('Scholar', scholarSchema);


