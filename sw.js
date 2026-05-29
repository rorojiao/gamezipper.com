// GameZipper Service Worker v14
// Pure game caching — Monetag push NOTIFICATIONS DISABLED per user request
// Strategies: cache-first (static), stale-while-revalidate with 4h max-age (HTML), network-first (API)
// v12: navigationPreload for faster TTFB on navigation requests
const CACHE='gz-v15';
const HTML_MAX_AGE=4*60*60*1000; // 4 hours in ms

// === Install ===
self.addEventListener('install',e=>{
  // Enable navigation preload for faster TTFB on navigation
  if(self.registration.navigationPreload){
    e.waitUntil(self.registration.navigationPreload.enable());
  }

  // Precache top 5 game pages + offline fallback for instant access
  var precacheURLs=[
    '/',
    '/offline.html',
    '/2048/',
    '/snake/',
    '/tetris/',
    '/sudoku/',
    '/solitaire/',
    '/chess/',
    '/cryptograms/',
    '/crossmath/',
    '/100-doors/',
    '/who-is/'
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
  e.waitUntil(
    caches.keys().then(function(ks){
      // Clean old caches
      return Promise.all(ks.filter(function(k){return k!==CACHE;}).map(function(k){return caches.delete(k);}));
    }).catch(function(){})
  );
  e.clients.claim();

  // Prune oversized cache entries (keep cache under 50MB)
  e.waitUntil(
    caches.open(CACHE).then(function(c){
      return c.keys().then(function(keys){
        // If cache has >200 entries, remove oldest ones beyond 200
        if(keys.length<=200)return;
        var toDelete=keys.slice(200);
        return Promise.all(toDelete.map(function(req){return c.delete(req);}));
      });
    }).catch(function(){})
  );

  // Notify all clients about the update
  e.waitUntil(
    self.clients.matchAll().then(function(clients){
      clients.forEach(function(client){
        client.postMessage({type:'SW_UPDATED',version:CACHE});
      });
    })
  );
});

// === Fetch: Smart caching strategy with offline fallback ===
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
      caches.open(CACHE).then(function(c){
        return c.match(e.request).then(function(r){
          if(r)return r;
          return fetch(e.request).then(function(resp){
            if(resp&&resp.status===200){
              var clone=resp.clone();
              c.put(e.request,clone);
            }
            return resp;
          });
        });
      }).catch(function(){return fetch(e.request);})
    );
    return;
  }

  // Stale-while-revalidate for HTML pages (same-origin navigation)
  // With 4-hour max-age: if cache is older than 4h, prefer fresh network response
  // Uses navigationPreload for faster TTFB when network response is needed
  if(url.pathname.endsWith('/')||url.pathname.endsWith('.html')||url.pathname==='/'){
    e.respondWith(
      caches.open(CACHE).then(function(c){
        return c.match(e.request).then(function(cached){
          // Use navigationPreload response if available, otherwise fetch
          var networkPromise=(e.preloadResponse||fetch(e.request)).then(function(resp){
            if(resp&&resp.status===200){
              var clone=resp.clone();
              c.put(e.request,clone).catch(function(){});
            }
            return resp;
          }).catch(function(){return cached;});

          // If cached is fresh (<4h), return immediately; else wait for network
          if(cached){
            var dateHeader=cached.headers.get('date');
            var age=dateHeader?(Date.now()-new Date(dateHeader).getTime()):HTML_MAX_AGE+1;
            if(age<HTML_MAX_AGE)return cached;
          }
          return cached||networkPromise;
        });
      }).catch(function(){
        // Offline fallback: serve offline.html for navigation requests
        if(e.request.mode==='navigate'){
          return caches.match('/offline.html');
        }
        return fetch(e.request);
      })
    );
    return;
  }

  // Network-first for everything else
  e.respondWith(
    fetch(e.request).then(function(resp){
      if(resp&&resp.status===200){
        var clone=resp.clone();
        caches.open(CACHE).then(function(c){c.put(e.request,clone);}).catch(function(){});
      }
      return resp;
    }).catch(function(){return caches.match(e.request);})
  );
});
