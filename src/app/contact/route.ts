import { applyNavFix } from '@/lib/nav-fix';

const html = `<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width, initial-scale=1.0">
<title>Contact — Mahdi Creates</title>
<meta name="description" content="Get in touch with Mahdi — UI/UX design, branding, digital products, or just say hi.">
<link rel="icon" href="/favicon.ico">
<style>
  *, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }

  body {
    background: #0f0f0f;
    color: #fff;
    font-family: 'DM Sans', system-ui, sans-serif;
    min-height: 100vh;
    display: flex;
    flex-direction: column;
  }

  a { color: inherit; text-decoration: none; }

  /* ── Nav ── */
  .nav {
    position: fixed; top: 0; left: 0; right: 0; z-index: 100;
    padding: 20px 40px;
    display: flex; align-items: center; justify-content: space-between;
    background: rgba(15,15,15,0.85);
    backdrop-filter: blur(12px);
    border-bottom: 1px solid rgba(255,255,255,0.06);
  }
  .nav-logo { font-size: 17px; font-weight: 600; letter-spacing: -0.3px; }
  .nav-back {
    font-size: 14px; color: rgba(255,255,255,0.5);
    display: flex; align-items: center; gap: 6px;
    transition: color 0.2s;
  }
  .nav-back:hover { color: #fff; }

  /* ── Page ── */
  .page {
    flex: 1;
    padding: 140px 24px 80px;
    display: flex; flex-direction: column; align-items: center;
  }

  .heading-tag {
    display: inline-block;
    font-size: 12px; font-weight: 500; letter-spacing: 1.5px;
    text-transform: uppercase; color: rgba(255,255,255,0.4);
    margin-bottom: 20px;
  }

  h1 {
    font-size: clamp(36px, 5vw, 56px);
    font-weight: 700; letter-spacing: -1.5px; line-height: 1.1;
    text-align: center; margin-bottom: 16px;
    background: linear-gradient(135deg, #fff 60%, rgba(255,255,255,0.45));
    -webkit-background-clip: text; -webkit-text-fill-color: transparent;
    background-clip: text;
  }

  .subtitle {
    font-size: 17px; color: rgba(255,255,255,0.45); text-align: center;
    max-width: 440px; line-height: 1.6; margin-bottom: 56px;
  }

  /* ── Form ── */
  .form-wrap {
    width: 100%; max-width: 520px;
    background: rgba(255,255,255,0.04);
    border: 1px solid rgba(255,255,255,0.08);
    border-radius: 20px;
    padding: 40px;
  }

  .field { margin-bottom: 20px; }

  label {
    display: block; font-size: 13px; font-weight: 500;
    color: rgba(255,255,255,0.55); margin-bottom: 8px; letter-spacing: 0.1px;
  }

  input, select, textarea {
    width: 100%;
    background: rgba(255,255,255,0.05);
    border: 1px solid rgba(255,255,255,0.1);
    border-radius: 10px;
    color: #fff; font-family: inherit; font-size: 15px;
    padding: 13px 16px;
    outline: none;
    transition: border-color 0.2s, background 0.2s;
    appearance: none; -webkit-appearance: none;
  }
  input::placeholder, textarea::placeholder { color: rgba(255,255,255,0.22); }
  input:focus, select:focus, textarea:focus {
    border-color: rgba(255,255,255,0.3);
    background: rgba(255,255,255,0.07);
  }
  select { cursor: pointer; background-image: url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='12' height='8' viewBox='0 0 12 8'%3E%3Cpath d='M1 1l5 5 5-5' stroke='rgba(255,255,255,0.35)' stroke-width='1.5' fill='none' stroke-linecap='round'/%3E%3C/svg%3E"); background-repeat: no-repeat; background-position: right 16px center; padding-right: 40px; }
  select option { background: #1a1a1a; color: #fff; }
  textarea { resize: vertical; min-height: 110px; }

  .field-row { display: grid; grid-template-columns: 1fr 1fr; gap: 14px; }

  .btn {
    width: 100%; padding: 15px;
    background: #fff; color: #0f0f0f;
    border: none; border-radius: 10px;
    font-family: inherit; font-size: 15px; font-weight: 600;
    cursor: pointer; margin-top: 8px;
    transition: opacity 0.2s, transform 0.15s;
  }
  .btn:hover { opacity: 0.9; }
  .btn:active { transform: scale(0.99); }
  .btn:disabled { opacity: 0.5; cursor: not-allowed; transform: none; }

  /* ── States ── */
  .msg {
    margin-top: 16px; padding: 14px 16px;
    border-radius: 10px; font-size: 14px; display: none;
  }
  .msg.success { background: rgba(34,197,94,0.12); border: 1px solid rgba(34,197,94,0.25); color: #4ade80; }
  .msg.error   { background: rgba(239,68,68,0.1);  border: 1px solid rgba(239,68,68,0.2);  color: #f87171; }
  .msg.visible { display: block; }

  /* ── Footer note ── */
  .note {
    margin-top: 32px; font-size: 13px; color: rgba(255,255,255,0.28);
    text-align: center; max-width: 360px;
  }

  @media (max-width: 600px) {
    .nav { padding: 16px 20px; }
    .form-wrap { padding: 28px 20px; }
    .field-row { grid-template-columns: 1fr; }
  }
</style>
</head>
<body>

<nav class="nav">
  <span class="nav-logo">Mahdi Creates</span>
  <a href="/" class="nav-back">← Back to home</a>
</nav>

<main class="page">
  <span class="heading-tag">Get in touch</span>
  <h1>Let's work together</h1>
  <p class="subtitle">Tell me what you're building. I'll get back to you within 24 hours.</p>

  <div class="form-wrap">
    <form id="contact-form">
      <div class="field-row">
        <div class="field">
          <label for="name">Your name</label>
          <input type="text" id="name" name="name" placeholder="Mahdi Hassan" required>
        </div>
        <div class="field">
          <label for="email">Email address</label>
          <input type="email" id="email" name="email" placeholder="you@example.com" required>
        </div>
      </div>

      <div class="field">
        <label for="interest">I'm interested in</label>
        <select id="interest" name="interest" required>
          <option value="" disabled selected>Select one…</option>
          <option value="services">Design Services (UI/UX, Branding, Print)</option>
          <option value="products">Digital Products (Templates, Resources)</option>
          <option value="newsletter">Newsletter / Stay in the loop</option>
        </select>
      </div>

      <div class="field">
        <label for="message">Message <span style="color:rgba(255,255,255,0.25)">(optional)</span></label>
        <textarea id="message" name="message" placeholder="Tell me about your project or what you need…"></textarea>
      </div>

      <button type="submit" class="btn" id="submit-btn">Send Message</button>

      <div class="msg success" id="msg-success">
        ✓ Message sent! I'll be in touch within 24 hours.
      </div>
      <div class="msg error" id="msg-error">
        Something went wrong — please try again or email me directly.
      </div>
    </form>
  </div>

  <p class="note">No spam. Unsubscribe anytime. Your info goes straight to Mahdi, no middlemen.</p>
</main>

<script>
document.getElementById('contact-form').addEventListener('submit', async function(e) {
  e.preventDefault();
  var btn = document.getElementById('submit-btn');
  var msgOk  = document.getElementById('msg-success');
  var msgErr = document.getElementById('msg-error');
  msgOk.classList.remove('visible');
  msgErr.classList.remove('visible');
  btn.disabled = true;
  btn.textContent = 'Sending…';

  var data = {
    name:     document.getElementById('name').value.trim(),
    email:    document.getElementById('email').value.trim(),
    interest: document.getElementById('interest').value,
    message:  document.getElementById('message').value.trim()
  };

  try {
    var res = await fetch('/api/contact', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data)
    });
    if (res.ok) {
      msgOk.classList.add('visible');
      document.getElementById('contact-form').reset();
    } else {
      msgErr.classList.add('visible');
    }
  } catch(err) {
    msgErr.classList.add('visible');
  }

  btn.disabled = false;
  btn.textContent = 'Send Message';
});
</script>

</body>
</html>`;

export const dynamic = 'force-static';

export async function GET() {
  return new Response(applyNavFix(html), {
    headers: { 'Content-Type': 'text/html; charset=utf-8' },
  });
}
