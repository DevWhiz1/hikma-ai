const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

const userSchema = new mongoose.Schema(
  {
    name: { type: String, required: true, trim: true },
    email: { type: String, required: true, unique: true, lowercase: true, index: true },
    password: { type: String, required: true, minlength: 6 },
    role: { type: String, enum: ['user', 'scholar', 'admin'], default: 'user', index: true },
    warningCount: { type: Number, default: 0 },
    lockUntil: { type: Date },

    // Scholar-specific fields
    scholarProfile: {
      bio: { type: String },
      expertise: [{ type: String }], // e.g. Fiqh, Hadith
      credentials: { type: String },
      availability: { type: String },
      languages: [{ type: String }],
      verified: { type: Boolean, default: false }
    },
    // Denormalized list of scholars this user is enrolled with (for fast sidebar rendering)
    enrolledScholars: [
      {
        scholar: { type: mongoose.Schema.Types.ObjectId, ref: 'Scholar' },
        name: { type: String }
      }
    ]
  },
  { timestamps: true }
);

userSchema.pre('save', async function (next) {
  if (!this.isModified('password')) return next();
  const salt = await bcrypt.genSalt(10);
  this.password = await bcrypt.hash(this.password, salt);
  next();
});

userSchema.methods.comparePassword = function (plain) {
  return bcrypt.compare(plain, this.password);
};

module.exports = mongoose.model('User', userSchema);