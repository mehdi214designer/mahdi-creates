// Framer → static mirror.
//
// Crawls a published Framer site with a real headless browser and writes a static
// mirror that can be served from WordPress (see ../wp-plugin/framer-mirror).
//
// Why a real browser? Framer renders with a client-side runtime that lazy-loads JS
// chunks, fonts and images. A plain downloader (wget/curl) misses those, which breaks
// the very motions/interactions we want to keep. Playwright captures exactly what the
// browser loads, so fidelity is preserved.
//
// Usage:
//   node capture.mjs [startUrl]          # startUrl overrides config.json/startUrl
//   (config is read from ./config.json, falling back to ./config.example.json)

import { chromium } from 'playwright';
import { mkdir, writeFile, readFile } from 'node:fs/promises';
import { existsSync } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const here = path.dirname(fileURLToPath(import.meta.url));

// --- config ---------------------------------------------------------------
async function loadConfig() {
  const file = existsSync(path.join(here, 'config.json'))
    ? path.join(here, 'config.json')
    : path.join(here, 'config.example.json');
  const cfg = JSON.parse(await readFile(file, 'utf8'));
  const cliUrl = process.argv[2];
  if (cliUrl) cfg.startUrl = cliUrl;
  if (!cfg.startUrl || cfg.startUrl.includes('YOUR-SITE')) {
    throw new Error(
      'Set "startUrl" in config.json or pass it on the CLI:\n' +
        '  node capture.mjs https://your-site.framer.website'
    );
  }
  return cfg;
}

// Framer's CDNs. Runtime JS (framerstatic) is always left absolute because the
// runtime builds chunk URLs at runtime; rewriting them locally breaks motion.
const RUNTIME_HOSTS = ['framerstatic.com', 'events.framer.com'];
const USERCONTENT_HOSTS = ['framerusercontent.com'];

const isHost = (url, hosts) => hosts.some((h) => url.includes(h));

// --- helpers --------------------------------------------------------------
function routeToFile(origin, url) {
  const u = new URL(url);
  let p = u.pathname;
  if (p.endsWith('/')) p = p.slice(0, -1);
  if (p === '') return 'index.html';
  // keep real file extensions (e.g. /favicon.ico), otherwise treat as a page
  return /\.[a-z0-9]{2,5}$/i.test(p) ? p.slice(1) : `${p.slice(1)}/index.html`;
}

function assetToFile(origin, url) {
  const u = new URL(url);
  return path.posix.join('_assets', u.host, u.pathname.replace(/^\/+/, ''));
}

async function save(outDir, relPath, data) {
  const full = path.join(outDir, relPath);
  await mkdir(path.dirname(full), { recursive: true });
  await writeFile(full, data);
}

async function discoverRoutes(origin, extraRoutes) {
  const found = new Set();
  try {
    const res = await fetch(`${origin}/sitemap.xml`);
    if (res.ok) {
      const xml = await res.text();
      for (const m of xml.matchAll(/<loc>(.*?)<\/loc>/g)) {
        if (m[1].startsWith(origin)) found.add(m[1].trim());
      }
    }
  } catch {
    /* no sitemap — we'll crawl links instead */
  }
  found.add(origin + '/');
  for (const r of extraRoutes || []) found.add(r);
  return found;
}

// --- main -----------------------------------------------------------------
const cfg = await loadConfig();
const origin = new URL(cfg.startUrl).origin;
const outDir = path.resolve(here, cfg.outDir || 'out');
const assetBase = (cfg.assetBaseUrl || '/wp-content/uploads/framer-mirror').replace(/\/$/, '');

console.log(`\nCapturing ${origin}\n  → ${outDir}\n`);

const browser = await chromium.launch();
const context = await browser.newContext({ viewport: cfg.viewport || { width: 1440, height: 900 } });
const page = await context.newPage();

// Collect same-origin (and optionally usercontent) asset responses as we navigate.
const assets = new Map(); // url -> { rel, buffer }
page.on('response', async (res) => {
  try {
    const url = res.url();
    const sameOrigin = url.startsWith(origin);
    const userContent = cfg.selfHostUserContent && isHost(url, USERCONTENT_HOSTS);
    if (!sameOrigin && !userContent) return;
    if (assets.has(url)) return;
    const req = res.request();
    if (req.resourceType() === 'document') return; // pages handled separately
    const buf = await res.body().catch(() => null);
    if (buf) assets.set(url, { rel: assetToFile(origin, url), buffer: buf });
  } catch {
    /* ignore individual asset failures */
  }
});

const queue = [...(await discoverRoutes(origin, cfg.extraRoutes))];
const visited = new Set();
const pageFiles = []; // { url, rel }

while (queue.length && visited.size < (cfg.maxPages || 200)) {
  const url = queue.shift();
  if (visited.has(url)) continue;
  visited.add(url);

  try {
    // Framer holds analytics/long-poll connections open, so 'networkidle' often
    // never fires. Wait for the DOM, then give the network a best-effort grace
    // period instead of letting a stuck connection skip the whole page.
    await page.goto(url, { waitUntil: 'domcontentloaded', timeout: 60000 });
    await page.waitForLoadState('networkidle', { timeout: 8000 }).catch(() => {});
    // Trigger lazy content / scroll-driven animations, then settle.
    await page.evaluate(async () => {
      await new Promise((resolve) => {
        let y = 0;
        const step = () => {
          window.scrollTo(0, y);
          y += window.innerHeight;
          if (y < document.body.scrollHeight) setTimeout(step, 60);
          else { window.scrollTo(0, 0); resolve(); }
        };
        step();
      });
    });
    await page.waitForTimeout(cfg.waitMs ?? 1500);

    // Discover internal links to crawl (only if there was no sitemap).
    const links = await page.$$eval('a[href]', (as) => as.map((a) => a.href));
    for (const l of links) {
      if (l.startsWith(origin) && !visited.has(l) && !l.includes('#')) queue.push(l);
    }

    const html = await page.content();
    const rel = routeToFile(origin, url);
    pageFiles.push({ url, rel, html });
    console.log(`  page  ${rel}`);
  } catch (e) {
    console.warn(`  skip  ${url} (${e.message})`);
  }
}

// Write assets.
for (const { rel, buffer } of assets.values()) {
  await save(outDir, rel, buffer);
}
console.log(`\n  ${assets.size} assets saved`);

// Rewrite + write pages.
function rewrite(html) {
  let out = html;
  // same-origin assets → local asset path under WordPress uploads
  for (const [url, { rel }] of assets) {
    const localUrl = `${assetBase}/${rel}`;
    out = out.split(url).join(localUrl);
  }
  // internal page links → relative routes on your domain
  out = out.split(origin + '/').join('/');
  out = out.split(origin).join('');
  return out;
}

for (const { rel, html } of pageFiles) {
  await save(outDir, rel, rewrite(html));
}

await browser.close();

console.log(
  `\n✓ Done. ${pageFiles.length} pages, ${assets.size} assets in ${outDir}\n` +
    `\nNext:\n` +
    `  1. Copy ${path.relative(process.cwd(), outDir)}/* into wp-content/uploads/framer-mirror/\n` +
    `  2. Copy ../wp-plugin/framer-mirror into wp-content/plugins/ and activate it\n` +
    `  3. Visit your domain.\n`
);
