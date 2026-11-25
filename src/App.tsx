import React, { Suspense, lazy, useState } from 'react';
import { AppProvider, useApp } from './context/AppContext';
import { Header } from './components/common/Header';
import { Footer } from './components/common/Footer';
import { AnimatedLogoIntro } from './components/common/AnimatedLogoIntro';
import { HomePage } from './components/pages/HomePage';
import { CourseCatalogPage } from './components/pages/CourseCatalogPage';
import { CourseDetailsPage } from './components/pages/CourseDetailsPage';
import { PricingPage } from './components/pages/PricingPage';
import { ClassroomLockedGate } from './components/classroom/ClassroomLockedGate';
import { LoginPage, RegisterPage, ForgotPasswordPage } from './components/pages/AuthPages';
import { AboutPage, ContactPage, HelpPage } from './components/pages/PublicInfoPages';
import { CookieConsentBanner } from './components/common/CookieConsentBanner';
import { HeadManager } from './seo/HeadManager';
import { NotFoundPage } from './components/pages/NotFoundPage';

// Code-split heavy secondary routes to keep initial homepage bundle lean
const DemoClassroomPage = lazy(() =>
  import('./components/pages/DemoClassroomPage').then((m) => ({ default: m.DemoClassroomPage }))
);
const ClassroomPage = lazy(() =>
  import('./components/pages/ClassroomPage').then((m) => ({ default: m.ClassroomPage }))
);
const CourseLandingPage = lazy(() =>
  import('./components/pages/CourseLandingPage').then((m) => ({ default: m.CourseLandingPage }))
);
const BlogIndexPage = lazy(() =>
  import('./components/pages/BlogPages').then((m) => ({ default: m.BlogIndexPage }))
);
const BlogArticlePage = lazy(() =>
  import('./components/pages/BlogPages').then((m) => ({ default: m.BlogArticlePage }))
);
const CheckoutPage = lazy(() =>
  import('./components/pages/CheckoutPage').then((m) => ({ default: m.CheckoutPage }))
);
const PaymentResultPage = lazy(() =>
  import('./components/pages/PaymentResultPage').then((m) => ({ default: m.PaymentResultPage }))
);
const DashboardPage = lazy(() =>
  import('./components/pages/DashboardPage').then((m) => ({ default: m.DashboardPage }))
);
const MyCoursesPage = lazy(() =>
  import('./components/pages/MyCoursesPage').then((m) => ({ default: m.MyCoursesPage }))
);
const AssignmentsPage = lazy(() =>
  import('./components/pages/AssignmentsPage').then((m) => ({ default: m.AssignmentsPage }))
);
const LearningProgressPage = lazy(() =>
  import('./components/pages/LearningProgressPage').then((m) => ({ default: m.LearningProgressPage }))
);
const CertificatesPage = lazy(() =>
  import('./components/pages/CertificatesPage').then((m) => ({ default: m.CertificatesPage }))
);
const TargetedRevisionPage = lazy(() =>
  import('./components/pages/TargetedRevisionPage').then((m) => ({ default: m.TargetedRevisionPage }))
);
const LegalCenterPage = lazy(() =>
  import('./components/pages/LegalCenterPages').then((m) => ({ default: m.LegalCenterPage }))
);
const ParentalConsentPage = lazy(() =>
  import('./components/pages/ParentalConsentPage').then((m) => ({ default: m.ParentalConsentPage }))
);
const GrievancePage = lazy(() =>
  import('./components/pages/GrievancePage').then((m) => ({ default: m.GrievancePage }))
);
const AdminCompliancePage = lazy(() =>
  import('./components/pages/AdminCompliancePage').then((m) => ({ default: m.AdminCompliancePage }))
);

const RouteLoadingFallback: React.FC = () => (
  <div className="min-h-[60vh] flex items-center justify-center bg-[#FAF7EE] text-sm font-semibold text-[#393636]/70">
    Loading TUTeach view...
  </div>
);

