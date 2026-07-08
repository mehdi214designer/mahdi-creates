import { NextRequest } from 'next/server';
import http2 from 'http2';

export const dynamic = 'force-dynamic';

// Proxy WordPress media files from Hostinger server.
// cms.mahdicreates.com/.htaccess routes all requests through WordPress PHP,
// so static upload files 404. The files physically exist under mahdicreates.com
// document root on the same server (same IP as cms.mahdicreates.com).
// LiteSpeed routes by :authority pseudo-header (HTTP/2) / SNI, not Host.
// We use HTTP/2 and set :authority to mahdicreates.com to hit the correct vhost.
export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ path: string[] }> }
) {
  const { path } = await params;
  const filePath = path.join('/');

  if (filePath.includes('..') || !filePath.match(/^[\w.\-/]+$/)) {
    return new Response('Bad Request', { status: 400 });
  }

  return new Promise<Response>((resolve) => {
    // Connect to cms.mahdicreates.com (valid TLS cert) but override :authority
    // to mahdicreates.com so LiteSpeed routes to the correct vhost.
    const client = http2.connect('https://cms.mahdicreates.com', {
      rejectUnauthorized: true,
    });

    client.on('error', (err) => {
      resolve(new Response(`connect-error: ${err.message}`, { status: 502 }));
    });

    const req = client.request({
      ':method': 'GET',
      ':path': `/wp-content/uploads/${filePath}`,
      ':authority': 'mahdicreates.com',
      ':scheme': 'https',
      'accept': 'image/*,*/*',
      'user-agent': 'MahdiCreates-Proxy/1.0',
    });

    req.on('response', (headers) => {
      const status = headers[':status'] as number;
      if (status !== 200) {
        client.close();
        resolve(new Response(`upstream-${status}`, { status: 404 }));
        return;
      }

      const chunks: Buffer[] = [];
      req.on('data', (chunk: Buffer) => chunks.push(chunk));
      req.on('end', () => {
        client.close();
        const body = Buffer.concat(chunks);
        resolve(
          new Response(body, {
            headers: {
              'Content-Type': (headers['content-type'] as string) || 'image/webp',
              'Cache-Control': 'public, max-age=86400, stale-while-revalidate=3600',
            },
          })
        );
      });
    });

    req.on('error', (err) => {
      client.close();
      resolve(new Response(`req-error: ${err.message}`, { status: 502 }));
    });

    req.end();
  });
}
