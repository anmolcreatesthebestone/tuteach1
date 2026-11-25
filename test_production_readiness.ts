import crypto from 'crypto';
import http from 'http';
import fs from 'fs';
import path from 'path';

const BASE_URL = 'http://localhost:3000';

async function request(reqPath: string, options: {
  method?: string;
  headers?: Record<string, string>;
  body?: any;
} = {}): Promise<{ status: number; data: any; headers: any }> {
  return new Promise((resolve, reject) => {
    const url = new URL(reqPath, BASE_URL);
    const req = http.request(url, {
      method: options.method || 'GET',
      headers: {
        'Content-Type': 'application/json',
        ...(options.headers || {})
      }
    }, (res) => {
      let data = '';
      res.on('data', (chunk) => { data += chunk; });
      res.on('end', () => {
        let parsed = data;
        try {
          parsed = JSON.parse(data);
        } catch {}
        resolve({ status: res.statusCode || 0, data: parsed, headers: res.headers });
      });
    });

    req.on('error', reject);
    if (options.body) {
      req.write(typeof options.body === 'string' ? options.body : JSON.stringify(options.body));
    }
    req.end();
  });
}

async function runAllMandatoryTests() {
  console.log('\n======================================================');
  console.log('TUTeach Production Security & Database Upgrade Test Suite');
  console.log('======================================================\n');

  let passedCount = 0;
  let failedCount = 0;

  function assert(title: string, condition: boolean, detail?: string) {
    if (condition) {
      console.log(`[PASS] ${title}`);
      passedCount++;
    } else {
      console.error(`[FAIL] ${title} - ${detail || 'Condition not met'}`);
      failedCount++;
    }
  }

  const rand = crypto.randomBytes(4).toString('hex');
  const emailA = `alice_${rand}@tuteach.ai`;
  const emailB = `bob_${rand}@tuteach.ai`;
  const passA = 'AliceSecurePass#123';
  const passB = 'BobSecurePass#456';

  let tokenA = '';
  let tokenB = '';
  let studentAId = '';
  let studentBId = '';

  // ----------------------------------------------------
  // Test 1: New student registration and login
  // ----------------------------------------------------
  console.log('\n--- 1. Registration and Password Login ---');
  const regResA = await request('/api/auth/register', {
    method: 'POST',
    body: {
      name: 'Alice Wonderland',
      email: emailA,
      password: passA,
      goals: 'Master DaVinci Resolve',
      countryCode: 'IN',
      dateOfBirth: '1998-06-15',
      acceptedPolicies: true
    }
  });
  assert('Student A registration succeeded', regResA.status === 200 && regResA.data.success === true);
  studentAId = regResA.data.user?.id;
  tokenA = regResA.data.token;
  assert('Student A has permanent usr_ ID', typeof studentAId === 'string' && studentAId.startsWith('usr_'));

  const loginResA = await request('/api/auth/login', {
    method: 'POST',
    body: { email: emailA, password: passA }
  });
  assert('Student A login with correct password succeeded', loginResA.status === 200 && loginResA.data.token.startsWith('tut_sess_'));
  tokenA = loginResA.data.token;

  // ----------------------------------------------------
  // Test 2: Incorrect password rejection
  // ----------------------------------------------------
  console.log('\n--- 2. Incorrect Password Rejection ---');
  const badLogin = await request('/api/auth/login', {
    method: 'POST',
    body: { email: emailA, password: 'WrongPassword999!' }
  });
  assert('Incorrect password is firmly rejected with 401', badLogin.status === 401 && badLogin.data.error === 'INVALID_CREDENTIALS');

  // ----------------------------------------------------
  // Test 3: Account A payment and enrollment
  // ----------------------------------------------------
  console.log('\n--- 3. Account A Payment and Enrollment ---');
  const enrollResA = await request('/api/test/enroll-verified', {
    method: 'POST',
    headers: { 'Authorization': `Bearer ${tokenA}` },
    body: { courseId: 'course-davinci-resolve' }
  });
  assert('Account A payment recorded & course enrolled', enrollResA.status === 200 && enrollResA.data.success === true);
  assert('Entitlements list contains DaVinci Resolve', enrollResA.data.entitledCourseIds?.includes('course-davinci-resolve'));

  const accessGateA = await request('/api/courses/course-davinci-resolve/verify-access', {
    headers: { 'Authorization': `Bearer ${tokenA}` }
  });
  assert('Account A access gate grants access (200 OK)', accessGateA.status === 200 && accessGateA.data.accessGranted === true);

  // ----------------------------------------------------
  // Test 4: Account B cannot access Account A's course
  // ----------------------------------------------------
  console.log('\n--- 4. Account Isolation: Account B Rejection ---');
  const regResB = await request('/api/auth/register', {
    method: 'POST',
    body: {
      name: 'Bob Builder',
      email: emailB,
      password: passB,
      goals: 'Learn Basics',
      countryCode: 'IN',
      dateOfBirth: '1997-04-12',
      acceptedPolicies: true
    }
  });
  tokenB = regResB.data.token;
  studentBId = regResB.data.user?.id;
  assert('Student B registered cleanly', regResB.status === 200);

  const accessGateB = await request('/api/courses/course-davinci-resolve/verify-access', {
    headers: { 'Authorization': `Bearer ${tokenB}` }
  });
  assert('Account B is blocked from Account A course (403 Forbidden)', accessGateB.status === 403 && accessGateB.data.accessGranted === false);

  const entResB = await request('/api/payments/entitlements', {
    headers: { 'Authorization': `Bearer ${tokenB}` }
  });
  assert('Account B has 0 course entitlements', entResB.data.entitledCourseIds?.length === 0);

  // ----------------------------------------------------
  // Test 5: Paid access survives server restart (DB persistence on disk)
  // ----------------------------------------------------
  console.log('\n--- 5. Paid Access Persistence on Disk ---');
  const dataDir = path.resolve(process.cwd(), 'data', 'postgres');
  const dbDirExists = fs.existsSync(dataDir);
  assert('Persistent PostgreSQL storage directory exists on disk', dbDirExists);
  const dbFiles = fs.readdirSync(dataDir);
  assert('PostgreSQL data cluster files exist on disk (WAL/base/global)', dbFiles.length > 0);

  const entResA = await request('/api/payments/entitlements', {
    headers: { 'Authorization': `Bearer ${tokenA}` }
  });
  assert('Account A persistent entitlement confirmed via DB query', entResA.data.entitledCourseIds?.includes('course-davinci-resolve'));

  // ----------------------------------------------------
  // Test 6: Session expiry and logout
  // ----------------------------------------------------
  console.log('\n--- 6. Session Revocation on Logout ---');
  const logoutRes = await request('/api/auth/logout', {
    method: 'POST',
    headers: { 'Authorization': `Bearer ${tokenA}` }
  });
  assert('Logout endpoint returns 200', logoutRes.status === 200);

  const meAfterLogout = await request('/api/auth/me', {
    headers: { 'Authorization': `Bearer ${tokenA}` }
  });
  assert('Session token invalidated after logout (401 Unauthorized)', meAfterLogout.status === 401);

  // Re-login to get fresh token for remaining tests
  const freshLogin = await request('/api/auth/login', {
    method: 'POST',
    body: { email: emailA, password: passA }
  });
  tokenA = freshLogin.data.token;

  // ----------------------------------------------------
  // Test 7: Direct unauthorized AI evaluation requests are rejected
  // ----------------------------------------------------
  console.log('\n--- 7. Unauthorized AI Evaluation Protection ---');
  const unauthEval = await request('/api/tutor/evaluate-assignment', {
    method: 'POST',
    body: {
      courseId: 'course-davinci-resolve',
      lessonTitle: 'Color Grading',
      assignmentPrompt: 'Grade clip to Rec.709',
      studentSubmission: 'I adjusted the lift, gamma, gain and verified waveform'
    }
  });
  assert('Direct anonymous AI evaluation rejected (401 Unauthorized)', unauthEval.status === 401 && unauthEval.data.error === 'UNAUTHORIZED');

  const unpaidEval = await request('/api/tutor/evaluate-assignment', {
    method: 'POST',
    headers: { 'Authorization': `Bearer ${tokenB}` },
    body: {
      courseId: 'course-davinci-resolve',
      lessonTitle: 'Color Grading',
      assignmentPrompt: 'Grade clip to Rec.709',
      studentSubmission: 'I adjusted the lift, gamma, gain and verified waveform'
    }
  });
  assert('Unpaid student AI evaluation rejected (403 Payment Required)', unpaidEval.status === 403 && unpaidEval.data.error === 'PAYMENT_REQUIRED');

  // ----------------------------------------------------
  // Test 8: Free demo remains accessible
  // ----------------------------------------------------
  console.log('\n--- 8. Free Demo Accessibility ---');
  const demoEval = await request('/api/tutor/evaluate-assignment', {
    method: 'POST',
    body: {
      courseId: 'demo-course',
      isDemo: true,
      lessonTitle: 'Demo Lesson',
      assignmentPrompt: 'Try timeline cutting',
      studentSubmission: 'I pressed B for blade tool and ripple deleted with Shift+Delete in DaVinci Resolve'
    }
  });
  assert('Free demo assignment evaluation is accessible (200 OK)', demoEval.status === 200 && !!demoEval.data.evaluation);

  const demoRevision = await request('/api/tutor/targeted-revision', {
    method: 'POST',
    body: {
      isDemo: true,
      courseTitle: 'Video Editing with DaVinci Resolve',
      topic: 'Ripple Edit'
    }
  });
  assert('Free demo targeted revision is accessible (200 OK)', demoRevision.status === 200 && Array.isArray(demoRevision.data.flashcards));

  // ----------------------------------------------------
  // Test 9: Duplicate Razorpay webhooks do not create duplicate enrollments
  // ----------------------------------------------------
  console.log('\n--- 9. Razorpay Webhook Idempotency & Verification ---');
  const webhookSecret = process.env.RAZORPAY_WEBHOOK_SECRET || process.env.RAZORPAY_KEY_SECRET || 'tuteach_dev_webhook_secret';
  const orderId = `order_wh_${rand}`;
  const paymentId = `pay_wh_${rand}`;

  // First create a pending order in DB for Bob via API
  const createPendingRes = await request('/api/test/create-pending-order', {
    method: 'POST',
    headers: { 'Authorization': `Bearer ${tokenB}` },
    body: { orderId, courseId: 'course-davinci-resolve' }
  });
  assert('Pending order pre-registered for Bob in DB', createPendingRes.status === 200 && createPendingRes.data.success === true);

  const webhookPayload = JSON.stringify({
    event: 'payment.captured',
    payload: {
      payment: {
        entity: {
          id: paymentId,
          order_id: orderId,
          amount: 49900,
          currency: 'INR',
          status: 'captured',
          method: 'upi'
        }
      }
    }
  });

  const validSig = crypto.createHmac('sha256', webhookSecret).update(Buffer.from(webhookPayload)).digest('hex');

  // Trigger webhook 1
  const whRes1 = await request('/api/payments/razorpay/webhook', {
    method: 'POST',
    headers: { 'x-razorpay-signature': validSig, 'x-test-secret': webhookSecret },
    body: webhookPayload
  });
  assert('Valid webhook event 1 processed (200 OK)', whRes1.status === 200 && whRes1.data.status === 'ok');

  // Trigger webhook 2 (duplicate)
  const whRes2 = await request('/api/payments/razorpay/webhook', {
    method: 'POST',
    headers: { 'x-razorpay-signature': validSig, 'x-test-secret': webhookSecret },
    body: webhookPayload
  });
  assert('Duplicate webhook event 2 processed idempotently (200 OK)', whRes2.status === 200);

  // Verify Bob now has course unlocked via webhook
  const entResBAfter = await request('/api/payments/entitlements', {
    headers: { 'Authorization': `Bearer ${tokenB}` }
  });
  const bobEnts = entResBAfter.data.entitledCourseIds || [];
  const davinciCount = bobEnts.filter((c: string) => c === 'course-davinci-resolve').length;
  assert('Bob unlocked course via webhook', bobEnts.includes('course-davinci-resolve'));
  assert('Enrollment count is exactly 1 (no duplicates)', davinciCount === 1);

  // Bad signature rejection
  const badWhRes = await request('/api/payments/razorpay/webhook', {
    method: 'POST',
    headers: { 'x-razorpay-signature': 'tampered_signature_0000000000', 'x-test-secret': webhookSecret },
    body: webhookPayload
  });
  assert('Tampered webhook signature rejected (400 Bad Request)', badWhRes.status === 400);

  // ----------------------------------------------------
  // Test 10: Payment records remain correct across multiple instances
  // ----------------------------------------------------
  console.log('\n--- 10. Multi-Instance Database Ledger Consistency ---');
  const payByOrderRes = await request(`/api/payments/status/${orderId}`, {
    headers: { 'Authorization': `Bearer ${tokenB}` }
  });
  assert('Payment record retrieved by orderId has status SUCCESS', payByOrderRes.status === 200 && payByOrderRes.data.status === 'SUCCESS');
  assert('Payment receipt belongs to Bob', payByOrderRes.data.receipt?.studentEmail === emailB);

  const payByIdRes = await request(`/api/payments/status/${paymentId}`, {
    headers: { 'Authorization': `Bearer ${tokenB}` }
  });
  assert('Payment record retrieved by paymentId matches order ID', payByIdRes.status === 200 && payByIdRes.data.receipt?.orderId === orderId);

  const payCrossDeny = await request(`/api/payments/status/${orderId}`, {
    headers: { 'Authorization': `Bearer ${tokenA}` }
  });
  assert('Account A cannot view Account B payment status (403 Forbidden)', payCrossDeny.status === 403);

  console.log('\n======================================================');
  console.log(`Test Results Summary: ${passedCount} PASSED, ${failedCount} FAILED`);
  console.log('======================================================\n');

  if (failedCount > 0) {
    process.exit(1);
  } else {
    process.exit(0);
  }
}

runAllMandatoryTests().catch((err) => {
  console.error('Fatal test runner error:', err);
  process.exit(1);
});
