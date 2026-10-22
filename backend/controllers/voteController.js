const { CandidateRepository } = require('../models/Candidate');
const { VoterRepository } = require('../models/Voter');
const { AuditRepository } = require('../models/AuditLog');
const ContractService = require('../services/contractService');

const voteController = {
  /**
   * Cast a vote for a candidate.
   * POST /api/v1/vote/cast
   * Protected by authMiddleware
   */
  castVote: async (req, res, next) => {
    try {
      const { candidateId } = req.body;
      const { epic, voterAddress } = req.voter;

      // 1. Verify candidate existence
      const candidate = await CandidateRepository.getById(candidateId);
      if (!candidate) {
        return res.status(404).json({
          success: false,
          message: `Candidate with ID ${candidateId} does not exist in the electoral registry.`,
        });
      }

      // 2. Off-chain database pre-check for double voting
      const voter = await VoterRepository.findByEpic(epic);
      if (voter && voter.hasVoted) {
        return res.status(403).json({
          success: false,
          message: 'Double Voting Rejected: Electoral records indicate your ballot has already been cast.',
        });
      }

      // 3. Execute on-chain / cryptographic consensus vote
      // Throws error if smart contract rejects (e.g. not whitelisted or already voted)
      const blockchainResult = await ContractService.castVote(voterAddress, candidateId);

      // 4. Update off-chain state
      await VoterRepository.markAsVoted(epic);
      await CandidateRepository.incrementVote(candidateId);

      // 5. Store audit receipt
      await AuditRepository.create({
        txHash: blockchainResult.txHash,
        blockNumber: blockchainResult.blockNumber,
        candidateId: candidate.id,
        voterAddressAnonymous: voterAddress,
        timestamp: new Date(blockchainResult.timestamp * 1000),
      });

      return res.status(200).json({
        success: true,
        message: 'Ballot securely recorded on blockchain ledger.',
        receipt: {
          candidateId: candidate.id,
          candidateName: candidate.name,
          party: candidate.party,
          symbol: candidate.symbol,
          transactionHash: blockchainResult.txHash,
          blockNumber: blockchainResult.blockNumber,
          timestamp: blockchainResult.timestamp,
          isLiveNetwork: blockchainResult.isLiveNetwork,
        },
      });
    } catch (err) {
      if (err.message && err.message.includes('Double voting prohibited')) {
        return res.status(403).json({
          success: false,
          message: err.message,
        });
      }
      next(err);
    }
  },

  /**
   * Verify an on-chain transaction receipt.
   * GET /api/v1/vote/verify/:txHash
   */
  verifyReceipt: async (req, res, next) => {
    try {
      const { txHash } = req.params;
      const auditEntry = await AuditRepository.findByTxHash(txHash);

      if (!auditEntry) {
        return res.status(404).json({
          success: false,
          message: 'Transaction hash not found in election ledger audit trail.',
        });
      }

      const candidate = await CandidateRepository.getById(auditEntry.candidateId);

      return res.status(200).json({
        success: true,
        verification: {
          txHash: auditEntry.txHash,
          blockNumber: auditEntry.blockNumber,
          timestamp: auditEntry.timestamp,
          status: auditEntry.status,
          candidateId: auditEntry.candidateId,
          candidateName: candidate ? candidate.name : 'Unknown Candidate',
        },
      });
    } catch (err) {
      next(err);
    }
  },

  /**
   * Aggregated live election results.
   * GET /api/v1/vote/results
   */
  getResults: async (req, res, next) => {
    try {
      const candidates = await CandidateRepository.getAll();
      const onChainCounts = await ContractService.getAllVoteCounts();

      const results = candidates.map(c => ({
        id: c.id,
        name: c.name,
        party: c.party,
        symbol: c.symbol,
        city: c.city,
        dbVoteCount: c.votes,
        onChainVoteCount: onChainCounts[c.id] || 0,
      }));

      return res.status(200).json({
        success: true,
        results,
      });
    } catch (err) {
      next(err);
    }
  },
};

module.exports = voteController;

