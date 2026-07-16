const FF = `'DM Sans',system-ui,sans-serif`;

const SUB_CSS = `<style>
.mc-sub-wrap{max-width:800px;margin:40px auto 0}
.mc-sub-box{background:rgba(255,255,255,.04);border:1px solid rgba(255,255,255,.08);border-radius:20px;padding:40px}
.mc-sub-title{font-size:13px;font-weight:500;letter-spacing:.1px;color:rgba(255,255,255,.55);margin:0 0 8px;font-family:${FF}}
.mc-sub-label{display:block;font-size:13px;font-weight:500;letter-spacing:.1px;color:rgba(255,255,255,.55);margin-bottom:8px;font-family:${FF}}
.mc-sub-input{display:block;width:100%;background:rgba(255,255,255,.05);border:1px solid rgba(255,255,255,.1);border-radius:10px;color:#fff;font-family:${FF};font-size:15px;padding:13px 16px;outline:none;transition:border-color .2s,background .2s;box-sizing:border-box;margin-bottom:20px;-webkit-appearance:none;appearance:none}
.mc-sub-input::placeholder{color:rgba(255,255,255,.22)}
.mc-sub-input:focus{border-color:rgba(255,255,255,.3);background:rgba(255,255,255,.07)}
.mc-sub-btn{display:block;width:100%;padding:15px;background:#fff;color:#0f0f0f;border:none;border-radius:10px;font-family:${FF};font-size:15px;font-weight:600;cursor:pointer;margin-top:8px;transition:opacity .2s,transform .15s}
.mc-sub-btn:hover{opacity:.9}
.mc-sub-btn:active{transform:scale(.99)}
.mc-sub-btn:disabled{opacity:.5;cursor:not-allowed;transform:none}
.mc-sub-msg{margin-top:16px;padding:14px 16px;border-radius:10px;font-size:14px;font-family:${FF};display:none}
.mc-sub-msg.mc-sub-ok{background:rgba(34,197,94,.12);border:1px solid rgba(34,197,94,.25);color:#4ade80;display:block}
.mc-sub-msg.mc-sub-err{background:rgba(239,68,68,.1);border:1px solid rgba(239,68,68,.2);color:#f87171;display:block}
</style>`;

const SUB_SCRIPT = `<script>(function(){
  function mcSubscribe(){
    var btn=document.getElementById('mc-sub-btn');
    var msg=document.getElementById('mc-sub-msg');
    var inp=document.getElementById('mc-sub-email');
    if(!btn||!inp)return;
    var email=inp.value.trim();
    if(!email){inp.focus();return;}
    btn.disabled=true;btn.textContent='Subscribing…';
    if(msg){msg.className='mc-sub-msg';msg.textContent='';}
    fetch('/api/subscribe',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({email:email})})
      .then(function(r){return r.json();})
      .then(function(d){
        if(d.success){
          if(msg){msg.className='mc-sub-msg mc-sub-ok';msg.textContent='✓ You\'re in! Check your inbox for a confirmation.';}
          inp.value='';
          btn.style.display='none';
        }else{
          if(msg){msg.className='mc-sub-msg mc-sub-err';msg.textContent=d.error||'Something went wrong. Please try again.';}
          btn.disabled=false;btn.textContent='Subscribe →';
        }
      })
      .catch(function(){
        if(msg){msg.className='mc-sub-msg mc-sub-err';msg.textContent='Network error. Please try again.';}
        btn.disabled=false;btn.textContent='Subscribe →';
      });
  }
  document.addEventListener('click',function(e){
    if(e.target&&e.target.id==='mc-sub-btn'){mcSubscribe();}
  });
  document.addEventListener('keydown',function(e){
    if(e.key==='Enter'&&e.target&&e.target.id==='mc-sub-email'){e.preventDefault();mcSubscribe();}
  });
})();</script>`;

export function buildSubscribeBox(): string {
  return `${SUB_CSS}
<div class="mc-sub-wrap">
  <div class="mc-sub-box">
    <div id="mc-sub-form">
      <label class="mc-sub-label" for="mc-sub-email">Email address</label>
      <input class="mc-sub-input" id="mc-sub-email" type="email" placeholder="you@example.com">
      <button class="mc-sub-btn" id="mc-sub-btn" type="button">Subscribe →</button>
    </div>
    <div class="mc-sub-msg" id="mc-sub-msg"></div>
  </div>
</div>
${SUB_SCRIPT}`;
}

export const buildArticleFooter = buildSubscribeBox;
