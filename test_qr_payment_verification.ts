import http from 'http';
import crypto from 'crypto';

const BASE_URL = 'http://localhost:3000';

interface StepResult {
  step: string;
  expected: string;
  actual: string;
  pass: boolean;
}

const auditSteps: StepResult[] = [];

async function api(path: string, options: {
  method?: string;
  headers?: Record<string, string>;
  body?: any;
  cookie?: string;
} = {}): Promise<{ status: number; data: any; headers: any; cookies: string[] }> {
  return new Promise((resolve, reject) => {
    const url = new URL(path, BASE_URL);
    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
      ...(options.headers || {})
    };
    if (options.cookie) {
      headers['Cookie'] = options.cookie;
    }

    const payload = options.body ? (typeof options.body === 'string' ? options.body : JSON.stringify(options.body)) : null;
    if (payload) {
      headers['Content-Length'] = Buffer.byteLength(payload).toString();
    }

    const req = http.request(url, {
      method: options.method || 'GET',
      headers
    }, (res) => {
      let body = '';
      res.on('data', chunk => body += chunk);
      res.on('end', () => {
        let parsed = body;
        try {
          parsed = JSON.parse(body);
        } catch {}
        const setCookie = res.headers['set-cookie'] || [];
        resolve({
          status: res.statusCode || 0,
          data: parsed,
          headers: res.headers,
          cookies: Array.isArray(setCookie) ? setCookie : [setCookie]
        });
      });
    });

    req.on('error', reject);
    if (payload) req.write(payload);
    req.end();
  });
}

function extractCookie(cookies: string[], name: string): string {
  for (const c of cookies) {
    const match = c.match(new RegExp(`${name}=([^;]+)`));
    if (match) return `${name}=${match[1]}`;
  }
  return '';
}

