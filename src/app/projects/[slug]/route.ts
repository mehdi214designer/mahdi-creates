import { readFileSync } from 'fs';
import path from 'path';
import { NextRequest } from 'next/server';
import { applyNavFix } from '@/lib/nav-fix';

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
  return html;
}

function buildArticle(post: WPPost): string {
  const img = post._embedded?.['wp:featuredmedia']?.[0];
  const coverSrc = rewriteWpUrls(img?.source_url ?? buildPlaceholderImg(post.title.rendered));
  const coverAlt = img?.alt_text || post.title.rendered;
  const cats = post._embedded?.['wp:term']?.[0] ?? [];
  const category = cats[0]?.name ?? 'Project';
  const content = rewriteWpUrls(post.content.rendered);

  return `<!-- MC_POST_START -->
  <article>
    <header class="mc-article-header">
      <div class="mc-a-cat" data-mc-appear="mc-fade-in" data-mc-delay="0">${category}</div>
      <h1 class="mc-a-title" data-mc-appear="mc-fade-up" data-mc-delay="80">${post.title.rendered}</h1>
      <div class="mc-a-meta" data-mc-appear="mc-fade-in" data-mc-delay="160">
        <span>Md Mahdi Hasan</span><span class="mc-dot" style="background:rgba(255,255,255,.28)"></span>
        <span>${formatDate(post.date)}</span><span class="mc-dot" style="background:rgba(255,255,255,.28)"></span>
        <span>${readTime(post.content.rendered)}</span>
      </div>
    </header>
    <img class="mc-a-cover" src="${coverSrc}" alt="${coverAlt}" data-mc-appear="mc-fade-up" data-mc-delay="0">
    <div class="mc-a-body">
      ${content}
    </div>
  </article>
<!-- MC_POST_END -->`;
}

function buildRelated(posts: WPPost[]): string {
  const cards = posts.slice(0, 3).map((p, i) => {
    const img = p._embedded?.['wp:featuredmedia']?.[0];
    const src = rewriteWpUrls(img?.source_url ?? buildPlaceholderImg(p.title.rendered));
    const cats = p._embedded?.['wp:term']?.[0] ?? [];
    const cat = cats[0]?.name ?? 'Project';
    return `      <a href="/projects/${p.slug}" class="mc-card" data-mc-appear="mc-fade-up" data-mc-delay="${i * 80}">
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
      `${WP_API}/portfolio?slug=${encodeURIComponent(slug)}&_embed=wp:featuredmedia,wp:term&_fields=id,slug,date,modified,title,content,excerpt,featured_media,_links`,
      { cache: 'no-store' }
    );

    if (!res.ok) throw new Error('fetch failed');

    const posts: WPPost[] = await res.json();
    if (posts.length === 0) {
      // No WP post found — let Next.js fall through to static sub-routes
      return new Response('Not Found', { status: 404 });
    }

    const post = posts[0];

    html = html.replace(
      /<!-- MC_POST_START -->[\s\S]*?<!-- MC_POST_END -->/,
      buildArticle(post)
    );

    html = html.replace(
      /<title>[^<]*<\/title>/,
      `<title>${makeSeoTitle(post.title.rendered)}</title>`
    );

    let descRaw = post.excerpt.rendered.replace(/<[^>]+>/g, '').trim();
    if (descRaw.length < 80) {
      const contentText = post.content.rendered.replace(/<[^>]+>/g, '').trim();
      if (contentText.length > descRaw.length) descRaw = contentText;
    }
    const desc = descRaw.slice(0, 160).replace(/"/g, '&quot;');
    const ogImg = post._embedded?.['wp:featuredmedia']?.[0]?.source_url ?? '';
    const canonical = `https://www.mahdicreates.com/projects/${post.slug}`;
    const ogTitle = post.title.rendered.replace(/"/g, '&quot;');
    const cats = post._embedded?.['wp:term']?.[0] ?? [];
    const jsonLd: Record<string, unknown> = {
      '@context': 'https://schema.org',
      '@type': 'Article',
      headline: post.title.rendered,
      description: descRaw.slice(0, 160),
      url: canonical,
      datePublished: post.date,
      dateModified: post.modified || post.date,
      author: { '@type': 'Person', '@id': 'https://www.mahdicreates.com/#person', name: 'Md Mahdi Hasan', url: 'https://www.mahdicreates.com/about' },
      publisher: { '@type': 'Organization', name: 'Mahdi Creates', url: 'https://www.mahdicreates.com', logo: { '@type': 'ImageObject', url: 'https://www.mahdicreates.com/logo.png' } },
      mainEntityOfPage: { '@type': 'WebPage', '@id': canonical },
      articleSection: cats[0]?.name ?? 'Design',
    };
    if (ogImg) jsonLd.image = { '@type': 'ImageObject', url: ogImg };
    const breadcrumbLd = {
      '@context': 'https://schema.org',
      '@type': 'BreadcrumbList',
      itemListElement: [
        { '@type': 'ListItem', position: 1, name: 'Home', item: 'https://www.mahdicreates.com' },
        { '@type': 'ListItem', position: 2, name: 'Projects', item: 'https://www.mahdicreates.com/projects' },
        { '@type': 'ListItem', position: 3, name: post.title.rendered, item: canonical },
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

    const relRes = await fetch(
      `${WP_API}/portfolio?per_page=3&exclude=${post.id}&_embed=wp:featuredmedia,wp:term&_fields=id,slug,date,title,content,featured_media,_links`,
      { cache: 'no-store' }
    );
    if (relRes.ok) {
      const related: WPPost[] = await relRes.json();
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
