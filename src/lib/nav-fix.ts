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
  'Resources': '/resources',
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

const BADGE_HIDE = `<style>
.__framer-badge{display:none!important}
a[data-framer-name="Primary"]{opacity:1!important;transform:translateY(0)!important}
</style>`;

// MC logo SVG extracted from Framer's mobile nav SSR output
const MC_LOGO_SVG = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 42 42" width="36" height="36" aria-hidden="true"><path d="M 2.355 42 C 1.055 42 0 40.945 0 39.645 L 0 2.355 C 0 1.055 1.055 0 2.355 0 L 39.645 0 C 40.945 0 42 1.055 42 2.355 L 42 39.645 C 42 40.945 40.945 42 39.645 42 Z" fill="rgb(255,102,34)"/><g transform="translate(4.045 10.131)"><path d="M 13.978 14.392 L 8.926 0.54 L 3.781 0.54 L 6.81 8.885 L 2.662 19.381 L 0 21.706 L 7.806 21.706 C 7.061 21.224 6.487 20.714 6.081 20.181 C 5.678 19.647 5.395 18.955 5.236 18.11 C 5.013 16.86 5.096 15.515 5.491 14.073 C 5.885 12.632 6.403 11.115 7.049 9.522 L 11.5 21.706 L 12.105 21.706 L 15.759 10.88 C 15.759 9.913 15.883 8.981 16.122 8.093 Z" fill="#fff"/><path d="M 33.949 15.663 C 33.766 16.671 33.459 17.586 33.025 18.414 C 32.59 19.238 32.001 19.915 31.255 20.441 C 30.67 20.843 30.008 21.166 29.271 21.409 C 28.534 21.647 27.693 21.771 26.745 21.771 C 26.219 21.771 25.705 21.735 25.203 21.663 C 24.27 21.532 23.374 21.281 22.509 20.907 C 21.545 20.493 20.664 19.967 19.875 19.33 C 19.576 19.091 19.289 18.836 19.014 18.566 C 18.014 17.578 17.225 16.42 16.64 15.086 C 16.054 13.756 15.759 12.347 15.759 10.854 L 15.759 10.838 C 15.759 9.87 15.883 8.938 16.122 8.05 C 16.257 7.537 16.424 7.067 16.624 6.605 C 17.197 5.287 17.978 4.137 18.967 3.157 C 19.094 3.03 19.226 2.91 19.357 2.791 C 20.258 1.987 21.29 1.338 22.449 0.844 C 23.78 0.283 25.203 0 26.717 0 C 27.665 0 28.586 0.104 29.486 0.319 C 30.383 0.529 31.303 0.784 32.252 1.087 L 32.252 7.74 C 31.829 7.398 31.367 6.964 30.861 6.438 C 30.355 5.916 29.821 5.375 29.259 4.822 C 28.693 4.268 28.096 3.735 27.47 3.221 C 26.844 2.707 26.211 2.289 25.565 1.963 C 24.92 1.644 24.262 1.457 23.597 1.405 C 22.931 1.354 22.266 1.521 21.601 1.903 C 20.915 2.289 20.397 2.883 20.043 3.687 C 19.975 3.842 19.911 4.005 19.859 4.173 C 19.628 4.861 19.513 5.634 19.513 6.486 C 19.513 7.545 19.68 8.684 20.011 9.902 C 20.345 11.12 20.855 12.335 21.541 13.545 C 22.206 14.755 22.951 15.834 23.78 16.782 C 24.143 17.196 24.501 17.57 24.868 17.913 C 25.338 18.363 25.812 18.749 26.291 19.079 C 27.139 19.665 27.98 20.031 28.817 20.182 C 29.654 20.333 30.419 20.218 31.104 19.836 C 31.769 19.473 32.268 18.928 32.602 18.203 C 32.933 17.475 33.18 16.631 33.343 15.663 Z" fill="#fff"/><path d="M 22.5 3.213 C 24.35 2.271 27.61 4.965 29.782 9.23 C 31.954 13.494 32.216 17.714 30.366 18.656 C 28.517 19.598 25.256 16.905 23.084 12.641 C 20.912 8.376 20.651 4.155 22.5 3.213 Z M 25.878 10.309 L 24.024 10.873 L 25.878 11.438 L 26.442 13.291 L 27.007 11.438 L 28.86 10.873 L 27.007 10.309 L 26.442 8.455 Z" fill="#fff"/></g></svg>`;

