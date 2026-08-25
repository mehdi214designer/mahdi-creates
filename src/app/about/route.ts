import { fetchFramerPage } from '@/lib/framer-fetch';
import { applyNavFix } from '@/lib/nav-fix';

export const revalidate = 60;

export async function GET() {
  const raw = await fetchFramerPage('/about', 'about.html');

  return new Response(applyNavFix(raw, { canonical: 'https://www.mahdicreates.com/about' }), {
    headers: {
      'Content-Type': 'text/html; charset=utf-8',
      'Cache-Control': 'public, s-maxage=60, stale-while-revalidate=300',
    },
  });
}
