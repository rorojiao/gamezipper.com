/**
 * EXPERIMENT 1: Bottom Fixed Banner Ad
 * 
 * Location: Game pages only, fixed at bottom
 * Does NOT obstruct: canvas, game controls, HUD, D-pad
 * 
 * Rollback: GZ_AB.rollback('bottom-banner')
 * URL param: ?rollback=bottom-banner
 * 
 * A/B: 50% users see banner, 50% control (no banner)
 * Only on: Snake game (targetGame: snake) for first week
 */
(function () {
  'use strict';

  var BANNER_ID = 'gz-bottom-banner-ad';
  var SESSION_KEY = 'gz_bottom_banner_session';
  var IMPRESSIONS_KEY = 'gz_bb_impressions';
  var MAX_IMPRESSIONS_PER_SESSION = 3;
  var AUTO_HIDE_AFTER_MS = 30000; // hide after 30s to not annoy

  var STYLE = [
    '#' + BANNER_ID + '{position:fixed;bottom:0;left:0;right:0;z-index:900;background:linear-gradient(180deg,rgba(0,0,0,.85),rgba(0,0,0,.95));border-top:1px solid rgba(78,205,196,.3);padding:8px 12px;display:flex;align-items:center;gap:12px;min-height:60px;max-height:70px;font-family:system-ui,-apple-system,sans-serif;transform:translateY(100%);transition:transform .4s cubic-bezier(.4,0,.2,1);}',
    '#' + BANNER_ID + '.gz-ad-visible{transform:translateY(0);}',
    '#' + BANNER_ID + '.gz-ad-hidden{display:none!important;}',
    '#' + BANNER_ID + ' .gz-banner-content{flex:1;display:flex;align-items:center;gap:10px;min-width:0;}',
    '#' + BANNER_ID + ' .gz-banner-text{flex:1;min-width:0;}',
    '#' + BANNER_ID + ' .gz-banner-title{color:#fff;font-size:13px;font-weight:700;white-space:nowrap;overflow:hidden;text-overflow:ellipsis;}',
    '#' + BANNER_ID + ' .gz-banner-desc{color:#aaa;font-size:11px;margin-top:2px;white-space:nowrap;overflow:hidden;text-overflow:ellipsis;}',
    '#' + BANNER_ID + ' .gz-banner-cta{background:#4ecdc4;color:#000;font-size:12px;font-weight:700;padding:6px 14px;border-radius:20px;border:none;cursor:pointer;white-space:nowrap;flex-shrink:0;}',
    '#' + BANNER_ID + ' .gz-banner-close{background:none;border:none;color:#666;font-size:18px;cursor:pointer;padding:4px 6px;flex-shrink:0;line-height:1;}',
    '#' + BANNER_ID + ' .gz-banner-close:hover{color:#fff;}',
    '#' + BANNER_ID + ' .gz-banner-ad-slot{flex-shrink:0;width:300px;height:50px;background:rgba(255,255,255,.05);border-radius:8px;border:1px solid rgba(255,255,255,.1);display:flex;align-items:center;justify-content:center;color:#555;font-size:10px;}'
  ].join('');

  function isGamePage() {
    return location.pathname !== '/' && /\/$/.test(location.pathname) && !/games\.html$/.test(location.pathname);
  }

  function isTargetGame() {
    // Only snake for first experiment
    return location.pathname === '/snake/';
  }

  function getSessionCount() {
    try { return parseInt(sessionStorage.getItem(SESSION_KEY) || '0', 10); } catch (e) { return 0; }
  }

  function incrementSession() {
    try { sessionStorage.setItem(SESSION_KEY, String(getSessionCount() + 1)); } catch (e) {}
  }

  function shouldShow() {
    // Only on game pages, only on snake, only up to MAX_IMPRESSIONS per session
    if (!isGamePage() || !isTargetGame()) return false;
    if (!window.GZ_AB) return false;
    if (!window.GZ_AB.isInVariant('bottom-banner')) return false;
    if (getSessionCount() >= MAX_IMPRESSIONS_PER_SESSION) return false;
    return true;
  }

  function ensureStyle() {
    if (document.getElementById('gz-bb-style')) return;
    var el = document.createElement('style');
    el.id = 'gz-bb-style';
    el.textContent = STYLE;
    document.head.appendChild(el);
  }

  function render() {
    if (document.getElementById(BANNER_ID)) return;
    ensureStyle();

    var banner = document.createElement('div');
    banner.id = BANNER_ID;
    banner.className = 'gz-ad-hidden';
    banner.setAttribute('role', 'complementary');
    banner.setAttribute('aria-label', 'Advertisement');

    // Push game canvas up to avoid overlap
    var pushStyle = document.createElement('style');
    pushStyle.id = 'gz-bb-push';
    pushStyle.textContent = 'canvas{margin-bottom:60px!important;}#hud{margin-bottom:70px!important;}';

    banner.innerHTML = [
      '<div class="gz-banner-ad-slot">Ad</div>',
      '<div class="gz-banner-content">',
      '  <div class="gz-banner-text">',
      '    <div class="gz-banner-title">🎮 Play More Free Games!</div>',
      '    <div class="gz-banner-desc">Snake, 2048, Brick Breaker and 20+ more instantly</div>',
      '  </div>',
      '  <a href="/#games" class="gz-banner-cta" id="gz-bb-cta">Play Now</a>',
      '</div>',
      '<button class="gz-banner-close" aria-label="Close ad" id="gz-bb-close">×</button>'
    ].join('');

    document.body.appendChild(banner);
    document.head.appendChild(pushStyle);

    // Event listeners
    document.getElementById('gz-bb-close').addEventListener('click', hide);
    document.getElementById('gz-bb-cta').addEventListener('click', function () {
      GZ_AB.track('click', 'bottom-banner', location.pathname);
    });

    banner.addEventListener('click', function () {
      GZ_AB.track('impression', 'bottom-banner', location.pathname);
    });
  }

  function show() {
    if (!shouldShow()) return;
    var banner = document.getElementById(BANNER_ID);
    if (!banner) render();
    banner = document.getElementById(BANNER_ID);
    if (!banner) return;

    banner.classList.remove('gz-ad-hidden');
    banner.classList.add('gz-ad-visible');
    incrementSession();
    GZ_AB.track('impression', 'bottom-banner', location.pathname);

    // Auto-hide after 30s
    setTimeout(function () {
      if (banner.classList.contains('gz-ad-visible')) {
        hide();
      }
    }, AUTO_HIDE_AFTER_MS);
  }

  function hide() {
    var banner = document.getElementById(BANNER_ID);
    if (!banner) return;
    banner.classList.remove('gz-ad-visible');
    banner.classList.add('gz-ad-hidden');
  }

  function init() {
    if (!isGamePage()) return;
    if (!isTargetGame()) return;
    if (!window.GZ_AB) {
      // Framework not loaded yet, wait
      document.addEventListener('GZ_AB_ready', show, { once: true });
      return;
    }
    if (!GZ_AB.isActive('bottom-banner')) return;

    render();

    // Show on game-over (after Monetag popunder fires)
    // Note: games dispatch 'gameover' (no hyphen) — fixed mismatch in 667d91e
    window.addEventListener('gameover', function () {
      setTimeout(show, 500);
    });

    // Or show after 30s of gameplay (non-intrusive)
    setTimeout(show, 30000);
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init, { once: true });
  } else {
    init();
  }

  // Expose API
  window.GZ_AdBottomBanner = { show: show, hide: hide, shouldShow: shouldShow };
})();
