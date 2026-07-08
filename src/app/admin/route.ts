import { NextRequest } from 'next/server';

const WP_API = 'https://cms.mahdicreates.com/wp-json/wp/v2';
const WP_ADMIN = 'https://cms.mahdicreates.com/wp-admin';
const SITE = 'https://www.mahdicreates.com';
const SECRET = process.env.REVALIDATE_SECRET ?? 'mc-revalidate-2026';

export const dynamic = 'force-dynamic';

interface WPItem {
  id: number;
  slug: string;
  title: { rendered: string };
  status: string;
  date: string;
  link?: string;
}

async function fetchItems(endpoint: string): Promise<WPItem[]> {
  try {
    const r = await fetch(`${WP_API}/${endpoint}?per_page=50&_fields=id,slug,title,status,date,link`, {
      cache: 'no-store',
    });
    return r.ok ? r.json() : [];
  } catch {
    return [];
  }
}

function formatDate(d: string) {
  return new Date(d).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
}

function statusBadge(s: string) {
  const color = s === 'publish' ? '#22c55e' : s === 'draft' ? '#f59e0b' : '#6b7280';
  return `<span style="display:inline-block;padding:2px 10px;border-radius:20px;font-size:11px;font-weight:600;background:${color}22;color:${color};letter-spacing:.05em;text-transform:uppercase">${s}</span>`;
}

function contentRow(item: WPItem, editBase: string, viewBase: string) {
  return `<tr>
    <td style="padding:14px 16px;border-bottom:1px solid rgba(255,255,255,.06)">
      <div style="font-weight:600;color:#fff;font-size:14px">${item.title.rendered || '(no title)'}</div>
      <div style="color:rgba(255,255,255,.4);font-size:12px;margin-top:3px">${item.slug}</div>
    </td>
    <td style="padding:14px 16px;border-bottom:1px solid rgba(255,255,255,.06)">${statusBadge(item.status)}</td>
    <td style="padding:14px 16px;border-bottom:1px solid rgba(255,255,255,.06);color:rgba(255,255,255,.45);font-size:13px">${formatDate(item.date)}</td>
    <td style="padding:14px 16px;border-bottom:1px solid rgba(255,255,255,.06)">
      <div style="display:flex;gap:8px">
        <a href="${WP_ADMIN}/post.php?post=${item.id}&action=edit" target="_blank" rel="noopener" style="padding:5px 14px;border-radius:8px;background:rgba(255,255,255,.08);color:rgba(255,255,255,.7);font-size:12px;font-weight:500;text-decoration:none">Edit</a>
        ${item.status === 'publish' ? `<a href="${viewBase}/${item.slug}" target="_blank" rel="noopener" style="padding:5px 14px;border-radius:8px;background:rgba(255,101,34,.15);color:#ff6522;font-size:12px;font-weight:500;text-decoration:none">View</a>` : ''}
      </div>
    </td>
  </tr>`;
}

