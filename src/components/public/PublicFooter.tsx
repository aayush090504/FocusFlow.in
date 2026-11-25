import React from 'react';
import { ShieldCheck, Clock, Calendar, Flame, Shield } from 'lucide-react';
import { TimerLogoSvg } from '../common/BrandLogo';
import { SpaLink } from '../common/SpaLink';

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
            <SpaLink to="/" onNavigate={onNavigate} className="inline-flex items-center gap-2 group">
              <div className="w-8 h-8 rounded-lg bg-indigo-600 flex items-center justify-center text-white">
                <TimerLogoSvg className="w-4 h-4" />
              </div>
              <span className="text-base font-bold text-white group-hover:text-indigo-300 transition-colors">Focus Flow</span>
            </SpaLink>
            <p className="text-slate-400 text-xs leading-relaxed max-w-sm">
              A free student productivity app and personalized study workspace. Plan courses, use our free Pomodoro timer and online study timer, and build lasting focus streaks.
            </p>
            <div className="text-[11px] font-mono text-indigo-400">
              https://focusflow.in
            </div>
          </div>

          {/* Free Academic Tools */}
          <div>
            <h2 className="text-xs font-bold uppercase tracking-wider text-slate-200 mb-3">Free Web Tools</h2>
            <ul className="space-y-2.5">
              <li>
                <SpaLink
                  to="/study-timer"
                  onNavigate={onNavigate}
                  className="hover:text-white transition-colors inline-flex items-center gap-1.5"
                >
                  <Clock className="w-3 h-3 text-indigo-400" aria-hidden="true" />
                  <span>Online Study Timer</span>
                </SpaLink>
              </li>
              <li>
                <SpaLink
                  to="/pomodoro-timer"
                  onNavigate={onNavigate}
                  className="hover:text-white transition-colors inline-flex items-center gap-1.5"
                >
                  <Flame className="w-3 h-3 text-rose-400" aria-hidden="true" />
                  <span>Free Pomodoro Timer</span>
                </SpaLink>
              </li>
              <li>
                <SpaLink
                  to="/study-planner"
                  onNavigate={onNavigate}
                  className="hover:text-white transition-colors inline-flex items-center gap-1.5"
                >
                  <Calendar className="w-3 h-3 text-emerald-400" aria-hidden="true" />
                  <span>Free Study Planner</span>
                </SpaLink>
              </li>
              <li>
                <SpaLink
                  to="/focus-timer"
                  onNavigate={onNavigate}
                  className="hover:text-white transition-colors inline-flex items-center gap-1.5"
                >
                  <Shield className="w-3 h-3 text-violet-400" aria-hidden="true" />
                  <span>Focus Timer for Studying</span>
                </SpaLink>
              </li>
            </ul>
          </div>

          {/* Academic Features */}
          <div>
            <h2 className="text-xs font-bold uppercase tracking-wider text-slate-200 mb-3">Study Workspace</h2>
            <ul className="space-y-2.5">
              <li><SpaLink to="/#features" onNavigate={() => onNavigate('/')} className="hover:text-white transition-colors">Task Queue &amp; Kanban</SpaLink></li>
              <li><SpaLink to="/study-planner" onNavigate={onNavigate} className="hover:text-white transition-colors">Course Hourly Budgets</SpaLink></li>
              <li><SpaLink to="/#workflow" onNavigate={() => onNavigate('/')} className="hover:text-white transition-colors">Focus Streak Analytics</SpaLink></li>
              <li><SpaLink to="/#themes" onNavigate={() => onNavigate('/')} className="hover:text-white transition-colors">7 Study Themes</SpaLink></li>
            </ul>
          </div>

          {/* Account & Security */}
          <div>
            <h2 className="text-xs font-bold uppercase tracking-wider text-slate-200 mb-3">Student Account</h2>
            <ul className="space-y-2.5">
              <li><button type="button" onClick={onLogin} className="hover:text-white transition-colors text-left">Sign In</button></li>
              <li><button type="button" onClick={onGetStarted} className="hover:text-white transition-colors text-left">Create Free Account</button></li>
              <li><SpaLink to="/contact" onNavigate={onNavigate} className="hover:text-white transition-colors">Contact &amp; Support</SpaLink></li>
              <li className="pt-2">
                <div className="flex items-center gap-1.5 text-emerald-400">
                  <ShieldCheck className="w-4 h-4" aria-hidden="true" />
                  <span className="font-semibold text-[11px]">Cloud Sync Secured</span>
                </div>
              </li>
            </ul>
          </div>
        </div>

        {/* Bottom Bar */}
        <div className="pt-8 border-t border-slate-800/80 flex flex-col sm:flex-row items-center justify-between gap-4 text-slate-400 text-[11px]">
          <div>
            © {new Date().getFullYear()} Focus Flow (<SpaLink to="/" onNavigate={onNavigate} className="hover:text-slate-200">focusflow.in</SpaLink>). Designed for ambitious students.
          </div>
          <nav aria-label="Legal and Support Links" className="flex items-center gap-6">
            <SpaLink to="/privacy" onNavigate={onNavigate} className="hover:text-slate-200 transition-colors">
              Privacy Policy
            </SpaLink>
            <SpaLink to="/terms" onNavigate={onNavigate} className="hover:text-slate-200 transition-colors">
              Terms of Service
            </SpaLink>
            <SpaLink to="/contact" onNavigate={onNavigate} className="hover:text-slate-200 transition-colors">
              Contact &amp; Support
            </SpaLink>
          </nav>
        </div>
      </div>
    </footer>
  );
};
