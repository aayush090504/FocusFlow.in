import type { Request, Response, NextFunction } from 'express';

export interface SecurityHeadersOptions {
  isProduction: boolean;
}

export function buildReportOnlyCsp(isProduction: boolean): string {
  const scriptSrc = [
    "'self'",
    "'unsafe-inline'",
    'https://apis.google.com',
    'https://accounts.google.com',
    'https://www.gstatic.com',
  ];

  const connectSrc = [
    "'self'",
    'https://*.googleapis.com',
    'https://*.firebaseio.com',
    'https://*.firebaseapp.com',
    'https://apis.google.com',
    'https://accounts.google.com',
    'https://securetoken.googleapis.com',
    'https://identitytoolkit.googleapis.com',
    'wss://*.firebaseio.com',
  ];

  if (!isProduction) {
    connectSrc.push('ws:', 'wss:');
  }

  return [
    "default-src 'self'",
    `script-src ${scriptSrc.join(' ')}`,
    "style-src 'self' 'unsafe-inline' https://fonts.googleapis.com",
    "font-src 'self' https://fonts.gstatic.com data:",
    "img-src 'self' data: blob: https://*.googleusercontent.com https://www.gstatic.com",
    "media-src 'self' blob: data:",
    `connect-src ${connectSrc.join(' ')}`,
    "frame-src 'self' https://*.firebaseapp.com https://accounts.google.com https://apis.google.com",
    "object-src 'none'",
    "base-uri 'self'",
    "form-action 'self'",
    'report-uri /api/csp-report',
  ].join('; ');
}

export function getSecurityHeadersForRequest(
  options: SecurityHeadersOptions,
  isHttpsRequest: boolean
): Record<string, string> {
  const headers: Record<string, string> = {
    'X-Content-Type-Options': 'nosniff',
    'Referrer-Policy': 'strict-origin-when-cross-origin',
    'Permissions-Policy': 'camera=(), microphone=(), geolocation=()',
    // Allow Firebase OAuth popups (Google Sign-In / Re-auth) while isolating cross-origin openers
    'Cross-Origin-Opener-Policy': 'same-origin-allow-popups',
    // Report-Only first to collect real-world violation reports before enforcing
    'Content-Security-Policy-Report-Only': buildReportOnlyCsp(options.isProduction),
  };

  if (options.isProduction && isHttpsRequest) {
    headers['Strict-Transport-Security'] = 'max-age=31536000; includeSubDomains';
  }

  return headers;
}

export function createSecurityHeadersMiddleware(options: SecurityHeadersOptions) {
  return (req: Request, res: Response, next: NextFunction): void => {
    const forwardedProto = req.headers['x-forwarded-proto'];
    const isHttps =
      req.secure ||
      (typeof forwardedProto === 'string' && forwardedProto.split(',')[0].trim() === 'https');

    const headers = getSecurityHeadersForRequest(options, isHttps);
    for (const [name, value] of Object.entries(headers)) {
      res.setHeader(name, value);
    }
    next();
  };
}
