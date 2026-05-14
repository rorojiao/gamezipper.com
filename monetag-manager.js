/**
 * GameZipper Unified Ad Manager
 * ─────────────────────────────
 * Replaces: monetag-safe.js, monetag-native.js, adsense-auto.js, ad-interstitial.js
 *
 * Zones (confirmed active in Monetag dashboard):
 *   - Popunder:    10687757
 *   - In-Page Push: 10687756
 *
 * Strategy:
 *   1. Popunder: hub pages → immediate; game pages → 3s after first click
 *      Frequency: every 30 min (localStorage, cross-tab)
 *   2. In-Page Push: all pages → 2s delay, once per page-view (no cross-page cap)
 *   3. AdSense Auto Ads: game pages → 2s after first interaction, no session cap
 *   4. Banner ad container below game area (filled with In-Page Push zone)
 */
(function () {
  'use strict';
  if (window.GZAdManager) return;
  window.GZAdManager = true;

  /* ── Zone Configuration ────────────────────────────────────── */
  var ZONES = {
    popunder:    10687757,
    inpagePush:  10687756
  };

  /* ── Helpers ───────────────────────────────────────────────── */
  function isGamePage() {
    var p = location.pathname;
    return p !== '/' && !/\.[a-z]{2,5}$/.test(p) && !/\/games\.html$/.test(p) && !/\/blog\.html$/.test(p);
  }

  function isHubPage() {
    return location.pathname === '/';
  }

  /* ── 1. Popunder (zone 10687757) ───────────────────────────── */
  var POP_KEY = 'gz_pop_ts';
  var POP_INTERVAL = 30 * 60 * 1000; // 30 minutes
  var popLoaded = false;

  function canShowPopunder() {
    try {
      var ts = localStorage.getItem(POP_KEY);
      if (ts && Date.now() - parseInt(ts, 10) < POP_INTERVAL) return false;
    } catch (e) {}
    return true;
  }

  function markPopunderShown() {
    try { localStorage.setItem(POP_KEY, String(Date.now())); } catch (e) {}
  }

  function loadPopunder() {
    if (popLoaded) return;
    if (!canShowPopunder()) {
      console.log('[GZAdManager] Popunder frequency-capped (30 min interval)');
      return;
    }
    popLoaded = true;
    markPopunderShown();
    var s = document.createElement('script');
    s.async = true;
    s.setAttribute('data-zone', String(ZONES.popunder));
    s.src = 'https://a.magsrv.com/ad-provider.js?zone=' + ZONES.popunder;
    document.head.appendChild(s);
    console.log('[GZAdManager] Popunder zone ' + ZONES.popunder + ' loaded');
  }

  /* ── 2. In-Page Push (zone 10687756) ───────────────────────── */
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

  /* ── 3. AdSense Auto Ads ───────────────────────────────────── */
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

  /* ── 4. Banner ad below game area ──────────────────────────── */
  function fillBelowGameAd() {
    var container = document.getElementById('gz-ad-below-game');
    if (!container || container.getAttribute('data-filled')) return;
    container.setAttribute('data-filled', '1');
    var s = document.createElement('script');
    s.async = true;
    s.setAttribute('data-zone', String(ZONES.inpagePush));
    s.src = 'https://a.magsrv.com/ad-provider.js?zone=' + ZONES.inpagePush;
    container.appendChild(s);
    console.log('[GZAdManager] Below-game banner ad loaded');
  }

  /* ── 5. Homepage mid-grid ad ───────────────────────────────── */
  function fillMidGridAd() {
    var container = document.getElementById('gz-ad-mid-grid');
    if (!container || container.getAttribute('data-filled')) return;
    container.setAttribute('data-filled', '1');
    var s = document.createElement('script');
    s.async = true;
    s.setAttribute('data-zone', String(ZONES.inpagePush));
    s.src = 'https://a.magsrv.com/ad-provider.js?zone=' + ZONES.inpagePush;
    container.appendChild(s);
    console.log('[GZAdManager] Mid-grid banner ad loaded');
  }

  /* ── Page-type Routing ─────────────────────────────────────── */

  if (isHubPage()) {
    /* ── Homepage ── */
    // Popunder: immediate (no gameplay to interrupt)
    loadPopunder();
    // In-Page Push: 2s delay
    setTimeout(loadInPagePush, 2000);
    // Mid-grid ad: fill after DOM settles
    setTimeout(fillMidGridAd, 2500);

  } else if (isGamePage()) {
    /* ── Game Page ── */
    // Popunder: 3s after first click (user is engaged)
    var popTriggered = false;
    function onFirstClick() {
      if (popTriggered) return;
      popTriggered = true;
      setTimeout(loadPopunder, 3000);
    }
    document.addEventListener('click', onFirstClick, { once: true, passive: true });
    document.addEventListener('touchstart', onFirstClick, { once: true, passive: true });
    // Fallback: if no click after 8s, load anyway
    setTimeout(function () {
      if (!popTriggered) loadPopunder();
    }, 8000);

    // In-Page Push: 2s delay (non-intrusive, safe for games)
    setTimeout(loadInPagePush, 2000);

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

    // Below-game banner: fill after 3s (wait for page to render)
    setTimeout(fillBelowGameAd, 3000);

  } else {
    /* ── Other pages (about, privacy, blog, category, etc.) ── */
    setTimeout(loadPopunder, 2000);
    setTimeout(loadInPagePush, 2000);
  }

  /* ── Backward-compatible API ───────────────────────────────── */
  window.GZMonetagSafe = {
    init: function () {},
    loadNow: loadPopunder,
    maybeLoad: loadPopunder,
    hasBlockingOverlay: function () { return false; },
    disabled: false,
    mode: 'unified-manager'
  };
  window.GZNativeAd = {
    init: function () {},
    loadInPagePush: loadInPagePush,
    loadVignette: function () {},
    loaded: { inpage: ippLoaded }
  };
  window.GZAdSenseAuto = { loaded: adsenseLoaded, skipped: false };
  window.GZInterstitial = {
    init: function () {},
    show: function () {},
    dismiss: function () {},
    getStats: function () { return { eventCount: 0, lastShown: 0 }; }
  };

  console.log('[GZAdManager] Initialized — unified ad manager active');
})();
