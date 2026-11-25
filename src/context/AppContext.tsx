import React, { createContext, useContext, useState, useEffect } from 'react';
import {
  User,
  Course,
  PageView,
  AssignmentEvaluation,
  Flashcard,
  Certificate,
  LanguageMode,
  StudentIdVerificationStatus,
  PaymentReceipt,
  CourseRating,
  CookiePreferences,
  BlogPostItem
} from '../types';
import { COURSES_DATA } from '../data/coursesData';
import {
  syncAnalyticsConsent,
  trackSignUpComplete,
  trackPurchaseSuccess,
  trackLessonStart,
  trackCourseComplete
} from '../seo/analytics';

export const REGULAR_PRICE_INR = 1899;
export const STUDENT_PRICE_INR = 499;

// Helper to construct isolated user-scoped localStorage keys
export const getUserScopedKey = (prefix: string, email?: string | null): string | null => {
  if (!email || !email.trim()) return null;
  const norm = email.trim().toLowerCase().replace(/[^a-z0-9]/g, '_');
  return `${prefix}_${norm}`;
};

// Immediate cleanup of legacy unscoped global keys so stale data never leaks
if (typeof window !== 'undefined') {
  try {
    localStorage.removeItem('tuteach_enrolled_courses');
    localStorage.removeItem('tuteach_payments_davinci');
  } catch {}
}

export interface RegisterOptions {
  countryCode: string;
  dateOfBirth: string;
  acceptedPolicies: boolean;
}

export interface RegisterResult {
  ok: boolean;
  error?: string;
  user?: User;
}

interface AppContextType {
  user: User | null;
  courses: Course[];
  currentPage: PageView;
  selectedCourseId: string;
  selectedLessonId: string;
  enrolledCourseIds: string[];
  completedLessonIds: string[];
  // Convenience aliases for backward compatibility
  enrolledCourses: string[];
  completedLessons: string[];
  currentCourseId: string;
  studentIdVerification: StudentIdVerificationStatus;
  assignmentEvaluations: Record<string, AssignmentEvaluation>;
  revisionDeck: Flashcard[];
  certificates: Certificate[];
  courseRatings: Record<string, CourseRating>;
  customLogoUrl: string | null;
  searchQuery: string;
  isSearchOpen: boolean;
  activeCertificate: Certificate | null;
  languageMode: LanguageMode;
  promoVideoUrl: string;
  paymentReceipts: PaymentReceipt[];
  lastPaymentReceipt: PaymentReceipt | null;
  cookiePreferences: CookiePreferences | null;
  isCookieModalOpen: boolean;
  setIsCookieModalOpen: (open: boolean) => void;
  updateCookiePreferences: (prefs: Omit<CookiePreferences, 'essential'>) => Promise<{ ok: boolean; error?: string }>;
  hasPaidForCourse: (courseId: string) => boolean;
  selectedBlogSlug: string;
  activeBlogPost: BlogPostItem | null;
  setActiveBlogPost: (post: BlogPostItem | null) => void;
  
  // Actions
  recordPaymentReceipt: (receipt: PaymentReceipt) => void;
  setPromoVideoUrl: (url: string) => void;
  navigate: (page: PageView, courseId?: string, lessonId?: string) => void;
  selectLesson: (courseId: string, lessonId: string) => void;
  enrollInCourse: (courseId: string) => boolean;
  toggleLessonCompletion: (lessonId: string) => void;
  saveEvaluation: (evaluation: AssignmentEvaluation) => void;
  checkAndAwardCertificate: (courseId: string) => Certificate | null;
  submitCourseRating: (courseId: string, rating: number, review?: string) => Promise<boolean>;

  addFlashcards: (cards: Flashcard[]) => void;
  rateFlashcard: (cardId: string, rating: 'again' | 'hard' | 'good' | 'easy') => void;
  setCustomLogo: (url: string | null) => void;
  setSearchQuery: (query: string) => void;
  setIsSearchOpen: (open: boolean) => void;
  setActiveCertificate: (cert: Certificate | null) => void;
  setLanguageMode: (lang: LanguageMode) => void;
  submitStudentId: (institution: string, fileName: string) => void;
  setVerificationStatus: (status: StudentIdVerificationStatus) => void;
  getCurrentPrice: () => number;
  loginUser: (email: string, password?: string) => Promise<boolean>;
  logoutUser: () => Promise<void>;
  registerUser: (
    name: string,
    email: string,
    goals?: string,
    password?: string,
    options?: RegisterOptions
  ) => Promise<RegisterResult>;
  refreshCurrentUser: () => Promise<User | null>;
  deleteCurrentAccount: (reason?: string) => Promise<{ ok: boolean; financialRecordsRetained?: boolean; error?: string }>;
  resetProgressForDemo: () => void;
}

const AppContext = createContext<AppContextType | undefined>(undefined);

