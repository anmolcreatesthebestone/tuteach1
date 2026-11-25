import crypto from 'crypto';
import { eq, and, desc, sql } from 'drizzle-orm';
import { getDb, hashPassword } from './index.ts';
import * as schema from './schema.ts';

// ----------------------------------------------------
// Seed Baseline Rules, Policies, Processors, Retention & Placeholders
// ----------------------------------------------------
let seededPromise: Promise<void> | null = null;

export const INITIAL_JURISDICTIONS: Array<typeof schema.ageJurisdictionRules.$inferInsert> = [
  {
    countryCode: 'IN',
    countryName: 'India',
    regionGroup: 'INDIA',
    consentAgeThreshold: 18,
    applicableFramework: 'INDIA_DPDP',
    enabled: true,
    requiresLegalReview: false,
    parentalConsentRequired: true,
    legalNotes: 'DPDP Act 2023 context: Users under 18 require verifiable parental/guardian consent. Advertising & behavioral profiling disabled for minors.'
  },
  {
    countryCode: 'US',
    countryName: 'United States',
    regionGroup: 'US',
    consentAgeThreshold: 13,
    applicableFramework: 'US_COPPA',
    enabled: true,
    requiresLegalReview: false,
    parentalConsentRequired: true,
    legalNotes: 'COPPA baseline: Users under 13 require verifiable parental consent before personal data collection or AI interaction.'
  },
  // EU Member States (GDPR Art. 8 national thresholds 13–16)
  { countryCode: 'AT', countryName: 'Austria', regionGroup: 'EU_EEA', consentAgeThreshold: 14, applicableFramework: 'EU_GDPR_ART8', enabled: true, requiresLegalReview: false, parentalConsentRequired: true, legalNotes: 'GDPR Art. 8 digital consent age: 14 years.' },
  { countryCode: 'BE', countryName: 'Belgium', regionGroup: 'EU_EEA', consentAgeThreshold: 13, applicableFramework: 'EU_GDPR_ART8', enabled: true, requiresLegalReview: false, parentalConsentRequired: true, legalNotes: 'GDPR Art. 8 digital consent age: 13 years.' },
  { countryCode: 'BG', countryName: 'Bulgaria', regionGroup: 'EU_EEA', consentAgeThreshold: 14, applicableFramework: 'EU_GDPR_ART8', enabled: true, requiresLegalReview: false, parentalConsentRequired: true, legalNotes: 'GDPR Art. 8 digital consent age: 14 years.' },
  { countryCode: 'HR', countryName: 'Croatia', regionGroup: 'EU_EEA', consentAgeThreshold: 16, applicableFramework: 'EU_GDPR_ART8', enabled: true, requiresLegalReview: false, parentalConsentRequired: true, legalNotes: 'GDPR Art. 8 digital consent age: 16 years.' },
  { countryCode: 'CY', countryName: 'Cyprus', regionGroup: 'EU_EEA', consentAgeThreshold: 14, applicableFramework: 'EU_GDPR_ART8', enabled: true, requiresLegalReview: false, parentalConsentRequired: true, legalNotes: 'GDPR Art. 8 digital consent age: 14 years.' },
  { countryCode: 'CZ', countryName: 'Czechia', regionGroup: 'EU_EEA', consentAgeThreshold: 15, applicableFramework: 'EU_GDPR_ART8', enabled: true, requiresLegalReview: false, parentalConsentRequired: true, legalNotes: 'GDPR Art. 8 digital consent age: 15 years.' },
  { countryCode: 'DK', countryName: 'Denmark', regionGroup: 'EU_EEA', consentAgeThreshold: 13, applicableFramework: 'EU_GDPR_ART8', enabled: true, requiresLegalReview: false, parentalConsentRequired: true, legalNotes: 'GDPR Art. 8 digital consent age: 13 years.' },
  { countryCode: 'EE', countryName: 'Estonia', regionGroup: 'EU_EEA', consentAgeThreshold: 13, applicableFramework: 'EU_GDPR_ART8', enabled: true, requiresLegalReview: false, parentalConsentRequired: true, legalNotes: 'GDPR Art. 8 digital consent age: 13 years.' },
  { countryCode: 'FI', countryName: 'Finland', regionGroup: 'EU_EEA', consentAgeThreshold: 13, applicableFramework: 'EU_GDPR_ART8', enabled: true, requiresLegalReview: false, parentalConsentRequired: true, legalNotes: 'GDPR Art. 8 digital consent age: 13 years.' },
  { countryCode: 'FR', countryName: 'France', regionGroup: 'EU_EEA', consentAgeThreshold: 15, applicableFramework: 'EU_GDPR_ART8', enabled: true, requiresLegalReview: false, parentalConsentRequired: true, legalNotes: 'GDPR Art. 8 digital consent age: 15 years.' },
  { countryCode: 'DE', countryName: 'Germany', regionGroup: 'EU_EEA', consentAgeThreshold: 16, applicableFramework: 'EU_GDPR_ART8', enabled: true, requiresLegalReview: false, parentalConsentRequired: true, legalNotes: 'GDPR Art. 8 digital consent age: 16 years.' },
  { countryCode: 'GR', countryName: 'Greece', regionGroup: 'EU_EEA', consentAgeThreshold: 15, applicableFramework: 'EU_GDPR_ART8', enabled: true, requiresLegalReview: false, parentalConsentRequired: true, legalNotes: 'GDPR Art. 8 digital consent age: 15 years.' },
  { countryCode: 'HU', countryName: 'Hungary', regionGroup: 'EU_EEA', consentAgeThreshold: 16, applicableFramework: 'EU_GDPR_ART8', enabled: true, requiresLegalReview: false, parentalConsentRequired: true, legalNotes: 'GDPR Art. 8 digital consent age: 16 years.' },
  { countryCode: 'IE', countryName: 'Ireland', regionGroup: 'EU_EEA', consentAgeThreshold: 16, applicableFramework: 'EU_GDPR_ART8', enabled: true, requiresLegalReview: false, parentalConsentRequired: true, legalNotes: 'GDPR Art. 8 digital consent age: 16 years.' },
  { countryCode: 'IT', countryName: 'Italy', regionGroup: 'EU_EEA', consentAgeThreshold: 14, applicableFramework: 'EU_GDPR_ART8', enabled: true, requiresLegalReview: false, parentalConsentRequired: true, legalNotes: 'GDPR Art. 8 digital consent age: 14 years.' },
  { countryCode: 'LV', countryName: 'Latvia', regionGroup: 'EU_EEA', consentAgeThreshold: 13, applicableFramework: 'EU_GDPR_ART8', enabled: true, requiresLegalReview: false, parentalConsentRequired: true, legalNotes: 'GDPR Art. 8 digital consent age: 13 years.' },
  { countryCode: 'LT', countryName: 'Lithuania', regionGroup: 'EU_EEA', consentAgeThreshold: 14, applicableFramework: 'EU_GDPR_ART8', enabled: true, requiresLegalReview: false, parentalConsentRequired: true, legalNotes: 'GDPR Art. 8 digital consent age: 14 years.' },
  { countryCode: 'LU', countryName: 'Luxembourg', regionGroup: 'EU_EEA', consentAgeThreshold: 16, applicableFramework: 'EU_GDPR_ART8', enabled: true, requiresLegalReview: false, parentalConsentRequired: true, legalNotes: 'GDPR Art. 8 digital consent age: 16 years.' },
  { countryCode: 'MT', countryName: 'Malta', regionGroup: 'EU_EEA', consentAgeThreshold: 13, applicableFramework: 'EU_GDPR_ART8', enabled: true, requiresLegalReview: false, parentalConsentRequired: true, legalNotes: 'GDPR Art. 8 digital consent age: 13 years.' },
  { countryCode: 'NL', countryName: 'Netherlands', regionGroup: 'EU_EEA', consentAgeThreshold: 16, applicableFramework: 'EU_GDPR_ART8', enabled: true, requiresLegalReview: false, parentalConsentRequired: true, legalNotes: 'GDPR Art. 8 digital consent age: 16 years.' },
  { countryCode: 'PL', countryName: 'Poland', regionGroup: 'EU_EEA', consentAgeThreshold: 16, applicableFramework: 'EU_GDPR_ART8', enabled: true, requiresLegalReview: false, parentalConsentRequired: true, legalNotes: 'GDPR Art. 8 digital consent age: 16 years.' },
  { countryCode: 'PT', countryName: 'Portugal', regionGroup: 'EU_EEA', consentAgeThreshold: 13, applicableFramework: 'EU_GDPR_ART8', enabled: true, requiresLegalReview: false, parentalConsentRequired: true, legalNotes: 'GDPR Art. 8 digital consent age: 13 years.' },
  { countryCode: 'RO', countryName: 'Romania', regionGroup: 'EU_EEA', consentAgeThreshold: 16, applicableFramework: 'EU_GDPR_ART8', enabled: true, requiresLegalReview: false, parentalConsentRequired: true, legalNotes: 'GDPR Art. 8 digital consent age: 16 years.' },
  { countryCode: 'SK', countryName: 'Slovakia', regionGroup: 'EU_EEA', consentAgeThreshold: 16, applicableFramework: 'EU_GDPR_ART8', enabled: true, requiresLegalReview: false, parentalConsentRequired: true, legalNotes: 'GDPR Art. 8 digital consent age: 16 years.' },
  { countryCode: 'SI', countryName: 'Slovenia', regionGroup: 'EU_EEA', consentAgeThreshold: 16, applicableFramework: 'EU_GDPR_ART8', enabled: true, requiresLegalReview: false, parentalConsentRequired: true, legalNotes: 'GDPR Art. 8 digital consent age: 16 years.' },
  { countryCode: 'ES', countryName: 'Spain', regionGroup: 'EU_EEA', consentAgeThreshold: 14, applicableFramework: 'EU_GDPR_ART8', enabled: true, requiresLegalReview: false, parentalConsentRequired: true, legalNotes: 'GDPR Art. 8 digital consent age: 14 years.' },
  { countryCode: 'SE', countryName: 'Sweden', regionGroup: 'EU_EEA', consentAgeThreshold: 13, applicableFramework: 'EU_GDPR_ART8', enabled: true, requiresLegalReview: false, parentalConsentRequired: true, legalNotes: 'GDPR Art. 8 digital consent age: 13 years.' },
  // Unverified / Pending Legal Review Jurisdictions (disabled for unrestricted rollout until verified by local counsel)
  { countryCode: 'GB', countryName: 'United Kingdom', regionGroup: 'REST_OF_WORLD', consentAgeThreshold: 13, applicableFramework: 'GLOBAL_CONFIGURABLE', enabled: false, requiresLegalReview: true, parentalConsentRequired: true, legalNotes: 'UK Age Appropriate Design Code / UK GDPR review required prior to launch.' },
  { countryCode: 'CA', countryName: 'Canada', regionGroup: 'REST_OF_WORLD', consentAgeThreshold: 16, applicableFramework: 'GLOBAL_CONFIGURABLE', enabled: false, requiresLegalReview: true, parentalConsentRequired: true, legalNotes: 'PIPEDA / provincial consent review required prior to launch.' },
  { countryCode: 'AU', countryName: 'Australia', regionGroup: 'REST_OF_WORLD', consentAgeThreshold: 16, applicableFramework: 'GLOBAL_CONFIGURABLE', enabled: false, requiresLegalReview: true, parentalConsentRequired: true, legalNotes: 'Australian Privacy Act / Online Safety Code review required.' },
  { countryCode: 'SG', countryName: 'Singapore', regionGroup: 'REST_OF_WORLD', consentAgeThreshold: 18, applicableFramework: 'GLOBAL_CONFIGURABLE', enabled: false, requiresLegalReview: true, parentalConsentRequired: true, legalNotes: 'Singapore PDPA legal review required prior to launch.' },
  { countryCode: 'AE', countryName: 'United Arab Emirates', regionGroup: 'REST_OF_WORLD', consentAgeThreshold: 18, applicableFramework: 'GLOBAL_CONFIGURABLE', enabled: false, requiresLegalReview: true, parentalConsentRequired: true, legalNotes: 'UAE PDPL legal review required prior to launch.' },
  { countryCode: 'BR', countryName: 'Brazil', regionGroup: 'REST_OF_WORLD', consentAgeThreshold: 18, applicableFramework: 'GLOBAL_CONFIGURABLE', enabled: false, requiresLegalReview: true, parentalConsentRequired: true, legalNotes: 'LGPD Art. 14 child consent legal review required.' },
  { countryCode: 'JP', countryName: 'Japan', regionGroup: 'REST_OF_WORLD', consentAgeThreshold: 18, applicableFramework: 'GLOBAL_CONFIGURABLE', enabled: false, requiresLegalReview: true, parentalConsentRequired: true, legalNotes: 'APPI legal review required prior to launch.' },
  { countryCode: 'OTHER', countryName: 'Other Country / Unlisted Region', regionGroup: 'REST_OF_WORLD', consentAgeThreshold: 18, applicableFramework: 'GLOBAL_CONFIGURABLE', enabled: false, requiresLegalReview: true, parentalConsentRequired: true, legalNotes: 'Country not yet reviewed for local child-protection and data-transfer rules. Restricted until legal approval.' }
];

