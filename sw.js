// GameZipper Service Worker v6
// Pure game caching — Monetag push NOTIFICATIONS DISABLED per user request
// Strategies: cache-first (static), stale-while-revalidate (HTML), network-first (API)
const CACHE='gz-v6';

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

  // Skip third-party requests (ads, analytics) — let browser handle
  if(url.origin!==self.location.origin)return;

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

  // Stale-while-revalidate for HTML pages (same-origin navigation)
  // Returning users get instant load from cache (~0ms TTFB), while
  // the SW fetches and caches the fresh version in the background
  if(url.pathname.endsWith('/')||url.pathname.endsWith('.html')||url.pathname==='/'){
    e.respondWith(
      caches.open(CACHE).then(c=>
        c.match(e.request).then(cached=>{
          var fetchPromise=fetch(e.request).then(resp=>{
            if(resp&&resp.status===200){
              var clone=resp.clone();
              c.put(e.request,clone).catch(()=>{});
            }
            return resp;
          }).catch(()=>cached);

          // Return cached immediately if available, else wait for network
          return cached||fetchPromise;
        })
      ).catch(()=>fetch(e.request))
    );
    return;
  }

  // Network-first for everything else
  e.respondWith(
    fetch(e.request).then(resp=>{
      if(resp&&resp.status===200){
        var clone=resp.clone();
        caches.open(CACHE).then(c=>c.put(e.request,clone)).catch(()=>{});
      }
      return resp;
    }).catch(()=>caches.match(e.request))
  );
});
