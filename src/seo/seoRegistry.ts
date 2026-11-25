export interface SeoBlogInput {
  slug: string;
  title: string;
  seoTitle?: string;
  metaDescription: string;
  excerpt: string;
  contentMarkdown?: string;
  category: string;
  authorName: string;
  authorRole?: string;
  featuredImageUrl: string;
  featuredImageAlt?: string;
  readTimeMinutes?: number;
  primaryKeyword?: string;
  relatedCoursePath?: string;
  publishedAt: string;
  updatedAt?: string | Date | null;
}

export interface ResolvedSeoMetadata {
  statusCode: number;
  title: string;
  description: string;
  canonicalPath: string;
  canonicalUrl: string;
  robots: string;
  ogType: 'website' | 'article';
  ogImage: string;
  ogImageAlt: string;
  keywords: string;
  jsonLd: Record<string, any>[];
  ssrHtml: string;
}

export const KEYWORD_MAP = [
  {
    page: '/',
    primaryKeyword: 'AI learning platform',
    secondaryKeywords: ['personal AI teacher', 'one-to-one AI learning', 'personalized online learning'],
    searchIntent: 'Navigational / Commercial Investigation',
    competitionLevel: 'High (Broad Category)'
  },
  {
    page: '/courses/video-editing',
    primaryKeyword: 'learn video editing online',
    secondaryKeywords: ['video editing course for beginners', 'hands-on video editing AI tutor'],
    searchIntent: 'Commercial / Course Discovery',
    competitionLevel: 'Medium-High'
  },
  {
    page: '/courses/davinci-resolve-for-beginners',
    primaryKeyword: 'learn DaVinci Resolve for beginners',
    secondaryKeywords: ['DaVinci Resolve course India', 'DaVinci Resolve AI tutoring'],
    searchIntent: 'Commercial / High-Intent Enrolment',
    competitionLevel: 'Medium'
  },
  {
    page: '/demo',
    primaryKeyword: 'online AI teacher',
    secondaryKeywords: ['AI personal tutor', 'interactive AI teaching'],
    searchIntent: 'Transactional Trial / Demo',
    competitionLevel: 'Medium'
  },
  {
    page: '/pricing',
    primaryKeyword: 'AI-powered education platform pricing',
    secondaryKeywords: ['DaVinci Resolve course price India ₹499', 'affordable video editing course'],
    searchIntent: 'Transactional / Evaluation',
    competitionLevel: 'Low-Medium (Branded / Long-tail)'
  },
  {
    page: '/blog/how-to-learn-video-editing-from-scratch',
    primaryKeyword: 'how to learn video editing from scratch',
    secondaryKeywords: ['beginner video editing roadmap', 'learn video editing step by step'],
    searchIntent: 'Informational',
    competitionLevel: 'Medium'
  },
  {
    page: '/blog/davinci-resolve-beginners-guide',
    primaryKeyword: 'DaVinci Resolve beginner guide',
    secondaryKeywords: ['DaVinci Resolve workspace pages explained', 'DaVinci Resolve free workflow'],
    searchIntent: 'Informational',
    competitionLevel: 'Medium'
  },
  {
    page: '/blog/how-ai-is-changing-online-education',
    primaryKeyword: 'how AI is changing online education',
    secondaryKeywords: ['interactive AI tutor vs passive video', 'AI tutor for students'],
    searchIntent: 'Informational',
    competitionLevel: 'Medium'
  },
  {
    page: '/blog/how-to-learn-new-skills-with-an-ai-tutor',
    primaryKeyword: 'learn new skills with AI tutor',
    secondaryKeywords: ['Socratic AI learning strategies', 'active recall tutoring'],
    searchIntent: 'Informational',
    competitionLevel: 'Low-Medium'
  },
  {
    page: '/blog/best-video-editing-skills-for-beginners',
    primaryKeyword: 'best video editing skills for beginners',
    secondaryKeywords: ['video editing shortcuts J K L', 'YouTube LUFS loudness editing'],
    searchIntent: 'Informational',
    competitionLevel: 'Medium'
  }
];

