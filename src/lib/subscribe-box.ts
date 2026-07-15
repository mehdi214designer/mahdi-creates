const CARD_CSS = `<style>
.mc-card-row{max-width:800px;margin:40px auto 0;display:flex;flex-direction:column;gap:16px}
.mc-author-card{background:rgba(255,255,255,.05);border:1px solid rgba(255,255,255,.08);border-radius:20px;padding:28px 32px}
.mc-ac-top{display:flex;align-items:center;gap:20px;margin-bottom:14px}
.mc-ac-avi{width:60px;height:60px;border-radius:50%;background:#ff6522;display:flex;align-items:center;justify-content:center;font-size:24px;font-weight:700;color:#fff;flex-shrink:0}
.mc-ac-name{font-size:18px;font-weight:700;color:#fff;margin:0 0 4px}
.mc-ac-role{font-size:13px;color:rgba(255,255,255,.4);margin:0}
.mc-ac-bio{font-size:14px;line-height:1.7;color:rgba(255,255,255,.5);margin:0}
.mc-sub-box{background:rgba(255,101,34,.08);border:1px solid rgba(255,101,34,.28);border-radius:20px;padding:28px 32px}
.mc-sub-top{display:flex;align-items:flex-start;gap:18px;margin-bottom:20px}
.mc-sub-emoji{font-size:38px;line-height:1;flex-shrink:0;margin-top:2px}
.mc-sub-title{font-size:20px;font-weight:700;color:#fff;margin:0 0 5px}
.mc-sub-desc{font-size:14px;color:rgba(255,255,255,.45);margin:0;line-height:1.6}
.mc-sub-form{display:flex;gap:10px;flex-wrap:nowrap}
.mc-sub-input{flex:1;min-width:0;padding:12px 20px;border-radius:100px;border:1px solid rgba(255,255,255,.15);background:rgba(255,255,255,.06);color:#fff;font-size:14px;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Helvetica,Arial,sans-serif;outline:none;transition:border-color .2s}
.mc-sub-input::placeholder{color:rgba(255,255,255,.3)}
.mc-sub-input:focus{border-color:rgba(255,101,34,.5)}
.mc-sub-btn{flex-shrink:0;padding:12px 26px;border-radius:100px;background:#ff6522;color:#fff;font-size:14px;font-weight:600;border:none;cursor:pointer;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Helvetica,Arial,sans-serif;transition:opacity .2s;white-space:nowrap}
.mc-sub-btn:hover{opacity:.85}
.mc-sub-btn:disabled{opacity:.5;cursor:default}
.mc-sub-msg{margin-top:12px;font-size:13px;display:none;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Helvetica,Arial,sans-serif}
.mc-sub-msg.mc-sub-ok{color:#4ade80;display:block}
.mc-sub-msg.mc-sub-err{color:#f87171;display:block}
</style>`;

const SUB_SCRIPT = `<script>(function(){
  var form=document.getElementById('mc-sub-form');
  var btn=document.getElementById('mc-sub-btn');
  var msg=document.getElementById('mc-sub-msg');
  var inp=document.getElementById('mc-sub-email');
  if(!form)return;
  form.addEventListener('submit',function(e){
    e.preventDefault();
    var email=(inp.value||'').trim();
    if(!email)return;
    btn.disabled=true;btn.textContent='Subscribing…';
    msg.className='mc-sub-msg';msg.textContent='';
    fetch('/api/subscribe',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({email:email})})
      .then(function(r){return r.json();})
      .then(function(d){
        if(d.success){
          msg.className='mc-sub-msg mc-sub-ok';
          msg.textContent='✓ You\'re in! Check your inbox for a confirmation.';
          form.style.display='none';
        }else{
          msg.className='mc-sub-msg mc-sub-err';
          msg.textContent=d.error||'Something went wrong. Please try again.';
          btn.disabled=false;btn.textContent='Subscribe →';
        }
      })
      .catch(function(){
        msg.className='mc-sub-msg mc-sub-err';
        msg.textContent='Network error. Please try again.';
        btn.disabled=false;btn.textContent='Subscribe →';
      });
  });
})();</script>`;

const SUBSCRIBE_BOX = `<div class="mc-sub-box">
  <div class="mc-sub-top">
    <span class="mc-sub-emoji">📬</span>
    <div>
      <h3 class="mc-sub-title">Get design insights in your inbox</h3>
      <p class="mc-sub-desc">No spam. UI/UX tips, case studies, and resources — delivered straight to you.</p>
    </div>
  </div>
  <form class="mc-sub-form" id="mc-sub-form" novalidate>
    <input class="mc-sub-input" id="mc-sub-email" type="email" placeholder="your@email.com" required>
    <button class="mc-sub-btn" id="mc-sub-btn" type="submit">Subscribe →</button>
  </form>
  <div class="mc-sub-msg" id="mc-sub-msg"></div>
</div>`;

const AUTHOR_CARD = `<div class="mc-author-card">
  <div class="mc-ac-top">
    <div class="mc-ac-avi">M</div>
    <div>
      <p class="mc-ac-name">Md Mahdi Hasan</p>
      <p class="mc-ac-role">UI/UX Designer &amp; Creative Problem Solver · WPManageNinja</p>
    </div>
  </div>
  <p class="mc-ac-bio">Award-winning designer with 9+ years building high-conversion web experiences and design systems for global brands.</p>
</div>`;

/** Standalone subscribe box (index pages — no author card) */
export function buildSubscribeBox(): string {
  return `${CARD_CSS}
<div class="mc-card-row">
  ${SUBSCRIBE_BOX}
</div>
${SUB_SCRIPT}`;
}

/** Author bio card + subscribe box stacked (single article pages) */
export function buildArticleFooter(): string {
  return `${CARD_CSS}
<div class="mc-card-row">
  ${AUTHOR_CARD}
  ${SUBSCRIBE_BOX}
</div>
${SUB_SCRIPT}`;
}
