import React from 'react';
import { ShieldCheck, ArrowRight, BookOpen, Clock, Calendar, Flame, Shield } from 'lucide-react';
import { TimerLogoSvg } from '../common/BrandLogo';

interface PublicFooterProps {
  onNavigate: (path: string) => void;
  onGetStarted: () => void;
  onLogin: () => void;
}

export const PublicFooter: React.FC<PublicFooterProps> = ({
  onNavigate,
  onGetStarted,
  onLogin
}) => {
  return (
    <footer className="bg-slate-950 border-t border-slate-800/80 py-12 text-slate-400 text-xs">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-5 gap-8 mb-12">
          {/* Brand */}
          <div className="space-y-3 sm:col-span-2">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-lg bg-indigo-600 flex items-center justify-center text-white">
                <TimerLogoSvg className="w-4 h-4" />
              </div>
              <span className="text-base font-bold text-white">Focus Flow</span>
            </div>
            <p className="text-slate-400 text-xs leading-relaxed max-w-sm">
              The all-in-one student study operating system. Plan courses, master focus intervals, track homework tasks, and maintain uninterrupted study streaks.
            </p>
            <div className="text-[11px] font-mono text-indigo-400">
              https://focusflow.in
            </div>
          </div>

          {/* Free Academic Tools */}
          <div>
            <h4 className="text-xs font-bold uppercase tracking-wider text-slate-300 mb-3">Free Web Tools</h4>
            <ul className="space-y-2.5">
              <li>
                <button 
                  onClick={() => onNavigate('/study-timer')} 
                  className="hover:text-white transition-colors text-left flex items-center gap-1.5"
                >
                  <Clock className="w-3 h-3 text-indigo-400" />
                  <span>Online Study Timer</span>
                </button>
              </li>
              <li>
                <button 
                  onClick={() => onNavigate('/pomodoro-timer')} 
                  className="hover:text-white transition-colors text-left flex items-center gap-1.5"
                >
                  <Flame className="w-3 h-3 text-rose-400" />
                  <span>Pomodoro Timer (25/5)</span>
                </button>
              </li>
              <li>
                <button 
                  onClick={() => onNavigate('/study-planner')} 
                  className="hover:text-white transition-colors text-left flex items-center gap-1.5"
                >
                  <Calendar className="w-3 h-3 text-emerald-400" />
                  <span>Study Planner & Matrix</span>
                </button>
              </li>
              <li>
                <button 
                  onClick={() => onNavigate('/focus-timer')} 
                  className="hover:text-white transition-colors text-left flex items-center gap-1.5"
                >
                  <Shield className="w-3 h-3 text-violet-400" />
                  <span>Deep Focus Timer</span>
                </button>
              </li>
            </ul>
          </div>

          {/* Academic Features */}
          <div>
            <h4 className="text-xs font-bold uppercase tracking-wider text-slate-300 mb-3">Platform Features</h4>
            <ul className="space-y-2.5">
              <li><button onClick={() => onNavigate('/')} className="hover:text-white transition-colors text-left">Task Queue & Kanban</button></li>
              <li><button onClick={() => onNavigate('/')} className="hover:text-white transition-colors text-left">Course Hourly Budgets</button></li>
              <li><button onClick={() => onNavigate('/')} className="hover:text-white transition-colors text-left">Study Streak Analytics</button></li>
              <li><button onClick={() => onNavigate('/')} className="hover:text-white transition-colors text-left">7 Personalized Themes</button></li>
            </ul>
          </div>

          {/* Account & Security */}
          <div>
            <h4 className="text-xs font-bold uppercase tracking-wider text-slate-300 mb-3">Student Workspace</h4>
            <ul className="space-y-2.5">
              <li><button onClick={onLogin} className="hover:text-white transition-colors text-left">Sign In</button></li>
              <li><button onClick={onGetStarted} className="hover:text-white transition-colors text-left">Create Free Account</button></li>
              <li className="pt-2">
                <div className="flex items-center gap-1.5 text-emerald-400">
                  <ShieldCheck className="w-4 h-4" />
                  <span className="font-semibold text-[11px]">Firestore Cloud Secured</span>
                </div>
              </li>
            </ul>
          </div>
        </div>

        {/* Bottom Bar */}
        <div className="pt-8 border-t border-slate-800/80 flex flex-col sm:flex-row items-center justify-between gap-4 text-slate-400 text-[11px]">
          <div>
            © {new Date().getFullYear()} Focus Flow (<a href="https://focusflow.in" className="hover:text-slate-300">focusflow.in</a>). Designed for ambitious students.
          </div>
          <div className="flex items-center gap-6">
            <span className="hover:text-slate-300 cursor-pointer">Privacy Policy</span>
            <span className="hover:text-slate-300 cursor-pointer">Terms of Service</span>
            <span className="hover:text-slate-300 cursor-pointer">Security Overview</span>
          </div>
        </div>
      </div>
    </footer>
  );
};
