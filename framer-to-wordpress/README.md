# Framer → WordPress mirror

Move a **published Framer site** onto your **own WordPress domain** while keeping the
design, interactions, motion and effects **exactly as they are on Framer**.

It does this the only way that preserves true fidelity: it keeps Framer's runtime
JavaScript. Nothing is "converted" — the real Framer output is captured and re-served
from WordPress under your domain.

```
framer-to-wordpress/
├── capture/                 # Node + Playwright tool that mirrors the live Framer site
│   ├── capture.mjs
│   ├── package.json
│   └── config.example.json
└── wp-plugin/
    └── framer-mirror/       # WordPress plugin that serves the captured site
        ├── framer-mirror.php
        └── readme.txt
```

## How it works

1. **Capture** crawls your published Framer site with a real headless browser, so it
   gets *everything the browser actually loads* — HTML per route, fonts, images, and the
   lazy-loaded JS chunks that simple downloaders (`wget`) miss. It writes a static mirror.
2. The **WordPress plugin** serves that mirror: `yourdomain.com/about` returns the
   captured `about/index.html`, while `/wp-admin`, `/wp-json`, etc. keep working normally.
3. You point your domain at this WordPress install. Done.

## What you get vs. what you don't

✅ Pixel-identical design + **real Framer motion/interactions** (runtime is preserved)
✅ Served from your own domain, hosted on your WordPress
✅ No Framer paid plan required (works off the free `*.framer.website` URL)

⚠️ It is a **snapshot** — edit in Framer, then re-run the capture to refresh
⚠️ Framer **CMS content is frozen** at capture time
⚠️ Pages are **not** Gutenberg-editable (WordPress hosts Framer's output, it doesn't convert it)
⚠️ Use only on a site **you own**

## Quick start

```bash
# 1. Capture your live Framer site
cd capture
npm install
npx playwright install chromium
node capture.mjs https://YOUR-SITE.framer.website

# 2. Copy the result into WordPress
#    - Copy capture/out/*          -> wp-content/uploads/framer-mirror/
#    - Copy wp-plugin/framer-mirror -> wp-content/plugins/framer-mirror/

# 3. Activate "Framer Mirror" in WP Admin → Plugins. Visit your domain.
```

See `capture/config.example.json` for options (self-hosting images/fonts, max pages, etc.).
