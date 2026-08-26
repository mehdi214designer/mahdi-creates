import { fetchFramerPage } from '@/lib/framer-fetch';
import { applyNavFix } from '@/lib/nav-fix';

const WP_API = 'https://cms.mahdicreates.com/wp-json/wp/v2';

interface WPPost {
  id: number;
  slug: string;
  date: string;
  title: { rendered: string };
  excerpt: { rendered: string };
  featured_media: number;
  _embedded?: {
    'wp:featuredmedia'?: Array<{ source_url: string; alt_text: string }>;
  };
}

function formatDate(dateStr: string): string {
  return new Date(dateStr).toLocaleDateString('en-US', {
    month: 'long',
    day: 'numeric',
    year: 'numeric',
  });
}

function stripTags(html: string): string {
  return html.replace(/<[^>]+>/g, '').replace(/&hellip;/g, '…').replace(/&nbsp;/g, ' ').trim();
}

function buildPlaceholderImg(title: string): string {
  const t = encodeURIComponent(title.toUpperCase().slice(0, 16));
  return `data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='600' height='450'%3E%3Crect width='600' height='450' fill='%230d0500'/%3E%3Ctext x='300' y='235' font-family='sans-serif' font-size='11' fill='rgba(255%2C255%2C255%2C0.22)' text-anchor='middle' letter-spacing='4'%3E${t}%3C/text%3E%3C/svg%3E`;
}

function proxyUrl(url: string): string {
  // cms.mahdicreates.com/wp-content is directly accessible — use URLs as-is
  return url;
}

function buildGrid(posts: WPPost[]): string {
  const delays = [0, 60, 120, 0, 60, 120];
  const cards = posts.map((post, i) => {
    const img = post._embedded?.['wp:featuredmedia']?.[0];
    const src = proxyUrl(img?.source_url ?? buildPlaceholderImg(post.title.rendered));
    const alt = img?.alt_text || post.title.rendered;
    const delay = delays[i % delays.length];
    return `    <a href="/blog/${post.slug}" class="mc-card" data-mc-appear="mc-fade-up" data-mc-delay="${delay}">
      <div class="mc-img-wrap"><img class="mc-img" src="${src}" alt="${alt}" loading="lazy"></div>
      <div class="mc-card-date">${formatDate(post.date)}</div>
      <div class="mc-card-title">${post.title.rendered}</div>
    </a>`;
  }).join('\n');

  const intro = `<div style="max-width:720px;margin:0 auto 48px;text-align:center;padding:0 24px">
    <p style="font-size:17px;line-height:1.75;color:rgba(255,255,255,0.5)">Articles on visual hierarchy, UX history, copywriting, design systems, and the real craft behind great digital products — written for designers and builders who think deeply.</p>
  </div>`;

  return `<!-- MC_BLOG_GRID_START -->\n${intro}\n  <div class="mc-grid">\n${cards}\n  </div>\n<!-- MC_BLOG_GRID_END -->`;
}

export const dynamic = 'force-dynamic';

export async function GET() {
  let html = await fetchFramerPage('/blog', 'blog.html', 0);

  // Fix OG/meta data bleed from Framer's portfolio page template
  html = html.replace(/<title>[^<]*<\/title>/, '<title>Blog — Mahdi Creates | UI/UX Design Writing</title>');
  html = html.replace(
    /<meta name="description" content="[^"]*">/g,
    '<meta name="description" content="Articles on UI/UX design, product thinking, and creative process by Md Mahdi Hasan. Practical insights for designers and builders.">'
  );
  html = html.replace(
    /<meta property="og:title" content="[^"]*">/g,
    '<meta property="og:title" content="Blog — Mahdi Creates | UI/UX Design Writing">'
  );
  html = html.replace(
    /<meta property="og:description" content="[^"]*">/g,
    '<meta property="og:description" content="Articles on UI/UX design, product thinking, and creative process by Md Mahdi Hasan.">'
  );
  html = html.replace(/<meta property="og:type" content="[^"]*">/g, '<meta property="og:type" content="website">');
  html = html.replace(/<meta name="twitter:title" content="[^"]*">/g, '<meta name="twitter:title" content="Blog — Mahdi Creates | UI/UX Design Writing">');
  html = html.replace(/<meta name="twitter:description" content="[^"]*">/g, '<meta name="twitter:description" content="Articles on UI/UX design, product thinking, and creative process by Md Mahdi Hasan.">');

  try {
    const res = await fetch(
      `${WP_API}/posts?per_page=12&_embed=wp:featuredmedia&_fields=id,slug,date,title,excerpt,featured_media,_links`,
      { cache: 'no-store' }
    );

    if (res.ok) {
      const posts: WPPost[] = await res.json();
      if (posts.length > 0) {
        html = html.replace(
          /<!-- MC_BLOG_GRID_START -->[\s\S]*?<!-- MC_BLOG_GRID_END -->/,
          buildGrid(posts)
        );
      }
    }
  } catch {
    // serve static fallback on fetch error
  }

  return new Response(applyNavFix(html, { mobileNav: true, canonical: 'https://www.mahdicreates.com/blog' }), {
    headers: {
      'Content-Type': 'text/html; charset=utf-8',
      'Cache-Control': 'public, s-maxage=30, stale-while-revalidate=300',
    },
  });
}
