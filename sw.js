// GameZipper Service Worker - Cache-first for static assets
const CACHE='gz-v1';
const PRECACHE_URLS=['/','/js/games-data.js','/gz-analytics.js','/manifest.json'];
self.addEventListener('install',e=>{
  e.waitUntil(caches.open(CACHE).then(c=>c.addAll(PRECACHE_URLS)).catch(()=>{}));
  self.skipWaiting();
});
self.addEventListener('activate',e=>{
  e.waitUntil(caches.keys().then(ks=>Promise.all(ks.filter(k=>k!==CACHE).map(k=>caches.delete(k)))).catch(()=>{}));
  self.clients.claim();
});
self.addEventListener('fetch',e=>{
  if(e.request.method!=='GET')return;
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