const MainRouter: React.FC = () => {
  const { currentPage, selectedCourseId, hasPaidForCourse, user } = useApp();
  const [introDismissed, setIntroDismissed] = useState(false);

  const renderCurrentPage = () => {
    switch (currentPage) {
      case 'home':
        return <HomePage />;
      case 'demo':
        return <DemoClassroomPage />;
      case 'catalog':
        return <CourseCatalogPage />;
      case 'course-details':
        return <CourseDetailsPage />;
      case 'course-video-editing':
        return <CourseLandingPage variant="video-editing" />;
      case 'course-davinci-resolve':
        return <CourseLandingPage variant="davinci-resolve" />;
      case 'blog':
        return <BlogIndexPage />;
      case 'blog-post':
        return <BlogArticlePage />;
      case 'checkout':
        return <CheckoutPage />;
      case 'payment-result':
        return <PaymentResultPage />;
      case 'pricing':
        return <PricingPage />;
      case 'dashboard':
        return <DashboardPage />;
      case 'my-courses':
        return <MyCoursesPage />;
      case 'assignments':
        return <AssignmentsPage />;
      case 'progress':
        return <LearningProgressPage />;
      case 'certificates':
        return <CertificatesPage />;
      case 'classroom':
        if (user && user.complianceStatus && user.complianceStatus !== 'ACTIVE' && user.complianceStatus !== 'LEGACY_REVIEW') {
          return <ParentalConsentPage />;
        }
        if (!hasPaidForCourse(selectedCourseId)) {
          return <ClassroomLockedGate courseId={selectedCourseId} />;
        }
        return <ClassroomPage />;
      case 'revision':
        return <TargetedRevisionPage />;
      case 'login':
        return <LoginPage />;
      case 'register':
        return <RegisterPage />;
      case 'forgot-password':
        return <ForgotPasswordPage />;
      case 'about':
        return <AboutPage />;
      case 'contact':
        return <ContactPage />;
      case 'help':
        return <HelpPage />;
      case 'privacy':
      case 'terms':
      case 'student-agreement':
      case 'child-safety':
      case 'ai-disclosure':
      case 'refund-policy':
      case 'cookie-policy':
      case 'acceptable-use':
      case 'ip-disclaimer':
      case 'certificate-disclaimer':
      case 'grievance-policy':
      case 'data-retention':
      case 'third-party-processors':
      case 'security-practices':
        return <LegalCenterPage activePage={currentPage} />;
      case 'grievance-form':
        return <GrievancePage />;
      case 'parental-consent':
        return <ParentalConsentPage />;
      case 'admin-compliance':
        return <AdminCompliancePage />;
      case 'not-found':
        return <NotFoundPage />;
      default:
        return <NotFoundPage />;
    }
  };

  // Full-screen dedicated views (e.g. AI Teacher voice classroom & full-page demo)
  const isFullScreenClassroom = currentPage === 'classroom' || currentPage === 'demo';

  return (
    <div className="min-h-screen flex flex-col bg-[#EFEBDA] text-[#393636] font-sans antialiased selection:bg-[#F14C2F] selection:text-white">
      <HeadManager />
      {/* 1. Animated Logo Introduction (Plays on first visit with smooth glow & skip option) */}
      {!introDismissed && (
        <AnimatedLogoIntro onComplete={() => setIntroDismissed(true)} />
      )}

      {/* Main App Layout */}
      {!isFullScreenClassroom && <Header />}
      <main className="flex-1">
        <Suspense fallback={<RouteLoadingFallback />}>
          {renderCurrentPage()}
        </Suspense>
      </main>
      {!isFullScreenClassroom && <Footer />}
      <CookieConsentBanner />
    </div>
  );
};

export default function App() {
  return (
    <AppProvider>
      <MainRouter />
    </AppProvider>
  );
}
