import { readFileSync } from 'fs';
import path from 'path';
import { NextRequest } from 'next/server';
import { applyNavFix, serve404Response } from '@/lib/nav-fix';

const WP_API = 'https://cms.mahdicreates.com/wp-json/wp/v2';

function makeSeoTitle(rawTitle: string): string {
  const withBrand = `${rawTitle} | Mahdi Creates`;
  if (withBrand.length <= 60) return withBrand;
  if (rawTitle.length <= 60) return rawTitle;
  const maxLen = 44;
  let candidate = rawTitle.slice(0, maxLen);
  const lastSpace = candidate.lastIndexOf(' ');
  if (lastSpace > maxLen * 0.6) candidate = candidate.slice(0, lastSpace);
  candidate = candidate.replace(/[,;:.!?\s]+$/, '').trim();
  return `${candidate} | Mahdi Creates`;
}

interface WPResource {
  id: number;
  slug: string;
  date: string;
  modified: string;
  title: { rendered: string };
  content: { rendered: string };
  excerpt: { rendered: string };
  featured_media: number;
  meta?: { resource_url?: string; resource_cta_url?: string; resource_cta_label?: string };
  _embedded?: {
    'wp:featuredmedia'?: Array<{ source_url: string; alt_text: string }>;
    'wp:term'?: Array<Array<{ name: string; slug: string }>>;
  };
}

function rewriteWpUrls(html: string): string {
  return html;
}

function formatDate(dateStr: string): string {
  return new Date(dateStr).toLocaleDateString('en-US', {
    month: 'long', day: 'numeric', year: 'numeric',
  });
}

function buildPlaceholderImg(title: string): string {
  const t = encodeURIComponent(title.toUpperCase().slice(0, 16));
  return `data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='800' height='500'%3E%3Crect width='800' height='500' fill='%231a0800'/%3E%3Ctext x='400' y='270' font-family='sans-serif' font-size='38' font-weight='700' fill='rgba(255%2C255%2C255%2C0.12)' text-anchor='middle'%3E${t}%3C/text%3E%3C/svg%3E`;
}

const BACK_SVG = `<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M19 12H5"/><polyline points="12 19 5 12 12 5"/></svg>`;
const X_SVG = `<svg width="13" height="13" viewBox="0 0 24 24" fill="currentColor"><path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-4.714-6.231-5.401 6.231H2.746l7.73-8.835L1.254 2.25H8.08l4.253 5.622zm-1.161 17.52h1.833L7.084 4.126H5.117z"/></svg>`;
const LI_SVG = `<svg width="13" height="13" viewBox="0 0 24 24" fill="currentColor"><path d="M20.447 20.452h-3.554v-5.569c0-1.328-.027-3.037-1.852-3.037-1.853 0-2.136 1.445-2.136 2.939v5.667H9.351V9h3.414v1.561h.046c.477-.9 1.637-1.85 3.37-1.85 3.601 0 4.267 2.37 4.267 5.455v6.286zM5.337 7.433a2.062 2.062 0 01-2.063-2.065 2.064 2.064 0 112.063 2.065zm1.782 13.019H3.555V9h3.564v11.452zM22.225 0H1.771C.792 0 0 .774 0 1.729v20.542C0 23.227.792 24 1.771 24h20.451C23.2 24 24 23.227 24 22.271V1.729C24 .774 23.2 0 22.222 0h.003z"/></svg>`;

