import { createVerify } from 'node:crypto';

export interface VerifiedFirebaseToken {
  uid: string;
  email?: string;
  emailVerified: boolean;
}

export class TokenVerificationError extends Error {
  public readonly statusCode: number;

  constructor(message = 'Authentication required.', statusCode = 401) {
    super(message);
    this.name = 'TokenVerificationError';
    this.statusCode = statusCode;
  }
}

export interface TokenVerifierDeps {
  fetchCerts?: () => Promise<{ certs: Record<string, string>; maxAgeSeconds: number }>;
  nowSeconds?: () => number;
}

const GOOGLE_SECURETOKEN_CERTS_URL =
  'https://www.googleapis.com/robot/v1/metadata/x509/securetoken@system.gserviceaccount.com';

interface CertCacheEntry {
  certs: Record<string, string>;
  expiresAtMs: number;
}

let cachedCerts: CertCacheEntry | null = null;

function parseMaxAgeSeconds(cacheControl: string | null): number {
  if (!cacheControl) return 3600;
  const match = cacheControl.match(/max-age=(\d+)/i);
  if (!match) return 3600;
  const parsed = Number.parseInt(match[1], 10);
  return Number.isFinite(parsed) && parsed > 0 ? parsed : 3600;
}

async function fetchGooglePublicCerts(): Promise<{
  certs: Record<string, string>;
  maxAgeSeconds: number;
}> {
  const response = await fetch(GOOGLE_SECURETOKEN_CERTS_URL, {
    method: 'GET',
    headers: { Accept: 'application/json' },
  });

  if (!response.ok) {
    throw new TokenVerificationError('Unable to verify authentication token.', 401);
  }

  const certs = (await response.json()) as Record<string, string>;
  const maxAgeSeconds = parseMaxAgeSeconds(response.headers.get('cache-control'));
  return { certs, maxAgeSeconds };
}

function decodeBase64UrlJson<T>(segment: string): T {
  const normalized = segment.replace(/-/g, '+').replace(/_/g, '/');
  const padded = normalized.padEnd(Math.ceil(normalized.length / 4) * 4, '=');
  const raw = Buffer.from(padded, 'base64').toString('utf8');
  return JSON.parse(raw) as T;
}

function decodeBase64UrlBuffer(segment: string): Buffer {
  const normalized = segment.replace(/-/g, '+').replace(/_/g, '/');
  const padded = normalized.padEnd(Math.ceil(normalized.length / 4) * 4, '=');
  return Buffer.from(padded, 'base64');
}

export function extractBearerToken(authorizationHeader: string | undefined): string | null {
  if (!authorizationHeader || typeof authorizationHeader !== 'string') {
    return null;
  }
  const match = authorizationHeader.match(/^Bearer\s+([^\s]+)$/i);
  if (!match) return null;
  const token = match[1].trim();
  return token.length > 0 && token.length <= 8192 ? token : null;
}

export function clearCertCacheForTesting(): void {
  cachedCerts = null;
}

export async function verifyFirebaseIdToken(
  authorizationHeader: string | undefined,
  projectId: string,
  deps: TokenVerifierDeps = {}
): Promise<VerifiedFirebaseToken> {
  if (!projectId) {
    throw new TokenVerificationError('Authentication configuration unavailable.', 500);
  }

  const token = extractBearerToken(authorizationHeader);
  if (!token) {
    throw new TokenVerificationError('Missing or malformed authorization token.', 401);
  }

  const parts = token.split('.');
  if (parts.length !== 3 || parts.some((part) => !part)) {
    throw new TokenVerificationError('Invalid authentication token format.', 401);
  }

  const [headerSegment, payloadSegment, signatureSegment] = parts;

  let header: { alg?: unknown; kid?: unknown };
  let payload: Record<string, unknown>;
  try {
    header = decodeBase64UrlJson<{ alg?: unknown; kid?: unknown }>(headerSegment);
    payload = decodeBase64UrlJson<Record<string, unknown>>(payloadSegment);
  } catch {
    throw new TokenVerificationError('Invalid authentication token encoding.', 401);
  }

  if (header.alg !== 'RS256' || typeof header.kid !== 'string' || !header.kid) {
    throw new TokenVerificationError('Unsupported authentication token algorithm.', 401);
  }

  const nowMs = Date.now();
  const loadCerts = deps.fetchCerts ?? fetchGooglePublicCerts;

  let certsMap: Record<string, string>;
  if (!deps.fetchCerts && cachedCerts && cachedCerts.expiresAtMs > nowMs) {
    certsMap = cachedCerts.certs;
  } else {
    const loaded = await loadCerts();
    certsMap = loaded.certs;
    if (!deps.fetchCerts) {
      cachedCerts = {
        certs: certsMap,
        expiresAtMs: nowMs + loaded.maxAgeSeconds * 1000,
      };
    }
  }

  let certPem = certsMap[header.kid];
  if (!certPem && !deps.fetchCerts) {
    const reloaded = await loadCerts();
    certsMap = reloaded.certs;
    cachedCerts = {
      certs: certsMap,
      expiresAtMs: Date.now() + reloaded.maxAgeSeconds * 1000,
    };
    certPem = certsMap[header.kid];
  }

  if (!certPem || typeof certPem !== 'string') {
    throw new TokenVerificationError('Unknown authentication token signing key.', 401);
  }

  const signedContent = `${headerSegment}.${payloadSegment}`;
  const signatureBytes = decodeBase64UrlBuffer(signatureSegment);

  let signatureValid = false;
  try {
    const verifier = createVerify('RSA-SHA256');
    verifier.update(signedContent);
    verifier.end();
    signatureValid = verifier.verify(certPem, signatureBytes);
  } catch {
    signatureValid = false;
  }

  if (!signatureValid) {
    throw new TokenVerificationError('Invalid authentication token signature.', 401);
  }

  const nowSeconds = deps.nowSeconds ? deps.nowSeconds() : Math.floor(Date.now() / 1000);
  const clockSkewSeconds = 5;

  const expectedIssuer = `https://securetoken.google.com/${projectId}`;
  if (payload.aud !== projectId || payload.iss !== expectedIssuer) {
    throw new TokenVerificationError('Authentication token audience or issuer mismatch.', 401);
  }

  if (typeof payload.exp !== 'number' || !Number.isFinite(payload.exp) || payload.exp <= nowSeconds - clockSkewSeconds) {
    throw new TokenVerificationError('Authentication token has expired.', 401);
  }

  if (typeof payload.iat !== 'number' || !Number.isFinite(payload.iat) || payload.iat > nowSeconds + 300) {
    throw new TokenVerificationError('Invalid authentication token issue time.', 401);
  }

  if (
    payload.auth_time !== undefined &&
    (typeof payload.auth_time !== 'number' || !Number.isFinite(payload.auth_time) || payload.auth_time > nowSeconds + 300)
  ) {
    throw new TokenVerificationError('Invalid authentication timestamp.', 401);
  }

  if (typeof payload.sub !== 'string' || payload.sub.length === 0 || payload.sub.length > 128) {
    throw new TokenVerificationError('Invalid authentication token subject.', 401);
  }

  if (payload.user_id !== undefined && payload.user_id !== payload.sub) {
    throw new TokenVerificationError('Authentication token subject mismatch.', 401);
  }

  return {
    uid: payload.sub,
    email: typeof payload.email === 'string' ? payload.email : undefined,
    emailVerified: payload.email_verified === true,
  };
}
