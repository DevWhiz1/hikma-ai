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
  
  // Enhanced fields
  teachingPhilosophy: { type: String },
  availability: { type: String },
  hourlyRate: { type: Number, default: 0 },
  monthlyRate: { type: Number, default: 0 },
  certifications: { type: String },
  achievements: { type: String },
  socialMedia: { type: String },
  website: { type: String },
  country: { type: String },
  timezone: { type: String },
  
  // Rating and reviews
  averageRating: { type: Number, default: 0 },
  totalReviews: { type: Number, default: 0 },
  totalStudents: { type: Number, default: 0 },
  totalSessions: { type: Number, default: 0 },
  
  // Status and verification
  isActive: { type: Boolean, default: true },
  isVerified: { type: Boolean, default: false },
  verificationDocuments: [{ type: String }],
  
  // Subscription plans
  subscriptionPlans: [{
    name: { type: String, required: true },
    price: { type: Number, required: true },
    duration: { type: String, enum: ['monthly', 'quarterly', 'yearly'], required: true },
    features: [{ type: String }],
    isActive: { type: Boolean, default: true }
  }],
  
  createdAt: { type: Date, default: Date.now },
  updatedAt: { type: Date, default: Date.now }
});

module.exports = mongoose.model('Scholar', scholarSchema);


