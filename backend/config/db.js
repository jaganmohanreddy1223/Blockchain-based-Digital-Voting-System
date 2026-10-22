const mongoose = require('mongoose');

let isConnectedToMongo = false;

const connectDB = async () => {
  const uri = process.env.MONGODB_URI || 'mongodb://127.0.0.1:27017/voting_system';
  try {
    const conn = await mongoose.connect(uri, {
      serverSelectionTimeoutMS: 2500, // Quick timeout if MongoDB is not running
    });
    isConnectedToMongo = true;
    console.log(`[DB] MongoDB Connected: ${conn.connection.host}`);
  } catch (error) {
    isConnectedToMongo = false;
    console.warn(`[DB] MongoDB connection unavailable (${error.message}).`);
    console.warn(`[DB] Initializing resilient in-memory repository for offline / demo mode.`);
  }
};

const getIsConnected = () => isConnectedToMongo;

module.exports = { connectDB, getIsConnected };

