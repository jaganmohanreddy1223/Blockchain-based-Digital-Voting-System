const express = require('express');
const router = express.Router();
const electionController = require('../controllers/electionController');

// Get Election Schedule & Phases
router.get('/schedule', electionController.getSchedule);

module.exports = router;