export const INITIAL_POLICIES: Array<typeof schema.policyVersions.$inferInsert> = [
  { id: 'pol_privacy', policyKey: 'privacy_policy', title: 'Privacy Policy', version: '1.0.0', effectiveDate: '2026-11-21', requiresFreshConsent: false, summary: 'Covers personal data collected, DPDP/GDPR/COPPA rights, retention schedules, and international transfers.' },
  { id: 'pol_terms', policyKey: 'terms_conditions', title: 'Terms & Conditions', version: '1.0.0', effectiveDate: '2026-11-21', requiresFreshConsent: false, summary: 'Platform usage rules, eligibility, acceptable use, intellectual property, and dispute placeholders.' },
  { id: 'pol_student', policyKey: 'student_agreement', title: 'Student User Agreement', version: '1.0.0', effectiveDate: '2026-11-21', requiresFreshConsent: false, summary: 'Course classroom etiquette, honest assignment submission rules, and certificate eligibility criteria.' },
  { id: 'pol_child', policyKey: 'child_safety', title: 'Child Protection & Parental Consent Policy', version: '1.0.0', effectiveDate: '2026-11-21', requiresFreshConsent: false, summary: 'India <18, US <13, and EU national digital-consent thresholds, verifiable consent workflow, and anti-profiling controls.' },
  { id: 'pol_ai', policyKey: 'ai_disclosure', title: 'AI Usage & Safety Disclosure', version: '1.0.0', effectiveDate: '2026-11-21', requiresFreshConsent: false, summary: 'Golu Guru AI teacher behavior, Google Gemini processing disclosure, non-human status, and safety escalation.' },
  { id: 'pol_refund', policyKey: 'refund_policy', title: 'Payment, Cancellation & Refund Policy', version: '1.0.0', effectiveDate: '2026-11-21', requiresFreshConsent: false, summary: 'Razorpay ₹499 checkout terms, statutory accounting retention, and refund request procedures.' },
  { id: 'pol_cookies', policyKey: 'cookie_policy', title: 'Cookie & Tracking Policy', version: '1.0.0', effectiveDate: '2026-11-21', requiresFreshConsent: false, summary: 'Strictly Necessary vs Functional, Analytics, and Advertising (disabled for minors) cookie controls.' },
  { id: 'pol_aup', policyKey: 'acceptable_use', title: 'Acceptable Use & Academic Integrity Policy', version: '1.0.0', effectiveDate: '2026-11-21', requiresFreshConsent: false, summary: 'Prohibition of abuse, harmful prompts, harassment, credential sharing, and unauthorized scraping.' },
  { id: 'pol_ip', policyKey: 'ip_disclaimer', title: 'Intellectual Property & Third-Party Software Disclaimer', version: '1.0.0', effectiveDate: '2026-11-21', requiresFreshConsent: false, summary: 'Clarifies TUTeach independence from Blackmagic Design / DaVinci Resolve trademarks.' },
  { id: 'pol_cert', policyKey: 'certificate_disclaimer', title: 'Certificate Disclaimer', version: '1.0.0', effectiveDate: '2026-11-21', requiresFreshConsent: false, summary: 'Clarifies TUTeach completion certificates verify in-platform assessment only and are not accredited university degrees.' },
  { id: 'pol_grievance', policyKey: 'grievance_policy', title: 'Grievance Redressal Policy', version: '1.0.0', effectiveDate: '2026-11-21', requiresFreshConsent: false, summary: 'Reporting channels, tracking numbers, response SLA, and Grievance Officer placeholder details.' },
  { id: 'pol_retention', policyKey: 'data_retention_policy', title: 'Data Retention & Deletion Policy', version: '1.0.0', effectiveDate: '2026-11-21', requiresFreshConsent: false, summary: 'Documented storage periods across sessions, AI payloads, screenshots, accounts, and tax/payment ledgers.' },
  { id: 'pol_processors', policyKey: 'third_party_processors', title: 'Third-Party Service & Data Transfer Disclosure', version: '1.0.0', effectiveDate: '2026-11-21', requiresFreshConsent: false, summary: 'Inventory of external vendors including Google Gemini API, Razorpay, hosting/DB, and browser speech APIs.' },
  { id: 'pol_security', policyKey: 'security_practices', title: 'Security Practices & Incident Notification Notice', version: '1.0.0', effectiveDate: '2026-11-21', requiresFreshConsent: false, summary: 'Password hashing, signature verification, session controls, and incident handling protocols.' }
];

