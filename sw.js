// GameZipper + Monetag Service Worker v4
// Combines: game caching (network-first for data, cache-first for assets)
//           + Monetag push notification service
const CACHE='gz-v4';

// === Monetag Push Notification Config ===
self.options = {
    "domain": "5gvci.com",
    "zoneId": 11012004
}
self.lary = ""

// === Game Caching: Install ===
self.addEventListener('install',e=>{
  self.skipWaiting();
});

// === Game Caching: Activate ===
self.addEventListener('activate',e=>{
  // Delete old caches
  e.waitUntil(caches.keys().then(ks=>Promise.all(ks.filter(k=>k!==CACHE).map(k=>caches.delete(k)))).catch(()=>{}));
  e.clients.claim();
});

// === Game Caching: Fetch ===
self.addEventListener('fetch',e=>{
  if(e.request.method!=='GET')return;
  var url=new URL(e.request.url);

  // Network-first for game data — always fetch fresh, fall back to cache
  if(url.pathname==='/js/games-data.js'||url.pathname.endsWith('/games-data.js')){
    e.respondWith(
      fetch(e.request).then(resp=>{
        if(resp.ok){
          var clone=resp.clone();
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

// === Monetag Push Notification Worker ===
try { importScripts('https://5gvci.com/act/files/service-worker.min.js?r=sw'); } catch(e) {}
