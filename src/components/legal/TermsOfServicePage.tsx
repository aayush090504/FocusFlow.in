import React from 'react';
import { 
  FileText, 
  ArrowLeft, 
  Sparkles, 
  Scale, 
  UserCheck, 
  ShieldAlert, 
  Mail,
  CheckCircle2
} from 'lucide-react';
import { SEOHead } from '../seo/SEOHead';

interface TermsOfServicePageProps {
  onBack?: () => void;
  onNavigate?: (path: string) => void;
  onGetStarted?: () => void;
}

export const TermsOfServicePage: React.FC<TermsOfServicePageProps> = ({ onBack, onNavigate, onGetStarted }) => {
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
    "name": "Terms of Service — Focus Flow",
    "description": "Terms of Service and Student User Agreement for Focus Flow.",
    "url": "https://focusflow.in/terms",
    "publisher": {
      "@type": "Organization",
      "name": "Focus Flow Inc.",
      "url": "https://focusflow.in/"
    }
  };

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 font-sans selection:bg-indigo-500 selection:text-white pb-20">
      <SEOHead
        title="Terms of Service — Focus Flow"
        description="Focus Flow terms of service, user agreement, acceptable use guidelines, and student academic terms."
        canonicalUrl="https://focusflow.in/terms"
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
                <Sparkles className="w-4 h-4" />
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
          <Scale className="w-3.5 h-3.5 text-indigo-400" />
          <span>Student User Agreement & Terms</span>
        </div>
        <h1 className="text-3xl sm:text-4xl font-black text-white tracking-tight mb-3">
          Terms of Service
        </h1>
        <p className="text-sm text-slate-400">
          Last updated: <span className="text-slate-300 font-mono">September 15, 2026</span> • Effective date: <span className="text-slate-300 font-mono">September 15, 2026</span>
        </p>
      </div>

      {/* Main Content */}
      <main className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="p-6 sm:p-10 rounded-2xl bg-slate-900 border border-slate-800 shadow-xl space-y-10 leading-relaxed text-sm text-slate-300">
          
          <section className="space-y-3">
            <h2 className="text-lg font-bold text-white flex items-center gap-2 border-b border-slate-800 pb-2">
              <span className="text-indigo-400">1.</span> Acceptance of Terms
            </h2>
            <p>
              By accessing, browsing, or creating an account on Focus Flow ("focusflow.in", "the Service"), you agree to be bound by these Terms of Service. If you do not agree to all terms and conditions, you must discontinue use of the platform immediately.
            </p>
          </section>

          <section className="space-y-3">
            <h2 className="text-lg font-bold text-white flex items-center gap-2 border-b border-slate-800 pb-2">
              <span className="text-indigo-400">2.</span> Account Registration & Security
            </h2>
            <p>
              When creating an account, you agree to provide truthful, accurate credentials. You are responsible for safeguarding your login credentials and for all activities that occur under your account. You agree to notify us immediately at <span className="text-indigo-300 font-mono">security@focusflow.in</span> if you discover any unauthorized use of your account.
            </p>
          </section>

          <section className="space-y-3">
            <h2 className="text-lg font-bold text-white flex items-center gap-2 border-b border-slate-800 pb-2">
              <span className="text-indigo-400">3.</span> Acceptable Use Policy
            </h2>
            <p>You agree not to misuse Focus Flow services. Forbidden activities include:</p>
            <ul className="list-disc list-inside space-y-2 pl-2 text-slate-300">
              <li>Attempting to probe, scan, or compromise our database or security infrastructure.</li>
              <li>Deploying automated scrapers, denial-of-service bots, or excessive load generators.</li>
              <li>Storing unlawful, harmful, defamatory, or abusive content in public subject or profile fields.</li>
              <li>Impersonating any student, educator, or institutional administrator.</li>
            </ul>
          </section>

          <section className="space-y-3">
            <h2 className="text-lg font-bold text-white flex items-center gap-2 border-b border-slate-800 pb-2">
              <span className="text-indigo-400">4.</span> Intellectual Property & Student Data Ownership
            </h2>
            <p>
              You retain 100% intellectual property ownership of all notes, task descriptions, study schedules, and academic material you enter into Focus Flow. We claim no ownership over your student data. Focus Flow and its brand assets, software architecture, algorithms, and user interface styling remain the exclusive property of Focus Flow Inc.
            </p>
          </section>

          <section className="space-y-3">
            <h2 className="text-lg font-bold text-white flex items-center gap-2 border-b border-slate-800 pb-2">
              <span className="text-indigo-400">5.</span> Service Availability & Disclaimer of Warranties
            </h2>
            <p>
              The Service is provided on an "AS IS" and "AS AVAILABLE" basis. While we maintain a 99.9% uptime standard with automated backups and offline local storage capabilities, we do not warrant that the Service will be completely uninterrupted or error-free at all times.
            </p>
          </section>

          <section className="space-y-3">
            <h2 className="text-lg font-bold text-white flex items-center gap-2 border-b border-slate-800 pb-2">
              <span className="text-indigo-400">6.</span> Contact Information
            </h2>
            <p>
              Questions about the Terms of Service should be directed to our legal department:
            </p>
            <div className="p-4 rounded-xl bg-slate-950 border border-slate-800 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-lg bg-indigo-600/20 text-indigo-400 flex items-center justify-center">
                  <Mail className="w-5 h-5" />
                </div>
                <div>
                  <div className="text-xs text-slate-400">Legal & Compliance Team</div>
                  <div className="text-sm font-mono font-bold text-white">legal@focusflow.in</div>
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
