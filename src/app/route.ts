import { readFileSync } from 'fs';
import path from 'path';
import { applyNavFix } from '@/lib/nav-fix';

export const dynamic = 'force-static';

// Intercepts the Framer newsletter form after hydration and mirrors
// submissions to our /api/contact endpoint → FluentCRM Newsletter list.
const NEWSLETTER_CAPTURE = `<script>
(function(){
  function bindNewsletterForm(){
    document.querySelectorAll('input[type="email"]').forEach(function(input){
      if(input._mcBound) return;
      var form = input.closest('form');
      if(!form) return;
      input._mcBound = true;
      form.addEventListener('submit', function(){
        var email = input.value.trim();
        if(!email) return;
        fetch('/api/contact',{
          method:'POST',
          headers:{'Content-Type':'application/json'},
          body: JSON.stringify({
            name: email.split('@')[0],
            email: email,
            interest: 'newsletter'
          })
        }).catch(function(){});
      }, true);
    });
  }
  [600,1500,3000,5000].forEach(function(d){setTimeout(bindNewsletterForm,d)});
  new MutationObserver(bindNewsletterForm).observe(document.body,{childList:true,subtree:true});
})();
</script>`;

export async function GET() {
  let html = readFileSync(
    path.join(process.cwd(), 'src/data/home.html'),
    'utf-8'
  );

  html = applyNavFix(html).replace('</body>', NEWSLETTER_CAPTURE + '</body>');

  return new Response(html, {
    headers: {
      'Content-Type': 'text/html; charset=utf-8',
      'Cache-Control': 'no-cache, no-store, must-revalidate',
    },
  });
}
