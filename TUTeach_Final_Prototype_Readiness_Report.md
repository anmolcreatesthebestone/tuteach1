# TUTeach — Final Prototype Stabilization & Closed Beta Readiness Report

**Report ID:** `TUTeach_Final_Prototype_Readiness_Report.md`  
**Audit & Stabilization Date:** November 21, 2026  
**Target Platform:** TUTeach (`180602a8-09a7-4eee-bfb9-0cd8b6fe6604`)  
**Product Scope:** First Working Prototype — Closed Beta Preparation (3–5 Invited Students)  
**Production Readiness Rating:** **`CLOSED BETA READY`** *(Not Public Launch Ready)*

---

## 1. Current Platform Status

TUTeach is an interactive, voice-first AI teaching academy powered by **Golu Guru** for the **Video Editing with DaVinci Resolve** curriculum (8 modules, 43 structured lessons, practical assignments, and verifiable certificates) priced at **₹499 INR** per course, alongside a 5-minute interactive **Free AI Tutor Demo**.

The platform is currently **operational on Express + Vite (Node.js port 3000)** with persistent **PGlite PostgreSQL (`/data/postgres`)** storage, Razorpay checkout & cryptographic HMAC-SHA256 webhook verification in **Test Mode (`rzp_test_*`)**, and Google Gemini multimodal tutoring via `@google/genai`.

Following final stabilization fixes and post-patch verification suites executed on the live running server:
* **TypeScript Check (`npm run lint` / `tsc --noEmit`):** `0` errors (`PASS`)
* **Production Frontend Build (`npm run build` / `vite build`):** Clean build (`PASS`)
* **Payment, Security, & QR Verification Suites:** `72 / 72` checks (`PASS`)
* **Phase 4 Controlled Regression Suite:** `14 / 14` checks (`PASS`)
* **Phase 3 Real Student Simulation Audit (Baseline Pre-Webhook Patch + Verified Post-Patch Edge Cases):** `46 PASS`, `0 FAIL`, `1 PARTIAL` (latency under upstream spikes), `1 NOT TESTED` (physical hardware microphone)
* **Voice Latency Benchmark (Post-Patch):** Average **2,862.4 ms** across 5 mixed conversational queries (`883 ms – 2,088 ms` when Gemini responds within cascade budget; deterministic sub-5 ms fallback triggers cleanly at `~4.5 s` timeout on upstream spikes).

---

## 2. Existing Features Verified

The following existing product features and architectural guarantees were inspected and verified to remain intact without redesign or regressions:

1. **Authentication & Student Session Management (`/api/auth/*`):**
   * Email/password registration issuing `usr_*` permanent student IDs and bcrypt password hashing (`bcryptjs`).
   * Cookie and Bearer token sessions backed by PostgreSQL (`sessions` table).
   * Incorrect passwords rejected (`401`); logout immediately revokes the server-side session (`401` on subsequent requests).
2. **Pricing & Razorpay Payment Verification (`/api/payments/*`):**
   * Server-authoritative ₹499 INR (`49900` paise) course pricing enforced regardless of client payload.
   * Razorpay Gateway configured cleanly in `TEST` mode (`rzp_test_TuxmIOA8f2uFIL`), dynamically prefilling the authenticated student's real name and email (no hardcoded placeholder student names).
   * Clear Test Mode banner and QR explanation in `CheckoutPage.tsx` guiding students on Test Mode simulators (`success@razorpay` / Razorpay test cards) rather than claiming live consumer UPI QR scanning works.
   * Cryptographic timing-safe HMAC-SHA256 signature verification on both client callback verification (`/api/payments/razorpay/verify-signature`) and asynchronous webhooks (`/api/payments/razorpay/webhook`).
   * Duplicate webhook idempotency (`enrollment count = 1`), failed payment tracking (`status: FAILED` without entitlement grant), and cancelled order isolation (`status: PENDING`).
3. **Course Entitlements & Multi-Tenant Student Isolation:**
   * Paid AI Classroom and AI rubric evaluation (`/api/tutor/evaluate-assignment`, `/api/courses/:courseId/verify-access`) reject anonymous (`401`) and unpaid students (`403 PAYMENT_REQUIRED`).
   * Student B cannot access courses unlocked by Student A; entitlements persist cleanly in PostgreSQL across logout, session revocation, and password re-login.
