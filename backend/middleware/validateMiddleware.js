const validateMiddleware = {
  validateEpicRequest: (req, res, next) => {
    const { epic } = req.body;
    if (!epic || typeof epic !== 'string' || epic.trim().length < 4) {
      return res.status(400).json({
        success: false,
        message: 'A valid National Voter ID (EPIC Number) is required.',
      });
    }
    req.body.epic = epic.trim().toUpperCase();
    next();
  },

  validateOtpVerification: (req, res, next) => {
    const { epic, otp } = req.body;
    if (!epic || typeof epic !== 'string') {
      return res.status(400).json({
        success: false,
        message: 'EPIC number is required.',
      });
    }
    if (!otp || typeof otp !== 'string' || otp.trim().length !== 6) {
      return res.status(400).json({
        success: false,
        message: 'A 6-digit numeric OTP is required.',
      });
    }
    req.body.epic = epic.trim().toUpperCase();
    req.body.otp = otp.trim();
    next();
  },

  validateCastVote: (req, res, next) => {
    const { candidateId } = req.body;
    const num = Number(candidateId);
    if (!candidateId || isNaN(num) || num <= 0) {
      return res.status(400).json({
        success: false,
        message: 'A valid positive numerical candidate ID is required.',
      });
    }
    req.body.candidateId = num;
    next();
  },
};

module.exports = validateMiddleware;

