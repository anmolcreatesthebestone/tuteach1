import React, { useEffect, useState } from 'react';
import { useApp } from '../../context/AppContext';
import { PageView } from '../../types';
import { ShieldCheck, FileText, ArrowRight, AlertTriangle } from 'lucide-react';

interface LegalDocNav {
  page: PageView;
  policyKey: string;
  label: string;
}

const LEGAL_NAV_ITEMS: LegalDocNav[] = [
  { page: 'privacy', policyKey: 'privacy_policy', label: 'Privacy Policy' },
  { page: 'terms', policyKey: 'terms_conditions', label: 'Terms & Conditions' },
  { page: 'student-agreement', policyKey: 'student_agreement', label: 'Student User Agreement' },
  { page: 'child-safety', policyKey: 'child_safety', label: 'Child Protection & Parental Consent' },
  { page: 'ai-disclosure', policyKey: 'ai_disclosure', label: 'AI Usage & Safety Disclosure' },
  { page: 'refund-policy', policyKey: 'refund_policy', label: 'Payment, Cancellation & Refund' },
  { page: 'cookie-policy', policyKey: 'cookie_policy', label: 'Cookie & Tracking Policy' },
  { page: 'acceptable-use', policyKey: 'acceptable_use', label: 'Acceptable Use & Integrity' },
  { page: 'ip-disclaimer', policyKey: 'ip_disclaimer', label: 'IP & Third-Party Software' },
  { page: 'certificate-disclaimer', policyKey: 'certificate_disclaimer', label: 'Certificate Disclaimer' },
  { page: 'grievance-policy', policyKey: 'grievance_policy', label: 'Grievance Redressal Policy' },
  { page: 'data-retention', policyKey: 'data_retention_policy', label: 'Data Retention & Deletion' },
  { page: 'third-party-processors', policyKey: 'third_party_processors', label: 'Third-Party Processors & Transfers' },
  { page: 'security-practices', policyKey: 'security_practices', label: 'Security & Incident Notice' }
];

