import React, { useState, useEffect, useRef, useCallback } from 'react';
import { useApp } from '../../context/AppContext';
import { TUTeachLogo } from '../common/Logo';
import {
  Mic,
  MicOff,
  Volume2,
  Clock,
  Sparkles,
  ArrowRight,
  UserPlus,
  LogIn,
  AlertCircle,
  X,
  Send,
  RotateCcw,
  ShieldAlert,
  Flag
} from 'lucide-react';

export const DemoClassroomPage: React.FC = () => {
  const { navigate, languageMode, user } = useApp();

  // 5-minute demo countdown (300 seconds)
  const [secondsRemaining, setSecondsRemaining] = useState<number>(300);
  const [isDemoExpired, setIsDemoExpired] = useState<boolean>(false);
  const [sessionId, setSessionId] = useState<string>('');

  // Call States
  const [callState, setCallState] = useState<'idle' | 'listening' | 'thinking' | 'speaking'>('idle');
  const [volumeLevel, setVolumeLevel] = useState<number>(0);
  const [currentSubtitle, setCurrentSubtitle] = useState<string>('');
  const [visitorName, setVisitorName] = useState<string>('');
  const [isMuted, setIsMuted] = useState<boolean>(false);
  const [textInput, setTextInput] = useState<string>('');
  const [micError, setMicError] = useState<string | null>(null);
  const [demoAiAccepted, setDemoAiAccepted] = useState<boolean>(() => Boolean(user?.aiDisclosureAcceptedAt));
  const [safetyNotice, setSafetyNotice] = useState<string | null>(null);
  const [lastTutorReply, setLastTutorReply] = useState<string>('');
  const [reportModalOpen, setReportModalOpen] = useState<boolean>(false);
  const [reportReason, setReportReason] = useState<string>('Inaccurate or inappropriate AI response');
  const [reportTicketCode, setReportTicketCode] = useState<string | null>(null);
  const [isReporting, setIsReporting] = useState<boolean>(false);

  // References
  const recognitionRef = useRef<any>(null);
  const silenceTimerRef = useRef<any>(null);
  const isSubmittingRef = useRef<boolean>(false);
  const currentTranscriptRef = useRef<string>('');
  const callStateRef = useRef(callState);
  callStateRef.current = callState;
  const isMutedRef = useRef(isMuted);
  isMutedRef.current = isMuted;
  const isExpiredRef = useRef(isDemoExpired);
  isExpiredRef.current = isDemoExpired;
  const volumeIntervalRef = useRef<any>(null);

  const startListeningRef = useRef<() => void>(() => {});
  const speakAIResponseRef = useRef<(text: string) => void>(() => {});

  // Initialize or fetch server demo session
  useEffect(() => {
    let isMounted = true;
    fetch('/api/demo/session', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ visitorName })
    })
      .then((res) => res.json())
      .then((data) => {
        if (!isMounted) return;
        if (data.sessionId) setSessionId(data.sessionId);
        if (typeof data.remainingSeconds === 'number') {
          setSecondsRemaining(data.remainingSeconds);
          if (data.remainingSeconds <= 0) {
            setIsDemoExpired(true);
          }
        }
      })
      .catch((err) => console.warn('Could not initialize demo session:', err));

    return () => {
      isMounted = false;
    };
  }, []);

  // 1-second interval countdown timer
  useEffect(() => {
    if (isDemoExpired) return;

    const timer = setInterval(() => {
      setSecondsRemaining((prev) => {
        if (prev <= 1) {
          clearInterval(timer);
          setIsDemoExpired(true);
          if ('speechSynthesis' in window) {
            window.speechSynthesis.cancel();
          }
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(timer);
  }, [isDemoExpired]);

  const formatTime = (secs: number) => {
    const m = Math.floor(secs / 60);
    const s = secs % 60;
    return `${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
  };

  // Stop AI speech
  const stopAISpeech = useCallback((switchToListening = true) => {
    if ('speechSynthesis' in window) {
      window.speechSynthesis.cancel();
    }
    if (volumeIntervalRef.current) {
      clearInterval(volumeIntervalRef.current);
      volumeIntervalRef.current = null;
    }
    setVolumeLevel(0);
    if (switchToListening && !isExpiredRef.current) {
      callStateRef.current = 'listening';
      setCallState('listening');
    }
  }, []);

  // Speech synthesis implementation (smooth, natural, 0.88 rate)
  const speakAIResponse = useCallback(
    (text: string) => {
      if (isExpiredRef.current) return;

      if (!('speechSynthesis' in window)) {
        setCurrentSubtitle(text);
        setCallState('idle');
        return;
      }

      stopAISpeech(false);
      callStateRef.current = 'speaking';
      setCallState('speaking');

      const cleanSpoken = text
        .replace(/```[\s\S]*?```/g, '')
        .replace(/[*_#`]/g, '')
        .trim();

      const utterance = new SpeechSynthesisUtterance(cleanSpoken);
      utterance.rate = 0.88; // Slow, smooth, natural delivery without hang cuts
      utterance.pitch = 1.0;
      utterance.volume = 1.0;

      if (languageMode === 'hindi_hinglish') {
        utterance.lang = 'hi-IN';
      } else {
        utterance.lang = 'en-US';
      }

      utterance.onstart = () => {
        setCallState('speaking');
        setCurrentSubtitle(text);
        // Pause recognition while speaking to prevent acoustic feedback
        if (recognitionRef.current) {
          try {
            recognitionRef.current.onend = null;
            recognitionRef.current.abort();
          } catch {}
          recognitionRef.current = null;
        }
        currentTranscriptRef.current = '';

        if (volumeIntervalRef.current) clearInterval(volumeIntervalRef.current);
        volumeIntervalRef.current = setInterval(() => {
          setVolumeLevel(0.4 + Math.random() * 0.5);
        }, 120);
      };

      utterance.onend = () => {
        if (volumeIntervalRef.current) clearInterval(volumeIntervalRef.current);
        setVolumeLevel(0);
        if (callStateRef.current === 'speaking' && !isExpiredRef.current && !isSubmittingRef.current) {
          callStateRef.current = 'listening';
          setCallState('listening');
          startListeningRef.current();
        }
      };

      utterance.onerror = () => {
        if (volumeIntervalRef.current) clearInterval(volumeIntervalRef.current);
        setVolumeLevel(0);
        if (!isExpiredRef.current) {
          callStateRef.current = 'listening';
          setCallState('listening');
          startListeningRef.current();
        }
      };

      window.speechSynthesis.speak(utterance);
    },
    [languageMode, stopAISpeech]
  );
  speakAIResponseRef.current = speakAIResponse;

  // Send message to demo endpoint
  const sendStudentMessageToAI = useCallback(
    async (text: string) => {
      const trimmed = text.trim();
      if (!trimmed || isSubmittingRef.current || isExpiredRef.current) return;
      isSubmittingRef.current = true;

      stopAISpeech(false);
      callStateRef.current = 'thinking';
      setCallState('thinking');
      setCurrentSubtitle(trimmed);

      try {
        const response = await fetch('/api/demo/chat', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            message: trimmed,
            sessionId,
            visitorName,
            languageMode
          })
        });

        const data = await response.json();

        if (Array.isArray(data.redactedPii) && data.redactedPii.length > 0) {
          setSafetyNotice(
            `Safety filter: Sensitive info (${data.redactedPii.join(', ')}) was automatically masked before AI processing.`
          );
        }

        if (data.expired) {
          setIsDemoExpired(true);
          speakAIResponseRef.current(data.reply || "Your 5-minute free demo has concluded!");
          return;
        }

        const reply = data.reply || (languageMode === 'hindi_hinglish'
          ? "Aapka sawaal bilkul clear hai. Main turant madad ke liye taiyar hoon!"
          : "I hear you loud and clear. Ask me anything about video editing!");

        setLastTutorReply(reply);
        speakAIResponseRef.current(reply);
      } catch (err) {
        console.warn('Demo chat error:', err);
        const fallback = languageMode === 'hindi_hinglish'
          ? "Main sun raha hoon! Aap DaVinci Resolve ya video editing ka koi bhi sawaal pooch sakte hain."
          : "I can hear you clearly! Feel free to ask any question about DaVinci Resolve or video editing.";
        speakAIResponseRef.current(fallback);
      } finally {
        isSubmittingRef.current = false;
      }
    },
    [languageMode, sessionId, stopAISpeech, visitorName]
  );

  // Initialize Speech Recognition
  const startListening = useCallback(() => {
    if (isMutedRef.current || isExpiredRef.current) return;
    if (callStateRef.current === 'speaking' || callStateRef.current === 'thinking') return;

    const SpeechRecognition =
      (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;

    if (!SpeechRecognition) {
      setMicError('Speech recognition is not supported in this browser. You can type questions below.');
      return;
    }

    if (recognitionRef.current) {
      try {
        recognitionRef.current.onend = null;
        recognitionRef.current.abort();
      } catch {}
      recognitionRef.current = null;
    }

    try {
      const recognition = new SpeechRecognition();
      recognition.continuous = true;
      recognition.interimResults = true;
      recognition.lang = languageMode === 'hindi_hinglish' ? 'hi-IN' : 'en-US';

      recognition.onstart = () => {
        setMicError(null);
        if (callStateRef.current !== 'speaking' && callStateRef.current !== 'thinking') {
          setCallState('listening');
        }
      };

      recognition.onspeechstart = () => {
        // Immediate student interruption: stop teacher playback instantly
        if (callStateRef.current === 'speaking' || (typeof window !== 'undefined' && 'speechSynthesis' in window && window.speechSynthesis.speaking)) {
          stopAISpeech(true);
        }
      };

      recognition.onresult = (event: any) => {
        // If student talks while AI is speaking, interrupt playback immediately!
        if (callStateRef.current === 'speaking' || (typeof window !== 'undefined' && 'speechSynthesis' in window && window.speechSynthesis.speaking)) {
          stopAISpeech(true);
        }
        if (callStateRef.current === 'thinking') return;

        let full = '';
        for (let i = 0; i < event.results.length; ++i) {
          full += event.results[i][0].transcript + ' ';
        }

        const trimmed = full.trim();
        if (trimmed) {
          currentTranscriptRef.current = trimmed;
          setCurrentSubtitle(trimmed);

          if (silenceTimerRef.current) clearTimeout(silenceTimerRef.current);
          silenceTimerRef.current = setTimeout(() => {
            if (currentTranscriptRef.current.trim().length >= 2 && !isSubmittingRef.current) {
              const toSend = currentTranscriptRef.current;
              currentTranscriptRef.current = '';
              sendStudentMessageToAI(toSend);
            }
          }, 500);
        }
      };

      recognition.onerror = (event: any) => {
        if (event.error === 'not-allowed') {
          setMicError('Microphone permission denied. Enable microphone in browser or type below.');
        }
      };

      recognition.onend = () => {
        if (
          !isMutedRef.current &&
          !isExpiredRef.current &&
          callStateRef.current === 'listening' &&
          !isSubmittingRef.current
        ) {
          setTimeout(() => {
            if (!isMutedRef.current && !isExpiredRef.current && callStateRef.current === 'listening') {
              startListeningRef.current();
            }
          }, 150);
        }
      };

      recognition.start();
      recognitionRef.current = recognition;
    } catch (e) {
      console.warn('Failed to start speech recognition:', e);
    }
  }, [languageMode, sendStudentMessageToAI]);
  startListeningRef.current = startListening;

  // TEACHER SPEAKS FIRST ON DEMO LAUNCH AFTER DISCLOSURE NOTICE ACCEPTED
  useEffect(() => {
    if (!demoAiAccepted) return;
    const greetingTimer = setTimeout(() => {
      const isHindi = languageMode === 'hindi_hinglish';
      const welcome = isHindi
        ? "Namaste! Welcome to TUTeach. Main aapka personal AI teacher hoon! Is 5-minute ke preview session ko shuru karne se pehle, aapka shubh naam kya hai?"
        : "Hello! Welcome to TUTeach. I'm your personal AI teacher! Before we begin our 5-minute preview session, what's your name?";

      setLastTutorReply(welcome);
      speakAIResponseRef.current(welcome);
    }, 400);

    return () => {
      clearTimeout(greetingTimer);
      stopAISpeech();
      if (recognitionRef.current) {
        try {
          recognitionRef.current.abort();
        } catch {}
      }
      if (silenceTimerRef.current) clearTimeout(silenceTimerRef.current);
    };
  }, [languageMode, stopAISpeech, demoAiAccepted]);

  // Handle Mute toggle
  const toggleMute = () => {
    if (isMuted) {
      setIsMuted(false);
      isMutedRef.current = false;
      startListening();
    } else {
      setIsMuted(true);
      isMutedRef.current = true;
      if (recognitionRef.current) {
        try {
          recognitionRef.current.abort();
        } catch {}
      }
      setCallState('idle');
    }
  };

  const handleTextSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!textInput.trim() || isDemoExpired) return;
    sendStudentMessageToAI(textInput.trim());
    setTextInput('');
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-[#18181B] via-[#202024] to-[#121214] text-white flex flex-col relative select-none">
      {/* Top Banner: 5-Minute Timer & Session Status */}
      <header className="px-4 py-3 bg-black/60 backdrop-blur-md border-b border-white/10 flex items-center justify-between z-30">
        <div className="flex items-center gap-3">
          <TUTeachLogo size="sm" />
          <span className="hidden sm:inline-block text-xs font-bold text-white/80 border-l border-white/15 pl-3">
            Free AI Teacher Preview Demo
          </span>
        </div>

        {/* 5-Minute Countdown Pill */}
        <div className="flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-[#F14C2F]/20 border border-[#F14C2F]/40 shadow-inner">
          <Clock className="w-4 h-4 text-[#F14C2F] animate-pulse" />
          <span className="font-mono text-sm sm:text-base font-extrabold tracking-wider text-white">
            {formatTime(secondsRemaining)}
          </span>
          <span className="text-[10px] uppercase font-bold text-white/60 hidden sm:inline">
            Remaining
          </span>
        </div>

        {/* Exit to Home */}
        <button
          onClick={() => navigate('home')}
          className="text-xs font-semibold text-white/70 hover:text-white px-3 py-1.5 rounded-lg border border-white/10 hover:bg-white/10 transition-colors cursor-pointer"
        >
          Exit Demo
        </button>
      </header>

      {/* Main Classroom Demo Stage */}
      <main className="flex-1 flex flex-col items-center justify-center p-4 sm:p-8 relative overflow-hidden">
        {/* Ambient Halo */}
        <div className="absolute w-96 h-96 rounded-full bg-[#F14C2F]/15 blur-3xl pointer-events-none" />

        <div className="relative z-10 flex flex-col items-center text-center space-y-6 max-w-xl mx-auto">
          {/* Logo Sound Visualizer Orb */}
          <div
            onClick={() => {
              if (callState === 'speaking') {
                stopAISpeech();
                startListening();
              } else {
                startListening();
              }
            }}
            className="relative cursor-pointer group"
            title="Click to speak or interrupt AI teacher"
          >
            {/* Visualizer Aura Waves */}
            <div
              className={`absolute -inset-4 rounded-full transition-all duration-300 pointer-events-none ${
                callState === 'speaking'
                  ? 'bg-[#F14C2F]/30 animate-ping'
                  : callState === 'listening'
                  ? 'bg-emerald-500/20 animate-pulse'
                  : 'bg-white/5'
              }`}
            />
            <div
              className={`absolute -inset-8 rounded-full transition-all duration-500 pointer-events-none ${
                callState === 'speaking'
                  ? 'bg-[#F14C2F]/20 animate-pulse'
                  : 'opacity-0'
              }`}
            />

            <div className="relative w-40 h-40 sm:w-48 sm:h-48 rounded-full bg-white p-2 shadow-2xl ring-4 ring-white/10 group-hover:scale-105 transition-transform flex items-center justify-center">
              <TUTeachLogo size="phoneCall" callState={callState} volumeLevel={volumeLevel} />
            </div>
          </div>

          {/* Call Status Badge */}
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white/10 border border-white/10 text-xs font-semibold">
            <span
              className={`w-2 h-2 rounded-full ${
                callState === 'speaking'
                  ? 'bg-[#F14C2F] animate-ping'
                  : callState === 'listening'
                  ? 'bg-emerald-400 animate-pulse'
                  : callState === 'thinking'
                  ? 'bg-amber-400 animate-spin'
                  : 'bg-zinc-400'
              }`}
            />
            <span>
              {callState === 'speaking'
                ? 'TUTutor is speaking...'
                : callState === 'listening'
                ? 'Listening to you... (Speak freely)'
                : callState === 'thinking'
                ? 'Thinking...'
                : 'Tap orb or microphone to speak'}
            </span>
          </div>

          {/* Safety / PII Redaction Notice */}
          {safetyNotice && (
            <div className="w-full px-4 py-2 rounded-xl bg-[#F14C2F]/20 border border-[#F14C2F]/40 text-xs text-[#EFEBDA] flex items-center justify-between gap-2">
              <span>{safetyNotice}</span>
              <button
                type="button"
                onClick={() => setSafetyNotice(null)}
                className="text-white/70 hover:text-white cursor-pointer"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            </div>
          )}

          {/* Subtitles Screen */}
          <div className="w-full min-h-[90px] px-6 py-4 rounded-2xl bg-black/40 border border-white/10 backdrop-blur-md flex flex-col items-center justify-center gap-2">
            <p className="text-sm sm:text-base font-medium text-white/95 leading-relaxed">
              {currentSubtitle || "Welcome to the 5-minute interactive preview. Speak to your AI teacher naturally!"}
            </p>
            {lastTutorReply && (
              <button
                type="button"
                onClick={() => {
                  setReportTicketCode(null);
                  setReportModalOpen(true);
                }}
                className="inline-flex items-center gap-1 text-[11px] text-amber-300/80 hover:text-amber-200 cursor-pointer"
              >
                <Flag className="w-3 h-3" />
                <span>Report AI Response</span>
              </button>
            )}
          </div>

          {/* Quick Starter Chips */}
          <div className="flex flex-wrap items-center justify-center gap-2 text-xs">
            {[
              "What is DaVinci Resolve?",
              "How do I install the free version?",
              "What are the best beginner shortcuts?",
              "How does TUTeach evaluate tasks?"
            ].map((chip) => (
              <button
                key={chip}
                onClick={() => sendStudentMessageToAI(chip)}
                className="px-3 py-1.5 rounded-full bg-white/10 hover:bg-[#F14C2F]/20 hover:border-[#F14C2F] border border-white/10 text-white/80 hover:text-white transition-all cursor-pointer text-[11px]"
              >
                {chip}
              </button>
            ))}
          </div>
        </div>
      </main>

      {/* Mic & Text Input Controls */}
      <footer className="p-4 bg-black/60 border-t border-white/10 z-30">
        <div className="max-w-2xl mx-auto flex flex-col sm:flex-row items-center gap-3">
          {/* Mic Toggle Button */}
          <button
            onClick={toggleMute}
            className={`w-full sm:w-auto px-5 py-2.5 rounded-xl text-xs font-bold flex items-center justify-center gap-2 transition-all cursor-pointer ${
              isMuted
                ? 'bg-zinc-800 text-zinc-400 border border-zinc-700'
                : 'bg-[#F14C2F] hover:bg-[#d83c21] text-white shadow-lg'
            }`}
          >
            {isMuted ? <MicOff className="w-4 h-4" /> : <Mic className="w-4 h-4" />}
            <span>{isMuted ? 'Microphone Muted' : 'Microphone Active'}</span>
          </button>

          {/* Text Input Form for no-mic fallback */}
          <form onSubmit={handleTextSubmit} className="flex-1 flex items-center gap-2 w-full">
            <input
              type="text"
              value={textInput}
              onChange={(e) => setTextInput(e.target.value)}
              placeholder="Or type a question to your AI teacher..."
              disabled={isDemoExpired}
              className="flex-1 px-4 py-2.5 rounded-xl bg-white/10 border border-white/15 text-xs text-white placeholder-white/40 focus:outline-hidden focus:border-[#F14C2F]"
            />
            <button
              type="submit"
              disabled={!textInput.trim() || isDemoExpired}
              className="px-4 py-2.5 bg-[#F14C2F] hover:bg-[#d83c21] disabled:opacity-50 text-white rounded-xl text-xs font-bold transition-all cursor-pointer flex items-center gap-1.5"
            >
              <Send className="w-3.5 h-3.5" />
            </button>
          </form>
        </div>
      </footer>

      {/* Demo Expiration Modal (Compulsory Account Gate) */}
      {isDemoExpired && (
        <div className="fixed inset-0 z-50 bg-black/85 backdrop-blur-md flex items-center justify-center p-4">
          <div className="w-full max-w-md bg-[#FAF7EE] text-[#393636] rounded-3xl p-8 shadow-2xl border-2 border-[#F14C2F]/30 text-center space-y-6 animate-in zoom-in-95 duration-200">
            <div className="w-16 h-16 rounded-full bg-[#F14C2F]/10 text-[#F14C2F] mx-auto flex items-center justify-center shadow-inner">
              <Sparkles className="w-8 h-8" />
            </div>

            <div className="space-y-2">
              <h3 className="text-2xl font-extrabold tracking-tight text-[#393636]">
                Enjoyed Learning with Your AI Teacher?
              </h3>
              <p className="text-sm text-[#393636]/80 leading-relaxed">
                Create your account to start your personalised learning journey with full course access, practical assignments, AI evaluations, and verified certificates.
              </p>
            </div>

            <div className="space-y-3 pt-2">
              <button
                onClick={() => navigate('register')}
                className="w-full py-3.5 px-6 rounded-xl bg-[#F14C2F] hover:bg-[#d83c21] text-white font-bold text-sm shadow-md hover:shadow-lg transition-all flex items-center justify-center gap-2 cursor-pointer"
              >
                <UserPlus className="w-4 h-4" />
                <span>Create Free Account</span>
              </button>

              <button
                onClick={() => navigate('login')}
                className="w-full py-3 px-6 rounded-xl bg-white hover:bg-gray-50 border border-[#393636]/15 text-[#393636] font-bold text-sm transition-all flex items-center justify-center gap-2 cursor-pointer"
              >
                <LogIn className="w-4 h-4 text-[#F14C2F]" />
                <span>Already Have an Account? Login</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Pre-Use AI Transparency & Safety Notice Modal for Demo */}
      {!demoAiAccepted && (
        <div className="fixed inset-0 z-50 bg-black/85 backdrop-blur-md flex items-center justify-center p-4">
          <div className="w-full max-w-lg bg-[#FAF7EE] text-[#393636] rounded-3xl p-6 sm:p-8 shadow-2xl border-2 border-[#F14C2F]/30 space-y-5">
            <div className="flex items-center gap-3">
              <div className="w-11 h-11 rounded-2xl bg-[#F14C2F]/10 text-[#F14C2F] flex items-center justify-center shrink-0">
                <ShieldAlert className="w-6 h-6" />
              </div>
              <div>
                <span className="text-[10px] font-bold uppercase tracking-wider text-[#F14C2F]">
                  AI Transparency & Child Safety Notice
                </span>
                <h3 className="text-lg sm:text-xl font-bold text-[#393636]">
                  5-Minute Free AI Demo Preview
                </h3>
              </div>
            </div>

            <div className="space-y-2 text-xs sm:text-sm text-[#393636]/85 bg-white p-4 rounded-2xl border border-[#393636]/10">
              <p>
                <strong>Automated AI Teacher:</strong> TUTutor is an AI system powered by Google Gemini APIs — not a human instructor. AI explanations may occasionally contain errors.
              </p>
              <p>
                <strong>Protect Your Privacy:</strong> Do not share passwords, phone numbers, home addresses, bank/UPI PINs, or sensitive personal data in voice or chat.
              </p>
              <p>
                <strong>Under-Age Learners:</strong> Full accounts for minors require verified parent or legal guardian consent before personalized classroom features or payments.
              </p>
            </div>

            <div className="flex flex-col sm:flex-row items-center justify-between gap-3">
              <button
                type="button"
                onClick={() => navigate('ai-disclosure')}
                className="text-xs font-semibold text-[#393636]/75 hover:text-[#F14C2F] underline cursor-pointer"
              >
                Read Full AI Disclosure
              </button>
              <div className="flex items-center gap-2 w-full sm:w-auto">
                <button
                  type="button"
                  onClick={() => navigate('home')}
                  className="flex-1 sm:flex-none px-4 py-2.5 bg-white border border-[#393636]/20 text-[#393636] text-xs font-bold rounded-xl cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  onClick={() => setDemoAiAccepted(true)}
                  className="flex-1 sm:flex-none px-5 py-2.5 bg-[#F14C2F] hover:bg-[#d63b20] text-white text-xs font-bold rounded-xl shadow-md cursor-pointer"
                >
                  I Understand & Start Demo
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Report AI Response Modal */}
      {reportModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-md flex items-center justify-center p-4">
          <div className="w-full max-w-md bg-[#FAF7EE] text-[#393636] rounded-3xl p-6 shadow-2xl border border-[#393636]/15 space-y-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Flag className="w-5 h-5 text-[#F14C2F]" />
                <h3 className="font-bold text-base">Report AI Demo Response</h3>
              </div>
              <button
                type="button"
                onClick={() => setReportModalOpen(false)}
                className="p-1 text-[#393636]/60 hover:text-[#393636] cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {reportTicketCode ? (
              <div className="space-y-3">
                <div className="p-4 bg-emerald-50 border border-emerald-200 rounded-2xl text-xs text-emerald-900 space-y-1">
                  <p className="font-bold">Safety Report Submitted</p>
                  <p>
                    Grievance Reference Code: <strong className="font-mono">{reportTicketCode}</strong>
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() => setReportModalOpen(false)}
                  className="w-full py-2.5 bg-[#393636] text-white text-xs font-bold rounded-xl cursor-pointer"
                >
                  Close
                </button>
              </div>
            ) : (
              <form
                onSubmit={async (e) => {
                  e.preventDefault();
                  setIsReporting(true);
                  try {
                    const token = typeof window !== 'undefined' ? localStorage.getItem('tuteach_auth_token') : null;
                    const res = await fetch('/api/compliance/report-ai-response', {
                      method: 'POST',
                      headers: {
                        'Content-Type': 'application/json',
                        ...(token ? { Authorization: `Bearer ${token}` } : {})
                      },
                      body: JSON.stringify({
                        messageText: lastTutorReply,
                        reason: reportReason
                      })
                    });
                    const data = await res.json();
                    if (res.ok && data.referenceCode) {
                      setReportTicketCode(data.referenceCode);
                    }
                  } finally {
                    setIsReporting(false);
                  }
                }}
                className="space-y-3"
              >
                <div className="p-3 bg-white rounded-xl border border-[#393636]/10 text-xs text-[#393636]/80 max-h-24 overflow-y-auto">
                  "{lastTutorReply.slice(0, 220)}"
                </div>
                <select
                  value={reportReason}
                  onChange={(e) => setReportReason(e.target.value)}
                  className="w-full px-3 py-2 bg-white border border-[#393636]/20 rounded-xl text-xs text-[#393636]"
                >
                  <option>Inaccurate or inappropriate AI response</option>
                  <option>Unsafe or concerning guidance</option>
                  <option>Requested personal or sensitive details</option>
                </select>
                <div className="flex justify-end gap-2">
                  <button
                    type="button"
                    onClick={() => setReportModalOpen(false)}
                    className="px-4 py-2 text-xs font-semibold text-[#393636]/70 cursor-pointer"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={isReporting}
                    className="px-4 py-2 bg-[#F14C2F] text-white text-xs font-bold rounded-xl cursor-pointer"
                  >
                    {isReporting ? 'Submitting...' : 'Submit Report'}
                  </button>
                </div>
              </form>
            )}
          </div>
        </div>
      )}
    </div>
  );
};