const INITIAL_DAVINCI_FLASHCARDS: Flashcard[] = [
  {
    id: 'fc-1',
    topic: 'J-K-L Scrubbing',
    courseId: 'course-davinci-resolve',
    question: 'How do you jog frame-by-frame forward or backward in DaVinci Resolve using keyboard shortcuts?',
    answer: 'Hold the K key and tap L to jog one frame forward, or tap J to jog one frame backward.',
    mnemonic: 'Hold K + tap L/J for surgical frame accuracy.',
    difficulty: 'Easy',
    masteryScore: 85
  },
  {
    id: 'fc-2',
    topic: 'Delete vs Ripple Delete',
    courseId: 'course-davinci-resolve',
    question: 'What is the critical difference between Backspace (Delete) and Shift + Backspace (Ripple Delete)?',
    answer: 'Backspace deletes the clip leaving an empty gap on the timeline. Shift + Backspace deletes the clip AND closes the gap automatically, pulling all downstream clips to the left.',
    mnemonic: 'Shift + Backspace ripples the gap shut.',
    difficulty: 'Medium',
    masteryScore: 90
  },
  {
    id: 'fc-3',
    topic: 'Vectorscope Skin Tone Line',
    courseId: 'course-davinci-resolve',
    question: 'Where must healthy human skin tones sit on the DaVinci Resolve Vectorscope?',
    answer: 'Directly along the diagonal Skin Tone Indicator line (at the 10:30 o’clock angle), regardless of race or skin pigmentation.',
    mnemonic: 'Blood hemoglobin gives all human skin the same 10:30 angle.',
    difficulty: 'Medium',
    masteryScore: 75
  },
  {
    id: 'fc-4',
    topic: 'YouTube Loudness Standard',
    courseId: 'course-davinci-resolve',
    question: 'What is the required Integrated LUFS loudness target for YouTube and web video delivery?',
    answer: '-14.0 LUFS Integrated with a Master True Peak Limiter ceiling of -1.0 dBFS.',
    mnemonic: '-14 LUFS avoids YouTube automated negative gain penalty.',
    difficulty: 'Hard',
    masteryScore: 60
  }
];

// Helper functions for real multi-page HTML5 browser routing
export function getRouteFromPath(
  pathname: string,
  search = ''
): { page: PageView; courseId?: string; lessonId?: string; blogSlug?: string } {
  if (search) {
    try {
      const params = new URLSearchParams(search);
      const qPage = params.get('page');
      if (qPage === 'parental-consent') return { page: 'parental-consent' };
      if (qPage === 'admin-compliance') return { page: 'admin-compliance' };
    } catch {}
  }

  const clean = (pathname || '').replace(/^\/+|\/+$/g, '').toLowerCase();
  if (!clean || clean === 'home') return { page: 'home' };
  if (clean === 'courses' || clean === 'catalog') return { page: 'catalog' };
  if (clean === 'courses/video-editing') return { page: 'course-video-editing', courseId: 'course-davinci-resolve' };
  if (clean === 'courses/davinci-resolve-for-beginners') return { page: 'course-davinci-resolve', courseId: 'course-davinci-resolve' };
  if (clean === 'blog') return { page: 'blog' };
  if (clean.startsWith('blog/')) {
    const slug = clean.slice(5).replace(/\/+$/, '');
    if (slug) return { page: 'blog-post', blogSlug: slug };
    return { page: 'blog' };
  }
  if (clean.startsWith('course/')) {
    const parts = clean.split('/');
    return { page: 'course-details', courseId: parts[1] || 'course-davinci-resolve' };
  }
  if (clean === 'pricing') return { page: 'pricing' };
  if (clean === 'login') return { page: 'login' };
  if (clean === 'register') return { page: 'register' };
  if (clean === 'forgot-password') return { page: 'forgot-password' };
  if (clean === 'dashboard') return { page: 'dashboard' };
  if (clean === 'my-courses') return { page: 'my-courses' };
  if (clean.startsWith('classroom')) {
    const parts = clean.split('/');
    return { page: 'classroom', courseId: parts[1] || 'course-davinci-resolve', lessonId: parts[2] };
  }
  if (clean === 'assignments') return { page: 'assignments' };
  if (clean === 'progress') return { page: 'progress' };
  if (clean === 'certificates' || clean === 'certificate') return { page: 'certificates' };
  if (clean === 'about') return { page: 'about' };
  if (clean === 'contact') return { page: 'contact' };
  if (clean === 'privacy') return { page: 'privacy' };
  if (clean === 'terms') return { page: 'terms' };
  if (clean === 'help') return { page: 'help' };
  if (clean === 'student-agreement') return { page: 'student-agreement' };
  if (clean === 'child-safety') return { page: 'child-safety' };
  if (clean === 'ai-disclosure') return { page: 'ai-disclosure' };
  if (clean === 'refund-policy') return { page: 'refund-policy' };
  if (clean === 'cookie-policy') return { page: 'cookie-policy' };
  if (clean === 'acceptable-use') return { page: 'acceptable-use' };
  if (clean === 'ip-disclaimer') return { page: 'ip-disclaimer' };
  if (clean === 'certificate-disclaimer') return { page: 'certificate-disclaimer' };
  if (clean === 'grievance-policy') return { page: 'grievance-policy' };
  if (clean === 'data-retention') return { page: 'data-retention' };
  if (clean === 'third-party-processors') return { page: 'third-party-processors' };
  if (clean === 'security-practices') return { page: 'security-practices' };
  if (clean === 'grievance-form' || clean === 'grievance') return { page: 'grievance-form' };
  if (clean === 'parental-consent') return { page: 'parental-consent' };
  if (clean === 'admin-compliance' || clean === 'compliance-admin') return { page: 'admin-compliance' };
  if (clean === 'demo') return { page: 'demo' };
  if (clean.startsWith('checkout')) {
    const parts = clean.split('/');
    return { page: 'checkout', courseId: parts[1] || 'course-davinci-resolve' };
  }
  if (clean === 'payment-result') return { page: 'payment-result' };
  if (clean === 'revision') return { page: 'revision' };
  return { page: 'not-found' };
}

