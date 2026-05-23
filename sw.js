// GameZipper Service Worker v3
// Network-first for dynamic data (games-data.js, HTML), cache-first for static assets
const CACHE='gz-v3';

self.addEventListener('install',e=>{
  self.skipWaiting();
});

self.addEventListener('activate',e=>{
  // Delete old caches
  e.waitUntil(caches.keys().then(ks=>Promise.all(ks.filter(k=>k!==CACHE).map(k=>caches.delete(k)))).catch(()=>{}));
  e.clients.claim();
});

self.addEventListener('fetch',e=>{
  if(e.request.method!=='GET')return;
  var url=new URL(e.request.url);

  // Network-first for game data — always fetch fresh, fall back to cache
  if(url.pathname==='/js/games-data.js'||url.pathname.endsWith('/games-data.js')){
    e.respondWith(
      fetch(e.request).then(resp=>{
        if(resp.ok){
          var clone=resp.clone();
          // Cache without query string for version-agnostic matching
          caches.open(CACHE).then(c=>{
            c.put(new Request(url.origin+'/js/games-data.js'),clone);
          });
        }
        return resp;
      }).catch(()=>{
        return caches.match(new Request(url.origin+'/js/games-data.js'));
      })
    );
    return;
  }

  // Network-first for HTML pages — always fresh, cache for offline fallback
  if(url.pathname==='/'||url.pathname==='/sitemap-page.html'||url.pathname==='/blog.html'){
    e.respondWith(
      fetch(e.request).then(resp=>{
        if(resp.ok){
          var clone=resp.clone();
          caches.open(CACHE).then(c=>c.put(e.request,clone)).catch(()=>{});
        }
        return resp;
      }).catch(()=>{
        return caches.match(e.request)||caches.match('/');
      })
    );
    return;
  }

  // Cache-first for static assets (CSS, JS, images, fonts)
  e.respondWith(caches.match(e.request).then(r=>{
    if(r)return r;
    return fetch(e.request).then(resp=>{
      if(resp.ok&&resp.type==='basic'){
        var clone=resp.clone();
        caches.open(CACHE).then(c=>c.put(e.request,clone)).catch(()=>{});
      }
      return resp;
    }).catch(()=>new Response('Offline',{status:503}));
  }));
});
