import React from 'react';
import { useApp } from '../../context/AppContext';
import { ArrowRight, BookOpen, Compass, Home, Mic } from 'lucide-react';

export const NotFoundPage: React.FC = () => {
  const { navigate, setActiveBlogPost } = useApp();

  return (
    <div className="min-h-[75vh] bg-[#FAF7EE] text-[#393636] py-16 px-4 sm:px-6 lg:px-8 flex items-center justify-center">
      <div className="max-w-2xl w-full bg-white rounded-3xl p-8 sm:p-12 border border-[#393636]/10 shadow-sm text-center space-y-6">
        <div className="inline-flex items-center justify-center w-14 h-14 rounded-2xl bg-[#F14C2F]/10 text-[#F14C2F] mx-auto">
          <Compass className="w-7 h-7" />
        </div>

        <div className="space-y-2">
          <div className="text-xs font-extrabold uppercase tracking-wider text-[#F14C2F]">
            404 · Page Not Found
          </div>
          <h1 className="text-3xl sm:text-4xl font-extrabold text-[#393636] tracking-tight">
            We Could Not Find That Page
          </h1>
          <p className="text-sm text-[#393636]/75 max-w-md mx-auto leading-relaxed">
            The link may be mistyped or outdated. Use the verified paths below to explore our interactive courses, educational guides, or free AI Teacher demo.
          </p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-left pt-2">
          <a
            href="/"
            onClick={(e) => {
              e.preventDefault();
              navigate('home');
            }}
            className="p-4 rounded-2xl bg-[#FAF7EE] border border-[#393636]/10 hover:border-[#F14C2F] transition-colors flex items-center justify-between"
          >
            <div className="flex items-center gap-2.5">
              <Home className="w-4 h-4 text-[#F14C2F]" />
              <span className="text-sm font-bold">TUTeach Homepage</span>
            </div>
            <ArrowRight className="w-4 h-4 text-[#393636]/50" />
          </a>

          <a
            href="/courses/davinci-resolve-for-beginners"
            onClick={(e) => {
              e.preventDefault();
              navigate('course-davinci-resolve');
            }}
            className="p-4 rounded-2xl bg-[#FAF7EE] border border-[#393636]/10 hover:border-[#F14C2F] transition-colors flex items-center justify-between"
          >
            <div className="flex items-center gap-2.5">
              <BookOpen className="w-4 h-4 text-[#F14C2F]" />
              <span className="text-sm font-bold">DaVinci Resolve Course</span>
            </div>
            <ArrowRight className="w-4 h-4 text-[#393636]/50" />
          </a>

          <a
            href="/blog"
            onClick={(e) => {
              e.preventDefault();
              setActiveBlogPost(null);
              navigate('blog');
            }}
            className="p-4 rounded-2xl bg-[#FAF7EE] border border-[#393636]/10 hover:border-[#F14C2F] transition-colors flex items-center justify-between"
          >
            <div className="flex items-center gap-2.5">
              <BookOpen className="w-4 h-4 text-[#F14C2F]" />
              <span className="text-sm font-bold">Educational Blog</span>
            </div>
            <ArrowRight className="w-4 h-4 text-[#393636]/50" />
          </a>

          <a
            href="/demo"
            onClick={(e) => {
              e.preventDefault();
              navigate('demo');
            }}
            className="p-4 rounded-2xl bg-[#393636] text-white hover:bg-[#F14C2F] transition-colors flex items-center justify-between"
          >
            <div className="flex items-center gap-2.5">
              <Mic className="w-4 h-4" />
              <span className="text-sm font-bold">Free 5-Min AI Demo</span>
            </div>
            <ArrowRight className="w-4 h-4" />
          </a>
        </div>
      </div>
    </div>
  );
};
