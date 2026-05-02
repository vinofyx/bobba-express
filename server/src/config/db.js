const mongoose = require('mongoose');

// Cache the connection across serverless function invocations
let cached = global._mongooseConnection;
if (!cached) {
  cached = global._mongooseConnection = { conn: null, promise: null };
}

const connectDB = async () => {
  // Already connected — reuse
  if (cached.conn) return cached.conn;

  // Connection in progress — wait for it
  if (!cached.promise) {
    const uri = process.env.MONGODB_URI;
    if (!uri) {
      console.error('[DB] MONGODB_URI is not set. Check your environment variables.');
      throw new Error('MONGODB_URI environment variable is required.');
    }

    cached.promise = mongoose
      .connect(uri, {
        bufferCommands: false,
      })
      .then((conn) => {
        console.log(`[DB] MongoDB connected: ${conn.connection.host}`);
        return conn;
      })
      .catch((err) => {
        cached.promise = null; // allow retry on next request
        console.error('[DB] Connection error:', err.message);
        throw err;
      });
  }

  cached.conn = await cached.promise;
  return cached.conn;
};

module.exports = connectDB;
