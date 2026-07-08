import { readFileSync } from 'fs';
import path from 'path';

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
  return url
    .replace(/https?:\/\/cms\.mahdicreates\.com\/wp-content\//g, '/api/media/')
    .replace(/https?:\/\/mahdicreates\.com\/wp-content\//g, '/api/media/');
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

  return `<!-- MC_BLOG_GRID_START -->\n  <div class="mc-grid">\n${cards}\n  </div>\n<!-- MC_BLOG_GRID_END -->`;
}

export const dynamic = 'force-dynamic';
export const revalidate = 300; // 5 min cache

export async function GET() {
  let html = readFileSync(
    path.join(process.cwd(), 'src/data/blog.html'),
    'utf-8'
  );

  try {
    const res = await fetch(
      `${WP_API}/posts?per_page=12&_embed=wp:featuredmedia&_fields=id,slug,date,title,excerpt,featured_media,_links`,
      { next: { revalidate: 300 } }
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

  return new Response(html, {
    headers: {
      'Content-Type': 'text/html; charset=utf-8',
      'Cache-Control': 'public, s-maxage=300, stale-while-revalidate=60',
    },
  });
}
