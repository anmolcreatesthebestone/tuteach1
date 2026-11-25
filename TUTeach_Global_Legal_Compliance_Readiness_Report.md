# TUTeach — Global Legal Compliance, Age Protection & Student Safety Readiness Report

**Report ID:** `TUTeach_Global_Legal_Compliance_Readiness_Report.md`  
**Audit & Implementation Date:** November 22, 2026  
**Target Platform:** TUTeach (`180602a8-09a7-4eee-bfb9-0cd8b6fe6604`)  
**Primary Compliance Focus:** India First (DPDP Act 2023 context), with US (COPPA), EU (GDPR Article 8), and Configurable Global Jurisdiction Support  

---

## 1. Compliance Readiness Rating

### Verdict: **`LIMITED BETA READY — SUBJECT TO LEGAL REVIEW`**

*(Note: This technical implementation establishes the required software controls, age gates, parental consent workflows, privacy portals, AI safety filters, cookie preferences, and audit logging. It does **not** constitute legal certification or formal legal approval. Public commercial rollout requires review by qualified legal counsel, completion of all `[OWNER TO PROVIDE]` legal entity/grievance fields, configuration of owner-controlled admin credentials, and verification of external vendor DPAs/KYC.)*

---

## 2. Compliance Architecture Summary

The compliance system is integrated directly into TUTeach's existing Express + Vite + Drizzle ORM + PostgreSQL (`/data/postgres` PGlite) architecture without altering the `#EFEBDA` / `#F14C2F` / `#393636` visual identity, the ₹499 Razorpay pricing enforcement, or course access isolation:

1. **Database Schema (`/src/db/schema.ts`, `/src/db/index.ts`):**
   - Extended `students` with non-destructive defaults for legacy accounts plus new compliance columns: `countryCode`, `dateOfBirth`, `ageAtRegistration`, `isMinor`, `applicableFramework`, `jurisdictionStatus`, `requiresParentalConsent`, `parentalConsentStatus`, `complianceStatus`, `aiDisclosureAcceptedAt`, `aiDisclosureVersion`, `analyticsConsent`, `functionalConsent`, and `marketingConsent`.
   - Added 10 dedicated compliance tables:
     - `age_jurisdiction_rules`
     - `parental_consents`
     - `policy_versions`
     - `policy_acceptances`
     - `privacy_requests`
     - `grievances`
     - `data_retention_schedules`
     - `third_party_processors`
     - `security_incidents`
     - `compliance_audit_logs`
     - `legal_entity_config` (11th table storing editable owner entity/officer details with `[OWNER TO PROVIDE]` defaults)
2. **Backend Policy & Enforcement Engine (`/src/db/compliance.ts`, `/server.ts`):**
   - `ensureComplianceSeeded()` seeds 37 jurisdictions, 14 policy documents, 6 retention schedules, 5 third-party processors, and 8 owner legal placeholder fields on startup.
   - `enforceActiveStudentCompliance()` and `enforceAiDisclosureAndCompliance()` gate AI chat (`/api/tutor/chat`, `/api/demo/chat`), multimodal screenshot analysis (`/api/tutor/analyze-screenshot`), assignment rubric evaluation (`/api/tutor/evaluate-assignment`), and Razorpay order creation (`/api/payments/razorpay/create-order`).
   - Direct self-service modification of `dateOfBirth`, `countryCode`, or `isMinor` via `/api/auth/me` or profile endpoints is blocked with `403 DOB_AND_JURISDICTION_IMMUTABLE`.
   - Compliance Governance API routes (`/api/admin/compliance/*`) are protected by `requireAdmin` RBAC (`role === 'admin'`), returning `403 FORBIDDEN_ADMIN_ONLY` for student accounts.
