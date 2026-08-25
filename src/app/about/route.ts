import { fetchFramerPage } from '@/lib/framer-fetch';
import { applyNavFix } from '@/lib/nav-fix';

export const revalidate = 60;

export async function GET() {
  let raw = await fetchFramerPage('/about', 'about.html');
  // Inject semantic H1 — Framer renders headings as CSS-styled divs, not H1 tags
  raw = raw.replace(/<body([^>]*)>/, (_m, attrs) =>
    `<body${attrs}><h1 style="position:absolute;width:1px;height:1px;overflow:hidden;clip:rect(0,0,0,0);white-space:nowrap;border:0;">Md Mahdi Hasan — UI/UX Designer &amp; Creative Problem Solver</h1>`
  );

  return new Response(applyNavFix(raw, { canonical: 'https://www.mahdicreates.com/about' }), {
    headers: {
      'Content-Type': 'text/html; charset=utf-8',
      'Cache-Control': 'public, s-maxage=60, stale-while-revalidate=300',
    },
  });
}
