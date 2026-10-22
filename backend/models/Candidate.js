const mongoose = require('mongoose');
const { getIsConnected } = require('../config/db');

const candidateSchema = new mongoose.Schema({
  id: { type: Number, required: true, unique: true },
  name: { type: String, required: true },
  party: { type: String, required: true },
  symbol: { type: String, required: true },
  city: { type: String, required: true },
  education: { type: String, default: 'Graduate' },
  affidavit: { type: String, default: 'Clean Record' },
  votes: { type: Number, default: 0 },
});

let MongooseCandidate = null;
try {
  MongooseCandidate = mongoose.model('Candidate', candidateSchema);
} catch (e) {
  MongooseCandidate = mongoose.models.Candidate;
}

// Initial candidate seed data (matches frontend candidate directory and EVM terminal)
const initialCandidates = [
  // EVM Terminal Ballot Candidates (New Delhi constituency)
  { id: 1, name: 'ARUN SHARMA', party: 'National Progressive Alliance', symbol: '🐘', city: 'New Delhi', education: 'M.A. Economics', affidavit: 'Clean Record', votes: 0 },
  { id: 2, name: 'PRIYA NAIR', party: 'United Democratic Coalition', symbol: '🌾', city: 'New Delhi', education: 'LL.B. Law', affidavit: 'Clean Record', votes: 0 },
  { id: 3, name: 'RAJESH VERMA', party: "Democratic People's Front", symbol: '☀️', city: 'New Delhi', education: 'M.Sc Physics', affidavit: 'Clean Record', votes: 0 },
  { id: 4, name: 'NONE OF THE ABOVE (NOTA)', party: 'Rule 49-O Option', symbol: '❌', city: 'New Delhi', education: 'N/A', affidavit: 'N/A', votes: 0 },

  // Hyderabad
  { id: 5, name: 'KAVITA REDDY', party: "People's Voice Party", symbol: '🪷', city: 'Hyderabad', education: 'B.Tech Computer Science', affidavit: 'Clean Record', votes: 0 },
  { id: 6, name: 'MOHAMMED RAFIQ', party: 'National Secular Congress', symbol: '🚲', city: 'Hyderabad', education: 'M.Com', affidavit: 'Clean Record', votes: 0 },

  // Mumbai South
  { id: 7, name: 'DEVENDRA JOSHI', party: 'Western Forward Bloc', symbol: '🦁', city: 'Mumbai South', education: 'Chartered Accountant', affidavit: 'Clean Record', votes: 0 },
  { id: 8, name: 'SNEHA DESHMUKH', party: 'Labour & Farmers Union', symbol: '🚜', city: 'Mumbai South', education: 'B.Sc Agriculture', affidavit: 'Clean Record', votes: 0 },

  // Bengaluru Central
  { id: 9, name: 'RAMESH KUMAR', party: 'Tech City Alliance', symbol: '⚡', city: 'Bengaluru Central', education: 'M.S. Software Systems', affidavit: 'Clean Record', votes: 0 },
  { id: 10, name: 'ANANYA HEGDE', party: 'Citizens Welfare Party', symbol: '🌴', city: 'Bengaluru Central', education: 'Ph.D. Sociology', affidavit: 'Clean Record', votes: 0 },
];

const inMemoryCandidates = new Map(initialCandidates.map(c => [c.id, { ...c }]));

const CandidateRepository = {
  getAll: async (filter = {}) => {
    if (getIsConnected() && MongooseCandidate) {
      return await MongooseCandidate.find(filter).sort({ id: 1 });
    }
    let list = Array.from(inMemoryCandidates.values());
    if (filter.city && filter.city !== 'all') {
      list = list.filter(c => c.city.toLowerCase() === filter.city.toLowerCase());
    }
    return list;
  },

  getById: async (id) => {
    const numId = Number(id);
    if (getIsConnected() && MongooseCandidate) {
      return await MongooseCandidate.findOne({ id: numId });
    }
    return inMemoryCandidates.get(numId) || null;
  },

  incrementVote: async (id) => {
    const numId = Number(id);
    if (getIsConnected() && MongooseCandidate) {
      return await MongooseCandidate.findOneAndUpdate(
        { id: numId },
        { $inc: { votes: 1 } },
        { new: true }
      );
    }
    const c = inMemoryCandidates.get(numId);
    if (c) {
      c.votes += 1;
      inMemoryCandidates.set(numId, c);
    }
    return c;
  },
};

module.exports = { MongooseCandidate, CandidateRepository, initialCandidates };

