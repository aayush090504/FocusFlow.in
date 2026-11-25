import { escapeHtml } from './feedbackSecurity.js';

export type SeoRobotsDirective =
  | 'index, follow, max-image-preview:large, max-snippet:-1, max-video-preview:-1'
  | 'noindex, nofollow';

export interface SeoRouteResolution {
  pathname: string;
  redirectTo?: string;
  statusCode: 200 | 404;
  robots: SeoRobotsDirective;
  title: string;
  description: string;
  keywords: string[];
  canonicalUrl?: string;
  ogType: 'website' | 'article';
  ogImage: string;
  ogImageAlt: string;
  schemaJson?: Record<string, unknown>;
  ssrBodyHtml: string;
}

const DEFAULT_KEYWORDS = [
  'free pomodoro timer',
  'free study planner',
  'student productivity app',
  'study workspace',
  'online study timer',
  'productivity tools for students',
  'free student planner',
  'focus timer for studying',
];

const OG_IMAGE = 'https://focusflow.in/assets/og-preview.png';

const NOINDEX_PREFIXES = [
  '/login',
  '/signup',
  '/reset-password',
  '/app',
  '/dashboard',
  '/tasks',
  '/subjects',
  '/goals',
  '/analytics',
  '/settings',
  '/admin',
];

function buildCrawlerChrome(mainHtml: string): string {
  return `<div class="min-h-screen bg-slate-950 text-slate-100">
  <header>
    <nav aria-label="Primary Navigation">
      <a href="/">Focus Flow — Home</a>
      <a href="/study-timer">Online Study Timer</a>
      <a href="/pomodoro-timer">Free Pomodoro Timer</a>
      <a href="/study-planner">Free Study Planner</a>
      <a href="/focus-timer">Deep Work Focus Timer</a>
      <a href="/login">Sign In</a>
      <a href="/signup">Start Studying Free</a>
    </nav>
  </header>
  <main>${mainHtml}</main>
  <footer>
    <nav aria-label="Footer Navigation">
      <a href="/">Focus Flow Home</a>
      <a href="/study-timer">Online Study Timer</a>
      <a href="/pomodoro-timer">Free Pomodoro Timer</a>
      <a href="/study-planner">Free Study Planner</a>
      <a href="/focus-timer">Focus Timer for Studying</a>
      <a href="/privacy">Privacy Policy</a>
      <a href="/terms">Terms of Service</a>
      <a href="/contact">Contact &amp; Support</a>
    </nav>
  </footer>
</div>`;
}

export function normalizeSeoPathname(rawPath: string): {
  normalized: string;
  redirectTo?: string;
} {
  const pathOnly = (rawPath || '/').split('?')[0].split('#')[0] || '/';
  if (pathOnly.length > 1 && pathOnly.endsWith('/')) {
    const stripped = pathOnly.replace(/\/+$/, '') || '/';
    const target = stripped === '/support' ? '/contact' : stripped;
    return { normalized: target, redirectTo: target };
  }
  if (pathOnly === '/support') {
    return { normalized: '/contact', redirectTo: '/contact' };
  }
  return { normalized: pathOnly };
}

export function isNoindexRoute(pathname: string): boolean {
  const { normalized } = normalizeSeoPathname(pathname);
  return NOINDEX_PREFIXES.some(
    (prefix) => normalized === prefix || normalized.startsWith(`${prefix}/`)
  );
}

