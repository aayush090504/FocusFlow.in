// Local-timezone date helpers to avoid UTC day-shift bugs while staying
// compatible with YYYY-MM-DD strings and ISO-8601 timestamps stored in Firestore.

export function formatLocalDateKey(date: Date = new Date()): string {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

export function parseLocalDateKey(dateKey: string): Date {
  const normalized = dateKey.slice(0, 10);
  const parts = normalized.split('-').map(Number);
  if (parts.length !== 3 || parts.some(isNaN)) {
    const fallback = new Date(dateKey);
    fallback.setHours(0, 0, 0, 0);
    return fallback;
  }
  const [year, month, day] = parts;
  return new Date(year, (month || 1) - 1, day || 1, 0, 0, 0, 0);
}

/**
 * Normalizes either a plain YYYY-MM-DD date string or a full ISO-8601 timestamp
 * into a local YYYY-MM-DD date key.
 */
export function extractLocalDateKey(value?: string): string {
  if (!value) return '';
  if (value.includes('T')) {
    const parsed = new Date(value);
    if (!isNaN(parsed.getTime())) {
      return formatLocalDateKey(parsed);
    }
  }
  return value.slice(0, 10);
}

/**
 * Returns the whole-day difference (laterKey - earlierKey) in local calendar days.
 * Uses Math.round to handle 23h/25h Daylight Saving Time transitions cleanly.
 */
export function getLocalDaysDiff(earlierKey: string, laterKey: string): number {
  const earlier = parseLocalDateKey(earlierKey);
  const later = parseLocalDateKey(laterKey);
  if (isNaN(earlier.getTime()) || isNaN(later.getTime())) {
    return 0;
  }
  return Math.round((later.getTime() - earlier.getTime()) / (1000 * 60 * 60 * 24));
}
