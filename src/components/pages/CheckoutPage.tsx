import React, { useState, useEffect } from 'react';
import { useApp } from '../../context/AppContext';
import { COURSES_DATA } from '../../data/coursesData';
import { trackBeginCheckout } from '../../seo/analytics';
import {
  ShieldCheck,
  CreditCard,
  QrCode,
  Building,
  CheckCircle2,
  AlertCircle,
  Clock,
  Lock,
  ChevronRight,
  Smartphone,
  ExternalLink,
  Info
} from 'lucide-react';
import { PaymentReceipt } from '../../types';

declare global {
  interface Window {
    Razorpay?: any;
  }
}

interface RazorpayConfig {
  isConfigured: boolean;
  keyId: string | null;
  currency: string;
  mode: 'TEST' | 'LIVE';
  supportedCourses: string[];
}

export const CheckoutPage: React.FC = () => {
  const {
    user,
    selectedCourseId,
    courses,
    navigate,
    recordPaymentReceipt
  } = useApp();

  const course = courses.find((c) => c.id === selectedCourseId) || courses[0] || COURSES_DATA[0];

  // Visual payment category highlight in UI
  const [selectedMethodCategory, setSelectedMethodCategory] = useState<'upi' | 'card' | 'netbanking'>('upi');

  // Backend configuration state
  const [config, setConfig] = useState<RazorpayConfig | null>(null);
  const [isLoadingConfig, setIsLoadingConfig] = useState(true);
  const [isProcessing, setIsProcessing] = useState(false);
  const [acceptedCheckoutPolicies, setAcceptedCheckoutPolicies] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  // Price calculations - DaVinci Resolve is strictly ₹499 INR
  const originalPrice = course.regularPriceInr || 1899;
  const studentPrice = course.studentPriceInr || 499;
  const discountAmount = originalPrice - studentPrice;
  const gstAmount = Math.round(studentPrice * 0.18);

  // Fetch Razorpay public configuration on mount
  useEffect(() => {
    let isMounted = true;
    const fetchConfig = async () => {
      try {
        const res = await fetch('/api/payments/razorpay/config');
        if (res.ok) {
          const contentType = res.headers.get('content-type') || '';
          if (contentType.includes('application/json')) {
            const data: any = await res.json();
            if (isMounted) {
              setConfig({
                isConfigured: Boolean(data.isConfigured ?? data.configured),
                keyId: data.keyId || null,
                currency: data.currency || 'INR',
                mode: data.mode || 'TEST',
                supportedCourses: data.supportedCourses || []
              });
            }
          }
        }
      } catch (err) {
        console.warn('Failed to load Razorpay config:', err);
      } finally {
        if (isMounted) setIsLoadingConfig(false);
      }
    };

    fetchConfig();
    return () => {
      isMounted = false;
    };
  }, []);

  // Helper to ensure Razorpay checkout.js script is loaded
  const ensureRazorpayScript = (): Promise<boolean> => {
    return new Promise((resolve) => {
      if (typeof window.Razorpay !== 'undefined') {
        return resolve(true);
      }
      const existingScript = document.querySelector('script[src*="checkout.razorpay.com"]');
      if (existingScript) {
        existingScript.addEventListener('load', () => resolve(true));
        existingScript.addEventListener('error', () => resolve(false));
        return;
      }
      const script = document.createElement('script');
      script.src = 'https://checkout.razorpay.com/v1/checkout.js';
      script.async = true;
      script.onload = () => resolve(true);
      script.onerror = () => resolve(false);
      document.body.appendChild(script);
    });
  };

  const handleLaunchRazorpayPayment = async (e: React.FormEvent) => {
    e.preventDefault();
    if (isProcessing) return;
    setIsProcessing(true);
    setErrorMsg(null);

    if (!user) {
      setErrorMsg('Please log in or create an account to enroll in this course.');
      navigate('login');
      return;
    }

    if (!acceptedCheckoutPolicies) {
      setErrorMsg('Please accept the Payment, Refund & Cancellation Policy, Terms & Conditions, and Privacy Policy before paying.');
      setIsProcessing(false);
      return;
    }

    if (user.complianceStatus && user.complianceStatus !== 'ACTIVE' && user.complianceStatus !== 'LEGACY_REVIEW') {
      setErrorMsg('Course purchases are paused until guardian consent or jurisdiction compliance review is completed.');
      setIsProcessing(false);
      return;
    }

    try {
      trackBeginCheckout(course.id, studentPrice);
      const token = localStorage.getItem('tuteach_auth_token') || '';
      if (!token) {
        setErrorMsg('Authentication session missing. Please sign in again.');
        navigate('login');
        return;
      }

      // 1. Ensure Razorpay SDK script is available in browser
      const scriptLoaded = await ensureRazorpayScript();
      if (!scriptLoaded || typeof window.Razorpay === 'undefined') {
        throw new Error('Razorpay Checkout SDK failed to load. Please check your internet connection and refresh.');
      }

      // 2. Create Genuine Razorpay Order securely via backend (price enforced on server)
      const orderResponse = await fetch('/api/payments/razorpay/create-order', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          courseId: course.id,
          acceptedCheckoutPolicies: true
        })
      });

      // Safely verify response Content-Type before parsing to avoid "Unexpected token <" HTML error
      const orderContentType = orderResponse.headers.get('content-type') || '';
      let orderData: any = null;

      if (orderContentType.includes('application/json')) {
        try {
          orderData = await orderResponse.json();
        } catch {
          throw new Error('Received malformed JSON from payment order service.');
        }
      } else {
        const rawHtml = await orderResponse.text();
        console.error('Non-JSON response received from /api/payments/razorpay/create-order:', rawHtml.slice(0, 200));
        throw new Error(
          `Payment service returned status ${orderResponse.status}. Please check server connectivity and ensure credentials are set.`
        );
      }

      if (!orderResponse.ok) {
        if (orderData.error === 'RAZORPAY_NOT_CONFIGURED') {
          setErrorMsg(
            orderData.message ||
            'Razorpay API keys (RAZORPAY_KEY_ID & RAZORPAY_KEY_SECRET) are not configured in the server environment yet. Please add your Razorpay Test Key ID and Secret in your project environment secrets.'
          );
          setIsProcessing(false);
          return;
        }
        throw new Error(orderData.message || orderData.error || 'Failed to create secure Razorpay order.');
      }

      const { orderId, keyId, amountPaise, currency } = orderData;

      // 3. Initialize Razorpay Checkout Modal
      const options = {
        key: keyId,
        amount: amountPaise, // 49900 paise = ₹499 INR
        currency: currency || 'INR',
        name: 'TUTeach',
        description: `Course Enrolment: ${course.title}`,
        image: '/assets/aistudio/tuteach_logo_b6133804.png',
        order_id: orderId,
        prefill: {
          name: user?.name || '',
          email: user?.email || '',
          contact: ''
        },
        notes: {
          courseId: course.id,
          courseTitle: course.title,
          studentName: user?.name || '',
          studentEmail: user?.email || ''
        },
        theme: {
          color: '#F14C2F'
        },
        modal: {
          ondismiss: function () {
            setIsProcessing(false);
          }
        },
        handler: async function (response: {
          razorpay_payment_id: string;
          razorpay_order_id: string;
          razorpay_signature: string;
        }) {
          try {
            // 4. Server-Side Cryptographic Signature & Payment Verification
            const verifyRes = await fetch('/api/payments/razorpay/verify-signature', {
              method: 'POST',
              headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${token}`
              },
              body: JSON.stringify({
                razorpay_order_id: response.razorpay_order_id,
                razorpay_payment_id: response.razorpay_payment_id,
                razorpay_signature: response.razorpay_signature,
                courseId: course.id
              })
            });

            const verifyContentType = verifyRes.headers.get('content-type') || '';
            let verifyData: any = null;

            if (verifyContentType.includes('application/json')) {
              try {
                verifyData = await verifyRes.json();
              } catch {
                verifyData = { verified: false, status: 'FAILED', message: 'Malformed JSON verification response.' };
              }
            } else {
              verifyData = {
                verified: false,
                status: 'FAILED',
                message: `Server returned status ${verifyRes.status} during signature verification.`
              };
            }

            if (verifyRes.ok && verifyData.verified && verifyData.status === 'SUCCESS') {
              const receipt: PaymentReceipt = {
                transactionRef: response.razorpay_payment_id,
                orderId: response.razorpay_order_id,
                paymentId: response.razorpay_payment_id,
                courseId: course.id,
                courseTitle: course.title,
                amount: studentPrice,
                date: new Date().toISOString(),
                status: 'SUCCESS',
                paymentMethod: verifyData.receipt?.paymentMethod || 'RAZORPAY'
              };

              recordPaymentReceipt(receipt);
              navigate('payment-result');
            } else {
              const failedReceipt: PaymentReceipt = {
                transactionRef: response.razorpay_payment_id || `FAILED_${Date.now()}`,
                orderId: response.razorpay_order_id,
                paymentId: response.razorpay_payment_id,
                courseId: course.id,
                courseTitle: course.title,
                amount: studentPrice,
                date: new Date().toISOString(),
                status: 'FAILED',
                paymentMethod: 'RAZORPAY',
                failureReason: verifyData.message || 'Signature verification failed on the server.'
              };

              recordPaymentReceipt(failedReceipt);
              navigate('payment-result');
            }
          } catch (verifyErr: any) {
            console.error('Signature verification call failed:', verifyErr);
            setErrorMsg('Verification error: could not validate payment signature with server.');
            setIsProcessing(false);
          }
        }
      };

      const rzpInstance = new window.Razorpay(options);

      rzpInstance.on('payment.failed', async function (response: any) {
        setIsProcessing(false);
        const errDetails = response.error || {};

        try {
          // Log failed transaction in backend audit record
          await fetch('/api/payments/razorpay/record-failure', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              razorpay_order_id: errDetails.metadata?.order_id || orderId,
              razorpay_payment_id: errDetails.metadata?.payment_id || '',
              error_code: errDetails.code,
              error_description: errDetails.description,
              error_reason: errDetails.reason,
              courseId: course.id,
              studentEmail: user?.email || ''
            })
          });
        } catch (logErr) {
          console.warn('Failed to log failure audit:', logErr);
        }

        const failedReceipt: PaymentReceipt = {
          transactionRef: errDetails.metadata?.payment_id || `FAILED_${Date.now()}`,
          orderId: errDetails.metadata?.order_id || orderId,
          paymentId: errDetails.metadata?.payment_id || '',
          courseId: course.id,
          courseTitle: course.title,
          amount: studentPrice,
          date: new Date().toISOString(),
          status: 'FAILED',
          paymentMethod: 'RAZORPAY',
          failureReason: errDetails.description || errDetails.reason || 'Payment was declined or cancelled.'
        };

        recordPaymentReceipt(failedReceipt);
        navigate('payment-result');
      });

      rzpInstance.open();
    } catch (err: any) {
      console.error('Payment checkout failed:', err);
      setErrorMsg(err?.message || 'Payment initiation failed. Please try again.');
      setIsProcessing(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#FAF7EE] py-8 px-4 sm:px-6 lg:px-8">
      <div className="max-w-5xl mx-auto space-y-8">
        {/* Navigation Breadcrumb */}
        <div className="flex items-center gap-2 text-xs text-[#393636]/70">
          <button onClick={() => navigate('catalog')} className="hover:text-[#F14C2F] cursor-pointer">
            Courses
          </button>
          <ChevronRight className="w-3.5 h-3.5" />
          <button onClick={() => navigate('course-details', course.id)} className="hover:text-[#F14C2F] cursor-pointer">
            {course.title}
          </button>
          <ChevronRight className="w-3.5 h-3.5" />
          <span className="font-bold text-[#393636]">Secure Checkout</span>
        </div>

        {/* Page Header */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 border-b border-[#393636]/10 pb-6">
          <div>
            <h1 className="text-2xl sm:text-3xl font-extrabold text-[#393636] tracking-tight">
              Complete Your Enrolment
            </h1>
            <p className="text-sm text-[#393636]/70 mt-1">
              Guaranteed instant access to your AI Teacher classroom & 100% money-back guarantee.
            </p>
          </div>
          <div className="flex items-center gap-2 text-xs font-semibold text-emerald-700 bg-emerald-50 px-3 py-1.5 rounded-full border border-emerald-200">
            <Lock className="w-3.5 h-3.5" />
            <span>256-Bit SSL Encrypted Razorpay Checkout</span>
          </div>
        </div>

        {/* Credentials Notice (if RAZORPAY_KEY_ID or RAZORPAY_KEY_SECRET missing) */}
        {!isLoadingConfig && config && !config.isConfigured && (
          <div className="p-4 rounded-2xl bg-amber-50 border border-amber-300 text-amber-900 text-xs space-y-2">
            <div className="flex items-center gap-2 font-bold text-sm text-amber-950">
              <Info className="w-4 h-4 text-amber-700 flex-shrink-0" />
              <span>Razorpay Credentials Setup Required</span>
            </div>
            <p className="leading-relaxed">
              To process genuine payments in Razorpay Test or Live mode, configure your keys in the server environment:
            </p>
            <div className="bg-white/80 p-3 rounded-xl border border-amber-200 font-mono text-[11px] space-y-1">
              <div>RAZORPAY_KEY_ID=rzp_test_xxxxxxxxxxxxxx</div>
              <div>RAZORPAY_KEY_SECRET=your_razorpay_secret_key</div>
            </div>
            <p className="text-[11px] text-amber-800">
              Once added in your environment secrets, clicking the pay button will immediately open the official Razorpay Checkout modal with UPI, Cards, and NetBanking.
            </p>
          </div>
        )}

        {errorMsg && (
          <div className="p-4 rounded-xl bg-red-50 border border-red-200 text-red-700 text-xs flex items-center gap-2">
            <AlertCircle className="w-4 h-4 flex-shrink-0" />
            <span>{errorMsg}</span>
          </div>
        )}

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
          {/* Left Column: Razorpay Payment Overview & Launch */}
          <div className="lg:col-span-7 bg-white rounded-2xl p-6 sm:p-8 shadow-xs border border-[#393636]/10 space-y-6">
            <div className="flex items-center justify-between flex-wrap gap-2">
              <div>
                <h2 className="text-lg font-bold text-[#393636]">Supported Payment Methods</h2>
                <p className="text-xs text-[#393636]/70">
                  Select your preferred payment method on the official Razorpay Checkout sheet.
                </p>
              </div>
              <span className="text-[10px] font-bold px-2.5 py-1 rounded-full bg-blue-50 text-blue-800 border border-blue-200 flex items-center gap-1">
                <ShieldCheck className="w-3 h-3 text-blue-600" />
                <span>Verified Razorpay Gateway</span>
              </span>
            </div>

            {/* Payment Method Selector Tabs */}
            <div className="grid grid-cols-3 gap-2 p-1 bg-gray-100 rounded-xl">
              <button
                type="button"
                onClick={() => setSelectedMethodCategory('upi')}
                className={`py-2 px-3 rounded-lg text-xs font-bold transition-all flex items-center justify-center gap-1.5 cursor-pointer ${
                  selectedMethodCategory === 'upi'
                    ? 'bg-white text-[#F14C2F] shadow-xs'
                    : 'text-[#393636]/70 hover:text-[#393636]'
                }`}
              >
                <Smartphone className="w-3.5 h-3.5" />
                <span>UPI / QR</span>
              </button>
              <button
                type="button"
                onClick={() => setSelectedMethodCategory('card')}
                className={`py-2 px-3 rounded-lg text-xs font-bold transition-all flex items-center justify-center gap-1.5 cursor-pointer ${
                  selectedMethodCategory === 'card'
                    ? 'bg-white text-[#F14C2F] shadow-xs'
                    : 'text-[#393636]/70 hover:text-[#393636]'
                }`}
              >
                <CreditCard className="w-3.5 h-3.5" />
                <span>Cards</span>
              </button>
              <button
                type="button"
                onClick={() => setSelectedMethodCategory('netbanking')}
                className={`py-2 px-3 rounded-lg text-xs font-bold transition-all flex items-center justify-center gap-1.5 cursor-pointer ${
                  selectedMethodCategory === 'netbanking'
                    ? 'bg-white text-[#F14C2F] shadow-xs'
                    : 'text-[#393636]/70 hover:text-[#393636]'
                }`}
              >
                <Building className="w-3.5 h-3.5" />
                <span>NetBanking</span>
              </button>
            </div>

            {/* Information Panels for each method */}
            {selectedMethodCategory === 'upi' && (
              <div className="space-y-3">
                <div className="p-4 bg-[#FAF7EE] rounded-xl border border-[#393636]/10 flex flex-col sm:flex-row items-center gap-4">
                  <div className="w-20 h-20 bg-white p-2 rounded-xl border border-gray-200 flex flex-col items-center justify-center shadow-xs shrink-0">
                    <QrCode className="w-12 h-12 text-[#393636]" />
                    <span className="text-[8px] font-bold text-[#F14C2F]">
                      {config?.mode === 'TEST' ? 'Sandbox QR' : 'Dynamic QR'}
                    </span>
                  </div>
                  <div className="space-y-1 text-center sm:text-left">
                    <div className="flex items-center justify-center sm:justify-start gap-2">
                      <p className="text-xs font-bold text-[#393636]">
                        {config?.mode === 'TEST' ? 'UPI / QR Payment (Test Sandbox)' : 'Instant UPI App & QR Support'}
                      </p>
                      {config?.mode === 'TEST' && (
                        <span className="text-[9px] bg-amber-100 text-amber-800 font-extrabold px-1.5 py-0.5 rounded border border-amber-200">
                          TEST MODE
                        </span>
                      )}
                    </div>
                    <p className="text-[11px] text-[#393636]/70 leading-relaxed">
                      {config?.mode === 'TEST'
                        ? 'Simulated UPI workflow via Razorpay test gateway for developer verification.'
                        : 'Pay securely using Google Pay, PhonePe, Paytm, BHIM, or any UPI ID with instant biometric confirmation.'}
                    </p>
                    <div className="flex flex-wrap gap-1.5 pt-1">
                      {['Google Pay', 'PhonePe', 'Paytm', 'BHIM UPI', 'Cred'].map((app) => (
                        <span key={app} className="text-[10px] bg-white border border-gray-200 px-2 py-0.5 rounded font-semibold text-gray-700">
                          {app}
                        </span>
                      ))}
                    </div>
                  </div>
                </div>

                {config?.mode === 'TEST' && (
                  <div className="p-3.5 bg-amber-50/90 rounded-xl border border-amber-200/80 text-xs space-y-2">
                    <div className="flex items-center gap-1.5 font-bold text-amber-900">
                      <Info className="w-4 h-4 text-amber-600 shrink-0" />
                      <span>Why does phone camera / UPI app show &ldquo;Can&apos;t scan this QR&rdquo;?</span>
                    </div>
                    <p className="text-[11px] text-amber-900/80 leading-relaxed">
                      Razorpay is currently running in <strong>Test Sandbox Mode</strong> (<code className="font-mono font-bold text-amber-950">rzp_test_*</code>). Real mobile UPI apps (Google Pay, PhonePe, Paytm) connect to the production <strong>NPCI live banking switch</strong>, which cannot process or route sandbox virtual test transactions.
                    </p>
                    <div className="bg-white/90 p-2.5 rounded-lg border border-amber-200 text-[11px] text-gray-800 space-y-1">
                      <p className="font-bold text-gray-900">Supported Test Payment Methods in Test Mode:</p>
                      <ul className="list-disc list-inside space-y-0.5 text-gray-700">
                        <li><strong>Simulated UPI:</strong> In the Razorpay popup, select <strong>UPI</strong> and click the on-screen <strong>&ldquo;Simulate Success&rdquo;</strong> button, or enter test VPA: <code className="bg-amber-100 text-amber-900 px-1 py-0.5 rounded font-mono font-bold">success@razorpay</code>.</li>
                        <li><strong>Simulated Cards:</strong> Use test card <code className="bg-gray-100 text-gray-900 px-1 py-0.5 rounded font-mono font-bold">4100 2800 0000 1007</code> (any future expiry, CVV 123) and click &ldquo;Success&rdquo; on the OTP simulator.</li>
                        <li><strong>Simulated NetBanking:</strong> Select any bank and choose &ldquo;Success&rdquo; on the bank test page.</li>
                      </ul>
                      <p className="text-[10px] text-gray-500 pt-0.5">
                        * In Live Mode (with production keys), real phone QR scanning with Google Pay / PhonePe works automatically.
                      </p>
                    </div>
                  </div>
                )}
              </div>
            )}

            {selectedMethodCategory === 'card' && (
              <div className="p-4 bg-[#FAF7EE] rounded-xl border border-[#393636]/10 space-y-2">
                <div className="flex items-center justify-between">
                  <p className="text-xs font-bold text-[#393636]">Credit & Debit Cards Accepted</p>
                  <span className="text-[10px] text-emerald-700 font-semibold">Zero Surcharge</span>
                </div>
                <p className="text-[11px] text-[#393636]/70">
                  Full 3D Secure OTP verification for RuPay, Visa, Mastercard, and Maestro issued by all Indian banks.
                </p>
                <div className="flex flex-wrap gap-2 pt-1 text-[11px] font-semibold text-gray-700">
                  <span className="bg-white border px-2 py-0.5 rounded">RuPay</span>
                  <span className="bg-white border px-2 py-0.5 rounded">Visa</span>
                  <span className="bg-white border px-2 py-0.5 rounded">Mastercard</span>
                  <span className="bg-white border px-2 py-0.5 rounded">Maestro</span>
                </div>
              </div>
            )}

            {selectedMethodCategory === 'netbanking' && (
              <div className="p-4 bg-[#FAF7EE] rounded-xl border border-[#393636]/10 space-y-2">
                <p className="text-xs font-bold text-[#393636]">All Indian Banks Supported</p>
                <p className="text-[11px] text-[#393636]/70">
                  HDFC, SBI, ICICI, Axis, Kotak, PNB, and 50+ other scheduled Indian retail banks supported via direct secure netbanking gateway.
                </p>
              </div>
            )}

            {/* Authenticated Student Profile Info */}
            {!user ? (
              <div className="p-4 bg-amber-50 rounded-xl border border-amber-200 text-xs space-y-2">
                <div className="flex items-center gap-2 font-bold text-amber-900">
                  <AlertCircle className="w-4 h-4 text-amber-600 shrink-0" />
                  <span>Sign In Required Before Payment</span>
                </div>
                <p className="text-amber-800 text-[11px] leading-relaxed">
                  Please log in or create an account so your payment, invoice, and verified certificate are registered to your personal name.
                </p>
                <div className="flex gap-2 pt-1">
                  <button
                    type="button"
                    onClick={() => navigate('login')}
                    className="px-3 py-1.5 bg-[#F14C2F] text-white font-bold rounded-lg text-xs hover:bg-[#d83c21] cursor-pointer"
                  >
                    Sign In
                  </button>
                  <button
                    type="button"
                    onClick={() => navigate('register')}
                    className="px-3 py-1.5 bg-white border border-gray-300 font-bold rounded-lg text-xs hover:bg-gray-50 text-gray-700 cursor-pointer"
                  >
                    Create Account
                  </button>
                </div>
              </div>
            ) : (
              <div className="p-3.5 bg-gray-50 rounded-xl border border-gray-200 text-xs space-y-1">
                <div className="text-[11px] font-bold text-gray-700">Authenticated Student Profile (Invoice & Certificate):</div>
                <div className="flex flex-wrap gap-x-4 gap-y-1 text-gray-600">
                  <span>Name: <strong className="text-gray-900">{user.name}</strong></span>
                  <span>Email: <strong className="text-gray-900">{user.email}</strong></span>
                  <span>Currency: <strong className="text-gray-900">INR (₹)</strong></span>
                </div>
              </div>
            )}

            <form onSubmit={handleLaunchRazorpayPayment} className="space-y-4">
              {user && user.complianceStatus && user.complianceStatus !== 'ACTIVE' && user.complianceStatus !== 'LEGACY_REVIEW' && (
                <div className="p-3.5 bg-amber-50 border border-amber-300 rounded-xl text-xs text-amber-950 space-y-2">
                  <div className="font-bold">Payment Blocked: {user.complianceStatus.replace(/_/g, ' ')}</div>
                  <p>Verifiable parent/guardian consent or jurisdiction approval is required before purchasing courses.</p>
                  <button
                    type="button"
                    onClick={() => navigate('parental-consent')}
                    className="px-3 py-1.5 bg-[#393636] text-white font-bold rounded-lg text-xs cursor-pointer"
                  >
                    Open Parental Consent Portal
                  </button>
                </div>
              )}

              <label className="flex items-start gap-2.5 p-3 bg-gray-50 rounded-xl border border-gray-200 text-xs text-gray-700 cursor-pointer">
                <input
                  type="checkbox"
                  checked={acceptedCheckoutPolicies}
                  onChange={(e) => setAcceptedCheckoutPolicies(e.target.checked)}
                  className="mt-0.5 accent-[#F14C2F]"
                />
                <span>
                  I accept the{' '}
                  <button type="button" onClick={() => navigate('refund-policy')} className="text-[#F14C2F] font-semibold underline">
                    Payment, Cancellation &amp; Refund Policy
                  </button>
                  ,{' '}
                  <button type="button" onClick={() => navigate('terms')} className="text-[#F14C2F] font-semibold underline">
                    Terms &amp; Conditions
                  </button>
                  , and{' '}
                  <button type="button" onClick={() => navigate('privacy')} className="text-[#F14C2F] font-semibold underline">
                    Privacy Policy
                  </button>{' '}
                  (including ₹499 INR Razorpay billing).
                </span>
              </label>

              <button
                type="submit"
                disabled={isProcessing || !acceptedCheckoutPolicies || (Boolean(user?.complianceStatus) && user?.complianceStatus !== 'ACTIVE' && user?.complianceStatus !== 'LEGACY_REVIEW')}
                className="w-full py-4 px-6 rounded-xl bg-[#F14C2F] hover:bg-[#d83c21] disabled:opacity-50 text-white font-extrabold text-sm shadow-md hover:shadow-lg transition-all flex items-center justify-center gap-2 cursor-pointer"
              >
                {isProcessing ? (
                  <>
                    <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                    <span>Connecting to Razorpay...</span>
                  </>
                ) : (
                  <>
                    <Lock className="w-4 h-4" />
                    <span>Pay ₹{studentPrice} with Razorpay & Start Learning</span>
                  </>
                )}
              </button>

              <div className="flex items-center justify-center gap-2 text-[11px] text-gray-500">
                <ShieldCheck className="w-3.5 h-3.5 text-emerald-600" />
                <span>HMAC SHA-256 Verified · No hidden charges · Instant course unlock</span>
              </div>
            </form>
          </div>

          {/* Right Column: Order Summary */}
          <div className="lg:col-span-5 bg-white rounded-2xl p-6 shadow-xs border border-[#393636]/10 space-y-6">
            <h2 className="text-base font-bold text-[#393636] border-b border-gray-100 pb-3">
              Order Summary
            </h2>

            {/* Course Item */}
            <div className="flex gap-3.5">
              <div className="w-20 h-16 rounded-xl overflow-hidden bg-gray-100 flex-shrink-0 border border-gray-200">
                <img
                  src="/assets/aistudio/tuteach_logo_b6133804.png"
                  alt={course.title}
                  className="w-full h-full object-cover"
                />
              </div>
              <div className="space-y-1">
                <span className="text-[10px] font-bold text-[#F14C2F] uppercase tracking-wider">
                  {course.software}
                </span>
                <h3 className="text-xs sm:text-sm font-bold text-[#393636] leading-snug">
                  {course.title}
                </h3>
                <p className="text-[11px] text-gray-500">
                  {course.modules.flatMap((m) => m.lessons).length} Lessons · 1-on-1 AI Tutor Included
                </p>
              </div>
            </div>

            {/* Price Calculations */}
            <div className="space-y-2.5 pt-4 border-t border-gray-100 text-xs">
              <div className="flex justify-between text-gray-600">
                <span>Standard Course Tuition</span>
                <span className="font-mono">₹{originalPrice}</span>
              </div>
              <div className="flex justify-between text-emerald-700 font-semibold">
                <span>Student Subsidized Grant</span>
                <span className="font-mono">-₹{discountAmount}</span>
              </div>
              <div className="flex justify-between text-gray-500 text-[11px]">
                <span>Taxes & Processing (GST 18% Incl.)</span>
                <span className="font-mono">₹{gstAmount}</span>
              </div>
              <div className="flex justify-between text-sm font-extrabold text-[#393636] pt-2 border-t border-gray-100">
                <span>Total Amount Due</span>
                <span className="font-mono text-[#F14C2F] text-base">₹{studentPrice}</span>
              </div>
            </div>

            {/* What's Included */}
            <div className="p-4 bg-[#FAF7EE] rounded-xl border border-[#393636]/10 space-y-2 text-xs">
              <p className="font-bold text-[#393636]">Your Enrolment Includes:</p>
              <ul className="space-y-1.5 text-gray-700 text-[11px]">
                <li className="flex items-center gap-1.5">
                  <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600 flex-shrink-0" />
                  <span>Unlimited 24/7 AI Voice Teacher Classroom</span>
                </li>
                <li className="flex items-center gap-1.5">
                  <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600 flex-shrink-0" />
                  <span>Practical DaVinci Resolve Workflow Labs</span>
                </li>
                <li className="flex items-center gap-1.5">
                  <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600 flex-shrink-0" />
                  <span>Instant 10-Point AI Rubric Evaluations & Retries</span>
                </li>
                <li className="flex items-center gap-1.5">
                  <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600 flex-shrink-0" />
                  <span>Verifiable Industry Completion Certificate</span>
                </li>
              </ul>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
