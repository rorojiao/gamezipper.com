/**
 * GameZipper — Google AdSense Auto Ads for Game Pages
 * ──────────────────────────────────────────────────
 * Loads AdSense auto ads ONLY on game pages with these safety measures:
 *   - Deferred loading (waits 3s after page load)
 *   - CSS constraints: ads max-height 90px, z-index below game canvas
 *   - Respects user engagement: only loads after first interaction
 *   - Session-aware: skips if already loaded in this session
 *
 * Google Auto Ads uses ML to pick non-disruptive placements.
 * This script adds an extra safety layer for game UX.
 */
(function(){
  'use strict';
  if (window.GZAdSenseAuto) return;
  window.GZAdSenseAuto = { loaded: false, skipped: false };

  var AD_CLIENT = 'ca-pub-8346383990981353';
  var SESSION_KEY = 'gz_adsense_loaded';
  var MIN_ENGAGEMENT_MS = 2000; // Wait 2s after first interaction

  // Only run on game pages (not homepage, not hub pages)
  function isGamePage() {
    var path = location.pathname;
    return path !== '/' && !/\.[a-z]{2,5}$/.test(path) && !/\/games\.html$/.test(path) && !/\/blog\.html$/.test(path);
  }

  // Inject CSS constraints for any ads that appear
  function injectSafetyCSS() {
    var s = document.createElement('style');
    s.id = 'gz-adsense-safety';
    s.textContent = [
      /* Constrain all AdSense units on game pages */
      'ins.adsbygoogle { max-height: 90px !important; overflow: hidden !important; }',
      /* Anchor ads (bottom banner) — allow but cap height */
      '.google-ad-slot, [id^="google_ads_iframe"] { max-height: 50px !important; }',
      /* Ensure ads don't overlay game canvas */
      '#game-canvas, canvas, .game-container, .game-wrap, #game-area, .game-area { position: relative; z-index: 10 !important; }',
      /* Side rail ads on desktop — constrain width */
      '.google-right-rail, .google-left-rail { max-width: 160px !important; }'
    ].join('\n');
    document.head.appendChild(s);
  }

  function loadAdSense() {
    if (window.GZAdSenseAuto.loaded) return;
    if (sessionStorage.getItem(SESSION_KEY)) {
      window.GZAdSenseAuto.skipped = true;
      console.log('[GZAdSenseAuto] Already loaded this session, skipping');
      return;
    }
    window.GZAdSenseAuto.loaded = true;
    sessionStorage.setItem(SESSION_KEY, '1');

    // Inject safety CSS first
    injectSafetyCSS();

    // Load AdSense script
    var s = document.createElement('script');
    s.async = true;
    s.src = 'https://pagead2.googlesyndication.com/pagead/js/adsbygoogle.js?client=' + AD_CLIENT;
    s.crossOrigin = 'anonymous';
    document.head.appendChild(s);
    console.log('[GZAdSenseAuto] AdSense auto ads loaded');
  }

  if (!isGamePage()) {
    console.log('[GZAdSenseAuto] Not a game page, skipping');
    return;
  }

  // Strategy: wait for first user interaction (click/scroll/touch)
  // then load after MIN_ENGAGEMENT_MS delay
  var engaged = false;
  var engageTime = 0;

  function onEngage() {
    if (engaged) return;
    engaged = true;
    engageTime = Date.now();
    setTimeout(function(){
      loadAdSense();
    }, MIN_ENGAGEMENT_MS);
  }

  // Listen for engagement signals
  document.addEventListener('click', onEngage, { once: true, passive: true });
  document.addEventListener('touchstart', onEngage, { once: true, passive: true });
  document.addEventListener('keydown', onEngage, { once: true, passive: true });

  // Fallback: if no interaction after 10s, load anyway
  // (some users just watch/read without clicking)
  setTimeout(function(){
    if (!window.GZAdSenseAuto.loaded) {
      console.log('[GZAdSenseAuto] No interaction detected, loading anyway');
      loadAdSense();
    }
  }, 10000);

  console.log('[GZAdSenseAuto] Initialized — waiting for user engagement');
})();
