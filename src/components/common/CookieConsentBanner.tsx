import React, { useState, useEffect } from 'react';
import { useApp } from '../../context/AppContext';
import { Cookie, ShieldCheck, X, Lock } from 'lucide-react';

export const CookieConsentBanner: React.FC = () => {
  const {
    user,
    cookiePreferences,
    isCookieModalOpen,
    setIsCookieModalOpen,
    updateCookiePreferences,
    navigate
  } = useApp();

  const [functional, setFunctional] = useState(true);
  const [analytics, setAnalytics] = useState(false);
  const [advertising, setAdvertising] = useState(false);
  const [saving, setSaving] = useState(false);
  const [feedback, setFeedback] = useState('');

  const isMinor = Boolean(user?.isMinor);

  useEffect(() => {
    if (cookiePreferences) {
      setFunctional(cookiePreferences.functional);
      setAnalytics(cookiePreferences.analytics);
      setAdvertising(isMinor ? false : cookiePreferences.advertising);
    }
  }, [cookiePreferences, isMinor, isCookieModalOpen]);

  const handleSave = async (customPrefs?: { functional: boolean; analytics: boolean; advertising: boolean }) => {
    setSaving(true);
    setFeedback('');
    const target = customPrefs || {
      functional,
      analytics,
      advertising: isMinor ? false : advertising
    };
    const res = await updateCookiePreferences(target);
    setSaving(false);
    if (!res.ok) {
      setFeedback(res.error || 'Could not update preferences.');
    } else {
      setIsCookieModalOpen(false);
    }
  };

  return (
    <>
      {/* Initial unobtrusive consent bar if user has not made a cookie selection yet */}
      {!cookiePreferences && !isCookieModalOpen && (
        <div className="fixed bottom-4 left-4 right-4 z-50 max-w-4xl mx-auto bg-[#393636] text-[#EFEBDA] rounded-2xl shadow-2xl border border-white/10 p-4 sm:p-5 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div className="space-y-1 text-xs">
            <div className="font-bold flex items-center gap-2 text-white">
              <Cookie className="w-4 h-4 text-[#F14C2F]" />
              Privacy &amp; Cookie Choices
            </div>
            <p className="text-[#EFEBDA]/85 leading-relaxed">
              TUTeach uses strictly essential session cookies for authentication and checkout security. Optional analytics remain OFF unless enabled, and advertising tracking is disabled for minors. Read our{' '}
              <button
                type="button"
                onClick={() => navigate('cookie-policy')}
                className="underline text-white font-semibold"
              >
                Cookie Policy
              </button>
              .
            </p>
          </div>
          <div className="flex flex-wrap items-center gap-2 shrink-0">
            <button
              type="button"
              onClick={() => setIsCookieModalOpen(true)}
              className="px-3 py-2 rounded-xl border border-white/25 text-xs font-bold hover:bg-white/10 cursor-pointer"
            >
              Manage Preferences
            </button>
            <button
              type="button"
              disabled={saving}
              onClick={() => handleSave({ functional: true, analytics: false, advertising: false })}
              className="px-3.5 py-2 rounded-xl bg-white/15 hover:bg-white/25 text-white text-xs font-bold cursor-pointer"
            >
              Essential Only
            </button>
            <button
              type="button"
              disabled={saving}
              onClick={() => handleSave({ functional: true, analytics: true, advertising: false })}
              className="px-4 py-2 rounded-xl bg-[#F14C2F] hover:bg-[#d63b20] text-white text-xs font-bold cursor-pointer"
            >
              Accept Selected
            </button>
          </div>
        </div>
      )}

      {/* Detailed Categorized Preference Center Modal */}
      {isCookieModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-lg w-full p-6 sm:p-7 border border-[#393636]/15 shadow-2xl space-y-5">
            <div className="flex items-center justify-between border-b border-gray-100 pb-3">
              <div className="flex items-center gap-2">
                <ShieldCheck className="w-5 h-5 text-[#F14C2F]" />
                <h2 className="text-lg font-extrabold text-[#393636]">Cookie Preference Center</h2>
              </div>
              <button
                type="button"
                onClick={() => setIsCookieModalOpen(false)}
                className="p-1.5 rounded-lg hover:bg-gray-100 text-gray-500 cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {feedback && (
              <div className="p-2.5 bg-red-50 text-red-700 border border-red-200 rounded-xl text-xs font-medium">
                {feedback}
              </div>
            )}

            <div className="space-y-3 text-xs">
              <div className="p-3.5 bg-[#EFEBDA]/60 rounded-2xl border border-[#393636]/10 flex items-start justify-between gap-3">
                <div>
                  <div className="font-bold text-[#393636] flex items-center gap-1.5">
                    <Lock className="w-3.5 h-3.5 text-emerald-700" />
                    Strictly Necessary / Essential Cookies
                  </div>
                  <p className="text-gray-600 mt-0.5">
                    Required for HttpOnly session auth, CSRF protection, age-gating, and Razorpay checkout verification. Cannot be disabled.
                  </p>
                </div>
                <span className="px-2 py-1 bg-emerald-100 text-emerald-800 font-bold rounded text-[10px]">ALWAYS ON</span>
              </div>

              <label className="p-3.5 bg-gray-50 rounded-2xl border border-gray-200 flex items-start justify-between gap-3 cursor-pointer">
                <div>
                  <div className="font-bold text-[#393636]">Functional Preferences</div>
                  <p className="text-gray-600 mt-0.5">
                    Remembers English vs Hinglish AI classroom language preference and UI selections.
                  </p>
                </div>
                <input
                  type="checkbox"
                  checked={functional}
                  onChange={(e) => setFunctional(e.target.checked)}
                  className="mt-1 accent-[#F14C2F]"
                />
              </label>

              <label className="p-3.5 bg-gray-50 rounded-2xl border border-gray-200 flex items-start justify-between gap-3 cursor-pointer">
                <div>
                  <div className="font-bold text-[#393636]">Analytics Cookies (Optional)</div>
                  <p className="text-gray-600 mt-0.5">
                    Helps improve DaVinci Resolve lesson pacing. Off by default and withdrawable anytime.
                  </p>
                </div>
                <input
                  type="checkbox"
                  checked={analytics}
                  onChange={(e) => setAnalytics(e.target.checked)}
                  className="mt-1 accent-[#F14C2F]"
                />
              </label>

              <label className={`p-3.5 rounded-2xl border flex items-start justify-between gap-3 ${isMinor ? 'bg-gray-100 border-gray-200 opacity-75 cursor-not-allowed' : 'bg-gray-50 border-gray-200 cursor-pointer'}`}>
                <div>
                  <div className="font-bold text-[#393636]">
                    Advertising &amp; Behavioral Tracking {isMinor && '(Locked OFF for Minors)'}
                  </div>
                  <p className="text-gray-600 mt-0.5">
                    TUTeach does not serve third-party behavioral ads to children or minors. Disabled by default.
                  </p>
                </div>
                <input
                  type="checkbox"
                  disabled={isMinor}
                  checked={isMinor ? false : advertising}
                  onChange={(e) => setAdvertising(e.target.checked)}
                  className="mt-1 accent-[#F14C2F]"
                />
              </label>
            </div>

            <div className="flex items-center justify-between gap-2 pt-2 border-t border-gray-100">
              <button
                type="button"
                onClick={() => {
                  setIsCookieModalOpen(false);
                  navigate('cookie-policy');
                }}
                className="text-xs text-[#F14C2F] font-semibold underline cursor-pointer"
              >
                Full Cookie Policy
              </button>
              <div className="flex gap-2">
                <button
                  type="button"
                  disabled={saving}
                  onClick={() => handleSave({ functional: true, analytics: false, advertising: false })}
                  className="px-3.5 py-2 border border-gray-300 rounded-xl text-xs font-bold text-[#393636] cursor-pointer"
                >
                  Reject Optional
                </button>
                <button
                  type="button"
                  disabled={saving}
                  onClick={() => handleSave()}
                  className="px-4 py-2 bg-[#F14C2F] hover:bg-[#d63b20] text-white rounded-xl text-xs font-bold cursor-pointer"
                >
                  {saving ? 'Saving...' : 'Save Preferences'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  );
};
