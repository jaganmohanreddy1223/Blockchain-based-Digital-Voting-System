const express = require('express');
const cors = require('cors');
const path = require('path');
require('dotenv').config();

const { connectDB, getIsConnected } = require('./config/db');
const { initBlockchain, getIsLiveBlockchain } = require('./config/blockchain');
const errorHandler = require('./middleware/errorHandler');

// Route Imports
const authRoutes = require('./routes/authRoutes');
const candidateRoutes = require('./routes/candidateRoutes');
const electionRoutes = require('./routes/electionRoutes');
const voteRoutes = require('./routes/voteRoutes');

const app = express();
const PORT = process.env.PORT || 5000;

// Middleware
app.use(cors());
app.use(express.json());

// Request logger for auditability
app.use((req, res, next) => {
  console.log(`[${new Date().toISOString()}] ${req.method} ${req.originalUrl}`);
  next();
});

// Serve frontend static files if accessed directly from the backend server
app.use(express.static(path.join(__dirname, '../frontend')));

// Health Check Endpoint
app.get('/api/v1/health', (req, res) => {
  res.status(200).json({
    status: 'online',
    timestamp: new Date(),
    service: 'Blockchain-Based Digital Voting System Backend API',
    version: '1.0.0',
    database: getIsConnected() ? 'MongoDB (Connected)' : 'In-Memory Resilient Store (Demo)',
    blockchain: getIsLiveBlockchain() ? 'Live EVM Contract' : 'Local Ethers.js Cryptographic Engine',
  });
});

// API Routes
app.use('/api/v1/auth', authRoutes);
app.use('/api/v1/candidates', candidateRoutes);
app.use('/api/v1/elections', electionRoutes);
app.use('/api/v1/vote', voteRoutes);

// Fallback route for SPA
app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, '../frontend/index.html'));
});

// Central Error Handler
app.use(errorHandler);

// Bootstrap Server
const startServer = async () => {
  await connectDB();
  initBlockchain();

  app.listen(PORT, () => {
    console.log(`\n======================================================`);
    console.log(`🚀 Voting System Backend Running on: http://localhost:${PORT}`);
    console.log(`📡 Health Check: http://localhost:${PORT}/api/v1/health`);
    console.log(`======================================================\n`);
  });
};

startServer();

module.exports = app;

