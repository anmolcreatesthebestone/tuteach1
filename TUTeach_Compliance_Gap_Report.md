# TUTeach — Pre-Implementation Legal Compliance, Age Protection & Student Safety Gap Report

**Date:** November 21, 2026  
**Baseline Inspected:** Express (`server.ts`), Drizzle ORM + PGlite (`/data/postgres`, `src/db/schema.ts`, `src/db/index.ts`), React SPA (`src/App.tsx`, `src/context/AppContext.tsx`, `src/components/*`), `index.html`.  
**Scope:** Gap assessment prior to implementing global legal compliance, India DPDP / US COPPA / EU GDPR Article 8 / global jurisdiction safeguards, parental consent, privacy rights, AI safety guardrails, cookie governance, grievance redressal, and admin compliance controls.

---

## 1. Current Personal Data Inventory (Collected, Stored & Shared)

| Data Category | Current Storage / Transmission Path | Current Status / Finding |
|---|---|---|
| **Account & Identity Data** | PostgreSQL `students` (`id`, `email`, `name`, `target_goals`, `role`), `student_passwords` (`password_hash`) | Collected via `/api/auth/register`. Does **not** collect country of residence or date of birth. |
| **Session & Technical Metadata** | PostgreSQL `sessions` (`token`, `expires_at`, `user_agent`, `ip_address`), HTTP `HttpOnly` cookie `tuteach_session`, browser `localStorage` (`tuteach_auth_token`, `tuteach_user_davinci`) | Stores `ip_address` & `user_agent` indefinitely with no automated session/log retention purge. Token also cached in `localStorage`. |
| **Learning & Evaluation Data** | Browser `localStorage` scoped by email (`tuteach_completed_*`, `tuteach_evaluations_*`, `tuteach_certs_*`, `tuteach_course_ratings_*`), `tuteach_student_name`, `tuteach_student_experience` | Stored locally in browser without server-side retention schedules, export APIs, or deletion workflows. |
| **AI Tutor Prompts, History & Screenshots** | Sent over HTTPS/HTTP from browser to Express (`/api/tutor/chat`, `/api/demo/chat`, `/api/tutor/analyze-screenshot`, `/api/tutor/evaluate-assignment`), forwarded to `@google/genai` (`GEMINI_API_KEY`) | Prompts and base64 screenshots are sent to Google Gemini API. No pre-use AI disclosure consent check, no minor parental-consent gate before external AI transmission, and no automated PII/safety scrubber. |
| **Voice Audio & Speech Transcripts** | Browser `navigator.mediaDevices.getUserMedia` (Web Audio VAD) + `SpeechRecognition` / `webkitSpeechRecognition`; text transcripts sent to `/api/tutor/chat` | Raw audio stream is processed transiently in-browser for VAD volume metering and browser speech-to-text (no server audio storage), **but** this behavior and browser/OS speech processing are not clearly disclosed to students/parents. |
| **Student ID Claim Metadata (`PricingPage.tsx`)** | Client-side demo controls & local `User` state (`studentIdInstitution`, `studentIdFileName`) | Client UI exposes a `"Simulate ID Verified"` demo button and collects institution/filename without formal retention limits (though backend checkout enforces ₹499 server-side). |
| **Payments & Financial Records** | PostgreSQL `payments` & `course_enrollments`; Razorpay SDK (`rzp_test_*`); `index.html` line 27 & `CheckoutPage.tsx` load `https://checkout.razorpay.com/v1/checkout.js` | Card numbers/CVV are never stored in TUTeach DB (good). However, `CheckoutPage.tsx:309` contained a hardcoded `'anmol@tuteach.ai'` fallback string in failure reporting, and Checkout lacks mandatory versioned Terms/Payment/Refund acceptance capture. |
| **Third-Party Front-End Resources** | `index.html` (Google Fonts), `AppContext.tsx` (`youtube-nocookie.com` embed URL), Razorpay Checkout script (`index.html:27`) | `checkout.razorpay.com/v1/checkout.js` loads globally on every page via `index.html` even before checkout or cookie consent. |

---

## 2. Critical Compliance & Student Safety Gaps Identified

1. **No Jurisdiction or Age Verification Engine (`AuthPages.tsx`, `server.ts`, `schema.ts`):**
   - Registration does not ask for `country` or `dateOfBirth`.
   - No protection exists for Indian minors under 18 (DPDP Act 2023 context), US children under 13 (COPPA context), EU minors under national consent thresholds (13–16 under GDPR Art. 8), or unapproved international jurisdictions.
   - No tamper protection prevents a minor from changing their date of birth repeatedly to bypass age blocks.
   - The registration Terms checkbox (`AuthPages.tsx:177`) defaults to `checked` (`true`), violating affirmative-consent principles.