export function resolveSeoRoute(rawPath: string): SeoRouteResolution {
  const { normalized, redirectTo } = normalizeSeoPathname(rawPath);

  if (normalized === '/') {
    const title = 'Focus Flow — Free Study Planner, Pomodoro & Study Timer';
    const description =
      'Free student productivity app and study workspace. Use our free Pomodoro timer, online study timer, and free study planner to organize tasks and build focus streaks.';
    return {
      pathname: normalized,
      redirectTo,
      statusCode: 200,
      robots: 'index, follow, max-image-preview:large, max-snippet:-1, max-video-preview:-1',
      title,
      description,
      keywords: DEFAULT_KEYWORDS,
      canonicalUrl: 'https://focusflow.in/',
      ogType: 'website',
      ogImage: OG_IMAGE,
      ogImageAlt: 'Focus Flow — Free Study Planner, Pomodoro Timer & Student Study Workspace',
      schemaJson: {
        '@context': 'https://schema.org',
        '@graph': [
          {
            '@type': 'WebApplication',
            '@id': 'https://focusflow.in/#webapp',
            name: 'Focus Flow',
            url: 'https://focusflow.in/',
            applicationCategory: 'EducationalApplication',
            operatingSystem: 'All',
            description,
            offers: {
              '@type': 'Offer',
              price: '0',
              priceCurrency: 'USD',
              availability: 'https://schema.org/InStock',
            },
          },
          {
            '@type': 'WebSite',
            '@id': 'https://focusflow.in/#website',
            url: 'https://focusflow.in/',
            name: 'Focus Flow',
          },
        ],
      },
      ssrBodyHtml: buildCrawlerChrome(
        `<section>
          <h1>Your Personalized Study Workspace for Better Focus</h1>
          <p>Focus Flow is a free student productivity app combining a free Pomodoro timer, online study timer, and free study planner into one calm workspace built for deep academic execution.</p>
        </section>
        <section>
          <h2>Productivity Tools for Students Built for Deep Work</h2>
          <ul>
            <li><a href="/study-timer">Online Study Timer</a>: Customizable study countdown and stopwatch blocks with ambient soundscapes.</li>
            <li><a href="/pomodoro-timer">Free Pomodoro Timer</a>: Structured 25/5 scientific study cycles with break alerts and session logs.</li>
            <li><a href="/study-planner">Free Study Planner</a>: Organize courses, weekly hourly budgets, tasks, and exam deadlines.</li>
            <li><a href="/focus-timer">Focus Timer for Studying</a>: Distraction-free Zen mode and deep work sprint tracking.</li>
          </ul>
        </section>
        <section>
          <h2>Study Smarter Across 3 Structured Steps</h2>
          <p>Organize subjects and task queues, run timed focus sessions, and track study streaks and analytics across desktop and mobile.</p>
        </section>`
      ),
    };
  }

  if (normalized === '/study-timer') {
    const title = 'Online Study Timer — Free Timer for Studying | Focus Flow';
    const description =
      'Stay locked in with our free online study timer. Run 25m, 50m, or 90m focus blocks, listen to brown noise or rain, and build productive study habits.';
    return {
      pathname: normalized,
      redirectTo,
      statusCode: 200,
      robots: 'index, follow, max-image-preview:large, max-snippet:-1, max-video-preview:-1',
      title,
      description,
      keywords: [
        'online study timer',
        'focus timer for studying',
        'study timer with ambient sound',
        'student productivity app',
        'study workspace',
      ],
      canonicalUrl: 'https://focusflow.in/study-timer',
      ogType: 'website',
      ogImage: OG_IMAGE,
      ogImageAlt: 'Focus Flow Free Online Study Timer',
      schemaJson: {
        '@context': 'https://schema.org',
        '@type': 'WebApplication',
        name: 'Focus Flow — Online Study Timer',
        url: 'https://focusflow.in/study-timer',
        applicationCategory: 'EducationalApplication',
        operatingSystem: 'All',
        description,
        offers: { '@type': 'Offer', price: '0', priceCurrency: 'USD' },
      },
      ssrBodyHtml: buildCrawlerChrome(
        `<section>
          <h1>Online Study Timer for Deep Focus</h1>
          <p>${escapeHtml(description)}</p>
          <h2>Built-In Ambient Study Soundscapes &amp; Custom Study Blocks</h2>
          <p>Choose quick 25m, 50m, or 90m blocks, attach tasks inside your study workspace, and sync completed study hours across subjects.</p>
        </section>`
      ),
    };
  }

  if (normalized === '/pomodoro-timer') {
    const title = 'Free Pomodoro Timer for Students — Focus & Break Cycles | Focus Flow';
    const description =
      'Master time management with our free Pomodoro timer for students. Track 25-minute deep focus cycles, automatic 5-minute breaks, and session checklists.';
    return {
      pathname: normalized,
      redirectTo,
      statusCode: 200,
      robots: 'index, follow, max-image-preview:large, max-snippet:-1, max-video-preview:-1',
      title,
      description,
      keywords: [
        'free pomodoro timer',
        'pomodoro timer for students',
        'online study timer',
        'focus timer for studying',
        'productivity tools for students',
      ],
      canonicalUrl: 'https://focusflow.in/pomodoro-timer',
      ogType: 'website',
      ogImage: OG_IMAGE,
      ogImageAlt: 'Focus Flow Free Pomodoro Timer for Students',
      schemaJson: {
        '@context': 'https://schema.org',
        '@type': 'WebApplication',
        name: 'Focus Flow — Free Pomodoro Timer',
        url: 'https://focusflow.in/pomodoro-timer',
        applicationCategory: 'EducationalApplication',
        operatingSystem: 'All',
        description,
        offers: { '@type': 'Offer', price: '0', priceCurrency: 'USD' },
      },
      ssrBodyHtml: buildCrawlerChrome(
        `<section>
          <h1>Free Pomodoro Timer for Students</h1>
          <p>${escapeHtml(description)}</p>
          <h2>How the 25/5 Pomodoro Technique Improves Retention</h2>
          <p>Alternate 25-minute deep focus intervals with 5-minute restorative breaks, track session checklists, and log progress in your Focus Flow study workspace.</p>
        </section>`
      ),
    };
  }

  if (normalized === '/study-planner') {
    const title = 'Free Study Planner & Student Schedule Maker | Focus Flow';
    const description =
      'Plan semesters effortlessly with our free study planner and free student planner. Assign course target hours, manage assignment queues, and track progress.';
    return {
      pathname: normalized,
      redirectTo,
      statusCode: 200,
      robots: 'index, follow, max-image-preview:large, max-snippet:-1, max-video-preview:-1',
      title,
      description,
      keywords: [
        'free study planner',
        'free student planner',
        'student productivity app',
        'study workspace',
        'productivity tools for students',
      ],
      canonicalUrl: 'https://focusflow.in/study-planner',
      ogType: 'website',
      ogImage: OG_IMAGE,
      ogImageAlt: 'Focus Flow Free Student Study Planner',
      schemaJson: {
        '@context': 'https://schema.org',
        '@type': 'WebApplication',
        name: 'Focus Flow — Free Study Planner',
        url: 'https://focusflow.in/study-planner',
        applicationCategory: 'EducationalApplication',
        operatingSystem: 'All',
        description,
        offers: { '@type': 'Offer', price: '0', priceCurrency: 'USD' },
      },
      ssrBodyHtml: buildCrawlerChrome(
        `<section>
          <h1>Free Study Planner &amp; Student Schedule Maker</h1>
          <p>${escapeHtml(description)}</p>
          <h2>Course Hourly Budgets &amp; Exam Assignment Queue</h2>
          <p>Map weekly target hours per subject, prioritize exams and homework, and connect your free student planner to live Pomodoro and study timers.</p>
        </section>`
      ),
    };
  }

  if (normalized === '/focus-timer') {
    const title = 'Focus Timer for Studying — Deep Work Sprint Tracker | Focus Flow';
    const description =
      'Eliminate procrastination with our focus timer for studying. Run 45m, 60m, or 90m distraction-free deep work sprints inside your student study workspace.';
    return {
      pathname: normalized,
      redirectTo,
      statusCode: 200,
      robots: 'index, follow, max-image-preview:large, max-snippet:-1, max-video-preview:-1',
      title,
      description,
      keywords: [
        'focus timer for studying',
        'deep work focus timer',
        'online study timer',
        'student productivity app',
        'study workspace',
      ],
      canonicalUrl: 'https://focusflow.in/focus-timer',
      ogType: 'website',
      ogImage: OG_IMAGE,
      ogImageAlt: 'Focus Flow Deep Work Focus Timer for Studying',
      schemaJson: {
        '@context': 'https://schema.org',
        '@type': 'WebApplication',
        name: 'Focus Flow — Deep Work Focus Timer',
        url: 'https://focusflow.in/focus-timer',
        applicationCategory: 'EducationalApplication',
        operatingSystem: 'All',
        description,
        offers: { '@type': 'Offer', price: '0', priceCurrency: 'USD' },
      },
      ssrBodyHtml: buildCrawlerChrome(
        `<section>
          <h1>Focus Timer for Studying &amp; Deep Work</h1>
          <p>${escapeHtml(description)}</p>
          <h2>Distraction-Free Sprint Checklists &amp; Zen Mode</h2>
          <p>Set clear sprint intentions, track uninterrupted focus blocks, and build daily academic momentum.</p>
        </section>`
      ),
    };
  }

  if (normalized === '/privacy') {
    const title = 'Privacy Policy — Focus Flow';
    const description =
      'Learn how Focus Flow protects your student privacy, encrypts your study logs, and ensures zero unauthorized data sharing.';
    return {
      pathname: normalized,
      redirectTo,
      statusCode: 200,
      robots: 'index, follow, max-image-preview:large, max-snippet:-1, max-video-preview:-1',
      title,
      description,
      keywords: ['focus flow privacy policy', 'student data security'],
      canonicalUrl: 'https://focusflow.in/privacy',
      ogType: 'website',
      ogImage: OG_IMAGE,
      ogImageAlt: 'Focus Flow Privacy Policy',
      schemaJson: {
        '@context': 'https://schema.org',
        '@type': 'WebPage',
        name: title,
        description,
        url: 'https://focusflow.in/privacy',
      },
      ssrBodyHtml: buildCrawlerChrome(
        `<section>
          <h1>Privacy Policy</h1>
          <p>${escapeHtml(description)}</p>
          <h2>Core Student Privacy Standard</h2>
          <p>Focus Flow never sells student data, runs zero third-party ad trackers, and isolates user study records under authenticated access controls.</p>
        </section>`
      ),
    };
  }

  if (normalized === '/terms') {
    const title = 'Terms of Service — Focus Flow';
    const description =
      'Focus Flow terms of service, user agreement, acceptable use guidelines, and student academic terms.';
    return {
      pathname: normalized,
      redirectTo,
      statusCode: 200,
      robots: 'index, follow, max-image-preview:large, max-snippet:-1, max-video-preview:-1',
      title,
      description,
      keywords: ['focus flow terms of service', 'student user agreement'],
      canonicalUrl: 'https://focusflow.in/terms',
      ogType: 'website',
      ogImage: OG_IMAGE,
      ogImageAlt: 'Focus Flow Terms of Service',
      schemaJson: {
        '@context': 'https://schema.org',
        '@type': 'WebPage',
        name: title,
        description,
        url: 'https://focusflow.in/terms',
      },
      ssrBodyHtml: buildCrawlerChrome(
        `<section>
          <h1>Terms of Service</h1>
          <p>${escapeHtml(description)}</p>
          <h2>Student Data Ownership &amp; Acceptable Use</h2>
          <p>You retain full ownership of all notes, tasks, subjects, and study sessions stored in Focus Flow.</p>
        </section>`
      ),
    };
  }

  if (normalized === '/contact') {
    const title = 'Contact & Support — Focus Flow';
    const description =
      'Need help with your study workspace? Contact our dedicated student support team or submit feedback.';
    return {
      pathname: normalized,
      redirectTo,
      statusCode: 200,
      robots: 'index, follow, max-image-preview:large, max-snippet:-1, max-video-preview:-1',
      title,
      description,
      keywords: ['focus flow support', 'contact focus flow'],
      canonicalUrl: 'https://focusflow.in/contact',
      ogType: 'website',
      ogImage: OG_IMAGE,
      ogImageAlt: 'Contact Focus Flow Support',
      schemaJson: {
        '@context': 'https://schema.org',
        '@type': 'ContactPage',
        name: title,
        description,
        url: 'https://focusflow.in/contact',
      },
      ssrBodyHtml: buildCrawlerChrome(
        `<section>
          <h1>Contact &amp; Help Center</h1>
          <p>${escapeHtml(description)}</p>
          <h2>Direct Student Support</h2>
          <p>Reach our support team at support@focusflow.in or privacy@focusflow.in.</p>
        </section>`
      ),
    };
  }

  if (isNoindexRoute(normalized)) {
    const isSignup = normalized === '/signup';
    const isForgot = normalized === '/reset-password';
    const isLogin = normalized === '/login';
    const title = isSignup
      ? 'Create Your Account — Focus Flow'
      : isForgot
      ? 'Reset Your Password — Focus Flow'
      : isLogin
      ? 'Sign In — Focus Flow'
      : 'Student Study Workspace — Focus Flow';
    const description = isSignup
      ? 'Create your free Focus Flow student account to sync tasks, subjects, and study timers across devices.'
      : 'Sign in to your private Focus Flow student study workspace.';
    return {
      pathname: normalized,
      redirectTo,
      statusCode: 200,
      robots: 'noindex, nofollow',
      title,
      description,
      keywords: [],
      canonicalUrl: undefined,
      ogType: 'website',
      ogImage: OG_IMAGE,
      ogImageAlt: title,
      ssrBodyHtml: buildCrawlerChrome(
        `<section>
          <h1>${escapeHtml(title)}</h1>
          <p>${escapeHtml(description)}</p>
        </section>`
      ),
    };
  }

  // Unknown route -> Real HTTP 404 + noindex, nofollow
  return {
    pathname: normalized,
    redirectTo,
    statusCode: 404,
    robots: 'noindex, nofollow',
    title: 'Page Not Found (404) — Focus Flow',
    description:
      'The requested page could not be found. Explore Focus Flow free Pomodoro timer, online study timer, and student planner tools.',
    keywords: [],
    canonicalUrl: undefined,
    ogType: 'website',
    ogImage: OG_IMAGE,
    ogImageAlt: 'Page Not Found — Focus Flow',
    ssrBodyHtml: buildCrawlerChrome(
      `<section>
        <h1>404 — This Study Page Doesn't Exist</h1>
        <p>The page you requested could not be found. Explore our free student productivity tools below.</p>
        <ul>
          <li><a href="/">Back to Focus Flow Home</a></li>
          <li><a href="/study-timer">Online Study Timer</a></li>
          <li><a href="/pomodoro-timer">Free Pomodoro Timer</a></li>
          <li><a href="/study-planner">Free Study Planner</a></li>
          <li><a href="/focus-timer">Focus Timer for Studying</a></li>
        </ul>
      </section>`
    ),
  };
}

