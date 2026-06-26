// End-to-end check: serve the mirror like the WP plugin does, then drive it
// in a headless browser to confirm the design + runtime + navigation survive.
import { chromium } from 'playwright';
import { createServer } from 'node:http';
import { readFile, stat } from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const here = path.dirname(fileURLToPath(import.meta.url));
const root = path.join(here, 'out');

const MIME = { html:'text/html', mjs:'text/javascript', js:'text/javascript', css:'text/css', json:'application/json', svg:'image/svg+xml' };

// Mirror the plugin's resolution: /path → /path/index.html, else /path, else /path.html
async function resolve(urlPath) {
  const rel = decodeURIComponent(urlPath.split('?')[0]).replace(/^\/+/, '');
  const tries = rel === '' ? ['index.html'] : [`${rel}/index.html`, rel, `${rel}.html`];
  for (const t of tries) {
    const f = path.join(root, t);
    try { if ((await stat(f)).isFile()) return f; } catch {}
  }
  return null;
}

const server = createServer(async (req, res) => {
  const f = await resolve(req.url);
  if (!f) { res.writeHead(404); res.end('not found'); return; }
  const ext = path.extname(f).slice(1);
  res.writeHead(200, { 'Content-Type': MIME[ext] || 'application/octet-stream' });
  res.end(await readFile(f));
});

await new Promise((r) => server.listen(0, r));
const port = server.address().port;
const base = `http://localhost:${port}`;

const browser = await chromium.launch();
const page = await browser.newPage({ viewport: { width: 1440, height: 900 } });
const errors = [];
page.on('console', (m) => { if (m.type() === 'error') errors.push(m.text()); });
page.on('pageerror', (e) => errors.push('pageerror: ' + e.message));

async function check(route) {
  const r = await page.goto(base + route, { waitUntil: 'domcontentloaded' });
  await page.waitForLoadState('networkidle', { timeout: 8000 }).catch(() => {});
  await page.waitForTimeout(1500);
  const title = await page.title();
  // Did Framer's runtime hydrate? It injects [data-framer-*] / styles at runtime.
  const hydrated = await page.evaluate(() =>
    !!document.querySelector('[data-framer-name], [data-framer-component-type], .framer-body, #main')
  );
  const text = (await page.evaluate(() => document.body.innerText || '')).trim().length;
  console.log(`  ${r.status()}  ${route.padEnd(40)} title="${title.slice(0,40)}" hydrated=${hydrated} textLen=${text}`);
  return { status: r.status(), hydrated, text };
}

console.log('\nVerifying mirror served like the WP plugin:\n');
const home = await check('/');
await check('/projects');
await check('/about');
await check('/projects/fluentforms-website-design');

// Screenshot the homepage for visual confirmation.
await page.goto(base + '/', { waitUntil: 'domcontentloaded' });
await page.waitForTimeout(2500);
await page.screenshot({ path: path.join(here, 'verify-home.png'), fullPage: false });

console.log(`\nConsole/page errors (${errors.length}):`);
for (const e of errors.slice(0, 12)) console.log('  • ' + e.slice(0, 140));

await browser.close();
server.close();
console.log('\nScreenshot: verify-home.png');