export const INITIAL_RETENTION_SCHEDULES: Array<typeof schema.dataRetentionSchedules.$inferInsert> = [
  { id: 'ret_sessions', dataCategory: 'Authentication Sessions', retentionDays: 7, retentionLabel: '7 days rolling TTL', legalBasis: 'Service security & session continuity', autoPurgeSupported: true, notes: 'Automatically expired and purged when signed out or deleted.' },
  { id: 'ret_ai_chat', dataCategory: 'AI Tutor Conversation Payloads', retentionDays: 30, retentionLabel: 'Session ephemeral (server logs <= 30 days)', legalBasis: 'Educational service delivery & safety monitoring', autoPurgeSupported: true, notes: 'Sent to Google Gemini API for inference; subject to configured Gemini API tier terms.' },
  { id: 'ret_screenshots', dataCategory: 'Uploaded Classroom Screenshots', retentionDays: 0, retentionLabel: 'Transient processing only (0 days persistent DB storage)', legalBasis: 'Visual workspace guidance upon student action', autoPurgeSupported: true, notes: 'Processed in-request for multimodal analysis and not stored permanently unless attached to a safety report.' },
  { id: 'ret_student_pii', dataCategory: 'Student Account Profile & Consent Records', retentionDays: 1095, retentionLabel: 'Active account + 3 years post-closure audit minimum', legalBasis: 'Consent accountability & legal defense', autoPurgeSupported: true, notes: 'Immediate PII anonymization upon student/parent deletion request.' },
  { id: 'ret_payments', dataCategory: 'Financial & Razorpay Transaction Ledgers', retentionDays: 2920, retentionLabel: '8 years (Tax & Accounting Statutory Retention)', legalBasis: 'Indian tax/accounting compliance & audit obligations', autoPurgeSupported: false, notes: 'Emails are redacted on account deletion while non-PII ledger IDs and amounts are preserved.' },
  { id: 'ret_grievances', dataCategory: 'Grievances & Security Incident Logs', retentionDays: 1095, retentionLabel: '3 years from resolution', legalBasis: 'Regulatory grievance & safety accountability', autoPurgeSupported: false, notes: 'Maintained for compliance inspection.' }
];

export const INITIAL_PROCESSORS: Array<typeof schema.thirdPartyProcessors.$inferInsert> = [
  { id: 'proc_gemini', processorName: 'Google Gemini API (@google/genai)', serviceCategory: 'AI Inference & Multimodal Analysis', purpose: 'Powers Golu Guru conversational tutoring, screenshot guidance, and rubric grading.', dataShared: 'Tutor conversation prompts, language mode, lesson context, optional uploaded screenshots (PII-scrubbed best-effort).', jurisdiction: 'United States / Global Cloud Regions', status: 'CONFIGURED_NEEDS_LEGAL_REVIEW', policyNote: 'Owner must verify Google AI Studio / Cloud paid billing DPA terms to confirm zero model training on API payloads.' },
  { id: 'proc_razorpay', processorName: 'Razorpay Software Private Limited', serviceCategory: 'Payment Gateway', purpose: 'Processes ₹499 course orders, UPI QR codes, and webhook verification.', dataShared: 'Order ID, ₹499 amount, student name, student email (on checkout initiation). Card/UPI credentials remain strictly with Razorpay.', jurisdiction: 'India', status: 'CONFIGURED_NEEDS_LEGAL_REVIEW', policyNote: 'Owner must sign Razorpay merchant agreement and verify Live Mode KYC.' },
  { id: 'proc_hosting', processorName: 'Cloud Run & PostgreSQL (PGlite / Cloud SQL)', serviceCategory: 'Application Hosting & Database', purpose: 'Stores accounts, sessions, enrollments, parental consents, and audit records.', dataShared: 'Registration fields, hashed passwords, session tokens, compliance audit logs.', jurisdiction: 'Configurable (asia-east1 / region)', status: 'CONFIGURED_NEEDS_LEGAL_REVIEW', policyNote: 'Owner must verify hosting DPA and cross-border transfer notices.' },
  { id: 'proc_webspeech', processorName: 'Browser Web Speech API (Local/OS Speech Engine)', serviceCategory: 'Voice Recognition & TTS', purpose: 'Optional hands-free microphone input and spoken audio playback inside AI classroom.', dataShared: 'Audio processed via browser/OS vendor speech service when microphone is explicitly activated by student.', jurisdiction: 'Device / Browser Vendor Region', status: 'USER_INITIATED_BROWSER_API', policyNote: 'Only activated on explicit click; never records passively in background.' },
  { id: 'proc_fonts_media', processorName: 'Google Fonts & YouTube Nocookie Embed', serviceCategory: 'Typography & Tutorial Reference', purpose: 'Renders Plus Jakarta Sans / JetBrains Mono typography and privacy-enhanced DaVinci tutorials.', dataShared: 'HTTP request headers / IP address to font/media CDN.', jurisdiction: 'Global CDN', status: 'DISCLOSED_FUNCTIONAL', policyNote: 'Self-hosting fonts recommended before strict EU public launch.' }
];

