import { readFileSync } from 'fs';
import path from 'path';

const WP_API = 'https://cms.mahdicreates.com/wp-json/wp/v2';

interface WPPost {
  id: number;
  slug: string;
  title: { rendered: string };
  excerpt: { rendered: string };
  featured_media: number;
  _embedded?: {
    'wp:featuredmedia'?: Array<{ source_url: string; alt_text: string }>;
    'wp:term'?: Array<Array<{ name: string; slug: string }>>;
  };
}

function stripTags(html: string): string {
  return html.replace(/<[^>]+>/g, '').replace(/&hellip;/g, '…').replace(/&nbsp;/g, ' ').trim();
}

function buildPlaceholder(title: string): string {
  const label = encodeURIComponent(title.toUpperCase().slice(0, 20));
  return `data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='800' height='450'%3E%3Crect width='800' height='450' fill='%230d0500'/%3E%3Ctext x='400' y='235' font-family='sans-serif' font-size='11' fill='rgba(255%2C255%2C255%2C0.2)' text-anchor='middle' letter-spacing='4'%3E${label}%3C/text%3E%3C/svg%3E`;
}

function buildGrid(posts: WPPost[]): string {
  const delays = [0, 80, 0, 80, 0, 80];
  const cards = posts.map((post, i) => {
    const img = post._embedded?.['wp:featuredmedia']?.[0];
    const cats = post._embedded?.['wp:term']?.[0] ?? [];
    const category = cats[0]?.name ?? 'Case Study';
    const excerpt = stripTags(post.excerpt.rendered).slice(0, 140);
    const delay = delays[i % delays.length];

    const imgSrc = img?.source_url
      ?.replace(/https?:\/\/cms\.mahdicreates\.com\/wp-content\//g, '/api/media/')
      .replace(/https?:\/\/mahdicreates\.com\/wp-content\//g, '/api/media/');
    const imageHtml = imgSrc
      ? `<div class="mc-cs-img-wrap"><img class="mc-cs-img" src="${imgSrc}" alt="${img?.alt_text || post.title.rendered}" loading="lazy"></div>`
      : `<div class="mc-cs-placeholder" style="background:linear-gradient(135deg,#0d0500,#1a0a00)"><span style="font-size:11px;letter-spacing:.1em;color:rgba(255,255,255,.2);font-family:sans-serif;text-transform:uppercase">${category}</span></div>`;

    return `    <a href="/case-studies/${post.slug}" class="mc-cs-card" data-mc-appear="mc-fade-up" data-mc-delay="${delay}">
      ${imageHtml}
      <div class="mc-cs-body">
        <div class="mc-cs-cat">${category}</div>
        <div class="mc-cs-title">${post.title.rendered}</div>
        <div class="mc-cs-excerpt">${excerpt}</div>
      </div>
    </a>`;
  }).join('\n');

  return `<!-- MC_CASE_STUDIES_GRID_START -->
  <div class="mc-cs-grid">
${cards}
  </div>
<!-- MC_CASE_STUDIES_GRID_END -->`;
}

export const dynamic = 'force-dynamic';
export const revalidate = 300;

export async function GET() {
  let html = readFileSync(
    path.join(process.cwd(), 'src/data/case-studies.html'),
    'utf-8'
  );

  try {
    const res = await fetch(
      `${WP_API}/case_study?per_page=12&_embed=wp:featuredmedia,wp:term&_fields=id,slug,title,excerpt,featured_media,_links`,
      { next: { revalidate: 300 } }
    );

    if (res.ok) {
      const posts: WPPost[] = await res.json();
      if (posts.length > 0) {
        html = html.replace(
          /<!-- MC_CASE_STUDIES_GRID_START -->[\s\S]*?<!-- MC_CASE_STUDIES_GRID_END -->/,
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