3. **Frontend Compliance & Student Safety UI (`/src/components/*`):**
   - **Age-Protected Registration (`/src/components/pages/AuthPages.tsx`):** Country/Jurisdiction selector, Date of Birth picker, live regional consent rule preview, and an **unchecked-by-default** affirmative legal consent checkbox.
   - **Parental / Guardian Consent Portal (`/src/components/pages/ParentalConsentPage.tsx`):** Minor guardian invitation, token verification preview, explicit guardian approval/rejection, management token withdrawal, and child data inspection/erasure.
   - **Student Privacy & Rights Portal (`/src/components/pages/DashboardPage.tsx`):** Personal JSON export, full record inspector, name correction request, optional analytics withdrawal, policy re-consent banner (`pendingFreshPolicies`), and permanent account deletion/anonymization flow.
   - **Classroom Safety & AI Transparency (`/src/components/pages/ClassroomPage.tsx`, `DemoClassroomPage.tsx`):** Pre-use AI Transparency & Safety Disclosure modal, PII-redaction safety notices, and in-classroom **Report AI** escalation button creating tracked `GRV-*` grievance tickets.
   - **Legal Center, Grievance Desk & Cookie Center (`/src/components/pages/LegalCenterPages.tsx`, `GrievancePage.tsx`, `CookieConsentBanner.tsx`, `AdminCompliancePage.tsx`):** Dedicated 14-document Legal Center, public grievance ticket submission/lookup, 4-category cookie manager, and restricted Admin Compliance Console.

---

## 3. Age & Country Jurisdiction Protection Summary

| Region / Country | Consent Threshold | Framework Applied | Minor Account Outcome | Unreviewed Country Behavior |
|---|---:|---|---|---|
| **India (`IN`)** *(Primary Default)* | **18 years** | `INDIA_DPDP` | `< 18` -> `PENDING_PARENTAL_CONSENT` | Enabled |
| **United States (`US`)** | **13 years** | `US_COPPA` | `< 13` -> `PENDING_PARENTAL_CONSENT` | Enabled |
| **EU Member States (`27` countries)** | **13–16 years** *(national GDPR Art. 8 age per Member State, e.g., DE 16, FR 15, ES 14, SE 13)* | `EU_GDPR_ART8` | Below national threshold -> `PENDING_PARENTAL_CONSENT` | Enabled |
| **Seeded Review Jurisdictions (`GB`, `CA`, `AU`, `SG`, `AE`, `BR`, `JP`, `OTHER`) & Any Unlisted ISO Code** | Conservative fallback (`18` / regional) | `GLOBAL_CONFIGURABLE` | Status set to `COUNTRY_REVIEW_REQUIRED` | **Blocked (`403 JURISDICTION_REVIEW_REQUIRED`)** until admin/counsel approves & enables |

Key technical guarantees verified:
- UTC age calculation (`calculateUtcAge`) enforces calendar validity and blocks future or out-of-range (`<4` or `>120`) birthdates.
- Unchecked policy consent at `/api/auth/register` is rejected with `400 POLICY_ACCEPTANCE_REQUIRED`.
- Once registered, a user cannot change their own `dateOfBirth` or `countryCode` to bypass minor/country locks (`403 DOB_AND_JURISDICTION_IMMUTABLE`); formal corrections must be submitted via a tracked `CORRECTION` privacy request (`POST /api/compliance/privacy-request`).
- Minors are blocked from behavioral advertising opt-in at both UI and API layers (`403 ADVERTISING_DISABLED_FOR_MINORS`).

---

## 4. Parental Consent System Summary

For any minor below the applicable country consent threshold:
1. **Hard Feature Gating:** Account enters `complianceStatus: 'PENDING_PARENTAL_CONSENT'`. `/classroom` redirects to the Parental Consent Portal, while backend AI tutoring, screenshot analysis, assignment grading, and Razorpay checkout return `403 PARENTAL_CONSENT_REQUIRED`.
2. **Guardian Invitation (`POST /api/compliance/parental-consent/request`):** Minor supplies guardian's full name, relationship, and email. Backend rejects using the student's own email (`400 SAME_EMAIL_REJECTED`) and invalidates any previous unused pending verification token.
3. **Single-Use Expiring Verification Link (`GET /preview`, `POST /decision`):** Generates a 72-hour `tut_pconsent_*` token stored solely as a **SHA-256 hash** (`verificationTokenHash`). Guardian sees the exact data-processing notice (`INDIA_DPDP` / `US_COPPA` / `EU_GDPR_ART8`), confirms they are 18+ and types their signature, and clicks **Approve** (`VERIFIED` -> `ACTIVE`) or **Reject** (`REJECTED` -> `403 PARENTAL_CONSENT_REJECTED`). Replay of consumed tokens fails with `400`.
4. **Guardian Management Token (`tut_pmgmt_*`):** Issued separately upon guardian decision so the parent/guardian can independently inspect child compliance data (`GET /api/compliance/parental-consent/child-data`), immediately withdraw consent (`POST /api/compliance/parental-consent/withdraw` -> `403 PARENTAL_CONSENT_WITHDRAWN`), or trigger child account deletion (`POST /api/compliance/parental-consent/child-deletion`).

