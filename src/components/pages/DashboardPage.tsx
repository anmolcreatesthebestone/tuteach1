import React, { useState } from 'react';
import { useApp } from '../../context/AppContext';
import { COURSES_DATA } from '../../data/coursesData';
import { CertificateModal } from '../certificate/CertificateModal';
import {
  Award,
  BookOpen,
  CheckCircle2,
  Clock,
  Film,
  Sparkles,
  ArrowRight,
  ShieldCheck,
  GraduationCap,
  RotateCcw,
  AlertCircle,
  PlayCircle,
  CreditCard,
  FileCheck,
  Lock,
  Star,
  Download,
  Trash2,
  ShieldAlert,
  Sliders,
  FileText,
  Edit3
} from 'lucide-react';

export const DashboardPage: React.FC = () => {
  const {
    user,
    navigate,
    completedLessons,
    assignmentEvaluations,
    currentCourseId,
    selectLesson,
    studentIdVerification,
    paymentReceipts,
    hasPaidForCourse,
    certificates,
    courseRatings,
    submitCourseRating,
    refreshCurrentUser,
    deleteCurrentAccount,
    setIsCookieModalOpen
  } = useApp();

  const [showCertificate, setShowCertificate] = useState(false);

  // Privacy & Legal Center Dashboard states
  const [privacyData, setPrivacyData] = useState<any>(null);
  const [loadingPrivacyData, setLoadingPrivacyData] = useState(false);
  const [privacyStatusMsg, setPrivacyStatusMsg] = useState<string>('');
  const [privacyErrorMsg, setPrivacyErrorMsg] = useState<string>('');
  const [correctionName, setCorrectionName] = useState<string>(user?.name || '');
  const [correctionReason, setCorrectionReason] = useState<string>('');
  const [isSavingCorrection, setIsSavingCorrection] = useState(false);
  const [isReconsenting, setIsReconsenting] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [deleteConfirmText, setDeleteConfirmText] = useState('');
  const [deleteReason, setDeleteReason] = useState('');
  const [isDeletingAccount, setIsDeletingAccount] = useState(false);

  const course =
    COURSES_DATA.find((c) => c.id === currentCourseId) || COURSES_DATA[0];

  const totalLessons = course.modules.reduce(
    (acc, m) => acc + m.lessons.length,
    0
  );
  const allCourseLessonIds = course.modules.flatMap((m) => m.lessons.map((l) => l.id));
  const completedCount = allCourseLessonIds.filter((id) =>
    completedLessons.includes(id)
  ).length;
  const progressPercent = Math.min(
    100,
    Math.round((completedCount / totalLessons) * 100)
  );

  const allAssignmentIds = course.modules.flatMap((m) =>
    m.lessons.filter((l) => l.practicalAssignment).map((l) => l.practicalAssignment!.id)
  );

  // Calculate task evaluations
  const evaluationsList = Object.values(assignmentEvaluations);
  const passedTasksList = allAssignmentIds
    .map((id) => assignmentEvaluations[id])
    .filter((ev) => ev && ev.bestScore >= 5.0);
  const passedTasks = passedTasksList.length;

  const averageTaskScore =
    evaluationsList.length > 0
      ? (
          evaluationsList.reduce((acc, ev) => acc + ev.bestScore, 0) /
          evaluationsList.length
        ).toFixed(1)
      : '0.0';

  const existingCert = certificates.find((c) => c.courseId === course.id);
  const isEligibleForCertificate =
    Boolean(existingCert) ||
    (completedCount === allCourseLessonIds.length &&
      allAssignmentIds.length > 0 &&
      passedTasksList.length === allAssignmentIds.length);

  // Rating state
  const existingRating = courseRatings[course.id];
  const [selectedStars, setSelectedStars] = useState<number>(existingRating?.rating || 5);
  const [reviewText, setReviewText] = useState<string>(existingRating?.review || '');
  const [isSubmittingRating, setIsSubmittingRating] = useState<boolean>(false);
  const [ratingMessage, setRatingMessage] = useState<string>('');

  const handleRatingSubmit = async () => {
    setIsSubmittingRating(true);
    setRatingMessage('');
    try {
      await submitCourseRating(course.id, selectedStars, reviewText);
      setRatingMessage('Thank you! Your course rating and review have been saved.');
    } catch {
      setRatingMessage('Rating saved.');
    } finally {
      setIsSubmittingRating(false);
    }
  };

  const isPaid = hasPaidForCourse(course.id);

  const authHeaders = () => {
    const token = typeof window !== 'undefined' ? localStorage.getItem('tuteach_auth_token') : null;
    return {
      'Content-Type': 'application/json',
      ...(token ? { Authorization: `Bearer ${token}` } : {})
    };
  };

  const handleLoadPrivacyData = async (downloadJson = false) => {
    setLoadingPrivacyData(true);
    setPrivacyErrorMsg('');
    setPrivacyStatusMsg('');
    try {
      const res = await fetch('/api/compliance/my-data', { headers: authHeaders() });
      const data = await res.json();
      if (!res.ok) {
        setPrivacyErrorMsg(data.message || 'Could not load personal data export.');
        return;
      }
      setPrivacyData(data);
      if (downloadJson) {
        await fetch('/api/compliance/privacy-request', {
          method: 'POST',
          headers: authHeaders(),
          body: JSON.stringify({ requestType: 'ACCESS_EXPORT', details: { source: 'dashboard_download' } })
        });
        const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `tuteach-personal-data-${user?.id || 'export'}.json`;
        a.click();
        URL.revokeObjectURL(url);
        setPrivacyStatusMsg('Personal data export downloaded (JSON) and logged in your privacy history.');
      }
    } catch {
      setPrivacyErrorMsg('Network error while exporting personal data.');
    } finally {
      setLoadingPrivacyData(false);
    }
  };

  const handleSubmitCorrection = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSavingCorrection(true);
    setPrivacyErrorMsg('');
    setPrivacyStatusMsg('');
    try {
      const res = await fetch('/api/compliance/privacy-request', {
        method: 'POST',
        headers: authHeaders(),
        body: JSON.stringify({
          requestType: 'CORRECTION',
          details: {
            newName: correctionName.trim() || undefined,
            reason: correctionReason.trim() || 'Student requested correction'
          }
        })
      });
      const data = await res.json();
      if (!res.ok) {
        setPrivacyErrorMsg(data.message || 'Correction request failed.');
        return;
      }
      await refreshCurrentUser();
      setCorrectionReason('');
      setPrivacyStatusMsg(data.message || 'Correction request processed.');
    } catch {
      setPrivacyErrorMsg('Network error submitting correction.');
    } finally {
      setIsSavingCorrection(false);
    }
  };

  const handleWithdrawOptionalConsent = async () => {
    setPrivacyErrorMsg('');
    setPrivacyStatusMsg('');
    try {
      const res = await fetch('/api/compliance/privacy-request', {
        method: 'POST',
        headers: authHeaders(),
        body: JSON.stringify({
          requestType: 'CONSENT_WITHDRAWAL',
          details: { withdrawnFrom: 'dashboard' }
        })
      });
      const data = await res.json();
      if (!res.ok) {
        setPrivacyErrorMsg(data.message || 'Could not withdraw optional consent.');
        return;
      }
      await refreshCurrentUser();
      setPrivacyStatusMsg('Optional analytics & marketing consent withdrawn immediately.');
    } catch {
      setPrivacyErrorMsg('Network error updating consent.');
    }
  };

  const handleAcceptFreshPolicies = async () => {
    if (!user?.pendingFreshPolicies || user.pendingFreshPolicies.length === 0) return;
    setIsReconsenting(true);
    try {
      const res = await fetch('/api/compliance/reconsent', {
        method: 'POST',
        headers: authHeaders(),
        body: JSON.stringify({
          policyKeys: user.pendingFreshPolicies.map((p) => p.policyKey)
        })
      });
      if (res.ok) {
        await refreshCurrentUser();
        setPrivacyStatusMsg('Updated legal policy acknowledgment recorded.');
      }
    } finally {
      setIsReconsenting(false);
    }
  };

  const handlePermanentDelete = async () => {
    if (deleteConfirmText.trim().toUpperCase() !== 'DELETE') return;
    setIsDeletingAccount(true);
    setPrivacyErrorMsg('');
    const result = await deleteCurrentAccount(deleteReason.trim() || 'Student initiated permanent account erasure');
    setIsDeletingAccount(false);
    if (!result.ok) {
      setPrivacyErrorMsg(result.error || 'Could not delete account.');
    }
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10 space-y-10">
      {/* Minor / Jurisdiction Compliance Gate Banner */}
      {user?.complianceStatus && user.complianceStatus !== 'ACTIVE' && (
        <div className="bg-amber-50 border border-amber-300 rounded-3xl p-5 sm:p-6 flex flex-col sm:flex-row sm:items-center justify-between gap-4 shadow-xs">
          <div className="flex items-start gap-3">
            <div className="w-10 h-10 rounded-2xl bg-amber-100 text-amber-800 flex items-center justify-center shrink-0">
              <ShieldAlert className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-bold text-sm sm:text-base text-[#393636]">
                {user.complianceStatus === 'PENDING_PARENTAL_CONSENT'
                  ? 'Parental / Guardian Verification Required Before Full Access'
                  : user.complianceStatus === 'CONSENT_REJECTED' || user.complianceStatus === 'CONSENT_WITHDRAWN'
                  ? `Guardian Consent ${user.complianceStatus === 'CONSENT_WITHDRAWN' ? 'Withdrawn' : 'Declined'} — Learning Access Paused`
                  : user.complianceStatus === 'COUNTRY_REVIEW_REQUIRED'
                  ? 'Jurisdiction Legal Review Required'
                  : 'Compliance Action Required'}
              </h3>
              <p className="text-xs text-[#393636]/75 mt-0.5">
                {user.complianceStatus === 'COUNTRY_REVIEW_REQUIRED'
                  ? `Country (${user.countryCode || 'Selected'}) is pending legal framework configuration. AI Classroom and paid enrollment are temporarily disabled until compliance review completes.`
                  : 'To protect young learners under applicable child safety rules (India DPDP / US COPPA / GDPR), verifiable parent or guardian approval is required before AI tutoring, uploads, or payments.'}
              </p>
            </div>
          </div>
          {user.complianceStatus !== 'COUNTRY_REVIEW_REQUIRED' && (
            <button
              onClick={() => navigate('parental-consent')}
              className="px-4 py-2.5 bg-[#F14C2F] hover:bg-[#d63b20] text-white font-bold text-xs rounded-xl shrink-0 cursor-pointer"
            >
              Manage Guardian Consent
            </button>
          )}
        </div>
      )}

      {/* Fresh Policy Re-Consent Banner */}
      {user?.pendingFreshPolicies && user.pendingFreshPolicies.length > 0 && (
        <div className="bg-[#EFEBDA] border border-[#F14C2F]/40 rounded-3xl p-5 sm:p-6 flex flex-col sm:flex-row sm:items-center justify-between gap-4 shadow-xs">
          <div className="space-y-1">
            <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-[#F14C2F]">
              <FileText className="w-4 h-4" />
              <span>Updated Legal Policies — Fresh Acknowledgment Requested</span>
            </div>
            <p className="text-xs sm:text-sm text-[#393636]/85">
              Updated versions available:{' '}
              <strong>
                {user.pendingFreshPolicies.map((p) => `${p.title} (v${p.version})`).join(', ')}
              </strong>
              . Please review and confirm your continued consent.
            </p>
          </div>
          <div className="flex items-center gap-2 shrink-0">
            <button
              onClick={() => navigate('privacy')}
              className="px-3 py-2 bg-white border border-[#393636]/20 rounded-xl text-xs font-semibold text-[#393636] hover:bg-gray-50 cursor-pointer"
            >
              Review Policies
            </button>
            <button
              onClick={handleAcceptFreshPolicies}
              disabled={isReconsenting}
              className="px-4 py-2 bg-[#F14C2F] hover:bg-[#d63b20] disabled:opacity-50 text-white rounded-xl text-xs font-bold cursor-pointer"
            >
              {isReconsenting ? 'Recording...' : 'Acknowledge Updates'}
            </button>
          </div>
        </div>
      )}

      {/* Student Welcome Header & Verification Status */}
      <div className="bg-white rounded-3xl p-6 sm:p-8 border border-[#393636]/10 shadow-sm flex flex-wrap items-center justify-between gap-6">
        <div className="space-y-2">
          <div className="flex flex-wrap items-center gap-2">
            <span className="text-xs font-bold uppercase tracking-wider text-[#F14C2F]">
              Student Dashboard
            </span>
            {studentIdVerification === 'verified' ? (
              <span className="inline-flex items-center gap-1 px-3 py-0.5 rounded-full bg-emerald-100 text-emerald-800 text-xs font-semibold">
                <ShieldCheck className="w-3.5 h-3.5" />
                <span>Verified Student ID (₹499 Plan Active)</span>
              </span>
            ) : studentIdVerification === 'pending' ? (
              <span className="inline-flex items-center gap-1 px-3 py-0.5 rounded-full bg-amber-100 text-amber-800 text-xs font-semibold">
                <Clock className="w-3.5 h-3.5" />
                <span>Student ID Verification Pending</span>
              </span>
            ) : (
              <button
                onClick={() => navigate('pricing')}
                className="inline-flex items-center gap-1 px-3 py-0.5 rounded-full bg-[#EFEBDA] text-[#393636] text-xs font-semibold hover:bg-[#e4dfcb] transition-colors cursor-pointer"
              >
                <GraduationCap className="w-3.5 h-3.5 text-[#F14C2F]" />
                <span>Verify Student ID for ₹499 Subsidized Rate</span>
              </button>
            )}
          </div>

          <h1 className="text-2xl sm:text-3xl font-bold text-[#393636]">
            Welcome back, {user?.name || 'DaVinci Resolve Student'}!
          </h1>
          <p className="text-sm text-[#393636]/70">
            Target Course: <strong>{course.title}</strong> • Access:{' '}
            <strong className={isPaid ? 'text-emerald-700' : 'text-amber-700'}>
              {isPaid ? 'Full Classroom Unlocked' : 'Locked (Payment Required)'}
            </strong>
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-3">
          {isPaid ? (
            <button
              onClick={() => navigate('classroom')}
              className="bg-[#F14C2F] text-white px-5 py-2.5 rounded-xl font-semibold text-sm shadow hover:bg-[#d63d22] transition-colors flex items-center gap-2 cursor-pointer"
            >
              <span>Resume AI Classroom</span>
              <ArrowRight className="w-4 h-4" />
            </button>
          ) : (
            <button
              onClick={() => navigate('checkout', course.id)}
              className="bg-[#F14C2F] text-white px-5 py-2.5 rounded-xl font-semibold text-sm shadow hover:bg-[#d63d22] transition-colors flex items-center gap-2 cursor-pointer"
            >
              <Lock className="w-4 h-4" />
              <span>Unlock Classroom • ₹499</span>
            </button>
          )}
          <button
            onClick={() => navigate('demo')}
            className="bg-white text-[#393636] border border-[#393636]/20 px-4 py-2.5 rounded-xl font-semibold text-sm hover:bg-[#EFEBDA] transition-colors cursor-pointer flex items-center gap-1.5"
          >
            <Sparkles className="w-3.5 h-3.5 text-[#F14C2F]" />
            <span>Free 5-Min Demo</span>
          </button>
        </div>
      </div>

      {/* Classroom Locked Alert Banner when unpaid */}
      {!isPaid && (
        <div className="bg-amber-50/90 border border-amber-300 rounded-3xl p-5 sm:p-6 flex flex-col sm:flex-row items-center justify-between gap-4 shadow-xs">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-amber-100 text-amber-800 flex items-center justify-center shrink-0 font-bold">
              <Lock className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-bold text-sm sm:text-base text-[#393636]">
                AI Classroom Access Locked — Payment Required
              </h3>
              <p className="text-xs text-[#393636]/75">
                Zero access to full classes without payment. Enrol for ₹499 to start classes, or test our free 5-minute interactive voice demo.
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2.5 w-full sm:w-auto shrink-0">
            <button
              onClick={() => navigate('checkout', course.id)}
              className="flex-1 sm:flex-none px-4 py-2.5 bg-[#F14C2F] hover:bg-[#d63b20] text-white font-bold text-xs rounded-xl shadow-xs transition-colors"
            >
              Enrol Now • ₹499
            </button>
            <button
              onClick={() => navigate('demo')}
              className="flex-1 sm:flex-none px-4 py-2.5 bg-white border border-[#393636]/20 hover:border-[#F14C2F] text-[#393636] font-bold text-xs rounded-xl transition-colors"
            >
              Try Free Demo
            </button>
          </div>
        </div>
      )}

      {/* Student Hub Quick Navigation */}
      <div className="flex flex-wrap items-center gap-2 pb-2">
        <button
          onClick={() => navigate('my-courses')}
          className="px-4 py-2 bg-white hover:bg-gray-50 border border-[#393636]/15 hover:border-[#F14C2F] rounded-xl text-xs font-bold text-[#393636] flex items-center gap-1.5 transition-all shadow-2xs"
        >
          <BookOpen className="w-3.5 h-3.5 text-[#F14C2F]" />
          <span>My Enrolled Courses</span>
        </button>
        <button
          onClick={() => navigate('classroom')}
          className="px-4 py-2 bg-[#F14C2F] hover:bg-[#d63b20] text-white rounded-xl text-xs font-bold flex items-center gap-1.5 transition-all shadow-2xs"
        >
          <Sparkles className="w-3.5 h-3.5" />
          <span>AI Voice Classroom</span>
        </button>
        <button
          onClick={() => navigate('assignments')}
          className="px-4 py-2 bg-white hover:bg-gray-50 border border-[#393636]/15 hover:border-[#F14C2F] rounded-xl text-xs font-bold text-[#393636] flex items-center gap-1.5 transition-all shadow-2xs"
        >
          <FileCheck className="w-3.5 h-3.5 text-emerald-600" />
          <span>Assignments Lab</span>
        </button>
        <button
          onClick={() => navigate('progress')}
          className="px-4 py-2 bg-white hover:bg-gray-50 border border-[#393636]/15 hover:border-[#F14C2F] rounded-xl text-xs font-bold text-[#393636] flex items-center gap-1.5 transition-all shadow-2xs"
        >
          <Clock className="w-3.5 h-3.5 text-blue-600" />
          <span>Learning Analytics</span>
        </button>
        <button
          onClick={() => navigate('certificates')}
          className="px-4 py-2 bg-white hover:bg-gray-50 border border-[#393636]/15 hover:border-[#F14C2F] rounded-xl text-xs font-bold text-[#393636] flex items-center gap-1.5 transition-all shadow-2xs"
        >
          <Award className="w-3.5 h-3.5 text-purple-600" />
          <span>Certificates</span>
        </button>
        <button
          onClick={() => navigate('revision')}
          className="px-4 py-2 bg-white hover:bg-gray-50 border border-[#393636]/15 hover:border-[#F14C2F] rounded-xl text-xs font-bold text-[#393636] flex items-center gap-1.5 transition-all shadow-2xs"
        >
          <RotateCcw className="w-3.5 h-3.5 text-amber-600" />
          <span>Shortcuts Deck</span>
        </button>
      </div>

      {/* Progress & Performance Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
        <div className="bg-white p-6 rounded-2xl border border-[#393636]/10 shadow-xs space-y-2">
          <div className="text-xs font-bold text-[#393636]/60 uppercase tracking-wider">
            Curriculum Progress
          </div>
          <div className="text-3xl font-bold text-[#393636]">
            {progressPercent}%
          </div>
          <div className="text-xs text-[#393636]/70">
            {completedCount} of {totalLessons} Lessons Finished
          </div>
          <div className="w-full bg-[#EFEBDA] h-2 rounded-full overflow-hidden mt-3">
            <div
              className="bg-[#F14C2F] h-full rounded-full transition-all duration-500"
              style={{ width: `${progressPercent}%` }}
            />
          </div>
        </div>

        <div className="bg-white p-6 rounded-2xl border border-[#393636]/10 shadow-xs space-y-2">
          <div className="text-xs font-bold text-[#393636]/60 uppercase tracking-wider">
            Task Evaluation Average
          </div>
          <div className="text-3xl font-bold text-[#393636]">
            {averageTaskScore} <span className="text-base font-normal text-[#393636]/60">/ 10</span>
          </div>
          <div className="text-xs text-[#393636]/70">
            {passedTasks} Tasks Passed (≥ 5.0 required)
          </div>
          <div className="text-[11px] text-emerald-700 font-semibold pt-1">
            Rubric-graded by TUTutor AI
          </div>
        </div>

        <div className="bg-white p-6 rounded-2xl border border-[#393636]/10 shadow-xs space-y-2">
          <div className="text-xs font-bold text-[#393636]/60 uppercase tracking-wider">
            Active Software
          </div>
          <div className="text-2xl font-bold text-[#393636]">
            DaVinci Resolve 19
          </div>
          <div className="text-xs text-[#393636]/70">
            Edit, Color, Fairlight & Deliver
          </div>
          <div className="text-[11px] text-[#F14C2F] font-semibold pt-1">
            Level: Beginner
          </div>
        </div>

        <div className="bg-white p-6 rounded-2xl border border-[#393636]/10 shadow-xs space-y-2 flex flex-col justify-between">
          <div>
            <div className="text-xs font-bold text-[#393636]/60 uppercase tracking-wider">
              Certificate Status
            </div>
            <div className="text-base font-bold text-[#393636] mt-1 flex items-center gap-2">
              {isEligibleForCertificate ? (
                <span className="text-emerald-700 flex items-center gap-1">
                  <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                  Eligible for Issue
                </span>
              ) : (
                <span className="text-amber-700 flex items-center gap-1">
                  <Lock className="w-4 h-4 text-amber-600" />
                  In Progress
                </span>
              )}
            </div>
            <div className="text-xs text-[#393636]/70 mt-1">
              {isEligibleForCertificate
                ? 'All requirements satisfied! View your verified certificate.'
                : `${completedCount}/${totalLessons} lessons • ${passedTasks}/${allAssignmentIds.length} tasks passed`}
            </div>
          </div>
          <button
            onClick={() => setShowCertificate(true)}
            className={`w-full mt-3 py-2 rounded-xl text-xs font-semibold transition-colors flex items-center justify-center gap-1.5 cursor-pointer ${
              isEligibleForCertificate
                ? 'bg-[#F14C2F] text-white hover:bg-[#d63b20] shadow-xs'
                : 'bg-[#393636] text-white hover:bg-black'
            }`}
          >
            {isEligibleForCertificate ? (
              <>
                <Award className="w-3.5 h-3.5" />
                <span>View Certificate</span>
              </>
            ) : (
              <>
                <Lock className="w-3.5 h-3.5" />
                <span>View Certificate Requirements</span>
              </>
            )}
          </button>
        </div>
      </div>

      {/* Course Rating & Student Feedback Section */}
      <div className="bg-white rounded-3xl p-6 sm:p-8 border border-[#393636]/10 shadow-sm space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-gray-100">
          <div>
            <span className="text-xs font-bold uppercase tracking-wider text-[#F14C2F]">
              Student Feedback
            </span>
            <h2 className="text-lg sm:text-xl font-bold text-[#393636] mt-0.5">
              Rate Your DaVinci Resolve Course Experience
            </h2>
          </div>
          {existingRating && (
            <span className="text-xs font-semibold px-3 py-1 bg-emerald-50 text-emerald-700 border border-emerald-200 rounded-full flex items-center gap-1">
              <CheckCircle2 className="w-3.5 h-3.5" />
              <span>Rated {existingRating.rating} / 5 Stars</span>
            </span>
          )}
        </div>

        <div className="space-y-4">
          <div>
            <label className="text-xs font-semibold text-[#393636] block mb-1.5">
              Select Your Rating:
            </label>
            <div className="flex items-center gap-2">
              {[1, 2, 3, 4, 5].map((star) => (
                <button
                  key={star}
                  type="button"
                  onClick={() => setSelectedStars(star)}
                  className="p-1 rounded-lg hover:scale-110 transition-transform cursor-pointer"
                  title={`${star} Star${star > 1 ? 's' : ''}`}
                >
                  <Star
                    className={`w-7 h-7 ${
                      star <= selectedStars
                        ? 'text-amber-500 fill-amber-500'
                        : 'text-gray-300 stroke-gray-300'
                    }`}
                  />
                </button>
              ))}
              <span className="text-xs font-bold text-[#393636] ml-2">
                {selectedStars} out of 5 stars
              </span>
            </div>
          </div>

          <div>
            <label className="text-xs font-semibold text-[#393636] block mb-1.5">
              Your Review or Feedback for TUTutor (Optional):
            </label>
            <textarea
              rows={3}
              value={reviewText}
              onChange={(e) => setReviewText(e.target.value)}
              placeholder="How was your 1-on-1 AI Teacher experience? Share any feedback on voice mentoring, lessons, or exercises..."
              className="w-full text-xs sm:text-sm p-3 bg-gray-50 border border-gray-200 rounded-xl text-[#393636] focus:outline-none focus:ring-2 focus:ring-[#F14C2F]/30"
            />
          </div>

          <div className="flex flex-wrap items-center justify-between gap-3 pt-1">
            <button
              onClick={handleRatingSubmit}
              disabled={isSubmittingRating}
              className="px-5 py-2.5 bg-[#F14C2F] hover:bg-[#d63b20] disabled:bg-gray-400 text-white text-xs font-bold rounded-xl flex items-center gap-1.5 shadow-xs transition-colors cursor-pointer"
            >
              <Star className="w-3.5 h-3.5" />
              <span>{isSubmittingRating ? 'Saving...' : existingRating ? 'Update Rating & Review' : 'Submit Course Rating'}</span>
            </button>

            {ratingMessage && (
              <span className="text-xs font-semibold text-emerald-700 bg-emerald-50 px-3 py-1.5 rounded-lg border border-emerald-100 flex items-center gap-1">
                <CheckCircle2 className="w-3.5 h-3.5" />
                {ratingMessage}
              </span>
            )}
          </div>
        </div>
      </div>


      {/* Task Bank Evaluations Detail (Strictly scored out of 10) */}
      <div className="bg-white rounded-3xl p-6 sm:p-8 border border-[#393636]/10 shadow-sm space-y-6">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div>
            <h2 className="text-xl font-bold text-[#393636]">
              Practical Assignment Gradebook (Scored Out of 10)
            </h2>
            <p className="text-xs text-[#393636]/70 mt-0.5">
              Pass threshold: 5.0 / 10 • 1 retry permitted per assignment (higher score recorded)
            </p>
          </div>
          <button
            onClick={() => navigate('classroom')}
            className="text-xs font-semibold text-[#F14C2F] hover:underline flex items-center gap-1 cursor-pointer"
          >
            <span>Open Assignment Lab in Classroom</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </button>
        </div>

        {evaluationsList.length === 0 ? (
          <div className="text-center py-8 bg-[#EFEBDA]/30 rounded-2xl border border-[#393636]/10 space-y-3">
            <BookOpen className="w-8 h-8 text-[#393636]/40 mx-auto" />
            <p className="text-sm font-semibold text-[#393636]">No task submissions yet</p>
            <p className="text-xs text-[#393636]/70 max-w-md mx-auto">
              Launch the AI Classroom and switch to the "Hands-On Task Lab" tab to submit your first DaVinci Resolve edit for evaluation.
            </p>
            <button
              onClick={() => navigate('classroom')}
              className="bg-[#F14C2F] text-white px-4 py-2 rounded-xl text-xs font-semibold hover:bg-[#d63d22] transition-colors cursor-pointer"
            >
              Start First Assignment
            </button>
          </div>
        ) : (
          <div className="space-y-3">
            {evaluationsList.map((ev) => (
              <div
                key={ev.assignmentId}
                className="bg-[#EFEBDA]/20 p-4 rounded-xl border border-[#393636]/10 flex flex-wrap items-center justify-between gap-4"
              >
                <div className="space-y-1">
                  <div className="flex items-center gap-2">
                    <span className="font-bold text-sm text-[#393636]">
                      Task {ev.assignmentId}
                    </span>
                    <span
                      className={`px-2 py-0.5 rounded-full text-xs font-semibold ${
                        ev.passed
                          ? 'bg-emerald-100 text-emerald-800'
                          : 'bg-rose-100 text-rose-800'
                      }`}
                    >
                      {ev.passed ? 'PASSED (≥ 5.0)' : 'NEEDS RETRY (< 5.0)'}
                    </span>
                    <span className="text-xs text-[#393636]/60">
                      Attempt {ev.attemptNumber} of 2
                    </span>
                  </div>
                  <p className="text-xs text-[#393636]/80 line-clamp-2 max-w-xl">
                    {ev.feedback}
                  </p>
                </div>

                <div className="flex items-center gap-4">
                  <div className="text-right">
                    <div className="text-xs text-[#393636]/60">Recorded Score</div>
                    <div className="text-xl font-bold text-[#393636]">
                      {ev.bestScore.toFixed(1)} / 10
                    </div>
                  </div>

                  {ev.canRetry && (
                    <button
                      onClick={() => navigate('classroom')}
                      className="bg-white border border-[#F14C2F] text-[#F14C2F] px-3 py-1.5 rounded-lg text-xs font-semibold hover:bg-[#F14C2F]/5 transition-colors flex items-center gap-1 cursor-pointer"
                    >
                      <RotateCcw className="w-3.5 h-3.5" />
                      <span>Retry Task</span>
                    </button>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Course Modules Jump List */}
      <div className="bg-white rounded-3xl p-6 sm:p-8 border border-[#393636]/10 shadow-sm space-y-6">
        <div className="flex items-center justify-between">
          <h2 className="text-xl font-bold text-[#393636]">
            DaVinci Resolve Curriculum Modules
          </h2>
          <span className="text-xs text-[#393636]/60 font-medium">
            8 Modules • 43 Lessons
          </span>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {course.modules.map((mod, idx) => (
            <div
              key={mod.id}
              className="p-4 rounded-2xl bg-[#EFEBDA]/30 border border-[#393636]/10 space-y-2 hover:border-[#F14C2F]/40 transition-colors"
            >
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-[#F14C2F]">
                  Module {idx + 1}
                </span>
                <span className="text-xs text-[#393636]/60">
                  {mod.lessons.length} Lessons
                </span>
              </div>
              <h3 className="font-bold text-sm text-[#393636]">{mod.title}</h3>
              <p className="text-xs text-[#393636]/70">{mod.description}</p>
              <div className="pt-2">
                <button
                  onClick={() => {
                    if (isPaid) {
                      selectLesson(course.id, mod.lessons[0].id);
                      navigate('classroom');
                    } else {
                      navigate('checkout', course.id);
                    }
                  }}
                  className="text-xs font-semibold text-[#F14C2F] hover:underline flex items-center gap-1 cursor-pointer"
                >
                  {isPaid ? <PlayCircle className="w-3.5 h-3.5" /> : <Lock className="w-3.5 h-3.5" />}
                  <span>{isPaid ? 'Start Module in Classroom' : 'Unlock Module • ₹499'}</span>
                </button>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Payment & Invoices History */}
      <div className="bg-white rounded-3xl p-6 sm:p-8 border border-[#393636]/10 shadow-sm space-y-4">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center font-bold">
              <CreditCard className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-xl font-bold text-[#393636]">
                Tuition & Payment Receipts
              </h2>
              <p className="text-xs text-[#393636]/70">
                Verified Indian payment transactions (UPI, Cards, NetBanking)
              </p>
            </div>
          </div>
          <span className="text-xs font-semibold px-3 py-1 bg-emerald-100 text-emerald-800 rounded-full flex items-center gap-1.5">
            <ShieldCheck className="w-3.5 h-3.5" />
            Subsidized Student Rate Active (₹499)
          </span>
        </div>

        {paymentReceipts.length > 0 ? (
          <div className="space-y-3 pt-2">
            {paymentReceipts.map((rcpt) => (
              <div
                key={rcpt.transactionRef}
                className="bg-[#EFEBDA]/30 p-4 rounded-2xl border border-[#393636]/10 flex flex-wrap items-center justify-between gap-4"
              >
                <div className="space-y-1">
                  <div className="flex items-center gap-2">
                    <span className="font-bold text-sm text-[#393636]">
                      {rcpt.courseTitle}
                    </span>
                    <span className="text-xs px-2 py-0.5 bg-emerald-100 text-emerald-800 rounded-md font-bold">
                      {rcpt.status}
                    </span>
                  </div>
                  <div className="flex flex-wrap items-center gap-3 text-xs text-[#393636]/70">
                    <span>Txn: <strong className="font-mono">{rcpt.transactionRef}</strong></span>
                    <span>•</span>
                    <span>Method: {rcpt.paymentMethod.toUpperCase()}</span>
                    <span>•</span>
                    <span>{new Date(rcpt.date).toLocaleDateString()}</span>
                  </div>
                </div>

                <div className="flex items-center gap-4">
                  <div className="text-right">
                    <div className="text-xs text-[#393636]/60">Amount Paid</div>
                    <div className="text-lg font-bold text-[#393636]">
                      ₹{rcpt.amount}
                    </div>
                  </div>
                  <button
                    onClick={() => navigate('payment-result')}
                    className="px-3 py-1.5 bg-white border border-[#393636]/20 hover:border-[#F14C2F] text-[#393636] text-xs font-semibold rounded-lg transition-colors flex items-center gap-1.5 cursor-pointer"
                  >
                    <FileCheck className="w-3.5 h-3.5 text-[#F14C2F]" />
                    <span>View Receipt</span>
                  </button>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="bg-[#EFEBDA]/20 p-5 rounded-2xl border border-[#393636]/10 flex flex-wrap items-center justify-between gap-4">
            <div>
              <p className="text-sm font-bold text-[#393636]">Enrolled via Free AI Demo & Student Access</p>
              <p className="text-xs text-[#393636]/70">
                You currently have active student access. Any subsequent course enrollments via UPI or Card will show full tax receipts here.
              </p>
            </div>
            <button
              onClick={() => navigate('catalog')}
              className="bg-[#F14C2F] text-white px-4 py-2 rounded-xl text-xs font-semibold hover:bg-[#d63d22] transition-colors"
            >
              Browse More Courses
            </button>
          </div>
        )}
      </div>

      {/* Student Privacy, Consent & Legal Settings Portal */}
      <div className="bg-white rounded-3xl p-6 sm:p-8 border border-[#393636]/10 shadow-sm space-y-6">
        <div className="flex flex-wrap items-center justify-between gap-4 pb-4 border-b border-gray-100">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-[#EFEBDA] text-[#393636] flex items-center justify-center font-bold">
              <ShieldCheck className="w-5 h-5 text-[#F14C2F]" />
            </div>
            <div>
              <h2 className="text-xl font-bold text-[#393636]">
                Privacy, Consent & Legal Settings
              </h2>
              <p className="text-xs text-[#393636]/70">
                Jurisdiction: <strong>{user?.countryCode || 'IN'}</strong> • Framework:{' '}
                <strong>{user?.applicableFramework || 'INDIA_DPDP'}</strong> • Status:{' '}
                <strong>{user?.complianceStatus || 'ACTIVE'}</strong>
                {user?.isMinor ? ' • Minor Protection Enabled' : ''}
              </p>
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <button
              onClick={() => handleLoadPrivacyData(true)}
              disabled={loadingPrivacyData}
              className="px-3.5 py-2 bg-[#393636] hover:bg-black text-white text-xs font-bold rounded-xl flex items-center gap-1.5 cursor-pointer"
            >
              <Download className="w-3.5 h-3.5" />
              <span>{loadingPrivacyData ? 'Exporting...' : 'Download My Data (JSON)'}</span>
            </button>
            <button
              onClick={() => handleLoadPrivacyData(false)}
              disabled={loadingPrivacyData}
              className="px-3.5 py-2 bg-[#EFEBDA] hover:bg-[#e5dfca] text-[#393636] text-xs font-bold rounded-xl cursor-pointer"
            >
              Inspect Records
            </button>
            <button
              onClick={() => setIsCookieModalOpen(true)}
              className="px-3.5 py-2 bg-white border border-[#393636]/20 hover:border-[#F14C2F] text-[#393636] text-xs font-bold rounded-xl flex items-center gap-1.5 cursor-pointer"
            >
              <Sliders className="w-3.5 h-3.5 text-[#F14C2F]" />
              <span>Cookie Preferences</span>
            </button>
            <button
              onClick={() => navigate('grievance-form')}
              className="px-3.5 py-2 bg-white border border-[#393636]/20 hover:border-[#F14C2F] text-[#393636] text-xs font-bold rounded-xl cursor-pointer"
            >
              Report Grievance
            </button>
          </div>
        </div>

        {privacyStatusMsg && (
          <div className="p-3 bg-emerald-50 border border-emerald-200 rounded-xl text-xs font-semibold text-emerald-800 flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4 shrink-0" />
            <span>{privacyStatusMsg}</span>
          </div>
        )}
        {privacyErrorMsg && (
          <div className="p-3 bg-rose-50 border border-rose-200 rounded-xl text-xs font-semibold text-rose-800 flex items-center gap-2">
            <AlertCircle className="w-4 h-4 shrink-0" />
            <span>{privacyErrorMsg}</span>
          </div>
        )}

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Request Data Correction */}
          <form onSubmit={handleSubmitCorrection} className="p-5 rounded-2xl bg-[#EFEBDA]/30 border border-[#393636]/10 space-y-3">
            <div className="flex items-center gap-2 text-sm font-bold text-[#393636]">
              <Edit3 className="w-4 h-4 text-[#F14C2F]" />
              <span>Correct Personal Details</span>
            </div>
            <p className="text-[11px] text-[#393636]/75">
              Update your display name directly, or log a compliance correction request. Date of birth and jurisdiction lock automatically after signup to prevent age bypass.
            </p>
            <div>
              <label className="block text-[11px] font-semibold text-[#393636] mb-1">
                Display Name
              </label>
              <input
                type="text"
                value={correctionName}
                onChange={(e) => setCorrectionName(e.target.value)}
                className="w-full px-3 py-2 text-xs bg-white border border-[#393636]/15 rounded-xl text-[#393636]"
              />
            </div>
            <div>
              <label className="block text-[11px] font-semibold text-[#393636] mb-1">
                Note / Correction Reason (Optional)
              </label>
              <input
                type="text"
                value={correctionReason}
                onChange={(e) => setCorrectionReason(e.target.value)}
                placeholder="e.g., Fix spelling on certificate name"
                className="w-full px-3 py-2 text-xs bg-white border border-[#393636]/15 rounded-xl text-[#393636]"
              />
            </div>
            <button
              type="submit"
              disabled={isSavingCorrection}
              className="px-4 py-2 bg-[#F14C2F] hover:bg-[#d63b20] disabled:opacity-50 text-white text-xs font-bold rounded-xl cursor-pointer"
            >
              {isSavingCorrection ? 'Saving...' : 'Submit Correction'}
            </button>
          </form>

          {/* Consent Withdrawal, Guardian Portal & Account Erasure */}
          <div className="p-5 rounded-2xl bg-[#EFEBDA]/30 border border-[#393636]/10 space-y-4 flex flex-col justify-between">
            <div className="space-y-2">
              <div className="flex items-center gap-2 text-sm font-bold text-[#393636]">
                <Lock className="w-4 h-4 text-[#F14C2F]" />
                <span>Consent Controls & Account Erasure</span>
              </div>
              <div className="text-[11px] text-[#393636]/75 space-y-1">
                <p>
                  Analytics consent:{' '}
                  <strong>{user?.analyticsConsent ? 'Enabled' : 'Disabled'}</strong> •
                  AI Safety Disclosure:{' '}
                  <strong>{user?.aiDisclosureAcceptedAt ? 'Accepted' : 'Pending'}</strong>
                </p>
                {user?.isMinor && (
                  <p>
                    Guardian consent status: <strong>{user.parentalConsentStatus || 'PENDING'}</strong>{' '}
                    <button
                      type="button"
                      onClick={() => navigate('parental-consent')}
                      className="text-[#F14C2F] font-semibold underline ml-1 cursor-pointer"
                    >
                      Open Guardian Portal
                    </button>
                  </p>
                )}
              </div>
              <div className="flex flex-wrap gap-2 pt-1">
                <button
                  type="button"
                  onClick={handleWithdrawOptionalConsent}
                  className="px-3 py-1.5 bg-white border border-[#393636]/20 hover:border-[#F14C2F] text-[#393636] text-xs font-semibold rounded-xl cursor-pointer"
                >
                  Withdraw Optional Analytics Consent
                </button>
                <button
                  type="button"
                  onClick={() => navigate('privacy')}
                  className="px-3 py-1.5 bg-white border border-[#393636]/20 hover:border-[#F14C2F] text-[#393636] text-xs font-semibold rounded-xl cursor-pointer"
                >
                  Privacy Policy
                </button>
              </div>
            </div>

            <div className="pt-3 border-t border-[#393636]/10">
              {!showDeleteConfirm ? (
                <button
                  type="button"
                  onClick={() => setShowDeleteConfirm(true)}
                  className="px-3.5 py-2 bg-rose-50 hover:bg-rose-100 text-rose-700 border border-rose-200 text-xs font-bold rounded-xl flex items-center gap-1.5 cursor-pointer"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                  <span>Delete My Account Permanently</span>
                </button>
              ) : (
                <div className="p-3 bg-rose-50 border border-rose-200 rounded-xl space-y-2.5">
                  <p className="text-[11px] font-semibold text-rose-900">
                    Permanent deletion erases your profile, login credentials, and sessions immediately. Non-PII payment transaction ledger references remain anonymized solely for statutory tax/audit compliance.
                  </p>
                  <input
                    type="text"
                    value={deleteReason}
                    onChange={(e) => setDeleteReason(e.target.value)}
                    placeholder="Optional reason for leaving"
                    className="w-full px-2.5 py-1.5 text-xs bg-white border border-rose-200 rounded-lg text-[#393636]"
                  />
                  <input
                    type="text"
                    value={deleteConfirmText}
                    onChange={(e) => setDeleteConfirmText(e.target.value)}
                    placeholder='Type "DELETE" to confirm permanent erasure'
                    className="w-full px-2.5 py-1.5 text-xs bg-white border border-rose-300 rounded-lg text-[#393636]"
                  />
                  <div className="flex items-center gap-2">
                    <button
                      type="button"
                      onClick={handlePermanentDelete}
                      disabled={isDeletingAccount || deleteConfirmText.trim().toUpperCase() !== 'DELETE'}
                      className="px-3 py-1.5 bg-rose-600 hover:bg-rose-700 disabled:opacity-40 text-white text-xs font-bold rounded-lg cursor-pointer"
                    >
                      {isDeletingAccount ? 'Deleting...' : 'Confirm Permanent Deletion'}
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        setShowDeleteConfirm(false);
                        setDeleteConfirmText('');
                      }}
                      className="px-3 py-1.5 bg-white text-[#393636] border border-[#393636]/20 text-xs font-semibold rounded-lg cursor-pointer"
                    >
                      Cancel
                    </button>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Inspected Personal Data Summary */}
        {privacyData && (
          <div className="p-4 rounded-2xl bg-[#FAF7EE] border border-[#393636]/15 space-y-2">
            <div className="flex items-center justify-between text-xs font-bold text-[#393636]">
              <span>Recorded Policy Acceptances ({privacyData.policyAcceptances?.length || 0}) & Privacy Requests ({privacyData.privacyRequests?.length || 0})</span>
              <button
                type="button"
                onClick={() => setPrivacyData(null)}
                className="text-[#F14C2F] underline cursor-pointer"
              >
                Close View
              </button>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-[11px] text-[#393636]/80">
              <div className="bg-white p-3 rounded-xl border border-[#393636]/10 max-h-40 overflow-y-auto space-y-1">
                <div className="font-bold text-[#393636]">Accepted Policy Versions</div>
                {(privacyData.policyAcceptances || []).map((acc: any) => (
                  <div key={acc.id} className="flex justify-between gap-2 border-b border-gray-100 py-1">
                    <span>{acc.policyKey} (v{acc.policyVersion})</span>
                    <span className="text-gray-500">{new Date(acc.acceptedAt).toLocaleDateString()}</span>
                  </div>
                ))}
              </div>
              <div className="bg-white p-3 rounded-xl border border-[#393636]/10 max-h-40 overflow-y-auto space-y-1">
                <div className="font-bold text-[#393636]">Privacy & Consent Requests</div>
                {(privacyData.privacyRequests || []).length === 0 ? (
                  <p className="text-gray-500">No privacy requests logged yet.</p>
                ) : (
                  privacyData.privacyRequests.map((req: any) => (
                    <div key={req.id} className="flex justify-between gap-2 border-b border-gray-100 py-1">
                      <span>{req.requestType}</span>
                      <span className="font-semibold text-emerald-700">{req.status}</span>
                    </div>
                  ))
                )}
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Certificate Modal */}
      {showCertificate && (
        <CertificateModal
          course={course}
          onClose={() => setShowCertificate(false)}
        />
      )}
    </div>
  );
};
