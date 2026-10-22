// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

/**
 * @title DigitalBallot
 * @dev Smart Contract for Blockchain-Based Digital Voting System.
 * Enforces cryptographic whitelisting, prevents double voting, and tallies candidate votes.
 */
contract DigitalBallot {
    address public immutable electionAuthority;
    bool public votingActive;
    uint256 public totalVotesCast;

    // Mapping from voter address to whitelisted authorization status
    mapping(address => bool) public isWhitelisted;

    // Mapping from voter address to ballot casting status (prevents double voting)
    mapping(address => bool) public hasVoted;

    // Mapping from candidate ID to cumulative vote count
    mapping(uint256 => uint256) public voteCounts;

    // Registered candidate ID validation
    mapping(uint256 => bool) public validCandidate;
    uint256[] public candidateList;

    // Events for on-chain audit trail
    event VoterWhitelisted(address indexed voter);
    event VoteCast(address indexed voter, uint256 indexed candidateId, uint256 timestamp);
    event VotingStatusChanged(bool active);

    modifier onlyAuthority() {
        require(msg.sender == electionAuthority, "Only election authority can perform this action");
        _;
    }

    constructor(uint256[] memory initialCandidateIds) {
        electionAuthority = msg.sender;
        votingActive = true;

        for (uint256 i = 0; i < initialCandidateIds.length; i++) {
            uint256 cId = initialCandidateIds[i];
            validCandidate[cId] = true;
            candidateList.push(cId);
        }
    }

    /**
     * @notice Authorizes a voter public address to cast 1 ballot.
     * @param voter Address of the voter.
     */
    function whitelistVoter(address voter) external onlyAuthority {
        require(voter != address(0), "Invalid voter address");
        isWhitelisted[voter] = true;
        emit VoterWhitelisted(voter);
    }

    /**
     * @notice Cast a single ballot for a candidate.
     * @param candidateId Registered numerical ID of the candidate.
     */
    function castVote(uint256 candidateId) external {
        require(votingActive, "Voting window is currently closed");
        require(isWhitelisted[msg.sender], "Address is not whitelisted for this election");
        require(!hasVoted[msg.sender], "Double voting prohibited: ballot already cast");
        require(validCandidate[candidateId], "Invalid candidate selected");

        hasVoted[msg.sender] = true;
        voteCounts[candidateId] += 1;
        totalVotesCast += 1;

        emit VoteCast(msg.sender, candidateId, block.timestamp);
    }

    /**
     * @notice Get candidate's current tally.
     */
    function getVoteCount(uint256 candidateId) external view returns (uint256) {
        require(validCandidate[candidateId], "Candidate not registered");
        return voteCounts[candidateId];
    }

    /**
     * @notice Verify voter eligibility and voting status on-chain.
     */
    function getVoterStatus(address voter) external view returns (bool whitelisted, bool voted) {
        return (isWhitelisted[voter], hasVoted[voter]);
    }

    /**
     * @notice Toggle voting window state.
     */
    function setVotingActive(bool active) external onlyAuthority {
        votingActive = active;
        emit VotingStatusChanged(active);
    }

    /**
     * @notice Return all registered candidate IDs.
     */
    function getCandidateList() external view returns (uint256[] memory) {
        return candidateList;
    }
}

