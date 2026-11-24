import test from 'node:test';
import assert from 'node:assert/strict';
import {
  buildReportOnlyCsp,
  getSecurityHeadersForRequest,
} from './securityHeaders.js';

test('getSecurityHeadersForRequest emits hardened headers without breaking iframe preview or OAuth popups', () => {
  const devHeaders = getSecurityHeadersForRequest({ isProduction: false }, false);
  assert.equal(devHeaders['X-Content-Type-Options'], 'nosniff');
  assert.equal(devHeaders['Referrer-Policy'], 'strict-origin-when-cross-origin');
  assert.equal(devHeaders['Permissions-Policy'], 'camera=(), microphone=(), geolocation=()');
  assert.equal(devHeaders['Cross-Origin-Opener-Policy'], 'same-origin-allow-popups');
  assert.equal('X-Frame-Options' in devHeaders, false);
  assert.equal('Strict-Transport-Security' in devHeaders, false);
  assert.ok(devHeaders['Content-Security-Policy-Report-Only']);

  const prodHttpsHeaders = getSecurityHeadersForRequest({ isProduction: true }, true);
  assert.equal(
    prodHttpsHeaders['Strict-Transport-Security'],
    'max-age=31536000; includeSubDomains'
  );
});

test('Report-Only CSP allows Firebase, Google OAuth, Google Fonts, and local blob audio without enforcing frame-ancestors none', () => {
  const csp = buildReportOnlyCsp(true);
  assert.match(csp, /media-src 'self' blob: data:/);
  assert.match(csp, /https:\/\/\*\.googleapis\.com/);
  assert.match(csp, /https:\/\/securetoken\.googleapis\.com/);
  assert.match(csp, /https:\/\/identitytoolkit\.googleapis\.com/);
  assert.match(csp, /https:\/\/fonts\.googleapis\.com/);
  assert.match(csp, /https:\/\/fonts\.gstatic\.com/);
  assert.match(csp, /report-uri \/api\/csp-report/);
  assert.equal(csp.includes('frame-ancestors'), false);
});
