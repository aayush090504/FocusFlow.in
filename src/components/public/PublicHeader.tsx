import React from 'react';
import { ArrowRight, BookOpen, Clock, Calendar, Shield, Flame } from 'lucide-react';
import { TimerLogoSvg } from '../common/BrandLogo';

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
  return (
    <header className="sticky top-0 z-50 backdrop-blur-xl bg-slate-950/85 border-b border-slate-800/80">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
        {/* Logo & Brand */}
        <button 
          onClick={() => onNavigate('/')}
          className="flex items-center gap-3 text-left group transition-all"
        >
          <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-indigo-600 to-violet-500 flex items-center justify-center shadow-lg shadow-indigo-500/25 border border-indigo-400/20 group-hover:scale-105 transition-transform">
            <TimerLogoSvg className="w-5 h-5 text-white" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="text-xl font-extrabold tracking-tight text-white">Focus Flow</span>
              <span className="hidden sm:inline-block text-[10px] font-bold tracking-wider uppercase px-2 py-0.5 rounded-full bg-indigo-950 text-indigo-400 border border-indigo-800/50">
                focusflow.in
              </span>
            </div>
          </div>
        </button>

        {/* Navigation Links */}
        <nav className="hidden md:flex items-center gap-6 text-xs font-semibold text-slate-400" aria-label="Main Navigation">
          <button
            onClick={() => onNavigate('/study-timer')}
            className={`transition-colors flex items-center gap-1.5 py-1 px-2 rounded-lg ${
              currentPath === '/study-timer' ? 'text-indigo-400 bg-indigo-950/50 border border-indigo-800/40' : 'hover:text-white'
            }`}
          >
            <Clock className="w-3.5 h-3.5" />
            <span>Study Timer</span>
          </button>
          
          <button
            onClick={() => onNavigate('/pomodoro-timer')}
            className={`transition-colors flex items-center gap-1.5 py-1 px-2 rounded-lg ${
              currentPath === '/pomodoro-timer' ? 'text-indigo-400 bg-indigo-950/50 border border-indigo-800/40' : 'hover:text-white'
            }`}
          >
            <Flame className="w-3.5 h-3.5" />
            <span>Pomodoro</span>
          </button>

          <button
            onClick={() => onNavigate('/study-planner')}
            className={`transition-colors flex items-center gap-1.5 py-1 px-2 rounded-lg ${
              currentPath === '/study-planner' ? 'text-indigo-400 bg-indigo-950/50 border border-indigo-800/40' : 'hover:text-white'
            }`}
          >
            <Calendar className="w-3.5 h-3.5" />
            <span>Study Planner</span>
          </button>

          <button
            onClick={() => onNavigate('/focus-timer')}
            className={`transition-colors flex items-center gap-1.5 py-1 px-2 rounded-lg ${
              currentPath === '/focus-timer' ? 'text-indigo-400 bg-indigo-950/50 border border-indigo-800/40' : 'hover:text-white'
            }`}
          >
            <Shield className="w-3.5 h-3.5" />
            <span>Deep Focus</span>
          </button>
        </nav>

        {/* CTA Buttons */}
        <div className="flex items-center gap-3">
          <button
            onClick={onLogin}
            className="px-3.5 py-1.5 text-xs sm:text-sm font-semibold text-slate-300 hover:text-white hover:bg-slate-800/60 rounded-xl transition-all"
          >
            Log In
          </button>
          <button
            onClick={onGetStarted}
            className="px-3.5 py-1.5 text-xs sm:text-sm font-semibold text-white bg-indigo-600 hover:bg-indigo-500 active:bg-indigo-700 rounded-xl shadow-md shadow-indigo-600/30 transition-all flex items-center gap-1.5"
          >
            <span>Get Started</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>
    </header>
  );
};
