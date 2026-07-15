const WP_CONTACT_URL = 'https://cms.mahdicreates.com/wp-json/mc/v1/contact';
const API_KEY = process.env.MC_CONTACT_API_KEY ?? '';

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const email = (body.email ?? '').trim().toLowerCase();

    if (!email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      return Response.json({ error: 'Please enter a valid email address.' }, { status: 400 });
    }

    const wpRes = await fetch(WP_CONTACT_URL, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'X-MC-Key': API_KEY },
      body: JSON.stringify({
        name: '',
        email,
        interest: 'newsletter',
        message: 'Newsletter subscription via mahdicreates.com',
      }),
    });

    if (!wpRes.ok) {
      const err = await wpRes.json().catch(() => ({}));
      return Response.json(
        { error: (err as { message?: string }).message ?? 'Something went wrong. Please try again.' },
        { status: wpRes.status }
      );
    }

    return Response.json({ success: true });
  } catch {
    return Response.json({ error: 'Server error. Please try again.' }, { status: 500 });
  }
}
