import { NextRequest } from 'next/server';

const WP_API = 'https://cms.mahdicreates.com/wp-json/wp/v2';

export const dynamic = 'force-dynamic';

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();

    // Honeypot — bots fill the hidden website field
    if (body.website) {
      return Response.json({ success: true });
    }

    const { post_id, author_name, author_email, content } = body;

    if (!post_id || !author_name?.trim() || !author_email?.trim() || !content?.trim()) {
      return Response.json({ error: 'All fields are required.' }, { status: 400 });
    }

    const res = await fetch(`${WP_API}/comments`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        post: Number(post_id),
        author_name: String(author_name).trim().slice(0, 100),
        author_email: String(author_email).trim(),
        content: String(content).trim().slice(0, 5000),
      }),
    });

    const data = await res.json();

    if (!res.ok) {
      return Response.json(
        { error: data.message || 'Could not submit comment. Please try again.' },
        { status: 400 }
      );
    }

    return Response.json({ success: true, status: data.status });
  } catch {
    return Response.json({ error: 'Server error. Please try again.' }, { status: 500 });
  }
}
