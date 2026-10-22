const { ethers } = require('ethers');
const contractData = require('../contracts/DigitalBallot.json');

let provider = null;
let relayerWallet = null;
let ballotContract = null;
let isLiveBlockchain = false;

// Initialize Blockchain Connection
const initBlockchain = () => {
  const rpcUrl = process.env.RPC_URL;
  const contractAddress = process.env.CONTRACT_ADDRESS;
  const privateKey = process.env.RELAYER_PRIVATE_KEY;

  if (rpcUrl && contractAddress && privateKey) {
    try {
      provider = new ethers.JsonRpcProvider(rpcUrl);
      relayerWallet = new ethers.Wallet(privateKey, provider);
      ballotContract = new ethers.Contract(contractAddress, contractData.abi, relayerWallet);
      isLiveBlockchain = true;
      console.log(`[Blockchain] Connected to live EVM network via RPC: ${rpcUrl}`);
      console.log(`[Blockchain] Ballot contract attached at: ${contractAddress}`);
    } catch (err) {
      console.error(`[Blockchain] Failed to initialize live contract: ${err.message}`);
      isLiveBlockchain = false;
    }
  } else {
    console.log(`[Blockchain] No RPC_URL or CONTRACT_ADDRESS provided in environment.`);
    console.log(`[Blockchain] Initializing local cryptographic simulation engine using ethers.js v6.`);
    isLiveBlockchain = false;
  }
};

const getBallotContract = () => ballotContract;
const getProvider = () => provider;
const getRelayerWallet = () => relayerWallet;
const getIsLiveBlockchain = () => isLiveBlockchain;

module.exports = {
  initBlockchain,
  getBallotContract,
  getProvider,
  getRelayerWallet,
  getIsLiveBlockchain,
  abi: contractData.abi
};