function replaceMetaContent(html: string, attrName: 'name' | 'property', attrVal: string, content: string): string {
  const escaped = escapeHtml(content);
  const pattern = new RegExp(
    `(<meta\\s+[^>]*${attrName}=["']${attrVal}["'][^>]*content=["'])[^"']*(["'][^>]*>)`,
    'i'
  );
  if (pattern.test(html)) {
    return html.replace(pattern, (_m, prefix, suffix) => `${prefix}${escaped}${suffix}`);
  }
  const tag = `<meta ${attrName}="${attrVal}" content="${escaped}" />`;
  return html.replace('</head>', () => `    ${tag}\n  </head>`);
}

export function injectSeoIntoHtml(htmlTemplate: string, seo: SeoRouteResolution): string {
  let out = htmlTemplate;

  const safeTitle = escapeHtml(seo.title);
  out = out.replace(/<title>[\s\S]*?<\/title>/i, () => `<title>${safeTitle}</title>`);

  out = replaceMetaContent(out, 'name', 'description', seo.description);
  if (seo.keywords.length > 0) {
    out = replaceMetaContent(out, 'name', 'keywords', seo.keywords.join(', '));
  } else {
    out = out.replace(/\s*<meta\s+name=["']keywords["'][^>]*>/i, '');
  }
  out = replaceMetaContent(out, 'name', 'robots', seo.robots);

  if (seo.canonicalUrl && !seo.robots.startsWith('noindex')) {
    const safeCanonical = escapeHtml(seo.canonicalUrl);
    if (/<link\s+rel=["']canonical["'][^>]*>/i.test(out)) {
      out = out.replace(
        /<link\s+rel=["']canonical["'][^>]*>/i,
        () => `<link rel="canonical" href="${safeCanonical}" />`
      );
    } else {
      out = out.replace('</head>', () => `    <link rel="canonical" href="${safeCanonical}" />\n  </head>`);
    }
  } else {
    out = out.replace(/\s*<link\s+rel=["']canonical["'][^>]*>/i, '');
  }

  out = replaceMetaContent(out, 'property', 'og:title', seo.title);
  out = replaceMetaContent(out, 'property', 'og:description', seo.description);
  out = replaceMetaContent(out, 'property', 'og:url', seo.canonicalUrl || 'https://focusflow.in/');
  out = replaceMetaContent(out, 'property', 'og:type', seo.ogType);
  out = replaceMetaContent(out, 'property', 'og:image', seo.ogImage);
  out = replaceMetaContent(out, 'property', 'og:image:alt', seo.ogImageAlt);

  out = replaceMetaContent(out, 'name', 'twitter:title', seo.title);
  out = replaceMetaContent(out, 'name', 'twitter:description', seo.description);
  out = replaceMetaContent(out, 'name', 'twitter:image', seo.ogImage);
  out = replaceMetaContent(out, 'name', 'twitter:image:alt', seo.ogImageAlt);

  // Replace or remove JSON-LD script block safely
  const jsonLdPattern = /\s*<script[^>]*id=["']schema-json-ld["'][^>]*>[\s\S]*?<\/script>/i;
  if (seo.schemaJson) {
    const safeJson = JSON.stringify(seo.schemaJson).replace(/</g, '\\u003c');
    const scriptTag = `\n    <script id="schema-json-ld" type="application/ld+json">${safeJson}</script>`;
    if (jsonLdPattern.test(out)) {
      out = out.replace(jsonLdPattern, () => scriptTag);
    } else {
      out = out.replace('</head>', () => `${scriptTag}\n  </head>`);
    }
  } else {
    out = out.replace(jsonLdPattern, '');
  }

  // Inject semantic HTML snapshot for crawlers inside #root
  out = out.replace(
    /<div\s+id=["']root["']\s*><\/div>/i,
    () => `<div id="root">${seo.ssrBodyHtml}</div>`
  );

  return out;
}