async function run() {
  console.log('================================================================');
  console.log('   TUTeach Razorpay QR & Payment Flow Diagnostic Test Suite');
  console.log('================================================================\n');

  // 1. Identify Razorpay Mode & Gateway Configuration
  const configRes = await api('/api/payments/razorpay/config');
  const isTestMode = configRes.data?.mode === 'TEST';
  const keyId = configRes.data?.keyId || '';
  const isTestKey = keyId.startsWith('rzp_test_');

  auditSteps.push({
    step: '1. Razorpay Gateway Mode Inspection',
    expected: 'Gateway is configured in TEST mode with rzp_test_* key ID',
    actual: `mode: "${configRes.data?.mode}", keyId: "${keyId.slice(0, 12)}..."`,
    pass: isTestMode && isTestKey
  });

  // 2. Register Student with Custom Name
  const timestamp = Date.now();
  const testEmail = `student_${timestamp}@tuteach.test`;
  const studentRealName = 'Rohan Deshmukh';

  const regRes = await api('/api/auth/register', {
    method: 'POST',
    body: {
      name: studentRealName,
      email: testEmail,
      password: 'StrongPassword123!',
      countryCode: 'IN',
      dateOfBirth: '1999-05-15',
      acceptedPolicies: true
    }
  });

  const sessionCookie = extractCookie(regRes.cookies, 'tuteach_session');
  const token = regRes.data?.token || '';
  const registeredName = regRes.data?.user?.name;

  auditSteps.push({
    step: '2. Authenticated Student Registration (No Hardcoded Fallback)',
    expected: `Student registered with dynamic name "${studentRealName}"`,
    actual: `HTTP ${regRes.status}, Name: "${registeredName}", Email: "${testEmail}"`,
    pass: regRes.status === 200 && registeredName === studentRealName && !!sessionCookie
  });

  // 3. Create Order & Verify Student Identity in Order Notes
  const orderRes = await api('/api/payments/razorpay/create-order', {
    method: 'POST',
    cookie: sessionCookie,
    headers: {
      'Authorization': `Bearer ${token}`
    },
    body: { courseId: 'course-davinci-resolve', acceptedCheckoutPolicies: true }
  });

  const orderId = orderRes.data?.orderId;
  const amountPaise = orderRes.data?.amountPaise;
  const amountInr = orderRes.data?.amount;

  auditSteps.push({
    step: '3. Order Creation & ₹499 Price Enforcement',
    expected: 'Order created with exactly 49900 paise (₹499 INR) linked to authenticated student',
    actual: `HTTP ${orderRes.status}, OrderId: ${orderId}, Amount: ₹${amountInr} (${amountPaise} paise)`,
    pass: orderRes.status === 200 && amountPaise === 49900 && amountInr === 499
  });

  // 4. Verify Unpaid Student Course Gate
  const unpaidGate = await api('/api/courses/course-davinci-resolve/verify-access', {
    method: 'GET',
    cookie: sessionCookie,
    headers: {
      'Authorization': `Bearer ${token}`
    }
  });

  auditSteps.push({
    step: '4. Course Access Gate Before Payment',
    expected: 'Access blocked with HTTP 403 Forbidden before payment',
    actual: `HTTP ${unpaidGate.status}, Error: ${unpaidGate.data?.error}`,
    pass: unpaidGate.status === 403
  });

  // 5. Tampered Webhook Signature Rejection
  const webhookSecret = process.env.RAZORPAY_WEBHOOK_SECRET || process.env.RAZORPAY_KEY_SECRET || 'tuteach_dev_webhook_secret';
  const paymentId = `pay_diag_${timestamp}`;

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

  const badWebhookRes = await api('/api/payments/razorpay/webhook', {
    method: 'POST',
    headers: {
      'x-razorpay-signature': 'forged_invalid_signature_hex_code',
      'x-test-secret': webhookSecret
    },
    body: webhookPayload
  });

  auditSteps.push({
    step: '5. Tampered Signature Rejection',
    expected: 'Tampered webhook signature rejected with 400 Bad Request',
    actual: `HTTP ${badWebhookRes.status}`,
    pass: badWebhookRes.status === 400
  });

  // 6. Valid Cryptographic Webhook Processing & Enrollment
  const validWebhookSig = crypto
    .createHmac('sha256', webhookSecret)
    .update(Buffer.from(webhookPayload))
    .digest('hex');

  const goodWebhookRes = await api('/api/payments/razorpay/webhook', {
    method: 'POST',
    headers: {
      'x-razorpay-signature': validWebhookSig,
      'x-test-secret': webhookSecret
    },
    body: webhookPayload
  });

  auditSteps.push({
    step: '6. Genuine Signature Verification & Enrollment',
    expected: 'Payment captured and student enrolled in DaVinci Resolve (HTTP 200)',
    actual: `HTTP ${goodWebhookRes.status}`,
    pass: goodWebhookRes.status === 200
  });

  // 7. Duplicate Payment Webhook & Signature Idempotency
  const dupWebhookRes = await api('/api/payments/razorpay/webhook', {
    method: 'POST',
    headers: {
      'x-razorpay-signature': validWebhookSig,
      'x-test-secret': webhookSecret
    },
    body: webhookPayload
  });

  const clientSig = crypto
    .createHmac('sha256', webhookSecret)
    .update(`${orderId}|${paymentId}`)
    .digest('hex');

  const dupClientVerify = await api('/api/payments/razorpay/verify-signature', {
    method: 'POST',
    cookie: sessionCookie,
    headers: {
      'Authorization': `Bearer ${token}`,
      'x-test-secret': webhookSecret
    },
    body: {
      razorpay_order_id: orderId,
      razorpay_payment_id: paymentId,
      razorpay_signature: clientSig,
      courseId: 'course-davinci-resolve'
    }
  });

  const dupSuccess = dupWebhookRes.status === 200 && dupClientVerify.status === 200 && dupClientVerify.data?.isDuplicate === true;

  auditSteps.push({
    step: '7. Duplicate Payment Protection & Idempotency',
    expected: 'Duplicate webhook and client verify requests succeed idempotently without duplicate records',
    actual: `Webhook status: ${dupWebhookRes.status}, Client verify isDuplicate: ${dupClientVerify.data?.isDuplicate}`,
    pass: dupSuccess
  });

  // 8. Paid Classroom Session Authorization
  const paidGate = await api('/api/courses/course-davinci-resolve/verify-access', {
    method: 'GET',
    cookie: sessionCookie,
    headers: {
      'Authorization': `Bearer ${token}`
    }
  });

  auditSteps.push({
    step: '8. Course Access Gate After Payment',
    expected: 'Paid student granted entry (HTTP 200 accessGranted: true)',
    actual: `HTTP ${paidGate.status}, accessGranted: ${paidGate.data?.accessGranted}`,
    pass: paidGate.status === 200 && paidGate.data?.accessGranted === true
  });

  // 9. Verify Student B Isolation
  const studentBEmail = `student_b_${timestamp}@tuteach.test`;
  const regB = await api('/api/auth/register', {
    method: 'POST',
    body: {
      name: 'Pooja Iyer',
      email: studentBEmail,
      password: 'StrongPassword123!',
      countryCode: 'IN',
      dateOfBirth: '1998-09-21',
      acceptedPolicies: true
    }
  });
  const cookieB = extractCookie(regB.cookies, 'tuteach_session');
  const tokenB = regB.data?.token || '';

  const gateB = await api('/api/courses/course-davinci-resolve/verify-access', {
    method: 'GET',
    cookie: cookieB,
    headers: {
      'Authorization': `Bearer ${tokenB}`
    }
  });

  auditSteps.push({
    step: '9. Student Account Isolation',
    expected: 'Separate unpaid student B remains firmly blocked with 403',
    actual: `HTTP ${gateB.status}, Error: ${gateB.data?.error}`,
    pass: gateB.status === 403
  });

  console.log('\n--- AUDIT RESULTS ---');
  let allPass = true;
  for (const res of auditSteps) {
    const mark = res.pass ? '[PASS]' : '[FAIL]';
    if (!res.pass) allPass = false;
    console.log(`${mark} ${res.step}`);
    console.log(`       Expected: ${res.expected}`);
    console.log(`       Actual:   ${res.actual}\n`);
  }

  console.log('----------------------------------------------------------------');
  console.log(`Total Checks: ${auditSteps.length} | All Passed: ${allPass}`);
  console.log('================================================================\n');

  process.exit(allPass ? 0 : 1);
}

run().catch(err => {
  console.error('Fatal test error:', err);
  process.exit(1);
});
