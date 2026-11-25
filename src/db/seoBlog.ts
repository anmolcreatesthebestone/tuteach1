import crypto from 'crypto';
import { eq, desc } from 'drizzle-orm';
import { getDb } from './index.ts';
import * as schema from './schema.ts';
import { logComplianceAudit } from './compliance.ts';

let blogSeedPromise: Promise<void> | null = null;

export const INITIAL_BLOG_POSTS: Array<typeof schema.blogPosts.$inferInsert> = [
  {
    id: 'blog_learn_video_editing_scratch',
    slug: 'how-to-learn-video-editing-from-scratch',
    title: 'How to Learn Video Editing from Scratch: A Practical Beginner Roadmap',
    seoTitle: 'How to Learn Video Editing from Scratch | TUTeach',
    metaDescription:
      'Step-by-step beginner roadmap to learn video editing online without feeling overwhelmed—covering footage organization, cuts, pacing, audio, and export settings.',
    excerpt:
      'Learning video editing from scratch becomes manageable when you separate technical panels from storytelling decisions. Follow this five-stage beginner sequence.',
    category: 'Video Editing Guides',
    authorName: 'Anmol Creates Editorial Team',
    authorRole: 'Human-Reviewed Curriculum Editor',
    featuredImageUrl: '/assets/seo/course-video-editing.jpg',
    featuredImageAlt: 'Video editing desk setup showing a multi-track timeline and audio waveforms on a monitor',
    readTimeMinutes: 7,
    primaryKeyword: 'learn video editing from scratch',
    relatedCourseId: 'course-davinci-resolve',
    relatedCoursePath: '/courses/video-editing',
    status: 'PUBLISHED',
    publishedAt: '2026-11-20',
    contentMarkdown: `## Why Most Beginners Quit Video Editing Too Early

When beginners open a professional editing program for the first time, they are greeted by dozens of meters, bins, timelines, and color wheels at once. Trying to memorize every button before editing your first clip creates unnecessary friction.

A practical way to learn video editing from scratch is to master **one workflow stage at a time** on real software, rather than endlessly watching passive compilation videos without touching your keyboard.

## Stage 1: Organize Your Media Before Cutting a Single Frame

Professional editors spend their first ten minutes preparing the **Media Pool**:

- Create clear folders (also called **Bins**) for Raw Camera Footage, B-Roll, Dialogue Audio, Music, and Graphics.
- Keep original camera files untouched in one dedicated project folder on your drive so links never break.
- Preview clips and trim away dead air before dragging them to the timeline.

## Stage 2: Learn Core Timeline Mechanics and Keyboard Discipline

Speed comes from learning five foundational actions instead of fighting nested menus:

1. **Selection Tool (A):** Grab, slide, and trim clip edges cleanly.
2. **Blade Tool (B):** Split clips cleanly at natural pauses or visual beats.
3. **Snapping (N):** Prevent accidental one-frame gaps between cuts.
4. **Ripple Delete (Shift + Backspace):** Remove an unwanted mistake and pull the rest of the edit shut in one keystroke.
5. **J-K-L Playback:** Shuttle backward, pause, or play forward at double speed using only three right-hand keys.

## Stage 3: Balance Dialogue Audio Before Touching Visual Effects

Viewers forgive an imperfect color grade far faster than clipped or buried speech. Before adding transitions:

- Set spoken dialogue cleanly around **-12 dBFS to -6 dBFS** peaks so voices sound clear without distortion.
- Lower background music underneath speech so music supports emotion without masking words.
- Target integrated web loudness standards (typically **-14.0 LUFS**) when rendering for YouTube.

## Stage 4: Apply Clean Color Balance and Scopes

Instead of dragging saturation sliders blindly, read your **Waveform** and **Vectorscope** to keep highlights below clipping and human skin tones natural. Start with Lift (shadows), Gamma (midtones), and Gain (highlights) before styling shadows or teal-orange looks.

## Stage 5: Practice with Feedback Inside TUTeach

Passive video tutorials cannot see whether your track snapping was turned off or why an audio gap appeared. Inside TUTeach, your personal AI Teacher guides you step-by-step on DaVinci Resolve, inspects your timeline screenshots when you get stuck, and evaluates your workflow exercises on a transparent 10-point rubric. You can test the interactive voice and vision mentor in our free 5-minute demo before enrolling.`
  },
  {
    id: 'blog_davinci_resolve_beginners_guide',
    slug: 'davinci-resolve-beginners-guide',
    title: 'DaVinci Resolve Beginner’s Guide: Media, Cut, Edit, Fairlight, Color & Deliver Explained',
    seoTitle: 'DaVinci Resolve Beginner’s Guide: Pages & Workflow | TUTeach',
    metaDescription:
      'Understand every page inside DaVinci Resolve Free without guesswork—from importing clips in Media Pool to exporting 4K renders on the Deliver page.',
    excerpt:
      'DaVinci Resolve combines seven post-production studios inside one free application. Here is what each page actually does—and which pages beginners need first.',
    category: 'DaVinci Resolve',
    authorName: 'Anmol Creates Editorial Team',
    authorRole: 'Human-Reviewed Curriculum Editor',
    featuredImageUrl: '/assets/seo/course-davinci-resolve.jpg',
    featuredImageAlt: 'DaVinci Resolve workstation displaying Lift Gamma Gain color wheels and RGB parade scopes',
    readTimeMinutes: 8,
    primaryKeyword: 'DaVinci Resolve beginner guide',
    relatedCourseId: 'course-davinci-resolve',
    relatedCoursePath: '/courses/davinci-resolve-for-beginners',
    status: 'PUBLISHED',
    publishedAt: '2026-11-20',
    contentMarkdown: `## What Makes DaVinci Resolve Ideal for Beginners?

Blackmagic Design offers **DaVinci Resolve Free** without watermarks, export resolution locks for standard 4K UHD timelines, or mandatory monthly subscriptions. Because editing, audio mixing, motion graphics, and color grading share a single project database, you never need to bounce files across separate programs while learning.

## The Seven Pages Across the Bottom Bar Explained

Rather than crowding every feature onto one chaotic screen, DaVinci Resolve separates your workflow into seven dedicated pages from left to right:

### 1. Media Page (Organizing Footage)
Used for browsing drives, building Smart Bins, and syncing separate camera and microphone recordings before assembly.

### 2. Cut Page (Fast Rough Assembly)
Built for speed when skimming long interviews or vlog takes using Source Tape mode and dual timelines.

### 3. Edit Page (Precision Storytelling)
This is where beginners spend **80% of their early hours**. It offers multi-track timelines, the Inspector panel for scale/position adjustments, Blade cuts, transitions, and lower-third titles.

### 4. Fusion Page (Node-Based VFX)
A node compositor for custom graphics, screen replacements, and advanced animations once your core editing foundation is solid.

### 5. Color Page (Grading & Scopes)
Features Lift/Gamma/Gain primary wheels, Serial Nodes, Power Windows, and Vectorscopes for consistent look development.

### 6. Fairlight Page (Broadcast Audio Mixing)
Dedicated audio workstation with Parametric EQ, Compression, and Integrated Loudness metering so dialogue cuts cleanly through music.

### 7. Deliver Page (Exporting Final Renders)
Contains presets for H.264/H.265 YouTube uploads, vertical 9:16 social reels, and archival masters.

## A Safe Week-One Checklist for New Users

- Install the official **Free** edition from Blackmagic Design’s website and check GPU settings under **Preferences > System > Memory and GPU**.
- Create your first project inside **Project Manager** (**Ctrl/Cmd + Shift + N** or **New Project**).
- Start directly on the **Edit Page** (**Shift + 4**) with Snapping turned **ON**.
- Practice splitting clips with **B**, returning to Selection with **A**, and closing gaps using **Shift + Backspace**.

Want hands-on desk-side help while you practice? Explore the 8-module DaVinci Resolve for Beginners curriculum on TUTeach.`
  },
  {
    id: 'blog_how_ai_is_changing_online_education',
    slug: 'how-ai-is-changing-online-education',
    title: 'How AI Is Changing Online Education: Moving Beyond One-Size-Fits-All Video Lectures',
    seoTitle: 'How AI Is Changing Online Education Safely | TUTeach',
    metaDescription:
      'Discover how interactive AI tutoring shifts online education from passive video playback to step-by-step practice, visual feedback, and student safety controls.',
    excerpt:
      'Pre-recorded video courses scaled access, but left beginners stuck alone at the first error message. Interactive AI tutoring focuses on diagnosis, dialogue, and safety.',
    category: 'AI Learning Insights',
    authorName: 'Anmol Creates Editorial Team',
    authorRole: 'Human-Reviewed Editorial Team',
    featuredImageUrl: '/assets/seo/blog-ai-mentor.jpg',
    featuredImageAlt: 'Editorial diagram illustrating interactive one-to-one tutoring feedback between learner and digital workspace',
    readTimeMinutes: 6,
    primaryKeyword: 'how AI is changing online education',
    relatedCourseId: 'course-davinci-resolve',
    relatedCoursePath: '/courses/davinci-resolve-for-beginners',
    status: 'PUBLISHED',
    publishedAt: '2026-11-21',
    contentMarkdown: `## The Limitation of Passive Video Courses

Online courses made specialized software education affordable worldwide, yet completion rates have historically suffered because recorded videos are non-interactive. If a learner forgets a shortcut key, misses a toggle inside a menu, or sees an unexpected warning box, a recorded video keeps playing while frustration builds.

## Three Meaningful Shifts Enabled by Conversational AI Tutors

### 1. Adaptive Pacing Instead of Fixed Speed
Every learner brings a different background. An interactive AI teacher adjusts explanations on demand—offering a simple everyday analogy when a concept feels abstract, or diving deeper into keyboard shortcuts when a learner wants precision.

### 2. Visual Screen Inspection When Words Aren’t Enough
Beginners often do not know the technical name of the panel they accidentally closed. Multimodal vision allows a learner to paste a software screenshot and ask, *"Why is my audio track silent?"*—turning confusion into an immediate teachable moment.

### 3. Rubric-Guided Practice Over Multiple-Choice Trivia
Memorizing definitions rarely predicts whether someone can execute a workflow cleanly. Practical assignments graded against transparent 10-point rubrics—with structured retry opportunities—encourage genuine skill retention.

## Why Transparency and Student Safety Must Come First

AI in education also carries real responsibilities. Modern learning platforms must clearly disclose that an AI tutor is an automated system rather than a human instructor, minimize unnecessary personal data sent to models, protect minors through verifiable age thresholds and parental consent, and keep human-reviewed curricula grounded in real software workflows.

At TUTeach, AI transparency disclosures, accidental PII scrubbing before prompts leave the server, and verifiable parental controls are built alongside our interactive tutoring engine.`
  },
  {
    id: 'blog_learn_new_skills_with_ai_tutor',
    slug: 'how-to-learn-new-skills-with-an-ai-tutor',
    title: 'How to Learn New Skills Faster with a 1-on-1 AI Tutor (Without Passive Shortcuts)',
    seoTitle: 'How to Learn New Skills with an AI Tutor | TUTeach',
    metaDescription:
      'Use Socratic prompting, spaced active recall, and visual screenshot feedback to build real software muscle memory with an AI personal tutor.',
    excerpt:
      'Asking an AI for quick answers feels productive, yet rarely builds muscle memory. Learn how Socratic questioning, small practice loops, and targeted revision flashcards make skills stick.',
    category: 'Study Strategies',
    authorName: 'Anmol Creates Editorial Team',
    authorRole: 'Human-Reviewed Curriculum Editor',
    featuredImageUrl: '/assets/seo/tuteach-og-showcase.jpg',
    featuredImageAlt: 'Learner workstation showing DaVinci Resolve timeline beside studio notebook for structured study',
    readTimeMinutes: 6,
    primaryKeyword: 'learn new skills with AI tutor',
    relatedCourseId: 'course-davinci-resolve',
    relatedCoursePath: '/courses/video-editing',
    status: 'PUBLISHED',
    publishedAt: '2026-11-21',
    contentMarkdown: `## Avoid the Copy-Paste Illusion of Competence

Reading a clear answer written by an AI feels effortless—which is exactly why cognitive science warns against passive fluency. True technical fluency happens when **your hands execute the decision** and you test your understanding before checking hints.

## Four Habits That Double the Value of an AI Teacher

### 1. Keep Your Workspace Open Beside the Tutor
Treat the AI mentor like an experienced friend sitting at the corner of your desk. Whenever the tutor mentions a panel—such as the Inspector or Vectorscope—locate and click it on your own screen before moving on.

### 2. Ask "Why" After Every Shortcut
Knowing that **Shift + Backspace** closes a gap is helpful; knowing **why regular Backspace intentionally preserves timing sync** prevents costly mistakes on multi-track edits later.

### 3. Share Specific Context or Screenshots When Stuck
Instead of saying *"It doesn't work,"* tell your AI teacher what you tried: *"I pressed B to slice my video track, clicked the clip, and now V1 moved but A1 stayed behind."* Specific observations produce pinpoint fixes.

### 4. Review Weak Spots with Spaced Flashcards
Mistakes uncovered during practical assignments are your highest-leverage study material. Turning missed concepts into short active-recall drills helps convert fragile session memory into durable recall days later.

Want to test Socratic AI guidance live? Launch the free 5-minute AI Teacher Demo on TUTeach in English or Hindi/Hinglish.`
  },
  {
    id: 'blog_best_video_editing_skills_beginners',
    slug: 'best-video-editing-skills-for-beginners',
    title: '7 Essential Video Editing Skills Every Beginner Should Master First',
    seoTitle: '7 Best Video Editing Skills for Beginners | TUTeach',
    metaDescription:
      'Focus on the 7 core video editing skills that matter most for beginners: J-K-L scrubbing, ripple deleting, pacing, dialogue EQ, and clean YouTube/Reels exports.',
    excerpt:
      'Skip flashy presets and learn the seven repeatable post-production skills used on real edits—from J-K-L transport control to YouTube LUFS loudness.',
    category: 'Video Editing Guides',
    authorName: 'Anmol Creates Editorial Team',
    authorRole: 'Human-Reviewed Curriculum Editor',
    featuredImageUrl: '/assets/seo/course-video-editing.jpg',
    featuredImageAlt: 'Structured beginner video editing workstation with dual timelines and headphones',
    readTimeMinutes: 7,
    primaryKeyword: 'best video editing skills for beginners',
    relatedCourseId: 'course-davinci-resolve',
    relatedCoursePath: '/courses/video-editing',
    status: 'PUBLISHED',
    publishedAt: '2026-11-22',
    contentMarkdown: `## Master Foundations Before Flashy Effects

Beginners often hunt for transition packs before mastering rhythm, audio balance, and clean cuts. In real projects—whether YouTube explainers, short reels, or client interviews—clean fundamentals define 90% of perceived polish.

## The 7 High-Leverage Skills to Practice First

### 1. Non-Destructive Media Organization
Always build structured bins in the Media Pool and understand frame rates (**24 fps**, **30 fps**, **60 fps**) before placing clips on a timeline.

### 2. J-K-L Scrubbing and Frame-Accurate Navigation
Use **J** (reverse), **K** (pause), **L** (forward), and **Up/Down Arrow** keys to jump cleanly between edit boundaries without dragging tiny scrollbars.

### 3. Precision Trimming (Ripple, Roll, Slip)
Know when to adjust clip duration without leaving dead black frames or breaking sync across dialogue and music tracks.

### 4. Pacing and B-Roll Cutaways (J-Cuts and L-Cuts)
Letting the next speaker’s voice start slightly underneath the previous visual (**J-Cut**) creates smooth editorial flow without artificial whoosh transitions.

### 5. Dialogue Cleanup and Music Ducking
Apply subtle high-pass filtering around **80 Hz**, tame harsh frequencies cleanly, and keep narration clearly above background music using loudness targets (**-14.0 LUFS** for YouTube).

### 6. Primary Color Balancing Using Scopes
Use Lift, Gamma, and Gain controls guided by **Parade**, **Waveform**, and **Vectorscope** displays so shots match evenly across scenes.

### 7. Intentional Export Presets
Configure codecs (**H.264** / **H.265**), resolution (**1920x1080**, **3840x2160**, or vertical **1080x1920**), and bitrate cleanly for each destination platform.

All seven core skills are practiced module-by-module inside TUTeach’s 8-Module DaVinci Resolve course with step-by-step AI guidance.`
  }
];