// Resume link from Framer's mobile nav SSR
const RESUME_LINK = 'https://drive.google.com/file/d/1L29kt0xJXP4UMTUZQgTG2FahUgz58l4Q/view?usp=sharing';

/**
 * Custom mobile hamburger nav for pages using the static blog-single.html template.
 * Framer's mobile hamburger requires React hydration which isn't available on static
 * template pages — the SSR only renders the Resume button fallback. This replaces it
 * with a fully functional pure-HTML hamburger nav.
 *
 * Also fixes the triple-footer issue: the three footer variants (Desktop/md/lg) have
 * their breakpoint CSS injected by Framer's JS bundles. If bundles are stale, all
 * three render simultaneously. We hide two of them on mobile.
 */
function buildNewsletterFormScript(): string {
  return `<style>.framer-1qbjvo8,.framer-hvaq4g{display:none!important}</style>
<script>(function(){
var subs=document.querySelectorAll('.framer-i97j3q');
if(!subs.length)return;
var ids=['d','t','m'];
subs.forEach(function(sub,i){
  var s=ids[i]||String(i);
  var wrap=document.createElement('div');
  wrap.style.cssText='display:flex;flex-direction:column;width:100%;margin-top:16px';
  wrap.innerHTML='<p style="margin:0 0 4px;font-family:\\'Zalando Sans Expanded\\',sans-serif;font-size:13px;font-weight:600;color:rgba(255,255,255,.55);letter-spacing:.04em">Newsletter</p>'
    +'<p style="margin:0 0 14px;font-family:\\'Zalando Sans Expanded\\',sans-serif;font-size:13px;color:rgba(255,255,255,.35);line-height:1.5">Design notes, UX ideas, and case-study drops.</p>'
    +'<input id="mc-fe-'+s+'" type="email" placeholder="you@example.com" autocomplete="email" style="display:block;width:100%;background:rgba(255,255,255,.05);border:1px solid rgba(255,255,255,.12);border-radius:10px;padding:13px 16px;color:#fff;font-size:15px;font-family:inherit;outline:none;box-sizing:border-box;margin-bottom:12px;-webkit-appearance:none;appearance:none;transition:border-color .2s">'
    +'<button id="mc-fb-'+s+'" type="button" onclick="mcFooterSub(\\''+s+'\\')" style="display:block;width:100%;padding:14px;background:#ff6522;color:#fff;border:none;border-radius:10px;font-size:15px;font-weight:600;cursor:pointer;font-family:inherit;transition:opacity .2s">Subscribe</button>'
    +'<div id="mc-fm-'+s+'" style="display:none;margin-top:12px;padding:12px 14px;border-radius:8px;font-size:13px;font-family:inherit"></div>';
  sub.parentElement.insertBefore(wrap,sub.nextSibling);
});
window.mcFooterSub=function(s){
  var btn=document.getElementById('mc-fb-'+s),msg=document.getElementById('mc-fm-'+s),inp=document.getElementById('mc-fe-'+s);
  if(!btn||!inp)return;
  var email=inp.value.trim();if(!email){inp.focus();return;}
  btn.disabled=true;btn.textContent='Subscribing…';msg.style.display='none';
  fetch('/api/subscribe',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({email:email})})
    .then(function(r){return r.json();})
    .then(function(d){
      if(d.success){
        msg.style.cssText=msg.style.cssText+'display:block;background:rgba(34,197,94,.1);border:1px solid rgba(34,197,94,.25);color:#4ade80';
        msg.textContent='✓ Subscribed! Check your inbox.';inp.value='';btn.style.display='none';
      }else{
        msg.style.cssText=msg.style.cssText+'display:block;background:rgba(239,68,68,.1);border:1px solid rgba(239,68,68,.2);color:#f87171';
        msg.textContent=d.error||'Something went wrong.';btn.disabled=false;btn.textContent='Subscribe';
      }
    }).catch(function(){
      msg.style.cssText=msg.style.cssText+'display:block;background:rgba(239,68,68,.1);border:1px solid rgba(239,68,68,.2);color:#f87171';
      msg.textContent='Network error. Please try again.';btn.disabled=false;btn.textContent='Subscribe';
    });
};
})();</script>`;
}

