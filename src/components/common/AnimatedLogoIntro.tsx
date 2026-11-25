import React, { useState, useEffect } from 'react';
import { OFFICIAL_LOGO_URL } from './Logo';
import { Sparkles, ArrowRight } from 'lucide-react';

interface AnimatedLogoIntroProps {
  onComplete: () => void;
  forceShow?: boolean;
}

export const AnimatedLogoIntro: React.FC<AnimatedLogoIntroProps> = ({
  onComplete,
  forceShow = false
}) => {
  const [isVisible, setIsVisible] = useState(true);
  const [isFadingOut, setIsFadingOut] = useState(false);

  useEffect(() => {
    // Check if intro was already seen in this session
    if (!forceShow && typeof window !== 'undefined') {
      try {
        const seen = sessionStorage.getItem('tuteach_intro_seen');
        if (seen === 'true') {
          setIsVisible(false);
          onComplete();
          return;
        }
      } catch {}
    }

    // Auto-transition into homepage after 2.2 seconds
    const fadeTimer = setTimeout(() => {
      setIsFadingOut(true);
    }, 2000);

    const completeTimer = setTimeout(() => {
      try {
        if (typeof window !== 'undefined') {
          sessionStorage.setItem('tuteach_intro_seen', 'true');
        }
      } catch {}
      setIsVisible(false);
      onComplete();
    }, 2600);

    return () => {
      clearTimeout(fadeTimer);
      clearTimeout(completeTimer);
    };
  }, [forceShow]);

  const handleSkip = () => {
    try {
      if (typeof window !== 'undefined') {
        sessionStorage.setItem('tuteach_intro_seen', 'true');
      }
    } catch {}
    setIsFadingOut(true);
    setTimeout(() => {
      setIsVisible(false);
      onComplete();
    }, 250);
  };

  if (!isVisible) return null;

  return (
    <div
      className={`fixed inset-0 z-50 flex flex-col items-center justify-center bg-[#EFEBDA] transition-opacity duration-700 select-none ${
        isFadingOut ? 'opacity-0 pointer-events-none' : 'opacity-100'
      }`}
    >
      {/* Background Soft Glow Auras */}
      <div className="absolute w-96 h-96 rounded-full bg-gradient-to-tr from-[#F14C2F]/25 via-amber-500/15 to-transparent blur-3xl pointer-events-none animate-pulse" />
      <div className="absolute w-80 h-80 rounded-full bg-[#F14C2F]/10 blur-2xl pointer-events-none" />

      {/* Center Animated Logo Lockup */}
      <div className="relative z-10 flex flex-col items-center text-center px-4">
        {/* Glowing circular logo container */}
        <div className="relative mb-6">
          <div className="absolute -inset-3 rounded-full bg-gradient-to-r from-[#F14C2F] to-amber-500 opacity-60 blur-md animate-ping duration-1000" />
          <div className="relative w-32 h-32 sm:w-40 sm:h-40 rounded-full overflow-hidden shadow-2xl bg-white border-4 border-white/80 ring-4 ring-[#F14C2F]/30 flex items-center justify-center transform transition-transform hover:scale-105">
            <img
              src={OFFICIAL_LOGO_URL}
              alt="TUTeach Logo"
              className="w-full h-full object-cover rounded-full"
            />
          </div>
        </div>

        {/* Brand Name */}
        <div className="space-y-2">
          <div className="inline-flex items-center gap-2">
            <h1 className="text-4xl sm:text-5xl font-extrabold tracking-tight text-[#393636]">
              TU<span className="text-[#F14C2F]">TEACH</span>
            </h1>
            <span className="px-2 py-0.5 text-xs font-bold bg-[#F14C2F] text-white rounded-md shadow-xs flex items-center gap-1">
              <Sparkles className="w-3 h-3" /> AI
            </span>
          </div>

          {/* Tagline */}
          <p className="text-base sm:text-lg font-medium text-[#393636]/85 max-w-md mx-auto tracking-tight animate-in fade-in duration-700">
            Learn Anything. Master Everything. With Your Personal AI Teacher.
          </p>
        </div>

        {/* Ambient Loading Indicator */}
        <div className="mt-8 flex items-center gap-2">
          <span className="w-2 h-2 rounded-full bg-[#F14C2F] animate-bounce" style={{ animationDelay: '0ms' }} />
          <span className="w-2 h-2 rounded-full bg-[#F14C2F] animate-bounce" style={{ animationDelay: '150ms' }} />
          <span className="w-2 h-2 rounded-full bg-[#F14C2F] animate-bounce" style={{ animationDelay: '300ms' }} />
        </div>
      </div>

      {/* Skip Button */}
      <button
        onClick={handleSkip}
        className="absolute bottom-8 right-8 z-20 px-4 py-2 bg-white/80 hover:bg-white text-xs font-bold text-[#393636] border border-[#393636]/15 rounded-full shadow-xs hover:border-[#F14C2F] transition-all flex items-center gap-1.5 cursor-pointer"
      >
        <span>Enter TUTeach</span>
        <ArrowRight className="w-3.5 h-3.5 text-[#F14C2F]" />
      </button>
    </div>
  );
};
