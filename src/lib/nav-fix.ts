/**
 * Post-hydration nav fix.
 *
 * Framer's SPA router calls history.pushState for all nav clicks, which bypasses
 * our Next.js SSR routes (and their WordPress content injection). We intercept
 * pushState/replaceState and convert every real navigation into a full page load,
 * applying route mapping where Framer's internal routes differ from our URLs.
 */

const ROUTE_MAP: Record<string, string> = {
  '/insights': '/blog',
  '/insights/': '/blog',
};

function buildNavFixScript(): string {
  const map = JSON.stringify(ROUTE_MAP);
  return `<script>
(function(){
  var MAP=${map};

  function redirect(url){
    if(!url||typeof url!=='string') return false;
    var path=url.split('?')[0].split('#')[0];
    // Normalise trailing slash for lookup
    var key=path.endsWith('/')&&path.length>1?path.slice(0,-1):path;
    var dest=MAP[key]||MAP[path]||null;
    window.location.href=dest||url;
    return true;
  }

  // Intercept Framer SPA navigation — convert to full page load so Next.js
  // serves the correct SSR route (with WordPress content injected).
  var _push=history.pushState.bind(history);
  history.pushState=function(state,title,url){
    if(url&&typeof url==='string'&&url.split('?')[0]!==location.pathname){
      redirect(url);
      return;
    }
    return _push(state,title,url);
  };

  // Fix anchor hrefs for right-click → "Open in new tab" behaviour.
  function fixHrefs(){
    document.querySelectorAll('a[href]').forEach(function(a){
      var href=a.getAttribute('href')||'';
      var path=href.split('?')[0];
      var key=path.endsWith('/')&&path.length>1?path.slice(0,-1):path;
      var dest=MAP[key]||MAP[path];
      if(dest) a.setAttribute('href',dest);
    });
  }
  fixHrefs();
  [300,800,1800].forEach(function(d){setTimeout(fixHrefs,d)});
  new MutationObserver(fixHrefs).observe(document.body,{childList:true,subtree:true,attributes:true,attributeFilter:['href']});
})();
</script>`;
}

export const NAV_FIX_SCRIPT = buildNavFixScript();

/** Inject nav fix script before </body> */
export function applyNavFix(html: string): string {
  return html.replace('</body>', NAV_FIX_SCRIPT + '</body>');
}
