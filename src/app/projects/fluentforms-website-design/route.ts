import { readFileSync } from 'fs';
import path from 'path';
import { applyNavFix } from '@/lib/nav-fix';

export const dynamic = 'force-static';

export async function GET() {
  const html = readFileSync(
    path.join(process.cwd(), 'src/data/project-fluentforms.html'),
    'utf-8'
  );

  return new Response(applyNavFix(html, { canonical: 'https://www.mahdicreates.com/projects/fluentforms-website-design' }), {
    headers: {
      'Content-Type': 'text/html; charset=utf-8',
      'Cache-Control': 'no-cache, no-store, must-revalidate',
    },
  });
}
