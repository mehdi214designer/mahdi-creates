import { NextRequest } from 'next/server';
import https from 'https';

export const dynamic = 'force-dynamic';

// Proxy WordPress media files from Hostinger server.
// cms.mahdicreates.com/.htaccess routes all requests through WordPress PHP,
// so static upload files 404. The files physically exist under mahdicreates.com
// document root on the Hostinger server, accessible by connecting to
// cms.mahdicreates.com (same IP) but sending Host: mahdicreates.com to use
// the correct vhost which has proper static file handling.
export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ path: string[] }> }
) {
  const { path } = await params;
  const filePath = path.join('/');

  // Reject path traversal attempts
  if (filePath.includes('..') || !filePath.match(/^[\w.\-/]+$/)) {
    return new Response('Bad Request', { status: 400 });
  }

  return new Promise<Response>((resolve) => {
    const options: https.RequestOptions = {
      hostname: 'cms.mahdicreates.com',
      port: 443,
      path: `/wp-content/uploads/${filePath}`,
      method: 'GET',
      headers: {
        // Use mahdicreates.com vhost which has proper static file handling
        Host: 'mahdicreates.com',
        Accept: 'image/*,*/*',
        'User-Agent': 'MahdiCreates-Proxy/1.0',
      },
    };

    const proxyReq = https.request(options, (res) => {
      if (res.statusCode !== 200) {
        resolve(new Response(`upstream-${res.statusCode}`, { status: 404 }));
        return;
      }

      const chunks: Buffer[] = [];
      res.on('data', (chunk: Buffer) => chunks.push(chunk));
      res.on('end', () => {
        const body = Buffer.concat(chunks);
        resolve(
          new Response(body, {
            headers: {
              'Content-Type': res.headers['content-type'] || 'image/webp',
              'Cache-Control': 'public, max-age=86400, stale-while-revalidate=3600',
            },
          })
        );
      });
    });

    proxyReq.on('error', (err) => {
      console.error('[media-proxy] error:', err.message);
      resolve(new Response(`proxy-error: ${err.message}`, { status: 502 }));
    });
    proxyReq.end();
  });
}
