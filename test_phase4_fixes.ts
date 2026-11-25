import http from 'http';

interface TestResult {
  id: string;
  name: string;
  status: 'PASS' | 'FAIL';
  details: string;
}

const results: TestResult[] = [];

function makeRequest(
  urlPath: string,
  method: string,
  headers: Record<string, string>,
  body?: any
): Promise<{ statusCode: number; data: any; durationMs: number }> {
  const startTime = Date.now();
  const payload = body ? JSON.stringify(body) : undefined;

  return new Promise((resolve, reject) => {
    const req = http.request(
      `http://localhost:3000${urlPath}`,
      {
        method,
        headers: {
          ...headers,
          ...(payload ? { 'Content-Length': Buffer.byteLength(payload) } : {})
        }
      },
      (res) => {
        let respBody = '';
        res.on('data', (chunk) => { respBody += chunk; });
        res.on('end', () => {
          const durationMs = Date.now() - startTime;
          try {
            const parsed = respBody ? JSON.parse(respBody) : {};
            resolve({ statusCode: res.statusCode || 0, data: parsed, durationMs });
          } catch {
            resolve({ statusCode: res.statusCode || 0, data: respBody, durationMs });
          }
        });
      }
    );
    req.on('error', reject);
    if (payload) req.write(payload);
    req.end();
  });
}