export const LegalCenterPage: React.FC<{ activePage: PageView }> = ({ activePage }) => {
  const { navigate, setIsCookieModalOpen } = useApp();
  const [meta, setMeta] = useState<{
    policies: any[];
    retentionSchedules: any[];
    thirdPartyProcessors: any[];
    legalEntity: any;
    missingOwnerInfo: string[];
  } | null>(null);

  useEffect(() => {
    fetch('/api/compliance/policies')
      .then((r) => r.json())
      .then((d) => setMeta(d))
      .catch(() => {});
  }, [activePage]);

  const currentNav = LEGAL_NAV_ITEMS.find((i) => i.page === activePage) || LEGAL_NAV_ITEMS[0];
  const currentPolicy = meta?.policies?.find((p) => p.policyKey === currentNav.policyKey);
  const ent = meta?.legalEntity;

  return (
    <div className="min-h-screen bg-[#EFEBDA] py-10 px-4 sm:px-6 lg:px-8">
      <div className="max-w-6xl mx-auto grid grid-cols-1 lg:grid-cols-4 gap-6">
        {/* Left Navigation Index across all 14 policies */}
        <aside className="bg-white rounded-3xl p-5 border border-[#393636]/10 shadow-sm h-fit space-y-2">
          <div className="flex items-center gap-2 pb-2 border-b border-gray-100">
            <FileText className="w-4 h-4 text-[#F14C2F]" />
            <span className="text-xs font-extrabold uppercase tracking-wider text-[#393636]">
              Legal &amp; Safety Center
            </span>
          </div>
          <nav className="space-y-1">
            {LEGAL_NAV_ITEMS.map((item) => (
              <button
                key={item.page}
                onClick={() => navigate(item.page)}
                className={`w-full text-left px-3 py-2 rounded-xl text-xs font-semibold transition-colors cursor-pointer ${
                  activePage === item.page
                    ? 'bg-[#F14C2F] text-white'
                    : 'text-[#393636] hover:bg-[#EFEBDA]/70'
                }`}
              >
                {item.label}
              </button>
            ))}
          </nav>
          <div className="pt-3 border-t border-gray-100 space-y-2">
            <button
              onClick={() => navigate('grievance-form')}
              className="w-full py-2 px-3 bg-[#393636] text-white rounded-xl text-xs font-bold flex items-center justify-between cursor-pointer"
            >
              <span>Grievance / Legal Form</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </button>
            <button
              onClick={() => navigate('parental-consent')}
              className="w-full py-2 px-3 bg-[#EFEBDA] text-[#393636] rounded-xl text-xs font-bold flex items-center justify-between cursor-pointer"
            >
              <span>Parental Consent Portal</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </button>
          </div>
        </aside>

        {/* Main Legal Document Body */}
        <main className="lg:col-span-3 bg-white rounded-3xl p-6 sm:p-10 border border-[#393636]/10 shadow-sm space-y-6">
          <div className="flex flex-wrap items-center justify-between gap-3 border-b border-gray-100 pb-4">
            <div>
              <div className="inline-flex items-center gap-1.5 text-[11px] font-bold uppercase tracking-wider text-[#F14C2F]">
                <ShieldCheck className="w-4 h-4" />
                Draft Policy Template — Subject to Qualified Legal Review
              </div>
              <h1 className="text-2xl sm:text-3xl font-extrabold text-[#393636] mt-1">
                {currentPolicy?.title || currentNav.label}
              </h1>
            </div>
            <div className="text-right text-xs text-gray-500">
              <div>Version: <strong className="text-[#393636]">{currentPolicy?.version || '1.0.0'}</strong></div>
              <div>Effective: <strong className="text-[#393636]">{currentPolicy?.effectiveDate || '2026-11-21'}</strong></div>
            </div>
          </div>

          {meta && meta.missingOwnerInfo?.length > 0 && (
            <div className="p-3.5 rounded-2xl bg-amber-50 border border-amber-200 text-xs text-amber-950 flex items-start gap-2.5">
              <AlertTriangle className="w-4 h-4 text-amber-700 shrink-0 mt-0.5" />
              <div>
                <strong>Owner Legal Details Required Before Public Launch:</strong> The following entity placeholders must be completed in Admin Compliance Settings: {meta.missingOwnerInfo.join(', ')}.
              </div>
            </div>
          )}

          {/* Contextual Content per Policy Page */}
          <div className="text-xs sm:text-sm text-gray-700 leading-relaxed space-y-4">
            {activePage === 'privacy' && (
              <>
                <p>
                  This Privacy Policy describes how TUTeach collects, uses, stores, discloses, and protects personal data across India (Digital Personal Data Protection Act, 2023 context), the United States (COPPA context), the European Union (GDPR &amp; Art. 8 consent rules), and supported jurisdictions.
                </p>
                <h3 className="font-bold text-[#393636] text-base">1. Data We Collect &amp; Minimize</h3>
                <ul className="list-disc pl-5 space-y-1">
                  <li><strong>Account &amp; Age Protection:</strong> Name, email, bcrypt-hashed password credentials, country/jurisdiction, immutable date of birth, consent version timestamps.</li>
                  <li><strong>Learning &amp; Classroom Interactions:</strong> Lesson progress, assignment submissions, rubric scores, AI tutor prompts, and optional voice transcripts triggered only when you click the microphone.</li>
                  <li><strong>Screenshots:</strong> Uploaded workspace screenshots are transmitted to Google Gemini for real-time troubleshooting and are not retained in our primary persistent user database after analysis unless submitted inside a safety report.</li>
                  <li><strong>Payments:</strong> Order IDs, ₹499 transaction status, and billing timestamps via Razorpay. Full card numbers, UPI PINs, and CVV codes are never stored by TUTeach.</li>
                </ul>
                <h3 className="font-bold text-[#393636] text-base">2. Honest Disclosure Regarding AI Processing</h3>
                <p>
                  Golu Guru is powered by the Google Gemini API. Data retention and model-training exclusions depend on the Google Cloud / AI Studio billing tier &amp; Data Processing Addendum configured by the platform owner (<code>{ent?.legalBusinessName || '[OWNER TO PROVIDE: Legal Business Name]'}</code>). TUTeach does not sell personal data or display third-party behavioral advertising.
                </p>
                <h3 className="font-bold text-[#393636] text-base">3. Your Data Rights</h3>
                <p>
                  You can view and export your personal data JSON, request corrections, withdraw optional analytics consent, or permanently erase/anonymize your account from Dashboard → Privacy &amp; Legal Settings. Note that anonymized payment ledger entries are retained for statutory tax and accounting compliance.
                </p>
              </>
            )}

            {activePage === 'terms' && (
              <>
                <p>
                  These Terms &amp; Conditions govern use of TUTeach operated by <strong>{ent?.legalBusinessName || '[OWNER TO PROVIDE: Legal Business Name]'}</strong>, located at <strong>{ent?.registeredAddress || '[OWNER TO PROVIDE: Registered Business Address]'}</strong>.
                </p>
                <h3 className="font-bold text-[#393636] text-base">1. Eligibility &amp; Age Verification</h3>
                <p>
                  Users must provide accurate country and date of birth details during registration. Minors (under 18 in India, under 13 in the US, or under the applicable EU national threshold) cannot purchase courses or use Golu Guru AI until verifiable guardian consent is granted.
                </p>
                <h3 className="font-bold text-[#393636] text-base">2. Governing Law &amp; Jurisdiction</h3>
                <p>
                  [OWNER TO PROVIDE: Governing Law Jurisdiction, e.g., Laws of India &amp; Courts at City/State] — to be finalized by qualified legal counsel prior to public commercial rollout.
                </p>
              </>
            )}

            {activePage === 'student-agreement' && (
              <>
                <p>By enrolling in any TUTeach course, the student (and parent/guardian, if a minor) agrees to maintain academic honesty, submit authentic practical workflows for evaluation, respect classroom safety rules, and never share account credentials.</p>
              </>
            )}

            {activePage === 'child-safety' && (
              <>
                <p>TUTeach enforces regional age-protection thresholds:</p>
                <ul className="list-disc pl-5 space-y-1">
                  <li><strong>India (DPDP Act Context):</strong> Users under 18 require verifiable parental/guardian consent. Tracking, behavioral profiling, and targeted advertising for children are strictly disabled.</li>
                  <li><strong>United States (COPPA Context):</strong> Users under 13 require verifiable parental consent before collecting personal information or accessing interactive AI chat.</li>
                  <li><strong>European Union (GDPR Art. 8):</strong> Applies national digital consent thresholds (13–16 depending on EU Member State).</li>
                  <li><strong>Unreviewed Jurisdictions:</strong> Countries without verified compliance approval remain disabled from unrestricted registration.</li>
                </ul>
                <p>Current token verification uses adult email declaration &amp; single-use links; upgrading to DigiLocker/eKYC/micro-charge verification is flagged for public launch readiness under DPDP Rules.</p>
              </>
            )}

            {activePage === 'ai-disclosure' && (
              <>
                <p>
                  <strong>Golu Guru</strong> is an automated educational AI tutor powered by Google Gemini APIs, not a human instructor. AI outputs can occasionally be inaccurate or incomplete; always verify project export settings in DaVinci Resolve before delivering client work.
                </p>
                <p>
                  Minor Safety Guardrails filter inappropriate prompts, impersonation, and accidental sharing of passwords, card numbers, or IDs. Every classroom turn includes a <strong>Report AI Response</strong> button escalating concerns directly to our grievance queue.
                </p>
              </>
            )}

            {activePage === 'refund-policy' && (
              <>
                <p>
                  Course enrollment is priced at ₹499 INR (or configured course rate) processed exclusively through Razorpay. Upon successful cryptographic verification, course access unlocks immediately.
                </p>
                <p>
                  <strong>Refund Window &amp; Terms:</strong> [OWNER TO PROVIDE: Refund window eligibility rules, e.g., 7-day refund before certificate completion, Razorpay refund SLA 5–7 business days]. Financial transaction logs are preserved for statutory tax audits even if a user deletes their account.
                </p>
              </>
            )}

            {activePage === 'cookie-policy' && (
              <>
                <p>
                  We categorize browser storage and cookies into Strictly Essential (session security, age status), Functional (English/Hinglish choice), Analytics (optional, default OFF), and Advertising (permanently OFF for minors).
                </p>
                <button
                  type="button"
                  onClick={() => setIsCookieModalOpen(true)}
                  className="px-4 py-2 bg-[#F14C2F] text-white rounded-xl text-xs font-bold cursor-pointer"
                >
                  Open Cookie Preference Center
                </button>
              </>
            )}

            {activePage === 'acceptable-use' && (
              <p>Users may not upload unlawful imagery, submit prompts requesting harmful or abusive material, impersonate real individuals, attempt to bypass age controls, or scrape course curricula.</p>
            )}

            {activePage === 'ip-disclaimer' && (
              <p>TUTeach is an independent educational platform. DaVinci Resolve and Blackmagic Design are trademarks of Blackmagic Design Pty. Ltd., which does not sponsor or endorse TUTeach.</p>
            )}

            {activePage === 'certificate-disclaimer' && (
              <p>TUTeach completion certificates verify completion of platform lessons and rubric-evaluated practical workflow tasks. They are non-governmental skill credentials and not accredited university degrees.</p>
            )}

            {activePage === 'grievance-policy' && (
              <div className="space-y-2">
                <p>Complaints or rights requests may be filed anytime via the Grievance Form with guaranteed tracking reference codes.</p>
                <p><strong>Grievance Officer:</strong> {ent?.grievanceOfficerName || '[OWNER TO PROVIDE: Grievance Officer Name]'}</p>
                <p><strong>Grievance Email:</strong> {ent?.grievanceEmail || '[OWNER TO PROVIDE: Official Grievance Email]'}</p>
                <p><strong>Officer Contact:</strong> {ent?.grievanceOfficerContact || '[OWNER TO PROVIDE: Grievance Officer Contact]'}</p>
                <p><strong>SLA:</strong> {ent?.grievanceResponseSla || '[OWNER TO PROVIDE: Official Grievance Response SLA]'}</p>
              </div>
            )}

            {activePage === 'data-retention' && (
              <div className="space-y-3">
                <p>TUTeach enforces explicit retention categories separating user PII from statutory accounting ledgers:</p>
                <div className="overflow-x-auto border border-gray-200 rounded-2xl">
                  <table className="w-full text-left text-xs">
                    <thead className="bg-[#EFEBDA]/70 text-[#393636]">
                      <tr>
                        <th className="p-3 font-bold">Data Category</th>
                        <th className="p-3 font-bold">Retention</th>
                        <th className="p-3 font-bold">Legal Basis &amp; Notes</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-100">
                      {(meta?.retentionSchedules || []).map((r) => (
                        <tr key={r.id}>
                          <td className="p-3 font-semibold text-[#393636]">{r.dataCategory}</td>
                          <td className="p-3">{r.retentionLabel}</td>
                          <td className="p-3 text-gray-600">{r.legalBasis} — {r.notes}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            )}

            {activePage === 'third-party-processors' && (
              <div className="space-y-3">
                <p>TUTeach integrates external technical service providers strictly for core educational and payment operations:</p>
                <div className="overflow-x-auto border border-gray-200 rounded-2xl">
                  <table className="w-full text-left text-xs">
                    <thead className="bg-[#EFEBDA]/70 text-[#393636]">
                      <tr>
                        <th className="p-3 font-bold">Processor</th>
                        <th className="p-3 font-bold">Data Shared &amp; Purpose</th>
                        <th className="p-3 font-bold">Region / Legal Note</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-100">
                      {(meta?.thirdPartyProcessors || []).map((p) => (
                        <tr key={p.id}>
                          <td className="p-3 font-semibold text-[#393636]">{p.processorName}</td>
                          <td className="p-3 text-gray-700">{p.dataShared} ({p.purpose})</td>
                          <td className="p-3 text-gray-600">{p.jurisdiction} — {p.policyNote}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            )}

            {activePage === 'security-practices' && (
              <p>TUTeach protects accounts using bcrypt password hashing, server-managed HttpOnly session tokens, timing-safe HMAC SHA-256 Razorpay webhook verification, role-based access enforcement, and structured security incident logging.</p>
            )}
          </div>
        </main>
      </div>
    </div>
  );
};
