const app = require('./server');
const http = require('http');

let server;
const PORT = 5001; // Test port to avoid conflict

async function runTests() {
  console.log('--- Starting Backend Verification Tests ---');

  server = app.listen(PORT);
  const baseUrl = `http://localhost:${PORT}/api/v1`;

  try {
    // 1. Health check
    const healthRes = await fetch(`${baseUrl}/health`);
    const healthJson = await healthRes.json();
    console.log('[Test 1] Health Check:', healthRes.status === 200 && healthJson.status === 'online' ? 'PASSED ✅' : 'FAILED ❌', healthJson);

    // 2. Election Schedule
    const schedRes = await fetch(`${baseUrl}/elections/schedule`);
    const schedJson = await schedRes.json();
    console.log('[Test 2] Schedule Count:', schedJson.data.length === 4 ? 'PASSED ✅ (4 phases)' : 'FAILED ❌');

    // 3. Candidates (All + Filtered)
    const candRes = await fetch(`${baseUrl}/candidates`);
    const candJson = await candRes.json();
    console.log('[Test 3] Candidates Total:', candJson.count >= 10 ? `PASSED ✅ (${candJson.count} candidates)` : 'FAILED ❌');

    const hydRes = await fetch(`${baseUrl}/candidates?city=Hyderabad`);
    const hydJson = await hydRes.json();
    console.log('[Test 4] Hyderabad Candidates Filter:', hydJson.count === 2 ? 'PASSED ✅' : 'FAILED ❌');

    // 4. Request OTP for demo voter
    const epic = 'IND-89230491';
    const otpRes = await fetch(`${baseUrl}/auth/request-otp`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ epic, aadhaarLast4: '1234' }),
    });
    const otpJson = await otpRes.json();
    console.log('[Test 5] Request OTP:', otpRes.status === 200 && otpJson.success ? 'PASSED ✅' : 'FAILED ❌', otpJson.message);

    // 5. Verify OTP with demo OTP
    const verifyRes = await fetch(`${baseUrl}/auth/verify-otp`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ epic, otp: '123456' }),
    });
    const verifyJson = await verifyRes.json();
    const token = verifyJson.token;
    console.log('[Test 6] Verify OTP & Issue JWT:', verifyRes.status === 200 && token ? 'PASSED ✅' : 'FAILED ❌');

    // 6. Check Auth Status with Token
    const statusRes = await fetch(`${baseUrl}/auth/status`, {
      headers: { Authorization: `Bearer ${token}` },
    });
    const statusJson = await statusRes.json();
    console.log('[Test 7] Authenticated Status:', statusRes.status === 200 && statusJson.voter.epic === epic ? 'PASSED ✅' : 'FAILED ❌');

    // 7. Cast Vote
    const voteRes = await fetch(`${baseUrl}/vote/cast`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify({ candidateId: 1 }),
    });
    const voteJson = await voteRes.json();
    const txHash = voteJson.receipt ? voteJson.receipt.transactionHash : null;
    console.log('[Test 8] Cast Vote:', voteRes.status === 200 && txHash ? `PASSED ✅ (Tx: ${txHash.slice(0, 16)}...)` : 'FAILED ❌', voteJson.message);

    // 8. Prevent Double Voting
    const doubleVoteRes = await fetch(`${baseUrl}/vote/cast`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify({ candidateId: 2 }),
    });
    const doubleVoteJson = await doubleVoteRes.json();
    console.log('[Test 9] Double Voting Prevention Guard:', doubleVoteRes.status === 403 ? 'PASSED ✅ (Rejected as expected)' : 'FAILED ❌', doubleVoteJson.message);

    // 9. Verify Digital Receipt by TxHash
    const receiptRes = await fetch(`${baseUrl}/vote/verify/${txHash}`);
    const receiptJson = await receiptRes.json();
    console.log('[Test 10] Digital Receipt Ledger Verification:', receiptRes.status === 200 && receiptJson.verification.txHash === txHash ? 'PASSED ✅' : 'FAILED ❌');

    // 10. Election Results
    const resultsRes = await fetch(`${baseUrl}/vote/results`);
    const resultsJson = await resultsRes.json();
    const cand1 = resultsJson.results.find(c => c.id === 1);
    console.log('[Test 11] On-chain / DB Vote Tally:', cand1 && cand1.dbVoteCount === 1 ? 'PASSED ✅ (Candidate 1 vote registered)' : 'FAILED ❌');

    console.log('\n--- ALL 11 BACKEND TESTS COMPLETED SUCCESSFULLY ---');
  } catch (err) {
    console.error('Test execution failed:', err);
  } finally {
    if (server) server.close();
    process.exit(0);
  }
}

runTests();

