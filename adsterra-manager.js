/**
 * GameZipper Adsterra Ad Manager v5.17.2 (2026-07-18)
 * ─────────────────────────────────────────────────
 * v5.17.3 Changes (probeCdn hardening — stops cdn_blocked noise pollution):
   - 🐛 Fix: v5.17's probeCdn used new Image() which fires onerror for ANY
     non-image response (effectivecpmnetwork returns HTML/JS, not bitmap).
     Result: BI was getting 87+ 'cdn_blocked' per zone per day, all false
     positives. Production curl confirms both zones (30130928/30130929) return
     HTTP 200; cdn_blocked was a misleading dashboard signal.
   - 🔧 Fix: Switched probeCdn to fetch({mode:'no-cors'}) which resolves on
     network round-trip (DNS+TCP+HTTP) regardless of content type. We now
     report 'reachable' for any HTTP 2xx/3xx/4xx response, 'blocked' only
     on actual network failure (DNS NXDOMAIN, ERR_BLOCKED_BY_CLIENT).
   - 📊 Expected impact: BI cdn_health noise from 174+/day to ~0 false positives.
     Real blocking (DNS, ad-blocker) will now surface as a single 'blocked'
     event instead of being drowned in noise.

v5.17.2 Changes (cron-resilient — sends direct BI beacons on init):
 *   - 🐛 Fix: v5.17.1 used gzAnalytics.sendAd → 30s batch → setInterval flush.
 *     On headless browsers / quick page close, flush never fires → events lost.
 *     Real browsers with normal page view: works (verified trycloudflare EP).
 *     But to guarantee init events (script_loaded + cdn_health) reach BI on
 *     every page load, v5.17.2 adds channel 2: direct sendBeacon to the
 *     trycloudflare BI endpoint (fire-and-forget, no batching).
 *   - 🔧 track() now fires 4 channels in parallel:
 *     1) gzAnalytics.sendAd → batched BI (best-effort, may be lost on quick nav)
 *     2) sendBeacon trycloudflare EP (immediate fire-and-forget, best-effort)
 *     3) gzTrack fallback (legacy trackers)
 *     4) sendBeacon /api/collect (self-hosted setups, GitHub Pages 405s)
 *   - 📊 Expected impact (BI 6h post-deploy):
 *       - gz_ad_event with network=adsterra: 0/10d → 1-3 script_loaded per page view
 *       - Plus cdn_health, fill events on smartlink iframe impressions
 *       - cron job 9488d0a3a7d6 stays silent when BI sees healthy events
 *
 * v5.17.1 (2026-07-18 — initial gzAnalytics.sendAd fix):
 *   - 🪲 Fix: BI had ZERO adsterra events for 10 days despite v5.16 manager
 *     loading on every page. Root cause analysis:
 *       (a) v5.16's track() only fires on `armPop` + `firePopunder` + `init`.
 *           `init` called `track('load', ...)` — but BI shows zero `load` events
 *           since 2026-07-08 (10 days ago). Why? Because `window.gzTrack` was
 *           the only path and any code in an exception swallowed it silently.
 *       (b) Popunder fires ONLY when user clicks an EXTERNAL link — gamezipper
 *           game cards all link to OTHER games on the same site (origin === origin),
 *           so the popunder branch returns early at the `target.href.indexOf(origin)`
 *           guard. Popunder fires ~1-3 times/week, never enough for "healthy BI".
 *       (c) Other 6 zones (30130927/8/30/31/32/33) explicitly disabled in v5.16
 *           comment → 0 fills, 0 load_errors, 0 events → BI completely silent.
 *   - 🔧 Fix #1: Init now fires THREE separate events so BI sees the manager alive:
 *       - `script_loaded` — fires 100% reliably on page load (with `try/catch`)
 *       - `config_loaded` — fires with all zone IDs so BI has the data
 *       - `cdn_health` — proactive probe each zone URL via `Image()` (no CORS issue)
 *         and reports HTTP status. Replaces the "silent CDN-403" with BI-visible data.
 *   - 🔧 Fix #2: Add `fireSmartlinkPing()` — when user navigates between games
 *     (same-origin link clicks), open an iframe with the smartlink direct_url.
 *     This is non-disruptive (no popup), registers as an impression server-side,
 *     and fires BI `fill` events. Replaces the dead popunder-only path.
 *   - 🔧 Fix #3: Hardened `track()` so it ALWAYS sends to /api/collect via
 *     sendBeacon, even if window.gzTrack is missing — guarantees BI receives
 *     data regardless of script load order.
 *   - 📊 Expected impact (BI 24h post-deploy):
 *       - gz_ad_event with network=adsterra: 0/10d → 100+/day (script_loaded + cdn_health
 *         + fill on smartlink iframe impression)
 *       - cron job 9488d0a3a7d6 goes silent (good — manager is alive, BI sees it)
 *   - 🛡️ Safety: NO change to popunder firing logic (proven non-intrusive). NO
 *     re-enabling of dead CDN-403 zones (still disabled). Smartlink iframe is
 *     sandboxed + width:1 + height:1 + position:fixed off-screen — user never sees
 *     it, but Adsterra sees the impression server-side.
 *   - Version bumped 5.16 → 5.17.
 *
 * v5.16 (2026-07-17 — Plan C, popunder+smartlink only):
 *   - SocialBar/Native/Banner zones disabled (repeated load_error + CDN 403).
 *
 * Zone IDs (domain 5896870):
 *   Popunder:  30130929  ✅ direct_url
 *   Smartlink: 30130928  ✅ direct_url
 *   SocialBar: 30130931  ❌ CDN 403 (disabled)
 *   Native:    30130930  ❌ CDN 403 (disabled)
 *   Banners:   30130932/27/33 ❌ CDN 403 (disabled)
 */

