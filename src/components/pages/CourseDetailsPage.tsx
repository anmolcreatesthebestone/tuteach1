import React, { useState } from 'react';
import { useApp } from '../../context/AppContext';
import { COURSES_DATA } from '../../data/coursesData';
import { trackCourseSelect } from '../../seo/analytics';
import {
  Film,
  BookOpen,
  Award,
  ArrowRight,
  Sparkles,
  Languages,
  CheckCircle2,
  Clock,
  Layers,
  ChevronDown,
  ChevronUp,
  GraduationCap,
  PlayCircle,
  FileCheck2,
  ShieldCheck,
  UserCheck
} from 'lucide-react';

export const CourseDetailsPage: React.FC = () => {
  const {
    navigate,
    enrollInCourse,
    enrolledCourses,
    user,
    selectLesson,
    hasPaidForCourse
  } = useApp();

  const course = COURSES_DATA[0]; // DaVinci Resolve
  const [expandedModule, setExpandedModule] = useState<string | null>(
    course?.modules[0]?.id || null
  );

  const isPaid = hasPaidForCourse(course.id);
  const isEnrolled = isPaid;
  const isStudentVerified = user?.studentIdVerification === 'verified';

  const toggleModule = (id: string) => {
    setExpandedModule(expandedModule === id ? null : id);
  };

  const handleStartCourse = (lessonId?: string) => {
    trackCourseSelect(course.id, course.title);
    if (!isPaid) {
      if (!user) {
        navigate('login');
        return;
      }
      navigate('checkout', course.id);
      return;
    }
    if (lessonId) {
      selectLesson(course.id, lessonId);
    }
    navigate('classroom');
  };

  if (!course) {
    return (
      <div className="max-w-4xl mx-auto px-4 py-16 text-center">
        <h2 className="text-2xl font-bold text-[#393636]">Course not found</h2>
        <button
          onClick={() => navigate('catalog')}
          className="mt-4 text-[#F14C2F] font-semibold hover:underline"
        >
          Return to Course Catalog
        </button>
      </div>
    );
  }

  const totalLessons = course.modules.reduce(
    (acc, m) => acc + m.lessons.length,
    0
  );

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10 space-y-12">
      {/* Course Header Banner */}
      <div className="bg-white rounded-3xl p-8 sm:p-10 border border-[#393636]/10 shadow-sm relative overflow-hidden">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          <div className="lg:col-span-2 space-y-5">
            <div className="flex flex-wrap items-center gap-2">
              <span className="px-3.5 py-1 rounded-full bg-emerald-100 text-emerald-800 text-xs font-semibold">
                Active Beginner Course
              </span>
              <span className="px-3 py-1 rounded-full bg-[#EFEBDA] text-[#393636] text-xs font-semibold">
                Software: {course.software}
              </span>
              <span className="px-3 py-1 rounded-full bg-[#F14C2F]/10 text-[#F14C2F] text-xs font-semibold flex items-center gap-1">
                <Languages className="w-3.5 h-3.5" />
                <span>{course.teachingLanguage}</span>
              </span>
            </div>

            <h1 className="text-3xl sm:text-4xl lg:text-5xl font-bold text-[#393636] tracking-tight">
              {course.title}
            </h1>

            <p className="text-base sm:text-lg text-[#393636]/80 leading-relaxed">
              {course.description}
            </p>

            <div className="flex flex-wrap items-center gap-4 text-xs sm:text-sm text-[#393636]/80 pt-2">
              <div className="flex items-center gap-1.5 font-medium">
                <BookOpen className="w-4 h-4 text-[#F14C2F]" />
                <span>{course.modules.length} Modules</span>
              </div>
              <div className="flex items-center gap-1.5 font-medium">
                <PlayCircle className="w-4 h-4 text-[#F14C2F]" />
                <span>{totalLessons} Guided Lessons</span>
              </div>
              <div className="flex items-center gap-1.5 font-medium">
                <Award className="w-4 h-4 text-[#F14C2F]" />
                <span>Rubric Evaluations Scored Out of 10</span>
              </div>
              <div className="flex items-center gap-1.5 font-medium">
                <FileCheck2 className="w-4 h-4 text-[#F14C2F]" />
                <span>Verified TUTeach Certificate</span>
              </div>
            </div>

            <div className="flex flex-wrap items-center gap-4 pt-4">
              <button
                onClick={() => handleStartCourse()}
                className="bg-[#F14C2F] text-white px-7 py-3.5 rounded-xl font-semibold shadow hover:bg-[#d63d22] transition-colors flex items-center gap-2 cursor-pointer"
              >
                <span>{isEnrolled ? 'Resume AI Classroom' : 'Enrol in Course • ₹499'}</span>
                <ArrowRight className="w-4 h-4" />
              </button>
              <button
                onClick={() => {
                  trackCourseSelect(course.id, course.title);
                  if (isEnrolled) {
                    navigate('classroom');
                  } else {
                    navigate('checkout', course.id);
                  }
                }}
                className="bg-[#EFEBDA] text-[#393636] border border-[#393636]/20 px-6 py-3.5 rounded-xl font-semibold hover:bg-[#e4dfcb] transition-colors cursor-pointer flex items-center gap-2"
              >
                <GraduationCap className="w-4 h-4 text-[#F14C2F]" />
                <span>{isEnrolled ? 'Open Lesson 1' : 'Student Checkout (UPI / Cards)'}</span>
              </button>
              <a
                href="/courses/davinci-resolve-for-beginners"
                onClick={(e) => {
                  e.preventDefault();
                  navigate('course-davinci-resolve');
                }}
                className="text-xs font-bold text-[#F14C2F] hover:underline"
              >
                Course Overview &amp; FAQs →
              </a>
              <a
                href="/blog"
                onClick={(e) => {
                  e.preventDefault();
                  navigate('blog');
                }}
                className="text-xs font-semibold text-[#393636]/80 hover:text-[#F14C2F] hover:underline"
              >
                Beginner Study Guides →
              </a>
            </div>
          </div>

          {/* Pricing & AI Teacher Card */}
          <div className="bg-[#EFEBDA]/40 rounded-2xl p-6 border border-[#393636]/10 flex flex-col justify-between space-y-6">
            <div className="space-y-4">
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 rounded-full bg-[#393636] text-white flex items-center justify-center font-bold text-base shadow-sm">
                  TU
                </div>
                <div>
                  <div className="font-bold text-[#393636]">{course.instructor?.name || course.aiTeacher.name}</div>
                  <div className="text-xs text-[#F14C2F] font-semibold">{course.instructor?.role || course.aiTeacher.role}</div>
                </div>
              </div>

              <p className="text-xs text-[#393636]/80 leading-relaxed">
                {course.instructor?.bio || course.aiTeacher.tagline}
              </p>

              <div className="p-3 bg-white rounded-xl border border-[#393636]/10 space-y-2">
                <div className="text-xs font-bold text-[#393636] uppercase tracking-wider">Course Tuition:</div>
                <div className="flex items-baseline justify-between">
                  <div>
                    <div className="text-xs text-emerald-700 font-semibold flex items-center gap-1">
                      <GraduationCap className="w-3.5 h-3.5" />
                      <span>Student Plan</span>
                    </div>
                    <div className="text-xl font-bold text-[#393636]">₹{course.studentPriceInr}</div>
                  </div>
                  <div className="text-right">
                    <div className="text-xs text-[#393636]/60">Regular Plan</div>
                    <div className="text-sm font-semibold text-[#393636]/80">₹{course.regularPriceInr}</div>
                  </div>
                </div>
              </div>

              <div className="space-y-2 text-xs text-[#393636]/80">
                <div className="flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                  <span>Real-time voice & text interactive classroom</span>
                </div>
                <div className="flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                  <span>Tasks evaluated strictly out of 10 (pass threshold: 5.0)</span>
                </div>
                <div className="flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                  <span>1 retry allowed to improve weak attempts</span>
                </div>
                <div className="flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                  <span>Includes English & Hindi / Hinglish dual mode</span>
                </div>
              </div>
            </div>

            <button
              onClick={() => handleStartCourse()}
              className="w-full bg-[#393636] text-white py-3 rounded-xl font-semibold text-sm hover:bg-black transition-colors text-center cursor-pointer"
            >
              Start Learning Now
            </button>
          </div>
        </div>
      </div>

      {/* Complete 8-Module Syllabus Accordion */}
      <div className="space-y-6">
        <div>
          <h2 className="text-2xl font-bold text-[#393636]">
            Complete 8-Module Syllabus (43 Lessons)
          </h2>
          <p className="text-sm text-[#393636]/70 mt-1">
            Carefully structured step-by-step curriculum with guided classroom conversations, software practice, and practical task grading.
          </p>
        </div>

        <div className="space-y-4">
          {course.modules.map((module, idx) => {
            const isExpanded = expandedModule === module.id;
            return (
              <div
                key={module.id}
                className="bg-white rounded-2xl border border-[#393636]/10 shadow-xs overflow-hidden transition-all"
              >
                {/* Module Header */}
                <button
                  type="button"
                  onClick={() => toggleModule(module.id)}
                  className="w-full p-5 text-left flex items-center justify-between hover:bg-[#EFEBDA]/20 transition-colors cursor-pointer"
                >
                  <div className="space-y-1">
                    <div className="flex items-center gap-2">
                      <span className="w-6 h-6 rounded-full bg-[#F14C2F]/10 text-[#F14C2F] flex items-center justify-center font-bold text-xs">
                        {idx + 1}
                      </span>
                      <h3 className="font-bold text-base sm:text-lg text-[#393636]">
                        {module.title}
                      </h3>
                    </div>
                    <p className="text-xs text-[#393636]/70 pl-8">
                      {module.description}
                    </p>
                  </div>

                  <div className="flex items-center gap-3 shrink-0">
                    <span className="text-xs text-[#393636]/60 font-medium hidden sm:inline-block">
                      {module.lessons.length} Lessons
                    </span>
                    {isExpanded ? (
                      <ChevronUp className="w-5 h-5 text-[#393636]" />
                    ) : (
                      <ChevronDown className="w-5 h-5 text-[#393636]" />
                    )}
                  </div>
                </button>

                {/* Module Lessons List */}
                {isExpanded && (
                  <div className="border-t border-[#393636]/10 bg-[#EFEBDA]/10 p-5 space-y-3">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                      {module.lessons.map((lesson, lIdx) => (
                        <div
                          key={lesson.id}
                          className="bg-white p-3.5 rounded-xl border border-[#393636]/10 hover:border-[#F14C2F]/30 transition-all flex items-start justify-between gap-3"
                        >
                          <div className="space-y-1">
                            <div className="flex items-center gap-1.5 text-xs font-semibold text-[#F14C2F]">
                              <span>Lesson {idx + 1}.{lIdx + 1}</span>
                              <span className="text-[#393636]/40">•</span>
                              <span className="text-[#393636]/60 font-normal">{lesson.estimatedMinutes} mins</span>
                            </div>
                            <h4 className="font-semibold text-sm text-[#393636]">
                              {lesson.title}
                            </h4>
                            <p className="text-xs text-[#393636]/70 line-clamp-2">
                              {lesson.summary}
                            </p>
                          </div>

                          <button
                            onClick={() => handleStartCourse(lesson.id)}
                            className="shrink-0 p-2 text-[#F14C2F] hover:bg-[#F14C2F]/10 rounded-lg transition-colors cursor-pointer"
                            title="Launch this lesson in AI Classroom"
                          >
                            <PlayCircle className="w-5 h-5" />
                          </button>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>

      {/* Rubric Evaluation Standards */}
      <div className="bg-white rounded-3xl p-8 border border-[#393636]/10 shadow-xs space-y-6">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-[#F14C2F]/10 text-[#F14C2F] flex items-center justify-center font-bold">
            <Award className="w-5 h-5" />
          </div>
          <div>
            <h2 className="font-bold text-xl text-[#393636]">
              Evaluation Standards & Task Rubric
            </h2>
            <p className="text-xs text-[#393636]/70">
              How the AI Teacher grades your practical DaVinci Resolve exercises
            </p>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 text-sm text-[#393636]/80">
          <div className="bg-[#EFEBDA]/30 p-5 rounded-2xl border border-[#393636]/10 space-y-2">
            <div className="font-bold text-[#393636]">Strict 0 - 10 Point Scale</div>
            <p className="text-xs leading-relaxed text-[#393636]/70">
              Each submission is judged on exact technical execution (correct shortcuts, proper timeline organization, audio normalization, clean transitions).
            </p>
          </div>

          <div className="bg-[#EFEBDA]/30 p-5 rounded-2xl border border-[#393636]/10 space-y-2">
            <div className="font-bold text-[#393636]">5.0 / 10 Passing Threshold</div>
            <p className="text-xs leading-relaxed text-[#393636]/70">
              A score of 5.0 or above is required to mark the task completed. If your score is under 5.0, you must review tutor feedback and retry.
            </p>
          </div>

          <div className="bg-[#EFEBDA]/30 p-5 rounded-2xl border border-[#393636]/10 space-y-2">
            <div className="font-bold text-[#393636]">1 Retry Allowed (Best Recorded)</div>
            <p className="text-xs leading-relaxed text-[#393636]/70">
              Learners get 1 retry per assignment. The system automatically records the higher of the two scores toward your final certificate average.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};
