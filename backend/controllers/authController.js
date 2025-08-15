const User = require('../models/User');
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

    const user = await User.create({
      name: name.trim(),
      email: email.toLowerCase(),
      password,
      role: role || 'user',
      scholarProfile: role === 'scholar' ? scholarProfile : undefined
    });

    const token = signToken(user);
    res.status(201).json({
      token,
      user: { id: user._id, name: user.name, email: user.email, role: user.role }
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