require('dotenv').config();
const mongoose = require('mongoose');
const connectDB = require('../config/db');
const User = require('../models/User');

(async () => {
  try {
    await connectDB();
    const email = process.argv[2];
    const role = process.argv[3] || 'scholar';
    if (!email) {
      console.error('Usage: npm run set-role -- <email> [role]');
      process.exit(1);
    }
    if (!['user','scholar','admin'].includes(role)) {
      console.error('Invalid role. Use user|scholar|admin');
      process.exit(1);
    }
    const u = await User.findOneAndUpdate({ email: String(email).toLowerCase() }, { role }, { new: true });
    if (!u) {
      console.error('User not found');
      process.exit(1);
    }
    console.log(`Updated ${u.email} to role=${u.role}`);
  } catch (e) {
    console.error('Failed:', e.message);
    process.exitCode = 1;
  } finally {
    await mongoose.connection.close();
  }
})();


