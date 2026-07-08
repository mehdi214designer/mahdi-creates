import { readFileSync } from 'fs';
import path from 'path';
import { applyNavFix } from '@/lib/nav-fix';

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

function buildSection(posts: WPPost[]): string {
  const cards = posts.map((post) => {
    const img = post._embedded?.['wp:featuredmedia']?.[0];
    const cats = post._embedded?.['wp:term']?.[0] ?? [];
    const excerpt = stripTags(post.excerpt.rendered).slice(0, 200);

    const imgSrc = img?.source_url
      ?.replace(/https?:\/\/cms\.mahdicreates\.com\/wp-content\//g, '/api/media/')
      .replace(/https?:\/\/mahdicreates\.com\/wp-content\//g, '/api/media/');

    const imageHtml = imgSrc
      ? `<img class="mc-ph-img" src="${imgSrc}" alt="${img?.alt_text || post.title.rendered}" loading="lazy">`
      : `<div class="mc-ph-img-placeholder"><span>${post.title.rendered.slice(0, 2).toUpperCase()}</span></div>`;

    const tagsHtml = cats.length
      ? cats.map(c => `<span>${c.name}</span>`).join('<span class="mc-ph-divider">·</span>')
      : '<span>Project</span>';

    return `<a href="/projects/${post.slug}" class="mc-ph-card">
      <div class="mc-ph-img-wrap">${imageHtml}</div>
      <div class="mc-ph-info">
        <h3 class="mc-ph-title">${post.title.rendered}</h3>
        <p class="mc-ph-desc">${excerpt}</p>
        <div class="mc-ph-tags">${tagsHtml}</div>
      </div>
    </a>`;
  }).join('\n');

  return `<!-- MC_PROJECTS_SECTION_START -->
<style>
.mc-ph-section{width:100%;padding:80px 0 120px;background:transparent}
.mc-ph-header{max-width:1200px;margin:0 auto 60px;padding:0 40px}
.mc-ph-header-label{font-size:11px;font-weight:600;letter-spacing:.12em;text-transform:uppercase;color:#ff6522;margin-bottom:16px}
.mc-ph-header h2{font-size:clamp(32px,4vw,52px);font-weight:700;color:#fff;line-height:1.1;letter-spacing:-.02em;margin-bottom:16px}
.mc-ph-header p{font-size:16px;color:rgba(255,255,255,.5);max-width:480px}
.mc-ph-cards{max-width:1200px;margin:0 auto;padding:0 40px;display:flex;flex-direction:column;gap:0}
.mc-ph-card{display:grid;grid-template-columns:1fr 380px;gap:0;text-decoration:none;border-top:1px solid rgba(255,255,255,.08);padding:48px 0;transition:opacity .2s}
.mc-ph-card:last-child{border-bottom:1px solid rgba(255,255,255,.08)}
.mc-ph-card:hover{opacity:.85}
.mc-ph-img-wrap{border-radius:16px;overflow:hidden;background:#111;aspect-ratio:16/9;display:flex;align-items:center;justify-content:center}
.mc-ph-img{width:100%;height:100%;object-fit:cover;display:block}
.mc-ph-img-placeholder{width:100%;aspect-ratio:16/9;background:linear-gradient(135deg,#1a0a00,#2a1200);display:flex;align-items:center;justify-content:center;border-radius:16px}
.mc-ph-img-placeholder span{font-size:48px;font-weight:800;color:rgba(255,255,255,.08);font-family:sans-serif}
.mc-ph-info{padding:0 0 0 48px;display:flex;flex-direction:column;justify-content:center}
.mc-ph-title{font-size:clamp(24px,3vw,38px);font-weight:700;color:#fff;line-height:1.15;letter-spacing:-.02em;margin-bottom:20px}
.mc-ph-desc{font-size:15px;line-height:1.65;color:rgba(255,255,255,.5);margin-bottom:28px;flex:1}
.mc-ph-tags{display:flex;flex-wrap:wrap;gap:8px;align-items:center;font-size:13px;color:rgba(255,255,255,.35)}
.mc-ph-divider{margin:0 4px;color:rgba(255,255,255,.2)}
@media(max-width:900px){.mc-ph-card{grid-template-columns:1fr}.mc-ph-info{padding:24px 0 0}}
</style>
<div id="mc-projects-wp" class="mc-ph-section">
  <div class="mc-ph-header">
    <div class="mc-ph-header-label">Portfolio</div>
    <h2>Projects Highlight</h2>
    <p>A glimpse into some of my favorite projects — where design meets functionality, and every pixel serves a purpose.</p>
  </div>
  <div class="mc-ph-cards">
${cards}
  </div>
</div>
<script>
(function(){
  var done = false;
  var obs;
  function inject(){
    if(done) return;
    var mc = document.getElementById('mc-projects-wp');
    var target = document.querySelector('.framer-eg45ct');
    if(!mc || !target) return;
    target.style.setProperty('display','none','important');
    var parent = target.parentElement;
    if(parent){
      parent.insertBefore(mc, target);
      done = true;
      if(obs) obs.disconnect();
    }
  }
  inject();
  setTimeout(inject, 200);
  setTimeout(inject, 600);
  setTimeout(inject, 1200);
  obs = new MutationObserver(inject);
  obs.observe(document.body, {childList:true, subtree:true});
  window.addEventListener('load', inject);
})();
</script>
<!-- MC_PROJECTS_SECTION_END -->`;
}

export const dynamic = 'force-dynamic';
export const revalidate = 300;

export async function GET() {
  let html = readFileSync(
    path.join(process.cwd(), 'src/data/projects.html'),
    'utf-8'
  );

  try {
    const res = await fetch(
      `${WP_API}/portfolio?per_page=12&_embed=wp:featuredmedia,wp:term&_fields=id,slug,title,excerpt,featured_media,_links`,
      { cache: 'no-store' }
    );

    if (res.ok) {
      const posts: WPPost[] = await res.json();
      if (posts.length > 0) {
        html = html.replace(
          /<!-- MC_PROJECTS_SECTION_START -->[\s\S]*?<!-- MC_PROJECTS_SECTION_END -->/,
          buildSection(posts)
        );
      }
    }
  } catch {
    // serve static fallback on fetch error
  }

  return new Response(applyNavFix(html), {
    headers: {
      'Content-Type': 'text/html; charset=utf-8',
      'Cache-Control': 'public, s-maxage=300, stale-while-revalidate=60',
    },
  });
}
