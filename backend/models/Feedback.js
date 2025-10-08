const mongoose = require('mongoose');

const feedbackSchema = new mongoose.Schema({
  user: { 
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
    enum: ['bug', 'feature', 'ui', 'performance', 'security', 'general'],
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
  adminNotes: { 
    type: String,
    maxlength: 1000 
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
feedbackSchema.pre('save', function(next) {
  this.updatedAt = new Date();
  next();
});

module.exports = mongoose.model('Feedback', feedbackSchema);
