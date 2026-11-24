/**
 * Human-friendly error translation and PII redaction utility for Firebase and Application errors.
 * Converts technical exceptions and error codes into clear, actionable messages without exposing PII or internals.
 */

export interface SanitizedFirestoreErrorInfo {
  error: string;
  errorCode?: string;
  operationType: string;
  path: string | null;
  authInfo: {
    userId?: string | null;
    emailVerified?: boolean | null;
    isAnonymous?: boolean | null;
    providerIds: string[];
  };
}

export interface MinimalAuthUserInfo {
  uid?: string | null;
  emailVerified?: boolean | null;
  isAnonymous?: boolean | null;
  providerData?: ReadonlyArray<{ providerId?: string | null }> | null;
}

const EMAIL_IN_TEXT_REGEX = /[a-zA-Z0-9.!#$%&'*+/=?^_`{|}~-]+@[a-zA-Z0-9-]+(?:\.[a-zA-Z0-9-]+)+/g;

export function scrubSensitiveText(input: string): string {
  if (!input) return '';
  return input
    .replace(EMAIL_IN_TEXT_REGEX, '[redacted-email]')
    .replace(/\r?\n\s*at\s+.*/gs, '')
    .trim();
}

export function buildSanitizedFirestoreErrorInfo(
  error: unknown,
  operationType: string,
  path: string | null,
  currentUser: MinimalAuthUserInfo | null | undefined
): SanitizedFirestoreErrorInfo {
  const rawMessage = error instanceof Error ? error.message : String(error ?? 'Unknown error');
  const errorCode =
    typeof error === 'object' && error !== null && 'code' in error
      ? String((error as { code: unknown }).code)
      : undefined;

  const providerIds: string[] = [];
  if (currentUser?.providerData) {
    for (const provider of currentUser.providerData) {
      if (provider.providerId && !providerIds.includes(provider.providerId)) {
        providerIds.push(provider.providerId);
      }
    }
  }

  return {
    error: scrubSensitiveText(rawMessage),
    errorCode,
    operationType,
    path,
    authInfo: {
      userId: currentUser?.uid ?? null,
      emailVerified: currentUser?.emailVerified ?? null,
      isAnonymous: currentUser?.isAnonymous ?? null,
      providerIds,
    },
  };
}

export function getFriendlyErrorMessage(
  error: unknown,
  fallbackMessage = 'An unexpected error occurred. Please try again.'
): string {
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

  // Extract sanitized details if message is serialized FirestoreErrorInfo JSON
  if (message.startsWith('{') && message.includes('operationType')) {
    try {
      const parsed = JSON.parse(message) as { error?: unknown; errorCode?: unknown };
      if (typeof parsed.error === 'string') {
        message = parsed.error;
      }
      if (!code && typeof parsed.errorCode === 'string') {
        code = parsed.errorCode;
      }
    } catch {
      return fallbackMessage;
    }
  }

  // Firebase Auth Error Codes
  if (code.includes('auth/invalid-email') || message.includes('auth/invalid-email')) {
    return 'Please enter a valid email address.';
  }
  if (
    code.includes('auth/user-not-found') ||
    message.includes('auth/user-not-found') ||
    code.includes('auth/invalid-credential') ||
    message.includes('auth/invalid-credential')
  ) {
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
  if (
    code.includes('auth/popup-closed-by-user') ||
    message.includes('auth/popup-closed-by-user') ||
    code.includes('auth/cancelled-popup-request')
  ) {
    return 'Verification window was closed before completion. Please try again.';
  }
  if (code.includes('auth/popup-blocked') || message.includes('auth/popup-blocked')) {
    return 'Verification popup was blocked by your browser. Please allow popups for this site.';
  }
  if (code.includes('auth/user-mismatch') || message.includes('auth/user-mismatch')) {
    return 'The selected Google account does not match your signed-in account.';
  }
  if (code.includes('auth/too-many-requests') || message.includes('auth/too-many-requests')) {
    return 'Too many unsuccessful attempts. Please try again later.';
  }
  if (code.includes('auth/network-request-failed') || message.includes('network-request-failed')) {
    return 'Network connection issue. Please check your internet connection.';
  }
  if (code.includes('auth/requires-recent-login') || message.includes('requires-recent-login')) {
    return 'This sensitive action requires recent authentication. Please verify your credentials and try again.';
  }

  // Firestore / Database Error Messages
  if (
    code.includes('permission-denied') ||
    message.includes('permission-denied') ||
    message.includes('PERMISSION_DENIED')
  ) {
    return 'Permission denied. Please ensure you are logged in with the correct account.';
  }
  if (code.includes('unavailable') || message.includes('unavailable') || message.includes('the client is offline')) {
    return 'You appear to be offline. Your changes will sync automatically once connection is restored.';
  }
  if (code.includes('deadline-exceeded') || message.includes('deadline-exceeded')) {
    return 'The operation timed out. Please check your connection and try again.';
  }
  if (code.includes('resource-exhausted') || message.includes('resource-exhausted') || message.includes('quota')) {
    return 'Service quota exceeded. Please wait a moment before trying again.';
  }

  const scrubbed = scrubSensitiveText(message);
  if (
    scrubbed &&
    !scrubbed.startsWith('{') &&
    !scrubbed.includes('Firebase:') &&
    !scrubbed.includes('Error:')
  ) {
    return scrubbed;
  }

  return fallbackMessage;
}
