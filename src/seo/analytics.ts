import { CookiePreferences, User } from '../types';

declare global {
  interface Window {
    dataLayer?: any[];
    gtag?: (...args: any[]) => void;
    [key: `ga-disable-${string}`]: boolean | undefined;
  }
}

let loadedMeasurementId: string | null = null;
let analyticsAllowed = false;
let restrictedMinorMode = false;

export function getConfiguredGa4MeasurementId(): string | null {
  try {
    const raw = (import.meta as any)?.env?.VITE_GA4_MEASUREMENT_ID || '';
    const trimmed = String(raw).trim();
    if (/^G-[A-Z0-9]{4,}$/i.test(trimmed)) {
      return trimmed;
    }
  } catch {}
  return null;
}

export function isAnalyticsEnabled(): boolean {
  return analyticsAllowed && Boolean(getConfiguredGa4MeasurementId());
}

/**
 * Sync Google Analytics 4 consent state strictly from cookie preferences + user minor protection flags.
 * - Analytics scripts NEVER load unless user explicitly opted in (analytics === true).
 * - Behavioral advertising / ad personalization signals are ALWAYS forced OFF across platform.
 */
export function syncAnalyticsConsent(
  prefs: CookiePreferences | null,
  user: User | null
): void {
  if (typeof window === 'undefined') return;
  const measurementId = getConfiguredGa4MeasurementId();
  const consentGranted = Boolean(prefs?.analytics === true);
  restrictedMinorMode = Boolean(user?.isMinor);
  analyticsAllowed = consentGranted;

  if (!measurementId) return;

  // Enforce browser disable flag immediately if consent is missing or withdrawn
  window[`ga-disable-${measurementId}`] = !consentGranted;

  if (!consentGranted) {
    if (typeof window.gtag === 'function') {
      window.gtag('consent', 'update', {
        analytics_storage: 'denied',
        ad_storage: 'denied',
        ad_user_data: 'denied',
        ad_personalization: 'denied'
      });
    }
    return;
  }

  // Consent granted: initialize gtag lazily once per measurement ID
  if (loadedMeasurementId !== measurementId) {
    loadedMeasurementId = measurementId;
    window.dataLayer = window.dataLayer || [];
    window.gtag = function gtag() {
      // eslint-disable-next-line prefer-rest-params
      window.dataLayer!.push(arguments);
    };

    window.gtag('consent', 'default', {
      analytics_storage: 'granted',
      ad_storage: 'denied',
      ad_user_data: 'denied',
      ad_personalization: 'denied'
    });

    window.gtag('js', new Date());
    window.gtag('config', measurementId, {
      send_page_view: false,
      anonymize_ip: true,
      allow_google_signals: false,
      allow_ad_personalization_signals: false,
      restricted_data_processing: restrictedMinorMode
    });

    const existing = document.querySelector(`script[src*="googletagmanager.com/gtag/js?id=${measurementId}"]`);
    if (!existing) {
      const script = document.createElement('script');
      script.async = true;
      script.src = `https://www.googletagmanager.com/gtag/js?id=${encodeURIComponent(measurementId)}`;
      document.head.appendChild(script);
    }
  } else if (typeof window.gtag === 'function') {
    window.gtag('consent', 'update', {
      analytics_storage: 'granted',
      ad_storage: 'denied',
      ad_user_data: 'denied',
      ad_personalization: 'denied'
    });
  }
}

function sendSafeEvent(eventName: string, params: Record<string, string | number | boolean> = {}): void {
  if (typeof window === 'undefined') return;
  const measurementId = getConfiguredGa4MeasurementId();
  if (!measurementId || !analyticsAllowed || typeof window.gtag !== 'function') {
    return;
  }
  window.gtag('event', eventName, {
    ...params,
    non_interaction: false
  });
}

/** Sanitize path so query tokens/emails never touch analytics logs */
function cleanSafePath(pathname: string): string {
  return String(pathname || '/').split('?')[0].split('#')[0] || '/';
}

export function trackPageView(pathname: string, pageTitle: string): void {
  sendSafeEvent('page_view', {
    page_path: cleanSafePath(pathname),
    page_title: String(pageTitle || 'TUTeach').slice(0, 120)
  });
}

export function trackCourseSelect(courseId: string, courseTitle: string): void {
  sendSafeEvent('select_item', {
    item_id: courseId,
    item_name: courseTitle.slice(0, 100),
    content_type: 'course'
  });
}

export function trackSignUpStart(): void {
  sendSafeEvent('sign_up_start', {
    method: 'email'
  });
}

export function trackSignUpComplete(countryCode = 'IN'): void {
  sendSafeEvent('sign_up', {
    method: 'email',
    country_code: String(countryCode || 'IN').toUpperCase().slice(0, 8)
  });
}

export function trackBeginCheckout(courseId: string, priceInr: number): void {
  sendSafeEvent('begin_checkout', {
    currency: 'INR',
    value: Number(priceInr) || 499,
    item_id: courseId
  });
}

export function trackPurchaseSuccess(courseId: string, amountInr: number, transactionId: string): void {
  sendSafeEvent('purchase', {
    transaction_id: String(transactionId || '').slice(0, 48),
    currency: 'INR',
    value: Number(amountInr) || 499,
    item_id: courseId
  });
}

export function trackLessonStart(courseId: string, lessonId: string): void {
  sendSafeEvent('lesson_start', {
    course_id: courseId,
    lesson_id: lessonId
  });
}

export function trackCourseComplete(courseId: string): void {
  sendSafeEvent('course_complete', {
    course_id: courseId
  });
}
