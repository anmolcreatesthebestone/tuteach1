import React, { useState, useEffect } from 'react';
import { useApp } from '../../context/AppContext';
import {
  ShieldAlert,
  ShieldCheck,
  Mail,
  UserCheck,
  CheckCircle2,
  XCircle,
  KeyRound,
  Trash2,
  Eye,
  ExternalLink,
  Copy
} from 'lucide-react';

export const ParentalConsentPage: React.FC = () => {
  const { user, refreshCurrentUser, navigate } = useApp();
  const [tokenInput, setTokenInput] = useState<string>(() => {
    if (typeof window !== 'undefined') {
      const p = new URLSearchParams(window.location.search);
      return p.get('token') || '';
    }
    return '';
  });

  // Student invite state
  const [parentName, setParentName] = useState('');
  const [parentEmail, setParentEmail] = useState('');
  const [relationship, setRelationship] = useState('Parent');
  const [generatedLinkInfo, setGeneratedLinkInfo] = useState<{
    token?: string;
    path?: string;
    expiresAt: string;
    noticeSummary: string;
  } | null>(null);
  const [inviteError, setInviteError] = useState('');
  const [inviteLoading, setInviteLoading] = useState(false);

  // Guardian preview / decision state
  const [previewData, setPreviewData] = useState<any>(null);
  const [previewError, setPreviewError] = useState('');
  const [guardianConfirmEmail, setGuardianConfirmEmail] = useState('');
  const [signedName, setSignedName] = useState('');
  const [parentAgeConfirmed, setParentAgeConfirmed] = useState(false);
  const [decisionResult, setDecisionResult] = useState<any>(null);
  const [decisionError, setDecisionError] = useState('');
  const [decisionLoading, setDecisionLoading] = useState(false);

  // Guardian management state (withdrawal / child data view / erasure)
  const [mgmtToken, setMgmtToken] = useState('');
  const [childDataView, setChildDataView] = useState<any>(null);
  const [mgmtMessage, setMgmtMessage] = useState('');

  const loadPreview = async (tok: string) => {
    if (!tok) return;
    setPreviewError('');
    setPreviewData(null);
    try {
      const res = await fetch(`/api/compliance/parental-consent/preview?token=${encodeURIComponent(tok.trim())}`);
      const data = await res.json();
      if (!res.ok) {
        setPreviewError(data.message || 'Verification link invalid or expired.');
      } else {
        setPreviewData(data);
      }
    } catch {
      setPreviewError('Network error loading verification notice.');
    }
  };

  useEffect(() => {
    if (tokenInput) {
      loadPreview(tokenInput);
    }
  }, []);

  const handleRequestConsent = async (e: React.FormEvent) => {
    e.preventDefault();
    setInviteError('');
    setGeneratedLinkInfo(null);
    const authToken = localStorage.getItem('tuteach_auth_token');
    if (!authToken) {
      setInviteError('Please sign in to your student account first.');
      return;
    }
    setInviteLoading(true);
    try {
      const res = await fetch('/api/compliance/parental-consent/request', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${authToken}`
        },
        body: JSON.stringify({ parentName, parentEmail, relationship })
      });
      const data = await res.json();
      if (!res.ok) {
        setInviteError(data.message || 'Unable to generate parental consent request.');
      } else {
        setGeneratedLinkInfo({
          token: data.verificationToken,
          path: data.verificationPath,
          expiresAt: data.expiresAt,
          noticeSummary: data.noticeSummary
        });
      }
    } catch {
      setInviteError('Network error generating parental consent invitation.');
    } finally {
      setInviteLoading(false);
    }
  };

  const handleGuardianDecision = async (action: 'APPROVE' | 'REJECT') => {
    setDecisionError('');
    setDecisionLoading(true);
    try {
      const res = await fetch('/api/compliance/parental-consent/decision', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          token: tokenInput.trim(),
          action,
          parentEmail: guardianConfirmEmail,
          parentAgeConfirmed,
          signedName
        })
      });
      const data = await res.json();
      if (!res.ok) {
        setDecisionError(data.message || 'Could not record consent decision.');
      } else {
        setDecisionResult(data);
        if (data.managementToken) setMgmtToken(data.managementToken);
        await refreshCurrentUser();
      }
    } catch {
      setDecisionError('Network error recording decision.');
    } finally {
      setDecisionLoading(false);
    }
  };

  const handleViewChildData = async () => {
    setMgmtMessage('');
    const res = await fetch(`/api/compliance/parental-consent/child-data?managementToken=${encodeURIComponent(mgmtToken.trim())}`);
    const data = await res.json();
    if (!res.ok) {
      setMgmtMessage(data.message || 'Invalid management token.');
    } else {
      setChildDataView(data);
    }
  };

  const handleWithdrawConsent = async () => {
    setMgmtMessage('');
    const res = await fetch('/api/compliance/parental-consent/withdraw', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ managementToken: mgmtToken.trim(), reason: 'Guardian withdrew permission via Consent Portal' })
    });
    const data = await res.json();
    if (!res.ok) {
      setMgmtMessage(data.message || 'Failed to withdraw consent.');
    } else {
      setMgmtMessage('Parental consent has been withdrawn. Minor AI tutoring and purchase processing are now suspended.');
      await refreshCurrentUser();
    }
  };

  const handleDeleteChildAccount = async () => {
    setMgmtMessage('');
    const res = await fetch('/api/compliance/parental-consent/child-deletion', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ managementToken: mgmtToken.trim(), reason: 'Guardian requested full minor account deletion' })
    });
    const data = await res.json();
    if (!res.ok) {
      setMgmtMessage(data.message || 'Deletion failed.');
    } else {
      setMgmtMessage(
        'Minor account PII, credentials, and active sessions have been anonymized/deleted. Any non-PII financial accounting ledger entries remain solely per statutory retention rules.'
      );
      setChildDataView(null);
      await refreshCurrentUser();
    }
  };

  return (
    <div className="min-h-screen bg-[#EFEBDA] py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-4xl mx-auto space-y-8">
        <div className="text-center space-y-2">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white border border-[#393636]/15 text-xs font-bold text-[#393636]">
            <ShieldCheck className="w-4 h-4 text-[#F14C2F]" />
            Child Safety &amp; Verifiable Parental Consent Portal
          </div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-[#393636]">
            Guardian Permission &amp; Minor Account Controls
          </h1>
          <p className="text-xs sm:text-sm text-gray-600 max-w-2xl mx-auto">
            TUTeach restricts AI tutoring, screenshot sharing, and course purchases for minors (India under 18, US under 13, and EU national thresholds 13–16) until verifiable guardian permission is completed.
          </p>
        </div>

        {/* Minor Account Status Banner */}
        {user && user.isMinor && (
          <div className="bg-white rounded-3xl p-6 border border-[#393636]/10 shadow-sm space-y-4">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <div>
                <div className="text-xs font-bold uppercase tracking-wider text-gray-500">Account Compliance Status</div>
                <div className="text-lg font-extrabold text-[#393636] flex items-center gap-2 mt-1">
                  {user.complianceStatus === 'ACTIVE' ? (
                    <CheckCircle2 className="w-5 h-5 text-emerald-600" />
                  ) : (
                    <ShieldAlert className="w-5 h-5 text-amber-600" />
                  )}
                  <span>{user.complianceStatus?.replace(/_/g, ' ')}</span>
                </div>
              </div>
              <span className="px-3 py-1.5 rounded-xl bg-[#EFEBDA] text-xs font-bold text-[#393636]">
                Framework: {user.applicableFramework} ({user.countryCode})
              </span>
            </div>

            {user.complianceStatus === 'PENDING_PARENTAL_CONSENT' && (
              <div className="p-4 rounded-2xl bg-amber-50 border border-amber-200 text-xs text-amber-900 space-y-3">
                <p className="font-bold">Action Needed: Invite Your Parent or Legal Guardian</p>
                <p>
                  Enter your parent or legal guardian’s details below to generate a single-use verification link. They must review TUTeach’s AI &amp; privacy disclosures and approve access before you can enter the AI Classroom or purchase courses.
                </p>

                <form onSubmit={handleRequestConsent} className="grid grid-cols-1 sm:grid-cols-3 gap-3 pt-1">
                  <input
                    type="text"
                    required
                    placeholder="Guardian Full Name"
                    value={parentName}
                    onChange={(e) => setParentName(e.target.value)}
                    className="px-3 py-2 bg-white border border-amber-300 rounded-xl text-xs text-[#393636]"
                  />
                  <input
                    type="email"
                    required
                    placeholder="Guardian Email Address"
                    value={parentEmail}
                    onChange={(e) => setParentEmail(e.target.value)}
                    className="px-3 py-2 bg-white border border-amber-300 rounded-xl text-xs text-[#393636]"
                  />
                  <div className="flex gap-2">
                    <select
                      value={relationship}
                      onChange={(e) => setRelationship(e.target.value)}
                      className="px-2.5 py-2 bg-white border border-amber-300 rounded-xl text-xs text-[#393636] flex-1"
                    >
                      <option value="Parent">Parent</option>
                      <option value="Legal Guardian">Legal Guardian</option>
                    </select>
                    <button
                      type="submit"
                      disabled={inviteLoading}
                      className="px-4 py-2 bg-[#F14C2F] hover:bg-[#d63b20] text-white font-bold rounded-xl text-xs whitespace-nowrap cursor-pointer"
                    >
                      {inviteLoading ? 'Sending...' : 'Create Link'}
                    </button>
                  </div>
                </form>

                {inviteError && <div className="text-red-700 font-semibold">{inviteError}</div>}

                {generatedLinkInfo && (
                  <div className="p-3 bg-white rounded-xl border border-amber-300 space-y-2 text-[#393636]">
                    <div className="font-bold text-emerald-700 flex items-center gap-1.5">
                      <Mail className="w-4 h-4" />
                      Verification Request Created (Expires {new Date(generatedLinkInfo.expiresAt).toLocaleString()})
                    </div>
                    <p className="text-[11px] text-gray-600">{generatedLinkInfo.noticeSummary}</p>
                    {generatedLinkInfo.token && (
                      <div className="p-2 bg-gray-50 rounded-lg border border-gray-200 flex flex-wrap items-center justify-between gap-2">
                        <code className="text-[11px] font-mono break-all">{generatedLinkInfo.token}</code>
                        <button
                          type="button"
                          onClick={() => {
                            setTokenInput(generatedLinkInfo.token || '');
                            loadPreview(generatedLinkInfo.token || '');
                          }}
                          className="px-2.5 py-1 bg-[#393636] text-white rounded-lg text-[11px] font-bold flex items-center gap-1 cursor-pointer"
                        >
                          <ExternalLink className="w-3 h-3" /> Open Guardian Verification Below
                        </button>
                      </div>
                    )}
                  </div>
                )}
              </div>
            )}

            {user.complianceStatus === 'ACTIVE' && (
              <div className="p-4 rounded-2xl bg-emerald-50 border border-emerald-200 text-xs text-emerald-900 flex items-center justify-between gap-3">
                <span>Guardian permission is verified. Behavioral advertising remains permanently disabled.</span>
                <button
                  onClick={() => navigate('dashboard')}
                  className="px-4 py-2 bg-emerald-700 text-white rounded-xl font-bold cursor-pointer"
                >
                  Go to Dashboard
                </button>
              </div>
            )}
          </div>
        )}

        {/* Guardian Verification Form (via Verification Token) */}
        <div className="bg-white rounded-3xl p-6 sm:p-8 border border-[#393636]/10 shadow-sm space-y-5">
          <div className="flex items-center gap-2 border-b border-gray-100 pb-3">
            <UserCheck className="w-5 h-5 text-[#F14C2F]" />
            <h2 className="text-lg font-extrabold text-[#393636]">
              Parent / Legal Guardian Review &amp; Decision
            </h2>
          </div>

          <div className="flex flex-col sm:flex-row gap-2">
            <input
              type="text"
              placeholder="Paste Guardian Verification Token (tut_pconsent_...)"
              value={tokenInput}
              onChange={(e) => setTokenInput(e.target.value)}
              className="flex-1 px-3 py-2.5 border border-gray-300 rounded-xl text-xs font-mono"
            />
            <button
              type="button"
              onClick={() => loadPreview(tokenInput)}
              className="px-4 py-2.5 bg-[#393636] text-white font-bold text-xs rounded-xl cursor-pointer"
            >
              Load Request
            </button>
          </div>

          {previewError && (
            <div className="p-3 bg-red-50 text-red-700 border border-red-200 rounded-xl text-xs font-medium">
              {previewError}
            </div>
          )}

          {previewData && !decisionResult && (
            <div className="space-y-4">
              <div className="p-4 bg-[#EFEBDA]/60 rounded-2xl border border-[#393636]/10 text-xs space-y-2 text-[#393636]">
                <p className="font-bold">Student Verification Details</p>
                <p>Student First Name: <strong>{previewData.student.firstName}</strong> · Registered Country: <strong>{previewData.student.countryCode}</strong> · Framework: <strong>{previewData.student.applicableFramework}</strong></p>
                <p className="text-gray-700">{previewData.consent.noticeSummary}</p>
                <div className="text-[11px] text-gray-600 pt-1">
                  <strong>Important Legal Notice:</strong> Current verification collects a signed adult declaration via guardian email link. Before full public launch under Indian DPDP Rules, verification should be upgraded to DigiLocker / Aadhaar eSign / micro-transaction verification.
                </div>
              </div>

              {decisionError && (
                <div className="p-3 bg-red-50 text-red-700 border border-red-200 rounded-xl text-xs font-medium">
                  {decisionError}
                </div>
              )}

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-[#393636] mb-1">Confirm Guardian Email</label>
                  <input
                    type="email"
                    required
                    placeholder="Must match invited guardian email"
                    value={guardianConfirmEmail}
                    onChange={(e) => setGuardianConfirmEmail(e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-xl text-xs"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-[#393636] mb-1">Full Typed Signature</label>
                  <input
                    type="text"
                    required
                    placeholder="Type your full legal name"
                    value={signedName}
                    onChange={(e) => setSignedName(e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-xl text-xs"
                  />
                </div>
              </div>

              <label className="flex items-start gap-2 text-xs text-gray-700 bg-gray-50 p-3 rounded-xl border border-gray-200">
                <input
                  type="checkbox"
                  checked={parentAgeConfirmed}
                  onChange={(e) => setParentAgeConfirmed(e.target.checked)}
                  className="mt-1 accent-[#F14C2F]"
                />
                <span>
                  I affirm that I am 18+ years old and the parent or lawful guardian of {previewData.student.firstName}, and I have reviewed the{' '}
                  <button type="button" onClick={() => navigate('child-safety')} className="text-[#F14C2F] underline font-semibold">
                    Child Safety Policy
                  </button>
                  ,{' '}
                  <button type="button" onClick={() => navigate('privacy')} className="text-[#F14C2F] underline font-semibold">
                    Privacy Policy
                  </button>
                  , and{' '}
                  <button type="button" onClick={() => navigate('ai-disclosure')} className="text-[#F14C2F] underline font-semibold">
                    AI Usage Disclosure
                  </button>
                  .
                </span>
              </label>

              <div className="flex flex-wrap gap-3">
                <button
                  type="button"
                  disabled={decisionLoading}
                  onClick={() => handleGuardianDecision('APPROVE')}
                  className="px-5 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs rounded-xl flex items-center gap-2 cursor-pointer"
                >
                  <CheckCircle2 className="w-4 h-4" />
                  Approve Guardian Consent
                </button>
                <button
                  type="button"
                  disabled={decisionLoading}
                  onClick={() => handleGuardianDecision('REJECT')}
                  className="px-5 py-2.5 bg-red-600 hover:bg-red-700 text-white font-bold text-xs rounded-xl flex items-center gap-2 cursor-pointer"
                >
                  <XCircle className="w-4 h-4" />
                  Decline Permission
                </button>
              </div>
            </div>
          )}

          {decisionResult && (
            <div className="p-4 rounded-2xl bg-emerald-50 border border-emerald-200 space-y-2 text-xs text-emerald-900">
              <div className="font-bold text-sm">Decision Recorded: {decisionResult.consentStatus}</div>
              <p>Student account compliance state is now: <strong>{decisionResult.studentComplianceStatus}</strong>.</p>
              {decisionResult.managementToken && (
                <div className="p-3 bg-white rounded-xl border border-emerald-300 space-y-1">
                  <div className="font-bold text-[#393636]">Save Your Guardian Management Token (For Future Withdrawal / Deletion):</div>
                  <div className="flex items-center justify-between gap-2">
                    <code className="text-[11px] font-mono break-all text-[#393636]">{decisionResult.managementToken}</code>
                    <button
                      type="button"
                      onClick={() => navigator.clipboard?.writeText(decisionResult.managementToken)}
                      className="px-2 py-1 bg-gray-100 hover:bg-gray-200 rounded text-[11px] font-bold flex items-center gap-1 cursor-pointer"
                    >
                      <Copy className="w-3 h-3" /> Copy
                    </button>
                  </div>
                </div>
              )}
            </div>
          )}
        </div>

        {/* Ongoing Guardian Data Rights & Withdrawal Controls */}
        <div className="bg-white rounded-3xl p-6 sm:p-8 border border-[#393636]/10 shadow-sm space-y-4">
          <div className="flex items-center gap-2 border-b border-gray-100 pb-3">
            <KeyRound className="w-5 h-5 text-[#F14C2F]" />
            <h2 className="text-lg font-extrabold text-[#393636]">
              Guardian Ongoing Rights: Inspect Child Data, Withdraw Consent, or Erase Account
            </h2>
          </div>

          <div className="flex flex-col sm:flex-row gap-2">
            <input
              type="text"
              placeholder="Guardian Management Token (tut_pmgmt_...)"
              value={mgmtToken}
              onChange={(e) => setMgmtToken(e.target.value)}
              className="flex-1 px-3 py-2 border border-gray-300 rounded-xl text-xs font-mono"
            />
            <button
              type="button"
              onClick={handleViewChildData}
              className="px-3.5 py-2 bg-[#393636] text-white font-bold text-xs rounded-xl flex items-center gap-1.5 cursor-pointer"
            >
              <Eye className="w-3.5 h-3.5" /> View Child Data
            </button>
            <button
              type="button"
              onClick={handleWithdrawConsent}
              className="px-3.5 py-2 bg-amber-600 text-white font-bold text-xs rounded-xl cursor-pointer"
            >
              Withdraw Consent
            </button>
            <button
              type="button"
              onClick={handleDeleteChildAccount}
              className="px-3.5 py-2 bg-red-600 text-white font-bold text-xs rounded-xl flex items-center gap-1.5 cursor-pointer"
            >
              <Trash2 className="w-3.5 h-3.5" /> Erase Child Data
            </button>
          </div>

          {mgmtMessage && (
            <div className="p-3 bg-[#EFEBDA]/70 rounded-xl text-xs font-semibold text-[#393636]">
              {mgmtMessage}
            </div>
          )}

          {childDataView && (
            <pre className="p-4 bg-gray-900 text-emerald-300 rounded-2xl text-[11px] overflow-x-auto max-h-64">
              {JSON.stringify(childDataView, null, 2)}
            </pre>
          )}
        </div>
      </div>
    </div>
  );
};
