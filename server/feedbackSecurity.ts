export const ALLOWED_FEEDBACK_TYPES = [
  'bug_report',
  'problem_complaint',
  'feature_suggestion',
  'general_feedback',
] as const;

export type ValidFeedbackType = (typeof ALLOWED_FEEDBACK_TYPES)[number];

export const FEEDBACK_TYPE_LABELS: Record<ValidFeedbackType, string> = {
  bug_report: 'Bug Report',
  problem_complaint: 'Problem / Complaint',
  feature_suggestion: 'Feature Suggestion',
  general_feedback: 'General Feedback',
};

export interface ValidatedFeedbackPayload {
  id: string;
  type: ValidFeedbackType;
  typeLabel: string;
  message: string;
  email?: string;
  timestamp: string;
}

export interface FeedbackValidationResult {
  ok: boolean;
  data?: ValidatedFeedbackPayload;
  error?: string;
}

export function escapeHtml(input: string): string {
  return input
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}

export function stripHeaderControlChars(input: string): string {
  return input.replace(/[\r\n\0\x00-\x1f\x7f]/g, ' ').replace(/\s+/g, ' ').trim();
}

export function hasHeaderControlChars(input: string): boolean {
  return /[\r\n\0\x00-\x1f\x7f]/.test(input);
}

export function stripUnsafeMessageControlChars(input: string): string {
  // Preserve tabs/newlines in messages while stripping NUL and non-printable ASCII control chars
  return input.replace(/[\0\x01-\x08\x0b\x0c\x0e-\x1f\x7f]/g, '').trim();
}

const STRICT_SINGLE_EMAIL_REGEX =
  /^[a-zA-Z0-9.!#$%&'*+/=?^_`{|}~-]+@[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?(?:\.[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?)+$/;

export function isStrictSingleEmail(email: string): boolean {
  if (typeof email !== 'string') return false;
  if (hasHeaderControlChars(email)) return false;
  const trimmed = email.trim();
  if (trimmed.length < 3 || trimmed.length > 254) return false;
  if (/[\s,;<>'"\\]/.test(trimmed)) return false;
  return STRICT_SINGLE_EMAIL_REGEX.test(trimmed);
}

const VALID_FEEDBACK_ID_REGEX = /^[a-zA-Z0-9_-]{1,128}$/;

export function validateFeedbackPayload(rawBody: unknown): FeedbackValidationResult {
  if (!rawBody || typeof rawBody !== 'object' || Array.isArray(rawBody)) {
    return { ok: false, error: 'Invalid request body.' };
  }

  const body = rawBody as Record<string, unknown>;

  // 1. Validate type strictly against enum
  if (
    typeof body.type !== 'string' ||
    !(ALLOWED_FEEDBACK_TYPES as readonly string[]).includes(body.type)
  ) {
    return { ok: false, error: 'Invalid feedback category.' };
  }
  const type = body.type as ValidFeedbackType;

  // 2. Validate feedback reference ID (alphanumeric/underscore/hyphen only, no newlines)
  let id: string;
  if (body.id === undefined || body.id === null || body.id === '') {
    id = `fb_${Date.now()}`;
  } else if (typeof body.id === 'string' && VALID_FEEDBACK_ID_REGEX.test(body.id)) {
    id = body.id;
  } else {
    return { ok: false, error: 'Invalid feedback reference ID.' };
  }

  // 3. Validate message
  if (typeof body.message !== 'string') {
    return { ok: false, error: 'Message is required.' };
  }
  const cleanMessage = stripUnsafeMessageControlChars(body.message);
  if (cleanMessage.length < 5 || cleanMessage.length > 2000) {
    return { ok: false, error: 'Message must be between 5 and 2000 characters.' };
  }

  // 4. Validate optional contact email strictly (prevents header/HTML injection)
  let cleanEmail: string | undefined;
  if (body.email !== undefined && body.email !== null && body.email !== '') {
    if (typeof body.email !== 'string' || hasHeaderControlChars(body.email)) {
      return { ok: false, error: 'Invalid email address.' };
    }
    const trimmedEmail = body.email.trim();
    if (!isStrictSingleEmail(trimmedEmail)) {
      return { ok: false, error: 'Invalid email address.' };
    }
    cleanEmail = trimmedEmail;
  }

  // 5. Normalize timestamp safely
  let normalizedTimestamp = new Date().toISOString();
  if (typeof body.timestamp === 'string' && body.timestamp.length <= 64 && !hasHeaderControlChars(body.timestamp)) {
    const parsedTime = Date.parse(body.timestamp);
    if (Number.isFinite(parsedTime)) {
      normalizedTimestamp = new Date(parsedTime).toISOString();
    }
  }

  return {
    ok: true,
    data: {
      id,
      type,
      typeLabel: FEEDBACK_TYPE_LABELS[type],
      message: cleanMessage,
      email: cleanEmail,
      timestamp: normalizedTimestamp,
    },
  };
}

export interface RateLimitResult {
  allowed: boolean;
  retryAfterSeconds: number;
}

export class SlidingWindowRateLimiter {
  private readonly store = new Map<string, number[]>();
  private readonly windowMs: number;
  private readonly maxRequests: number;
  private readonly maxEntries: number;
  private checkCount = 0;

  constructor(options: { windowMs: number; maxRequests: number; maxEntries?: number }) {
    this.windowMs = options.windowMs;
    this.maxRequests = options.maxRequests;
    this.maxEntries = options.maxEntries ?? 5000;
  }

  public check(key: string, nowMs = Date.now()): RateLimitResult {
    this.checkCount += 1;
    if (this.checkCount % 100 === 0 || this.store.size >= this.maxEntries) {
      this.pruneExpired(nowMs);
    }

    const cutoff = nowMs - this.windowMs;
    const existing = this.store.get(key) ?? [];
    const active = existing.filter((ts) => ts > cutoff);

    if (active.length >= this.maxRequests) {
      this.store.set(key, active);
      const oldestActive = active[0];
      const retryAfterMs = Math.max(1000, oldestActive + this.windowMs - nowMs);
      return {
        allowed: false,
        retryAfterSeconds: Math.ceil(retryAfterMs / 1000),
      };
    }

    active.push(nowMs);

    if (!this.store.has(key) && this.store.size >= this.maxEntries) {
      const oldestKey = this.store.keys().next().value;
      if (oldestKey !== undefined) {
        this.store.delete(oldestKey);
      }
    }

    // Re-insert so Map iteration stays roughly LRU/insertion ordered
    this.store.delete(key);
    this.store.set(key, active);

    return {
      allowed: true,
      retryAfterSeconds: 0,
    };
  }

  public get size(): number {
    return this.store.size;
  }

  private pruneExpired(nowMs: number): void {
    const cutoff = nowMs - this.windowMs;
    for (const [k, timestamps] of this.store.entries()) {
      const remaining = timestamps.filter((ts) => ts > cutoff);
      if (remaining.length === 0) {
        this.store.delete(k);
      } else if (remaining.length !== timestamps.length) {
        this.store.set(k, remaining);
      }
    }
  }
}
