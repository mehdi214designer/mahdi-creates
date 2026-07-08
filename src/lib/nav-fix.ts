/**
 * Post-hydration nav link corrections.
 * The Framer JS bundle hardcodes some old URLs (e.g. /insights/ for the blog),
 * so we override them with a capture-phase click handler after hydration.
 */

const NAV_CORRECTIONS: Record<string, string> = {
  '/insights/': '/blog',
  '/insights': '/blog',
};

function buildNavFixScript(): string {
  const corrections = JSON.stringify(NAV_CORRECTIONS);
  return `<script>
(function(){
  var C=${corrections};
  function fix(){
    document.querySelectorAll('a[href]').forEach(function(a){
      var h=a.href;
      for(var old in C){
        if(h.indexOf(old)>=0){
          var next=C[old];
          a.href=next;
          if(!a._nf){
            a._nf=1;
            (function(url){
              a.addEventListener('click',function(e){
                e.preventDefault();
                e.stopPropagation();
                location.href=url;
              },true);
            })(next);
          }
          break;
        }
      }
    });
  }
  fix();
  [200,600,1400].forEach(function(d){setTimeout(fix,d)});
  var obs=new MutationObserver(fix);
  obs.observe(document.body,{childList:1,subtree:1});
  window.addEventListener('load',function(){fix();setTimeout(function(){obs.disconnect()},3000)});
})();
</script>`;
}

export const NAV_FIX_SCRIPT = buildNavFixScript();

/** Inject nav fix script before </body> */
export function applyNavFix(html: string): string {
  return html.replace('</body>', NAV_FIX_SCRIPT + '</body>');
}
