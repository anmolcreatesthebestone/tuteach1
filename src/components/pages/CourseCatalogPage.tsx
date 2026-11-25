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
  GraduationCap
} from 'lucide-react';

export const CourseCatalogPage: React.FC = () => {
  const { navigate, enrollInCourse, hasPaidForCourse } = useApp();
  const [selectedCategory, setSelectedCategory] = useState<string>('all');

  const categories = [
    { id: 'all', name: 'All Categories' },
    { id: 'video-editing', name: 'Video Editing (Active)' },
    { id: 'color', name: 'Color Grading (Coming Soon)' },
    { id: 'audio', name: 'Audio Post (Coming Soon)' },
    { id: 'vfx', name: 'Fusion VFX (Coming Soon)' }
  ];

  // Primary active course is DaVinci Resolve
  const activeCourses = COURSES_DATA;

  // Upcoming courses preview (truthfully labeled as roadmap, not fabricated active courses)
  const upcomingCourses = [
    {
      id: 'upcoming-color',
      title: 'Advanced Color Grading in DaVinci Resolve',
      category: 'color',
      software: 'DaVinci Resolve Studio',
      level: 'Intermediate',
      modules: 6,
      lessons: 28,
      status: 'Coming Soon in Q2 2026',
      description: 'Master HDR color wheels, ACES color management, Qualifier isolations, and film print emulation with your AI Teacher.'
    },
    {
      id: 'upcoming-fusion',
      title: 'Fusion Motion Graphics & Node-Based Compositing',
      category: 'vfx',
      software: 'DaVinci Resolve Fusion',
      level: 'Intermediate',
      modules: 5,
      lessons: 24,
      status: 'Coming Soon in Q3 2026',
      description: 'Step into node-based VFX: 3D camera tracking, green screen keying, particle systems, and kinetic typography.'
    },
    {
      id: 'upcoming-fairlight',
      title: 'Fairlight Professional Audio Mixing & Sound Design',
      category: 'audio',
      software: 'DaVinci Resolve Fairlight',
      level: 'Beginner to Intermediate',
      modules: 4,
      lessons: 20,
      status: 'Coming Soon in Q4 2026',
      description: 'Dialog cleanup with Voice Isolation, ADR recording, Foley effects mixing, bus routing, and broadcast loudness normalization.'
    }
  ];

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10 space-y-10">
      {/* Header */}
      <div className="space-y-4">
        <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-[#F14C2F]/10 border border-[#F14C2F]/20 text-[#F14C2F] text-xs font-semibold">
          <Sparkles className="w-4 h-4" />
          <span>Curated DaVinci Resolve Curriculum</span>
        </div>
        <h1 className="text-3xl sm:text-4xl font-bold text-[#393636]">
          Course Catalog
        </h1>
        <p className="text-base sm:text-lg text-[#393636]/80 max-w-2xl">
          TUTeach focuses on deep, verified mastery. Learn directly with your 1-on-1 AI Teacher (TUTutor) with voice questions, step-by-step guidance, and practical tasks scored out of 10.
        </p>
      </div>

      {/* Category Filter Pills */}
      <div className="flex flex-wrap gap-2 border-b border-[#393636]/10 pb-4">
        {categories.map((cat) => (
          <button
            key={cat.id}
            onClick={() => setSelectedCategory(cat.id)}
            className={`px-4 py-2 rounded-xl text-sm font-medium transition-all cursor-pointer ${
              selectedCategory === cat.id
                ? 'bg-[#393636] text-white shadow-xs'
                : 'bg-white text-[#393636]/70 hover:text-[#393636] border border-[#393636]/10'
            }`}
          >
            {cat.name}
          </button>
        ))}
      </div>

      {/* Active Courses Section */}
      {(selectedCategory === 'all' || selectedCategory === 'video-editing') && (
        <div className="space-y-6">
          <div className="flex items-center gap-2">
            <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-pulse" />
            <h2 className="text-xl font-bold text-[#393636]">
              Currently Available & Open for Enrollment
            </h2>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
            {activeCourses.map((course) => (
              <div
                key={course.id}
                className="bg-white rounded-3xl p-6 sm:p-8 border-2 border-[#F14C2F]/20 shadow-sm hover:border-[#F14C2F] transition-all flex flex-col justify-between"
              >
                <div className="space-y-5">
                  <div className="flex flex-wrap items-center justify-between gap-2">
                    <span className="px-3 py-1 rounded-full bg-emerald-100 text-emerald-800 text-xs font-semibold">
                      Active Program
                    </span>
                    <span className="text-xs text-[#393636]/60 font-medium">
                      Level: <strong className="text-[#393636]">{course.level}</strong>
                    </span>
                  </div>

                  <h3 className="text-2xl font-bold text-[#393636]">
                    {course.title}
                  </h3>

                  <p className="text-sm text-[#393636]/80 leading-relaxed">
                    {course.description}
                  </p>

                  {/* Highlights Grid */}
                  <div className="grid grid-cols-2 gap-3 text-xs bg-[#EFEBDA]/40 p-4 rounded-2xl border border-[#393636]/10">
                    <div className="flex items-center gap-2 text-[#393636]">
                      <Film className="w-4 h-4 text-[#F14C2F]" />
                      <span><strong>Software:</strong> {course.software}</span>
                    </div>
                    <div className="flex items-center gap-2 text-[#393636]">
                      <Languages className="w-4 h-4 text-[#F14C2F]" />
                      <span><strong>Languages:</strong> English & Hindi</span>
                    </div>
                    <div className="flex items-center gap-2 text-[#393636]">
                      <BookOpen className="w-4 h-4 text-[#F14C2F]" />
                      <span><strong>Structure:</strong> 8 Modules (43 Lessons)</span>
                    </div>
                    <div className="flex items-center gap-2 text-[#393636]">
                      <Award className="w-4 h-4 text-[#F14C2F]" />
                      <span><strong>Evaluation:</strong> Scored out of 10</span>
                    </div>
                  </div>

                  {/* Pricing Box in INR */}
                  <div className="bg-[#EFEBDA]/20 p-4 rounded-xl border border-[#393636]/10 flex flex-wrap items-center justify-between gap-3">
                    <div>
                      <div className="text-xs text-emerald-700 font-semibold flex items-center gap-1">
                        <GraduationCap className="w-3.5 h-3.5" />
                        <span>Student Plan (ID Verified)</span>
                      </div>
                      <div className="text-2xl font-bold text-[#393636]">
                        ₹{course.studentPriceInr}
                      </div>
                    </div>
                    <div className="text-right">
                      <div className="text-xs text-[#393636]/60">Regular Plan</div>
                      <div className="text-base font-semibold text-[#393636]/80">
                        ₹{course.regularPriceInr}
                      </div>
                    </div>
                  </div>
                </div>

                <div className="space-y-3 pt-6 border-t border-[#393636]/10 mt-6">
                  <div className="flex flex-wrap items-center gap-3">
                    {hasPaidForCourse(course.id) ? (
                      <button
                        onClick={() => {
                          trackCourseSelect(course.id, course.title);
                          navigate('classroom');
                        }}
                        className="flex-1 bg-[#F14C2F] text-white py-3 px-4 rounded-xl font-semibold text-sm shadow hover:bg-[#d63d22] transition-colors flex items-center justify-center gap-2 cursor-pointer"
                      >
                        <span>Resume AI Classroom</span>
                        <ArrowRight className="w-4 h-4" />
                      </button>
                    ) : (
                      <button
                        onClick={() => {
                          trackCourseSelect(course.id, course.title);
                          navigate('checkout', course.id);
                        }}
                        className="flex-1 bg-[#F14C2F] text-white py-3 px-4 rounded-xl font-semibold text-sm shadow hover:bg-[#d63d22] transition-colors flex items-center justify-center gap-2 cursor-pointer"
                      >
                        <span>Enrol in Course • ₹{course.studentPriceInr || 499}</span>
                        <ArrowRight className="w-4 h-4" />
                      </button>
                    )}
                    <button
                      onClick={() => navigate('demo')}
                      className="bg-white border border-[#393636]/20 text-[#393636] hover:border-[#F14C2F] py-3 px-3.5 rounded-xl font-semibold text-sm hover:bg-[#EFEBDA]/50 transition-colors cursor-pointer flex items-center gap-1.5"
                      title="Test the 5-minute Free AI Teacher demo"
                    >
                      <Sparkles className="w-3.5 h-3.5 text-[#F14C2F]" />
                      <span>Free Demo</span>
                    </button>
                    <button
                      onClick={() => {
                        trackCourseSelect(course.id, course.title);
                        navigate('course-details');
                      }}
                      className="bg-white border border-[#393636]/20 text-[#393636] py-3 px-3.5 rounded-xl font-semibold text-sm hover:bg-[#EFEBDA]/50 transition-colors cursor-pointer"
                    >
                      Syllabus
                    </button>
                  </div>
                  <div className="flex flex-wrap items-center gap-4 text-xs text-[#393636]/75 pt-1">
                    <a
                      href="/courses/video-editing"
                      onClick={(e) => {
                        e.preventDefault();
                        navigate('course-video-editing');
                      }}
                      className="font-semibold text-[#F14C2F] hover:underline"
                    >
                      Video Editing Overview →
                    </a>
                    <a
                      href="/courses/davinci-resolve-for-beginners"
                      onClick={(e) => {
                        e.preventDefault();
                        navigate('course-davinci-resolve');
                      }}
                      className="font-semibold text-[#393636] hover:text-[#F14C2F] hover:underline"
                    >
                      DaVinci Resolve Guide →
                    </a>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Upcoming Courses Roadmap (Transparently marked) */}
      {(selectedCategory === 'all' || selectedCategory !== 'video-editing') && (
        <div className="space-y-6 pt-6">
          <div>
            <h2 className="text-xl font-bold text-[#393636]">
              Upcoming Courses on the TUTeach Roadmap
            </h2>
            <p className="text-xs text-[#393636]/60 mt-1">
              Currently being authored into structured modules and task banks by our instructional design team.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {upcomingCourses
              .filter(
                (c) => selectedCategory === 'all' || selectedCategory === c.category
              )
              .map((upcoming) => (
                <div
                  key={upcoming.id}
                  className="bg-white/70 rounded-2xl p-6 border border-[#393636]/10 flex flex-col justify-between space-y-4"
                >
                  <div className="space-y-3">
                    <span className="px-2.5 py-1 rounded-full bg-[#393636]/5 text-[#393636]/70 text-xs font-semibold">
                      {upcoming.status}
                    </span>

                    <h3 className="font-bold text-lg text-[#393636]">
                      {upcoming.title}
                    </h3>

                    <p className="text-xs text-[#393636]/75 leading-relaxed">
                      {upcoming.description}
                    </p>

                    <div className="text-xs text-[#393636]/60 space-y-1 pt-2 border-t border-[#393636]/10">
                      <div>Software: <strong>{upcoming.software}</strong></div>
                      <div>Structure: <strong>{upcoming.modules} Modules • {upcoming.lessons} Lessons</strong></div>
                    </div>
                  </div>

                  <button
                    disabled
                    className="w-full py-2.5 rounded-xl text-xs font-semibold bg-[#EFEBDA] text-[#393636]/50 cursor-not-allowed border border-[#393636]/10"
                  >
                    In Production • Available Soon
                  </button>
                </div>
              ))}
          </div>
        </div>
      )}
    </div>
  );
};
