import { NextRequest } from 'next/server';
import { serve404Response } from '@/lib/nav-fix';

const WP_API = 'https://cms.mahdicreates.com/wp-json/wp/v2';

export const dynamic = 'force-dynamic';

export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ slug: string[] }> }
) {
  const { slug } = await params;

  // Only attempt WP lookup for single-segment root paths (e.g. /hello-world)
  if (slug.length === 1) {
    try {
      const res = await fetch(
        `${WP_API}/posts?slug=${encodeURIComponent(slug[0])}&_fields=slug`,
        { cache: 'no-store' }
      );
      if (res.ok) {
        const posts: Array<{ slug: string }> = await res.json();
        if (posts.length > 0) {
          return Response.redirect(
            `https://www.mahdicreates.com/blog/${posts[0].slug}`,
            301
          );
        }
      }
    } catch {
      // WP API unreachable — fall through to 404
    }
  }

  return serve404Response();
}
