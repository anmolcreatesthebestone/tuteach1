import React from 'react';
import { useApp } from '../../context/AppContext';
import { COURSES_DATA } from '../../data/coursesData';
import {
  TrendingUp,
  CheckCircle2,
  Clock,
  Award,
  Sparkles,
  BookOpen,
  ArrowRight,
  Flame,
  FileCheck,
  ChevronRight,
  Play
} from 'lucide-react';

export const LearningProgressPage: React.FC = () => {
  const {
    completedLessonIds,
    assignmentEvaluations,
    navigate,
    hasPaidForCourse
  } = useApp();

  const course = COURSES_DATA[0]; // DaVinci Resolve Masterclass
  const allLessons = course.modules.flatMap((m) => m.lessons);
  const completedCount = allLessons.filter((l) => completedLessonIds.includes(l.id)).length;
  const overallPct = allLessons.length > 0 ? Math.round((completedCount / allLessons.length) * 100) : 0;

  // Assignments stats
  const evaluatedKeys = Object.keys(assignmentEvaluations);
  const totalEvaluated = evaluatedKeys.length;
  const passedAssignments = evaluatedKeys.filter(
    (k) => assignmentEvaluations[k].score >= 5
  ).length;
  const avgScore =
    totalEvaluated > 0
      ? (
          evaluatedKeys.reduce((acc, k) => acc + assignmentEvaluations[k].score, 0) /
          totalEvaluated
        ).toFixed(1)
      : '0.0';

  return (
    <div className="min-h-screen bg-[#EFEBDA] py-10 px-4 sm:px-6 lg:px-8">
      <div className="max-w-5xl mx-auto space-y-8">
        {/* Header */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-[#393636]/15 pb-6">
          <div>
            <div className="flex items-center gap-2 text-xs font-bold text-[#F14C2F] uppercase tracking-wider mb-1">
              <TrendingUp className="w-4 h-4" />
              Real-time Analytics
            </div>
            <h1 className="text-3xl font-extrabold text-[#393636] tracking-tight">
              Learning Progress & Mastery
            </h1>
            <p className="text-sm text-[#393636]/75 mt-1">
              Track your module completion, practical assignment grades, and verifiable credential readiness.
            </p>
          </div>

          <button
            onClick={() => navigate('classroom')}
            className="px-5 py-2.5 bg-[#F14C2F] hover:bg-[#d63b20] text-white font-bold rounded-xl text-xs flex items-center gap-2 transition-all shadow-sm self-start md:self-auto"
          >
            <Play className="w-3.5 h-3.5 fill-current" />
            Continue In Classroom
          </button>
        </div>

        {/* High-level KPI cards */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <div className="bg-white p-5 rounded-2xl border border-[#393636]/10 shadow-2xs">
            <span className="text-xs font-semibold text-gray-500">Overall Course Progress</span>
            <div className="text-3xl font-black text-[#F14C2F] mt-2 font-mono">{overallPct}%</div>
            <p className="text-xs text-gray-500 mt-1">{completedCount} of {allLessons.length} lessons</p>
          </div>

          <div className="bg-white p-5 rounded-2xl border border-[#393636]/10 shadow-2xs">
            <span className="text-xs font-semibold text-gray-500">Practical Assignments</span>
            <div className="text-3xl font-black text-emerald-600 mt-2 font-mono">{passedAssignments}</div>
            <p className="text-xs text-gray-500 mt-1">Passed with AI Rubric</p>
          </div>

          <div className="bg-white p-5 rounded-2xl border border-[#393636]/10 shadow-2xs">
            <span className="text-xs font-semibold text-gray-500">Average Rubric Score</span>
            <div className="text-3xl font-black text-[#393636] mt-2 font-mono">{avgScore}<span className="text-sm text-gray-400">/10</span></div>
            <p className="text-xs text-gray-500 mt-1">Across {totalEvaluated} graded labs</p>
          </div>

          <div className="bg-white p-5 rounded-2xl border border-[#393636]/10 shadow-2xs">
            <span className="text-xs font-semibold text-gray-500">Active Study Streak</span>
            <div className="text-3xl font-black text-amber-500 mt-2 flex items-center gap-1 font-mono">
              <Flame className="w-6 h-6 fill-current" /> 3
            </div>
            <p className="text-xs text-gray-500 mt-1">Consecutive learning days</p>
          </div>
        </div>

        {/* Modules Breakdown */}
        <div className="bg-white rounded-3xl border border-[#393636]/15 p-6 sm:p-8 shadow-sm space-y-6">
          <div>
            <h2 className="text-xl font-bold text-[#393636]">
              DaVinci Resolve 8-Module Syllabus Progression
            </h2>
            <p className="text-xs text-gray-500 mt-0.5">
              Every lesson includes hands-on audio dialogue with your AI Mentor and practical timeline tasks.
            </p>
          </div>

          <div className="space-y-4">
            {course.modules.map((module, idx) => {
              const moduleLessons = module.lessons;
              const moduleCompleted = moduleLessons.filter((l) => completedLessonIds.includes(l.id)).length;
              const modulePct = moduleLessons.length > 0 ? Math.round((moduleCompleted / moduleLessons.length) * 100) : 0;
              const isAllDone = moduleCompleted === moduleLessons.length;

              return (
                <div
                  key={module.id}
                  className="border border-gray-200 rounded-2xl p-5 hover:border-[#F14C2F]/30 transition-all bg-gray-50/40"
                >
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-3">
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="text-xs font-mono font-bold text-[#F14C2F]">
                          Module {idx + 1}
                        </span>
                        {isAllDone && (
                          <span className="text-[10px] font-bold px-2 py-0.5 bg-emerald-100 text-emerald-800 rounded-full flex items-center gap-1">
                            <CheckCircle2 className="w-3 h-3" /> Complete
                          </span>
                        )}
                      </div>
                      <h3 className="font-bold text-[#393636] text-base mt-0.5">
                        {module.title}
                      </h3>
                    </div>

                    <div className="text-right sm:self-center">
                      <span className="text-xs font-mono font-bold text-gray-700">
                        {moduleCompleted}/{moduleLessons.length} lessons ({modulePct}%)
                      </span>
                    </div>
                  </div>

                  {/* Progress bar */}
                  <div className="w-full bg-gray-200 rounded-full h-2 overflow-hidden mb-3">
                    <div
                      className="bg-[#F14C2F] h-full rounded-full transition-all duration-300"
                      style={{ width: `${modulePct}%` }}
                    />
                  </div>

                  {/* Lesson pills / items */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 pt-2 border-t border-gray-200/60">
                    {moduleLessons.map((lesson) => {
                      const isDone = completedLessonIds.includes(lesson.id);
                      const hasEval = lesson.practicalAssignment ? assignmentEvaluations[lesson.practicalAssignment.id] : undefined;

                      return (
                        <div
                          key={lesson.id}
                          onClick={() => navigate('classroom', course.id, lesson.id)}
                          className={`p-2.5 rounded-xl border flex items-center justify-between cursor-pointer transition-colors ${
                            isDone
                              ? 'bg-emerald-50/50 border-emerald-200 hover:bg-emerald-100/50'
                              : 'bg-white border-gray-200 hover:border-[#F14C2F]'
                          }`}
                        >
                          <div className="flex items-center gap-2 overflow-hidden">
                            {isDone ? (
                              <CheckCircle2 className="w-4 h-4 text-emerald-600 flex-shrink-0" />
                            ) : (
                              <div className="w-4 h-4 rounded-full border border-gray-300 flex-shrink-0" />
                            )}
                            <span className="text-xs font-medium text-[#393636] truncate">
                              {lesson.title}
                            </span>
                          </div>

                          {hasEval && (
                            <span className="text-[10px] font-mono font-bold text-gray-500 whitespace-nowrap ml-2">
                              {hasEval.score}/10
                            </span>
                          )}
                        </div>
                      );
                    })}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
};
