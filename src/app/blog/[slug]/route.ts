import { readFileSync } from 'fs';
import path from 'path';
import { NextRequest } from 'next/server';
import { applyNavFix, serve404Response } from '@/lib/nav-fix';
import { buildArticleFooter } from '@/lib/subscribe-box';

const WP_API = 'https://cms.mahdicreates.com/wp-json/wp/v2';

interface WPComment {
  id: number;
  date: string;
  author_name: string;
  author_avatar_urls: Record<string, string>;
  content: { rendered: string };
}

interface WPPost {
  id: number;
  slug: string;
  date: string;
  modified: string;
  title: { rendered: string };
  content: { rendered: string };
  excerpt: { rendered: string };
  featured_media: number;
  _embedded?: {
    'wp:featuredmedia'?: Array<{ source_url: string; alt_text: string }>;
    'wp:term'?: Array<Array<{ name: string; slug: string }>>;
  };
}

function formatDate(dateStr: string): string {
  return new Date(dateStr).toLocaleDateString('en-US', {
    month: 'long',
    day: 'numeric',
    year: 'numeric',
  });
}

function readTime(content: string): string {
  const words = content.replace(/<[^>]+>/g, '').split(/\s+/).length;
  return `${Math.max(1, Math.round(words / 200))} min read`;
}

function buildPlaceholderImg(title: string): string {
  const t = encodeURIComponent(title.toUpperCase().slice(0, 16));
  return `data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='800' height='500'%3E%3Crect width='800' height='500' fill='%231a0800'/%3E%3Ctext x='400' y='270' font-family='sans-serif' font-size='38' font-weight='700' fill='rgba(255%2C255%2C255%2C0.12)' text-anchor='middle'%3E${t}%3C/text%3E%3C/svg%3E`;
}

