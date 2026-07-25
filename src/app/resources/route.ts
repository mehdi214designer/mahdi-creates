import { fetchFramerPage } from '@/lib/framer-fetch';
import { applyNavFix } from '@/lib/nav-fix';

const WP_API = 'https://cms.mahdicreates.com/wp-json/wp/v2';

interface WPResource {
  id: number;
  slug: string;
  title: { rendered: string };
  content: { rendered: string };
  excerpt: { rendered: string };
  featured_media: number;
  meta?: { resource_url?: string };
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
  const raw = resource.excerpt?.rendered || '';
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
    const type = getResourceType(r);
    const excerpt = getExcerpt(r);
    const hasDetailPage = (r.content?.rendered ?? '').replace(/<[^>]+>/g, '').trim().length > 0;
    const url = hasDetailPage ? `/resources/${r.slug}` : (r.meta?.resource_url || '#');
    const external = !hasDetailPage;
    const thumb = img
      ? `<img src="${img.source_url}" alt="${r.title.rendered}" loading="lazy">`
      : `<div class="mc-res-thumb-ph">🔗</div>`;

    return `    <a href="${url}" class="mc-res-card" data-type="${type}"${external ? ' target="_blank" rel="noopener"' : ''} data-mc-appear="mc-fade-up" data-mc-delay="${(i % 3) * 60}">
      <div class="mc-res-thumb">${thumb}</div>
      <div class="mc-res-body">
        <div class="mc-res-name">${r.title.rendered}</div>
        <div class="mc-res-desc">${excerpt}</div>
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
  let html = await fetchFramerPage('/resources', 'resources.html', 0);

  try {
    const [resourcesRes, introRes] = await Promise.all([
      fetch(
        `${WP_API}/mc_resource?per_page=50&_embed=wp:featuredmedia,wp:term&_fields=id,slug,title,content,excerpt,featured_media,meta,_links`,
        { cache: 'no-store' }
      ),
      fetch(
        `${WP_API}/pages?slug=resources-intro&_fields=title,excerpt`,
        { cache: 'no-store' }
      ),
    ]);

    if (resourcesRes.ok) {
      const resources: WPResource[] = await resourcesRes.json();
      html = html.replace(
        /<!-- MC_RESOURCES_GRID_START -->[\s\S]*?<!-- MC_RESOURCES_GRID_END -->/,
        buildResourcesGrid(resources)
      );
    }

    if (introRes.ok) {
      const pages = await introRes.json();
      if (pages.length > 0) {
        const page = pages[0];
        const title = page.title?.rendered?.trim();
        const desc = page.excerpt?.rendered?.replace(/<[^>]+>/g, '').trim();
        if (title) {
          html = html.replace(
            /<!-- MC_TOOLKIT_TITLE_START -->[\s\S]*?<!-- MC_TOOLKIT_TITLE_END -->/,
            `<!-- MC_TOOLKIT_TITLE_START -->${title}<!-- MC_TOOLKIT_TITLE_END -->`
          );
        }
        if (desc) {
          html = html.replace(
            /<!-- MC_TOOLKIT_DESC_START -->[\s\S]*?<!-- MC_TOOLKIT_DESC_END -->/,
            `<!-- MC_TOOLKIT_DESC_START -->${desc}<!-- MC_TOOLKIT_DESC_END -->`
          );
        }
      }
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
