import { revalidatePath } from 'next/cache';
import { NextRequest } from 'next/server';

const SECRET = process.env.REVALIDATE_SECRET ?? 'mc-revalidate-2026';

const ALL_PATHS = ['/', '/about', '/blog', '/projects', '/case-studies', '/resources'];

function doRevalidate() {
  for (const p of ALL_PATHS) revalidatePath(p);
  return ALL_PATHS;
}

// POST: called by Framer publish webhook or manual triggers
export async function POST(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  // Accept secret via query param or x-revalidate-secret header
  const secret = searchParams.get('secret') ?? req.headers.get('x-revalidate-secret');
  if (secret !== SECRET) {
    return Response.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const paths = doRevalidate();
  return Response.json({ revalidated: true, paths, ts: Date.now() });
}

// GET: convenient for manual browser use
export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  if (searchParams.get('secret') !== SECRET) {
    return Response.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const paths = doRevalidate();
  return Response.json({ revalidated: true, paths, ts: Date.now() });
}
