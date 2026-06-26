<?php
/**
 * Plugin Name:       Framer Mirror
 * Description:        Serves a captured Framer static site under this WordPress domain, preserving the original design, motion and interactions.
 * Version:           0.1.0
 * Requires PHP:      7.4
 * Author:            mahdi-creates
 * License:           GPL-2.0-or-later
 *
 * Companion to the capture tool in framer-to-wordpress/capture.
 * Place the captured mirror in:  wp-content/uploads/framer-mirror/
 * (override with the FRAMER_MIRROR_DIR constant in wp-config.php).
 */

if (!defined('ABSPATH')) {
    exit;
}

/**
 * Absolute path to the captured mirror directory.
 */
function framer_mirror_dir() {
    if (defined('FRAMER_MIRROR_DIR')) {
        return rtrim(FRAMER_MIRROR_DIR, '/');
    }
    $uploads = wp_get_upload_dir();
    return rtrim($uploads['basedir'], '/') . '/framer-mirror';
}

/**
 * Request paths that must keep WordPress's normal behaviour.
 */
function framer_mirror_is_reserved($path) {
    $reserved = array(
        '/wp-admin', '/wp-login', '/wp-json', '/wp-content',
        '/wp-includes', '/wp-cron', '/xmlrpc.php', '/wp-comments-post.php',
    );
    foreach ($reserved as $prefix) {
        if (strpos($path, $prefix) === 0) {
            return true;
        }
    }
    return false;
}

/**
 * Map a request path to a file inside the mirror, guarding against traversal.
 * Returns an absolute, validated path or null.
 */
function framer_mirror_resolve($path) {
    $base = framer_mirror_dir();
    $realBase = realpath($base);
    if ($realBase === false) {
        return null; // mirror not installed yet
    }

    $rel = trim($path, '/');

    $candidates = array();
    if ($rel === '') {
        $candidates[] = $base . '/index.html';
    } else {
        $candidates[] = $base . '/' . $rel . '/index.html'; // pretty page
        $candidates[] = $base . '/' . $rel . '.html';        // flat page
        $candidates[] = $base . '/' . $rel;                  // direct asset
    }

    foreach ($candidates as $candidate) {
        $real = realpath($candidate);
        if ($real !== false
            && is_file($real)
            && strpos($real, $realBase) === 0) { // stays inside the mirror
            return $real;
        }
    }
    return null;
}

function framer_mirror_mime($file) {
    static $map = array(
        'html' => 'text/html; charset=UTF-8',
        'js'   => 'text/javascript; charset=UTF-8',
        'mjs'  => 'text/javascript; charset=UTF-8',
        'css'  => 'text/css; charset=UTF-8',
        'json' => 'application/json; charset=UTF-8',
        'svg'  => 'image/svg+xml',
        'png'  => 'image/png',
        'jpg'  => 'image/jpeg',
        'jpeg' => 'image/jpeg',
        'gif'  => 'image/gif',
        'webp' => 'image/webp',
        'avif' => 'image/avif',
        'ico'  => 'image/x-icon',
        'woff' => 'font/woff',
        'woff2'=> 'font/woff2',
        'ttf'  => 'font/ttf',
        'mp4'  => 'video/mp4',
        'webm' => 'video/webm',
        'txt'  => 'text/plain; charset=UTF-8',
        'xml'  => 'application/xml; charset=UTF-8',
    );
    $ext = strtolower(pathinfo($file, PATHINFO_EXTENSION));
    return isset($map[$ext]) ? $map[$ext] : 'application/octet-stream';
}

/**
 * Intercept front-end requests and serve the mirror when a match exists.
 * Runs before WordPress renders a template so it overrides themes and 404s.
 */
add_action('template_redirect', 'framer_mirror_serve', 0);
function framer_mirror_serve() {
    if (is_admin()) {
        return;
    }

    $path = parse_url($_SERVER['REQUEST_URI'], PHP_URL_PATH);
    if ($path === false || $path === null) {
        return;
    }
    $path = rawurldecode($path);

    if (framer_mirror_is_reserved($path)) {
        return; // let WordPress handle its own routes / assets
    }

    $file = framer_mirror_resolve($path);
    if ($file === null) {
        return; // no mirrored file — fall through to WordPress
    }

    nocache_headers();
    header('Content-Type: ' . framer_mirror_mime($file));
    header('Content-Length: ' . filesize($file));
    header('X-Served-By: framer-mirror');
    readfile($file);
    exit;
}

/**
 * Admin notice if the mirror folder is missing, so it's obvious what to do next.
 */
add_action('admin_notices', 'framer_mirror_admin_notice');
function framer_mirror_admin_notice() {
    if (realpath(framer_mirror_dir()) !== false) {
        return;
    }
    echo '<div class="notice notice-warning"><p><strong>Framer Mirror:</strong> '
        . 'no captured site found at <code>' . esc_html(framer_mirror_dir()) . '</code>. '
        . 'Run the capture tool and copy its output there.</p></div>';
}
