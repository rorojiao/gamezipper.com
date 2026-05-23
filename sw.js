// GameZipper Service Worker v2
// Cache-first for static assets, stale-while-revalidate for HTML & data
const CACHE='gz-v2';
const PRECACHE_URLS=['/','/js/games-data.js','/gz-analytics.js','/manifest.json','/og-image.webp'];
self.addEventListener('install',e=>{
  e.waitUntil(caches.open(CACHE).then(c=>c.addAll(PRECACHE_URLS)).catch(()=>{}));
  self.skipWaiting();
});
self.addEventListener('activate',e=>{
  e.waitUntil(caches.keys().then(ks=>Promise.all(ks.filter(k=>k!==CACHE).map(k=>caches.delete(k)))).catch(()=>{}));
  e.clients.claim();
});
self.addEventListener('fetch',e=>{
  if(e.request.method!=='GET')return;
  var url=new URL(e.request.url);
  // Stale-while-revalidate for HTML pages and game data (stale = fast, revalidate = fresh)
  if(url.pathname==='/'||url.pathname==='/sitemap-page.html'||url.pathname==='/js/games-data.js'){
    e.respondWith(caches.open(CACHE).then(cache=>{
      var cached=cache.match(e.request);
      var fetched=fetch(e.request).then(resp=>{
        if(resp.ok){var clone=resp.clone();cache.put(e.request,clone)}
        return resp;
      }).catch(()=>cached);
      return cached||fetched;
    }));
    return;
  }
  // Cache-first for other static assets
  e.respondWith(caches.match(e.request).then(r=>{
    if(r)return r;
    return fetch(e.request).then(resp=>{
      if(resp.ok&&resp.type==='basic'){
        var clone=resp.clone();
        caches.open(CACHE).then(c=>c.put(e.request,clone)).catch(()=>{});
      }
      return resp;
    }).catch(()=>caches.match('/'));
  }));
});