export async function ensureComplianceSeeded() {
  if (seededPromise) return seededPromise;
  seededPromise = (async () => {
    const db = await getDb();

    // Seed Jurisdiction Rules if missing
    for (const rule of INITIAL_JURISDICTIONS) {
      const existing = await db
        .select({ code: schema.ageJurisdictionRules.countryCode })
        .from(schema.ageJurisdictionRules)
        .where(eq(schema.ageJurisdictionRules.countryCode, rule.countryCode))
        .limit(1);
      if (existing.length === 0) {
        await db.insert(schema.ageJurisdictionRules).values(rule);
      }
    }

    // Seed Policy Versions if missing
    for (const pol of INITIAL_POLICIES) {
      const existing = await db
        .select({ id: schema.policyVersions.id })
        .from(schema.policyVersions)
        .where(eq(schema.policyVersions.policyKey, pol.policyKey))
        .limit(1);
      if (existing.length === 0) {
        await db.insert(schema.policyVersions).values(pol);
      }
    }

    // Seed Retention Schedules if missing
    for (const ret of INITIAL_RETENTION_SCHEDULES) {
      const existing = await db
        .select({ id: schema.dataRetentionSchedules.id })
        .from(schema.dataRetentionSchedules)
        .where(eq(schema.dataRetentionSchedules.id, ret.id))
        .limit(1);
      if (existing.length === 0) {
        await db.insert(schema.dataRetentionSchedules).values(ret);
      }
    }

    // Seed Third-Party Processors if missing
    for (const proc of INITIAL_PROCESSORS) {
      const existing = await db
        .select({ id: schema.thirdPartyProcessors.id })
        .from(schema.thirdPartyProcessors)
        .where(eq(schema.thirdPartyProcessors.id, proc.id))
        .limit(1);
      if (existing.length === 0) {
        await db.insert(schema.thirdPartyProcessors).values(proc);
      }
    }

    // Seed Legal Entity Placeholders if missing (NEVER invent fake company/address/officer)
    const entityRows = await db
      .select({ id: schema.legalEntityConfig.id })
      .from(schema.legalEntityConfig)
      .where(eq(schema.legalEntityConfig.id, 'default'))
      .limit(1);
    if (entityRows.length === 0) {
      await db.insert(schema.legalEntityConfig).values({
        id: 'default',
        legalBusinessName: '[OWNER TO PROVIDE: Legal Business / Entity Name]',
        registeredAddress: '[OWNER TO PROVIDE: Registered Business Address]',
        privacyEmail: '[OWNER TO PROVIDE: Official Privacy Contact Email]',
        grievanceOfficerName: '[OWNER TO PROVIDE: Grievance Officer Full Name]',
        grievanceOfficerContact: '[OWNER TO PROVIDE: Grievance Officer Phone / Postal Contact]',
        grievanceEmail: '[OWNER TO PROVIDE: Official Grievance Contact Email]',
        grievanceResponseSla: '[OWNER TO PROVIDE: Response SLA, e.g., Acknowledgment within 24 hours, resolution within 15–30 days]',
        dpoOrPrivacyLead: '[OWNER TO PROVIDE: Data Protection Officer / Privacy Lead (if applicable)]'
      });
    }
  })().catch((err) => {
    seededPromise = null;
    throw err;
  });

  return seededPromise;
}

// ----------------------------------------------------
// Age & Jurisdiction Calculation Engine
// ----------------------------------------------------
export interface AgeJurisdictionEvaluation {
  valid: boolean;
  error?: string;
  countryCode: string;
  countryName: string;
  ageYears: number;
  isMinor: boolean;
  consentAgeThreshold: number;
  applicableFramework: string;
  jurisdictionEnabled: boolean;
  requiresLegalReview: boolean;
  requiresParentalConsent: boolean;
  complianceStatus:
    | 'ACTIVE'
    | 'PENDING_PARENTAL_CONSENT'
    | 'COUNTRY_REVIEW_REQUIRED';
  parentalConsentStatus: 'NOT_REQUIRED' | 'PENDING';
}

export function calculateUtcAge(dateOfBirth: string): { valid: boolean; age: number; error?: string } {
  if (!dateOfBirth || !/^\d{4}-\d{2}-\d{2}$/.test(dateOfBirth.trim())) {
    return { valid: false, age: 0, error: 'Date of birth must be in YYYY-MM-DD format.' };
  }
  const [yStr, mStr, dStr] = dateOfBirth.trim().split('-');
  const year = Number(yStr);
  const month = Number(mStr);
  const day = Number(dStr);
  const dob = new Date(Date.UTC(year, month - 1, day));
  if (
    Number.isNaN(dob.getTime()) ||
    dob.getUTCFullYear() !== year ||
    dob.getUTCMonth() !== month - 1 ||
    dob.getUTCDate() !== day
  ) {
    return { valid: false, age: 0, error: 'Invalid calendar date of birth.' };
  }

  const now = new Date();
  if (dob.getTime() > now.getTime()) {
    return { valid: false, age: 0, error: 'Date of birth cannot be in the future.' };
  }

  let age = now.getUTCFullYear() - year;
  const monthDiff = now.getUTCMonth() - (month - 1);
  if (monthDiff < 0 || (monthDiff === 0 && now.getUTCDate() < day)) {
    age--;
  }

  if (age < 4 || age > 120) {
    return { valid: false, age: 0, error: 'Please enter a valid student date of birth (age between 4 and 120 years).' };
  }

  return { valid: true, age };
}

export async function evaluateAgeAndJurisdiction(
  rawCountryCode: string,
  dateOfBirth: string
): Promise<AgeJurisdictionEvaluation> {
  await ensureComplianceSeeded();
  const db = await getDb();

  const dobCheck = calculateUtcAge(dateOfBirth);
  if (!dobCheck.valid) {
    return {
      valid: false,
      error: dobCheck.error,
      countryCode: (rawCountryCode || 'OTHER').toUpperCase(),
      countryName: 'Unknown',
      ageYears: 0,
      isMinor: true,
      consentAgeThreshold: 18,
      applicableFramework: 'GLOBAL_CONFIGURABLE',
      jurisdictionEnabled: false,
      requiresLegalReview: true,
      requiresParentalConsent: true,
      complianceStatus: 'COUNTRY_REVIEW_REQUIRED',
      parentalConsentStatus: 'PENDING'
    };
  }

  const normalizedCode = (rawCountryCode || '').trim().toUpperCase();
  if (!normalizedCode) {
    return {
      valid: false,
      error: 'Country / Jurisdiction is required during registration.',
      countryCode: 'OTHER',
      countryName: 'Unknown',
      ageYears: dobCheck.age,
      isMinor: true,
      consentAgeThreshold: 18,
      applicableFramework: 'GLOBAL_CONFIGURABLE',
      jurisdictionEnabled: false,
      requiresLegalReview: true,
      requiresParentalConsent: true,
      complianceStatus: 'COUNTRY_REVIEW_REQUIRED',
      parentalConsentStatus: 'PENDING'
    };
  }

  const ruleRows = await db
    .select()
    .from(schema.ageJurisdictionRules)
    .where(eq(schema.ageJurisdictionRules.countryCode, normalizedCode))
    .limit(1);

  const rule: schema.AgeJurisdictionRule =
    ruleRows[0] || {
      countryCode: normalizedCode,
      countryName: `Unreviewed Jurisdiction (${normalizedCode})`,
      regionGroup: 'REST_OF_WORLD',
      consentAgeThreshold: 18,
      applicableFramework: 'GLOBAL_CONFIGURABLE',
      enabled: false,
      requiresLegalReview: true,
      parentalConsentRequired: true,
      legalNotes: 'Default conservative hold for unconfigured jurisdiction.',
      updatedAt: new Date()
    };

  const isMinor = dobCheck.age < rule.consentAgeThreshold;

  if (!rule.enabled || rule.requiresLegalReview) {
    return {
      valid: true,
      countryCode: rule.countryCode,
      countryName: rule.countryName,
      ageYears: dobCheck.age,
      isMinor,
      consentAgeThreshold: rule.consentAgeThreshold,
      applicableFramework: rule.applicableFramework,
      jurisdictionEnabled: false,
      requiresLegalReview: true,
      requiresParentalConsent: isMinor && rule.parentalConsentRequired,
      complianceStatus: 'COUNTRY_REVIEW_REQUIRED',
      parentalConsentStatus: isMinor ? 'PENDING' : 'NOT_REQUIRED'
    };
  }

  if (isMinor && rule.parentalConsentRequired) {
    return {
      valid: true,
      countryCode: rule.countryCode,
      countryName: rule.countryName,
      ageYears: dobCheck.age,
      isMinor: true,
      consentAgeThreshold: rule.consentAgeThreshold,
      applicableFramework: rule.applicableFramework,
      jurisdictionEnabled: true,
      requiresLegalReview: false,
      requiresParentalConsent: true,
      complianceStatus: 'PENDING_PARENTAL_CONSENT',
      parentalConsentStatus: 'PENDING'
    };
  }

  return {
    valid: true,
    countryCode: rule.countryCode,
    countryName: rule.countryName,
    ageYears: dobCheck.age,
    isMinor: false,
    consentAgeThreshold: rule.consentAgeThreshold,
    applicableFramework: rule.applicableFramework,
    jurisdictionEnabled: true,
    requiresLegalReview: false,
    requiresParentalConsent: false,
    complianceStatus: 'ACTIVE',
    parentalConsentStatus: 'NOT_REQUIRED'
  };
}

