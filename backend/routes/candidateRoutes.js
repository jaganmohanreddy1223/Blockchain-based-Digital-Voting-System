const express = require('express');
const router = express.Router();
const candidateController = require('../controllers/candidateController');

// Get all candidates (optional ?city=...)
router.get('/', candidateController.getCandidates);

// Get specific candidate by id
router.get('/:id', candidateController.getCandidateById);

module.exports = router;

