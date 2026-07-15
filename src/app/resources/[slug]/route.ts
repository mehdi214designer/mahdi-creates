import { readFileSync } from 'fs';
import path from 'path';
import { NextRequest } from 'next/server';
import { applyNavFix } from '@/lib/nav-fix';

const WP_API = 'https://cms.mahdicreates.com/wp-json/wp/v2';

interface WPResource {
  id: number;
  slug: string;
  date: string;
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
  return html
    .replace(/https?:\/\/cms\.mahdicreates\.com\/wp-content\//g, '/api/media/')
    .replace(/https?:\/\/mahdicreates\.com\/wp-content\//g, '/api/media/');
}

function buildPlaceholderImg(title: string): string {
  const t = encodeURIComponent(title.toUpperCase().slice(0, 16));
  return `data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='800' height='500'%3E%3Crect width='800' height='500' fill='%231a0800'/%3E%3Ctext x='400' y='270' font-family='sans-serif' font-size='38' font-weight='700' fill='rgba(255%2C255%2C255%2C0.12)' text-anchor='middle'%3E${t}%3C/text%3E%3C/svg%3E`;
}

function buildArticle(resource: WPResource): string {
  const img = resource._embedded?.['wp:featuredmedia']?.[0];
  const coverSrc = rewriteWpUrls(img?.source_url ?? buildPlaceholderImg(resource.title.rendered));
  const coverAlt = img?.alt_text || resource.title.rendered;
  const terms = resource._embedded?.['wp:term']?.[0] ?? [];
  const category = terms[0]?.name ?? 'Resource';
  const content = rewriteWpUrls(resource.content.rendered);
  const externalUrl = resource.meta?.resource_url;
  const ctaUrl      = resource.meta?.resource_cta_url;
  const ctaLabel    = resource.meta?.resource_cta_label;

  const visitBtn = externalUrl
    ? `<a href="${externalUrl}" class="mc-res-btn mc-res-btn--ghost" target="_blank" rel="noopener">Visit Site →</a>`
    : '';
  const ctaBtn = ctaUrl && ctaLabel
    ? `<a href="${ctaUrl}" class="mc-res-btn mc-res-btn--primary" target="_blank" rel="noopener">${ctaLabel}</a>`
    : '';
  const btnRow = visitBtn || ctaBtn
    ? `<div class="mc-res-btn-row" data-mc-appear="mc-fade-in" data-mc-delay="140">${ctaBtn}${visitBtn}</div>`
    : '';

  return `<!-- MC_POST_START -->
  <article>
    <header class="mc-article-header">
      <div class="mc-a-cat" data-mc-appear="mc-fade-in" data-mc-delay="0">${category}</div>
      <h1 class="mc-a-title" data-mc-appear="mc-fade-up" data-mc-delay="80">${resource.title.rendered}</h1>
      ${btnRow}
    </header>
    <img class="mc-a-cover" src="${coverSrc}" alt="${coverAlt}" data-mc-appear="mc-fade-up" data-mc-delay="0">
    <div class="mc-a-body">
      ${content}
    </div>
  </article>
<style>
.mc-res-btn-row{display:flex;flex-wrap:wrap;gap:10px;margin-top:12px}
.mc-res-btn{
  display:inline-flex;align-items:center;gap:6px;
  padding:10px 24px;border-radius:100px;
  font-size:14px;font-weight:600;text-decoration:none;transition:opacity .2s,background .2s;
}
.mc-res-btn--primary{background:#ff6522;color:#fff}
.mc-res-btn--primary:hover{opacity:.85}
.mc-res-btn--ghost{background:transparent;color:rgba(255,255,255,.7);border:1px solid rgba(255,255,255,.2)}
.mc-res-btn--ghost:hover{border-color:rgba(255,255,255,.5);color:#fff}
</style>
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
      `${WP_API}/mc_resource?slug=${encodeURIComponent(slug)}&_embed=wp:featuredmedia,wp:term&_fields=id,slug,date,title,content,excerpt,featured_media,meta,_links`,
      { cache: 'no-store' }
    );

    if (!res.ok) throw new Error('fetch failed');

    const resources: WPResource[] = await res.json();
    if (resources.length === 0) {
      return new Response('Not Found', { status: 404 });
    }

    const resource = resources[0];

    // Must have content to have a detail page
    const hasContent = resource.content.rendered.replace(/<[^>]+>/g, '').trim().length > 0;
    if (!hasContent) {
      return new Response('Not Found', { status: 404 });
    }

    html = html.replace(
      /<!-- MC_POST_START -->[\s\S]*?<!-- MC_POST_END -->/,
      buildArticle(resource)
    );

    html = html.replace(
      /<title>[^<]*<\/title>/,
      `<title>${resource.title.rendered} | Mahdi Creates</title>`
    );

    const desc = resource.excerpt.rendered.replace(/<[^>]+>/g, '').trim().slice(0, 160).replace(/"/g, '&quot;');
    const ogImg = resource._embedded?.['wp:featuredmedia']?.[0]?.source_url ?? '';
    const canonical = `https://mahdicreates.com/resources/${resource.slug}`;
    const ogTitle = resource.title.rendered.replace(/"/g, '&quot;');
    html = html.replace('<head>', `<head>
<link rel="canonical" href="${canonical}">
<meta name="description" content="${desc}">
<meta property="og:title" content="${ogTitle} | Mahdi Creates">
<meta property="og:description" content="${desc}">
<meta property="og:url" content="${canonical}">
<meta property="og:type" content="article">${ogImg ? `\n<meta property="og:image" content="${ogImg}">` : ''}`);

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
    return new Response('Not Found', { status: 404 });
  }

  return new Response(applyNavFix(html), {
    headers: {
      'Content-Type': 'text/html; charset=utf-8',
      'Cache-Control': 'public, s-maxage=300, stale-while-revalidate=60',
    },
  });
}
