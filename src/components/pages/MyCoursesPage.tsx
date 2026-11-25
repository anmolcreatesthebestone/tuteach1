import React from 'react';
import { useApp } from '../../context/AppContext';
import { COURSES_DATA } from '../../data/coursesData';
import {
  BookOpen,
  Sparkles,
  ArrowRight,
  CheckCircle2,
  Clock,
  Layers,
  Award,
  Play,
  Flame,
  BrainCircuit
} from 'lucide-react';

export const MyCoursesPage: React.FC = () => {
  const {
    user,
    enrolledCourses,
    completedLessonIds,
    navigate,
    hasPaidForCourse
  } = useApp();

  // Filter enrolled courses from master COURSES_DATA
  const myCourses = COURSES_DATA.filter((course) => {
    // Has paid entitlement or explicitly in enrolled list
    return hasPaidForCourse(course.id) || enrolledCourses.includes(course.id);
  });

  // Calculate overall stats
  const totalCompletedLessons = completedLessonIds.length;
  const totalPossibleLessons = COURSES_DATA.reduce(
    (acc, c) => acc + c.modules.reduce((mAcc, m) => mAcc + m.lessons.length, 0),
    0
  );

  return (
    <div className="min-h-screen bg-[#EFEBDA] py-10 px-4 sm:px-6 lg:px-8">
      <div className="max-w-6xl mx-auto space-y-8">
        {/* Page Header */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-[#393636]/15 pb-6">
          <div>
            <div className="flex items-center gap-2 text-xs font-bold text-[#F14C2F] uppercase tracking-wider mb-1">
              <BookOpen className="w-4 h-4" />
              Student Learning Center
            </div>
            <h1 className="text-3xl font-extrabold text-[#393636] tracking-tight">
              My Enrolled Courses
            </h1>
            <p className="text-sm text-[#393636]/75 mt-1">
              Track your hands-on mastery, resume your active AI classrooms, and submit practical assignments.
            </p>
          </div>

          <div className="flex items-center gap-3">
            <button
              onClick={() => navigate('dashboard')}
              className="px-4 py-2 text-xs font-bold bg-white text-[#393636] border border-[#393636]/20 rounded-xl hover:border-[#F14C2F] transition-all"
            >
              Dashboard View
            </button>
            <button
              onClick={() => navigate('catalog')}
              className="px-4 py-2 text-xs font-bold bg-[#F14C2F] text-white rounded-xl hover:bg-[#d63b20] transition-all flex items-center gap-1.5"
            >
              Browse All Courses
              <ArrowRight className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>

        {/* Quick Stats Grid */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <div className="bg-white p-4 rounded-2xl border border-[#393636]/10 shadow-2xs">
            <div className="flex items-center justify-between text-gray-500 mb-2">
              <span className="text-xs font-semibold">Active Programs</span>
              <BookOpen className="w-4 h-4 text-[#F14C2F]" />
            </div>
            <div className="text-2xl font-black text-[#393636]">{myCourses.length}</div>
            <p className="text-[11px] text-gray-500 mt-1">Full lifetime access</p>
          </div>

          <div className="bg-white p-4 rounded-2xl border border-[#393636]/10 shadow-2xs">
            <div className="flex items-center justify-between text-gray-500 mb-2">
              <span className="text-xs font-semibold">Lessons Mastered</span>
              <CheckCircle2 className="w-4 h-4 text-emerald-600" />
            </div>
            <div className="text-2xl font-black text-[#393636]">{totalCompletedLessons}</div>
            <p className="text-[11px] text-gray-500 mt-1">Verified with AI Teacher</p>
          </div>

          <div className="bg-white p-4 rounded-2xl border border-[#393636]/10 shadow-2xs">
            <div className="flex items-center justify-between text-gray-500 mb-2">
              <span className="text-xs font-semibold">Active Streak</span>
              <Flame className="w-4 h-4 text-amber-500" />
            </div>
            <div className="text-2xl font-black text-[#393636]">3 Days</div>
            <p className="text-[11px] text-gray-500 mt-1">Keep learning daily</p>
          </div>

          <div className="bg-white p-4 rounded-2xl border border-[#393636]/10 shadow-2xs">
            <div className="flex items-center justify-between text-gray-500 mb-2">
              <span className="text-xs font-semibold">Certificates</span>
              <Award className="w-4 h-4 text-purple-600" />
            </div>
            <div className="text-2xl font-black text-[#393636]">1 Verifiable</div>
            <p className="text-[11px] text-gray-500 mt-1">Complete all 8 modules</p>
          </div>
        </div>

        {/* Courses List */}
        {myCourses.length === 0 ? (
          <div className="bg-white rounded-3xl p-10 text-center border border-[#393636]/15 max-w-xl mx-auto shadow-sm">
            <div className="w-16 h-16 rounded-2xl bg-[#F14C2F]/10 text-[#F14C2F] flex items-center justify-center mx-auto mb-4">
              <BookOpen className="w-8 h-8" />
            </div>
            <h3 className="text-xl font-bold text-[#393636] mb-2">No courses enrolled yet</h3>
            <p className="text-sm text-[#393636]/70 mb-6">
              Unlock the complete DaVinci Resolve Masterclass with your 1-on-1 Gemini AI desk-side mentor for just ₹499 INR.
            </p>
            <button
              onClick={() => navigate('catalog')}
              className="px-6 py-3 bg-[#F14C2F] text-white font-bold rounded-xl hover:bg-[#d63b20] transition-all shadow-md inline-flex items-center gap-2"
            >
              Explore DaVinci Masterclass
              <ArrowRight className="w-4 h-4" />
            </button>
          </div>
        ) : (
          <div className="space-y-6">
            {myCourses.map((course) => {
              const allLessons = course.modules.flatMap((m) => m.lessons);
              const completedCount = allLessons.filter((l) =>
                completedLessonIds.includes(l.id)
              ).length;
              const progressPct =
                allLessons.length > 0
                  ? Math.round((completedCount / allLessons.length) * 100)
                  : 0;

              // Find next uncompleted lesson
              const nextLesson =
                allLessons.find((l) => !completedLessonIds.includes(l.id)) ||
                allLessons[0];

              return (
                <div
                  key={course.id}
                  className="bg-white rounded-3xl border border-[#393636]/15 overflow-hidden shadow-sm hover:border-[#F14C2F]/40 transition-all flex flex-col md:flex-row"
                >
                  {/* Thumbnail / Visual Accent */}
                  <div className="md:w-80 bg-gradient-to-br from-[#393636] to-[#252323] p-6 text-white flex flex-col justify-between relative overflow-hidden">
                    <div className="absolute -right-8 -bottom-8 w-36 h-36 bg-[#F14C2F]/20 rounded-full blur-2xl pointer-events-none" />
                    <div>
                      <div className="flex items-center gap-2 text-xs font-semibold text-[#EFEBDA]/80 mb-2">
                        <span className="px-2 py-0.5 bg-white/10 rounded-md font-mono text-[10px]">
                          {course.category}
                        </span>
                        <span>•</span>
                        <span>{course.level}</span>
                      </div>
                      <h3 className="text-xl font-bold leading-tight text-white mb-2">
                        {course.title}
                      </h3>
                      <p className="text-xs text-[#EFEBDA]/80 line-clamp-2">
                        {course.shortDescription}
                      </p>
                    </div>

                    <div className="pt-6 border-t border-white/10 mt-6 flex items-center justify-between text-xs text-[#EFEBDA]/75">
                      <span className="flex items-center gap-1">
                        <Clock className="w-3.5 h-3.5" />
                        {course.durationHours}h Total
                      </span>
                      <span className="flex items-center gap-1">
                        <Layers className="w-3.5 h-3.5" />
                        {allLessons.length} Lessons
                      </span>
                    </div>
                  </div>

                  {/* Course Progress & Controls */}
                  <div className="flex-1 p-6 sm:p-8 flex flex-col justify-between space-y-6">
                    <div>
                      {/* Progress Bar */}
                      <div className="flex items-center justify-between text-xs font-bold text-[#393636] mb-2">
                        <span className="flex items-center gap-1.5">
                          <Sparkles className="w-4 h-4 text-[#F14C2F]" />
                          Course Progress
                        </span>
                        <span className="font-mono text-sm text-[#F14C2F]">{progressPct}%</span>
                      </div>
                      <div className="w-full bg-gray-100 rounded-full h-3 overflow-hidden border border-gray-200">
                        <div
                          className="bg-[#F14C2F] h-full rounded-full transition-all duration-500"
                          style={{ width: `${progressPct}%` }}
                        />
                      </div>
                      <div className="flex items-center justify-between text-xs text-gray-500 mt-2">
                        <span>{completedCount} of {allLessons.length} lessons completed</span>
                        {progressPct === 100 ? (
                          <span className="text-emerald-600 font-bold flex items-center gap-1">
                            <CheckCircle2 className="w-3.5 h-3.5" /> Course Completed!
                          </span>
                        ) : (
                          <span>Next: {nextLesson?.title}</span>
                        )}
                      </div>
                    </div>

                    {/* Quick Action Buttons */}
                    <div className="flex flex-wrap items-center gap-3 pt-4 border-t border-gray-100">
                      <button
                        onClick={() => navigate('classroom', course.id, nextLesson.id)}
                        className="px-5 py-2.5 bg-[#F14C2F] hover:bg-[#d63b20] text-white font-bold rounded-xl text-sm transition-all shadow-sm flex items-center gap-2"
                      >
                        <Play className="w-4 h-4 fill-current" />
                        Resume AI Classroom
                      </button>

                      <button
                        onClick={() => navigate('assignments')}
                        className="px-4 py-2.5 bg-gray-100 hover:bg-gray-200 text-[#393636] font-bold rounded-xl text-sm transition-all"
                      >
                        Assignments
                      </button>

                      <button
                        onClick={() => navigate('revision')}
                        className="px-4 py-2.5 bg-[#EFEBDA] hover:bg-[#e4ddc8] text-[#393636] font-bold rounded-xl text-sm transition-all flex items-center gap-1.5"
                      >
                        <BrainCircuit className="w-4 h-4 text-[#F14C2F]" />
                        Shortcuts Deck
                      </button>

                      <button
                        onClick={() => navigate('course-details', course.id)}
                        className="ml-auto text-xs font-bold text-gray-500 hover:text-[#393636] transition-colors"
                      >
                        View Syllabus
                      </button>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
};