function buildSSRVariantCSS(): string {
  return `<style>
/* Framer breakpoint fix for fallback HTML files (blog.html, case-studies.html, resources.html, blog-single.html) */
/* These files all use this 5-breakpoint class set captured from Framer at snapshot time */
@media(min-width:2510px){.ssr-variant.hidden-1qi9knc{display:none!important}}
@media(min-width:1920px) and (max-width:2509.98px){.ssr-variant.hidden-aiog3o{display:none!important}}
@media(min-width:1440px) and (max-width:1919.98px){.ssr-variant.hidden-1es992z{display:none!important}}
@media(min-width:810px) and (max-width:1439.98px){.ssr-variant.hidden-1z3mgk{display:none!important}}
@media(max-width:809.98px){.ssr-variant.hidden-lyfgxj{display:none!important}}
</style>`;
}

function buildMobileNavHTML(): string {
  const FF = `-apple-system,BlinkMacSystemFont,"Segoe UI",sans-serif`;
  return `<style>
/* On single pages (no Framer JS), Framer's mobile nav can't hydrate — hide it and show ours */
@media(max-width:809px){.framer-3zrdlk{display:none!important}}
/* Hide broken Framer fallback mobile nav (Resume-only button) */
.hidden-1qi9knc.hidden-1z3mgk.hidden-1es992z.hidden-aiog3o{display:none!important}
/* Prevent footer horizontal overflow on narrow viewports */
.framer-v-19xfg6h,.framer-v-1kdrjlc,.framer-v-1wlma7m{overflow-x:hidden!important;max-width:100vw!important}

#mc-m-nav{display:none;position:fixed;top:0;left:0;right:0;z-index:10000;height:64px;background:rgba(9,9,11,0.95);backdrop-filter:blur(12px);-webkit-backdrop-filter:blur(12px);border-bottom:1px solid rgba(255,255,255,0.07);align-items:center;justify-content:space-between;padding:0 20px;box-sizing:border-box}
#mc-m-toggle{background:none;border:none;cursor:pointer;padding:10px;display:flex;align-items:center;justify-content:center;margin:-10px}
#mc-m-overlay{display:none;position:fixed;top:0;left:0;right:0;bottom:0;background:rgba(9,9,11,0.98);z-index:9999;flex-direction:column;align-items:center;justify-content:center;padding:80px 32px 48px;box-sizing:border-box;overflow-y:auto}
#mc-m-overlay.mc-open{display:flex}
#mc-m-close{position:absolute;top:16px;right:14px;background:none;border:none;cursor:pointer;color:rgba(255,255,255,0.5);font-size:22px;padding:10px;line-height:1;font-family:sans-serif}
#mc-m-links{display:flex;flex-direction:column;align-items:center;width:100%;gap:0}
#mc-m-links a{display:block;color:rgba(255,255,255,0.8);text-decoration:none;font-size:18px;font-weight:500;padding:14px 0;width:100%;text-align:center;font-family:${FF};letter-spacing:-0.01em;border-bottom:1px solid rgba(255,255,255,0.06);transition:color 0.15s}
#mc-m-links a:first-child{border-top:1px solid rgba(255,255,255,0.06)}
#mc-m-links a:hover,#mc-m-links a:active{color:#ff6522}
#mc-m-resume{margin-top:28px;display:inline-flex;align-items:center;justify-content:center;padding:12px 36px;border:1px solid rgba(255,255,255,0.2);border-radius:52px;color:rgb(237,238,241);text-decoration:none;font-size:14px;font-weight:500;font-family:${FF};box-shadow:inset 0 0 14px rgba(255,255,255,0.5);background:transparent;flex-shrink:0}
@media(max-width:809px){#mc-m-nav{display:flex!important}}
</style>
<div id="mc-m-nav" aria-label="Mobile navigation">
  <a href="/" aria-label="Mahdi Creates – Home" style="display:flex;align-items:center;text-decoration:none;flex-shrink:0">${MC_LOGO_SVG}</a>
  <button id="mc-m-toggle" aria-label="Open navigation menu" aria-expanded="false" aria-controls="mc-m-overlay">
    <svg width="22" height="16" viewBox="0 0 22 16" fill="none" xmlns="http://www.w3.org/2000/svg" aria-hidden="true"><path d="M1 1h20M1 8h20M1 15h20" stroke="white" stroke-width="2" stroke-linecap="round"/></svg>
  </button>
</div>
<div id="mc-m-overlay" role="dialog" aria-modal="true" aria-label="Navigation menu">
  <button id="mc-m-close" aria-label="Close navigation menu">&#x2715;</button>
  <nav id="mc-m-links" aria-label="Site navigation">
    <a href="/">Home</a>
    <a href="/about">About Me</a>
    <a href="/projects">Projects</a>
    <a href="/case-studies">Case Studies</a>
    <a href="/blog">Blog</a>
    <a href="/resources">Resources</a>
    <a href="/contact">Contact</a>
  </nav>
  <a id="mc-m-resume" href="${RESUME_LINK}" target="_blank" rel="noopener">Resume</a>
</div>
<script>
(function(){
  var overlay=document.getElementById('mc-m-overlay');
  var toggle=document.getElementById('mc-m-toggle');
  var close=document.getElementById('mc-m-close');
  if(!toggle||!close||!overlay) return;
  function openNav(){overlay.classList.add('mc-open');toggle.setAttribute('aria-expanded','true');document.body.style.overflow='hidden';}
  function closeNav(){overlay.classList.remove('mc-open');toggle.setAttribute('aria-expanded','false');document.body.style.overflow='';}
  toggle.addEventListener('click',openNav);
  close.addEventListener('click',closeNav);
  overlay.addEventListener('click',function(e){if(e.target===overlay)closeNav();});
  document.addEventListener('keydown',function(e){if(e.key==='Escape')closeNav();});
  document.querySelectorAll('#mc-m-links a').forEach(function(a){
    a.addEventListener('click',function(){if(a.getAttribute('target')!=='_blank')closeNav();});
  });
})();
</script>`;
}

