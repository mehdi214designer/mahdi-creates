const WP_CONTACT_URL = 'https://cms.mahdicreates.com/wp-json/mc/v1/contact';
const API_KEY = process.env.MC_CONTACT_API_KEY ?? '';

const CORS = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type',
};

export async function OPTIONS() {
  return new Response(null, { status: 204, headers: CORS });
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const email = (body.email ?? '').trim().toLowerCase();

    if (!email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      return Response.json({ error: 'Please enter a valid email address.' }, { status: 400, headers: CORS });
    }

    // Anything the sender actually typed. Capped so a bad client cannot post a novel.
    const message = String(body.message ?? '').trim().slice(0, 2000);
    // Lets you tell a plain newsletter signup apart from a request sent from the app.
    const source = String(body.source ?? '').trim().slice(0, 60);

    const wpRes = await fetch(WP_CONTACT_URL, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'X-MC-Key': API_KEY },
      body: JSON.stringify({
        name: message ? 'Server Studio request' : 'Newsletter Subscriber',
        email,
        interest: message ? (source || 'server-studio') : 'newsletter',
        // Forward what they wrote. Without this the request is silently dropped and
        // the sender is told it worked.
        message: message || 'Newsletter subscription via mahdicreates.com',
      }),
    });

    if (!wpRes.ok) {
      const err = await wpRes.json().catch(() => ({}));
      return Response.json(
        { error: (err as { message?: string }).message ?? 'Something went wrong. Please try again.' },
        { status: wpRes.status, headers: CORS }
      );
    }

    return Response.json({ success: true }, { headers: CORS });
  } catch {
    return Response.json({ error: 'Server error. Please try again.' }, { status: 500, headers: CORS });
  }
}
