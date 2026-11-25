import React, { useEffect, useState } from 'react';
import { useApp } from '../../context/AppContext';
import { BlogPostItem } from '../../types';
import {
  ArrowLeft,
  ArrowRight,
  BookOpen,
  Calendar,
  Check,
  Clock,
  Copy,
  Mic,
  Share2,
  ShieldCheck,
  UserCheck
} from 'lucide-react';

// Safe inline formatting helper: parses **bold** and `code` into pure React nodes without raw HTML injection
function renderInlineSegments(text: string): React.ReactNode[] {
  const parts = text.split(/(\*\*[^*]+\*\*|`[^`]+`)/g);
  return parts.map((part, idx) => {
    if (part.startsWith('**') && part.endsWith('**') && part.length > 4) {
      return (
        <strong key={idx} className="font-bold text-[#393636]">
          {part.slice(2, -2)}
        </strong>
      );
    }
    if (part.startsWith('`') && part.endsWith('`') && part.length > 2) {
      return (
        <code
          key={idx}
          className="px-1.5 py-0.5 rounded bg-[#EFEBDA] border border-[#393636]/15 font-mono text-xs text-[#393636]"
        >
          {part.slice(1, -1)}
        </code>
      );
    }
    return <React.Fragment key={idx}>{part}</React.Fragment>;
  });
}

function renderSafeMarkdownBlocks(markdown: string): React.ReactNode {
  const lines = String(markdown || '').split('\n');
  const blocks: React.ReactNode[] = [];
  let listBuffer: string[] = [];
  let orderedBuffer: string[] = [];

  const flushLists = (keyPrefix: string) => {
    if (listBuffer.length > 0) {
      blocks.push(
        <ul key={`${keyPrefix}-ul`} className="list-disc pl-6 space-y-2 text-[#393636]/85 text-sm sm:text-base leading-relaxed">
          {listBuffer.map((item, i) => (
            <li key={i}>{renderInlineSegments(item)}</li>
          ))}
        </ul>
      );
      listBuffer = [];
    }
    if (orderedBuffer.length > 0) {
      blocks.push(
        <ol key={`${keyPrefix}-ol`} className="list-decimal pl-6 space-y-2 text-[#393636]/85 text-sm sm:text-base leading-relaxed">
          {orderedBuffer.map((item, i) => (
            <li key={i}>{renderInlineSegments(item)}</li>
          ))}
        </ol>
      );
      orderedBuffer = [];
    }
  };

  lines.forEach((rawLine, index) => {
    const line = rawLine.trim();
    if (!line) {
      flushLists(`line-${index}`);
      return;
    }

    if (line.startsWith('### ')) {
      flushLists(`h3-${index}`);
      blocks.push(
        <h3 key={`h3-${index}`} className="text-lg sm:text-xl font-bold text-[#393636] pt-3">
          {line.slice(4)}
        </h3>
      );
      return;
    }

    if (line.startsWith('## ')) {
      flushLists(`h2-${index}`);
      blocks.push(
        <h2 key={`h2-${index}`} className="text-xl sm:text-2xl font-extrabold text-[#393636] pt-5 border-t border-[#393636]/10">
          {line.slice(3)}
        </h2>
      );
      return;
    }

    if (line.startsWith('- ') || line.startsWith('* ')) {
      if (orderedBuffer.length > 0) flushLists(`mix-${index}`);
      listBuffer.push(line.slice(2));
      return;
    }

    const orderedMatch = line.match(/^\d+\.\s+(.+)$/);
    if (orderedMatch) {
      if (listBuffer.length > 0) flushLists(`mix2-${index}`);
      orderedBuffer.push(orderedMatch[1]);
      return;
    }

    flushLists(`p-${index}`);
    blocks.push(
      <p key={`p-${index}`} className="text-sm sm:text-base text-[#393636]/85 leading-relaxed">
        {renderInlineSegments(line)}
      </p>
    );
  });

  flushLists('end');
  return <div className="space-y-4">{blocks}</div>;
}

export const BlogIndexPage: React.FC = () => {
  const { navigate, setActiveBlogPost } = useApp();
  const [posts, setPosts] = useState<BlogPostItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeCategory, setActiveCategory] = useState<string>('All');
  const [failedImages, setFailedImages] = useState<Record<string, boolean>>({});

  useEffect(() => {
    let mounted = true;
    setActiveBlogPost(null);
    fetch('/api/blog/posts')
      .then((r) => r.json())
      .then((data) => {
        if (mounted && Array.isArray(data.posts)) {
          setPosts(data.posts);
        }
      })
      .catch(() => {})
      .finally(() => {
        if (mounted) setLoading(false);
      });
    return () => {
      mounted = false;
    };
  }, []);

  const categories = ['All', ...Array.from(new Set(posts.map((p) => p.category)))];
  const visiblePosts =
    activeCategory === 'All' ? posts : posts.filter((p) => p.category === activeCategory);

  return (
    <div className="min-h-screen bg-[#FAF7EE] text-[#393636]">
      {/* Top Hero */}
      <section className="py-12 sm:py-16 border-b border-[#393636]/10 bg-[#EFEBDA]/60">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-4">
          <div className="text-xs font-extrabold uppercase tracking-wider text-[#F14C2F]">
            TUTeach Educational Journal
          </div>
          <h1 className="text-3xl sm:text-5xl font-extrabold text-[#393636] tracking-tight">
            Practical Guides on Video Editing, DaVinci Resolve &amp; AI Learning
          </h1>
          <p className="text-sm sm:text-base text-[#393636]/80 max-w-2xl leading-relaxed">
            Human-reviewed articles written by the Anmol Creates editorial team to help beginners build structured workflows, clean audio habits, and deliberate study routines.
          </p>

          {/* Category Filter Buttons */}
          <div className="flex flex-wrap gap-2 pt-2">
            {categories.map((cat) => (
              <button
                key={cat}
                type="button"
                onClick={() => setActiveCategory(cat)}
                className={`px-4 py-2 rounded-xl text-xs font-bold transition-colors cursor-pointer ${
                  activeCategory === cat
                    ? 'bg-[#393636] text-white'
                    : 'bg-white text-[#393636] border border-[#393636]/15 hover:border-[#F14C2F]'
                }`}
              >
                {cat}
              </button>
            ))}
          </div>
        </div>
      </section>

      {/* Articles Grid */}
      <section className="py-12 sm:py-16">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          {loading ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {[1, 2, 3].map((n) => (
                <div key={n} className="bg-white rounded-3xl p-6 border border-[#393636]/10 space-y-4 animate-pulse">
                  <div className="aspect-[16/9] rounded-2xl bg-[#EFEBDA]" />
                  <div className="h-4 bg-[#EFEBDA] rounded w-2/3" />
                  <div className="h-6 bg-[#EFEBDA] rounded w-full" />
                  <div className="h-14 bg-[#EFEBDA] rounded w-full" />
                </div>
              ))}
            </div>
          ) : visiblePosts.length === 0 ? (
            <div className="bg-white rounded-3xl p-10 text-center border border-[#393636]/10 space-y-3">
              <h2 className="text-xl font-bold text-[#393636]">No published articles in this category yet</h2>
              <p className="text-sm text-[#393636]/70">Switch back to All categories or explore our DaVinci Resolve curriculum.</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-7">
              {visiblePosts.map((post) => (
                <article
                  key={post.id}
                  className="bg-white rounded-3xl border border-[#393636]/10 overflow-hidden shadow-2xs hover:border-[#F14C2F]/50 transition-all flex flex-col justify-between"
                >
                  <div>
                    <div className="aspect-[16/9] bg-[#393636] overflow-hidden relative">
                      {!failedImages[post.id] ? (
                        <img
                          src={post.featuredImageUrl}
                          alt={post.featuredImageAlt}
                          width={800}
                          height={450}
                          loading="lazy"
                          referrerPolicy="no-referrer"
                          onError={() => setFailedImages((prev) => ({ ...prev, [post.id]: true }))}
                          className="w-full h-full object-cover"
                        />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-[#393636] to-[#1d1b1b] text-[#EFEBDA]">
                          <BookOpen className="w-8 h-8 text-[#F14C2F]" />
                        </div>
                      )}
                    </div>

                    <div className="p-6 space-y-3">
                      <div className="text-xs font-semibold text-[#F14C2F] flex flex-wrap items-center gap-1.5">
                        <span>{post.category}</span>
                        <span className="text-[#393636]/30">·</span>
                        <span className="text-[#393636]/65">{post.readTimeMinutes} min read</span>
                      </div>

                      <h2 className="text-lg font-extrabold text-[#393636] leading-snug">
                        <a
                          href={`/blog/${post.slug}`}
                          onClick={(e) => {
                            e.preventDefault();
                            setActiveBlogPost(post);
                            navigate('blog-post', undefined, post.slug);
                          }}
                          className="hover:text-[#F14C2F] transition-colors"
                        >
                          {post.title}
                        </a>
                      </h2>

                      <p className="text-xs sm:text-sm text-[#393636]/75 leading-relaxed line-clamp-3">
                        {post.excerpt}
                      </p>
                    </div>
                  </div>

                  <div className="px-6 py-4 bg-[#FAF7EE]/70 border-t border-[#393636]/10 flex items-center justify-between text-xs">
                    <span className="text-[#393636]/70 font-medium">{post.publishedAt}</span>
                    <a
                      href={`/blog/${post.slug}`}
                      onClick={(e) => {
                        e.preventDefault();
                        setActiveBlogPost(post);
                        navigate('blog-post', undefined, post.slug);
                      }}
                      className="font-bold text-[#F14C2F] hover:underline flex items-center gap-1"
                    >
                      <span>Read Guide</span>
                      <ArrowRight className="w-3.5 h-3.5" />
                    </a>
                  </div>
                </article>
              ))}
            </div>
          )}
        </div>
      </section>
    </div>
  );
};

export const BlogArticlePage: React.FC = () => {
  const { navigate, selectedBlogSlug, activeBlogPost, setActiveBlogPost } = useApp();
  const [post, setPost] = useState<BlogPostItem | null>(activeBlogPost);
  const [related, setRelated] = useState<BlogPostItem[]>([]);
  const [loading, setLoading] = useState(!activeBlogPost || activeBlogPost.slug !== selectedBlogSlug);
  const [notFound, setNotFound] = useState(false);
  const [imgFailed, setImgFailed] = useState(false);
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    let mounted = true;
    const slug = selectedBlogSlug;
    if (!slug) {
      setNotFound(true);
      setLoading(false);
      return;
    }

    setLoading(true);
    setNotFound(false);

    Promise.all([
      fetch(`/api/blog/posts/${encodeURIComponent(slug)}`).then(async (r) => ({
        ok: r.ok,
        data: await r.json().catch(() => ({}))
      })),
      fetch('/api/blog/posts').then((r) => r.json().catch(() => ({ posts: [] })))
    ])
      .then(([singleRes, listRes]) => {
        if (!mounted) return;
        if (!singleRes.ok || !singleRes.data?.post) {
          setPost(null);
          setActiveBlogPost(null);
          setNotFound(true);
        } else {
          setPost(singleRes.data.post);
          setActiveBlogPost(singleRes.data.post);
        }
        if (Array.isArray(listRes.posts)) {
          setRelated(listRes.posts.filter((p: BlogPostItem) => p.slug !== slug).slice(0, 2));
        }
      })
      .catch(() => {
        if (mounted) setNotFound(true);
      })
      .finally(() => {
        if (mounted) setLoading(false);
      });

    return () => {
      mounted = false;
    };
  }, [selectedBlogSlug]);

  if (loading) {
    return (
      <div className="min-h-screen bg-[#FAF7EE] py-16 px-4">
        <div className="max-w-3xl mx-auto bg-white rounded-3xl p-8 border border-[#393636]/10 space-y-4 animate-pulse">
          <div className="h-6 bg-[#EFEBDA] rounded w-1/3" />
          <div className="h-10 bg-[#EFEBDA] rounded w-5/6" />
          <div className="aspect-[16/9] bg-[#EFEBDA] rounded-2xl" />
          <div className="h-40 bg-[#EFEBDA] rounded w-full" />
        </div>
      </div>
    );
  }

  if (notFound || !post) {
    return (
      <div className="min-h-screen bg-[#FAF7EE] py-20 px-4">
        <div className="max-w-xl mx-auto bg-white rounded-3xl p-10 border border-[#393636]/10 text-center space-y-4">
          <h1 className="text-2xl font-extrabold text-[#393636]">Article Not Found</h1>
          <p className="text-sm text-[#393636]/75">
            This guide may have been moved or is not currently published.
          </p>
          <a
            href="/blog"
            onClick={(e) => {
              e.preventDefault();
              navigate('blog');
            }}
            className="inline-flex items-center gap-2 px-6 py-3 bg-[#F14C2F] text-white font-bold text-xs rounded-xl"
          >
            <ArrowLeft className="w-4 h-4" />
            <span>Back to TUTeach Blog</span>
          </a>
        </div>
      </div>
    );
  }

  const shareUrl =
    typeof window !== 'undefined'
      ? `${window.location.origin}/blog/${post.slug}`
      : `https://tuteach.ai/blog/${post.slug}`;

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(shareUrl);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {}
  };

  return (
    <div className="min-h-screen bg-[#FAF7EE] text-[#393636] py-10 px-4 sm:px-6 lg:px-8">
      <article className="max-w-3xl mx-auto space-y-8">
        {/* Breadcrumbs */}
        <nav aria-label="Breadcrumb" className="flex flex-wrap items-center gap-2 text-xs text-[#393636]/70">
          <a
            href="/"
            onClick={(e) => {
              e.preventDefault();
              navigate('home');
            }}
            className="hover:text-[#F14C2F]"
          >
            Home
          </a>
          <span>/</span>
          <a
            href="/blog"
            onClick={(e) => {
              e.preventDefault();
              setActiveBlogPost(null);
              navigate('blog');
            }}
            className="hover:text-[#F14C2F]"
          >
            Blog
          </a>
          <span>/</span>
          <span className="font-semibold text-[#393636] truncate max-w-xs">{post.title}</span>
        </nav>

        {/* Header */}
        <header className="space-y-4">
          <div className="text-xs font-extrabold uppercase tracking-wider text-[#F14C2F]">
            {post.category} · {post.readTimeMinutes} min read
          </div>

          <h1 className="text-3xl sm:text-4xl font-extrabold text-[#393636] tracking-tight leading-[1.15]">
            {post.title}
          </h1>

          <p className="text-base text-[#393636]/80 leading-relaxed">{post.excerpt}</p>

          <div className="flex flex-wrap items-center gap-x-4 gap-y-2 text-xs text-[#393636]/70 pt-1">
            <span className="flex items-center gap-1.5 font-semibold text-[#393636]">
              <UserCheck className="w-3.5 h-3.5 text-[#F14C2F]" />
              {post.authorName}
            </span>
            <span>·</span>
            <span className="flex items-center gap-1">
              <Calendar className="w-3.5 h-3.5" />
              Published {post.publishedAt}
            </span>
            <span>·</span>
            <span className="flex items-center gap-1 text-emerald-700 font-semibold">
              <ShieldCheck className="w-3.5 h-3.5" /> Human-Reviewed Study Guide
            </span>
          </div>
        </header>

        {/* Cover Visual */}
        <div className="rounded-3xl overflow-hidden border border-[#393636]/15 bg-[#393636] aspect-[16/9]">
          {!imgFailed ? (
            <img
              src={post.featuredImageUrl}
              alt={post.featuredImageAlt}
              width={1280}
              height={720}
              referrerPolicy="no-referrer"
              onError={() => setImgFailed(true)}
              className="w-full h-full object-cover"
            />
          ) : (
            <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-[#393636] to-[#1f1d1b] text-[#EFEBDA]">
              <BookOpen className="w-10 h-10 text-[#F14C2F]" />
            </div>
          )}
        </div>

        {/* Main Content */}
        <div className="bg-white rounded-3xl p-6 sm:p-10 border border-[#393636]/10 shadow-2xs space-y-6">
          {renderSafeMarkdownBlocks(post.contentMarkdown)}

          {/* Share Bar */}
          <div className="pt-6 border-t border-[#393636]/10 flex flex-wrap items-center justify-between gap-3 text-xs">
            <span className="font-bold text-[#393636] flex items-center gap-1.5">
              <Share2 className="w-4 h-4 text-[#F14C2F]" /> Share this guide:
            </span>
            <div className="flex flex-wrap items-center gap-2">
              <a
                href={`https://wa.me/?text=${encodeURIComponent(`${post.title} — ${shareUrl}`)}`}
                target="_blank"
                rel="noopener noreferrer"
                className="px-3 py-1.5 rounded-lg bg-[#FAF7EE] border border-[#393636]/15 hover:border-[#F14C2F] font-semibold"
              >
                WhatsApp
              </a>
              <a
                href={`https://www.linkedin.com/sharing/share-offsite/?url=${encodeURIComponent(shareUrl)}`}
                target="_blank"
                rel="noopener noreferrer"
                className="px-3 py-1.5 rounded-lg bg-[#FAF7EE] border border-[#393636]/15 hover:border-[#F14C2F] font-semibold"
              >
                LinkedIn
              </a>
              <button
                type="button"
                onClick={handleCopy}
                className="px-3 py-1.5 rounded-lg bg-[#FAF7EE] border border-[#393636]/15 hover:border-[#F14C2F] font-semibold flex items-center gap-1 cursor-pointer"
              >
                {copied ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <Copy className="w-3.5 h-3.5" />}
                <span>{copied ? 'Link Copied' : 'Copy Link'}</span>
              </button>
            </div>
          </div>
        </div>

        {/* Practice CTA Box */}
        <div className="bg-[#393636] text-white rounded-3xl p-7 sm:p-8 flex flex-col sm:flex-row sm:items-center justify-between gap-5">
          <div className="space-y-1.5 max-w-lg">
            <div className="text-xs font-bold uppercase tracking-wider text-[#F14C2F]">
              Interactive Practice
            </div>
            <h2 className="text-xl font-extrabold text-white">
              Practice These Workflows with Your Personal AI Teacher
            </h2>
            <p className="text-xs text-[#EFEBDA]/80 leading-relaxed">
              Test Golu Guru in our free 5-minute voice &amp; screenshot demo or explore the 8-module DaVinci Resolve curriculum.
            </p>
          </div>
          <div className="flex flex-col sm:flex-row gap-2.5 shrink-0">
            <button
              onClick={() => navigate('demo')}
              className="px-5 py-3 rounded-xl bg-[#F14C2F] hover:bg-[#d83c21] text-white font-bold text-xs flex items-center justify-center gap-1.5 cursor-pointer"
            >
              <Mic className="w-3.5 h-3.5" /> Try Free Demo
            </button>
            <a
              href={post.relatedCoursePath || '/courses/davinci-resolve-for-beginners'}
              onClick={(e) => {
                e.preventDefault();
                navigate(
                  post.relatedCoursePath === '/courses/video-editing'
                    ? 'course-video-editing'
                    : 'course-davinci-resolve'
                );
              }}
              className="px-5 py-3 rounded-xl bg-white/10 hover:bg-white/20 text-white font-bold text-xs text-center"
            >
              View Course Track
            </a>
          </div>
        </div>

        {/* Related Guides */}
        {related.length > 0 && (
          <section className="space-y-4 pt-2">
            <h2 className="text-lg font-extrabold text-[#393636]">More Guides from TUTeach</h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {related.map((r) => (
                <a
                  key={r.id}
                  href={`/blog/${r.slug}`}
                  onClick={(e) => {
                    e.preventDefault();
                    setActiveBlogPost(r);
                    navigate('blog-post', undefined, r.slug);
                  }}
                  className="bg-white rounded-2xl p-5 border border-[#393636]/10 hover:border-[#F14C2F] transition-colors space-y-2 block"
                >
                  <div className="text-xs font-semibold text-[#F14C2F]">{r.category}</div>
                  <h3 className="text-sm font-bold text-[#393636] leading-snug">{r.title}</h3>
                  <div className="text-xs text-[#393636]/65 flex items-center gap-1">
                    <Clock className="w-3 h-3" /> {r.readTimeMinutes} min read
                  </div>
                </a>
              ))}
            </div>
          </section>
        )}
      </article>
    </div>
  );
};
