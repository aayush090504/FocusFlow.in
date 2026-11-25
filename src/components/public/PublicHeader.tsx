import React from 'react';
import { ArrowRight, Clock, Calendar, Shield, Flame } from 'lucide-react';
import { TimerLogoSvg } from '../common/BrandLogo';
import { SpaLink } from '../common/SpaLink';

interface PublicHeaderProps {
  currentPath: string;
  onNavigate: (path: string) => void;
  onGetStarted: () => void;
  onLogin: () => void;
}

export const PublicHeader: React.FC<PublicHeaderProps> = ({
  currentPath,
  onNavigate,
  onGetStarted,
  onLogin
}) => {
  const navLinks = [
    { to: '/study-timer', label: 'Study Timer', icon: Clock },
    { to: '/pomodoro-timer', label: 'Pomodoro', icon: Flame },
    { to: '/study-planner', label: 'Study Planner', icon: Calendar },
    { to: '/focus-timer', label: 'Deep Focus', icon: Shield },
  ];

  return (
    <header className="sticky top-0 z-50 backdrop-blur-xl bg-slate-950/85 border-b border-slate-800/80">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
        {/* Logo & Brand */}
        <SpaLink
          to="/"
          onNavigate={onNavigate}
          aria-label="Focus Flow Home"
          className="flex items-center gap-3 text-left group transition-all"
        >
          <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-indigo-600 to-violet-500 flex items-center justify-center shadow-lg shadow-indigo-500/25 border border-indigo-400/20 group-hover:scale-105 transition-transform">
            <TimerLogoSvg className="w-5 h-5 text-white" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="text-xl font-extrabold tracking-tight text-white">Focus Flow</span>
              <span className="hidden sm:inline-block text-[10px] font-bold tracking-wider uppercase px-2 py-0.5 rounded-full bg-indigo-950 text-indigo-300 border border-indigo-800/50">
                focusflow.in
              </span>
            </div>
          </div>
        </SpaLink>

        {/* Desktop Navigation Links */}
        <nav className="hidden md:flex items-center gap-5 text-xs font-semibold text-slate-300" aria-label="Main Navigation">
          {navLinks.map(({ to, label, icon: Icon }) => {
            const isActive = currentPath === to;
            return (
              <SpaLink
                key={to}
                to={to}
                onNavigate={onNavigate}
                aria-current={isActive ? 'page' : undefined}
                className={`transition-colors flex items-center gap-1.5 py-1.5 px-2.5 rounded-lg ${
                  isActive
                    ? 'text-indigo-300 bg-indigo-950/60 border border-indigo-800/50'
                    : 'text-slate-300 hover:text-white hover:bg-slate-900/80'
                }`}
              >
                <Icon className="w-3.5 h-3.5" aria-hidden="true" />
                <span>{label}</span>
              </SpaLink>
            );
          })}
        </nav>

        {/* CTA Buttons */}
        <div className="flex items-center gap-2.5 sm:gap-3">
          <button
            type="button"
            onClick={onLogin}
            className="px-3.5 py-2 text-xs sm:text-sm font-semibold text-slate-200 hover:text-white hover:bg-slate-800/60 rounded-xl transition-all"
          >
            Log In
          </button>
          <button
            type="button"
            onClick={onGetStarted}
            className="px-3.5 py-2 text-xs sm:text-sm font-semibold text-white bg-indigo-600 hover:bg-indigo-500 active:bg-indigo-700 rounded-xl shadow-md shadow-indigo-600/30 transition-all flex items-center gap-1.5"
          >
            <span>Get Started</span>
            <ArrowRight className="w-3.5 h-3.5" aria-hidden="true" />
          </button>
        </div>
      </div>

      {/* Mobile Horizontal Navigation Strip */}
      <nav
        className="md:hidden border-t border-slate-800/70 px-4 py-2 flex items-center gap-2 overflow-x-auto no-scrollbar text-xs font-semibold"
        aria-label="Mobile Tool Navigation"
      >
        {navLinks.map(({ to, label, icon: Icon }) => {
          const isActive = currentPath === to;
          return (
            <SpaLink
              key={to}
              to={to}
              onNavigate={onNavigate}
              aria-current={isActive ? 'page' : undefined}
              className={`shrink-0 transition-colors flex items-center gap-1.5 py-1.5 px-3 rounded-lg border ${
                isActive
                  ? 'text-indigo-300 bg-indigo-950/60 border-indigo-700/60'
                  : 'text-slate-300 bg-slate-900/70 border-slate-800 hover:text-white'
              }`}
            >
              <Icon className="w-3.5 h-3.5" aria-hidden="true" />
              <span>{label}</span>
            </SpaLink>
          );
        })}
      </nav>
    </header>
  );
};
