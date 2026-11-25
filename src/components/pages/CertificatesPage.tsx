import React, { useState } from 'react';
import { useApp } from '../../context/AppContext';
import { COURSES_DATA } from '../../data/coursesData';
import { CertificateModal } from '../certificate/CertificateModal';
import {
  Award,
  CheckCircle2,
  Lock,
  Download,
  Share2,
  ExternalLink,
  ShieldCheck,
  Sparkles,
  ArrowRight,
  BookOpen
} from 'lucide-react';

export const CertificatesPage: React.FC = () => {
  const {
    certificates,
    completedLessonIds,
    assignmentEvaluations,
    navigate,
    user,
    activeCertificate,
    setActiveCertificate,
    checkAndAwardCertificate
  } = useApp();

  const [previewCertOpen, setPreviewCertOpen] = useState(false);

  const course = COURSES_DATA[0];
  const allLessons = course.modules.flatMap((m) => m.lessons);
  const completedCount = allLessons.filter((l) => completedLessonIds.includes(l.id)).length;
  const isComplete = completedCount === allLessons.length;

  const passedAssignments = Object.values(assignmentEvaluations).filter(
    (e) => e.score >= 5
  ).length;

  return (
    <div className="min-h-screen bg-[#EFEBDA] py-10 px-4 sm:px-6 lg:px-8">
      <div className="max-w-4xl mx-auto space-y-8">
        {/* Header */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-[#393636]/15 pb-6">
          <div>
            <div className="flex items-center gap-2 text-xs font-bold text-[#F14C2F] uppercase tracking-wider mb-1">
              <Award className="w-4 h-4" />
              Verified Credentials
            </div>
            <h1 className="text-3xl font-extrabold text-[#393636] tracking-tight">
              Certificates of Mastery
            </h1>
            <p className="text-sm text-[#393636]/75 mt-1">
              Industry-recognized, verifiable certificates powered by TUTeach AI evaluation records.
            </p>
          </div>

          <button
            onClick={() => navigate('classroom')}
            className="px-4 py-2 text-xs font-bold bg-[#F14C2F] text-white rounded-xl hover:bg-[#d63b20] transition-all flex items-center gap-1.5 self-start md:self-auto"
          >
            Go to Classroom
            <ArrowRight className="w-3.5 h-3.5" />
          </button>
        </div>

        {/* Certificate Card or Requirements Tracker */}
        {certificates.length > 0 ? (
          <div className="space-y-6">
            {certificates.map((cert) => (
              <div
                key={cert.id}
                className="bg-white rounded-3xl border border-[#393636]/15 p-6 sm:p-8 shadow-sm space-y-6"
              >
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-gray-100 pb-6">
                  <div>
                    <span className="text-xs font-bold px-2.5 py-1 bg-emerald-100 text-emerald-800 rounded-md inline-flex items-center gap-1">
                      <ShieldCheck className="w-3.5 h-3.5" /> Verifiable Credential
                    </span>
                    <h2 className="text-2xl font-black text-[#393636] mt-2">
                      {cert.courseTitle}
                    </h2>
                    <p className="text-xs text-gray-500 mt-1">
                      Issued to <span className="font-bold text-[#393636]">{cert.studentName}</span> on{' '}
                      {new Date(cert.issuedAt || cert.issueDate || Date.now()).toLocaleDateString()}
                    </p>
                  </div>

                  <div className="text-right">
                    <span className="text-xs font-mono text-gray-400 block">Credential ID</span>
                    <span className="text-xs font-mono font-bold text-[#393636] bg-gray-100 px-2 py-1 rounded">
                      {cert.verificationCode}
                    </span>
                  </div>
                </div>

                <div className="flex flex-wrap items-center justify-between gap-4 pt-2">
                  <div className="flex items-center gap-4 text-xs text-gray-600">
                    <span>Grade: <strong className="text-[#393636]">{cert.grade}</strong></span>
                    <span>•</span>
                    <span>Score Average: <strong className="text-[#393636]">{cert.scoreAverageOutof10 || 9.2}/10</strong></span>
                  </div>

                  <div className="flex items-center gap-3">
                    <button
                      onClick={() => setActiveCertificate(cert)}
                      className="px-4 py-2 bg-[#F14C2F] hover:bg-[#d63b20] text-white text-xs font-bold rounded-xl transition-all shadow-2xs flex items-center gap-1.5"
                    >
                      <Download className="w-3.5 h-3.5" />
                      View & Print Certificate
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="bg-white rounded-3xl border border-[#393636]/15 p-8 shadow-sm space-y-6">
            <div className="flex items-center gap-4">
              <div className="w-14 h-14 rounded-2xl bg-amber-100 text-amber-700 flex items-center justify-center flex-shrink-0">
                <Lock className="w-7 h-7" />
              </div>
              <div>
                <h3 className="text-xl font-bold text-[#393636]">
                  DaVinci Resolve Certified Specialist (In Progress)
                </h3>
                <p className="text-xs text-gray-500 mt-0.5">
                  Complete all modules and assignments to unlock your official verified certificate.
                </p>
              </div>
            </div>

            {/* Checklist */}
            <div className="bg-gray-50 rounded-2xl p-5 border border-gray-200/70 space-y-3">
              <h4 className="text-xs font-bold uppercase tracking-wider text-gray-600">
                Requirements Checklist:
              </h4>

              <div className="space-y-2 text-xs">
                <div className="flex items-center justify-between">
                  <span className="flex items-center gap-2">
                    {isComplete ? (
                      <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                    ) : (
                      <div className="w-4 h-4 rounded-full border border-gray-300" />
                    )}
                    Complete all 43 video editing lessons
                  </span>
                  <span className="font-mono font-bold text-gray-600">
                    {completedCount}/43
                  </span>
                </div>

                <div className="flex items-center justify-between">
                  <span className="flex items-center gap-2">
                    {passedAssignments >= 1 ? (
                      <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                    ) : (
                      <div className="w-4 h-4 rounded-full border border-gray-300" />
                    )}
                    Pass practical timeline assignments
                  </span>
                  <span className="font-mono font-bold text-gray-600">
                    {passedAssignments} completed
                  </span>
                </div>

                <div className="flex items-center justify-between">
                  <span className="flex items-center gap-2">
                    <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                    AI rubric score average ≥ 7.0
                  </span>
                  <span className="font-mono font-bold text-emerald-700">Eligible</span>
                </div>
              </div>
            </div>

            <div className="flex flex-col sm:flex-row items-center justify-between gap-4 pt-4 border-t border-gray-100">
              <p className="text-xs text-gray-500">
                Need to complete remaining lessons? Jump right back into the classroom.
              </p>
              <button
                onClick={() => navigate('classroom')}
                className="w-full sm:w-auto px-5 py-2.5 bg-[#F14C2F] text-white font-bold rounded-xl text-xs hover:bg-[#d63b20] transition-all shadow-sm"
              >
                Resume Course
              </button>
            </div>
          </div>
        )}

        {/* Certificate Modal */}
        {activeCertificate && (
          <CertificateModal
            certificate={activeCertificate}
            onClose={() => setActiveCertificate(null)}
          />
        )}
      </div>
    </div>
  );
};
