export type CourseLevel = 'Beginner' | 'Intermediate' | 'Advanced' | 'All Levels';

export type LanguageMode = 'english' | 'hindi_hinglish';

export interface RubricCriterion {
  name: string;
  weight: number; // sum to 10
  description: string;
}

export interface PracticalAssignment {
  id: string;
  title: string;
  prompt: string;
  starterWorkflow: string;
  submissionType: 'workflow_log' | 'text' | 'shortcuts' | 'edit_decision_list';
  requirements: string[];
  rubricCriteria: RubricCriterion[];
  sampleSolutionHint: string;
  softwareTarget: string; // e.g. "DaVinci Resolve"
  estimatedMinutes?: number;
}

export interface Lesson {
  id: string;
  title: string;
  durationMinutes: number;
  estimatedMinutes?: number;
  summary: string;
  detailedContent: string;
  keyTakeaways: string[];
  moduleNumber: number;
  lessonNumber: number;
  practicalAssignment?: PracticalAssignment;
}

export interface Module {
  id: string;
  moduleNumber: number;
  title: string;
  description: string;
  lessons: Lesson[];
}

export interface Course {
  id: string;
  slug: string;
  title: string;
  software: string;
  tagline: string;
  shortDescription: string;
  longDescription: string;
  description?: string;
  teachingLanguage?: string;
  category: 'Video Editing' | 'Creative Arts' | 'Media Production';
  level: CourseLevel;
  durationHours: number;
  rating: number;
  reviewsCount: number;
  enrolledCount: number;
  regularPriceInr: number; // ₹1,899
  studentPriceInr: number; // ₹499
  price?: number;
  badge?: string;
  featured?: boolean;
  aiTeacher: {
    name: string; // "TUTutor AI"
    role: string; // "Personal DaVinci Resolve AI Instructor"
    tagline: string;
    bio?: string;
  };
  instructor?: {
    name: string;
    role: string;
    bio: string;
  };
  prerequisites: string[];
  outcomes: string[];
  modules: Module[];
  certificateRequirements: {
    minimumLessonCompletionRate: number; // 100%
    minimumTaskScoreOutof10: number; // 5/10 to pass, 8+/10 for distinction
    minimumAssignmentScore?: number;
    allTasksAttempted: boolean;
  };
}

export interface CriterionScore {
  criterion: string;
  score: number; // e.g. out of 2.5
  maxScore: number;
  feedback: string;
}

export interface AssignmentEvaluation {
  id: string;
  courseId: string;
  lessonId: string;
  assignmentId: string;
  studentSubmission: string;
  attemptNumber: number; // 1 or 2
  score: number; // out of 10
  bestScore: number; // best of 2 attempts
  status: 'PASSED' | 'NEEDS_REVISION'; // score >= 5 is passed
  passed?: boolean;
  grade: 'Distinction' | 'Merit' | 'Pass' | 'Needs Revision';
  summary: string;
  feedback?: string;
  criteriaScores: CriterionScore[];
  strengths: string[];
  areasForImprovement: string[];
  improvements?: string[];
  targetedRevisionTopics: string[];
  actionableShortcutSuggestion?: string;
  specificAdvice?: string;
  evaluatedAt: string;
  source: string;
  canRetry: boolean;
  attemptCount?: number;
}

export interface Flashcard {
  id: string;
  topic: string;
  courseId?: string;
  question: string;
  answer: string;
  mnemonic?: string;
  difficulty: 'Easy' | 'Medium' | 'Hard';
  masteryScore?: number; // 0 to 100
}

export interface Certificate {
  id: string;
  verificationCode: string;
  courseId: string;
  courseTitle: string;
  software: string;
  studentName: string;
  studentEmail: string;
  issuedAt: string;
  issueDate?: string;
  totalHours?: number;
  scoreAverageOutof10: number;
  grade: string;
  skillsAcquired: string[];
}

export type StudentIdVerificationStatus = 'none' | 'pending' | 'verified' | 'rejected';

export type ComplianceAccountStatus =
  | 'ACTIVE'
  | 'PENDING_PARENTAL_CONSENT'
  | 'CONSENT_REJECTED'
  | 'CONSENT_WITHDRAWN'
  | 'COUNTRY_REVIEW_REQUIRED'
  | 'DELETION_PENDING'
  | 'DELETED_ANONYMIZED'
  | 'LEGACY_REVIEW';

