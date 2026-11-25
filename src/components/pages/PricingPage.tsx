import React, { useState } from 'react';
import { useApp, REGULAR_PRICE_INR, STUDENT_PRICE_INR } from '../../context/AppContext';
import { TUTeachLogo } from '../common/Logo';
import {
  Check,
  Sparkles,
  ShieldCheck,
  Zap,
  ArrowRight,
  HelpCircle,
  Award,
  BookOpen,
  Upload,
  AlertCircle,
  CheckCircle2,
  Clock,
  IdCard,
  X
} from 'lucide-react';

export const PricingPage: React.FC = () => {
  const { user, courses, enrollInCourse, navigate, submitStudentId, setVerificationStatus } = useApp();

  const [selectedPlan, setSelectedPlan] = useState<'student' | 'regular'>(
    user?.studentIdVerification === 'verified' ? 'student' : 'regular'
  );
  
  // Student ID verification modal / form state
  const [showIdModal, setShowIdModal] = useState(false);
  const [institutionName, setInstitutionName] = useState(user?.studentIdInstitution || '');
  const [idFileName, setIdFileName] = useState(user?.studentIdFileName || '');
  const [isVerifyingFile, setIsVerifyingFile] = useState(false);
  const [showCheckoutModal, setShowCheckoutModal] = useState(false);
  const [checkoutComplete, setCheckoutComplete] = useState(false);

  const isVerified = user?.studentIdVerification === 'verified';
  const isPending = user?.studentIdVerification === 'pending';

  const handleIdUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setIdFileName(file.name);
    }
  };

  const handleSubmitVerification = (e: React.FormEvent) => {
    e.preventDefault();
    if (!institutionName.trim() || !idFileName) return;

    setIsVerifyingFile(true);
    submitStudentId(institutionName.trim(), idFileName);

    setTimeout(() => {
      setIsVerifyingFile(false);
      setShowIdModal(false);
    }, 600);
  };

  const handleSimulateInstantVerification = (status: 'verified' | 'rejected' | 'none') => {
    setVerificationStatus(status);
    if (status === 'verified') {
      setSelectedPlan('student');
    } else {
      setSelectedPlan('regular');
    }
  };

  const handleInitiateCheckout = (plan: 'student' | 'regular') => {
    if (plan === 'student' && !isVerified) {
      setShowIdModal(true);
      return;
    }
    setSelectedPlan(plan);
    setShowCheckoutModal(true);
  };

  const handleConfirmCheckout = () => {
    // Enroll in the DaVinci Resolve course
    courses.forEach(c => enrollInCourse(c.id));
    setCheckoutComplete(true);

    setTimeout(() => {
      setShowCheckoutModal(false);
      navigate('classroom');
    }, 1200);
  };

  const activeAmount = selectedPlan === 'student' && isVerified ? STUDENT_PRICE_INR : REGULAR_PRICE_INR;

  return (
    <div className="min-h-screen bg-[#EFEBDA] py-16 px-4 sm:px-6 lg:px-8">
      <div className="max-w-7xl mx-auto space-y-16">
        {/* Header */}
        <div className="text-center space-y-4 max-w-3xl mx-auto">
          <div className="inline-flex items-center gap-2 px-3 py-1 bg-white rounded-full border border-[#393636]/15 text-xs font-bold text-[#393636] shadow-2xs">
            <span className="w-2 h-2 rounded-full bg-[#F14C2F]" />
            <span>TUTeach India Education Access</span>
          </div>

          <h1 className="text-4xl sm:text-6xl font-black text-[#393636] tracking-tight">
            Simple, Transparent Indian Pricing
          </h1>
          <p className="text-base text-gray-600">
            Learn DaVinci Resolve video editing with your dedicated AI teacher. Validated student discounts verified in Indian Rupees (INR).
          </p>
        </div>

        {/* Student ID Status Banner */}
        <div className="bg-white rounded-3xl p-6 border border-[#393636]/15 shadow-sm max-w-3xl mx-auto">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div className="flex items-start sm:items-center gap-3">
              <div className="w-10 h-10 rounded-2xl bg-[#EFEBDA] text-[#F14C2F] flex items-center justify-center flex-shrink-0">
                <IdCard className="w-5 h-5" />
              </div>
              <div>
                <h3 className="font-bold text-sm text-[#393636]">
                  Student ID Status:{' '}
                  <span className={`capitalize ${
                    isVerified ? 'text-emerald-600 font-extrabold' : isPending ? 'text-amber-600 font-extrabold' : 'text-gray-500'
                  }`}>
                    {user?.studentIdVerification || 'Unverified'}
                  </span>
                </h3>
                <p className="text-xs text-gray-500 mt-0.5">
                  {isVerified
                    ? `Verified Student (${user?.studentIdInstitution || 'College'}). ₹499 Student Plan unlocked!`
                    : isPending
                    ? `Verification Pending Review for ${user?.studentIdInstitution}. Unverified students can enroll in the Regular Plan (₹1,899).`
                    : 'Verify your valid student ID card to unlock the ₹499 Student Plan.'}
                </p>
              </div>
            </div>

            <div className="flex items-center gap-2 flex-shrink-0">
              {!isVerified ? (
                <button
                  onClick={() => setShowIdModal(true)}
                  className="px-4 py-2 bg-[#F14C2F] hover:bg-[#d63b20] text-white font-bold text-xs rounded-xl shadow-2xs transition-colors cursor-pointer"
                >
                  Verify Student ID
                </button>
              ) : (
                <span className="text-xs font-bold text-emerald-700 bg-emerald-100 px-3 py-1.5 rounded-xl flex items-center gap-1">
                  <CheckCircle2 className="w-4 h-4 text-emerald-600" /> ₹499 Active
                </span>
              )}
            </div>
          </div>

          {/* Quick Demo Verification Toggle (for testing both paths as requested in Section 10) */}
          <div className="mt-4 pt-3 border-t border-gray-100 flex flex-wrap items-center justify-between gap-2 text-xs text-gray-500">
            <span>Demo Testing Controls:</span>
            <div className="flex items-center gap-2">
              <button
                onClick={() => handleSimulateInstantVerification('verified')}
                className="px-2.5 py-1 bg-emerald-50 hover:bg-emerald-100 text-emerald-800 rounded font-bold border border-emerald-200"
              >
                Simulate ID Verified (₹499)
              </button>
              <button
                onClick={() => handleSimulateInstantVerification('none')}
                className="px-2.5 py-1 bg-gray-100 hover:bg-gray-200 text-gray-700 rounded font-semibold"
              >
                Reset to Unverified (₹1,899)
              </button>
            </div>
          </div>
        </div>

        {/* The Two Plans */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8 max-w-4xl mx-auto items-stretch">
          {/* Plan 1: Student Plan (₹499) */}
          <div className={`bg-white rounded-3xl p-8 border-4 transition-all flex flex-col justify-between space-y-6 ${
            isVerified ? 'border-[#F14C2F] shadow-xl' : 'border-gray-200 shadow-sm opacity-95'
          }`}>
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold uppercase tracking-wider text-[#F14C2F] bg-[#F14C2F]/10 px-2.5 py-1 rounded-full">
                  Verified Students Only
                </span>
                {isVerified ? (
                  <span className="text-xs font-bold text-emerald-700 bg-emerald-100 px-2.5 py-0.5 rounded-full flex items-center gap-1">
                    <Check className="w-3.5 h-3.5 text-emerald-600" /> ID Verified
                  </span>
                ) : (
                  <span className="text-xs font-semibold text-gray-500 bg-gray-100 px-2.5 py-0.5 rounded-full">
                    Requires Student ID
                  </span>
                )}
              </div>

              <div>
                <h3 className="text-2xl font-bold text-[#393636]">Student Plan</h3>
                <p className="text-xs text-gray-600 mt-1">
                  Full course access subsidized for verified school, college, and university students in India.
                </p>
              </div>

              <div className="pt-2">
                <span className="text-4xl font-black text-[#393636]">₹499</span>
                <span className="text-xs text-gray-400 ml-1.5 font-medium">INR one-time payment</span>
              </div>

              <ul className="space-y-3 text-xs text-gray-700 pt-4 border-t border-gray-100">
                <li className="flex items-center gap-2.5">
                  <Check className="w-4 h-4 text-[#F14C2F] flex-shrink-0" />
                  <span>All 8 Modules & 43 DaVinci Resolve Lessons</span>
                </li>
                <li className="flex items-center gap-2.5">
                  <Check className="w-4 h-4 text-[#F14C2F] flex-shrink-0" />
                  <span>Personal AI Teacher (English & Hindi/Hinglish)</span>
                </li>
                <li className="flex items-center gap-2.5">
                  <Check className="w-4 h-4 text-[#F14C2F] flex-shrink-0" />
                  <span>Task evaluations scored out of 10 with 1 retry</span>
                </li>
                <li className="flex items-center gap-2.5">
                  <Check className="w-4 h-4 text-[#F14C2F] flex-shrink-0" />
                  <span>Targeted revision flashcards deck</span>
                </li>
                <li className="flex items-center gap-2.5">
                  <Check className="w-4 h-4 text-[#F14C2F] flex-shrink-0" />
                  <span>Verified TUTeach Certificate of Completion</span>
                </li>
              </ul>
            </div>

            <div>
              {isVerified ? (
                <button
                  onClick={() => handleInitiateCheckout('student')}
                  className="w-full py-3.5 bg-[#F14C2F] hover:bg-[#d63b20] text-white font-extrabold text-xs rounded-xl shadow-md transition-all cursor-pointer flex items-center justify-center gap-2"
                >
                  Enroll at Verified ₹499 Price <ArrowRight className="w-4 h-4" />
                </button>
              ) : (
                <button
                  onClick={() => setShowIdModal(true)}
                  className="w-full py-3.5 bg-[#393636] hover:bg-black text-white font-bold text-xs rounded-xl transition-colors cursor-pointer flex items-center justify-center gap-2"
                >
                  <IdCard className="w-4 h-4 text-[#F14C2F]" />
                  Verify Student ID to Unlock ₹499
                </button>
              )}
            </div>
          </div>

          {/* Plan 2: Regular Plan (₹1,899) */}
          <div className="bg-[#393636] text-white rounded-3xl p-8 border-2 border-black/20 shadow-xl flex flex-col justify-between space-y-6">
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold uppercase tracking-wider text-amber-400 bg-amber-400/20 px-2.5 py-1 rounded-full border border-amber-400/30">
                  Standard Access
                </span>
                <span className="text-xs font-semibold text-gray-300">
                  No Student ID Required
                </span>
              </div>

              <div>
                <h3 className="text-2xl font-bold text-white">Regular Plan</h3>
                <p className="text-xs text-[#EFEBDA]/80 mt-1">
                  Full course access for working professionals, creators, and learners without a verified student ID.
                </p>
              </div>

              <div className="pt-2">
                <span className="text-4xl font-black text-white">₹1,899</span>
                <span className="text-xs text-gray-400 ml-1.5 font-medium">INR one-time payment</span>
              </div>

              <ul className="space-y-3 text-xs text-[#EFEBDA]/90 pt-4 border-t border-white/10">
                <li className="flex items-center gap-2.5">
                  <Check className="w-4 h-4 text-[#F14C2F] flex-shrink-0" />
                  <span>All 8 Modules & 43 DaVinci Resolve Lessons</span>
                </li>
                <li className="flex items-center gap-2.5">
                  <Check className="w-4 h-4 text-[#F14C2F] flex-shrink-0" />
                  <span>Personal AI Teacher (English & Hindi/Hinglish)</span>
                </li>
                <li className="flex items-center gap-2.5">
                  <Check className="w-4 h-4 text-[#F14C2F] flex-shrink-0" />
                  <span>Task evaluations scored out of 10 with 1 retry</span>
                </li>
                <li className="flex items-center gap-2.5">
                  <Check className="w-4 h-4 text-[#F14C2F] flex-shrink-0" />
                  <span>Targeted revision flashcards deck</span>
                </li>
                <li className="flex items-center gap-2.5">
                  <Check className="w-4 h-4 text-[#F14C2F] flex-shrink-0" />
                  <span>Verified TUTeach Certificate of Completion</span>
                </li>
              </ul>
            </div>

            <button
              onClick={() => handleInitiateCheckout('regular')}
              className="w-full py-3.5 bg-white hover:bg-gray-100 text-[#393636] font-extrabold text-xs rounded-xl shadow-md transition-all cursor-pointer flex items-center justify-center gap-2"
            >
              Enroll at ₹1,899 (Regular Plan) <ArrowRight className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Payment Gateway Architecture Note (As required by section 10) */}
        <div className="bg-white rounded-3xl p-6 sm:p-8 border border-[#393636]/10 shadow-sm max-w-4xl mx-auto space-y-3 text-xs text-gray-600">
          <div className="flex items-center gap-2 text-sm font-bold text-[#393636]">
            <ShieldCheck className="w-5 h-5 text-emerald-600" />
            <span>Secure Indian Rupee (INR) Payment Architecture</span>
          </div>
          <p>
            TUTeach supports Indian Rupees (INR) across UPI (Google Pay, PhonePe, Paytm), NetBanking, and RuPay/Visa/Mastercard credit/debit cards.
          </p>
          <div className="p-3 bg-amber-50 rounded-xl border border-amber-200 text-amber-900 text-[11px] leading-relaxed">
            <strong>Payment Integration Notice:</strong> Live bank processing in India requires connecting merchant credentials via Razorpay, Cashfree, or Stripe India. The checkout flow below operates in transparent Demo Mode to verify plan calculations and instant course enrollment.
          </div>
        </div>
      </div>

      {/* STUDENT ID VERIFICATION MODAL */}
      {showIdModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-xs p-4">
          <div className="bg-white rounded-3xl max-w-md w-full p-6 sm:p-8 shadow-2xl border border-[#393636]/15 text-[#393636] space-y-5 animate-fadeIn">
            <div className="flex items-center justify-between pb-3 border-b border-gray-100">
              <div className="flex items-center gap-2.5">
                <TUTeachLogo size="sm" variant="iconOnly" clickable={false} />
                <div>
                  <h3 className="font-bold text-base text-[#393636]">Student ID Verification</h3>
                  <p className="text-[10px] text-gray-500">TUTeach Subsidized Student Rate</p>
                </div>
              </div>
              <button
                onClick={() => setShowIdModal(false)}
                className="p-1 rounded-lg text-gray-400 hover:text-gray-700"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <p className="text-xs text-gray-600 leading-relaxed">
              Upload your valid school, college, or university ID card to unlock the <strong>₹499 Student Plan</strong> (subsidized from the ₹1,899 regular price).
            </p>

            <form onSubmit={handleSubmitVerification} className="space-y-4 text-xs">
              <div>
                <label className="block font-bold text-[#393636] mb-1">
                  School / College / University Name:
                </label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Delhi University / IIT Bombay / St. Xavier's"
                  value={institutionName}
                  onChange={(e) => setInstitutionName(e.target.value)}
                  className="w-full px-3.5 py-2.5 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#F14C2F]"
                />
              </div>

              <div>
                <label className="block font-bold text-[#393636] mb-1">
                  Upload Student ID Card Photo / PDF:
                </label>
                <label className="flex flex-col items-center justify-center p-5 border-2 border-dashed border-[#F14C2F]/40 hover:border-[#F14C2F] rounded-xl cursor-pointer bg-[#EFEBDA]/30 hover:bg-[#EFEBDA]/60 transition-colors">
                  <Upload className="w-6 h-6 text-[#F14C2F] mb-1.5" />
                  <span className="font-semibold text-[#393636]">
                    {idFileName ? idFileName : 'Click to select ID file'}
                  </span>
                  <span className="text-[10px] text-gray-500 mt-0.5">JPG, PNG or PDF (Max 5MB)</span>
                  <input
                    type="file"
                    accept="image/*,.pdf"
                    onChange={handleIdUpload}
                    className="hidden"
                  />
                </label>
              </div>

              <div className="pt-2 flex flex-col gap-2">
                <button
                  type="submit"
                  disabled={!institutionName.trim() || !idFileName || isVerifyingFile}
                  className="w-full py-3 bg-[#F14C2F] hover:bg-[#d63b20] disabled:bg-gray-300 text-white font-bold rounded-xl shadow-sm transition-colors flex items-center justify-center gap-2 cursor-pointer"
                >
                  {isVerifyingFile ? 'Submitting ID...' : 'Submit ID for Verification'}
                </button>

                <button
                  type="button"
                  onClick={() => {
                    handleSimulateInstantVerification('verified');
                    setShowIdModal(false);
                  }}
                  className="w-full py-2 bg-emerald-50 hover:bg-emerald-100 text-emerald-800 font-bold rounded-xl border border-emerald-200 transition-colors"
                >
                  Instant Demo Approve (₹499)
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* CHECKOUT MODAL IN INR */}
      {showCheckoutModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-xs p-4">
          <div className="bg-white rounded-3xl max-w-md w-full p-6 sm:p-8 shadow-2xl border border-[#393636]/15 text-[#393636] space-y-5 animate-fadeIn">
            <div className="flex items-center justify-between pb-3 border-b border-gray-100">
              <div className="flex items-center gap-3">
                <TUTeachLogo size="sm" variant="iconOnly" clickable={false} />
                <div>
                  <span className="text-[10px] font-bold uppercase tracking-wider text-[#F14C2F]">
                    Order Checkout
                  </span>
                  <h3 className="font-bold text-base text-[#393636]">
                    {selectedPlan === 'student' ? 'Student Plan Enrollment' : 'Regular Plan Enrollment'}
                  </h3>
                </div>
              </div>
              <button
                onClick={() => setShowCheckoutModal(false)}
                className="p-1 rounded-lg text-gray-400 hover:text-gray-700"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Order Summary */}
            <div className="p-4 bg-[#EFEBDA]/50 rounded-2xl border border-[#393636]/10 space-y-2 text-xs">
              <div className="flex justify-between font-semibold">
                <span>Course:</span>
                <span className="font-bold text-[#393636]">Video Editing with DaVinci Resolve</span>
              </div>
              <div className="flex justify-between font-semibold">
                <span>Selected Plan:</span>
                <span className="capitalize">{selectedPlan === 'student' ? 'Verified Student Plan' : 'Regular Plan'}</span>
              </div>
              <div className="flex justify-between font-semibold">
                <span>Currency:</span>
                <span>Indian Rupees (INR)</span>
              </div>
              <div className="pt-2 border-t border-[#393636]/15 flex justify-between text-sm font-extrabold text-[#393636]">
                <span>Total Amount Due:</span>
                <span className="text-[#F14C2F] text-lg">₹{activeAmount}</span>
              </div>
            </div>

            {/* Payment Options Preview */}
            <div className="space-y-2 text-xs">
              <span className="font-bold text-gray-500 uppercase tracking-wider text-[10px]">
                Supported Payment Methods:
              </span>
              <div className="grid grid-cols-3 gap-2 text-center font-bold text-[11px]">
                <div className="p-2 bg-gray-50 rounded-lg border border-gray-200 text-[#393636]">
                  UPI / GPay
                </div>
                <div className="p-2 bg-gray-50 rounded-lg border border-gray-200 text-[#393636]">
                  NetBanking
                </div>
                <div className="p-2 bg-gray-50 rounded-lg border border-gray-200 text-[#393636]">
                  Debit / Credit
                </div>
              </div>
            </div>

            <button
              onClick={handleConfirmCheckout}
              disabled={checkoutComplete}
              className="w-full py-3.5 bg-[#F14C2F] hover:bg-[#d63b20] text-white font-extrabold text-sm rounded-xl shadow-md transition-colors flex items-center justify-center gap-2 cursor-pointer"
            >
              {checkoutComplete ? (
                <>
                  <CheckCircle2 className="w-4 h-4 text-emerald-300" />
                  Enrollment Confirmed! Opening Classroom...
                </>
              ) : (
                <>
                  Pay ₹{activeAmount} & Enter Classroom <ArrowRight className="w-4 h-4" />
                </>
              )}
            </button>
          </div>
        </div>
      )}
    </div>
  );
};
