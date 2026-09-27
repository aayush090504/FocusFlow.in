import React, { useState } from 'react';
import { 
  Mail, 
  ArrowLeft, 
  MessageSquare, 
  Send, 
  CheckCircle2, 
  HelpCircle, 
  LifeBuoy, 
  Clock, 
  ShieldCheck 
} from 'lucide-react';
import { TimerLogoSvg } from '../common/BrandLogo';
import { SEOHead } from '../seo/SEOHead';
import { sanitizeInput, isValidEmail } from '../../utils/securityUtils';

interface ContactSupportPageProps {
  onBack?: () => void;
  onNavigate?: (path: string) => void;
  onGetStarted?: () => void;
}

export const ContactSupportPage: React.FC<ContactSupportPageProps> = ({ onBack, onNavigate, onGetStarted }) => {
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [category, setCategory] = useState<'support' | 'feature' | 'bug' | 'privacy'>('support');
  const [message, setMessage] = useState('');
  const [submitted, setSubmitted] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const handleBack = () => {
    if (onBack) {
      onBack();
    } else if (onNavigate) {
      onNavigate('/');
    } else if (typeof window !== 'undefined') {
      window.history.back();
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    const cleanName = sanitizeInput(name);
    const cleanEmail = email.trim();
    const cleanMessage = sanitizeInput(message);

    if (!cleanName || cleanName.length < 2) {
      setError('Please provide your name (at least 2 characters).');
      return;
    }

    if (!isValidEmail(cleanEmail)) {
      setError('Please provide a valid email address.');
      return;
    }

    if (!cleanMessage || cleanMessage.length < 10) {
      setError('Please enter a descriptive message (at least 10 characters).');
      return;
    }

    setLoading(true);
    setTimeout(() => {
      setLoading(false);
      setSubmitted(true);
    }, 600);
  };

  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "ContactPage",
    "name": "Contact & Student Support — Focus Flow",
    "description": "Get in touch with Focus Flow support, submit feature ideas, or request student help.",
    "url": "https://focusflow.in/contact",
    "publisher": {
      "@type": "Organization",
      "name": "Focus Flow Inc.",
      "url": "https://focusflow.in/"
    }
  };

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 font-sans selection:bg-indigo-500 selection:text-white pb-20">
      <SEOHead
        title="Contact & Support — Focus Flow"
        description="Need help with your study workspace? Contact our dedicated student support team or submit feedback."
        canonicalUrl="https://focusflow.in/contact"
        schemaJson={jsonLd}
      />

      {/* Ambient Glow */}
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
          <LifeBuoy className="w-3.5 h-3.5 text-indigo-400" />
          <span>Student Support & Assistance</span>
        </div>
        <h1 className="text-3xl sm:text-4xl font-black text-white tracking-tight mb-3">
          Contact & Help Center
        </h1>
        <p className="text-sm text-slate-400">
          Have questions, bug reports, or feature suggestions? Our team is here to help your academic journey.
        </p>
      </div>

      <main className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 md:grid-cols-12 gap-8">
          {/* Left Column: Direct Info Cards */}
          <div className="md:col-span-5 space-y-4">
            <div className="p-6 rounded-2xl bg-slate-900 border border-slate-800 space-y-4">
              <h2 className="text-base font-bold text-white flex items-center gap-2">
                <Mail className="w-4 h-4 text-indigo-400" />
                <span>Direct Inquiries</span>
              </h2>

              <div className="space-y-3 text-xs">
                <div className="p-3 rounded-xl bg-slate-950 border border-slate-800">
                  <div className="text-slate-400 mb-1">General & Student Support</div>
                  <a href="mailto:support@focusflow.in" className="text-indigo-300 font-mono font-bold hover:underline">
                    support@focusflow.in
                  </a>
                </div>

                <div className="p-3 rounded-xl bg-slate-950 border border-slate-800">
                  <div className="text-slate-400 mb-1">Privacy & Compliance</div>
                  <a href="mailto:privacy@focusflow.in" className="text-indigo-300 font-mono font-bold hover:underline">
                    privacy@focusflow.in
                  </a>
                </div>
              </div>

              <div className="pt-2 border-t border-slate-800 flex items-center gap-2 text-xs text-slate-400">
                <Clock className="w-3.5 h-3.5 text-indigo-400" />
                <span>Response SLA: Within 24 hours</span>
              </div>
            </div>

            <div className="p-6 rounded-2xl bg-slate-900 border border-slate-800 space-y-3 text-xs">
              <h3 className="font-bold text-white flex items-center gap-2">
                <HelpCircle className="w-4 h-4 text-indigo-400" />
                <span>Quick Shortcuts</span>
              </h3>
              <ul className="space-y-2 text-slate-300">
                {onNavigate && (
                  <>
                    <li>
                      <button onClick={() => onNavigate('/privacy')} className="hover:text-indigo-300 transition-colors text-left">
                        → Privacy Policy
                      </button>
                    </li>
                    <li>
                      <button onClick={() => onNavigate('/terms')} className="hover:text-indigo-300 transition-colors text-left">
                        → Terms of Service
                      </button>
                    </li>
                    <li>
                      <button onClick={() => onNavigate('/pomodoro-timer')} className="hover:text-indigo-300 transition-colors text-left">
                        → Free Online Pomodoro Timer
                      </button>
                    </li>
                  </>
                )}
              </ul>
            </div>
          </div>

          {/* Right Column: Contact Ticket Form */}
          <div className="md:col-span-7">
            <div className="p-6 sm:p-8 rounded-2xl bg-slate-900 border border-slate-800 shadow-xl">
              {submitted ? (
                <div className="p-8 text-center space-y-4">
                  <div className="w-12 h-12 rounded-full bg-emerald-500/20 text-emerald-400 flex items-center justify-center mx-auto">
                    <CheckCircle2 className="w-6 h-6" />
                  </div>
                  <h3 className="text-lg font-bold text-white">Message Received!</h3>
                  <p className="text-xs text-slate-300 max-w-sm mx-auto leading-relaxed">
                    Thank you for reaching out, <strong className="text-white">{name}</strong>. Our student support desk has received your ticket and will reply to <strong className="text-white">{email}</strong> shortly.
                  </p>
                  <button
                    onClick={() => {
                      setSubmitted(false);
                      setMessage('');
                    }}
                    className="px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-xs font-semibold text-white transition-colors"
                  >
                    Send Another Message
                  </button>
                </div>
              ) : (
                <form onSubmit={handleSubmit} className="space-y-4">
                  <h2 className="text-base font-bold text-white flex items-center gap-2">
                    <MessageSquare className="w-4 h-4 text-indigo-400" />
                    <span>Send us a Message</span>
                  </h2>

                  {error && (
                    <div className="p-3 rounded-xl bg-rose-500/10 border border-rose-500/30 text-rose-300 text-xs">
                      {error}
                    </div>
                  )}

                  <div>
                    <label htmlFor="contact-name" className="block text-xs font-semibold text-slate-300 mb-1">
                      Your Name
                    </label>
                    <input
                      id="contact-name"
                      type="text"
                      required
                      value={name}
                      onChange={(e) => setName(e.target.value)}
                      placeholder="e.g. Maya Chen"
                      className="w-full px-3.5 py-2.5 rounded-xl bg-slate-950 border border-slate-800 text-white text-xs focus:outline-none focus:border-indigo-500"
                    />
                  </div>

                  <div>
                    <label htmlFor="contact-email" className="block text-xs font-semibold text-slate-300 mb-1">
                      Your Email Address
                    </label>
                    <input
                      id="contact-email"
                      type="email"
                      required
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      placeholder="student@university.edu"
                      className="w-full px-3.5 py-2.5 rounded-xl bg-slate-950 border border-slate-800 text-white text-xs focus:outline-none focus:border-indigo-500"
                    />
                  </div>

                  <div>
                    <label htmlFor="contact-category" className="block text-xs font-semibold text-slate-300 mb-1">
                      Topic / Category
                    </label>
                    <select
                      id="contact-category"
                      value={category}
                      onChange={(e) => setCategory(e.target.value as any)}
                      className="w-full px-3.5 py-2.5 rounded-xl bg-slate-950 border border-slate-800 text-white text-xs focus:outline-none focus:border-indigo-500"
                    >
                      <option value="support">General Help & Inquiries</option>
                      <option value="bug">Report a Bug / Glitch</option>
                      <option value="feature">Suggest a New Feature</option>
                      <option value="privacy">Security or Privacy Inquiry</option>
                    </select>
                  </div>

                  <div>
                    <label htmlFor="contact-message" className="block text-xs font-semibold text-slate-300 mb-1">
                      How can we help?
                    </label>
                    <textarea
                      id="contact-message"
                      required
                      rows={4}
                      value={message}
                      onChange={(e) => setMessage(e.target.value)}
                      placeholder="Describe your issue or suggestion..."
                      className="w-full px-3.5 py-2.5 rounded-xl bg-slate-950 border border-slate-800 text-white text-xs focus:outline-none focus:border-indigo-500 resize-none"
                    />
                  </div>

                  <button
                    type="submit"
                    disabled={loading}
                    className="w-full py-3 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-bold shadow-md shadow-indigo-600/30 transition-all flex items-center justify-center gap-2 disabled:opacity-50"
                  >
                    {loading ? (
                      <span>Sending...</span>
                    ) : (
                      <>
                        <Send className="w-3.5 h-3.5" />
                        <span>Send Message</span>
                      </>
                    )}
                  </button>
                </form>
              )}
            </div>
          </div>
        </div>
      </main>
    </div>
  );
};