*Statutory Upgrade Note:* Current guardian verification relies on distinct-email invitation + single-use cryptographic link + adult age declaration. Prior to broad Indian DPDP public launch, TUTeach should evaluate integrating statutory verifiable identity/age tokens (e.g., DigiLocker / eKYC / small refundable card or UPI verification) as required by finalized DPDP Rules.

---

## 5. AI Safety & Transparency Measures

1. **Mandatory Pre-Use AI Transparency Disclosure:**
   - Paid `/classroom` and `/api/tutor/evaluate-assignment` require explicit acceptance of the AI Transparency & Safety Notice (`POST /api/compliance/ai-disclosure`), returning `403 AI_DISCLOSURE_REQUIRED` if unaccepted (checked after `403 PAYMENT_REQUIRED` so unpaid accounts remain strictly payment-gated).
   - Free `/demo` also gates entry behind an explicit pre-use AI Transparency & Safety modal explaining that Golu Guru is an automated Google Gemini AI tutor (not a human) and voice/screenshot transmissions occur only on explicit user action.
2. **Minor Safety & Accidental PII Guardrail (`checkMinorSafetyAndScrubPii` in `/src/db/compliance.ts`):**
   - Runs prior to forwarding prompts to Google Gemini across `/api/tutor/chat`, `/api/demo/chat`, `/api/tutor/analyze-screenshot`, and `/api/tutor/evaluate-assignment`.
   - **Blocks severe safety risks** (CSAM/underage exploitation, self-harm/suicide prompts with helpline resources, romantic/grooming/real-person impersonation requests, and dangerous/illegal instructions) without calling the external model.
   - **Automatically masks accidental PII** before external LLM calls: payment card numbers (`[REDACTED_CARD_NUMBER]`), CVV/CVC (`[REDACTED_CVV]`), Aadhaar-format 12-digit numbers (`[REDACTED_GOV_ID]`), shared passwords (`[REDACTED_PASSWORD]`), personal email addresses (`[REDACTED_EMAIL]`), and explicit phone numbers (`[REDACTED_PHONE]`), surfacing a visible `redactedPii` warning banner in the classroom UI.
3. **In-Classroom AI Reporting (`POST /api/compliance/report-ai-response`):**
   - Both Live Subtitles and Chat Stream turns in `ClassroomPage.tsx` and `DemoClassroomPage.tsx` include a **Report AI** action creating a tracked grievance (`GRV-YYYY-*`) with a 24-hour triage SLA target.

---

## 6. Cookie Consent & Third-Party Disclosure Summary

- **4-Category Cookie Banner & Preference Center (`CookieConsentBanner.tsx`):**
  1. **Strictly Necessary / Essential:** Always ON (auth cookies, CSRF/session security, age status, checkout integrity).
  2. **Functional Preferences:** Configurable (English vs Hinglish mode).
  3. **Analytics Cookies:** Optional, **OFF by default**, persistent withdrawal supported in Dashboard & Cookie Modal.
  4. **Advertising & Behavioral Tracking:** Permanently locked OFF for minors (`disabled={isMinor}` in UI and `403 ADVERTISING_DISABLED_FOR_MINORS` on `POST /api/compliance/cookie-preferences`).
- **On-Demand Script Loading Fix:** Removed the unconditional global `<script src="https://checkout.razorpay.com/v1/checkout.js">` from `/index.html`. Razorpay's script now loads solely when an authorized user triggers payment inside `CheckoutPage.tsx`.
- **Honest AI Model-Training Clarification:** Replaced blanket claims in the privacy text with an honest disclosure explaining that AI payloads pass through the Google Gemini API and depend on the owner's configured Google Cloud / AI Studio billing tier and Data Processing Addendum (DPA).

---

