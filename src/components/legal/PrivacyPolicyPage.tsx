import React from 'react';
import { 
  ShieldCheck, 
  ArrowLeft, 
  Lock, 
  Eye, 
  Database, 
  UserCheck, 
  Globe, 
  Mail, 
  ExternalLink
} from 'lucide-react';
import { TimerLogoSvg } from '../common/BrandLogo';
import { SEOHead } from '../seo/SEOHead';

interface PrivacyPolicyPageProps {
  onBack?: () => void;
  onNavigate?: (path: string) => void;
  onGetStarted?: () => void;
}

export const PrivacyPolicyPage: React.FC<PrivacyPolicyPageProps> = ({ onBack, onNavigate, onGetStarted }) => {
  const handleBack = () => {
    if (onBack) {
      onBack();
    } else if (onNavigate) {
      onNavigate('/');
    } else if (typeof window !== 'undefined') {
      window.history.back();
    }
  };

  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "WebPage",
    "name": "Privacy Policy — Focus Flow",
    "description": "Privacy Policy and Student Data Protection Standards for Focus Flow.",
    "url": "https://focusflow.in/privacy",
    "publisher": {
      "@type": "Organization",
      "name": "Focus Flow Inc.",
      "url": "https://focusflow.in/"
    }
  };

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 font-sans selection:bg-indigo-500 selection:text-white pb-20">
      <SEOHead
        title="Privacy Policy — Focus Flow"
        description="Learn how Focus Flow protects your student privacy, encrypts your study logs, and ensures zero unauthorized data sharing."
        canonicalUrl="https://focusflow.in/privacy"
        schemaJson={jsonLd}
      />

      {/* Top Ambient Glow */}
      <div className="fixed top-0 left-1/2 -translate-x-1/2 w-full max-w-5xl h-64 bg-gradient-to-b from-indigo-900/20 via-violet-900/10 to-transparent blur-3xl pointer-events-none -z-10" />

      {/* Navigation Header */}
      <header className="sticky top-0 z-40 backdrop-blur-xl bg-slate-950/80 border-b border-slate-800/80">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <button
              onClick={handleBack}
              className="p-2 rounded-xl bg-slate-900 hover:bg-slate-800 text-slate-300 hover:text-white border border-slate-800 transition-colors flex items-center gap-1.5 text-xs font-semibold"
              aria-label="Back to home"
            >
              <ArrowLeft className="w-4 h-4" />
              <span className="hidden sm:inline">Back to Home</span>
            </button>
            <div className="flex items-center gap-2 pl-2 border-l border-slate-800">
              <div className="w-7 h-7 rounded-lg bg-indigo-600 flex items-center justify-center text-white">
                <TimerLogoSvg className="w-4 h-4" />
              </div>
              <span className="font-bold text-white text-sm hidden sm:inline">Focus Flow</span>
            </div>
          </div>

          <div className="flex items-center gap-3">
            {onGetStarted && (
              <button
                onClick={onGetStarted}
                className="px-4 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-bold shadow-md shadow-indigo-600/30 transition-all"
              >
                Launch App
              </button>
            )}
          </div>
        </div>
      </header>

      {/* Hero Header */}
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 pt-12 pb-8">
        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-indigo-950/80 border border-indigo-800/50 text-xs font-semibold text-indigo-300 mb-4">
          <ShieldCheck className="w-3.5 h-3.5 text-indigo-400" />
          <span>Student Privacy & Data Security Standard</span>
        </div>
        <h1 className="text-3xl sm:text-4xl font-black text-white tracking-tight mb-3">
          Privacy Policy
        </h1>
        <p className="text-sm text-slate-400">
          Last updated: <span className="text-slate-300 font-mono">September 15, 2026</span> • Effective date: <span className="text-slate-300 font-mono">September 15, 2026</span>
        </p>
      </div>

      {/* Main Content */}
      <main className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="p-6 sm:p-10 rounded-2xl bg-slate-900 border border-slate-800 shadow-xl space-y-10 leading-relaxed text-sm text-slate-300">
          
          {/* Summary Box */}
          <div className="p-5 rounded-xl bg-indigo-950/40 border border-indigo-800/40 text-indigo-200">
            <h2 className="text-base font-bold text-white flex items-center gap-2 mb-2">
              <Lock className="w-4 h-4 text-indigo-400" />
              <span>Core Privacy Summary</span>
            </h2>
            <p className="text-xs sm:text-sm text-indigo-200/90 leading-relaxed">
              Focus Flow is dedicated to student productivity. We believe your academic work, course lists, focus intervals, and study habits belong solely to you. We do not sell your personal information, display third-party advertisements, or share your study records with data brokers.
            </p>
          </div>

          {/* Section 1 */}
          <section className="space-y-3">
            <h2 className="text-lg font-bold text-white flex items-center gap-2 border-b border-slate-800 pb-2">
              <span className="text-indigo-400">1.</span> Information We Collect
            </h2>
            <p>
              When you create an account and utilize Focus Flow, we collect the minimum necessary data to provide our personalized study workspace services:
            </p>
            <ul className="list-disc list-inside space-y-2 pl-2 text-slate-300">
              <li>
                <strong className="text-white">Account Information:</strong> Your email address, display name, profile avatar selection, and cryptographic authentication credentials managed via Google Identity or Firebase Authentication.
              </li>
              <li>
                <strong className="text-white">Study & Academic Records:</strong> Course/subject names, target weekly hourly budgets, tasks, assignments, priorities, due dates, milestone goals, and completed focus timer logs.
              </li>
              <li>
                <strong className="text-white">Workspace Preferences:</strong> Theme settings (e.g. Calm, Ocean, Sakura), soundscape preferences, notification switches, and daily target minutes.
              </li>
              <li>
                <strong className="text-white">Technical Device Telemetry:</strong> Standard browser user-agent and connection diagnostics used strictly for bug resolution and load balancing.
              </li>
            </ul>
          </section>

          {/* Section 2 */}
          <section className="space-y-3">
            <h2 className="text-lg font-bold text-white flex items-center gap-2 border-b border-slate-800 pb-2">
              <span className="text-indigo-400">2.</span> How We Use Your Information
            </h2>
            <p>We process your data exclusively to deliver and maintain your study environment:</p>
            <ul className="list-disc list-inside space-y-2 pl-2 text-slate-300">
              <li>Synchronizing your tasks, timer sessions, and progress across all your devices in real time.</li>
              <li>Calculating your study streaks, subject completion rates, and daily velocity analytics.</li>
              <li>Sending optional student reminders (e.g. daily study alerts and streak milestone celebrations).</li>
              <li>Enforcing security safeguards, rate limiting, and zero-trust authentication checks.</li>
            </ul>
          </section>

          {/* Section 3 */}
          <section className="space-y-3">
            <h2 className="text-lg font-bold text-white flex items-center gap-2 border-b border-slate-800 pb-2">
              <span className="text-indigo-400">3.</span> Data Security & Zero-Trust Architecture
            </h2>
            <p>
              Your personal study workspace is protected with industry-standard cryptographic protections and strict database access controls:
            </p>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 my-3">
              <div className="p-4 rounded-xl bg-slate-950 border border-slate-800">
                <div className="flex items-center gap-2 text-emerald-400 font-bold text-xs mb-1">
                  <Database className="w-4 h-4" />
                  <span>Isolated Subcollections</span>
                </div>
                <p className="text-xs text-slate-400">
                  Every user's tasks, courses, and timer logs are stored under isolated per-user Firestore paths.
                </p>
              </div>
              <div className="p-4 rounded-xl bg-slate-950 border border-slate-800">
                <div className="flex items-center gap-2 text-indigo-400 font-bold text-xs mb-1">
                  <ShieldCheck className="w-4 h-4" />
                  <span>ABAC Security Rules</span>
                </div>
                <p className="text-xs text-slate-400">
                  Strict security rules verify that only your authenticated user ID can read or mutate your study logs.
                </p>
              </div>
            </div>
            <p className="text-xs text-slate-400">
              All data transmission occurs over encrypted HTTPS/TLS 1.3 connections, and database records are encrypted at rest using AES-256 standards.
            </p>
          </section>

          {/* Section 4 */}
          <section className="space-y-3">
            <h2 className="text-lg font-bold text-white flex items-center gap-2 border-b border-slate-800 pb-2">
              <span className="text-indigo-400">4.</span> Data Portability & Complete Deletion Rights
            </h2>
            <p>
              You maintain 100% ownership of your study records at all times:
            </p>
            <ul className="list-disc list-inside space-y-2 pl-2 text-slate-300">
              <li>
                <strong className="text-white">Export Anytime:</strong> You can download a complete JSON backup of all your subjects, tasks, focus sessions, and goals directly inside <span className="text-indigo-300 font-semibold">Settings &gt; Account &gt; Export Study Data</span>.
              </li>
              <li>
                <strong className="text-white">Account Deletion:</strong> You may permanently delete your account and associated database records directly within your workspace settings.
              </li>
            </ul>
          </section>

          {/* Section 5 */}
          <section className="space-y-3">
            <h2 className="text-lg font-bold text-white flex items-center gap-2 border-b border-slate-800 pb-2">
              <span className="text-indigo-400">5.</span> Cookies & Local Storage
            </h2>
            <p>
              Focus Flow uses secure client-side storage solely for essential operational purposes, such as maintaining your authentication session, remembering your selected aesthetic theme, and caching timer state during page reloads. We do not employ third-party advertising or cross-site tracking cookies.
            </p>
          </section>

          {/* Section 6 */}
          <section className="space-y-3">
            <h2 className="text-lg font-bold text-white flex items-center gap-2 border-b border-slate-800 pb-2">
              <span className="text-indigo-400">6.</span> Contact & Privacy Inquiries
            </h2>
            <p>
              If you have any questions regarding this Privacy Policy, your rights under GDPR/CCPA, or wish to make an inquiry, please contact our data protection team:
            </p>
            <div className="p-4 rounded-xl bg-slate-950 border border-slate-800 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-lg bg-indigo-600/20 text-indigo-400 flex items-center justify-center">
                  <Mail className="w-5 h-5" />
                </div>
                <div>
                  <div className="text-xs text-slate-400">Privacy & Security Officer</div>
                  <div className="text-sm font-mono font-bold text-white">privacy@focusflow.in</div>
                </div>
              </div>
              {onNavigate && (
                <button
                  onClick={() => onNavigate('/contact')}
                  className="px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-xs font-semibold text-slate-200 transition-colors"
                >
                  Contact Support
                </button>
              )}
            </div>
          </section>

        </div>
      </main>
    </div>
  );
};
