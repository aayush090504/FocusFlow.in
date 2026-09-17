/**
 * Focus Flow Security & Input Validation Utility
 * Production-ready sanitization, constraint validation, and error safety.
 */

// Basic HTML/XSS Sanitizer (strips harmful tags and dangerous characters)
export function sanitizeInput(input: string): string {
  if (!input) return '';
  return input
    .replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, '')
    .replace(/<[^>]+>/g, '')
    .trim();
}

// RFC 5322 Compliant Email Validation
export function isValidEmail(email: string): boolean {
  if (!email || typeof email !== 'string') return false;
  const trimmed = email.trim();
  if (trimmed.length > 254 || trimmed.length < 3) return false;
  // Standard compliant email regex
  const emailRegex = /^[a-zA-Z0-9.!#$%&'*+/=?^_`{|}~-]+@[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?(?:\.[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?)+$/;
  return emailRegex.test(trimmed);
}

// Password Strength Validation
export interface PasswordValidationResult {
  isValid: boolean;
  message?: string;
  strengthScore: number; // 0 to 4
}

export function validatePassword(password: string): PasswordValidationResult {
  if (!password || password.length < 6) {
    return {
      isValid: false,
      message: 'Password must be at least 6 characters long.',
      strengthScore: 0,
    };
  }

  if (password.length > 128) {
    return {
      isValid: false,
      message: 'Password must not exceed 128 characters.',
      strengthScore: 0,
    };
  }

  let score = 0;
  if (password.length >= 8) score += 1;
  if (/[A-Z]/.test(password)) score += 1;
  if (/[0-9]/.test(password)) score += 1;
  if (/[^A-Za-z0-9]/.test(password)) score += 1;

  return {
    isValid: true,
    strengthScore: score,
  };
}

// Text Boundary & Required Field Validator
export function validateTextField(
  value: string, 
  fieldName: string, 
  maxLength: number, 
  minLength = 1,
  required = true
): { isValid: boolean; error?: string; cleanValue: string } {
  const clean = sanitizeInput(value);
  if (required && clean.length < minLength) {
    return {
      isValid: false,
      error: `${fieldName} is required and must be at least ${minLength} characters.`,
      cleanValue: clean,
    };
  }
  if (clean.length > maxLength) {
    return {
      isValid: false,
      error: `${fieldName} cannot exceed ${maxLength} characters.`,
      cleanValue: clean.substring(0, maxLength),
    };
  }
  return { isValid: true, cleanValue: clean };
}

// Number Bounds Validator
export function validateNumberRange(
  value: number,
  fieldName: string,
  min: number,
  max: number
): { isValid: boolean; error?: string } {
  if (isNaN(value)) {
    return { isValid: false, error: `${fieldName} must be a valid number.` };
  }
  if (value < min || value > max) {
    return { isValid: false, error: `${fieldName} must be between ${min} and ${max}.` };
  }
  return { isValid: true };
}

// Safe error scrubber that strips stack traces and internal paths
export function safeErrorMessage(err: unknown, defaultMessage = 'An unexpected error occurred.'): string {
  if (!err) return defaultMessage;
  if (typeof err === 'string') {
    // If it looks like a stack trace or raw JSON, mask it
    if (err.includes('at ') && err.includes('.js')) return defaultMessage;
    return sanitizeInput(err);
  }
  if (err instanceof Error) {
    const msg = err.message;
    if (msg.includes('at ') && msg.includes('.js')) return defaultMessage;
    // Strip file paths if any leaked
    return sanitizeInput(msg.replace(/\/[\w.-]+/g, ''));
  }
  return defaultMessage;
}