export async function ensureBlogSeeded(): Promise<void> {
  if (blogSeedPromise) return blogSeedPromise;
  blogSeedPromise = (async () => {
    const db = await getDb();
    for (const post of INITIAL_BLOG_POSTS) {
      const existing = await db
        .select({ id: schema.blogPosts.id })
        .from(schema.blogPosts)
        .where(eq(schema.blogPosts.slug, post.slug))
        .limit(1);
      if (existing.length === 0) {
        await db.insert(schema.blogPosts).values(post);
      }
    }
  })().catch((err) => {
    blogSeedPromise = null;
    throw err;
  });
  return blogSeedPromise;
}

export function sanitizeSlug(raw: string): string {
  return String(raw || '')
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9\s-]/g, '')
    .replace(/\s+/g, '-')
    .replace(/-+/g, '-')
    .replace(/^-|-$/g, '')
    .slice(0, 120);
}

export async function listBlogPosts(includeUnpublished = false): Promise<schema.BlogPost[]> {
  await ensureBlogSeeded();
  const db = await getDb();
  const rows: schema.BlogPost[] = await db
    .select()
    .from(schema.blogPosts)
    .orderBy(desc(schema.blogPosts.publishedAt), desc(schema.blogPosts.createdAt));

  if (includeUnpublished) return rows;
  return rows.filter((r) => r.status === 'PUBLISHED');
}

