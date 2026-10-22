const { ethers } = require('ethers');
const { getBallotContract, getIsLiveBlockchain, getRelayerWallet } = require('../config/blockchain');

// In-Memory simulated EVM state for local/test mode
let simulatedBlockNumber = 19482001;
const simulatedWhitelisted = new Set();
const simulatedHasVoted = new Set();
const simulatedVoteCounts = new Map([
  [1, 0],
  [2, 0],
  [3, 0],
  [4, 0],
  [5, 0],
  [6, 0],
  [7, 0],
  [8, 0],
  [9, 0],
  [10, 0],
]);

const ContractService = {
  /**
   * Whitelist a voter address.
   */
  whitelistVoter: async (voterAddress) => {
    if (getIsLiveBlockchain()) {
      const contract = getBallotContract();
      const tx = await contract.whitelistVoter(voterAddress);
      await tx.wait();
      return { success: true, txHash: tx.hash };
    }

    // Local cryptographic simulation
    simulatedWhitelisted.add(voterAddress.toLowerCase());
    return { success: true, whitelisted: true };
  },

  /**
   * Query voter status on-chain or locally.
   */
  getVoterStatus: async (voterAddress) => {
    const addr = voterAddress.toLowerCase();
    if (getIsLiveBlockchain()) {
      const contract = getBallotContract();
      const [whitelisted, voted] = await contract.getVoterStatus(voterAddress);
      return { isWhitelisted: whitelisted, hasVoted: voted };
    }

    return {
      isWhitelisted: simulatedWhitelisted.has(addr),
      hasVoted: simulatedHasVoted.has(addr),
    };
  },

  /**
   * Cast ballot for a candidate using voter's authorized address.
   */
  castVote: async (voterAddress, candidateId) => {
    const addr = voterAddress.toLowerCase();
    const cId = Number(candidateId);

    if (getIsLiveBlockchain()) {
      const contract = getBallotContract();
      
      // Ensure whitelisted on contract
      const isW = await contract.isWhitelisted(voterAddress);
      if (!isW) {
        const wlTx = await contract.whitelistVoter(voterAddress);
        await wlTx.wait();
      }

      // Check double vote guard on contract
      const alreadyVoted = await contract.hasVoted(voterAddress);
      if (alreadyVoted) {
        throw new Error('Double voting prohibited: ballot already recorded on blockchain contract.');
      }

      const tx = await contract.castVote(cId);
      const receipt = await tx.wait();

      return {
        txHash: tx.hash,
        blockNumber: receipt.blockNumber,
        timestamp: Math.floor(Date.now() / 1000),
        isLiveNetwork: true,
      };
    }

    // Local cryptographic consensus simulation using real ethers.keccak256
    if (!simulatedWhitelisted.has(addr)) {
      simulatedWhitelisted.add(addr); // Auto-whitelist for verified authenticated sessions
    }

    if (simulatedHasVoted.has(addr)) {
      throw new Error('Double voting prohibited: ballot already recorded for this authorized address.');
    }

    // Advance simulated block
    simulatedBlockNumber += 1;
    const currentTimestamp = Math.floor(Date.now() / 1000);

    // Cryptographic EVM transaction hash computed using ethers.keccak256
    const abiCoder = ethers.AbiCoder.defaultAbiCoder();
    const encodedPayload = abiCoder.encode(
      ['address', 'uint256', 'uint256', 'uint256'],
      [addr, cId, simulatedBlockNumber, currentTimestamp]
    );
    const txHash = ethers.keccak256(encodedPayload);

    // Record immutable state transition
    simulatedHasVoted.add(addr);
    const currentTally = simulatedVoteCounts.get(cId) || 0;
    simulatedVoteCounts.set(cId, currentTally + 1);

    return {
      txHash,
      blockNumber: simulatedBlockNumber,
      timestamp: currentTimestamp,
      isLiveNetwork: false,
    };
  },

  /**
   * Get vote count for a candidate.
   */
  getVoteCount: async (candidateId) => {
    const cId = Number(candidateId);
    if (getIsLiveBlockchain()) {
      const contract = getBallotContract();
      const count = await contract.getVoteCount(cId);
      return Number(count);
    }
    return simulatedVoteCounts.get(cId) || 0;
  },

  /**
   * Get all vote tallies.
   */
  getAllVoteCounts: async () => {
    const counts = {};
    for (const [id, count] of simulatedVoteCounts.entries()) {
      counts[id] = count;
    }
    return counts;
  },
};

module.exports = ContractService;

