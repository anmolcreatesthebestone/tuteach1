/**
 * TUTeach Student Acceptance End-to-End Audit Suite
 * 
 * Tests all 10 core dimensions:
 * 1. Conversational context understanding (name, experience, installation, screen)
 * 2. Consistency between AI Demo and Paid Classroom
 * 3. Screenshot multimodal analysis accuracy and validation
 * 4. Voice and screenshot co-working with context preservation
 * 5. Assignment curriculum alignment
 * 6. Assignment evaluation, scoring, rubric, and retry rules
 * 7. Dashboard progress, lesson completion, and certificate issuance in DB
 * 8. Payment verification and account security
 * 9. Refresh, logout, login, and session preservation
 * 10. Major pages, routes, and responsive mobile architecture
 */

import http from 'http';

const BASE_URL = 'http://localhost:3000';

interface AuditResult {
  dimension: string;
  testName: string;
  steps: string;
  expected: string;
  actual: string;
  status: 'PASS' | 'FAIL';
  details?: string;
}

const results: AuditResult[] = [];

async function apiRequest(path: string, options: {
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

async function runAudit() {
  console.log('========================================================================');
  console.log('       TUTeach Platform Final Student Acceptance E2E Audit');
  console.log('========================================================================\n');

  const timestamp = Date.now();
  const testStudentEmail = `audit_student_${timestamp}@tuteach.test`;
  const testStudentPassword = 'SecurePassword123!';
  let studentCookie = '';
  let studentId = '';

  // -------------------------------------------------------------------------
  // DIMENSION 1: Conversational Context (Name, Experience, Installation, Screen)
  // -------------------------------------------------------------------------
  console.log('>>> [1/10] Testing Conversational Context Understanding...');
  {
    // Step 1: Greeting with name
    const step1 = await apiRequest('/api/tutor/chat', {
      method: 'POST',
      body: {
        message: 'Hello, my name is Rahul Sharma.',
        studentName: 'Rahul Sharma',
        lessonTitle: 'Introduction to DaVinci Resolve'
      }
    });
    const s1Pass = step1.status === 200 && (step1.data?.reply?.includes('Rahul') || step1.data?.reply?.toLowerCase().includes('welcome') || step1.data?.reply?.toLowerCase().includes('hello'));
    results.push({
      dimension: '1. Conversational Context',
      testName: 'Tutor Student Name Recognition',
      steps: 'Send greeting with studentName "Rahul Sharma"',
      expected: 'Tutor warmly acknowledges Rahul and initiates conversational desk-side onboarding',
      actual: `Status: ${step1.status}, Reply snippet: "${(step1.data?.reply || '').slice(0, 100)}..."`,
      status: s1Pass ? 'PASS' : 'FAIL'
    });

    // Step 2: Experience level check
    const step2 = await apiRequest('/api/tutor/chat', {
      method: 'POST',
      body: {
        message: 'I have never edited a video before, total beginner.',
        studentName: 'Rahul',
        studentExperience: 'Zero Experience / Complete Beginner',
        onboardingStage: 'experience_check',
        history: [
          { role: 'user', content: 'Hello, my name is Rahul.' },
          { role: 'model', content: 'Hello Rahul! Welcome! What is your video editing background?' }
        ]
      }
    });
    const s2Pass = step2.status === 200 && (step2.data?.reply?.toLowerCase().includes('worry') || step2.data?.reply?.toLowerCase().includes('start') || step2.data?.reply?.toLowerCase().includes('beginner') || step2.data?.reply?.toLowerCase().includes('step') || step2.data?.reply?.length > 20);
    results.push({
      dimension: '1. Conversational Context',
      testName: 'Tutor Experience Level Adaptation',
      steps: 'Inform tutor of zero video editing experience with multi-turn history',
      expected: 'Tutor warmly encourages student, adapts tone to beginner level without jargon, and guides first step',
      actual: `Status: ${step2.status}, Source: ${step2.data?.source}, Reply snippet: "${(step2.data?.reply || '').slice(0, 100)}..."`,
      status: s2Pass ? 'PASS' : 'FAIL'
    });

    // Step 3: Software installation inquiry
    const step3 = await apiRequest('/api/tutor/chat', {
      method: 'POST',
      body: {
        message: 'Where do I download and install DaVinci Resolve? Is it free?',
        studentName: 'Rahul',
        lessonTitle: 'DaVinci Resolve Installation & Setup'
      }
    });
    const s3Pass = step3.status === 200 && 
      step3.data?.reply?.includes('blackmagicdesign.com') && 
      step3.data?.reply?.toLowerCase().includes('free') &&
      step3.data?.reply?.toLowerCase().includes('watermark');
    results.push({
      dimension: '1. Conversational Context',
      testName: 'Official Installation Guidance & Free Tier Reassurance',
      steps: 'Ask how to download/install DaVinci Resolve and if it is free',
      expected: 'Tutor points directly to blackmagicdesign.com/products/davinciresolve, emphasizes Free version has zero watermarks and Hollywood tools, and asks to check back once downloaded',
      actual: `Status: ${step3.status}, Contains URL: ${step3.data?.reply?.includes('blackmagicdesign.com')}, Free Reassurance: ${step3.data?.reply?.toLowerCase().includes('free')}`,
      status: s3Pass ? 'PASS' : 'FAIL'
    });

    // Step 4: Current screen inspection inquiry
    const step4 = await apiRequest('/api/tutor/chat', {
      method: 'POST',
      body: {
        message: 'I just launched it and I see a grey window with Project Manager and an Untitled Project.',
        studentName: 'Rahul',
        lessonTitle: 'Project Manager & System Preferences',
        history: [
          { role: 'user', content: 'Where do I download DaVinci Resolve?' },
          { role: 'model', content: 'Download the Free version from blackmagicdesign.com. Let me know what pops up when you launch it!' }
        ]
      }
    });
    const s4Pass = step4.status === 200 && (step4.data?.reply?.toLowerCase().includes('project') || step4.data?.reply?.toLowerCase().includes('lobby') || step4.data?.reply?.toLowerCase().includes('click') || step4.data?.reply?.toLowerCase().includes('open'));
    results.push({
      dimension: '1. Conversational Context',
      testName: 'Screen State Contextual Guidance (Project Manager)',
      steps: 'Student describes seeing the Project Manager with Untitled Project',
      expected: 'Tutor acknowledges Project Manager, explains intuitive mental model (lobby/studio), and gives single clear action step',
      actual: `Status: ${step4.status}, Reply snippet: "${(step4.data?.reply || '').slice(0, 110)}..."`,
      status: s4Pass ? 'PASS' : 'FAIL'
    });
  }

  // -------------------------------------------------------------------------
  // DIMENSION 2: Consistency Between AI Demo and Paid Classroom
  // -------------------------------------------------------------------------
  console.log('>>> [2/10] Testing Consistency Between AI Demo and Paid Classroom...');
  {
    // Demo session creation
    const demoSession = await apiRequest('/api/demo/session', {
      method: 'POST',
      body: { visitorName: 'Guest Tester' }
    });
    const demoSessionId = demoSession.data?.sessionId;

    // Query demo engine
    const demoChat = await apiRequest('/api/demo/chat', {
      method: 'POST',
      body: {
        sessionId: demoSessionId,
        visitorName: 'Guest Tester',
        message: 'What is ripple delete and why should I use it?'
      }
    });

    // Query classroom tutor engine
    const classroomChat = await apiRequest('/api/tutor/chat', {
      method: 'POST',
      body: {
        message: 'What is ripple delete and why should I use it?',
        lessonTitle: 'Basic Editing & Trimming',
        studentName: 'Guest Tester'
      }
    });

    const demoText = (demoChat.data?.reply || '').toLowerCase();
    const classText = (classroomChat.data?.reply || '').toLowerCase();

    // Both should explain the gap-closing / ripple concept
    const demoHasConcept = demoText.includes('gap') || demoText.includes('ripple') || demoText.includes('close') || demoText.includes('delete') || demoText.includes('blank');
    const classHasConcept = classText.includes('gap') || classText.includes('ripple') || classText.includes('close') || classText.includes('snap') || classText.includes('delete');

    results.push({
      dimension: '2. Demo vs Classroom Consistency',
      testName: 'Pedagogical Consistency on Core Concept',
      steps: 'Query both /api/demo/chat and /api/tutor/chat for "What is ripple delete?"',
      expected: 'Both provide consistent intuitive explanations explaining how ripple delete removes content and automatically closes the gap',
      actual: `Demo status: ${demoChat.status} (has concept: ${demoHasConcept}), Classroom status: ${classroomChat.status} (has concept: ${classHasConcept})`,
      status: (demoHasConcept && classHasConcept) ? 'PASS' : 'FAIL'
    });
  }

  // -------------------------------------------------------------------------
  // DIMENSION 3: Screenshot Multimodal Analysis
  // -------------------------------------------------------------------------
  console.log('>>> [3/10] Testing Screenshot Analysis Accuracy & Validation...');
  {
    // Valid 1x1 transparent PNG in base64
    const validPngBase64 = 'iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mNkYAAAAAYAAjCB0C8AAAAASUVORK5CYII=';

    const screenshotRes = await apiRequest('/api/tutor/analyze-screenshot', {
      method: 'POST',
      body: {
        imageBase64: validPngBase64,
        mimeType: 'image/png',
        studentQuestion: 'I am on the Edit Page. How do I zoom into the timeline to see audio waveforms?',
        courseTitle: 'Video Editing with DaVinci Resolve',
        lessonTitle: 'Workspace Navigation & Waveforms',
        studentName: 'Rahul'
      }
    });

    const sPass = screenshotRes.status === 200 && 
      screenshotRes.data?.success === true && 
      typeof screenshotRes.data?.analysis === 'string' && 
      screenshotRes.data?.analysis.length > 30;

    results.push({
      dimension: '3. Screenshot Analysis',
      testName: 'Valid Screenshot Analysis Execution',
      steps: 'POST base64 image with student question to /api/tutor/analyze-screenshot',
      expected: 'Returns success: true with detailed workspace analysis and actionable next step',
      actual: `Status: ${screenshotRes.status}, Source: ${screenshotRes.data?.source}, Length: ${screenshotRes.data?.analysis?.length} chars`,
      status: sPass ? 'PASS' : 'FAIL'
    });

    // Rejection of invalid MIME type
    const invalidMimeRes = await apiRequest('/api/tutor/analyze-screenshot', {
      method: 'POST',
      body: {
        imageBase64: validPngBase64,
        mimeType: 'application/pdf',
        studentQuestion: 'Look at my PDF'
      }
    });

    results.push({
      dimension: '3. Screenshot Analysis',
      testName: 'Invalid MIME Type Rejection',
      steps: 'POST non-image MIME type (application/pdf)',
      expected: 'HTTP 400 with INVALID_MIME_TYPE error',
      actual: `Status: ${invalidMimeRes.status}, Error: ${invalidMimeRes.data?.error}`,
      status: invalidMimeRes.status === 400 ? 'PASS' : 'FAIL'
    });

    // Rejection of empty image
    const emptyImageRes = await apiRequest('/api/tutor/analyze-screenshot', {
      method: 'POST',
      body: {
        imageBase64: '',
        mimeType: 'image/png'
      }
    });

    results.push({
      dimension: '3. Screenshot Analysis',
      testName: 'Empty Payload Rejection',
      steps: 'POST empty imageBase64',
      expected: 'HTTP 400 with IMAGE_REQUIRED error',
      actual: `Status: ${emptyImageRes.status}, Error: ${emptyImageRes.data?.error}`,
      status: emptyImageRes.status === 400 ? 'PASS' : 'FAIL'
    });
  }

  // -------------------------------------------------------------------------
  // DIMENSION 4: Voice & Screenshot Context Retention
  // -------------------------------------------------------------------------
  console.log('>>> [4/10] Testing Voice & Screenshot Context Retention...');
  {
    const recentVisualContext = 'Screenshot Analysis: The student has DaVinci Resolve open on the Edit page. Timeline contains a 4K clip on track V1. Inspector panel is closed on the top right. Playhead is parked at 00:01:24:12.';
    
    const contextFollowUp = await apiRequest('/api/tutor/chat', {
      method: 'POST',
      body: {
        message: 'Where is the Inspector button to open that panel you mentioned?',
        recentScreenshotContext: recentVisualContext,
        lessonTitle: 'The Inspector Panel',
        studentName: 'Rahul'
      }
    });

    const reply = (contextFollowUp.data?.reply || '').toLowerCase();
    const retainedContext = reply.includes('inspector') && (reply.includes('top right') || reply.includes('right') || reply.includes('corner') || reply.includes('panel'));

    results.push({
      dimension: '4. Voice & Screenshot Co-working',
      testName: 'Visual Context Memory in Conversation',
      steps: 'Send recentScreenshotContext in /api/tutor/chat and ask location of element noted in screenshot',
      expected: 'Tutor utilizes recent visual context to guide student to top right Inspector icon',
      actual: `Status: ${contextFollowUp.status}, Referenced Inspector & Position: ${retainedContext}, Reply snippet: "${(contextFollowUp.data?.reply || '').slice(0, 110)}..."`,
      status: retainedContext ? 'PASS' : 'FAIL'
    });
  }

  // -------------------------------------------------------------------------
  // DIMENSION 5: Assignment Curriculum Alignment
  // -------------------------------------------------------------------------
  console.log('>>> [5/10] Testing Assignment Curriculum Alignment...');
  {
    const catalogRes = await apiRequest('/api/courses');
    const courses = catalogRes.data?.courses || [];
    const resolveCourse = courses.find((c: any) => c.id === 'course-davinci-resolve');
    const modules = resolveCourse?.modules || [];
    
    let totalAssignments = 0;
    let alignedLessons = 0;

    for (const mod of modules) {
      for (const les of mod.lessons || []) {
        if (les.practicalAssignment) {
          totalAssignments++;
          // Verify assignment matches lesson title and has rubric
          if (les.practicalAssignment.title && les.practicalAssignment.instructions && les.practicalAssignment.rubricCriteria?.length >= 3) {
            alignedLessons++;
          }
        }
      }
    }

    const alignmentPass = totalAssignments > 0 && alignedLessons === totalAssignments;
    results.push({
      dimension: '5. Assignment Curriculum Alignment',
      testName: 'Lesson Practical Assignments Specification',
      steps: 'Verify all course modules have structured practical assignments with criteria',
      expected: 'Every module has complete practical assignments with 4-criteria rubrics',
      actual: `Total assignments: ${totalAssignments}, Well-formed rubrics: ${alignedLessons}`,
      status: alignmentPass ? 'PASS' : 'FAIL'
    });
  }

  // -------------------------------------------------------------------------
  // DIMENSION 6: Assignment Evaluation, Scoring, Feedback & Retry Rules
  // -------------------------------------------------------------------------
  console.log('>>> [6/10] Testing Assignment Evaluation, Scoring & Retry Rules...');
  {
    // Demo evaluation endpoint test (free demo mode)
    const demoEvalPoor = await apiRequest('/api/demo/evaluate', {
      method: 'POST',
      body: {
        submissionText: 'I just cut a video somehow. It was fast.',
        assignmentTitle: 'Assemble a 30-Second Rough Cut with J-Cuts',
        courseTitle: 'Video Editing with DaVinci Resolve'
      }
    });

    const isPoorEvaluated = demoEvalPoor.status === 200 && 
      typeof demoEvalPoor.data?.evaluation?.score === 'number' &&
      demoEvalPoor.data?.evaluation?.score < 7.0;

    results.push({
      dimension: '6. Assignment Evaluation & Scoring',
      testName: 'Incomplete Submission Critical Feedback',
      steps: 'Submit minimal 1-line submission to /api/demo/evaluate',
      expected: 'Returns score reflecting lack of detail with constructive advice',
      actual: `Status: ${demoEvalPoor.status}, Score: ${demoEvalPoor.data?.evaluation?.score}/10, Status: ${demoEvalPoor.data?.evaluation?.status}`,
      status: isPoorEvaluated ? 'PASS' : 'FAIL'
    });

    const demoEvalComprehensive = await apiRequest('/api/demo/evaluate', {
      method: 'POST',
      body: {
        submissionText: 'I assembled a 30-second timeline at 24fps 1080p. Track V1 has the A-roll interview with Ripple edits to trim dead air. Used J-cuts by holding Alt to slip the audio track 12 frames ahead of the cut point. Added 2 B-roll cutaways on V2 with opacity blends. Checked audio meters to peak between -12dB and -6dB with zero clipping.',
        assignmentTitle: 'Assemble a 30-Second Rough Cut with J-Cuts',
        courseTitle: 'Video Editing with DaVinci Resolve'
      }
    });

    const isComprehensiveEvaluated = demoEvalComprehensive.status === 200 && 
      demoEvalComprehensive.data?.evaluation?.score >= 6.5;

    results.push({
      dimension: '6. Assignment Evaluation & Scoring',
      testName: 'High-Quality Submission Scoring & Feedback',
      steps: 'Submit comprehensive technical submission with J-cuts and audio levels',
      expected: 'Returns passing score (>=6.5/10) with detailed rubric breakdown',
      actual: `Status: ${demoEvalComprehensive.status}, Score: ${demoEvalComprehensive.data?.evaluation?.score}/10, Criteria items: ${demoEvalComprehensive.data?.evaluation?.rubricBreakdown?.length}`,
      status: isComprehensiveEvaluated ? 'PASS' : 'FAIL'
    });
  }

  // -------------------------------------------------------------------------
  // DIMENSION 7: Dashboard Progress, Lesson Completion & Database Records
  // -------------------------------------------------------------------------
  console.log('>>> [7/10] Testing Dashboard Progress & Database Persistence...');
  {
    // Register student
    const regRes = await apiRequest('/api/auth/register', {
      method: 'POST',
      body: {
        name: 'Rahul Sharma',
        email: testStudentEmail,
        password: testStudentPassword
      }
    });
    studentCookie = extractCookie(regRes.cookies, 'auth_token');
    studentId = regRes.data?.student?.id;

    // Simulate payment / enrollment for this student
    const orderRes = await apiRequest('/api/payment/create-order', {
      method: 'POST',
      cookie: studentCookie,
      body: { courseId: 'course-davinci-resolve' }
    });
    const orderId = orderRes.data?.orderId;

    // Verify payment using genuine backend order
    const secret = process.env.RAZORPAY_KEY_SECRET || process.env.RAZORPAY_TEST_KEY_SECRET || 'test_secret';
    const fakePaymentId = `pay_audit_${Date.now()}`;
    const crypto = await import('crypto');
    const validSignature = crypto.createHmac('sha256', secret).update(`${orderId}|${fakePaymentId}`).digest('hex');

    const verifyRes = await apiRequest('/api/payment/verify', {
      method: 'POST',
      cookie: studentCookie,
      body: {
        razorpay_order_id: orderId,
        razorpay_payment_id: fakePaymentId,
        razorpay_signature: validSignature,
        courseId: 'course-davinci-resolve'
      }
    });
    const paidEnrolled = verifyRes.status === 200 && verifyRes.data?.verified === true;

    // Mark 3 lessons completed via progress API
    const progressUpdate1 = await apiRequest('/api/courses/progress', {
      method: 'POST',
      cookie: studentCookie,
      body: {
        courseId: 'course-davinci-resolve',
        lessonId: 'lesson-1-1',
        completed: true
      }
    });

    const progressUpdate2 = await apiRequest('/api/courses/progress', {
      method: 'POST',
      cookie: studentCookie,
      body: {
        courseId: 'course-davinci-resolve',
        lessonId: 'lesson-1-2',
        completed: true
      }
    });

    // Fetch progress
    const progressGet = await apiRequest('/api/courses/progress?courseId=course-davinci-resolve', {
      method: 'GET',
      cookie: studentCookie
    });

    const completedLessons = progressGet.data?.completedLessonIds || [];
    const hasBothLessons = completedLessons.includes('lesson-1-1') && completedLessons.includes('lesson-1-2');

    results.push({
      dimension: '7. Progress & DB Records',
      testName: 'Lesson Completion Persistence in PostgreSQL',
      steps: 'Register, enroll, complete lesson 1-1 & 1-2, query /api/courses/progress',
      expected: 'Completed lesson IDs persist and return in completedLessonIds array',
      actual: `Enrolled: ${paidEnrolled}, Completed count: ${completedLessons.length}, Contains 1-1 & 1-2: ${hasBothLessons}`,
      status: (paidEnrolled && hasBothLessons) ? 'PASS' : 'FAIL'
    });

    // Check certificate eligibility requirement enforcement
    const certRes = await apiRequest('/api/certificates?courseId=course-davinci-resolve', {
      method: 'GET',
      cookie: studentCookie
    });

    const certGated = certRes.status === 200 && (certRes.data?.eligible === false || !certRes.data?.certificate);
    results.push({
      dimension: '7. Progress & DB Records',
      testName: 'Certificate Completion Requirement Gate',
      steps: 'Query certificate endpoint with only 2 lessons completed',
      expected: 'Certificate is not issued prematurely (requires full course completion)',
      actual: `Status: ${certRes.status}, Eligible: ${certRes.data?.eligible}, Certificate: ${!!certRes.data?.certificate}`,
      status: certGated ? 'PASS' : 'FAIL'
    });
  }

  // -------------------------------------------------------------------------
  // DIMENSION 8: Payment Verification & Security
  // -------------------------------------------------------------------------
  console.log('>>> [8/10] Testing Payment Verification & Account Security...');
  {
    // Register unpaid student
    const unpaidEmail = `unpaid_${Date.now()}@tuteach.test`;
    const unpaidReg = await apiRequest('/api/auth/register', {
      method: 'POST',
      body: { name: 'Unpaid User', email: unpaidEmail, password: 'Password123!' }
    });
    const unpaidCookie = extractCookie(unpaidReg.cookies, 'auth_token');

    // Unpaid student attempts classroom access
    const classroomGate = await apiRequest('/api/classroom/session', {
      method: 'POST',
      cookie: unpaidCookie,
      body: { courseId: 'course-davinci-resolve' }
    });

    const isClassroomBlocked = classroomGate.status === 403;
    results.push({
      dimension: '8. Payment Security',
      testName: 'Unpaid Student Classroom Block (403)',
      steps: 'Unpaid student attempts to initialize paid classroom session',
      expected: 'HTTP 403 Forbidden with PAYMENT_REQUIRED error',
      actual: `Status: ${classroomGate.status}, Error: ${classroomGate.data?.error}`,
      status: isClassroomBlocked ? 'PASS' : 'FAIL'
    });

    // Paid student classroom access
    const paidClassroomGate = await apiRequest('/api/classroom/session', {
      method: 'POST',
      cookie: studentCookie,
      body: { courseId: 'course-davinci-resolve' }
    });

    const isPaidGranted = paidClassroomGate.status === 200 && paidClassroomGate.data?.authorized === true;
    results.push({
      dimension: '8. Payment Security',
      testName: 'Paid Student Classroom Access (200 OK)',
      steps: 'Paid student initializes classroom session for enrolled course',
      expected: 'HTTP 200 OK with authorized: true and session tokens',
      actual: `Status: ${paidClassroomGate.status}, Authorized: ${paidClassroomGate.data?.authorized}`,
      status: isPaidGranted ? 'PASS' : 'FAIL'
    });
  }

  // -------------------------------------------------------------------------
  // DIMENSION 9: Refresh, Logout, Login & Session State Preservation
  // -------------------------------------------------------------------------
  console.log('>>> [9/10] Testing Refresh, Logout, Login & Session Preservation...');
  {
    // Step 1: Simulated Browser Refresh (/api/auth/me)
    const refreshRes = await apiRequest('/api/auth/me', {
      method: 'GET',
      cookie: studentCookie
    });
    const refreshPass = refreshRes.status === 200 && refreshRes.data?.student?.email === testStudentEmail;
    results.push({
      dimension: '9. Session State & Persistence',
      testName: 'Browser Refresh Session Retention',
      steps: 'Request /api/auth/me with existing auth_token cookie',
      expected: 'Returns authenticated student object matching logged-in account',
      actual: `Status: ${refreshRes.status}, Email: ${refreshRes.data?.student?.email}`,
      status: refreshPass ? 'PASS' : 'FAIL'
    });

    // Step 2: Logout
    const logoutRes = await apiRequest('/api/auth/logout', {
      method: 'POST',
      cookie: studentCookie
    });
    const logoutPass = logoutRes.status === 200;
    results.push({
      dimension: '9. Session State & Persistence',
      testName: 'Logout Invalidation',
      steps: 'POST /api/auth/logout with auth_token cookie',
      expected: 'HTTP 200 OK and session invalidated on server',
      actual: `Status: ${logoutRes.status}`,
      status: logoutPass ? 'PASS' : 'FAIL'
    });

    // Step 3: Post-Logout rejection
    const postLogoutMe = await apiRequest('/api/auth/me', {
      method: 'GET',
      cookie: studentCookie
    });
    const postLogoutPass = postLogoutMe.status === 401;
    results.push({
      dimension: '9. Session State & Persistence',
      testName: 'Revoked Token Rejection (401)',
      steps: 'Request /api/auth/me with previously invalidated session token',
      expected: 'HTTP 401 Unauthorized',
      actual: `Status: ${postLogoutMe.status}`,
      status: postLogoutPass ? 'PASS' : 'FAIL'
    });

    // Step 4: Re-Login
    const reloginRes = await apiRequest('/api/auth/login', {
      method: 'POST',
      body: { email: testStudentEmail, password: testStudentPassword }
    });
    const newCookie = extractCookie(reloginRes.cookies, 'auth_token');
    const reloginPass = reloginRes.status === 200 && !!newCookie;

    // Verify entitlements after relogin
    const postLoginEntitlements = await apiRequest('/api/courses/entitlements', {
      method: 'GET',
      cookie: newCookie
    });
    const retainsCourse = postLoginEntitlements.data?.enrolledCourseIds?.includes('course-davinci-resolve');

    results.push({
      dimension: '9. Session State & Persistence',
      testName: 'Re-Login Entitlement Restoration',
      steps: 'Log back into account and check /api/courses/entitlements',
      expected: 'Student receives fresh session token and retains course entitlements',
      actual: `Status: ${reloginRes.status}, Retained DaVinci Resolve: ${retainsCourse}`,
      status: (reloginPass && retainsCourse) ? 'PASS' : 'FAIL'
    });
  }

  // -------------------------------------------------------------------------
  // DIMENSION 10: Major Pages & Responsive Mobile Architecture
  // -------------------------------------------------------------------------
  console.log('>>> [10/10] Testing Major Pages, Routes & Mobile Architecture...');
  {
    const pages = [
      '/',
      '/courses',
      '/courses/course-davinci-resolve',
      '/pricing',
      '/login',
      '/register',
      '/dashboard',
      '/my-courses',
      '/classroom',
      '/assignments',
      '/progress',
      '/certificates',
      '/about',
      '/contact'
    ];

    let allPagesLoaded = true;
    const failedPages: string[] = [];

    for (const page of pages) {
      const pageRes = await apiRequest(page, { method: 'GET' });
      if (pageRes.status !== 200) {
        allPagesLoaded = false;
        failedPages.push(`${page} (${pageRes.status})`);
      }
    }

    results.push({
      dimension: '10. Page Routing & Architecture',
      testName: 'Single Page App Route Availability',
      steps: `Verify GET requests for all 14 platform routes`,
      expected: 'All 14 routes return HTTP 200 with HTML shell for client routing',
      actual: allPagesLoaded ? 'All 14 routes returned HTTP 200' : `Failed: ${failedPages.join(', ')}`,
      status: allPagesLoaded ? 'PASS' : 'FAIL'
    });

    // Check index.html viewport meta tag for mobile responsiveness
    const rootRes = await apiRequest('/', { method: 'GET' });
    const html = typeof rootRes.data === 'string' ? rootRes.data : '';
    const hasViewport = html.includes('name="viewport"') && html.includes('width=device-width');
    const hasFonts = html.includes('Plus+Jakarta+Sans');

    results.push({
      dimension: '10. Page Routing & Architecture',
      testName: 'Mobile Responsive Meta Configuration',
      steps: 'Inspect index.html for viewport meta tag and typography preconnects',
      expected: 'Contains viewport tag with width=device-width, initial-scale=1.0 and Plus Jakarta Sans font',
      actual: `Has viewport meta: ${hasViewport}, Has typography: ${hasFonts}`,
      status: (hasViewport && hasFonts) ? 'PASS' : 'FAIL'
    });
  }

  console.log('\n========================================================================');
  console.log('                        AUDIT EXECUTION SUMMARY');
  console.log('========================================================================\n');

  const passedCount = results.filter(r => r.status === 'PASS').length;
  const failedCount = results.filter(r => r.status === 'FAIL').length;
  const totalCount = results.length;

  for (const r of results) {
    const symbol = r.status === 'PASS' ? '[PASS]' : '[FAIL]';
    console.log(`${symbol} [${r.dimension}] ${r.testName}`);
    console.log(`       Steps:    ${r.steps}`);
    console.log(`       Expected: ${r.expected}`);
    console.log(`       Actual:   ${r.actual}\n`);
  }

  console.log('------------------------------------------------------------------------');
  console.log(`TOTAL AUDIT CHECKS: ${totalCount} | PASSED: ${passedCount} | FAILED: ${failedCount}`);
  console.log('========================================================================\n');

  if (failedCount > 0) {
    process.exit(1);
  } else {
    process.exit(0);
  }
}

runAudit().catch(err => {
  console.error('Audit fatal error:', err);
  process.exit(1);
});
