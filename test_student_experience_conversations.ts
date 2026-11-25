import http from 'http';

const BASE_URL = 'http://localhost:3000';

async function api(path: string, options: {
  method?: string;
  headers?: Record<string, string>;
  body?: any;
} = {}): Promise<{ status: number; data: any }> {
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
          data: parsed
        });
      });
    });

    req.on('error', reject);
    if (payload) req.write(payload);
    req.end();
  });
}

async function runConversationalAudit() {
  console.log('=== TUTeach Phase 2: Conversational Intelligence Audit ===\n');

  // Scenario 1: Name Introduction
  console.log('--- Test 1: Student states name "Rohan." ---');
  const res1 = await api('/api/tutor/chat', {
    method: 'POST',
    body: {
      message: 'Rohan.',
      history: [
        { role: 'model', content: "Hello! Welcome to TUTeach. I'm your AI teacher. What is your name?" }
      ],
      lessonTitle: 'Introduction to DaVinci Resolve',
      courseTitle: 'Video Editing with DaVinci Resolve'
    }
  });
  console.log('Reply 1:', res1.data?.reply);
  console.log('Source 1:', res1.data?.source);

  // Scenario 2: Beginner Experience
  console.log('\n--- Test 2: Student indicates complete beginner ---');
  const res2 = await api('/api/tutor/chat', {
    method: 'POST',
    body: {
      message: 'No, I am a complete beginner.',
      history: [
        { role: 'model', content: "Great to meet you Rohan! Have you used DaVinci Resolve or any video editing software before?" }
      ],
      studentName: 'Rohan',
      lessonTitle: 'Introduction to DaVinci Resolve',
      courseTitle: 'Video Editing with DaVinci Resolve'
    }
  });
  console.log('Reply 2:', res2.data?.reply);
  console.log('Source 2:', res2.data?.source);

  // Scenario 3: Timeline Confirmation
  console.log('\n--- Test 3: Student confirms seeing the timeline ---');
  const res3 = await api('/api/tutor/chat', {
    method: 'POST',
    body: {
      message: 'Yes, I can see it.',
      history: [
        { role: 'model', content: "Look at the bottom half of your screen. Can you see the timeline area where the video tracks will go?" }
      ],
      studentName: 'Rohan',
      studentLevel: 'Beginner',
      lessonTitle: 'Workspace Navigation',
      courseTitle: 'Video Editing with DaVinci Resolve'
    }
  });
  console.log('Reply 3:', res3.data?.reply);
  console.log('Source 3:', res3.data?.source);

  // Scenario 4: "I don't understand."
  console.log('\n--- Test 4: Student expresses confusion ---');
  const res4 = await api('/api/tutor/chat', {
    method: 'POST',
    body: {
      message: "I don't understand.",
      history: [
        { role: 'model', content: "Next, we will do a Ripple Delete to snap the empty gap closed so you don't leave black frames." }
      ],
      studentName: 'Rohan',
      studentLevel: 'Beginner',
      lessonTitle: 'Basic Editing & Trimming',
      courseTitle: 'Video Editing with DaVinci Resolve'
    }
  });
  console.log('Reply 4:', res4.data?.reply);
  console.log('Source 4:', res4.data?.source);

  // Scenario 5: Media Pool vs Timeline difference
  console.log('\n--- Test 5: Conceptual question: Media Pool vs Timeline ---');
  const res5 = await api('/api/tutor/chat', {
    method: 'POST',
    body: {
      message: 'What is the difference between the Media Pool and Timeline?',
      studentName: 'Rohan',
      lessonTitle: 'Workspace Navigation',
      courseTitle: 'Video Editing with DaVinci Resolve'
    }
  });
  console.log('Reply 5:', res5.data?.reply);
  console.log('Source 5:', res5.data?.source);

  // Scenario 6: Student asks to pause and try
  console.log('\n--- Test 6: Student says "Wait, let me try." ---');
  const res6 = await api('/api/tutor/chat', {
    method: 'POST',
    body: {
      message: 'Wait, let me try.',
      history: [
        { role: 'model', content: "Press B on your keyboard to select the Blade tool, then click right on the playhead." }
      ],
      studentName: 'Rohan',
      lessonTitle: 'Basic Editing & Trimming',
      courseTitle: 'Video Editing with DaVinci Resolve'
    }
  });
  console.log('Reply 6:', res6.data?.reply);
  console.log('Source 6:', res6.data?.source);

  // Scenario 7: Unrelated question
  console.log('\n--- Test 7: Student asks unrelated question ---');
  const res7 = await api('/api/tutor/chat', {
    method: 'POST',
    body: {
      message: 'What is photosynthesis?',
      studentName: 'Rohan',
      lessonTitle: 'Basic Editing & Trimming',
      courseTitle: 'Video Editing with DaVinci Resolve'
    }
  });
  console.log('Reply 7:', res7.data?.reply);
  console.log('Source 7:', res7.data?.source);

  // Scenario 8: Incomplete answer
  console.log('\n--- Test 8: Student gives incomplete answer ---');
  const res8 = await api('/api/tutor/chat', {
    method: 'POST',
    body: {
      message: 'The red one.',
      history: [
        { role: 'model', content: "Which tool icon are you looking at right above the timeline?" }
      ],
      studentName: 'Rohan',
      lessonTitle: 'Basic Editing & Trimming',
      courseTitle: 'Video Editing with DaVinci Resolve'
    }
  });
  console.log('Reply 8:', res8.data?.reply);
  console.log('Source 8:', res8.data?.source);

  // Demo Classroom parity check
  console.log('\n--- Test 9: Demo Classroom parity for "What is ripple delete?" ---');
  const demoSession = await api('/api/demo/session', {
    method: 'POST',
    body: { visitorName: 'Rohan' }
  });
  const res9 = await api('/api/demo/chat', {
    method: 'POST',
    body: {
      message: 'What is ripple delete?',
      sessionId: demoSession.data?.sessionId,
      visitorName: 'Rohan'
    }
  });
  console.log('Demo Reply:', res9.data?.reply);
  console.log('Demo Source:', res9.data?.source);
}

runConversationalAudit().catch(console.error);
