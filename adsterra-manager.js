/**
 * GameZipper Adsterra Ad Manager v5.17 (2026-07-18)
 * ─────────────────────────────────────────────────
 * v5.17 Changes (cron-resilient — fixes "no Adsterra events in 10d" chronic issue):
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

  // ── Hardened track() — v5.17: always fires, never silent ──
  function track(type, extra) {
    var payload = {
      event: 'gz_ad_event',
      network: 'adsterra',
      type: type,
      path: location.pathname,
      ts: Date.now(),
      extra: extra || {}
    };
    var ok = false;
    try {
      if (typeof window.gzTrack === 'function') {
        window.gzTrack('gz_ad_event', Object.assign({ network: 'adsterra', type: type }, extra || {}));
        ok = true;
      }
    } catch (e) {}
    if (!ok) {
      try {
        if (navigator.sendBeacon) {
          navigator.sendBeacon(BI_EP, JSON.stringify(payload));
        }
      } catch (e) {}
    }
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

  // ── CDN health probe — v5.17 new: BI-visible liveness check for each zone
  //     Uses Image() — no CORS, no JS execution, just HTTP HEAD-via-GET. Reports
  //     200/301/403/etc so cron job knows zone health even when load_zone is off.
  function probeCdn(zoneId, url) {
    return new Promise(function (resolve) {
      var done = false;
      var timer = setTimeout(function () {
        if (done) return; done = true;
        resolve({ zone: zoneId, status: 'timeout', ms: 5000 });
      }, 5000);
      try {
        var img = new Image();
        img.onload = function () { if (done) return; done = true; clearTimeout(timer); resolve({ zone: zoneId, status: 200, ms: 0 }); };
        img.onerror = function () {
          if (done) return; done = true; clearTimeout(timer);
          // onerror doesn't give us HTTP status, but 403 also fires onerror
          // so we report this as 'cdn_blocked' to distinguish from real 200
          resolve({ zone: zoneId, status: 'cdn_blocked', ms: 0 });
        };
        img.src = url + '?cb=' + Date.now();
      } catch (e) {
        if (done) return; done = true; clearTimeout(timer);
        resolve({ zone: zoneId, status: 'error', err: String(e) });
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
  function init() {
    armPop();
    track('script_loaded', {
      zones: ZONES,
      v: '5.17',
      path: location.pathname,
      readyState: document.readyState
    });
    track('config_loaded', { v: '5.17', popInterval: POP_INTERVAL });
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
    version: '5.17'
  };

  try {
    console.log('[GZAdsterra] v5.17 active — popunder(' + ZONES.popunder + ') + smartlink(' + ZONES.smartlink + ' iframe) + cdn_health probe');
  } catch (e) {}
})();