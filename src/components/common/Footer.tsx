import React from 'react';
import { useApp } from '../../context/AppContext';
import { TUTeachLogo } from './Logo';
import { ShieldCheck, Heart, Sparkles, Mail, HelpCircle, FileText, Lock, Globe } from 'lucide-react';

export const Footer: React.FC = () => {
  const { navigate, setIsCookieModalOpen } = useApp();

  return (
    <footer className="bg-[#393636] text-[#EFEBDA] pt-16 pb-12 border-t-4 border-[#F14C2F]">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-10 pb-12 border-b border-[#EFEBDA]/15">
          {/* Brand Info */}
          <div className="lg:col-span-2 space-y-4">
            <div className="bg-[#EFEBDA] p-3 rounded-2xl inline-block">
              <TUTeachLogo size="md" />
            </div>
            <p className="text-sm text-[#EFEBDA]/80 max-w-sm leading-relaxed">
              TUTeach is an AI-guided DaVinci Resolve learning platform with age-protected onboarding, voice &amp; text tutoring, evidence-based evaluations, and verifiable completion credentials.
            </p>
            <div className="flex items-center gap-3 text-xs text-[#EFEBDA]/70 pt-2">
              <span className="flex items-center gap-1">
                <Sparkles className="w-3.5 h-3.5 text-[#F14C2F]" /> Gemini AI Tutor
              </span>
              <span>•</span>
              <span className="flex items-center gap-1">
                <ShieldCheck className="w-3.5 h-3.5 text-emerald-400" /> Student &amp; Child Safety Controls
              </span>
            </div>
          </div>

          {/* Platform Columns */}
          <div>
            <h2 className="text-xs font-bold uppercase tracking-wider text-[#FFFFFF] mb-4">
              Explore Courses &amp; Guides
            </h2>
            <ul className="space-y-2.5 text-sm text-[#EFEBDA]/75">
              <li>
                <a
                  href="/courses/video-editing"
                  onClick={(e) => {
                    e.preventDefault();
                    navigate('course-video-editing');
                  }}
                  className="hover:text-[#F14C2F] transition-colors"
                >
                  Learn Video Editing Online
                </a>
              </li>
              <li>
                <a
                  href="/courses/davinci-resolve-for-beginners"
                  onClick={(e) => {
                    e.preventDefault();
                    navigate('course-davinci-resolve');
                  }}
                  className="hover:text-[#F14C2F] transition-colors"
                >
                  DaVinci Resolve for Beginners
                </a>
              </li>
              <li>
                <a
                  href="/blog"
                  onClick={(e) => {
                    e.preventDefault();
                    navigate('blog');
                  }}
                  className="hover:text-[#F14C2F] transition-colors"
                >
                  Educational Blog
                </a>
              </li>
              <li>
                <a
                  href="/demo"
                  onClick={(e) => {
                    e.preventDefault();
                    navigate('demo');
                  }}
                  className="hover:text-[#F14C2F] transition-colors"
                >
                  Free 5-Min AI Teacher Demo
                </a>
              </li>
              <li>
                <a
                  href="/pricing"
                  onClick={(e) => {
                    e.preventDefault();
                    navigate('pricing');
                  }}
                  className="hover:text-[#F14C2F] transition-colors"
                >
                  Student (₹499) &amp; Standard Pricing
                </a>
              </li>
              <li>
                <a
                  href="/revision"
                  onClick={(e) => {
                    e.preventDefault();
                    navigate('revision');
                  }}
                  className="hover:text-[#F14C2F] transition-colors"
                >
                  DaVinci Shortcuts Deck
                </a>
              </li>
            </ul>
          </div>

          <div>
            <h2 className="text-xs font-bold uppercase tracking-wider text-[#FFFFFF] mb-4">
              Student Center
            </h2>
            <ul className="space-y-2.5 text-sm text-[#EFEBDA]/75">
              <li>
                <a
                  href="/dashboard"
                  onClick={(e) => {
                    e.preventDefault();
                    navigate('dashboard');
                  }}
                  className="hover:text-[#F14C2F] transition-colors"
                >
                  Student Dashboard
                </a>
              </li>
              <li>
                <a
                  href="/my-courses"
                  onClick={(e) => {
                    e.preventDefault();
                    navigate('my-courses');
                  }}
                  className="hover:text-[#F14C2F] transition-colors"
                >
                  My Enrolled Courses
                </a>
              </li>
              <li>
                <a
                  href="/classroom"
                  onClick={(e) => {
                    e.preventDefault();
                    navigate('classroom');
                  }}
                  className="hover:text-[#F14C2F] transition-colors"
                >
                  AI Voice Classroom
                </a>
              </li>
              <li>
                <a
                  href="/assignments"
                  onClick={(e) => {
                    e.preventDefault();
                    navigate('assignments');
                  }}
                  className="hover:text-[#F14C2F] transition-colors"
                >
                  Assignments Lab
                </a>
              </li>
              <li>
                <a
                  href="/parental-consent"
                  onClick={(e) => {
                    e.preventDefault();
                    navigate('parental-consent');
                  }}
                  className="hover:text-[#F14C2F] transition-colors"
                >
                  Parental Consent Portal
                </a>
              </li>
              <li>
                <a
                  href="/certificates"
                  onClick={(e) => {
                    e.preventDefault();
                    navigate('certificates');
                  }}
                  className="hover:text-[#F14C2F] transition-colors"
                >
                  Certificates
                </a>
              </li>
            </ul>
          </div>

          {/* Legal & Support */}
          <div>
            <h2 className="text-xs font-bold uppercase tracking-wider text-[#FFFFFF] mb-4">
              Trust, Safety &amp; Legal
            </h2>
            <ul className="space-y-2 text-xs sm:text-sm text-[#EFEBDA]/75">
              <li>
                <a
                  href="/privacy"
                  onClick={(e) => {
                    e.preventDefault();
                    navigate('privacy');
                  }}
                  className="hover:text-[#F14C2F] transition-colors flex items-center gap-1.5"
                >
                  <Lock className="w-3.5 h-3.5" /> Privacy Policy
                </a>
              </li>
              <li>
                <a
                  href="/terms"
                  onClick={(e) => {
                    e.preventDefault();
                    navigate('terms');
                  }}
                  className="hover:text-[#F14C2F] transition-colors flex items-center gap-1.5"
                >
                  <FileText className="w-3.5 h-3.5" /> Terms &amp; Conditions
                </a>
              </li>
              <li>
                <a
                  href="/child-safety"
                  onClick={(e) => {
                    e.preventDefault();
                    navigate('child-safety');
                  }}
                  className="hover:text-[#F14C2F] transition-colors flex items-center gap-1.5"
                >
                  <ShieldCheck className="w-3.5 h-3.5" /> Child Safety Policy
                </a>
              </li>
              <li>
                <a
                  href="/ai-disclosure"
                  onClick={(e) => {
                    e.preventDefault();
                    navigate('ai-disclosure');
                  }}
                  className="hover:text-[#F14C2F] transition-colors flex items-center gap-1.5"
                >
                  <Sparkles className="w-3.5 h-3.5" /> AI Usage Disclosure
                </a>
              </li>
              <li>
                <a
                  href="/refund-policy"
                  onClick={(e) => {
                    e.preventDefault();
                    navigate('refund-policy');
                  }}
                  className="hover:text-[#F14C2F] transition-colors flex items-center gap-1.5"
                >
                  <FileText className="w-3.5 h-3.5" /> Payment &amp; Refund Policy
                </a>
              </li>
              <li>
                <a
                  href="/grievance"
                  onClick={(e) => {
                    e.preventDefault();
                    navigate('grievance-form');
                  }}
                  className="hover:text-[#F14C2F] transition-colors flex items-center gap-1.5"
                >
                  <Mail className="w-3.5 h-3.5" /> Grievance &amp; Legal Desk
                </a>
              </li>
              <li>
                <button
                  type="button"
                  onClick={() => setIsCookieModalOpen(true)}
                  className="hover:text-[#F14C2F] transition-colors flex items-center gap-1.5 cursor-pointer"
                >
                  <Globe className="w-3.5 h-3.5" /> Cookie Preferences
                </button>
              </li>
            </ul>
          </div>
        </div>

        {/* Ownership Attribution Section - Mandatory Requirements */}
        <div className="pt-8 flex flex-col md:flex-row items-center justify-between gap-4 text-xs text-[#EFEBDA]/80">
          <div className="space-y-1 text-center md:text-left">
            <p className="font-bold text-white tracking-wide text-sm">
              TUTeach — Learn Anything with Your Personal AI Teacher.
            </p>
            <p className="text-[#EFEBDA]/90 font-medium">
              Designed and created by <span className="text-[#F14C2F] font-bold">Anmol Creates</span>.
            </p>
            <p className="text-[#EFEBDA]/50 text-[11px]">
              © 2026 TUTeach. Policies &amp; compliance templates are subject to legal review.
            </p>
          </div>

          {/* Quick Legal & Crawl Footnote Nav */}
          <div className="flex flex-wrap items-center justify-center gap-x-5 gap-y-2 text-xs">
            <a
              href="/about"
              onClick={(e) => {
                e.preventDefault();
                navigate('about');
              }}
              className="hover:text-white transition-colors"
            >
              About
            </a>
            <a
              href="/help"
              onClick={(e) => {
                e.preventDefault();
                navigate('help');
              }}
              className="hover:text-white transition-colors"
            >
              Help &amp; FAQ
            </a>
            <a
              href="/contact"
              onClick={(e) => {
                e.preventDefault();
                navigate('contact');
              }}
              className="hover:text-white transition-colors"
            >
              Contact
            </a>
            <a
              href="/data-retention"
              onClick={(e) => {
                e.preventDefault();
                navigate('data-retention');
              }}
              className="hover:text-white transition-colors"
            >
              Data Retention
            </a>
            <a
              href="/third-party-processors"
              onClick={(e) => {
                e.preventDefault();
                navigate('third-party-processors');
              }}
              className="hover:text-white transition-colors"
            >
              Processors
            </a>
            <a
              href="/ip-disclaimer"
              onClick={(e) => {
                e.preventDefault();
                navigate('ip-disclaimer');
              }}
              className="hover:text-white transition-colors"
            >
              IP Notice
            </a>
            <a
              href="/sitemap.xml"
              className="hover:text-white transition-colors"
            >
              Sitemap
            </a>
            <a
              href="/admin-compliance"
              onClick={(e) => {
                e.preventDefault();
                navigate('admin-compliance');
              }}
              className="hover:text-white transition-colors"
            >
              Compliance Admin
            </a>
          </div>
        </div>
      </div>
    </footer>
  );
};
