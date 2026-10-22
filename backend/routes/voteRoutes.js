const express = require('express');
const router = express.Router();
const voteController = require('../controllers/voteController');
const authMiddleware = require('../middleware/authMiddleware');
const validateMiddleware = require('../middleware/validateMiddleware');

// Cast Vote (requires authentication)
router.post('/cast', authMiddleware, validateMiddleware.validateCastVote, voteController.castVote);

// Verify Digital Receipt by Transaction Hash
router.get('/verify/:txHash', voteController.verifyReceipt);

// View Election Results / Tallies
router.get('/results', voteController.getResults);

module.exports = router;

