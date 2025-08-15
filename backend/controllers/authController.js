const User = require('../models/User');
const { signToken } = require('../utils/jwt');

async function signup(req, res) {
  try {
    const { name, email, password, role, scholarProfile } = req.body;
    if (role && !['user', 'scholar', 'admin'].includes(role))
      return res.status(400).json({ error: 'Invalid role' });

    const exists = await User.findOne({ email });
    if (exists) return res.status(400).json({ error: 'Email already used' });

    const user = await User.create({
      name,
      email,
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
    res.status(500).json({ error: 'Signup failed' });
  }
}

async function login(req, res) {
  try {
    const { email, password } = req.body;
    const user = await User.findOne({ email });
    if (!user || !(await user.comparePassword(password)))
      return res.status(400).json({ error: 'Invalid credentials' });

    const token = signToken(user);
    res.json({
      token,
      user: { id: user._id, name: user.name, email: user.email, role: user.role }
    });
  } catch {
    res.status(500).json({ error: 'Login failed' });
  }
}

module.exports = { signup, login };