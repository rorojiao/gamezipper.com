/**
 * GameZipper Unified Ad Manager v2
 * ───────────────────────────────
 * MultiTag zones (all MULTI = auto-anti-adblock + anti-fraud):
 *   - Popunder:         11012001
 *   - In-Page Push:     11012002
 *   - Vignette Banner:  11012003
 *   - Push Notifications: 11012004
 *
 * Strategy:
 *   1. Popunder: hub pages → first user click; game pages → gameover/level-complete click
 *      Frequency: every 30 min (localStorage, cross-tab via BroadcastChannel)
 *   2. In-Page Push: all pages → 5s delay, once per page
 *   3. Vignette Banner: game pages → 60s idle or gameover, hub → 30s
 *   4. Push Notifications: all pages → 15s delay, once per session
 *   5. AdSense Auto Ads: game pages → 2s after first interaction
 *   6. Container ads (below game / mid-grid): Monetag ad-provider
 */
(function () {
  'use strict';
  if (window.GZAdManager) return;
  window.GZAdManager = true;

  /* ── Zone Configuration (MultiTag — all MULTI) ────────────── */
  var ZONES = {
    popunder:    11012001,
    inpagePush:  11012002,
    vignette:    11012003,
    pushNotif:   11012004
  };

  /* ── Helpers ──────────────────────────────────────────────── */
  function isGamePage() {
    var p = location.pathname;
    return p !== '/' && !/\.[a-z]{2,5}$/.test(p) && !/\/games\.html$/.test(p) && !/\/blog\.html$/.test(p);
  }

  function isHubPage() {
    return location.pathname === '/';
  }

  /* ── BroadcastChannel for cross-tab frequency cap ─────────── */
  var _bc = null;
  try { _bc = new BroadcastChannel('gz_ad_popunder'); } catch(e) {}
  function broadcastPopShown() {
    if (_bc) try { _bc.postMessage(Date.now()); } catch(e) {}
  }
  if (_bc) {
    _bc.onmessage = function(e) {
      try { localStorage.setItem(POP_KEY, String(e.data)); } catch(e2) {}
    };
  }

  /* ── 1. Popunder (zone 11012001) — CLICK-TRIGGERED ──────── */
  var POP_KEY = 'gz_pop_ts';
  var POP_INTERVAL = 30 * 60 * 1000; // 30 minutes
  var popLoaded = false;
  var popPending = false; // true = waiting for user click to trigger

  function canShowPopunder() {
    try {
      var ts = localStorage.getItem(POP_KEY);
      if (ts && Date.now() - parseInt(ts, 10) < POP_INTERVAL) return false;
    } catch (e) {}
    return true;
  }

  function markPopunderShown() {
    try { localStorage.setItem(POP_KEY, String(Date.now())); } catch (e) {}
    broadcastPopShown();
  }

  function loadPopunder() {
    if (popLoaded || !canShowPopunder()) return;
    popLoaded = true;
    popPending = false;
    markPopunderShown();
    var s = document.createElement('script');
    s.async = true;
    s.setAttribute('data-zone', String(ZONES.popunder));
    s.src = 'https://a.magsrv.com/ad-provider.js?zone=' + ZONES.popunder;
    document.head.appendChild(s);
    console.log('[GZAdManager] Popunder zone ' + ZONES.popunder + ' triggered');
  }

  function armPopunder() {
    // Arm popunder for next click. Modern browsers block non-click popunders,
    // so we MUST load the script inside a click handler.
    if (popLoaded || !canShowPopunder()) return;
    popPending = true;
  }

  // Global click listener — if popunder is armed, fire it on next click
  document.addEventListener('click', function () {
    if (popPending) {
      popPending = false;
      loadPopunder();
    }
  }, { passive: true });

  /* ── 2. In-Page Push (zone 11012002) ─────────────────────── */
  var ippLoaded = false;

  function loadInPagePush() {
    if (ippLoaded) return;
    ippLoaded = true;
    var s = document.createElement('script');
    s.async = true;
    s.setAttribute('data-zone', String(ZONES.inpagePush));
    s.src = 'https://a.magsrv.com/ad-provider.js?zone=' + ZONES.inpagePush;
    document.head.appendChild(s);
    console.log('[GZAdManager] In-Page Push zone ' + ZONES.inpagePush + ' loaded');
  }

  /* ── 3. Vignette Banner (zone 11012003) ──────────────────── */
  var vignetteLoaded = false;

  function loadVignette() {
    if (vignetteLoaded) return;
    vignetteLoaded = true;
    var s = document.createElement('script');
    s.async = true;
    s.setAttribute('data-zone', String(ZONES.vignette));
    s.src = 'https://a.magsrv.com/ad-provider.js?zone=' + ZONES.vignette;
    document.head.appendChild(s);
    console.log('[GZAdManager] Vignette Banner zone ' + ZONES.vignette + ' loaded');
  }

  /* ── 4. Push Notifications (zone 11012004) ───────────────── */
  var pushLoaded = false;

  function loadPushNotif() {
    if (pushLoaded) return;
    pushLoaded = true;
    var s = document.createElement('script');
    s.async = true;
    s.setAttribute('data-zone', String(ZONES.pushNotif));
    s.src = 'https://a.magsrv.com/ad-provider.js?zone=' + ZONES.pushNotif;
    document.head.appendChild(s);
    console.log('[GZAdManager] Push Notifications zone ' + ZONES.pushNotif + ' loaded');
  }

  /* ── 5. AdSense Auto Ads ─────────────────────────────────── */
  var AD_CLIENT = 'ca-pub-8346383990981353';
  var adsenseLoaded = false;

  function injectAdSenseCSS() {
    if (document.getElementById('gz-adsense-safety')) return;
    var s = document.createElement('style');
    s.id = 'gz-adsense-safety';
    s.textContent = [
      'ins.adsbygoogle { max-height: 90px !important; overflow: hidden !important; }',
      '.google-ad-slot, [id^="google_ads_iframe"] { max-height: 50px !important; }',
      '#game-canvas, canvas, .game-container, .game-wrap, #game-area, .game-area { position: relative; z-index: 10 !important; }',
      '.google-right-rail, .google-left-rail { max-width: 160px !important; }'
    ].join('\n');
    document.head.appendChild(s);
  }

  function loadAdSense() {
    if (adsenseLoaded) return;
    adsenseLoaded = true;
    injectAdSenseCSS();
    var s = document.createElement('script');
    s.async = true;
    s.src = 'https://pagead2.googlesyndication.com/pagead/js/adsbygoogle.js?client=' + AD_CLIENT;
    s.crossOrigin = 'anonymous';
    document.head.appendChild(s);
    console.log('[GZAdManager] AdSense auto ads loaded');
  }

  /* ── 6. Container ads (below game / mid-grid) ────────────── */
  function fillContainerAd(containerId, delay) {
    setTimeout(function () {
      var container = document.getElementById(containerId);
      if (!container || container.getAttribute('data-filled')) return;
      container.setAttribute('data-filled', '1');
      var s = document.createElement('script');
      s.async = true;
      s.setAttribute('data-zone', String(ZONES.inpagePush));
      s.src = 'https://a.magsrv.com/ad-provider.js?zone=' + ZONES.inpagePush;
      container.appendChild(s);
      console.log('[GZAdManager] Container ad filled: ' + containerId);
    }, delay);
  }

  /* ── Page-type Routing ────────────────────────────────────── */

  if (isHubPage()) {
    /* ── Homepage ── */
    // Popunder: arm for next click (must be user-initiated)
    armPopunder();
    // In-Page Push: 2s delay
    setTimeout(loadInPagePush, 2000);
    // Vignette Banner: 30s delay (user has browsed a bit)
    setTimeout(loadVignette, 30000);
    // Push Notifications: 15s delay
    setTimeout(loadPushNotif, 15000);
    // Mid-grid container ad
    fillContainerAd('gz-ad-mid-grid', 2500);

  } else if (isGamePage()) {
    /* ── Game Page ── */
    // Popunder: arm for gameover/level-complete clicks
    armPopunder();
    window.addEventListener('gameover', function () {
      armPopunder(); // re-arm in case frequency cap expired
    });
    window.addEventListener('level-complete', function () {
      armPopunder(); // re-arm
    });
    // Fallback: 120s arm for idle/endless games
    setTimeout(function () {
      if (!popLoaded) armPopunder();
    }, 120000);

    // In-Page Push: 5s delay (corner notification, safe for games)
    setTimeout(loadInPagePush, 5000);

    // Vignette Banner: 60s delay or gameover
    window.addEventListener('gameover', function () {
      setTimeout(loadVignette, 1000);
    });
    setTimeout(function () {
      if (!vignetteLoaded) loadVignette();
    }, 60000);

    // Push Notifications: 20s delay
    setTimeout(loadPushNotif, 20000);

    // AdSense: 2s after first interaction (click/touch/key)
    var adsenseEngaged = false;
    function onAdsenseEngage() {
      if (adsenseEngaged) return;
      adsenseEngaged = true;
      setTimeout(loadAdSense, 2000);
    }
    document.addEventListener('click', onAdsenseEngage, { once: true, passive: true });
    document.addEventListener('touchstart', onAdsenseEngage, { once: true, passive: true });
    document.addEventListener('keydown', onAdsenseEngage, { once: true, passive: true });
    // Fallback: 10s with no interaction
    setTimeout(function () {
      if (!adsenseLoaded) loadAdSense();
    }, 10000);

    // Below-game container ad
    fillContainerAd('gz-ad-below-game', 3000);

  } else {
    /* ── Other pages (about, privacy, blog, category, etc.) ── */
    armPopunder();
    setTimeout(loadInPagePush, 2000);
    setTimeout(loadVignette, 20000);
    setTimeout(loadPushNotif, 10000);
  }

  /* ── Backward-compatible API ──────────────────────────────── */
  window.GZMonetagSafe = {
    init: function () {},
    loadNow: loadPopunder,
    maybeLoad: loadPopunder,
    hasBlockingOverlay: function () { return false; },
    disabled: false,
    mode: 'unified-manager-v2'
  };
  window.GZNativeAd = {
    init: function () {},
    loadInPagePush: loadInPagePush,
    loadVignette: loadVignette,
    loadPushNotif: loadPushNotif,
    loaded: { inpage: ippLoaded, vignette: vignetteLoaded, push: pushLoaded }
  };
  window.GZAdSenseAuto = { loaded: adsenseLoaded, skipped: false };
  window.GZInterstitial = {
    init: function () {},
    show: function () {},
    dismiss: function () {},
    getStats: function () { return { eventCount: 0, lastShown: 0 }; }
  };

  console.log('[GZAdManager] v2 Initialized — MultiTag zones active (Popunder: click-triggered)');
})();