export async function getBlogPostBySlug(slug: string, allowUnpublished = false): Promise<schema.BlogPost | null> {
  await ensureBlogSeeded();
  const cleanSlug = sanitizeSlug(slug);
  if (!cleanSlug) return null;
  const db = await getDb();
  const rows: schema.BlogPost[] = await db
    .select()
    .from(schema.blogPosts)
    .where(eq(schema.blogPosts.slug, cleanSlug))
    .limit(1);
  const post = rows[0] || null;
  if (!post) return null;
  if (!allowUnpublished && post.status !== 'PUBLISHED') return null;
  return post;
}

export async function createBlogPost(
  input: {
    title: string;
    slug?: string;
    seoTitle?: string;
    metaDescription: string;
    excerpt?: string;
    contentMarkdown: string;
    category?: string;
    authorName?: string;
    authorRole?: string;
    featuredImageUrl?: string;
    featuredImageAlt?: string;
    readTimeMinutes?: number;
    primaryKeyword?: string;
    relatedCourseId?: string;
    relatedCoursePath?: string;
    status?: 'DRAFT' | 'PUBLISHED' | 'ARCHIVED';
    publishedAt?: string;
  },
  adminId: string
): Promise<{ ok: boolean; post?: schema.BlogPost; error?: string }> {
  await ensureBlogSeeded();
  const title = (input.title || '').trim();
  const contentMarkdown = (input.contentMarkdown || '').trim();
  const metaDescription = (input.metaDescription || '').trim();
  const slug = sanitizeSlug(input.slug || title);

  if (!title || title.length < 6) {
    return { ok: false, error: 'Article title must be at least 6 characters.' };
  }
  if (!slug || slug.length < 4) {
    return { ok: false, error: 'Valid URL slug is required (at least 4 characters).' };
  }
  if (!contentMarkdown || contentMarkdown.length < 80) {
    return { ok: false, error: 'Article content must be substantial (at least 80 characters).' };
  }
  if (!metaDescription || metaDescription.length < 40) {
    return { ok: false, error: 'SEO meta description is required (40–160 characters recommended).' };
  }

  const db = await getDb();
  const dup = await db
    .select({ id: schema.blogPosts.id })
    .from(schema.blogPosts)
    .where(eq(schema.blogPosts.slug, slug))
    .limit(1);
  if (dup.length > 0) {
    return { ok: false, error: `An article with slug "/blog/${slug}" already exists.` };
  }

  const id = `blog_${crypto.randomBytes(6).toString('hex')}`;
  const status =
    input.status === 'PUBLISHED' || input.status === 'ARCHIVED' ? input.status : 'DRAFT';
  const now = new Date();
  const wordCount = contentMarkdown.split(/\s+/).filter(Boolean).length;
  const computedRead = Math.max(2, Math.round(wordCount / 180));

  const newPost: typeof schema.blogPosts.$inferInsert = {
    id,
    slug,
    title,
    seoTitle: (input.seoTitle || `${title.slice(0, 48)} | TUTeach`).trim(),
    metaDescription: metaDescription.slice(0, 180),
    excerpt: (input.excerpt || metaDescription).trim(),
    contentMarkdown,
    category: (input.category || 'Video Editing Guides').trim(),
    authorName: (input.authorName || 'Anmol Creates Editorial Team').trim(),
    authorRole: (input.authorRole || 'Human-Reviewed Curriculum Editor').trim(),
    featuredImageUrl: (input.featuredImageUrl || '/assets/seo/blog-ai-mentor.jpg').trim(),
    featuredImageAlt: (input.featuredImageAlt || `${title} illustration`).trim(),
    readTimeMinutes: input.readTimeMinutes || computedRead,
    primaryKeyword: (input.primaryKeyword || slug.replace(/-/g, ' ')).trim(),
    relatedCourseId: input.relatedCourseId || 'course-davinci-resolve',
    relatedCoursePath: input.relatedCoursePath || '/courses/davinci-resolve-for-beginners',
    status,
    publishedAt: (input.publishedAt || now.toISOString().slice(0, 10)).trim(),
    createdAt: now,
    updatedAt: now
  };

  await db.insert(schema.blogPosts).values(newPost);
  await logComplianceAudit(
    adminId,
    'admin',
    'BLOG_POST_CREATED',
    'blog_post',
    id,
    `Created blog post "${title}" (/blog/${slug}) with status ${status}`
  );

  const inserted = await db
    .select()
    .from(schema.blogPosts)
    .where(eq(schema.blogPosts.id, id))
    .limit(1);
  return { ok: true, post: inserted[0] };
}

