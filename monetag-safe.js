(function(){
  'use strict';
  if (window.GZMonetagSafe) return;

  var state = { loaded:false, loading:false, zone:null, timers:[] };

  function inject(zone) {
    if (state.loaded || state.loading || !zone) return false;
    state.loading = true;
    state.zone = zone;
    var s = document.createElement('script');
    s.src = 'https://quge5.com/88/tag.min.js';
    s.async = true;
    s.setAttribute('data-zone', String(zone));
    s.setAttribute('data-cfasync', 'false');
    s.onload = function(){ state.loaded = true; state.loading = false; };
    s.onerror = function(){ state.loading = false; };
    document.head.appendChild(s);
    return true;
  }

  function hasBlockingOverlay() {
    var ids = ['tutorial-overlay','menu-overlay','level-overlay','win-overlay','fail-overlay'];
    return ids.some(function(id){
      var el = document.getElementById(id);
      if (!el) return false;
      var s = getComputedStyle(el);
      return s.display !== 'none' && s.visibility !== 'hidden' && s.opacity !== '0';
    });
  }

  function onGamePage() {
    return location.pathname !== '/' && /\/$/.test(location.pathname) && !/games\.html$/.test(location.pathname);
  }

  function scheduleHubLoad(zone) {
    if (onGamePage()) return;
    var fired = false;
    function fire(){ if (fired) return; fired = true; if (!hasBlockingOverlay()) inject(zone); }
    window.addEventListener('scroll', function(){ if (window.scrollY > 600) fire(); }, { passive:true, once:true });
    document.addEventListener('click', function(e){
      if (e.target.closest('a[href*="/"]')) fire();
    }, { once:true, capture:true });
    state.timers.push(setTimeout(fire, 15000));
  }

  function scheduleGameSafeLoad(zone) {
    if (!onGamePage()) return;
    window.addEventListener('gz-safe-ad-moment', function(){ if (!hasBlockingOverlay()) inject(zone); });
    document.addEventListener('click', function(e){
      if (e.target.closest('#game-footer a, a[href="/"], .gz-seo-section a, .faq-section a')) {
        if (!hasBlockingOverlay()) inject(zone);
      }
    }, { capture:true });
  }

  window.GZMonetagSafe = {
    init: function(zone){ scheduleHubLoad(zone); scheduleGameSafeLoad(zone); },
    loadNow: inject,
    maybeLoad: function(zone){ if (!hasBlockingOverlay()) inject(zone); },
    hasBlockingOverlay: hasBlockingOverlay
  };
})();
