import React, { useState, useEffect } from 'react';
import { useApp } from '../../context/AppContext';
import { ShieldAlert, Send, Search, CheckCircle2, FileText } from 'lucide-react';

export const GrievancePage: React.FC = () => {
  const { user, navigate } = useApp();
  const [reporterName, setReporterName] = useState(user?.name || '');
  const [contactEmail, setContactEmail] = useState(user?.email || '');
  const [category, setCategory] = useState('Privacy & Data Rights Inquiry');
  const [description, setDescription] = useState('');
  const [attachmentName, setAttachmentName] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');
  const [submittedRef, setSubmittedRef] = useState<{ referenceCode: string; slaDueAt: string } | null>(null);

  const [lookupCode, setLookupCode] = useState('');
  const [lookupResult, setLookupResult] = useState<any>(null);
  const [lookupError, setLookupError] = useState('');
  const [legalEntity, setLegalEntity] = useState<any>(null);

  useEffect(() => {
    fetch('/api/compliance/policies')
      .then((r) => r.json())
      .then((d) => setLegalEntity(d.legalEntity || null))
      .catch(() => {});
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg('');
    setSubmittedRef(null);
    setSubmitting(true);
    const token = localStorage.getItem('tuteach_auth_token');
    try {
      const res = await fetch('/api/grievances', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...(token ? { Authorization: `Bearer ${token}` } : {})
        },
        body: JSON.stringify({
          reporterName,
          contactEmail,
          category,
          description,
          attachmentName
        })
      });
      const data = await res.json();
      if (!res.ok) {
        setErrorMsg(data.message || 'Unable to submit grievance.');
      } else {
        setSubmittedRef({ referenceCode: data.referenceCode, slaDueAt: data.slaDueAt });
        setLookupCode(data.referenceCode);
        setDescription('');
        setAttachmentName('');
      }
    } catch {
      setErrorMsg('Network error submitting grievance.');
    } finally {
      setSubmitting(false);
    }
  };

  const handleTrack = async (e: React.FormEvent) => {
    e.preventDefault();
    setLookupError('');
    setLookupResult(null);
    if (!lookupCode.trim()) return;
    try {
      const res = await fetch(`/api/grievances/track/${encodeURIComponent(lookupCode.trim())}`);
      const data = await res.json();
      if (!res.ok) {
        setLookupError(data.message || 'Tracking reference not found.');
      } else {
        setLookupResult(data.grievance);
      }
    } catch {
      setLookupError('Network error checking grievance status.');
    }
  };

  return (
    <div className="min-h-screen bg-[#EFEBDA] py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-4xl mx-auto space-y-8">
        <div className="text-center space-y-2">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white border border-[#393636]/15 text-xs font-bold text-[#393636]">
            <ShieldAlert className="w-4 h-4 text-[#F14C2F]" />
            Grievance Redressal &amp; Legal Contact Desk
          </div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-[#393636]">
            Submit Privacy, Child Safety, AI, or Payment Grievance
          </h1>
          <p className="text-xs sm:text-sm text-gray-600 max-w-2xl mx-auto">
            Students, parents, and visitors can escalate concerns directly and receive a persistent tracking code.
          </p>
        </div>

        {/* Owner Legal Placeholder Card */}
        <div className="bg-amber-50 border border-amber-200 rounded-3xl p-5 text-xs text-amber-950 space-y-1.5">
          <div className="font-extrabold flex items-center gap-2">
            <FileText className="w-4 h-4 text-amber-700" />
            Designated Grievance Officer &amp; Entity Disclosures
          </div>
          <p><strong>Legal Business Name:</strong> {legalEntity?.legalBusinessName || '[OWNER TO PROVIDE: Legal Business Name]'}</p>
          <p><strong>Registered Address:</strong> {legalEntity?.registeredAddress || '[OWNER TO PROVIDE: Registered Business Address]'}</p>
          <p><strong>Grievance Officer:</strong> {legalEntity?.grievanceOfficerName || '[OWNER TO PROVIDE: Grievance Officer Name]'} ({legalEntity?.grievanceEmail || '[OWNER TO PROVIDE: Official Grievance Email]'})</p>
          <p><strong>Response SLA:</strong> {legalEntity?.grievanceResponseSla || '[OWNER TO PROVIDE: Official Grievance Response SLA]'}</p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <form onSubmit={handleSubmit} className="md:col-span-2 bg-white rounded-3xl p-6 sm:p-8 border border-[#393636]/10 shadow-sm space-y-4">
            <h2 className="text-lg font-extrabold text-[#393636]">File a Formal Grievance</h2>

            {errorMsg && (
              <div className="p-3 bg-red-50 text-red-700 border border-red-200 rounded-xl text-xs font-medium">
                {errorMsg}
              </div>
            )}

            {submittedRef && (
              <div className="p-4 bg-emerald-50 text-emerald-900 border border-emerald-200 rounded-2xl text-xs space-y-1">
                <div className="font-extrabold flex items-center gap-1.5">
                  <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                  Grievance Logged — Reference Code: <span className="font-mono">{submittedRef.referenceCode}</span>
                </div>
                <p>Target review deadline: {new Date(submittedRef.slaDueAt).toLocaleString()}</p>
              </div>
            )}

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-bold text-[#393636] mb-1">Your Name</label>
                <input
                  type="text"
                  required
                  value={reporterName}
                  onChange={(e) => setReporterName(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-xl text-xs"
                />
              </div>
              <div>
                <label className="block text-xs font-bold text-[#393636] mb-1">Contact Email</label>
                <input
                  type="email"
                  required
                  value={contactEmail}
                  onChange={(e) => setContactEmail(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-xl text-xs"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-bold text-[#393636] mb-1">Grievance Category</label>
              <select
                value={category}
                onChange={(e) => setCategory(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-xl text-xs bg-white"
              >
                <option value="Privacy & Data Rights Inquiry">Privacy &amp; Data Rights Inquiry</option>
                <option value="Child Safety / Parental Consent Dispute">Child Safety / Parental Consent Dispute</option>
                <option value="Inappropriate or Unsafe AI Response">Inappropriate or Unsafe AI Response</option>
                <option value="Payment, Billing & Refund Issue">Payment, Billing &amp; Refund Issue</option>
                <option value="Data Deletion or Security Breach Report">Data Deletion or Security Breach Report</option>
                <option value="General Legal Inquiry">General Legal Inquiry</option>
              </select>
            </div>

            <div>
              <label className="block text-xs font-bold text-[#393636] mb-1">Detailed Description</label>
              <textarea
                required
                minLength={10}
                rows={4}
                placeholder="Describe the concern, relevant timestamps, or order/lesson details..."
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-xl text-xs"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-[#393636] mb-1">Supporting File Reference (optional filename)</label>
              <input
                type="text"
                placeholder="e.g. razorpay_receipt.pdf (metadata only)"
                value={attachmentName}
                onChange={(e) => setAttachmentName(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-xl text-xs"
              />
            </div>

            <button
              type="submit"
              disabled={submitting}
              className="w-full py-2.5 bg-[#F14C2F] hover:bg-[#d63b20] text-white font-bold text-xs rounded-xl flex items-center justify-center gap-2 cursor-pointer"
            >
              <Send className="w-4 h-4" />
              {submitting ? 'Submitting...' : 'Submit Grievance'}
            </button>
          </form>

          {/* Status Lookup Sidebar */}
          <div className="bg-white rounded-3xl p-6 border border-[#393636]/10 shadow-sm space-y-4 h-fit">
            <h3 className="text-sm font-extrabold text-[#393636]">Track Existing Grievance</h3>
            <form onSubmit={handleTrack} className="space-y-2">
              <input
                type="text"
                placeholder="GRV-2026-XXXXXX"
                value={lookupCode}
                onChange={(e) => setLookupCode(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-xl text-xs font-mono uppercase"
              />
              <button
                type="submit"
                className="w-full py-2 bg-[#393636] text-white font-bold text-xs rounded-xl flex items-center justify-center gap-1.5 cursor-pointer"
              >
                <Search className="w-3.5 h-3.5" /> Check Status
              </button>
            </form>

            {lookupError && <div className="text-xs text-red-600">{lookupError}</div>}

            {lookupResult && (
              <div className="p-3 bg-[#EFEBDA]/70 rounded-xl border border-[#393636]/10 text-xs space-y-1">
                <div className="font-mono font-bold text-[#393636]">{lookupResult.referenceCode}</div>
                <div>Category: {lookupResult.category}</div>
                <div>Status: <strong className="text-[#F14C2F]">{lookupResult.status}</strong></div>
                <div>SLA Due: {new Date(lookupResult.slaDueAt).toLocaleDateString()}</div>
                {lookupResult.resolutionNotes && (
                  <div className="pt-1 border-t border-gray-200 text-gray-700">
                    Notes: {lookupResult.resolutionNotes}
                  </div>
                )}
              </div>
            )}

            <button
              type="button"
              onClick={() => navigate('grievance-policy')}
              className="text-xs text-[#F14C2F] font-semibold underline block pt-2"
            >
              Read Full Grievance Policy →
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