function section(title: string, icon: string, items: WPItem[], newUrl: string, editBase: string, viewBase: string) {
  const published = items.filter(i => i.status === 'publish').length;
  const drafts = items.filter(i => i.status === 'draft').length;

  return `<div style="margin-bottom:48px">
    <div style="display:flex;align-items:center;justify-content:space-between;margin-bottom:20px">
      <div style="display:flex;align-items:center;gap:12px">
        <span style="font-size:24px">${icon}</span>
        <div>
          <h2 style="font-size:18px;font-weight:700;color:#fff;margin:0">${title}</h2>
          <div style="font-size:13px;color:rgba(255,255,255,.4);margin-top:2px">${published} published · ${drafts} drafts</div>
        </div>
      </div>
      <a href="${newUrl}" target="_blank" rel="noopener" style="display:inline-flex;align-items:center;gap:6px;padding:8px 18px;border-radius:10px;background:#ff6522;color:#fff;font-size:13px;font-weight:600;text-decoration:none">
        <svg width="14" height="14" fill="none" stroke="currentColor" stroke-width="2.5" viewBox="0 0 24 24"><path d="M12 5v14M5 12h14"/></svg>
        New ${title.replace(/s$/, '')}
      </a>
    </div>
    ${items.length === 0 ? `<div style="padding:32px;text-align:center;border-radius:12px;border:1px dashed rgba(255,255,255,.12);color:rgba(255,255,255,.35);font-size:14px">No ${title.toLowerCase()} yet. <a href="${newUrl}" target="_blank" style="color:#ff6522;text-decoration:none">Create the first one →</a></div>` : `
    <div style="border-radius:12px;border:1px solid rgba(255,255,255,.08);overflow:hidden">
      <table style="width:100%;border-collapse:collapse">
        <thead>
          <tr style="background:rgba(255,255,255,.04)">
            <th style="padding:10px 16px;text-align:left;font-size:11px;font-weight:600;color:rgba(255,255,255,.4);letter-spacing:.08em;text-transform:uppercase;border-bottom:1px solid rgba(255,255,255,.08)">Title</th>
            <th style="padding:10px 16px;text-align:left;font-size:11px;font-weight:600;color:rgba(255,255,255,.4);letter-spacing:.08em;text-transform:uppercase;border-bottom:1px solid rgba(255,255,255,.08)">Status</th>
            <th style="padding:10px 16px;text-align:left;font-size:11px;font-weight:600;color:rgba(255,255,255,.4);letter-spacing:.08em;text-transform:uppercase;border-bottom:1px solid rgba(255,255,255,.08)">Date</th>
            <th style="padding:10px 16px;text-align:left;font-size:11px;font-weight:600;color:rgba(255,255,255,.4);letter-spacing:.08em;text-transform:uppercase;border-bottom:1px solid rgba(255,255,255,.08)">Actions</th>
          </tr>
        </thead>
        <tbody>${items.map(i => contentRow(i, editBase, viewBase)).join('')}</tbody>
      </table>
    </div>`}
  </div>`;
}

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const key = searchParams.get('key') ?? searchParams.get('secret');

  // Require key param to view admin
  if (key !== SECRET) {
    return new Response(
      `<!DOCTYPE html><html><head><title>Admin Login</title><meta charset="UTF-8">
<style>*{box-sizing:border-box;margin:0}body{background:#0d0d0d;color:#fff;font-family:sans-serif;display:flex;align-items:center;justify-content:center;min-height:100vh}
.box{background:#161616;border:1px solid rgba(255,255,255,.08);border-radius:16px;padding:40px;text-align:center;max-width:400px;width:100%;margin:24px}
h2{font-size:22px;font-weight:700;margin-bottom:8px}p{color:rgba(255,255,255,.5);font-size:14px;margin-bottom:24px}
input{width:100%;padding:12px 16px;border-radius:10px;border:1px solid rgba(255,255,255,.12);background:#0d0d0d;color:#fff;font-size:14px;margin-bottom:12px}
button{width:100%;padding:12px;border-radius:10px;border:none;background:#ff6522;color:#fff;font-size:14px;font-weight:600;cursor:pointer}
.logo{font-size:28px;font-weight:800;color:#ff6522;margin-bottom:24px}
</style></head><body>
<div class="box">
  <div class="logo">MC</div>
  <h2>Content Manager</h2>
  <p>Enter your admin key to access the dashboard</p>
  <form onsubmit="event.preventDefault();location.href='/admin?key='+document.getElementById('k').value">
    <input id="k" type="password" placeholder="Admin key" autofocus>
    <button type="submit">Enter Dashboard</button>
  </form>
</div></body></html>`,
      { headers: { 'Content-Type': 'text/html; charset=utf-8' }, status: 401 }
    );
  }

  // Fetch all content in parallel
  const [blogs, projects, caseStudies, resources] = await Promise.all([
    fetchItems('posts'),
    fetchItems('portfolio'),
    fetchItems('case_study'),
    fetchItems('mc_resource'),
  ]);

  const totalPublished = [blogs, projects, caseStudies, resources]
    .flat().filter(i => i.status === 'publish').length;

  const html = `<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width, initial-scale=1.0">
<title>Content Manager — Mahdi Creates</title>
<style>
*{box-sizing:border-box;margin:0;padding:0}
body{background:#0d0d0d;color:#fff;font-family:-apple-system,BlinkMacSystemFont,"Segoe UI",sans-serif;min-height:100vh}
a{color:inherit;text-decoration:none}
</style>
</head>
<body>

<!-- TOP NAV -->
<nav style="position:sticky;top:0;z-index:100;background:rgba(13,13,13,.9);backdrop-filter:blur(12px);border-bottom:1px solid rgba(255,255,255,.08);padding:0 32px;display:flex;align-items:center;justify-content:space-between;height:60px">
  <div style="display:flex;align-items:center;gap:16px">
    <div style="width:36px;height:36px;border-radius:8px;background:#ff6522;display:flex;align-items:center;justify-content:center;font-weight:800;font-size:14px;color:#fff">MC</div>
    <div>
      <div style="font-weight:700;font-size:15px">Content Manager</div>
      <div style="font-size:11px;color:rgba(255,255,255,.4)">Mahdi Creates</div>
    </div>
  </div>
  <div style="display:flex;align-items:center;gap:12px">
    <button onclick="refreshCache()" style="padding:8px 16px;border-radius:10px;border:1px solid rgba(255,255,255,.12);background:transparent;color:rgba(255,255,255,.7);font-size:13px;font-weight:500;cursor:pointer;display:flex;align-items:center;gap:6px">
      <svg width="14" height="14" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24"><path d="M23 4v6h-6M1 20v-6h6M3.51 9a9 9 0 0 1 14.85-3.36L23 10M1 14l4.64 4.36A9 9 0 0 0 20.49 15"/></svg>
      Refresh Cache
    </button>
    <a href="${SITE}" target="_blank" style="padding:8px 16px;border-radius:10px;border:none;background:#ff6522;color:#fff;font-size:13px;font-weight:600">View Site →</a>
  </div>
</nav>

<!-- STATS BAR -->
<div style="border-bottom:1px solid rgba(255,255,255,.06);padding:24px 32px;display:grid;grid-template-columns:repeat(5,1fr);gap:16px">
  ${[
    { label: 'Total Published', val: totalPublished, icon: '✓' },
    { label: 'Blog Posts', val: blogs.filter(i=>i.status==='publish').length, sub: `${blogs.length} total`, icon: '📝' },
    { label: 'Projects', val: projects.filter(i=>i.status==='publish').length, sub: `${projects.length} total`, icon: '🎨' },
    { label: 'Case Studies', val: caseStudies.filter(i=>i.status==='publish').length, sub: `${caseStudies.length} total`, icon: '📊' },
    { label: 'Resources', val: resources.filter(i=>i.status==='publish').length, sub: `${resources.length} total`, icon: '🔗' },
  ].map(s => `<div style="padding:20px;border-radius:12px;background:rgba(255,255,255,.04);border:1px solid rgba(255,255,255,.06)">
    <div style="font-size:11px;color:rgba(255,255,255,.4);font-weight:600;letter-spacing:.06em;text-transform:uppercase;margin-bottom:8px">${s.icon} ${s.label}</div>
    <div style="font-size:28px;font-weight:800;color:#fff;line-height:1">${s.val}</div>
    ${s.sub ? `<div style="font-size:12px;color:rgba(255,255,255,.3);margin-top:4px">${s.sub}</div>` : ''}
  </div>`).join('')}
</div>

<!-- MAIN CONTENT -->
<main style="max-width:1200px;margin:0 auto;padding:40px 32px">

  <!-- QUICK GUIDE -->
  <div style="margin-bottom:40px;padding:24px;border-radius:12px;background:rgba(255,101,34,.06);border:1px solid rgba(255,101,34,.2)">
    <h3 style="font-size:14px;font-weight:700;color:#ff6522;margin-bottom:12px">📋 Publishing Workflow</h3>
    <div style="display:grid;grid-template-columns:repeat(4,1fr);gap:16px">
      ${['1. Click "New …" button below to open WordPress editor',
         '2. Write your content, add images, set categories',
         '3. Click "Publish" in WordPress editor',
         '4. Your content appears on the site within 30 seconds'].map(s=>`<div style="font-size:13px;color:rgba(255,255,255,.6);padding:12px;border-radius:8px;background:rgba(255,255,255,.04)">${s}</div>`).join('')}
    </div>
    <div style="margin-top:16px;font-size:12px;color:rgba(255,255,255,.35)">
      💡 WordPress editor is at <a href="${WP_ADMIN}" target="_blank" style="color:#ff6522">${WP_ADMIN}</a> ·
      Need to clear cache immediately? Click <strong>Refresh Cache</strong> in the top bar.
    </div>
  </div>

  ${section('Blog Posts', '📝', blogs, `${WP_ADMIN}/post-new.php`, `${WP_ADMIN}`, `${SITE}/blog`)}
  ${section('Projects', '🎨', projects, `${WP_ADMIN}/post-new.php?post_type=portfolio`, `${WP_ADMIN}`, `${SITE}/projects`)}
  ${section('Case Studies', '📊', caseStudies, `${WP_ADMIN}/post-new.php?post_type=case_study`, `${WP_ADMIN}`, `${SITE}/case-studies`)}
  ${section('Resources', '🔗', resources, `${WP_ADMIN}/post-new.php?post_type=mc_resource`, `${WP_ADMIN}`, `${SITE}/resources`)}

  <!-- WORDPRESS ADMIN LINKS -->
  <div style="margin-top:40px;padding:24px;border-radius:12px;border:1px solid rgba(255,255,255,.08)">
    <h3 style="font-size:14px;font-weight:700;color:rgba(255,255,255,.6);margin-bottom:16px;text-transform:uppercase;letter-spacing:.08em">WordPress Admin Shortcuts</h3>
    <div style="display:flex;flex-wrap:wrap;gap:10px">
      ${[
        { label: 'Dashboard', url: WP_ADMIN },
        { label: 'All Posts', url: `${WP_ADMIN}/edit.php` },
        { label: 'All Projects', url: `${WP_ADMIN}/edit.php?post_type=portfolio` },
        { label: 'All Case Studies', url: `${WP_ADMIN}/edit.php?post_type=case_study` },
        { label: 'All Resources', url: `${WP_ADMIN}/edit.php?post_type=mc_resource` },
        { label: 'Media Library', url: `${WP_ADMIN}/upload.php` },
        { label: 'Categories', url: `${WP_ADMIN}/edit-tags.php?taxonomy=category` },
        { label: 'Settings', url: `${WP_ADMIN}/options-general.php` },
      ].map(l=>`<a href="${l.url}" target="_blank" style="padding:8px 14px;border-radius:8px;background:rgba(255,255,255,.06);border:1px solid rgba(255,255,255,.08);color:rgba(255,255,255,.65);font-size:13px;font-weight:500;transition:background .15s" onmouseover="this.style.background='rgba(255,255,255,.1)'" onmouseout="this.style.background='rgba(255,255,255,.06)'">${l.label}</a>`).join('')}
    </div>
  </div>

</main>

<div id="toast" style="display:none;position:fixed;bottom:24px;right:24px;padding:14px 20px;border-radius:12px;background:#22c55e;color:#fff;font-size:14px;font-weight:600;z-index:999;box-shadow:0 8px 32px rgba(0,0,0,.4)"></div>

<script>
async function refreshCache() {
  try {
    const r = await fetch('/api/revalidate?secret=${SECRET}');
    const d = await r.json();
    showToast(d.revalidated ? '✓ Cache cleared — site is now up to date' : '✗ Failed to clear cache');
  } catch(e) {
    showToast('✗ Error: ' + e.message);
  }
}
function showToast(msg) {
  const t = document.getElementById('toast');
  t.textContent = msg;
  t.style.display = 'block';
  setTimeout(() => t.style.display = 'none', 3500);
}
</script>
</body>
</html>`;

  return new Response(html, {
    headers: {
      'Content-Type': 'text/html; charset=utf-8',
      'Cache-Control': 'no-store',
      'X-Robots-Tag': 'noindex',
    },
  });
}
