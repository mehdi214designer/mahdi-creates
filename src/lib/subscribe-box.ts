const SUB_CSS = `<style>
.mc-sub-wrap{max-width:800px;margin:48px auto 0;width:100%}
.mc-sub-box{background:rgba(255,101,34,.06);border:1px solid rgba(255,101,34,.15);border-radius:20px;padding:32px 36px}
.mc-sub-head{display:flex;align-items:flex-start;gap:16px;margin-bottom:20px}
.mc-sub-icon{font-size:26px;line-height:1;flex-shrink:0;margin-top:3px}
.mc-sub-title{font-size:19px;font-weight:700;color:#fff;margin:0 0 5px}
.mc-sub-desc{font-size:14px;color:rgba(255,255,255,.45);margin:0;line-height:1.6}
.mc-sub-form{display:flex;gap:8px;flex-wrap:wrap}
.mc-sub-input{flex:1;min-width:180px;padding:10px 18px;border-radius:100px;border:1px solid rgba(255,255,255,.15);background:rgba(255,255,255,.05);color:#fff;font-size:14px;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Helvetica,Arial,sans-serif;outline:none;transition:border-color .2s}
.mc-sub-input::placeholder{color:rgba(255,255,255,.3)}
.mc-sub-input:focus{border-color:rgba(255,101,34,.5)}
.mc-sub-btn{padding:10px 22px;border-radius:100px;background:#ff6522;color:#fff;font-size:14px;font-weight:600;border:none;cursor:pointer;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Helvetica,Arial,sans-serif;transition:opacity .2s;white-space:nowrap}
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

export function buildSubscribeBox(): string {
  return `${SUB_CSS}
<div class="mc-sub-wrap">
  <div class="mc-sub-box">
    <div class="mc-sub-head">
      <div class="mc-sub-icon">📬</div>
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
  </div>
</div>
${SUB_SCRIPT}`;
}
