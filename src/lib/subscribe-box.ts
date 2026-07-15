const SUB_CSS = `<style>
.mc-sub-wrap{max-width:800px;margin:32px auto 0}
.mc-sub-box{background:rgba(255,255,255,.04);border:1px solid rgba(255,255,255,.08);border-radius:20px;padding:32px}
.mc-sub-title{font-size:17px;font-weight:700;color:#fff;margin:0 0 4px;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Helvetica,Arial,sans-serif}
.mc-sub-desc{font-size:13px;color:rgba(255,255,255,.4);margin:0 0 24px;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Helvetica,Arial,sans-serif}
.mc-sub-label{display:block;font-size:12px;font-weight:500;color:rgba(255,255,255,.45);margin-bottom:8px;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Helvetica,Arial,sans-serif;letter-spacing:.01em}
.mc-sub-input{display:block;width:100%;padding:13px 16px;border-radius:12px;border:1px solid rgba(255,255,255,.1);background:rgba(255,255,255,.06);color:#fff;font-size:15px;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Helvetica,Arial,sans-serif;outline:none;transition:border-color .2s;box-sizing:border-box;margin-bottom:16px}
.mc-sub-input::placeholder{color:rgba(255,255,255,.25)}
.mc-sub-input:focus{border-color:rgba(255,255,255,.25)}
.mc-sub-btn{display:block;width:100%;padding:15px;border-radius:12px;background:#fff;color:#0a0a0a;font-size:15px;font-weight:700;border:none;cursor:pointer;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Helvetica,Arial,sans-serif;transition:opacity .2s}
.mc-sub-btn:hover{opacity:.9}
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

export function buildSubscribeBox(): string {
  return `${SUB_CSS}
<div class="mc-sub-wrap">
  <div class="mc-sub-box">
    <p class="mc-sub-title">Get design insights in your inbox</p>
    <p class="mc-sub-desc">No spam. UI/UX tips, case studies, and resources — straight to you.</p>
    <form id="mc-sub-form" novalidate>
      <label class="mc-sub-label" for="mc-sub-email">Email address</label>
      <input class="mc-sub-input" id="mc-sub-email" type="email" placeholder="you@example.com" required>
      <button class="mc-sub-btn" id="mc-sub-btn" type="submit">Subscribe →</button>
    </form>
    <div class="mc-sub-msg" id="mc-sub-msg"></div>
  </div>
</div>
${SUB_SCRIPT}`;
}

/** Alias kept for single-page routes */
export const buildArticleFooter = buildSubscribeBox;
