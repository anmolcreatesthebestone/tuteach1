import React, { useState } from 'react';
import { useApp } from '../../context/AppContext';
import { COURSES_DATA } from '../../data/coursesData';
import {
  CheckCircle2,
  XCircle,
  Clock,
  RotateCcw,
  Layers,
  Sparkles,
  BookOpen,
  ArrowRight
} from 'lucide-react';

export const PaymentResultPage: React.FC = () => {
  const {
    lastPaymentReceipt,
    courses,
    selectedCourseId,
    navigate,
    recordPaymentReceipt
  } = useApp();

  const [isCheckingAgain, setIsCheckingAgain] = useState(false);
  const [statusMessage, setStatusMessage] = useState<string | null>(null);

  // If there's no payment receipt at all, default to null so we don't fake success
  const [currentStatus, setCurrentStatus] = useState<'SUCCESS' | 'FAILED' | 'PENDING' | 'EMPTY'>(
    lastPaymentReceipt ? lastPaymentReceipt.status : 'EMPTY'
  );

  const course =
    courses.find((c) => c.id === (lastPaymentReceipt?.courseId || selectedCourseId)) ||
    courses[0] ||
    COURSES_DATA[0];

  const transactionRef = lastPaymentReceipt?.transactionRef || lastPaymentReceipt?.paymentId || '';
  const formattedDate = lastPaymentReceipt?.date
    ? new Date(lastPaymentReceipt.date).toLocaleDateString('en-IN', {
        day: 'numeric',
        month: 'short',
        year: 'numeric'
      })
    : new Date().toLocaleDateString('en-IN', {
        day: 'numeric',
        month: 'short',
        year: 'numeric'
      });

  const handleCheckPendingStatusAgain = async () => {
    if (!lastPaymentReceipt) return;
    setIsCheckingAgain(true);
    setStatusMessage(null);

    try {
      // Query genuine payment status on backend by payment ID or order ID
      const queryId = lastPaymentReceipt.paymentId || lastPaymentReceipt.transactionRef || lastPaymentReceipt.orderId;
      if (!queryId) {
        setStatusMessage('No transaction reference available to verify.');
        return;
      }

      const token = typeof window !== 'undefined' ? localStorage.getItem('tuteach_auth_token') : null;
      const res = await fetch(`/api/payments/status/${encodeURIComponent(queryId)}`, {
        headers: token ? { Authorization: `Bearer ${token}` } : {}
      });
      const contentType = res.headers.get('content-type') || '';
      let data: any = null;
      if (contentType.includes('application/json')) {
        try {
          data = await res.json();
        } catch {
          data = null;
        }
      }

      if (res.ok && data?.status) {
        setCurrentStatus(data.status);
        if (data.status === 'SUCCESS' && data.receipt) {
          recordPaymentReceipt(data.receipt);
          setStatusMessage('Payment verified! Your course is now unlocked.');
        } else if (data.status === 'FAILED') {
          setStatusMessage(data.message || 'Payment was marked as failed by the gateway.');
        } else {
          setStatusMessage('Payment is still pending bank settlement confirmation. Please try again in 30 seconds.');
        }
      } else {
        setStatusMessage(data.message || 'Unable to confirm payment status at this moment.');
      }
    } catch (e: any) {
      console.warn('Status check error:', e);
      setStatusMessage('Network connection error while checking gateway status.');
    } finally {
      setIsCheckingAgain(false);
    }
  };

  // Case 0: No payment attempted yet (prevent fake success on direct navigation)
  if (currentStatus === 'EMPTY' || !lastPaymentReceipt) {
    return (
      <div className="min-h-screen bg-[#FAF7EE] py-12 px-4 sm:px-6 lg:px-8 flex items-center justify-center select-none">
        <div className="w-full max-w-lg bg-white rounded-3xl p-8 sm:p-10 shadow-lg border border-[#393636]/10 text-center space-y-6">
          <div className="w-20 h-20 rounded-full bg-gray-100 text-gray-500 mx-auto flex items-center justify-center shadow-inner">
            <BookOpen className="w-10 h-10" />
          </div>
          <div className="space-y-2">
            <h1 className="text-2xl font-extrabold text-[#393636] tracking-tight">
              No Active Payment Found
            </h1>
            <p className="text-xs sm:text-sm text-[#393636]/70 max-w-sm mx-auto">
              You haven't initiated a checkout transaction yet. Explore our courses or start the free 5-minute AI Teacher demo.
            </p>
          </div>
          <div className="space-y-3 pt-2">
            <button
              onClick={() => navigate('catalog')}
              className="w-full py-4 px-6 rounded-xl bg-[#F14C2F] hover:bg-[#d83c21] text-white font-extrabold text-sm shadow-md transition-all flex items-center justify-center gap-2 cursor-pointer"
            >
              <span>Explore Course Catalogue</span>
              <ArrowRight className="w-4 h-4" />
            </button>
            <button
              onClick={() => navigate('demo')}
              className="w-full py-3 px-6 rounded-xl bg-white hover:bg-gray-50 border border-[#393636]/20 text-[#393636] font-bold text-xs transition-all cursor-pointer"
            >
              Try Free 5-Minute AI Teacher Demo
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#FAF7EE] py-12 px-4 sm:px-6 lg:px-8 flex items-center justify-center select-none">
      <div className="w-full max-w-lg bg-white rounded-3xl p-8 sm:p-10 shadow-lg border border-[#393636]/10 text-center space-y-6 animate-in zoom-in-95 duration-200">
        {/* =========================================================================
            SCREEN 1: SUCCESS (Only when cryptographically verified by backend)
           ========================================================================= */}
        {currentStatus === 'SUCCESS' && (
          <>
            <div className="w-20 h-20 rounded-full bg-emerald-100 text-emerald-600 mx-auto flex items-center justify-center shadow-inner">
              <CheckCircle2 className="w-10 h-10" />
            </div>

            <div className="space-y-2">
              <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-emerald-50 text-emerald-700 text-xs font-bold border border-emerald-200">
                <Sparkles className="w-3.5 h-3.5" /> Enrolment Verified & Active
              </span>
              <h1 className="text-2xl sm:text-3xl font-extrabold text-[#393636] tracking-tight">
                Congratulations! Your Enrolment is Confirmed.
              </h1>
              <p className="text-xs sm:text-sm text-[#393636]/70 max-w-sm mx-auto">
                Your payment was verified via Razorpay. You now have full access to your 1-on-1 AI Teacher classroom, workflow assignments, and certificate.
              </p>
            </div>

            {/* Receipt Summary Box */}
            <div className="p-4 bg-[#FAF7EE] rounded-2xl border border-[#393636]/10 text-left space-y-2.5 text-xs">
              <div className="flex justify-between items-center text-gray-500">
                <span>Course Name</span>
                <span className="font-bold text-[#393636] text-right max-w-[200px] truncate">
                  {course.title}
                </span>
              </div>
              <div className="flex justify-between items-center text-gray-500">
                <span>Payment Reference</span>
                <span className="font-mono font-bold text-[#393636]">{transactionRef}</span>
              </div>
              {lastPaymentReceipt.orderId && (
                <div className="flex justify-between items-center text-gray-500">
                  <span>Razorpay Order ID</span>
                  <span className="font-mono text-gray-700">{lastPaymentReceipt.orderId}</span>
                </div>
              )}
              <div className="flex justify-between items-center text-gray-500">
                <span>Enrolment Date</span>
                <span className="font-bold text-[#393636]">{formattedDate}</span>
              </div>
              <div className="flex justify-between items-center text-gray-500 pt-2 border-t border-gray-200/60">
                <span>Amount Paid</span>
                <span className="font-bold text-[#F14C2F] text-sm">₹{lastPaymentReceipt.amount || 499} INR (All Taxes Incl.)</span>
              </div>
            </div>

            {/* Action Buttons */}
            <div className="space-y-3 pt-2">
              <button
                onClick={() => navigate('classroom', course.id)}
                className="w-full py-4 px-6 rounded-xl bg-[#F14C2F] hover:bg-[#d83c21] text-white font-extrabold text-sm shadow-md hover:shadow-lg transition-all flex items-center justify-center gap-2 cursor-pointer"
              >
                <Sparkles className="w-4 h-4" />
                <span>Enter AI Teacher Classroom</span>
              </button>
              <button
                onClick={() => navigate('dashboard')}
                className="w-full py-3 px-6 rounded-xl bg-white hover:bg-gray-50 border border-[#393636]/20 text-[#393636] font-bold text-xs transition-all cursor-pointer flex items-center justify-center gap-2"
              >
                <Layers className="w-4 h-4" />
                <span>Go to Student Dashboard</span>
              </button>
            </div>
          </>
        )}

        {/* =========================================================================
            SCREEN 2: FAILED
           ========================================================================= */}
        {currentStatus === 'FAILED' && (
          <>
            <div className="w-20 h-20 rounded-full bg-red-100 text-red-600 mx-auto flex items-center justify-center shadow-inner">
              <XCircle className="w-10 h-10" />
            </div>

            <div className="space-y-2">
              <h1 className="text-2xl sm:text-3xl font-extrabold text-[#393636] tracking-tight">
                Your Payment Was Not Completed.
              </h1>
              <p className="text-xs sm:text-sm text-[#393636]/70 max-w-sm mx-auto leading-relaxed">
                The transaction was declined or interrupted. No money was deducted from your account, and course access remains locked.
              </p>
            </div>

            {lastPaymentReceipt?.failureReason && (
              <div className="p-3 bg-red-50 text-red-700 text-xs rounded-xl border border-red-200 text-left">
                <strong>Gateway Reason:</strong> {lastPaymentReceipt.failureReason}
              </div>
            )}

            {transactionRef && (
              <div className="text-[11px] text-gray-500 font-mono">
                Transaction ID: {transactionRef}
              </div>
            )}

            <div className="space-y-3 pt-2">
              <button
                onClick={() => navigate('checkout', course.id)}
                className="w-full py-3.5 px-6 rounded-xl bg-[#F14C2F] hover:bg-[#d83c21] text-white font-extrabold text-sm shadow-md transition-all flex items-center justify-center gap-2 cursor-pointer"
              >
                <RotateCcw className="w-4 h-4" />
                <span>Retry Payment</span>
              </button>

              <button
                onClick={() => navigate('catalog')}
                className="w-full py-3 px-6 rounded-xl bg-white hover:bg-gray-50 border border-[#393636]/20 text-[#393636] font-bold text-xs transition-all cursor-pointer"
              >
                Return to Course Catalogue
              </button>
            </div>
          </>
        )}

        {/* =========================================================================
            SCREEN 3: PENDING
           ========================================================================= */}
        {currentStatus === 'PENDING' && (
          <>
            <div className="w-20 h-20 rounded-full bg-amber-100 text-amber-600 mx-auto flex items-center justify-center shadow-inner">
              <Clock className="w-10 h-10 animate-spin" />
            </div>

            <div className="space-y-2">
              <h1 className="text-2xl sm:text-3xl font-extrabold text-[#393636] tracking-tight">
                Your Payment Is Being Verified.
              </h1>
              <p className="text-xs sm:text-sm text-[#393636]/70 max-w-sm mx-auto leading-relaxed">
                We are awaiting settlement confirmation from Razorpay. Once captured, your course access will unlock automatically.
              </p>
            </div>

            {statusMessage && (
              <div className="p-3 bg-amber-50 text-amber-800 text-xs rounded-xl border border-amber-200">
                {statusMessage}
              </div>
            )}

            {transactionRef && (
              <div className="p-3 bg-amber-50 text-amber-800 text-xs rounded-xl border border-amber-200">
                Reference ID: <span className="font-mono font-bold">{transactionRef}</span>
              </div>
            )}

            <div className="space-y-3 pt-2">
              <button
                onClick={handleCheckPendingStatusAgain}
                disabled={isCheckingAgain}
                className="w-full py-3.5 px-6 rounded-xl bg-[#F14C2F] hover:bg-[#d83c21] text-white font-extrabold text-sm shadow-md transition-all flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50"
              >
                {isCheckingAgain ? (
                  <>
                    <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                    <span>Checking Gateway Status...</span>
                  </>
                ) : (
                  <>
                    <RotateCcw className="w-4 h-4" />
                    <span>Check Status Again</span>
                  </>
                )}
              </button>

              <button
                onClick={() => navigate('dashboard')}
                className="w-full py-3 px-6 rounded-xl bg-white hover:bg-gray-50 border border-[#393636]/20 text-[#393636] font-bold text-xs transition-all cursor-pointer"
              >
                Return to Dashboard
              </button>
            </div>
          </>
        )}
      </div>
    </div>
  );
};
