const express = require('express');
const router = express.Router();
const authController = require('../controllers/authController');
const authMiddleware = require('../middleware/authMiddleware');
const validateMiddleware = require('../middleware/validateMiddleware');

// Request OTP
router.post('/request-otp', validateMiddleware.validateEpicRequest, authController.requestOtp);

// Verify OTP & Issue Token
router.post('/verify-otp', validateMiddleware.validateOtpVerification, authController.verifyOtp);

// Get Authenticated Voter Status
router.get('/status', authMiddleware, authController.getStatus);

module.exports = router;

