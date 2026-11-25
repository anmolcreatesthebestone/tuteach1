import React, { useState } from 'react';
import { useApp } from '../../context/AppContext';
import { TUTeachLogo } from '../common/Logo';
import {
  Sparkles,
  ShieldCheck,
  Mail,
  Send,
  HelpCircle,
  FileText,
  Lock,
  CheckCircle2,
  ChevronDown,
  ChevronUp,
  BrainCircuit,
  MessageSquare,
  Clock,
  Heart
} from 'lucide-react';

// ==========================================
// 8. About TUTeach
// ==========================================
export const AboutPage: React.FC = () => {
  const { navigate } = useApp();

  return (
    <div className="min-h-screen bg-[#EFEBDA] py-16 px-4 sm:px-6 lg:px-8">
      <div className="max-w-4xl mx-auto space-y-12 text-[#393636]">
        {/* Hero */}
        <div className="text-center space-y-4">
          <span className="text-xs font-bold uppercase tracking-widest text-[#F14C2F] bg-[#F14C2F]/10 px-3 py-1 rounded-full">
            Our Mission & Philosophy
          </span>
          <h1 className="text-4xl sm:text-5xl font-black text-[#393636]">
            About TUTeach
          </h1>
          <p className="text-lg text-gray-600 max-w-2xl mx-auto leading-relaxed">
            We believe that real engineering mastery cannot happen through passive video watching. It happens through active reasoning, practical challenges, evidence-based feedback, and intelligent AI tutoring.
          </p>
        </div>

        {/* Core Pillars */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="bg-white rounded-3xl p-6 sm:p-8 border border-[#393636]/10 shadow-sm space-y-3">
            <div className="w-10 h-10 rounded-xl bg-[#F14C2F]/10 text-[#F14C2F] flex items-center justify-center font-bold">
              <Sparkles className="w-5 h-5" />
            </div>
            <h3 className="text-xl font-bold text-[#393636]">Learn Smarter With AI</h3>
            <p className="text-xs sm:text-sm text-gray-600 leading-relaxed">
              TUTutor acts as a 24/7 personalized teacher. It doesn't just give away solutions; it employs Socratic questioning, ELI5 analogies, and deep technical insights to make core principles click permanently.
            </p>
          </div>

          <div className="bg-white rounded-3xl p-6 sm:p-8 border border-[#393636]/10 shadow-sm space-y-3">
            <div className="w-10 h-10 rounded-xl bg-[#393636]/10 text-[#393636] flex items-center justify-center font-bold">
              <ShieldCheck className="w-5 h-5" />
            </div>
            <h3 className="text-xl font-bold text-[#393636]">Evidence-Based Evaluation</h3>
            <p className="text-xs sm:text-sm text-gray-600 leading-relaxed">
              Generic grades produce learner confusion. Our assessment engine identifies exact line numbers, praises concrete strengths, flags specific misconceptions, and generates targeted revision flashcards.
            </p>
          </div>
        </div>

        {/* Attribution Card */}
        <div className="bg-[#393636] text-white rounded-3xl p-8 sm:p-12 shadow-md space-y-4 text-center border-2 border-black/20">
          <span className="text-xs font-bold uppercase tracking-widest text-[#F14C2F]">
            Design & Engineering Origin
          </span>
          <h2 className="text-2xl sm:text-3xl font-extrabold text-white">
            Designed and Created by Anmol Creates
          </h2>
          <p className="text-sm text-[#EFEBDA]/85 max-w-xl mx-auto leading-relaxed">
            TUTeach was conceived and engineered by <strong>Anmol Creates</strong> to elevate educational technology beyond passive lectures. Every interaction—from the voice-enabled AI tutor to the verifiable certificates—is crafted with pedagogical rigor and brand discipline.
          </p>
          <div className="pt-2 text-xs text-gray-400">
            © 2026 TUTeach. All rights reserved.
          </div>
        </div>

        {/* CTA */}
        <div className="text-center pt-4">
          <button
            onClick={() => navigate('catalog')}
            className="px-8 py-3.5 bg-[#F14C2F] hover:bg-[#d63b20] text-white font-extrabold text-sm rounded-xl shadow-md transition-all cursor-pointer"
          >
            Explore the Curriculum
          </button>
        </div>
      </div>
    </div>
  );
};

// ==========================================
// 9. Contact and Support
// ==========================================
export const ContactPage: React.FC = () => {
  const [submitted, setSubmitted] = useState(false);
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [category, setCategory] = useState('Technical Support');
  const [message, setMessage] = useState('');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name || !email || !message) return;
    setSubmitted(true);
  };

  return (
    <div className="min-h-screen bg-[#EFEBDA] py-16 px-4 sm:px-6 lg:px-8">
      <div className="max-w-4xl mx-auto space-y-12">
        <div className="text-center space-y-3">
          <span className="text-xs font-bold uppercase tracking-widest text-[#F14C2F] bg-[#F14C2F]/10 px-3 py-1 rounded-full">
            Support Center
          </span>
          <h1 className="text-3xl sm:text-5xl font-black text-[#393636]">
            Contact TUTeach Support
          </h1>
          <p className="text-sm text-gray-600 max-w-xl mx-auto">
            Need assistance with your courses, assignment evaluations, or student account? Our instructional support team is here to assist.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-12 gap-8">
          {/* Info Sidebar */}
          <div className="md:col-span-5 space-y-6">
            <div className="bg-white rounded-3xl p-6 border border-[#393636]/10 shadow-sm space-y-4">
              <h3 className="font-bold text-base text-[#393636]">Support Guidelines</h3>
              <div className="space-y-3 text-xs text-gray-600">
                <div className="flex items-start gap-2.5">
                  <Clock className="w-4 h-4 text-[#F14C2F] flex-shrink-0 mt-0.5" />
                  <div>
                    <strong className="text-[#393636]">Response Time:</strong>
                    <p>Usually within 12-24 hours on business days.</p>
                  </div>
                </div>
                <div className="flex items-start gap-2.5">
                  <Mail className="w-4 h-4 text-[#F14C2F] flex-shrink-0 mt-0.5" />
                  <div>
                    <strong className="text-[#393636]">Direct Email:</strong>
                    <p>support@tuteach.ai</p>
                  </div>
                </div>
                <div className="flex items-start gap-2.5">
                  <Sparkles className="w-4 h-4 text-[#F14C2F] flex-shrink-0 mt-0.5" />
                  <div>
                    <strong className="text-[#393636]">AI Teacher Feedback:</strong>
                    <p>You can flag any answer inside the classroom for evaluation review.</p>
                  </div>
                </div>
              </div>
            </div>

            <div className="p-6 bg-[#393636] text-white rounded-3xl space-y-2 text-xs">
              <p className="font-bold text-[#EFEBDA]">TUTeach Academic Inquiries</p>
              <p className="text-gray-300">
                For enterprise university licensing or bespoke corporate team onboarding, submit the form with Category: Enterprise & Licensing.
              </p>
            </div>
          </div>

          {/* Form */}
          <div className="md:col-span-7">
            <div className="bg-white rounded-3xl p-6 sm:p-8 border border-[#393636]/10 shadow-sm">
              {submitted ? (
                <div className="py-12 text-center space-y-4">
                  <div className="w-12 h-12 rounded-full bg-emerald-100 text-emerald-600 flex items-center justify-center mx-auto">
                    <CheckCircle2 className="w-6 h-6" />
                  </div>
                  <h3 className="text-xl font-bold text-[#393636]">Support Ticket Received</h3>
                  <p className="text-xs text-gray-600 max-w-sm mx-auto">
                    Thank you, <strong>{name}</strong>. A support ticket has been created and our team will get back to you at <strong>{email}</strong> promptly.
                  </p>
                  <button
                    onClick={() => setSubmitted(false)}
                    className="px-6 py-2 bg-[#393636] text-white text-xs font-bold rounded-xl"
                  >
                    Send Another Inquiry
                  </button>
                </div>
              ) : (
                <form onSubmit={handleSubmit} className="space-y-4 text-xs sm:text-sm">
                  <div>
                    <label className="block text-xs font-bold text-[#393636] mb-1">
                      Your Name
                    </label>
                    <input
                      type="text"
                      required
                      placeholder="Jane Doe"
                      value={name}
                      onChange={(e) => setName(e.target.value)}
                      className="w-full px-3.5 py-2.5 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#F14C2F]"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-[#393636] mb-1">
                      Email Address
                    </label>
                    <input
                      type="email"
                      required
                      placeholder="jane@example.com"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      className="w-full px-3.5 py-2.5 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#F14C2F]"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-[#393636] mb-1">
                      Inquiry Category
                    </label>
                    <select
                      value={category}
                      onChange={(e) => setCategory(e.target.value)}
                      className="w-full px-3.5 py-2.5 border border-gray-300 rounded-xl bg-white font-medium focus:outline-none focus:ring-2 focus:ring-[#F14C2F]"
                    >
                      <option value="Technical Support">Technical & Classroom Workbench</option>
                      <option value="Curriculum & Assignments">Curriculum & Assignment Grading</option>
                      <option value="Billing & Enrollment">Billing & Membership</option>
                      <option value="Certificate Verification">Certificate Verification</option>
                      <option value="Enterprise & Licensing">Enterprise & Licensing</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-[#393636] mb-1">
                      Detailed Message
                    </label>
                    <textarea
                      required
                      rows={5}
                      placeholder="Please describe your question or issue in detail..."
                      value={message}
                      onChange={(e) => setMessage(e.target.value)}
                      className="w-full px-3.5 py-2.5 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#F14C2F]"
                    />
                  </div>

                  <button
                    type="submit"
                    className="w-full py-3 bg-[#F14C2F] hover:bg-[#d63b20] text-white font-bold text-xs sm:text-sm rounded-xl shadow-md transition-colors flex items-center justify-center gap-2 cursor-pointer"
                  >
                    <Send className="w-4 h-4" /> Submit Support Request
                  </button>
                </form>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

// ==========================================
// 10. Privacy Policy
// ==========================================
export const PrivacyPolicyPage: React.FC = () => {
  return (
    <div className="min-h-screen bg-[#EFEBDA] py-16 px-4 sm:px-6 lg:px-8">
      <div className="max-w-4xl mx-auto bg-white rounded-3xl p-8 sm:p-14 border border-[#393636]/10 shadow-sm space-y-8 text-[#393636]">
        <div className="space-y-2 border-b border-gray-100 pb-6">
          <span className="text-xs font-bold uppercase tracking-wider text-[#F14C2F]">
            Data Governance & Privacy
          </span>
          <h1 className="text-3xl sm:text-4xl font-black text-[#393636]">
            Privacy Policy
          </h1>
          <p className="text-xs text-gray-500">
            Effective Date: January 1, 2026 • Last Updated: October 2026
          </p>
        </div>

        <div className="space-y-6 text-xs sm:text-sm text-gray-700 leading-relaxed">
          <section className="space-y-2">
            <h2 className="text-lg font-bold text-[#393636]">1. Student Data Protection & AI Privacy Guarantee</h2>
            <p>
              At TUTeach, student code submissions, voice prompts, and assignment evaluations are treated with strict confidentiality. <strong>We do not use your private coding submissions or personal assignments to train public general AI models.</strong>
            </p>
          </section>

          <section className="space-y-2">
            <h2 className="text-lg font-bold text-[#393636]">2. Information We Collect</h2>
            <ul className="list-disc pl-5 space-y-1">
              <li><strong>Account Credentials:</strong> Name, email address, password hash, and learning goals.</li>
              <li><strong>Instructional Progress:</strong> Completed lesson IDs, quiz scores, assignment code files, and evaluation history.</li>
              <li><strong>Interactive Q&A:</strong> Transcripts of text queries and speech input sent to TUTutor for the sole purpose of rendering immediate pedagogical responses.</li>
            </ul>
          </section>

          <section className="space-y-2">
            <h2 className="text-lg font-bold text-[#393636]">3. How We Process AI Queries</h2>
            <p>
              When you interact with TUTutor or submit an assignment for evaluation, data is securely routed via server-side API proxies to the Gemini 3.8 Flash model. No browser API keys are exposed, and zero customer telemetry is sold to third parties.
            </p>
          </section>

          <section className="space-y-2">
            <h2 className="text-lg font-bold text-[#393636]">4. Ownership and Attributions</h2>
            <p>
              TUTeach is designed and created by <strong>Anmol Creates</strong>. All intellectual property in the platform architecture, curriculum schemas, and brand design is protected under global copyright law.
            </p>
          </section>
        </div>
      </div>
    </div>
  );
};

// ==========================================
// 11. Terms of Service
// ==========================================
export const TermsPage: React.FC = () => {
  return (
    <div className="min-h-screen bg-[#EFEBDA] py-16 px-4 sm:px-6 lg:px-8">
      <div className="max-w-4xl mx-auto bg-white rounded-3xl p-8 sm:p-14 border border-[#393636]/10 shadow-sm space-y-8 text-[#393636]">
        <div className="space-y-2 border-b border-gray-100 pb-6">
          <span className="text-xs font-bold uppercase tracking-wider text-[#F14C2F]">
            Academic Code of Conduct
          </span>
          <h1 className="text-3xl sm:text-4xl font-black text-[#393636]">
            Terms of Service
          </h1>
          <p className="text-xs text-gray-500">
            Effective Date: January 1, 2026 • © 2026 TUTeach. All rights reserved.
          </p>
        </div>

        <div className="space-y-6 text-xs sm:text-sm text-gray-700 leading-relaxed">
          <section className="space-y-2">
            <h2 className="text-lg font-bold text-[#393636]">1. Acceptance of Terms</h2>
            <p>
              By accessing or enrolling in courses on TUTeach (“Learn Smarter With AI”), you agree to be bound by these Terms of Service. If you do not agree with any provision, you may not use the platform.
            </p>
          </section>

          <section className="space-y-2">
            <h2 className="text-lg font-bold text-[#393636]">2. Academic Integrity & Code Submissions</h2>
            <p>
              TUTeach practical assignments are designed for deliberate practice. While you may ask TUTutor for Socratic hints and conceptual analogies, students must write their own assignment solutions. Deliberate submission of plagiarized code forfeits eligibility for verified certificate issuance.
            </p>
          </section>

          <section className="space-y-2">
            <h2 className="text-lg font-bold text-[#393636]">3. Verifiable Certificate Authenticity</h2>
            <p>
              Certificates of Completion are granted solely when a student satisfies the quantitative and qualitative requirements: 100% of lessons marked completed and all practical assignments evaluated at or above the designated rubric passing threshold (70%). Each certificate carries a unique verification hash.
            </p>
          </section>

          <section className="space-y-2">
            <h2 className="text-lg font-bold text-[#393636]">4. Ownership Notice</h2>
            <p>
              “© 2026 TUTeach. All rights reserved.” Designed and created by <strong>Anmol Creates</strong>.
            </p>
          </section>
        </div>
      </div>
    </div>
  );
};

// ==========================================
// 12. Help & Knowledge Base
// ==========================================
export const HelpPage: React.FC = () => {
  const [openFaq, setOpenFaq] = useState<number | null>(0);

  const faqs = [
    {
      q: 'How does TUTutor work as a personal AI teacher?',
      a: 'TUTutor is powered by Gemini 3.8 Flash and grounded in each lesson’s specific knowledge base. You can switch between Socratic Guidance (hints & questions), ELI5 (simple metaphors), or Deep Dive (production nuances). You can also converse via text or natural microphone voice.'
    },
    {
      q: 'What is an Evidence-Based Assignment Evaluation?',
      a: 'Unlike generic grading rubrics, TUTeach analyzes your actual code line-by-line. It cites exact statements from your code, breaks down your score across 4 rubric criteria, details what you did well, flags specific bugs, and gives actionable refactoring suggestions.'
    },
    {
      q: 'How does the Targeted Revision Deck reinforce learning?',
      a: 'Whenever an assignment identifies a gap (e.g. error handling, recursion, vector normalization), our platform automatically generates targeted active-recall flashcards with mnemonics. Spaced repetition ratings ensure you review concepts before you forget them.'
    },
    {
      q: 'How do I earn a verified Certificate of Completion?',
      a: 'To earn an authenticated certificate: complete 100% of lessons in the course and score at least 70% on all practical assessments. You can then print or download your certificate as a PDF, complete with verification ID and signatures.'
    },
    {
      q: 'Who created TUTeach?',
      a: 'TUTeach is designed and created by Anmol Creates, built to empower engineers and students worldwide with a smarter, AI-driven educational journey.'
    }
  ];

  return (
    <div className="min-h-screen bg-[#EFEBDA] py-16 px-4 sm:px-6 lg:px-8">
      <div className="max-w-4xl mx-auto space-y-12 text-[#393636]">
        <div className="text-center space-y-3">
          <span className="text-xs font-bold uppercase tracking-widest text-[#F14C2F] bg-[#F14C2F]/10 px-3 py-1 rounded-full">
            Help Center
          </span>
          <h1 className="text-3xl sm:text-5xl font-black text-[#393636]">
            Frequently Asked Questions
          </h1>
          <p className="text-sm text-gray-600 max-w-xl mx-auto">
            Everything you need to know about navigating TUTeach, using your AI tutor, and earning certificates.
          </p>
        </div>

        <div className="bg-white rounded-3xl p-6 sm:p-10 border border-[#393636]/10 shadow-sm space-y-4">
          {faqs.map((faq, idx) => {
            const isOpen = openFaq === idx;
            return (
              <div
                key={idx}
                className="border border-[#393636]/15 rounded-2xl overflow-hidden transition-colors"
              >
                <button
                  onClick={() => setOpenFaq(isOpen ? null : idx)}
                  className="w-full p-4 sm:p-5 bg-gray-50 hover:bg-gray-100/70 text-left flex items-center justify-between font-bold text-xs sm:text-sm text-[#393636] transition-colors cursor-pointer"
                >
                  <span>{faq.q}</span>
                  {isOpen ? (
                    <ChevronUp className="w-4 h-4 text-gray-500 flex-shrink-0 ml-2" />
                  ) : (
                    <ChevronDown className="w-4 h-4 text-gray-500 flex-shrink-0 ml-2" />
                  )}
                </button>
                {isOpen && (
                  <div className="p-4 sm:p-5 bg-white text-xs sm:text-sm text-gray-600 leading-relaxed border-t border-gray-100">
                    {faq.a}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
};
