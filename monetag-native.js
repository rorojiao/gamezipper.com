/**
 * GameZipper Native Ad Integration
 * In-Page Push + Vignette Banner — no popups, no popunders
 * These ad formats render inside the page and are NOT blocked by browsers
 */
(function(){
  'use strict';
  if (window.GZNativeAd) return;

  var INPAGE_PUSH_ZONE = 10687756;   // gamezipper.com In-Page Push
  var VIGNETTE_ZONE = 10687757;       // gamezipper.com Vignette Banner
  var loaded = {};

  function onGamePage() {
    return location.pathname !== '/' && /\/$/.test(location.pathname) && !/games\.html$/.test(location.pathname);
  }

  function loadInPagePush() {
    if (loaded.inpage) return;
    loaded.inpage = true;
    var s = document.createElement('script');
    s.async = true;
    s.setAttribute('data-zone', String(INPAGE_PUSH_ZONE));
    s.src = 'https://a.magsrv.com/ad-provider.js';
    document.head.appendChild(s);
    console.log('[GZNativeAd] In-Page Push zone ' + INPAGE_PUSH_ZONE + ' loaded');
  }

  function loadVignette() {
    if (loaded.vignette) return;
    loaded.vignette = true;
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
    // Load after 8 seconds when user is engaged
    setTimeout(loadInPagePush, 8000);

    // Vignette Banner only on game-over (it's a full-screen overlay)
    // Listen for custom game-over event
    window.addEventListener('gameover', function() {
      setTimeout(loadVignette, 1000);
    });
    // Fallback: load vignette after 60 seconds if no gameover event fires
    setTimeout(function() {
      if (!loaded.vignette) loadVignette();
    }, 60000);
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