4. **Golu Guru AI Classroom & 5-Minute Free Demo:**
   * Bilingual English + Hindi/Hinglish (`english` / `hindi_hinglish`) tutoring via `@google/genai` cascade (`gemini-3.1-flash-lite` -> `gemini-3.8-flash` -> sub-5 ms instant Socratic engine).
   * Server-authoritative 300-second (5-minute) timer for `/demo` (`/api/demo/start`, `/api/demo/chat`, `/api/demo/analyze-screenshot`) with pedagogical parity (e.g., Ripple Delete `Shift + Backspace` mental model) between Demo and Paid Classroom.
5. **Multimodal Screenshot Understanding:**
   * File upload, drag-and-drop, and clipboard paste (`Ctrl+V`) analyzed via `/api/tutor/analyze-screenshot` and `/api/demo/analyze-screenshot`, rejecting empty/missing image payloads (`400 IMAGE_REQUIRED`) and feeding `recentScreenshotContext` into follow-up tutor turns.
6. **Practical Assignments & Certificates:**
   * Module-aligned 4-category (`10`-point) rubric grading (`PASSED` at `>= 5.0/10`, `NEEDS_REVISION` at `< 5.0/10`), maximum 1 retry with best-of-two persistence, and verifiable certificate eligibility requiring completion of all 43 lessons and passing evaluations.
7. **SPA Routing & Mobile Viewport Shell:**
   * Express SPA fallback serves HTTP `200` on `/`, `/courses`, `/pricing`, `/classroom`, `/dashboard`, and `/demo`, with responsive viewport `<meta name="viewport" content="width=device-width, initial-scale=1.0">` and React + Tailwind layout classes.

---

## 3. Important Defects Discovered

During Phase 3/4 testing, live user feedback, and final production stabilization inspection, the following genuine defects were uncovered:

| Defect ID | Severity | Component / Area | Root Cause & Observed Impact |
|---|---|---|---|
| **DEF-01** | **High (Security)** | `/server.ts` (`/api/payments/razorpay/webhook`) | Unlike `verify-signature`, the webhook endpoint accepted `req.headers['x-test-secret']` without checking `process.env.NODE_ENV !== 'production'`, and returned `expected: expectedSignature` in HTTP `400` error JSON—allowing webhook signature bypass and leaking HMAC digests in production. |
| **DEF-02** | **High (UX / Voice)** | `ClassroomPage.tsx` & `DemoClassroomPage.tsx` | AI teacher playback did not yield immediately when a student spoke mid-sentence (barge-in), and a `useEffect` re-trigger could repeat the initial welcome intro after conversation had already started. |
| **DEF-03** | **High (AI Conversational)** | `/server.ts` (`/api/tutor/chat` & `/api/demo/chat`) | Prompts lacked explicit anti-repetition/anti-recap rules, causing the LLM to sometimes re-greet the student or summarize prior conversation history after every message. |
| **DEF-04** | **Medium (Intent Routing)** | `/server.ts` (`generateInstantTutorResponse` & `/api/tutor/chat`) | `isInstallQuery` matched `'where'` loosely without excluding UI panels—so *"Where can I find the Inspector?"* falsely sent the Blackmagic download link. Negated replies (*"I haven't installed it yet."*) falsely triggered *"Setup is complete!"*. |
| **DEF-05** | **Medium (Substring Collisions)** | `/server.ts` (`generateInstantTutorResponse`) | Unscoped substring checks caused false triggers: `'title'` matched `"Untitled Project"` (returning Text+ title instructions), `'short'` matched `"shortcut"`, `"I am a complete beginner"` extracted `"A"` as a name (*"Nice to meet you, A!"*), and saying `"I am on the Edit Page"` after double-clicking Untitled Project re-prompted Project Manager steps. |
| **DEF-06** | **Medium (Error Recovery & Latency)** | `/server.ts` (`generateInstantTutorResponse` & AI Cascade) | Error-panic utterances (*"I made a mistake, my clip disappeared!"*) and `'playhead'` lacked instant fallback coverage, while `8000 ms` per-tier cascade timeouts raised latency above `5.1 s` during cloud LLM slowdowns. |

---

## 4. Fixes Made

