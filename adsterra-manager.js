/**
 * GameZipper Adsterra Ad Manager v5.17.4 (2026-07-26)
 * ─────────────────────────────────────────────────
 * v5.17.4 Changes (endpoint hygiene — kills dead-tunnel console spam):
 *   - 🐛 Fix: channel 2 pointed at a hardcoded tunnel URL
 *     (bishop-fix-realtor-local.trycloudflare.com) that died on every
 *     cloudflared restart -> ERR_NAME_NOT_RESOLVED on every page load.
 *     Now resolved lazily from window.__GZ_COLLECT_EP (published by
 *     gz-analytics.js, kept fresh by tunnel-watchdog.sh).
 *   - 🗑️ Removed channel 4 (same-origin /api/collect beacon): GitHub Pages
 *     is static hosting, that endpoint always returns 405 and only produced
 *     console error spam. Ad events still flow via channels 1-3.
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

  // ── Direct URLs from Publisher API ──
  var POPUNDER_URL  = 'https://www.effectivecpmnetwork.com/zdq0x5zp?key=25eaa5c5041a6ef2f33d056e5feeb8d2';
  // R1003 (2026-10-28): the smartlink URL below was a HAND-COPIED stale form.
  // Adsterra's own Publisher API (GET /publisher/placements.json) is the
  // authority for which URL serves placement 30130928, and it returns:
  //     "id": 30130928, "title": "Smartlink_1",
  //     "direct_url": "https://araplhn.org/4/e820da8370828a60705d61ac29bfe589"
  // The old effectivecpmnetwork.com/wvrk4xu035?key=<same key> form is NOT the
  // current direct_url for this placement. It still answered HTTP 200 (an
  // empty body), so every client-side signal looked healthy -- but the
  // request was never attributed to placement 30130928, so it never billed:
  //   GET /publisher/stats.json?group_by=placement  (365d and all-time)
  //     -> 30130929 Popunder_1 : 1556 impressions, $9.17   (bills)
  //     -> 30130928 Smartlink_1:    0 impressions, $0.00   (365 days, ZERO)
  // while BI logged ~1466 distinct smartlink "fill" events since 2026-07-18.
  // Those BI fills were PHANTOM: fireSmartlinkPing() calls track('fill')
  // unconditionally right after appendChild(), never verifying that Adsterra
  // served or attributed anything. The whole R976 exit-intent "recovery" was
  // measured against that phantom metric and produced $0 revenue.
  // Never hand-copy a zone URL again -- read direct_url from the API.
  var SMARTLINK_URL = 'https://araplhn.org/4/e820da8370828a60705d61ac29bfe589';

  var ZONES = {
    popunder:  '30130929',
    smartlink: '30130928'
  };

  // ── BI endpoint (resolved lazily from gz-analytics.js — watchdog-rotated) ──
  // 2026-07-26: the old hardcoded tunnel URL (bishop-fix-realtor-local) died on
  // every cloudflared restart -> ERR_NAME_NOT_RESOLVED spam + lost ad events.
  // window.__GZ_COLLECT_EP is published by gz-analytics.js and kept current by
  // tunnel-watchdog.sh, so this channel now follows rotations automatically.
  function biDirectEP() { return window.__GZ_COLLECT_EP || ''; }

  // ── Bot referrer blocklist (R966, 2026-10-20) ──
  // adsterra-manager.js track() is a THIRD BI path that the R962 two-layer gate
  // never covered: channel 2 fires navigator.sendBeacon straight at the tunnel EP,
  // bypassing gz-analytics.js ps() and monetag-manager.js trackAdEvent() entirely.
  // Proven leak in production E2E: a blocked rotating-bot referrer
  // (unseen-future-9f3a2b1c.netlify.app) still shipped 4 adsterra events
  // (script_loaded, config_loaded, 2x cdn_health). cdn_health is the single
  // largest gz_ad_event type at 8,147/7d, so bot traffic was materially
  // inflating the ad-side BI volume. Gate at track() entry covers all of it.
  // Kept in sync with gz-analytics.js + monetag-manager.js (see .audit/test-r966-botblock.js).
  var BOT_REFERRERS = [
    'dfvvf.pages.dev', 'glasspane.pages.dev', 'varonexa.pages.dev',
    'assignment-notebook.netlify.app', 'playroomapi.netlify.app', 'vamp-games.netlify.app',
    'vboard-delta.vercel.app', 'game-web-sandy-gamma.vercel.app',
    'harveyspecter16.github.io', 'coolhiglers.github.io',
    'shoaibbilal125134-crypto.github.io', 'sron2527.github.io', 'mskennedyj.github.io'
  ];
  var AUTO_DEPLOY_RE = /-[0-9a-f]{6,12}\.(?:netlify\.app|vercel\.app|pages\.dev|web\.app|onrender\.com|now\.sh)$/;
  function isBotReferrer(ref) {
    if (!ref) return false;
    var m = ref.match(/^https?:\/\/([^/?#:]+)/i);
    if (!m) return false;
    var host = m[1].toLowerCase();
    for (var i = 0; i < BOT_REFERRERS.length; i++) {
      if (host === BOT_REFERRERS[i] || host.endsWith('.' + BOT_REFERRERS[i])) return true;
    }
    return AUTO_DEPLOY_RE.test(host);
  }

  // ── Hardened track() — v5.17.3: dual-channel (BI batch + fire-and-forget)
  //     1) gzAnalytics.sendAd → gz-analytics.js batch buffer → trycloudflare tunnel → BI
  //        (best-effort, may be lost on tab close before 30s flush)
  //     2) Direct sendBeacon to the watchdog-rotated tunnel endpoint
  //        (fire-and-forget, bypasses the 30s batch window for init events)
  //     3) gzTrack fallback (legacy public/t.js)
  //
  // 2026-07-26 v5.17.3: removed channel 4 (same-origin /api/collect beacon) —
  // GitHub Pages is static hosting, that endpoint always 405s and only produced
  // console error spam. Channel 2 now resolves the tunnel lazily via
  // window.__GZ_COLLECT_EP so it survives watchdog rotations.
  function track(type, extra) {
    // R966: drop the whole event (all 3 channels) for known bot-farm referrers.
    if (isBotReferrer(document.referrer || '')) {
      try { window.__gzAdsterraBotDrop = (window.__gzAdsterraBotDrop || 0) + 1; } catch (e) {}
      return;
    }
    var payload = Object.assign({ network: 'adsterra', type: type, t: Date.now() }, extra || {});
    // Channel 1: gzAnalytics.sendAd (BI batch pipeline, may be lost on quick nav)
    try {
      if (window.gzAnalytics && typeof window.gzAnalytics.sendAd === 'function') {
        window.gzAnalytics.sendAd(type, payload);
      }
    } catch (e) {}
    // Channel 2: Direct sendBeacon to the active BI tunnel (fire-and-forget)
    // Sends init events (script_loaded + cdn_health) without waiting for the
    // batch flush, including browsers that close before the next interval.
    try {
      var ep = biDirectEP();
      if (navigator.sendBeacon && ep) {
        var env = {
          e: 'gz_ad_event',
          d: payload,
          t: Date.now(),
          // R975: this envelope shipped WITHOUT the base() block that
          // gz-analytics.js attaches to every event. server.py then had no
          // path / device / browser to read, so EVERY channel-2 ad event was
          // filed on "/" with an empty visitor identity (11.7k ad events/7d
          // mis-attributed; homepage cdn_health was actually site-wide).
          path: location.pathname,
          site: location.hostname,
          device: /Mobi|Android|iPhone|iPad|iPod/i.test(navigator.userAgent) ? 'Mobile'
                  : /Tablet|iPad/i.test(navigator.userAgent) ? 'Tablet' : 'Desktop',
          screen: (window.innerWidth || 0) + 'x' + (window.innerHeight || 0),
          browser: navigator.userAgent || '',
          os: navigator.platform || '',
          referrer: document.referrer || ''
        };
        // Reuse the visitor identity gz-analytics.js already generated so
        // channel-2 events join the same UV/session series as channel 1.
        try {
          env.vid = localStorage.getItem('gz_vid') || '';
          env.sid = sessionStorage.getItem('gz_sid') || '';
        } catch (e2) {}
        navigator.sendBeacon(ep, JSON.stringify(env));
      }
    } catch (e) {}
    // Channel 3: gzTrack fallback (legacy trackers)
    try {
      if (typeof window.gzTrack === 'function') {
        window.gzTrack('gz_ad_event', payload);
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
      // R1003 (2026-10-28): this used to be track('fill', ...) fired UNCONDITIONALLY
      // the instant the iframe element was appended. It proved only that we created
      // a DOM node — never that Adsterra served or ATTRIBUTED anything.
      //
      // Consequence (measured): placement 30130928 logged ~980 "fill" events in
      // 14 days while Adsterra's own API reported 0 impressions / $0.00 for that
      // placement over 365 days. The BI "fill" metric was 100% PHANTOM, and the
      // whole R976 exit-intent "recovery" was measured against that phantom —
      // so a dead placement looked like a healthy one for a year.
      //
      // A Smartlink is a DIRECT link: revenue is booked server-side when the
      // offer is served AND attributed to our zone. Nothing on the client can
      // confirm that. So report what we can actually prove — that we REQUESTED
      // an ad — under a name that cannot be mistaken for money:
      //   fill_attempt = we asked Adsterra for an ad (NOT a billed impression)
      //   fill         = reserved for a delivery we can actually evidence
      // The per-placement comparison in ad_revenue_daily_facts.sh now diffs
      // claimed attempts against Adsterra's official per-placement impressions,
      // so a phantom can never masquerade as revenue again.
      track('fill_attempt', { zone: ZONES.smartlink, format: 'smartlink_iframe' });
    } catch (e) {
      track('no_fill', { zone: ZONES.smartlink, format: 'smartlink_iframe', reason: 'iframe_failed' });
    }
  }

  // ── CDN network-reachability probe — v5.17.4 (R987)
  //     v5.17 used Image() — but effectivecpmnetwork returns HTML, not an image,
  //     so onerror fired for every probe and we polluted BI with 87+ false
  //     'cdn_blocked' per zone per day. v5.17.3 switched to fetch({mode:'no-cors'})
  //     which resolves on network completion regardless of content type.
  //
  //     R987 CORRECTION — v5.17.3's status names were false greens:
  //     a no-cors fetch returns an OPAQUE response. Its body and status code are
  //     unreadable BY DESIGN, so v5.17.3 reported status:'reachable' for:
  //        · a healthy zone serving real ad HTML
  //        · HTTP 200 + the 118-byte "Anonymous Proxy detected." policy page
  //        · HTTP 403 / 404 / 410 (revoked key, publisher suspension)
  //        · HTTP 500 from a dead origin
  //     All four are indistinguishable in the browser. Measured 2026-10-23 from
  //     the patrol host: both zones return HTTP 200 / Content-Length 118 /
  //     "Anonymous Proxy detected." — a response that serves no ad at all, yet
  //     was logged as 'reachable'. This is a TRANSPORT probe and can only ever
  //     prove DNS+TCP+HTTP completed. It must never be read as zone health.
  //
  //     The rename is the fix: 'reachable' implied "an ad was servable" and the
  //     Adsterra cron (9488d0a3a7d6) gated on it as a zone-liveness signal, so a
  //     total zone outage would have stayed green indefinitely. Real zone health
  //     now comes from scripts/adsterra_zone_probe.py (server-side, reads the
  //     body, 4-state verdict) — see ZONE_HEALTH_PROBE below.
  //
  //     Keep in sync with gamezipper-tools/adsterra-manager.js.
  var ZONE_HEALTH_PROBE = 'scripts/adsterra_zone_probe.py'; // server-side authority
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
            // Opaque response: type 'opaque', status 0 — we know the network
            // round-trip succeeded (DNS resolved, TCP connected, HTTP responded)
            // and NOTHING more. `transport_ok` is the honest name; `reachable`
            // was read by dashboards as "zone serving ads".
            resolve({
              zone: zoneId, status: 'transport_ok', ms: Date.now() - started,
              scope: 'transport_only', authority: 'see ' + ZONE_HEALTH_PROBE
            });
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
      v: '5.17.4',
      path: location.pathname,
      readyState: document.readyState
    });
    track('config_loaded', { v: '5.17.4', popInterval: POP_INTERVAL });
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

  // ── Exit-intent smartlink (R976, 2026-10-23) ───────────────────────────────
  // Why this exists: popunder + smartlink are the ONLY live revenue. AdSense is
  // disapproved (revenue = 0, appeal pending) and the Monetag token is dead, so
  // these two zones are the entire business.
  //
  // Both were gated behind a click that walks up to an <a> element. Game pages
  // are canvas-driven — the user clicks the canvas, not links — so the game
  // directories (269 pages, 2194 clean PV = 58% of sitewide 7d traffic)
  // returned only 0.109 fills/PV, versus 0.264 on /blog and 0.326 on the
  // homepage. The monetizable intent (user finished playing and is leaving)
  // was never being converted.
  //
  // This adds exit intent as a SECOND trigger feeding the SAME canShowSmart()
  // budget: one impression per 60 minutes per session, exactly as before. It
  // does NOT raise frequency — if a same-origin <a> click already fired the
  // ping this session, the sessionStorage timestamp makes this a no-op. Same
  // zone, same billing, same cap.
  //
  // Smartlink rather than popunder deliberately: the popunder needs
  // window.open, which browsers popup-block (BI logs it as
  // no_fill reason=popup_blocked) and which steals a visible tab. The
  // smartlink is a 1x1 hidden iframe Adsterra counts server-side — same
  // money, no user-visible cost, no interruption of the play loop.
  var EXIT_MIN_DWELL_MS = 30000;
  var _gzPageLoadAt = Date.now();

  document.addEventListener('mouseout', function (e) {
    // Only a genuine leave-the-window gesture, not movement between elements.
    if (e.relatedTarget !== null && e.relatedTarget !== undefined) return;
    // Same heuristic monetag-manager v5.12 settled on: clientY > 30 means the
    // pointer left from the middle/bottom, which is not exit intent. Browsers
    // report negative OR 0-30 when leaving through the top edge — both are the
    // gesture we want to catch.
    if (typeof e.clientY === 'number' && e.clientY > 30) return;
    // Don't monetise an instant bounce.
    if (Date.now() - _gzPageLoadAt < EXIT_MIN_DWELL_MS) return;
    fireSmartlinkPing();
  }, { passive: true });

  window.GZAdsterraManager = {
    firePopunder: firePopunder,
    fireSmartlinkPing: fireSmartlinkPing,
    getSmartlinkUrl: function () { return SMARTLINK_URL; },
    zones: ZONES,
    version: '5.18.0-exitintent'
  };

  try {
    console.log('[GZAdsterra] v5.17.4 active — popunder(' + ZONES.popunder + ') + smartlink(' + ZONES.smartlink + ' iframe) + cdn_health probe');
  } catch (e) {}
})();
