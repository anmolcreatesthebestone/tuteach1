import http from 'http';

const BASE_URL = 'http://localhost:3000';

async function api(path: string, options: {
  method?: string;
  headers?: Record<string, string>;
  body?: any;
} = {}): Promise<{ status: number; data: any; durationMs: number }> {
  return new Promise((resolve, reject) => {
    const url = new URL(path, BASE_URL);
    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
      ...(options.headers || {})
    };
    const payload = options.body ? JSON.stringify(options.body) : null;
    if (payload) {
      headers['Content-Length'] = Buffer.byteLength(payload).toString();
    }

    const start = Date.now();
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
        resolve({
          status: res.statusCode || 0,
          data: parsed,
          durationMs: Date.now() - start
        });
      });
    });

    req.on('error', reject);
    if (payload) req.write(payload);
    req.end();
  });
}

interface TestReport {
  id: string;
  name: string;
  steps: string;
  expected: string;
  actual: string;
  status: 'PASS' | 'FAIL' | 'NOT TESTED';
  source?: string;
  durationMs?: number;
}

const reports: TestReport[] = [];

async function runAudit() {
  console.log('========================================================================');
  console.log('   TUTeach Golu Guru Deep Conversational Intelligence Diagnostic');
  console.log('========================================================================\n');

  // -------------------------------------------------------------------------
  // 1. CONTEXT AWARENESS TESTS (Tests A through E)
  // -------------------------------------------------------------------------
  console.log('--- 1. Context Awareness Tests ---');

  // Test A: Name statement ("Rohan.")
  const testA = await api('/api/tutor/chat', {
    method: 'POST',
    body: {
      message: 'Rohan.',
      history: [
        { role: 'model', content: "Hello! Welcome to TUTeach. What is your name?" }
      ],
      lessonTitle: 'Introduction to DaVinci Resolve',
      courseTitle: 'Video Editing with DaVinci Resolve'
    }
  });
  const textA = testA.data?.reply || '';
  const passA = !textA.toLowerCase().includes('great question') && 
                (textA.toLowerCase().includes('rohan') || textA.toLowerCase().includes('meet') || textA.toLowerCase().includes('welcome'));
  reports.push({
    id: 'TEST-A',
    name: 'Direct Name Recognition without Question Misclassification',
    steps: 'Teacher asks "What is your name?", Student replies "Rohan."',
    expected: 'Acknowledges name warmly ("Nice to meet you, Rohan!"), never calls "Rohan" a question',
    actual: textA,
    status: passA ? 'PASS' : 'FAIL',
    source: testA.data?.source,
    durationMs: testA.durationMs
  });

  // Test B: Beginner confirmation ("Yes.")
  const testB = await api('/api/tutor/chat', {
    method: 'POST',
    body: {
      message: 'Yes.',
      history: [
        { role: 'model', content: "Are you a beginner to video editing?" }
      ],
      studentName: 'Rohan',
      lessonTitle: 'Introduction to DaVinci Resolve'
    }
  });
  const textB = testB.data?.reply || '';
  const passB = !textB.toLowerCase().includes('great question') && 
                (textB.toLowerCase().includes('beginner') || textB.toLowerCase().includes('start') || textB.toLowerCase().includes('step') || textB.toLowerCase().includes('zero'));
  reports.push({
    id: 'TEST-B',
    name: 'Affirmative Answer to Pedagogical Check ("Yes.")',
    steps: 'Teacher asks "Are you a beginner?", Student replies "Yes."',
    expected: 'Understands confirmation, adapts lesson to beginner, never treats "Yes" as a question',
    actual: textB,
    status: passB ? 'PASS' : 'FAIL',
    source: testB.data?.source,
    durationMs: testB.durationMs
  });

  // Test C: Software not installed ("Not yet.")
  const testC = await api('/api/tutor/chat', {
    method: 'POST',
    body: {
      message: 'Not yet.',
      history: [
        { role: 'model', content: "Do you have DaVinci Resolve installed on your computer?" }
      ],
      studentName: 'Rohan',
      lessonTitle: 'Introduction & Installation'
    }
  });
  const textC = testC.data?.reply || '';
  const passC = textC.toLowerCase().includes('download') || textC.toLowerCase().includes('blackmagic') || textC.toLowerCase().includes('install') || textC.toLowerCase().includes('free');
  reports.push({
    id: 'TEST-C',
    name: 'Negative Answer to Software Installation ("Not yet.")',
    steps: 'Teacher asks "Is DaVinci Resolve installed?", Student replies "Not yet."',
    expected: 'Offers clear installation link & setup guidance without judgment',
    actual: textC,
    status: passC ? 'PASS' : 'FAIL',
    source: testC.data?.source,
    durationMs: testC.durationMs
  });

  // Test D: Seeing the timeline ("Yes, I can.")
  const testD = await api('/api/tutor/chat', {
    method: 'POST',
    body: {
      message: 'Yes, I can.',
      history: [
        { role: 'model', content: "Look down at the lower section. Can you see the timeline area?" }
      ],
      studentName: 'Rohan',
      lessonTitle: 'Workspace Navigation'
    }
  });
  const textD = testD.data?.reply || '';
  const passD = !textD.toLowerCase().includes('great question') && 
                !textD.toLowerCase().includes('can you see the timeline') &&
                (textD.toLowerCase().includes('next') || textD.toLowerCase().includes('track') || textD.toLowerCase().includes('clip') || textD.toLowerCase().includes('click') || textD.toLowerCase().includes('tool'));
  reports.push({
    id: 'TEST-D',
    name: 'Visual Confirmation ("Yes, I can.")',
    steps: 'Teacher asks "Can you see the timeline?", Student replies "Yes, I can."',
    expected: 'Advances to next instruction without repeating the timeline question or calling it a question',
    actual: textD,
    status: passD ? 'PASS' : 'FAIL',
    source: testD.data?.source,
    durationMs: testD.durationMs
  });

  // Test E: Conceptual explanation ("Why is the timeline important?")
  const testE = await api('/api/tutor/chat', {
    method: 'POST',
    body: {
      message: 'Why is the timeline important?',
      studentName: 'Rohan',
      lessonTitle: 'Workspace Navigation'
    }
  });
  const textE = testE.data?.reply || '';
  const passE = textE.toLowerCase().includes('timeline') && 
                (textE.toLowerCase().includes('film') || textE.toLowerCase().includes('sequence') || textE.toLowerCase().includes('arrange') || textE.toLowerCase().includes('workbench') || textE.toLowerCase().includes('order'));
  reports.push({
    id: 'TEST-E',
    name: 'Pedagogical Explanation: Importance of Timeline',
    steps: 'Student asks "Why is the timeline important?"',
    expected: 'Gives intuitive mental model explaining timeline role in assembling the video story',
    actual: textE,
    status: passE ? 'PASS' : 'FAIL',
    source: testE.data?.source,
    durationMs: testE.durationMs
  });

  // -------------------------------------------------------------------------
  // 2. CONVERSATION MEMORY TEST (10 Consecutive Conversational Turns)
  // -------------------------------------------------------------------------
  console.log('\n--- 2. Consecutive 10-Turn Conversation Memory Test ---');
  const turns = [
    { user: 'Hello!', expectedIntent: 'Greeting' },
    { user: 'My name is Rohan Deshmukh.', expectedIntent: 'Name registration' },
    { user: 'I have never edited a video before.', expectedIntent: 'Beginner background' },
    { user: 'I have not installed DaVinci Resolve yet.', expectedIntent: 'Install guidance' },
    { user: 'Okay, I downloaded the free version from Blackmagic.', expectedIntent: 'Progress ack' },
    { user: 'I installed and launched it. I see Project Manager.', expectedIntent: 'Screen context' },
    { user: 'I double clicked Untitled Project. Now I am on the Edit Page.', expectedIntent: 'Workspace transition' },
    { user: 'Wait, let me look at the screen for a minute.', expectedIntent: 'Pause / patient wait' },
    { user: 'What is the difference between Media Pool and Timeline?', expectedIntent: 'Conceptual clarification' },
    { user: 'What is my name and what software are we learning?', expectedIntent: 'Full memory recall' }
  ];

  let cumulativeHistory: Array<{ role: 'user' | 'model'; content: string }> = [];

  for (let i = 0; i < turns.length; i++) {
    const t = turns[i];
    const turnRes = await api('/api/tutor/chat', {
      method: 'POST',
      body: {
        message: t.user,
        history: cumulativeHistory,
        studentName: 'Rohan',
        lessonTitle: 'Introduction & Setup',
        courseTitle: 'Video Editing with DaVinci Resolve'
      }
    });

    const reply = turnRes.data?.reply || '';
    cumulativeHistory.push({ role: 'user', content: t.user });
    cumulativeHistory.push({ role: 'model', content: reply });

    const isTurn10 = i === 9;
    let turnPass = reply.length > 20;
    if (isTurn10) {
      turnPass = reply.toLowerCase().includes('rohan') && reply.toLowerCase().includes('davinci');
    }

    reports.push({
      id: `TURN-${i + 1}`,
      name: `Conversational Turn ${i + 1}: ${t.expectedIntent}`,
      steps: `User says: "${t.user}" (Turn ${i + 1} with cumulative history of ${cumulativeHistory.length - 2} turns)`,
      expected: isTurn10 ? 'Mentions "Rohan" and "DaVinci Resolve" demonstrating conversation memory' : 'Relevant, non-robotic response',
      actual: reply.slice(0, 160) + (reply.length > 160 ? '...' : ''),
      status: turnPass ? 'PASS' : 'FAIL',
      source: turnRes.data?.source,
      durationMs: turnRes.durationMs
    });
  }

  // -------------------------------------------------------------------------
  // 3. INTENT RECOGNITION TESTS FOR SHORT RESPONSES
  // -------------------------------------------------------------------------
  console.log('\n--- 3. Intent Recognition Tests for Short Inputs ---');
  const shortInputs = [
    { msg: 'Okay', intent: 'Acknowledgment / Ready', badPattern: 'great question' },
    { msg: 'Wait', intent: 'Student pause request', badPattern: 'great question' },
    { msg: 'I do not know', intent: 'Student uncertainty', badPattern: 'great question' },
    { msg: 'Show me again', intent: 'Repetition request', badPattern: 'great question' }
  ];

  for (const s of shortInputs) {
    const sRes = await api('/api/tutor/chat', {
      method: 'POST',
      body: {
        message: s.msg,
        studentName: 'Rohan',
        lessonTitle: 'Basic Editing & Trimming'
      }
    });
    const sText = sRes.data?.reply || '';
    const sPass = !sText.toLowerCase().includes(s.badPattern);

    reports.push({
      id: `INTENT-${s.msg.toUpperCase().replace(/\s+/g, '_')}`,
      name: `Intent Classification for "${s.msg}" (${s.intent})`,
      steps: `Send short utterance "${s.msg}"`,
      expected: `Does not treat "${s.msg}" as a question or say "That's a great question, about '${s.msg}'"`,
      actual: sText.slice(0, 160) + (sText.length > 160 ? '...' : ''),
      status: sPass ? 'PASS' : 'FAIL',
      source: sRes.data?.source,
      durationMs: sRes.durationMs
    });
  }

  // -------------------------------------------------------------------------
  // 4. DEMO VS PAID CLASSROOM COMPARISON
  // -------------------------------------------------------------------------
  console.log('\n--- 4. Demo vs Paid Classroom Parity Check ---');
  const demoSess = await api('/api/demo/session', {
    method: 'POST',
    body: { visitorName: 'Rohan' }
  });
  const demoSessId = demoSess.data?.sessionId;

  const demoCall = await api('/api/demo/chat', {
    method: 'POST',
    body: {
      message: 'What is ripple delete?',
      sessionId: demoSessId,
      visitorName: 'Rohan'
    }
  });

  const paidCall = await api('/api/tutor/chat', {
    method: 'POST',
    body: {
      message: 'What is ripple delete?',
      studentName: 'Rohan',
      lessonTitle: 'Basic Editing & Trimming'
    }
  });

  const demoText = (demoCall.data?.reply || '').toLowerCase();
  const paidText = (paidCall.data?.reply || '').toLowerCase();

  const demoHasRipple = demoText.includes('ripple') || demoText.includes('gap') || demoText.includes('delete');
  const paidHasRipple = paidText.includes('ripple') || paidText.includes('gap') || paidText.includes('delete');

  reports.push({
    id: 'PARITY-DEMO-PAID',
    name: 'Demo vs Paid Pedagogical Parity for "What is ripple delete?"',
    steps: 'Query same concept on /api/demo/chat and /api/tutor/chat',
    expected: 'Both explain concept consistently using gap-closing / ripple mental model',
    actual: `Demo: "${demoCall.data?.reply?.slice(0, 100)}..." (source: ${demoCall.data?.source}) | Paid: "${paidCall.data?.reply?.slice(0, 100)}..." (source: ${paidCall.data?.source})`,
    status: (demoHasRipple && paidHasRipple) ? 'PASS' : 'FAIL',
    durationMs: demoCall.durationMs + paidCall.durationMs
  });

  // -------------------------------------------------------------------------
  // SUMMARY
  // -------------------------------------------------------------------------
  console.log('\n========================================================================');
  console.log('                 DIAGNOSTIC TEST RESULTS SUMMARY');
  console.log('========================================================================\n');

  for (const r of reports) {
    const mark = r.status === 'PASS' ? '[PASS]' : (r.status === 'FAIL' ? '[FAIL]' : '[NOT TESTED]');
    console.log(`${mark} [${r.id}] ${r.name}`);
    console.log(`       Steps:    ${r.steps}`);
    console.log(`       Expected: ${r.expected}`);
    console.log(`       Actual:   ${r.actual}`);
    console.log(`       Source:   ${r.source || 'N/A'} (Duration: ${r.durationMs || 0}ms)\n`);
  }

  const passed = reports.filter(r => r.status === 'PASS').length;
  const failed = reports.filter(r => r.status === 'FAIL').length;
  console.log(`Total: ${reports.length} | Passed: ${passed} | Failed: ${failed}`);
  console.log('========================================================================\n');
}

runAudit().catch(console.error);