All changes were strictly scoped to surgical patches protecting existing pricing (₹499), Razorpay verification, auth, PostgreSQL schema, course structure, and Golu Guru's persona:

1. **Webhook Production Security Hardening (`/server.ts`, lines 2158–2185):**
   * Gated `x-test-secret` behind `process.env.NODE_ENV !== 'production'` matching `verify-signature`.
   * Removed `expectedSignature` from both server warning logs and the `400 Invalid webhook signature` JSON response. Verified via live curl returning solely `{"error":"Invalid webhook signature"}`.
2. **Voice Barge-In & No-Repeat Welcome Guard (`ClassroomPage.tsx` lines 674–686, 830–898, 1019–1026; `DemoClassroomPage.tsx` lines 281–293):**
   * Added student voice interruption (`stopAISpeech(true)`) inside `setupMicMeter` VAD threshold (`avg > 0.045`), `SpeechRecognition.onspeechstart`, and `onresult` in both paid classroom and demo classroom so student speech immediately cancels active TTS playback.
   * Added `if (hasSpokenWelcomeRef.current || conversationHistory.length > 0)` guard so welcome greeting does not replay on state/lesson updates.
3. **Anti-Repetition & Anti-History Recap Discipline (`/server.ts`, system prompts):**
   * Updated both `/api/tutor/chat` and `/api/demo/chat` system prompts with explicit rules forbidding repeated welcome greetings when `hasPriorHistory` is true and forbidding recaps/summaries of previous conversation turns.
4. **UI Panel Routing, Negated Install & Substring Collision Fixes (`/server.ts`, lines 325, 372, 391, 400–489):**
   * Added dedicated Section `6.1` handlers for `inspector`, `media pool`, `timeline`, `blade`/`razor`, `export`/`render`/`deliver`, and `playhead`, and excluded UI terms via `isUIElementQuery`.
   * Added `hasNegatedInstall` check so *"I haven't installed it yet."* gives Blackmagic Free download instructions instead of congratulating completion.
   * Excluded `'untitled'` from `'title'`, restricted `'short'` to `'shorts'` / `youtube short`, excluded `nonNameWords` (`a`, `an`, `the`, `beginner`, `complete`, etc.) from `namePrefixMatch` so `"I am a complete beginner"` never greets `"A"`, and added `isInsideEditWorkspace` guard so reporting arrival on the Edit Page does not repeat Project Manager steps.
   * Expanded error-recovery (`mistake`, `disappeared`, `accidentally`, `lost my clip`, `galti`, `gayab`) to advise immediate `Ctrl + Z` / `Cmd + Z`.
5. **AI Cascade Latency Tuning (`/server.ts`):**
   * Tightened per-tier timeouts in `/api/tutor/chat` and `/api/demo/chat` from `8000 ms` to `4500 ms` (Tier 1 `gemini-3.1-flash-lite`) and `4000 ms` (Tier 2 `gemini-3.8-flash`) before sub-5 ms Socratic fallback.

---

## 5. Tests and Their Actual Results

All tests below report **honest statuses** (`PASS`, `FAIL`, `PARTIAL`, `NOT TESTED`) strictly matching observed execution results on the running server.

