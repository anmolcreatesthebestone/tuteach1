import http from 'http';

interface BenchmarkResult {
  question: string;
  durationMs: number;
  status: number;
  source: string;
  model?: string;
  replySnippet: string;
}

const testQuestions = [
  { q: "Yes, I can see the timeline.", desc: "Short confirmation" },
  { q: "What is the difference between the Media Pool and the Timeline?", desc: "Difficult analogy question" },
  { q: "Where can I find the Inspector?", desc: "UI navigation inquiry" },
  { q: "How do I do a Ripple Delete and why does it matter?", desc: "Workflow explanation" },
  { q: "I made a cut with the Blade tool but now I cannot select anything.", desc: "Troubleshooting question" }
];

async function sendRequest(question: string, history: any[] = []): Promise<BenchmarkResult> {
  const payload = JSON.stringify({
    message: question,
    courseTitle: "Video Editing with DaVinci Resolve",
    lessonTitle: "Workspace Navigation & Tools",
    studentName: "Rohan",
    studentLevel: "Beginner",
    history
  });

  const startTime = Date.now();
  return new Promise((resolve, reject) => {
    const req = http.request(
      'http://localhost:3000/api/tutor/chat',
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Content-Length': Buffer.byteLength(payload)
        }
      },
      (res) => {
        let body = '';
        res.on('data', (chunk) => { body += chunk; });
        res.on('end', () => {
          const durationMs = Date.now() - startTime;
          try {
            const data = JSON.parse(body);
            resolve({
              question,
              durationMs,
              status: res.statusCode || 0,
              source: data.source || 'unknown',
              model: data.model,
              replySnippet: (data.reply || '').slice(0, 100)
            });
          } catch (e) {
            resolve({
              question,
              durationMs,
              status: res.statusCode || 0,
              source: 'parse-error',
              replySnippet: body.slice(0, 100)
            });
          }
        });
      }
    );
    req.on('error', reject);
    req.write(payload);
    req.end();
  });
}

async function runBenchmark() {
  console.log('--- STARTING TUTOR CHAT LATENCY BENCHMARK ---');
  const results: BenchmarkResult[] = [];

  for (const item of testQuestions) {
    console.log(`\nBenchmarking: "${item.q}" (${item.desc})...`);
    const res = await sendRequest(item.q, [
      { role: 'model', content: 'Hello Rohan! Welcome to DaVinci Resolve.' },
      { role: 'user', content: 'I am a beginner and ready to learn.' }
    ]);
    console.log(`Duration: ${res.durationMs}ms | Source: ${res.source} | Model: ${res.model || 'N/A'}`);
    console.log(`Reply: ${res.replySnippet}...`);
    results.push(res);
  }

  const avgLatency = results.reduce((a, b) => a + b.durationMs, 0) / results.length;
  console.log(`\n=== BENCHMARK SUMMARY ===`);
  console.log(`Total queries tested: ${results.length}`);
  console.log(`Average Latency: ${avgLatency.toFixed(1)}ms`);
  const sources = results.map(r => r.source);
  console.log(`Sources: ${JSON.stringify(sources)}`);
}

runBenchmark().catch(console.error);
