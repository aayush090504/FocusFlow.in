import test from 'node:test';
import assert from 'node:assert/strict';
import { generateKeyPairSync, createSign } from 'node:crypto';
import {
  verifyFirebaseIdToken,
  TokenVerificationError,
} from './firebaseTokenVerifier.js';
import {
  escapeHtml,
  stripHeaderControlChars,
  validateFeedbackPayload,
  SlidingWindowRateLimiter,
} from './feedbackSecurity.js';
import { sanitizeInput, isValidEmail } from '../src/utils/securityUtils.js';

function base64UrlEncode(input: string | Buffer): string {
  return Buffer.from(input)
    .toString('base64')
    .replace(/=/g, '')
    .replace(/\+/g, '-')
    .replace(/\//g, '_');
}

function signTestJwt(
  payload: Record<string, unknown>,
  privateKeyPem: string,
  header: Record<string, unknown> = { alg: 'RS256', kid: 'test-kid-1', typ: 'JWT' }
): string {
  const encodedHeader = base64UrlEncode(JSON.stringify(header));
  const encodedPayload = base64UrlEncode(JSON.stringify(payload));
  const content = `${encodedHeader}.${encodedPayload}`;
  const signer = createSign('RSA-SHA256');
  signer.update(content);
  signer.end();
  const signature = signer.sign(privateKeyPem);
  return `${content}.${base64UrlEncode(signature)}`;
}

const { publicKey: TEST_PUBLIC_KEY, privateKey: TEST_PRIVATE_KEY } = generateKeyPairSync('rsa', {
  modulusLength: 2048,
  publicKeyEncoding: { type: 'spki', format: 'pem' },
  privateKeyEncoding: { type: 'pkcs8', format: 'pem' },
});

const TEST_PROJECT_ID = 'gen-lang-client-0832752483';
const NOW_SEC = 1_800_000_000;

test('verifyFirebaseIdToken accepts a valid signed Firebase ID token', async () => {
  const token = signTestJwt(
    {
      aud: TEST_PROJECT_ID,
      iss: `https://securetoken.google.com/${TEST_PROJECT_ID}`,
      sub: 'user_abc_123',
      user_id: 'user_abc_123',
      email: 'student@example.com',
      email_verified: true,
      iat: NOW_SEC - 60,
      auth_time: NOW_SEC - 60,
      exp: NOW_SEC + 3600,
    },
    TEST_PRIVATE_KEY
  );

  const verified = await verifyFirebaseIdToken(`Bearer ${token}`, TEST_PROJECT_ID, {
    fetchCerts: async () => ({ certs: { 'test-kid-1': TEST_PUBLIC_KEY }, maxAgeSeconds: 3600 }),
    nowSeconds: () => NOW_SEC,
  });

  assert.equal(verified.uid, 'user_abc_123');
  assert.equal(verified.email, 'student@example.com');
  assert.equal(verified.emailVerified, true);
});

test('verifyFirebaseIdToken rejects missing, expired, wrong audience, and tampered tokens', async () => {
  const deps = {
    fetchCerts: async () => ({ certs: { 'test-kid-1': TEST_PUBLIC_KEY }, maxAgeSeconds: 3600 }),
    nowSeconds: () => NOW_SEC,
  };

  await assert.rejects(
    () => verifyFirebaseIdToken(undefined, TEST_PROJECT_ID, deps),
    (err: unknown) => err instanceof TokenVerificationError && err.statusCode === 401
  );

  const expiredToken = signTestJwt(
    {
      aud: TEST_PROJECT_ID,
      iss: `https://securetoken.google.com/${TEST_PROJECT_ID}`,
      sub: 'user_1',
      iat: NOW_SEC - 7200,
      exp: NOW_SEC - 30,
    },
    TEST_PRIVATE_KEY
  );
  await assert.rejects(
    () => verifyFirebaseIdToken(`Bearer ${expiredToken}`, TEST_PROJECT_ID, deps),
    (err: unknown) => err instanceof TokenVerificationError && err.statusCode === 401
  );

  const wrongAudToken = signTestJwt(
    {
      aud: 'other-project',
      iss: `https://securetoken.google.com/${TEST_PROJECT_ID}`,
      sub: 'user_1',
      iat: NOW_SEC - 60,
      exp: NOW_SEC + 3600,
    },
    TEST_PRIVATE_KEY
  );
  await assert.rejects(
    () => verifyFirebaseIdToken(`Bearer ${wrongAudToken}`, TEST_PROJECT_ID, deps),
    (err: unknown) => err instanceof TokenVerificationError && err.statusCode === 401
  );

  const validToken = signTestJwt(
    {
      aud: TEST_PROJECT_ID,
      iss: `https://securetoken.google.com/${TEST_PROJECT_ID}`,
      sub: 'user_1',
      iat: NOW_SEC - 60,
      exp: NOW_SEC + 3600,
    },
    TEST_PRIVATE_KEY
  );
  const [h, , s] = validToken.split('.');
  const tamperedPayload = base64UrlEncode(
    JSON.stringify({
      aud: TEST_PROJECT_ID,
      iss: `https://securetoken.google.com/${TEST_PROJECT_ID}`,
      sub: 'admin_spoofed',
      iat: NOW_SEC - 60,
      exp: NOW_SEC + 3600,
    })
  );
  await assert.rejects(
    () => verifyFirebaseIdToken(`Bearer ${h}.${tamperedPayload}.${s}`, TEST_PROJECT_ID, deps),
    (err: unknown) => err instanceof TokenVerificationError && err.statusCode === 401
  );
});

test('validateFeedbackPayload rejects email/ID header injection and validates bounds', () => {
  const headerInject = validateFeedbackPayload({
    id: 'fb_valid_1',
    type: 'bug_report',
    message: 'Timer paused unexpectedly during break transition.',
    email: 'victim@example.com\r\nBcc: attacker@evil.com',
  });
  assert.equal(headerInject.ok, false);

  const multiEmail = validateFeedbackPayload({
    id: 'fb_valid_2',
    type: 'bug_report',
    message: 'Valid feedback message text.',
    email: 'a@example.com,b@example.com',
  });
  assert.equal(multiEmail.ok, false);

  const injectedId = validateFeedbackPayload({
    id: 'fb_1\r\nBcc: evil@example.com',
    type: 'general_feedback',
    message: 'Valid feedback message text.',
  });
  assert.equal(injectedId.ok, false);

  const invalidType = validateFeedbackPayload({
    id: 'fb_valid_3',
    type: 'arbitrary_admin_alert',
    message: 'Valid feedback message text.',
  });
  assert.equal(invalidType.ok, false);

  const valid = validateFeedbackPayload({
    id: 'fb_abc_123',
    type: 'feature_suggestion',
    message: 'Support intervals where 15 < 25 and 60 > 45 cleanly.',
    email: 'student@university.edu',
  });
  assert.equal(valid.ok, true);
  if (valid.ok) {
    assert.equal(valid.data.message, 'Support intervals where 15 < 25 and 60 > 45 cleanly.');
    assert.equal(valid.data.email, 'student@university.edu');
  }
});

test('escapeHtml and stripHeaderControlChars neutralize HTML tags, quotes, and CRLF', () => {
  const escaped = escapeHtml(`<img src=x onerror="alert('xss')">&`);
  assert.equal(
    escaped,
    '&lt;img src=x onerror=&quot;alert(&#39;xss&#39;)&quot;&gt;&amp;'
  );
  assert.equal(stripHeaderControlChars("Hello\r\nBcc: evil@test.com\0"), 'Hello Bcc: evil@test.com');
});

test('SlidingWindowRateLimiter enforces limits per key, bounds memory, and resets after window', () => {
  const limiter = new SlidingWindowRateLimiter({
    windowMs: 60_000,
    maxRequests: 2,
    maxEntries: 3,
  });

  const t0 = 1_000_000;
  assert.equal(limiter.check('uid:u1', t0).allowed, true);
  assert.equal(limiter.check('uid:u1', t0 + 1000).allowed, true);
  const blocked = limiter.check('uid:u1', t0 + 2000);
  assert.equal(blocked.allowed, false);
  assert.ok(blocked.retryAfterSeconds >= 58);

  // Another user on the same shared IP has an independent uid bucket
  assert.equal(limiter.check('uid:u2', t0 + 2000).allowed, true);

  // Window expires
  assert.equal(limiter.check('uid:u1', t0 + 61_000).allowed, true);

  // Bounded capacity prevents unbounded memory growth
  limiter.check('uid:u3', t0 + 62_000);
  limiter.check('uid:u4', t0 + 63_000);
  assert.ok(limiter.size <= 3);
});

test('client securityUtils preserves math expressions while blocking email injection', () => {
  assert.equal(sanitizeInput('  Keep 5 < 10 and 20 > 10\0 '), 'Keep 5 < 10 and 20 > 10');
  assert.equal(isValidEmail('student@example.com'), true);
  assert.equal(isValidEmail('student@example.com\nBcc: evil@example.com'), false);
  assert.equal(isValidEmail('a@b.com,c@d.com'), false);
});
