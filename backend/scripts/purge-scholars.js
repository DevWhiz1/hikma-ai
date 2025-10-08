require('dotenv').config();
const mongoose = require('mongoose');
const connectDB = require('../config/db');
const Scholar = require('../models/Scholar');
const User = require('../models/User');

(async () => {
  try {
    await connectDB();
    const scholars = await Scholar.find().select('user');
    const userIds = scholars.map(s => s.user).filter(Boolean);
    const removed = await Scholar.deleteMany({});
    if (userIds.length) {
      await User.updateMany({ _id: { $in: userIds }, role: { $ne: 'admin' } }, { $set: { role: 'user' } });
    }
    console.log(`Purged scholars: ${removed.deletedCount}`);
  } catch (e) {
    console.error('Purge failed:', e.message);
    process.exitCode = 1;
  } finally {
    await mongoose.connection.close();
  }
})();


