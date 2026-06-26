const framerBlogHTML: string = `
<link rel="preconnect" href="https://fonts.googleapis.com">
<link rel="preconnect" href="https://fonts.gstatic.com" crossorigin="">
<link href="https://fonts.googleapis.com/css2?family=Outfit:wght@400;600;700;900&display=swap" rel="stylesheet">
<style>
  *, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }
  body { background: #0f0f0f; }
  .pg-wrap {
    min-height: 100vh;
    background: #0f0f0f;
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    padding: 80px 24px;
    font-family: 'Outfit', sans-serif;
  }
  .pg-label {
    font-size: 12px;
    font-weight: 600;
    letter-spacing: 0.18em;
    text-transform: uppercase;
    color: #ff6522;
    margin-bottom: 20px;
  }
  .pg-title {
    font-size: clamp(36px, 6vw, 72px);
    font-weight: 900;
    color: #ffffff;
    line-height: 1.1;
    text-align: center;
    margin-bottom: 24px;
  }
  .pg-body {
    font-size: 18px;
    color: #9a9a9a;
    text-align: center;
    max-width: 520px;
    line-height: 1.6;
    margin-bottom: 48px;
  }
  .pg-pill {
    display: inline-block;
    background: rgba(255, 101, 34, 0.12);
    border: 1px solid rgba(255, 101, 34, 0.3);
    color: #ff6522;
    border-radius: 999px;
    padding: 10px 28px;
    font-size: 14px;
    font-weight: 600;
    letter-spacing: 0.02em;
  }
</style>
<div class="pg-wrap">
  <p class="pg-label">Writing</p>
  <h1 class="pg-title">Blog</h1>
  <p class="pg-body">Page coming soon — will be populated from WordPress CMS.</p>
  <span class="pg-pill">Coming Soon</span>
</div>
`;

export default framerBlogHTML;