const ARTICLE_CSS = `<style>
.mc-article-header{padding:0!important;border-bottom:none!important;margin-bottom:0!important}
.mc-a-body{max-width:800px!important;margin:0 auto}
.mc-a-cover{max-width:800px;width:100%;display:block;margin:0 auto 48px;border-radius:20px;object-fit:cover;aspect-ratio:16/9}
.mc-a-title{margin:0 0 24px!important}
.mc-back-link{display:inline-flex;align-items:center;gap:6px;font-size:14px;color:rgba(255,255,255,.4);text-decoration:none;margin-bottom:28px;transition:color .2s}
.mc-back-link:hover{color:rgba(255,255,255,.75)}
.mc-a-meta-row{display:flex;align-items:center;gap:8px;flex-wrap:wrap;margin-bottom:20px}
.mc-a-cat-pill{background:rgba(255,101,34,.12);border:1px solid rgba(255,101,34,.25);color:#ff6522;font-size:12px;font-weight:700;padding:3px 10px;border-radius:100px;letter-spacing:.02em}
.mc-meta-sep{color:rgba(255,255,255,.2);font-size:14px}
.mc-meta-text{font-size:14px;color:rgba(255,255,255,.4)}
.mc-a-lead{font-size:17px;line-height:1.75;color:rgba(255,255,255,.5);margin:0 0 28px;max-width:680px}
.mc-share-row{display:flex;align-items:center;gap:8px;flex-wrap:wrap;padding-top:28px;border-top:1px solid rgba(255,255,255,.07);margin:40px auto 0;max-width:800px}
.mc-share-lbl{font-size:13px;font-weight:600;color:rgba(255,255,255,.4);margin-right:4px}
.mc-share-btn{display:inline-flex;align-items:center;gap:5px;padding:7px 14px;border-radius:100px;border:1px solid rgba(255,255,255,.12);background:transparent;color:rgba(255,255,255,.55);text-decoration:none;cursor:pointer;transition:border-color .2s,color .2s;line-height:1;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Helvetica,Arial,sans-serif;font-size:13px;font-weight:500}
button.mc-share-btn{font:500 13px/1 -apple-system,BlinkMacSystemFont,'Segoe UI',Helvetica,Arial,sans-serif}
.mc-share-btn:hover{border-color:rgba(255,255,255,.35);color:#fff}
.mc-res-btn-row{display:flex;flex-wrap:wrap;gap:10px;margin:0 0 40px}
.mc-res-btn{display:inline-flex;align-items:center;gap:6px;padding:10px 24px;border-radius:100px;font-size:14px;font-weight:600;text-decoration:none;transition:opacity .2s,background .2s}
.mc-res-btn--primary{background:#ff6522;color:#fff}
.mc-res-btn--primary:hover{opacity:.85}
.mc-res-btn--ghost{background:transparent;color:rgba(255,255,255,.7);border:1px solid rgba(255,255,255,.2)}
.mc-res-btn--ghost:hover{border-color:rgba(255,255,255,.5);color:#fff}
.mc-promo-block{background:rgba(255,255,255,.04);border:1px solid rgba(255,255,255,.08);border-radius:20px;padding:32px;margin:40px 0;overflow:hidden}
/* ── Base typography ── */
.mc-a-body p{margin:0 0 20px;line-height:1.75;color:rgba(255,255,255,.75)}
.mc-a-body h2{font-size:24px;font-weight:700;color:#fff;margin:40px 0 16px;line-height:1.3}
.mc-a-body h3{font-size:20px;font-weight:700;color:#fff;margin:32px 0 12px;line-height:1.35}
.mc-a-body h4{font-size:17px;font-weight:700;color:#fff;margin:28px 0 10px;line-height:1.4}
.mc-a-body h5,.mc-a-body h6{font-size:15px;font-weight:700;color:#fff;margin:24px 0 8px;line-height:1.4}
.mc-a-body a:not(.wp-block-button__link):not(.wp-block-file__button):not(.mc-res-btn){color:#ff6522;text-decoration:none;border-bottom:1px solid rgba(255,101,34,.3);transition:border-color .2s}
.mc-a-body a:not(.wp-block-button__link):not(.wp-block-file__button):not(.mc-res-btn):hover{border-color:#ff6522}
/* ── Lists ── */
.mc-a-body ul,.mc-a-body ol,.mc-a-body .wp-block-list{margin:0 0 24px;padding-left:24px;color:rgba(255,255,255,.75)}
.mc-a-body ul{list-style:disc}
.mc-a-body ol{list-style:decimal}
.mc-a-body ul li,.mc-a-body ol li{margin-bottom:8px;line-height:1.7}
/* ── Image / Figure ── */
.mc-a-body img{max-width:100%;height:auto;border-radius:10px}
.mc-a-body figure{margin:32px 0}
.mc-a-body figure img{width:100%;border-radius:12px}
.mc-a-body figcaption,.mc-a-body .wp-element-caption{text-align:center;font-size:12px;color:rgba(255,255,255,.35);margin-top:8px}
.mc-a-body .wp-block-image{margin:32px 0}
.mc-a-body .wp-block-image img{width:100%;border-radius:12px}
/* ── Buttons ── */
.mc-a-body .wp-block-buttons{display:flex;flex-wrap:wrap;gap:10px;align-items:center;margin:28px 0}
.mc-a-body .wp-block-button__link{display:inline-flex;align-items:center;padding:10px 24px;border-radius:100px;background:#ff6522;color:#fff;font-weight:600;font-size:14px;text-decoration:none;border:none;transition:opacity .2s}
.mc-a-body .wp-block-button__link:hover{opacity:.85;border-bottom:none}
.mc-a-body .wp-block-button.is-style-outline .wp-block-button__link{background:transparent!important;color:rgba(255,255,255,.75)!important;border:1px solid rgba(255,255,255,.25)!important}
.mc-a-body .wp-block-button.is-style-outline .wp-block-button__link:hover{border-color:rgba(255,255,255,.6)!important;color:#fff!important;opacity:1}
/* ── Separator ── */
.mc-a-body .wp-block-separator{border:none;border-top:1px solid rgba(255,255,255,.08);margin:40px 0}
/* ── Quote ── */
.mc-a-body .wp-block-quote{border-left:3px solid #ff6522;margin:32px 0;padding:20px 28px;background:rgba(255,101,34,.06);border-radius:0 12px 12px 0}
.mc-a-body .wp-block-quote p{font-size:17px;font-style:italic;color:rgba(255,255,255,.8);margin:0 0 8px}
.mc-a-body .wp-block-quote cite,.mc-a-body .wp-block-quote footer{font-size:13px;color:rgba(255,255,255,.4);font-style:normal}
/* ── Pullquote ── */
.mc-a-body .wp-block-pullquote{border:none;border-top:2px solid rgba(255,101,34,.4);border-bottom:2px solid rgba(255,101,34,.4);margin:40px 0;padding:32px 24px;text-align:center}
.mc-a-body .wp-block-pullquote blockquote{margin:0}
.mc-a-body .wp-block-pullquote p{font-size:22px;font-weight:600;font-style:italic;color:#fff;line-height:1.5;margin:0 0 12px}
.mc-a-body .wp-block-pullquote cite{font-size:13px;color:rgba(255,255,255,.4);font-style:normal}
/* ── Code ── */
.mc-a-body code{background:rgba(255,255,255,.08);padding:2px 7px;border-radius:5px;font-family:'SF Mono',Monaco,Consolas,'Courier New',monospace;font-size:13px;color:#ff9060}
.mc-a-body .wp-block-code{background:rgba(255,255,255,.05);border:1px solid rgba(255,255,255,.1);border-radius:12px;padding:24px;margin:28px 0;overflow-x:auto}
.mc-a-body .wp-block-code code{background:none;padding:0;color:rgba(255,255,255,.85);font-size:13px;line-height:1.7;white-space:pre}
.mc-a-body .wp-block-preformatted{background:rgba(255,255,255,.05);border:1px solid rgba(255,255,255,.1);border-radius:12px;padding:24px;margin:28px 0;overflow-x:auto;font-family:'SF Mono',Monaco,Consolas,monospace;font-size:13px;line-height:1.7;color:rgba(255,255,255,.8);white-space:pre-wrap}
/* ── Table ── */
.mc-a-body .wp-block-table{margin:32px 0;overflow-x:auto;border-radius:12px;border:1px solid rgba(255,255,255,.1)}
.mc-a-body .wp-block-table table{width:100%;border-collapse:collapse;font-size:14px}
.mc-a-body .wp-block-table th{padding:12px 16px;text-align:left;font-weight:600;color:#fff;background:rgba(255,255,255,.06);border-bottom:1px solid rgba(255,255,255,.12)}
.mc-a-body .wp-block-table td{padding:12px 16px;color:rgba(255,255,255,.7);border-bottom:1px solid rgba(255,255,255,.06)}
.mc-a-body .wp-block-table tr:last-child td{border-bottom:none}
/* ── Columns ── */
.mc-a-body .wp-block-columns{display:flex;gap:24px;margin:32px 0;flex-wrap:wrap}
.mc-a-body .wp-block-column{flex:1;min-width:200px}
.mc-a-body .wp-block-column>*:first-child{margin-top:0}
.mc-a-body .wp-block-column>*:last-child{margin-bottom:0}
/* ── Group ── */
.mc-a-body .wp-block-group{margin:32px 0}
.mc-a-body .wp-block-group.has-background{padding:32px;border-radius:16px}
/* ── Cover ── */
.mc-a-body .wp-block-cover{position:relative;min-height:200px;display:flex;align-items:center;justify-content:center;border-radius:16px;overflow:hidden;margin:32px 0;padding:40px 24px}
.mc-a-body .wp-block-cover__image-background,.mc-a-body .wp-block-cover__video-background{position:absolute;inset:0;width:100%;height:100%;object-fit:cover;border-radius:0}
.mc-a-body .wp-block-cover__inner-container{position:relative;z-index:1;text-align:center;color:#fff;width:100%}
.mc-a-body .wp-block-cover__inner-container p{color:#fff;margin:0}
/* ── Media & Text ── */
.mc-a-body .wp-block-media-text{display:grid;grid-template-columns:1fr 1fr;gap:32px;align-items:center;margin:32px 0}
.mc-a-body .wp-block-media-text.has-media-on-the-right .wp-block-media-text__media{order:2}
.mc-a-body .wp-block-media-text__media img,.mc-a-body .wp-block-media-text__media video{width:100%;border-radius:12px}
.mc-a-body .wp-block-media-text__content>*:first-child{margin-top:0}
.mc-a-body .wp-block-media-text__content>*:last-child{margin-bottom:0}
/* ── Gallery ── */
.mc-a-body .wp-block-gallery{display:grid;gap:12px;margin:32px 0}
.mc-a-body .wp-block-gallery.columns-2{grid-template-columns:repeat(2,1fr)}
.mc-a-body .wp-block-gallery.columns-3{grid-template-columns:repeat(3,1fr)}
.mc-a-body .wp-block-gallery .wp-block-image{margin:0}
.mc-a-body .wp-block-gallery .wp-block-image img{width:100%;height:200px;object-fit:cover;border-radius:10px}
/* ── Video / Audio ── */
.mc-a-body .wp-block-video{margin:32px 0}
.mc-a-body .wp-block-video video{width:100%;border-radius:12px}
.mc-a-body .wp-block-audio{margin:28px 0}
.mc-a-body .wp-block-audio audio{width:100%;accent-color:#ff6522}
/* ── File ── */
.mc-a-body .wp-block-file{display:flex;align-items:center;gap:12px;padding:16px 20px;background:rgba(255,255,255,.05);border:1px solid rgba(255,255,255,.1);border-radius:12px;margin:28px 0}
.mc-a-body .wp-block-file a:not(.wp-block-file__button){color:rgba(255,255,255,.8);text-decoration:none;border-bottom:none;font-size:14px;font-weight:500;flex:1}
.mc-a-body .wp-block-file a:not(.wp-block-file__button):hover{color:#fff}
.mc-a-body .wp-block-file__button{display:inline-flex;align-items:center;padding:8px 16px;border-radius:100px;background:#ff6522;color:#fff!important;font-size:13px;font-weight:600;text-decoration:none;border-bottom:none!important;white-space:nowrap}
.mc-a-body .wp-block-file__button:hover{opacity:.85}
/* ── Embed (YouTube, Vimeo…) ── */
.mc-a-body .wp-block-embed{margin:32px 0}
.mc-a-body .wp-block-embed .wp-block-embed__wrapper{position:relative;padding-bottom:56.25%;height:0;overflow:hidden;border-radius:12px}
.mc-a-body .wp-block-embed .wp-block-embed__wrapper iframe{position:absolute;top:0;left:0;width:100%;height:100%}
/* ── Details / Accordion ── */
.mc-a-body .wp-block-details{border:1px solid rgba(255,255,255,.1);border-radius:12px;margin:28px 0;overflow:hidden}
.mc-a-body .wp-block-details summary{padding:16px 20px;cursor:pointer;font-weight:600;color:#fff;font-size:15px;list-style:none;display:flex;justify-content:space-between;align-items:center;user-select:none}
.mc-a-body .wp-block-details summary::-webkit-details-marker{display:none}
.mc-a-body .wp-block-details summary::after{content:'›';transform:rotate(90deg);display:inline-block;transition:transform .2s;color:rgba(255,255,255,.4);font-size:20px;line-height:1}
.mc-a-body .wp-block-details[open] summary::after{transform:rotate(270deg)}
.mc-a-body .wp-block-details>*:not(summary){padding:0 20px 20px;color:rgba(255,255,255,.7)}
/* ── Yoast FAQ ── */
.mc-a-body .wp-block-yoast-faq-block,.mc-a-body .schema-faq{margin:40px 0;border:1px solid rgba(255,255,255,.08);border-radius:16px;overflow:hidden}
.mc-a-body .schema-faq-section{padding:22px 28px;border-bottom:1px solid rgba(255,255,255,.07)}
.mc-a-body .schema-faq-section:last-child{border-bottom:none}
.mc-a-body .schema-faq-question{display:block;font-size:15px!important;font-weight:700!important;color:#ff6522!important;margin-bottom:8px;line-height:1.45}
.mc-a-body .schema-faq-answer{margin:0;font-size:14px;line-height:1.75;color:rgba(255,255,255,.65)}
.mc-a-body .schema-faq-answer p{margin:0}
/* ── Spacer ── */
.mc-a-body .wp-block-spacer{display:block}
/* ── Responsive ── */
@media(max-width:768px){
.mc-a-body .wp-block-columns{flex-direction:column;gap:16px}
.mc-a-body .wp-block-media-text{grid-template-columns:1fr}
.mc-a-body .wp-block-media-text.has-media-on-the-right .wp-block-media-text__media{order:0}
.mc-a-body .wp-block-gallery.columns-3{grid-template-columns:repeat(2,1fr)}
.mc-a-body .wp-block-pullquote p{font-size:18px}
}
/* ── Article header outer (keeps back-link + header aligned with body) ── */
.mc-article-outer{max-width:800px;margin:0 auto}
/* ── Hero install command block ── */
.mc-hero-code{background:rgba(255,255,255,.04);border:1px solid rgba(255,255,255,.12);border-radius:12px;padding:16px 20px;font-family:'SF Mono',Monaco,Consolas,'Courier New',monospace;font-size:14px;color:rgba(255,255,255,.8);display:flex;align-items:center;justify-content:space-between;gap:16px;margin-bottom:20px}
.mc-hero-code-inner{display:flex;align-items:center;gap:10px;overflow:hidden}
.mc-hero-code-pr{color:#ff6522;flex-shrink:0}
.mc-hero-copy{background:transparent;border:1px solid rgba(255,255,255,.15);color:rgba(255,255,255,.4);font-size:12px;padding:5px 10px;border-radius:6px;cursor:pointer;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',sans-serif;transition:border-color .2s,color .2s;flex-shrink:0}
.mc-hero-copy:hover{border-color:rgba(255,255,255,.4);color:rgba(255,255,255,.75)}
/* ── Rich resource sections ── */
.mc-rsec{padding:52px 0;border-top:1px solid rgba(255,255,255,.07)}
.mc-rsec:first-child{border-top:none;padding-top:0}
.mc-rsec-eyebrow{display:flex;align-items:center;gap:10px;font-size:11px;font-weight:700;letter-spacing:.1em;text-transform:uppercase;color:#ff6522;margin-bottom:18px}
.mc-rsec-eyebrow::before{content:'';display:block;width:20px;height:2px;background:#ff6522;flex-shrink:0}
.mc-rsec-h{font-size:clamp(24px,3.5vw,38px);font-weight:700;color:#fff;line-height:1.2;margin:0 0 14px}
.mc-rsec-lede{font-size:16px;line-height:1.75;color:rgba(255,255,255,.55);margin:0 0 32px;max-width:560px}
/* 3-col feature grid */
.mc-rgrid3{display:grid;grid-template-columns:repeat(3,1fr);gap:0;border:1px solid rgba(255,255,255,.1);border-radius:12px;overflow:hidden;margin-top:24px}
.mc-rcard{padding:24px;border-right:1px solid rgba(255,255,255,.1)}
.mc-rcard:last-child{border-right:none}
.mc-rcard-num{font-size:12px;font-weight:700;color:#ff6522;margin-bottom:10px;letter-spacing:.04em}
.mc-rcard-title{font-size:14px;font-weight:700;color:#fff;margin:0 0 8px;line-height:1.4}
.mc-rcard-desc{font-size:13px;line-height:1.6;color:rgba(255,255,255,.45);margin:0}
/* Numbered steps */
.mc-rsteps{display:flex;flex-direction:column;position:relative;padding-left:56px}
.mc-rsteps::before{content:'';position:absolute;left:17px;top:44px;bottom:44px;width:1px;background:rgba(255,255,255,.08)}
.mc-rstep{padding:22px 0;border-bottom:1px solid rgba(255,255,255,.06);position:relative}
.mc-rstep:last-child{border-bottom:none}
.mc-rstep-num{position:absolute;left:-56px;width:36px;height:36px;border-radius:50%;border:1px solid rgba(255,255,255,.14);display:flex;align-items:center;justify-content:center;font-size:13px;font-weight:700;color:rgba(255,255,255,.45);background:#0d0d0d;top:20px;z-index:1}
.mc-rstep h3{font-size:15px;font-weight:700;color:#fff;margin:0 0 8px;line-height:1.4}
.mc-rstep p{font-size:14px;line-height:1.65;color:rgba(255,255,255,.5);margin:0 0 10px}
.mc-rstep p:last-child{margin:0}
/* Inline code for rich sections */
.mc-ric{background:rgba(255,255,255,.09);padding:2px 7px;border-radius:4px;font-family:'SF Mono',Monaco,Consolas,monospace;font-size:.85em;color:rgba(255,255,255,.82)}
/* Code block for rich sections */
.mc-rcode{background:rgba(255,255,255,.04);border:1px solid rgba(255,255,255,.1);border-radius:10px;padding:14px 18px;font-family:'SF Mono',Monaco,Consolas,monospace;font-size:13px;color:rgba(255,255,255,.75);margin:10px 0;display:flex;align-items:center}
.mc-rcode-pr{color:#ff6522;margin-right:8px;user-select:none}
@media(max-width:640px){
.mc-rgrid3{grid-template-columns:1fr}
.mc-rcard{border-right:none;border-bottom:1px solid rgba(255,255,255,.1)}
.mc-rcard:last-child{border-bottom:none}
.mc-rsteps{padding-left:44px}
.mc-rsteps::before{left:13px}
.mc-rstep-num{left:-44px;width:28px;height:28px;font-size:11px;top:18px}
}
</style>`;