export function getPathFromRoute(page: PageView, courseId?: string, lessonId?: string): string {
  switch (page) {
    case 'home': return '/';
    case 'catalog': return '/courses';
    case 'course-video-editing': return '/courses/video-editing';
    case 'course-davinci-resolve': return '/courses/davinci-resolve-for-beginners';
    case 'blog': return '/blog';
    case 'blog-post': return lessonId ? `/blog/${lessonId}` : '/blog';
    case 'not-found': return typeof window !== 'undefined' ? window.location.pathname : '/404';
    case 'course-details': return `/course/${courseId || 'course-davinci-resolve'}`;
    case 'pricing': return '/pricing';
    case 'login': return '/login';
    case 'register': return '/register';
    case 'forgot-password': return '/forgot-password';
    case 'dashboard': return '/dashboard';
    case 'my-courses': return '/my-courses';
    case 'classroom': return lessonId ? `/classroom/${courseId || 'course-davinci-resolve'}/${lessonId}` : `/classroom/${courseId || 'course-davinci-resolve'}`;
    case 'assignments': return '/assignments';
    case 'progress': return '/progress';
    case 'certificates':
    case 'certificate': return '/certificates';
    case 'about': return '/about';
    case 'contact': return '/contact';
    case 'privacy': return '/privacy';
    case 'terms': return '/terms';
    case 'help': return '/help';
    case 'student-agreement': return '/student-agreement';
    case 'child-safety': return '/child-safety';
    case 'ai-disclosure': return '/ai-disclosure';
    case 'refund-policy': return '/refund-policy';
    case 'cookie-policy': return '/cookie-policy';
    case 'acceptable-use': return '/acceptable-use';
    case 'ip-disclaimer': return '/ip-disclaimer';
    case 'certificate-disclaimer': return '/certificate-disclaimer';
    case 'grievance-policy': return '/grievance-policy';
    case 'data-retention': return '/data-retention';
    case 'third-party-processors': return '/third-party-processors';
    case 'security-practices': return '/security-practices';
    case 'grievance-form': return '/grievance';
    case 'parental-consent': return '/parental-consent';
    case 'admin-compliance': return '/admin-compliance';
    case 'demo': return '/demo';
    case 'checkout': return courseId ? `/checkout/${courseId}` : '/checkout';
    case 'payment-result': return '/payment-result';
    case 'revision': return '/revision';
    default: return '/';
  }
}

