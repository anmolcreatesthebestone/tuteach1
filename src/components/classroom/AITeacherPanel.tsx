import React, { useState, useEffect, useRef } from 'react';
import { useApp } from '../../context/AppContext';
import { TutorMode, ChatMessage, Course, Lesson, LanguageMode } from '../../types';
import {
  Sparkles,
  Send,
  Mic,
  MicOff,
  Volume2,
  VolumeX,
  RotateCcw,
  HelpCircle,
  Lightbulb,
  Code,
  Flame,
  MessageSquare,
  Globe,
  AlertTriangle,
  Play,
  Square,
  Check
} from 'lucide-react';

interface AITeacherPanelProps {
  course: Course;
  lesson: Lesson;
  onJumpToAssignment?: () => void;
}

export const AITeacherPanel: React.FC<AITeacherPanelProps> = ({
  course,
  lesson,
  onJumpToAssignment
}) => {
  const { user, languageMode, setLanguageMode } = useApp();
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [inputText, setInputText] = useState('');
  const [loading, setLoading] = useState(false);
  const [mode, setMode] = useState<TutorMode>('socratic');
  
  // Audio state
  const [isSpeaking, setIsSpeaking] = useState(false);
  const [audioAutoPlay, setAudioAutoPlay] = useState(true);
  const [currentlySpeakingMsgId, setCurrentlySpeakingMsgId] = useState<string | null>(null);

  // Voice input state
  const [isListening, setIsListening] = useState(false);
  const [micPermissionDenied, setMicPermissionDenied] = useState(false);
  const [micErrorText, setMicErrorText] = useState<string | null>(null);

  const messagesEndRef = useRef<HTMLDivElement>(null);
  const speechRecognitionRef = useRef<any>(null);

  // Initialize introductory message when lesson or language changes
  useEffect(() => {
    const isHindi = languageMode === 'hindi_hinglish';
    const welcomeText = isHindi
      ? `Namaste ${user ? user.name.split(' ')[0] : ''}! Main aapka **DaVinci Resolve AI Teacher** hoon.

Ham abhi **${lesson.title}** seekh rahe hain. 
${lesson.summary}

Aap mujhse text ya mic (voice) ke zariye koi bhi sawaal pooch sakte hain. Kya aapne apne system par DaVinci Resolve open kar liya hai?`
      : `Hello ${user ? user.name.split(' ')[0] : 'there'}! I am **TUTutor**, your personal AI teacher for **${course.title}**.

We are currently on **${lesson.title}**. 
${lesson.summary}

Feel free to ask questions using voice or text. To start, do you have DaVinci Resolve open on your computer right now?`;

    setMessages([
      {
        id: `msg-welcome-${lesson.id}-${languageMode}`,
        sender: 'tutor',
        text: welcomeText,
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        mode: 'socratic',
        language: languageMode
      }
    ]);
  }, [lesson.id, course.id, user, languageMode]);

  // Scroll to bottom when messages change
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, loading]);

  // Text-To-Speech helper
  const speakText = (text: string, msgId?: string) => {
    if (!('speechSynthesis' in window)) return;
    window.speechSynthesis.cancel();
    
    // Clean markdown formatting from spoken speech
    const cleanText = text
      .replace(/```[\s\S]*?```/g, '')
      .replace(/[*_#`]/g, '')
      .replace(/\[.*?\]\(.*?\)/g, '');

    const utterance = new SpeechSynthesisUtterance(cleanText);
    utterance.rate = 1.0;
    utterance.pitch = 1.0;

    // Language selection for voice synthesis
    if (languageMode === 'hindi_hinglish') {
      utterance.lang = 'hi-IN';
      const voices = window.speechSynthesis.getVoices();
      const hindiVoice = voices.find(v => v.lang.includes('hi') || v.lang.includes('IN'));
      if (hindiVoice) utterance.voice = hindiVoice;
    } else {
      utterance.lang = 'en-US';
      const voices = window.speechSynthesis.getVoices();
      const englishVoice = voices.find(v => v.lang.startsWith('en') && (v.name.includes('Natural') || v.name.includes('Google') || v.name.includes('Samantha')));
      if (englishVoice) utterance.voice = englishVoice;
    }

    utterance.onstart = () => {
      setIsSpeaking(true);
      if (msgId) setCurrentlySpeakingMsgId(msgId);
    };

    utterance.onend = () => {
      setIsSpeaking(false);
      setCurrentlySpeakingMsgId(null);
    };

    utterance.onerror = () => {
      setIsSpeaking(false);
      setCurrentlySpeakingMsgId(null);
    };

    window.speechSynthesis.speak(utterance);
  };

  const stopSpeaking = () => {
    if ('speechSynthesis' in window) {
      window.speechSynthesis.cancel();
    }
    setIsSpeaking(false);
    setCurrentlySpeakingMsgId(null);
  };

  // Microphone Voice Input helper (SpeechRecognition with permission handling)
  const toggleListening = async () => {
    setMicErrorText(null);

    const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
    if (!SpeechRecognition) {
      setMicErrorText('Speech recognition is not supported in this browser. Please use Chrome, Edge, or Safari, or type your question.');
      return;
    }

    if (isListening) {
      speechRecognitionRef.current?.stop();
      setIsListening(false);
      return;
    }

    // Explicitly test and request microphone permissions first
    try {
      if (navigator.mediaDevices && navigator.mediaDevices.getUserMedia) {
        await navigator.mediaDevices.getUserMedia({ audio: true });
        setMicPermissionDenied(false);
      }
    } catch (permErr: any) {
      console.warn('Microphone permission request failed:', permErr);
      setMicPermissionDenied(true);
      setMicErrorText('Microphone access was denied. Please allow microphone permissions in your browser address bar to speak with TUTutor.');
      return;
    }

    try {
      const recognition = new SpeechRecognition();
      recognition.continuous = false;
      recognition.interimResults = true;
      recognition.lang = languageMode === 'hindi_hinglish' ? 'hi-IN' : 'en-US';

      recognition.onstart = () => {
        setIsListening(true);
        setMicErrorText(null);
      };

      recognition.onresult = (event: any) => {
        const transcript = Array.from(event.results)
          .map((res: any) => res[0].transcript)
          .join('');
        setInputText(transcript);
      };

      recognition.onerror = (event: any) => {
        console.error('Speech recognition error event:', event);
        setIsListening(false);
        if (event.error === 'not-allowed') {
          setMicPermissionDenied(true);
          setMicErrorText('Microphone permission denied by browser. Click the lock/tune icon in your address bar to enable mic.');
        } else if (event.error === 'no-speech') {
          setMicErrorText('No speech detected. Please speak clearly into your microphone.');
        } else {
          setMicErrorText(`Speech recognition note: ${event.error}. You can also type directly.`);
        }
      };

      recognition.onend = () => {
        setIsListening(false);
      };

      speechRecognitionRef.current = recognition;
      recognition.start();
    } catch (err: any) {
      console.error('Speech recognition initialization error:', err);
      setIsListening(false);
      setMicErrorText('Could not start speech recognition in this window context. You can type your question.');
    }
  };

  const handleSendMessage = async (textToSend?: string) => {
    const query = textToSend || inputText;
    if (!query.trim() || loading) return;

    // Stop speaking if currently speaking
    stopSpeaking();

    const userMsg: ChatMessage = {
      id: `msg-u-${Date.now()}`,
      sender: 'user',
      text: query.trim(),
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      language: languageMode
    };

    setMessages(prev => [...prev, userMsg]);
    setInputText('');
    setLoading(true);

    try {
      const res = await fetch('/api/tutor/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          message: query,
          history: messages.slice(-5).map(m => ({ sender: m.sender, text: m.text })),
          courseTitle: course.title,
          lessonTitle: lesson.title,
          lessonContent: lesson.detailedContent,
          mode,
          language: languageMode,
          studentLevel: course.level
        })
      });

      const data = await res.json();
      const replyText = data.reply || (languageMode === 'hindi_hinglish'
        ? "Maine aapka sawal dekha. DaVinci Resolve ke is step par aapko screen par kya dikh raha hai?"
        : "I have reviewed your DaVinci Resolve question. What do you see on your screen right now?");

      const tutorMsgId = `msg-t-${Date.now()}`;
      const tutorMsg: ChatMessage = {
        id: tutorMsgId,
        sender: 'tutor',
        text: replyText,
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        mode,
        language: languageMode
      };

      setMessages(prev => [...prev, tutorMsg]);

      // Speak answer if audio is enabled
      if (audioAutoPlay) {
        speakText(replyText, tutorMsgId);
      }
    } catch (error) {
      console.error('Tutor chat request failed:', error);
      const fallbackMsg: ChatMessage = {
        id: `msg-err-${Date.now()}`,
        sender: 'tutor',
        text: languageMode === 'hindi_hinglish'
          ? `Main aapko DaVinci Resolve step-by-step sikhaunga. Batayein, kya aapne **${lesson.title}** ka exercise shuru kiya?`
          : `As your DaVinci Resolve tutor for **${lesson.title}**, let's take it one step at a time. What does your screen show?`,
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        language: languageMode
      };
      setMessages(prev => [...prev, fallbackMsg]);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex flex-col h-full bg-white rounded-2xl border border-[#393636]/15 shadow-sm overflow-hidden">
      {/* Header Bar */}
      <div className="px-4 py-3 bg-[#393636] text-white flex items-center justify-between border-b border-black/20">
        <div className="flex items-center gap-2.5">
          <div className="relative">
            <div className="w-8 h-8 rounded-full bg-[#F14C2F] flex items-center justify-center text-white shadow-xs">
              <Sparkles className="w-4 h-4" />
            </div>
            <div className={`absolute -bottom-0.5 -right-0.5 w-2.5 h-2.5 rounded-full border-2 border-[#393636] ${
              loading ? 'bg-amber-400 animate-ping' : isSpeaking ? 'bg-purple-400 animate-pulse' : 'bg-emerald-500'
            }`} />
          </div>
          <div>
            <div className="flex items-center gap-1.5 leading-none">
              <h3 className="font-bold text-sm text-white">TUTutor AI</h3>
              <span className="text-[10px] bg-[#F14C2F]/20 text-[#F14C2F] border border-[#F14C2F]/30 px-1 py-0.2 rounded font-semibold">
                DaVinci Resolve Teacher
              </span>
            </div>
            <p className="text-[11px] text-[#EFEBDA]/75 mt-0.5">
              {isSpeaking ? 'Speaking response...' : loading ? 'Thinking...' : 'Patient Step-by-Step AI Mentor'}
            </p>
          </div>
        </div>

        {/* Audio Speech Controls */}
        <div className="flex items-center gap-1">
          {isSpeaking && (
            <button
              onClick={stopSpeaking}
              className="p-1 text-xs bg-red-500/20 text-red-300 hover:text-white rounded px-2 flex items-center gap-1 animate-pulse"
              title="Stop speaking"
            >
              <Square className="w-3 h-3 fill-current" /> Stop
            </button>
          )}

          <button
            onClick={() => setAudioAutoPlay(!audioAutoPlay)}
            className={`p-1.5 rounded-lg text-xs transition-colors ${
              audioAutoPlay ? 'text-white hover:bg-white/10' : 'text-gray-400 hover:bg-white/5'
            }`}
            title={audioAutoPlay ? 'Spoken voice playback ON' : 'Voice playback MUTED'}
          >
            {audioAutoPlay ? <Volume2 className="w-4 h-4 text-[#F14C2F]" /> : <VolumeX className="w-4 h-4" />}
          </button>
        </div>
      </div>

      {/* LANGUAGE SELECTOR STRIP — English & Hindi/Hinglish */}
      <div className="bg-[#EFEBDA] px-3 py-2 border-b border-[#393636]/10 flex flex-wrap items-center justify-between gap-2 text-xs">
        {/* Language Selector */}
        <div className="flex items-center gap-1.5">
          <Globe className="w-3.5 h-3.5 text-[#F14C2F]" />
          <span className="text-[11px] font-bold text-[#393636]">Language:</span>
          <div className="flex bg-white rounded-lg p-0.5 border border-[#393636]/15 shadow-2xs">
            <button
              onClick={() => setLanguageMode('english')}
              className={`px-2.5 py-0.5 rounded-md text-xs font-bold transition-all ${
                languageMode === 'english'
                  ? 'bg-[#393636] text-white shadow-xs'
                  : 'text-[#393636] hover:bg-gray-100'
              }`}
            >
              English
            </button>
            <button
              onClick={() => setLanguageMode('hindi_hinglish')}
              className={`px-2.5 py-0.5 rounded-md text-xs font-bold transition-all ${
                languageMode === 'hindi_hinglish'
                  ? 'bg-[#F14C2F] text-white shadow-xs'
                  : 'text-[#393636] hover:bg-gray-100'
              }`}
            >
              Hindi / Hinglish
            </button>
          </div>
        </div>

        {/* Teaching Style Mode Selector */}
        <div className="flex items-center gap-1">
          <button
            onClick={() => setMode('socratic')}
            className={`px-2 py-0.5 rounded text-[10px] font-bold transition-all ${
              mode === 'socratic' ? 'bg-[#F14C2F] text-white' : 'bg-white text-[#393636]'
            }`}
            title="Guides you step-by-step with leading questions"
          >
            Socratic
          </button>
          <button
            onClick={() => setMode('eli5')}
            className={`px-2 py-0.5 rounded text-[10px] font-bold transition-all ${
              mode === 'eli5' ? 'bg-[#F14C2F] text-white' : 'bg-white text-[#393636]'
            }`}
            title="Explain Like I'm 5 (Simple metaphors)"
          >
            ELI5
          </button>
          <button
            onClick={() => setMode('deep_dive')}
            className={`px-2 py-0.5 rounded text-[10px] font-bold transition-all ${
              mode === 'deep_dive' ? 'bg-[#F14C2F] text-white' : 'bg-white text-[#393636]'
            }`}
            title="Advanced technical precision"
          >
            Pro Dive
          </button>
        </div>
      </div>

      {/* Mic Permission Warning Banner (if denied) */}
      {micPermissionDenied && (
        <div className="p-2.5 bg-amber-50 border-b border-amber-200 text-amber-900 text-xs flex items-start gap-2">
          <AlertTriangle className="w-4 h-4 text-amber-600 flex-shrink-0 mt-0.5" />
          <div className="flex-1">
            <strong>Microphone permission needed:</strong> Click the lock/settings icon next to the URL in your browser address bar to allow microphone access, or type your question below.
          </div>
        </div>
      )}

      {/* Mic Notice (General error) */}
      {micErrorText && !micPermissionDenied && (
        <div className="p-2 bg-blue-50 border-b border-blue-200 text-blue-900 text-[11px] flex items-center justify-between">
          <span>{micErrorText}</span>
          <button onClick={() => setMicErrorText(null)} className="text-blue-700 hover:underline">
            Dismiss
          </button>
        </div>
      )}

      {/* Messages Scroll Area */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4 bg-gray-50/50">
        {messages.map((msg) => {
          const isTutor = msg.sender === 'tutor';
          const isMsgSpeaking = currentlySpeakingMsgId === msg.id && isSpeaking;

          return (
            <div
              key={msg.id}
              className={`flex gap-2.5 ${isTutor ? 'items-start' : 'items-end flex-row-reverse'}`}
            >
              {isTutor && (
                <div className="w-7 h-7 rounded-full bg-[#393636] text-white flex-shrink-0 flex items-center justify-center text-xs font-bold mt-1">
                  TU
                </div>
              )}
              <div
                className={`max-w-[85%] rounded-2xl p-3.5 text-xs sm:text-sm leading-relaxed shadow-2xs ${
                  isTutor
                    ? 'bg-white border border-[#393636]/10 text-[#393636]'
                    : 'bg-[#F14C2F] text-white rounded-br-xs'
                }`}
              >
                {/* Content with markdown-like styling */}
                <div className="space-y-2 whitespace-pre-wrap">
                  {msg.text.split('\n\n').map((paragraph, i) => (
                    <p key={i}>
                      {paragraph.split('**').map((chunk, j) =>
                        j % 2 === 1 ? <strong key={j} className="font-bold text-[#F14C2F]">{chunk}</strong> : chunk
                      )}
                    </p>
                  ))}
                </div>

                <div
                  className={`mt-2 flex items-center justify-between text-[10px] ${
                    isTutor ? 'text-gray-400' : 'text-white/80'
                  }`}
                >
                  <span>{msg.timestamp}</span>
                  {isTutor && (
                    <div className="flex items-center gap-1.5">
                      {isMsgSpeaking ? (
                        <button
                          onClick={stopSpeaking}
                          className="text-red-500 font-bold hover:underline flex items-center gap-1"
                        >
                          <Square className="w-3 h-3 fill-current" /> Stop
                        </button>
                      ) : (
                        <button
                          onClick={() => speakText(msg.text, msg.id)}
                          className="hover:text-[#F14C2F] p-0.5 rounded flex items-center gap-1"
                          title="Listen to this response aloud"
                        >
                          <Volume2 className="w-3.5 h-3.5" /> Speak
                        </button>
                      )}
                    </div>
                  )}
                </div>
              </div>
            </div>
          );
        })}

        {loading && (
          <div className="flex items-center gap-2 text-xs text-gray-500 py-2">
            <div className="w-6 h-6 rounded-full bg-[#F14C2F]/20 text-[#F14C2F] flex items-center justify-center animate-pulse">
              <Sparkles className="w-3.5 h-3.5 animate-spin" />
            </div>
            <span>TUTutor is analyzing DaVinci Resolve context...</span>
          </div>
        )}

        <div ref={messagesEndRef} />
      </div>

      {/* Beginner Quick Prompts */}
      <div className="px-3 py-2 bg-white border-t border-gray-100 flex items-center gap-1.5 overflow-x-auto text-[11px] whitespace-nowrap">
        {languageMode === 'hindi_hinglish' ? (
          <>
            <button
              onClick={() => handleSendMessage("DaVinci Resolve install ho gaya hai, aage kya karu?")}
              className="px-2.5 py-1 bg-[#EFEBDA] hover:bg-[#F14C2F] hover:text-white rounded-full text-[#393636] font-medium transition-colors"
            >
              Resolve khul gaya, aage kya karu?
            </button>
            <button
              onClick={() => handleSendMessage("Mujhe timeline par cut lagana hai, kaunsa shortcut use karu?")}
              className="px-2.5 py-1 bg-[#EFEBDA] hover:bg-[#F14C2F] hover:text-white rounded-full text-[#393636] font-medium transition-colors"
            >
              Cut lagane ka shortcut?
            </button>
            <button
              onClick={() => handleSendMessage("Audio clear nahi hai, background noise kaise hatayein?")}
              className="px-2.5 py-1 bg-[#EFEBDA] hover:bg-[#F14C2F] hover:text-white rounded-full text-[#393636] font-medium transition-colors"
            >
              Noise kaise hatayein?
            </button>
          </>
        ) : (
          <>
            <button
              onClick={() => handleSendMessage("I have DaVinci Resolve open. What should I do first?")}
              className="px-2.5 py-1 bg-[#EFEBDA] hover:bg-[#F14C2F] hover:text-white rounded-full text-[#393636] font-medium transition-colors"
            >
              Resolve is open, what's next?
            </button>
            <button
              onClick={() => handleSendMessage("What is the keyboard shortcut to make a razor cut at the playhead?")}
              className="px-2.5 py-1 bg-[#EFEBDA] hover:bg-[#F14C2F] hover:text-white rounded-full text-[#393636] font-medium transition-colors"
            >
              Blade / Razor Shortcut?
            </button>
            <button
              onClick={() => handleSendMessage("How do I close a black gap on the timeline without moving clips manually?")}
              className="px-2.5 py-1 bg-[#EFEBDA] hover:bg-[#F14C2F] hover:text-white rounded-full text-[#393636] font-medium transition-colors"
            >
              Ripple Delete gap?
            </button>
          </>
        )}
      </div>

      {/* Input Area (Text + Mic Voice) */}
      <div className="p-3 bg-white border-t border-[#393636]/10">
        <form
          onSubmit={(e) => {
            e.preventDefault();
            handleSendMessage();
          }}
          className="flex items-center gap-2"
        >
          {/* Voice Mic Button */}
          <button
            type="button"
            onClick={toggleListening}
            className={`p-2.5 rounded-xl border transition-all cursor-pointer ${
              isListening
                ? 'bg-red-500 text-white animate-pulse border-red-600'
                : 'bg-[#EFEBDA] text-[#393636] hover:bg-[#F14C2F] hover:text-white border-[#393636]/10'
            }`}
            title={isListening ? 'Listening to your voice... click to stop' : `Speak with AI Teacher (${languageMode === 'hindi_hinglish' ? 'Hindi/Hinglish' : 'English'})`}
          >
            {isListening ? <MicOff className="w-4 h-4" /> : <Mic className="w-4 h-4" />}
          </button>

          {/* Text Input */}
          <input
            type="text"
            placeholder={
              isListening
                ? (languageMode === 'hindi_hinglish' ? 'Aapki aawaz sun raha hoon...' : 'Listening to your voice...')
                : (languageMode === 'hindi_hinglish' ? 'DaVinci Resolve ke baare mein kuch bhi poochein...' : 'Ask your DaVinci Resolve AI teacher anything...')
            }
            value={inputText}
            onChange={(e) => setInputText(e.target.value)}
            disabled={loading}
            className="flex-1 px-3.5 py-2.5 text-xs sm:text-sm bg-gray-50 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#F14C2F] text-[#393636]"
          />

          {/* Send Button */}
          <button
            type="submit"
            disabled={!inputText.trim() || loading}
            className="p-2.5 bg-[#F14C2F] hover:bg-[#d63b20] disabled:bg-gray-200 disabled:cursor-not-allowed text-white rounded-xl shadow-xs transition-colors cursor-pointer"
            title="Send question"
          >
            <Send className="w-4 h-4" />
          </button>
        </form>
      </div>
    </div>
  );
};
