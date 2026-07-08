import { NextRequest } from 'next/server';
import http2 from 'http2';
import tls from 'tls';

export const dynamic = 'force-dynamic';

// Proxy WordPress media files from Hostinger server.
// cms.mahdicreates.com/.htaccess is broken (no static-file exemption), so
// all requests through that vhost get 404 from WordPress PHP.
// The files exist on the same physical server under the mahdicreates.com vhost.
// We dial the raw IP (82.29.189.188) with TLS SNI = mahdicreates.com so
// LiteSpeed routes to the correct vhost, matching curl --resolve behaviour.
function makeConnection() {
  return tls.connect({
    host: '82.29.189.188',
    port: 443,
    servername: 'mahdicreates.com',
    rejectUnauthorized: true,
    ALPNProtocols: ['h2', 'http/1.1'],
  });
}

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
    const client = http2.connect('https://mahdicreates.com', {
      createConnection: makeConnection,
    });

    client.on('error', () => {
      resolve(new Response('Not Found', { status: 404 }));
    });

    const req = client.request({
      ':method': 'GET',
      ':path': `/wp-content/${filePath}`,
      accept: 'image/*,*/*',
      'user-agent': 'MahdiCreates-Proxy/1.0',
    });

    req.on('response', (headers) => {
      const status = headers[':status'] as number;
      if (status !== 200) {
        client.close();
        resolve(new Response('Not Found', { status: 404 }));
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

    req.on('error', () => {
      client.close();
      resolve(new Response('Not Found', { status: 404 }));
    });

    req.end();
  });
}
