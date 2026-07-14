const WP_CONTACT_URL = 'https://cms.mahdicreates.com/wp-json/mc/v1/contact';
const API_KEY = process.env.MC_CONTACT_API_KEY ?? '';

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { name, email, interest, message } = body as Record<string, string>;

    if (!name?.trim() || !email?.trim()) {
      return Response.json({ error: 'Name and email are required' }, { status: 400 });
    }

    const wpRes = await fetch(WP_CONTACT_URL, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'X-MC-Key': API_KEY },
      body: JSON.stringify({ name: name.trim(), email: email.trim(), interest, message }),
    });

    if (!wpRes.ok) {
      const err = await wpRes.json().catch(() => ({}));
      return Response.json({ error: (err as { message?: string }).message ?? 'Submission failed' }, { status: wpRes.status });
    }

    return Response.json({ success: true });
  } catch {
    return Response.json({ error: 'Server error' }, { status: 500 });
  }
}