function rewriteWpUrls(html: string): string {
  return html
    .replace(/https?:\/\/cms\.mahdicreates\.com\/wp-content\//g, '/api/media/')
    .replace(/https?:\/\/mahdicreates\.com\/wp-content\//g, '/api/media/');
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
.mc-author-bar{display:flex;align-items:center;gap:12px;padding:20px 0;border-top:1px solid rgba(255,255,255,.07);border-bottom:1px solid rgba(255,255,255,.07);margin-bottom:40px}
.mc-author-avi{width:40px;height:40px;border-radius:50%;object-fit:cover;flex-shrink:0;display:block}
.mc-author-nm{font-size:14px;font-weight:600;color:rgba(255,255,255,.85)}
.mc-author-sb{font-size:12px;color:rgba(255,255,255,.35)}
.mc-toc{max-width:800px;margin:0 auto 36px;background:rgba(255,255,255,.03);border:1px solid rgba(255,255,255,.07);border-radius:14px;padding:20px 24px}
.mc-toc-title{font-size:11px;font-weight:700;text-transform:uppercase;letter-spacing:.1em;color:rgba(255,255,255,.3);margin-bottom:10px}
.mc-toc-list{margin:0;padding:0;list-style:none;display:flex;flex-direction:column;gap:4px}
.mc-toc-item a{font-size:14px;color:rgba(255,255,255,.55);text-decoration:none;line-height:1.5;display:block;transition:color .2s;padding:2px 0}
.mc-toc-item a:hover{color:#ff6522}
.mc-toc-h3 a{padding-left:16px;font-size:13px;color:rgba(255,255,255,.4)}
.mc-share-row{display:flex;align-items:center;gap:8px;flex-wrap:wrap;padding-top:28px;border-top:1px solid rgba(255,255,255,.07);margin:40px auto 0;max-width:800px}
.mc-share-lbl{font-size:13px;font-weight:600;color:rgba(255,255,255,.4);margin-right:4px}
.mc-share-btn{display:inline-flex;align-items:center;gap:5px;padding:7px 14px;border-radius:100px;border:1px solid rgba(255,255,255,.12);background:transparent;color:rgba(255,255,255,.55);text-decoration:none;cursor:pointer;transition:border-color .2s,color .2s;line-height:1;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Helvetica,Arial,sans-serif;font-size:13px;font-weight:500}
button.mc-share-btn{font:500 13px/1 -apple-system,BlinkMacSystemFont,'Segoe UI',Helvetica,Arial,sans-serif}
.mc-share-btn:hover{border-color:rgba(255,255,255,.35);color:#fff}
.mc-a-body img{max-width:100%;height:auto;border-radius:10px}
.mc-a-body figure{margin:32px 0}
.mc-a-body figure img{width:100%;border-radius:12px}
.mc-a-body figcaption{text-align:center;font-size:12px;color:rgba(255,255,255,.35);margin-top:8px}
.mc-a-body .wp-block-image{margin:32px 0}
.mc-a-body .wp-block-image img{width:100%;border-radius:12px}
.mc-a-body .wp-block-buttons{margin:28px 0}
.mc-a-body .wp-block-button__link{display:inline-flex;align-items:center;padding:10px 24px;border-radius:100px;background:#ff6522;color:#fff;font-weight:600;font-size:14px;text-decoration:none;transition:opacity .2s}
.mc-a-body .wp-block-button__link:hover{opacity:.85}
.mc-a-body .wp-block-separator{border:none;border-top:1px solid rgba(255,255,255,.08);margin:40px 0}
.mc-promo-block{background:rgba(255,255,255,.04);border:1px solid rgba(255,255,255,.08);border-radius:20px;padding:32px;margin:40px 0;overflow:hidden}
</style>`;

const COMMENT_CSS = `<style>
.mc-comments-section{max-width:800px;margin:48px auto 0;padding-top:40px;border-top:1px solid rgba(255,255,255,.07)}
.mc-comments-title{font-size:18px;font-weight:700;color:rgba(255,255,255,.85);margin:0 0 28px}
.mc-comment{display:flex;gap:14px;margin-bottom:24px;padding-bottom:24px;border-bottom:1px solid rgba(255,255,255,.05)}
.mc-comment:last-of-type{border-bottom:none;margin-bottom:0;padding-bottom:0}
.mc-comment-avi{width:40px;height:40px;border-radius:50%;flex-shrink:0;object-fit:cover}
.mc-comment-name{font-size:14px;font-weight:600;color:rgba(255,255,255,.85);margin-right:10px}
.mc-comment-date{font-size:12px;color:rgba(255,255,255,.3)}
.mc-comment-text{font-size:14px;line-height:1.7;color:rgba(255,255,255,.55);margin-top:6px}
.mc-comment-text p{margin:0}
.mc-no-comments{font-size:14px;color:rgba(255,255,255,.3);margin-bottom:8px}
.mc-comment-form{margin-top:36px;padding-top:32px;border-top:1px solid rgba(255,255,255,.07)}
.mc-comment-form h4{font-size:16px;font-weight:700;color:rgba(255,255,255,.85);margin:0 0 18px}
.mc-form-row{display:grid;grid-template-columns:1fr 1fr;gap:12px;margin-bottom:12px}
@media(max-width:600px){.mc-form-row{grid-template-columns:1fr}}
.mc-form-input,.mc-form-textarea{width:100%;background:rgba(255,255,255,.04);border:1px solid rgba(255,255,255,.1);border-radius:10px;padding:12px 16px;color:rgba(255,255,255,.85);font-size:14px;font-family:inherit;outline:none;transition:border-color .2s;box-sizing:border-box}
.mc-form-input:focus,.mc-form-textarea:focus{border-color:rgba(255,101,34,.5)}
.mc-form-input::placeholder,.mc-form-textarea::placeholder{color:rgba(255,255,255,.25)}
.mc-form-textarea{resize:vertical;min-height:120px;margin-bottom:12px}
.mc-form-submit{background:#ff6522;color:#fff;border:none;border-radius:100px;padding:12px 28px;font-size:14px;font-weight:600;cursor:pointer;transition:opacity .2s;font-family:inherit}
.mc-form-submit:hover{opacity:.85}
.mc-form-submit:disabled{opacity:.5;cursor:not-allowed}
.mc-form-note{font-size:12px;color:rgba(255,255,255,.25);margin-top:10px;margin-bottom:0}
.mc-form-msg{margin-top:12px;font-size:13px;padding:10px 14px;border-radius:8px;display:none}
.mc-form-msg.success{display:block;background:rgba(34,197,94,.1);color:#4ade80;border:1px solid rgba(34,197,94,.2)}
.mc-form-msg.error{display:block;background:rgba(239,68,68,.1);color:#f87171;border:1px solid rgba(239,68,68,.2)}
</style>`;

function buildCommentSection(comments: WPComment[], postId: number): string {
  const list = comments.length === 0
    ? `<p class="mc-no-comments">No comments yet — be the first to share your thoughts!</p>`
    : comments.map(c => {
        const avatar = c.author_avatar_urls['48'] || c.author_avatar_urls['96'] || '';
        return `<div class="mc-comment">
  <img class="mc-comment-avi" src="${avatar}" alt="${c.author_name}" loading="lazy">
  <div>
    <div><span class="mc-comment-name">${c.author_name}</span><span class="mc-comment-date">${formatDate(c.date)}</span></div>
    <div class="mc-comment-text">${c.content.rendered}</div>
  </div>
</div>`;
      }).join('');

  return `${COMMENT_CSS}
<section class="mc-comments-section">
  <h3 class="mc-comments-title">${comments.length} Comment${comments.length !== 1 ? 's' : ''}</h3>
  ${list}
  <form class="mc-comment-form" id="mc-comment-form" data-post-id="${postId}">
    <h4>Leave a Comment</h4>
    <div class="mc-form-row">
      <input class="mc-form-input" type="text" name="author_name" placeholder="Your name *" required maxlength="100">
      <input class="mc-form-input" type="email" name="author_email" placeholder="Email * (not published)" required>
    </div>
    <textarea class="mc-form-textarea" name="content" placeholder="Write your comment..." required rows="5" maxlength="5000"></textarea>
    <input type="text" name="website" style="display:none" tabindex="-1" autocomplete="off">
    <button class="mc-form-submit" type="submit">Post Comment</button>
    <p class="mc-form-note">Your email won't be published. Comments are moderated.</p>
    <div class="mc-form-msg" id="mc-form-msg"></div>
  </form>
</section>
<script>(function(){
  var form=document.getElementById('mc-comment-form');
  if(!form)return;
  form.addEventListener('submit',async function(e){
    e.preventDefault();
    var btn=form.querySelector('.mc-form-submit');
    var msg=document.getElementById('mc-form-msg');
    btn.disabled=true;btn.textContent='Posting...';
    msg.className='mc-form-msg';msg.textContent='';
    try{
      var res=await fetch('/api/comments',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({post_id:parseInt(form.dataset.postId),author_name:form.author_name.value.trim(),author_email:form.author_email.value.trim(),content:form.content.value.trim(),website:form.website.value})});
      var r=await res.json();
      if(res.ok&&r.success){msg.className='mc-form-msg success';msg.textContent=r.status==='hold'?'Thanks! Your comment is awaiting moderation.':'Comment posted!';form.reset();}
      else{throw new Error(r.error||'Failed to post comment.');}
    }catch(err){msg.className='mc-form-msg error';msg.textContent=err.message||'Something went wrong. Please try again.';}
    finally{btn.disabled=false;btn.textContent='Post Comment';}
  });
})();</script>`;
}

function buildShareRow(encUrl: string, encTitle: string): string {
  return `<div class="mc-share-row">
  <span class="mc-share-lbl">Share:</span>
  <a class="mc-share-btn" href="https://twitter.com/intent/tweet?url=${encUrl}&text=${encTitle}" target="_blank" rel="noopener noreferrer">${X_SVG}Twitter</a>
  <a class="mc-share-btn" href="https://www.linkedin.com/sharing/share-offsite/?url=${encUrl}" target="_blank" rel="noopener noreferrer">${LI_SVG}LinkedIn</a>
  <button class="mc-share-btn" id="mc-copy-btn">Copy Link</button>
</div>
<script>(function(){var b=document.getElementById('mc-copy-btn');if(b)b.onclick=function(){navigator.clipboard.writeText(location.href).then(function(){b.textContent='Copied!';setTimeout(function(){b.textContent='Copy Link';},2000)});};})();</script>`;
}

function buildTOC(content: string): { toc: string; modifiedContent: string } {
  const seen = new Map<string, number>();
  const headings: Array<{ level: string; text: string; id: string }> = [];

  const modifiedContent = content.replace(
    /<h([23])([^>]*)>([\s\S]*?)<\/h[23]>/gi,
    (_m: string, level: string, attrs: string, inner: string) => {
      const text = inner.replace(/<[^>]+>/g, '').trim();
      if (!text) return _m;
      const base = text.toLowerCase().replace(/[^\w\s-]/g, '').trim().replace(/\s+/g, '-').replace(/-+/g, '-').slice(0, 60) || 'h';
      const n = (seen.get(base) ?? 0) + 1;
      seen.set(base, n);
      const id = n > 1 ? `${base}-${n}` : base;
      headings.push({ level, text, id });
      if (/\bid=/.test(attrs)) return _m;
      return `<h${level}${attrs} id="${id}">${inner}</h${level}>`;
    }
  );

  if (headings.length < 2) return { toc: '', modifiedContent };

  const items = headings.map(h =>
    `<li class="mc-toc-item mc-toc-h${h.level}"><a href="#${h.id}">${h.text}</a></li>`
  ).join('');

  return {
    toc: `<nav class="mc-toc"><div class="mc-toc-title">Contents</div><ol class="mc-toc-list">${items}</ol></nav>`,
    modifiedContent,
  };
}

function buildArticle(post: WPPost): string {
  const img = post._embedded?.['wp:featuredmedia']?.[0];
  const coverSrc = rewriteWpUrls(img?.source_url ?? buildPlaceholderImg(post.title.rendered));
  const coverAlt = img?.alt_text || post.title.rendered;
  const cats = post._embedded?.['wp:term']?.[0] ?? [];
  const category = cats[0]?.name ?? 'Design';
  const rawContent = rewriteWpUrls(post.content.rendered);
  const excerpt = post.excerpt.rendered.replace(/<[^>]+>/g, '').replace(/\[…\]|\[&hellip;\]/g, '').trim().slice(0, 280);
  const { toc, modifiedContent } = buildTOC(rawContent);
  const encUrl = encodeURIComponent(`https://mahdicreates.com/blog/${post.slug}`);
  const encTitle = encodeURIComponent(post.title.rendered);

  return `<!-- MC_POST_START -->
${ARTICLE_CSS}
<article>
  <a class="mc-back-link" href="/blog">${BACK_SVG}Back to Blog</a>
  <header class="mc-article-header">
    <div class="mc-a-meta-row">
      <span class="mc-a-cat-pill">${category}</span>
      <span class="mc-meta-sep">·</span>
      <span class="mc-meta-text">${formatDate(post.date)}</span>
      <span class="mc-meta-sep">·</span>
      <span class="mc-meta-text">${readTime(post.content.rendered)}</span>
    </div>
    <h1 class="mc-a-title">${post.title.rendered}</h1>
    ${excerpt ? `<p class="mc-a-lead">${excerpt}</p>` : ''}
    <div class="mc-author-bar">
      <img class="mc-author-avi" src="https://secure.gravatar.com/avatar/74b3cff15ccab2eafc5e0648238ad38be70977662de9220e914a8c098f332bf0?s=80&d=mp&r=g" alt="Md Mahdi Hasan">
      <div><div class="mc-author-nm">Md Mahdi Hasan</div><div class="mc-author-sb">UI/UX Designer</div></div>
    </div>
  </header>
  <img class="mc-a-cover" src="${coverSrc}" alt="${coverAlt}" loading="lazy">
  ${toc}
  <div class="mc-a-body">${modifiedContent}</div>
  ${buildShareRow(encUrl, encTitle)}
  ${buildArticleFooter()}
</article>
<!-- MC_POST_END -->`;
}

function buildRelated(posts: WPPost[]): string {
  const cards = posts.slice(0, 3).map((p, i) => {
    const img = p._embedded?.['wp:featuredmedia']?.[0];
    const src = rewriteWpUrls(img?.source_url ?? buildPlaceholderImg(p.title.rendered));
    const cats = p._embedded?.['wp:term']?.[0] ?? [];
    const cat = cats[0]?.name ?? 'Design';
    return `      <a href="/blog/${p.slug}" class="mc-card" data-mc-appear="mc-fade-up" data-mc-delay="${i * 80}">
        <div class="mc-img-wrap"><img class="mc-img" src="${src}" alt="${p.title.rendered}" loading="lazy"><span class="mc-cat">${cat}</span></div>
        <div class="mc-card-body"><div class="mc-card-title">${p.title.rendered}</div><div class="mc-card-meta"><span>${formatDate(p.date)}</span><span class="mc-dot"></span><span>${readTime(p.content?.rendered ?? '')}</span></div></div>
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
      `${WP_API}/posts?slug=${encodeURIComponent(slug)}&_embed=wp:featuredmedia,wp:term&_fields=id,slug,date,modified,title,content,excerpt,featured_media,_links`,
      { cache: 'no-store' }
    );

    if (!res.ok) throw new Error('fetch failed');

    const posts: WPPost[] = await res.json();
    if (posts.length === 0) {
      return serve404Response();
    }

    const post = posts[0];

    // Inject article
    html = html.replace(
      /<!-- MC_POST_START -->[\s\S]*?<!-- MC_POST_END -->/,
      buildArticle(post)
    );

    // Update page title and meta
    html = html.replace(
      /<title>[^<]*<\/title>/,
      `<title>${post.title.rendered} | Mahdi Creates</title>`
    );

    // Inject per-post SEO meta (injected first so scrapers prefer these over stale template values)
    const desc = post.excerpt.rendered.replace(/<[^>]+>/g, '').trim().slice(0, 160).replace(/"/g, '&quot;');
    const ogImg = post._embedded?.['wp:featuredmedia']?.[0]?.source_url ?? '';
    const canonical = `https://mahdicreates.com/blog/${post.slug}`;
    const ogTitle = post.title.rendered.replace(/"/g, '&quot;');
    const jsonLd: Record<string, unknown> = {
      '@context': 'https://schema.org',
      '@type': 'BlogPosting',
      headline: post.title.rendered,
      description: post.excerpt.rendered.replace(/<[^>]+>/g, '').trim().slice(0, 160),
      url: canonical,
      datePublished: post.date,
      dateModified: post.modified || post.date,
      author: { '@type': 'Person', name: 'Md Mahdi Hasan', url: 'https://mahdicreates.com/about' },
      publisher: { '@type': 'Organization', name: 'Mahdi Creates', url: 'https://mahdicreates.com' },
      mainEntityOfPage: { '@type': 'WebPage', '@id': canonical },
    };
    if (ogImg) jsonLd.image = { '@type': 'ImageObject', url: ogImg };
    html = html.replace('<head>', `<head>
<link rel="canonical" href="${canonical}">
<meta name="description" content="${desc}">
<meta property="og:title" content="${ogTitle} | Mahdi Creates">
<meta property="og:description" content="${desc}">
<meta property="og:url" content="${canonical}">
<meta property="og:type" content="article">${ogImg ? `\n<meta property="og:image" content="${ogImg}">` : ''}
<script type="application/ld+json">${JSON.stringify(jsonLd)}</script>`);

    // Replace hardcoded template og:image / twitter:image with the post's featured image
    if (ogImg) {
      html = html.replace(
        /<meta property="og:image" content="(?!https:\/\/cms\.mahdicreates)[^"]*">/g,
        `<meta property="og:image" content="${ogImg}">`
      );
      html = html.replace(
        /<meta name="twitter:image" content="[^"]*">/g,
        `<meta name="twitter:image" content="${ogImg}">`
      );
    }

    // Fetch related posts and comments in parallel
    const [relRes, commentsRes] = await Promise.all([
      fetch(
        `${WP_API}/posts?per_page=3&exclude=${post.id}&_embed=wp:featuredmedia,wp:term&_fields=id,slug,date,title,content,featured_media,_links`,
        { cache: 'no-store' }
      ),
      fetch(
        `${WP_API}/comments?post=${post.id}&per_page=100&order=asc&status=approved&_fields=id,date,author_name,author_avatar_urls,content`,
        { cache: 'no-store' }
      ),
    ]);

    const [related, comments]: [WPPost[], WPComment[]] = await Promise.all([
      relRes.ok ? relRes.json() : Promise.resolve([]),
      commentsRes.ok ? commentsRes.json() : Promise.resolve([]),
    ]);

    // Inject comment section after article
    html = html.replace('<!-- MC_POST_END -->', `<!-- MC_POST_END -->\n${buildCommentSection(comments, post.id)}`);

    if (related.length > 0) {
      html = html.replace(
        /<!-- MC_RELATED_START -->[\s\S]*?<!-- MC_RELATED_END -->/,
        buildRelated(related)
      );
    }
  } catch (e) {
    console.error('[blog/slug] error:', e);
    return serve404Response();
  }

  return new Response(applyNavFix(html), {
    headers: {
      'Content-Type': 'text/html; charset=utf-8',
      'Cache-Control': 'public, s-maxage=300, stale-while-revalidate=60',
    },
  });
}
