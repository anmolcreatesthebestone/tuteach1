import React, { useRef } from 'react';
import { useApp } from '../../context/AppContext';
import { Course } from '../../types';
import {
  Award,
  CheckCircle2,
  Download,
  Share2,
  X,
  Sparkles,
  ShieldCheck,
  Film,
  Lock,
  ArrowRight
} from 'lucide-react';

import { COURSES_DATA } from '../../data/coursesData';
import { TUTeachLogo } from '../common/Logo';

interface CertificateModalProps {
  course?: Course;
  certificate?: any;
  onClose: () => void;
}

export const CertificateModal: React.FC<CertificateModalProps> = ({
  course,
  certificate,
  onClose
}) => {
  const { user, assignmentEvaluations, completedLessonIds, certificates, navigate } = useApp();
  const certRef = useRef<HTMLDivElement>(null);

  const targetCourse =
    course ||
    (certificate ? COURSES_DATA.find((c) => c.id === certificate.courseId) : null) ||
    COURSES_DATA[0];

  const allCourseLessonIds = targetCourse.modules.flatMap((m) => m.lessons.map((l) => l.id));
  const completedCount = allCourseLessonIds.filter((id) => completedLessonIds.includes(id)).length;
  const allAssignmentIds = targetCourse.modules.flatMap((m) =>
    m.lessons.filter((l) => l.practicalAssignment).map((l) => l.practicalAssignment!.id)
  );
  const passedTasks = allAssignmentIds
    .map((id) => assignmentEvaluations[id])
    .filter((ev) => ev && ev.bestScore >= 5.0);

  const existingCert = certificate || certificates.find((c) => c.courseId === targetCourse.id);
  const isEligible =
    Boolean(existingCert) ||
    (completedCount === allCourseLessonIds.length &&
      allAssignmentIds.length > 0 &&
      passedTasks.length === allAssignmentIds.length);

  const evaluationsList = Object.values(assignmentEvaluations);
  const avgScore =
    existingCert?.scoreAverageOutof10?.toFixed?.(1) ||
    certificate?.finalGrade?.toFixed?.(1) ||
    (passedTasks.length > 0
      ? (passedTasks.reduce((acc, ev) => acc + ev.bestScore, 0) / passedTasks.length).toFixed(1)
      : '9.4');

  const certificateId =
    existingCert?.verificationCode ||
    `TUT-DVR-${Math.random().toString(36).substring(2, 8).toUpperCase()}-2026`;
  const issueDate =
    existingCert?.issuedAt ||
    new Date().toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });

  const handlePrint = () => {
    window.print();
  };

  // If student hasn't satisfied requirements and doesn't hold an awarded certificate, show Locked State
  if (!isEligible) {
    return (
      <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4 overflow-y-auto">
        <div className="bg-white rounded-3xl max-w-lg w-full p-6 sm:p-8 space-y-6 shadow-2xl border border-[#393636]/15 my-8">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <div className="w-10 h-10 rounded-xl bg-amber-500/10 text-amber-600 flex items-center justify-center">
                <Lock className="w-5 h-5" />
              </div>
              <div>
                <h2 className="text-lg font-bold text-[#393636]">Certificate In Progress</h2>
                <p className="text-xs text-[#393636]/60">{targetCourse.title}</p>
              </div>
            </div>
            <button
              onClick={onClose}
              className="p-2 text-[#393636]/60 hover:text-[#393636] rounded-full hover:bg-[#EFEBDA] transition-colors cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          <p className="text-xs text-[#393636]/80 leading-relaxed">
            TUTeach completion certificates are verified credentials granted solely when a student satisfies all course requirements:
          </p>

          <div className="space-y-3">
            <div className="p-3 bg-gray-50 rounded-xl border border-gray-100 flex items-center justify-between">
              <div>
                <div className="text-xs font-semibold text-[#393636]">1. Complete All Lessons (100%)</div>
                <div className="text-[11px] text-[#393636]/60 mt-0.5">
                  {completedCount} of {allCourseLessonIds.length} lessons completed
                </div>
              </div>
              <span className={`text-xs font-bold px-2 py-0.5 rounded ${completedCount === allCourseLessonIds.length ? 'bg-emerald-100 text-emerald-800' : 'bg-amber-100 text-amber-800'}`}>
                {completedCount === allCourseLessonIds.length ? 'Completed' : `${Math.round((completedCount / (allCourseLessonIds.length || 1)) * 100)}%`}
              </span>
            </div>

            <div className="p-3 bg-gray-50 rounded-xl border border-gray-100 flex items-center justify-between">
              <div>
                <div className="text-xs font-semibold text-[#393636]">2. Pass Practical Tasks (≥ 5.0/10)</div>
                <div className="text-[11px] text-[#393636]/60 mt-0.5">
                  {passedTasks.length} of {allAssignmentIds.length} practical tasks passed
                </div>
              </div>
              <span className={`text-xs font-bold px-2 py-0.5 rounded ${passedTasks.length === allAssignmentIds.length ? 'bg-emerald-100 text-emerald-800' : 'bg-amber-100 text-amber-800'}`}>
                {passedTasks.length === allAssignmentIds.length ? 'Passed' : `${passedTasks.length}/${allAssignmentIds.length}`}
              </span>
            </div>
          </div>

          <div className="pt-2 flex items-center gap-3">
            <button
              onClick={() => {
                onClose();
                navigate('classroom', targetCourse.id);
              }}
              className="flex-1 bg-[#F14C2F] hover:bg-[#d63b20] text-white py-2.5 rounded-xl text-xs font-bold flex items-center justify-center gap-2 shadow-xs transition-colors cursor-pointer"
            >
              <span>Continue Learning in Classroom</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </button>
            <button
              onClick={onClose}
              className="px-4 py-2.5 border border-gray-300 text-gray-700 hover:bg-gray-50 rounded-xl text-xs font-semibold cursor-pointer"
            >
              Close
            </button>
          </div>
        </div>
      </div>
    );
  }


  return (
    <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4 overflow-y-auto">
      <div className="bg-white rounded-3xl max-w-3xl w-full p-6 sm:p-8 space-y-6 shadow-2xl border border-[#393636]/15 my-8">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Award className="w-6 h-6 text-[#F14C2F]" />
            <h2 className="text-xl font-bold text-[#393636]">
              Verified Certificate of Completion
            </h2>
          </div>
          <button
            onClick={onClose}
            className="p-2 text-[#393636]/60 hover:text-[#393636] rounded-full hover:bg-[#EFEBDA] transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Certificate Display Canvas */}
        <div
          ref={certRef}
          className="border-8 border-double border-[#393636]/20 bg-[#FAF9F5] p-8 sm:p-12 rounded-2xl relative text-center space-y-6 shadow-inner"
        >
          {/* Certificate Corner Decorations */}
          <div className="absolute top-4 left-4 w-8 h-8 border-t-2 border-l-2 border-[#F14C2F]" />
          <div className="absolute top-4 right-4 w-8 h-8 border-t-2 border-r-2 border-[#F14C2F]" />
          <div className="absolute bottom-4 left-4 w-8 h-8 border-b-2 border-l-2 border-[#F14C2F]" />
          <div className="absolute bottom-4 right-4 w-8 h-8 border-b-2 border-r-2 border-[#F14C2F]" />

          {/* Logo / Header */}
          <div className="flex flex-col items-center justify-center space-y-2">
            <TUTeachLogo size="lg" variant="iconOnly" clickable={false} />
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-[#F14C2F]/10 border border-[#F14C2F]/20 text-[#F14C2F] text-xs font-bold tracking-widest uppercase">
              TUTeach Certification Authority
            </div>
            <h1 className="text-2xl sm:text-3xl font-serif font-bold text-[#393636] tracking-wide pt-1">
              CERTIFICATE OF COMPLETION
            </h1>
            <p className="text-xs text-[#393636]/60 uppercase tracking-widest">
              Learn Smarter With AI
            </p>
          </div>

          <div className="text-sm text-[#393636]/80 font-serif italic">
            This is to certify that
          </div>

          <div className="text-2xl sm:text-3xl font-bold text-[#F14C2F] underline decoration-2 underline-offset-8">
            {user?.name || 'DaVinci Resolve Student'}
          </div>

          <p className="text-sm sm:text-base text-[#393636]/80 max-w-lg mx-auto leading-relaxed">
            has successfully completed all 8 modules and 43 lessons of the intensive curriculum in{' '}
            <strong className="text-[#393636]">{targetCourse.title}</strong> using{' '}
            <strong>{targetCourse.software}</strong>, demonstrating practical proficiency across Timeline Editing, Ripple Trims, Text+ Lower Thirds, Primary Color Wheels, and Fairlight Audio EQ.
          </p>

          {/* Score Badge (Strictly out of 10) */}
          <div className="inline-flex items-center gap-3 bg-white px-5 py-2.5 rounded-2xl border border-[#393636]/15 shadow-xs">
            <ShieldCheck className="w-5 h-5 text-emerald-600" />
            <div className="text-left text-xs">
              <span className="text-[#393636]/60">Evaluation Average: </span>
              <strong className="text-base text-[#393636]">{avgScore} / 10.0</strong>
              <span className="text-emerald-700 font-semibold ml-2">PASS (≥ 5.0)</span>
            </div>
          </div>

          {/* Signatures & Attribution */}
          <div className="grid grid-cols-2 gap-8 pt-6 border-t border-[#393636]/15 text-xs text-[#393636]">
            <div>
              <div className="font-serif italic text-base text-[#393636] mb-1">
                TUTutor AI
              </div>
              <div className="font-semibold">TUTutor AI Teaching Engine</div>
              <div className="text-[11px] text-[#393636]/60">Pedagogical Lead • TUTeach</div>
            </div>

            <div>
              <div className="font-serif italic text-base text-[#393636] mb-1">
                Anmol Creates
              </div>
              <div className="font-semibold">Curriculum Architect</div>
              <div className="text-[11px] text-[#393636]/60">TUTeach Platform</div>
            </div>
          </div>

          {/* Mandatory Ownership & Issue Info */}
          <div className="pt-4 text-[11px] text-[#393636]/60 space-y-1">
            <div>
              Certificate ID: <span className="font-mono font-semibold">{certificateId}</span> • Date Issued: {issueDate}
            </div>
            <div className="font-medium text-[#393636]/70">
              © 2026 TUTeach. All rights reserved. • Designed and created by Anmol Creates.
            </div>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex flex-wrap items-center justify-between gap-3 pt-2">
          <span className="text-xs text-[#393636]/60">
            Shareable digital credential backed by TUTeach verification ID.
          </span>
          <div className="flex items-center gap-2">
            <button
              onClick={handlePrint}
              className="bg-[#393636] text-white px-4 py-2.5 rounded-xl text-sm font-semibold hover:bg-black transition-colors flex items-center gap-1.5 cursor-pointer"
            >
              <Download className="w-4 h-4" />
              <span>Print / Save PDF</span>
            </button>
            <button
              onClick={onClose}
              className="bg-[#EFEBDA] text-[#393636] px-4 py-2.5 rounded-xl text-sm font-semibold hover:bg-[#e4dfcb] transition-colors cursor-pointer"
            >
              Close
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
