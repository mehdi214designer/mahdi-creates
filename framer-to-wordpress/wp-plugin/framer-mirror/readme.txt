=== Framer Mirror ===
Stable tag: 0.1.0
Requires PHP: 7.4
License: GPLv2 or later

Serves a captured Framer static site under your WordPress domain, keeping the
original design, motion and interactions intact.

== Installation ==

1. Capture your Framer site with the companion tool (framer-to-wordpress/capture):

     cd capture
     npm install
     npx playwright install chromium
     node capture.mjs https://your-site.framer.website

2. Copy the capture output into your WordPress uploads:

     wp-content/uploads/framer-mirror/
       index.html
       about/index.html
       _assets/...

   (Override the location by defining FRAMER_MIRROR_DIR in wp-config.php.)

3. Copy this folder to wp-content/plugins/framer-mirror/ and activate
   "Framer Mirror" in WP Admin → Plugins.

4. Visit your domain. /wp-admin, /wp-json and other WordPress routes keep working.

== How it works ==

On every front-end request the plugin checks for a matching file in the mirror
(e.g. /about → framer-mirror/about/index.html) and serves it directly, overriding
the active theme. Framer's runtime JavaScript is preserved, so animations and
interactions behave exactly as on Framer.

== Notes ==

* It is a snapshot. Re-run the capture and replace the files to update content.
* Framer CMS content is frozen at capture time.
* Pages are not Gutenberg-editable; WordPress hosts Framer's output as-is.

== Changelog ==

= 0.1.0 =
* Initial release: static-mirror serving with path-traversal protection and MIME mapping.
