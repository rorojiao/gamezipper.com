/**
 * GameZipper Native Ad Integration
 * In-Page Push + Vignette Banner — no popups, no popunders
 * These ad formats render inside the page and are NOT blocked by browsers
 */
(function(){
  'use strict';
  if (window.GZNativeAd) return;

  var INPAGE_PUSH_ZONE = 10687756;   // gamezipper.com In-Page Push
  // VIGNETTE_ZONE: Placeholder ID — needs to be created in Monetag dashboard as a Vignette-specific zone
  // Previously conflicted with Popunder zone 10687757 (used in monetag-safe.js)
  var VIGNETTE_ZONE = 10687758;       // ⚠️ PLACEHOLDER — create this zone in Monetag dashboard
  var loaded = {};

  // Session-based frequency control: track when each ad type was last shown
  var MIN_INTERVAL = 60000; // 60 seconds minimum between ad loads
  var lastShown = { inpage: 0, vignette: 0 };

  function onGamePage() {
    return location.pathname !== '/' && /\/$/.test(location.pathname) && !/games\.html$/.test(location.pathname);
  }

  function loadInPagePush() {
    if (loaded.inpage) return;
    // Frequency cap: don't load again within MIN_INTERVAL
    if (Date.now() - lastShown.inpage < MIN_INTERVAL) {
      console.log('[GZNativeAd] In-Page Push frequency-capped, skipping');
      return;
    }
    loaded.inpage = true;
    lastShown.inpage = Date.now();
    var s = document.createElement('script');
    s.async = true;
    s.setAttribute('data-zone', String(INPAGE_PUSH_ZONE));
    s.src = 'https://a.magsrv.com/ad-provider.js';
    document.head.appendChild(s);
    console.log('[GZNativeAd] In-Page Push zone ' + INPAGE_PUSH_ZONE + ' loaded');
  }

  function loadVignette() {
    if (loaded.vignette) return;
    // Frequency cap: don't load again within MIN_INTERVAL
    if (Date.now() - lastShown.vignette < MIN_INTERVAL) {
      console.log('[GZNativeAd] Vignette frequency-capped, skipping');
      return;
    }
    loaded.vignette = true;
    lastShown.vignette = Date.now();
    var s = document.createElement('script');
    s.async = true;
    s.setAttribute('data-zone', String(VIGNETTE_ZONE));
    s.src = 'https://a.magsrv.com/ad-provider.js';
    document.head.appendChild(s);
    console.log('[GZNativeAd] Vignette Banner zone ' + VIGNETTE_ZONE + ' loaded');
  }

  function init() {
    // Hub page: load both immediately (no gameplay to interrupt)
    if (location.pathname === '/' || /games\.html$/.test(location.pathname)) {
      loadInPagePush();
      // Vignette on hub: slight delay so it doesn't flash on entry
      setTimeout(loadVignette, 3000);
      return;
    }

    // Game page: In-Page Push is safe (renders in corner, doesn't block gameplay)
    // Load after 5 seconds (reduced from 8s to capture more users before they leave)
    setTimeout(loadInPagePush, 5000);

    // Vignette Banner only on game-over (it's a full-screen overlay)
    // Listen for custom game-over event
    window.addEventListener('gameover', function() {
      setTimeout(loadVignette, 1000);
    });
    // Also listen for level-complete and level-fail events from interstitial system
    window.addEventListener('level-complete', function() {
      setTimeout(loadVignette, 1500);
    });
    // Fallback: load vignette after 120s if no gameover event fires
    // (for idle/endless games that never emit gameover — long delay avoids gameplay interruption)
    setTimeout(function() {
      if (!loaded.vignette) loadVignette();
    }, 120000);
  }

  window.GZNativeAd = {
    init: init,
    loadInPagePush: loadInPagePush,
    loadVignette: loadVignette,
    loaded: loaded
  };

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init, { once: true });
  } else {
    init();
  }
})();
