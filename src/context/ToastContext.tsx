import React, { createContext, useContext, useState, useCallback, ReactNode } from 'react';
import { CheckCircle2, AlertCircle, Info, AlertTriangle, X } from 'lucide-react';
import { getFriendlyErrorMessage } from '../utils/errorUtils';

export type ToastType = 'success' | 'error' | 'info' | 'warning';

export interface ToastItem {
  id: string;
  type: ToastType;
  title?: string;
  message: string;
  duration?: number;
}

interface ToastContextType {
  toasts: ToastItem[];
  showToast: (message: string, type?: ToastType, duration?: number, title?: string) => string;
  showSuccess: (message: string, title?: string) => string;
  showError: (error: unknown, fallbackMessage?: string, title?: string) => string;
  showInfo: (message: string, title?: string) => string;
  showWarning: (message: string, title?: string) => string;
  removeToast: (id: string) => void;
  clearAllToasts: () => void;
}

const ToastContext = createContext<ToastContextType | undefined>(undefined);

export const ToastProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [toasts, setToasts] = useState<ToastItem[]>([]);

  const removeToast = useCallback((id: string) => {
    setToasts((prev) => prev.filter((toast) => toast.id !== id));
  }, []);

  const showToast = useCallback((
    message: string, 
    type: ToastType = 'info', 
    duration = 4000, 
    title?: string
  ): string => {
    const id = `toast-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`;
    const newToast: ToastItem = { id, type, title, message, duration };

    setToasts((prev) => [...prev.slice(-4), newToast]); // Keep up to 5 concurrent toasts

    if (duration > 0) {
      setTimeout(() => {
        removeToast(id);
      }, duration);
    }

    return id;
  }, [removeToast]);

  const showSuccess = useCallback((message: string, title = 'Success'): string => {
    return showToast(message, 'success', 3500, title);
  }, [showToast]);

  const showError = useCallback((error: unknown, fallbackMessage = 'An error occurred', title = 'Action Failed'): string => {
    const friendlyMessage = getFriendlyErrorMessage(error, fallbackMessage);
    return showToast(friendlyMessage, 'error', 5500, title);
  }, [showToast]);

  const showInfo = useCallback((message: string, title?: string): string => {
    return showToast(message, 'info', 3500, title);
  }, [showToast]);

  const showWarning = useCallback((message: string, title = 'Attention'): string => {
    return showToast(message, 'warning', 4500, title);
  }, [showToast]);

  const clearAllToasts = useCallback(() => {
    setToasts([]);
  }, []);

  return (
    <ToastContext.Provider
      value={{
        toasts,
        showToast,
        showSuccess,
        showError,
        showInfo,
        showWarning,
        removeToast,
        clearAllToasts
      }}
    >
      {children}
      {/* Toast Render Container */}
      <ToastContainer toasts={toasts} onRemove={removeToast} />
    </ToastContext.Provider>
  );
};

export const useToast = (): ToastContextType => {
  const context = useContext(ToastContext);
  if (!context) {
    throw new Error('useToast must be used within a ToastProvider');
  }
  return context;
};

// Sub-component: Floating Toast Container
const ToastContainer: React.FC<{
  toasts: ToastItem[];
  onRemove: (id: string) => void;
}> = ({ toasts, onRemove }) => {
  if (toasts.length === 0) return null;

  return (
    <aside
      aria-label="Notifications"
      className="fixed bottom-20 md:bottom-6 right-4 sm:right-6 z-[9999] flex flex-col gap-2.5 max-w-sm w-full pointer-events-none"
    >
      {toasts.map((toast) => {
        const getToastStyles = () => {
          switch (toast.type) {
            case 'success':
              return {
                bg: 'bg-emerald-50 dark:bg-emerald-950/90',
                border: 'border-emerald-300 dark:border-emerald-800',
                iconColor: 'text-emerald-600 dark:text-emerald-400',
                titleColor: 'text-emerald-900 dark:text-emerald-200',
                textColor: 'text-emerald-800 dark:text-emerald-300',
                Icon: CheckCircle2,
              };
            case 'error':
              return {
                bg: 'bg-rose-50 dark:bg-rose-950/90',
                border: 'border-rose-300 dark:border-rose-800',
                iconColor: 'text-rose-600 dark:text-rose-400',
                titleColor: 'text-rose-900 dark:text-rose-200',
                textColor: 'text-rose-800 dark:text-rose-300',
                Icon: AlertCircle,
              };
            case 'warning':
              return {
                bg: 'bg-amber-50 dark:bg-amber-950/90',
                border: 'border-amber-300 dark:border-amber-800',
                iconColor: 'text-amber-600 dark:text-amber-400',
                titleColor: 'text-amber-900 dark:text-amber-200',
                textColor: 'text-amber-800 dark:text-amber-300',
                Icon: AlertTriangle,
              };
            case 'info':
            default:
              return {
                bg: 'bg-indigo-50 dark:bg-indigo-950/90',
                border: 'border-indigo-300 dark:border-indigo-800',
                iconColor: 'text-indigo-600 dark:text-indigo-400',
                titleColor: 'text-indigo-900 dark:text-indigo-200',
                textColor: 'text-indigo-800 dark:text-indigo-300',
                Icon: Info,
              };
          }
        };

        const { bg, border, iconColor, titleColor, textColor, Icon } = getToastStyles();

        return (
          <div
            key={toast.id}
            role={toast.type === 'error' ? 'alert' : 'status'}
            aria-live="polite"
            className={`pointer-events-auto flex items-start gap-3 p-4 rounded-xl border shadow-lg backdrop-blur-sm transition-all duration-300 animate-slide-in-right ${bg} ${border}`}
          >
            <Icon className={`w-5 h-5 shrink-0 mt-0.5 ${iconColor}`} />
            <div className="flex-1 min-w-0 pr-1">
              {toast.title && (
                <p className={`text-xs font-bold ${titleColor} mb-0.5`}>
                  {toast.title}
                </p>
              )}
              <p className={`text-xs font-medium ${textColor} leading-relaxed break-words`}>
                {toast.message}
              </p>
            </div>
            <button
              onClick={() => onRemove(toast.id)}
              className="p-1 rounded-lg hover:bg-black/5 dark:hover:bg-white/10 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 transition-colors shrink-0"
              aria-label="Dismiss notification"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        );
      })}
    </aside>
  );
};
