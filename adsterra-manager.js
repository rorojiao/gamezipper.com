/**
 * GameZipper Adsterra Ad Manager v5.16 (2026-07-17)
 * ─────────────────────────────────────
 * Plan C: ONLY Popunder + Smartlink (direct_url).
 * SocialBar / Native / Banner zones DISABLED — repeated load_error + CDN 403
 * on bare /{zoneId} endpoints (30130930/31/27/32/33).
 *
 * Zone IDs (domain 5896870, Publisher API 2026-07-07):
 *   Popunder:  30130929  ✅ direct_url
 *   Smartlink: 30130928  ✅ direct_url (exposed via API, no auto inject)
 *   SocialBar: 30130931  ❌ disabled
 *   Native:    30130930  ❌ disabled
 *   Banners:   30130932/27/33 ❌ disabled
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

  var ZONES = {
    popunder:  '30130929',
    smartlink: '30130928'
    // socialBar/native/banner intentionally omitted (v5.16)
  };

  // ── BI beacon helper (optional, no-op if gz analytics missing) ──
  function track(type, extra) {
    try {
      if (typeof window.gzTrack === 'function') {
        window.gzTrack('gz_ad_event', Object.assign({ network: 'adsterra', type: type }, extra || {}));
      } else if (window.navigator && navigator.sendBeacon) {
        var payload = JSON.stringify({
          event: 'gz_ad_event',
          network: 'adsterra',
          type: type,
          path: location.pathname,
          ts: Date.now(),
          extra: extra || {}
        });
        // Prefer site analytics if configured; swallow failures
        if (window.GZ_ANALYTICS_EP) {
          navigator.sendBeacon(window.GZ_ANALYTICS_EP, payload);
        }
      }
    } catch (e) {}
  }

  // ── Popunder ──
  var POP_KEY = 'gz_adst_pop_ts';
  var POP_INTERVAL = 25 * 60 * 1000; // 25min cooldown
  var _bc = null;
  try { _bc = new BroadcastChannel('gz_adst_popunder'); } catch (e) {}

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
    try { localStorage.setItem(POP_KEY, String(Date.now())); } catch (e) {}
    if (_bc) try { _bc.postMessage(Date.now()); } catch (e) {}

    var w = null;
    try { w = window.open(POPUNDER_URL, '_blank'); } catch (e) {}
    if (w) {
      try { w.blur(); } catch (e) {}
      try { window.focus(); } catch (e) {}
      track('fill', { zone: ZONES.popunder, format: 'popunder' });
    } else {
      track('no_fill', { zone: ZONES.popunder, format: 'popunder', reason: 'popup_blocked' });
    }
  }

  function armPop() {
    if (popArmed || !canShowPop()) return;
    popArmed = true;
  }

  document.addEventListener('click', function (e) {
    if (!popArmed) return;
    var target = e.target;
    while (target && target.tagName !== 'A') target = target.parentElement;
    if (target && target.href && target.href.indexOf(location.origin) === 0) return;

    // Don't hijack game UI
    var gameEl = e.target;
    while (gameEl) {
      if (gameEl.tagName === 'CANVAS' ||
          gameEl.tagName === 'BUTTON' ||
          (gameEl.id && (gameEl.id.indexOf('btn-') === 0 || gameEl.id.indexOf('game') === 0 || gameEl.id.indexOf('overlay') >= 0)) ||
          (gameEl.className && typeof gameEl.className === 'string' &&
           (gameEl.className.indexOf('menu-btn') >= 0 || gameEl.className.indexOf('overlay') >= 0 ||
            gameEl.className.indexOf('ctrl-btn') >= 0 || gameEl.className.indexOf('game') >= 0))) {
        return;
      }
      gameEl = gameEl.parentElement;
    }

    popArmed = false;
    firePopunder();
  }, { passive: true, capture: true });

  if (_bc) {
    _bc.onmessage = function (e) {
      try { localStorage.setItem(POP_KEY, String(e.data)); } catch (err) {}
    };
  }

  // ── Init: popunder only (no SocialBar/Native script tags) ──
  function init() {
    armPop();
    track('load', { formats: 'popunder+smartlink', v: '5.16' });
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }

  window.GZAdsterraManager = {
    firePopunder: firePopunder,
    getSmartlinkUrl: function () { return SMARTLINK_URL; },
    zones: ZONES,
    version: '5.16'
  };

  try {
    console.log('[GZAdsterra] v5.16 active — popunder only zone=' + ZONES.popunder + ' (social/banner/native disabled)');
  } catch (e) {}
})();
