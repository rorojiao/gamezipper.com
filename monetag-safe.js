(function(){
  'use strict';
  if (window.GZMonetagSafe) return;

  var GAME_ZONE = 10687757;  // gamezipper.com zone
  var loaded = false;
  var gameAdShown = false;

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
      loadScript(zone);
      return;
    }

    if (onGamePage()) {
      // Game pages: load after 6 seconds delay (user is engaged by then)
      // Also listen for game-over to load sooner if available
      var loadedEarly = false;
      setTimeout(function(){
        if (!loadedEarly) loadScript(zone);
      }, 6000);
      // Keep maybeLoad API for games that do signal game-over
      console.log('[GZMonetagSafe] game page — Monetag will load after 6s or on game-over');
      return;
    }

    // Other pages (about, privacy, etc): load with delay
    setTimeout(function(){ loadScript(zone); }, 3000);
  }

  window.GZMonetagSafe = {
    init: function(zone){ init(zone); },
    loadNow: function(zone){ loadScript(zone || GAME_ZONE); },
    maybeLoad: function(zone){
      // Called by game pages on game-over; only show once per session
      if (gameAdShown) return false;
      gameAdShown = true;
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
