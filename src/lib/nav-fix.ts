/**
 * Post-hydration nav fix.
 *
 * Framer's SPA router calls history.pushState for nav clicks, bypassing our
 * Next.js SSR routes. We intercept pushState to convert SPA navigations to full
 * page loads, applying route mapping where Framer's internal paths differ from ours.
 *
 * Some links (Case Studies) have their href removed or set to "./" by Framer's
 * hydration, so we also fix those by matching text content.
 */

const ROUTE_MAP: Record<string, string> = {
  '/insights': '/blog',
  '/insights/': '/blog',
};

/** Text → URL for nav links that Framer strips hrefs from */
const TEXT_LINK_MAP: Record<string, string> = {
  'Case Studies': '/case-studies',
  'Case Study': '/case-studies',
};

function buildNavFixScript(): string {
  const routeMap = JSON.stringify(ROUTE_MAP);
  const textMap = JSON.stringify(TEXT_LINK_MAP);

  return `<script>
(function(){
  var RMAP=${routeMap};
  var TMAP=${textMap};

  // Override history.pushState — convert all Framer SPA navigations to full page
  // loads so Next.js SSR routes serve correct content with WordPress injection.
  var _push=history.pushState.bind(history);
  history.pushState=function(state,title,url){
    if(url&&typeof url==='string'){
      var path=url.split('?')[0].split('#')[0];
      var cur=location.pathname;
      if(path!==cur){
        // Real navigation — full page load with route mapping
        var key=path.endsWith('/')&&path.length>1?path.slice(0,-1):path;
        var dest=RMAP[key]||RMAP[path]||url;
        window.location.href=dest;
        return;
      }
    }
    return _push(state,title,url);
  };

  // Fix anchor hrefs and add click guards for known broken links.
  function fixLinks(){
    // 1. href-based fixes (e.g. /insights → /blog)
    document.querySelectorAll('a[href]').forEach(function(a){
      var href=a.getAttribute('href')||'';
      var path=href.split('?')[0];
      var key=path.endsWith('/')&&path.length>1?path.slice(0,-1):path;
      var dest=RMAP[key]||RMAP[path];
      if(dest) a.setAttribute('href',dest);
    });

    // 2. Text-based fixes for links Framer strips hrefs from
    document.querySelectorAll('a,div[role="link"],div[tabindex]').forEach(function(el){
      var text=(el.textContent||'').trim();
      var dest=TMAP[text];
      if(dest&&!el._mcFixed){
        el._mcFixed=true;
        el.setAttribute('href',dest);
        el.addEventListener('click',function(e){
          e.preventDefault();
          e.stopImmediatePropagation();
          location.href=dest;
        },true);
      }
    });
  }

  fixLinks();
  [300,800,1800,3000].forEach(function(d){setTimeout(fixLinks,d)});
  new MutationObserver(fixLinks).observe(document.body,{
    childList:true,subtree:true,attributes:true,attributeFilter:['href','class']
  });
})();
</script>`;
}

export const NAV_FIX_SCRIPT = buildNavFixScript();

const BADGE_HIDE = `<style>.__framer-badge{display:none!important}</style>`;

/** Inject nav fix script and hide Framer badge before </body> */
export function applyNavFix(html: string): string {
  return html.replace('</body>', NAV_FIX_SCRIPT + BADGE_HIDE + '</body>');
}