// ----------------------------------------------------
// Audit Logging & Policy Acceptances
// ----------------------------------------------------
export async function logComplianceAudit(
  actorId: string,
  actorRole: string,
  action: string,
  targetType: string,
  targetId: string,
  summary: string
) {
  const db = await getDb();
  await db.insert(schema.complianceAuditLogs).values({
    id: `aud_${crypto.randomBytes(8).toString('hex')}`,
    actorId,
    actorRole,
    action,
    targetType,
    targetId,
    summary,
    createdAt: new Date()
  });
}

export async function recordPolicyAcceptances(
  studentId: string,
  policyKeys: string[],
  context: string,
  ipAddress?: string,
  userAgent?: string
) {
  await ensureComplianceSeeded();
  const db = await getDb();
  const policies = await db.select().from(schema.policyVersions);
  const byKey = new Map<string, schema.PolicyVersion>(
    policies.map((p: schema.PolicyVersion) => [p.policyKey, p])
  );

  for (const key of policyKeys) {
    const pol = byKey.get(key);
    const version = pol ? pol.version : '1.0.0';
    await db.insert(schema.policyAcceptances).values({
      id: `acc_${crypto.randomBytes(8).toString('hex')}`,
      studentId,
      policyKey: key,
      policyVersion: version,
      context,
      acceptedAt: new Date(),
      ipAddress: ipAddress || null,
      userAgent: userAgent || null
    });
  }
}

export async function getPoliciesRequiringFreshConsent(studentId: string): Promise<schema.PolicyVersion[]> {
  await ensureComplianceSeeded();
  const db = await getDb();
  const flaggedPolicies: schema.PolicyVersion[] = await db
    .select()
    .from(schema.policyVersions)
    .where(eq(schema.policyVersions.requiresFreshConsent, true));

  if (flaggedPolicies.length === 0) return [];

  const acceptances: schema.PolicyAcceptance[] = await db
    .select()
    .from(schema.policyAcceptances)
    .where(eq(schema.policyAcceptances.studentId, studentId));

  return flaggedPolicies.filter((pol) => {
    return !acceptances.some(
      (acc) => acc.policyKey === pol.policyKey && acc.policyVersion === pol.version
    );
  });
}

// ----------------------------------------------------
// Verifiable Parental Consent Lifecycle
// ----------------------------------------------------
function sha256Hex(raw: string): string {
  return crypto.createHash('sha256').update(raw).digest('hex');
}

export async function createParentalConsentRequest(params: {
  student: schema.Student;
  parentName: string;
  parentEmail: string;
  relationship: string;
  ipAddress?: string;
  userAgent?: string;
}): Promise<{
  consentId: string;
  rawToken: string;
  expiresAt: Date;
  noticeSummary: string;
  policyVersion: string;
}> {
  await ensureComplianceSeeded();
  const db = await getDb();

  // Check current child_safety policy version
  const childPolRows = await db
    .select()
    .from(schema.policyVersions)
    .where(eq(schema.policyVersions.policyKey, 'child_safety'))
    .limit(1);
  const policyVersion = childPolRows[0]?.version || '1.0.0';

  // Invalidate prior unused PENDING requests for this student so older tokens cannot be replayed
  await db
    .update(schema.parentalConsents)
    .set({
      verificationTokenHash: null,
      tokenConsumedAt: new Date(),
      updatedAt: new Date()
    })
    .where(
      and(
        eq(schema.parentalConsents.studentId, params.student.id),
        eq(schema.parentalConsents.status, 'PENDING')
      )
    );

  const rawToken = `tut_pconsent_${crypto.randomBytes(24).toString('hex')}`;
  const tokenHash = sha256Hex(rawToken);
  const expiresAt = new Date(Date.now() + 72 * 60 * 60 * 1000); // 72 hours
  const consentId = `pc_${crypto.randomBytes(8).toString('hex')}`;

  const noticeSummary = `Verifiable Parental/Guardian Consent Notice (${params.student.applicableFramework}): Student ${params.student.name} (country: ${params.student.countryCode}, registered age: ${params.student.ageAtRegistration ?? 'minor'}) seeks access to TUTeach DaVinci Resolve lessons, interactive AI Tutor (Golu Guru via Google Gemini API), optional voice input, optional screenshot guidance, and Razorpay course checkout. Behavioral advertising is strictly OFF for minors.`;

  await db.insert(schema.parentalConsents).values({
    id: consentId,
    studentId: params.student.id,
    parentName: params.parentName.trim(),
    parentEmail: params.parentEmail.trim().toLowerCase(),
    relationship: params.relationship.trim(),
    verificationTokenHash: tokenHash,
    tokenExpiresAt: expiresAt,
    status: 'PENDING',
    verificationMethod: 'EMAIL_TOKEN_DECLARATION',
    policyVersion,
    noticeSummary,
    parentAgeConfirmed: false,
    ipAddress: params.ipAddress || null,
    userAgent: params.userAgent || null,
    createdAt: new Date(),
    updatedAt: new Date()
  });

  await logComplianceAudit(
    params.student.id,
    'student',
    'PARENTAL_CONSENT_REQUESTED',
    'parental_consent',
    consentId,
    `Parental consent request initiated for guardian relationship: ${params.relationship}`
  );

  return { consentId, rawToken, expiresAt, noticeSummary, policyVersion };
}

export async function previewParentalConsentByToken(rawToken: string) {
  if (!rawToken || !rawToken.startsWith('tut_pconsent_')) {
    return { valid: false, error: 'Invalid verification link.' };
  }
  const db = await getDb();
  const tokenHash = sha256Hex(rawToken.trim());
  const rows = await db
    .select()
    .from(schema.parentalConsents)
    .where(eq(schema.parentalConsents.verificationTokenHash, tokenHash))
    .limit(1);

  const consent: schema.ParentalConsent | undefined = rows[0];
  if (!consent) {
    return { valid: false, error: 'Verification link is invalid or has already been consumed.' };
  }
  if (consent.tokenConsumedAt) {
    return { valid: false, error: 'This single-use verification link has already been used.' };
  }
  if (consent.tokenExpiresAt && new Date(consent.tokenExpiresAt).getTime() < Date.now()) {
    return { valid: false, error: 'Verification link has expired. Please request a fresh parental consent email from the student portal.' };
  }

  const studentRows = await db
    .select({
      id: schema.students.id,
      name: schema.students.name,
      countryCode: schema.students.countryCode,
      ageAtRegistration: schema.students.ageAtRegistration,
      applicableFramework: schema.students.applicableFramework,
      complianceStatus: schema.students.complianceStatus
    })
    .from(schema.students)
    .where(eq(schema.students.id, consent.studentId))
    .limit(1);

  if (!studentRows[0] || studentRows[0].complianceStatus === 'DELETED_ANONYMIZED') {
    return { valid: false, error: 'Associated student account is no longer active.' };
  }

  return {
    valid: true,
    consent: {
      id: consent.id,
      parentName: consent.parentName,
      relationship: consent.relationship,
      status: consent.status,
      policyVersion: consent.policyVersion,
      noticeSummary: consent.noticeSummary,
      expiresAt: consent.tokenExpiresAt
    },
    student: {
      firstName: studentRows[0].name.split(' ')[0],
      countryCode: studentRows[0].countryCode,
      ageAtRegistration: studentRows[0].ageAtRegistration,
      applicableFramework: studentRows[0].applicableFramework
    }
  };
}