## 7. Data Retention & Deletion Architecture

| Data Category | Policy / Retention Schedule | Deletion Behavior (`anonymizeAndDeleteStudentAccount`) |
|---|---|---|
| **Authentication Sessions** | 7 days rolling TTL | Immediately deleted from `sessions` table & `tuteach_session` cookie cleared |
| **Account Credentials** | Active lifetime | Immediately deleted from `student_passwords` (login permanently disabled -> `401`) |
| **Student Profile & Consents** | Active + 3 yrs audit accountability | PII overwritten (`name: 'Deleted User'`, `email: 'deleted_*@redacted.invalid'`, `dateOfBirth: null`, `targetGoals: null`, `complianceStatus: 'DELETED_ANONYMIZED'`), guardian details redacted |
| **Uploaded Screenshots** | Transient in-request processing (`0 days` DB) | Not persisted in primary database unless attached to a safety escalation |
| **AI Tutor Prompts** | Ephemeral session / server logs <= 30 days | PII scrubbed pre-inference via `checkMinorSafetyAndScrubPii` |
| **Browser Learning State** | User-scoped `localStorage` | Immediately purged for the user on deletion (`AppContext.deleteCurrentAccount`) |
| **Financial & Payment Ledgers** | **8 years** statutory tax/accounting retention | Non-PII order IDs, amounts (₹499), and statuses retained while `studentEmail` is scrubbed to `'REDACTED_FINANCIAL_RETENTION'` (`financialRecordsRetained: true`) |

---

## 8. Legal Policies & Version Tracking Status

All **14** versioned policy records (`v1.0.0`, effective `2026-11-21`) are seeded in `policy_versions`, inspectable in `LegalCenterPages.tsx`, and linked from registration, checkout, dashboard, and footer:

1. `privacy_policy` — Privacy Policy
2. `terms_conditions` — Terms & Conditions
3. `student_agreement` — Student User Agreement
4. `child_safety` — Child Protection & Parental Consent Policy
5. `ai_disclosure` — AI Usage & Safety Disclosure
6. `refund_policy` — Payment, Cancellation & Refund Policy
7. `cookie_policy` — Cookie & Tracking Policy
8. `acceptable_use` — Acceptable Use & Academic Integrity Policy
9. `ip_disclaimer` — Intellectual Property & Third-Party Software Disclaimer
10. `certificate_disclaimer` — Certificate Disclaimer
11. `grievance_policy` — Grievance Redressal Policy
12. `data_retention_policy` — Data Retention & Deletion Policy
13. `third_party_processors` — Third-Party Service & Data Transfer Disclosure
14. `security_practices` — Security Practices & Incident Notification Notice

Every signup, checkout, AI disclosure acceptance, cookie update, parental approval, and re-consent logs an immutable row in `policy_acceptances` with timestamp, IP address, and user-agent. When an admin publishes a bumped policy version with `requiresFreshConsent: true`, affected students automatically see `pendingFreshPolicies` on `/api/auth/me` and a re-consent banner in `DashboardPage.tsx` (`POST /api/compliance/reconsent`).

---

## 9. Items Requiring Owner Legal Details (`[OWNER TO PROVIDE]` List)

The codebase explicitly avoids fabricating legal entity or statutory officer details. `detectMissingOwnerLegalFields()` currently detects **8 missing owner fields** surfaced in `LegalCenterPages.tsx`, `GrievancePage.tsx`, and `AdminCompliancePage.tsx`:

1. `[OWNER TO PROVIDE: Legal Business / Entity Name]`
2. `[OWNER TO PROVIDE: Registered Business Address]`
3. `[OWNER TO PROVIDE: Official Privacy Contact Email]`
4. `[OWNER TO PROVIDE: Grievance Officer Full Name]`
5. `[OWNER TO PROVIDE: Grievance Officer Phone / Postal Contact]`
6. `[OWNER TO PROVIDE: Official Grievance Contact Email]`
7. `[OWNER TO PROVIDE: Response SLA, e.g., Acknowledgment within 24 hours, resolution within 15–30 days]`
8. `[OWNER TO PROVIDE: Data Protection Officer / Privacy Lead (if applicable)]`