| Test Suite / Check | Timing Relative to Final Patch | Total | Passed | Failed | Partial | Not Tested | Result Details & Evidence |
|---|---|---:|---:|---:|---:|---:|---|
| **TypeScript Static Type Check (`npm run lint`)** | **Post-final patch** | 1 | 1 | 0 | 0 | 0 | **PASS** — `tsc --noEmit` completed with 0 errors. |
| **Vite Production Bundle (`compile_applet` / `vite build`)** | **Post-final patch** | 1 | 1 | 0 | 0 | 0 | **PASS** — Compiled production client assets cleanly. |
| **Payment Failure, Cancellation & Security (`test_payment_security_scenarios.ts`)** | **Post-final patch** | 35 | 35 | 0 | 0 | 0 | **PASS** — Failed/cancelled DB state, duplicate webhook idempotency (enrollment count = 1), student isolation (`403`), session revocation (`401`), re-login persistence. |
| **Production Security & DB Suite (`test_production_readiness.ts`)** | **Post-final patch** | 28 | 28 | 0 | 0 | 0 | **PASS** — Bcrypt password auth, wrong password `401`, persistent `/data/postgres` PGlite cluster check, anonymous/unpaid AI evaluation gating (`401`/`403`), ledger consistency. |
| **Razorpay QR & Order Verification (`test_qr_payment_verification.ts`)** | **Post-final patch** | 9 | 9 | 0 | 0 | 0 | **PASS** — `TEST` mode (`rzp_test_*`), dynamic student name, ₹499 (`49900` paise) server enforcement, `403` pre-payment gate, `400` tampered webhook rejection, `200` capture. |
| **Webhook Signature Leak Check (`curl`)** | **Post-final patch** | 1 | 1 | 0 | 0 | 0 | **PASS** — Forged webhook returns `400 {"error":"Invalid webhook signature"}` with no `expected` signature exposed. |
| **Phase 4 Controlled Fixes Suite (`test_phase4_fixes.ts`)** | **Post-final patch** | 14 | 14 | 0 | 0 | 0 | **PASS** — UI nav vs install separation, negated install, anti-repetition guard, Demo vs Paid Ripple Delete parity, unpaid/webhook gates. |
| **Health, SPA Routes & Name/Workspace Edge Cases (`curl`)** | **Post-final patch** | 9 | 9 | 0 | 0 | 0 | **PASS** — `/api/health` (`geminiConfigured: true`), `/`, `/courses`, `/pricing`, `/classroom`, `/dashboard`, `/demo` all HTTP `200`; `"I am a complete beginner"` & `"on the Edit Page"` handled without misparsing `"A"` or looping Project Manager. |
| **Voice Latency Benchmark (`benchmark_latency.ts`)** | **Post-final patch** | 5 | 5 | 0 | 0 | 0 | **PASS** — Average latency **2,862.4 ms** across 5 queries (`883 ms`, `2088 ms`, `1908 ms` live Gemini; `4745 ms`, `4688 ms` deterministic fallback on upstream timeout). |
| **Phase 3 Student Simulation Audit (`test_phase3_simulation_audit.ts`)** | **Pre-final patch** *(run immediately prior to final webhook + name-article patch)* | 48 | 46 | 0 | 1 | 1 | **46 PASS, 1 PARTIAL, 1 NOT TESTED** — Full 12-step lesson, 13 difficult utterances, `"hi"` substring disambiguation (5/5), screenshot analysis (`200` & `400 IMAGE_REQUIRED`), 2-attempt rubric (`4.5/10 NEEDS_REVISION` -> retry `8.5/10 PASSED`), Best-of-Two `8.5/10`, Demo 300 s timer. `P4-Latency` marked **PARTIAL** (`4560 ms` mid-suite contention); `P4-01 Hardware Mic` marked **NOT TESTED**. |
| **Legacy Audit Script (`test_student_acceptance_audit.ts`)** | **Mid-session** *(uncovered `"Untitled Project"` bug prior to fix)* | 22 | 12 | 10* | 0 | 0 | **\*9 failures were obsolete endpoint paths in that older script** (`/api/demo/evaluate`, `/api/courses/progress`, `/api/courses/entitlements`); 1 genuine defect (`"Untitled Project"` matching `'title'`) was fixed and verified fixed afterwards. |
| **Physical Hardware Mic, Browser TTS Audio & Barge-In** | **Code Inspected Only** | 1 | 0 | 0 | 0 | 1 | **NOT TESTED** — No physical microphone/speaker or interactive Chrome/Edge browser session is available inside the headless Linux container. |
| **Interactive Phone/Desktop Visual Browser Walkthrough** | **HTTP & Source Inspected Only** | 1 | 0 | 0 | 0 | 1 | **NOT TESTED** — Verified HTTP 200 HTML shell, viewport meta, and responsive Tailwind CSS in source; real touch/click rendering requires manual Chrome/mobile verification during beta. |

---

## 6. Remaining Known Limitations