export async function decideParentalConsent(params: {
  rawToken: string;
  action: 'APPROVE' | 'REJECT';
  parentEmail: string;
  parentAgeConfirmed: boolean;
  signedName: string;
  ipAddress?: string;
  userAgent?: string;
}) {
  if (!params.rawToken || !params.rawToken.startsWith('tut_pconsent_')) {
    return { ok: false, status: 400, error: 'Invalid verification token.' };
  }
  const db = await getDb();
  const tokenHash = sha256Hex(params.rawToken.trim());
  const rows = await db
    .select()
    .from(schema.parentalConsents)
    .where(eq(schema.parentalConsents.verificationTokenHash, tokenHash))
    .limit(1);

  const consent: schema.ParentalConsent | undefined = rows[0];
  if (!consent || consent.tokenConsumedAt || consent.status !== 'PENDING') {
    return { ok: false, status: 400, error: 'Verification token is invalid, expired, or has already been used.' };
  }
  if (consent.tokenExpiresAt && new Date(consent.tokenExpiresAt).getTime() < Date.now()) {
    return { ok: false, status: 410, error: 'Verification token has expired.' };
  }
  if (params.parentEmail.trim().toLowerCase() !== consent.parentEmail.toLowerCase()) {
    return { ok: false, status: 403, error: 'Guardian email does not match the verification invitation.' };
  }
  if (!params.parentAgeConfirmed || !params.signedName || params.signedName.trim().length < 2) {
    return { ok: false, status: 400, error: 'Parent/Guardian age confirmation (18+) and full typed signature are required.' };
  }

  const now = new Date();
  const newConsentStatus = params.action === 'APPROVE' ? 'VERIFIED' : 'REJECTED';
  const newStudentCompliance = params.action === 'APPROVE' ? 'ACTIVE' : 'CONSENT_REJECTED';

  // Issue a separate management token ONLY so parent can later withdraw or request child data export/deletion
  // while single-use verification token itself is permanently consumed!
  const rawManagementToken = `tut_pmgmt_${crypto.randomBytes(24).toString('hex')}`;
  const managementTokenHash = sha256Hex(rawManagementToken);

  await db
    .update(schema.parentalConsents)
    .set({
      status: newConsentStatus,
      verificationTokenHash: managementTokenHash,
      tokenConsumedAt: now,
      signedName: params.signedName.trim(),
      parentAgeConfirmed: true,
      ipAddress: params.ipAddress || null,
      userAgent: params.userAgent || null,
      consentedAt: params.action === 'APPROVE' ? now : null,
      rejectedAt: params.action === 'REJECT' ? now : null,
      updatedAt: now
    })
    .where(eq(schema.parentalConsents.id, consent.id));

  await db
    .update(schema.students)
    .set({
      parentalConsentStatus: newConsentStatus,
      complianceStatus: newStudentCompliance,
      // Enforce advertising/marketing off strictly for minors even on parental approval
      marketingConsent: false,
      updatedAt: now
    })
    .where(eq(schema.students.id, consent.studentId));

  if (params.action === 'APPROVE') {
    await recordPolicyAcceptances(
      consent.studentId,
      ['child_safety', 'privacy_policy', 'ai_disclosure'],
      'parental_consent_approval',
      params.ipAddress,
      params.userAgent
    );
  }

  await logComplianceAudit(
    consent.id,
    'parent',
    params.action === 'APPROVE' ? 'PARENTAL_CONSENT_VERIFIED' : 'PARENTAL_CONSENT_REJECTED',
    'student',
    consent.studentId,
    `Guardian ${params.action === 'APPROVE' ? 'approved' : 'rejected'} minor account access (method: ${consent.verificationMethod}).`
  );

  return {
    ok: true,
    status: 200,
    consentStatus: newConsentStatus,
    studentComplianceStatus: newStudentCompliance,
    managementToken: rawManagementToken
  };
}

export async function withdrawParentalConsent(params: {
  studentId?: string;
  managementToken?: string;
  actorRole: 'parent' | 'student' | 'admin';
  reason?: string;
}) {
  const db = await getDb();
  let targetStudentId = params.studentId;
  let consentId: string | null = null;

  if (params.managementToken) {
    if (!params.managementToken.startsWith('tut_pmgmt_')) {
      return { ok: false, status: 400, error: 'Invalid parent management token.' };
    }
    const mgmtHash = sha256Hex(params.managementToken.trim());
    const rows = await db
      .select()
      .from(schema.parentalConsents)
      .where(eq(schema.parentalConsents.verificationTokenHash, mgmtHash))
      .limit(1);
    if (!rows[0]) {
      return { ok: false, status: 404, error: 'Parent consent management token not found or already revoked.' };
    }
    targetStudentId = rows[0].studentId;
    consentId = rows[0].id;
  }

  if (!targetStudentId) {
    return { ok: false, status: 400, error: 'Target student could not be resolved.' };
  }

  const now = new Date();
  if (consentId) {
    await db
      .update(schema.parentalConsents)
      .set({ status: 'WITHDRAWN', withdrawnAt: now, updatedAt: now })
      .where(eq(schema.parentalConsents.id, consentId));
  } else {
    await db
      .update(schema.parentalConsents)
      .set({ status: 'WITHDRAWN', withdrawnAt: now, updatedAt: now })
      .where(eq(schema.parentalConsents.studentId, targetStudentId));
  }

  await db
    .update(schema.students)
    .set({
      parentalConsentStatus: 'WITHDRAWN',
      complianceStatus: 'CONSENT_WITHDRAWN',
      analyticsConsent: false,
      marketingConsent: false,
      updatedAt: now
    })
    .where(eq(schema.students.id, targetStudentId));

  await db.insert(schema.privacyRequests).values({
    id: `pr_${crypto.randomBytes(8).toString('hex')}`,
    studentId: targetStudentId,
    requesterRole: params.actorRole === 'parent' ? 'parent' : 'student',
    requestType: 'CONSENT_WITHDRAWAL',
    status: 'COMPLETED',
    detailsJson: JSON.stringify({ reason: params.reason || 'Parental/guardian consent withdrawn' }),
    resolutionNotes: 'Minor processing immediately suspended and parental consent marked WITHDRAWN.',
    financialRecordsRetained: false,
    createdAt: now,
    resolvedAt: now
  });

  await logComplianceAudit(
    consentId || targetStudentId,
    params.actorRole,
    'PARENTAL_CONSENT_WITHDRAWN',
    'student',
    targetStudentId,
    `Consent withdrawn: ${params.reason || 'No reason provided'}`
  );

  return { ok: true, status: 200, studentId: targetStudentId, complianceStatus: 'CONSENT_WITHDRAWN' };
}

// ----------------------------------------------------
// Account Deletion & PII Anonymization (Retains Financial Ledgers)
// ----------------------------------------------------
export async function anonymizeAndDeleteStudentAccount(params: {
  studentId: string;
  requesterRole: 'student' | 'parent' | 'admin';
  reason?: string;
}) {
  const db = await getDb();
  const now = new Date();
  const anonSuffix = crypto.randomBytes(6).toString('hex');

  const studentRows = await db
    .select()
    .from(schema.students)
    .where(eq(schema.students.id, params.studentId))
    .limit(1);

  if (!studentRows[0]) {
    return { ok: false, error: 'Account not found.' };
  }

  // 1. Check if payments exist so we record financial retention accurately
  const studentPayments = await db
    .select({ id: schema.payments.id })
    .from(schema.payments)
    .where(eq(schema.payments.studentId, params.studentId));

  // Redact email PII on payment rows while preserving statutory order/amount accounting ledger
  if (studentPayments.length > 0) {
    await db
      .update(schema.payments)
      .set({ studentEmail: 'REDACTED_FINANCIAL_RETENTION' })
      .where(eq(schema.payments.studentId, params.studentId));
  }

  // 2. Revoke all active sessions immediately
  await db.delete(schema.sessions).where(eq(schema.sessions.studentId, params.studentId));

  // 3. Delete login credentials so deleted account can never log back in
  await db.delete(schema.studentPasswords).where(eq(schema.studentPasswords.studentId, params.studentId));

  // 4. Revoke course enrollments
  await db
    .update(schema.courseEnrollments)
    .set({ status: 'REVOKED_DELETED' })
    .where(eq(schema.courseEnrollments.studentId, params.studentId));

  // 5. Redact parental consent PII if any
  await db
    .update(schema.parentalConsents)
    .set({
      parentName: 'REDACTED',
      parentEmail: `redacted_${anonSuffix}@redacted.invalid`,
      signedName: 'REDACTED',
      verificationTokenHash: null,
      status: 'WITHDRAWN',
      withdrawnAt: now,
      updatedAt: now
    })
    .where(eq(schema.parentalConsents.studentId, params.studentId));

  // 6. Anonymize core student PII fields
  await db
    .update(schema.students)
    .set({
      name: 'Deleted User',
      email: `deleted_${anonSuffix}@redacted.invalid`,
      targetGoals: null,
      dateOfBirth: null,
      parentalConsentStatus: studentRows[0].isMinor ? 'WITHDRAWN' : studentRows[0].parentalConsentStatus,
      complianceStatus: 'DELETED_ANONYMIZED',
      analyticsConsent: false,
      marketingConsent: false,
      updatedAt: now
    })
    .where(eq(schema.students.id, params.studentId));

  // 7. Record completion in privacy_requests & audit log
  const requestId = `pr_${crypto.randomBytes(8).toString('hex')}`;
  await db.insert(schema.privacyRequests).values({
    id: requestId,
    studentId: params.studentId,
    requesterRole: params.requesterRole,
    requestType: 'DELETION',
    status: 'COMPLETED',
    detailsJson: JSON.stringify({
      reason: params.reason || 'Student/guardian requested account erasure',
      redactedAt: now.toISOString()
    }),
    resolutionNotes:
      'Personal profile, credentials, sessions, and guardian emails erased/anonymized. Non-PII financial ledger rows retained per statutory tax retention rules.',
    financialRecordsRetained: studentPayments.length > 0,
    createdAt: now,
    resolvedAt: now
  });

  await logComplianceAudit(
    params.studentId,
    params.requesterRole,
    'ACCOUNT_ERASED_AND_ANONYMIZED',
    'student',
    params.studentId,
    `PII erased/anonymized; ${studentPayments.length} financial ledger rows retained with studentEmail redacted.`
  );

  return {
    ok: true,
    requestId,
    financialRecordsRetained: studentPayments.length > 0,
    retainedLedgerCount: studentPayments.length
  };
}

