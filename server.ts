import express from 'express';
import fs from 'node:fs';
import path from 'path';
import { fileURLToPath } from 'url';
import nodemailer from 'nodemailer';
import dotenv from 'dotenv';
import {
  verifyFirebaseIdToken,
  TokenVerificationError,
} from './server/firebaseTokenVerifier.js';
import {
  escapeHtml,
  stripHeaderControlChars,
  validateFeedbackPayload,
  SlidingWindowRateLimiter,
} from './server/feedbackSecurity.js';
import { createSecurityHeadersMiddleware } from './server/securityHeaders.js';

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const isProduction = process.env.NODE_ENV === 'production';
const PORT = process.env.PORT || 3000;
const SUPPORT_EMAIL = process.env.FEEDBACK_NOTIFICATION_EMAIL || 'focusflow42@gmail.com';

function resolveFirebaseProjectId(): string {
  if (process.env.FIREBASE_PROJECT_ID) {
    return process.env.FIREBASE_PROJECT_ID;
  }
  try {
    const configPath = path.resolve(__dirname, 'firebase-applet-config.json');
    const raw = fs.readFileSync(configPath, 'utf8');
    const parsed = JSON.parse(raw) as { projectId?: unknown };
    if (typeof parsed.projectId === 'string' && parsed.projectId) {
      return parsed.projectId;
    }
  } catch {
    // Fallback handled at verification time
  }
  return '';
}

const FIREBASE_PROJECT_ID = resolveFirebaseProjectId();

// Bounded sliding-window rate limiters (15-minute window)
const RATE_LIMIT_WINDOW_MS = 15 * 60 * 1000;
const uidFeedbackLimiter = new SlidingWindowRateLimiter({
  windowMs: RATE_LIMIT_WINDOW_MS,
  maxRequests: 5,
  maxEntries: 5000,
});
const ipFeedbackLimiter = new SlidingWindowRateLimiter({
  windowMs: RATE_LIMIT_WINDOW_MS,
  maxRequests: 25,
  maxEntries: 5000,
});

