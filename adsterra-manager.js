/**
 * GameZipper Adsterra Ad Manager v5.15
 * ─────────────────────────────────────
 * Uses Popunder direct_url + Smartlink from Publisher API.
 * Other formats (Banner/SocialBar) served via effectivecpmnetwork.com.
 *
 * Zone IDs from Adsterra Publisher API (2026-07-07, domain 5896870):
 *   Popunder:  30130929  direct_url: effectivecpmnetwork.com/zdq0x5zp?key=...
 *   Smartlink: 30130928  direct_url: effectivecpmnetwork.com/wvrk4xu035?key=...
 *   SocialBar: 30130931
 *   Banner:    30130932 (728x90), 30130927 (468x60), 30130933 (320x50)
 *   Native:    30130930
 */

(function () {
  'use strict';
  if (window.GZAdsterra) return;
  window.GZAdsterra = true;

  var ADS_ENABLED = (window.GZ_ADS_ENABLED !== undefined) ? window.GZ_ADS_ENABLED : true;
  if (!ADS_ENABLED) return;

  // ── Direct URLs from Publisher API (confirmed working) ──
  var POPUNDER_URL = 'https://www.effectivecpmnetwork.com/zdq0x5zp?key=25eaa5c5041a6ef2f33d056e5feeb8d2';
  var SMARTLINK_URL = 'https://www.effectivecpmnetwork.com/wvrk4xu035?key=e820da8370828a60705d61ac29bfe589';

  // ── Zone IDs ──
  var ZONES = {
    popunder:  '30130929',
    smartlink: '30130928',
    socialBar: '30130931',
    native:    '30130930',
    banner728: '30130932',
    banner468: '30130927',
    banner320: '30130933'
  };

  // ── Popunder (direct_url approach — confirmed working from API) ──
  var POP_KEY = 'gz_adst_pop_ts';
  var POP_INTERVAL = 25 * 60 * 1000; // 25min cooldown
  var _bc = null;
  try { _bc = new BroadcastChannel('gz_adst_popunder'); } catch(e) {}

  var popArmed = false;

  function canShowPop() {
    try {
      var ts = localStorage.getItem(POP_KEY);
      if (ts && Date.now() - parseInt(ts, 10) < POP_INTERVAL) return false;
    } catch (e) {}
    return true;
  }

  function firePopunder() {
    if (!canShowPop()) return;
    try { localStorage.setItem(POP_KEY, String(Date.now())); } catch(e) {}
    if (_bc) try { _bc.postMessage(Date.now()); } catch(e) {};

    // Open popunder in new tab (behind current window)
    var w = window.open(POPUNDER_URL, '_blank');
    if (w) {
      w.blur();
      window.focus();
    }
    // Also fire the pixel for impression tracking
    var img = new Image();
    img.src = POPUNDER_URL + '&pb=1';
  }

  // Arm popunder on first user interaction (click/touch)
  function armPop() {
    if (popArmed || !canShowPop()) return;
    popArmed = true;
  }

  // Listen for first click to trigger popunder
  document.addEventListener('click', function(e) {
    if (!popArmed) return;
    // Don't trigger on internal navigation links
    var target = e.target;
    while (target && target.tagName !== 'A') target = target.parentElement;
    if (target && target.href && target.href.indexOf(location.origin) === 0) return; // internal link

    // Don't trigger popunder on game UI elements (canvas, game buttons, overlays)
    // This prevents ad redirects from hijacking game start/play actions
    var gameEl = e.target;
    while (gameEl) {
      if (gameEl.tagName === 'CANVAS' || 
          gameEl.tagName === 'BUTTON' ||
          (gameEl.id && (gameEl.id.indexOf('btn-') === 0 || gameEl.id.indexOf('game') === 0 || gameEl.id.indexOf('overlay') >= 0)) ||
          (gameEl.className && typeof gameEl.className === 'string' && 
           (gameEl.className.indexOf('menu-btn') >= 0 || gameEl.className.indexOf('overlay') >= 0 || 
            gameEl.className.indexOf('ctrl-btn') >= 0 || gameEl.className.indexOf('game') >= 0))) {
        return; // skip popunder for game UI clicks
      }
      gameEl = gameEl.parentElement;
    }

    popArmed = false;
    firePopunder();
  }, { passive: true, capture: true });

  // Sync popunder cooldown across tabs
  if (_bc) {
    _bc.onmessage = function(e) {
      try { localStorage.setItem(POP_KEY, String(e.data)); } catch(err) {}
    };
  }

  // ── Social Bar / Native Banner via script tag ──
  // Using effectivecpmnetwork.com (same CDN IPs as profitabledisplaynetwork.com)
  function loadZone(zoneId) {
    if (!zoneId || zoneId === '0') return;
    var s = document.createElement('script');
    s.async = true;
    s.setAttribute('data-zone', String(zoneId));
    s.setAttribute('data-network', 'adsterra');
    s.src = 'https://www.effectivecpmnetwork.com/' + zoneId;
    s.onerror = function() {
      // Fallback: try without www
      var s2 = document.createElement('script');
      s2.async = true;
      s2.src = 'https://effectivecpmnetwork.com/' + zoneId;
      document.head.appendChild(s2);
    };
    document.head.appendChild(s);
  }

  // ── Init ──
  function init() {
    var isHub = location.pathname === '/' || /\/$/.test(location.pathname);

    // Arm popunder immediately (fires on first click)
    armPop();

    // Load Social Bar after 3-5s (non-blocking)
    setTimeout(function() {
      loadZone(ZONES.socialBar);
    }, isHub ? 3000 : 5000);

    // Load Native Banner on hub pages after 8s
    if (isHub) {
      setTimeout(function() {
        loadZone(ZONES.native);
      }, 8000);
    }
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }

  // Public API
  window.GZAdsterraManager = {
    firePopunder: firePopunder,
    loadZone: loadZone,
    getSmartlinkUrl: function() { return SMARTLINK_URL; },
    zones: ZONES
  };

  console.log('[GZAdsterra] v5.15 active — popunder=' + ZONES.popunder + ' smartlink=' + ZONES.smartlink + ' social=' + ZONES.socialBar);
})();