2. **No Verifiable Parental / Guardian Consent System:**
   - No database model, verification token workflow, parental disclosures, approval/rejection endpoints, consent withdrawal, or parent-initiated child data access/deletion controls exist.
   - No backend block prevents unconsented minor accounts from accessing AI tutoring, screenshots, or paid enrollment features.

3. **Inaccurate / Incomplete AI & Third-Party Disclosures (`PublicInfoPages.tsx`):**
   - `PrivacyPolicyPage` currently states: *"We do not use your private coding submissions or personal assignments to train public general AI models"* without qualifying the actual Google Gemini API plan/tier terms (`process.env.GEMINI_API_KEY`) or naming third-party processors (Google Gemini API, Razorpay, hosting/database infrastructure, browser Web Speech services).
   - No pre-use **AI Privacy & Disclosure Notice** is shown before starting `/classroom` or `/demo`.
   - Classroom lacks an explicit minor-safety system prompt, PII-leak prevention, real-person impersonation guardrails, and an in-classroom **Report Inappropriate/Harmful AI Response** escalation control.

4. **Missing Required Legal & Governance Pages & Policy Versioning:**
   - Only `PrivacyPolicyPage`, `TermsPage`, `ContactPage`, `AboutPage`, and `HelpPage` exist.
   - Missing 12 dedicated documents/pages: **Student Agreement**, **Parent & Guardian Consent Policy**, **Child Safety Policy**, **AI Usage & Disclosure Policy**, **Cookie Policy**, **Refund & Cancellation Policy**, **Payment Terms**, **Data Retention Policy**, **Copyright & IP Policy**, **Community & Acceptable Use Policy**, **Grievance & Complaint Policy**, and **Contact & Legal Information**.
   - Legal pages lack effective dates, version numbers, acceptance audit trails, and clearly marked legal-review placeholders (`[OWNER TO PROVIDE: ...]`).

5. **No Student Privacy Rights Center, Deletion Architecture, or Grievance Redressal:**
   - Students cannot export/view stored personal & compliance records, submit correction requests, withdraw optional consents, or request account deletion from `DashboardPage.tsx`.
   - Deletion logic separating deletable PII from legally retained tax/payment ledger references does not yet exist.
   - `ContactPage` does not persist tracked grievance tickets (`GRV-*`) with categories, optional attachments, SLA timelines, or configurable grievance officer/legal entity placeholders.

6. **No Consent-Aware Cookie Preference Center:**
   - No categorized cookie banner/preference modal (`Essential`, `Analytics`, `Functional`, `Advertising` disabled for minors/by default) exists, and Razorpay external script loads unconditionally in `index.html`.

7. **No Restricted Admin Compliance & Incident Management Dashboard:**
   - No server-side `admin` role authorization middleware or Admin Compliance Console exists to review pending parental consents, withdrawals, privacy/deletion requests, retention warnings, security incidents, grievances, missing owner legal fields, third-party processors, policy acceptances, and enabled/blocked countries.

---

## 3. Implementation Plan (Preserving Existing Product & Security)

Changes will be implemented cleanly in tested stages without redesigning the UI or weakening payment/auth security:
1. **Database Schema & Jurisdiction Rules (`src/db/schema.ts`, `src/db/compliance.ts`, `src/db/index.ts`):** Extend `students` cleanly with non-destructive defaults for legacy accounts (`LEGACY` status), plus new tables for `age_jurisdiction_rules`, `parental_consents`, `policy_versions`, `policy_acceptances`, `privacy_requests`, `grievances`, `data_retention_schedules`, `third_party_processors`, `security_incidents`, `compliance_audit_logs`, and `legal_entity_config`.
2. **Backend Enforcement & APIs (`server.ts`):** Enforce server-side country/DOB validation, immutable DOB after registration (correction via Privacy Request only), signed one-time expiring parental consent links, consent-gated AI/payment endpoints, AI minor-safety + PII guardrail filter, AI response reporting, privacy export/correction/deletion (anonymizing student PII while preserving legally required anonymized financial ledger rows), grievance tracking, and strict server-side `admin` RBAC endpoints + first-run admin bootstrap per security best practices.
3. **Frontend Compliance UI (`src/components/*`):** Update `RegisterPage`, `CheckoutPage`, `ClassroomPage`, `DemoClassroomPage`, `DashboardPage`, `Footer`, legal pages hub (`LegalCenterPages.tsx`), `ParentalConsentPage.tsx`, `CookieConsentBanner.tsx`, `GrievancePage.tsx`, and `AdminCompliancePage.tsx` preserving TUTeach's exact `#EFEBDA` / `#F14C2F` / `#393636` identity.
4. **Testing & Final Readiness Report:** Run comprehensive compliance tests + all existing security/payment/database/classroom suites, then publish `/TUTeach_Global_Legal_Compliance_Readiness_Report.md`.
