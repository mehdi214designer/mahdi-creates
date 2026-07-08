import { NextRequest } from 'next/server';
import https from 'https';

export const dynamic = 'force-dynamic';

// Proxy WordPress media files from Hostinger server.
// cms.mahdicreates.com/.htaccess routes all requests through WordPress PHP,
// so static upload files 404. The files physically exist under mahdicreates.com
// document root on the Hostinger server (82.29.189.188), accessible with
// Host: mahdicreates.com. This proxy bridges the gap until the server .htaccess
// is repaired.
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
      hostname: '82.29.189.188',
      port: 443,
      path: `/wp-content/uploads/${filePath}`,
      method: 'GET',
      headers: {
        Host: 'mahdicreates.com',
        Accept: 'image/*,*/*',
        'User-Agent': 'MahdiCreates-Proxy/1.0',
      },
      // cert is issued for the domain name, not this IP
      rejectUnauthorized: false,
    };

    const proxyReq = https.request(options, (res) => {
      if (res.statusCode !== 200) {
        resolve(new Response('Not Found', { status: 404 }));
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

    proxyReq.on('error', () => resolve(new Response('Not Found', { status: 404 })));
    proxyReq.end();
  });
}