// ----------------------------------------------------
// AI Minor Safety & Accidental PII Leakage Guardrail
// ----------------------------------------------------
export interface AiSafetyCheckResult {
  blocked: boolean;
  blockReason?: string;
  safeStudentReply?: string;
  sanitizedText: string;
  piiRedactedTypes: string[];
}

export function checkMinorSafetyAndScrubPii(rawInput: string): AiSafetyCheckResult {
  const input = (rawInput || '').trim();
  const lower = input.toLowerCase();

  // 1. Child safety & harmful content guardrail
  const severePatterns: Array<{ pattern: RegExp; category: string; reply: string }> = [
    {
      pattern: /\b(csam|child\s*porn|underage\s*sex|minor\s*nude|sexual\s*(?:photo|video|chat)\s*with\s*(?:a\s*)?(?:child|kid|minor))\b/i,
      category: 'CHILD_SAFETY_VIOLATION',
      reply: 'I cannot assist with that request. TUTeach is a strictly safe educational environment for learning DaVinci Resolve and video editing. If someone is in danger, please contact a trusted adult or local support services, or use Report AI Response.'
    },
    {
      pattern: /\b(how\s+to\s+(?:kill\s+myself|commit\s+suicide|cut\s+myself|self[\s-]harm)|ways\s+to\s+end\s+my\s+life)\b/i,
      category: 'SELF_HARM_GUARDRAIL',
      reply: 'I am an AI video editing teacher and cannot help with self-harm. If you are feeling overwhelmed or thinking about hurting yourself, please reach out to a trusted parent, teacher, or local helpline right away (India: Tele-MANAS 14416 / 1800-891-4416; US: 988).'
    },
    {
      pattern: /\b(pretend\s+to\s+be\s+(?:my\s+boyfriend|my\s+girlfriend|a\s+real\s+(?:person|celebrity|doctor|lawyer))|roleplay\s+romant|sext|erotic)\b/i,
      category: 'UNSAFE_IMPERSONATION_OR_GROOMING',
      reply: 'Let us keep our focus on video editing and creative learning! I am Golu Guru, an AI tutor, and I can only help you with DaVinci Resolve lessons, editing workflows, and practice assignments.'
    },
    {
      pattern: /\b(how\s+to\s+make\s+(?:a\s+bomb|explosives|poison)|hack\s+into\s+someone(?:'s)?\s+account)\b/i,
      category: 'HARMFUL_INSTRUCTION',
      reply: 'I cannot help with dangerous or illegal instructions. Let me know what DaVinci Resolve editing step you are working on and I will gladly help!'
    }
  ];

  for (const rule of severePatterns) {
    if (rule.pattern.test(input)) {
      return {
        blocked: true,
        blockReason: rule.category,
        safeStudentReply: rule.reply,
        sanitizedText: '',
        piiRedactedTypes: []
      };
    }
  }

  // 2. PII & Financial Credential Redaction (before sending prompts to Gemini API)
  let sanitized = input;
  const piiRedactedTypes: string[] = [];

  // Card numbers (13-19 digits optionally separated by space/dash)
  const cardRegex = /\b(?:\d[ -]*?){13,19}\b/g;
  if (cardRegex.test(sanitized)) {
    sanitized = sanitized.replace(cardRegex, '[REDACTED_CARD_NUMBER]');
    piiRedactedTypes.push('Payment Card Number');
  }

  // CVV explicit mention
  const cvvRegex = /\b(?:cvv|cvc)\s*[:=#]?\s*\d{3,4}\b/gi;
  if (cvvRegex.test(sanitized)) {
    sanitized = sanitized.replace(cvvRegex, '[REDACTED_CVV]');
    piiRedactedTypes.push('Card CVV');
  }

  // Aadhaar-like 12 digit format (XXXX XXXX XXXX)
  const aadhaarRegex = /\b\d{4}\s\d{4}\s\d{4}\b/g;
  if (aadhaarRegex.test(sanitized)) {
    sanitized = sanitized.replace(aadhaarRegex, '[REDACTED_GOV_ID]');
    piiRedactedTypes.push('Government ID Number');
  }

  // Explicit password sharing
  const passwordRegex = /\b(?:my\s+password\s+is|password\s*[:=])\s*\S+/gi;
  if (passwordRegex.test(sanitized)) {
    sanitized = sanitized.replace(passwordRegex, '[REDACTED_PASSWORD]');
    piiRedactedTypes.push('Account Password');
  }

  // Personal email addresses shared in chat
  const emailRegex = /\b[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}\b/g;
  if (emailRegex.test(sanitized)) {
    sanitized = sanitized.replace(emailRegex, '[REDACTED_EMAIL]');
    piiRedactedTypes.push('Email Address');
  }

  // Personal phone numbers (+91 or 10-digit Indian mobile numbers) if explicitly shared
  if (/\b(?:phone|mobile|whatsapp|call me)\b/i.test(lower)) {
    const phoneRegex = /\b(?:\+?\d{1,3}[\s-]?)?[6-9]\d{9}\b/g;
    if (phoneRegex.test(sanitized)) {
      sanitized = sanitized.replace(phoneRegex, '[REDACTED_PHONE]');
      piiRedactedTypes.push('Phone Number');
    }
  }

  return {
    blocked: false,
    sanitizedText: sanitized,
    piiRedactedTypes
  };
}

// ----------------------------------------------------
// Helper: Missing Owner Legal Placeholder Scanner
// ----------------------------------------------------
export function detectMissingOwnerLegalFields(entity: schema.LegalEntityConfig | null): string[] {
  if (!entity) return ['Legal Entity Configuration Record Missing'];
  const fields: Array<[string, string]> = [
    ['Legal Business Name', entity.legalBusinessName],
    ['Registered Business Address', entity.registeredAddress],
    ['Official Privacy Contact Email', entity.privacyEmail],
    ['Grievance Officer Name', entity.grievanceOfficerName],
    ['Grievance Officer Contact', entity.grievanceOfficerContact],
    ['Grievance Email', entity.grievanceEmail],
    ['Grievance Response SLA', entity.grievanceResponseSla],
    ['Data Protection Officer / Privacy Lead', entity.dpoOrPrivacyLead]
  ];
  return fields
    .filter(([, val]) => !val || val.includes('[OWNER TO PROVIDE'))
    .map(([label]) => label);
}

// ----------------------------------------------------
// Admin Bootstrap Helpers (First-Run Claim / Passcode)
// ----------------------------------------------------
export async function countAdminAccounts(): Promise<number> {
  const db = await getDb();
  const rows = await db
    .select({ id: schema.students.id })
    .from(schema.students)
    .where(eq(schema.students.role, 'admin'));
  return rows.length;
}

export async function promoteOrCreateAdminAccount(params: {
  email: string;
  name: string;
  password: string;
}): Promise<schema.Student> {
  const db = await getDb();
  const normEmail = params.email.trim().toLowerCase();
  const existingRows = await db
    .select()
    .from(schema.students)
    .where(eq(schema.students.email, normEmail))
    .limit(1);

  if (existingRows[0]) {
    const pwdHash = await hashPassword(params.password);
    await db
      .update(schema.students)
      .set({ role: 'admin', complianceStatus: 'ACTIVE', updatedAt: new Date() })
      .where(eq(schema.students.id, existingRows[0].id));
    await db
      .update(schema.studentPasswords)
      .set({ passwordHash: pwdHash, updatedAt: new Date() })
      .where(eq(schema.studentPasswords.studentId, existingRows[0].id));
    const updated = await db
      .select()
      .from(schema.students)
      .where(eq(schema.students.id, existingRows[0].id))
      .limit(1);
    return updated[0];
  }

  const adminId = `adm_${crypto.randomBytes(8).toString('hex')}`;
  const pwdHash = await hashPassword(params.password);
  const adminRow: schema.NewStudent = {
    id: adminId,
    email: normEmail,
    name: params.name.trim(),
    targetGoals: 'Platform Compliance & Legal Governance',
    role: 'admin',
    countryCode: 'IN',
    isMinor: false,
    applicableFramework: 'INDIA_DPDP',
    jurisdictionStatus: 'ENABLED',
    requiresParentalConsent: false,
    parentalConsentStatus: 'NOT_REQUIRED',
    complianceStatus: 'ACTIVE',
    aiDisclosureAcceptedAt: new Date(),
    aiDisclosureVersion: '1.0.0',
    analyticsConsent: false,
    functionalConsent: true,
    marketingConsent: false,
    createdAt: new Date(),
    updatedAt: new Date()
  };

  await db.insert(schema.students).values(adminRow);
  await db.insert(schema.studentPasswords).values({
    studentId: adminId,
    passwordHash: pwdHash,
    updatedAt: new Date()
  });

  await logComplianceAudit(
    adminId,
    'admin',
    'ADMIN_ACCOUNT_CLAIMED',
    'admin',
    adminId,
    `Admin compliance account provisioned for ${normEmail}`
  );

  return adminRow as schema.Student;
}

// ----------------------------------------------------
// Phase 2 Database & Account Hygiene Audit Helpers
// ----------------------------------------------------
export type AccountHygieneCategory =
  | 'ADMIN'
  | 'AUTOMATED_TEST'
  | 'ANONYMIZED_RECORD'
  | 'LEGITIMATE_STUDENT';

export function classifyAccountForHygiene(row: Pick<schema.Student, 'email' | 'role' | 'complianceStatus'>): AccountHygieneCategory {
  const email = (row.email || '').trim().toLowerCase();
  if (row.role === 'admin') {
    return 'ADMIN';
  }
  if (row.complianceStatus === 'DELETED_ANONYMIZED' || email.endsWith('@redacted.invalid')) {
    return 'ANONYMIZED_RECORD';
  }
  if (
    email.endsWith('@test.local') ||
    email.endsWith('@tuteach.test') ||
    email.endsWith('@parent.local') ||
    email.endsWith('@example.com') ||
    /^(alice|bob|charlie|dana|evan|frank|grace|noconsent|delete_me)_[a-f0-9]+@tuteach\.(ai|local)$/i.test(email) ||
    /^rohan\.deshmukh\.[a-z0-9_]+@example\.com$/i.test(email)
  ) {
    return 'AUTOMATED_TEST';
  }
  return 'LEGITIMATE_STUDENT';
}

export async function getAccountsHygieneAudit() {
  const db = await getDb();
  const allStudents: schema.Student[] = await db.select().from(schema.students);
  const allPayments: schema.Payment[] = await db.select().from(schema.payments);
  const allEnrollments: schema.CourseEnrollment[] = await db.select().from(schema.courseEnrollments);

  const paymentsByStudent = new Map<string, number>();
  for (const p of allPayments) {
    paymentsByStudent.set(p.studentId, (paymentsByStudent.get(p.studentId) || 0) + 1);
  }
  const enrollmentsByStudent = new Map<string, number>();
  for (const e of allEnrollments) {
    enrollmentsByStudent.set(e.studentId, (enrollmentsByStudent.get(e.studentId) || 0) + 1);
  }

  const adminAccounts: any[] = [];
  const automatedTestAccounts: any[] = [];
  const anonymizedAccounts: any[] = [];
  const legitimateAccounts: any[] = [];

  for (const s of allStudents) {
    const category = classifyAccountForHygiene(s);
    const entry = {
      id: s.id,
      name: s.name,
      email: s.email,
      role: s.role,
      complianceStatus: s.complianceStatus,
      isMinor: s.isMinor,
      countryCode: s.countryCode,
      paymentCount: paymentsByStudent.get(s.id) || 0,
      enrollmentCount: enrollmentsByStudent.get(s.id) || 0,
      isLegacyTestAdmin: s.email.toLowerCase() === 'compliance.admin@tuteach.local',
      createdAt: s.createdAt
    };

    if (category === 'ADMIN') adminAccounts.push(entry);
    else if (category === 'AUTOMATED_TEST') automatedTestAccounts.push(entry);
    else if (category === 'ANONYMIZED_RECORD') anonymizedAccounts.push(entry);
    else legitimateAccounts.push(entry);
  }

  return {
    stats: {
      totalAccounts: allStudents.length,
      adminCount: adminAccounts.length,
      automatedTestCount: automatedTestAccounts.length,
      anonymizedCount: anonymizedAccounts.length,
      legitimateStudentCount: legitimateAccounts.length,
      totalPayments: allPayments.length,
      totalEnrollments: allEnrollments.length
    },
    adminAccounts,
    automatedTestAccounts,
    anonymizedAccounts,
    legitimateAccounts
  };
}

export async function cleanupSyntheticTestAccounts(params: {
  actorAdminId: string;
  includeLegacyTestAdmin?: boolean;
  includeAnonymizedWithoutPayments?: boolean;
}) {
  const db = await getDb();
  const audit = await getAccountsHygieneAudit();

  const idsToRemove: string[] = [];
  const removedSummaries: Array<{ id: string; email: string; category: string }> = [];

  for (const acc of audit.automatedTestAccounts) {
    idsToRemove.push(acc.id);
    removedSummaries.push({ id: acc.id, email: acc.email, category: 'AUTOMATED_TEST' });
  }

  if (params.includeAnonymizedWithoutPayments) {
    for (const acc of audit.anonymizedAccounts) {
      if (acc.paymentCount === 0) {
        idsToRemove.push(acc.id);
        removedSummaries.push({ id: acc.id, email: acc.email, category: 'ANONYMIZED_ZERO_PAYMENTS' });
      }
    }
  }

  if (params.includeLegacyTestAdmin) {
    for (const adm of audit.adminAccounts) {
      if (adm.isLegacyTestAdmin && adm.id !== params.actorAdminId) {
        idsToRemove.push(adm.id);
        removedSummaries.push({ id: adm.id, email: adm.email, category: 'LEGACY_TEST_ADMIN' });
      }
    }
  }

  for (const targetId of idsToRemove) {
    await db.delete(schema.students).where(eq(schema.students.id, targetId));
  }

  await logComplianceAudit(
    params.actorAdminId,
    'admin',
    'DATABASE_TEST_ACCOUNTS_CLEANED',
    'database',
    'students',
    `Owner-approved cleanup removed ${idsToRemove.length} synthetic/test records while preserving ${audit.legitimateAccounts.length} legitimate accounts.`
  );

  return {
    deletedCount: idsToRemove.length,
    preservedLegitimateCount: audit.legitimateAccounts.length,
    removedSummaries
  };
}