export const STATIC_PUBLIC_SITEMAP_ROUTES: Array<{
  path: string;
  changefreq: 'daily' | 'weekly' | 'monthly';
  priority: string;
}> = [
  { path: '/', changefreq: 'weekly', priority: '1.0' },
  { path: '/courses', changefreq: 'weekly', priority: '0.9' },
  { path: '/courses/video-editing', changefreq: 'weekly', priority: '0.9' },
  { path: '/courses/davinci-resolve-for-beginners', changefreq: 'weekly', priority: '0.9' },
  { path: '/demo', changefreq: 'weekly', priority: '0.8' },
  { path: '/pricing', changefreq: 'weekly', priority: '0.8' },
  { path: '/blog', changefreq: 'weekly', priority: '0.8' },
  { path: '/about', changefreq: 'monthly', priority: '0.6' },
  { path: '/help', changefreq: 'monthly', priority: '0.6' },
  { path: '/contact', changefreq: 'monthly', priority: '0.5' },
  { path: '/privacy', changefreq: 'monthly', priority: '0.4' },
  { path: '/terms', changefreq: 'monthly', priority: '0.4' },
  { path: '/child-safety', changefreq: 'monthly', priority: '0.4' },
  { path: '/ai-disclosure', changefreq: 'monthly', priority: '0.4' },
  { path: '/refund-policy', changefreq: 'monthly', priority: '0.4' },
  { path: '/cookie-policy', changefreq: 'monthly', priority: '0.4' }
];

export const COURSE_LANDING_FAQS = {
  videoEditing: [
    {
      q: 'Do I need any prior video editing experience before enrolling?',
      a: 'No prior editing experience is required. The curriculum begins with project organization, basic cuts, and keyboard workflow before progressing to audio balancing and primary color correction.'
    },
    {
      q: 'Which software do we practice inside the video editing course?',
      a: 'All practical exercises use DaVinci Resolve (Free or Studio). Your personal AI Teacher guides you step-by-step on your real workstation rather than simulated videos.'
    },
    {
      q: 'How does the 1-on-1 AI Teacher help when I get stuck?',
      a: 'You can speak using your microphone or type questions in English or Hindi/Hinglish, paste timeline screenshots for multimodal troubleshooting, and submit practical tasks graded on a 10-point rubric.'
    },
    {
      q: 'What does the course cost for students vs standard learners?',
      a: 'The subsidized Student Plan is ₹499 INR (one-time) and the Regular Plan is ₹1,899 INR, covering all 8 structured modules and 43 guided lessons.'
    }
  ],
  davinciResolve: [
    {
      q: 'Does DaVinci Resolve Free work for all 8 modules of this course?',
      a: 'Yes. The entire 8-module, 43-lesson curriculum works cleanly on Blackmagic Design’s free DaVinci Resolve edition—no paid Studio license or watermark removal subscription is required to start.'
    },
    {
      q: 'What is included in the 8 modules and 43 guided lessons?',
      a: 'You cover installation & GPU settings, Cut Page speed assembly, Edit Page precision trimming (Ripple, Roll, Slip), transitions, Fairlight dialogue & -14 LUFS mixing, Color page nodes & Vectorscopes, Fusion titles, and 4K YouTube / 9:16 Reels exports.'
    },
    {
      q: 'Are TUTeach certificates accredited university degrees?',
      a: 'No. TUTeach awards a platform completion certificate verifiable by code when you complete all modules and pass practical workflow tasks (minimum 5.0/10 rubric threshold). It is not an accredited degree or Blackmagic Design official certification.'
    },
    {
      q: 'Can I test the AI Teacher before creating an account or paying?',
      a: 'Yes. You can start a free 5-minute interactive voice & vision demo in English or Hindi/Hinglish without entering card details.'
    }
  ]
};