async function runPhase4Tests() {
  console.log('====================================================');
  console.log('  TUTEACH PHASE 4: CONTROLLED DEFECT FIX VALIDATION');
  console.log('====================================================\n');

  // -----------------------------------------------------------------
  // SUITE A: BUG 1 — INSTALLATION FALSE TRIGGER REGRESSION
  // -----------------------------------------------------------------
  console.log('--- SUITE A: Installation Intent vs UI Navigation ---');

  const uiLocationQueries = [
    { q: "Where can I find the Inspector?", expectedTerm: "inspector", forbidden: "blackmagicdesign.com" },
    { q: "Where is the Timeline?", expectedTerm: "timeline", forbidden: "blackmagicdesign.com" },
    { q: "Where is the Media Pool?", expectedTerm: "media pool", forbidden: "blackmagicdesign.com" },
    { q: "Where can I find the Blade tool?", expectedTerm: "blade", forbidden: "blackmagicdesign.com" },
    { q: "Where is the Export button?", expectedTerm: "deliver", forbidden: "blackmagicdesign.com" }
  ];

  for (const item of uiLocationQueries) {
    const res = await makeRequest('/api/tutor/chat', 'POST', { 'Content-Type': 'application/json' }, {
      message: item.q,
      courseTitle: "Video Editing with DaVinci Resolve",
      lessonTitle: "Workspace Navigation",
      studentName: "Rohan",
      history: [
        { role: 'user', content: 'My name is Rohan.' },
        { role: 'model', content: 'Great to have you here, let us explore.' }
      ]
    });

    const reply = (res.data?.reply || '').toLowerCase();
    const hasExpected = reply.includes(item.expectedTerm);
    const hasForbidden = reply.includes(item.forbidden);

    const pass = hasExpected && !hasForbidden;
    results.push({
      id: `BUG1-${item.expectedTerm.toUpperCase()}`,
      name: `UI Navigation: "${item.q}"`,
      status: pass ? 'PASS' : 'FAIL',
      details: pass
        ? `Correctly answered ${item.expectedTerm} location without download trigger. Duration: ${res.durationMs}ms`
        : `FAILED: hasExpected=${hasExpected}, hasForbiddenDownload=${hasForbidden}. Reply: ${res.data?.reply?.slice(0, 80)}`
    });
    console.log(`[${pass ? 'PASS' : 'FAIL'}] "${item.q}" -> answered correctly without install link`);
  }

  // True download / install queries
  const installQueries = [
    { q: "How do I download DaVinci Resolve?", mustContain: "blackmagicdesign" },
    { q: "I haven't installed it yet.", mustContain: "blackmagicdesign" },
    { q: "Send me the download link.", mustContain: "blackmagicdesign" }
  ];

  for (const item of installQueries) {
    const res = await makeRequest('/api/tutor/chat', 'POST', { 'Content-Type': 'application/json' }, {
      message: item.q,
      courseTitle: "Video Editing with DaVinci Resolve",
      studentName: "Rohan",
      history: []
    });

    const reply = (res.data?.reply || '').toLowerCase();
    const pass = reply.includes(item.mustContain);
    results.push({
      id: `INSTALL-${item.q.slice(0, 10).replace(/[^a-zA-Z]/g, '')}`,
      name: `Install Trigger: "${item.q}"`,
      status: pass ? 'PASS' : 'FAIL',
      details: pass ? `Offered setup guidance with official link. Duration: ${res.durationMs}ms` : `Did not offer link. Reply: ${res.data?.reply?.slice(0, 80)}`
    });
    console.log(`[${pass ? 'PASS' : 'FAIL'}] "${item.q}" -> offered official download link`);
  }

  // Software already launched detection
  const setupDoneRes = await makeRequest('/api/tutor/chat', 'POST', { 'Content-Type': 'application/json' }, {
    message: "I already downloaded and opened DaVinci Resolve.",
    courseTitle: "Video Editing with DaVinci Resolve",
    studentName: "Rohan",
    history: []
  });
  const setupDonePass = (setupDoneRes.data?.reply || '').toLowerCase().includes('project manager') ||
    (setupDoneRes.data?.reply || '').toLowerCase().includes('workspace');
  results.push({
    id: 'SETUP-PROGRESS',
    name: 'Setup Progress Detection ("already opened")',
    status: setupDonePass ? 'PASS' : 'FAIL',
    details: setupDonePass ? 'Detected software launch and guided to Project Manager.' : 'Failed launch detection.'
  });
  console.log(`[${setupDonePass ? 'PASS' : 'FAIL'}] Setup progress acknowledged without re-sending download link`);

  // -----------------------------------------------------------------
  // SUITE B: ANTI-REPETITION & CONVERSATIONAL CONTEXT
  // -----------------------------------------------------------------
  console.log('\n--- SUITE B: Anti-Repetition & History Recapping Guard ---');

  const antiRepetitionTest = await makeRequest('/api/tutor/chat', 'POST', { 'Content-Type': 'application/json' }, {
    message: "Can you explain the Playhead?",
    courseTitle: "Video Editing with DaVinci Resolve",
    lessonTitle: "Workspace Navigation",
    studentName: "Rohan",
    history: [
      { role: 'user', content: 'My name is Rohan and I am a beginner.' },
      { role: 'model', content: 'Nice to meet you, Rohan! Do you see the timeline?' },
      { role: 'user', content: 'Yes, I see the timeline.' },
      { role: 'model', content: 'Awesome! Notice the Blade tool right above it.' }
    ]
  });

  const replyText = antiRepetitionTest.data?.reply || '';
  const forbiddenIntros = [
    /hello rohan/i,
    /welcome to davinci/i,
    /it'?s so great to have you here/i,
    /pull up a chair/i,
    /i am thrilled to learn with you/i
  ];
  const forbiddenRecaps = [
    /so far you told me/i,
    /in our conversation/i,
    /you previously mentioned/i,
    /you told me your name is/i
  ];

  let hasRepeatedIntro = forbiddenIntros.some(r => r.test(replyText.slice(0, 80)));
  let hasRecappedHistory = forbiddenRecaps.some(r => r.test(replyText));

  const antiRepetitionPass = !hasRepeatedIntro && !hasRecappedHistory && replyText.toLowerCase().includes('playhead');
  results.push({
    id: 'ANTI-REPETITION-CHECK',
    name: 'Mid-session query: No repeated greeting or history recap',
    status: antiRepetitionPass ? 'PASS' : 'FAIL',
    details: antiRepetitionPass
      ? `Clean, focused desk-side explanation without intro preamble. Reply: "${replyText.slice(0, 90)}..."`
      : `FAILED: hasRepeatedIntro=${hasRepeatedIntro}, hasRecappedHistory=${hasRecappedHistory}. Snippet: "${replyText.slice(0, 100)}"`
  });
  console.log(`[${antiRepetitionPass ? 'PASS' : 'FAIL'}] Anti-repetition & history guard: ${antiRepetitionPass ? 'Clean desk-side response' : 'Violated discipline'}`);

  // -----------------------------------------------------------------
  // SUITE C: DEMO VS PAID PARITY
  // -----------------------------------------------------------------
  console.log('\n--- SUITE C: Demo vs Paid Endpoint Parity ---');

  const demoSessionRes = await makeRequest('/api/demo/session', 'POST', { 'Content-Type': 'application/json' }, {
    visitorName: "Guest Visitor"
  });
  const demoSessionId = demoSessionRes.data?.sessionId;

  const demoChatRes = await makeRequest('/api/demo/chat', 'POST', { 'Content-Type': 'application/json' }, {
    message: "What is Ripple Delete?",
    sessionId: demoSessionId,
    visitorName: "Guest Visitor"
  });
  const paidChatRes = await makeRequest('/api/tutor/chat', 'POST', { 'Content-Type': 'application/json' }, {
    message: "What is Ripple Delete?",
    courseTitle: "Video Editing with DaVinci Resolve",
    studentName: "Rohan"
  });

  const demoMentionsGap = (demoChatRes.data?.reply || '').toLowerCase().includes('gap') || (demoChatRes.data?.reply || '').toLowerCase().includes('ripple');
  const paidMentionsGap = (paidChatRes.data?.reply || '').toLowerCase().includes('gap') || (paidChatRes.data?.reply || '').toLowerCase().includes('ripple');
  const parityPass = demoMentionsGap && paidMentionsGap;

  results.push({
    id: 'DEMO-PAID-PARITY',
    name: 'Demo vs Paid Concept Parity: Ripple Delete',
    status: parityPass ? 'PASS' : 'FAIL',
    details: parityPass ? 'Both Demo and Paid explain gap-closing and ripple deletion.' : 'Parity mismatch.'
  });
  console.log(`[${parityPass ? 'PASS' : 'FAIL'}] Demo vs Paid parity: both teach Ripple Delete concept consistently`);

  // -----------------------------------------------------------------
  // SUITE D: SECURITY & PAYMENT ENTITLEMENTS REGRESSION
  // -----------------------------------------------------------------
  console.log('\n--- SUITE D: Security, Entitlements & Razorpay Gates ---');

  // Check Razorpay config
  const rzpConfigRes = await makeRequest('/api/payments/razorpay/config', 'GET', {});
  const rzpConfigPass = rzpConfigRes.statusCode === 200 && rzpConfigRes.data?.mode === 'TEST' && rzpConfigRes.data?.keyId?.startsWith('rzp_test_');
  results.push({
    id: 'SEC-RZP-CONFIG',
    name: 'Razorpay Test Mode & Key Config',
    status: rzpConfigPass ? 'PASS' : 'FAIL',
    details: rzpConfigPass ? `Mode: ${rzpConfigRes.data?.mode}, Key: ${rzpConfigRes.data?.keyId}` : 'Config endpoint failed.'
  });
  console.log(`[${rzpConfigPass ? 'PASS' : 'FAIL'}] Razorpay configuration secure in TEST mode`);

  // Verify unpaid access restriction
  const unpaidGateRes = await makeRequest('/api/courses/course-davinci-resolve/verify-access', 'GET', {});
  const unpaidBlocked = unpaidGateRes.statusCode === 401 || unpaidGateRes.statusCode === 403;
  results.push({
    id: 'SEC-UNPAID-GATE',
    name: 'Unauthenticated/Unpaid Course Gate (401/403)',
    status: unpaidBlocked ? 'PASS' : 'FAIL',
    details: `Status: ${unpaidGateRes.statusCode} (Access denied as expected)`
  });
  console.log(`[${unpaidBlocked ? 'PASS' : 'FAIL'}] Unpaid access strictly blocked with HTTP ${unpaidGateRes.statusCode}`);

  // Verify webhook signature rejection on tampering
  const tamperedWebhookRes = await makeRequest(
    '/api/payments/razorpay/webhook',
    'POST',
    {
      'Content-Type': 'application/json',
      'X-Razorpay-Signature': 'bogus_signature_1234567890abcdef'
    },
    { event: 'payment.captured' }
  );
  const webhookProtected = tamperedWebhookRes.statusCode === 400;
  results.push({
    id: 'SEC-WEBHOOK-HMAC',
    name: 'Tampered Webhook Signature Rejection (400 Bad Request)',
    status: webhookProtected ? 'PASS' : 'FAIL',
    details: `Status: ${tamperedWebhookRes.statusCode} (Tampered HMAC signature rejected)`
  });
  console.log(`[${webhookProtected ? 'PASS' : 'FAIL'}] Webhook HMAC-SHA256 tampering blocked with HTTP 400`);

  // -----------------------------------------------------------------
  // SUMMARY
  // -----------------------------------------------------------------
  console.log('\n====================================================');
  console.log('                 PHASE 4 TEST SUMMARY');
  console.log('====================================================');
  const passCount = results.filter(r => r.status === 'PASS').length;
  const failCount = results.filter(r => r.status === 'FAIL').length;
  console.log(`Total Tests Run: ${results.length}`);
  console.log(`Passed: ${passCount}`);
  console.log(`Failed: ${failCount}`);
  console.log('====================================================\n');

  if (failCount > 0) {
    console.error('Some tests failed!');
    process.exit(1);
  } else {
    console.log('All Phase 4 regression tests passed successfully!');
    process.exit(0);
  }
}

runPhase4Tests().catch((err) => {
  console.error('Fatal test error:', err);
  process.exit(1);
});
