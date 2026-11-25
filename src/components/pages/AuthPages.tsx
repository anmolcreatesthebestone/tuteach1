import React, { useState } from 'react';
import { useApp } from '../../context/AppContext';
import { TUTeachLogo } from '../common/Logo';
import { trackSignUpStart } from '../../seo/analytics';
import {
  Mail,
  Lock,
  User,
  ArrowRight,
  CheckCircle2,
  Sparkles,
  KeyRound,
  ShieldCheck,
  ChevronLeft
} from 'lucide-react';

export const LoginPage: React.FC = () => {
  const { loginUser, registerUser, navigate } = useApp();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [errorMsg, setErrorMsg] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email) return;
    setErrorMsg('');
    setLoading(true);
    const success = await loginUser(email, password || 'password123');
    setLoading(false);
    if (success) {
      navigate('dashboard');
    } else {
      setErrorMsg('Invalid email or password. Please verify your credentials.');
    }
  };

  const handleDemoLogin = async (demoEmail: string, demoName: string) => {
    setEmail(demoEmail);
    setPassword('password123');
    setErrorMsg('');
    setLoading(true);
    let success = await loginUser(demoEmail, 'password123');
    if (!success) {
      await registerUser(demoName, demoEmail, 'Master Video Editing with DaVinci Resolve', 'password123', {
        countryCode: 'IN',
        dateOfBirth: '1999-05-15',
        acceptedPolicies: true
      });
      success = await loginUser(demoEmail, 'password123');
    }
    setLoading(false);
    if (success) {
      navigate('dashboard');
    } else {
      setErrorMsg('Could not log into demo account. Please try again.');
    }
  };

  return (
    <div className="min-h-screen bg-[#EFEBDA] flex flex-col justify-center py-12 sm:px-6 lg:px-8">
      <div className="sm:mx-auto sm:w-full sm:max-w-md text-center space-y-4">
        <div className="inline-block">
          <TUTeachLogo size="lg" />
        </div>
        <h2 className="text-2xl sm:text-3xl font-extrabold text-[#393636]">
          Student Portal Login
        </h2>
        <p className="text-xs text-gray-600">
          Sign in to access your active courses, Golu Guru AI tutor, privacy controls, and certifications.
        </p>
      </div>

      <div className="mt-8 sm:mx-auto sm:w-full sm:max-w-md">
        <div className="bg-white py-8 px-6 shadow-xl rounded-3xl border border-[#393636]/10 sm:px-10 space-y-6">
          {errorMsg && (
            <div className="p-3 bg-red-50 text-red-600 border border-red-200 rounded-xl text-xs font-medium">
              {errorMsg}
            </div>
          )}

          {/* 1-Click Demo Accounts */}
          <div className="p-3 bg-[#EFEBDA]/50 rounded-2xl border border-[#393636]/10 space-y-2">
            <span className="text-[10px] font-bold uppercase tracking-wider text-gray-500 block">
              Quick 1-Click Demo Logins:
            </span>
            <div className="grid grid-cols-2 gap-2">
              <button
                type="button"
                onClick={() => handleDemoLogin('anmol@tuteach.ai', 'Anmol Sharma')}
                className="p-2 bg-white hover:bg-gray-50 rounded-xl border border-gray-200 text-left text-xs transition-colors cursor-pointer"
              >
                <div className="font-bold text-[#393636]">Anmol Sharma</div>
                <div className="text-[10px] text-[#F14C2F] font-semibold">Demo Scholar</div>
              </button>
              <button
                type="button"
                onClick={() => handleDemoLogin('maya.chen@student.ai', 'Maya Chen')}
                className="p-2 bg-white hover:bg-gray-50 rounded-xl border border-gray-200 text-left text-xs transition-colors cursor-pointer"
              >
                <div className="font-bold text-[#393636]">Maya Chen</div>
                <div className="text-[10px] text-gray-500">New Learner</div>
              </button>
            </div>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-xs font-bold text-[#393636] mb-1">
                Email Address
              </label>
              <div className="relative">
                <Mail className="w-4 h-4 text-gray-400 absolute left-3 top-1/2 -translate-y-1/2" />
                <input
                  type="email"
                  required
                  placeholder="student@tuteach.ai"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full pl-9 pr-3 py-2.5 text-xs sm:text-sm border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#F14C2F]"
                />
              </div>
            </div>

            <div>
              <div className="flex items-center justify-between mb-1">
                <label className="block text-xs font-bold text-[#393636]">
                  Password
                </label>
                <button
                  type="button"
                  onClick={() => navigate('forgot-password')}
                  className="text-xs text-[#F14C2F] hover:underline"
                >
                  Forgot password?
                </button>
              </div>
              <div className="relative">
                <Lock className="w-4 h-4 text-gray-400 absolute left-3 top-1/2 -translate-y-1/2" />
                <input
                  type="password"
                  required
                  placeholder="••••••••••••"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full pl-9 pr-3 py-2.5 text-xs sm:text-sm border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#F14C2F]"
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full py-3 bg-[#F14C2F] hover:bg-[#d63b20] text-white font-bold text-xs sm:text-sm rounded-xl shadow-md transition-colors flex items-center justify-center gap-2 cursor-pointer"
            >
              {loading ? 'Authenticating...' : 'Sign In to TUTeach'}
              <ArrowRight className="w-4 h-4" />
            </button>
          </form>

          <div className="text-center pt-2 border-t border-gray-100 text-xs text-gray-600">
            Don't have an account yet?{' '}
            <button
              onClick={() => navigate('register')}
              className="text-[#F14C2F] font-bold hover:underline"
            >
              Register here
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

interface JurisdictionOption {
  countryCode: string;
  countryName: string;
  consentAgeThreshold: number;
  applicableFramework: string;
  enabled: boolean;
  requiresLegalReview: boolean;
}

const FALLBACK_JURISDICTIONS: JurisdictionOption[] = [
  { countryCode: 'IN', countryName: 'India', consentAgeThreshold: 18, applicableFramework: 'INDIA_DPDP', enabled: true, requiresLegalReview: false },
  { countryCode: 'US', countryName: 'United States', consentAgeThreshold: 13, applicableFramework: 'US_COPPA', enabled: true, requiresLegalReview: false },
  { countryCode: 'DE', countryName: 'Germany', consentAgeThreshold: 16, applicableFramework: 'EU_GDPR_ART8', enabled: true, requiresLegalReview: false },
  { countryCode: 'FR', countryName: 'France', consentAgeThreshold: 15, applicableFramework: 'EU_GDPR_ART8', enabled: true, requiresLegalReview: false },
  { countryCode: 'ES', countryName: 'Spain', consentAgeThreshold: 14, applicableFramework: 'EU_GDPR_ART8', enabled: true, requiresLegalReview: false },
  { countryCode: 'GB', countryName: 'United Kingdom', consentAgeThreshold: 13, applicableFramework: 'GLOBAL_CONFIGURABLE', enabled: false, requiresLegalReview: true },
  { countryCode: 'OTHER', countryName: 'Other Country / Unlisted Region', consentAgeThreshold: 18, applicableFramework: 'GLOBAL_CONFIGURABLE', enabled: false, requiresLegalReview: true }
];

export const RegisterPage: React.FC = () => {
  const { registerUser, navigate } = useApp();
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [countryCode, setCountryCode] = useState('IN');
  const [dateOfBirth, setDateOfBirth] = useState('');
  const [goals, setGoals] = useState('Master Video Editing with DaVinci Resolve');
  const [agreed, setAgreed] = useState(false); // Strictly unchecked by default for affirmative legal consent
  const [jurisdictions, setJurisdictions] = useState<JurisdictionOption[]>(FALLBACK_JURISDICTIONS);
  const [errorMsg, setErrorMsg] = useState('');
  const [loading, setLoading] = useState(false);

  React.useEffect(() => {
    fetch('/api/compliance/jurisdictions')
      .then((r) => r.json())
      .then((d) => {
        if (Array.isArray(d.jurisdictions) && d.jurisdictions.length > 0) {
          setJurisdictions(d.jurisdictions);
        }
      })
      .catch(() => {});
  }, []);

  const selectedRule = jurisdictions.find((j) => j.countryCode === countryCode) || jurisdictions[0];

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name || !email || !dateOfBirth || !countryCode) {
      setErrorMsg('Please fill in your full name, email, country, and date of birth.');
      return;
    }
    if (!agreed) {
      setErrorMsg('Please explicitly accept the Terms & Conditions, Privacy Policy, Student Agreement, and Child Safety Policy.');
      return;
    }
    setErrorMsg('');
    trackSignUpStart();
    setLoading(true);
    const result = await registerUser(name, email, goals, password || 'password123', {
      countryCode,
      dateOfBirth,
      acceptedPolicies: agreed
    });
    setLoading(false);
    if (result.ok && result.user) {
      if (result.user.complianceStatus === 'PENDING_PARENTAL_CONSENT') {
        navigate('parental-consent');
      } else {
        navigate('dashboard');
      }
    } else {
      setErrorMsg(result.error || 'Registration failed. Please verify your details and try again.');
    }
  };

  return (
    <div className="min-h-screen bg-[#EFEBDA] flex flex-col justify-center py-12 sm:px-6 lg:px-8">
      <div className="sm:mx-auto sm:w-full sm:max-w-md text-center space-y-4">
        <div className="inline-block">
          <TUTeachLogo size="lg" />
        </div>
        <h2 className="text-2xl sm:text-3xl font-extrabold text-[#393636]">
          Create Student Account
        </h2>
        <p className="text-xs text-gray-600">
          Age-protected registration for DaVinci Resolve AI mentoring.
        </p>
      </div>

      <div className="mt-8 sm:mx-auto sm:w-full sm:max-w-lg px-4">
        <div className="bg-white py-8 px-6 shadow-xl rounded-3xl border border-[#393636]/10 sm:px-10 space-y-5">
          {errorMsg && (
            <div className="p-3 bg-red-50 text-red-600 border border-red-200 rounded-xl text-xs font-medium">
              {errorMsg}
            </div>
          )}

          <form onSubmit={handleRegister} className="space-y-4">
            <div>
              <label className="block text-xs font-bold text-[#393636] mb-1">
                Full Name
              </label>
              <div className="relative">
                <User className="w-4 h-4 text-gray-400 absolute left-3 top-1/2 -translate-y-1/2" />
                <input
                  type="text"
                  required
                  placeholder="e.g. Rohan Sharma"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="w-full pl-9 pr-3 py-2.5 text-xs sm:text-sm border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#F14C2F]"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-bold text-[#393636] mb-1">
                Email Address
              </label>
              <div className="relative">
                <Mail className="w-4 h-4 text-gray-400 absolute left-3 top-1/2 -translate-y-1/2" />
                <input
                  type="email"
                  required
                  placeholder="student@domain.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full pl-9 pr-3 py-2.5 text-xs sm:text-sm border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#F14C2F]"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-bold text-[#393636] mb-1">
                Password (min 6 characters)
              </label>
              <div className="relative">
                <Lock className="w-4 h-4 text-gray-400 absolute left-3 top-1/2 -translate-y-1/2" />
                <input
                  type="password"
                  required
                  minLength={6}
                  placeholder="Create a strong password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full pl-9 pr-3 py-2.5 text-xs sm:text-sm border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#F14C2F]"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-bold text-[#393636] mb-1">
                  Country / Jurisdiction
                </label>
                <select
                  required
                  value={countryCode}
                  onChange={(e) => setCountryCode(e.target.value)}
                  className="w-full px-3 py-2.5 text-xs sm:text-sm border border-gray-300 rounded-xl bg-white font-medium text-[#393636] focus:outline-none focus:ring-2 focus:ring-[#F14C2F]"
                >
                  {jurisdictions.map((j) => (
                    <option key={j.countryCode} value={j.countryCode}>
                      {j.countryName} {!j.enabled || j.requiresLegalReview ? '(Review Required)' : `(Consent age ${j.consentAgeThreshold}+)`}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-xs font-bold text-[#393636] mb-1">
                  Date of Birth
                </label>
                <input
                  type="date"
                  required
                  value={dateOfBirth}
                  onChange={(e) => setDateOfBirth(e.target.value)}
                  className="w-full px-3 py-2.5 text-xs sm:text-sm border border-gray-300 rounded-xl bg-white text-[#393636] focus:outline-none focus:ring-2 focus:ring-[#F14C2F]"
                />
              </div>
            </div>

            {selectedRule && (
              <div className="p-3 bg-[#EFEBDA]/60 rounded-xl border border-[#393636]/10 text-[11px] text-[#393636] space-y-1">
                <div className="flex items-center gap-1.5 font-bold">
                  <ShieldCheck className="w-3.5 h-3.5 text-[#F14C2F]" />
                  <span>
                    Jurisdiction Rule ({selectedRule.countryName}): Minimum independent age is {selectedRule.consentAgeThreshold} years
                  </span>
                </div>
                {(!selectedRule.enabled || selectedRule.requiresLegalReview) ? (
                  <p className="text-amber-700">
                    Note: Regional compliance review for {selectedRule.countryName} is pending. New accounts from this region will remain restricted until regional legal approval is enabled.
                  </p>
                ) : (
                  <p className="text-gray-600">
                    Students under {selectedRule.consentAgeThreshold} require verifiable parent/guardian consent before AI Tutor or course payment access.
                  </p>
                )}
              </div>
            )}

            <div>
              <label className="block text-xs font-bold text-[#393636] mb-1">
                Primary Learning Goal
              </label>
              <select
                value={goals}
                onChange={(e) => setGoals(e.target.value)}
                className="w-full px-3 py-2.5 text-xs sm:text-sm border border-gray-300 rounded-xl bg-white font-medium text-[#393636] focus:outline-none focus:ring-2 focus:ring-[#F14C2F]"
              >
                <option value="Master Video Editing with DaVinci Resolve">Master Video Editing with DaVinci Resolve</option>
                <option value="YouTube & Creator Storytelling Workflow">YouTube & Creator Storytelling Workflow</option>
                <option value="Color Grading & Fairlight Audio Post-Production">Color Grading & Fairlight Audio Post-Production</option>
                <option value="Freelance Video Editing Portfolio">Freelance Video Editing Portfolio</option>
              </select>
            </div>

            <div className="flex items-start gap-2.5 pt-1 bg-gray-50 p-3 rounded-xl border border-gray-200">
              <input
                type="checkbox"
                id="terms"
                checked={agreed}
                onChange={(e) => setAgreed(e.target.checked)}
                className="mt-1 accent-[#F14C2F]"
              />
              <label htmlFor="terms" className="text-xs text-gray-700 leading-relaxed">
                I confirm my date of birth is accurate and I accept the{' '}
                <button type="button" onClick={() => navigate('terms')} className="text-[#F14C2F] font-semibold underline">
                  Terms &amp; Conditions
                </button>
                ,{' '}
                <button type="button" onClick={() => navigate('privacy')} className="text-[#F14C2F] font-semibold underline">
                  Privacy Policy
                </button>
                ,{' '}
                <button type="button" onClick={() => navigate('student-agreement')} className="text-[#F14C2F] font-semibold underline">
                  Student Agreement
                </button>
                , and{' '}
                <button type="button" onClick={() => navigate('child-safety')} className="text-[#F14C2F] font-semibold underline">
                  Child Safety Policy
                </button>
                .
              </label>
            </div>

            <button
              type="submit"
              disabled={!agreed || loading}
              className="w-full py-3 bg-[#F14C2F] hover:bg-[#d63b20] disabled:bg-gray-300 text-white font-bold text-xs sm:text-sm rounded-xl shadow-md transition-colors flex items-center justify-center gap-2 cursor-pointer"
            >
              {loading ? 'Creating Protected Account...' : 'Create Account & Continue'}
              <ArrowRight className="w-4 h-4" />
            </button>
          </form>

          <div className="text-center pt-2 border-t border-gray-100 text-xs text-gray-600">
            Already have an account?{' '}
            <button
              onClick={() => navigate('login')}
              className="text-[#F14C2F] font-bold hover:underline"
            >
              Log In
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export const ForgotPasswordPage: React.FC = () => {
  const { navigate } = useApp();
  const [email, setEmail] = useState('');
  const [submitted, setSubmitted] = useState(false);

  const handleReset = (e: React.FormEvent) => {
    e.preventDefault();
    if (!email) return;
    setSubmitted(true);
  };

  return (
    <div className="min-h-screen bg-[#EFEBDA] flex flex-col justify-center py-12 sm:px-6 lg:px-8">
      <div className="sm:mx-auto sm:w-full sm:max-w-md text-center space-y-4">
        <div className="inline-block">
          <TUTeachLogo size="lg" />
        </div>
        <h2 className="text-2xl sm:text-3xl font-extrabold text-[#393636]">
          Reset Your Password
        </h2>
        <p className="text-xs text-gray-600">
          We will send secure instructions to recover your TUTeach account.
        </p>
      </div>

      <div className="mt-8 sm:mx-auto sm:w-full sm:max-w-md">
        <div className="bg-white py-8 px-6 shadow-xl rounded-3xl border border-[#393636]/10 sm:px-10 space-y-5">
          {submitted ? (
            <div className="text-center space-y-4 py-4">
              <div className="w-12 h-12 rounded-full bg-emerald-100 text-emerald-600 flex items-center justify-center mx-auto">
                <CheckCircle2 className="w-6 h-6" />
              </div>
              <h3 className="text-lg font-bold text-[#393636]">Recovery Link Sent</h3>
              <p className="text-xs text-gray-600">
                We've simulated a secure password reset link sent to <strong>{email}</strong>. Check your inbox and follow the steps.
              </p>
              <button
                onClick={() => navigate('login')}
                className="w-full py-2.5 bg-[#393636] hover:bg-black text-white text-xs font-bold rounded-xl transition-colors"
              >
                Return to Login
              </button>
            </div>
          ) : (
            <form onSubmit={handleReset} className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-[#393636] mb-1">
                  Registered Email Address
                </label>
                <div className="relative">
                  <Mail className="w-4 h-4 text-gray-400 absolute left-3 top-1/2 -translate-y-1/2" />
                  <input
                    type="email"
                    required
                    placeholder="student@tuteach.ai"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="w-full pl-9 pr-3 py-2.5 text-xs sm:text-sm border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#F14C2F]"
                  />
                </div>
              </div>

              <button
                type="submit"
                className="w-full py-3 bg-[#F14C2F] hover:bg-[#d63b20] text-white font-bold text-xs sm:text-sm rounded-xl shadow-md transition-colors flex items-center justify-center gap-2 cursor-pointer"
              >
                Send Password Reset Link
                <ArrowRight className="w-4 h-4" />
              </button>

              <button
                type="button"
                onClick={() => navigate('login')}
                className="w-full text-center text-xs text-gray-500 hover:text-[#393636] flex items-center justify-center gap-1 pt-2"
              >
                <ChevronLeft className="w-3.5 h-3.5" /> Back to Login
              </button>
            </form>
          )}
        </div>
      </div>
    </div>
  );
};