export function escapeHtml(str: string): string {
  return String(str || '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}

function normalizeOrigin(origin: string): string {
  const clean = (origin || 'https://tuteach.ai').replace(/\/+$/, '');
  return clean;
}

function buildOrgAndWebsiteJsonLd(baseUrl: string) {
  const org = {
    '@context': 'https://schema.org',
    '@type': 'Organization',
    name: 'TUTeach',
    url: baseUrl,
    logo: `${baseUrl}/assets/aistudio/tuteach_logo_b6133804.png`,
    description:
      'TUTeach is an AI-powered learning platform designed to help students develop practical skills through personalized, interactive AI teaching.',
    founder: {
      '@type': 'Organization',
      name: 'Anmol Creates'
    }
  };
  const website = {
    '@context': 'https://schema.org',
    '@type': 'WebSite',
    name: 'TUTeach',
    url: baseUrl,
    potentialAction: {
      '@type': 'SearchAction',
      target: `${baseUrl}/courses?q={search_term_string}`,
      'query-input': 'required name=search_term_string'
    }
  };
  return { org, website };
}

function buildBreadcrumbJsonLd(baseUrl: string, items: Array<{ name: string; path: string }>) {
  return {
    '@context': 'https://schema.org',
    '@type': 'BreadcrumbList',
    itemListElement: items.map((item, idx) => ({
      '@type': 'ListItem',
      position: idx + 1,
      name: item.name,
      item: `${baseUrl}${item.path}`
    }))
  };
}

function buildCourseJsonLd(baseUrl: string, path: string, title: string, description: string, image: string) {
  return {
    '@context': 'https://schema.org',
    '@type': 'Course',
    name: title,
    description,
    url: `${baseUrl}${path}`,
    image: `${baseUrl}${image}`,
    provider: {
      '@type': 'Organization',
      name: 'TUTeach',
      url: baseUrl
    },
    inLanguage: ['en', 'hi'],
    educationalLevel: 'Beginner',
    offers: [
      {
        '@type': 'Offer',
        name: 'Student Plan',
        category: 'Paid',
        price: '499',
        priceCurrency: 'INR',
        availability: 'https://schema.org/InStock',
        url: `${baseUrl}${path}`
      },
      {
        '@type': 'Offer',
        name: 'Regular Plan',
        category: 'Paid',
        price: '1899',
        priceCurrency: 'INR',
        availability: 'https://schema.org/InStock',
        url: `${baseUrl}${path}`
      }
    ],
    hasCourseInstance: {
      '@type': 'CourseInstance',
      courseMode: 'online',
      courseWorkload: 'PT42H'
    }
  };
}

function buildFaqJsonLd(faqs: Array<{ q: string; a: string }>) {
  return {
    '@context': 'https://schema.org',
    '@type': 'FAQPage',
    mainEntity: faqs.map((item) => ({
      '@type': 'Question',
      name: item.q,
      acceptedAnswer: {
        '@type': 'Answer',
        text: item.a
      }
    }))
  };
}

function buildSsrMarkup(title: string, description: string, canonicalUrl: string, links: Array<{ href: string; label: string }>, extraHtml = ''): string {
  const navLinks = links
    .map((l) => `<a href="${escapeHtml(l.href)}">${escapeHtml(l.label)}</a>`)
    .join(' · ');
  return `<div data-seo-ssr="true" style="max-width:720px;margin:2rem auto;padding:1.5rem;font-family:'Plus Jakarta Sans',system-ui,sans-serif;color:#393636;"><h1 style="font-size:1.75rem;font-weight:800;margin-bottom:0.75rem;">${escapeHtml(title)}</h1><p style="line-height:1.6;margin-bottom:1rem;">${escapeHtml(description)}</p>${extraHtml}<nav aria-label="TUTeach navigation" style="font-size:0.875rem;margin-top:1.25rem;">${navLinks}</nav><p style="font-size:0.75rem;margin-top:1rem;opacity:0.7;">Canonical: ${escapeHtml(canonicalUrl)}</p></div>`;
}

export function resolveSeoForPath(
  rawPathname: string,
  origin: string,
  blogPost?: SeoBlogInput | null
): ResolvedSeoMetadata {
  const baseUrl = normalizeOrigin(origin);
  const normalizedPath = '/' + (rawPathname || '/').replace(/^\/+|\/+$/g, '').toLowerCase();
  const path = normalizedPath === '/' ? '/' : normalizedPath;

  const { org, website } = buildOrgAndWebsiteJsonLd(baseUrl);
  const defaultOgImage = '/assets/seo/tuteach-og-showcase.jpg';
  const defaultOgAlt = 'TUTeach studio workstation showing interactive video editing workspace';

  const coreLinks = [
    { href: '/', label: 'Home' },
    { href: '/courses', label: 'Course Catalog' },
    { href: '/courses/video-editing', label: 'Video Editing Course' },
    { href: '/courses/davinci-resolve-for-beginners', label: 'DaVinci Resolve for Beginners' },
    { href: '/blog', label: 'Educational Blog' },
    { href: '/pricing', label: 'Pricing' },
    { href: '/demo', label: 'Free 5-Min AI Demo' }
  ];

  // Strictly noindex private / auth / admin / checkout / consent routes
  const isPrivateOrAuth =
    path === '/login' ||
    path === '/register' ||
    path === '/forgot-password' ||
    path === '/dashboard' ||
    path === '/my-courses' ||
    path === '/assignments' ||
    path === '/progress' ||
    path === '/certificates' ||
    path === '/certificate' ||
    path === '/revision' ||
    path === '/payment-result' ||
    path === '/parental-consent' ||
    path === '/admin-compliance' ||
    path === '/compliance-admin' ||
    path.startsWith('/classroom') ||
    path.startsWith('/checkout');

  if (isPrivateOrAuth) {
    const canonicalUrl = `${baseUrl}${path}`;
    const title = 'TUTeach Student Portal';
    const description = 'Private authenticated workspace and account controls for TUTeach learners.';
    return {
      statusCode: 200,
      title,
      description,
      canonicalPath: path,
      canonicalUrl,
      robots: 'noindex, nofollow',
      ogType: 'website',
      ogImage: defaultOgImage,
      ogImageAlt: defaultOgAlt,
      keywords: '',
      jsonLd: [],
      ssrHtml: buildSsrMarkup(title, description, canonicalUrl, coreLinks)
    };
  }

  // 1. Homepage
  if (path === '/' || path === '/home') {
    const canonicalUrl = `${baseUrl}/`;
    const title = 'TUTeach — Learn Anything with Your Personal AI Teacher';
    const description =
      'Interactive AI learning platform with a 1-on-1 personal AI teacher for voice Q&A, screenshot inspection, practical DaVinci Resolve modules, and rubric feedback.';
    const softwareApp = {
      '@context': 'https://schema.org',
      '@type': 'SoftwareApplication',
      name: 'TUTeach AI Learning Platform',
      applicationCategory: 'EducationalApplication',
      operatingSystem: 'Web Browser',
      description,
      offers: {
        '@type': 'Offer',
        price: '499',
        priceCurrency: 'INR'
      }
    };
    return {
      statusCode: 200,
      title,
      description,
      canonicalPath: '/',
      canonicalUrl,
      robots: 'index, follow',
      ogType: 'website',
      ogImage: '/assets/seo/tuteach-og-showcase.jpg',
      ogImageAlt: defaultOgAlt,
      keywords: 'AI learning platform, personal AI teacher, online AI teacher, one-to-one AI learning, learn DaVinci Resolve',
      jsonLd: [org, website, softwareApp],
      ssrHtml: buildSsrMarkup(
        'TUTeach — Learn Anything with Your Personal AI Teacher',
        description,
        canonicalUrl,
        coreLinks,
        '<h2>1-on-1 Voice Mentoring &amp; DaVinci Resolve Practical Training</h2><p>Practice on real editing software with bilingual English and Hindi/Hinglish guidance, 10-point rubric grading, and verified completion certificates.</p>'
      )
    };
  }

  // 2. Course Catalog
  if (path === '/courses' || path === '/catalog') {
    const canonicalUrl = `${baseUrl}/courses`;
    const title = 'Course Catalog — Interactive AI Courses | TUTeach';
    const description =
      'Explore interactive courses taught by your personal AI Teacher. Enroll in the 8-module Video Editing with DaVinci Resolve masterclass or try the free demo.';
    return {
      statusCode: 200,
      title,
      description,
      canonicalPath: '/courses',
      canonicalUrl,
      robots: 'index, follow',
      ogType: 'website',
      ogImage: '/assets/seo/course-video-editing.jpg',
      ogImageAlt: 'TUTeach Video Editing Course Catalog overview',
      keywords: 'AI learning courses, online video editing course, DaVinci Resolve curriculum',
      jsonLd: [org, buildBreadcrumbJsonLd(baseUrl, [{ name: 'Home', path: '/' }, { name: 'Courses', path: '/courses' }])],
      ssrHtml: buildSsrMarkup(
        'TUTeach Course Catalog',
        description,
        canonicalUrl,
        coreLinks
      )
    };
  }

  // 3. Dedicated Course Landing Page 1: Video Editing
  if (path === '/courses/video-editing') {
    const canonicalUrl = `${baseUrl}/courses/video-editing`;
    const title = 'Learn Video Editing Online with a 1-on-1 AI Tutor | TUTeach';
    const description =
      'Learn video editing from scratch through interactive voice dialogue, screen feedback, and 8 practical modules in DaVinci Resolve. Student plan ₹499 INR.';
    return {
      statusCode: 200,
      title,
      description,
      canonicalPath: '/courses/video-editing',
      canonicalUrl,
      robots: 'index, follow',
      ogType: 'website',
      ogImage: '/assets/seo/course-video-editing.jpg',
      ogImageAlt: 'Video editing beginner workstation displaying multi-track timeline and waveforms',
      keywords: 'learn video editing online, video editing course for beginners, AI video editing tutor',
      jsonLd: [
        org,
        buildBreadcrumbJsonLd(baseUrl, [
          { name: 'Home', path: '/' },
          { name: 'Courses', path: '/courses' },
          { name: 'Video Editing', path: '/courses/video-editing' }
        ]),
        buildCourseJsonLd(baseUrl, '/courses/video-editing', 'Learn Video Editing Online (8-Module Guided Program)', description, '/assets/seo/course-video-editing.jpg'),
        buildFaqJsonLd(COURSE_LANDING_FAQS.videoEditing)
      ],
      ssrHtml: buildSsrMarkup(
        'Learn Video Editing Online with Your Personal AI Teacher',
        description,
        canonicalUrl,
        coreLinks
      )
    };
  }

  // 4. Dedicated Course Landing Page 2: DaVinci Resolve for Beginners
  if (path === '/courses/davinci-resolve-for-beginners' || path === '/course/course-davinci-resolve') {
    const canonicalPath =
      path === '/course/course-davinci-resolve'
        ? '/courses/davinci-resolve-for-beginners'
        : '/courses/davinci-resolve-for-beginners';
    const canonicalUrl = `${baseUrl}${canonicalPath}`;
    const title = 'DaVinci Resolve for Beginners — 8-Module AI Course | TUTeach';
    const description =
      'Master DaVinci Resolve Free step-by-step: Media Pool, Cut & Edit pages, Blade trimming, Fairlight audio mixing, Color nodes, and 4K exports with TUTutor AI.';
    return {
      statusCode: 200,
      title,
      description,
      canonicalPath,
      canonicalUrl,
      robots: 'index, follow',
      ogType: 'website',
      ogImage: '/assets/seo/course-davinci-resolve.jpg',
      ogImageAlt: 'DaVinci Resolve color grading workstation with Lift Gamma Gain wheels and RGB Parade scopes',
      keywords: 'learn DaVinci Resolve for beginners, DaVinci Resolve course India, Fairlight audio and color grading course',
      jsonLd: [
        org,
        buildBreadcrumbJsonLd(baseUrl, [
          { name: 'Home', path: '/' },
          { name: 'Courses', path: '/courses' },
          { name: 'DaVinci Resolve for Beginners', path: '/courses/davinci-resolve-for-beginners' }
        ]),
        buildCourseJsonLd(baseUrl, '/courses/davinci-resolve-for-beginners', 'Video Editing with DaVinci Resolve for Beginners', description, '/assets/seo/course-davinci-resolve.jpg'),
        buildFaqJsonLd(COURSE_LANDING_FAQS.davinciResolve)
      ],
      ssrHtml: buildSsrMarkup(
        'DaVinci Resolve for Beginners — 8-Module Guided Course',
        description,
        canonicalUrl,
        coreLinks
      )
    };
  }

  // 5. Free Demo Page
  if (path === '/demo') {
    const canonicalUrl = `${baseUrl}/demo`;
    const title = 'Try Your Personal AI Teacher Free (5-Min Demo) | TUTeach';
    const description =
      'Speak with Golu Guru, TUTeach’s 1-on-1 AI Teacher, for 5 minutes in English or Hindi/Hinglish. No card or account required to preview interactive AI teaching.';
    return {
      statusCode: 200,
      title,
      description,
      canonicalPath: '/demo',
      canonicalUrl,
      robots: 'index, follow',
      ogType: 'website',
      ogImage: '/assets/seo/blog-ai-mentor.jpg',
      ogImageAlt: 'Interactive one-to-one AI tutor demo illustration',
      keywords: 'online AI teacher, interactive AI teaching demo, AI personal tutor preview',
      jsonLd: [
        org,
        buildBreadcrumbJsonLd(baseUrl, [{ name: 'Home', path: '/' }, { name: 'Free AI Demo', path: '/demo' }])
      ],
      ssrHtml: buildSsrMarkup(title, description, canonicalUrl, coreLinks)
    };
  }

  // 6. Pricing Page
  if (path === '/pricing') {
    const canonicalUrl = `${baseUrl}/pricing`;
    const title = 'Transparent Pricing — ₹499 Student Plan & ₹1,899 Standard | TUTeach';
    const description =
      'Simple Indian pricing for interactive AI tutoring: ₹499 Student Plan and ₹1,899 Standard Plan covering all 8 DaVinci Resolve modules, rubrics, and certificates.';
    return {
      statusCode: 200,
      title,
      description,
      canonicalPath: '/pricing',
      canonicalUrl,
      robots: 'index, follow',
      ogType: 'website',
      ogImage: defaultOgImage,
      ogImageAlt: defaultOgAlt,
      keywords: 'TUTeach pricing, DaVinci Resolve course price ₹499, AI tutor course cost India',
      jsonLd: [
        org,
        buildBreadcrumbJsonLd(baseUrl, [{ name: 'Home', path: '/' }, { name: 'Pricing', path: '/pricing' }])
      ],
      ssrHtml: buildSsrMarkup('Transparent Course Pricing', description, canonicalUrl, coreLinks)
    };
  }

  // 7. Blog Index
  if (path === '/blog') {
    const canonicalUrl = `${baseUrl}/blog`;
    const title = 'Educational Blog — Video Editing & AI Learning Guides | TUTeach';
    const description =
      'Practical beginner guides on DaVinci Resolve workflows, video editing fundamentals, audio loudness, and effective study habits with a 1-on-1 AI tutor.';
    return {
      statusCode: 200,
      title,
      description,
      canonicalPath: '/blog',
      canonicalUrl,
      robots: 'index, follow',
      ogType: 'website',
      ogImage: '/assets/seo/blog-ai-mentor.jpg',
      ogImageAlt: 'TUTeach Educational Blog on AI learning and video editing',
      keywords: 'video editing tutorials blog, DaVinci Resolve guides, AI education insights',
      jsonLd: [
        org,
        buildBreadcrumbJsonLd(baseUrl, [{ name: 'Home', path: '/' }, { name: 'Blog', path: '/blog' }]),
        {
          '@context': 'https://schema.org',
          '@type': 'Blog',
          name: 'TUTeach Educational Blog',
          url: canonicalUrl,
          description,
          publisher: { '@type': 'Organization', name: 'TUTeach' }
        }
      ],
      ssrHtml: buildSsrMarkup('TUTeach Educational Blog', description, canonicalUrl, coreLinks)
    };
  }

  // 8. Individual Blog Post (/blog/:slug)
  if (path.startsWith('/blog/') && blogPost) {
    const canonicalPath = `/blog/${blogPost.slug}`;
    const canonicalUrl = `${baseUrl}${canonicalPath}`;
    const title = blogPost.seoTitle || `${blogPost.title} | TUTeach`;
    const description = blogPost.metaDescription || blogPost.excerpt;
    const modifiedIso =
      blogPost.updatedAt instanceof Date
        ? blogPost.updatedAt.toISOString().slice(0, 10)
        : blogPost.updatedAt
          ? String(blogPost.updatedAt).slice(0, 10)
          : blogPost.publishedAt;

    return {
      statusCode: 200,
      title,
      description,
      canonicalPath,
      canonicalUrl,
      robots: 'index, follow',
      ogType: 'article',
      ogImage: blogPost.featuredImageUrl || '/assets/seo/blog-ai-mentor.jpg',
      ogImageAlt: blogPost.featuredImageAlt || blogPost.title,
      keywords: blogPost.primaryKeyword || 'video editing, DaVinci Resolve, AI learning',
      jsonLd: [
        org,
        buildBreadcrumbJsonLd(baseUrl, [
          { name: 'Home', path: '/' },
          { name: 'Blog', path: '/blog' },
          { name: blogPost.title, path: canonicalPath }
        ]),
        {
          '@context': 'https://schema.org',
          '@type': 'Article',
          headline: blogPost.title,
          description,
          image: [`${baseUrl}${blogPost.featuredImageUrl || '/assets/seo/blog-ai-mentor.jpg'}`],
          datePublished: blogPost.publishedAt,
          dateModified: modifiedIso,
          author: {
            '@type': 'Organization',
            name: blogPost.authorName || 'Anmol Creates Editorial Team'
          },
          publisher: {
            '@type': 'Organization',
            name: 'TUTeach',
            logo: {
              '@type': 'ImageObject',
              url: `${baseUrl}/assets/aistudio/tuteach_logo_b6133804.png`
            }
          },
          mainEntityOfPage: {
            '@type': 'WebPage',
            '@id': canonicalUrl
          }
        }
      ],
      ssrHtml: buildSsrMarkup(
        blogPost.title,
        description,
        canonicalUrl,
        coreLinks,
        `<p><strong>${escapeHtml(blogPost.category)}</strong> · ${escapeHtml(blogPost.authorName)} · Published ${escapeHtml(blogPost.publishedAt)}</p>`
      )
    };
  }

  // 9. Public Info & Legal Pages
  const publicMetaMap: Record<string, { title: string; desc: string; isFaq?: boolean }> = {
    '/about': {
      title: 'About TUTeach — Interactive 1-on-1 AI Education | Anmol Creates',
      desc: 'Learn how Anmol Creates engineered TUTeach to combine interactive AI voice guidance, multimodal screen help, and verifiable practical skill rubrics.'
    },
    '/contact': {
      title: 'Contact Support & Grievance Desk | TUTeach',
      desc: 'Reach TUTeach support for course, billing, or classroom assistance, or visit the dedicated grievance redressal portal.'
    },
    '/help': {
      title: 'Help & Frequently Asked Questions | TUTeach',
      desc: 'Answers on how TUTeach works, DaVinci Resolve Free compatibility, 10-point practical rubric grading, and completion certificates.',
      isFaq: true
    },
    '/privacy': {
      title: 'Privacy Policy & Data Governance | TUTeach',
      desc: 'How TUTeach handles personal data under India DPDP, US COPPA, and EU GDPR frameworks, including PII scrubbing and retention schedules.'
    },
    '/terms': {
      title: 'Terms & Conditions | TUTeach',
      desc: 'Platform usage terms, academic honesty rules, payment conditions, and certificate eligibility standards for TUTeach learners.'
    },
    '/student-agreement': {
      title: 'Student User Agreement | TUTeach',
      desc: 'Student classroom guidelines, practical assignment originality standards, and completion rules on TUTeach.'
    },
    '/child-safety': {
      title: 'Child Protection & Parental Consent Policy | TUTeach',
      desc: 'Regional minor thresholds (India <18, US <13, EU Art. 8), parental verification workflows, and advertising restrictions for minors.'
    },
    '/ai-disclosure': {
      title: 'AI Usage & Transparency Disclosure | TUTeach',
      desc: 'Transparent explanation of how Golu Guru operates as a Google Gemini AI tutor, safety filters, and human-reviewed course design.'
    },
    '/refund-policy': {
      title: 'Payment, Cancellation & Refund Policy | TUTeach',
      desc: 'Transparent Razorpay INR checkout terms, ₹499 Student Plan pricing, statutory accounting retention, and refund request procedure.'
    },
    '/cookie-policy': {
      title: 'Cookie & Tracking Preferences Policy | TUTeach',
      desc: 'Details on Strictly Necessary session cookies, optional Functional/Analytics controls, and minor advertising restrictions on TUTeach.'
    },
    '/acceptable-use': {
      title: 'Acceptable Use Policy | TUTeach',
      desc: 'Permitted academic use, prompt safety rules, and prohibited abuse policies on the TUTeach learning platform.'
    },
    '/ip-disclaimer': {
      title: 'Intellectual Property & Third-Party Software Notice | TUTeach',
      desc: 'Clarification of TUTeach copyright ownership and independence from Blackmagic Design and DaVinci Resolve trademarks.'
    },
    '/certificate-disclaimer': {
      title: 'Certificate Authenticity Disclaimer | TUTeach',
      desc: 'Explains TUTeach code-verified completion credentials and clarifies they are non-degree practical skill certificates.'
    },
    '/grievance-policy': {
      title: 'Grievance Redressal Policy | TUTeach',
      desc: 'Escalation channels, response SLAs, and Grievance Officer reporting mechanisms for learners and parents.'
    },
    '/data-retention': {
      title: 'Data Retention & Erasure Schedule | TUTeach',
      desc: 'Retention periods across sessions, transient screenshots, AI conversation logs, account deletion, and statutory financial records.'
    },
    '/third-party-processors': {
      title: 'Third-Party Service Providers Disclosure | TUTeach',
      desc: 'Inventory of external infrastructure and API processors used by TUTeach including Google Gemini and Razorpay.'
    },
    '/security-practices': {
      title: 'Security Practices & Incident Notification | TUTeach',
      desc: 'Password hashing, HMAC webhook verification, session management, and security incident reporting practices on TUTeach.'
    },
    '/grievance': {
      title: 'Submit or Track a Grievance | TUTeach',
      desc: 'File a privacy, safety, billing, or AI response concern and track resolution progress using your reference code.'
    },
    '/grievance-form': {
      title: 'Submit or Track a Grievance | TUTeach',
      desc: 'File a privacy, safety, billing, or AI response concern and track resolution progress using your reference code.'
    }
  };

  const publicEntry = publicMetaMap[path];
  if (publicEntry) {
    const cleanCanonPath = path === '/grievance-form' ? '/grievance' : path;
    const canonicalUrl = `${baseUrl}${cleanCanonPath}`;
    const ld: Record<string, any>[] = [
      org,
      buildBreadcrumbJsonLd(baseUrl, [
        { name: 'Home', path: '/' },
        { name: publicEntry.title.split(' | ')[0], path: cleanCanonPath }
      ])
    ];
    return {
      statusCode: 200,
      title: publicEntry.title,
      description: publicEntry.desc,
      canonicalPath: cleanCanonPath,
      canonicalUrl,
      robots: 'index, follow',
      ogType: 'website',
      ogImage: defaultOgImage,
      ogImageAlt: defaultOgAlt,
      keywords: 'TUTeach, AI education, DaVinci Resolve learning',
      jsonLd: ld,
      ssrHtml: buildSsrMarkup(publicEntry.title, publicEntry.desc, canonicalUrl, coreLinks)
    };
  }

  // 10. Custom 404 Not Found (both unresolved /blog/:missing and unknown routes)
  const canonicalUrl = `${baseUrl}${path}`;
  const title = '404 — Page Not Found | TUTeach';
  const description =
    'The page you are looking for does not exist or may have moved. Browse TUTeach courses, our educational blog, or start the free 5-minute AI Teacher demo.';
  return {
    statusCode: 404,
    title,
    description,
    canonicalPath: path,
    canonicalUrl,
    robots: 'noindex, follow',
    ogType: 'website',
    ogImage: defaultOgImage,
    ogImageAlt: defaultOgAlt,
    keywords: '',
    jsonLd: [],
    ssrHtml: buildSsrMarkup(title, description, canonicalUrl, coreLinks)
  };
}
