import { readFileSync } from 'fs';
import path from 'path';
import { applyNavFix } from '@/lib/nav-fix';

const WP_API = 'https://cms.mahdicreates.com/wp-json/wp/v2';

interface WPResource {
  id: number;
  slug: string;
  title: { rendered: string };
  content: { rendered: string };
  excerpt: { rendered: string };
  featured_media: number;
  _embedded?: {
    'wp:featuredmedia'?: Array<{ source_url: string; alt_text: string }>;
    'wp:term'?: Array<Array<{ name: string; slug: string }>>;
  };
}

function getResourceType(resource: WPResource): string {
  const terms = resource._embedded?.['wp:term']?.[0] ?? [];
  const slug = terms[0]?.slug ?? 'website';
  if (slug === 'product') return 'product';
  if (slug === 'file') return 'file';
  return 'website';
}

function getExcerpt(resource: WPResource): string {
  const raw = resource.excerpt?.rendered || resource.content?.rendered || '';
  return raw.replace(/<[^>]+>/g, '').replace(/&hellip;/g, '…').trim().slice(0, 120);
}

function buildResourcesGrid(resources: WPResource[]): string {
  if (resources.length === 0) {
    return `<!-- MC_RESOURCES_GRID_START -->
  <div class="mc-res-grid" id="mc-res-grid">
    <div class="mc-empty">No resources yet — check back soon.</div>
  </div>
<!-- MC_RESOURCES_GRID_END -->`;
  }

  // Build filter buttons from unique types
  const types = [...new Set(resources.map(getResourceType))];
  const filterBtns = [
    `<button class="mc-res-filter active" data-filter="all">All</button>`,
    ...types.map(t => `<button class="mc-res-filter" data-filter="${t}">${t.charAt(0).toUpperCase() + t.slice(1)}s</button>`),
  ].join('\n    ');

  const cards = resources.map((r, i) => {
    const img = r._embedded?.['wp:featuredmedia']?.[0];
    const icon = img
      ? `<img src="${img.source_url}" alt="${r.title.rendered}" style="width:100%;height:100%;object-fit:cover;border-radius:10px;">`
      : '🔗';
    const type = getResourceType(r);
    const excerpt = getExcerpt(r);
    const url = r.content?.rendered?.match(/href="([^"]+)"/)?.[1] ?? '#';

    return `    <a href="${url}" class="mc-res-card" data-type="${type}" target="_blank" rel="noopener" data-mc-appear="mc-fade-up" data-mc-delay="${(i % 3) * 60}">
      <div class="mc-res-icon">${icon}</div>
      <div class="mc-res-name">${r.title.rendered}</div>
      <div class="mc-res-desc">${excerpt}</div>
      <div style="display:flex;align-items:center;justify-content:space-between;margin-top:auto">
        <span class="mc-res-tag">${type}</span>
        <span class="mc-res-link">Visit →</span>
      </div>
    </a>`;
  }).join('\n');

  const filterScript = `<script>
(function(){
  var btns=document.querySelectorAll('.mc-res-filter');
  var cards=document.querySelectorAll('.mc-res-card');
  btns.forEach(function(btn){
    btn.addEventListener('click',function(){
      btns.forEach(function(b){b.classList.remove('active')});
      btn.classList.add('active');
      var f=btn.dataset.filter;
      cards.forEach(function(c){
        c.style.display=(f==='all'||c.dataset.type===f)?'flex':'none';
      });
    });
  });
})();
</script>`;

  return `<!-- MC_RESOURCES_GRID_START -->
  <div class="mc-res-filters">
    ${filterBtns}
  </div>
  <div class="mc-res-grid" id="mc-res-grid">
${cards}
  </div>
  ${filterScript}
<!-- MC_RESOURCES_GRID_END -->`;
}

export const dynamic = 'force-dynamic';

export async function GET() {
  let html = readFileSync(
    path.join(process.cwd(), 'src/data/resources.html'),
    'utf-8'
  );

  try {
    const res = await fetch(
      `${WP_API}/mc_resource?per_page=50&_embed=wp:featuredmedia,wp:term&_fields=id,slug,title,content,excerpt,featured_media,_links`,
      { cache: 'no-store' }
    );

    if (res.ok) {
      const resources: WPResource[] = await res.json();
      html = html.replace(
        /<!-- MC_RESOURCES_GRID_START -->[\s\S]*?<!-- MC_RESOURCES_GRID_END -->/,
        buildResourcesGrid(resources)
      );
    }
  } catch {
    // serve static fallback
  }

  return new Response(applyNavFix(html), {
    headers: {
      'Content-Type': 'text/html; charset=utf-8',
      'Cache-Control': 'public, s-maxage=30, stale-while-revalidate=300',
    },
  });
}