Additional legal text placeholders inside `LegalCenterPages.tsx` requiring owner/counsel finalization:
- **Governing Law & Courts Jurisdiction** (`terms_conditions`, line 157)
- **Refund Eligibility Window & SLA Rules** (`refund_policy`, line 198)
- **Admin Setup Credential (`TUTEACH_ADMIN_PASSCODE`)**: Not currently set in environment secrets; must be configured securely via AI Studio Secrets / `.env` when claiming/rotating owner admin governance access on `/admin-compliance`.

---

## 10. Third-Party Processor Summary

| Processor | Purpose | Data Shared | Region | Legal Review Status |
|---|---|---|---|---|
| **Google Gemini API (`@google/genai`)** | Golu Guru chat, screenshot guidance, rubric grading | PII-scrubbed prompts, lesson context, optional screenshots | US / Global Cloud | `CONFIGURED_NEEDS_LEGAL_REVIEW` *(Verify paid Cloud/AI Studio zero-training DPA)* |
| **Razorpay Software Private Limited** | ₹499 checkout, UPI QR, webhook verification | Order ID, ₹499 amount, student name & email | India | `CONFIGURED_NEEDS_LEGAL_REVIEW` *(Currently Test Mode `rzp_test_*`; requires Live KYC & Merchant Agreement)* |
| **Cloud Run & PostgreSQL (PGlite / Cloud SQL)** | Hosting, accounts, sessions, consents, ledgers | Profile fields, bcrypt hashes, session tokens, compliance logs | Configurable (`asia-east1`) | `CONFIGURED_NEEDS_LEGAL_REVIEW` *(Verify hosting DPA & regional storage)* |
| **Browser Web Speech API** | Optional voice input & TTS playback | Audio processed transiently in browser/OS only on mic click | Device / Browser Vendor | `USER_INITIATED_BROWSER_API` |
| **Google Fonts & YouTube Nocookie Embed** | Typography (`Plus Jakarta Sans` / `JetBrains Mono`) & video embed | HTTP headers / IP on page load | Global CDN | `DISCLOSED_FUNCTIONAL` *(Consider self-hosting fonts before strict EU public launch)* |

---

## 11. Test Results Summary

All server & client checks below were executed against the running Express/Vite application (`http://localhost:3000`) after the final implementation changes:

| Verification Suite / Check | Total | Passed | Failed | Partial | Not Tested | Notes & Honest Disclosure |
|---|---:|---:|---:|---:|---:|---|
| **Production Build (`vite build` / `compile_applet`)** | 1 | 1 | 0 | 0 | 0 | **PASS** — Production assets compiled cleanly. |
| **TypeScript Static Check (`npm run lint` / `tsc --noEmit`)** | 1 | 1 | 0 | 0 | 0 | **PASS** — `0` compiler errors. |
| **Global Legal Compliance & Safety Suite (`test_compliance_suite.ts`)** | 18 | 18 | 0 | 0 | 0 | **PASS (`T00–T17`)** — Covers missing signup consent (`400`), India `<18`, US `<13`, EU GDPR Art. 8 (DE `15<16`), GB blocked (`COUNTRY_REVIEW_REQUIRED`), parental approval/rejection/withdrawal/one-time token replay block, immutable DOB (`403`), cross-account isolation, admin RBAC (`403`), data export/correction, minor ad block (`403`), AI disclosure (`403 -> 200`), PII scrubbing, safety prompt blocking, AI report ticket (`GRV-*`), account erasure + retained financial ledger, policy bump re-consent, and admin governance overview. |
| **Production Security & DB Suite (`test_production_readiness.ts`)** | 28 | 28 | 0 | 0 | 0 | **PASS** — Legacy test registration updated to supply adult `countryCode`, `dateOfBirth`, and `acceptedPolicies: true`. |
| **Payment Security Scenarios (`test_payment_security_scenarios.ts`)** | 35 | 35 | 0 | 0 | 0 | **PASS** — Legacy test payloads updated with adult compliance fields + enrolled test user `ai-disclosure` acceptance prior to rubric grading. |
| **Razorpay QR & Order Verification (`test_qr_payment_verification.ts`)** | 9 | 9 | 0 | 0 | 0 | **PASS** — Legacy test payloads updated with adult compliance fields. |
| **Phase 4 Controlled Fixes Suite (`test_phase4_fixes.ts`)** | 14 | 14 | 0 | 0 | 0 | **PASS** — Legacy test payloads updated with adult compliance fields + `ai-disclosure` acceptance. |
| **Phase 3 Student Simulation Audit (`test_phase3_simulation_audit.ts`)** | 48 | 44 | 3* | 0 | 1 | **44 PASS, 3\* Live-LLM Wording Mismatches, 0 PARTIAL, 1 NOT TESTED (`P4-01` Hardware Mic)**. *In live Gemini run: `P2-Step3`, `P3-04`, and `P3-06` produced valid desk-side explanations/analogies (`storage box`, `tap the "B" key`, `creative workshop`) that did not contain the test harness's rigid regex literal words; all payment, entitlement, latency (`2173ms`), screenshot, 2-attempt grading, Demo parity, and isolation tests passed 100%.* |
| **Live Metadata & SPA Routes Smoke Check (`curl` / `node`)** | 15 | 15 | 0 | 0 | 0 | **PASS** — `/api/health`, `/api/compliance/policies` (14 policies, 6 schedules, 5 processors, 8 missing owner fields), `/api/compliance/jurisdictions` (37 rules: 29 enabled, 8 review-required), and all 11 tested SPA routes returned HTTP `200`. |
| **Interactive Browser Visual UI & Hardware Mic Walkthrough** | 1 | 0 | 0 | 0 | 1 | **NOT TESTED** — Headless container has no interactive Chrome browser window or physical microphone/speakers; manual interactive testing of modals, cookie banner toggles, and voice barge-in is required on desktop/mobile browsers. |

