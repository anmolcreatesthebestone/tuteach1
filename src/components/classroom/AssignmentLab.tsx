import React, { useState, useEffect } from 'react';
import { useApp } from '../../context/AppContext';
import { Course, Lesson, PracticalAssignment, AssignmentEvaluation } from '../../types';
import confetti from 'canvas-confetti';
import {
  FileCheck,
  CheckCircle2,
  AlertCircle,
  RotateCcw,
  Sparkles,
  Award,
  ChevronRight,
  BrainCircuit,
  Check,
  Copy,
  HelpCircle,
  RefreshCw,
  Video,
  BookOpen,
  MessageSquare
} from 'lucide-react';

interface AssignmentLabProps {
  course: Course;
  lesson: Lesson;
  assignment: PracticalAssignment;
  onNavigateToRevision?: () => void;
  onRepeatLesson?: () => void;
  onClearDoubts?: () => void;
}

export const AssignmentLab: React.FC<AssignmentLabProps> = ({
  course,
  lesson,
  assignment,
  onNavigateToRevision,
  onRepeatLesson,
  onClearDoubts
}) => {

  const { assignmentEvaluations, saveEvaluation, navigate } = useApp();
  
  const existingEval = assignmentEvaluations[assignment.id];
  const [submissionWorkflow, setSubmissionWorkflow] = useState<string>(
    existingEval?.studentSubmission || assignment.starterWorkflow
  );
  const [evaluating, setEvaluating] = useState(false);
  const [currentEvaluation, setCurrentEvaluation] = useState<AssignmentEvaluation | null>(
    existingEval || null
  );
  const [showHint, setShowHint] = useState(false);
  const [copiedText, setCopiedText] = useState(false);
  const [confirmReset, setConfirmReset] = useState(false);

  useEffect(() => {
    if (existingEval) {
      setSubmissionWorkflow(existingEval.studentSubmission);
      setCurrentEvaluation(existingEval);
    } else {
      setSubmissionWorkflow(assignment.starterWorkflow);
      setCurrentEvaluation(null);
    }
    setConfirmReset(false);
  }, [assignment.id, existingEval]);

  const handleCopy = () => {
    navigator.clipboard.writeText(submissionWorkflow);
    setCopiedText(true);
    setTimeout(() => setCopiedText(false), 2000);
  };

  const handleResetStarter = () => {
    setSubmissionWorkflow(assignment.starterWorkflow);
    setConfirmReset(false);
  };

  const handleSubmitEvaluation = async () => {
    if (!submissionWorkflow.trim() || evaluating) return;

    setEvaluating(true);

    try {
      const token = typeof window !== 'undefined' ? localStorage.getItem('tuteach_auth_token') : null;
      const response = await fetch('/api/tutor/evaluate-assignment', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...(token ? { Authorization: `Bearer ${token}` } : {})
        },
        body: JSON.stringify({
          courseTitle: course.title,
          lessonTitle: lesson.title,
          assignmentPrompt: assignment.prompt,
          assignmentRequirements: assignment.requirements,
          studentSubmission: submissionWorkflow,
          submissionType: assignment.submissionType
        })
      });

      const data = await response.json();
      if (!response.ok || !data.evaluation) {
        throw new Error(data.message || 'Evaluation unavailable');
      }
      const evalResult = data.evaluation;

      // Handle attempt counting and best of 2 attempts
      const attemptNumber = existingEval ? 2 : 1;
      const rawScore = Number((evalResult.score ?? 7.5).toFixed(1));
      const bestScore = existingEval ? Math.max(existingEval.bestScore, rawScore) : rawScore;
      const status = bestScore >= 5.0 ? 'PASSED' : 'NEEDS_REVISION';

      const evaluationRecord: AssignmentEvaluation = {
        id: `eval-${Date.now()}`,
        courseId: course.id,
        lessonId: lesson.id,
        assignmentId: assignment.id,
        studentSubmission: submissionWorkflow,
        attemptNumber,
        score: rawScore,
        bestScore,
        status,
        grade: evalResult.grade || (bestScore >= 8.5 ? 'Distinction' : bestScore >= 5.0 ? 'Pass' : 'Needs Revision'),
        summary: evalResult.summary || 'Task evaluation complete.',
        criteriaScores: evalResult.criteriaScores || [],
        strengths: evalResult.strengths || [],
        areasForImprovement: evalResult.areasForImprovement || [],
        targetedRevisionTopics: evalResult.targetedRevisionTopics || [],
        actionableShortcutSuggestion: evalResult.actionableShortcutSuggestion,
        evaluatedAt: new Date().toISOString(),
        source: data.source || 'gemini-3.8-flash',
        canRetry: attemptNumber === 1
      };

      setCurrentEvaluation(evaluationRecord);
      saveEvaluation(evaluationRecord);

      // Trigger celebratory confetti if passed!
      if (status === 'PASSED') {
        confetti({
          particleCount: 80,
          spread: 60,
          origin: { y: 0.7 }
        });
      }
    } catch (err) {
      console.error('Assignment evaluation failed:', err);
    } finally {
      setEvaluating(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Assignment Header Card */}
      <div className="bg-white rounded-2xl p-6 border border-[#393636]/10 shadow-sm">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-4 border-b border-gray-100">
          <div>
            <div className="flex items-center gap-2">
              <span className="text-[11px] font-bold uppercase tracking-wider text-[#F14C2F] bg-[#F14C2F]/10 px-2 py-0.5 rounded">
                DaVinci Resolve Practical Task
              </span>
              <span className="text-[11px] font-semibold text-gray-500">
                Scored out of 10 • Pass threshold: 5.0/10
              </span>
            </div>
            <h2 className="text-xl font-bold text-[#393636] mt-1">{assignment.title}</h2>
          </div>

          <div className="flex items-center gap-2">
            {currentEvaluation && (
              <span
                className={`px-3 py-1.5 rounded-full text-xs font-bold flex items-center gap-1.5 ${
                  currentEvaluation.status === 'PASSED'
                    ? 'bg-emerald-100 text-emerald-800 border border-emerald-300'
                    : 'bg-amber-100 text-amber-900 border border-amber-300'
                }`}
              >
                {currentEvaluation.status === 'PASSED' ? (
                  <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                ) : (
                  <AlertCircle className="w-4 h-4 text-amber-600" />
                )}
                <span>Score: {currentEvaluation.bestScore}/10 ({currentEvaluation.grade})</span>
                <span className="text-[10px] font-normal text-gray-600">
                  (Attempt {currentEvaluation.attemptNumber}/2)
                </span>
              </span>
            )}
          </div>
        </div>

        {/* Prompt */}
        <div className="py-4 text-sm text-[#393636] leading-relaxed">
          <p className="font-semibold text-gray-900 mb-2">Practical Instruction:</p>
          <div className="p-4 bg-[#EFEBDA]/50 rounded-xl border border-[#393636]/15 font-mono text-xs sm:text-sm">
            {assignment.prompt}
          </div>
        </div>

        {/* Requirements Checklist */}
        <div className="pt-2">
          <p className="text-xs font-bold uppercase tracking-wider text-gray-500 mb-2">
            Task Rubric Requirements (Scored out of 10):
          </p>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs">
            {assignment.requirements.map((req, idx) => (
              <div key={idx} className="flex items-start gap-2 p-2 bg-gray-50 rounded-lg border border-gray-100">
                <Check className="w-4 h-4 text-[#F14C2F] flex-shrink-0 mt-0.5" />
                <span className="text-gray-700">{req}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Hint toggle */}
        {assignment.sampleSolutionHint && (
          <div className="pt-4 flex items-center justify-between text-xs">
            <button
              onClick={() => setShowHint(!showHint)}
              className="text-[#F14C2F] font-semibold hover:underline flex items-center gap-1 cursor-pointer"
            >
              <Sparkles className="w-3.5 h-3.5" />
              {showHint ? 'Hide Instructor Hint' : 'Need a workflow hint?'}
            </button>
            {showHint && (
              <span className="text-gray-700 italic bg-amber-50 p-2.5 rounded-lg border border-amber-200 text-xs">
                {assignment.sampleSolutionHint}
              </span>
            )}
          </div>
        )}
      </div>

      {/* Workflow Response Workbench */}
      <div className="bg-[#393636] rounded-2xl overflow-hidden shadow-md border border-black/20">
        <div className="px-4 py-3 bg-[#2c2929] flex items-center justify-between text-xs text-gray-300 border-b border-white/10">
          <div className="flex items-center gap-2">
            <div className="flex gap-1.5">
              <div className="w-3 h-3 rounded-full bg-red-500/80" />
              <div className="w-3 h-3 rounded-full bg-amber-500/80" />
              <div className="w-3 h-3 rounded-full bg-emerald-500/80" />
            </div>
            <span className="font-mono text-gray-300 pl-2">davinci_resolve_task_submission.txt</span>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={handleCopy}
              className="px-2.5 py-1 bg-white/10 hover:bg-white/20 text-white rounded flex items-center gap-1 text-[11px] transition-colors cursor-pointer"
            >
              {copiedText ? <Check className="w-3 h-3 text-emerald-400" /> : <Copy className="w-3 h-3" />}
              {copiedText ? 'Copied' : 'Copy'}
            </button>
            {confirmReset ? (
              <div className="flex items-center gap-1.5">
                <button
                  onClick={handleResetStarter}
                  className="px-2.5 py-1 bg-[#F14C2F] hover:bg-[#d63b20] text-white rounded text-[11px] font-bold transition-colors cursor-pointer"
                >
                  Confirm Reset
                </button>
                <button
                  onClick={() => setConfirmReset(false)}
                  className="px-2 py-1 bg-white/10 hover:bg-white/20 text-white rounded text-[11px] transition-colors cursor-pointer"
                >
                  Cancel
                </button>
              </div>
            ) : (
              <button
                onClick={() => setConfirmReset(true)}
                className="px-2.5 py-1 bg-white/10 hover:bg-white/20 text-white rounded flex items-center gap-1 text-[11px] transition-colors cursor-pointer"
              >
                <RotateCcw className="w-3 h-3" /> Reset
              </button>
            )}
          </div>
        </div>

        {/* Textarea container */}
        <div className="p-4 bg-[#393636]">
          <textarea
            value={submissionWorkflow}
            onChange={(e) => setSubmissionWorkflow(e.target.value)}
            rows={10}
            className="w-full font-mono text-xs sm:text-sm bg-transparent text-[#EFEBDA] focus:outline-none resize-y selection:bg-[#F14C2F]"
            placeholder="Write your DaVinci Resolve workflow execution, timecodes, or tool settings here..."
            spellCheck={false}
          />
        </div>

        {/* Bottom submit bar */}
        <div className="px-4 py-3 bg-[#2c2929] border-t border-white/10 flex flex-col sm:flex-row items-center justify-between gap-3">
          <div className="text-xs text-gray-400 flex items-center gap-1.5">
            <Sparkles className="w-3.5 h-3.5 text-[#F14C2F]" />
            <span>
              {currentEvaluation?.attemptNumber === 1 && currentEvaluation.canRetry
                ? 'Attempt 1 submitted. You have 1 retry available.'
                : currentEvaluation?.attemptNumber === 2
                ? 'Attempt 2 completed. Final score recorded.'
                : '1 retry allowed. Better of two attempts will be saved.'}
            </span>
          </div>

          <button
            onClick={handleSubmitEvaluation}
            disabled={evaluating || !submissionWorkflow.trim()}
            className="w-full sm:w-auto px-6 py-2.5 bg-[#F14C2F] hover:bg-[#d63b20] disabled:bg-gray-600 disabled:cursor-not-allowed text-white font-bold rounded-xl text-sm flex items-center justify-center gap-2 shadow-md transition-all cursor-pointer"
          >
            {evaluating ? (
              <>
                <Sparkles className="w-4 h-4 animate-spin" />
                Evaluating Out of 10...
              </>
            ) : currentEvaluation ? (
              <>
                <RefreshCw className="w-4 h-4" />
                {currentEvaluation.attemptNumber === 1 ? 'Submit Attempt 2 (Retry)' : 'Re-Evaluate Submission'}
              </>
            ) : (
              <>
                <FileCheck className="w-4 h-4" />
                Submit Task for AI Evaluation (Out of 10)
              </>
            )}
          </button>
        </div>
      </div>

      {/* Evidence-Based Evaluation Result Panel */}
      {currentEvaluation && (
        <div className="bg-white rounded-2xl p-6 border-2 border-[#393636]/15 shadow-lg space-y-6 animate-fadeIn">
          {/* Top Score Banner */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-gray-100">
            <div>
              <div className="flex items-center gap-2">
                <span
                  className={`px-3 py-1 rounded-full text-xs font-extrabold uppercase ${
                    currentEvaluation.status === 'PASSED'
                      ? 'bg-emerald-100 text-emerald-800'
                      : 'bg-amber-100 text-amber-800'
                  }`}
                >
                  {currentEvaluation.status === 'PASSED' ? 'Task Passed' : 'Score Below 5.0 — Review & Retry Required'}
                </span>
                <span className="text-xs font-semibold text-gray-500">
                  Grade: {currentEvaluation.grade}
                </span>
                <span className="text-xs text-gray-400">
                  Attempt {currentEvaluation.attemptNumber} of 2
                </span>
              </div>

              <h3 className="text-2xl font-black text-[#393636] mt-2">
                Score: <span className="text-[#F14C2F]">{currentEvaluation.score}</span>/10
                {currentEvaluation.attemptNumber === 2 && (
                  <span className="text-xs font-semibold text-gray-500 ml-2">
                    (Best of 2 attempts: {currentEvaluation.bestScore}/10)
                  </span>
                )}
              </h3>
              <p className="text-xs text-gray-600 mt-1">{currentEvaluation.summary}</p>
            </div>

            {/* Revision / Retry Action Buttons */}
            <div className="flex flex-wrap gap-2">
              {currentEvaluation.status === 'NEEDS_REVISION' && currentEvaluation.canRetry && (
                <button
                  onClick={() => {
                    window.scrollTo({ top: 300, behavior: 'smooth' });
                  }}
                  className="px-4 py-2 bg-[#F14C2F] hover:bg-[#d63b20] text-white text-xs font-bold rounded-xl shadow-xs transition-colors flex items-center gap-1.5 cursor-pointer"
                >
                  <RefreshCw className="w-3.5 h-3.5" /> Retry Task with Fixes
                </button>
              )}

              {onRepeatLesson && (
                <button
                  onClick={onRepeatLesson}
                  className="px-4 py-2 bg-gray-100 hover:bg-gray-200 text-gray-800 text-xs font-bold rounded-xl flex items-center gap-1.5 transition-colors cursor-pointer"
                  title="Review lesson notes before retrying"
                >
                  <BookOpen className="w-3.5 h-3.5 text-[#F14C2F]" />
                  <span>Repeat Class Lesson</span>
                </button>
              )}

              {onClearDoubts && (
                <button
                  onClick={onClearDoubts}
                  className="px-4 py-2 bg-gray-100 hover:bg-gray-200 text-gray-800 text-xs font-bold rounded-xl flex items-center gap-1.5 transition-colors cursor-pointer"
                  title="Ask your AI teacher to explain concepts and clear doubts"
                >
                  <MessageSquare className="w-3.5 h-3.5 text-blue-600" />
                  <span>Clear Doubts with AI Teacher</span>
                </button>
              )}

              {currentEvaluation.targetedRevisionTopics.length > 0 && (
                <button
                  onClick={() => {
                    if (onNavigateToRevision) onNavigateToRevision();
                    else navigate('revision');
                  }}
                  className="px-4 py-2 bg-[#393636] hover:bg-black text-white text-xs font-bold rounded-xl flex items-center gap-2 shadow-sm transition-all cursor-pointer"
                >
                  <BrainCircuit className="w-4 h-4 text-amber-400" />
                  Review {currentEvaluation.targetedRevisionTopics.length} Topics in Revision Deck
                </button>
              )}
            </div>

          </div>

          {/* Criteria Breakdown out of 2.5 each */}
          {currentEvaluation.criteriaScores.length > 0 && (
            <div className="space-y-3">
              <h4 className="text-xs font-bold uppercase tracking-wider text-gray-500">
                Rubric Criteria Breakdown (Total: 10 Points):
              </h4>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {currentEvaluation.criteriaScores.map((crit, idx) => (
                  <div key={idx} className="p-3 bg-gray-50 rounded-xl border border-gray-100 space-y-1.5">
                    <div className="flex justify-between text-xs font-bold text-[#393636]">
                      <span>{crit.criterion}</span>
                      <span className="text-[#F14C2F]">{crit.score}/{crit.maxScore}</span>
                    </div>
                    <div className="w-full bg-gray-200 h-2 rounded-full overflow-hidden">
                      <div
                        className="bg-[#F14C2F] h-full rounded-full transition-all duration-500"
                        style={{ width: `${(crit.score / crit.maxScore) * 100}%` }}
                      />
                    </div>
                    <p className="text-[11px] text-gray-600 pt-0.5">{crit.feedback}</p>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Strengths & Improvements */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 pt-2">
            <div className="space-y-2">
              <h4 className="text-xs font-bold uppercase tracking-wider text-emerald-700 flex items-center gap-1.5">
                <CheckCircle2 className="w-4 h-4 text-emerald-600" /> Demonstrated Strengths
              </h4>
              <ul className="space-y-2 text-xs text-gray-700">
                {currentEvaluation.strengths.map((str, idx) => (
                  <li key={idx} className="p-3 bg-emerald-50/70 border border-emerald-100 rounded-xl">
                    {str}
                  </li>
                ))}
              </ul>
            </div>

            <div className="space-y-2">
              <h4 className="text-xs font-bold uppercase tracking-wider text-amber-700 flex items-center gap-1.5">
                <AlertCircle className="w-4 h-4 text-amber-600" /> Areas for Improvement & Review
              </h4>
              <ul className="space-y-2 text-xs text-gray-700">
                {currentEvaluation.areasForImprovement.map((area, idx) => (
                  <li key={idx} className="p-3 bg-amber-50/70 border border-amber-100 rounded-xl">
                    {area}
                  </li>
                ))}
              </ul>
            </div>
          </div>

          {/* Actionable DaVinci Resolve Pro Tip */}
          {currentEvaluation.actionableShortcutSuggestion && (
            <div className="p-4 bg-gray-900 rounded-xl text-white space-y-1.5">
              <span className="text-xs font-bold text-amber-400 flex items-center gap-1">
                <Sparkles className="w-3.5 h-3.5" /> DaVinci Resolve Pro Editor Shortcut:
              </span>
              <p className="text-xs font-mono text-emerald-300">
                {currentEvaluation.actionableShortcutSuggestion}
              </p>
            </div>
          )}
        </div>
      )}
    </div>
  );
};
