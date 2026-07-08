import { revalidatePath } from 'next/cache';
import { NextRequest } from 'next/server';

const SECRET = process.env.REVALIDATE_SECRET ?? 'mc-revalidate-2026';

export async function POST(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  if (searchParams.get('secret') !== SECRET) {
    return Response.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const paths = ['/blog', '/projects', '/case-studies', '/resources'];
  for (const p of paths) revalidatePath(p);

  return Response.json({ revalidated: true, paths, ts: Date.now() });
}

// Also allow GET for manual browser use
export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  if (searchParams.get('secret') !== SECRET) {
    return Response.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const paths = ['/blog', '/projects', '/case-studies', '/resources'];
  for (const p of paths) revalidatePath(p);

  return Response.json({ revalidated: true, paths, ts: Date.now() });
}
