import { doc, setDoc, serverTimestamp } from 'firebase/firestore';
import { db, auth, handleFirestoreError, OperationType } from '../lib/firebase';
import { FeedbackType } from '../types';
import { sanitizeInput, isValidEmail } from '../utils/securityUtils';

export interface SubmitFeedbackPayload {
  type: FeedbackType;
  message: string;
  email?: string;
}

export interface SubmitFeedbackResult {
  success: boolean;
  feedbackId: string;
  emailSent: boolean;
  error?: string;
}

function generateFeedbackId(): string {
  if (typeof crypto !== 'undefined' && typeof crypto.randomUUID === 'function') {
    return `fb_${crypto.randomUUID().replace(/-/g, '')}`;
  }
  const randomSuffix = Math.random().toString(36).substring(2, 12);
  return `fb_${Date.now()}_${randomSuffix}`;
}

/**
 * Submits user feedback or suggestion to the Firestore `feedback` collection
 * and triggers authenticated server-side email notification to Focus Flow support.
 */
export async function submitFeedback(payload: SubmitFeedbackPayload): Promise<SubmitFeedbackResult> {
  const currentUser = auth.currentUser;
  if (!currentUser) {
    throw new Error('Please sign in to submit feedback.');
  }

  const cleanMessage = sanitizeInput(payload.message || '');
  const cleanEmail = payload.email?.trim() || '';

  // Validation
  if (!cleanMessage || cleanMessage.length < 5) {
    throw new Error('Please enter a message of at least 5 characters.');
  }

  if (cleanMessage.length > 2000) {
    throw new Error('Message cannot exceed 2000 characters.');
  }

  if (cleanEmail && !isValidEmail(cleanEmail)) {
    throw new Error('Please enter a valid email address.');
  }

  const feedbackId = generateFeedbackId();

  // Prepare Firestore document adhering strictly to blueprint and security rules
  const feedbackDocData: Record<string, unknown> = {
    id: feedbackId,
    type: payload.type,
    message: cleanMessage,
    status: 'new',
    userId: currentUser.uid,
    createdAt: serverTimestamp(),
  };

  if (cleanEmail) {
    feedbackDocData.email = cleanEmail;
  }

  // 1. Save to Firestore `feedback` collection
  try {
    const feedbackDocRef = doc(db, 'feedback', feedbackId);
    await setDoc(feedbackDocRef, feedbackDocData);
  } catch (err: unknown) {
    handleFirestoreError(err, OperationType.CREATE, `feedback/${feedbackId}`);
  }

  // 2. Dispatch authenticated server-side email notification
  // Note: Feedback is already safely saved in Firestore. Email failure does NOT invalidate submission.
  let emailSent = false;
  try {
    const idToken = await currentUser.getIdToken();
    const res = await fetch('/api/feedback/notify', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${idToken}`,
      },
      body: JSON.stringify({
        id: feedbackId,
        type: payload.type,
        message: cleanMessage,
        email: cleanEmail || undefined,
        timestamp: new Date().toISOString(),
      }),
    });

    if (res.ok) {
      const data = await res.json();
      emailSent = !!data.emailSent;
    }
  } catch (emailErr) {
    const errCode =
      typeof emailErr === 'object' && emailErr !== null && 'code' in emailErr
        ? String((emailErr as { code: unknown }).code)
        : 'request_failed';
    console.warn(`[Feedback Notification] Server email trigger failed (${errCode}), Firestore entry recorded.`);
  }

  return {
    success: true,
    feedbackId,
    emailSent,
  };
}
