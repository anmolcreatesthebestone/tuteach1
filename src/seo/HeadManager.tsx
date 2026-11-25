import React, { useEffect } from 'react';
import { useApp } from '../context/AppContext';
import { resolveSeoForPath } from './seoRegistry';
import { trackPageView } from './analytics';

function upsertMetaTag(attr: 'name' | 'property', key: string, content: string): void {
  if (!content) return;
  let el = document.head.querySelector(`meta[${attr}="${key}"]`) as HTMLMetaElement | null;
  if (!el) {
    el = document.createElement('meta');
    el.setAttribute(attr, key);
    document.head.appendChild(el);
  }
  el.setAttribute('content', content);
}

function upsertLinkTag(rel: string, href: string): void {
  let el = document.head.querySelector(`link[rel="${rel}"]`) as HTMLLinkElement | null;
  if (!el) {
    el = document.createElement('link');
    el.setAttribute('rel', rel);
    document.head.appendChild(el);
  }
  el.setAttribute('href', href);
}

export const HeadManager: React.FC = () => {
  const { currentPage, selectedCourseId, selectedBlogSlug, activeBlogPost } = useApp();

  useEffect(() => {
    if (typeof window === 'undefined') return;
    const origin = window.location.origin;
    const pathname = window.location.pathname;
    const seo = resolveSeoForPath(pathname, origin, activeBlogPost);

    document.title = seo.title;
    upsertMetaTag('name', 'description', seo.description);
    upsertMetaTag('name', 'robots', seo.robots);
    if (seo.keywords) {
      upsertMetaTag('name', 'keywords', seo.keywords);
    }

    const fullOgImage = seo.ogImage.startsWith('http') ? seo.ogImage : `${origin}${seo.ogImage}`;
    upsertLinkTag('canonical', seo.canonicalUrl);

    upsertMetaTag('property', 'og:type', seo.ogType);
    upsertMetaTag('property', 'og:site_name', 'TUTeach');
    upsertMetaTag('property', 'og:title', seo.title);
    upsertMetaTag('property', 'og:description', seo.description);
    upsertMetaTag('property', 'og:url', seo.canonicalUrl);
    upsertMetaTag('property', 'og:image', fullOgImage);
    upsertMetaTag('property', 'og:image:alt', seo.ogImageAlt);

    upsertMetaTag('name', 'twitter:card', 'summary_large_image');
    upsertMetaTag('name', 'twitter:title', seo.title);
    upsertMetaTag('name', 'twitter:description', seo.description);
    upsertMetaTag('name', 'twitter:image', fullOgImage);

    // Inject structured JSON-LD cleanly
    const existingScript = document.getElementById('tuteach-jsonld');
    if (seo.jsonLd.length > 0) {
      let script = existingScript as HTMLScriptElement | null;
      if (!script) {
        script = document.createElement('script');
        script.id = 'tuteach-jsonld';
        script.type = 'application/ld+json';
        document.head.appendChild(script);
      }
      script.textContent = JSON.stringify(seo.jsonLd.length === 1 ? seo.jsonLd[0] : seo.jsonLd);
    } else if (existingScript) {
      existingScript.remove();
    }

    // Track consent-aware page view (only fires when user opted in to analytics)
    trackPageView(pathname, seo.title);
  }, [currentPage, selectedCourseId, selectedBlogSlug, activeBlogPost]);

  return null;
};
