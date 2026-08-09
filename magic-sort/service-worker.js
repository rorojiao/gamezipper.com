/* Magic Sort only: no app shell or build assets are cached here. */
self.addEventListener("install", function () {
  self.skipWaiting();
});

self.addEventListener("activate", function (event) {
  event.waitUntil(self.clients.claim());
});

self.addEventListener("fetch", function (event) {
  var request = event.request;
  if (request.method !== "GET" || request.mode !== "navigate") return;

  // Always request the latest build. Do not cache index.html or use it offline.
  event.respondWith(
    fetch(request).catch(function () {
      return new Response(
        "<!doctype html><title>Magic Sort is offline</title><meta name=viewport content='width=device-width,initial-scale=1'><body style='margin:0;min-height:100vh;display:grid;place-items:center;background:#0a0a1a;color:#fff;font:600 18px system-ui,sans-serif;text-align:center'><p>Magic Sort needs a connection to load.<br><small style='color:#b8b8d4'>Reconnect and try again.</small></p></body>",
        { headers: { "Content-Type": "text/html; charset=utf-8", "Cache-Control": "no-store" } }
      );
    })
  );
});