export const AppProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  // 1. Authenticated User State - strictly null if not logged in (NO shared demo identity)
  const [user, setUser] = useState<User | null>(() => {
    try {
      const saved = localStorage.getItem('tuteach_user_davinci');
      if (saved) return JSON.parse(saved);
    } catch {}
    return null;
  });

  const initialRoute = typeof window !== 'undefined'
    ? getRouteFromPath(window.location.pathname, window.location.search)
    : { page: 'home' as PageView };
  const [currentPage, setCurrentPage] = useState<PageView>(initialRoute.page);
  const [selectedCourseId, setSelectedCourseId] = useState<string>(initialRoute.courseId || 'course-davinci-resolve');
  const [selectedLessonId, setSelectedLessonId] = useState<string>(initialRoute.lessonId || 'les-1-1');
  const [selectedBlogSlug, setSelectedBlogSlug] = useState<string>(initialRoute.blogSlug || '');
  const [activeBlogPost, setActiveBlogPost] = useState<BlogPostItem | null>(null);


  // 2. Enrolled Courses - isolated by authenticated student
  const [enrolledCourseIds, setEnrolledCourseIds] = useState<string[]>(() => {
    try {
      const savedUserStr = localStorage.getItem('tuteach_user_davinci');
      if (savedUserStr) {
        const u = JSON.parse(savedUserStr);
        const scopedKey = getUserScopedKey('tuteach_enrolled', u?.email);
        if (scopedKey) {
          const saved = localStorage.getItem(scopedKey);
          if (saved) return JSON.parse(saved);
        }
      }
    } catch {}
    return [];
  });

  // 3. Payment Receipts - isolated by authenticated student
  const [paymentReceipts, setPaymentReceipts] = useState<PaymentReceipt[]>(() => {
    try {
      const savedUserStr = localStorage.getItem('tuteach_user_davinci');
      if (savedUserStr) {
        const u = JSON.parse(savedUserStr);
        const scopedKey = getUserScopedKey('tuteach_payments', u?.email);
        if (scopedKey) {
          const saved = localStorage.getItem(scopedKey);
          if (saved) return JSON.parse(saved);
        }
      }
    } catch {}
    return [];
  });

  const [lastPaymentReceipt, setLastPaymentReceipt] = useState<PaymentReceipt | null>(null);

  // 4. Completed Lessons - isolated by authenticated student
  const [completedLessonIds, setCompletedLessonIds] = useState<string[]>(() => {
    try {
      const savedUserStr = localStorage.getItem('tuteach_user_davinci');
      if (savedUserStr) {
        const u = JSON.parse(savedUserStr);
        const scopedKey = getUserScopedKey('tuteach_completed', u?.email);
        if (scopedKey) {
          const saved = localStorage.getItem(scopedKey);
          if (saved) return JSON.parse(saved);
        }
      }
    } catch {}
    return [];
  });

  // 5. Assignment Evaluations - isolated by student
  const [assignmentEvaluations, setAssignmentEvaluations] = useState<Record<string, AssignmentEvaluation>>(() => {
    try {
      const savedUserStr = localStorage.getItem('tuteach_user_davinci');
      if (savedUserStr) {
        const u = JSON.parse(savedUserStr);
        const scopedKey = getUserScopedKey('tuteach_evaluations', u?.email);
        if (scopedKey) {
          const saved = localStorage.getItem(scopedKey);
          if (saved) return JSON.parse(saved);
        }
      }
    } catch {}
    return {};
  });

  const [revisionDeck, setRevisionDeck] = useState<Flashcard[]>(() => {
    try {
      const saved = localStorage.getItem('tuteach_flashcards_davinci');
      if (saved) return JSON.parse(saved);
    } catch {}
    return INITIAL_DAVINCI_FLASHCARDS;
  });

  const [certificates, setCertificates] = useState<Certificate[]>(() => {
    try {
      const savedUserStr = localStorage.getItem('tuteach_user_davinci');
      if (savedUserStr) {
        const u = JSON.parse(savedUserStr);
        const scopedKey = getUserScopedKey('tuteach_certs', u?.email);
        if (scopedKey) {
          const saved = localStorage.getItem(scopedKey);
          if (saved) return JSON.parse(saved);
        }
      }
    } catch {}
    return [];
  });

  const [courseRatings, setCourseRatings] = useState<Record<string, CourseRating>>(() => {
    try {
      const savedUserStr = localStorage.getItem('tuteach_user_davinci');
      if (savedUserStr) {
        const u = JSON.parse(savedUserStr);
        const scopedKey = getUserScopedKey('tuteach_course_ratings', u?.email);
        if (scopedKey) {
          const saved = localStorage.getItem(scopedKey);
          if (saved) return JSON.parse(saved);
        }
      }
    } catch {}
    return {};
  });


  const [customLogoUrl, setCustomLogoUrlState] = useState<string | null>(() => {
    try {
      return localStorage.getItem('tuteach_custom_logo') || '/assets/aistudio/tuteach_logo_b6133804.png';
    } catch {
      return '/assets/aistudio/tuteach_logo_b6133804.png';
    }
  });

  const [languageMode, setLanguageModeState] = useState<LanguageMode>(() => {
    try {
      return (localStorage.getItem('tuteach_language_mode') as LanguageMode) || 'english';
    } catch {
      return 'english';
    }
  });

  const [promoVideoUrl, setPromoVideoUrlState] = useState<string>(() => {
    try {
      return (
        localStorage.getItem('tuteach_promo_video_url') ||
        'https://www.youtube-nocookie.com/embed/P3_m_6u3l0E?rel=0&autoplay=0'
      );
    } catch {
      return 'https://www.youtube-nocookie.com/embed/P3_m_6u3l0E?rel=0&autoplay=0';
    }
  });

  const [searchQuery, setSearchQuery] = useState('');
  const [isSearchOpen, setIsSearchOpen] = useState(false);
  const [activeCertificate, setActiveCertificate] = useState<Certificate | null>(null);
  const [isCookieModalOpen, setIsCookieModalOpen] = useState(false);
  const [cookiePreferences, setCookiePreferences] = useState<CookiePreferences | null>(() => {
    try {
      const saved = localStorage.getItem('tuteach_cookie_preferences');
      if (saved) return JSON.parse(saved);
    } catch {}
    return null;
  });

  const updateCookiePreferences = async (
    prefs: Omit<CookiePreferences, 'essential'>
  ): Promise<{ ok: boolean; error?: string }> => {
    const token = typeof window !== 'undefined' ? localStorage.getItem('tuteach_auth_token') : null;
    try {
      const res = await fetch('/api/compliance/cookie-preferences', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...(token ? { Authorization: `Bearer ${token}` } : {})
        },
        body: JSON.stringify(prefs)
      });
      const data = await res.json();
      if (!res.ok) {
        return { ok: false, error: data.message || 'Unable to save cookie preferences.' };
      }
      const nextPrefs: CookiePreferences = {
        essential: true,
        functional: Boolean(data.preferences?.functional ?? prefs.functional),
        analytics: Boolean(data.preferences?.analytics ?? prefs.analytics),
        advertising: Boolean(data.preferences?.advertising ?? false),
        updatedAt: new Date().toISOString()
      };
      setCookiePreferences(nextPrefs);
      localStorage.setItem('tuteach_cookie_preferences', JSON.stringify(nextPrefs));
      if (user) {
        const updatedUser = {
          ...user,
          functionalConsent: nextPrefs.functional,
          analyticsConsent: nextPrefs.analytics,
          marketingConsent: nextPrefs.advertising
        };
        setUser(updatedUser);
        localStorage.setItem('tuteach_user_davinci', JSON.stringify(updatedUser));
      }
      return { ok: true };
    } catch {
      return { ok: false, error: 'Network error while updating cookie preferences.' };
    }
  };

  // STRICT ACCESS CONTROL: Only grants access if authenticated user has verified payment or entitlement
  const hasPaidForCourse = (courseId: string): boolean => {
    if (!user) return false;
    const hasReceipt = paymentReceipts.some(
      (r) => r.courseId === courseId && r.status === 'SUCCESS'
    );
    const hasEntitlement = enrolledCourseIds.includes(courseId);
    return hasReceipt || hasEntitlement;
  };

  // Record verified payment strictly for current authenticated user
  const recordPaymentReceipt = (receipt: PaymentReceipt) => {
    setLastPaymentReceipt(receipt);
    if (receipt.status === 'SUCCESS' && user) {
      const scopedPayKey = getUserScopedKey('tuteach_payments', user.email);
      const scopedEnrollKey = getUserScopedKey('tuteach_enrolled', user.email);

      const updatedReceipts = [receipt, ...paymentReceipts.filter(r => r.transactionRef !== receipt.transactionRef)];
      setPaymentReceipts(updatedReceipts);
      if (scopedPayKey) localStorage.setItem(scopedPayKey, JSON.stringify(updatedReceipts));

      setEnrolledCourseIds((prev) => {
        const next = prev.includes(receipt.courseId) ? prev : [...prev, receipt.courseId];
        if (scopedEnrollKey) localStorage.setItem(scopedEnrollKey, JSON.stringify(next));
        return next;
      });

      setUser((prev) => prev ? {
        ...prev,
        enrolledCourseIds: prev.enrolledCourseIds.includes(receipt.courseId)
          ? prev.enrolledCourseIds
          : [...prev.enrolledCourseIds, receipt.courseId]
      } : null);
      trackPurchaseSuccess(receipt.courseId, receipt.amount, receipt.transactionRef);
    }
  };

  const setPromoVideoUrl = (url: string) => {
    const trimmed = url.trim();
    setPromoVideoUrlState(trimmed);
    try {
      localStorage.setItem('tuteach_promo_video_url', trimmed);
    } catch {}
  };

  // Sync session & authoritative entitlements on mount
  useEffect(() => {
    let isMounted = true;
    const syncActiveSession = async () => {
      const token = localStorage.getItem('tuteach_auth_token');
      if (!token) {
        // No session exists: ensure clean unauthenticated guest state
        if (user) {
          setUser(null);
          setEnrolledCourseIds([]);
          setPaymentReceipts([]);
        }
        return;
      }

      try {
        const meRes = await fetch('/api/auth/me', {
          headers: { 'Authorization': `Bearer ${token}` }
        });

        if (!meRes.ok) {
          // Token is expired or invalid: purge
          localStorage.removeItem('tuteach_auth_token');
          localStorage.removeItem('tuteach_user_davinci');
          if (isMounted) {
            setUser(null);
            setEnrolledCourseIds([]);
            setPaymentReceipts([]);
          }
          return;
        }

        const meData = await meRes.json();
        const authedUser = meData.user;
        if (isMounted) {
          setUser(authedUser);
          localStorage.setItem('tuteach_user_davinci', JSON.stringify(authedUser));
        }

        // Fetch authoritative server entitlements for this authenticated student
        const entRes = await fetch('/api/payments/entitlements', {
          headers: { 'Authorization': `Bearer ${token}` }
        });

        if (entRes.ok) {
          const entData = await entRes.json();
          const serverEntitled: string[] = Array.isArray(entData.entitledCourseIds) ? entData.entitledCourseIds : [];
          const scopedEnrollKey = getUserScopedKey('tuteach_enrolled', authedUser.email);
          const scopedPayKey = getUserScopedKey('tuteach_payments', authedUser.email);

          if (isMounted) {
            setEnrolledCourseIds(serverEntitled);
            if (scopedEnrollKey) localStorage.setItem(scopedEnrollKey, JSON.stringify(serverEntitled));

            setPaymentReceipts((prev) => {
              const updated = [...prev];
              for (const cId of serverEntitled) {
                if (!updated.some((r) => r.courseId === cId && r.status === 'SUCCESS')) {
                  const courseMatch = COURSES_DATA.find((c) => c.id === cId);
                  updated.unshift({
                    transactionRef: `SRV_VERIFIED_${cId}`,
                    courseId: cId,
                    courseTitle: courseMatch?.title || 'Video Editing with DaVinci Resolve',
                    amount: courseMatch?.studentPriceInr || 499,
                    date: new Date().toISOString(),
                    status: 'SUCCESS',
                    paymentMethod: 'RAZORPAY'
                  });
                }
              }
              if (scopedPayKey) localStorage.setItem(scopedPayKey, JSON.stringify(updated));
              return updated;
            });
          }
        }
      } catch (err) {
        console.warn('Session verification error:', err);
      }
    };

    syncActiveSession();
    return () => {
      isMounted = false;
    };
  }, []);

  const setLanguageMode = (lang: LanguageMode) => {
    setLanguageModeState(lang);
    try {
      localStorage.setItem('tuteach_language_mode', lang);
    } catch {}
    if (user) {
      setUser({ ...user, preferredLanguage: lang });
    }
  };

  const setCustomLogo = (url: string | null) => {
    setCustomLogoUrlState(url);
    try {
      if (url) {
        localStorage.setItem('tuteach_custom_logo', url);
      } else {
        localStorage.removeItem('tuteach_custom_logo');
      }
    } catch {}
  };

  // Consent-aware GA4 sync (only enables analytics when cookiePreferences.analytics === true; ads always denied)
  useEffect(() => {
    syncAnalyticsConsent(cookiePreferences, user);
  }, [cookiePreferences, user]);

  // Sync browser back/forward history navigation seamlessly
  useEffect(() => {
    if (typeof window === 'undefined') return;

    const handlePopState = () => {
      const route = getRouteFromPath(window.location.pathname, window.location.search);
      setCurrentPage(route.page);
      if (route.courseId) setSelectedCourseId(route.courseId);
      if (route.lessonId) setSelectedLessonId(route.lessonId);
      if (route.blogSlug !== undefined) setSelectedBlogSlug(route.blogSlug);
      if (route.page !== 'blog-post') setActiveBlogPost(null);
    };

    window.addEventListener('popstate', handlePopState);
    return () => window.removeEventListener('popstate', handlePopState);
  }, []);

  const navigate = (page: PageView, courseId?: string, lessonId?: string) => {
    const targetCourse = courseId || selectedCourseId;
    const targetLesson = lessonId || selectedLessonId;
    setCurrentPage(page);
    if (courseId) setSelectedCourseId(courseId);
    if (page === 'blog-post' && lessonId) {
      setSelectedBlogSlug(lessonId);
    } else if (lessonId) {
      setSelectedLessonId(lessonId);
    }
    if (page !== 'blog-post') {
      setActiveBlogPost(null);
    }

    if (typeof window !== 'undefined') {
      const path = getPathFromRoute(page, targetCourse, page === 'blog-post' ? lessonId : targetLesson);
      if (window.location.pathname !== path) {
        window.history.pushState({ page, courseId: targetCourse, lessonId: targetLesson }, '', path);
      }
      window.scrollTo({ top: 0, behavior: 'smooth' });
    }
  };


  const enrollInCourse = (courseId: string): boolean => {
    if (!user || !hasPaidForCourse(courseId)) {
      return false;
    }
    if (!enrolledCourseIds.includes(courseId)) {
      const updated = [...enrolledCourseIds, courseId];
      setEnrolledCourseIds(updated);
      const scopedEnrollKey = getUserScopedKey('tuteach_enrolled', user.email);
      if (scopedEnrollKey) localStorage.setItem(scopedEnrollKey, JSON.stringify(updated));
      setUser({ ...user, enrolledCourseIds: updated });
      return true;
    }
    return true;
  };

  const toggleLessonCompletion = (lessonId: string) => {
    if (!user) return;
    setCompletedLessonIds(prev => {
      const next = prev.includes(lessonId)
        ? prev.filter(id => id !== lessonId)
        : [...prev, lessonId];
      const scopedKey = getUserScopedKey('tuteach_completed', user.email);
      if (scopedKey) localStorage.setItem(scopedKey, JSON.stringify(next));
      setUser({ ...user, completedLessonIds: next });
      return next;
    });
  };

  const submitStudentId = (institution: string, fileName: string) => {
    if (!user) return;
    setUser({
      ...user,
      studentIdVerification: 'pending',
      studentIdInstitution: institution,
      studentIdFileName: fileName,
      verifiedPlanUnlocked: false
    });
  };

  const setVerificationStatus = (status: StudentIdVerificationStatus) => {
    if (!user) return;
    setUser({
      ...user,
      studentIdVerification: status,
      verifiedPlanUnlocked: status === 'verified'
    });
  };

  const getCurrentPrice = (): number => {
    if (user?.studentIdVerification === 'verified') {
      return STUDENT_PRICE_INR;
    }
    return REGULAR_PRICE_INR;
  };

  const saveEvaluation = (evaluation: AssignmentEvaluation) => {
    if (!user) return;
    const existing = assignmentEvaluations[evaluation.assignmentId];
    let attemptNumber = 1;
    let bestScore = evaluation.score;

    if (existing) {
      attemptNumber = 2;
      bestScore = Math.max(existing.score, evaluation.score);
    }

    const finalRecord: AssignmentEvaluation = {
      ...evaluation,
      attemptNumber,
      bestScore,
      canRetry: attemptNumber === 1
    };

    setAssignmentEvaluations(prev => {
      const next = { ...prev, [evaluation.assignmentId]: finalRecord };
      const scopedKey = getUserScopedKey('tuteach_evaluations', user.email);
      if (scopedKey) localStorage.setItem(scopedKey, JSON.stringify(next));
      return next;
    });

    if (bestScore >= 5.0) {
      if (!completedLessonIds.includes(evaluation.lessonId)) {
        toggleLessonCompletion(evaluation.lessonId);
      }
    }

    if (evaluation.targetedRevisionTopics.length > 0) {
      const newCards: Flashcard[] = evaluation.targetedRevisionTopics.map((topic, i) => ({
        id: `fc-gen-${Date.now()}-${i}`,
        topic,
        courseId: evaluation.courseId,
        question: `DaVinci Resolve Drill: ${topic}. What core rule did TUTutor identify?`,
        answer: evaluation.areasForImprovement[i] || 'Apply accurate keyboard shortcuts and verify audio/video scopes.',
        mnemonic: 'Double-check scopes and shortcuts before locking the cut.',
        difficulty: 'Medium',
        masteryScore: 45
      }));
      addFlashcards(newCards);
    }

    checkAndAwardCertificate(evaluation.courseId);
  };

  const checkAndAwardCertificate = (courseId: string): Certificate | null => {
    if (!user) return null;
    const course = COURSES_DATA.find(c => c.id === courseId);
    if (!course) return null;

    const existing = certificates.find(c => c.courseId === courseId);
    if (existing) return existing;

    const allCourseLessonIds = course.modules.flatMap(m => m.lessons.map(l => l.id));
    const completedCount = allCourseLessonIds.filter(id => completedLessonIds.includes(id)).length;
    const completionRate = (completedCount / allCourseLessonIds.length) * 100;

    const allAssignmentIds = course.modules.flatMap(m =>
      m.lessons.filter(l => l.practicalAssignment).map(l => l.practicalAssignment!.id)
    );

    const evaluatedTasks = allAssignmentIds.map(id => assignmentEvaluations[id]).filter(Boolean);
    const passedTasks = evaluatedTasks.filter(ev => ev.bestScore >= (course.certificateRequirements?.minimumTaskScoreOutof10 ?? 5));

    const requiredRate = course.certificateRequirements?.minimumLessonCompletionRate ?? 100;
    const isLessonsCompleted = completionRate >= requiredRate;
    const isTasksCompleted = allAssignmentIds.length > 0 && passedTasks.length === allAssignmentIds.length;


    if (isLessonsCompleted && isTasksCompleted) {
      const avgScore = Number(
        (passedTasks.reduce((acc, ev) => acc + ev.bestScore, 0) / passedTasks.length).toFixed(1)
      );

      const newCert: Certificate = {
        id: `CERT-${Date.now().toString(36).toUpperCase()}`,
        verificationCode: `TUT-DVR-${Math.random().toString(36).substring(2, 8).toUpperCase()}-2026`,
        courseId,
        courseTitle: course.title,
        software: course.software,
        studentName: user.name,
        studentEmail: user.email,
        issuedAt: new Date().toLocaleDateString('en-IN', {
          year: 'numeric',
          month: 'long',
          day: 'numeric'
        }),
        scoreAverageOutof10: avgScore,
        grade: avgScore >= 8.5 ? 'Distinction' : avgScore >= 7.0 ? 'Merit' : 'Pass',
        skillsAcquired: course.outcomes.slice(0, 4)
      };

      setCertificates(prev => {
        const next = [newCert, ...prev];
        const scopedKey = getUserScopedKey('tuteach_certs', user.email);
        if (scopedKey) localStorage.setItem(scopedKey, JSON.stringify(next));
        return next;
      });

      if (!user.completedCourseIds.includes(courseId)) {
        setUser({
          ...user,
          completedCourseIds: [...user.completedCourseIds, courseId]
        });
      }
      trackCourseComplete(courseId);
      return newCert;
    }

    return null;
  };

  const submitCourseRating = async (courseId: string, rating: number, review = ''): Promise<boolean> => {
    if (!user) return false;
    const token = typeof window !== 'undefined' ? localStorage.getItem('tuteach_auth_token') : null;
    const cleanRating = Math.max(1, Math.min(5, Math.round(rating)));

    const newRatingRecord: CourseRating = {
      courseId,
      rating: cleanRating,
      review: review.trim(),
      studentEmail: user.email,
      studentName: user.name,
      submittedAt: new Date().toISOString()
    };

    setCourseRatings(prev => {
      const next = { ...prev, [courseId]: newRatingRecord };
      const scopedKey = getUserScopedKey('tuteach_course_ratings', user.email);
      if (scopedKey && typeof window !== 'undefined') {
        localStorage.setItem(scopedKey, JSON.stringify(next));
      }
      return next;
    });

    try {
      if (token) {
        await fetch(`/api/courses/${courseId}/rating`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${token}`
          },
          body: JSON.stringify({ rating: cleanRating, review })
        });
      }
    } catch (err) {
      console.warn('Could not sync rating to server:', err);
    }
    return true;
  };


  const addFlashcards = (cards: Flashcard[]) => {
    setRevisionDeck(prev => {
      const existingIds = new Set(prev.map(c => c.id));
      const fresh = cards.filter(c => !existingIds.has(c.id));
      return [...fresh, ...prev];
    });
  };

  const rateFlashcard = (cardId: string, rating: 'again' | 'hard' | 'good' | 'easy') => {
    setRevisionDeck(prev =>
      prev.map(c => {
        if (c.id !== cardId) return c;
        const current = c.masteryScore ?? 50;
        let delta = 0;
        if (rating === 'again') delta = -25;
        if (rating === 'hard') delta = -10;
        if (rating === 'good') delta = +15;
        if (rating === 'easy') delta = +25;
        const next = Math.max(10, Math.min(100, current + delta));
        return { ...c, masteryScore: next };
      })
    );
  };

  // SECURE AUTH: Log in with backend authentication, clear stale memory, and load user-scoped data
  const loginUser = async (email: string, password = 'password123'): Promise<boolean> => {
    // 1. Immediately wipe all in-memory access and state from previous session
    setUser(null);
    setEnrolledCourseIds([]);
    setPaymentReceipts([]);
    setLastPaymentReceipt(null);
    setCompletedLessonIds([]);
    setAssignmentEvaluations({});
    setCertificates([]);

    const normEmail = email.trim().toLowerCase();
    try {
      const res = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: normEmail, password })
      });

      const data = await res.json();
      if (res.ok && data.token && data.user) {
        localStorage.setItem('tuteach_auth_token', data.token);
        localStorage.setItem('tuteach_user_davinci', JSON.stringify(data.user));
        localStorage.setItem('tuteach_student_name', data.user.name);

        const scopedEnrollKey = getUserScopedKey('tuteach_enrolled', normEmail);
        const scopedPayKey = getUserScopedKey('tuteach_payments', normEmail);

        // 2. Fetch authoritative entitlements for this authenticated user from backend
        const entRes = await fetch('/api/payments/entitlements', {
          headers: { 'Authorization': `Bearer ${data.token}` }
        });

        let serverEntitled: string[] = [];
        if (entRes.ok) {
          const entData = await entRes.json();
          serverEntitled = Array.isArray(entData.entitledCourseIds) ? entData.entitledCourseIds : [];
        }

        setEnrolledCourseIds(serverEntitled);
        if (scopedEnrollKey) localStorage.setItem(scopedEnrollKey, JSON.stringify(serverEntitled));

        // 3. Load only this student's scoped payment receipts
        const userReceipts: PaymentReceipt[] = scopedPayKey && localStorage.getItem(scopedPayKey)
          ? JSON.parse(localStorage.getItem(scopedPayKey)!)
          : [];

        // Ensure receipts match server entitlements
        for (const cId of serverEntitled) {
          if (!userReceipts.some((r) => r.courseId === cId && r.status === 'SUCCESS')) {
            const courseMatch = COURSES_DATA.find((c) => c.id === cId);
            userReceipts.unshift({
              transactionRef: `SRV_VERIFIED_${cId}`,
              courseId: cId,
              courseTitle: courseMatch?.title || 'Video Editing with DaVinci Resolve',
              amount: courseMatch?.studentPriceInr || 499,
              date: new Date().toISOString(),
              status: 'SUCCESS',
              paymentMethod: 'RAZORPAY'
            });
          }
        }
        setPaymentReceipts(userReceipts);
        if (scopedPayKey) localStorage.setItem(scopedPayKey, JSON.stringify(userReceipts));

        setUser({
          ...data.user,
          enrolledCourseIds: serverEntitled
        });

        return true;
      }
    } catch (err) {
      console.error('Login error:', err);
    }
    return false;
  };

  // SECURE AUTH: Register new student account with age/jurisdiction & legal consent
  const registerUser = async (
    name: string,
    email: string,
    goals?: string,
    password = 'password123',
    options?: RegisterOptions
  ): Promise<RegisterResult> => {
    // 1. Immediately wipe all in-memory access and state from previous session
    setUser(null);
    setEnrolledCourseIds([]);
    setPaymentReceipts([]);
    setLastPaymentReceipt(null);
    setCompletedLessonIds([]);
    setAssignmentEvaluations({});
    setCertificates([]);

    const normEmail = email.trim().toLowerCase();
    try {
      const res = await fetch('/api/auth/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name,
          email: normEmail,
          goals,
          password,
          countryCode: options?.countryCode || 'IN',
          dateOfBirth: options?.dateOfBirth || '',
          acceptedPolicies: options?.acceptedPolicies ?? false
        })
      });

      const data = await res.json();
      if (res.ok && data.token && data.user) {
        localStorage.setItem('tuteach_auth_token', data.token);
        localStorage.setItem('tuteach_user_davinci', JSON.stringify(data.user));
        localStorage.setItem('tuteach_student_name', data.user.name);

        const scopedEnrollKey = getUserScopedKey('tuteach_enrolled', normEmail);
        const scopedPayKey = getUserScopedKey('tuteach_payments', normEmail);
        if (scopedEnrollKey) localStorage.setItem(scopedEnrollKey, JSON.stringify([]));
        if (scopedPayKey) localStorage.setItem(scopedPayKey, JSON.stringify([]));

        const createdUser: User = {
          ...data.user,
          enrolledCourseIds: []
        };
        setUser(createdUser);
        setEnrolledCourseIds([]);
        setPaymentReceipts([]);
        trackSignUpComplete(options?.countryCode || 'IN');
        return { ok: true, user: createdUser };
      }
      return { ok: false, error: data.message || data.error || 'Registration failed.' };
    } catch (err) {
      console.error('Registration error:', err);
      return { ok: false, error: 'Network error during registration.' };
    }
  };

  const refreshCurrentUser = async (): Promise<User | null> => {
    const token = localStorage.getItem('tuteach_auth_token');
    if (!token) return null;
    try {
      const meRes = await fetch('/api/auth/me', {
        headers: { Authorization: `Bearer ${token}` }
      });
      if (!meRes.ok) return null;
      const meData = await meRes.json();
      if (meData.user) {
        setUser(meData.user);
        localStorage.setItem('tuteach_user_davinci', JSON.stringify(meData.user));
        return meData.user;
      }
    } catch {}
    return null;
  };

  const deleteCurrentAccount = async (
    reason = 'Student requested permanent account deletion'
  ): Promise<{ ok: boolean; financialRecordsRetained?: boolean; error?: string }> => {
    const token = localStorage.getItem('tuteach_auth_token');
    if (!token || !user) return { ok: false, error: 'Not signed in.' };

    try {
      const res = await fetch('/api/compliance/privacy-request', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify({ requestType: 'DELETION', details: { reason } })
      });
      const data = await res.json();
      if (!res.ok) {
        return { ok: false, error: data.message || 'Deletion failed.' };
      }

      // Purge all user-scoped localStorage keys immediately
      const prefixes = [
        'tuteach_enrolled',
        'tuteach_payments',
        'tuteach_completed',
        'tuteach_evaluations',
        'tuteach_certs',
        'tuteach_course_ratings'
      ];
      for (const prefix of prefixes) {
        const k = getUserScopedKey(prefix, user.email);
        if (k) localStorage.removeItem(k);
      }
      localStorage.removeItem('tuteach_auth_token');
      localStorage.removeItem('tuteach_user_davinci');
      localStorage.removeItem('tuteach_student_name');
      localStorage.removeItem('tuteach_student_experience');

      setUser(null);
      setEnrolledCourseIds([]);
      setPaymentReceipts([]);
      setLastPaymentReceipt(null);
      setCompletedLessonIds([]);
      setAssignmentEvaluations({});
      setCertificates([]);
      navigate('home');

      return { ok: true, financialRecordsRetained: Boolean(data.financialRecordsRetained) };
    } catch {
      return { ok: false, error: 'Network error while deleting account.' };
    }
  };

  // SECURE AUTH: Logout clears server session and all in-memory account data
  const logoutUser = async () => {
    const token = localStorage.getItem('tuteach_auth_token');
    if (token) {
      try {
        await fetch('/api/auth/logout', {
          method: 'POST',
          headers: { 'Authorization': `Bearer ${token}` }
        });
      } catch {}
    }

    localStorage.removeItem('tuteach_auth_token');
    localStorage.removeItem('tuteach_user_davinci');
    localStorage.removeItem('tuteach_student_name');

    // Wipe all state from memory so no subsequent account inherits anything
    setUser(null);
    setEnrolledCourseIds([]);
    setPaymentReceipts([]);
    setLastPaymentReceipt(null);
    setCompletedLessonIds([]);
    setAssignmentEvaluations({});
    setCertificates([]);
    navigate('home');
  };

  const resetProgressForDemo = () => {
    setUser(null);
    setEnrolledCourseIds([]);
    setCompletedLessonIds([]);
    setPaymentReceipts([]);
    setLastPaymentReceipt(null);
    setRevisionDeck(INITIAL_DAVINCI_FLASHCARDS);
    setCertificates([]);
  };

  const selectLesson = (courseId: string, lessonId: string) => {
    setSelectedCourseId(courseId);
    setSelectedLessonId(lessonId);
    trackLessonStart(courseId, lessonId);
  };

  return (
    <AppContext.Provider
      value={{
        user,
        courses: COURSES_DATA,
        currentPage,
        selectedCourseId,
        selectedLessonId,
        selectedBlogSlug,
        activeBlogPost,
        setActiveBlogPost,
        enrolledCourseIds,
        completedLessonIds,
        enrolledCourses: enrolledCourseIds,
        completedLessons: completedLessonIds,
        currentCourseId: selectedCourseId,
        studentIdVerification: user?.studentIdVerification || 'none',
        assignmentEvaluations,
        revisionDeck,
        certificates,
        courseRatings,
        customLogoUrl,
        searchQuery,
        isSearchOpen,
        activeCertificate,
        languageMode,
        promoVideoUrl,
        paymentReceipts,
        lastPaymentReceipt,
        cookiePreferences,
        isCookieModalOpen,
        setIsCookieModalOpen,
        updateCookiePreferences,
        hasPaidForCourse,
        recordPaymentReceipt,
        setPromoVideoUrl,
        navigate,
        selectLesson,
        enrollInCourse,
        toggleLessonCompletion,
        saveEvaluation,
        checkAndAwardCertificate,
        submitCourseRating,
        addFlashcards,
        rateFlashcard,
        setCustomLogo,
        setSearchQuery,
        setIsSearchOpen,
        setActiveCertificate,
        setLanguageMode,
        submitStudentId,
        setVerificationStatus,
        getCurrentPrice,
        loginUser,
        logoutUser,
        registerUser,
        refreshCurrentUser,
        deleteCurrentAccount,
        resetProgressForDemo
      }}
    >
      {children}
    </AppContext.Provider>
  );
};

export const useApp = () => {
  const context = useContext(AppContext);
  if (!context) {
    throw new Error('useApp must be used within an AppProvider');
  }
  return context;
};
