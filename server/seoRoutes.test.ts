import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import {
  resolveSeoRoute,
  injectSeoIntoHtml,
  normalizeSeoPathname,
  isNoindexRoute,
} from './seoRoutes.js';

const PUBLIC_PATHS = [
  '/',
  '/study-timer',
  '/pomodoro-timer',
  '/study-planner',
  '/focus-timer',
  '/privacy',
  '/terms',
  '/contact',
];

const NOINDEX_PATHS = [
  '/login',
  '/signup',
  '/reset-password',
  '/app/workspace',
  '/dashboard',
  '/tasks',
  '/subjects',
  '/goals',
  '/analytics',
  '/settings',
];

test('all public routes have unique titles, descriptions, canonical URLs, 200 status, and index directive', () => {
  const titles = new Set<string>();
  const descriptions = new Set<string>();
  const canonicals = new Set<string>();

  for (const p of PUBLIC_PATHS) {
    const seo = resolveSeoRoute(p);
    assert.equal(seo.statusCode, 200, `${p} should return 200`);
    assert.match(seo.robots, /^index, follow/, `${p} should be indexable`);
    assert.ok(seo.canonicalUrl?.startsWith('https://focusflow.in/'), `${p} needs canonicalUrl`);
    assert.ok(seo.title.length >= 20 && seo.title.length <= 75, `${p} title length invalid: ${seo.title}`);
    assert.ok(seo.description.length >= 70 && seo.description.length <= 170, `${p} description length invalid`);
    assert.ok(seo.schemaJson, `${p} should include JSON-LD schema`);
    assert.match(seo.ssrBodyHtml, /<h1[^>]*>.*<\/h1>/s, `${p} SSR HTML should contain an h1`);
    assert.match(seo.ssrBodyHtml, /<a href="\/study-timer">/, `${p} SSR HTML should include internal links`);

    assert.equal(titles.has(seo.title), false, `Duplicate title detected on ${p}`);
    assert.equal(descriptions.has(seo.description), false, `Duplicate description detected on ${p}`);
    assert.equal(canonicals.has(seo.canonicalUrl!), false, `Duplicate canonicalUrl detected on ${p}`);

    titles.add(seo.title);
    descriptions.add(seo.description);
    canonicals.add(seo.canonicalUrl!);
  }
});

test('trailing slash and /support normalize to 301 canonical redirects', () => {
  assert.equal(normalizeSeoPathname('/study-timer/').redirectTo, '/study-timer');
  assert.equal(normalizeSeoPathname('/privacy///').redirectTo, '/privacy');
  assert.equal(normalizeSeoPathname('/support').redirectTo, '/contact');
  assert.equal(normalizeSeoPathname('/support/').redirectTo, '/contact');
  assert.equal(normalizeSeoPathname('/').redirectTo, undefined);
  assert.equal(normalizeSeoPathname('/study-timer').redirectTo, undefined);
});

test('auth and private app routes resolve to noindex, nofollow with no canonical', () => {
  for (const p of NOINDEX_PATHS) {
    assert.equal(isNoindexRoute(p), true, `${p} must be classified noindex`);
    const seo = resolveSeoRoute(p);
    assert.equal(seo.statusCode, 200);
    assert.equal(seo.robots, 'noindex, nofollow');
    assert.equal(seo.canonicalUrl, undefined);
  }
});

test('unknown routes return HTTP 404, noindex, nofollow, and never reflect raw user path', () => {
  const maliciousPath = '/nonexistent/<script>alert(1)</script>';
  const seo = resolveSeoRoute(maliciousPath);
  assert.equal(seo.statusCode, 404);
  assert.equal(seo.robots, 'noindex, nofollow');
  assert.equal(seo.canonicalUrl, undefined);
  assert.equal(seo.ssrBodyHtml.includes('<script>'), false);
  assert.equal(seo.ssrBodyHtml.includes('alert(1)'), false);
  assert.match(seo.ssrBodyHtml, /<h1>404/);
});

test('injectSeoIntoHtml injects route metadata, JSON-LD, crawler root HTML, and strips canonical on noindex/404', () => {
  const indexHtml = fs.readFileSync(path.resolve(process.cwd(), 'index.html'), 'utf8');

  const timerSeo = resolveSeoRoute('/pomodoro-timer');
  const timerHtml = injectSeoIntoHtml(indexHtml, timerSeo);
  assert.match(timerHtml, /<title>Free Pomodoro Timer for Students/);
  assert.match(timerHtml, /<link rel="canonical" href="https:\/\/focusflow\.in\/pomodoro-timer" \/>/);
  assert.match(timerHtml, /<meta property="og:url" content="https:\/\/focusflow\.in\/pomodoro-timer" \/>/);
  assert.match(timerHtml, /<div id="root"><div class="min-h-screen/);
  assert.equal((timerHtml.match(/id="schema-json-ld"/g) || []).length, 1);

  const loginSeo = resolveSeoRoute('/login');
  const loginHtml = injectSeoIntoHtml(indexHtml, loginSeo);
  assert.match(loginHtml, /<meta name="robots" content="noindex, nofollow" \/>/);
  assert.equal(/rel="canonical"/.test(loginHtml), false);
  assert.equal(/id="schema-json-ld"/.test(loginHtml), false);
});

test('public/sitemap.xml and public/robots.txt stay synchronized with public routes', () => {
  const sitemapXml = fs.readFileSync(path.resolve(process.cwd(), 'public/sitemap.xml'), 'utf8');
  const robotsTxt = fs.readFileSync(path.resolve(process.cwd(), 'public/robots.txt'), 'utf8');

  for (const p of PUBLIC_PATHS) {
    const expectedLoc = `https://focusflow.in${p}`;
    assert.ok(sitemapXml.includes(`<loc>${expectedLoc}</loc>`), `sitemap.xml missing ${expectedLoc}`);
  }
  for (const p of NOINDEX_PATHS) {
    const expectedLoc = `https://focusflow.in${p}`;
    assert.equal(sitemapXml.includes(expectedLoc), false, `sitemap.xml must not include ${expectedLoc}`);
  }
  assert.match(robotsTxt, /Sitemap: https:\/\/focusflow\.in\/sitemap\.xml/);
  assert.match(robotsTxt, /Disallow: \/login/);
  assert.match(robotsTxt, /Disallow: \/signup/);
  assert.match(robotsTxt, /Disallow: \/api\//);
});
