/**
 * Human-friendly error translation utility for Firebase and Application errors.
 * Converts technical exceptions and error codes into clear, actionable messages.
 */

export function getFriendlyErrorMessage(error: unknown, fallbackMessage = 'An unexpected error occurred. Please try again.'): string {
  if (!error) return fallbackMessage;

  let message = '';
  let code = '';

  if (typeof error === 'string') {
    message = error;
  } else if (error instanceof Error) {
    message = error.message;
    if ('code' in error && typeof (error as { code: unknown }).code === 'string') {
      code = (error as { code: string }).code;
    }
  }

  // Check if the message contains FirestoreErrorInfo JSON
  if (message.startsWith('{') && message.includes('operationType')) {
    try {
      const parsed = JSON.parse(message);
      if (parsed.error) {
        message = parsed.error;
      }
    } catch {
      // ignore parse error
    }
  }

  // Firebase Auth Error Codes
  if (code.includes('auth/invalid-email') || message.includes('auth/invalid-email')) {
    return 'Please enter a valid email address.';
  }
  if (code.includes('auth/user-not-found') || message.includes('auth/user-not-found') || code.includes('auth/invalid-credential') || message.includes('auth/invalid-credential')) {
    return 'Invalid email or password. Please verify your credentials.';
  }
  if (code.includes('auth/wrong-password') || message.includes('auth/wrong-password')) {
    return 'Incorrect password. Please try again or reset your password.';
  }
  if (code.includes('auth/email-already-in-use') || message.includes('auth/email-already-in-use')) {
    return 'An account with this email address already exists. Try signing in instead.';
  }
  if (code.includes('auth/weak-password') || message.includes('auth/weak-password')) {
    return 'Password is too weak. Please use at least 6 characters.';
  }
  if (code.includes('auth/popup-closed-by-user') || message.includes('auth/popup-closed-by-user')) {
    return 'Sign-in window was closed before completion. Please try again.';
  }
  if (code.includes('auth/popup-blocked') || message.includes('auth/popup-blocked')) {
    return 'Sign-in popup was blocked by your browser. Please allow popups for this site.';
  }
  if (code.includes('auth/too-many-requests') || message.includes('auth/too-many-requests')) {
    return 'Too many unsuccessful attempts. Access has been temporarily disabled for security. Please try again later.';
  }
  if (code.includes('auth/network-request-failed') || message.includes('network-request-failed')) {
    return 'Network connection issue. Please check your internet connection.';
  }
  if (code.includes('auth/requires-recent-login') || message.includes('requires-recent-login')) {
    return 'This sensitive action requires recent authentication. Please sign out and sign back in to continue.';
  }

  // Firestore / Database Error Messages
  if (message.includes('permission-denied') || message.includes('PERMISSION_DENIED')) {
    return 'Permission denied. Please ensure you are logged in with the correct account.';
  }
  if (message.includes('unavailable') || message.includes('the client is offline')) {
    return 'You appear to be offline. Your changes will sync automatically once connection is restored.';
  }
  if (message.includes('deadline-exceeded')) {
    return 'The operation timed out. Please check your connection and try again.';
  }
  if (message.includes('resource-exhausted') || message.includes('quota')) {
    return 'Service quota exceeded. Please wait a moment before trying again.';
  }

  // Return cleaned message or fallback
  if (message && !message.includes('Firebase:') && !message.includes('Error:')) {
    return message;
  }

  return fallbackMessage;
}
