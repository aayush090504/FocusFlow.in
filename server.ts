import express from 'express';
import path from 'path';
import { fileURLToPath } from 'url';
import nodemailer from 'nodemailer';
import dotenv from 'dotenv';

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const isProduction = process.env.NODE_ENV === 'production';
const PORT = process.env.PORT || 3000;
const SUPPORT_EMAIL = process.env.FEEDBACK_NOTIFICATION_EMAIL || 'focusflow42@gmail.com';

async function startServer() {
  const app = express();
  app.use(express.json());

  // Server-side email notification endpoint for Feedback & Suggestions
  app.post('/api/feedback/notify', async (req, res) => {
    try {
      const { id, type, message, email, userId, timestamp } = req.body;

      if (!message || typeof message !== 'string') {
        return res.status(400).json({ error: 'Message is required' });
      }

      const typeLabels: Record<string, string> = {
        bug_report: 'Bug Report',
        problem_complaint: 'Problem / Complaint',
        feature_suggestion: 'Feature Suggestion',
        general_feedback: 'General Feedback',
      };

      const typeLabel = typeLabels[type] || 'Feedback Submission';

      // Check for server-side SMTP credentials
      const smtpHost = process.env.SMTP_HOST;
      const smtpPort = process.env.SMTP_PORT ? parseInt(process.env.SMTP_PORT, 10) : 587;
      const smtpUser = process.env.SMTP_USER;
      const smtpPass = process.env.SMTP_PASS;
      const smtpSecure = process.env.SMTP_SECURE === 'true' || smtpPort === 465;

      if (!smtpHost || !smtpUser || !smtpPass) {
        console.log(`[Feedback Notification] New feedback received (ID: ${id || 'unknown'}).`);
        console.log(`[Feedback Notification] SMTP credentials not set. To send live emails to ${SUPPORT_EMAIL}, define SMTP_HOST, SMTP_USER, and SMTP_PASS in environment variables.`);
        return res.status(200).json({
          success: true,
          emailSent: false,
          message: `Feedback recorded in Firestore. Email notification to ${SUPPORT_EMAIL} is ready once SMTP credentials are provided in environment variables.`,
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

      const safeMessage = message.replace(/</g, '&lt;').replace(/>/g, '&gt;');

      const mailOptions = {
        from: `"${smtpUser}" <${smtpUser}>`,
        to: SUPPORT_EMAIL,
        replyTo: email && typeof email === 'string' && email.includes('@') ? email : undefined,
        subject: `[Focus Flow] New ${typeLabel} - ${id ? String(id).slice(0, 12) : 'Submission'}`,
        text: `New Feedback Received on Focus Flow:
Type: ${typeLabel}
User ID: ${userId || 'Unauthenticated / Anonymous'}
Contact Email: ${email || 'None provided'}
Date: ${timestamp || new Date().toISOString()}

Message:
${message}
`,
        html: `
          <div style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; max-width: 600px; margin: 0 auto; padding: 24px; background: #0f172a; color: #f8fafc; border-radius: 12px; border: 1px solid #334155;">
            <div style="margin-bottom: 20px; border-bottom: 1px solid #1e293b; padding-bottom: 16px;">
              <h2 style="color: #6366f1; margin: 0 0 6px 0; font-size: 20px;">Focus Flow Feedback & Suggestions</h2>
              <span style="display: inline-block; padding: 4px 10px; border-radius: 6px; font-size: 12px; font-weight: bold; background: #1e1b4b; color: #a5b4fc; border: 1px solid #4338ca;">${typeLabel}</span>
            </div>
            <div style="background: #1e293b; padding: 16px; border-radius: 8px; margin-bottom: 20px; border: 1px solid #334155;">
              <p style="margin: 0 0 8px 0; font-size: 13px; color: #94a3b8;"><strong>Sender Email:</strong> ${email ? `<a href="mailto:${email}" style="color: #38bdf8;">${email}</a>` : 'Not provided'}</p>
              <p style="margin: 0 0 8px 0; font-size: 13px; color: #94a3b8;"><strong>User ID:</strong> <code style="color: #cbd5e1; font-size: 12px;">${userId || 'Anonymous / Guest'}</code></p>
              <p style="margin: 0; font-size: 13px; color: #94a3b8;"><strong>Timestamp:</strong> ${timestamp || new Date().toISOString()}</p>
            </div>
            <div style="background: #090d16; padding: 18px; border-radius: 8px; border-left: 4px solid #6366f1;">
              <h3 style="margin: 0 0 10px 0; font-size: 13px; color: #cbd5e1; text-transform: uppercase; letter-spacing: 0.05em;">Message</h3>
              <p style="margin: 0; font-size: 14px; line-height: 1.6; white-space: pre-wrap; color: #f1f5f9;">${safeMessage}</p>
            </div>
          </div>
        `,
      };

      await transporter.sendMail(mailOptions);
      console.log(`[Feedback Notification] Email dispatched to ${SUPPORT_EMAIL}`);
      return res.status(200).json({ success: true, emailSent: true });
    } catch (err) {
      console.error('[Feedback Notification Error]', err);
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
  console.error('Fatal server startup error:', err);
  process.exit(1);
});
