import { readFileSync } from 'fs';
import path from 'path';

const FRAMER_BASE = process.env.FRAMER_BASE_URL ?? 'https://mahdicreates.framer.ai';
const CANONICAL_BASE = 'https://www.mahdicreates.com';

// Framer uses different paths internally for some pages
const FRAMER_PATH_MAP: Record<string, string> = {
  '/': '/',
  '/about': '/about',
  '/blog': '/insights',
  '/projects': '/projects',
  '/case-studies': '/case-studies',
  '/resources': '/resources',
};

const KEYWORDS_META = `<meta name="keywords" content="UI UX designer, UX designer portfolio, web design, design systems, Mahdi Creates, Md Mahdi Hasan, high-conversion web design">`;

const OG_EXTRA = `<meta property="og:site_name" content="Mahdi Creates">
<meta property="og:locale" content="en_US">
<meta name="twitter:site" content="@mahdicreates">
<meta name="twitter:creator" content="@mahdicreates">`;

// Site-level JSON-LD: Person + WebSite entities (Publisher fixes "Publisher: Missing" in SEO tools)
const BASE_JSON_LD = `<script type="application/ld+json">{"@context":"https://schema.org","@graph":[{"@type":"Person","@id":"https://www.mahdicreates.com/#person","name":"Md Mahdi Hasan","alternateName":"Mahdi Creates","url":"https://www.mahdicreates.com","jobTitle":"UI/UX Designer","sameAs":["https://x.com/mahdicreates"],"description":"Award-winning UI/UX Designer with 9+ years of experience in strategic, high-conversion web design and design systems for global brands."},{"@type":"WebSite","@id":"https://www.mahdicreates.com/#website","url":"https://www.mahdicreates.com","name":"Mahdi Creates","publisher":{"@id":"https://www.mahdicreates.com/#person"}}]}</script>`;

function trimDescriptionMeta(html: string): string {
  const MAX = 155;
  function trim(value: string): string {
    if (value.length <= MAX) return value;
    // Prefer cutting at a sentence boundary (period) for cleaner descriptions
    const sentenceEnd = value.slice(0, MAX).lastIndexOf('.');
    if (sentenceEnd > MAX * 0.5) return value.slice(0, sentenceEnd + 1);
    // Fall back to word boundary
    const cut = value.slice(0, MAX + 1).replace(/\s+\S*$/, '');
    return (cut || value.slice(0, MAX)) + '…';
  }
  return html.replace(/<meta\b([^>]+)>/gi, (fullTag, attrs) => {
    const isDesc = /\b(?:name|property)="(?:description|og:description|twitter:description)"/i.test(attrs);
    if (!isDesc) return fullTag;
    return fullTag.replace(/(\bcontent=")([^"]+)(")/, (_, pre, val, suf) => `${pre}${trim(val)}${suf}`);
  });
}

function fixCanonical(html: string, nextPath: string): string {
  const canonical = `${CANONICAL_BASE}${nextPath === '/' ? '' : nextPath}`;

  let result = html
    // Remove Framer's canonical and replace with ours
    .replace(/<link[^>]+rel=["']canonical["'][^>]*>/gi, '')
    // Strip generator meta — reveals CMS, no SEO value
    .replace(/<meta\s+name=["']generator["'][^>]*>/gi, '')
    // Strip Framer-internal search index metas
    .replace(/<meta\s+name=["']framer-search-index[^"']*["'][^>]*>/gi, '')
    // Fix og:url — Framer sets this to mahdicreates.framer.ai
    .replace(/<meta property="og:url"[^>]*>/gi, `<meta property="og:url" content="${canonical}">`)
    // Add index/follow to robots meta if not already present
    .replace(/<meta\s+name=["']robots["'][^>]*content=["']([^"']*)["'][^>]*>/gi, (tag, content) => {
      if (/\b(no)?index\b/i.test(content)) return tag; // already has indexing directive
      return tag.replace(/content=["'][^"']*["']/, `content="index, follow, ${content}"`);
    })
    // Inject canonical + SEO additions into <head>
    .replace('</head>',
      `<link rel="canonical" href="${canonical}">\n` +
      `${KEYWORDS_META}\n` +
      `${OG_EXTRA}\n` +
      `${BASE_JSON_LD}\n` +
      `</head>`,
    );

  // Trim description/og:description/twitter:description to ≤155 chars
  result = trimDescriptionMeta(result);

  return result;
}

/**
 * Fetch a Framer-published page HTML.
 * Falls back to the local static snapshot if Framer is unreachable.
 * @param nextPath  - The Next.js route path, e.g. '/blog'
 * @param fallback  - Filename inside src/data/ to use as fallback, e.g. 'blog.html'
 * @param revalidate - ISR revalidation in seconds (0 = always fresh, default 60)
 */
export async function fetchFramerPage(
  nextPath: string,
  fallback: string,
  revalidate = 60,
): Promise<string> {
  const framerPath = FRAMER_PATH_MAP[nextPath] ?? nextPath;
  const url = `${FRAMER_BASE}${framerPath}`;

  try {
    const res = await fetch(url, {
      next: { revalidate },
      headers: { Accept: 'text/html', 'User-Agent': 'MahdiCreates-Bot/1.0' },
    });

    if (res.ok) return fixCanonical(await res.text(), nextPath);
    console.warn(`[framer-fetch] ${url} returned ${res.status}, using fallback`);
  } catch (err) {
    console.warn(`[framer-fetch] fetch failed for ${url}:`, err);
  }

  // Emergency fallback: serve the last known good static snapshot
  return fixCanonical(
    readFileSync(path.join(process.cwd(), 'src/data', fallback), 'utf-8'),
    nextPath,
  );
}
