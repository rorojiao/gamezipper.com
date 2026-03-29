(function(){
  'use strict';
  if (window.GZMonetagSafe) return;

  function onGamePage() {
    return location.pathname !== '/' && /\/$/.test(location.pathname) && !/games\.html$/.test(location.pathname);
  }

  function onHubPage() {
    return location.pathname === '/' || /games\.html$/.test(location.pathname);
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

  function shouldInjectThirdParty() {
    // Requirement: never interrupt gameplay. Third-party ad scripts pose popup/interruption risks, disable them all.
    return false;
  }

  function inject(zone) {
    if (!shouldInjectThirdParty()) return false;
    return false;
  }

  function init(){
    if (onGamePage()) {
      console.log('[GZMonetagSafe] disabled on game page for UX protection');
      return;
    }
    if (onHubPage()) {
      console.log('[GZMonetagSafe] third-party pop / interstitial disabled; using inline promo rail only');
    }
  }

  window.GZMonetagSafe = {
    init: function(){ init(); },
    loadNow: function(){ return false; },
    maybeLoad: function(){ return false; },
    hasBlockingOverlay: hasBlockingOverlay,
    disabled: true,
    mode: 'inline-only'
  };

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init, { once:true });
  } else {
    init();
  }
})();
