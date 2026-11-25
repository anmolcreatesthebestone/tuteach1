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

async function sleep(ms: number) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

async function runSecurityScenarios() {
  console.log('\n======================================================');
  console.log('TUTeach Payment Failure, Cancellation & Security Test Suite');
  console.log('======================================================\n');

  let passed = 0;
  let failed = 0;

  function assert(testName: string, condition: boolean, details?: string) {
    if (condition) {
      console.log(`[PASS] ${testName}`);
      passed++;
    } else {
      console.error(`[FAIL] ${testName} - ${details || 'Condition failed'}`);
      failed++;
    }
  }

  const runId = crypto.randomBytes(3).toString('hex');
  const webhookSecret = process.env.RAZORPAY_WEBHOOK_SECRET || process.env.RAZORPAY_KEY_SECRET || 'tuteach_dev_webhook_secret';

  // =========================================================================
  // 1. FAILED PAYMENT TESTING
  // =========================================================================
  console.log('--- 1. Failed Payment Testing ---');
  const emailCharlie = `charlie_${runId}@tuteach.ai`;
  const passCharlie = 'CharlieSecure#2026';

  const regCharlie = await request('/api/auth/register', {
    method: 'POST',
    body: {
      name: 'Charlie Brown',
      email: emailCharlie,
      password: passCharlie,
      countryCode: 'IN',
      dateOfBirth: '1998-02-10',
      acceptedPolicies: true
    }
  });
  assert('Charlie registered cleanly', regCharlie.status === 200);
  const tokenCharlie = regCharlie.data.token;
  const charlieId = regCharlie.data.user?.id;

  // Create order for Charlie
  const orderCharlie = await request('/api/payments/razorpay/create-order', {
    method: 'POST',
    headers: { 'Authorization': `Bearer ${tokenCharlie}` },
    body: { courseId: 'course-davinci-resolve', acceptedCheckoutPolicies: true }
  });
  assert('Charlie order created', orderCharlie.status === 200 && !!orderCharlie.data.orderId);
  const charlieOrderId = orderCharlie.data.orderId;

  // Simulate payment failure callback from Razorpay (e.g. simulated Failure or bank decline)
  const failRef = `pay_fail_${runId}`;
  const recordFailRes = await request('/api/payments/razorpay/record-failure', {
    method: 'POST',
    headers: { 'Authorization': `Bearer ${tokenCharlie}` },
    body: {
      razorpay_order_id: charlieOrderId,
      razorpay_payment_id: failRef,
      error_code: 'BAD_REQUEST_ERROR',
      error_description: 'Payment was declined by the issuing bank due to simulated failure.',
      error_reason: 'payment_declined',
      courseId: 'course-davinci-resolve'
    }
  });
  assert('Payment failure record endpoint returns 200', recordFailRes.status === 200);

  // Check payment status endpoint (unauthenticated rejected, owner allowed)
  const unauthPayStatus = await request(`/api/payments/status/${charlieOrderId}`);
  assert('Unauthenticated payment status request rejected with 401', unauthPayStatus.status === 401);

  const charliePayStatus = await request(`/api/payments/status/${charlieOrderId}`, {
    headers: { 'Authorization': `Bearer ${tokenCharlie}` }
  });
  assert('Payment status in DB is recorded as FAILED', charliePayStatus.status === 200 && charliePayStatus.data.status === 'FAILED');
  assert('Payment is NOT recorded as successfully captured', charliePayStatus.data.receipt?.status === 'FAILED');

  // Verify Charlie does NOT have course access
  const charlieEntitlements = await request('/api/payments/entitlements', {
    headers: { 'Authorization': `Bearer ${tokenCharlie}` }
  });
  assert('Charlie entitlements list is empty', charlieEntitlements.data.entitledCourseIds?.length === 0);

  const charlieAccessGate = await request('/api/courses/course-davinci-resolve/verify-access', {
    headers: { 'Authorization': `Bearer ${tokenCharlie}` }
  });
  assert('Course access gate blocks Charlie with 403 Forbidden', charlieAccessGate.status === 403 && charlieAccessGate.data.accessGranted === false);

  // Try forged/failed signature verification
  const forgedSigRes = await request('/api/payments/razorpay/verify-signature', {
    method: 'POST',
    headers: { 'Authorization': `Bearer ${tokenCharlie}` },
    body: {
      razorpay_order_id: charlieOrderId,
      razorpay_payment_id: failRef,
      razorpay_signature: 'invalid_forged_signature_hex_0000',
      courseId: 'course-davinci-resolve'
    }
  });
  assert('Tampered/forged signature verification rejected with 400', forgedSigRes.status === 400 && forgedSigRes.data.verified === false);

  // =========================================================================
  // 2. CANCELLED PAYMENT TESTING
  // =========================================================================
  console.log('\n--- 2. Cancelled Payment Testing ---');
  const emailDana = `dana_${runId}@tuteach.ai`;
  const passDana = 'DanaSecure#2026';

  const regDana = await request('/api/auth/register', {
    method: 'POST',
    body: {
      name: 'Dana Scully',
      email: emailDana,
      password: passDana,
      countryCode: 'IN',
      dateOfBirth: '1997-08-20',
      acceptedPolicies: true
    }
  });
  assert('Dana registered cleanly', regDana.status === 200);
  const tokenDana = regDana.data.token;

  // Dana creates an order (modal opens)
  const orderDana = await request('/api/payments/razorpay/create-order', {
    method: 'POST',
    headers: { 'Authorization': `Bearer ${tokenDana}` },
    body: { courseId: 'course-davinci-resolve', acceptedCheckoutPolicies: true }
  });
  assert('Dana order created', orderDana.status === 200 && !!orderDana.data.orderId);
  const danaOrderId = orderDana.data.orderId;

  // Dana closes checkout modal without paying (modal.ondismiss) - no verify or success call is made
  // Verify order in database remains PENDING, never SUCCESS (and Charlie cannot view Dana's order)
  const crossStatusAttempt = await request(`/api/payments/status/${danaOrderId}`, {
    headers: { 'Authorization': `Bearer ${tokenCharlie}` }
  });
  assert('Cross-student payment status inspection rejected with 403', crossStatusAttempt.status === 403);

  const danaPayStatus = await request(`/api/payments/status/${danaOrderId}`, {
    headers: { 'Authorization': `Bearer ${tokenDana}` }
  });
  assert('Order status remains PENDING in database', danaPayStatus.status === 200 && danaPayStatus.data.status === 'PENDING');

  // Verify course remains locked for Dana
  const danaEntitlements = await request('/api/payments/entitlements', {
    headers: { 'Authorization': `Bearer ${tokenDana}` }
  });
  assert('Dana entitlements list is empty', danaEntitlements.data.entitledCourseIds?.length === 0);

  const danaAccessGate = await request('/api/courses/course-davinci-resolve/verify-access', {
    headers: { 'Authorization': `Bearer ${tokenDana}` }
  });
  assert('Course access gate blocks Dana with 403 Forbidden', danaAccessGate.status === 403 && danaAccessGate.data.accessGranted === false);

  // =========================================================================
  // 3. DUPLICATE PAYMENT & IDEMPOTENCY PROTECTION
  // =========================================================================
  console.log('\n--- 3. Duplicate Payment Protection ---');
  const emailEvan = `evan_${runId}@tuteach.ai`;
  const passEvan = 'EvanSecure#2026';

  const regEvan = await request('/api/auth/register', {
    method: 'POST',
    body: {
      name: 'Evan Wright',
      email: emailEvan,
      password: passEvan,
      countryCode: 'IN',
      dateOfBirth: '1996-11-05',
      acceptedPolicies: true
    }
  });
  assert('Evan registered cleanly', regEvan.status === 200);
  const tokenEvan = regEvan.data.token;

  const evanOrderId = `order_dup_${runId}`;
  const evanPaymentId = `pay_dup_${runId}`;

  // Pre-register pending order for Evan
  const evanPending = await request('/api/test/create-pending-order', {
    method: 'POST',
    headers: { 'Authorization': `Bearer ${tokenEvan}` },
    body: { orderId: evanOrderId, courseId: 'course-davinci-resolve' }
  });
  assert('Evan pending order initialized in DB', evanPending.status === 200);

  // Create valid Razorpay webhook payload
  const webhookBody = JSON.stringify({
    event: 'payment.captured',
    payload: {
      payment: {
        entity: {
          id: evanPaymentId,
          order_id: evanOrderId,
          amount: 49900,
          currency: 'INR',
          status: 'captured',
          method: 'upi'
        }
      }
    }
  });

  const webhookSignature = crypto
    .createHmac('sha256', webhookSecret)
    .update(Buffer.from(webhookBody))
    .digest('hex');

  // Send Webhook notification 1
  const whRes1 = await request('/api/payments/razorpay/webhook', {
    method: 'POST',
    headers: {
      'x-razorpay-signature': webhookSignature,
      'x-test-secret': webhookSecret
    },
    body: webhookBody
  });
  assert('Webhook 1 processed successfully (200 OK)', whRes1.status === 200);

  // Send duplicate Webhook notification 2 (simulating Razorpay retry)
  const whRes2 = await request('/api/payments/razorpay/webhook', {
    method: 'POST',
    headers: {
      'x-razorpay-signature': webhookSignature,
      'x-test-secret': webhookSecret
    },
    body: webhookBody
  });
  assert('Duplicate Webhook 2 processed idempotently (200 OK)', whRes2.status === 200);

  // Send duplicate Webhook notification 3
  const whRes3 = await request('/api/payments/razorpay/webhook', {
    method: 'POST',
    headers: {
      'x-razorpay-signature': webhookSignature,
      'x-test-secret': webhookSecret
    },
    body: webhookBody
  });
  assert('Duplicate Webhook 3 processed idempotently (200 OK)', whRes3.status === 200);

  // Verify Evan's entitlements in DB
  const evanEntitlements = await request('/api/payments/entitlements', {
    headers: { 'Authorization': `Bearer ${tokenEvan}` }
  });
  const evanCourses = evanEntitlements.data.entitledCourseIds || [];
  const davinciCount = evanCourses.filter((c: string) => c === 'course-davinci-resolve').length;
  assert('Evan has course unlocked', evanCourses.includes('course-davinci-resolve'));
  assert('Enrollment count is exactly 1 (no duplicate enrollments)', davinciCount === 1);

  // Verify payment status in DB remains SUCCESS
  const evanPayStatus = await request(`/api/payments/status/${evanOrderId}`, {
    headers: { 'Authorization': `Bearer ${tokenEvan}` }
  });
  assert('Payment status remains SUCCESS', evanPayStatus.status === 200 && evanPayStatus.data.status === 'SUCCESS');

  // Compute valid cryptographic signature for duplicate verification call using test secret
  const verifySecret = webhookSecret || 'tuteach_dev_webhook_secret';
  const validPaymentSig = crypto
    .createHmac('sha256', verifySecret)
    .update(`${evanOrderId}|${evanPaymentId}`)
    .digest('hex');

  // Verify duplicate verify-signature request is handled idempotently
  const dupVerifyRes = await request('/api/payments/razorpay/verify-signature', {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${tokenEvan}`,
      'x-test-secret': verifySecret
    },
    body: {
      razorpay_order_id: evanOrderId,
      razorpay_payment_id: evanPaymentId,
      razorpay_signature: validPaymentSig,
      courseId: 'course-davinci-resolve'
    }
  });
  assert('Duplicate verification handles existing record gracefully (isDuplicate: true)', dupVerifyRes.status === 200 && dupVerifyRes.data.isDuplicate === true);

  // =========================================================================
  // 4. ACCOUNT ISOLATION
  // =========================================================================
  console.log('\n--- 4. Account Isolation ---');
  const emailFrank = `frank_${runId}@tuteach.ai`;
  const passFrank = 'FrankSecure#2026';
  const emailGrace = `grace_${runId}@tuteach.ai`;
  const passGrace = 'GraceSecure#2026';

  const regFrank = await request('/api/auth/register', {
    method: 'POST',
    body: {
      name: 'Frank Miller',
      email: emailFrank,
      password: passFrank,
      countryCode: 'IN',
      dateOfBirth: '1995-03-14',
      acceptedPolicies: true
    }
  });
  const tokenFrank = regFrank.data.token;
  const frankId = regFrank.data.user?.id;

  const regGrace = await request('/api/auth/register', {
    method: 'POST',
    body: {
      name: 'Grace Hopper',
      email: emailGrace,
      password: passGrace,
      countryCode: 'IN',
      dateOfBirth: '1994-12-09',
      acceptedPolicies: true
    }
  });
  const tokenGrace = regGrace.data.token;
  const graceId = regGrace.data.user?.id;

  assert('Frank and Grace have different permanent student IDs', frankId !== graceId);

  // Frank purchases the course
  const frankEnroll = await request('/api/test/enroll-verified', {
    method: 'POST',
    headers: { 'Authorization': `Bearer ${tokenFrank}` },
    body: { courseId: 'course-davinci-resolve' }
  });
  assert('Frank purchased course successfully', frankEnroll.status === 200 && frankEnroll.data.success === true);

  // Frank access check
  const frankAccess = await request('/api/courses/course-davinci-resolve/verify-access', {
    headers: { 'Authorization': `Bearer ${tokenFrank}` }
  });
  assert('Frank access granted (200 OK)', frankAccess.status === 200 && frankAccess.data.accessGranted === true);

  // Grace access check
  const graceAccess = await request('/api/courses/course-davinci-resolve/verify-access', {
    headers: { 'Authorization': `Bearer ${tokenGrace}` }
  });
  assert('Grace access denied (403 Forbidden)', graceAccess.status === 403 && graceAccess.data.accessGranted === false);

  const graceEnts = await request('/api/payments/entitlements', {
    headers: { 'Authorization': `Bearer ${tokenGrace}` }
  });
  assert('Grace has 0 entitlements', graceEnts.data.entitledCourseIds?.length === 0);

  // Grace cannot access AI Tutor endpoint for DaVinci Resolve
  const graceTutor = await request('/api/tutor/evaluate-assignment', {
    method: 'POST',
    headers: { 'Authorization': `Bearer ${tokenGrace}` },
    body: {
      courseId: 'course-davinci-resolve',
      lessonTitle: 'Color Grading',
      assignmentPrompt: 'Grade clip to Rec.709',
      studentSubmission: 'Adjusted lift gamma gain'
    }
  });
  assert('Grace blocked from AI Tutor evaluation (403 Payment Required)', graceTutor.status === 403 && graceTutor.data.error === 'PAYMENT_REQUIRED');

  // Frank accepts Pre-Use AI Disclosure and accesses AI Tutor endpoint
  await request('/api/compliance/ai-disclosure', {
    method: 'POST',
    headers: { 'Authorization': `Bearer ${tokenFrank}` }
  });
  const frankTutor = await request('/api/tutor/evaluate-assignment', {
    method: 'POST',
    headers: { 'Authorization': `Bearer ${tokenFrank}` },
    body: {
      courseId: 'course-davinci-resolve',
      lessonTitle: 'Color Grading',
      assignmentPrompt: 'Grade clip to Rec.709',
      studentSubmission: 'Adjusted lift gamma gain properly'
    }
  });
  assert('Frank allowed to use AI Tutor evaluation (200 OK)', frankTutor.status === 200 && !!frankTutor.data.evaluation);

  // =========================================================================
  // 5. PERSISTENCE ACROSS RE-LOGIN
  // =========================================================================
  console.log('\n--- 5. Persistence Across Session Re-Login ---');

  // Logout Frank
  const logoutFrank = await request('/api/auth/logout', {
    method: 'POST',
    headers: { 'Authorization': `Bearer ${tokenFrank}` }
  });
  assert('Frank logged out (200 OK)', logoutFrank.status === 200);

  // Verify old token is revoked
  const checkOldToken = await request('/api/auth/me', {
    headers: { 'Authorization': `Bearer ${tokenFrank}` }
  });
  assert('Old session token is revoked (401 Unauthorized)', checkOldToken.status === 401);

  // Re-login Frank with email and password
  const reloginFrank = await request('/api/auth/login', {
    method: 'POST',
    body: { email: emailFrank, password: passFrank }
  });
  assert('Frank re-login with password succeeded (200 OK)', reloginFrank.status === 200 && !!reloginFrank.data.token);
  const newFrankToken = reloginFrank.data.token;

  // Verify persistent course access after re-login
  const frankRecheckEnts = await request('/api/payments/entitlements', {
    headers: { 'Authorization': `Bearer ${newFrankToken}` }
  });
  assert('Frank persistent entitlement intact after re-login', frankRecheckEnts.data.entitledCourseIds?.includes('course-davinci-resolve'));

  const frankRecheckAccess = await request('/api/courses/course-davinci-resolve/verify-access', {
    headers: { 'Authorization': `Bearer ${newFrankToken}` }
  });
  assert('Frank access gate intact after re-login (200 OK)', frankRecheckAccess.status === 200 && frankRecheckAccess.data.accessGranted === true);

  // Confirm database files exist on disk
  const dataDir = path.resolve(process.cwd(), 'data', 'postgres');
  const pgControlExists = fs.existsSync(path.join(dataDir, 'global', 'pg_control'));
  assert('PostgreSQL database cluster exists on persistent disk', pgControlExists);

  console.log('\n======================================================');
  console.log(`Security Test Results: ${passed} PASSED, ${failed} FAILED`);
  console.log('======================================================\n');

  if (failed > 0) {
    process.exit(1);
  } else {
    process.exit(0);
  }
}

runSecurityScenarios().catch(err => {
  console.error('Fatal test error:', err);
  process.exit(1);
});
