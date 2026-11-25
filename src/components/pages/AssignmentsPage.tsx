import React, { useState, useRef } from 'react';
import { useApp } from '../../context/AppContext';
import { COURSES_DATA } from '../../data/coursesData';
import { PracticalAssignment, AssignmentEvaluation } from '../../types';
import confetti from 'canvas-confetti';
import {
  FileCheck,
  CheckCircle2,
  AlertCircle,
  RotateCcw,
  Sparkles,
  ArrowRight,
  Camera,
  Image as ImageIcon,
  Upload,
  X,
  Search,
  Filter,
  Layers,
  BookOpen,
  MessageSquare,
  HelpCircle,
  Clock,
  Play
} from 'lucide-react';

export const AssignmentsPage: React.FC = () => {
  const {
    assignmentEvaluations,
    saveEvaluation,
    navigate,
    completedLessonIds,
    hasPaidForCourse
  } = useApp();

  const [selectedFilter, setSelectedFilter] = useState<'all' | 'pending' | 'passed' | 'revision'>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [activeAssignmentId, setActiveAssignmentId] = useState<string | null>(null);

  // Active assignment modal state
  const [submissionText, setSubmissionText] = useState('');
  const [screenshotBase64, setScreenshotBase64] = useState<string | null>(null);
  const [screenshotMime, setScreenshotMime] = useState<string>('image/png');
  const [evaluating, setEvaluating] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Compile all assignments from COURSES_DATA
  const allAssignmentsList = COURSES_DATA.flatMap((course) => {
    return course.modules.flatMap((module) => {
      return module.lessons
        .filter((lesson): lesson is typeof lesson & { practicalAssignment: PracticalAssignment } => Boolean(lesson.practicalAssignment))
        .map((lesson) => {
          return {
            courseId: course.id,
            courseTitle: course.title,
            moduleId: module.id,
            moduleTitle: module.title,
            lessonId: lesson.id,
            lessonTitle: lesson.title,
            assignment: lesson.practicalAssignment,
            isLessonCompleted: completedLessonIds.includes(lesson.id),
            evaluation: assignmentEvaluations[lesson.practicalAssignment.id]
          };
        });
    });
  });

  // Filtered assignments
  const filteredAssignments = allAssignmentsList.filter((item) => {
    const evalData = item.evaluation;
    const score = evalData?.score;
    const isCompleted = !!evalData;
    const isPassed = isCompleted && score !== undefined && score >= 5;
    const isNeedsRevision = isCompleted && score !== undefined && score < 5;
    const isPending = !isCompleted;

    if (selectedFilter === 'pending' && !isPending) return false;
    if (selectedFilter === 'passed' && !isPassed) return false;
    if (selectedFilter === 'revision' && !isNeedsRevision) return false;

    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      const matchTitle = item.assignment.title.toLowerCase().includes(q);
      const matchPrompt = item.assignment.prompt.toLowerCase().includes(q);
      const matchLesson = item.lessonTitle.toLowerCase().includes(q);
      const matchCourse = item.courseTitle.toLowerCase().includes(q);
      return matchTitle || matchPrompt || matchLesson || matchCourse;
    }

    return true;
  });

  // Open modal for a specific assignment
  const handleOpenSubmissionModal = (assignmentId: string) => {
    const item = allAssignmentsList.find((a) => a.assignment.id === assignmentId);
    if (!item) return;

    setActiveAssignmentId(assignmentId);
    const existingEval = assignmentEvaluations[assignmentId];
    if (existingEval) {
      setSubmissionText(existingEval.studentSubmission);
    } else {
      setSubmissionText(item.assignment.starterWorkflow);
    }
    setScreenshotBase64(null);
    setErrorMsg(null);
  };

  const handleCloseModal = () => {
    setActiveAssignmentId(null);
    setScreenshotBase64(null);
    setErrorMsg(null);
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith('image/')) {
      setErrorMsg('Please select a valid image file (PNG, JPG, WebP).');
      return;
    }

    if (file.size > 8 * 1024 * 1024) {
      setErrorMsg('Image size must be under 8MB.');
      return;
    }

    const reader = new FileReader();
    reader.onload = () => {
      const res = reader.result as string;
      const [header, base64] = res.split(',');
      const mime = header.split(';')[0].replace('data:', '');
      setScreenshotBase64(base64);
      setScreenshotMime(mime || 'image/png');
      setErrorMsg(null);
    };
    reader.readAsDataURL(file);
  };

  const handleEvaluate = async () => {
    if (!activeAssignmentId) return;
    const item = allAssignmentsList.find((a) => a.assignment.id === activeAssignmentId);
    if (!item) return;

    if (!submissionText.trim()) {
      setErrorMsg('Please enter your response or methodology explanation.');
      return;
    }

    setEvaluating(true);
    setErrorMsg(null);

    const existingEval = assignmentEvaluations[activeAssignmentId];
    const attemptNumber = existingEval ? 2 : 1;

    try {
      const response = await fetch('/api/tutor/evaluate-assignment', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          courseTitle: item.courseTitle,
          lessonTitle: item.lessonTitle,
          assignmentPrompt: item.assignment.prompt,
          assignmentRequirements: item.assignment.requirements,
          studentSubmission: submissionText,
          submissionType: item.assignment.submissionType,
          studentScreenshotBase64: screenshotBase64 || undefined,
          screenshotMimeType: screenshotBase64 ? screenshotMime : undefined
        })
      });

      const data = await response.json();
      if (!response.ok) {
        throw new Error(data.error || 'Failed to evaluate assignment');
      }

      const evalResult = data.evaluation;
      const rawScore = Number((evalResult.score ?? 7.5).toFixed(1));
      const bestScore = existingEval ? Math.max(existingEval.score, rawScore) : rawScore;

      const newEval: AssignmentEvaluation = {
        id: `eval_${activeAssignmentId}_${Date.now()}`,
        courseId: item.courseId,
        lessonId: item.lessonId,
        assignmentId: activeAssignmentId,
        studentSubmission: submissionText,
        score: rawScore,
        bestScore: bestScore,
        attemptNumber: attemptNumber,
        status: bestScore >= 5 ? 'PASSED' : 'NEEDS_REVISION',
        grade: bestScore >= 8.5 ? 'Distinction' : bestScore >= 7.0 ? 'Merit' : bestScore >= 5.0 ? 'Pass' : 'Needs Revision',
        summary: evalResult.summary || 'AI Rubric evaluation completed.',
        criteriaScores: (evalResult.criteriaScores || [
          { criterion: 'Workflow Understanding', score: rawScore, maxScore: 10, feedback: 'Accurate technique applied.' }
        ]).map((c: any) => ({
          criterion: c.criterion || c.name || 'Criterion',
          score: c.score ?? rawScore,
          maxScore: c.maxScore || 10,
          feedback: c.feedback || 'Good work.'
        })),
        strengths: evalResult.strengths || ['Good adherence to the requested NLE workflow.'],
        areasForImprovement: evalResult.improvements || evalResult.areasForImprovement || ['Maintain consistent ripple edit habits.'],
        improvements: evalResult.improvements || ['Maintain consistent ripple edit habits.'],
        targetedRevisionTopics: evalResult.targetedRevisionTopics || ['DaVinci Resolve Editing Shortcuts'],
        actionableShortcutSuggestion: evalResult.specificAdvice || 'Keep practicing the timeline shortcut keys in DaVinci Resolve.',
        specificAdvice: evalResult.specificAdvice || 'Keep practicing the timeline shortcut keys in DaVinci Resolve.',
        evaluatedAt: new Date().toISOString(),
        source: 'gemini-3.8-flash',
        canRetry: attemptNumber < 2,
        attemptCount: attemptNumber
      };

      saveEvaluation(newEval);

      if (bestScore >= 7.0) {
        try {
          confetti({
            particleCount: 70,
            spread: 60,
            origin: { y: 0.6 }
          });
        } catch {}
      }
    } catch (err: any) {
      console.error('Assignment submission error:', err);
      setErrorMsg(err.message || 'Error communicating with AI evaluation service.');
    } finally {
      setEvaluating(false);
    }
  };

  const activeItem = activeAssignmentId
    ? allAssignmentsList.find((a) => a.assignment.id === activeAssignmentId)
    : null;
  const activeEval = activeAssignmentId ? assignmentEvaluations[activeAssignmentId] : null;

  return (
    <div className="min-h-screen bg-[#EFEBDA] py-10 px-4 sm:px-6 lg:px-8">
      <div className="max-w-6xl mx-auto space-y-8">
        {/* Header */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-[#393636]/15 pb-6">
          <div>
            <div className="flex items-center gap-2 text-xs font-bold text-[#F14C2F] uppercase tracking-wider mb-1">
              <FileCheck className="w-4 h-4" />
              Smart Evaluation Engine
            </div>
            <h1 className="text-3xl font-extrabold text-[#393636] tracking-tight">
              Practical Assignments Lab
            </h1>
            <p className="text-sm text-[#393636]/75 mt-1">
              Test your real-world DaVinci Resolve editing skills. Submit workflows, attach timeline screenshots, and get instant rubric feedback out of 10.
            </p>
          </div>

          <button
            onClick={() => navigate('classroom')}
            className="px-4 py-2.5 bg-[#393636] hover:bg-black text-white font-bold rounded-xl text-xs flex items-center gap-2 transition-all self-start md:self-auto"
          >
            <Play className="w-3.5 h-3.5 fill-current text-[#F14C2F]" />
            Go to AI Voice Classroom
          </button>
        </div>

        {/* Filter & Search Bar */}
        <div className="bg-white p-4 rounded-2xl border border-[#393636]/15 shadow-2xs flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-2 overflow-x-auto w-full sm:w-auto">
            <button
              onClick={() => setSelectedFilter('all')}
              className={`px-3 py-1.5 text-xs font-bold rounded-lg transition-colors ${
                selectedFilter === 'all'
                  ? 'bg-[#393636] text-white'
                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
              }`}
            >
              All ({allAssignmentsList.length})
            </button>
            <button
              onClick={() => setSelectedFilter('pending')}
              className={`px-3 py-1.5 text-xs font-bold rounded-lg transition-colors ${
                selectedFilter === 'pending'
                  ? 'bg-[#393636] text-white'
                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
              }`}
            >
              Pending ({allAssignmentsList.filter((a) => !a.evaluation).length})
            </button>
            <button
              onClick={() => setSelectedFilter('passed')}
              className={`px-3 py-1.5 text-xs font-bold rounded-lg transition-colors ${
                selectedFilter === 'passed'
                  ? 'bg-emerald-700 text-white'
                  : 'bg-emerald-50 text-emerald-800 hover:bg-emerald-100'
              }`}
            >
              Passed ({allAssignmentsList.filter((a) => a.evaluation && a.evaluation.score >= 5).length})
            </button>
            <button
              onClick={() => setSelectedFilter('revision')}
              className={`px-3 py-1.5 text-xs font-bold rounded-lg transition-colors ${
                selectedFilter === 'revision'
                  ? 'bg-amber-600 text-white'
                  : 'bg-amber-50 text-amber-800 hover:bg-amber-100'
              }`}
            >
              Needs Revision ({allAssignmentsList.filter((a) => a.evaluation && a.evaluation.score < 5).length})
            </button>
          </div>

          <div className="relative w-full sm:w-72">
            <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
            <input
              type="text"
              placeholder="Search assignments or topics..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-9 pr-3 py-1.5 text-xs bg-gray-50 border border-gray-200 rounded-lg text-[#393636] focus:outline-none focus:border-[#F14C2F]"
            />
          </div>
        </div>

        {/* Assignments Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {filteredAssignments.map((item) => {
            const evalData = item.evaluation;
            const isCompleted = !!evalData;
            const score = evalData?.score;
            const isPassed = isCompleted && score !== undefined && score >= 5;
            const isNeedsRevision = isCompleted && score !== undefined && score < 5;

            return (
              <div
                key={item.assignment.id}
                className="bg-white rounded-2xl border border-[#393636]/15 p-5 shadow-2xs hover:border-[#F14C2F]/50 transition-all flex flex-col justify-between"
              >
                <div>
                  <div className="flex items-center justify-between gap-2 mb-2">
                    <span className="text-[11px] font-mono font-semibold px-2 py-0.5 bg-gray-100 text-gray-700 rounded">
                      {item.moduleTitle.split(':')[0]}
                    </span>

                    {/* Status Pill */}
                    {isPassed ? (
                      <span className="text-[11px] font-bold px-2 py-0.5 bg-emerald-100 text-emerald-800 rounded-md flex items-center gap-1">
                        <CheckCircle2 className="w-3 h-3" />
                        Score {score}/10 (Passed)
                      </span>
                    ) : isNeedsRevision ? (
                      <span className="text-[11px] font-bold px-2 py-0.5 bg-amber-100 text-amber-800 rounded-md flex items-center gap-1">
                        <AlertCircle className="w-3 h-3" />
                        Score {score}/10 (Needs Revision)
                      </span>
                    ) : (
                      <span className="text-[11px] font-semibold px-2 py-0.5 bg-gray-100 text-gray-600 rounded-md">
                        Not Submitted
                      </span>
                    )}
                  </div>

                  <h3 className="font-bold text-base text-[#393636] mb-1">
                    {item.assignment.title}
                  </h3>
                  <p className="text-xs text-gray-500 mb-2">
                    Lesson: {item.lessonTitle}
                  </p>
                  <p className="text-xs text-[#393636]/80 line-clamp-2 leading-relaxed">
                    {item.assignment.prompt}
                  </p>
                </div>

                <div className="pt-4 border-t border-gray-100 mt-4 flex items-center justify-between">
                  <div className="text-[11px] text-gray-500 flex items-center gap-1">
                    <Clock className="w-3.5 h-3.5" />
                    {item.assignment.estimatedMinutes || 15} mins
                  </div>

                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => navigate('classroom', item.courseId, item.lessonId)}
                      className="px-3 py-1.5 text-xs font-semibold text-gray-600 hover:text-[#393636] bg-gray-50 hover:bg-gray-100 rounded-lg transition-colors"
                      title="Open lesson with AI Teacher"
                    >
                      Lesson
                    </button>
                    <button
                      onClick={() => handleOpenSubmissionModal(item.assignment.id)}
                      className="px-3.5 py-1.5 text-xs font-bold bg-[#F14C2F] hover:bg-[#d63b20] text-white rounded-lg transition-all shadow-2xs flex items-center gap-1"
                    >
                      {isCompleted ? (isNeedsRevision ? 'Retry Assignment' : 'View Feedback') : 'Start Assignment'}
                      <ArrowRight className="w-3 h-3" />
                    </button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>

        {/* Assignment Submission & Evaluation Modal */}
        {activeItem && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs overflow-y-auto">
            <div className="bg-white rounded-3xl max-w-2xl w-full border border-[#393636]/20 shadow-2xl p-6 sm:p-8 space-y-6 my-8">
              {/* Modal Header */}
              <div className="flex items-start justify-between gap-4 border-b border-gray-100 pb-4">
                <div>
                  <div className="flex items-center gap-2 text-xs font-bold text-[#F14C2F]">
                    <span>{activeItem.courseTitle}</span>
                    <span>•</span>
                    <span>{activeItem.lessonTitle}</span>
                  </div>
                  <h2 className="text-xl font-bold text-[#393636] mt-1">
                    {activeItem.assignment.title}
                  </h2>
                </div>
                <button
                  onClick={handleCloseModal}
                  className="p-1.5 rounded-lg text-gray-400 hover:text-gray-700 hover:bg-gray-100"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              {/* Prompt & Requirements */}
              <div className="bg-[#EFEBDA]/50 p-4 rounded-xl border border-[#393636]/10 space-y-2">
                <p className="text-xs font-bold text-[#393636] uppercase tracking-wider">
                  Assignment Task
                </p>
                <p className="text-xs text-[#393636] leading-relaxed">
                  {activeItem.assignment.prompt}
                </p>
                <div className="pt-2 border-t border-[#393636]/10">
                  <p className="text-[11px] font-bold text-[#393636] mb-1">Rubric Requirements:</p>
                  <ul className="text-[11px] text-[#393636]/80 list-disc list-inside space-y-0.5">
                    {activeItem.assignment.requirements.map((req, idx) => (
                      <li key={idx}>{req}</li>
                    ))}
                  </ul>
                </div>
              </div>

              {/* Feedback View if Already Evaluated */}
              {activeEval && (
                <div className={`p-4 rounded-xl border ${activeEval.score >= 5 ? 'bg-emerald-50/60 border-emerald-200' : 'bg-amber-50/60 border-amber-200'} space-y-3`}>
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold uppercase tracking-wider text-gray-700">
                      AI Rubric Evaluation Result
                    </span>
                    <span className={`text-sm font-black px-2.5 py-0.5 rounded-lg ${activeEval.score >= 5 ? 'bg-emerald-600 text-white' : 'bg-amber-600 text-white'}`}>
                      {activeEval.score}/10 {activeEval.score >= 5 ? 'PASSED' : 'REVISION RECOMMENDED'}
                    </span>
                  </div>

                  {activeEval.strengths && activeEval.strengths.length > 0 && (
                    <div>
                      <p className="text-[11px] font-bold text-emerald-800">Strengths:</p>
                      <ul className="text-[11px] text-gray-700 list-disc list-inside">
                        {activeEval.strengths.map((s, idx) => (
                          <li key={idx}>{s}</li>
                        ))}
                      </ul>
                    </div>
                  )}

                  {(activeEval.areasForImprovement || activeEval.improvements) && (activeEval.areasForImprovement || activeEval.improvements)!.length > 0 && (
                    <div>
                      <p className="text-[11px] font-bold text-amber-800">Areas for Improvement:</p>
                      <ul className="text-[11px] text-gray-700 list-disc list-inside">
                        {(activeEval.areasForImprovement || activeEval.improvements)!.map((imp: string, idx: number) => (
                          <li key={idx}>{imp}</li>
                        ))}
                      </ul>
                    </div>
                  )}

                  {(activeEval.actionableShortcutSuggestion || activeEval.specificAdvice) && (
                    <div className="text-[11px] text-gray-600 bg-white/70 p-2.5 rounded-lg border border-gray-200/50">
                      <span className="font-bold text-[#393636]">Mentor Advice: </span>
                      {activeEval.actionableShortcutSuggestion || activeEval.specificAdvice}
                    </div>
                  )}
                </div>
              )}

              {/* Input Area */}
              <div className="space-y-4">
                <div>
                  <label className="block text-xs font-bold text-[#393636] mb-1">
                    Your Practical Submission / Workflow Explanation:
                  </label>
                  <textarea
                    rows={4}
                    value={submissionText}
                    onChange={(e) => setSubmissionText(e.target.value)}
                    placeholder="Describe the steps, tool shortcuts, and timeline actions you took in DaVinci Resolve..."
                    className="w-full text-xs p-3 border border-gray-200 rounded-xl text-[#393636] focus:outline-none focus:border-[#F14C2F] font-mono leading-relaxed"
                  />
                </div>

                {/* Optional Screenshot Attachment */}
                <div>
                  <div className="flex items-center justify-between mb-1.5">
                    <label className="text-xs font-bold text-[#393636] flex items-center gap-1.5">
                      <Camera className="w-4 h-4 text-[#F14C2F]" />
                      Attach DaVinci Resolve Screenshot (Optional visual proof):
                    </label>
                    {screenshotBase64 && (
                      <button
                        onClick={() => setScreenshotBase64(null)}
                        className="text-[11px] text-red-600 hover:underline"
                      >
                        Remove image
                      </button>
                    )}
                  </div>

                  {screenshotBase64 ? (
                    <div className="relative rounded-xl overflow-hidden border border-gray-300 max-h-48 bg-black/5 flex items-center justify-center">
                      <img
                        src={`data:${screenshotMime};base64,${screenshotBase64}`}
                        alt="Submitted screenshot"
                        className="max-h-48 object-contain"
                      />
                    </div>
                  ) : (
                    <div
                      onClick={() => fileInputRef.current?.click()}
                      className="border-2 border-dashed border-gray-300 hover:border-[#F14C2F] rounded-xl p-4 text-center cursor-pointer transition-colors bg-gray-50/50"
                    >
                      <Upload className="w-5 h-5 text-gray-400 mx-auto mb-1" />
                      <p className="text-xs text-gray-600 font-medium">
                        Click to upload screenshot from your timeline (PNG, JPG)
                      </p>
                      <p className="text-[10px] text-gray-400 mt-0.5">
                        Max 8MB. Pro-tip: Press PrintScreen or Win+Shift+S in Resolve!
                      </p>
                      <input
                        ref={fileInputRef}
                        type="file"
                        accept="image/png,image/jpeg,image/webp"
                        className="hidden"
                        onChange={handleFileUpload}
                      />
                    </div>
                  )}
                </div>

                {errorMsg && (
                  <div className="p-3 bg-red-50 text-red-700 text-xs rounded-xl flex items-center gap-2 border border-red-200">
                    <AlertCircle className="w-4 h-4 flex-shrink-0" />
                    <span>{errorMsg}</span>
                  </div>
                )}
              </div>

              {/* Action Buttons */}
              <div className="flex items-center justify-between pt-4 border-t border-gray-100">
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => {
                      handleCloseModal();
                      navigate('classroom', activeItem.courseId, activeItem.lessonId);
                    }}
                    className="px-3.5 py-2 text-xs font-semibold text-gray-700 hover:bg-gray-100 rounded-xl flex items-center gap-1.5 transition-colors"
                  >
                    <MessageSquare className="w-3.5 h-3.5 text-[#F14C2F]" />
                    Ask AI Teacher
                  </button>
                </div>

                <div className="flex items-center gap-3">
                  <button
                    onClick={handleCloseModal}
                    className="px-4 py-2 text-xs font-semibold text-gray-600 hover:text-gray-900"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={handleEvaluate}
                    disabled={evaluating || !submissionText.trim()}
                    className="px-5 py-2.5 bg-[#F14C2F] hover:bg-[#d63b20] disabled:bg-gray-300 text-white font-bold rounded-xl text-xs transition-all shadow-sm flex items-center gap-1.5 cursor-pointer"
                  >
                    {evaluating ? (
                      <>
                        <Sparkles className="w-3.5 h-3.5 animate-spin" />
                        AI Evaluating Rubric...
                      </>
                    ) : (
                      <>
                        <FileCheck className="w-3.5 h-3.5" />
                        {activeEval ? 'Resubmit & Evaluate' : 'Submit for AI Grading'}
                      </>
                    )}
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
