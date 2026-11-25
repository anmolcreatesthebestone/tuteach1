import React, { useState, useEffect, useRef, useCallback } from 'react';
import { useApp } from '../../context/AppContext';
import { COURSES_DATA } from '../../data/coursesData';
import { TUTeachLogo } from '../common/Logo';
import { AssignmentLab } from '../classroom/AssignmentLab';
import { CertificateModal } from '../certificate/CertificateModal';
import { ClassroomLockedGate } from '../classroom/ClassroomLockedGate';
import {
  Mic,
  MicOff,
  PhoneOff,
  PhoneCall,
  Volume2,
  VolumeX,
  Languages,
  Keyboard,
  Send,
  X,
  FileText,
  BookOpen,
  Award,
  ChevronLeft,
  ChevronRight,
  Sparkles,
  CheckCircle2,
  Clock,
  Layers,
  RotateCcw,
  AlertCircle,
  Activity,
  Sliders,
  Copy,
  Check,
  MessageSquare,
  Camera,
  Upload,
  Maximize2,
  ZoomIn,
  ShieldAlert,
  Flag,
  Info
} from 'lucide-react';

export const ClassroomPage: React.FC = () => {
  const {
    selectedCourseId,
    selectedLessonId,
    completedLessonIds,
    toggleLessonCompletion,
    certificates,
    checkAndAwardCertificate,
    activeCertificate,
    setActiveCertificate,
    languageMode,
    setLanguageMode,
    navigate,
    user,
    hasPaidForCourse,
    refreshCurrentUser
  } = useApp();

  // Course and Lesson Data
  const course = COURSES_DATA.find((c) => c.id === selectedCourseId) || COURSES_DATA[0];
  const allLessons = course.modules.flatMap((m) => m.lessons);
  const currentLesson = allLessons.find((l) => l.id === selectedLessonId) || allLessons[0];
  const currentLessonIndex = allLessons.findIndex((l) => l.id === currentLesson.id);

  // Call States
  const [callActive, setCallActive] = useState(true);
  const [callState, setCallState] = useState<'idle' | 'listening' | 'thinking' | 'speaking'>('idle');
  const [callDuration, setCallDuration] = useState(0);
  const [isMuted, setIsMuted] = useState(false);
  const [volumeLevel, setVolumeLevel] = useState(0);

  // Subtitles & Speaker
  const [activeSpeaker, setActiveSpeaker] = useState<'tutor' | 'student'>('tutor');
  const [currentSubtitle, setCurrentSubtitle] = useState<string>('');
  const [lastTutorSpeech, setLastTutorSpeech] = useState<string>('');

  // Fallback Text Input
  const [showTextInput, setShowTextInput] = useState(false);
  const [typedMessage, setTypedMessage] = useState('');

  // Unbroken In-Call Drawer (Notes, Task Lab, Syllabus)
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [drawerTab, setDrawerTab] = useState<'notes' | 'task' | 'syllabus'>('notes');

  // Mic permission & errors
  const [micError, setMicError] = useState<string | null>(null);

  // Network latency & offline status indicator
  const [isSlowNetwork, setIsSlowNetwork] = useState(false);
  const [networkMessage, setNetworkMessage] = useState('Network is slow');

  // Voice Activity Detection (VAD) System State & Custom Silence Threshold
  const [vadState, setVadState] = useState<'idle' | 'speech_active' | 'silence_detected' | 'responding'>('idle');
  const [isVoiceActive, setIsVoiceActive] = useState<boolean>(false);
  const [silenceThresholdMs, setSilenceThresholdMs] = useState<number>(450);
  const [showVadSettings, setShowVadSettings] = useState<boolean>(false);

  // VAD Refs to ensure latest values across asynchronous Speech API and AudioContext callbacks
  const silenceThresholdRef = useRef<number>(silenceThresholdMs);
  silenceThresholdRef.current = silenceThresholdMs;
  const lastSpeechTimestampRef = useRef<number>(0);
  const isVoiceActiveRef = useRef<boolean>(false);
  isVoiceActiveRef.current = isVoiceActive;

  // ChatGPT & Gemini Live Experience States
  const [classroomView, setClassroomView] = useState<'voice_call' | 'chat_stream'>('voice_call');
  const [voicePersona, setVoicePersona] = useState<'kore' | 'zephyr' | 'puck' | 'fenrir'>('kore');
  const [showVoicePicker, setShowVoicePicker] = useState<boolean>(false);
  const [copiedMessageIndex, setCopiedMessageIndex] = useState<number | null>(null);
  const [suggestedFollowUps, setSuggestedFollowUps] = useState<string[]>([
    'How do I cut a clip with the blade tool?',
    'What is Ripple Delete shortcut?',
    'How does snapping work in Resolve?',
    'What is the next lesson?'
  ]);
  const chatScrollRef = useRef<HTMLDivElement | null>(null);

  // Conversation history for context (with multimodal screenshot support)
  const [conversationHistory, setConversationHistory] = useState<
    Array<{
      role: 'user' | 'assistant';
      content: string;
      timestamp?: string;
      screenshot?: { base64: string; mimeType: string };
      visualAnalysis?: string;
    }>
  >([]);

  // Screenshot Sharing & Multimodal AI Understanding State
  const [screenshotPreview, setScreenshotPreview] = useState<{
    base64: string;
    mimeType: string;
    note: string;
  } | null>(null);
  const [fullSizeScreenshot, setFullSizeScreenshot] = useState<{
    base64: string;
    mimeType: string;
  } | null>(null);
  const [isAnalyzingScreenshot, setIsAnalyzingScreenshot] = useState(false);
  const [isDraggingOver, setIsDraggingOver] = useState(false);
  const screenshotFileInputRef = useRef<HTMLInputElement | null>(null);
  const recentScreenshotContextRef = useRef<string>('');

  // Pre-use AI Transparency Disclosure & Safety Reporting states
  const [aiDisclosureJustAccepted, setAiDisclosureJustAccepted] = useState(false);
  const [acceptingAiDisclosure, setAcceptingAiDisclosure] = useState(false);
  const [aiDisclosureError, setAiDisclosureError] = useState('');
  const [complianceNotice, setComplianceNotice] = useState<string | null>(null);
  const [reportTargetText, setReportTargetText] = useState<string | null>(null);
  const [reportReason, setReportReason] = useState('Inaccurate or confusing technical instruction');
  const [isReportingAi, setIsReportingAi] = useState(false);
  const [reportTicketCode, setReportTicketCode] = useState<string | null>(null);

  const hasAcceptedAiDisclosure = Boolean(user?.aiDisclosureAcceptedAt) || aiDisclosureJustAccepted;

  // Student Onboarding & Personalization State
  const initialStudentName = () => {
    if (typeof window !== 'undefined') {
      const stored = localStorage.getItem('tuteach_student_name');
      if (stored && stored.trim() && stored !== 'Alex Morgan' && stored !== 'Student') return stored.trim();
    }
    if (user?.name && user.name !== 'Alex Morgan' && user.name !== 'Student') {
      return user.name;
    }
    return user?.name || 'Student';
  };

  const initialOnboardingCompleted = () => {
    if (typeof window !== 'undefined') {
      const courseOnboarded = localStorage.getItem(`tuteach_onboarding_${course.id}`);
      if (courseOnboarded === 'completed') return true;
    }
    return false;
  };

  const [studentName, setStudentName] = useState<string>(initialStudentName);
  const [studentExperience, setStudentExperience] = useState<string>(() => {
    if (typeof window !== 'undefined') {
      return localStorage.getItem('tuteach_student_experience') || '';
    }
    return '';
  });
  const [onboardingStage, setOnboardingStage] = useState<'ask_name' | 'ask_experience' | 'introduce_course' | 'completed'>(() => {
    if (initialOnboardingCompleted()) return 'completed';
    const existingName = initialStudentName();
    if (existingName) return 'ask_experience';
    return 'ask_name';
  });

  const onboardingStageRef = useRef(onboardingStage);
  onboardingStageRef.current = onboardingStage;
  const studentNameRef = useRef(studentName);
  studentNameRef.current = studentName;
  const studentExperienceRef = useRef(studentExperience);
  studentExperienceRef.current = studentExperience;
  const sessionReadyRef = useRef<boolean>(false);
  const hasSpokenWelcomeRef = useRef<boolean>(false);

  // Helper to extract clean student name from speech or text input
  const extractCleanStudentName = (input: string): string => {
    let clean = input.trim();
    clean = clean.replace(/^(my name is|i am|i'm|mera naam|naam hai|this is|call me|myself)\s+/i, '');
    clean = clean.replace(/\s+(hai|here|speaking|this side)$/i, '');
    clean = clean.replace(/[.,!?;:]/g, '').trim();
    if (clean.length > 0 && clean.length <= 30) {
      return clean.split(' ').map((w) => w.charAt(0).toUpperCase() + w.slice(1).toLowerCase()).join(' ');
    }
    return clean || 'friend';
  };

  // Refs for bulletproof turn-taking without closure staleness
  const recognitionRef = useRef<any>(null);
  const silenceTimerRef = useRef<any>(null);
  const speechUtteranceRef = useRef<SpeechSynthesisUtterance | null>(null);
  const currentStudentTranscriptRef = useRef<string>('');
  const volumeIntervalRef = useRef<any>(null);
  const isSubmittingRef = useRef<boolean>(false);
  const audioContextRef = useRef<AudioContext | null>(null);
  const micStreamRef = useRef<MediaStream | null>(null);

  // Function refs to break circular dependencies cleanly
  const startListeningRef = useRef<() => void>(() => {});
  const speakAIResponseRef = useRef<(text: string) => void>(() => {});
  const sendStudentMessageToAIRef = useRef<(text: string) => void>(() => {});
  const commitStudentUtteranceRef = useRef<() => void>(() => {});

  // Sync state refs so event listeners always access current values
  const callStateRef = useRef(callState);
  callStateRef.current = callState;
  const callActiveRef = useRef(callActive);
  callActiveRef.current = callActive;
  const isMutedRef = useRef(isMuted);
  isMutedRef.current = isMuted;

  // Course completion percentage
  const completedInCourse = allLessons.filter((l) => completedLessonIds.includes(l.id)).length;
  const progressPercent = Math.round((completedInCourse / (allLessons.length || 1)) * 100);
  const courseCertificate = certificates.find((c) => c.courseId === course.id);

  // Call duration counter
  useEffect(() => {
    let interval: any;
    if (callActive) {
      interval = setInterval(() => {
        setCallDuration((prev) => prev + 1);
      }, 1000);
    }
    return () => clearInterval(interval);
  }, [callActive]);

  const formatDuration = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  // Stop AI speech immediately on student voice interruption or button tap
  const stopAISpeech = useCallback((shouldSwitchToListening = true) => {
    if ('speechSynthesis' in window) {
      window.speechSynthesis.cancel();
    }
    if (volumeIntervalRef.current) {
      clearInterval(volumeIntervalRef.current);
      volumeIntervalRef.current = null;
    }
    setVolumeLevel(0);
    if (shouldSwitchToListening) {
      callStateRef.current = 'listening';
      setCallState('listening');
    }
  }, []);

  // Text-To-Speech implementation with natural utterance handling & echo protection
  const speakAIResponse = useCallback(
    (text: string) => {
      if (!('speechSynthesis' in window)) {
        setCurrentSubtitle(text);
        setActiveSpeaker('tutor');
        setCallState('idle');
        return;
      }

      // Stop any existing synthesis without resetting to listening mode
      stopAISpeech(false);
      callStateRef.current = 'speaking';
      setCallState('speaking');

      // Clean markdown tags for spoken voice
      const cleanSpoken = text
        .replace(/```[\s\S]*?```/g, '')
        .replace(/[*_#`]/g, '')
        .replace(/\[.*?\]\(.*?\)/g, '')
        .trim();

      const utterance = new SpeechSynthesisUtterance(cleanSpoken);
      speechUtteranceRef.current = utterance;

      // Configure Gemini Live / ChatGPT Voice Persona style - Calibrated for slow, smooth, relaxed delivery
      if (voicePersona === 'kore') {
        utterance.rate = 0.88;
        utterance.pitch = 1.02;
      } else if (voicePersona === 'zephyr') {
        utterance.rate = 0.88;
        utterance.pitch = 0.98;
      } else if (voicePersona === 'puck') {
        utterance.rate = 0.90;
        utterance.pitch = 1.06;
      } else if (voicePersona === 'fenrir') {
        utterance.rate = 0.86;
        utterance.pitch = 0.85;
      } else {
        utterance.rate = 0.88;
        utterance.pitch = 1.0;
      }
      utterance.volume = 1.0;

      if (languageMode === 'hindi_hinglish') {
        utterance.lang = 'hi-IN';
        const voices = window.speechSynthesis.getVoices();
        const hindiVoice =
          voices.find(
            (v) =>
              (v.lang.includes('hi') || v.lang.includes('IN') || v.name.toLowerCase().includes('hindi')) &&
              (v.name.includes('Natural') || v.name.includes('Google') || true)
          ) || voices.find((v) => v.lang.includes('hi') || v.lang.includes('IN'));
        if (hindiVoice) utterance.voice = hindiVoice;
      } else {
        utterance.lang = 'en-US';
        const voices = window.speechSynthesis.getVoices();
        let targetVoice: SpeechSynthesisVoice | undefined;

        if (voicePersona === 'kore') {
          targetVoice = voices.find((v) => v.name.includes('Samantha') || v.name.includes('Karen') || v.name.includes('Natural') || v.name.includes('Google US English'));
        } else if (voicePersona === 'zephyr') {
          targetVoice = voices.find((v) => v.name.includes('Daniel') || v.name.includes('Oliver') || v.name.includes('Google UK English'));
        } else if (voicePersona === 'puck') {
          targetVoice = voices.find((v) => v.name.includes('Alex') || v.name.includes('Fred') || v.name.includes('Google US English'));
        } else if (voicePersona === 'fenrir') {
          targetVoice = voices.find((v) => v.name.includes('Daniel') || v.name.includes('George') || v.name.includes('David'));
        }

        const fallbackVoice = voices.find((v) => v.lang.startsWith('en'));
        utterance.voice = targetVoice || fallbackVoice || null;
      }

      // Safety watchdog: Chrome speech synthesis can fail to fire onend for long utterances
      // or if window loses focus. Ensure we return to listening after expected duration!
      // Slower rate requires slightly higher ms calculation
      const approxDurationMs = Math.max(3000, cleanSpoken.length * 85);
      const watchdog = setTimeout(() => {
        if (callStateRef.current === 'speaking' || callStateRef.current === 'thinking') {
          if (volumeIntervalRef.current) clearInterval(volumeIntervalRef.current);
          setVolumeLevel(0);
          callStateRef.current = 'listening';
          setCallState('listening');
          startListeningRef.current();
        }
      }, approxDurationMs + 1000);

      utterance.onstart = () => {
        setCallState('speaking');
        setActiveSpeaker('tutor');
        setCurrentSubtitle(text);
        setLastTutorSpeech(text);

        // ACOUSTIC ECHO PROTECTION:
        // Pause speech recognition while tutor is speaking so the mic does not pick up
        // the computer speakers and talk to itself!
        if (recognitionRef.current) {
          try {
            recognitionRef.current.onend = null;
            recognitionRef.current.abort();
          } catch {}
          recognitionRef.current = null;
        }
        currentStudentTranscriptRef.current = '';

        // Simulate voice volume activity for the logo animation
        if (volumeIntervalRef.current) clearInterval(volumeIntervalRef.current);
        volumeIntervalRef.current = setInterval(() => {
          setVolumeLevel(0.4 + Math.random() * 0.6);
        }, 120);
      };

      utterance.onend = () => {
        clearTimeout(watchdog);
        if (volumeIntervalRef.current) clearInterval(volumeIntervalRef.current);
        setVolumeLevel(0);
        // Only return to listening if tutor was actually speaking and student has not started submitting
        if (callStateRef.current === 'speaking' && !isSubmittingRef.current) {
          callStateRef.current = 'listening';
          setCallState('listening');
          startListeningRef.current();
        }
      };

      utterance.onerror = (e: any) => {
        clearTimeout(watchdog);
        if (volumeIntervalRef.current) clearInterval(volumeIntervalRef.current);
        setVolumeLevel(0);
        // Recover safely to listening if session is active and student is not currently submitting
        if (
          callActiveRef.current &&
          !isMutedRef.current &&
          !isSubmittingRef.current
        ) {
          callStateRef.current = 'listening';
          setCallState('listening');
          startListeningRef.current();
        }
      };

      // Workaround for Chrome speech synthesis pause bug
      try {
        if (window.speechSynthesis.paused) {
          window.speechSynthesis.resume();
        }
        window.speechSynthesis.speak(utterance);
      } catch (synthErr) {
        console.warn('Speech synthesis speak exception:', synthErr);
        callStateRef.current = 'listening';
        setCallState('listening');
        startListeningRef.current();
      }
    },
    [languageMode, stopAISpeech]
  );

  // Send student message to AI Tutor API
  const sendStudentMessageToAI = useCallback(
    async (messageText: string) => {
      const trimmed = messageText.trim();
      if (!trimmed || trimmed.length < 2) return;

      isSubmittingRef.current = true;

      // Abort speech recognition immediately so mic does not hear acoustic feedback
      if (recognitionRef.current) {
        try {
          recognitionRef.current.onend = null;
          recognitionRef.current.abort();
        } catch {}
        recognitionRef.current = null;
      }

      // Stop speech without resetting to listening!
      stopAISpeech(false);
      callStateRef.current = 'thinking';
      setCallState('thinking');
      setActiveSpeaker('student');
      setCurrentSubtitle(trimmed);

      const nowTime = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
      // Add to conversation history
      const updatedHistory = [
        ...conversationHistory,
        { role: 'user' as const, content: trimmed, timestamp: nowTime }
      ];
      setConversationHistory(updatedHistory);

      // Auto-scroll chat stream if active
      setTimeout(() => {
        if (chatScrollRef.current) {
          chatScrollRef.current.scrollTop = chatScrollRef.current.scrollHeight;
        }
      }, 50);

      const isHindi = languageMode === 'hindi_hinglish';

      // ----------------------------------------------------
      // ONBOARDING STEP 1: Student responds with their name
      // ----------------------------------------------------
      if (onboardingStageRef.current === 'ask_name') {
        const extracted = extractCleanStudentName(trimmed);
        const nameToUse = extracted || 'friend';
        setStudentName(nameToUse);
        studentNameRef.current = nameToUse;
        if (typeof window !== 'undefined') {
          localStorage.setItem('tuteach_student_name', nameToUse);
        }
        setOnboardingStage('ask_experience');
        onboardingStageRef.current = 'ask_experience';

        const personalizedGreeting = isHindi
          ? `Aapse milkar bohot khushi hui, ${nameToUse}! Aapko best tareeqe se sikhane ke liye, kya aapne pehle kabhi ${course.software || course.title} use kiya hai, ya aap bilkul zero se start kar rahe hain?`
          : `It's wonderful to meet you, ${nameToUse}! To help me teach you in the best way possible, have you ever used ${course.software || course.title} before, or are you starting completely fresh from zero?`;

        const replyTime = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
        setConversationHistory((prev) => [
          ...prev,
          { role: 'assistant', content: personalizedGreeting, timestamp: replyTime }
        ]);

        speakAIResponseRef.current(personalizedGreeting);
        isSubmittingRef.current = false;
        return;
      }

      // ----------------------------------------------------
      // ONBOARDING STEP 2: Student shares prior experience level
      // ----------------------------------------------------
      if (onboardingStageRef.current === 'ask_experience') {
        setStudentExperience(trimmed);
        studentExperienceRef.current = trimmed;
        if (typeof window !== 'undefined') {
          localStorage.setItem('tuteach_student_experience', trimmed);
        }
        setOnboardingStage('introduce_course');
        onboardingStageRef.current = 'introduce_course';

        const nameToUse = studentNameRef.current || (isHindi ? 'dost' : 'friend');
        const courseIntro = isHindi
          ? `Yeh to bohot badhiya hai, ${nameToUse}! Zero se shuru karna sabse achhi baat hai. Is course me hum ${course.title} ko step by step seekhenge! Aaj Lesson 1 me hum ${currentLesson.title} se start karenge. Kya aap taiyar hain?`
          : `That's completely fine, ${nameToUse}! Starting from zero is the best place to be. In this course, we'll be mastering ${course.title} step by step! Today in Lesson 1, we'll start with ${currentLesson.title}. Are you ready to dive in?`;

        const replyTime = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
        setConversationHistory((prev) => [
          ...prev,
          { role: 'assistant', content: courseIntro, timestamp: replyTime }
        ]);

        speakAIResponseRef.current(courseIntro);
        isSubmittingRef.current = false;
        return;
      }

      // ----------------------------------------------------
      // ONBOARDING STEP 3: Student confirms readiness to start Lesson 1
      // ----------------------------------------------------
      if (onboardingStageRef.current === 'introduce_course') {
        const lower = trimmed.toLowerCase();
        const isConfirming = /^(yes|yeah|yep|sure|ready|let's start|let's go|haan|ha|taiyar|start|ok|okay|bilkul)/i.test(lower);

        setOnboardingStage('completed');
        onboardingStageRef.current = 'completed';
        if (typeof window !== 'undefined') {
          localStorage.setItem(`tuteach_onboarding_${course.id}`, 'completed');
        }

        if (isConfirming) {
          const nameToUse = studentNameRef.current || (isHindi ? 'dost' : 'friend');
          const lessonStart = isHindi
            ? `Bohot badhiya, ${nameToUse}! Chaliye shuru karte hain. ${currentLesson.title} me hamara goal workspace ko samajhna aur comfortable hona hai. ${currentLesson.summary || 'Sabse pehle screen ke bottom me dekhein.'} Kya aapke samne ${course.software || course.title} open hai?`
            : `Awesome, ${nameToUse}! Let's dive in. In ${currentLesson.title}, our first goal is getting comfortable with the workspace. ${currentLesson.summary || 'First, take a look at the bottom of your screen.'} Do you have ${course.software || course.title} open in front of you right now?`;

          const replyTime = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
          setConversationHistory((prev) => [
            ...prev,
            { role: 'assistant', content: lessonStart, timestamp: replyTime }
          ]);

          speakAIResponseRef.current(lessonStart);
          isSubmittingRef.current = false;
          return;
        }
        // If they asked an educational question instead of saying ready, mark complete and proceed to answer!
      }

      // Calm network latency detector: only notify if latency exceeds 4s or device is offline
      const slowNetworkTimer = setTimeout(() => {
        setIsSlowNetwork(true);
        setNetworkMessage(typeof navigator !== 'undefined' && navigator.onLine === false ? 'Network is offline' : 'Connecting to AI mentor...');
      }, 4000);

      try {
        const authToken = typeof window !== 'undefined' ? localStorage.getItem('tuteach_auth_token') : null;
        const response = await fetch('/api/tutor/chat', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            ...(authToken ? { Authorization: `Bearer ${authToken}` } : {})
          },
          body: JSON.stringify({
            message: trimmed,
            courseTitle: course.title,
            lessonTitle: currentLesson.title,
            lessonContent: currentLesson.detailedContent,
            lessonSummary: currentLesson.summary,
            mode: 'socratic',
            languageMode: languageMode,
            history: updatedHistory.slice(-8),
            studentName: studentNameRef.current,
            studentExperience: studentExperienceRef.current,
            onboardingStage: onboardingStageRef.current,
            recentScreenshotContext: recentScreenshotContextRef.current || undefined
          })
        });

        clearTimeout(slowNetworkTimer);
        setIsSlowNetwork(false);

        const data = await response.json();
        if (!response.ok) {
          const errMsg = data?.message || 'Access restricted by compliance policy.';
          setComplianceNotice(errMsg);
          if (data?.error === 'AI_DISCLOSURE_REQUIRED') {
            setAiDisclosureJustAccepted(false);
          }
          setCallState('idle');
          isSubmittingRef.current = false;
          return;
        }

        if (Array.isArray(data?.redactedPii) && data.redactedPii.length > 0) {
          setComplianceNotice(
            `Safety filter: Sensitive info (${data.redactedPii.join(', ')}) was automatically masked before AI processing.`
          );
        }

        const reply = (data && data.reply) || (languageMode === 'hindi_hinglish'
          ? "Aapka sawaal bilkul clear hai. Main turant madad ke liye taiyar hoon!"
          : "I hear you loud and clear. Feel free to continue or ask another question!");

        const replyTime = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
        setConversationHistory((prev) => [
          ...prev,
          { role: 'assistant', content: reply, timestamp: replyTime }
        ]);

        if (Array.isArray(data?.suggestedFollowUps) && data.suggestedFollowUps.length > 0) {
          setSuggestedFollowUps(data.suggestedFollowUps);
        }

        setTimeout(() => {
          if (chatScrollRef.current) {
            chatScrollRef.current.scrollTop = chatScrollRef.current.scrollHeight;
          }
        }, 80);

        // Continue speaking immediately without lag
        speakAIResponseRef.current(reply);
      } catch (err) {
        clearTimeout(slowNetworkTimer);
        setIsSlowNetwork(false);
        console.error('AI Classroom chat error:', err);
        const fallback =
          languageMode === 'hindi_hinglish'
            ? "Aapka sawaal bilkul clear hai. Main turant madad ke liye taiyar hoon!"
            : "I hear you loud and clear. Feel free to continue or ask another question!";
        speakAIResponseRef.current(fallback);
      } finally {
        clearTimeout(slowNetworkTimer);
        setIsSlowNetwork(false);
        isSubmittingRef.current = false;
      }
    },
    [conversationHistory, course.title, currentLesson.detailedContent, currentLesson.summary, currentLesson.title, languageMode, stopAISpeech]
  );

  // Helper to commit student utterance automatically when student pauses or finishes speaking (VAD trigger)
  const commitStudentUtterance = useCallback(() => {
    if (isSubmittingRef.current) return;
    const utteranceToSend = currentStudentTranscriptRef.current.trim();
    // Allow natural short responses ("yes", "no", "cut", "play", "how") as well as full sentences
    if (utteranceToSend.length >= 2) {
      isSubmittingRef.current = true;
      setVadState('responding');
      setIsVoiceActive(false);
      currentStudentTranscriptRef.current = '';
      if (silenceTimerRef.current) {
        clearTimeout(silenceTimerRef.current);
        silenceTimerRef.current = null;
      }
      sendStudentMessageToAIRef.current(utteranceToSend);
    }
  }, []);

  // Setup Web Audio Analyser for real-time acoustic Voice Activity Detection and volume meter
  useEffect(() => {
    let audioCtx: AudioContext | null = null;
    let stream: MediaStream | null = null;
    let analyser: AnalyserNode | null = null;
    let animationFrameId: number;

    const setupMicMeter = async () => {
      try {
        if (!navigator.mediaDevices?.getUserMedia) return;
        stream = await navigator.mediaDevices.getUserMedia({
          audio: {
            echoCancellation: true,
            noiseSuppression: true,
            autoGainControl: true
          }
        });
        micStreamRef.current = stream;

        audioCtx = new (window.AudioContext || (window as any).webkitAudioContext)();
        audioContextRef.current = audioCtx;

        const source = audioCtx.createMediaStreamSource(stream);
        analyser = audioCtx.createAnalyser();
        analyser.fftSize = 256;
        source.connect(analyser);

        const dataArray = new Uint8Array(analyser.frequencyBinCount);

        const checkAudioLevel = () => {
          if (!analyser) return;
          analyser.getByteFrequencyData(dataArray);

          let sum = 0;
          for (let i = 0; i < dataArray.length; i++) {
            sum += dataArray[i];
          }
          const avg = sum / dataArray.length / 255;

          // Drive logo volume meter and acoustic voice activity detection
          const isAISpeaking = callStateRef.current === 'speaking' || (typeof window !== 'undefined' && 'speechSynthesis' in window && window.speechSynthesis.speaking);

          // Student Voice Interruption (Barge-In): If AI is speaking and student voice is detected, immediately stop AI speech!
          if (isAISpeaking && avg > 0.045) {
            stopAISpeech(true);
            lastSpeechTimestampRef.current = Date.now();
            setIsVoiceActive(true);
            setVadState('speech_active');
            startListeningRef.current();
          }

          if (callStateRef.current === 'listening') {
            if (avg > 0.04) {
              setVolumeLevel(Math.min(1, avg * 2.5));
              lastSpeechTimestampRef.current = Date.now();
              setIsVoiceActive(true);
              setVadState('speech_active');

              // If AI speech is still playing, immediately stop it
              if (typeof window !== 'undefined' && 'speechSynthesis' in window && window.speechSynthesis.speaking) {
                stopAISpeech(true);
              }
            } else {
              setVolumeLevel(0);
              // Check if voice was recently active and has now been silent past custom silence threshold
              if (
                isVoiceActiveRef.current &&
                lastSpeechTimestampRef.current > 0 &&
                Date.now() - lastSpeechTimestampRef.current >= silenceThresholdRef.current
              ) {
                setIsVoiceActive(false);
                setVadState('silence_detected');
                if (currentStudentTranscriptRef.current.trim().length >= 2 && !isSubmittingRef.current) {
                  commitStudentUtteranceRef.current();
                }
              }
            }
          }

          animationFrameId = requestAnimationFrame(checkAudioLevel);
        };

        checkAudioLevel();
      } catch (err) {
        console.warn('Microphone AudioContext meter not available:', err);
      }
    };

    if (callActive && !isMuted) {
      setupMicMeter();
    }

    return () => {
      if (animationFrameId) cancelAnimationFrame(animationFrameId);
      if (stream) {
        stream.getTracks().forEach((track) => track.stop());
      }
      if (audioCtx && audioCtx.state !== 'closed') {
        audioCtx.close();
      }
    };
  }, [callActive, isMuted]);

  // Monitor network connectivity and connection speed
  useEffect(() => {
    const handleOffline = () => {
      setIsSlowNetwork(true);
      setNetworkMessage('Network is offline');
    };
    const handleOnline = () => {
      setIsSlowNetwork(false);
    };
    window.addEventListener('offline', handleOffline);
    window.addEventListener('online', handleOnline);

    const navConn = (navigator as any)?.connection;
    if (navConn) {
      const checkConnection = () => {
        if (navConn.effectiveType === '2g' || navConn.effectiveType === 'slow-2g') {
          setIsSlowNetwork(true);
          setNetworkMessage('Network is slow (2G)');
        }
      };
      checkConnection();
      navConn.addEventListener('change', checkConnection);
      return () => {
        window.removeEventListener('offline', handleOffline);
        window.removeEventListener('online', handleOnline);
        navConn.removeEventListener('change', checkConnection);
      };
    }

    return () => {
      window.removeEventListener('offline', handleOffline);
      window.removeEventListener('online', handleOnline);
    };
  }, []);

  // Keyboard shortcut: Spacebar to interrupt / speak
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.code === 'Space' && (e.target as HTMLElement).tagName !== 'INPUT') {
        if (callStateRef.current === 'speaking') {
          e.preventDefault();
          stopAISpeech();
          startListening();
        }
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [stopAISpeech]);

  // Initialize Speech Recognition for Student Voice Input
  const startListening = useCallback(() => {
    if (isMutedRef.current || !callActiveRef.current) return;
    // Don't listen while tutor is actively speaking to prevent echo feedback loop
    if (callStateRef.current === 'speaking' || callStateRef.current === 'thinking') return;

    const SpeechRecognition =
      (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;

    if (!SpeechRecognition) {
      setMicError('Speech recognition is not supported in this browser. You can use the keyboard button.');
      return;
    }

    // Never clear a transcript that is waiting to be submitted
    if (!silenceTimerRef.current && !isSubmittingRef.current && currentStudentTranscriptRef.current.trim().length < 2) {
      currentStudentTranscriptRef.current = '';
    }

    // Clean up previous instance safely
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
          setVadState('idle');
        }
      };

      // VAD Event 1: onspeechstart - Browser detects that vocal speech has begun
      recognition.onspeechstart = () => {
        lastSpeechTimestampRef.current = Date.now();
        setIsVoiceActive(true);
        setVadState('speech_active');

        // Immediate Interruption: if AI teacher is speaking, cancel speech instantly and switch to listening
        if (callStateRef.current === 'speaking' || (typeof window !== 'undefined' && 'speechSynthesis' in window && window.speechSynthesis.speaking)) {
          stopAISpeech(true);
        }

        if (!isSubmittingRef.current && callStateRef.current !== 'thinking') {
          setCallState('listening');
          callStateRef.current = 'listening';
          setActiveSpeaker('student');
        }

        // Cancel pending silence commit timer because the user is currently speaking
        if (silenceTimerRef.current) {
          clearTimeout(silenceTimerRef.current);
          silenceTimerRef.current = null;
        }
      };

      // VAD Event 2: onspeechend - Browser detects that the user has stopped speaking
      recognition.onspeechend = () => {
        setIsVoiceActive(false);
        setVadState('silence_detected');

        // Strict guard against stale processing
        if (callStateRef.current === 'speaking' || callStateRef.current === 'thinking' || isSubmittingRef.current) {
          return;
        }

        // Automatic VAD Trigger: When speech ends and student has spoken words, trigger the AI response!
        if (currentStudentTranscriptRef.current.trim().length >= 2) {
          if (silenceTimerRef.current) {
            clearTimeout(silenceTimerRef.current);
          }
          // Rapid 180ms debounce allows the final Web Speech result chunk to deliver before sending to AI
          silenceTimerRef.current = setTimeout(() => {
            commitStudentUtteranceRef.current();
          }, 180);
        }
      };

      // VAD Event 3: onsoundstart & onsoundend
      recognition.onsoundstart = () => {
        lastSpeechTimestampRef.current = Date.now();
      };

      recognition.onsoundend = () => {
        if (callStateRef.current === 'listening' && currentStudentTranscriptRef.current.trim().length >= 2) {
          if (!silenceTimerRef.current && !isSubmittingRef.current) {
            silenceTimerRef.current = setTimeout(() => {
              setVadState('silence_detected');
              commitStudentUtteranceRef.current();
            }, Math.min(silenceThresholdRef.current, 400));
          }
        }
      };

      // VAD Event 4: onresult with Custom Silence Threshold
      recognition.onresult = (event: any) => {
        // If tutor was speaking, student interruption takes priority! Stop teacher immediately
        if (callStateRef.current === 'speaking' || (typeof window !== 'undefined' && 'speechSynthesis' in window && window.speechSynthesis.speaking)) {
          stopAISpeech(true);
          setCallState('listening');
          callStateRef.current = 'listening';
        }

        if (callStateRef.current === 'thinking' || isSubmittingRef.current) {
          return;
        }

        setCallState('listening');
        setActiveSpeaker('student');
        setIsVoiceActive(true);
        setVadState('speech_active');
        lastSpeechTimestampRef.current = Date.now();

        // Accumulate complete utterance from all results in this session
        let fullTranscript = '';
        let interimTranscript = '';
        let hasFinalResult = false;

        for (let i = 0; i < event.results.length; ++i) {
          const item = event.results[i];
          if (item.isFinal) {
            fullTranscript += item[0].transcript + ' ';
            hasFinalResult = true;
          } else {
            interimTranscript += item[0].transcript;
          }
        }

        const currentSpeech = (fullTranscript + interimTranscript).trim();
        if (currentSpeech) {
          currentStudentTranscriptRef.current = currentSpeech;
          setCurrentSubtitle(currentSpeech);

          // Clear any previous silence detection timer
          if (silenceTimerRef.current) {
            clearTimeout(silenceTimerRef.current);
          }

          // Custom Silence Threshold calculation:
          // When a final clause/sentence is formed, wait for the custom silence threshold (clamped to max 500ms)
          // If interim (pause between words), allow silenceThreshold + 250ms
          const pauseThresholdMs = hasFinalResult
            ? Math.min(silenceThresholdRef.current, 500)
            : silenceThresholdRef.current + 250;

          silenceTimerRef.current = setTimeout(() => {
            setVadState('silence_detected');
            commitStudentUtteranceRef.current();
          }, pauseThresholdMs);
        }
      };

      recognition.onerror = (event: any) => {
        if (event.error === 'not-allowed' || event.error === 'permission-denied') {
          setMicError('Microphone permission denied. Enable microphone access in your browser or type with keyboard.');
        } else if (event.error !== 'no-speech' && event.error !== 'aborted') {
          console.warn('Speech recognition warning:', event.error);
        }
      };

      recognition.onend = () => {
        setIsVoiceActive(false);
        // If there's an uncommitted utterance when recognition ends, auto-commit it immediately!
        if (currentStudentTranscriptRef.current.trim().length >= 2 && !isSubmittingRef.current) {
          setVadState('silence_detected');
          commitStudentUtteranceRef.current();
        }

        // Keep recognition continuously active only while call is active, unmuted, and actively in listening state.
        // Do not restart if a silence/debounce timer is pending or if an uncommitted transcript exists.
        const hasPendingUtterance =
          !!silenceTimerRef.current || currentStudentTranscriptRef.current.trim().length >= 2;

        if (
          callActiveRef.current &&
          !isMutedRef.current &&
          callStateRef.current === 'listening' &&
          !isSubmittingRef.current &&
          !hasPendingUtterance
        ) {
          setTimeout(() => {
            const hasPendingNow =
              !!silenceTimerRef.current || currentStudentTranscriptRef.current.trim().length >= 2;
            if (
              callActiveRef.current &&
              !isMutedRef.current &&
              callStateRef.current === 'listening' &&
              !isSubmittingRef.current &&
              !hasPendingNow
            ) {
              startListeningRef.current();
            }
          }, 150);
        }
      };

      recognition.start();
      recognitionRef.current = recognition;
    } catch (e) {
      console.error('Failed to start speech recognition:', e);
    }
  }, [languageMode]);

  // Keep all function refs synced to latest closures
  startListeningRef.current = startListening;
  speakAIResponseRef.current = speakAIResponse;
  sendStudentMessageToAIRef.current = sendStudentMessageToAI;
  commitStudentUtteranceRef.current = commitStudentUtterance;

  // Handle central avatar tap to talk / interrupt
  const handleCenterAvatarClick = () => {
    if (callState === 'speaking') {
      callStateRef.current = 'listening';
      stopAISpeech();
      startListening();
    } else {
      callStateRef.current = 'listening';
      setCallState('listening');
      startListening();
    }
  };

  // Initial welcome greeting when entering classroom or changing lesson/language
  useEffect(() => {
    if (!callActive || !hasAcceptedAiDisclosure) return;
    // Strictly prevent repeating the welcome greeting once it has been spoken or if conversation is active
    if (hasSpokenWelcomeRef.current || conversationHistory.length > 0) {
      hasSpokenWelcomeRef.current = true;
      return;
    }

    // Small delay ensures AudioContext and SpeechSynthesis are fully mounted
    const initTimer = setTimeout(() => {
      sessionReadyRef.current = true;
      const isHindi = languageMode === 'hindi_hinglish';
      const isAlreadyOnboarded = onboardingStageRef.current === 'completed';

      let welcomeSpeech = '';
      if (isAlreadyOnboarded) {
        welcomeSpeech = isHindi
          ? `Welcome back, ${studentNameRef.current || 'dost'}! Chaliye ${currentLesson.title} continue karte hain. Aap mujhse koi bhi sawaal bol kar pooch sakte hain!`
          : `Welcome back, ${studentNameRef.current || 'friend'}! Let's continue with ${currentLesson.title}. Speak naturally or ask me any question!`;
      } else if (onboardingStageRef.current === 'ask_experience' && studentNameRef.current) {
        welcomeSpeech = isHindi
          ? `Namaste ${studentNameRef.current}! Aaj ${course.title} seekhne ke liye bohot excitement hai. Kya aapne pehle kabhi ${course.software || course.title} use kiya hai, ya aap bilkul zero se start kar rahe hain?`
          : `Hello ${studentNameRef.current}! I'm really excited to learn ${course.title} with you today! Have you ever used ${course.software || course.title} before, or are you starting completely fresh from zero?`;
      } else {
        welcomeSpeech = isHindi
          ? `Namaste! Welcome to TUTeach. Main aapka personal AI teacher hoon, aur aaj aapke saath seekhne ke liye bohot excited hoon! Shuru karne se pehle, aapka shubh naam kya hai?`
          : `Hello! Welcome to TUTeach. I'm your personal AI teacher, and I'm really excited to learn with you today! Before we begin, what's your name?`;
      }

      speakAIResponseRef.current(welcomeSpeech);
      hasSpokenWelcomeRef.current = true;
    }, 350);

    return () => {
      clearTimeout(initTimer);
      stopAISpeech();
      if (recognitionRef.current) {
        try {
          recognitionRef.current.abort();
        } catch {}
      }
      if (silenceTimerRef.current) clearTimeout(silenceTimerRef.current);
    };
  }, [currentLesson.id, languageMode, stopAISpeech, hasAcceptedAiDisclosure]);

  // Handle Mute / Unmute
  const toggleMute = () => {
    if (isMuted) {
      setIsMuted(false);
      startListening();
    } else {
      setIsMuted(true);
      if (recognitionRef.current) {
        try {
          recognitionRef.current.abort();
        } catch {}
      }
      setCallState('idle');
    }
  };

  // Handle End Call / Reconnect Call
  const handleToggleCall = () => {
    if (callActive) {
      stopAISpeech();
      if (recognitionRef.current) {
        try {
          recognitionRef.current.abort();
        } catch {}
      }
      setCallActive(false);
      setCallState('idle');
    } else {
      setCallActive(true);
      setCallDuration(0);
      const isHindi = languageMode === 'hindi_hinglish';
      const reconnectMsg = isHindi
        ? `TUTutor call reconnected! Welcome back, ${studentNameRef.current || 'dost'}. Aap ${currentLesson.title} ke baare me kuch bhi pooch sakte hain.`
        : `Call reconnected! Welcome back, ${studentNameRef.current || 'friend'}. Feel free to ask any question about ${currentLesson.title}.`;
      speakAIResponse(reconnectMsg);
    }
  };

  // Replay Last AI Explanation
  const replayLastAIExplanation = () => {
    if (lastTutorSpeech) {
      speakAIResponse(lastTutorSpeech);
    }
  };

  // Copy response message text helper for Chat Stream view
  const handleCopyMessage = (text: string, index: number) => {
    if (typeof navigator !== 'undefined' && navigator.clipboard) {
      navigator.clipboard.writeText(text);
      setCopiedMessageIndex(index);
      setTimeout(() => setCopiedMessageIndex(null), 2000);
    }
  };

  // Previous & Next Lesson Controls
  const handlePreviousLesson = () => {
    if (currentLessonIndex > 0) {
      const prevLesson = allLessons[currentLessonIndex - 1];
      navigate('classroom', course.id, prevLesson.id);
    }
  };

  const handleNextLesson = () => {
    if (currentLessonIndex < allLessons.length - 1) {
      const nextLesson = allLessons[currentLessonIndex + 1];
      navigate('classroom', course.id, nextLesson.id);
    }
  };

  // Process and load an image file into screenshot preview
  const processImageFile = (file: File) => {
    if (!file.type.startsWith('image/')) {
      alert('Please select a valid image file (PNG, JPG, or WebP).');
      return;
    }
    if (file.size > 8 * 1024 * 1024) {
      alert('Screenshot image size should be under 8MB.');
      return;
    }
    const reader = new FileReader();
    reader.onload = () => {
      const result = reader.result as string;
      const [header, base64] = result.split(',');
      const mime = header.split(';')[0].replace('data:', '') || 'image/png';
      setScreenshotPreview({
        base64,
        mimeType: mime,
        note: ''
      });
    };
    reader.readAsDataURL(file);
  };

  // Global Clipboard Paste (Ctrl+V / Cmd+V) Listener in Classroom
  useEffect(() => {
    const handlePaste = (e: ClipboardEvent) => {
      // If student is focused on an input/textarea with text to paste, let text pass unless clipboard has image
      const items = e.clipboardData?.items;
      if (!items) return;

      for (let i = 0; i < items.length; i++) {
        if (items[i].type.indexOf('image') !== -1) {
          const blob = items[i].getAsFile();
          if (blob) {
            e.preventDefault();
            processImageFile(blob);
            break;
          }
        }
      }
    };

    window.addEventListener('paste', handlePaste);
    return () => window.removeEventListener('paste', handlePaste);
  }, []);

  // Drag and drop handlers
  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDraggingOver(true);
  };

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDraggingOver(false);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDraggingOver(false);
    const files = e.dataTransfer.files;
    if (files && files[0] && files[0].type.startsWith('image/')) {
      processImageFile(files[0]);
    }
  };

  // Submit Screenshot to Gemini Multimodal AI Tutor
  const handleSendScreenshot = async () => {
    if (!screenshotPreview || isAnalyzingScreenshot) return;
    setIsAnalyzingScreenshot(true);
    stopAISpeech();
    setCallState('thinking');

    const note = screenshotPreview.note.trim();
    const timeStr = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });

    // 1. Add user entry to conversation history with image thumbnail
    setConversationHistory((prev) => [
      ...prev,
      {
        role: 'user',
        content: note || 'Shared a screenshot of my workspace in DaVinci Resolve.',
        timestamp: timeStr,
        screenshot: {
          base64: screenshotPreview.base64,
          mimeType: screenshotPreview.mimeType
        }
      }
    ]);

    // Close preview modal immediately
    const sentPreview = { ...screenshotPreview };
    setScreenshotPreview(null);

    try {
      const authToken = typeof window !== 'undefined' ? localStorage.getItem('tuteach_auth_token') : null;
      const response = await fetch('/api/tutor/analyze-screenshot', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...(authToken ? { Authorization: `Bearer ${authToken}` } : {})
        },
        body: JSON.stringify({
          imageBase64: sentPreview.base64,
          mimeType: sentPreview.mimeType,
          studentMessage: note || 'Please inspect my workspace and timeline in DaVinci Resolve.',
          studentQuestion: note || 'Please inspect my workspace and timeline in DaVinci Resolve.',
          courseTitle: course.title,
          lessonTitle: currentLesson.title,
          lessonContent: currentLesson.detailedContent,
          languageMode: languageMode
        })
      });

      const data = await response.json();
      if (!response.ok) {
        setComplianceNotice(data?.message || 'Screenshot analysis restricted by compliance policy.');
        if (data?.error === 'AI_DISCLOSURE_REQUIRED') setAiDisclosureJustAccepted(false);
        setCallState('idle');
        setIsAnalyzingScreenshot(false);
        return;
      }
      const reply = data.reply || (languageMode === 'hindi_hinglish'
        ? "Maine aapka screenshot dekh liya hai. Timeline par workflow bilkul samajh aa gaya!"
        : "I've analyzed your screen. Here is what I observe on your DaVinci Resolve workspace!");

      // Retain context snippet for next turns
      recentScreenshotContextRef.current = data.contextSnippet || reply;

      if (Array.isArray(data.followUps) && data.followUps.length > 0) {
        setSuggestedFollowUps(data.followUps);
      }

      // 2. Add AI reply to conversation history
      const replyTime = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
      setConversationHistory((prev) => [
        ...prev,
        {
          role: 'assistant',
          content: reply,
          timestamp: replyTime,
          visualAnalysis: data.visualObservations
        }
      ]);

      setTimeout(() => {
        if (chatScrollRef.current) {
          chatScrollRef.current.scrollTop = chatScrollRef.current.scrollHeight;
        }
      }, 80);

      // 3. AI Speaks the multimodal analysis naturally
      speakAIResponseRef.current(reply);
    } catch (err) {
      console.error('Error analyzing screenshot:', err);
      const fallback = languageMode === 'hindi_hinglish'
        ? "Screenshot receive ho gaya hai. Aap timeline ke specific tool ke baare me pooch sakte hain."
        : "I received your screenshot. Let me know which specific panel or tool you'd like me to guide you on.";
      speakAIResponseRef.current(fallback);
    } finally {
      setIsAnalyzingScreenshot(false);
    }
  };

  // Switch Lesson from Navigator
  const handleSelectLesson = (lessonId: string) => {
    navigate('classroom', course.id, lessonId);
    setDrawerOpen(false);
  };

  // Handle Text Submission
  const handleTextSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!typedMessage.trim()) return;
    sendStudentMessageToAI(typedMessage.trim());
    setTypedMessage('');
    setShowTextInput(false);
  };

  const [backendAccessDenied, setBackendAccessDenied] = useState<boolean>(false);

  useEffect(() => {
    let isMounted = true;
    const verifyBackend = async () => {
      const token = localStorage.getItem('tuteach_auth_token');
      if (!token) {
        if (isMounted) setBackendAccessDenied(true);
        return;
      }
      try {
        const res = await fetch(`/api/courses/${course.id}/verify-access`, {
          headers: { 'Authorization': `Bearer ${token}` }
        });
        if (!res.ok && isMounted) {
          setBackendAccessDenied(true);
        }
      } catch {
        if (isMounted) setBackendAccessDenied(true);
      }
    };
    verifyBackend();
    return () => {
      isMounted = false;
    };
  }, [course.id]);

  const handleAcceptAiDisclosure = async () => {
    setAcceptingAiDisclosure(true);
    setAiDisclosureError('');
    try {
      const token = typeof window !== 'undefined' ? localStorage.getItem('tuteach_auth_token') : null;
      const res = await fetch('/api/compliance/ai-disclosure', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...(token ? { Authorization: `Bearer ${token}` } : {})
        }
      });
      const data = await res.json();
      if (!res.ok) {
        setAiDisclosureError(data.message || 'Could not record AI safety disclosure acceptance.');
        setAcceptingAiDisclosure(false);
        return;
      }
      setAiDisclosureJustAccepted(true);
      await refreshCurrentUser();
    } catch {
      setAiDisclosureError('Network error while recording AI safety acknowledgment.');
    } finally {
      setAcceptingAiDisclosure(false);
    }
  };

  const handleSubmitAiReport = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!reportTargetText) return;
    setIsReportingAi(true);
    try {
      const token = typeof window !== 'undefined' ? localStorage.getItem('tuteach_auth_token') : null;
      const res = await fetch('/api/compliance/report-ai-response', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...(token ? { Authorization: `Bearer ${token}` } : {})
        },
        body: JSON.stringify({
          messageText: reportTargetText,
          reason: reportReason
        })
      });
      const data = await res.json();
      if (res.ok && data.referenceCode) {
        setReportTicketCode(data.referenceCode);
      }
    } finally {
      setIsReportingAi(false);
    }
  };

  // Zero access to classes without payment! Free 5-minute demo is the only exception.
  if (!hasPaidForCourse(course.id) || backendAccessDenied) {
    return <ClassroomLockedGate courseId={course.id} />;
  }

  return (
    <div
      onDragOver={handleDragOver}
      onDragLeave={handleDragLeave}
      onDrop={handleDrop}
      className="relative min-h-screen bg-gradient-to-b from-[#2E2B2B] via-[#242222] to-[#1C1A1A] text-white flex flex-col justify-between overflow-hidden select-none font-sans"
    >
      {/* Ambient glowing radial backdrop */}
      <div className="absolute inset-0 pointer-events-none flex items-center justify-center">
        <div
          className={`w-[480px] h-[480px] sm:w-[650px] sm:h-[650px] rounded-full blur-[120px] transition-all duration-1000 ${
            callState === 'speaking'
              ? 'bg-[#F14C2F]/25 scale-110'
              : callState === 'listening'
              ? 'bg-emerald-500/20 scale-105'
              : callState === 'thinking'
              ? 'bg-amber-500/20 scale-100'
              : 'bg-[#F14C2F]/10 scale-95'
          }`}
        />
      </div>

      {/* CORNER SLOW NETWORK STATUS INDICATOR */}
      {isSlowNetwork && (
        <div className="fixed top-20 right-4 sm:top-20 sm:right-6 z-40 flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-amber-500/95 text-stone-950 text-xs font-bold shadow-xl backdrop-blur-md border border-amber-400/50 animate-pulse transition-all">
          <span className="w-2 h-2 rounded-full bg-stone-950 animate-ping" />
          <span>{networkMessage} • Collecting data to speak...</span>
        </div>
      )}

      {/* TOP BAR: ChatGPT & Gemini Voice / Chat Header */}
      <header className="relative z-20 px-3 sm:px-8 py-3.5 flex items-center justify-between border-b border-white/10 backdrop-blur-md bg-black/30 flex-wrap gap-2">
        {/* Left: Exit Call & Current Lesson */}
        <div className="flex items-center gap-3">
          <button
            onClick={() => navigate('dashboard')}
            className="p-1.5 -ml-1 text-white/70 hover:text-white rounded-full hover:bg-white/10 transition-colors flex items-center gap-1 text-xs font-semibold cursor-pointer"
            title="Return to Student Dashboard"
          >
            <ChevronLeft className="w-5 h-5" />
            <span className="hidden sm:inline">Dashboard</span>
          </button>

          <div className="h-4 w-px bg-white/20 hidden sm:block" />

          <div>
            <div className="text-[10px] uppercase font-bold tracking-wider text-[#F14C2F] flex items-center gap-1.5">
              <span>{course.title}</span>
              <span className="text-white/40">•</span>
              <span className="text-white/70">{currentLesson.moduleNumber ? `Module ${currentLesson.moduleNumber}` : 'Module 1'}</span>
            </div>
            <h1 className="text-xs sm:text-sm font-bold text-white truncate max-w-[170px] sm:max-w-xs md:max-w-md">
              {currentLesson.title}
            </h1>
          </div>

          {/* Quick Lesson Prev / Next buttons */}
          <div className="flex items-center gap-1 ml-1 bg-white/5 p-1 rounded-xl border border-white/10">
            <button
              onClick={handlePreviousLesson}
              disabled={currentLessonIndex === 0}
              className="p-1 rounded-lg hover:bg-white/10 disabled:opacity-30 text-white/80 transition-colors cursor-pointer"
              title="Previous Lesson"
            >
              <ChevronLeft className="w-3.5 h-3.5" />
            </button>
            <span className="text-[10px] font-mono text-white/60 px-1">
              {currentLessonIndex + 1}/{allLessons.length}
            </span>
            <button
              onClick={handleNextLesson}
              disabled={currentLessonIndex === allLessons.length - 1}
              className="p-1 rounded-lg hover:bg-white/10 disabled:opacity-30 text-white/80 transition-colors cursor-pointer"
              title="Next Lesson"
            >
              <ChevronRight className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>

        {/* Center: ChatGPT & Gemini View Mode Switcher + Live Status */}
        <div className="flex items-center gap-2 sm:gap-3">
          {/* View Mode Toggle (Live Voice Call vs Interactive Chat Stream) */}
          <div className="flex items-center bg-black/60 rounded-xl p-0.5 border border-white/15 text-xs shadow-inner">
            <button
              onClick={() => setClassroomView('voice_call')}
              className={`px-2.5 sm:px-3 py-1 rounded-lg font-bold transition-all flex items-center gap-1.5 cursor-pointer ${
                classroomView === 'voice_call'
                  ? 'bg-[#F14C2F] text-white shadow-xs'
                  : 'text-white/70 hover:text-white'
              }`}
              title="Live Voice Mode (ChatGPT Voice / Gemini Live)"
            >
              <Volume2 className="w-3.5 h-3.5" />
              <span>Voice</span>
            </button>
            <button
              onClick={() => setClassroomView('chat_stream')}
              className={`px-2.5 sm:px-3 py-1 rounded-lg font-bold transition-all flex items-center gap-1.5 cursor-pointer ${
                classroomView === 'chat_stream'
                  ? 'bg-[#F14C2F] text-white shadow-xs'
                  : 'text-white/70 hover:text-white'
              }`}
              title="Interactive Chat Stream (ChatGPT / Gemini style)"
            >
              <MessageSquare className="w-3.5 h-3.5" />
              <span>Chat</span>
            </button>
          </div>

          {/* Live Call Status Pill */}
          <div className="flex items-center gap-2 px-2.5 sm:px-3 py-1 rounded-full bg-white/10 border border-white/10 shadow-inner">
            <span
              className={`w-2 h-2 rounded-full transition-colors ${
                callState === 'speaking'
                  ? 'bg-[#F14C2F] animate-ping'
                  : callState === 'listening'
                  ? 'bg-emerald-400 animate-pulse'
                  : callState === 'thinking'
                  ? 'bg-amber-400 animate-spin'
                  : 'bg-emerald-500'
              }`}
            />
            <span className="text-[11px] font-semibold text-white/90">
              {callState === 'speaking'
                ? 'Speaking'
                : callState === 'listening'
                ? 'Listening'
                : callState === 'thinking'
                ? 'Thinking...'
                : 'Connected'}
            </span>
            <span className="text-[10px] font-mono text-white/50 hidden sm:inline">
              {callActive ? formatDuration(callDuration) : 'Paused'}
            </span>
          </div>
        </div>

        {/* Right: AI Voice Persona, Language Selector & In-Call Drawer */}
        <div className="flex items-center gap-1.5 sm:gap-2.5">
          {/* AI Voice Persona Selector (Gemini Live style: Kore, Zephyr, Puck, Fenrir) */}
          <div className="relative">
            <button
              onClick={() => setShowVoicePicker(!showVoicePicker)}
              className="px-2 sm:px-2.5 py-1 bg-black/40 hover:bg-black/60 border border-white/15 rounded-xl text-xs font-semibold text-white/90 flex items-center gap-1 transition-all cursor-pointer"
              title="Select AI Voice Persona"
            >
              <Sparkles className="w-3 h-3 text-[#F14C2F]" />
              <span className="capitalize">{voicePersona}</span>
            </button>
            {showVoicePicker && (
              <div className="absolute right-0 top-full mt-2 w-48 p-2 bg-zinc-900/95 border border-white/20 rounded-xl shadow-2xl backdrop-blur-xl z-50 text-white animate-in fade-in duration-150">
                <div className="text-[10px] font-bold uppercase tracking-wider text-white/50 px-2 py-1">
                  Gemini Live Voice
                </div>
                {[
                  { id: 'kore', name: '🌸 Kore', desc: 'Warm & Natural' },
                  { id: 'zephyr', name: '⚡ Zephyr', desc: 'Clear & Crisp' },
                  { id: 'puck', name: '🎨 Puck', desc: 'Upbeat & Lively' },
                  { id: 'fenrir', name: '🛡️ Fenrir', desc: 'Deep & Calm' },
                ].map((v) => (
                  <button
                    key={v.id}
                    onClick={() => {
                      setVoicePersona(v.id as any);
                      setShowVoicePicker(false);
                    }}
                    className={`w-full text-left px-2.5 py-1.5 rounded-lg text-xs flex items-center justify-between transition-colors cursor-pointer ${
                      voicePersona === v.id ? 'bg-[#F14C2F] text-white font-bold' : 'hover:bg-white/10 text-white/80'
                    }`}
                  >
                    <span>{v.name}</span>
                    <span className="text-[9px] opacity-70">{v.desc}</span>
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* Language Switcher */}
          <div className="flex items-center bg-black/40 rounded-xl p-0.5 border border-white/10 text-xs">
            <button
              onClick={() => {
                setLanguageMode('english');
                stopAISpeech();
              }}
              className={`px-2 py-1 rounded-lg font-medium transition-all cursor-pointer ${
                languageMode === 'english'
                  ? 'bg-[#F14C2F] text-white shadow-xs'
                  : 'text-white/70 hover:text-white'
              }`}
            >
              EN
            </button>
            <button
              onClick={() => {
                setLanguageMode('hindi_hinglish');
                stopAISpeech();
              }}
              className={`px-2 py-1 rounded-lg font-medium transition-all cursor-pointer ${
                languageMode === 'hindi_hinglish'
                  ? 'bg-[#F14C2F] text-white shadow-xs'
                  : 'text-white/70 hover:text-white'
              }`}
            >
              हिं
            </button>
          </div>

          {/* Unbroken Lesson & Task Drawer Toggle */}
          <button
            onClick={() => {
              setDrawerTab('task');
              setDrawerOpen(true);
            }}
            className="px-2.5 py-1 bg-white/10 hover:bg-white/20 border border-white/15 rounded-xl text-xs font-semibold text-white flex items-center gap-1 transition-colors cursor-pointer"
            title="View Lesson Notes & Task"
          >
            <FileText className="w-3.5 h-3.5 text-[#F14C2F]" />
            <span className="hidden md:inline">Task</span>
          </button>
        </div>
      </header>

      {/* Compliance / Safety / PII Redaction Notice Banner */}
      {complianceNotice && (
        <div className="relative z-20 max-w-2xl mx-auto mt-2 px-4 py-2 bg-[#F14C2F]/20 border border-[#F14C2F]/40 rounded-xl text-[#EFEBDA] text-xs flex items-center justify-between gap-3 backdrop-blur-md">
          <div className="flex items-center gap-2">
            <Info className="w-4 h-4 text-[#F14C2F] flex-shrink-0" />
            <span>{complianceNotice}</span>
          </div>
          <button
            onClick={() => setComplianceNotice(null)}
            className="p-1 hover:text-white rounded cursor-pointer"
          >
            <X className="w-3.5 h-3.5" />
          </button>
        </div>
      )}

      {/* Mic Warning Banner if blocked */}
      {micError && (
        <div className="relative z-20 max-w-xl mx-auto mt-2 px-4 py-2 bg-amber-500/20 border border-amber-500/40 rounded-xl text-amber-200 text-xs flex items-center justify-between gap-3 backdrop-blur-md">
          <div className="flex items-center gap-2">
            <AlertCircle className="w-4 h-4 text-amber-400 flex-shrink-0" />
            <span>{micError}</span>
          </div>
          <button
            onClick={() => setMicError(null)}
            className="p-1 hover:text-white rounded"
          >
            <X className="w-3.5 h-3.5" />
          </button>
        </div>
      )}

      {/* =========================================================================
          VIEW 1: IMMERSIVE VOICE CALL MODE (CHATGPT VOICE / GEMINI LIVE)
         ========================================================================= */}
      {classroomView === 'voice_call' ? (
        <>
          {/* CENTER: Living Gemini/ChatGPT Orb with Preserved TUTeach Logo */}
          <main className="relative z-10 flex-1 flex flex-col items-center justify-center p-4 sm:p-8">
            <div className="flex flex-col items-center text-center space-y-5">
              {/* Central Logo Container with Sound Visualizer (Click to Talk / Interrupt) */}
              <div
                onClick={handleCenterAvatarClick}
                className="relative flex items-center justify-center cursor-pointer group"
                title="Click to speak or interrupt AI teacher (ChatGPT / Gemini Live style)"
              >
                {/* Gemini Live / ChatGPT Multi-Gradient Living Aura */}
                <div
                  className={`absolute inset-0 rounded-full transition-all duration-700 pointer-events-none -m-10 sm:-m-14 ${
                    callState === 'speaking'
                      ? 'bg-gradient-to-tr from-[#F14C2F]/40 via-purple-500/30 to-amber-400/40 blur-2xl animate-pulse scale-125'
                      : callState === 'listening'
                      ? 'bg-gradient-to-tr from-emerald-500/35 via-cyan-400/25 to-teal-500/30 blur-2xl animate-pulse scale-110'
                      : callState === 'thinking'
                      ? 'bg-gradient-to-tr from-purple-500/40 via-indigo-500/40 to-[#F14C2F]/30 blur-2xl animate-spin duration-3000 scale-115'
                      : 'bg-gradient-to-tr from-white/10 via-[#F14C2F]/15 to-white/5 blur-xl scale-100'
                  }`}
                />

                {/* Reactive audio frequency expanding rings */}
                {volumeLevel > 0 && (
                  <div
                    className="absolute inset-0 rounded-full border border-white/40 pointer-events-none transition-transform duration-75"
                    style={{ transform: `scale(${1 + volumeLevel * 0.45})` }}
                  />
                )}

                {/* Preserved Core TUTeach Logo */}
                <TUTeachLogo
                  size="phoneCall"
                  variant="iconOnly"
                  clickable={false}
                  callState={callState}
                  volumeLevel={volumeLevel}
                />

                {/* Click to Speak / Interrupt Tooltip Badge */}
                <div className="absolute -bottom-3 px-3 py-1 bg-black/80 backdrop-blur-md text-white/90 text-[11px] font-bold rounded-full border border-white/20 shadow-lg group-hover:scale-105 transition-transform flex items-center gap-1.5">
                  <span
                    className={`w-2 h-2 rounded-full ${
                      callState === 'speaking'
                        ? 'bg-[#F14C2F] animate-ping'
                        : callState === 'listening'
                        ? 'bg-emerald-400 animate-pulse'
                        : 'bg-amber-400'
                    }`}
                  />
                  <span>
                    {callState === 'speaking'
                      ? 'Tap to Interrupt'
                      : callState === 'listening'
                      ? 'Listening (Speak or Tap)'
                      : 'Tap to Speak'}
                  </span>
                </div>
              </div>

              {/* AI Teacher Name & Subtle Speaking State */}
              <div className="space-y-1 pt-2">
                <h2 className="text-xl sm:text-2xl font-bold text-white tracking-wide flex items-center justify-center gap-2">
                  <span>TUTutor</span>
                  <span className="text-xs px-2 py-0.5 rounded-full bg-[#F14C2F]/20 text-[#F14C2F] border border-[#F14C2F]/30 font-semibold flex items-center gap-1">
                    <Sparkles className="w-3 h-3" />
                    <span>Gemini Live Voice</span>
                  </span>
                </h2>
                <p className="text-xs sm:text-sm text-white/70">
                  {callState === 'speaking'
                    ? 'Speaking response... (Interrupt anytime by speaking or tapping avatar)'
                    : callState === 'listening'
                    ? 'Listening with VAD... Speak naturally or choose a suggestion below'
                    : callState === 'thinking'
                    ? 'Thinking with Gemini AI...'
                    : 'Ready • Start speaking anytime'}
                </p>
              </div>

              {/* Quick Voice Question Chips */}
              <div className="flex flex-wrap items-center justify-center gap-2 max-w-lg mx-auto pt-1">
                {suggestedFollowUps.slice(0, 4).map((chip, idx) => (
                  <button
                    key={idx}
                    onClick={() => sendStudentMessageToAI(chip)}
                    className="px-3 py-1.5 bg-white/10 hover:bg-[#F14C2F] hover:text-white text-xs text-white/90 rounded-full border border-white/15 transition-all shadow-xs cursor-pointer"
                  >
                    ✨ {chip}
                  </button>
                ))}
              </div>
            </div>
          </main>

          {/* BOTTOM: Live Subtitles Card & Subtle Call Controls */}
          <footer className="relative z-20 pb-8 px-4 sm:px-6 max-w-4xl mx-auto w-full space-y-4">
            {/* Live Subtitles Panel */}
            <div
              className={`p-4 sm:p-5 rounded-2xl backdrop-blur-xl border transition-all duration-300 shadow-2xl ${
                activeSpeaker === 'student'
                  ? 'bg-black/60 border-emerald-500/40 text-emerald-100'
                  : 'bg-black/60 border-[#F14C2F]/40 text-[#EFEBDA]'
              }`}
            >
              <div className="flex items-center justify-between mb-2 flex-wrap gap-2">
                <div className="flex items-center gap-3">
                  <div className="flex items-center gap-2">
                    <span
                      className={`w-2 h-2 rounded-full ${
                        activeSpeaker === 'student' ? 'bg-emerald-400' : 'bg-[#F14C2F]'
                      }`}
                    />
                    <span className="text-[11px] font-bold uppercase tracking-wider text-white/70">
                      {activeSpeaker === 'student' ? 'You' : `TUTutor (${voicePersona})`}
                    </span>
                  </div>

                  {/* VAD Live Activity & Silence Status Badge */}
                  <div
                    className={`inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[10px] font-semibold border transition-all ${
                      vadState === 'speech_active' || isVoiceActive
                        ? 'bg-emerald-500/20 text-emerald-300 border-emerald-500/40 animate-pulse'
                        : vadState === 'silence_detected'
                        ? 'bg-amber-500/20 text-amber-300 border-amber-500/40'
                        : vadState === 'responding'
                        ? 'bg-purple-500/20 text-purple-300 border-purple-500/40'
                        : 'bg-white/10 text-white/60 border-white/10'
                    }`}
                    title="Voice Activity Detection (VAD) automatically triggers response on speech end or silence"
                  >
                    <Activity className={`w-3 h-3 ${vadState === 'speech_active' || isVoiceActive ? 'animate-bounce text-emerald-400' : ''}`} />
                    <span>
                      {vadState === 'speech_active' || isVoiceActive
                        ? 'Voice Active'
                        : vadState === 'silence_detected'
                        ? 'Silence Detected • Responding'
                        : vadState === 'responding'
                        ? 'AI Responding'
                        : 'VAD Ready'}
                    </span>
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  {/* VAD Silence Threshold Controls Button */}
                  <div className="relative">
                    <button
                      type="button"
                      onClick={() => setShowVadSettings(!showVadSettings)}
                      className={`px-2 py-0.5 rounded-lg text-[10px] font-medium border flex items-center gap-1 transition-all cursor-pointer ${
                        showVadSettings
                          ? 'bg-[#F14C2F] text-white border-[#F14C2F]'
                          : 'bg-white/10 hover:bg-white/20 text-white/80 border-white/15'
                      }`}
                      title="Configure Voice Activity Detection (VAD) Silence Threshold"
                    >
                      <Sliders className="w-3 h-3" />
                      <span>VAD: {silenceThresholdMs}ms</span>
                    </button>

                    {/* VAD Settings Popover */}
                    {showVadSettings && (
                      <div className="absolute right-0 bottom-full mb-2 w-72 p-3 bg-zinc-900/95 border border-white/20 rounded-xl shadow-2xl backdrop-blur-xl z-50 text-white animate-in fade-in slide-in-from-bottom-2 duration-150">
                        <div className="flex items-center justify-between pb-2 border-b border-white/10 mb-2.5">
                          <div className="flex items-center gap-1.5 font-bold text-xs">
                            <Activity className="w-3.5 h-3.5 text-emerald-400" />
                            <span>VAD Silence Threshold</span>
                          </div>
                          <button
                            type="button"
                            onClick={() => setShowVadSettings(false)}
                            className="text-white/60 hover:text-white p-0.5 rounded cursor-pointer"
                          >
                            <X className="w-3.5 h-3.5" />
                          </button>
                        </div>

                        <p className="text-[11px] text-white/70 mb-3 leading-snug">
                          Adjust how quickly the AI triggers after you stop speaking (using Web Speech <code className="text-[#F14C2F] font-mono">onspeechend</code> and silence threshold):
                        </p>

                        {/* Presets */}
                        <div className="grid grid-cols-3 gap-1.5 mb-3">
                          {[
                            { label: 'Fast', ms: 300, desc: 'Snappy' },
                            { label: 'Natural', ms: 450, desc: 'Balanced' },
                            { label: 'Relaxed', ms: 750, desc: 'Long pause' },
                          ].map((preset) => (
                            <button
                              key={preset.ms}
                              type="button"
                              onClick={() => {
                                setSilenceThresholdMs(preset.ms);
                              }}
                              className={`px-2 py-1.5 rounded-lg text-center border text-[10px] transition-all cursor-pointer ${
                                silenceThresholdMs === preset.ms
                                  ? 'bg-[#F14C2F] text-white border-[#F14C2F] font-bold shadow-sm'
                                  : 'bg-white/5 hover:bg-white/10 text-white/80 border-white/10'
                              }`}
                            >
                              <div className="font-semibold">{preset.label}</div>
                              <div className="text-[9px] opacity-75">{preset.ms}ms</div>
                            </button>
                          ))}
                        </div>

                        {/* Custom Slider */}
                        <div className="space-y-1">
                          <div className="flex justify-between text-[10px] text-white/60">
                            <span>Custom Delay:</span>
                            <span className="font-mono font-bold text-[#F14C2F]">{silenceThresholdMs} ms</span>
                          </div>
                          <input
                            type="range"
                            min="200"
                            max="1200"
                            step="50"
                            value={silenceThresholdMs}
                            onChange={(e) => setSilenceThresholdMs(Number(e.target.value))}
                            className="w-full accent-[#F14C2F] h-1.5 bg-white/20 rounded-lg cursor-pointer"
                          />
                          <div className="flex justify-between text-[9px] text-white/40 pt-0.5">
                            <span>200ms (Snappy)</span>
                            <span>1200ms (Patient)</span>
                          </div>
                        </div>
                      </div>
                    )}
                  </div>

                  {activeSpeaker === 'tutor' && lastTutorSpeech && (
                    <div className="flex items-center gap-3">
                      <button
                        onClick={replayLastAIExplanation}
                        className="text-[11px] text-white/50 hover:text-white flex items-center gap-1 transition-colors cursor-pointer"
                        title="Replay Audio"
                      >
                        <RotateCcw className="w-3 h-3" /> Replay
                      </button>
                      <button
                        onClick={() => {
                          setReportTicketCode(null);
                          setReportTargetText(lastTutorSpeech);
                        }}
                        className="text-[11px] text-amber-300/80 hover:text-amber-200 flex items-center gap-1 transition-colors cursor-pointer"
                        title="Report an inaccurate, unsafe, or inappropriate AI response"
                      >
                        <Flag className="w-3 h-3" /> Report AI
                      </button>
                    </div>
                  )}
                </div>
              </div>

              <p className="text-sm sm:text-base font-medium leading-relaxed min-h-[48px]">
                {currentSubtitle ||
                  (languageMode === 'hindi_hinglish'
                    ? 'Kuch bhi poochiye, main sun raha hoon...'
                    : 'Say anything to ask TUTutor about DaVinci Resolve or any topic...')}
              </p>
            </div>

            {/* Fallback Text Input Drawer */}
            {showTextInput && (
              <form
                onSubmit={handleTextSubmit}
                className="flex items-center gap-2 p-2 bg-black/60 border border-white/20 rounded-2xl backdrop-blur-lg"
              >
                <input
                  type="text"
                  autoFocus
                  value={typedMessage}
                  onChange={(e) => setTypedMessage(e.target.value)}
                  placeholder={
                    languageMode === 'hindi_hinglish'
                      ? 'Apna sawaal type karein (e.g. Blade tool shortcut?)...'
                      : 'Type your question for TUTutor (e.g., How do I split a clip?)...'
                  }
                  className="flex-1 bg-transparent px-3 py-2 text-sm text-white placeholder-white/40 focus:outline-none"
                />
                <button
                  type="submit"
                  disabled={!typedMessage.trim()}
                  className="px-4 py-2 bg-[#F14C2F] hover:bg-[#d63b20] disabled:opacity-40 text-white rounded-xl text-xs font-bold transition-colors flex items-center gap-1.5 cursor-pointer"
                >
                  <Send className="w-3.5 h-3.5" />
                  <span>Send</span>
                </button>
                <button
                  type="button"
                  onClick={() => setShowTextInput(false)}
                  className="p-2 text-white/60 hover:text-white cursor-pointer"
                >
                  <X className="w-4 h-4" />
                </button>
              </form>
            )}

            {/* Essential Subtle Call Controls */}
            <div className="flex items-center justify-center gap-4 sm:gap-6 pt-2">
              {/* Mute / Unmute Button */}
              <button
                onClick={toggleMute}
                className={`w-14 h-14 rounded-full flex items-center justify-center transition-all duration-200 shadow-lg cursor-pointer ${
                  isMuted
                    ? 'bg-red-500/20 text-red-400 border border-red-500/40 hover:bg-red-500/30'
                    : 'bg-white/10 text-white border border-white/20 hover:bg-white/20 hover:scale-105'
                }`}
                title={isMuted ? 'Unmute Microphone' : 'Mute Microphone'}
              >
                {isMuted ? <MicOff className="w-6 h-6" /> : <Mic className="w-6 h-6" />}
              </button>

              {/* End Call / Connect Call Button */}
              <button
                onClick={handleToggleCall}
                className={`w-16 h-16 rounded-full flex items-center justify-center transition-all duration-200 shadow-xl cursor-pointer ${
                  callActive
                    ? 'bg-red-600 hover:bg-red-700 text-white hover:scale-105 shadow-red-600/30'
                    : 'bg-emerald-600 hover:bg-emerald-700 text-white hover:scale-105 shadow-emerald-600/30'
                }`}
                title={callActive ? 'End Call' : 'Resume Call'}
              >
                {callActive ? <PhoneOff className="w-7 h-7" /> : <PhoneCall className="w-7 h-7" />}
              </button>

              {/* Stop / Interrupt AI Speech */}
              <button
                onClick={() => stopAISpeech(true)}
                disabled={callState !== 'speaking'}
                className="w-14 h-14 rounded-full bg-white/10 disabled:opacity-30 text-white border border-white/20 hover:bg-white/20 flex items-center justify-center transition-all duration-200 cursor-pointer"
                title="Interrupt AI Speech"
              >
                <VolumeX className="w-6 h-6" />
              </button>

              {/* Keyboard / Text Toggle */}
              <button
                onClick={() => setShowTextInput(!showTextInput)}
                className={`w-14 h-14 rounded-full flex items-center justify-center transition-all duration-200 cursor-pointer ${
                  showTextInput
                    ? 'bg-[#F14C2F] text-white shadow-lg shadow-[#F14C2F]/30'
                    : 'bg-white/10 text-white border border-white/20 hover:bg-white/20'
                }`}
                title="Type a Question"
              >
                <Keyboard className="w-6 h-6" />
              </button>

              {/* Share Screenshot with AI Teacher Button */}
              <button
                onClick={() => screenshotFileInputRef.current?.click()}
                className="w-14 h-14 rounded-full flex items-center justify-center transition-all duration-200 cursor-pointer bg-white/10 text-white border border-white/20 hover:bg-[#F14C2F] hover:scale-105 shadow-lg group relative"
                title="Share Screenshot with AI Teacher (or Ctrl+V anywhere)"
              >
                <Camera className="w-6 h-6 text-[#F14C2F] group-hover:text-white transition-colors" />
                <span className="absolute -top-1 -right-1 w-3.5 h-3.5 bg-[#F14C2F] rounded-full flex items-center justify-center text-[8px] font-bold text-white">
                  +
                </span>
              </button>
            </div>
          </footer>
        </>
      ) : (
        /* =========================================================================
           VIEW 2: CHATGPT & GEMINI LIVE CONVERSATION STREAM MODE
           ========================================================================= */
        <main className="relative z-10 flex-1 flex flex-col max-w-4xl w-full mx-auto p-4 sm:p-6 overflow-hidden">
          {/* Scrollable Conversation Stream */}
          <div
            ref={chatScrollRef}
            className="flex-1 overflow-y-auto space-y-4 pr-1 scrollbar-thin scrollbar-thumb-white/20"
          >
            {/* Header Greeting Card */}
            <div className="p-4 rounded-2xl bg-gradient-to-r from-zinc-900/90 to-zinc-900/50 border border-white/10 backdrop-blur-md flex items-start gap-3.5">
              <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-[#F14C2F] to-amber-500 flex items-center justify-center text-white flex-shrink-0 shadow-lg shadow-[#F14C2F]/20">
                <Sparkles className="w-5 h-5" />
              </div>
              <div className="flex-1">
                <div className="flex items-center gap-2">
                  <h3 className="font-bold text-sm text-white">TUTutor • Gemini Live AI Classroom</h3>
                  <span className="text-[10px] px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 font-semibold">
                    Live VAD Active
                  </span>
                </div>
                <p className="text-xs text-white/70 mt-1 leading-relaxed">
                  Have a fluid conversation just like ChatGPT Voice or Gemini Live. Speak using the microphone or type below. Ask anything about {currentLesson.title}, keyboard shortcuts, or any topic.
                </p>
              </div>
            </div>

            {/* Conversation Messages */}
            {conversationHistory.length === 0 ? (
              <div className="py-12 text-center text-white/50 text-xs">
                No messages yet. Start speaking or pick a suggested topic below!
              </div>
            ) : (
              conversationHistory.map((item, idx) => (
                <div
                  key={idx}
                  className={`flex flex-col ${item.role === 'user' ? 'items-end' : 'items-start'}`}
                >
                  <div
                    className={`max-w-[85%] sm:max-w-xl rounded-2xl p-4 text-sm leading-relaxed backdrop-blur-md transition-all shadow-lg ${
                      item.role === 'user'
                        ? 'bg-[#3A3535] border border-white/20 text-white rounded-tr-xs'
                        : 'bg-zinc-900/95 border border-[#F14C2F]/30 text-[#EFEBDA] rounded-tl-xs'
                    }`}
                  >
                    {/* Message Header */}
                    <div className="flex items-center justify-between gap-3 mb-1.5 pb-1 border-b border-white/10 text-[11px] text-white/60">
                      <span className="font-bold flex items-center gap-1">
                        {item.role === 'user' ? (
                          'You'
                        ) : (
                          <>
                            <Sparkles className="w-3 h-3 text-[#F14C2F]" />
                            <span>TUTutor ({voicePersona})</span>
                          </>
                        )}
                      </span>
                      {item.timestamp && <span>{item.timestamp}</span>}
                    </div>

                    {/* Attached Screenshot Thumbnail */}
                    {item.screenshot && (
                      <div
                        onClick={() => setFullSizeScreenshot(item.screenshot || null)}
                        className="mb-2 relative group rounded-xl overflow-hidden border border-white/25 bg-black/40 max-w-xs cursor-pointer shadow-md"
                        title="Click to view full size"
                      >
                        <img
                          src={`data:${item.screenshot.mimeType};base64,${item.screenshot.base64}`}
                          alt="Workspace screenshot"
                          className="max-h-48 w-full object-cover rounded-xl transition-transform duration-200 group-hover:scale-105"
                        />
                        <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-1.5 text-xs font-bold text-white">
                          <ZoomIn className="w-4 h-4 text-[#F14C2F]" />
                          <span>View Fullscreen</span>
                        </div>
                      </div>
                    )}

                    {/* AI Visual Screen Observations Badge */}
                    {item.visualAnalysis && (
                      <div className="mb-2 p-2.5 bg-[#F14C2F]/15 border border-[#F14C2F]/30 rounded-xl text-xs text-[#EFEBDA] flex items-start gap-2 shadow-xs">
                        <Camera className="w-4 h-4 text-[#F14C2F] flex-shrink-0 mt-0.5" />
                        <div>
                          <span className="font-bold text-[#F14C2F]">Screen Inspection: </span>
                          <span className="text-white/90">{item.visualAnalysis}</span>
                        </div>
                      </div>
                    )}

                    {/* Message Content */}
                    <div className="whitespace-pre-wrap font-sans text-sm sm:text-[15px]">
                      {item.content}
                    </div>

                    {/* Assistant Message Actions (Play Audio, Copy Text, Report AI) */}
                    {item.role === 'assistant' && (
                      <div className="mt-3 pt-2 border-t border-white/10 flex items-center justify-between text-xs text-white/60">
                        <div className="flex items-center gap-2">
                          <button
                            onClick={() => speakAIResponse(item.content)}
                            className="px-2 py-1 rounded-lg hover:bg-white/10 text-white/80 hover:text-white flex items-center gap-1 transition-colors cursor-pointer"
                            title="Listen to this explanation"
                          >
                            <Volume2 className="w-3.5 h-3.5 text-[#F14C2F]" />
                            <span>Listen</span>
                          </button>
                          <button
                            onClick={() => handleCopyMessage(item.content, idx)}
                            className="px-2 py-1 rounded-lg hover:bg-white/10 text-white/80 hover:text-white flex items-center gap-1 transition-colors cursor-pointer"
                            title="Copy response"
                          >
                            {copiedMessageIndex === idx ? (
                              <>
                                <Check className="w-3.5 h-3.5 text-emerald-400" />
                                <span className="text-emerald-400">Copied!</span>
                              </>
                            ) : (
                              <>
                                <Copy className="w-3.5 h-3.5" />
                                <span>Copy</span>
                              </>
                            )}
                          </button>
                          <button
                            onClick={() => {
                              setReportTicketCode(null);
                              setReportTargetText(item.content);
                            }}
                            className="px-2 py-1 rounded-lg hover:bg-white/10 text-amber-300/80 hover:text-amber-200 flex items-center gap-1 transition-colors cursor-pointer"
                            title="Report AI response"
                          >
                            <Flag className="w-3.5 h-3.5" />
                            <span>Report AI</span>
                          </button>
                        </div>
                        <span className="text-[10px] font-mono text-white/40">
                          AI Tutor (Gemini)
                        </span>
                      </div>
                    )}
                  </div>
                </div>
              ))
            )}

            {/* Thinking / Submitting Indicator */}
            {callState === 'thinking' && (
              <div className="flex items-center gap-2.5 p-3 rounded-2xl bg-zinc-900/80 border border-amber-500/30 max-w-xs animate-pulse">
                <Sparkles className="w-4 h-4 text-amber-400 animate-spin" />
                <span className="text-xs text-amber-200 font-semibold">TUTutor is thinking...</span>
              </div>
            )}
          </div>

          {/* Suggested Follow-Up Prompt Chips */}
          <div className="pt-3 pb-2 flex items-center gap-2 overflow-x-auto scrollbar-none">
            <span className="text-[10px] uppercase font-bold text-white/40 flex-shrink-0">Suggestions:</span>
            {suggestedFollowUps.map((chip, idx) => (
              <button
                key={idx}
                onClick={() => sendStudentMessageToAI(chip)}
                className="px-3 py-1 rounded-full bg-white/10 hover:bg-[#F14C2F] text-xs text-white/90 border border-white/15 whitespace-nowrap transition-all cursor-pointer flex-shrink-0"
              >
                {chip}
              </button>
            ))}
          </div>

          {/* Bottom Chat Bar with Voice & Text Input */}
          <div className="pt-2">
            <form
              onSubmit={handleTextSubmit}
              className="flex items-center gap-2 p-2 bg-black/70 border border-white/20 rounded-2xl backdrop-blur-xl shadow-2xl"
            >
              {/* Mic / VAD Button */}
              <button
                type="button"
                onClick={handleCenterAvatarClick}
                className={`p-2.5 rounded-xl transition-all cursor-pointer ${
                  vadState === 'speech_active' || isVoiceActive
                    ? 'bg-emerald-500 text-white animate-pulse shadow-lg shadow-emerald-500/30'
                    : callState === 'listening'
                    ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/40 animate-pulse'
                    : callState === 'speaking'
                    ? 'bg-[#F14C2F] text-white animate-pulse'
                    : 'bg-white/10 hover:bg-white/20 text-white'
                }`}
                title={callState === 'speaking' ? 'Interrupt AI' : 'Speak to AI (VAD enabled)'}
              >
                {isMuted ? <MicOff className="w-5 h-5 text-red-400" /> : <Mic className="w-5 h-5" />}
              </button>

              <input
                type="text"
                value={typedMessage}
                onChange={(e) => setTypedMessage(e.target.value)}
                placeholder={
                  languageMode === 'hindi_hinglish'
                    ? 'Apna sawaal likhein ya mic par bolein...'
                    : 'Ask TUTutor anything or speak with voice...'
                }
                className="flex-1 bg-transparent px-3 py-2 text-sm text-white placeholder-white/40 focus:outline-none"
              />

              {/* Share Screenshot with AI Teacher Button */}
              <button
                type="button"
                onClick={() => screenshotFileInputRef.current?.click()}
                className="p-2.5 rounded-xl bg-white/10 hover:bg-[#F14C2F] text-white transition-all cursor-pointer group"
                title="Share Screenshot with AI Teacher (or Ctrl+V anywhere)"
              >
                <Camera className="w-4 h-4 text-[#F14C2F] group-hover:text-white transition-colors" />
              </button>

              <button
                type="submit"
                disabled={!typedMessage.trim()}
                className="p-2.5 bg-[#F14C2F] hover:bg-[#d63b20] disabled:opacity-30 text-white rounded-xl transition-all cursor-pointer"
                title="Send Message"
              >
                <Send className="w-4 h-4" />
              </button>
            </form>
          </div>
        </main>
      )}

      {/* =========================================================================
          UNBROKEN LESSON & TASK SLIDE-OVER DRAWER
          Provides lesson notes, hands-on task submission, and 43-lesson navigator
          WITHOUT interrupting the phone call or navigating away from the page!
         ========================================================================= */}
      {drawerOpen && (
        <div className="fixed inset-0 z-50 flex justify-end bg-black/60 backdrop-blur-xs">
          <div className="w-full max-w-xl bg-[#FAF7EE] text-[#393636] h-full shadow-2xl flex flex-col border-l border-[#393636]/20 animate-in slide-in-from-right duration-300">
            {/* Drawer Header */}
            <div className="p-4 bg-[#393636] text-white flex items-center justify-between">
              <div className="flex items-center gap-3">
                <TUTeachLogo size="sm" variant="iconOnly" clickable={false} />
                <div>
                  <h3 className="font-bold text-sm text-[#EFEBDA] leading-tight">
                    {currentLesson.title}
                  </h3>
                  <p className="text-xs text-white/60">
                    Lesson {currentLessonIndex + 1} of {allLessons.length}
                  </p>
                </div>
              </div>
              <button
                onClick={() => setDrawerOpen(false)}
                className="p-1.5 text-white/70 hover:text-white rounded-lg hover:bg-white/10"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Drawer Tab Switcher */}
            <div className="flex border-b border-[#393636]/10 bg-white">
              <button
                onClick={() => setDrawerTab('notes')}
                className={`flex-1 py-3 text-xs font-bold uppercase tracking-wider text-center border-b-2 transition-colors flex items-center justify-center gap-1.5 ${
                  drawerTab === 'notes'
                    ? 'border-[#F14C2F] text-[#F14C2F] bg-[#FAF7EE]'
                    : 'border-transparent text-gray-500 hover:text-gray-800'
                }`}
              >
                <BookOpen className="w-3.5 h-3.5" />
                <span>Notes & Guide</span>
              </button>
              <button
                onClick={() => setDrawerTab('task')}
                className={`flex-1 py-3 text-xs font-bold uppercase tracking-wider text-center border-b-2 transition-colors flex items-center justify-center gap-1.5 ${
                  drawerTab === 'task'
                    ? 'border-[#F14C2F] text-[#F14C2F] bg-[#FAF7EE]'
                    : 'border-transparent text-gray-500 hover:text-gray-800'
                }`}
              >
                <FileText className="w-3.5 h-3.5" />
                <span>Task Lab (/10)</span>
              </button>
              <button
                onClick={() => setDrawerTab('syllabus')}
                className={`flex-1 py-3 text-xs font-bold uppercase tracking-wider text-center border-b-2 transition-colors flex items-center justify-center gap-1.5 ${
                  drawerTab === 'syllabus'
                    ? 'border-[#F14C2F] text-[#F14C2F] bg-[#FAF7EE]'
                    : 'border-transparent text-gray-500 hover:text-gray-800'
                }`}
              >
                <Layers className="w-3.5 h-3.5" />
                <span>43 Lessons</span>
              </button>
            </div>

            {/* Drawer Body Content */}
            <div className="flex-1 overflow-y-auto p-6 space-y-6">
              {drawerTab === 'notes' && (
                <div className="space-y-6">
                  {/* Lesson Overview */}
                  <div className="bg-white p-5 rounded-2xl border border-[#393636]/10 shadow-xs space-y-3">
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-bold uppercase tracking-wider text-[#F14C2F]">
                        Lesson Overview
                      </span>
                      <span className="text-xs text-gray-500 flex items-center gap-1">
                        <Clock className="w-3.5 h-3.5" /> {currentLesson.durationMinutes || 25} Mins
                      </span>
                    </div>
                    <p className="text-sm text-gray-700 leading-relaxed">
                      {currentLesson.summary}
                    </p>
                  </div>

                  {/* DaVinci Resolve Key Takeaways & Workflow Steps */}
                  {currentLesson.keyTakeaways && currentLesson.keyTakeaways.length > 0 && (
                    <div className="bg-white p-5 rounded-2xl border border-[#393636]/10 shadow-xs space-y-3">
                      <h4 className="font-bold text-sm text-[#393636]">
                        Key Workflow Takeaways
                      </h4>
                      <div className="space-y-2">
                        {currentLesson.keyTakeaways.map((takeaway: string, i: number) => (
                          <div
                            key={i}
                            className="p-3 bg-[#FAF7EE] rounded-xl border border-[#393636]/10 flex items-start gap-2.5"
                          >
                            <span className="w-5 h-5 rounded-full bg-[#F14C2F]/10 text-[#F14C2F] text-xs font-bold flex items-center justify-center flex-shrink-0 mt-0.5">
                              {i + 1}
                            </span>
                            <span className="text-xs text-gray-700 leading-relaxed">{takeaway}</span>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Mark as completed toggle */}
                  <div className="bg-white p-4 rounded-2xl border border-[#393636]/10 flex items-center justify-between">
                    <div>
                      <p className="text-xs font-bold text-[#393636]">Lesson Progress</p>
                      <p className="text-xs text-gray-500">
                        {completedLessonIds.includes(currentLesson.id)
                          ? 'Completed'
                          : 'In progress'}
                      </p>
                    </div>
                    <button
                      onClick={() => toggleLessonCompletion(currentLesson.id)}
                      className={`px-4 py-2 rounded-xl text-xs font-bold transition-colors flex items-center gap-1.5 ${
                        completedLessonIds.includes(currentLesson.id)
                          ? 'bg-emerald-100 text-emerald-800'
                          : 'bg-[#393636] text-white hover:bg-black'
                      }`}
                    >
                      <CheckCircle2 className="w-4 h-4" />
                      <span>
                        {completedLessonIds.includes(currentLesson.id)
                          ? 'Completed'
                          : 'Mark Complete'}
                      </span>
                    </button>
                  </div>
                </div>
              )}

              {drawerTab === 'task' && currentLesson.practicalAssignment && (
                <div>
                  <AssignmentLab
                    course={course}
                    lesson={currentLesson}
                    assignment={currentLesson.practicalAssignment}
                    onRepeatLesson={() => setDrawerTab('notes')}
                    onClearDoubts={() => {
                      setDrawerOpen(false);
                      const doubtMsg = `TUTutor, I'm working on ${currentLesson.practicalAssignment?.title || 'this assignment'} and would love some help clearing my doubts on the requirements. Can you guide me through it?`;
                      sendStudentMessageToAIRef.current(doubtMsg);
                    }}
                  />
                </div>
              )}


              {drawerTab === 'syllabus' && (
                <div className="space-y-4">
                  <div className="text-xs font-bold uppercase tracking-wider text-gray-500 mb-2">
                    DaVinci Resolve Full Syllabus (8 Modules, 43 Lessons)
                  </div>
                  {course.modules.map((mod, modIdx) => (
                    <div
                      key={mod.id}
                      className="bg-white rounded-2xl border border-[#393636]/10 overflow-hidden"
                    >
                      <div className="p-3 bg-gray-50 border-b border-gray-100 font-bold text-xs text-[#393636]">
                        Module {modIdx + 1}: {mod.title}
                      </div>
                      <div className="divide-y divide-gray-100">
                        {mod.lessons.map((les) => {
                          const isCompleted = completedLessonIds.includes(les.id);
                          const isSelected = les.id === currentLesson.id;
                          return (
                            <button
                              key={les.id}
                              onClick={() => handleSelectLesson(les.id)}
                              className={`w-full p-3 text-left text-xs flex items-center justify-between transition-colors ${
                                isSelected
                                  ? 'bg-[#F14C2F]/10 font-bold text-[#F14C2F]'
                                  : 'hover:bg-gray-50 text-gray-700'
                              }`}
                            >
                              <div className="flex items-center gap-2 truncate">
                                <span
                                  className={`w-2 h-2 rounded-full flex-shrink-0 ${
                                    isCompleted ? 'bg-emerald-500' : 'bg-gray-300'
                                  }`}
                                />
                                <span className="truncate">{les.title}</span>
                              </div>
                              {isCompleted && (
                                <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600 flex-shrink-0" />
                              )}
                            </button>
                          );
                        })}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Drawer Footer with Next / Prev Lesson Navigation */}
            <div className="p-4 bg-white border-t border-[#393636]/10 flex items-center justify-between">
              <button
                disabled={currentLessonIndex === 0}
                onClick={() => {
                  if (currentLessonIndex > 0) {
                    handleSelectLesson(allLessons[currentLessonIndex - 1].id);
                  }
                }}
                className="px-3 py-2 bg-gray-100 hover:bg-gray-200 disabled:opacity-30 rounded-xl text-xs font-semibold text-[#393636] flex items-center gap-1"
              >
                <ChevronLeft className="w-4 h-4" />
                <span>Prev Lesson</span>
              </button>

              <span className="text-xs text-gray-500 font-medium">
                {currentLessonIndex + 1} of {allLessons.length}
              </span>

              <button
                disabled={currentLessonIndex >= allLessons.length - 1}
                onClick={() => {
                  if (currentLessonIndex < allLessons.length - 1) {
                    handleSelectLesson(allLessons[currentLessonIndex + 1].id);
                  }
                }}
                className="px-3 py-2 bg-[#F14C2F] hover:bg-[#d63b20] disabled:opacity-30 rounded-xl text-xs font-semibold text-white flex items-center gap-1"
              >
                <span>Next Lesson</span>
                <ChevronRight className="w-4 h-4" />
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Certificate Modal if unlocked */}
      {activeCertificate && (
        <CertificateModal
          certificate={activeCertificate}
          onClose={() => setActiveCertificate(null)}
        />
      )}

      {/* Hidden File Input for Screenshot */}
      <input
        ref={screenshotFileInputRef}
        type="file"
        accept="image/png,image/jpeg,image/webp"
        className="hidden"
        onChange={(e) => {
          if (e.target.files?.[0]) {
            processImageFile(e.target.files[0]);
          }
          e.target.value = '';
        }}
      />

      {/* Drag & Drop Overlay */}
      {isDraggingOver && (
        <div className="fixed inset-0 z-50 bg-[#F14C2F]/20 backdrop-blur-xs border-4 border-dashed border-[#F14C2F] flex flex-col items-center justify-center pointer-events-none animate-pulse">
          <Camera className="w-16 h-16 text-white mb-2" />
          <p className="text-xl font-bold text-white">Drop Screenshot to Share with AI Teacher</p>
          <p className="text-sm text-white/80">Supports PNG, JPG, WebP</p>
        </div>
      )}

      {/* Screenshot Preview Modal (Before Sending to AI) */}
      {screenshotPreview && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md">
          <div className="bg-zinc-900 border border-white/20 rounded-3xl max-w-lg w-full p-6 text-white shadow-2xl space-y-4 animate-in fade-in zoom-in-95 duration-150">
            <div className="flex items-center justify-between border-b border-white/10 pb-3">
              <div className="flex items-center gap-2">
                <Camera className="w-5 h-5 text-[#F14C2F]" />
                <h3 className="font-bold text-base">Share Screenshot with AI Teacher</h3>
              </div>
              <button
                onClick={() => setScreenshotPreview(null)}
                className="p-1 rounded-lg text-white/60 hover:text-white hover:bg-white/10 cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Thumbnail Preview */}
            <div className="rounded-2xl overflow-hidden border border-white/20 max-h-56 bg-black/50 flex items-center justify-center">
              <img
                src={`data:${screenshotPreview.mimeType};base64,${screenshotPreview.base64}`}
                alt="Captured timeline"
                className="max-h-56 w-full object-contain"
              />
            </div>

            {/* Optional Note / Question */}
            <div>
              <label className="block text-xs font-semibold text-white/80 mb-1.5">
                Add an optional question or context for TUTutor:
              </label>
              <input
                type="text"
                autoFocus
                value={screenshotPreview.note}
                onChange={(e) =>
                  setScreenshotPreview({ ...screenshotPreview, note: e.target.value })
                }
                placeholder="e.g. Look at my timeline here, why is the cut misaligned?"
                className="w-full px-3.5 py-2.5 bg-black/50 border border-white/20 rounded-xl text-sm text-white placeholder-white/40 focus:outline-none focus:border-[#F14C2F]"
                onKeyDown={(e) => {
                  if (e.key === 'Enter') {
                    e.preventDefault();
                    handleSendScreenshot();
                  }
                }}
              />
            </div>

            <div className="flex items-center justify-between pt-2">
              <span className="text-[11px] text-white/50">
                Gemini 3.8 Multimodal Vision Analysis
              </span>

              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => setScreenshotPreview(null)}
                  className="px-4 py-2 text-xs font-semibold text-white/70 hover:text-white cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  onClick={handleSendScreenshot}
                  disabled={isAnalyzingScreenshot}
                  className="px-5 py-2.5 bg-[#F14C2F] hover:bg-[#d63b20] disabled:opacity-50 text-white font-bold rounded-xl text-xs flex items-center gap-2 shadow-md cursor-pointer transition-all"
                >
                  {isAnalyzingScreenshot ? (
                    <>
                      <Sparkles className="w-4 h-4 animate-spin" />
                      Analyzing...
                    </>
                  ) : (
                    <>
                      <Send className="w-4 h-4" />
                      Ask AI Mentor
                    </>
                  )}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Full-Size Screenshot Lightbox Modal */}
      {fullSizeScreenshot && (
        <div
          onClick={() => setFullSizeScreenshot(null)}
          className="fixed inset-0 z-50 bg-black/90 backdrop-blur-md flex items-center justify-center p-4 cursor-zoom-out"
        >
          <div className="relative max-w-5xl max-h-[90vh]">
            <img
              src={`data:${fullSizeScreenshot.mimeType};base64,${fullSizeScreenshot.base64}`}
              alt="Enlarged screenshot"
              className="max-w-full max-h-[85vh] object-contain rounded-xl shadow-2xl border border-white/20"
            />
            <button
              onClick={() => setFullSizeScreenshot(null)}
              className="absolute -top-3 -right-3 p-2 bg-[#F14C2F] text-white rounded-full shadow-lg hover:scale-105 transition-transform cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>
      )}

      {/* Pre-Use AI Transparency & Safety Disclosure Gate */}
      {!hasAcceptedAiDisclosure && (
        <div className="fixed inset-0 z-50 bg-black/85 backdrop-blur-md flex items-center justify-center p-4">
          <div className="w-full max-w-lg bg-[#FAF7EE] text-[#393636] rounded-3xl p-6 sm:p-8 shadow-2xl border-2 border-[#F14C2F]/30 space-y-5">
            <div className="flex items-center gap-3">
              <div className="w-11 h-11 rounded-2xl bg-[#F14C2F]/10 text-[#F14C2F] flex items-center justify-center shrink-0">
                <ShieldAlert className="w-6 h-6" />
              </div>
              <div>
                <span className="text-[10px] font-bold uppercase tracking-wider text-[#F14C2F]">
                  Pre-Use AI Transparency & Safety Notice
                </span>
                <h2 className="text-lg sm:text-xl font-bold text-[#393636]">
                  Before You Start Learning with TUTutor
                </h2>
              </div>
            </div>

            <div className="space-y-2.5 text-xs sm:text-sm text-[#393636]/85 bg-white p-4 rounded-2xl border border-[#393636]/10">
              <p>
                <strong>1. Artificial Intelligence Tutor:</strong> TUTutor (Golu Guru) is an automated AI system powered by Google Gemini APIs — not a human instructor. AI responses are educational aids and may occasionally contain errors.
              </p>
              <p>
                <strong>2. Data & Screenshots:</strong> Voice transcripts, chat messages, and workspace screenshots you upload are processed via Google Gemini APIs to guide your editing workflow. Do not upload or paste passwords, payment card details, ID documents, phone numbers, or unrelated personal faces in screenshots.
              </p>
              <p>
                <strong>3. Safety & Reporting:</strong> Automated PII masking and student safety guardrails are active. You can flag any AI response at any time using the <strong>Report AI</strong> button.
              </p>
            </div>

            {aiDisclosureError && (
              <div className="p-3 bg-rose-50 border border-rose-200 rounded-xl text-xs font-semibold text-rose-700">
                {aiDisclosureError}
              </div>
            )}

            <div className="flex flex-col sm:flex-row items-center justify-between gap-3 pt-1">
              <button
                type="button"
                onClick={() => navigate('ai-disclosure')}
                className="text-xs font-semibold text-[#393636]/75 hover:text-[#F14C2F] underline cursor-pointer"
              >
                Read Full AI Transparency Notice
              </button>
              <div className="flex items-center gap-2 w-full sm:w-auto">
                <button
                  type="button"
                  onClick={() => navigate('dashboard')}
                  className="flex-1 sm:flex-none px-4 py-2.5 bg-white border border-[#393636]/20 text-[#393636] text-xs font-bold rounded-xl cursor-pointer"
                >
                  Back to Dashboard
                </button>
                <button
                  type="button"
                  onClick={handleAcceptAiDisclosure}
                  disabled={acceptingAiDisclosure}
                  className="flex-1 sm:flex-none px-5 py-2.5 bg-[#F14C2F] hover:bg-[#d63b20] disabled:opacity-50 text-white text-xs font-bold rounded-xl shadow-md cursor-pointer"
                >
                  {acceptingAiDisclosure ? 'Recording...' : 'I Understand & Continue'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Report AI Response Escalation Modal */}
      {reportTargetText !== null && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-md flex items-center justify-center p-4">
          <div className="w-full max-w-md bg-[#FAF7EE] text-[#393636] rounded-3xl p-6 shadow-2xl border border-[#393636]/15 space-y-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Flag className="w-5 h-5 text-[#F14C2F]" />
                <h3 className="font-bold text-base">Report AI Response</h3>
              </div>
              <button
                type="button"
                onClick={() => {
                  setReportTargetText(null);
                  setReportTicketCode(null);
                }}
                className="p-1 text-[#393636]/60 hover:text-[#393636] cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {reportTicketCode ? (
              <div className="space-y-3">
                <div className="p-4 bg-emerald-50 border border-emerald-200 rounded-2xl text-xs text-emerald-900 space-y-1">
                  <p className="font-bold">AI Safety Report Logged</p>
                  <p>
                    Grievance Reference Code: <strong className="font-mono">{reportTicketCode}</strong>
                  </p>
                  <p>Our compliance team reviews flagged AI outputs within our published grievance SLA.</p>
                </div>
                <button
                  type="button"
                  onClick={() => {
                    setReportTargetText(null);
                    setReportTicketCode(null);
                  }}
                  className="w-full py-2.5 bg-[#393636] text-white text-xs font-bold rounded-xl cursor-pointer"
                >
                  Close
                </button>
              </div>
            ) : (
              <form onSubmit={handleSubmitAiReport} className="space-y-3">
                <div className="p-3 bg-white rounded-xl border border-[#393636]/10 text-xs text-[#393636]/80 max-h-24 overflow-y-auto">
                  "{reportTargetText.slice(0, 260)}{reportTargetText.length > 260 ? '...' : ''}"
                </div>
                <div>
                  <label className="block text-xs font-semibold mb-1">Reason for reporting</label>
                  <select
                    value={reportReason}
                    onChange={(e) => setReportReason(e.target.value)}
                    className="w-full px-3 py-2 bg-white border border-[#393636]/20 rounded-xl text-xs text-[#393636]"
                  >
                    <option>Inaccurate or confusing technical instruction</option>
                    <option>Unsafe, inappropriate, or uncomfortable response</option>
                    <option>Requested personal or sensitive information</option>
                    <option>Harassment or offensive language</option>
                  </select>
                </div>
                <div className="flex items-center justify-end gap-2 pt-1">
                  <button
                    type="button"
                    onClick={() => setReportTargetText(null)}
                    className="px-4 py-2 text-xs font-semibold text-[#393636]/70 cursor-pointer"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={isReportingAi}
                    className="px-4 py-2 bg-[#F14C2F] hover:bg-[#d63b20] disabled:opacity-50 text-white text-xs font-bold rounded-xl cursor-pointer"
                  >
                    {isReportingAi ? 'Submitting...' : 'Submit Safety Report'}
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
