import { fetchFramerPage } from '@/lib/framer-fetch';
import { applyNavFix } from '@/lib/nav-fix';

export const revalidate = 60;

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
  const raw = await fetchFramerPage('/', 'home.html');
  const html = applyNavFix(raw).replace('</body>', NEWSLETTER_CAPTURE + '</body>');

  return new Response(html, {
    headers: {
      'Content-Type': 'text/html; charset=utf-8',
      'Cache-Control': 'public, s-maxage=60, stale-while-revalidate=300',
    },
  });
}