function buildShareRow(encUrl: string, encTitle: string): string {
  return `<div class="mc-share-row">
  <span class="mc-share-lbl">Share:</span>
  <a class="mc-share-btn" href="https://twitter.com/intent/tweet?url=${encUrl}&text=${encTitle}" target="_blank" rel="noopener noreferrer">${X_SVG}Twitter</a>
  <a class="mc-share-btn" href="https://www.linkedin.com/sharing/share-offsite/?url=${encUrl}" target="_blank" rel="noopener noreferrer">${LI_SVG}LinkedIn</a>
  <button class="mc-share-btn" id="mc-copy-btn">Copy Link</button>
</div>
<script>(function(){var b=document.getElementById('mc-copy-btn');if(b)b.onclick=function(){navigator.clipboard.writeText(location.href).then(function(){b.textContent='Copied!';setTimeout(function(){b.textContent='Copy Link';},2000)});};})();</script>`;
}

function buildArticle(resource: WPResource): string {
  const img = resource._embedded?.['wp:featuredmedia']?.[0];
  const coverSrc = rewriteWpUrls(img?.source_url ?? buildPlaceholderImg(resource.title.rendered));
  const coverAlt = img?.alt_text || resource.title.rendered;
  const terms = resource._embedded?.['wp:term']?.[0] ?? [];
  const category = terms[0]?.name ?? 'Resource';
  const rawContent = rewriteWpUrls(resource.content.rendered);
  // Extract hero install command from content (data-mc-install="cmd") and strip the element
  const heroMatch = rawContent.match(/data-mc-install="([^"]+)"/);
  const heroCmd = heroMatch ? heroMatch[1] : null;
  const content = heroCmd ? rawContent.replace(/<[^>]*data-mc-install="[^"]*"[^>]*>\s*<\/[^>]+>/g, '').replace(/<[^>]*data-mc-install="[^"]*"[^>]*\/>/g, '') : rawContent;
  const excerpt = resource.excerpt.rendered.replace(/<[^>]+>/g, '').replace(/\[…\]|\[&hellip;\]/g, '').trim().slice(0, 280);
  const externalUrl = resource.meta?.resource_url;
  const ctaUrl = resource.meta?.resource_cta_url;
  const ctaLabel = resource.meta?.resource_cta_label;
  const encUrl = encodeURIComponent(`https://www.mahdicreates.com/resources/${resource.slug}`);
  const encTitle = encodeURIComponent(resource.title.rendered);

  const visitBtn = externalUrl
    ? `<a href="${externalUrl}" class="mc-res-btn mc-res-btn--ghost" target="_blank" rel="noopener">Visit Site →</a>`
    : '';
  const ctaBtn = ctaUrl && ctaLabel
    ? `<a href="${ctaUrl}" class="mc-res-btn mc-res-btn--primary" target="_blank" rel="noopener">${ctaLabel}</a>`
    : '';
  const btnRow = visitBtn || ctaBtn
    ? `<div class="mc-res-btn-row">${ctaBtn}${visitBtn}</div>`
    : '';
  const heroCodeBlock = heroCmd
    ? `<div class="mc-hero-code"><div class="mc-hero-code-inner"><span class="mc-hero-code-pr">$</span>${heroCmd}</div><button class="mc-hero-copy" id="mc-hero-copy-btn" data-copy="${heroCmd}">copy</button></div><script>(function(){var b=document.getElementById('mc-hero-copy-btn');if(b)b.onclick=function(){navigator.clipboard.writeText(b.dataset.copy).then(function(){var t=b.textContent;b.textContent='copied';setTimeout(function(){b.textContent=t;},1600);});};})();<\/script>`
    : '';

  // Standalone resources have their own full-page design (e.g. Server Studio #ss-page)
  // — skip the mc-a-body wrapper and cover image so the design renders at full width
  const isStandalone = content.includes('id="ss-page"');

  if (isStandalone) {
    return `<!-- MC_POST_START -->
${ARTICLE_CSS}
<article>
  <div style="max-width:800px;margin:0 auto;padding:0 28px 0">
    <a class="mc-back-link" href="/resources">${BACK_SVG}Back to Resources</a>
    <header class="mc-article-header">
      <div class="mc-a-meta-row">
        <span class="mc-a-cat-pill">${category}</span>
        <span class="mc-meta-sep">·</span>
        <span class="mc-meta-text">${formatDate(resource.date)}</span>
      </div>
    </header>
  </div>
  ${content}
  ${buildShareRow(encUrl, encTitle)}
</article>
<!-- MC_POST_END -->`;
  }

  return `<!-- MC_POST_START -->
${ARTICLE_CSS}
<article>
  <div class="mc-article-outer">
    <a class="mc-back-link" href="/resources">${BACK_SVG}Back to Resources</a>
    <header class="mc-article-header">
      <div class="mc-a-meta-row">
        <span class="mc-a-cat-pill">${category}</span>
        <span class="mc-meta-sep">·</span>
        <span class="mc-meta-text">${formatDate(resource.date)}</span>
      </div>
      <h1 class="mc-a-title">${resource.title.rendered}</h1>
      ${excerpt ? `<p class="mc-a-lead">${excerpt}</p>` : ''}
      ${heroCodeBlock}
      ${btnRow}
    </header>
  </div>
  ${img ? `<img class="mc-a-cover" src="${coverSrc}" alt="${coverAlt}" loading="lazy">` : ''}
  <div class="mc-a-body">${content}</div>
  ${buildShareRow(encUrl, encTitle)}
</article>
<!-- MC_POST_END -->`;
}