async function startServer() {
  const app = express();
  app.disable('x-powered-by');
  // Trust single Cloud Run / load balancer proxy hop for req.ip and X-Forwarded-Proto
  app.set('trust proxy', 1);
  app.use(createSecurityHeadersMiddleware({ isProduction }));
  app.use(
    '/api/csp-report',
    express.json({ limit: '8kb', type: ['application/csp-report', 'application/json'] })
  );
  app.use('/api', express.json({ limit: '16kb' }));

  // CSP Report-Only violation intake (strips query params / PII)
  app.post('/api/csp-report', (req, res) => {
    const body = req.body as Record<string, unknown> | undefined;
    const report =
      body && typeof body['csp-report'] === 'object' && body['csp-report'] !== null
        ? (body['csp-report'] as Record<string, unknown>)
        : body;

    if (report) {
      const directive = stripHeaderControlChars(
        String(report['effective-directive'] || report['violated-directive'] || 'unknown')
      ).slice(0, 64);
      const rawBlocked = String(report['blocked-uri'] || 'unknown');
      const blockedOrigin = stripHeaderControlChars(rawBlocked.split('?')[0]).slice(0, 128);
      console.warn(`[CSP-Report-Only] directive=${directive} blocked=${blockedOrigin}`);
    }
    return res.status(204).end();
  });

  // Authenticated, validated, and rate-limited email notification endpoint for Feedback & Suggestions
  app.post('/api/feedback/notify', async (req, res) => {
    try {
      // 1. Verify Firebase ID Token (uid comes strictly from verified token, never req.body)
      const verifiedUser = await verifyFirebaseIdToken(
        req.headers.authorization,
        FIREBASE_PROJECT_ID
      );

      // 2. Enforce bounded sliding-window rate limiting per authenticated user + generous per-IP guard
      const clientIp = req.ip || req.socket.remoteAddress || 'unknown';
      const uidLimit = uidFeedbackLimiter.check(`uid:${verifiedUser.uid}`);
      const ipLimit = ipFeedbackLimiter.check(`ip:${clientIp}`);

      if (!uidLimit.allowed || !ipLimit.allowed) {
        const retryAfter = Math.max(uidLimit.retryAfterSeconds, ipLimit.retryAfterSeconds);
        res.setHeader('Retry-After', String(retryAfter));
        return res.status(429).json({
          error: 'Too many feedback submissions. Please wait before trying again.',
        });
      }

      // 3. Strictly validate and sanitize payload
      const validation = validateFeedbackPayload(req.body);
      if (!validation.ok || !validation.data) {
        return res.status(400).json({ error: validation.error || 'Invalid feedback submission.' });
      }

      const { id, typeLabel, message, email, timestamp } = validation.data;

      // 4. Check for server-side SMTP credentials
      const smtpHost = process.env.SMTP_HOST;
      const smtpPort = process.env.SMTP_PORT ? parseInt(process.env.SMTP_PORT, 10) : 587;
      const smtpUser = process.env.SMTP_USER;
      const smtpPass = process.env.SMTP_PASS;
      const smtpSecure = process.env.SMTP_SECURE === 'true' || smtpPort === 465;

      if (!smtpHost || !smtpUser || !smtpPass) {
        console.log(`[Feedback Notification] Feedback received (ID: ${id}). SMTP disabled.`);
        return res.status(200).json({
          success: true,
          emailSent: false,
          message: 'Feedback recorded in Firestore.',
        });
      }

      const transporter = nodemailer.createTransport({
        host: smtpHost,
        port: smtpPort,
        secure: smtpSecure,
        auth: {
          user: smtpUser,
          pass: smtpPass,
        },
      });

      const safeId = escapeHtml(id);
      const safeTypeLabel = escapeHtml(typeLabel);
      const safeMessage = escapeHtml(message);
      const safeEmail = email ? escapeHtml(email) : '';
      const safeUserId = escapeHtml(verifiedUser.uid);
      const safeTimestamp = escapeHtml(timestamp);

      const safeSubjectId = stripHeaderControlChars(id).slice(0, 12) || 'Submission';
      const safeSubjectType = stripHeaderControlChars(typeLabel);
      const safeFromUser = stripHeaderControlChars(smtpUser);
      const safeReplyTo = email ? stripHeaderControlChars(email) : undefined;

      const mailOptions = {
        from: `"${safeFromUser}" <${safeFromUser}>`,
        to: SUPPORT_EMAIL,
        replyTo: safeReplyTo,
        subject: `[Focus Flow] New ${safeSubjectType} - ${safeSubjectId}`,
        text: `New Feedback Received on Focus Flow:
Type: ${typeLabel}
User ID: ${verifiedUser.uid}
Contact Email: ${email || 'None provided'}
Date: ${timestamp}

Message:
${message}
`,
        html: `
          <div style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; max-width: 600px; margin: 0 auto; padding: 24px; background: #0f172a; color: #f8fafc; border-radius: 12px; border: 1px solid #334155;">
            <div style="margin-bottom: 20px; border-bottom: 1px solid #1e293b; padding-bottom: 16px;">
              <h2 style="color: #6366f1; margin: 0 0 6px 0; font-size: 20px;">Focus Flow Feedback &amp; Suggestions</h2>
              <span style="display: inline-block; padding: 4px 10px; border-radius: 6px; font-size: 12px; font-weight: bold; background: #1e1b4b; color: #a5b4fc; border: 1px solid #4338ca;">${safeTypeLabel}</span>
            </div>
            <div style="background: #1e293b; padding: 16px; border-radius: 8px; margin-bottom: 20px; border: 1px solid #334155;">
              <p style="margin: 0 0 8px 0; font-size: 13px; color: #94a3b8;"><strong>Reference ID:</strong> <code style="color: #cbd5e1; font-size: 12px;">${safeId}</code></p>
              <p style="margin: 0 0 8px 0; font-size: 13px; color: #94a3b8;"><strong>Sender Email:</strong> ${safeEmail ? `<a href="mailto:${safeEmail}" style="color: #38bdf8;">${safeEmail}</a>` : 'Not provided'}</p>
              <p style="margin: 0 0 8px 0; font-size: 13px; color: #94a3b8;"><strong>User ID:</strong> <code style="color: #cbd5e1; font-size: 12px;">${safeUserId}</code></p>
              <p style="margin: 0; font-size: 13px; color: #94a3b8;"><strong>Timestamp:</strong> ${safeTimestamp}</p>
            </div>
            <div style="background: #090d16; padding: 18px; border-radius: 8px; border-left: 4px solid #6366f1;">
              <h3 style="margin: 0 0 10px 0; font-size: 13px; color: #cbd5e1; text-transform: uppercase; letter-spacing: 0.05em;">Message</h3>
              <p style="margin: 0; font-size: 14px; line-height: 1.6; white-space: pre-wrap; color: #f1f5f9;">${safeMessage}</p>
            </div>
          </div>
        `,
      };

      await transporter.sendMail(mailOptions);
      console.log(`[Feedback Notification] Email dispatched (ID: ${id}).`);
      return res.status(200).json({ success: true, emailSent: true });
    } catch (err) {
      if (err instanceof TokenVerificationError) {
        return res.status(err.statusCode).json({ error: err.message });
      }
      const errCode =
        typeof err === 'object' && err !== null && 'code' in err
          ? String((err as { code: unknown }).code)
          : 'unknown_error';
      console.error(`[Feedback Notification Error] Email dispatch failed (code: ${errCode}).`);
      return res.status(200).json({
        success: true,
        emailSent: false,
        error: 'Email delivery failed, but feedback was saved in Firestore.',
      });
    }
  });

  if (!isProduction) {
    const { createServer: createViteServer } = await import('vite');
    const vite = await createViteServer({
      server: { middlewareMode: true, hmr: process.env.DISABLE_HMR !== 'true' },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    app.use(express.static(path.resolve(__dirname, 'dist')));
    app.get('*', (_req, res) => {
      res.sendFile(path.resolve(__dirname, 'dist', 'index.html'));
    });
  }

  app.listen(Number(PORT), '0.0.0.0', () => {
    console.log(`Focus Flow server running at http://0.0.0.0:${PORT}`);
  });
}

startServer().catch((err) => {
  const errMsg = err instanceof Error ? err.message : 'Unknown error';
  console.error(`Fatal server startup error: ${errMsg}`);
  process.exit(1);
});
