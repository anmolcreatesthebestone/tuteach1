import React from 'react';
import { useApp } from '../../context/AppContext';
import { COURSES_DATA } from '../../data/coursesData';
import { TUTeachLogo } from '../common/Logo';
import {
  Lock,
  Sparkles,
  ShieldCheck,
  CreditCard,
  CheckCircle2,
  ArrowRight,
  BookOpen,
  Award,
  Mic,
  Home
} from 'lucide-react';

interface ClassroomLockedGateProps {
  courseId?: string;
}

export const ClassroomLockedGate: React.FC<ClassroomLockedGateProps> = ({ courseId }) => {
  const { navigate, selectedCourseId, user } = useApp();
  const targetCourseId = courseId || selectedCourseId || 'course-davinci-resolve';
  const course = COURSES_DATA.find((c) => c.id === targetCourseId) || COURSES_DATA[0];

  return (
    <div className="min-h-screen bg-[#EFEBDA] flex flex-col justify-between text-[#393636] font-sans">
      {/* Top Bar */}
      <header className="px-6 py-4 bg-[#FAF7EE] border-b border-[#393636]/10 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <TUTeachLogo size="sm" />
          <span className="hidden sm:inline text-xs font-bold text-[#393636]/60">
            AI Classroom Security Gate
          </span>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={() => navigate('home')}
            className="px-3 py-1.5 text-xs font-semibold text-[#393636] hover:text-[#F14C2F] flex items-center gap-1.5 transition-colors cursor-pointer"
          >
            <Home className="w-3.5 h-3.5" />
            <span>Home</span>
          </button>
          <button
            onClick={() => navigate('demo')}
            className="px-3.5 py-1.5 text-xs font-bold bg-[#F14C2F]/10 hover:bg-[#F14C2F] text-[#F14C2F] hover:text-white rounded-lg transition-all flex items-center gap-1.5 cursor-pointer"
          >
            <Sparkles className="w-3.5 h-3.5" />
            <span>Free 5-Min Demo</span>
          </button>
        </div>
      </header>

      {/* Main Lock Screen Card */}
      <main className="flex-1 max-w-4xl w-full mx-auto px-4 py-10 sm:py-16 flex items-center justify-center">
        <div className="bg-white rounded-3xl p-6 sm:p-10 border border-[#393636]/10 shadow-xl space-y-8 text-center relative overflow-hidden w-full">
          {/* Subtle Ambient Background Gradient */}
          <div className="absolute -top-24 -left-24 w-72 h-72 rounded-full bg-[#F14C2F]/10 blur-3xl pointer-events-none" />
          <div className="absolute -bottom-24 -right-24 w-72 h-72 rounded-full bg-amber-500/10 blur-3xl pointer-events-none" />

          {/* Icon Badge */}
          <div className="relative inline-flex items-center justify-center">
            <div className="w-20 h-20 rounded-3xl bg-[#F14C2F]/10 text-[#F14C2F] flex items-center justify-center shadow-inner">
              <Lock className="w-10 h-10" />
            </div>
            <div className="absolute -bottom-2 -right-2 w-7 h-7 rounded-full bg-[#393636] text-white flex items-center justify-center shadow">
              <ShieldCheck className="w-4 h-4 text-emerald-400" />
            </div>
          </div>

          {/* Heading */}
          <div className="space-y-3 max-w-2xl mx-auto">
            <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-amber-100 text-amber-900 text-xs font-extrabold uppercase tracking-wider">
              <span>Classroom Access Locked • Payment Required</span>
            </div>
            <h1 className="text-2xl sm:text-4xl font-extrabold text-[#393636] tracking-tight">
              Full Classes Require Course Tuition
            </h1>
            <p className="text-sm sm:text-base text-[#393636]/80 leading-relaxed">
              No access to full AI Teacher classes is permitted without payment. To attend live voice lessons for <strong className="text-[#393636]">{course.title}</strong>, complete the subsidized student checkout below.
            </p>
          </div>

          {/* Free Demo Highlight Box */}
          <div className="bg-[#FAF7EE] border border-amber-300/60 rounded-2xl p-4 sm:p-5 text-left flex flex-col sm:flex-row items-center justify-between gap-4">
            <div className="space-y-1">
              <div className="flex items-center gap-2">
                <span className="text-xs font-extrabold px-2 py-0.5 bg-[#F14C2F] text-white rounded">
                  ONLY FREE EXCEPTION
                </span>
                <span className="text-xs font-bold text-[#393636]">5-Minute AI Teacher Demo</span>
              </div>
              <p className="text-xs text-[#393636]/75">
                Want to experience how the AI Teacher speaks and listens before paying? Try our free 5-minute interactive voice test with no payment required.
              </p>
            </div>
            <button
              onClick={() => navigate('demo')}
              className="w-full sm:w-auto shrink-0 px-4 py-2.5 bg-[#393636] hover:bg-black text-white text-xs font-bold rounded-xl transition-all flex items-center justify-center gap-1.5 cursor-pointer shadow-xs"
            >
              <Mic className="w-3.5 h-3.5 text-[#F14C2F]" />
              <span>Start Free 5-Min Demo</span>
            </button>
          </div>

          {/* Course Features Upon Payment */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 text-left pt-2">
            <div className="p-4 rounded-xl bg-[#FAF7EE] border border-[#393636]/10 space-y-1">
              <div className="flex items-center gap-2 text-xs font-bold text-[#393636]">
                <BookOpen className="w-4 h-4 text-[#F14C2F]" />
                <span>All 8 Modules & 43 Lessons</span>
              </div>
              <p className="text-[11px] text-[#393636]/70">
                Complete structured curriculum from beginner tools to advanced color & Fairlight audio.
              </p>
            </div>

            <div className="p-4 rounded-xl bg-[#FAF7EE] border border-[#393636]/10 space-y-1">
              <div className="flex items-center gap-2 text-xs font-bold text-[#393636]">
                <Mic className="w-4 h-4 text-[#F14C2F]" />
                <span>Unlimited AI Voice Teacher</span>
              </div>
              <p className="text-[11px] text-[#393636]/70">
                Spoken explanations, natural voice interruptions, and bilingual English/Hinglish modes.
              </p>
            </div>

            <div className="p-4 rounded-xl bg-[#FAF7EE] border border-[#393636]/10 space-y-1">
              <div className="flex items-center gap-2 text-xs font-bold text-[#393636]">
                <Award className="w-4 h-4 text-[#F14C2F]" />
                <span>Graded Tasks & Certificate</span>
              </div>
              <p className="text-[11px] text-[#393636]/70">
                AI rubric grading out of 10, retries, and official verifiable TUTeach certificate.
              </p>
            </div>
          </div>

          {/* Price & Primary CTA */}
          <div className="p-6 rounded-2xl bg-[#393636] text-white flex flex-col sm:flex-row items-center justify-between gap-6 shadow-md">
            <div className="text-left space-y-1">
              <span className="text-[10px] uppercase tracking-wider font-extrabold text-emerald-400">
                Subsidized Student Tuition
              </span>
              <div className="flex items-baseline gap-2">
                <span className="text-3xl font-extrabold text-white">₹{course.studentPriceInr || 499}</span>
                <span className="text-xs text-gray-400 line-through">₹{course.regularPriceInr || 1899}</span>
                <span className="text-xs text-emerald-400 font-bold ml-1">One-time payment</span>
              </div>
              <p className="text-xs text-gray-300">
                Includes UPI (Google Pay / PhonePe / Paytm), Debit/Credit Cards & NetBanking.
              </p>
            </div>

            <div className="flex flex-col sm:flex-row gap-3 w-full sm:w-auto">
              <button
                onClick={() => navigate('checkout', course.id)}
                className="w-full sm:w-auto px-6 py-3.5 bg-[#F14C2F] hover:bg-[#d63b20] text-white font-extrabold text-sm rounded-xl transition-all shadow-md flex items-center justify-center gap-2 cursor-pointer"
              >
                <CreditCard className="w-4 h-4" />
                <span>Enrol & Unlock Classes • ₹499</span>
                <ArrowRight className="w-4 h-4" />
              </button>
            </div>
          </div>

          {/* Secondary Actions */}
          <div className="flex flex-wrap items-center justify-center gap-6 text-xs text-[#393636]/70 pt-2">
            <button
              onClick={() => navigate('course-details', course.id)}
              className="hover:text-[#F14C2F] underline font-medium cursor-pointer"
            >
              View Detailed Course Syllabus
            </button>
            <span>•</span>
            <button
              onClick={() => navigate('catalog')}
              className="hover:text-[#F14C2F] underline font-medium cursor-pointer"
            >
              Browse All Courses
            </button>
            <span>•</span>
            <button
              onClick={() => navigate('demo')}
              className="text-[#F14C2F] font-bold hover:underline cursor-pointer"
            >
              Launch Free 5-Minute Demo
            </button>
          </div>
        </div>
      </main>

      {/* Footer */}
      <footer className="py-4 text-center text-xs text-[#393636]/50 border-t border-[#393636]/10">
        TUTeach AI Education Platform • Strictly Protected Classrooms • Designed and created by Anmol Creates
      </footer>
    </div>
  );
};
