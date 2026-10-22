# Blockchain-based-Digital-Voting-System

A full-stack, enterprise-grade digital electronic voting platform integrating an official government-styled frontend (supporting English, Hindi, Telugu, and Tamil) with a robust Node.js/Express backend, MongoDB data tier, and an Ethereum/EVM-compatible cryptographic consensus and smart-contract verification engine using **ethers.js v6**.

---

## 🏛️ System Architecture

The architecture enforces a strict separation between **Application Data (Off-Chain)** and **Electoral Consensus Data (On-Chain)**:

```
┌─────────────────────────────────────────────────────────┐
│               FRONTEND USER INTERFACE                   │
│        (Vanilla HTML5, CSS3 Grid, Multilingual JS)      │
└───────────────────────────┬─────────────────────────────┘
                            │ REST API (JSON) + Bearer JWT
                            ▼
┌─────────────────────────────────────────────────────────┐
│              BACKEND API (Node.js & Express)            │
│       • Auth & OTP Lifecycle • Input Validation         │
│       • Cryptographic Relayer • Rate & Error Handling   │
└──────────────┬───────────────────────────┬──────────────┘
               │                           │
               ▼                           ▼
┌──────────────────────────────┐ ┌──────────────────────────────┐
│     OFF-CHAIN DATA TIER      │ │     ON-CHAIN CONSENSUS TIER  │
│      (MongoDB / Mongoose)    │ │   (EVM Smart Contract/Ethers)│
├──────────────────────────────┤ ├──────────────────────────────┤
│ • Voter PII & Registration   │ │ • Anonymous Voter Public Key │
│ • Hashed Mobile / Aadhaar    │ │ • Zero Double-Voting Guard   │
│ • Multilingual Biographies   │ │ • Immutable Candidate Tallies│
│ • Election Phases & Calendar │ │ • Cryptographic Audit Hash   │
└──────────────────────────────┘ └──────────────────────────────┘
```

---

## 🔒 Separation of Application Data vs. Blockchain Data

1. **Off-Chain Application Data (MongoDB / Repository Tier)**:
   - **Voter Privacy**: Voter Personally Identifiable Information (PII) such as Name, National Voter ID (EPIC), and phone credentials are stored securely off-chain. PII is **never** published to the public blockchain ledger.
   - **Authentication**: Dispatches 6-digit OTPs with short TTL (10 minutes) and max verification limits.
   - **Candidate Profiles**: Multilingual candidate affidavits, educational backgrounds, party symbols, and city allocations.

2. **On-Chain Blockchain Consensus (Smart Contract / Ethers.js Tier)**:
   - **Smart Contract (`DigitalBallot.sol`)**: Deployed on any EVM-compatible network (Hardhat, Sepolia, Polygon Amoy).
   - **Cryptographic Whitelisting**: The Election Authority authorizes an anonymous wallet address mapped to the elector.
   - **Double-Voting Prevention**: The smart contract rejects any secondary ballot cast from an address (`hasVoted[address] == true`).
   - **Immutable Audit Trail**: Emits on-chain `VoteCast` events with verifiable `keccak256` transaction hashes and block numbers displayed in the Digital Receipt Unit (DRU).

---

## 📁 Repository Structure

```text
Blockchain-based-Digital-Voting-System/
├── .gitignore
├── LICENSE
├── README.md
├── frontend/
│   └── index.html               # Preserved monolithic SPA (6 views, multilingual engine)
└── backend/
    ├── config/
    │   ├── db.js                # MongoDB connection with in-memory resilient fallback
    │   └── blockchain.js        # Ethers.js provider, wallet relayer, and contract loader
    ├── contracts/
    │   ├── DigitalBallot.sol    # Production-grade Solidity 0.8.20 voting contract
    │   └── DigitalBallot.json   # Full contract ABI & definition
    ├── controllers/
    │   ├── authController.js    # EPIC verification, OTP generation, and JWT issuance
    │   ├── candidateController.js # City/constituency candidate retrieval
    │   ├── electionController.js  # Election calendar and phase schedule
    │   └── voteController.js    # Smart contract ballot execution and audit lookup
    ├── middleware/
    │   ├── authMiddleware.js    # JWT Bearer verification
    │   ├── validateMiddleware.js# Input sanitization
    │   └── errorHandler.js      # Global error handling
    ├── models/
    │   ├── Voter.js             # Voter schema & repository
    │   ├── Candidate.js         # Candidate schema & repository
    │   ├── ElectionSchedule.js  # Election dates & phase schema
    │   └── AuditLog.js          # On-chain transaction audit trail
    ├── routes/
    │   ├── authRoutes.js        # /api/v1/auth/*
    │   ├── candidateRoutes.js   # /api/v1/candidates/*
    │   ├── electionRoutes.js    # /api/v1/elections/*
    │   └── voteRoutes.js        # /api/v1/vote/*
    ├── services/
    │   ├── otpService.js        # Cryptographic OTP generator with rate limiting
    │   └── contractService.js   # Ethers.js contract caller and consensus simulator
    ├── .env.example             # Safe environment template
    ├── package.json             # Express, ethers, mongoose, jsonwebtoken, etc.
    ├── server.js                # Express app entry point
    └── test-backend.js          # Automated end-to-end integration test suite
```

