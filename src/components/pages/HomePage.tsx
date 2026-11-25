import React, { useState } from 'react';
import { useApp } from '../../context/AppContext';
import { COURSES_DATA } from '../../data/coursesData';
import { TUTeachLogo } from '../common/Logo';
import {
  Sparkles,
  ArrowRight,
  Mic,
  Camera,
  BrainCircuit,
  Award,
  CheckCircle2,
  FileCheck,
  ShieldCheck,
  Play,
  Clock,
  Layers,
  GraduationCap,
  MessageSquare,
  Zap,
  Check,
  TrendingUp,
  Volume2,
  ChevronRight,
  Eye,
  Star
} from 'lucide-react';

export const HomePage: React.FC = () => {
  const { navigate, user } = useApp();

  const primaryCourse = COURSES_DATA[0];

  // Interactive AI Teacher Demo Preview State
  const [activeTab, setActiveTab] = useState<'voice' | 'screenshot' | 'rubric'>('voice');

  return (
    <div className="min-h-screen bg-[#FAF7EE] text-[#393636] flex flex-col select-none">
      {/* =========================================================================
          HERO SECTION: "Your Personal AI Teacher. Available Whenever You Need."
         ========================================================================= */}
      <section className="relative overflow-hidden pt-14 pb-20 sm:pt-20 sm:pb-32 border-b border-[#393636]/10">
        {/* Soft Ambient vermilion halo */}
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[550px] h-[550px] sm:w-[750px] sm:h-[750px] rounded-full bg-gradient-to-tr from-[#F14C2F]/15 via-amber-500/10 to-transparent blur-3xl pointer-events-none" />

        <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center max-w-3xl mx-auto space-y-6">
            {/* Pill Badge */}
            <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-white border border-[#393636]/10 shadow-xs text-xs font-bold text-[#F14C2F] tracking-wide">
              <Sparkles className="w-3.5 h-3.5" />
              <span>Personal 1-on-1 Voice Mentoring & Vision Platform</span>
            </div>

            {/* Main Headline */}
            <h1 className="text-4xl sm:text-5xl lg:text-6xl font-extrabold tracking-tight text-[#393636] leading-[1.12]">
              TUTeach — Learn Anything with Your{' '}
              <span className="text-[#F14C2F]">Personal AI Teacher.</span>
            </h1>

            {/* Platform Description */}
            <p className="text-base sm:text-lg text-[#393636]/80 font-medium leading-relaxed max-w-2xl mx-auto">
              Master practical skills starting with Video Editing in DaVinci Resolve through 1-on-1 voice conversations and visual screenshot inspection. Your AI Teacher (Golu Guru) guides step-by-step in English or Hindi/Hinglish, evaluates practical tasks out of 10, and awards verifiable completion certificates.
            </p>

            {/* Dual CTAs */}
            <div className="flex flex-col sm:flex-row items-center justify-center gap-4 pt-4">
              <button
                onClick={() => navigate('demo')}
                className="w-full sm:w-auto px-8 py-4 rounded-xl bg-[#F14C2F] hover:bg-[#d83c21] text-white font-extrabold text-sm sm:text-base shadow-md hover:shadow-lg transition-all flex items-center justify-center gap-2 cursor-pointer group"
              >
                <Mic className="w-4 h-4 group-hover:scale-110 transition-transform" />
                <span>Try 5-Min AI Teacher Demo</span>
                <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
              </button>

              <button
                onClick={() => navigate('catalog')}
                className="w-full sm:w-auto px-8 py-4 rounded-xl bg-white hover:bg-gray-50 text-[#393636] font-bold text-sm sm:text-base border border-[#393636]/15 shadow-xs transition-all flex items-center justify-center gap-2 cursor-pointer"
              >
                <Layers className="w-4 h-4 text-[#F14C2F]" />
                <span>Explore Course Catalogue</span>
              </button>
            </div>

            {/* Trust Markers */}
            <div className="flex flex-wrap items-center justify-center gap-6 pt-6 text-xs font-semibold text-[#393636]/70">
              <span className="flex items-center gap-1.5">
                <CheckCircle2 className="w-4 h-4 text-emerald-600" /> Free 5-Min Voice Demo (No Sign-Up)
              </span>
              <span className="flex items-center gap-1.5">
                <CheckCircle2 className="w-4 h-4 text-emerald-600" /> ₹499 Subsidized Student Pricing
              </span>
              <span className="flex items-center gap-1.5">
                <CheckCircle2 className="w-4 h-4 text-emerald-600" /> Verifiable Certificate of Mastery
              </span>
            </div>
          </div>
        </div>
      </section>

      {/* =========================================================================
          6-STEP "HOW IT WORKS" SECTION
         ========================================================================= */}
      <section className="py-16 sm:py-24 bg-white border-b border-[#393636]/10">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center max-w-2xl mx-auto space-y-3 mb-16">
            <span className="text-xs font-extrabold uppercase tracking-wider text-[#F14C2F]">
              Step-by-Step Learning
            </span>
            <h2 className="text-3xl sm:text-4xl font-extrabold text-[#393636] tracking-tight">
              How TUTeach Works
            </h2>
            <p className="text-sm sm:text-base text-[#393636]/70 leading-relaxed">
              We replaced static video tutorials with an interactive, patient AI mentor sitting right beside you.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 sm:gap-8">
            {[
              {
                step: '01',
                title: 'Voice Dialogue Initiation',
                desc: 'Your tutor speaks first when you join, greets you by your real name, and introduces the concept with intuitive everyday analogies.',
                icon: Mic,
                badge: 'Teacher Speaks First'
              },
              {
                step: '02',
                title: 'One Concept at a Time',
                desc: 'Never get overwhelmed. Lessons advance step-by-step, checking what you see on your screen before moving to the next technique.',
                icon: BookOpenIcon,
                badge: 'Paced Mentorship'
              },
              {
                step: '03',
                title: 'Real Software Practice',
                desc: 'Work directly on your genuine DaVinci Resolve workspace. Cut clips, adjust audio decibels, and balance primary color wheels.',
                icon: Layers,
                badge: 'Hands-On Muscle Memory'
              },
              {
                step: '04',
                title: 'Instant Screenshot Vision',
                desc: 'Stuck on a tool? Simply paste (Ctrl+V) or upload your timeline screenshot. Gemini Vision instantly spots misalignments and explains fixes.',
                icon: Camera,
                badge: 'Multimodal Feedback'
              },
              {
                step: '05',
                title: 'Practical 10-Point Rubric',
                desc: 'After each lesson, submit practical workflow tasks. The AI Evaluator grades against strict criteria with 1 retry allowed to improve.',
                icon: FileCheck,
                badge: 'Evidence-Based'
              },
              {
                step: '06',
                title: 'Verifiable Industry Credential',
                desc: 'Pass all 8 modules and assignments to unlock your official verified certificate with unique QR verification code.',
                icon: Award,
                badge: 'Career Recognition'
              }
            ].map((card) => {
              const Icon = card.icon;
              return (
                <div
                  key={card.step}
                  className="p-6 rounded-2xl bg-[#FAF7EE] border border-[#393636]/10 space-y-4 hover:border-[#F14C2F]/50 transition-all shadow-2xs relative flex flex-col justify-between"
                >
                  <div className="space-y-3">
                    <div className="flex items-center justify-between">
                      <span className="text-2xl font-mono font-extrabold text-[#F14C2F]/80">
                        {card.step}
                      </span>
                      <span className="text-[10px] font-bold text-[#393636]/80 bg-white px-2 py-0.5 rounded border border-gray-200">
                        {card.badge}
                      </span>
                    </div>
                    <div className="w-10 h-10 rounded-xl bg-white border border-[#393636]/10 flex items-center justify-center text-[#F14C2F]">
                      <Icon className="w-5 h-5" />
                    </div>
                    <h3 className="text-base font-bold text-[#393636] leading-snug">
                      {card.title}
                    </h3>
                    <p className="text-xs text-[#393636]/75 leading-relaxed">
                      {card.desc}
                    </p>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </section>

      {/* =========================================================================
          INTERACTIVE AI TEACHER SHOWCASE
         ========================================================================= */}
      <section className="py-16 sm:py-24 bg-[#FAF7EE] border-b border-[#393636]/10">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-10 items-center">
            {/* Left Content */}
            <div className="lg:col-span-6 space-y-6">
              <span className="text-xs font-extrabold uppercase tracking-wider text-[#F14C2F]">
                The AI Teacher Difference
              </span>
              <h2 className="text-3xl sm:text-4xl font-extrabold text-[#393636] tracking-tight leading-tight">
                An Expert Desk-Side Mentor. Patient. Bilingual. Ready to Inspect Your Work.
              </h2>
              <p className="text-sm sm:text-base text-[#393636]/80 leading-relaxed">
                Traditional video courses force you to rewind, guess, and get stuck alone. TUTutor listens to your questions in plain English or Hindi/Hinglish, looks directly at your screen, and guides you forward with zero judgment.
              </p>

              {/* Feature Cards */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-2">
                <div className="p-3 bg-white rounded-xl border border-[#393636]/10 flex items-start gap-2.5">
                  <Mic className="w-4 h-4 text-[#F14C2F] flex-shrink-0 mt-0.5" />
                  <div>
                    <h3 className="text-xs font-bold text-[#393636]">Real-Time VAD Voice</h3>
                    <p className="text-[11px] text-gray-500">Natural conversation with instant barge-in interruption</p>
                  </div>
                </div>

                <div className="p-3 bg-white rounded-xl border border-[#393636]/10 flex items-start gap-2.5">
                  <Camera className="w-4 h-4 text-[#F14C2F] flex-shrink-0 mt-0.5" />
                  <div>
                    <h3 className="text-xs font-bold text-[#393636]">Gemini Vision Inspection</h3>
                    <p className="text-[11px] text-gray-500">Multimodal troubleshooting of timeline cuts</p>
                  </div>
                </div>

                <div className="p-3 bg-white rounded-xl border border-[#393636]/10 flex items-start gap-2.5">
                  <FileCheck className="w-4 h-4 text-emerald-600 flex-shrink-0 mt-0.5" />
                  <div>
                    <h3 className="text-xs font-bold text-[#393636]">10-Point AI Rubric</h3>
                    <p className="text-[11px] text-gray-500">Transparent criteria evaluation with 1 retry</p>
                  </div>
                </div>

                <div className="p-3 bg-white rounded-xl border border-[#393636]/10 flex items-start gap-2.5">
                  <Award className="w-4 h-4 text-purple-600 flex-shrink-0 mt-0.5" />
                  <div>
                    <h3 className="text-xs font-bold text-[#393636]">Verifiable Credentials</h3>
                    <p className="text-[11px] text-gray-500">Code-verified TUTeach completion certificates</p>
                  </div>
                </div>
              </div>

              <div className="pt-2 flex items-center gap-4">
                <button
                  onClick={() => navigate('demo')}
                  className="px-6 py-3.5 rounded-xl bg-[#F14C2F] hover:bg-[#d83c21] text-white font-bold text-xs sm:text-sm shadow-md transition-all flex items-center gap-2 cursor-pointer"
                >
                  <Sparkles className="w-4 h-4" />
                  <span>Launch Free Voice & Vision Demo</span>
                </button>
              </div>
            </div>

            {/* Right Interactive Simulator Card */}
            <div className="lg:col-span-6 bg-[#393636] text-white rounded-3xl p-6 sm:p-8 shadow-xl border border-white/10 space-y-6">
              <div className="flex items-center justify-between border-b border-white/10 pb-4">
                <div className="flex items-center gap-3">
                  <TUTeachLogo size="sm" variant="iconOnly" clickable={false} />
                  <div>
                    <h3 className="text-sm font-bold text-[#EFEBDA]">TUTutor Gemini Multimodal Mentor</h3>
                    <p className="text-[11px] text-white/50">DaVinci Resolve Editing Specialist</p>
                  </div>
                </div>

                {/* Tabs */}
                <div className="flex items-center bg-black/40 p-1 rounded-xl text-xs">
                  <button
                    onClick={() => setActiveTab('voice')}
                    className={`px-2.5 py-1 rounded-lg font-bold transition-colors ${
                      activeTab === 'voice' ? 'bg-[#F14C2F] text-white' : 'text-white/60 hover:text-white'
                    }`}
                  >
                    Voice
                  </button>
                  <button
                    onClick={() => setActiveTab('screenshot')}
                    className={`px-2.5 py-1 rounded-lg font-bold transition-colors ${
                      activeTab === 'screenshot' ? 'bg-[#F14C2F] text-white' : 'text-white/60 hover:text-white'
                    }`}
                  >
                    Vision
                  </button>
                  <button
                    onClick={() => setActiveTab('rubric')}
                    className={`px-2.5 py-1 rounded-lg font-bold transition-colors ${
                      activeTab === 'rubric' ? 'bg-[#F14C2F] text-white' : 'text-white/60 hover:text-white'
                    }`}
                  >
                    Rubric
                  </button>
                </div>
              </div>

              {/* Tab 1: Voice Dialogue */}
              {activeTab === 'voice' && (
                <div className="space-y-3 text-xs animate-in fade-in duration-200">
                  <div className="p-3.5 bg-black/40 rounded-2xl rounded-tl-none border border-white/10 leading-relaxed">
                    <span className="font-bold text-[#F14C2F] block mb-1">TUTutor AI:</span>
                    "Namaste Anmol! In this lesson, we are mastering the Blade tool in DaVinci Resolve. When you look at your timeline, notice how the playhead moves across your video track. What shortcut key is shown next to the Razor icon?"
                  </div>
                  <div className="p-3.5 bg-[#F14C2F]/20 rounded-2xl rounded-tr-none border border-[#F14C2F]/40 leading-relaxed ml-6">
                    <span className="font-bold text-white block mb-1">Student:</span>
                    "It shows 'B'! Should I press 'B' and then click where I want to split the clip?"
                  </div>
                  <div className="p-3.5 bg-black/40 rounded-2xl rounded-tl-none border border-white/10 leading-relaxed">
                    <span className="font-bold text-[#F14C2F] block mb-1">TUTutor AI:</span>
                    "Spot on! Press 'B' for Blade, click at the cut point, then remember to press 'A' to return to the Selection arrow so you don't make accidental cuts!"
                  </div>
                </div>
              )}

              {/* Tab 2: Multimodal Screenshot Vision */}
              {activeTab === 'screenshot' && (
                <div className="space-y-3 text-xs animate-in fade-in duration-200">
                  <div className="p-3 bg-black/50 rounded-xl border border-white/15 flex items-center gap-3">
                    <div className="w-20 h-14 bg-zinc-800 rounded-lg overflow-hidden border border-white/20 flex items-center justify-center text-white/40">
                      <Camera className="w-6 h-6 text-[#F14C2F]" />
                    </div>
                    <div>
                      <div className="text-[11px] font-bold text-white">Student Shared Screenshot</div>
                      <p className="text-[10px] text-white/60">DaVinci Resolve Edit Page timeline</p>
                    </div>
                  </div>

                  <div className="p-3.5 bg-black/40 rounded-2xl rounded-tl-none border border-[#F14C2F]/30 leading-relaxed">
                    <div className="flex items-center gap-1.5 text-[#F14C2F] font-bold mb-1">
                      <Sparkles className="w-3.5 h-3.5" />
                      <span>Gemini Vision Observation:</span>
                    </div>
                    "I see your DaVinci Resolve workspace! You currently have the Blade tool selected on Track V1, but snapping is disabled (the magnet icon is gray). Turn snapping on by pressing 'N' so your playhead locks cleanly to the edit cut!"
                  </div>
                </div>
              )}

              {/* Tab 3: Rubric Evaluation */}
              {activeTab === 'rubric' && (
                <div className="space-y-3 text-xs animate-in fade-in duration-200">
                  <div className="p-3.5 bg-emerald-950/50 rounded-2xl border border-emerald-500/30 leading-relaxed">
                    <div className="flex items-center justify-between mb-2">
                      <span className="font-bold text-emerald-400">Assignment Rubric Result</span>
                      <span className="font-black text-xs px-2 py-0.5 bg-emerald-500 text-black rounded font-mono">
                        Score 9.5/10 (PASSED)
                      </span>
                    </div>
                    <p className="text-white/80">
                      "Clean methodology: Ripple delete applied correctly with Shift+Backspace. No leftover blank timeline gaps detected."
                    </p>
                  </div>
                </div>
              )}

              <div className="pt-2 flex items-center justify-between text-xs border-t border-white/10">
                <span className="text-[11px] text-white/50">Powered by Gemini 3.8 Flash</span>
                <button
                  onClick={() => navigate('demo')}
                  className="text-xs font-bold text-[#F14C2F] hover:underline flex items-center gap-1"
                >
                  Test Full AI Demo →
                </button>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* =========================================================================
          6-POINT "WHY LEARN WITH TUTEACH" GRID
         ========================================================================= */}
      <section className="py-16 sm:py-24 bg-white border-b border-[#393636]/10">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center max-w-2xl mx-auto space-y-3 mb-16">
            <span className="text-xs font-extrabold uppercase tracking-wider text-[#F14C2F]">
              Platform Advantages
            </span>
            <h2 className="text-3xl sm:text-4xl font-extrabold text-[#393636] tracking-tight">
              Why Learn With TUTeach
            </h2>
            <p className="text-sm sm:text-base text-[#393636]/70 leading-relaxed">
              Engineered from the ground up for deep technical skill acquisition without the boredom of passive video streams.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 sm:gap-8">
            {[
              {
                title: 'Real-time Gemini Voice Interaction',
                desc: 'Speak using natural voice turn-taking. Interrupt anytime you have a question or need an analogy repeated.',
                icon: Mic
              },
              {
                title: 'Visual Screenshot Inspection',
                desc: 'Attach timeline screenshots via clipboard paste (Ctrl+V) or drag-and-drop. AI identifies tools, tracks, and errors instantly.',
                icon: Camera
              },
              {
                title: 'Strict 10-Point Rubric Evaluation',
                desc: 'Get genuine feedback on your workflow choices, shortcut habits, and practical execution. Best of two attempts kept.',
                icon: FileCheck
              },
              {
                title: 'Bilingual Learning (EN & Hinglish)',
                desc: 'Switch fluidly between English and friendly Indian mentor Hinglish so complex terminology makes complete sense.',
                icon: Volume2
              },
              {
                title: 'Zero-Judgment Desk-Side Mentor',
                desc: 'Ask the same beginner question ten times without anxiety. Your AI mentor never tires and teaches at your exact pace.',
                icon: HeartIcon
              },
              {
                title: 'Subsidized Student Pricing (₹499)',
                desc: 'Full lifetime access to the entire 8-module DaVinci Resolve Masterclass at an affordable ₹499 INR student price point.',
                icon: Sparkles
              }
            ].map((item, idx) => {
              const Icon = item.icon;
              return (
                <div
                  key={idx}
                  className="p-6 rounded-2xl bg-[#FAF7EE] border border-[#393636]/10 hover:border-[#F14C2F]/40 transition-colors shadow-2xs space-y-3"
                >
                  <div className="w-10 h-10 rounded-xl bg-white border border-[#393636]/10 flex items-center justify-center text-[#F14C2F]">
                    <Icon className="w-5 h-5" />
                  </div>
                  <h3 className="text-base font-bold text-[#393636]">{item.title}</h3>
                  <p className="text-xs text-[#393636]/75 leading-relaxed">{item.desc}</p>
                </div>
              );
            })}
          </div>
        </div>
      </section>

      {/* =========================================================================
          COURSE CATALOGUE PREVIEW
         ========================================================================= */}
      <section className="py-16 sm:py-24 bg-[#FAF7EE] border-b border-[#393636]/10">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex flex-col md:flex-row md:items-end justify-between gap-4 mb-12">
            <div>
              <span className="text-xs font-extrabold uppercase tracking-wider text-[#F14C2F]">
                Featured Masterclass
              </span>
              <h2 className="text-3xl font-extrabold text-[#393636] tracking-tight mt-1">
                Explore Hollywood Video Editing
              </h2>
            </div>
            <button
              onClick={() => navigate('catalog')}
              className="text-xs font-bold text-[#F14C2F] hover:underline flex items-center gap-1 cursor-pointer"
            >
              <span>View Full Catalogue</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {COURSES_DATA.map((course) => {
              const allLessons = course.modules.flatMap((m) => m.lessons);
              return (
                <div
                  key={course.id}
                  className="bg-white rounded-2xl overflow-hidden border border-[#393636]/10 shadow-xs hover:shadow-md transition-all flex flex-col justify-between"
                >
                  <div className="p-6 space-y-4">
                    <div className="flex items-center justify-between">
                      <span className="text-[10px] font-bold text-[#F14C2F] bg-[#F14C2F]/10 px-2.5 py-0.5 rounded-full border border-[#F14C2F]/20 uppercase">
                        {course.software}
                      </span>
                      <span className="text-xs font-semibold text-gray-500">
                        {course.level}
                      </span>
                    </div>

                    <h3 className="text-lg font-bold text-[#393636] leading-snug">
                      {course.title}
                    </h3>
                    <p className="text-xs text-[#393636]/75 line-clamp-2 leading-relaxed">
                      {course.shortDescription}
                    </p>

                    <div className="pt-2 flex items-center gap-3 text-xs text-gray-600 border-t border-gray-100">
                      <span>{course.modules.length} Modules</span>
                      <span>·</span>
                      <span>{allLessons.length} Lessons</span>
                      <span>·</span>
                      <span className="text-emerald-700 font-semibold">10-Point Rubric</span>
                    </div>
                  </div>

                  <div className="p-6 bg-[#FAF7EE] border-t border-[#393636]/10 flex items-center justify-between">
                    <div>
                      <span className="text-[10px] text-gray-500 line-through block">Standard ₹{course.regularPriceInr}</span>
                      <div className="text-base font-extrabold text-[#F14C2F]">
                        ₹{course.studentPriceInr} <span className="text-[10px] text-gray-600 font-normal">Student Plan</span>
                      </div>
                    </div>
                    <a
                      href="/courses/davinci-resolve-for-beginners"
                      onClick={(e) => {
                        e.preventDefault();
                        navigate('course-davinci-resolve', course.id);
                      }}
                      className="px-4 py-2 rounded-xl bg-[#393636] hover:bg-[#F14C2F] text-white text-xs font-bold transition-colors cursor-pointer"
                    >
                      Explore Track
                    </a>
                  </div>
                </div>
              );
            })}

            {/* Crawlable Dedicated Course & Blog Resource Cards for Organic Discovery */}
            <div className="bg-white rounded-2xl overflow-hidden border border-[#393636]/10 shadow-xs hover:shadow-md transition-all flex flex-col justify-between">
              <div className="aspect-[16/9] bg-[#393636] overflow-hidden">
                <img
                  src="/assets/seo/course-video-editing.jpg"
                  alt="Video editing studio timeline workstation for beginners"
                  width={1280}
                  height={720}
                  loading="lazy"
                  referrerPolicy="no-referrer"
                  className="w-full h-full object-cover"
                />
              </div>
              <div className="p-6 space-y-3">
                <div className="text-xs font-bold text-[#F14C2F] uppercase">Guided Learning Path</div>
                <h3 className="text-lg font-bold text-[#393636] leading-snug">Learn Video Editing Online from Scratch</h3>
                <p className="text-xs text-[#393636]/75 leading-relaxed">
                  Structured beginner roadmap covering footage organization, J-K-L transport, Fairlight loudness, and primary color balance.
                </p>
              </div>
              <div className="px-6 py-4 bg-[#FAF7EE] border-t border-[#393636]/10 flex items-center justify-between">
                <span className="text-xs font-semibold text-[#393636]/75">Beginner Track</span>
                <a
                  href="/courses/video-editing"
                  onClick={(e) => {
                    e.preventDefault();
                    navigate('course-video-editing');
                  }}
                  className="px-4 py-2 rounded-xl bg-[#393636] hover:bg-[#F14C2F] text-white text-xs font-bold transition-colors"
                >
                  Course Guide
                </a>
              </div>
            </div>

            <div className="bg-white rounded-2xl overflow-hidden border border-[#393636]/10 shadow-xs hover:shadow-md transition-all flex flex-col justify-between">
              <div className="aspect-[16/9] bg-[#393636] overflow-hidden">
                <img
                  src="/assets/seo/tuteach-og-showcase.jpg"
                  alt="TUTeach studio workstation with interactive AI Teacher mentoring workspace"
                  width={1280}
                  height={720}
                  loading="lazy"
                  referrerPolicy="no-referrer"
                  className="w-full h-full object-cover"
                />
              </div>
              <div className="p-6 space-y-3">
                <div className="text-xs font-bold text-[#F14C2F] uppercase">Educational Journal</div>
                <h3 className="text-lg font-bold text-[#393636] leading-snug">Practical Study Guides &amp; DaVinci Tutorials</h3>
                <p className="text-xs text-[#393636]/75 leading-relaxed">
                  Read human-reviewed tutorials on DaVinci Resolve pages, beginner shortcuts, and deliberate practice with an AI mentor.
                </p>
              </div>
              <div className="px-6 py-4 bg-[#FAF7EE] border-t border-[#393636]/10 flex items-center justify-between">
                <span className="text-xs font-semibold text-[#393636]/75">5 Guides Published</span>
                <a
                  href="/blog"
                  onClick={(e) => {
                    e.preventDefault();
                    navigate('blog');
                  }}
                  className="px-4 py-2 rounded-xl bg-[#393636] hover:bg-[#F14C2F] text-white text-xs font-bold transition-colors"
                >
                  Read Blog
                </a>
              </div>
            </div>
          </div>

          {/* Honest Trust, Pricing & Age Safety Summary Strip */}
          <div className="mt-10 bg-white rounded-2xl p-5 border border-[#393636]/10 flex flex-wrap items-center justify-between gap-4 text-xs text-[#393636]/80">
            <div className="flex items-center gap-2">
              <ShieldCheck className="w-4 h-4 text-emerald-600 shrink-0" />
              <span>
                <strong>Trust &amp; Safety Built-In:</strong> Verifiable age &amp; parental consent checks, PII scrubbing, honest AI disclosures, and transparent{' '}
                <a
                  href="/pricing"
                  onClick={(e) => {
                    e.preventDefault();
                    navigate('pricing');
                  }}
                  className="text-[#F14C2F] font-bold hover:underline"
                >
                  ₹499 Student / ₹1,899 Standard pricing
                </a>.
              </span>
            </div>
            <div className="flex flex-wrap gap-4 font-semibold">
              <a
                href="/ai-disclosure"
                onClick={(e) => {
                  e.preventDefault();
                  navigate('ai-disclosure');
                }}
                className="hover:text-[#F14C2F]"
              >
                AI Transparency
              </a>
              <a
                href="/child-safety"
                onClick={(e) => {
                  e.preventDefault();
                  navigate('child-safety');
                }}
                className="hover:text-[#F14C2F]"
              >
                Child Protection
              </a>
              <a
                href="/help"
                onClick={(e) => {
                  e.preventDefault();
                  navigate('help');
                }}
                className="hover:text-[#F14C2F]"
              >
                Help &amp; FAQ
              </a>
            </div>
          </div>
        </div>
      </section>

      {/* =========================================================================
          FINAL CALL TO ACTION BANNER
         ========================================================================= */}
      <section className="py-20 bg-white">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="bg-[#393636] text-white rounded-3xl p-8 sm:p-14 shadow-xl border border-white/10 text-center space-y-6 relative overflow-hidden">
            <div className="absolute top-0 right-0 w-80 h-80 rounded-full bg-[#F14C2F]/20 blur-3xl pointer-events-none" />

            <div className="relative z-10 max-w-xl mx-auto space-y-4">
              <span className="px-3 py-1 rounded-full bg-white/10 text-[#F14C2F] border border-white/15 text-xs font-bold inline-flex items-center gap-1.5">
                <Sparkles className="w-3.5 h-3.5" /> No Credit Card or Login Required
              </span>
              <h2 className="text-3xl sm:text-4xl font-extrabold tracking-tight">
                Ready to Experience 1-on-1 AI Tutoring?
              </h2>
              <p className="text-sm text-white/80 leading-relaxed">
                Take a 5-minute live voice test drive. Speak to the AI Teacher right from your browser, share a screen, ask questions, and experience the future of learning.
              </p>

              <div className="pt-2 flex flex-col sm:flex-row items-center justify-center gap-3">
                <button
                  onClick={() => navigate('demo')}
                  className="w-full sm:w-auto px-8 py-4 rounded-xl bg-[#F14C2F] hover:bg-[#d83c21] text-white font-extrabold text-sm sm:text-base shadow-lg transition-all flex items-center justify-center gap-2 cursor-pointer"
                >
                  <Mic className="w-4 h-4" />
                  <span>Start Free 5-Minute Demo</span>
                  <ArrowRight className="w-4 h-4" />
                </button>
                <button
                  onClick={() => navigate('catalog')}
                  className="w-full sm:w-auto px-6 py-4 rounded-xl bg-white/10 hover:bg-white/20 text-white font-bold text-sm transition-all"
                >
                  View All Modules
                </button>
              </div>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
};

// Helper icon subcomponents for clean code
function BookOpenIcon(props: React.SVGProps<SVGSVGElement>) {
  return <Layers {...props} />;
}

function HeartIcon(props: React.SVGProps<SVGSVGElement>) {
  return <Sparkles {...props} />;
}
