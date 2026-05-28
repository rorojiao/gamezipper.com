// GameZipper Service Worker v8
// Pure game caching — Monetag push NOTIFICATIONS DISABLED per user request
// Strategies: cache-first (static), stale-while-revalidate with 4h max-age (HTML), network-first (API)
const CACHE='gz-v9';
const HTML_MAX_AGE=4*60*60*1000; // 4 hours in ms

// === Install ===
self.addEventListener('install',e=>{
  // Precache top 5 game pages for instant back-navigation
  var precacheURLs=[
    '/2048/',
    '/snake/',
    '/tetris/',
    '/sudoku/',
    '/solitaire/'
  ];
  e.waitUntil(
    caches.open(CACHE).then(function(c){
      return Promise.allSettled(
        precacheURLs.map(function(url){
          return c.match(url).then(function(r){
            if(r)return; // already cached
            return fetch(url).then(function(resp){
              if(resp&&resp.status===200){
                return c.put(url,resp.clone());
              }
            }).catch(function(){});
          });
        })
      );
    }).catch(function(){})
  );
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
  // With 4-hour max-age: if cache is older than 4h, prefer fresh network response
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

          // If cached is fresh (<4h), return immediately; else wait for network
          if(cached){
            var dateHeader=cached.headers.get('date');
            var age=dateHeader?(Date.now()-new Date(dateHeader).getTime()):HTML_MAX_AGE+1;
            if(age<HTML_MAX_AGE)return cached;
          }
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