export async function updateBlogPost(
  id: string,
  updates: Partial<{
    title: string;
    slug: string;
    seoTitle: string;
    metaDescription: string;
    excerpt: string;
    contentMarkdown: string;
    category: string;
    authorName: string;
    authorRole: string;
    featuredImageUrl: string;
    featuredImageAlt: string;
    primaryKeyword: string;
    relatedCoursePath: string;
    status: 'DRAFT' | 'PUBLISHED' | 'ARCHIVED';
    publishedAt: string;
  }>,
  adminId: string
): Promise<{ ok: boolean; post?: schema.BlogPost; error?: string }> {
  await ensureBlogSeeded();
  const db = await getDb();
  const existingRows = await db
    .select()
    .from(schema.blogPosts)
    .where(eq(schema.blogPosts.id, id))
    .limit(1);
  if (!existingRows[0]) {
    return { ok: false, error: 'Blog post not found.' };
  }

  const patch: Record<string, any> = { updatedAt: new Date() };
  if (typeof updates.title === 'string' && updates.title.trim()) patch.title = updates.title.trim();
  if (typeof updates.slug === 'string' && updates.slug.trim()) {
    const clean = sanitizeSlug(updates.slug);
    if (clean !== existingRows[0].slug) {
      const collision = await db
        .select({ id: schema.blogPosts.id })
        .from(schema.blogPosts)
        .where(eq(schema.blogPosts.slug, clean))
        .limit(1);
      if (collision.length > 0) {
        return { ok: false, error: `Slug "${clean}" is already in use.` };
      }
      patch.slug = clean;
    }
  }
  if (typeof updates.seoTitle === 'string' && updates.seoTitle.trim()) patch.seoTitle = updates.seoTitle.trim();
  if (typeof updates.metaDescription === 'string' && updates.metaDescription.trim())
    patch.metaDescription = updates.metaDescription.trim().slice(0, 180);
  if (typeof updates.excerpt === 'string' && updates.excerpt.trim()) patch.excerpt = updates.excerpt.trim();
  if (typeof updates.contentMarkdown === 'string' && updates.contentMarkdown.trim()) {
    patch.contentMarkdown = updates.contentMarkdown.trim();
    const wc = patch.contentMarkdown.split(/\s+/).filter(Boolean).length;
    patch.readTimeMinutes = Math.max(2, Math.round(wc / 180));
  }
  if (typeof updates.category === 'string' && updates.category.trim()) patch.category = updates.category.trim();
  if (typeof updates.authorName === 'string' && updates.authorName.trim()) patch.authorName = updates.authorName.trim();
  if (typeof updates.authorRole === 'string' && updates.authorRole.trim()) patch.authorRole = updates.authorRole.trim();
  if (typeof updates.featuredImageUrl === 'string' && updates.featuredImageUrl.trim())
    patch.featuredImageUrl = updates.featuredImageUrl.trim();
  if (typeof updates.featuredImageAlt === 'string' && updates.featuredImageAlt.trim())
    patch.featuredImageAlt = updates.featuredImageAlt.trim();
  if (typeof updates.primaryKeyword === 'string' && updates.primaryKeyword.trim())
    patch.primaryKeyword = updates.primaryKeyword.trim();
  if (typeof updates.relatedCoursePath === 'string' && updates.relatedCoursePath.trim())
    patch.relatedCoursePath = updates.relatedCoursePath.trim();
  if (updates.status && ['DRAFT', 'PUBLISHED', 'ARCHIVED'].includes(updates.status)) {
    patch.status = updates.status;
  }
  if (typeof updates.publishedAt === 'string' && updates.publishedAt.trim())
    patch.publishedAt = updates.publishedAt.trim();

  await db.update(schema.blogPosts).set(patch).where(eq(schema.blogPosts.id, id));
  await logComplianceAudit(
    adminId,
    'admin',
    'BLOG_POST_UPDATED',
    'blog_post',
    id,
    `Updated blog post "${patch.title || existingRows[0].title}" (status=${patch.status || existingRows[0].status})`
  );

  const refreshed = await db
    .select()
    .from(schema.blogPosts)
    .where(eq(schema.blogPosts.id, id))
    .limit(1);
  return { ok: true, post: refreshed[0] };
}

export async function deleteBlogPost(id: string, adminId: string): Promise<{ ok: boolean; error?: string }> {
  await ensureBlogSeeded();
  const db = await getDb();
  const existing = await db
    .select({ id: schema.blogPosts.id, title: schema.blogPosts.title })
    .from(schema.blogPosts)
    .where(eq(schema.blogPosts.id, id))
    .limit(1);
  if (!existing[0]) {
    return { ok: false, error: 'Blog post not found.' };
  }
  await db.delete(schema.blogPosts).where(eq(schema.blogPosts.id, id));
  await logComplianceAudit(
    adminId,
    'admin',
    'BLOG_POST_DELETED',
    'blog_post',
    id,
    `Removed blog post "${existing[0].title}"`
  );
  return { ok: true };
}
