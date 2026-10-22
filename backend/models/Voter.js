const mongoose = require('mongoose');
const { getIsConnected } = require('../config/db');

// Mongoose Schema
const voterSchema = new mongoose.Schema({
  epic: {
    type: String,
    required: true,
    unique: true,
    uppercase: true,
    trim: true,
  },
  mobileHash: {
    type: String,
    required: true,
  },
  voterAddress: {
    type: String,
    required: true,
  },
  isWhitelisted: {
    type: Boolean,
    default: false,
  },
  hasVoted: {
    type: Boolean,
    default: false,
  },
  constituency: {
    type: String,
    default: 'New Delhi',
  },
  createdAt: {
    type: Date,
    default: Date.now,
  },
});

let MongooseVoter = null;
try {
  MongooseVoter = mongoose.model('Voter', voterSchema);
} catch (e) {
  MongooseVoter = mongoose.models.Voter;
}

// In-Memory Repository for offline/fallback mode
const inMemoryVoters = new Map([
  [
    'IND-89230491',
    {
      epic: 'IND-89230491',
      mobileHash: '1234',
      voterAddress: '0x71C83D471e89F2A6E94f1c9c4883A92e105e4c02',
      isWhitelisted: true,
      hasVoted: false,
      constituency: 'New Delhi',
      createdAt: new Date(),
    },
  ],
  [
    'IND-10000001',
    {
      epic: 'IND-10000001',
      mobileHash: '5678',
      voterAddress: '0x17F6AD8Ef3297579737E7b730884B42475d40B30',
      isWhitelisted: true,
      hasVoted: false,
      constituency: 'Hyderabad',
      createdAt: new Date(),
    },
  ],
]);

const VoterRepository = {
  findByEpic: async (epic) => {
    const cleanEpic = epic.toUpperCase().trim();
    if (getIsConnected() && MongooseVoter) {
      return await MongooseVoter.findOne({ epic: cleanEpic });
    }
    return inMemoryVoters.get(cleanEpic) || null;
  },

  createOrUpdate: async (voterData) => {
    const cleanEpic = voterData.epic.toUpperCase().trim();
    if (getIsConnected() && MongooseVoter) {
      return await MongooseVoter.findOneAndUpdate(
        { epic: cleanEpic },
        voterData,
        { upsert: true, new: true }
      );
    }
    const existing = inMemoryVoters.get(cleanEpic) || {};
    const updated = { ...existing, ...voterData, epic: cleanEpic };
    inMemoryVoters.set(cleanEpic, updated);
    return updated;
  },

  markAsVoted: async (epic) => {
    const cleanEpic = epic.toUpperCase().trim();
    if (getIsConnected() && MongooseVoter) {
      return await MongooseVoter.findOneAndUpdate(
        { epic: cleanEpic },
        { hasVoted: true },
        { new: true }
      );
    }
    const v = inMemoryVoters.get(cleanEpic);
    if (v) {
      v.hasVoted = true;
      inMemoryVoters.set(cleanEpic, v);
    }
    return v;
  },
};

module.exports = { MongooseVoter, VoterRepository };