const GA4_ID = 'G-KE2YS6JJ8M';

const GA4_SCRIPT = `<script async src="https://www.googletagmanager.com/gtag/js?id=${GA4_ID}"></script><script>window.dataLayer=window.dataLayer||[];function gtag(){dataLayer.push(arguments);}gtag('js',new Date());gtag('config','${GA4_ID}');</script>`;

function buildA11yScript(): string {
  return `<script>
(function(){
  function labelFor(href){
    var m;
    if(/^(\\.\\/|\\/)?$/.test(href)) return 'Mahdi Creates – Home';
    if(/instagram\\.com/.test(href)) return 'Instagram';
    if(/facebook\\.com/.test(href)) return 'Facebook';
    if(/x\\.com|twitter\\.com/.test(href)) return 'X (Twitter)';
    if(/profiles\\.wordpress\\.org|wordpress\\.org\\/u/.test(href)) return 'WordPress';
    if(/dribbble\\.com/.test(href)) return 'Dribbble';
    if(/behance\\.net/.test(href)) return 'Behance';
    m=href.match(/linkedin\\.com\\/in\\/([^/?\\s]+)/);
    if(m){var s=m[1].replace(/-[0-9a-f]{6,}$/,'');return s.split('-').map(function(w){return w.charAt(0).toUpperCase()+w.slice(1);}).join(' ')+' on LinkedIn';}
    if(/linkedin\\.com/.test(href)) return 'LinkedIn';
    return '';
  }
  function fixA11y(){
    document.querySelectorAll('a[href]').forEach(function(a){
      if(a.getAttribute('aria-label')) return;
      if((a.textContent||'').trim()) return;
      var label=labelFor(a.getAttribute('href')||'');
      if(label) a.setAttribute('aria-label',label);
    });
    if(!document.querySelector('main,[role="main"]')){
      var page=document.querySelector('[data-framer-page-container]')||
               document.querySelector('.framer-app')||
               document.querySelector('div[class^="framer-"]');
      if(page) page.setAttribute('role','main');
    }
  }
  fixA11y();
  [300,900,2000].forEach(function(d){setTimeout(fixA11y,d);});
})();
</script>`;
}