1. **Razorpay Operating in Test Mode (`rzp_test_*`):** Real-money consumer UPI QR apps (GPay, PhonePe, Paytm) will intentionally display *"Can't scan this QR"* because Razorpay Test Mode does not register live NPCI/UPI merchant handles. Payments during Closed Beta must use Razorpay's Test Mode simulator (`success@razorpay` or test card numbers).
2. **Physical Microphone & Real-Time Browser Barge-In Unverified on Hardware:** Acoustic VAD and `SpeechRecognition` barge-in (`ClassroomPage.tsx`, `DemoClassroomPage.tsx`) are cleanly implemented in code, but real hardware microphone noise floors, speaker-to-mic echo cancellation, and interruption timing could not be executed in the headless container (`NOT TESTED`).
3. **Browser Compatibility Constraint (`SpeechRecognition` & `speechSynthesis`):** Hands-free voice classroom features rely on the Web Speech API, which works reliably in **Google Chrome** and **Microsoft Edge** desktop/Android, and has partial/missing support in Firefox, Brave (shield defaults), and some iOS browsers. Students on unsupported browsers must use the text chat input box.
4. **Lesson Completion & Assignment Progress Persistence Scope:** Authentication, sessions, Razorpay payments, and course entitlements are persisted in server PostgreSQL (`/data/postgres`), whereas individual completed lesson checkmarks, assignment evaluation history, and earned certificates are currently stored per user email in browser `localStorage` (`AppContext.tsx`). Clearing browser site data or switching devices preserves paid course access and login, but resets lesson completion checkmarks and assignment history on the new browser.
5. **Static Study Streak UI Counter:** `LearningProgressPage.tsx` (line 95) displays a static `Active Study Streak: 3` badge rather than a database-computed daily login streak.
6. **Upstream LLM Latency & Rate Limits:** While average latency dropped to **2,862.4 ms**, upstream Gemini API spikes occasionally hit the 4.5 s timeout (~`4.7 s` total round-trip before instant fallback responds) under heavy concurrent traffic. Additionally, `AssignmentLab.tsx` uses a browser `window.confirm()` on the *"Reset Starter Template"* button (`line 71`).

---

## 7. Closed Beta Preparation Checklist (3–5 Invited Students)

Use this exact operational checklist before inviting your first 3–5 beta testers:

* [ ] **1. Cohort Selection & Environment Confirmation:**
  * Invite 3–5 beginner students who have Windows or Mac computers capable of installing **DaVinci Resolve Free** (`blackmagicdesign.com/products/davinciresolve`).
  * Confirm `GEMINI_API_KEY`, `RAZORPAY_KEY_ID` (`rzp_test_*`), `RAZORPAY_KEY_SECRET`, and `RAZORPAY_WEBHOOK_SECRET` are set in hosting secrets (never in frontend code).