function buildRelated(resources: WPResource[]): string {
  const cards = resources.slice(0, 3).map((r, i) => {
    const img = r._embedded?.['wp:featuredmedia']?.[0];
    const src = rewriteWpUrls(img?.source_url ?? buildPlaceholderImg(r.title.rendered));
    const terms = r._embedded?.['wp:term']?.[0] ?? [];
    const cat = terms[0]?.name ?? 'Resource';
    const hasContent = (r.content?.rendered ?? '').replace(/<[^>]+>/g, '').trim().length > 0;
    const href = hasContent ? `/resources/${r.slug}` : (r.meta?.resource_url || '#');
    const external = !hasContent;
    return `      <a href="${href}"${external ? ' target="_blank" rel="noopener"' : ''} class="mc-card" data-mc-appear="mc-fade-up" data-mc-delay="${i * 80}">
        <div class="mc-img-wrap"><img class="mc-img" src="${src}" alt="${r.title.rendered}" loading="lazy"><span class="mc-cat">${cat}</span></div>
        <div class="mc-card-body"><div class="mc-card-title">${r.title.rendered}</div></div>
      </a>`;
  }).join('\n');

  return `<!-- MC_RELATED_START -->
    <div class="mc-grid" style="grid-template-columns:repeat(3,1fr);">
${cards}
    </div>
<!-- MC_RELATED_END -->`;
}

