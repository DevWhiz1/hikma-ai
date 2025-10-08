const User = require('../models/User');
const Scholar = require('../models/Scholar');
const { signToken } = require('../utils/jwt');

async function signup(req, res) {
  try {
    const { name, email, password, role, scholarProfile } = req.body;

    if (!name || !email || !password) {
      return res.status(400).json({ error: 'Name, email and password are required' });
    }
    if (password.length < 6) {
      return res.status(400).json({ error: 'Password must be at least 6 characters' });
    }
    if (role && !['user', 'scholar', 'admin'].includes(role)) {
      return res.status(400).json({ error: 'Invalid role' });
    }

    const exists = await User.findOne({ email });
    if (exists) return res.status(400).json({ error: 'Email already used' });

    const requestedScholar = role === 'scholar';
    const user = await User.create({
      name: name.trim(),
      email: email.toLowerCase(),
      password,
      // Always enroll as regular user; scholar goes to review flow
      role: 'user',
      scholarProfile: requestedScholar ? scholarProfile : undefined
    });

    // If user requested scholar at signup, create a pending Scholar application
    if (requestedScholar) {
      try {
        const Scholar = require('../models/Scholar');
        await Scholar.create({
          user: user._id,
          bio: scholarProfile?.bio,
          specializations: scholarProfile?.expertise || [],
          languages: scholarProfile?.languages || [],
          experienceYears: undefined,
          qualifications: scholarProfile?.credentials,
          approved: false
        });
      } catch (e) {
        console.warn('SCHOLAR_CREATE_AT_SIGNUP_FAILED', e?.message);
      }
    }

    const token = signToken(user);
    res.status(201).json({
      token,
      user: { id: user._id, name: user.name, email: user.email, role: user.role },
      scholar_application: requestedScholar ? 'pending' : undefined
    });
  } catch (e) {
    // Detailed logging (will show in Vercel function logs)
    console.error('SIGNUP_ERROR', {
      message: e.message,
      name: e.name,
      code: e.code,
      stack: e.stack,
      errors: e.errors && Object.keys(e.errors)
    });

    if (e.code === 11000) {
      return res.status(400).json({ error: 'Email already used' });
    }
    if (e.name === 'ValidationError') {
      return res.status(400).json({ error: 'Validation failed', details: Object.keys(e.errors) });
    }
    res.status(500).json({ error: 'Signup failed' });
  }
}

async function login(req, res) {
  try {
    const { email, password } = req.body;
    if (!email || !password) return res.status(400).json({ error: 'Email and password required' });
    const user = await User.findOne({ email: email.toLowerCase() });
    if (!user || !(await user.comparePassword(password))) {
      return res.status(400).json({ error: 'Invalid credentials' });
    }
    const token = signToken(user);
    res.json({
      token,
      user: { id: user._id, name: user.name, email: user.email, role: user.role }
    });
  } catch (e) {
    console.error('LOGIN_ERROR', e);
    res.status(500).json({ error: 'Login failed' });
  }
}

module.exports = { signup, login };

// Secure seed endpoint: requires SEED_SECRET match
async function seedScholar(req, res) {
  try {
    const secret = req.query.secret || req.body?.secret;
    if (!secret || secret !== process.env.SEED_SECRET) {
      return res.status(403).json({ error: 'Forbidden' });
    }
    const email = 'scholar@hikmah.local';
    let user = await User.findOne({ email });
    if (!user) {
      user = await User.create({
        name: 'Default Scholar',
        email,
        password: 'ChangeMe123!',
        role: 'scholar',
        scholarProfile: {
          bio: 'Experienced Islamic scholar providing guidance in Fiqh and Hadith.',
          expertise: ['Fiqh', 'Hadith'],
          credentials: 'Ijazah in Hadith, Alim course',
          availability: 'Weekdays 5-8 PM',
          languages: ['English', 'Arabic'],
          verified: true
        }
      });
    }
    let s = await Scholar.findOne({ user: user._id });
    if (!s) {
      s = await Scholar.create({
        user: user._id,
        bio: user.scholarProfile?.bio || 'Scholar bio',
        specializations: user.scholarProfile?.expertise || ['Fiqh'],
        languages: user.scholarProfile?.languages || ['English'],
        experienceYears: 10,
        qualifications: user.scholarProfile?.credentials || 'Certified Scholar',
        approved: true
      });
    }
    return res.json({ success: true, userId: user._id, scholarId: s._id, email, password: 'ChangeMe123!' });
  } catch (e) {
    console.error('SEED_SCHOLAR_ERROR', e);
    return res.status(500).json({ error: 'Failed to seed scholar' });
  }
}

module.exports.seedScholar = seedScholar;