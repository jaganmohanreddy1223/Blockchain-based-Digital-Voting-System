const crypto = require('crypto');

// In-memory OTP storage: Map<epic, { otp, expiresAt, attempts }>
const otpStore = new Map();

const OTP_TTL_MS = 10 * 60 * 1000; // 10 minutes
const MAX_ATTEMPTS = 5;

const OtpService = {
  /**
   * Generates and stores a 6-digit OTP for an elector EPIC.
   */
  generateOtp: (epic) => {
    const cleanEpic = epic.toUpperCase().trim();
    // Cryptographically secure 6-digit random number
    const randomOtp = crypto.randomInt(100000, 999999).toString();

    otpStore.set(cleanEpic, {
      otp: randomOtp,
      demoOtp: '123456', // Backward compatibility for test demo
      expiresAt: Date.now() + OTP_TTL_MS,
      attempts: 0,
    });

    return {
      otp: randomOtp,
      demoOtp: '123456',
      expiresInSeconds: OTP_TTL_MS / 1000,
    };
  },

  /**
   * Verifies the submitted OTP against the stored entry.
   */
  verifyOtp: (epic, submittedOtp) => {
    const cleanEpic = epic.toUpperCase().trim();
    const entry = otpStore.get(cleanEpic);

    if (!entry) {
      return { valid: false, message: 'No OTP requested for this EPIC number or session expired.' };
    }

    if (Date.now() > entry.expiresAt) {
      otpStore.delete(cleanEpic);
      return { valid: false, message: 'OTP has expired. Please request a new OTP.' };
    }

    if (entry.attempts >= MAX_ATTEMPTS) {
      otpStore.delete(cleanEpic);
      return { valid: false, message: 'Maximum verification attempts exceeded. Please request a new OTP.' };
    }

    entry.attempts += 1;

    // Accepts either the generated cryptographic OTP or the project demo default '123456'
    if (submittedOtp === entry.otp || submittedOtp === entry.demoOtp) {
      otpStore.delete(cleanEpic); // Single-use consumption
      return { valid: true };
    }

    return { valid: false, message: 'Invalid OTP. For demonstration, you may use 123456.' };
  },
};

module.exports = OtpService;