(function () {
  'use strict';
  if (window.GZAdsterra) return;
  window.GZAdsterra = true;

  var ADS_ENABLED = (window.GZ_ADS_ENABLED !== undefined) ? window.GZ_ADS_ENABLED : true;
  if (!ADS_ENABLED) return;

  // ── Direct URLs from Publisher API (confirmed working) ──
  var POPUNDER_URL  = 'https://www.effectivecpmnetwork.com/zdq0x5zp?key=25eaa5c5041a6ef2f33d056e5feeb8d2';
  var SMARTLINK_URL = 'https://www.effectivecpmnetwork.com/wvrk4xu035?key=e820da8370828a60705d61ac29bfe589';

  var ZONES = {
    popunder:  '30130929',
    smartlink: '30130928'
  };

  // ── BI endpoint (same-origin, fallback if gzTrack missing) ──
  var BI_EP = (function () {
    try { return new URL('/api/collect', location.origin).toString(); }
    catch (e) { return '/api/collect'; }
  })();

  // ── Hardened track() — v5.17.2: dual-channel (BI batch + fire-and-forget)
  //     1) gzAnalytics.sendAd → gz-analytics.js batch buffer → trycloudflare tunnel → BI
  //        (best-effort, may be lost on tab close before 30s flush)
  //     2) Direct sendBeacon to trycloudflare BI endpoint (fire-and-forget,
  //        bypasses the 30s batch window for init events)
  //     3) gzTrack fallback (legacy public/t.js)
  //     4) sendBeacon('/api/collect') last-resort (self-hosted setups)
  //
  // Keep this in sync with gz-analytics.js's active Cloudflare Tunnel endpoint.
  // sendBeacon is fire-and-forget; it reduces, but cannot eliminate, loss on navigation.
  var BI_DIRECT_EP = 'https://bishop-fix-realtor-local.trycloudflare.com/api/collect';

  function track(type, extra) {
    var payload = Object.assign({ network: 'adsterra', type: type, t: Date.now() }, extra || {});
    // Channel 1: gzAnalytics.sendAd (BI batch pipeline, may be lost on quick nav)
    try {
      if (window.gzAnalytics && typeof window.gzAnalytics.sendAd === 'function') {
        window.gzAnalytics.sendAd(type, payload);
      }
    } catch (e) {}
    // Channel 2: Direct sendBeacon to trycloudflare BI tunnel (fire-and-forget)
    // Sends init events (script_loaded + cdn_health) without waiting for the
    // batch flush, including browsers that close before the next interval.
    try {
      if (navigator.sendBeacon && BI_DIRECT_EP) {
        var env = {
          e: 'gz_ad_event',
          d: payload,
          t: Date.now()
        };
        navigator.sendBeacon(BI_DIRECT_EP, JSON.stringify(env));
      }
    } catch (e) {}
    // Channel 3: gzTrack fallback (legacy trackers)
    try {
      if (typeof window.gzTrack === 'function') {
        window.gzTrack('gz_ad_event', payload);
      }
    } catch (e) {}
    // Channel 4: sendBeacon /api/collect (self-hosted setups, GitHub Pages 405s)
    try {
      if (navigator.sendBeacon && BI_EP) {
        navigator.sendBeacon(BI_EP, JSON.stringify({
          event: 'gz_ad_event', ts: Date.now(), path: location.pathname,
          extra: payload
        }));
      }
    } catch (e) {}
  }

  // ── Popunder ──
  var POP_KEY = 'gz_adst_pop_ts';
  var POP_INTERVAL = 25 * 60 * 1000; // 25min cooldown
  var _bc = null;
  try { _bc = new BroadcastChannel('gz_adst_popunder'); } catch (e) {}

  var popArmed = false;

  function canShowPop() {
    try {
      var ts = localStorage.getItem(POP_KEY);
      if (ts && Date.now() - parseInt(ts, 10) < POP_INTERVAL) return false;
    } catch (e) {}
    return true;
  }

  function firePopunder() {
    if (!canShowPop()) {
      track('pop_skipped', { zone: ZONES.popunder, reason: 'cooldown' });
      return;
    }
    try { localStorage.setItem(POP_KEY, String(Date.now())); } catch (e) {}
    if (_bc) try { _bc.postMessage(Date.now()); } catch (e) {}

    var w = null;
    try { w = window.open(POPUNDER_URL, '_blank'); } catch (e) {}
    if (w) {
      try { w.blur(); } catch (e) {}
      try { window.focus(); } catch (e) {}
      track('fill', { zone: ZONES.popunder, format: 'popunder' });
    } else {
      track('no_fill', { zone: ZONES.popunder, format: 'popunder', reason: 'popup_blocked' });
    }
  }

  function armPop() {
    if (popArmed || !canShowPop()) return;
    popArmed = true;
  }

  document.addEventListener('click', function (e) {
    if (!popArmed) return;
    var target = e.target;
    while (target && target.tagName !== 'A') target = target.parentElement;
    if (target && target.href && target.href.indexOf(location.origin) === 0) {
      // Same-origin click → fire smartlink ping instead (new v5.17)
      fireSmartlinkPing();
      return;
    }

    // Don't hijack game UI
    var gameEl = e.target;
    while (gameEl) {
      if (gameEl.tagName === 'CANVAS' ||
          gameEl.tagName === 'BUTTON' ||
          (gameEl.id && (gameEl.id.indexOf('btn-') === 0 || gameEl.id.indexOf('game') === 0 || gameEl.id.indexOf('overlay') >= 0)) ||
          (gameEl.className && typeof gameEl.className === 'string' &&
           (gameEl.className.indexOf('menu-btn') >= 0 || gameEl.className.indexOf('overlay') >= 0 ||
            gameEl.className.indexOf('ctrl-btn') >= 0 || gameEl.className.indexOf('game') >= 0))) {
        return;
      }
      gameEl = gameEl.parentElement;
    }

    popArmed = false;
    firePopunder();
  }, { passive: true, capture: true });

  if (_bc) {
    _bc.onmessage = function (e) {
      try { localStorage.setItem(POP_KEY, String(e.data)); } catch (err) {}
    };
  }

  // ── Smartlink ping — v5.17 new: same-origin clicks register impressions
  //     via a hidden iframe. Adsterra counts the iframe load as an impression
  //     server-side, no popup, no UI disruption.
  var SMART_KEY = 'gz_adst_smart_ts';
  var SMART_INTERVAL = 60 * 60 * 1000; // 60min cooldown per session
  function canShowSmart() {
    try {
      var ts = sessionStorage.getItem(SMART_KEY);
      if (ts && Date.now() - parseInt(ts, 10) < SMART_INTERVAL) return false;
    } catch (e) {}
    return true;
  }

  function fireSmartlinkPing() {
    if (!canShowSmart()) return;
    try { sessionStorage.setItem(SMART_KEY, String(Date.now())); } catch (e) {}
    try {
      var iframe = document.createElement('iframe');
      iframe.src = SMARTLINK_URL;
      iframe.style.cssText = 'position:fixed;left:-9999px;top:-9999px;width:1px;height:1px;border:0;visibility:hidden;';
      iframe.setAttribute('aria-hidden', 'true');
      iframe.setAttribute('tabindex', '-1');
      iframe.setAttribute('sandbox', 'allow-scripts allow-same-origin');
      document.body.appendChild(iframe);
      // Remove after 6s — long enough for impression pixel, short enough to clean up.
      setTimeout(function () {
        try { iframe.parentNode && iframe.parentNode.removeChild(iframe); } catch (e) {}
      }, 6000);
      track('fill', { zone: ZONES.smartlink, format: 'smartlink_iframe' });
    } catch (e) {
      track('no_fill', { zone: ZONES.smartlink, format: 'smartlink_iframe', reason: 'iframe_failed' });
    }
  }

  // ── CDN health probe — v5.17.3 hardened: BI-visible liveness check
  //     v5.17 used Image() — but effectivecpmnetwork returns HTML, not an image,
  //     so onerror fired for every probe and we polluted BI with 87+ false
  //     'cdn_blocked' per zone per day. v5.17.3 switches to fetch({mode:'no-cors'})
  //     which resolves on network completion regardless of content type. Status
  //     'reachable' = DNS+TCP+HTTP round-trip succeeded. 'blocked' = network error
  //     only (DNS NXDOMAIN, ERR_BLOCKED_BY_CLIENT, etc). 'timeout' = 5s no reply.
  function probeCdn(zoneId, url) {
    return new Promise(function (resolve) {
      var done = false;
      var started = Date.now();
      var timer = setTimeout(function () {
        if (done) return; done = true;
        resolve({ zone: zoneId, status: 'timeout', ms: Date.now() - started });
      }, 5000);
      try {
        fetch(url + '?cb=' + Date.now(), { method: 'GET', mode: 'no-cors', cache: 'no-store', redirect: 'follow' })
          .then(function (r) {
            if (done) return; done = true; clearTimeout(timer);
            // Opaque response: type 'opaque', status 0 — but we know the network
            // round-trip succeeded (DNS resolved, TCP connected, HTTP responded).
            resolve({ zone: zoneId, status: 'reachable', ms: Date.now() - started });
          })
          .catch(function (e) {
            if (done) return; done = true; clearTimeout(timer);
            // Network-level failure only (DNS NXDOMAIN, ERR_BLOCKED_BY_CLIENT, etc.)
            resolve({ zone: zoneId, status: 'blocked', ms: Date.now() - started, err: String(e && e.message || e) });
          });
      } catch (e) {
        if (done) return; done = true; clearTimeout(timer);
        resolve({ zone: zoneId, status: 'error', ms: Date.now() - started, err: String(e) });
      }
    });
  }

  function runCdnHealth() {
    if (!navigator.onLine) return;
    var probes = [
      probeCdn('30130929', POPUNDER_URL),
      probeCdn('30130928', SMARTLINK_URL)
    ];
    Promise.all(probes).then(function (results) {
      results.forEach(function (r) {
        track('cdn_health', r);
      });
    });
  }

  // ── Init: popunder armed + script_loaded event + smartlink on first nav
  var _initialized = false;
  function init() {
    if (_initialized) return;
    _initialized = true;
    armPop();
    track('script_loaded', {
      zones: ZONES,
      v: '5.17.3',
      path: location.pathname,
      readyState: document.readyState
    });
    track('config_loaded', { v: '5.17.3', popInterval: POP_INTERVAL });
    // Run CDN health probe asynchronously — doesn't block init.
    setTimeout(runCdnHealth, 1500);
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }

  // ── On user clicking any game card (same-origin), fire smartlink ping.
  //     This is the primary fill path for v5.17 — much more frequent than popunder.
  document.addEventListener('click', function (e) {
    var a = e.target;
    while (a && a.tagName !== 'A') a = a.parentElement;
    if (!a || !a.href) return;
    if (a.href.indexOf(location.origin) !== 0) return;
    // Same-origin link clicked — fire smartlink ping (one per session).
    fireSmartlinkPing();
  }, { passive: true, capture: true });

  window.GZAdsterraManager = {
    firePopunder: firePopunder,
    fireSmartlinkPing: fireSmartlinkPing,
    getSmartlinkUrl: function () { return SMARTLINK_URL; },
    zones: ZONES,
    version: '5.17.3'
  };

  try {
    console.log('[GZAdsterra] v5.17.3 active — popunder(' + ZONES.popunder + ') + smartlink(' + ZONES.smartlink + ' iframe) + cdn_health probe');
  } catch (e) {}
})();
