import { readFileSync } from 'fs';
import path from 'path';

const FRAMER_BASE = process.env.FRAMER_BASE_URL ?? 'https://mahdicreates.framer.ai';

// Framer uses different paths internally for some pages
const FRAMER_PATH_MAP: Record<string, string> = {
  '/': '/',
  '/about': '/about',
  '/blog': '/insights',
  '/projects': '/projects',
  '/case-studies': '/case-studies',
  '/resources': '/resources',
};

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

    if (res.ok) return res.text();
    console.warn(`[framer-fetch] ${url} returned ${res.status}, using fallback`);
  } catch (err) {
    console.warn(`[framer-fetch] fetch failed for ${url}:`, err);
  }

  // Emergency fallback: serve the last known good static snapshot
  return readFileSync(path.join(process.cwd(), 'src/data', fallback), 'utf-8');
}