* [ ] **2. Student Onboarding & Explicit Test Payment Instructions:**
  * Tell students explicitly before checkout: **Payments are currently in Razorpay Test Mode (no real money will be charged).**
  * Instruct them NOT to scan the Razorpay QR with real GPay/PhonePe apps; instead click **UPI / QR -> `success@razorpay`** (Razorpay's Test Success VPA) or **Card -> `4100 2800 0000 1007`** (any future expiry + any 3-digit CVV) -> click **Success** in the Razorpay Test OTP simulator.
* [ ] **3. Browser, Microphone & Headphones Setup:**
  * Require testers to use **Google Chrome** or **Microsoft Edge** on desktop/laptop.
  * Recommend **headphones/earphones** during voice calls so Golu Guru's speaker audio does not bleed back into the microphone and trigger unintended self-interruption (barge-in).
  * Walk testers through clicking **Allow** on the browser Microphone permission prompt before starting the classroom call.
* [ ] **4. Classroom Usage & Screenshot Workflow:**
  * Remind testers that they can type or speak anytime, interrupt Golu Guru mid-sentence, or pause (`"Wait, let me try"`).
  * Show testers how to capture a snippet (`Win + Shift + S` on Windows / `Cmd + Ctrl + Shift + 4` on Mac) and press **`Ctrl + V` / `Cmd + V`** directly inside the classroom (or use **Upload Screenshot**) whenever they feel stuck on a DaVinci Resolve panel.
* [ ] **5. Structured Beta Feedback & AI Mistake Logging:**
  * Ask each student to stay on the **same primary computer and Chrome/Edge profile** throughout the beta (due to client-side `localStorage` lesson progress tracking).
  * Collect a lightweight bug log after Session 1 and Module 1 Assignment capturing:
    1. Exact browser + OS used (`Chrome/Edge`, `Windows/Mac`)
    2. Whether mic speech-to-text & voice interruption (barge-in) worked cleanly with and without headphones
    3. Any awkward, inaccurate, or repeated AI teacher replies (copy exact student prompt + Golu Guru response + timestamp)
    4. Any screenshot upload or assignment grading delays/confusion.

---

## 8. Deployment Requirements

To deploy and operate TUTeach cleanly for the Closed Beta:

1. **Build & Runtime Commands:**
   * Install dependencies: `npm install`
   * Build production frontend bundle: `npm run build` (`vite build` -> outputs `/dist`)
   * Start production Express server: `NODE_ENV=production node --import tsx server.ts` or `NODE_ENV=production npm start`
   * *(Note: `package.json` currently uses `"start": "tsx server.ts"`. Ensure host provides `NODE_ENV=production` so `x-test-secret` test bypasses on payment verification and webhooks are strictly disabled!)*
2. **Required Server-Side Environment Variables (Secrets):**
   * `GEMINI_API_KEY` — Server-side `@google/genai` API key for tutoring, vision, and rubric evaluation.
   * `RAZORPAY_KEY_ID` — `rzp_test_*` for Closed Beta (switch to `rzp_live_*` only after full public-launch audit & KYC).
   * `RAZORPAY_KEY_SECRET` — Razorpay secret used for order creation and cryptographic signature checks.
   * `RAZORPAY_WEBHOOK_SECRET` — Dedicated Razorpay dashboard webhook secret (`>= 1` strong secret).
   * `PORT` — Defaults to `3000`.
3. **Database Configuration:**
   * If running single-instance with persistent volume mounted at `/app/data`: PGlite automatically stores PostgreSQL files at `/data/postgres`.
   * **Recommended for multi-container/ephemeral Cloud Run:** Provision an external PostgreSQL / Cloud SQL database and set `DATABASE_URL` (or `SQL_HOST`, `SQL_USER`, `SQL_PASSWORD`, `SQL_DB_NAME`) so container restarts never risk losing ephemeral disk state.

---

## 9. Backup and Recovery Recommendations

Inspection confirmed the workspace currently has **no `.git` repository**, and `/data/` is **not listed in `.gitignore`**:

1. **Snapshot Source Code Immediately (Git Baseline):**
   * Initialize Git in the workspace (`git init`) and ensure `.gitignore` excludes `node_modules/`, `dist/`, `.env*` (except `!.env.example`), and `data/` **before** making your initial commit (`git commit -m "Closed Beta v1 baseline"`). Never commit `.env` or `/data/postgres` binary files into source control.
2. **Archive Pre-Beta Database State (`/data/postgres`):**
   * Before resetting test accounts or inviting real beta students, create an offline compressed tarball backup of `/data/postgres`:
     ```bash
     tar -czf backup_tuteach_prebeta_$(date +%F).tar.gz data/postgres
     ```
   * Note that `/data/test_pg` also exists on disk from earlier test runs and can be archived or left isolated without affecting live `/data/postgres`.
3. **Daily Beta Backup Routine:**
   * Perform daily scheduled snapshots of PostgreSQL (`pg_dump` if using Cloud SQL / external Postgres, or cold filesystem snapshot of `data/postgres` during brief maintenance window) so student accounts, session tokens, and Razorpay `payments` / `course_enrollments` records can always be restored cleanly.

---

## 10. Final Recommendation

### Verdict: **`CLOSED BETA READY`** *(Not Public Launch Ready)*

TUTeach has achieved solid functional stability across account authentication, server-enforced ₹499 Razorpay order/webhook verification, student account isolation, Golu Guru's bilingual Socratic teaching flow, UI navigation & mistake-recovery accuracy, voice barge-in/anti-repetition protections, screenshot understanding, and 2-attempt rubric grading.

The platform is **approved for a supervised Closed Beta of 3–5 invited students** under Test Mode guidelines, Chrome/Edge browser usage, and manual hardware mic observation. It must **not** be opened to general public traffic (`PUBLIC LAUNCH READY`) until:
1. Physical microphone capture, TTS playback, and barge-in interruption are verified on real student hardware/browsers.
2. Lesson completion, assignment evaluations, and certificates are migrated from browser `localStorage` to PostgreSQL tables.
3. Razorpay is verified end-to-end in Live Mode (`rzp_live_*`) with live UPI QR and a production external PostgreSQL (`DATABASE_URL` / Cloud SQL) instance.
