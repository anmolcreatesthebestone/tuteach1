import React, { useState } from 'react';
import { useApp } from '../../context/AppContext';
import { TUTeachLogo } from './Logo';
import {
  Search,
  BookOpen,
  Award,
  Sparkles,
  User as UserIcon,
  LogOut,
  Menu,
  X,
  Layers,
  ChevronDown,
  BrainCircuit,
  FileCheck,
  TrendingUp,
  Mail
} from 'lucide-react';

export const Header: React.FC = () => {
  const {
    user,
    currentPage,
    navigate,
    logoutUser,
    revisionDeck,
    certificates,
    searchQuery,
    setSearchQuery,
    courses,
    hasPaidForCourse,
    selectedCourseId
  } = useApp();

  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [userDropdownOpen, setUserDropdownOpen] = useState(false);
  const [showSearchModal, setShowSearchModal] = useState(false);

  const filteredSearchResults = searchQuery.trim()
    ? courses.filter(
        c =>
          c.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
          c.shortDescription.toLowerCase().includes(searchQuery.toLowerCase()) ||
          c.category.toLowerCase().includes(searchQuery.toLowerCase())
      )
    : [];

  const handleSelectSearchCourse = (courseId: string) => {
    navigate('course-details', courseId);
    setShowSearchModal(false);
    setSearchQuery('');
  };

  return (
    <>
      <header className="sticky top-0 z-40 bg-[#EFEBDA]/90 backdrop-blur-md border-b border-[#393636]/10 transition-colors">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-18">
            {/* Logo */}
            <div className="flex-shrink-0">
              <TUTeachLogo size="md" />
            </div>

            {/* Desktop Navigation Links (Crawlable <a href> + Instant SPA PushState) */}
            <nav aria-label="Primary navigation" className="hidden md:flex items-center space-x-1 lg:space-x-2">
              <a
                href="/"
                onClick={(e) => {
                  e.preventDefault();
                  navigate('home');
                }}
                className={`px-3 py-2 text-sm font-semibold rounded-lg transition-colors whitespace-nowrap ${
                  currentPage === 'home'
                    ? 'text-[#F14C2F] bg-[#F14C2F]/10'
                    : 'text-[#393636] hover:text-[#F14C2F] hover:bg-black/5'
                }`}
              >
                Home
              </a>

              <a
                href="/courses"
                onClick={(e) => {
                  e.preventDefault();
                  navigate('catalog');
                }}
                className={`px-3 py-2 text-sm font-semibold rounded-lg transition-colors whitespace-nowrap ${
                  currentPage === 'catalog' || currentPage === 'course-video-editing' || currentPage === 'course-davinci-resolve'
                    ? 'text-[#F14C2F] bg-[#F14C2F]/10'
                    : 'text-[#393636] hover:text-[#F14C2F] hover:bg-black/5'
                }`}
              >
                Courses
              </a>

              <a
                href="/blog"
                onClick={(e) => {
                  e.preventDefault();
                  navigate('blog');
                }}
                className={`px-3 py-2 text-sm font-semibold rounded-lg transition-colors whitespace-nowrap ${
                  currentPage === 'blog' || currentPage === 'blog-post'
                    ? 'text-[#F14C2F] bg-[#F14C2F]/10'
                    : 'text-[#393636] hover:text-[#F14C2F] hover:bg-black/5'
                }`}
              >
                Blog
              </a>

              <a
                href="/pricing"
                onClick={(e) => {
                  e.preventDefault();
                  navigate('pricing');
                }}
                className={`px-3 py-2 text-sm font-semibold rounded-lg transition-colors whitespace-nowrap ${
                  currentPage === 'pricing'
                    ? 'text-[#F14C2F] bg-[#F14C2F]/10'
                    : 'text-[#393636] hover:text-[#F14C2F] hover:bg-black/5'
                }`}
              >
                Pricing
              </a>

              <a
                href="/about"
                onClick={(e) => {
                  e.preventDefault();
                  navigate('about');
                }}
                className={`px-3 py-2 text-sm font-semibold rounded-lg transition-colors whitespace-nowrap ${
                  currentPage === 'about'
                    ? 'text-[#F14C2F] bg-[#F14C2F]/10'
                    : 'text-[#393636] hover:text-[#F14C2F] hover:bg-black/5'
                }`}
              >
                About
              </a>
            </nav>

            {/* Right Side: Search + Auth */}
            <div className="hidden md:flex items-center space-x-3">
              <button
                onClick={() => navigate('demo')}
                className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-bold bg-[#F14C2F] text-white hover:bg-[#d63b20] rounded-lg shadow-2xs transition-all cursor-pointer animate-pulse"
                title="Try 5-minute interactive AI voice teacher demo"
              >
                <Sparkles className="w-3.5 h-3.5" />
                <span>Start Free Demo</span>
              </button>

              {/* Quick Search Button */}
              <button
                onClick={() => setShowSearchModal(true)}
                className="flex items-center gap-2 px-3 py-1.5 text-xs text-[#393636]/70 bg-white/70 hover:bg-white border border-[#393636]/15 rounded-lg shadow-2xs transition-colors"
                title="Search courses (⌘K)"
              >
                <Search className="w-3.5 h-3.5 text-[#393636]" />
                <span>Search courses...</span>
                <kbd className="hidden lg:inline-block px-1.5 py-0.5 text-[10px] bg-gray-100 border border-gray-300 rounded text-gray-600">
                  ⌘K
                </kbd>
              </button>

              {user ? (
                /* Authenticated User Session */
                <div className="relative">
                  <button
                    onClick={() => setUserDropdownOpen(!userDropdownOpen)}
                    className="flex items-center gap-2.5 p-1.5 pl-2.5 bg-white border border-[#393636]/15 hover:border-[#F14C2F] rounded-xl shadow-2xs transition-all"
                  >
                    <div className="w-7 h-7 rounded-full bg-[#393636] text-[#EFEBDA] flex items-center justify-center font-bold text-xs overflow-hidden">
                      {user.avatar ? (
                        <img src={user.avatar} alt={user.name} className="w-full h-full object-cover" />
                      ) : (
                        user.name.charAt(0)
                      )}
                    </div>
                    <div className="text-left leading-tight hidden lg:block">
                      <div className="text-xs font-bold text-[#393636] truncate max-w-[110px]">
                        {user.name}
                      </div>
                      <div className="text-[10px] text-[#F14C2F] font-semibold flex items-center gap-1">
                        <Sparkles className="w-2.5 h-2.5" /> Pro Learner
                      </div>
                    </div>
                    <ChevronDown className="w-3.5 h-3.5 text-gray-500" />
                  </button>

                  {userDropdownOpen && (
                    <div
                      onMouseLeave={() => setUserDropdownOpen(false)}
                      className="absolute right-0 mt-2 w-56 bg-white rounded-xl shadow-xl border border-gray-200 py-1.5 text-sm z-50 text-[#393636]"
                    >
                      <div className="px-4 py-2 border-b border-gray-100">
                        <p className="text-xs text-gray-500">Signed in as</p>
                        <p className="font-bold text-sm text-[#393636] truncate">{user.email}</p>
                      </div>

                      <button
                        onClick={() => {
                          navigate('dashboard');
                          setUserDropdownOpen(false);
                        }}
                        className="w-full px-4 py-2 text-left hover:bg-gray-50 flex items-center gap-2 font-medium"
                      >
                        <Layers className="w-4 h-4 text-[#F14C2F]" />
                        Student Dashboard
                      </button>

                      <button
                        onClick={() => {
                          navigate('my-courses');
                          setUserDropdownOpen(false);
                        }}
                        className="w-full px-4 py-2 text-left hover:bg-gray-50 flex items-center gap-2 font-medium"
                      >
                        <BookOpen className="w-4 h-4 text-[#393636]" />
                        My Enrolled Courses
                      </button>

                      {hasPaidForCourse(selectedCourseId) ? (
                        <button
                          onClick={() => {
                            navigate('classroom');
                            setUserDropdownOpen(false);
                          }}
                          className="w-full px-4 py-2 text-left hover:bg-gray-50 flex items-center gap-2 font-medium text-[#F14C2F]"
                        >
                          <Sparkles className="w-4 h-4 text-[#F14C2F]" />
                          AI Voice Classroom
                        </button>
                      ) : (
                        <button
                          onClick={() => {
                            navigate('checkout', selectedCourseId);
                            setUserDropdownOpen(false);
                          }}
                          className="w-full px-4 py-2 text-left hover:bg-gray-50 flex items-center justify-between font-medium text-amber-700"
                        >
                          <span className="flex items-center gap-2">
                            <BookOpen className="w-4 h-4 text-amber-600" />
                            Unlock Classes
                          </span>
                          <span className="text-[10px] px-1.5 py-0.5 bg-amber-100 text-amber-800 rounded font-bold">
                            ₹499
                          </span>
                        </button>
                      )}

                      <button
                        onClick={() => {
                          navigate('assignments');
                          setUserDropdownOpen(false);
                        }}
                        className="w-full px-4 py-2 text-left hover:bg-gray-50 flex items-center gap-2 font-medium"
                      >
                        <FileCheck className="w-4 h-4 text-[#393636]" />
                        Assignments Lab
                      </button>

                      <button
                        onClick={() => {
                          navigate('progress');
                          setUserDropdownOpen(false);
                        }}
                        className="w-full px-4 py-2 text-left hover:bg-gray-50 flex items-center gap-2 font-medium"
                      >
                        <TrendingUp className="w-4 h-4 text-emerald-600" />
                        Learning Progress
                      </button>

                      <button
                        onClick={() => {
                          navigate('certificates');
                          setUserDropdownOpen(false);
                        }}
                        className="w-full px-4 py-2 text-left hover:bg-gray-50 flex items-center justify-between font-medium"
                      >
                        <span className="flex items-center gap-2">
                          <Award className="w-4 h-4 text-purple-600" />
                          Certificates
                        </span>
                        {certificates.length > 0 && (
                          <span className="text-[10px] px-1.5 py-0.5 bg-purple-100 text-purple-800 rounded-full font-bold">
                            {certificates.length}
                          </span>
                        )}
                      </button>

                      <button
                        onClick={() => {
                          navigate('revision');
                          setUserDropdownOpen(false);
                        }}
                        className="w-full px-4 py-2 text-left hover:bg-gray-50 flex items-center justify-between font-medium"
                      >
                        <span className="flex items-center gap-2">
                          <BrainCircuit className="w-4 h-4 text-amber-600" />
                          Shortcuts Deck
                        </span>
                        {revisionDeck.length > 0 && (
                          <span className="text-[10px] px-1.5 py-0.5 bg-[#F14C2F] text-white rounded-full font-bold">
                            {revisionDeck.length}
                          </span>
                        )}
                      </button>

                      <div className="border-t border-gray-100 mt-1 pt-1">
                        <button
                          onClick={() => {
                            logoutUser();
                            setUserDropdownOpen(false);
                          }}
                          className="w-full px-4 py-2 text-left hover:bg-red-50 text-red-600 flex items-center gap-2 font-medium"
                        >
                          <LogOut className="w-4 h-4" />
                          Log Out
                        </button>
                      </div>
                    </div>
                  )}
                </div>
              ) : (
                /* Guest State */
                <div className="flex items-center space-x-2">
                  <button
                    onClick={() => navigate('login')}
                    className="px-3.5 py-1.5 text-xs font-bold text-[#393636] hover:text-[#F14C2F] transition-colors"
                  >
                    Log In
                  </button>
                  <button
                    onClick={() => navigate('register')}
                    className="px-4 py-2 text-xs font-bold bg-[#F14C2F] hover:bg-[#d63b20] text-white rounded-lg shadow-sm transition-all"
                  >
                    Join TUTeach Free
                  </button>
                </div>
              )}
            </div>

            {/* Mobile Menu Button */}
            <div className="flex md:hidden items-center gap-2">
              <button
                onClick={() => setShowSearchModal(true)}
                className="p-2 text-[#393636] hover:text-[#F14C2F]"
              >
                <Search className="w-5 h-5" />
              </button>
              <button
                onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
                className="p-2 text-[#393636] hover:text-[#F14C2F] rounded-lg"
              >
                {mobileMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
              </button>
            </div>
          </div>
        </div>

        {/* Mobile Navigation Drawer */}
        {mobileMenuOpen && (
          <div className="md:hidden bg-[#EFEBDA] border-b border-[#393636]/15 px-4 pt-2 pb-6 space-y-2">
            <button
              onClick={() => {
                navigate('demo');
                setMobileMenuOpen(false);
              }}
              className="w-full py-2.5 px-3 bg-[#F14C2F] text-white text-left font-bold rounded-lg flex items-center justify-between"
            >
              <span className="flex items-center gap-2">
                <Sparkles className="w-4 h-4" />
                Start Free 5-Min AI Demo
              </span>
              <span className="text-xs bg-white/20 px-2 py-0.5 rounded font-semibold">Free</span>
            </button>
            <button
              onClick={() => {
                navigate('home');
                setMobileMenuOpen(false);
              }}
              className="w-full py-2 text-left font-semibold text-[#393636] hover:text-[#F14C2F]"
            >
              Home
            </button>
            <a
              href="/catalog"
              onClick={(e) => {
                e.preventDefault();
                navigate('catalog');
                setMobileMenuOpen(false);
              }}
              className="block w-full py-2 text-left font-semibold text-[#393636] hover:text-[#F14C2F]"
            >
              Course Catalog
            </a>
            <a
              href="/courses/davinci-resolve-for-beginners"
              onClick={(e) => {
                e.preventDefault();
                navigate('course-davinci-resolve');
                setMobileMenuOpen(false);
              }}
              className="block w-full py-2 text-left font-semibold text-[#393636] hover:text-[#F14C2F]"
            >
              DaVinci Resolve for Beginners
            </a>
            <a
              href="/blog"
              onClick={(e) => {
                e.preventDefault();
                navigate('blog');
                setMobileMenuOpen(false);
              }}
              className="block w-full py-2 text-left font-semibold text-[#393636] hover:text-[#F14C2F]"
            >
              Educational Blog
            </a>
            <a
              href="/pricing"
              onClick={(e) => {
                e.preventDefault();
                navigate('pricing');
                setMobileMenuOpen(false);
              }}
              className="block w-full py-2 text-left font-semibold text-[#393636] hover:text-[#F14C2F]"
            >
              Pricing
            </a>
            <button
              onClick={() => {
                navigate('about');
                setMobileMenuOpen(false);
              }}
              className="w-full py-2 text-left font-semibold text-[#393636] hover:text-[#F14C2F]"
            >
              About TUTeach
            </button>
            <button
              onClick={() => {
                navigate('help');
                setMobileMenuOpen(false);
              }}
              className="w-full py-2 text-left font-semibold text-[#393636] hover:text-[#F14C2F]"
            >
              Help & FAQ
            </button>
            <button
              onClick={() => {
                navigate('contact');
                setMobileMenuOpen(false);
              }}
              className="w-full py-2 text-left font-semibold text-[#393636] hover:text-[#F14C2F]"
            >
              Contact Support
            </button>

            <div className="pt-4 border-t border-[#393636]/15 space-y-2">
              {user ? (
                <>
                  <div className="flex items-center gap-2 mb-2">
                    <div className="w-8 h-8 rounded-full bg-[#393636] text-white flex items-center justify-center font-bold text-xs">
                      {user.name.charAt(0)}
                    </div>
                    <div>
                      <p className="text-xs font-bold text-[#393636]">{user.name}</p>
                      <p className="text-[10px] text-gray-500">{user.email}</p>
                    </div>
                  </div>
                  <div className="grid grid-cols-2 gap-2 my-2">
                    <button
                      onClick={() => {
                        navigate('dashboard');
                        setMobileMenuOpen(false);
                      }}
                      className="py-2 px-3 bg-[#393636] text-white font-bold rounded-lg text-xs text-center"
                    >
                      Dashboard
                    </button>
                    <button
                      onClick={() => {
                        navigate('my-courses');
                        setMobileMenuOpen(false);
                      }}
                      className="py-2 px-3 bg-white text-[#393636] border border-[#393636]/20 font-bold rounded-lg text-xs text-center"
                    >
                      My Courses
                    </button>
                    <button
                      onClick={() => {
                        navigate('classroom');
                        setMobileMenuOpen(false);
                      }}
                      className="py-2 px-3 bg-[#F14C2F] text-white font-bold rounded-lg text-xs text-center"
                    >
                      AI Classroom
                    </button>
                    <button
                      onClick={() => {
                        navigate('assignments');
                        setMobileMenuOpen(false);
                      }}
                      className="py-2 px-3 bg-white text-[#393636] border border-[#393636]/20 font-bold rounded-lg text-xs text-center"
                    >
                      Assignments
                    </button>
                    <button
                      onClick={() => {
                        navigate('progress');
                        setMobileMenuOpen(false);
                      }}
                      className="py-2 px-3 bg-white text-[#393636] border border-[#393636]/20 font-bold rounded-lg text-xs text-center"
                    >
                      Progress
                    </button>
                    <button
                      onClick={() => {
                        navigate('certificates');
                        setMobileMenuOpen(false);
                      }}
                      className="py-2 px-3 bg-white text-[#393636] border border-[#393636]/20 font-bold rounded-lg text-xs text-center"
                    >
                      Certificates
                    </button>
                  </div>
                  <button
                    onClick={() => {
                      logoutUser();
                      setMobileMenuOpen(false);
                    }}
                    className="w-full py-2 text-center text-red-600 font-semibold text-sm"
                  >
                    Log Out
                  </button>
                </>
              ) : (
                <div className="flex flex-col gap-2">
                  <button
                    onClick={() => {
                      navigate('login');
                      setMobileMenuOpen(false);
                    }}
                    className="w-full py-2 text-center font-bold text-[#393636] border border-[#393636]/20 rounded-lg text-sm bg-white"
                  >
                    Log In
                  </button>
                  <button
                    onClick={() => {
                      navigate('register');
                      setMobileMenuOpen(false);
                    }}
                    className="w-full py-2 text-center font-bold text-white bg-[#F14C2F] rounded-lg text-sm shadow-sm"
                  >
                    Join TUTeach Free
                  </button>
                </div>
              )}
            </div>
          </div>
        )}
      </header>

      {/* Instant Search Modal */}
      {showSearchModal && (
        <div className="fixed inset-0 z-50 flex items-start justify-center pt-20 px-4 bg-black/60 backdrop-blur-xs">
          <div className="bg-white rounded-2xl max-w-xl w-full shadow-2xl border border-[#393636]/15 overflow-hidden">
            <div className="p-4 border-b border-gray-100 flex items-center gap-3">
              <Search className="w-5 h-5 text-[#F14C2F]" />
              <input
                type="text"
                autoFocus
                placeholder="Search DaVinci Resolve topics, shortcuts, lessons (e.g. Blade tool, Ripple delete, Fairlight)..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="flex-1 text-base text-[#393636] placeholder-gray-400 focus:outline-none"
              />
              <button
                onClick={() => setShowSearchModal(false)}
                className="p-1 rounded-md text-gray-400 hover:text-gray-700 hover:bg-gray-100"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
            <div className="max-h-96 overflow-y-auto p-4 space-y-2">
              {searchQuery.trim() === '' ? (
                <div className="text-center py-8 text-gray-500 text-sm">
                  <p className="font-semibold text-[#393636]">Explore Courses on TUTeach</p>
                  <p className="text-xs text-gray-400 mt-1">Type any keyword or select a featured subject below:</p>
                  <div className="flex flex-wrap justify-center gap-2 mt-4">
                    {['DaVinci Resolve', 'Video Editing', 'Blade Tool', 'Color Wheels', 'Fairlight Audio'].map((tag) => (
                      <button
                        key={tag}
                        onClick={() => setSearchQuery(tag)}
                        className="px-3 py-1 bg-[#EFEBDA] text-xs font-semibold text-[#393636] rounded-full hover:bg-[#F14C2F] hover:text-white transition-colors"
                      >
                        {tag}
                      </button>
                    ))}
                  </div>
                </div>
              ) : filteredSearchResults.length > 0 ? (
                filteredSearchResults.map((course) => (
                  <div
                    key={course.id}
                    onClick={() => handleSelectSearchCourse(course.id)}
                    className="p-3 rounded-xl hover:bg-[#EFEBDA]/50 cursor-pointer border border-transparent hover:border-[#393636]/10 transition-all flex items-start justify-between gap-4"
                  >
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="text-xs font-bold px-2 py-0.5 bg-[#F14C2F]/10 text-[#F14C2F] rounded">
                          {course.category}
                        </span>
                        <span className="text-xs text-gray-500 font-medium">{course.level}</span>
                      </div>
                      <div className="font-bold text-sm text-[#393636] mt-1">{course.title}</div>
                      <p className="text-xs text-gray-600 line-clamp-1 mt-0.5">{course.shortDescription}</p>
                    </div>
                    <span className="text-xs font-extrabold text-[#F14C2F] self-center whitespace-nowrap">
                      ₹{course.studentPriceInr || 499}
                    </span>
                  </div>
                ))
              ) : (
                <div className="text-center py-8 text-gray-500 text-sm">
                  No courses matched "{searchQuery}". Try searching for "DaVinci" or "Editing".
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </>
  );
};
