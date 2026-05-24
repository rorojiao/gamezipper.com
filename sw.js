// GameZipper Service Worker v5
// Pure game caching — Monetag push NOTIFICATIONS DISABLED per user request
// Only handles: network-first for data, cache-first for static assets
const CACHE='gz-v5';

// === Install ===
self.addEventListener('install',e=>{
  self.skipWaiting();
});

// === Activate ===
self.addEventListener('activate',e=>{
  e.waitUntil(caches.keys().then(ks=>Promise.all(ks.filter(k=>k!==CACHE).map(k=>caches.delete(k)))).catch(()=>{}));
  e.clients.claim();
});

// === Fetch: Smart caching strategy ===
self.addEventListener('fetch',e=>{
  if(e.request.method!=='GET')return;
  var url=new URL(e.request.url);

  // Skip non-http requests
  if(!url.protocol.startsWith('http'))return;

  // Cache-first for static assets (js, css, images, fonts, audio)
  if(/\.(js|css|png|jpg|jpeg|gif|svg|ico|woff2?|ttf|mp3|ogg|wav|webp)$/i.test(url.pathname)){
    e.respondWith(
      caches.open(CACHE).then(c=>
        c.match(e.request).then(r=>{
          if(r)return r;
          return fetch(e.request).then(resp=>{
            if(resp&&resp.status===200){
              var clone=resp.clone();
              c.put(e.request,clone);
            }
            return resp;
          });
        })
      ).catch(()=>fetch(e.request))
    );
    return;
  }

  // Network-first for everything else (HTML, API, etc.)
  e.respondWith(
    fetch(e.request).then(resp=>{
      if(resp&&resp.status===200&&url.origin===self.location.origin){
        var clone=resp.clone();
        caches.open(CACHE).then(c=>c.put(e.request,clone)).catch(()=>{});
      }
      return resp;
    }).catch(()=>caches.match(e.request))
  );
});