function buildNavInjectScript(): string {
  return `<style>
/* Only expand nav containers on desktop — mobile uses hamburger layout */
@media(min-width:900px){
  .framer-1d8j9t5{width:auto!important}
  .framer-nmxeya{width:auto!important}
}
/* Prevent horizontal overflow on mobile (footer clipping) */
body,html{max-width:100%;overflow-x:hidden}
</style>
<script>
(function(){
  function injectNavLinks(){
    // ── Resources inject ──────────────────────────────────────────────────────
    // Nav has multiple SSR variants (one per responsive breakpoint). querySelector
    // only returns the FIRST match, which may be hidden at the current screen width
    // — e.g. the 1440-1919 sub-variant is invisible at 2510+. querySelectorAll
    // + forEach injects into every variant so Resources shows at all screen sizes.
    var navDivs=document.querySelectorAll('a.framer-nmxeya div.framer-nmxeya');
    if(!navDivs.length) navDivs=document.querySelectorAll('div.framer-nmxeya');
    navDivs.forEach(function(navLinksDiv){
      // Guard: only process containers that have a Projects link (nav-specific)
      var proj=navLinksDiv.querySelector('a.framer-tgw0t1');
      if(!proj) return;
      // Check this specific variant for an existing Resources link
      var existingRes=navLinksDiv.querySelector('a[href="/resources"],a[href$="/resources"],a[href*="mahdicreates.com/resources"]');
      if(existingRes){
        var bad=existingRes.classList.contains('framer-nmxeya')||
                !!(existingRes.parentElement&&existingRes.parentElement.classList.contains('framer-13oizls'));
        if(bad){existingRes.remove();}
        else{return;}
      }
      var res=proj.cloneNode(true);
      res.href='/resources';
      res.removeAttribute('data-framer-appear-id');
      var tx=res.querySelector('p.framer-text');
      if(tx){tx.textContent='Resources';}
      else{res.querySelectorAll('span,div').forEach(function(n){if((n.textContent||'').trim()==='Projects')n.textContent='Resources';});}
      navLinksDiv.appendChild(res);
    });

    // ── Contact inject ────────────────────────────────────────────────────────
    document.querySelectorAll('a.framer-vuapxt[href="/blog"],a.framer-vuapxt[href="/insights"]').forEach(function(blogs){
      var parent=blogs.parentNode;if(!parent)return;
      var paras2=parent.querySelectorAll('p.framer-text');
      for(var j=0;j<paras2.length;j++){if((paras2[j].textContent||'').trim()==='Contact')return;}
      if(parent.querySelector('[href="/contact"]'))return;
      var ct=blogs.cloneNode(true);
      ct.href='/contact';
      var nm2=ct.querySelector('[data-framer-component-type="RichTextContainer"]');if(nm2)nm2.setAttribute('data-framer-name','Contact');
      var tx2=ct.querySelector('p.framer-text');if(tx2)tx2.textContent='Contact';
      blogs.insertAdjacentElement('beforebegin',ct);
    });
  }
  injectNavLinks();
  [300,800,1800,3000].forEach(function(d){setTimeout(injectNavLinks,d);});
  new MutationObserver(injectNavLinks).observe(document.body,{childList:true,subtree:true});
})();
</script>`;
}

/**
 * Inject GA4, accessibility fixes, nav inject script, SSR CSS, and newsletter form.
 * Pass { mobileNav: true } for static single pages (blog/case-study/resource) —
 * those don't load Framer's JS so the hamburger nav can't hydrate; we inject our own.
 */
export function applyNavFix(html: string, opts: { mobileNav?: boolean } = {}): string {
  const mobileNav = opts.mobileNav ? buildMobileNavHTML() : '';
  const always = buildSSRVariantCSS() + buildNewsletterFormScript();
  return html.replace('</body>', GA4_SCRIPT + buildA11yScript() + NAV_FIX_SCRIPT + buildNavInjectScript() + BADGE_HIDE + mobileNav + always + '</body>');
}

/** Return a styled 404 Response using the Framer 404 page snapshot */
export function serve404Response(): Response {
  const { readFileSync } = require('fs') as typeof import('fs');
  const path = require('path') as typeof import('path');
  let html = readFileSync(path.join(process.cwd(), 'src/data/404.html'), 'utf-8');
  // Fix canonical to point to our domain, not framer.ai
  html = html
    .replace(/https:\/\/mahdicreates\.framer\.ai\/404/g, 'https://mahdicreates.com/404')
    .replace(/<title>[^<]*<\/title>/, '<title>Page Not Found | Mahdi Creates</title>');
  html = applyNavFix(html);
  return new Response(html, {
    status: 404,
    headers: {
      'Content-Type': 'text/html; charset=utf-8',
      'Cache-Control': 'public, s-maxage=3600, stale-while-revalidate=86400',
    },
  });
}