---

## 🚀 Quickstart Guide

### 1. Prerequisites
- **Node.js** (v18.x or v20.x+)
- **MongoDB** (Optional: the backend automatically uses a resilient in-memory store if MongoDB is not running locally).

### 2. Environment Configuration
Navigate to the `backend` folder and create your `.env` file:
```bash
cd backend
cp .env.example .env
```

Default configuration in `.env`:
```env
PORT=5000
NODE_ENV=development
JWT_SECRET=super_secret_election_jwt_key_replace_in_production
JWT_EXPIRES_IN=2h
MONGODB_URI=mongodb://127.0.0.1:27017/voting_system
RPC_URL=
CONTRACT_ADDRESS=
RELAYER_PRIVATE_KEY=
```

### 3. Install Dependencies
```bash
cd backend
npm install
```
*(On Windows PowerShell with restricted execution policy, run `npm.cmd install`)*

### 4. Run Automated Backend Tests
Verify all 11 unit and integration tests (auth, double-voting prevention, blockchain hashing, filtering):
```bash
npm test
```

### 5. Start the Server
To launch the backend API:
```bash
npm start
```
* The backend API runs on: `http://localhost:5000`
* Health Check: `http://localhost:5000/api/v1/health`
* The frontend is also served directly at: `http://localhost:5000/`

---

## 🌐 API Reference

### Authentication
* `POST /api/v1/auth/request-otp`
  - Body: `{ "epic": "IND-89230491", "aadhaarLast4": "1234" }`
  - Response: `{ "success": true, "message": "...", "demoOtp": "123456" }`
* `POST /api/v1/auth/verify-otp`
  - Body: `{ "epic": "IND-89230491", "otp": "123456" }`
  - Response: `{ "success": true, "token": "JWT_TOKEN", "voter": {...} }`
* `GET /api/v1/auth/status` (Headers: `Authorization: Bearer <token>`)

### Election & Candidates
* `GET /api/v1/candidates` (Optional filter: `?city=Hyderabad`)
* `GET /api/v1/candidates/:id`
* `GET /api/v1/elections/schedule`

### Voting & On-Chain Audit
* `POST /api/v1/vote/cast` (Headers: `Authorization: Bearer <token>`)
  - Body: `{ "candidateId": 1 }`
  - Enforces: Smart contract whitelisting and zero double-voting guard.
  - Response: Returns on-chain receipt `{ "transactionHash": "0x...", "blockNumber": 19482002 }`.
* `GET /api/v1/vote/verify/:txHash`
  - Queries on-chain audit log by transaction hash.
* `GET /api/v1/vote/results`
  - Aggregated vote counts from database and blockchain contract.

---

## 🧪 Testing the Voting Flow

1. Open your browser to `http://localhost:5000/` (or open `frontend/index.html` in any browser/Live Server).
2. Click **Voter Login** on the navigation bar.
3. Enter EPIC Number: `IND-89230491` (or any valid EPIC) and click **Send 6-Digit OTP**.
4. Enter OTP: `123456` and click **Verify & Launch EVM Terminal**.
5. Once the EVM Terminal loads, click the blue **VOTE** button next to any candidate (e.g., candidate 01: Arun Sharma).
6. Watch the **Digital Receipt Unit** display the candidate choice and the verifiable blockchain transaction hash with a 7-second audit timer.
7. Attempting to click vote again will immediately trigger the **Zero Double-Voting Guard** rejection, protecting electoral integrity.
