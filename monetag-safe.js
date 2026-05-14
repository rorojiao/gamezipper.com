(function(){
  'use strict';
  if (window.GZMonetagSafe) return;

  var GAME_ZONE = 10687757;  // gamezipper.com Popunder zone
  var loaded = false;
  var gameAdShown = false;

  // Frequency cap: only show popunder once per page visit
  // (popunder is already one-shot per session via gameAdShown flag,
  //  but we also check sessionStorage to avoid re-triggering on same-tab navigation)
  var FREQUENCY_KEY = 'gz_popunder_shown';

  function onGamePage() {
    var path = location.pathname;
    // Game pages: not root, not a file (no extension like .html), not games.html
    return path !== '/' && !/\.[a-z]{2,5}$/.test(path) && !/\/games\.html$/.test(path);
  }

  function onHubPage() {
    var path = location.pathname;
    // Hub pages: root ('/') or games.html
    return path === '/' || /\/games\.html$/.test(path);
  }

  function hasBlockingOverlay() {
    var ids = ['tutorial-overlay','menu-overlay','level-overlay','win-overlay','fail-overlay','gz-more-games'];
    return ids.some(function(id){
      var el = document.getElementById(id);
      if (!el) return false;
      var s = getComputedStyle(el);
      return s.display !== 'none' && s.visibility !== 'hidden' && s.opacity !== '0';
    });
  }

  function loadScript(zone) {
    if (loaded) return true;
    loaded = true;
    // Monetag popunder / native ad script — zone param is required
    var s = document.createElement('script');
    s.src = 'https://a.magsrv.com/ad-provider.js?zone=' + zone;
    s.async = true;
    s.setAttribute('data-zone', String(zone));
    document.head.appendChild(s);
    console.log('[GZMonetagSafe] Monetag zone ' + zone + ' loaded');
    return true;
  }

  function init(zone){
    zone = zone || GAME_ZONE;

    if (onHubPage()) {
      // Hub pages: load Monetag immediately (no gameplay to interrupt)
      // But respect frequency cap: only once per session
      if (!sessionStorage.getItem(FREQUENCY_KEY)) {
        sessionStorage.setItem(FREQUENCY_KEY, '1');
        loadScript(zone);
      } else {
        console.log('[GZMonetagSafe] Hub page — popunder already shown this session, skipping');
      }
      return;
    }

    if (onGamePage()) {
      // Game pages: only load popunder AFTER game-over (never during gameplay)
      if (sessionStorage.getItem(FREQUENCY_KEY)) {
        console.log('[GZMonetagSafe] Game page — popunder already shown this session, skipping');
        return;
      }
      // Listen for game-over event from games
      window.addEventListener('gameover', function() {
        if (sessionStorage.getItem(FREQUENCY_KEY)) return;
        sessionStorage.setItem(FREQUENCY_KEY, '1');
        setTimeout(function(){ loadScript(zone); }, 1000);
      });
      // Also listen for level-complete (interstitial system)
      window.addEventListener('level-complete', function() {
        if (sessionStorage.getItem(FREQUENCY_KEY)) return;
        sessionStorage.setItem(FREQUENCY_KEY, '1');
        setTimeout(function(){ loadScript(zone); }, 1500);
      });
      // Fallback: 120s if no gameover fires (idle/endless games)
      setTimeout(function(){
        if (!loaded && !sessionStorage.getItem(FREQUENCY_KEY)) {
          sessionStorage.setItem(FREQUENCY_KEY, '1');
          loadScript(zone);
        }
      }, 120000);
      console.log('[GZMonetagSafe] game page — popunder deferred to game-over (120s fallback)');
      return;
    }

    // Other pages (about, privacy, etc): load with delay, respect frequency cap
    if (!sessionStorage.getItem(FREQUENCY_KEY)) {
      setTimeout(function(){
        sessionStorage.setItem(FREQUENCY_KEY, '1');
        loadScript(zone);
      }, 3000);
    }
  }

  window.GZMonetagSafe = {
    init: function(zone){ init(zone); },
    loadNow: function(zone){ loadScript(zone || GAME_ZONE); },
    maybeLoad: function(zone){
      // Called by game pages on game-over; only show once per session
      if (gameAdShown) return false;
      if (sessionStorage.getItem(FREQUENCY_KEY)) return false;
      gameAdShown = true;
      sessionStorage.setItem(FREQUENCY_KEY, '1');
      loadScript(zone || GAME_ZONE);
      return true;
    },
    hasBlockingOverlay: hasBlockingOverlay,
    disabled: false,
    mode: 'hub-auto+game-deferred'
  };

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', function(){ init(); }, { once:true });
  } else {
    init();
  }
})();
