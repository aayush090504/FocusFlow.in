import React, { useState, useRef } from 'react';
import { 
  Bug, 
  AlertCircle, 
  Lightbulb, 
  MessageSquare, 
  Send, 
  CheckCircle2, 
  Mail, 
  Loader2, 
  Copy, 
  Check, 
  Sparkles,
  Info
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { useToast } from '../../context/ToastContext';
import { FeedbackType } from '../../types';
import { submitFeedback } from '../../services/feedbackService';
import { isValidEmail } from '../../utils/securityUtils';

const SUPPORT_EMAIL = 'focusflow42@gmail.com';

const FEEDBACK_CATEGORIES: {
  type: FeedbackType;
  label: string;
  shortDesc: string;
  icon: React.ComponentType<{ className?: string }>;
  badgeColor: string;
  placeholder: string;
}[] = [
  {
    type: 'bug_report',
    label: 'Bug Report',
    shortDesc: 'Something is broken or not behaving properly',
    icon: Bug,
    badgeColor: 'text-rose-500 bg-rose-500/10 border-rose-500/20',
    placeholder: 'Describe what went wrong, what you expected to happen, and steps to reproduce the issue...',
  },
  {
    type: 'problem_complaint',
    label: 'Problem / Complaint',
    shortDesc: 'UX friction, layout problem, or unexpected frustration',
    icon: AlertCircle,
    badgeColor: 'text-amber-500 bg-amber-500/10 border-amber-500/20',
    placeholder: 'Tell us what felt difficult, slow, or frustrating during your study workflow...',
  },
  {
    type: 'feature_suggestion',
    label: 'Feature Suggestion',
    shortDesc: 'Idea for a new tool, integration, or improvement',
    icon: Lightbulb,
    badgeColor: 'text-indigo-400 bg-indigo-500/10 border-indigo-500/20',
    placeholder: 'Share your idea for Focus Flow: what would make your study sessions even better?...',
  },
  {
    type: 'general_feedback',
    label: 'General Feedback',
    shortDesc: 'Thoughts, praise, questions, or overall impressions',
    icon: MessageSquare,
    badgeColor: 'text-emerald-500 bg-emerald-500/10 border-emerald-500/20',
    placeholder: 'Share your general experience, encouragement, or thoughts on Focus Flow...',
  },
];

interface FeedbackSectionProps {
  onSuccessClose?: () => void;
}

export const FeedbackSection: React.FC<FeedbackSectionProps> = ({ onSuccessClose }) => {
  const { userProfile, user } = useAuth();
  const { showSuccess, showError } = useToast();

  const [selectedType, setSelectedType] = useState<FeedbackType>('feature_suggestion');
  const [message, setMessage] = useState('');
  const [email, setEmail] = useState(userProfile?.email || user?.email || '');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSubmitted, setIsSubmitted] = useState(false);
  const [validationError, setValidationError] = useState<string | null>(null);
  const [copiedEmail, setCopiedEmail] = useState(false);

  // Protection against rapid duplicate double-clicks
  const lastSubmitTimeRef = useRef<number>(0);

  const activeCategory = FEEDBACK_CATEGORIES.find(c => c.type === selectedType) || FEEDBACK_CATEGORIES[0];
  const charCount = message.length;
  const maxChars = 2000;

  const handleCopySupportEmail = () => {
    navigator.clipboard.writeText(SUPPORT_EMAIL);
    setCopiedEmail(true);
    setTimeout(() => setCopiedEmail(false), 2000);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setValidationError(null);

    // 1. Prevent duplicate submissions within 3 seconds
    const now = Date.now();
    if (now - lastSubmitTimeRef.current < 3000 || isSubmitting) {
      return;
    }

    const trimmedMsg = message.trim();
    const trimmedEmail = email.trim();

    // 2. Validate message length
    if (!trimmedMsg || trimmedMsg.length < 5) {
      setValidationError('Please provide a message with at least 5 characters.');
      return;
    }

    if (trimmedMsg.length > maxChars) {
      setValidationError(`Message is too long (maximum ${maxChars} characters).`);
      return;
    }

    // 3. Validate optional email if provided
    if (trimmedEmail && !isValidEmail(trimmedEmail)) {
      setValidationError('Please provide a valid email address, or leave it blank.');
      return;
    }

    lastSubmitTimeRef.current = now;
    setIsSubmitting(true);

    try {
      await submitFeedback({
        type: selectedType,
        message: trimmedMsg,
        email: trimmedEmail || undefined,
      });

      setIsSubmitted(true);
      showSuccess('Thank you! Your feedback has been received.');
    } catch (err: unknown) {
      console.error('[Feedback Submit Error]', err);
      // Clean, non-sensitive error display
      const friendlyMsg = err instanceof Error && !err.message.includes('{')
        ? err.message
        : 'Unable to submit feedback at this moment. Please try again or reach out to focusflow42@gmail.com.';
      setValidationError(friendlyMsg);
      showError(err, 'Failed to submit feedback.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleResetForm = () => {
    setMessage('');
    setIsSubmitted(false);
    setValidationError(null);
  };

  if (isSubmitted) {
    return (
      <div 
        className="p-6 sm:p-8 rounded-2xl border text-center space-y-5 animate-fade-in"
        style={{
          backgroundColor: 'var(--color-bg-subtle)',
          borderColor: 'var(--color-border-default)',
        }}
      >
        <div 
          className="w-16 h-16 mx-auto rounded-2xl flex items-center justify-center shadow-lg"
          style={{
            backgroundColor: 'var(--color-accent-subtle)',
            color: 'var(--color-accent-subtle-text)',
          }}
        >
          <CheckCircle2 className="w-8 h-8 text-[var(--color-accent-primary)] animate-scale-in" />
        </div>

        <div className="space-y-1.5 max-w-md mx-auto">
          <h3 className="text-lg font-bold tracking-tight" style={{ color: 'var(--color-text-primary)' }}>
            Feedback Received!
          </h3>
          <p className="text-xs leading-relaxed" style={{ color: 'var(--color-text-secondary)' }}>
            Thank you for helping us make Focus Flow better. Your submission has been securely recorded
            in our system and forwarded to the engineering team.
          </p>
        </div>

        <div 
          className="p-3.5 rounded-xl border max-w-sm mx-auto text-xs flex items-center justify-between gap-3"
          style={{
            backgroundColor: 'var(--color-bg-surface)',
            borderColor: 'var(--color-border-default)',
          }}
        >
          <div className="flex items-center gap-2 truncate">
            <Mail className="w-4 h-4 shrink-0 text-[var(--color-accent-primary)]" />
            <span className="truncate font-mono" style={{ color: 'var(--color-text-secondary)' }}>
              {SUPPORT_EMAIL}
            </span>
          </div>
          <button
            type="button"
            onClick={handleCopySupportEmail}
            className="p-1.5 rounded-lg border hover:opacity-80 transition-colors shrink-0"
            style={{
              borderColor: 'var(--color-border-default)',
              color: 'var(--color-text-primary)',
            }}
            title="Copy support email"
          >
            {copiedEmail ? <Check className="w-3.5 h-3.5 text-emerald-500" /> : <Copy className="w-3.5 h-3.5" />}
          </button>
        </div>

        <div className="flex items-center justify-center gap-3 pt-2">
          <button
            type="button"
            onClick={handleResetForm}
            className="px-4 py-2 text-xs font-bold rounded-xl border transition-opacity hover:opacity-80"
            style={{
              borderColor: 'var(--color-border-default)',
              backgroundColor: 'var(--color-bg-surface)',
              color: 'var(--color-text-primary)',
            }}
          >
            Send Another Message
          </button>
          {onSuccessClose && (
            <button
              type="button"
              onClick={onSuccessClose}
              className="px-4 py-2 text-xs font-bold rounded-xl text-white shadow-sm transition-opacity hover:opacity-90"
              style={{
                backgroundColor: 'var(--color-accent-primary)',
              }}
            >
              Done
            </button>
          )}
        </div>
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      {/* Intro Header */}
      <div 
        className="p-4 rounded-xl border flex items-start gap-3.5"
        style={{
          backgroundColor: 'var(--color-bg-subtle)',
          borderColor: 'var(--color-border-default)',
        }}
      >
        <div 
          className="w-10 h-10 rounded-xl flex items-center justify-center shadow-xs shrink-0 mt-0.5"
          style={{
            backgroundColor: 'var(--color-accent-subtle)',
            color: 'var(--color-accent-subtle-text)',
          }}
        >
          <Sparkles className="w-5 h-5" />
        </div>
        <div className="flex-1 min-w-0">
          <h3 className="text-sm font-bold tracking-tight" style={{ color: 'var(--color-text-primary)' }}>
            Feedback & Feature Suggestions
          </h3>
          <p className="text-xs mt-0.5 leading-relaxed" style={{ color: 'var(--color-text-secondary)' }}>
            We build Focus Flow for you! Report bugs, suggest new tools, or tell us how we can make your
            study sessions more productive.
          </p>
        </div>
      </div>

      {/* Category Selection */}
      <div className="space-y-2">
        <label className="block text-xs font-bold uppercase tracking-wider" style={{ color: 'var(--color-text-secondary)' }}>
          Select Feedback Type <span className="text-rose-500">*</span>
        </label>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
          {FEEDBACK_CATEGORIES.map((cat) => {
            const Icon = cat.icon;
            const isSelected = selectedType === cat.type;
            return (
              <button
                key={cat.type}
                type="button"
                onClick={() => setSelectedType(cat.type)}
                className={`p-3 rounded-xl border text-left flex items-start gap-3 transition-all ${
                  isSelected
                    ? 'ring-2 ring-[var(--color-accent-primary)] shadow-sm'
                    : 'hover:opacity-85'
                }`}
                style={{
                  backgroundColor: isSelected ? 'var(--color-accent-subtle)' : 'var(--color-bg-surface)',
                  borderColor: isSelected ? 'var(--color-accent-primary)' : 'var(--color-border-default)',
                }}
              >
                <div className={`p-2 rounded-lg border shrink-0 ${cat.badgeColor}`}>
                  <Icon className="w-4 h-4" />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="text-xs font-bold truncate" style={{ color: 'var(--color-text-primary)' }}>
                    {cat.label}
                  </div>
                  <div className="text-[11px] leading-snug line-clamp-2 mt-0.5" style={{ color: 'var(--color-text-muted)' }}>
                    {cat.shortDesc}
                  </div>
                </div>
              </button>
            );
          })}
        </div>
      </div>

      {/* Message Textarea */}
      <div className="space-y-1.5">
        <div className="flex items-center justify-between">
          <label 
            htmlFor="feedback-message" 
            className="block text-xs font-bold uppercase tracking-wider" 
            style={{ color: 'var(--color-text-secondary)' }}
          >
            Your Message <span className="text-rose-500">*</span>
          </label>
          <span className="text-[11px] font-mono" style={{ color: charCount > maxChars ? 'var(--color-error)' : 'var(--color-text-muted)' }}>
            {charCount}/{maxChars}
          </span>
        </div>
        <textarea
          id="feedback-message"
          rows={4}
          required
          disabled={isSubmitting}
          value={message}
          onChange={(e) => setMessage(e.target.value)}
          placeholder={activeCategory.placeholder}
          className="w-full px-3.5 py-2.5 rounded-xl border text-xs leading-relaxed focus:outline-none focus:ring-2 transition-all resize-y min-h-[110px]"
          style={{
            backgroundColor: 'var(--color-bg-surface)',
            borderColor: 'var(--color-border-default)',
            color: 'var(--color-text-primary)',
          }}
        />
        <p className="text-[11px] flex items-center gap-1" style={{ color: 'var(--color-text-muted)' }}>
          <Info className="w-3 h-3 shrink-0" />
          Minimum 5 characters. Be as specific as possible so our team can help quickly.
        </p>
      </div>

      {/* Optional Contact Email */}
      <div className="space-y-1.5">
        <label 
          htmlFor="feedback-email" 
          className="block text-xs font-bold uppercase tracking-wider" 
          style={{ color: 'var(--color-text-secondary)' }}
        >
          Contact Email <span className="text-xs font-normal normal-case opacity-75">(Optional)</span>
        </label>
        <div className="relative">
          <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none">
            <Mail className="h-4 w-4" style={{ color: 'var(--color-text-muted)' }} />
          </div>
          <input
            id="feedback-email"
            type="email"
            disabled={isSubmitting}
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="your-email@example.com"
            className="w-full pl-10 pr-3.5 py-2.5 rounded-xl border text-xs focus:outline-none focus:ring-2 transition-all"
            style={{
              backgroundColor: 'var(--color-bg-surface)',
              borderColor: 'var(--color-border-default)',
              color: 'var(--color-text-primary)',
            }}
          />
        </div>
        <p className="text-[11px]" style={{ color: 'var(--color-text-muted)' }}>
          Provide your email if you'd like our support team to respond directly.
        </p>
      </div>

      {/* Validation Error Banner */}
      {validationError && (
        <div 
          className="p-3 rounded-xl border flex items-center gap-2.5 text-xs text-rose-500 bg-rose-500/10 border-rose-500/20 animate-fade-in"
          role="alert"
        >
          <AlertCircle className="w-4 h-4 shrink-0" />
          <span>{validationError}</span>
        </div>
      )}

      {/* Footer Actions */}
      <div 
        className="pt-4 border-t flex flex-col sm:flex-row items-center justify-between gap-3"
        style={{ borderColor: 'var(--color-border-default)' }}
      >
        <div className="flex items-center gap-2 text-[11px]" style={{ color: 'var(--color-text-muted)' }}>
          <span>Direct support:</span>
          <button
            type="button"
            onClick={handleCopySupportEmail}
            className="font-mono underline hover:opacity-80 transition-opacity flex items-center gap-1"
          >
            {SUPPORT_EMAIL}
            {copiedEmail ? <Check className="w-3 h-3 text-emerald-500" /> : <Copy className="w-3 h-3" />}
          </button>
        </div>

        <button
          type="submit"
          disabled={isSubmitting || message.trim().length < 5}
          className="w-full sm:w-auto px-5 py-2.5 rounded-xl text-xs font-bold flex items-center justify-center gap-2 text-white shadow-sm transition-all disabled:opacity-50 disabled:cursor-not-allowed hover:opacity-90 cursor-pointer"
          style={{
            backgroundColor: 'var(--color-accent-primary)',
          }}
        >
          {isSubmitting ? (
            <>
              <Loader2 className="w-4 h-4 animate-spin" />
              <span>Submitting...</span>
            </>
          ) : (
            <>
              <Send className="w-4 h-4" />
              <span>Submit Feedback</span>
            </>
          )}
        </button>
      </div>
    </form>
  );
};
