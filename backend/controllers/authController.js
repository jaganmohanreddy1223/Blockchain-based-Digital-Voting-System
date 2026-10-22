const jwt = require('jsonwebtoken');
const { ethers } = require('ethers');
const { VoterRepository } = require('../models/Voter');
const OtpService = require('../services/otpService');
const ContractService = require('../services/contractService');

const authController = {
  /**
   * Request OTP for an EPIC voter identifier.
   * POST /api/v1/auth/request-otp
   */
  requestOtp: async (req, res, next) => {
    try {
      const { epic, aadhaarLast4 } = req.body;
      const cleanEpic = epic.toUpperCase().trim();

      // Check if voter exists; if not, create a demo-eligible record with an anonymous EVM wallet
      let voter = await VoterRepository.findByEpic(cleanEpic);
      if (!voter) {
        const anonymousWallet = ethers.Wallet.createRandom();
        voter = await VoterRepository.createOrUpdate({
          epic: cleanEpic,
          mobileHash: aadhaarLast4 || '1234',
          voterAddress: anonymousWallet.address,
          isWhitelisted: true,
          hasVoted: false,
          constituency: 'New Delhi',
        });
      }

      // Generate 6-digit OTP
      const otpDetails = OtpService.generateOtp(cleanEpic);

      return res.status(200).json({
        success: true,
        message: '6-digit OTP dispatched to voter registered mobile endpoint.',
        epic: cleanEpic,
        // Demo OTP provided for seamless academic/demonstration evaluation
        demoOtp: otpDetails.demoOtp,
        expiresInSeconds: otpDetails.expiresInSeconds,
      });
    } catch (err) {
      next(err);
    }
  },

  /**
   * Verify OTP and issue JWT access token.
   * POST /api/v1/auth/verify-otp
   */
  verifyOtp: async (req, res, next) => {
    try {
      const { epic, otp } = req.body;
      const cleanEpic = epic.toUpperCase().trim();

      const verification = OtpService.verifyOtp(cleanEpic, otp);
      if (!verification.valid) {
        return res.status(400).json({
          success: false,
          message: verification.message,
        });
      }

      const voter = await VoterRepository.findByEpic(cleanEpic);
      if (!voter) {
        return res.status(404).json({
          success: false,
          message: 'Voter registry record not found.',
        });
      }

      // Ensure voter address is whitelisted on contract / consensus service
      await ContractService.whitelistVoter(voter.voterAddress);

      // Issue signed JWT token
      const secret = process.env.JWT_SECRET || 'super_secret_election_jwt_key_replace_in_production';
      const expiresIn = process.env.JWT_EXPIRES_IN || '2h';
      const token = jwt.sign(
        {
          epic: voter.epic,
          voterAddress: voter.voterAddress,
          constituency: voter.constituency,
        },
        secret,
        { expiresIn }
      );

      return res.status(200).json({
        success: true,
        message: 'Voter authentication verified. EVM Terminal unlocked.',
        token,
        voter: {
          epic: voter.epic,
          voterAddress: voter.voterAddress,
          constituency: voter.constituency,
          isWhitelisted: true,
          hasVoted: voter.hasVoted,
        },
      });
    } catch (err) {
      next(err);
    }
  },

  /**
   * Return authenticated voter status.
   * GET /api/v1/auth/status
   */
  getStatus: async (req, res, next) => {
    try {
      const { epic, voterAddress } = req.voter;
      const voter = await VoterRepository.findByEpic(epic);
      const onChainStatus = await ContractService.getVoterStatus(voterAddress);

      return res.status(200).json({
        success: true,
        voter: {
          epic,
          voterAddress,
          constituency: voter ? voter.constituency : 'New Delhi',
          hasVotedDb: voter ? voter.hasVoted : false,
          hasVotedOnChain: onChainStatus.hasVoted,
          isWhitelisted: onChainStatus.isWhitelisted,
        },
      });
    } catch (err) {
      next(err);
    }
  },
};

module.exports = authController;

