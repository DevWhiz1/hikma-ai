const mongoose = require('mongoose');

const scholarFeedbackSchema = new mongoose.Schema({
  user: { 
    type: mongoose.Schema.Types.ObjectId, 
    ref: 'User', 
    required: true,
    index: true 
  },
  scholar: { 
    type: mongoose.Schema.Types.ObjectId, 
    ref: 'User', 
    required: true,
    index: true 
  },
  rating: { 
    type: Number, 
    min: 1, 
    max: 5, 
    required: true 
  },
  category: { 
    type: String, 
    enum: ['teaching_quality', 'communication', 'knowledge', 'availability', 'patience', 'general'],
    required: true 
  },
  subject: { 
    type: String, 
    required: true,
    maxlength: 200 
  },
  message: { 
    type: String, 
    required: true,
    maxlength: 2000 
  },
  contactEmail: { 
    type: String,
    maxlength: 255 
  },
  priority: { 
    type: String, 
    enum: ['low', 'medium', 'high', 'critical'],
    default: 'medium' 
  },
  status: { 
    type: String, 
    enum: ['pending', 'in_progress', 'resolved', 'closed'],
    default: 'pending' 
  },
  scholarNotes: { 
    type: String,
    maxlength: 1000 
  },
  createdAt: { 
    type: Date, 
    default: Date.now, 
    index: true 
  },
  updatedAt: { 
    type: Date, 
    default: Date.now 
  }
});

// Update the updatedAt field before saving
scholarFeedbackSchema.pre('save', function(next) {
  this.updatedAt = new Date();
  next();
});

module.exports = mongoose.model('ScholarFeedback', scholarFeedbackSchema);