---

## 12. Legal Review & Go-Live Checklist

Before transitioning TUTeach from limited beta to public commercial launch in India, the US, or the EU:

- [ ] **1. Configure Owner Admin Passcode & Clean Up Test Accounts:**
  - Set a private `TUTEACH_ADMIN_PASSCODE` in AI Studio Secrets / hosting environment variables, restart the server, and claim/provision your real owner administrator account on `/admin-compliance`.
  - Remove or archive any automated test rows (including `compliance.admin@tuteach.local` and `@test.local` / `@tuteach.test` accounts) from `/data/postgres` (or Cloud SQL) before onboarding real students, then unset `TUTEACH_ADMIN_PASSCODE` or rotate it after setup.
- [ ] **2. Complete All 8 Legal Entity & Grievance Officer Placeholders:**
  - Fill in Legal Business Name, Registered Address, Privacy Email, Grievance Officer Name/Contact/Email, Response SLA, and DPO/Privacy Lead in Admin Compliance Console -> Legal Entity Config, plus finalize governing law and refund window clauses.
- [ ] **3. Qualified Legal Counsel Sign-Off:**
  - Have qualified Indian EdTech/privacy counsel review all 14 policy texts (India DPDP Act 2023 & DPDP Rules alignment), and engage US/EU counsel before promoting COPPA/GDPR-covered markets to general availability.
- [ ] **4. Upgrade Parental Consent Method for Statutory Public Launch:**
  - Evaluate integrating formal Indian verifiable parental consent mechanisms (e.g., DigiLocker / eKYC / micro-charge verification) where required by final DPDP Rules beyond email-link adult declaration.
- [ ] **5. Third-Party DPAs & Production Infrastructure:**
  - Confirm Google Cloud / AI Studio paid billing Data Processing Addendum (`GEMINI_API_KEY`) confirming zero training on student payloads.
  - Complete Razorpay Live Mode (`rzp_live_*`) KYC and merchant verification, and provision managed PostgreSQL (`DATABASE_URL` / Cloud SQL) so production data never depends on single-container ephemeral disk.
  - Self-host Google Fonts assets locally before strict EU GDPR public rollout.
- [ ] **6. Manual Cross-Browser & Mobile UI Acceptance Testing:**
  - Manually test Registration (`RegisterPage`), Parental Consent link preview/approval/withdrawal (`ParentalConsentPage`), Cookie Banner/Modal, Classroom AI Disclosure Modal, PII-masking banner, **Report AI** flow, Dashboard Privacy Export/Deletion, and hardware microphone barge-in on Chrome, Edge, and mobile viewports.
