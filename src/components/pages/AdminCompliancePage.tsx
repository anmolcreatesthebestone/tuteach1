import React, { useState, useEffect } from 'react';
import { useApp } from '../../context/AppContext';
import {
  ShieldCheck,
  AlertTriangle,
  Users,
  Globe,
  FileText,
  Scale,
  Lock,
  CheckCircle2,
  PlusCircle,
  RefreshCw
} from 'lucide-react';

export const AdminCompliancePage: React.FC = () => {
  const { user, loginUser, refreshCurrentUser } = useApp();
  const [bootstrapStatus, setBootstrapStatus] = useState<{ hasAdminAccount: boolean; passcodeConfigured: boolean } | null>(null);
  const [overview, setOverview] = useState<any>(null);
  const [hygieneAudit, setHygieneAudit] = useState<any>(null);
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');
  const [activeTab, setActiveTab] = useState<'overview' | 'consents' | 'requests' | 'jurisdictions' | 'policies' | 'entity' | 'hygiene' | 'blog'>('overview');
  const [authMode, setAuthMode] = useState<'signin' | 'claim'>('signin');

  // SEO & Blog CMS state
  const [seoOverview, setSeoOverview] = useState<any>(null);
  const [blogPosts, setBlogPosts] = useState<any[]>([]);
  const [editingBlogId, setEditingBlogId] = useState<string | null>(null);
  const [blogSaving, setBlogSaving] = useState(false);
  const [blogTitle, setBlogTitle] = useState('');
  const [blogSlug, setBlogSlug] = useState('');
  const [blogCategory, setBlogCategory] = useState('Video Editing Guides');
  const [blogPrimaryKeyword, setBlogPrimaryKeyword] = useState('');
  const [blogSeoTitle, setBlogSeoTitle] = useState('');
  const [blogMetaDescription, setBlogMetaDescription] = useState('');
  const [blogExcerpt, setBlogExcerpt] = useState('');
  const [blogImageUrl, setBlogImageUrl] = useState('/assets/seo/blog-ai-mentor.jpg');
  const [blogImageAlt, setBlogImageAlt] = useState('TUTeach interactive AI learning workspace illustration');
  const [blogStatus, setBlogStatus] = useState<'DRAFT' | 'PUBLISHED' | 'ARCHIVED'>('DRAFT');
  const [blogContent, setBlogContent] = useState('');

  // Claim / Login form state
  const [claimName, setClaimName] = useState('');
  const [claimEmail, setClaimEmail] = useState('');
  const [claimPassword, setClaimPassword] = useState('');
  const [claimPasscode, setClaimPasscode] = useState('');

  // Database hygiene cleanup state
  const [cleanupPhrase, setCleanupPhrase] = useState('');
  const [includeLegacyTestAdmin, setIncludeLegacyTestAdmin] = useState(false);
  const [includeAnonymizedZeroPay, setIncludeAnonymizedZeroPay] = useState(true);
  const [cleanupBusy, setCleanupBusy] = useState(false);

  // Policy bump state
  const [selectedPolicyKey, setSelectedPolicyKey] = useState('privacy_policy');
  const [newPolicyVersion, setNewPolicyVersion] = useState('1.1.0');
  const [requireReconsent, setRequireReconsent] = useState(true);

  // Entity config edit state
  const [entityForm, setEntityForm] = useState<any>({});
  const [actionBanner, setActionBanner] = useState('');

  // Incident form state
  const [incTitle, setIncTitle] = useState('');
  const [incSeverity, setIncSeverity] = useState('MEDIUM');
  const [incDesc, setIncDesc] = useState('');

  const fetchOverview = async () => {
    const token = localStorage.getItem('tuteach_auth_token');
    if (!token) return;
    setLoading(true);
    setErrorMsg('');
    try {
      const res = await fetch('/api/admin/compliance/overview', {
        headers: { Authorization: `Bearer ${token}` }
      });
      const data = await res.json();
      if (!res.ok) {
        setErrorMsg(data.message || 'Access denied. Compliance Administrator role required.');
        setOverview(null);
      } else {
        setOverview(data);
        if (data.legalEntity) setEntityForm(data.legalEntity);
      }
    } catch {
      setErrorMsg('Failed to load compliance overview.');
    } finally {
      setLoading(false);
    }
  };

  const fetchHygieneAudit = async () => {
    const token = localStorage.getItem('tuteach_auth_token');
    if (!token) return;
    try {
      const res = await fetch('/api/admin/compliance/accounts-audit', {
        headers: { Authorization: `Bearer ${token}` }
      });
      const data = await res.json();
      if (res.ok) setHygieneAudit(data);
    } catch {
      // handled gracefully
    }
  };

  const fetchSeoAndBlogs = async () => {
    const token = localStorage.getItem('tuteach_auth_token');
    if (!token) return;
    try {
      const [seoRes, postsRes] = await Promise.all([
        fetch('/api/seo/admin-overview', { headers: { Authorization: `Bearer ${token}` } }),
        fetch('/api/blog/posts?includeDrafts=true', { headers: { Authorization: `Bearer ${token}` } })
      ]);
      if (seoRes.ok) {
        setSeoOverview(await seoRes.json());
      }
      if (postsRes.ok) {
        const pd = await postsRes.json();
        setBlogPosts(Array.isArray(pd.posts) ? pd.posts : []);
      }
    } catch {
      // handled gracefully
    }
  };

  useEffect(() => {
    fetch('/api/admin/bootstrap-status')
      .then((r) => r.json())
      .then((d) => {
        setBootstrapStatus(d);
        if (d && !d.hasAdminAccount) {
          setAuthMode('claim');
        }
      })
      .catch(() => {});
  }, []);

  useEffect(() => {
    if (user?.role === 'admin') {
      fetchOverview();
      fetchHygieneAudit();
      fetchSeoAndBlogs();
    }
  }, [user?.role]);

  const handleCleanupTestAccounts = async (e: React.FormEvent) => {
    e.preventDefault();
    if (cleanupPhrase !== 'CLEANUP_TEST_ACCOUNTS') {
      setErrorMsg('Please type CLEANUP_TEST_ACCOUNTS exactly to confirm deletion of synthetic test accounts.');
      return;
    }
    const token = localStorage.getItem('tuteach_auth_token');
    if (!token) return;
    setCleanupBusy(true);
    setErrorMsg('');
    try {
      const res = await fetch('/api/admin/compliance/cleanup-test-accounts', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify({
          confirmCleanup: true,
          confirmationPhrase: cleanupPhrase,
          includeLegacyTestAdmin,
          includeAnonymizedWithoutPayments: includeAnonymizedZeroPay
        })
      });
      const data = await res.json();
      if (!res.ok) {
        setErrorMsg(data.message || 'Cleanup failed.');
      } else {
        setCleanupPhrase('');
        setActionBanner(
          `Archived pre-cleanup snapshot (${data.snapshotFile}) and removed ${data.deletedCount} synthetic test records. ${data.preservedLegitimateCount} legitimate accounts preserved.`
        );
        fetchOverview();
        fetchHygieneAudit();
      }
    } catch {
      setErrorMsg('Network error running account cleanup.');
    } finally {
      setCleanupBusy(false);
    }
  };

  const handleClaimAdmin = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg('');
    setLoading(true);
    try {
      const res = await fetch('/api/admin/claim', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: claimName,
          email: claimEmail,
          password: claimPassword,
          passcode: claimPasscode
        })
      });
      const data = await res.json();
      if (!res.ok) {
        setErrorMsg(data.message || 'Failed to claim administrator access.');
      } else {
        localStorage.setItem('tuteach_auth_token', data.token);
        localStorage.setItem('tuteach_user_davinci', JSON.stringify(data.user));
        await refreshCurrentUser();
      }
    } catch {
      setErrorMsg('Network error claiming admin account.');
    } finally {
      setLoading(false);
    }
  };

  const handleAdminLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg('');
    setLoading(true);
    const ok = await loginUser(claimEmail, claimPassword);
    setLoading(false);
    if (!ok) {
      setErrorMsg('Invalid administrator email or password.');
    }
  };

  const handleToggleJurisdiction = async (countryCode: string, enabled: boolean) => {
    const token = localStorage.getItem('tuteach_auth_token');
    await fetch(`/api/admin/compliance/jurisdictions/${countryCode}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
      body: JSON.stringify({ enabled, requiresLegalReview: !enabled })
    });
    setActionBanner(`Updated jurisdiction ${countryCode}: enabled=${enabled}`);
    fetchOverview();
  };

  const handleBumpPolicy = async (e: React.FormEvent) => {
    e.preventDefault();
    const token = localStorage.getItem('tuteach_auth_token');
    await fetch(`/api/admin/compliance/policies/${selectedPolicyKey}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
      body: JSON.stringify({ version: newPolicyVersion, requiresFreshConsent: requireReconsent })
    });
    setActionBanner(`Published ${selectedPolicyKey} v${newPolicyVersion} (fresh consent=${requireReconsent})`);
    fetchOverview();
  };

  const handleResolvePrivacyReq = async (id: string) => {
    const token = localStorage.getItem('tuteach_auth_token');
    await fetch(`/api/admin/compliance/privacy-requests/${id}/resolve`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
      body: JSON.stringify({ status: 'COMPLETED', resolutionNotes: 'Reviewed and resolved by Compliance Officer.' })
    });
    setActionBanner(`Resolved privacy request ${id}`);
    fetchOverview();
  };

  const handleResolveGrievance = async (id: string) => {
    const token = localStorage.getItem('tuteach_auth_token');
    await fetch(`/api/admin/compliance/grievances/${id}/resolve`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
      body: JSON.stringify({ status: 'RESOLVED', resolutionNotes: 'Closed after compliance inspection.' })
    });
    setActionBanner(`Resolved grievance ${id}`);
    fetchOverview();
  };

  const handleWithdrawStudentConsent = async (studentId: string) => {
    const token = localStorage.getItem('tuteach_auth_token');
    await fetch(`/api/admin/compliance/parental-consents/${studentId}/withdraw`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
      body: JSON.stringify({ reason: 'Administrative compliance hold' })
    });
    setActionBanner(`Withdrew minor consent for student ${studentId}`);
    fetchOverview();
  };

  const handleSaveEntity = async (e: React.FormEvent) => {
    e.preventDefault();
    const token = localStorage.getItem('tuteach_auth_token');
    await fetch('/api/admin/compliance/entity-config', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
      body: JSON.stringify(entityForm)
    });
    setActionBanner('Updated Legal Entity & Grievance Officer details.');
    fetchOverview();
  };

  const handleCreateIncident = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!incTitle) return;
    const token = localStorage.getItem('tuteach_auth_token');
    await fetch('/api/admin/compliance/incidents', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
      body: JSON.stringify({ title: incTitle, severity: incSeverity, description: incDesc })
    });
    setIncTitle('');
    setIncDesc('');
    setActionBanner('Logged compliance/security incident.');
    fetchOverview();
  };

  const resetBlogForm = () => {
    setEditingBlogId(null);
    setBlogTitle('');
    setBlogSlug('');
    setBlogCategory('Video Editing Guides');
    setBlogPrimaryKeyword('');
    setBlogSeoTitle('');
    setBlogMetaDescription('');
    setBlogExcerpt('');
    setBlogImageUrl('/assets/seo/blog-ai-mentor.jpg');
    setBlogImageAlt('TUTeach interactive AI learning workspace illustration');
    setBlogStatus('DRAFT');
    setBlogContent('');
  };

  const handleEditBlogPost = (post: any) => {
    setEditingBlogId(post.id);
    setBlogTitle(post.title || '');
    setBlogSlug(post.slug || '');
    setBlogCategory(post.category || 'Video Editing Guides');
    setBlogPrimaryKeyword(post.primaryKeyword || '');
    setBlogSeoTitle(post.seoTitle || '');
    setBlogMetaDescription(post.metaDescription || '');
    setBlogExcerpt(post.excerpt || '');
    setBlogImageUrl(post.featuredImageUrl || '/assets/seo/blog-ai-mentor.jpg');
    setBlogImageAlt(post.featuredImageAlt || '');
    setBlogStatus(post.status || 'DRAFT');
    setBlogContent(post.contentMarkdown || '');
  };

  const handleSaveBlogPost = async (e: React.FormEvent) => {
    e.preventDefault();
    const token = localStorage.getItem('tuteach_auth_token');
    if (!token) return;
    setBlogSaving(true);
    setErrorMsg('');
    try {
      const payload = {
        title: blogTitle,
        slug: blogSlug,
        category: blogCategory,
        primaryKeyword: blogPrimaryKeyword,
        seoTitle: blogSeoTitle || `${blogTitle} | TUTeach`,
        metaDescription: blogMetaDescription,
        excerpt: blogExcerpt,
        featuredImageUrl: blogImageUrl,
        featuredImageAlt: blogImageAlt,
        status: blogStatus,
        contentMarkdown: blogContent
      };
      const url = editingBlogId ? `/api/admin/blog/posts/${editingBlogId}` : '/api/admin/blog/posts';
      const method = editingBlogId ? 'PUT' : 'POST';
      const res = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify(payload)
      });
      const data = await res.json();
      if (!res.ok) {
        setErrorMsg(data.message || 'Could not save blog article.');
      } else {
        setActionBanner(
          editingBlogId
            ? `Updated blog article "/blog/${data.post?.slug}" (${data.post?.status}).`
            : `Created blog article "/blog/${data.post?.slug}" (${data.post?.status}).`
        );
        resetBlogForm();
        fetchSeoAndBlogs();
      }
    } catch {
      setErrorMsg('Network error saving blog post.');
    } finally {
      setBlogSaving(false);
    }
  };

  const handleToggleBlogStatus = async (postId: string, nextStatus: 'DRAFT' | 'PUBLISHED' | 'ARCHIVED') => {
    const token = localStorage.getItem('tuteach_auth_token');
    if (!token) return;
    const res = await fetch(`/api/admin/blog/posts/${postId}/status`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
      body: JSON.stringify({ status: nextStatus })
    });
    if (res.ok) {
      setActionBanner(`Updated blog status to ${nextStatus}.`);
      fetchSeoAndBlogs();
    } else {
      setErrorMsg('Failed to update blog status.');
    }
  };

  const handleDeleteBlogPost = async (postId: string, title: string) => {
    const token = localStorage.getItem('tuteach_auth_token');
    if (!token) return;
    const res = await fetch(`/api/admin/blog/posts/${postId}`, {
      method: 'DELETE',
      headers: { Authorization: `Bearer ${token}` }
    });
    if (res.ok) {
      if (editingBlogId === postId) resetBlogForm();
      setActionBanner(`Deleted blog article "${title}".`);
      fetchSeoAndBlogs();
    } else {
      setErrorMsg('Failed to delete blog article.');
    }
  };

  // Access Gate if not signed in as admin
  if (user?.role !== 'admin') {
    const canClaimWithPasscode = Boolean(bootstrapStatus && (!bootstrapStatus.hasAdminAccount || bootstrapStatus.passcodeConfigured));
    const showClaim = canClaimWithPasscode && (authMode === 'claim' || !bootstrapStatus?.hasAdminAccount);
    return (
      <div className="min-h-screen bg-[#EFEBDA] py-12 px-4 sm:px-6 lg:px-8 flex flex-col justify-center">
        <div className="max-w-md w-full mx-auto bg-white rounded-3xl p-8 border border-[#393636]/10 shadow-xl space-y-5">
          <div className="text-center space-y-2">
            <Lock className="w-8 h-8 text-[#F14C2F] mx-auto" />
            <h1 className="text-xl font-extrabold text-[#393636]">
              Compliance &amp; Privacy Governance Console
            </h1>
            <p className="text-xs text-gray-600">
              Restricted to authorized TUTeach compliance administrators. Student accounts are blocked by RBAC.
            </p>
          </div>

          {canClaimWithPasscode && bootstrapStatus?.hasAdminAccount && (
            <div className="grid grid-cols-2 gap-2 p-1 bg-[#EFEBDA]/70 rounded-xl border border-[#393636]/10">
              <button
                type="button"
                onClick={() => {
                  setAuthMode('signin');
                  setErrorMsg('');
                }}
                className={`py-2 rounded-lg text-xs font-bold cursor-pointer transition-colors ${
                  authMode === 'signin' ? 'bg-[#393636] text-white' : 'text-[#393636] hover:bg-white/70'
                }`}
              >
                Admin Sign In
              </button>
              <button
                type="button"
                onClick={() => {
                  setAuthMode('claim');
                  setErrorMsg('');
                }}
                className={`py-2 rounded-lg text-xs font-bold cursor-pointer transition-colors ${
                  authMode === 'claim' ? 'bg-[#F14C2F] text-white' : 'text-[#393636] hover:bg-white/70'
                }`}
              >
                Claim Owner Admin
              </button>
            </div>
          )}

          {errorMsg && (
            <div className="p-3 bg-red-50 text-red-700 border border-red-200 rounded-xl text-xs font-medium">
              {errorMsg}
            </div>
          )}

          {user && (
            <div className="p-3 bg-amber-50 text-amber-900 border border-amber-200 rounded-xl text-xs">
              Signed in currently as standard student <strong>{user.email}</strong>. Admin role required.
            </div>
          )}

          {showClaim ? (
            <form onSubmit={handleClaimAdmin} className="space-y-3">
              <div className="text-xs font-bold text-[#F14C2F]">
                {!bootstrapStatus?.hasAdminAccount
                  ? 'First-Run Setup: Provision Primary Compliance Administrator'
                  : 'Claim Owner Administrator Account with Setup Passcode'}
              </div>
              <p className="text-[11px] text-gray-500">
                Enter your owner name, official email, a strong password (min 8 chars), and the server secret passcode configured in AI Studio Secrets.
              </p>
              <input
                type="text"
                required
                placeholder="Administrator Full Name"
                value={claimName}
                onChange={(e) => setClaimName(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-xl text-xs"
              />
              <input
                type="email"
                required
                placeholder="Owner / Admin Email"
                value={claimEmail}
                onChange={(e) => setClaimEmail(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-xl text-xs"
              />
              <input
                type="password"
                required
                minLength={8}
                placeholder="Strong password (min 8 chars)"
                value={claimPassword}
                onChange={(e) => setClaimPassword(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-xl text-xs"
              />
              {bootstrapStatus?.passcodeConfigured && (
                <input
                  type="password"
                  required
                  placeholder="TUTEACH_ADMIN_PASSCODE"
                  value={claimPasscode}
                  onChange={(e) => setClaimPasscode(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-xl text-xs"
                />
              )}
              <button
                type="submit"
                disabled={loading}
                className="w-full py-2.5 bg-[#F14C2F] text-white font-bold text-xs rounded-xl cursor-pointer"
              >
                {loading ? 'Provisioning...' : 'Provision / Claim Owner Admin'}
              </button>
            </form>
          ) : (
            <form onSubmit={handleAdminLogin} className="space-y-3">
              <div className="text-xs font-bold text-[#393636]">Administrator Sign In</div>
              <input
                type="email"
                required
                placeholder="Admin Email"
                value={claimEmail}
                onChange={(e) => setClaimEmail(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-xl text-xs"
              />
              <input
                type="password"
                required
                placeholder="Password"
                value={claimPassword}
                onChange={(e) => setClaimPassword(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-xl text-xs"
              />
              <button
                type="submit"
                disabled={loading}
                className="w-full py-2.5 bg-[#393636] text-white font-bold text-xs rounded-xl cursor-pointer"
              >
                Sign In to Compliance Console
              </button>
            </form>
          )}
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#EFEBDA] py-10 px-4 sm:px-6 lg:px-8">
      <div className="max-w-7xl mx-auto space-y-6">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div>
            <div className="text-xs font-bold uppercase tracking-wider text-[#F14C2F]">
              Restricted Governance Console
            </div>
            <h1 className="text-2xl sm:text-3xl font-extrabold text-[#393636]">
              TUTeach Compliance, Child Safety &amp; Legal Audit
            </h1>
          </div>
          <button
            onClick={() => {
              fetchOverview();
              fetchHygieneAudit();
            }}
            className="px-4 py-2 bg-white border border-[#393636]/15 rounded-xl text-xs font-bold flex items-center gap-2 cursor-pointer"
          >
            <RefreshCw className="w-3.5 h-3.5" /> Refresh Audit Data
          </button>
        </div>

        {actionBanner && (
          <div className="p-3 bg-emerald-50 border border-emerald-200 text-emerald-900 rounded-2xl text-xs font-semibold flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4 text-emerald-600" />
            {actionBanner}
          </div>
        )}

        {errorMsg && (
          <div className="p-3 bg-red-50 border border-red-200 text-red-800 rounded-2xl text-xs font-semibold">
            {errorMsg}
          </div>
        )}

        {overview && overview.missingOwnerInfo?.length > 0 && (
          <div className="p-4 bg-amber-50 border border-amber-300 rounded-2xl text-xs text-amber-950 flex items-start gap-2.5">
            <AlertTriangle className="w-5 h-5 text-amber-700 shrink-0" />
            <div>
              <strong>Missing Owner Legal Placeholders ({overview.missingOwnerInfo.length}):</strong> {overview.missingOwnerInfo.join(' · ')}
            </div>
          </div>
        )}

        {/* Navigation Tabs */}
        <div className="flex flex-wrap gap-2">
          {[
            ['overview', 'Overview & Retention'],
            ['consents', 'Parental Consents'],
            ['requests', 'Privacy & Grievances'],
            ['jurisdictions', 'Age & Countries'],
            ['policies', 'Policy Versions'],
            ['entity', 'Legal Entity & Incidents'],
            ['hygiene', 'Database & Accounts'],
            ['blog', 'SEO & Blog CMS']
          ].map(([key, label]) => (
            <button
              key={key}
              onClick={() => {
                setActiveTab(key as any);
                if (key === 'hygiene') fetchHygieneAudit();
                if (key === 'blog') fetchSeoAndBlogs();
              }}
              className={`px-4 py-2 rounded-xl text-xs font-bold cursor-pointer ${
                activeTab === key ? 'bg-[#393636] text-white' : 'bg-white text-[#393636] border border-[#393636]/10'
              }`}
            >
              {label}
            </button>
          ))}
        </div>

        {overview && activeTab === 'overview' && (
          <div className="space-y-6">
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
              {[
                ['Total Accounts', overview.stats.totalStudents, Users],
                ['Registered Minors', overview.stats.minorsCount, ShieldCheck],
                ['Verified Consents', overview.stats.parentalConsentVerified, CheckCircle2],
                ['Pending Consents', overview.stats.parentalConsentPending, AlertTriangle],
                ['Open Privacy Reqs', overview.stats.openPrivacyRequests, Scale],
                ['Open Grievances', overview.stats.openGrievances, FileText],
                ['Enabled Countries', overview.stats.enabledCountries, Globe],
                ['Review Countries', overview.stats.reviewRequiredCountries, Lock]
              ].map(([label, val, Icon]: any) => (
                <div key={label} className="bg-white p-4 rounded-2xl border border-[#393636]/10 shadow-sm">
                  <div className="flex items-center justify-between text-gray-500 text-xs">
                    <span>{label}</span>
                    <Icon className="w-4 h-4 text-[#F14C2F]" />
                  </div>
                  <div className="text-2xl font-extrabold text-[#393636] mt-1">{val}</div>
                </div>
              ))}
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <div className="bg-white p-6 rounded-3xl border border-[#393636]/10 space-y-3">
                <h3 className="font-extrabold text-[#393636] text-sm">Third-Party Data Processors</h3>
                <div className="space-y-2 text-xs">
                  {overview.thirdPartyProcessors.map((p: any) => (
                    <div key={p.id} className="p-3 rounded-xl bg-gray-50 border border-gray-100">
                      <div className="font-bold text-[#393636]">{p.processorName} ({p.jurisdiction})</div>
                      <div className="text-gray-600">{p.dataShared}</div>
                      <div className="text-[11px] text-amber-800 mt-0.5">{p.policyNote}</div>
                    </div>
                  ))}
                </div>
              </div>

              <div className="bg-white p-6 rounded-3xl border border-[#393636]/10 space-y-3">
                <h3 className="font-extrabold text-[#393636] text-sm">Recent Compliance Audit Trail</h3>
                <div className="space-y-2 text-xs max-h-80 overflow-y-auto">
                  {overview.auditLogs.map((a: any) => (
                    <div key={a.id} className="p-2.5 rounded-xl bg-gray-50 border border-gray-100">
                      <div className="font-bold text-[#393636]">{a.action}</div>
                      <div className="text-gray-600">{a.summary}</div>
                      <div className="text-[10px] text-gray-400">{new Date(a.createdAt).toLocaleString()}</div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        )}

        {overview && activeTab === 'consents' && (
          <div className="bg-white p-6 rounded-3xl border border-[#393636]/10 overflow-x-auto">
            <h3 className="font-extrabold text-[#393636] text-sm mb-4">Verifiable Parental Consent Records</h3>
            <table className="w-full text-left text-xs">
              <thead className="bg-[#EFEBDA]/60">
                <tr>
                  <th className="p-3">Student ID</th>
                  <th className="p-3">Guardian</th>
                  <th className="p-3">Status</th>
                  <th className="p-3">Method</th>
                  <th className="p-3">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {overview.parentalConsents.map((c: any) => (
                  <tr key={c.id}>
                    <td className="p-3 font-mono">{c.studentId}</td>
                    <td className="p-3">{c.parentName} ({c.relationship}) — {c.parentEmail}</td>
                    <td className="p-3 font-bold">{c.status}</td>
                    <td className="p-3">{c.verificationMethod}</td>
                    <td className="p-3">
                      {c.status === 'VERIFIED' && (
                        <button
                          onClick={() => handleWithdrawStudentConsent(c.studentId)}
                          className="px-2.5 py-1 bg-amber-600 text-white rounded-lg text-[11px] font-bold cursor-pointer"
                        >
                          Revoke Access
                        </button>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {overview && activeTab === 'requests' && (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <div className="bg-white p-6 rounded-3xl border border-[#393636]/10 space-y-3">
              <h3 className="font-extrabold text-[#393636] text-sm">Privacy &amp; Deletion Requests</h3>
              <div className="space-y-2 text-xs">
                {overview.privacyRequests.map((r: any) => (
                  <div key={r.id} className="p-3 rounded-xl bg-gray-50 border border-gray-200 flex items-start justify-between gap-3">
                    <div>
                      <div className="font-bold">{r.requestType} — {r.status}</div>
                      <div className="text-gray-600">Student: {r.studentId} · Financial Retained: {r.financialRecordsRetained ? 'Yes' : 'No'}</div>
                      <div className="text-[11px] text-gray-500">{r.resolutionNotes}</div>
                    </div>
                    {r.status !== 'COMPLETED' && (
                      <button
                        onClick={() => handleResolvePrivacyReq(r.id)}
                        className="px-3 py-1 bg-[#393636] text-white rounded-lg text-[11px] font-bold shrink-0 cursor-pointer"
                      >
                        Resolve
                      </button>
                    )}
                  </div>
                ))}
              </div>
            </div>

            <div className="bg-white p-6 rounded-3xl border border-[#393636]/10 space-y-3">
              <h3 className="font-extrabold text-[#393636] text-sm">Grievances &amp; AI Escalations</h3>
              <div className="space-y-2 text-xs">
                {overview.grievances.map((g: any) => (
                  <div key={g.id} className="p-3 rounded-xl bg-gray-50 border border-gray-200 flex items-start justify-between gap-3">
                    <div>
                      <div className="font-mono font-bold text-[#F14C2F]">{g.referenceCode} ({g.status})</div>
                      <div className="font-bold text-[#393636]">{g.category}</div>
                      <div className="text-gray-700">{g.description}</div>
                    </div>
                    {g.status !== 'RESOLVED' && (
                      <button
                        onClick={() => handleResolveGrievance(g.id)}
                        className="px-3 py-1 bg-emerald-600 text-white rounded-lg text-[11px] font-bold shrink-0 cursor-pointer"
                      >
                        Mark Resolved
                      </button>
                    )}
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {overview && activeTab === 'jurisdictions' && (
          <div className="bg-white p-6 rounded-3xl border border-[#393636]/10 overflow-x-auto">
            <h3 className="font-extrabold text-[#393636] text-sm mb-3">Configurable Country &amp; Age Rules</h3>
            <table className="w-full text-left text-xs">
              <thead className="bg-[#EFEBDA]/60">
                <tr>
                  <th className="p-3">Country</th>
                  <th className="p-3">Framework</th>
                  <th className="p-3">Consent Age</th>
                  <th className="p-3">Status</th>
                  <th className="p-3">Control</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {overview.jurisdictions.map((j: any) => (
                  <tr key={j.countryCode}>
                    <td className="p-3 font-bold">{j.countryName} ({j.countryCode})</td>
                    <td className="p-3">{j.applicableFramework}</td>
                    <td className="p-3">{j.consentAgeThreshold}+</td>
                    <td className="p-3">
                      {j.enabled && !j.requiresLegalReview ? (
                        <span className="px-2 py-0.5 bg-emerald-100 text-emerald-800 rounded font-bold">ENABLED</span>
                      ) : (
                        <span className="px-2 py-0.5 bg-amber-100 text-amber-800 rounded font-bold">REVIEW REQUIRED</span>
                      )}
                    </td>
                    <td className="p-3">
                      <button
                        onClick={() => handleToggleJurisdiction(j.countryCode, !j.enabled)}
                        className="px-3 py-1 bg-[#393636] text-white rounded-lg text-[11px] font-bold cursor-pointer"
                      >
                        {j.enabled ? 'Hold for Review' : 'Enable Region'}
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {overview && activeTab === 'policies' && (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            <form onSubmit={handleBumpPolicy} className="bg-white p-6 rounded-3xl border border-[#393636]/10 space-y-3 h-fit">
              <h3 className="font-extrabold text-[#393636] text-sm">Publish Policy Version Update</h3>
              <select
                value={selectedPolicyKey}
                onChange={(e) => setSelectedPolicyKey(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-xl text-xs bg-white"
              >
                {overview.policies.map((p: any) => (
                  <option key={p.policyKey} value={p.policyKey}>
                    {p.title} (current v{p.version})
                  </option>
                ))}
              </select>
              <input
                type="text"
                required
                placeholder="New Version (e.g. 1.1.0)"
                value={newPolicyVersion}
                onChange={(e) => setNewPolicyVersion(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-xl text-xs"
              />
              <label className="flex items-center gap-2 text-xs">
                <input
                  type="checkbox"
                  checked={requireReconsent}
                  onChange={(e) => setRequireReconsent(e.target.checked)}
                  className="accent-[#F14C2F]"
                />
                Require fresh acceptance from existing students
              </label>
              <button
                type="submit"
                className="w-full py-2 bg-[#F14C2F] text-white font-bold text-xs rounded-xl cursor-pointer"
              >
                Publish Policy Version
              </button>
            </form>

            <div className="lg:col-span-2 bg-white p-6 rounded-3xl border border-[#393636]/10 space-y-2 text-xs">
              <h3 className="font-extrabold text-[#393636] text-sm mb-2">Active Versioned Legal Documents</h3>
              {overview.policies.map((p: any) => (
                <div key={p.id} className="p-3 bg-gray-50 rounded-xl border border-gray-100 flex items-center justify-between">
                  <div>
                    <div className="font-bold text-[#393636]">{p.title}</div>
                    <div className="text-gray-500">{p.summary}</div>
                  </div>
                  <div className="text-right shrink-0 ml-4">
                    <div className="font-mono font-bold">v{p.version}</div>
                    <div className="text-[10px] text-gray-500">{p.effectiveDate}</div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {overview && activeTab === 'entity' && (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <form onSubmit={handleSaveEntity} className="bg-white p-6 rounded-3xl border border-[#393636]/10 space-y-3 text-xs">
              <h3 className="font-extrabold text-[#393636] text-sm">Owner Legal &amp; Grievance Officer Details</h3>
              {[
                ['legalBusinessName', 'Legal Business Name'],
                ['registeredAddress', 'Registered Business Address'],
                ['privacyEmail', 'Privacy Contact Email'],
                ['grievanceOfficerName', 'Grievance Officer Name'],
                ['grievanceOfficerContact', 'Grievance Officer Contact'],
                ['grievanceEmail', 'Official Grievance Email'],
                ['grievanceResponseSla', 'Grievance Response SLA'],
                ['dpoOrPrivacyLead', 'Data Protection Officer / Privacy Lead']
              ].map(([field, label]) => (
                <div key={field}>
                  <label className="block font-bold text-[#393636] mb-1">{label}</label>
                  <input
                    type="text"
                    value={entityForm[field] || ''}
                    onChange={(e) => setEntityForm({ ...entityForm, [field]: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-xl text-xs"
                  />
                </div>
              ))}
              <button type="submit" className="px-4 py-2 bg-[#F14C2F] text-white font-bold rounded-xl cursor-pointer">
                Save Legal Entity Details
              </button>
            </form>

            <div className="bg-white p-6 rounded-3xl border border-[#393636]/10 space-y-4 text-xs">
              <h3 className="font-extrabold text-[#393636] text-sm">Security &amp; Privacy Incident Log</h3>
              <form onSubmit={handleCreateIncident} className="space-y-2 p-3 bg-gray-50 rounded-2xl border border-gray-200">
                <input
                  type="text"
                  required
                  placeholder="Incident summary title"
                  value={incTitle}
                  onChange={(e) => setIncTitle(e.target.value)}
                  className="w-full px-3 py-2 bg-white border border-gray-300 rounded-xl text-xs"
                />
                <div className="flex gap-2">
                  <select
                    value={incSeverity}
                    onChange={(e) => setIncSeverity(e.target.value)}
                    className="px-3 py-2 bg-white border border-gray-300 rounded-xl text-xs"
                  >
                    <option value="LOW">LOW</option>
                    <option value="MEDIUM">MEDIUM</option>
                    <option value="HIGH">HIGH</option>
                    <option value="CRITICAL">CRITICAL</option>
                  </select>
                  <input
                    type="text"
                    placeholder="Details / mitigation"
                    value={incDesc}
                    onChange={(e) => setIncDesc(e.target.value)}
                    className="flex-1 px-3 py-2 bg-white border border-gray-300 rounded-xl text-xs"
                  />
                </div>
                <button type="submit" className="px-4 py-2 bg-[#393636] text-white font-bold rounded-xl flex items-center gap-1.5 cursor-pointer">
                  <PlusCircle className="w-3.5 h-3.5" /> Record Incident
                </button>
              </form>

              <div className="space-y-2 max-h-72 overflow-y-auto">
                {overview.incidents.length === 0 ? (
                  <p className="text-gray-500">No security incidents recorded.</p>
                ) : (
                  overview.incidents.map((inc: any) => (
                    <div key={inc.id} className="p-3 bg-gray-50 rounded-xl border border-gray-200">
                      <div className="font-bold text-[#393636]">[{inc.severity}] {inc.title}</div>
                      <div className="text-gray-600">{inc.description}</div>
                    </div>
                  ))
                )}
              </div>
            </div>
          </div>
        )}

        {activeTab === 'hygiene' && (
          <div className="space-y-6">
            {hygieneAudit ? (
              <>
                <div className="grid grid-cols-2 sm:grid-cols-5 gap-4">
                  {[
                    ['Total Accounts', hygieneAudit.stats.totalAccounts],
                    ['Admins', hygieneAudit.stats.adminCount],
                    ['Legitimate Students', hygieneAudit.stats.legitimateStudentCount],
                    ['Automated Test Accounts', hygieneAudit.stats.automatedTestCount],
                    ['Anonymized Records', hygieneAudit.stats.anonymizedCount]
                  ].map(([label, val]: any) => (
                    <div key={label} className="bg-white p-4 rounded-2xl border border-[#393636]/10 shadow-sm">
                      <div className="text-xs text-gray-500">{label}</div>
                      <div className="text-2xl font-extrabold text-[#393636] mt-1">{val}</div>
                    </div>
                  ))}
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                  <div className="bg-white p-6 rounded-3xl border border-[#393636]/10 space-y-3 text-xs">
                    <h3 className="font-extrabold text-[#393636] text-sm">Administrator Accounts ({hygieneAudit.adminAccounts.length})</h3>
                    <div className="space-y-2">
                      {hygieneAudit.adminAccounts.map((a: any) => (
                        <div key={a.id} className="p-3 bg-gray-50 rounded-xl border border-gray-200 flex items-center justify-between">
                          <div>
                            <div className="font-bold text-[#393636]">{a.name} ({a.email})</div>
                            <div className="text-[11px] text-gray-500">ID: {a.id}</div>
                          </div>
                          <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${a.isLegacyTestAdmin ? 'bg-amber-100 text-amber-800' : 'bg-emerald-100 text-emerald-800'}`}>
                            {a.isLegacyTestAdmin ? 'LEGACY TEST ADMIN' : 'OWNER ADMIN'}
                          </span>
                        </div>
                      ))}
                    </div>

                    <h3 className="font-extrabold text-[#393636] text-sm pt-3">Database Backups ({hygieneAudit.backups?.length || 0})</h3>
                    <div className="space-y-1.5 max-h-40 overflow-y-auto">
                      {(hygieneAudit.backups || []).map((b: any) => (
                        <div key={b.name} className="p-2.5 bg-gray-50 rounded-xl border border-gray-100 flex items-center justify-between font-mono text-[11px]">
                          <span>{b.name}</span>
                          <span className="text-gray-500">{Math.round(b.sizeBytes / 1024)} KB</span>
                        </div>
                      ))}
                    </div>
                  </div>

                  <form onSubmit={handleCleanupTestAccounts} className="bg-white p-6 rounded-3xl border border-[#393636]/10 space-y-4 text-xs h-fit">
                    <h3 className="font-extrabold text-[#393636] text-sm">Owner-Approved Synthetic Test Cleanup</h3>
                    <p className="text-gray-600 leading-relaxed">
                      Only automated QA/test accounts matching synthetic test patterns are targeted. Legitimate student records ({hygieneAudit.stats.legitimateStudentCount}) and your active owner administrator session are always preserved. A JSON snapshot archive is created automatically before deletion.
                    </p>

                    <label className="flex items-center gap-2 text-xs text-[#393636]">
                      <input
                        type="checkbox"
                        checked={includeAnonymizedZeroPay}
                        onChange={(e) => setIncludeAnonymizedZeroPay(e.target.checked)}
                        className="accent-[#F14C2F]"
                      />
                      Include deleted/anonymized test rows with zero financial ledgers
                    </label>

                    <label className="flex items-center gap-2 text-xs text-[#393636]">
                      <input
                        type="checkbox"
                        checked={includeLegacyTestAdmin}
                        onChange={(e) => setIncludeLegacyTestAdmin(e.target.checked)}
                        className="accent-[#F14C2F]"
                      />
                      Remove legacy automated test admin (compliance.admin@tuteach.local) if different from current owner
                    </label>

                    <div>
                      <label className="block font-bold text-[#393636] mb-1">
                        Type <span className="font-mono text-[#F14C2F]">CLEANUP_TEST_ACCOUNTS</span> to confirm:
                      </label>
                      <input
                        type="text"
                        value={cleanupPhrase}
                        onChange={(e) => setCleanupPhrase(e.target.value)}
                        placeholder="CLEANUP_TEST_ACCOUNTS"
                        className="w-full px-3 py-2 border border-gray-300 rounded-xl text-xs font-mono"
                      />
                    </div>

                    <button
                      type="submit"
                      disabled={cleanupBusy || hygieneAudit.stats.automatedTestCount === 0}
                      className="w-full py-2.5 bg-[#F14C2F] disabled:bg-gray-400 text-white font-bold text-xs rounded-xl cursor-pointer"
                    >
                      {cleanupBusy ? 'Archiving & Cleaning...' : `Archive Snapshot & Remove ${hygieneAudit.stats.automatedTestCount} Synthetic Test Accounts`}
                    </button>
                  </form>
                </div>

                <div className="bg-white p-6 rounded-3xl border border-[#393636]/10 space-y-3 text-xs overflow-x-auto">
                  <h3 className="font-extrabold text-[#393636] text-sm">
                    Automated Test Accounts Flagged ({hygieneAudit.automatedTestAccounts.length})
                  </h3>
                  <div className="max-h-72 overflow-y-auto">
                    <table className="w-full text-left text-xs">
                      <thead className="bg-[#EFEBDA]/60">
                        <tr>
                          <th className="p-2.5">Name</th>
                          <th className="p-2.5">Email</th>
                          <th className="p-2.5">Compliance Status</th>
                          <th className="p-2.5">Payments</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-gray-100">
                        {hygieneAudit.automatedTestAccounts.slice(0, 50).map((t: any) => (
                          <tr key={t.id}>
                            <td className="p-2.5 font-semibold">{t.name}</td>
                            <td className="p-2.5 font-mono">{t.email}</td>
                            <td className="p-2.5">{t.complianceStatus}</td>
                            <td className="p-2.5">{t.paymentCount}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              </>
            ) : (
              <div className="bg-white p-6 rounded-3xl border border-[#393636]/10 text-xs text-gray-500">
                Loading account hygiene inventory...
              </div>
            )}
          </div>
        )}

        {activeTab === 'blog' && (
          <div className="space-y-6">
            {/* SEO Infrastructure Readiness Panel */}
            <div className="bg-white p-6 rounded-3xl border border-[#393636]/10 space-y-4 text-xs">
              <div className="flex flex-wrap items-center justify-between gap-3">
                <div>
                  <h3 className="font-extrabold text-[#393636] text-sm">Technical SEO &amp; Indexing Readiness</h3>
                  <p className="text-gray-500 mt-0.5">
                    Server-rendered meta tags, dynamic sitemap.xml, robots.txt, and privacy-compliant analytics configuration.
                  </p>
                </div>
                <div className="flex flex-wrap gap-2">
                  <a
                    href="/robots.txt"
                    target="_blank"
                    rel="noreferrer"
                    className="px-3 py-1.5 rounded-lg bg-[#EFEBDA] text-[#393636] font-bold hover:underline"
                  >
                    Inspect /robots.txt
                  </a>
                  <a
                    href="/sitemap.xml"
                    target="_blank"
                    rel="noreferrer"
                    className="px-3 py-1.5 rounded-lg bg-[#EFEBDA] text-[#393636] font-bold hover:underline"
                  >
                    Inspect /sitemap.xml
                  </a>
                </div>
              </div>

              {seoOverview && (
                <div className="grid grid-cols-2 sm:grid-cols-5 gap-3">
                  <div className="p-3 rounded-2xl bg-[#FAF7EE] border border-[#393636]/10">
                    <div className="text-gray-500">Static Indexed Routes</div>
                    <div className="text-xl font-extrabold text-[#393636] mt-0.5">{seoOverview.staticIndexedRoutes}</div>
                  </div>
                  <div className="p-3 rounded-2xl bg-[#FAF7EE] border border-[#393636]/10">
                    <div className="text-gray-500">Published Blog Posts</div>
                    <div className="text-xl font-extrabold text-emerald-700 mt-0.5">{seoOverview.publishedPostsCount}</div>
                  </div>
                  <div className="p-3 rounded-2xl bg-[#FAF7EE] border border-[#393636]/10">
                    <div className="text-gray-500">Draft / Archived Posts</div>
                    <div className="text-xl font-extrabold text-amber-700 mt-0.5">{seoOverview.draftPostsCount}</div>
                  </div>
                  <div className="p-3 rounded-2xl bg-[#FAF7EE] border border-[#393636]/10">
                    <div className="text-gray-500">GA4 Measurement ID</div>
                    <div className="text-xs font-extrabold mt-1">
                      {seoOverview.ga4Configured ? (
                        <span className="text-emerald-700">CONFIGURED (Consent Opt-In)</span>
                      ) : (
                        <span className="text-amber-700">PENDING ENV VAR</span>
                      )}
                    </div>
                  </div>
                  <div className="p-3 rounded-2xl bg-[#FAF7EE] border border-[#393636]/10">
                    <div className="text-gray-500">Google Search Console</div>
                    <div className="text-xs font-extrabold mt-1">
                      {seoOverview.gscConfigured ? (
                        <span className="text-emerald-700">META TOKEN ACTIVE</span>
                      ) : (
                        <span className="text-amber-700">PENDING VERIFICATION</span>
                      )}
                    </div>
                  </div>
                </div>
              )}
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
              {/* Blog Post Editor */}
              <form
                onSubmit={handleSaveBlogPost}
                className="lg:col-span-5 bg-white p-6 rounded-3xl border border-[#393636]/10 space-y-3 text-xs h-fit"
              >
                <div className="flex items-center justify-between">
                  <h3 className="font-extrabold text-[#393636] text-sm">
                    {editingBlogId ? 'Edit Blog Article' : 'Create New Educational Article'}
                  </h3>
                  {editingBlogId && (
                    <button
                      type="button"
                      onClick={resetBlogForm}
                      className="text-[11px] font-bold text-[#F14C2F] hover:underline cursor-pointer"
                    >
                      + New Post
                    </button>
                  )}
                </div>

                <div>
                  <label className="block font-bold text-[#393636] mb-1">Article Title (H1)</label>
                  <input
                    type="text"
                    required
                    value={blogTitle}
                    onChange={(e) => setBlogTitle(e.target.value)}
                    placeholder="e.g. Color Correction Basics in DaVinci Resolve"
                    className="w-full px-3 py-2 border border-gray-300 rounded-xl"
                  />
                </div>

                <div className="grid grid-cols-2 gap-2">
                  <div>
                    <label className="block font-bold text-[#393636] mb-1">URL Slug</label>
                    <input
                      type="text"
                      value={blogSlug}
                      onChange={(e) => setBlogSlug(e.target.value)}
                      placeholder="auto-generated-from-title"
                      className="w-full px-3 py-2 border border-gray-300 rounded-xl font-mono"
                    />
                  </div>
                  <div>
                    <label className="block font-bold text-[#393636] mb-1">Status</label>
                    <select
                      value={blogStatus}
                      onChange={(e) => setBlogStatus(e.target.value as any)}
                      className="w-full px-3 py-2 border border-gray-300 rounded-xl bg-white"
                    >
                      <option value="DRAFT">DRAFT</option>
                      <option value="PUBLISHED">PUBLISHED</option>
                      <option value="ARCHIVED">ARCHIVED</option>
                    </select>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-2">
                  <div>
                    <label className="block font-bold text-[#393636] mb-1">Category</label>
                    <select
                      value={blogCategory}
                      onChange={(e) => setBlogCategory(e.target.value)}
                      className="w-full px-3 py-2 border border-gray-300 rounded-xl bg-white"
                    >
                      <option value="Video Editing Guides">Video Editing Guides</option>
                      <option value="DaVinci Resolve">DaVinci Resolve</option>
                      <option value="AI Learning & Future Skills">AI Learning &amp; Future Skills</option>
                      <option value="Study Strategies">Study Strategies</option>
                    </select>
                  </div>
                  <div>
                    <label className="block font-bold text-[#393636] mb-1">Primary Keyword</label>
                    <input
                      type="text"
                      value={blogPrimaryKeyword}
                      onChange={(e) => setBlogPrimaryKeyword(e.target.value)}
                      placeholder="target search phrase"
                      className="w-full px-3 py-2 border border-gray-300 rounded-xl"
                    />
                  </div>
                </div>

                <div>
                  <label className="block font-bold text-[#393636] mb-1">SEO Title (&lt;title&gt;)</label>
                  <input
                    type="text"
                    value={blogSeoTitle}
                    onChange={(e) => setBlogSeoTitle(e.target.value)}
                    placeholder="Optional — defaults to Article Title | TUTeach"
                    className="w-full px-3 py-2 border border-gray-300 rounded-xl"
                  />
                </div>

                <div>
                  <label className="block font-bold text-[#393636] mb-1">Meta Description (max 160 chars)</label>
                  <textarea
                    rows={2}
                    required
                    maxLength={175}
                    value={blogMetaDescription}
                    onChange={(e) => setBlogMetaDescription(e.target.value)}
                    placeholder="Concise summary shown in Google Search results"
                    className="w-full px-3 py-2 border border-gray-300 rounded-xl"
                  />
                </div>

                <div>
                  <label className="block font-bold text-[#393636] mb-1">Excerpt Summary</label>
                  <textarea
                    rows={2}
                    required
                    value={blogExcerpt}
                    onChange={(e) => setBlogExcerpt(e.target.value)}
                    placeholder="Card preview summary on /blog index"
                    className="w-full px-3 py-2 border border-gray-300 rounded-xl"
                  />
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                  <div>
                    <label className="block font-bold text-[#393636] mb-1">Featured Image Asset</label>
                    <select
                      value={blogImageUrl}
                      onChange={(e) => setBlogImageUrl(e.target.value)}
                      className="w-full px-3 py-2 border border-gray-300 rounded-xl bg-white"
                    >
                      <option value="/assets/seo/blog-ai-mentor.jpg">AI Mentor Classroom</option>
                      <option value="/assets/seo/course-video-editing.jpg">Video Editing Timeline</option>
                      <option value="/assets/seo/course-davinci-resolve.jpg">DaVinci Color Scopes</option>
                      <option value="/assets/seo/tuteach-og-showcase.jpg">TUTeach Showcase Banner</option>
                    </select>
                  </div>
                  <div>
                    <label className="block font-bold text-[#393636] mb-1">Image Alt Text</label>
                    <input
                      type="text"
                      value={blogImageAlt}
                      onChange={(e) => setBlogImageAlt(e.target.value)}
                      className="w-full px-3 py-2 border border-gray-300 rounded-xl"
                    />
                  </div>
                </div>

                <div>
                  <label className="block font-bold text-[#393636] mb-1">
                    Article Content (Safe Markdown: ## Headings, - Bullets, **Bold**)
                  </label>
                  <textarea
                    rows={8}
                    required
                    value={blogContent}
                    onChange={(e) => setBlogContent(e.target.value)}
                    placeholder="## Section Heading&#10;&#10;Write clear, factual educational guidance..."
                    className="w-full px-3 py-2 border border-gray-300 rounded-xl font-mono"
                  />
                </div>

                <button
                  type="submit"
                  disabled={blogSaving}
                  className="w-full py-2.5 bg-[#F14C2F] text-white font-bold rounded-xl cursor-pointer disabled:bg-gray-400"
                >
                  {blogSaving ? 'Saving...' : editingBlogId ? 'Save Article Changes' : 'Create Blog Article'}
                </button>
              </form>

              {/* Blog Inventory List */}
              <div className="lg:col-span-7 bg-white p-6 rounded-3xl border border-[#393636]/10 space-y-4 text-xs">
                <div className="flex items-center justify-between">
                  <h3 className="font-extrabold text-[#393636] text-sm">
                    Blog Articles &amp; Publishing Workflow ({blogPosts.length})
                  </h3>
                  <button
                    type="button"
                    onClick={fetchSeoAndBlogs}
                    className="px-3 py-1 bg-[#EFEBDA] text-[#393636] font-bold rounded-lg cursor-pointer"
                  >
                    Refresh
                  </button>
                </div>

                <div className="space-y-3">
                  {blogPosts.map((post) => (
                    <div
                      key={post.id}
                      className="p-4 rounded-2xl bg-[#FAF7EE] border border-[#393636]/10 space-y-2"
                    >
                      <div className="flex flex-wrap items-center justify-between gap-2">
                        <div className="flex items-center gap-2">
                          <span
                            className={`px-2 py-0.5 rounded font-bold text-[10px] ${
                              post.status === 'PUBLISHED'
                                ? 'bg-emerald-100 text-emerald-800'
                                : post.status === 'DRAFT'
                                ? 'bg-amber-100 text-amber-800'
                                : 'bg-gray-200 text-gray-700'
                            }`}
                          >
                            {post.status}
                          </span>
                          <span className="text-[11px] font-semibold text-[#F14C2F]">{post.category}</span>
                        </div>
                        <span className="text-[11px] text-gray-500 font-mono">/blog/{post.slug}</span>
                      </div>

                      <div className="font-bold text-sm text-[#393636]">{post.title}</div>
                      <p className="text-gray-600 line-clamp-2">{post.metaDescription}</p>

                      <div className="flex flex-wrap items-center justify-between gap-2 pt-2 border-t border-[#393636]/10">
                        <span className="text-[11px] text-gray-500">
                          Keyword: <strong>{post.primaryKeyword || 'general'}</strong> · {post.readTimeMinutes || 5} min
                        </span>
                        <div className="flex flex-wrap gap-2">
                          <button
                            type="button"
                            onClick={() => handleEditBlogPost(post)}
                            className="px-2.5 py-1 bg-white border border-gray-300 text-[#393636] font-bold rounded-lg cursor-pointer hover:bg-gray-50"
                          >
                            Edit
                          </button>
                          {post.status !== 'PUBLISHED' ? (
                            <button
                              type="button"
                              onClick={() => handleToggleBlogStatus(post.id, 'PUBLISHED')}
                              className="px-2.5 py-1 bg-emerald-600 text-white font-bold rounded-lg cursor-pointer"
                            >
                              Publish
                            </button>
                          ) : (
                            <button
                              type="button"
                              onClick={() => handleToggleBlogStatus(post.id, 'DRAFT')}
                              className="px-2.5 py-1 bg-amber-600 text-white font-bold rounded-lg cursor-pointer"
                            >
                              Unpublish
                            </button>
                          )}
                          <button
                            type="button"
                            onClick={() => handleDeleteBlogPost(post.id, post.title)}
                            className="px-2.5 py-1 bg-red-600 text-white font-bold rounded-lg cursor-pointer"
                          >
                            Delete
                          </button>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
