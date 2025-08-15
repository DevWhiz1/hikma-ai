const mongoose = require('mongoose');

async function connectDB(uri) {
  if (!uri) throw new Error('MONGO_URI missing');
  const masked = (() => {
    try {
      const u = new URL(uri.replace('mongodb+srv', 'http')); // dummy protocol for URL parser
      if (u.username) u.username = '***';
      if (u.password) u.password = '***';
      return uri.startsWith('mongodb') ? uri.replace(/(\/\/)([^:@]+):[^@]+@/, '$1***:***@') : u.toString();
    } catch {
      return '***';
    }
  })();
  console.log('[DB] Attempting MongoDB connect to', masked);
  mongoose.set('strictQuery', true);

  mongoose.connection.on('connected', () => console.log('[DB] Mongoose connected'));
  mongoose.connection.on('error', (err) => console.error('[DB] Mongoose connection error:', err.message));
  mongoose.connection.on('disconnected', () => console.warn('[DB] Mongoose disconnected'));
  mongoose.connection.on('reconnected', () => console.log('[DB] Mongoose reconnected'));

  const start = Date.now();
  try {
    await mongoose.connect(uri, {
      serverSelectionTimeoutMS: 20000,
    });
    console.log('[DB] MongoDB connected in', Date.now() - start, 'ms');
  } catch (err) {
    console.error('[DB] Initial MongoDB connection failed:', err.message);
    throw err;
  }
}

module.exports = { connectDB };