export const dynamic = 'force-dynamic';

export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ slug: string }> }
) {
  const { slug } = await params;

  let html = readFileSync(
    path.join(process.cwd(), 'src/data/blog-single.html'),
    'utf-8'
  );

  try {
    const res = await fetch(
      `${WP_API}/mc_resource?slug=${encodeURIComponent(slug)}&_embed=wp:featuredmedia,wp:term&_fields=id,slug,date,modified,title,content,excerpt,featured_media,meta,_links`,
      { cache: 'no-store' }
    );

    if (!res.ok) throw new Error('fetch failed');

    const resources: WPResource[] = await res.json();
    if (resources.length === 0) {
      return serve404Response();
    }

    const resource = resources[0];

    // Must have content to have a detail page — external-only resources redirect out
    const hasContent = resource.content.rendered.replace(/<[^>]+>/g, '').trim().length > 0;
    if (!hasContent) {
      const externalUrl = resource.meta?.resource_url;
      if (externalUrl) {
        return Response.redirect(externalUrl, 301);
      }
      return Response.redirect('https://www.mahdicreates.com/resources', 301);
    }

    html = html.replace(
      /<!-- MC_POST_START -->[\s\S]*?<!-- MC_POST_END -->/,
      buildArticle(resource)
    );

    html = html.replace(
      /<title>[^<]*<\/title>/,
      `<title>${makeSeoTitle(resource.title.rendered)}</title>`
    );

    let descRaw = resource.excerpt.rendered.replace(/<[^>]+>/g, '').trim();
    if (descRaw.length < 110) {
      const contentText = resource.content.rendered.replace(/<[^>]+>/g, '').trim();
      if (contentText.length > descRaw.length) descRaw = contentText;
    }
    const desc = descRaw.slice(0, 160).replace(/"/g, '&quot;');
    const ogImg = resource._embedded?.['wp:featuredmedia']?.[0]?.source_url ?? '';
    const canonical = `https://www.mahdicreates.com/resources/${resource.slug}`;
    const ogTitle = resource.title.rendered.replace(/"/g, '&quot;');
    const terms = resource._embedded?.['wp:term']?.[0] ?? [];
    const jsonLd: Record<string, unknown> = {
      '@context': 'https://schema.org',
      '@type': 'Article',
      headline: resource.title.rendered,
      description: descRaw.slice(0, 160),
      url: canonical,
      datePublished: resource.date,
      dateModified: resource.modified || resource.date,
      author: { '@type': 'Person', '@id': 'https://www.mahdicreates.com/#person', name: 'Md Mahdi Hasan', url: 'https://www.mahdicreates.com/about' },
      publisher: { '@type': 'Organization', name: 'Mahdi Creates', url: 'https://www.mahdicreates.com', logo: { '@type': 'ImageObject', url: 'https://www.mahdicreates.com/logo.png' } },
      mainEntityOfPage: { '@type': 'WebPage', '@id': canonical },
      articleSection: terms[0]?.name ?? 'Resource',
    };
    if (ogImg) jsonLd.image = { '@type': 'ImageObject', url: ogImg };
    const breadcrumbLd = {
      '@context': 'https://schema.org',
      '@type': 'BreadcrumbList',
      itemListElement: [
        { '@type': 'ListItem', position: 1, name: 'Home', item: 'https://www.mahdicreates.com' },
        { '@type': 'ListItem', position: 2, name: 'Resources', item: 'https://www.mahdicreates.com/resources' },
        { '@type': 'ListItem', position: 3, name: resource.title.rendered, item: canonical },
      ],
    };
    html = html.replace(/<link[^>]*rel="canonical"[^>]*>/g, '');
    html = html.replace(/<meta[^>]*property="og:url"[^>]*>/g, '');
    html = html.replace('<head>', `<head>
<link rel="canonical" href="${canonical}">
<script type="application/ld+json">${JSON.stringify(jsonLd)}</script>
<script type="application/ld+json">${JSON.stringify(breadcrumbLd)}</script>`);
    html = html.replace(/<meta name="description" content="[^"]*">/g, `<meta name="description" content="${desc}">`);
    html = html.replace(/<meta property="og:title" content="[^"]*">/g, `<meta property="og:title" content="${ogTitle} | Mahdi Creates">`);
    html = html.replace(/<meta name="twitter:title" content="[^"]*">/g, `<meta name="twitter:title" content="${ogTitle} | Mahdi Creates">`);
    html = html.replace(/<meta property="og:description" content="[^"]*">/g, `<meta property="og:description" content="${desc}">`);
    html = html.replace(/<meta name="twitter:description" content="[^"]*">/g, `<meta name="twitter:description" content="${desc}">`);
    html = html.replace(/<meta property="og:url" content="[^"]*">/g, `<meta property="og:url" content="${canonical}">`);
    html = html.replace(/<meta property="og:type" content="[^"]*">/g, '<meta property="og:type" content="article">');
    if (ogImg) {
      html = html.replace(/<meta property="og:image" content="[^"]*">/g, `<meta property="og:image" content="${ogImg}">`);
      html = html.replace(/<meta name="twitter:image" content="[^"]*">/g, `<meta name="twitter:image" content="${ogImg}">`);
    }

    // Related resources
    const relRes = await fetch(
      `${WP_API}/mc_resource?per_page=3&exclude=${resource.id}&_embed=wp:featuredmedia,wp:term&_fields=id,slug,title,content,featured_media,meta,_links`,
      { cache: 'no-store' }
    );
    if (relRes.ok) {
      const related: WPResource[] = await relRes.json();
      if (related.length > 0) {
        html = html.replace(
          /<!-- MC_RELATED_START -->[\s\S]*?<!-- MC_RELATED_END -->/,
          buildRelated(related)
        );
      }
    }
  } catch {
    return serve404Response();
  }

  return new Response(applyNavFix(html, { mobileNav: true }), {
    headers: {
      'Content-Type': 'text/html; charset=utf-8',
      'Cache-Control': 'public, s-maxage=30, stale-while-revalidate=300',
    },
  });
}
