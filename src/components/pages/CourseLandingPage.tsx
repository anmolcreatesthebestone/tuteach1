import React, { useState } from 'react';
import { useApp } from '../../context/AppContext';
import { COURSES_DATA } from '../../data/coursesData';
import { COURSE_LANDING_FAQS } from '../../seo/seoRegistry';
import { trackCourseSelect } from '../../seo/analytics';
import {
  ArrowRight,
  Award,
  BookOpen,
  Camera,
  CheckCircle2,
  ChevronDown,
  ChevronUp,
  Film,
  GraduationCap,
  Languages,
  Layers,
  Mic,
  Share2,
  ShieldCheck,
  Sparkles,
  Copy,
  Check
} from 'lucide-react';

interface CourseLandingPageProps {
  variant: 'video-editing' | 'davinci-resolve';
}

export const CourseLandingPage: React.FC<CourseLandingPageProps> = ({ variant }) => {
  const { navigate, hasPaidForCourse, setActiveBlogPost } = useApp();
  const course = COURSES_DATA[0];
  const [openFaq, setOpenFaq] = useState<number | null>(0);
  const [imgFailed, setImgFailed] = useState(false);
  const [copiedLink, setCopiedLink] = useState(false);

  const isResolveVariant = variant === 'davinci-resolve';
  const canonicalPath = isResolveVariant
    ? '/courses/davinci-resolve-for-beginners'
    : '/courses/video-editing';
  const coverImage = isResolveVariant
    ? '/assets/seo/course-davinci-resolve.jpg'
    : '/assets/seo/course-video-editing.jpg';
  const coverAlt = isResolveVariant
    ? 'DaVinci Resolve beginner color grading and editing workstation displaying timeline and RGB Parade scopes'
    : 'Video editing beginner desk setup showing multi-track timeline, audio waveforms, and preview monitor';

  const faqs = isResolveVariant
    ? COURSE_LANDING_FAQS.davinciResolve
    : COURSE_LANDING_FAQS.videoEditing;

  const isPaid = hasPaidForCourse(course.id);

  const shareUrl =
    typeof window !== 'undefined'
      ? `${window.location.origin}${canonicalPath}`
      : `https://tuteach.ai${canonicalPath}`;
  const shareTitle = isResolveVariant
    ? 'DaVinci Resolve for Beginners — 8-Module AI Course | TUTeach'
    : 'Learn Video Editing Online with a 1-on-1 AI Teacher | TUTeach';

  const handleCopyShareLink = async () => {
    try {
      await navigator.clipboard.writeText(shareUrl);
      setCopiedLink(true);
      setTimeout(() => setCopiedLink(false), 2000);
    } catch {}
  };

  const handleEnrolClick = () => {
    trackCourseSelect(course.id, course.title);
    if (isPaid) {
      navigate('classroom', course.id);
    } else {
      navigate('checkout', course.id);
    }
  };

  return (
    <div className="min-h-screen bg-[#FAF7EE] text-[#393636]">
      {/* Breadcrumb Bar */}
      <div className="border-b border-[#393636]/10 bg-[#EFEBDA]/70">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-3 flex flex-wrap items-center gap-2 text-xs text-[#393636]/75">
          <a
            href="/"
            onClick={(e) => {
              e.preventDefault();
              navigate('home');
            }}
            className="hover:text-[#F14C2F] font-medium"
          >
            Home
          </a>
          <span>/</span>
          <a
            href="/courses"
            onClick={(e) => {
              e.preventDefault();
              navigate('catalog');
            }}
            className="hover:text-[#F14C2F] font-medium"
          >
            Courses
          </a>
          <span>/</span>
          <span className="font-bold text-[#393636]">
            {isResolveVariant ? 'DaVinci Resolve for Beginners' : 'Learn Video Editing Online'}
          </span>
        </div>
      </div>

      {/* Hero Section */}
      <section className="py-12 sm:py-16 border-b border-[#393636]/10">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-10 items-center">
            <div className="lg:col-span-7 space-y-5">
              <div className="text-xs font-extrabold uppercase tracking-wider text-[#F14C2F]">
                {isResolveVariant
                  ? 'DaVinci Resolve Free Compatible · 8 Modules · 43 Lessons'
                  : 'Beginner Video Editing Track · 1-on-1 AI Mentoring'}
              </div>

              <h1 className="text-3xl sm:text-5xl font-extrabold text-[#393636] tracking-tight leading-[1.12]">
                {isResolveVariant
                  ? 'DaVinci Resolve for Beginners: Step-by-Step with Your Personal AI Teacher'
                  : 'Learn Video Editing Online with Guided 1-on-1 AI Practice'}
              </h1>

              <p className="text-base sm:text-lg text-[#393636]/80 leading-relaxed max-w-2xl">
                {isResolveVariant
                  ? 'Move beyond passive video lectures. Practice inside Blackmagic Design’s free DaVinci Resolve workspace while TUTeach’s AI Teacher answers voice questions, inspects your timeline screenshots, and grades practical exercises out of 10.'
                  : 'Master editing fundamentals from scratch—media organization, clean rhythmic cuts, dialogue loudness balancing, and color correction—guided desk-side by your personal bilingual AI Teacher.'}
              </p>

              {/* Flat Typographic Facts */}
              <div className="flex flex-wrap items-center gap-x-4 gap-y-2 text-xs font-semibold text-[#393636]/80 pt-1">
                <span className="flex items-center gap-1.5">
                  <Film className="w-4 h-4 text-[#F14C2F]" /> DaVinci Resolve (Free or Studio)
                </span>
                <span className="text-[#393636]/30">·</span>
                <span className="flex items-center gap-1.5">
                  <Languages className="w-4 h-4 text-[#F14C2F]" /> English &amp; Hindi / Hinglish
                </span>
                <span className="text-[#393636]/30">·</span>
                <span className="flex items-center gap-1.5">
                  <BookOpen className="w-4 h-4 text-[#F14C2F]" /> 8 Modules · 43 Guided Lessons
                </span>
              </div>

              {/* Action Buttons */}
              <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3 pt-3">
                <button
                  onClick={handleEnrolClick}
                  className="px-7 py-3.5 rounded-xl bg-[#F14C2F] hover:bg-[#d83c21] text-white font-extrabold text-sm shadow-sm transition-colors flex items-center justify-center gap-2 cursor-pointer"
                >
                  <span>{isPaid ? 'Open Paid AI Classroom' : 'Enrol Now · Student Plan ₹499'}</span>
                  <ArrowRight className="w-4 h-4" />
                </button>

                <button
                  onClick={() => navigate('demo')}
                  className="px-6 py-3.5 rounded-xl bg-white hover:bg-[#EFEBDA]/60 text-[#393636] font-bold text-sm border border-[#393636]/20 transition-colors flex items-center justify-center gap-2 cursor-pointer"
                >
                  <Mic className="w-4 h-4 text-[#F14C2F]" />
                  <span>Try Free 5-Min AI Teacher Demo</span>
                </button>
              </div>

              <div className="flex flex-wrap items-center gap-x-5 gap-y-2 text-xs text-[#393636]/75 pt-2">
                <a
                  href="/register"
                  onClick={(e) => {
                    e.preventDefault();
                    navigate('register');
                  }}
                  className="font-semibold text-[#F14C2F] hover:underline"
                >
                  Create Student Account →
                </a>
                <a
                  href="/pricing"
                  onClick={(e) => {
                    e.preventDefault();
                    navigate('pricing');
                  }}
                  className="font-medium hover:text-[#F14C2F]"
                >
                  Compare ₹499 Student vs ₹1,899 Standard Pricing
                </a>
              </div>
            </div>

            {/* Visual Showcase Frame */}
            <div className="lg:col-span-5 space-y-3">
              <div className="rounded-3xl overflow-hidden border border-[#393636]/15 bg-[#393636] shadow-md aspect-[16/9] relative">
                {!imgFailed ? (
                  <img
                    src={coverImage}
                    alt={coverAlt}
                    width={1280}
                    height={720}
                    referrerPolicy="no-referrer"
                    onError={() => setImgFailed(true)}
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <div className="w-full h-full flex flex-col items-center justify-center p-6 text-center bg-gradient-to-br from-[#393636] to-[#1f1d1d] text-[#EFEBDA]">
                    <Film className="w-10 h-10 text-[#F14C2F] mb-2" />
                    <div className="text-sm font-bold">DaVinci Resolve Studio Curriculum</div>
                    <div className="text-xs text-[#EFEBDA]/70 mt-1">8 Practical Modules · Voice &amp; Vision AI Tutor</div>
                  </div>
                )}
              </div>

              {/* Honest Share Bar */}
              <div className="bg-white rounded-2xl p-3.5 border border-[#393636]/10 flex flex-wrap items-center justify-between gap-3 text-xs">
                <span className="font-semibold text-[#393636]/80 flex items-center gap-1.5">
                  <Share2 className="w-3.5 h-3.5 text-[#F14C2F]" />
                  Share course page:
                </span>
                <div className="flex flex-wrap items-center gap-2">
                  <a
                    href={`https://wa.me/?text=${encodeURIComponent(`${shareTitle} — ${shareUrl}`)}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="px-2.5 py-1 rounded-lg bg-[#FAF7EE] border border-[#393636]/15 hover:border-[#F14C2F] font-semibold"
                  >
                    WhatsApp
                  </a>
                  <a
                    href={`https://www.linkedin.com/sharing/share-offsite/?url=${encodeURIComponent(shareUrl)}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="px-2.5 py-1 rounded-lg bg-[#FAF7EE] border border-[#393636]/15 hover:border-[#F14C2F] font-semibold"
                  >
                    LinkedIn
                  </a>
                  <button
                    type="button"
                    onClick={handleCopyShareLink}
                    className="px-2.5 py-1 rounded-lg bg-[#FAF7EE] border border-[#393636]/15 hover:border-[#F14C2F] font-semibold flex items-center gap-1 cursor-pointer"
                  >
                    {copiedLink ? <Check className="w-3 h-3 text-emerald-600" /> : <Copy className="w-3 h-3" />}
                    <span>{copiedLink ? 'Copied' : 'Copy Link'}</span>
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Who Is This For + Practical Skills */}
      <section className="py-14 bg-white border-b border-[#393636]/10">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 grid grid-cols-1 lg:grid-cols-12 gap-10">
          <div className="lg:col-span-5 space-y-4">
            <div className="text-xs font-extrabold uppercase tracking-wider text-[#F14C2F]">
              Who This Course Is Designed For
            </div>
            <h2 className="text-2xl sm:text-3xl font-extrabold text-[#393636] tracking-tight">
              Built for Complete Beginners Who Want Real Software Fluency
            </h2>
            <p className="text-sm text-[#393636]/80 leading-relaxed">
              Whether you are creating YouTube explainers, short-form educational reels, college documentaries, or freelance client edits in India or globally, you start from zero without needing paid plug-ins.
            </p>
            <ul className="space-y-2.5 text-sm text-[#393636]/85 pt-2">
              {course.prerequisites.map((req, i) => (
                <li key={i} className="flex items-start gap-2.5">
                  <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
                  <span>{req}</span>
                </li>
              ))}
            </ul>
          </div>

          <div className="lg:col-span-7 space-y-4">
            <div className="text-xs font-extrabold uppercase tracking-wider text-[#F14C2F]">
              Skills You Practice Step by Step
            </div>
            <h2 className="text-2xl sm:text-3xl font-extrabold text-[#393636] tracking-tight">
              Core Post-Production Outcomes Across All 8 Modules
            </h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5 pt-2">
              {course.outcomes.map((outcome, i) => (
                <div
                  key={i}
                  className="p-4 rounded-2xl bg-[#FAF7EE] border border-[#393636]/10 flex items-start gap-3 text-xs sm:text-sm"
                >
                  <span className="font-mono font-bold text-[#F14C2F] shrink-0">
                    {String(i + 1).padStart(2, '0')}
                  </span>
                  <span className="text-[#393636] font-medium leading-snug">{outcome}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* High-Level 8-Module Public Outline (No private lesson scripts or hints exposed) */}
      <section className="py-14 bg-[#FAF7EE] border-b border-[#393636]/10">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-8">
          <div className="max-w-2xl space-y-2">
            <div className="text-xs font-extrabold uppercase tracking-wider text-[#F14C2F]">
              Public Syllabus Overview
            </div>
            <h2 className="text-2xl sm:text-3xl font-extrabold text-[#393636] tracking-tight">
              All 8 Modules in {course.title}
            </h2>
            <p className="text-sm text-[#393636]/75 leading-relaxed">
              Every module pairs interactive AI dialogue with real DaVinci Resolve exercises and a 10-point rubric assessment (minimum 5.0/10 score required to pass, with 1 retry permitted).
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {course.modules.map((mod) => (
              <div
                key={mod.id}
                className="bg-white rounded-2xl p-5 border border-[#393636]/10 space-y-2 flex flex-col justify-between"
              >
                <div className="space-y-1.5">
                  <div className="text-xs font-bold text-[#F14C2F]">
                    Module {mod.moduleNumber} · {mod.lessons.length} Guided Lessons
                  </div>
                  <h3 className="text-base font-bold text-[#393636]">{mod.title}</h3>
                  <p className="text-xs text-[#393636]/75 leading-relaxed">{mod.description}</p>
                </div>
              </div>
            ))}
          </div>

          <div className="flex flex-wrap items-center gap-4">
            <a
              href="/course/course-davinci-resolve"
              onClick={(e) => {
                e.preventDefault();
                navigate('course-details', course.id);
              }}
              className="text-sm font-bold text-[#F14C2F] hover:underline flex items-center gap-1"
            >
              <span>Inspect Detailed Lesson Titles</span>
              <ArrowRight className="w-4 h-4" />
            </a>
          </div>
        </div>
      </section>

      {/* How the AI Teacher & Compliance Safety Work */}
      <section className="py-14 bg-white border-b border-[#393636]/10">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-8">
          <div className="max-w-2xl space-y-2">
            <div className="text-xs font-extrabold uppercase tracking-wider text-[#F14C2F]">
              Methodology &amp; Transparency
            </div>
            <h2 className="text-2xl sm:text-3xl font-extrabold text-[#393636] tracking-tight">
              How Golu Guru Helps You Learn Without Passive Friction
            </h2>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="p-6 rounded-2xl bg-[#FAF7EE] border border-[#393636]/10 space-y-2.5">
              <Mic className="w-5 h-5 text-[#F14C2F]" />
              <h3 className="text-base font-bold text-[#393636]">Interactive Voice &amp; Bilingual Chat</h3>
              <p className="text-xs text-[#393636]/80 leading-relaxed">
                Ask questions in English or conversational Hindi/Hinglish. Interruption handling lets you pause the tutor immediately if you want an explanation slowed down.
              </p>
            </div>
            <div className="p-6 rounded-2xl bg-[#FAF7EE] border border-[#393636]/10 space-y-2.5">
              <Camera className="w-5 h-5 text-[#F14C2F]" />
              <h3 className="text-base font-bold text-[#393636]">Timeline Screenshot Inspection</h3>
              <p className="text-xs text-[#393636]/80 leading-relaxed">
                Paste a screenshot (Ctrl+V) of your DaVinci Resolve window inside the classroom to diagnose missing snapping icons, silent audio buses, or node wiring.
              </p>
            </div>
            <div className="p-6 rounded-2xl bg-[#FAF7EE] border border-[#393636]/10 space-y-2.5">
              <ShieldCheck className="w-5 h-5 text-emerald-600" />
              <h3 className="text-base font-bold text-[#393636]">Transparent AI &amp; Child Safety</h3>
              <p className="text-xs text-[#393636]/80 leading-relaxed">
                Your AI Teacher is clearly disclosed as an automated Gemini AI system with PII scrubbing, minor parental consent safeguards, and human-reviewed course steps.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Pricing Summary & Honest Value */}
      <section className="py-14 bg-[#EFEBDA]/60 border-b border-[#393636]/10">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="bg-white rounded-3xl p-8 border border-[#393636]/10 grid grid-cols-1 md:grid-cols-2 gap-8 items-center">
            <div className="space-y-3">
              <div className="text-xs font-extrabold uppercase tracking-wider text-[#F14C2F]">
                Transparent INR Tuition
              </div>
              <h2 className="text-2xl font-extrabold text-[#393636]">
                ₹499 Student Plan · ₹1,899 Standard Plan
              </h2>
              <p className="text-xs sm:text-sm text-[#393636]/75 leading-relaxed">
                One-time Razorpay INR payment grants access to all 8 modules, practical rubric grading, and code-verified TUTeach completion certificates. No recurring subscription fees.
              </p>
              <div className="flex flex-wrap gap-3 pt-2">
                <button
                  onClick={handleEnrolClick}
                  className="px-6 py-3 rounded-xl bg-[#F14C2F] hover:bg-[#d83c21] text-white font-bold text-xs sm:text-sm cursor-pointer"
                >
                  {isPaid ? 'Go to Classroom' : 'Enrol at ₹499 Student Rate'}
                </button>
                <a
                  href="/blog"
                  onClick={(e) => {
                    e.preventDefault();
                    setActiveBlogPost(null);
                    navigate('blog');
                  }}
                  className="px-5 py-3 rounded-xl bg-[#FAF7EE] border border-[#393636]/15 font-bold text-xs sm:text-sm hover:border-[#F14C2F]"
                >
                  Read Free Study Guides
                </a>
              </div>
            </div>

            <div className="bg-[#FAF7EE] rounded-2xl p-5 border border-[#393636]/10 space-y-2.5 text-xs">
              <div className="flex items-center gap-2 font-bold text-[#393636]">
                <GraduationCap className="w-4 h-4 text-[#F14C2F]" />
                <span>Important Course &amp; Certificate Disclosures</span>
              </div>
              <p className="text-[#393636]/80 leading-relaxed">
                TUTeach is an independent educational platform designed by Anmol Creates and is not affiliated with Blackmagic Design. Platform certificates verify course completion on TUTeach and are not accredited university degrees.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* FAQ Section Matching FAQPage JSON-LD */}
      <section className="py-14 bg-white">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 space-y-6">
          <div className="space-y-2">
            <div className="text-xs font-extrabold uppercase tracking-wider text-[#F14C2F]">
              Frequently Asked Questions
            </div>
            <h2 className="text-2xl sm:text-3xl font-extrabold text-[#393636]">
              Common Questions Before You Start
            </h2>
          </div>

          <div className="space-y-3">
            {faqs.map((faq, idx) => {
              const isOpen = openFaq === idx;
              return (
                <div
                  key={idx}
                  className="border border-[#393636]/15 rounded-2xl overflow-hidden bg-[#FAF7EE]/60"
                >
                  <button
                    type="button"
                    onClick={() => setOpenFaq(isOpen ? null : idx)}
                    className="w-full p-5 text-left flex items-center justify-between gap-4 font-bold text-sm text-[#393636] cursor-pointer"
                  >
                    <span>{faq.q}</span>
                    {isOpen ? (
                      <ChevronUp className="w-4 h-4 text-[#F14C2F] shrink-0" />
                    ) : (
                      <ChevronDown className="w-4 h-4 text-[#393636]/60 shrink-0" />
                    )}
                  </button>
                  {isOpen && (
                    <div className="px-5 pb-5 text-xs sm:text-sm text-[#393636]/80 leading-relaxed border-t border-[#393636]/10 pt-3 bg-white">
                      {faq.a}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      </section>
    </div>
  );
};
