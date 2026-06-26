import { readFileSync } from 'fs';
import path from 'path';

export const dynamic = 'force-static';

export async function GET() {
  const html = readFileSync(
    path.join(process.cwd(), 'src/data/case-studies.html'),
    'utf-8'
  );

  return new Response(html, {
    headers: {
      'Content-Type': 'text/html; charset=utf-8',
      'Cache-Control': 'public, s-maxage=3600',
    },
  });
}
