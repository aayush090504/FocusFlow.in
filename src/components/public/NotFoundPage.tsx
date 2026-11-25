import React from 'react';
import { ArrowLeft, Clock, Flame, Calendar, Shield, Compass } from 'lucide-react';
import { SEOHead } from '../seo/SEOHead';
import { PublicHeader } from './PublicHeader';
import { PublicFooter } from './PublicFooter';
import { SpaLink } from '../common/SpaLink';

interface NotFoundPageProps {
  onNavigate: (path: string) => void;
  onGetStarted: () => void;
  onLogin: () => void;
}

export const NotFoundPage: React.FC<NotFoundPageProps> = ({
  onNavigate,
  onGetStarted,
  onLogin,
}) => {
  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 font-sans antialiased flex flex-col">
      <SEOHead
        title="Page Not Found (404) — Focus Flow"
        description="The requested page could not be found. Explore Focus Flow's free study timer, Pomodoro tracker, and student planner tools."
        robots="noindex, nofollow"
      />

      <PublicHeader
        currentPath="/404"
        onNavigate={onNavigate}
        onGetStarted={onGetStarted}
        onLogin={onLogin}
      />

      <main className="flex-1 max-w-4xl mx-auto w-full px-4 sm:px-6 lg:px-8 py-16 sm:py-24 text-center flex flex-col items-center justify-center">
        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-indigo-950/80 border border-indigo-800/60 text-xs font-semibold text-indigo-300 mb-6">
          <Compass className="w-3.5 h-3.5 text-indigo-400" />
          <span>404 — Page Not Found</span>
        </div>

        <h1 className="text-4xl sm:text-5xl font-black text-white tracking-tight mb-4">
          This Study Page Doesn&apos;t Exist
        </h1>
        <p className="text-base text-slate-400 max-w-xl mx-auto mb-10 leading-relaxed">
          The URL you entered may have moved or been mistyped. Jump back to the main study workspace or launch one of our free student productivity tools below.
        </p>

        <div className="flex flex-wrap items-center justify-center gap-3 mb-12">
          <SpaLink
            to="/"
            onNavigate={onNavigate}
            className="px-6 py-3 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white text-sm font-bold shadow-lg shadow-indigo-600/30 transition-all inline-flex items-center gap-2"
          >
            <ArrowLeft className="w-4 h-4" />
            <span>Back to Focus Flow Home</span>
          </SpaLink>
          <button
            type="button"
            onClick={onGetStarted}
            className="px-6 py-3 rounded-xl bg-slate-900 hover:bg-slate-800 text-slate-200 text-sm font-semibold border border-slate-800 transition-all"
          >
            Create Free Account
          </button>
        </div>

        <section aria-labelledby="not-found-tools-heading" className="w-full">
          <h2 id="not-found-tools-heading" className="text-sm font-bold uppercase tracking-wider text-slate-400 mb-4">
            Explore Free Productivity Tools for Students
          </h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 text-left">
            <SpaLink
              to="/study-timer"
              onNavigate={onNavigate}
              className="p-4 rounded-xl bg-slate-900 border border-slate-800 hover:border-indigo-500 transition-all"
            >
              <Clock className="w-4 h-4 text-indigo-400 mb-2" />
              <div className="text-sm font-bold text-white">Online Study Timer</div>
              <p className="text-xs text-slate-400 mt-1">Study blocks &amp; ambient audio</p>
            </SpaLink>
            <SpaLink
              to="/pomodoro-timer"
              onNavigate={onNavigate}
              className="p-4 rounded-xl bg-slate-900 border border-slate-800 hover:border-rose-500 transition-all"
            >
              <Flame className="w-4 h-4 text-rose-400 mb-2" />
              <div className="text-sm font-bold text-white">Free Pomodoro Timer</div>
              <p className="text-xs text-slate-400 mt-1">25/5 scientific focus sprints</p>
            </SpaLink>
            <SpaLink
              to="/study-planner"
              onNavigate={onNavigate}
              className="p-4 rounded-xl bg-slate-900 border border-slate-800 hover:border-emerald-500 transition-all"
            >
              <Calendar className="w-4 h-4 text-emerald-400 mb-2" />
              <div className="text-sm font-bold text-white">Free Study Planner</div>
              <p className="text-xs text-slate-400 mt-1">Weekly credit-hour schedule</p>
            </SpaLink>
            <SpaLink
              to="/focus-timer"
              onNavigate={onNavigate}
              className="p-4 rounded-xl bg-slate-900 border border-slate-800 hover:border-violet-500 transition-all"
            >
              <Shield className="w-4 h-4 text-violet-400 mb-2" />
              <div className="text-sm font-bold text-white">Deep Work Focus Timer</div>
              <p className="text-xs text-slate-400 mt-1">Distraction-free focus shield</p>
            </SpaLink>
          </div>
        </section>
      </main>

      <PublicFooter
        onNavigate={onNavigate}
        onGetStarted={onGetStarted}
        onLogin={onLogin}
      />
    </div>
  );
};