export type ParentalConsentStatus =
  | 'NOT_REQUIRED'
  | 'PENDING'
  | 'VERIFIED'
  | 'REJECTED'
  | 'WITHDRAWN';

export interface CookiePreferences {
  essential: true;
  functional: boolean;
  analytics: boolean;
  advertising: boolean;
  updatedAt?: string;
}

export interface User {
  id: string;
  name: string;
  email: string;
  avatar?: string;
  role: 'student' | 'admin';
  targetGoals?: string;
  streakDays: number;
  totalStudyHours: number;
  enrolledCourseIds: string[];
  completedLessonIds: string[];
  completedCourseIds: string[];
  preferredLanguage: LanguageMode;
  // Student ID verification for ₹499 pricing
  studentIdVerification: StudentIdVerificationStatus;
  studentIdInstitution?: string;
  studentIdFileName?: string;
  verifiedPlanUnlocked: boolean;
  // Legal Compliance & Age Protection metadata
  countryCode?: string;
  dateOfBirth?: string | null;
  ageAtRegistration?: number | null;
  isMinor?: boolean;
  applicableFramework?: string;
  jurisdictionStatus?: string;
  requiresParentalConsent?: boolean;
  parentalConsentStatus?: ParentalConsentStatus;
  complianceStatus?: ComplianceAccountStatus;
  aiDisclosureAcceptedAt?: string | null;
  aiDisclosureVersion?: string | null;
  analyticsConsent?: boolean;
  functionalConsent?: boolean;
  marketingConsent?: boolean;
  pendingFreshPolicies?: Array<{
    policyKey: string;
    title: string;
    version: string;
    effectiveDate: string;
    summary: string;
  }>;
}

export type TutorMode = 'socratic' | 'eli5' | 'deep_dive' | 'concise';

export interface ChatMessage {
  id: string;
  sender: 'user' | 'tutor';
  text: string;
  timestamp: string;
  mode?: TutorMode;
  language?: LanguageMode;
  audioPlaying?: boolean;
  redactedPii?: string[];
}

export interface PaymentReceipt {
  transactionRef: string;
  courseId: string;
  courseTitle: string;
  amount: number;
  date: string;
  status: 'SUCCESS' | 'FAILED' | 'PENDING';
  paymentMethod: string;
  orderId?: string;
  paymentId?: string;
  failureReason?: string;
}

export type PageView =
  | 'home'
  | 'demo'
  | 'catalog'
  | 'course-details'
  | 'course-video-editing'
  | 'course-davinci-resolve'
  | 'blog'
  | 'blog-post'
  | 'not-found'
  | 'checkout'
  | 'payment-result'
  | 'pricing'
  | 'register'
  | 'login'
  | 'forgot-password'
  | 'about'
  | 'contact'
  | 'privacy'
  | 'terms'
  | 'help'
  | 'student-agreement'
  | 'child-safety'
  | 'ai-disclosure'
  | 'refund-policy'
  | 'cookie-policy'
  | 'acceptable-use'
  | 'ip-disclaimer'
  | 'certificate-disclaimer'
  | 'grievance-policy'
  | 'data-retention'
  | 'third-party-processors'
  | 'security-practices'
  | 'grievance-form'
  | 'parental-consent'
  | 'admin-compliance'
  | 'dashboard'
  | 'my-courses'
  | 'classroom'
  | 'assignments'
  | 'progress'
  | 'revision'
  | 'certificate'
  | 'certificates';


export interface CourseRating {
  courseId: string;
  rating: number; // 1 to 5
  review?: string;
  studentEmail?: string;
  studentName?: string;
  submittedAt: string;
}

export interface BlogPostItem {
  id: string;
  slug: string;
  title: string;
  seoTitle: string;
  metaDescription: string;
  excerpt: string;
  contentMarkdown: string;
  category: string;
  authorName: string;
  authorRole: string;
  featuredImageUrl: string;
  featuredImageAlt: string;
  readTimeMinutes: number;
  primaryKeyword: string;
  relatedCourseId: string;
  relatedCoursePath: string;
  status: 'DRAFT' | 'PUBLISHED' | 'ARCHIVED' | string;
  publishedAt: string;
  updatedAt?: string;
}


