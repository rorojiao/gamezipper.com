/**
 * EXPERIMENT 2: Interstitial Ads Between Game Levels
 * 
 * Trigger: After a level ends, show a brief interstitial ad
 * Safe zones: never interrupt during active gameplay
 * Only for games that have levels/milestones
 * 
 * Rollback: GZ_AB.rollback('interstitial-level')
 * URL param: ?rollback=interstitial-level
 */
(function () {
  'use strict';

  var OVERLAY_ID = 'gz-interstitial-ad-overlay';
  var COUNT_KEY = 'gz_interstitial_count';
  var LAST_KEY = 'gz_interstitial_last';
  var MAX_PER_SESSION = 2;
  var MIN_LEVEL_SCORE = 50; // minimum score per "level"
  var COOLDOWN_MS = 60000; // minimum 60s between interstitials

  var STYLE = [
    '#' + OVERLAY_ID + '{position:fixed;inset:0;z-index:9990;background:rgba(0,0,0,.92);display:none;flex-direction:column;align-items:center;justify-content:center;font-family:system-ui,-apple-system,sans-serif;}',
    '#' + OVERLAY_ID + '.gz-ad-visible{display:flex;}',
    '#' + OVERLAY_ID + '.gz-ad-hidden{display:none!important;}',
    '#' + OVERLAY_ID + ' .gz-int-title{color:#4ecdc4;font-size:14px;font-weight:700;margin-bottom:16px;text-transform:uppercase;letter-spacing:2px;}',
    '#' + OVERLAY_ID + ' .gz-int-ad-container{width:min(320px,90vw);height:min(100px,25vw);background:rgba(255,255,255,.06);border:1px solid rgba(255,255,255,.1);border-radius:12px;display:flex;align-items:center;justify-content:center;color:#555;font-size:12px;margin-bottom:16px;position:relative;overflow:hidden;}',
    '#' + OVERLAY_ID + ' .gz-int-ad-container .gz-int-ad-inner{text-align:center;}',
    '#' + OVERLAY_ID + ' .gz-int-ad-container .gz-int-ad-inner .gz-int-ad-headline{color:#fff;font-size:16px;font-weight:700;display:block;margin-bottom:4px;}',
    '#' + OVERLAY_ID + ' .gz-int-ad-container .gz-int-ad-inner .gz-int-ad-body{color:#aaa;font-size:12px;display:block;}',
    '#' + OVERLAY_ID + ' .gz-int-countdown{color:#fff;font-size:13px;margin-bottom:20px;}',
    '#' + OVERLAY_ID + ' .gz-int-countdown span{color:#4ecdc4;font-weight:700;}',
    '#' + OVERLAY_ID + ' .gz-int-skip{background:rgba(255,255,255,.1);border:1px solid rgba(255,255,255,.2);color:#fff;font-size:13px;padding:10px 24px;border-radius:999px;cursor:pointer;transition:all .2s;}',
    '#' + OVERLAY_ID + ' .gz-int-skip:hover{background:rgba(255,255,255,.2);}',
    '#' + OVERLAY_ID + ' .gz-int-skip:disabled{opacity:.4;cursor:not-allowed;}'
  ].join('');

  function isGamePage() {
    return location.pathname !== '/' && /\/$/.test(location.pathname) && !/games\.html$/.test(location.pathname);
  }

  function isLevelGame() {
    // Only for games that signal "level complete"
    // The game dispatches CustomEvent('level-complete', {detail: {score, level}})
    return true; // all games can try, level-complete event determines eligibility
  }

  function getSessionCount() {
    try { return parseInt(sessionStorage.getItem(COUNT_KEY) || '0', 10); } catch (e) { return 0; }
  }

  function getLastShown() {
    try { return parseInt(sessionStorage.getItem(LAST_KEY) || '0', 10); } catch (e) { return 0; }
  }

  function canShow() {
    if (!isGamePage()) return false;
    if (!window.GZ_AB) return false;
    if (!window.GZ_AB.isInVariant('interstitial-level')) return false;
    if (getSessionCount() >= MAX_PER_SESSION) return false;
    if (Date.now() - getLastShown() < COOLDOWN_MS) return false;
    return true;
  }

  function recordShown() {
    try {
      sessionStorage.setItem(COUNT_KEY, String(getSessionCount() + 1));
      sessionStorage.setItem(LAST_KEY, String(Date.now()));
    } catch (e) {}
  }

  function ensureStyle() {
    if (document.getElementById('gz-int-style')) return;
    var el = document.createElement('style');
    el.id = 'gz-int-style';
    el.textContent = STYLE;
    document.head.appendChild(el);
  }

  function render() {
    if (document.getElementById(OVERLAY_ID)) return;
    ensureStyle();

    var overlay = document.createElement('div');
    overlay.id = OVERLAY_ID;
    overlay.className = 'gz-ad-hidden';
    overlay.setAttribute('role', 'dialog');
    overlay.setAttribute('aria-label', 'Advertisement');
    overlay.setAttribute('aria-modal', 'true');

    overlay.innerHTML = [
      '<div class="gz-int-title">Advertisement</div>',
      '<div class="gz-int-ad-container">',
      '  <div class="gz-int-ad-inner">',
      '    <span class="gz-int-ad-headline">🎮 Discover 20+ Free Games</span>',
      '    <span class="gz-int-ad-body">No download needed · Play instantly</span>',
      '  </div>',
      '</div>',
      '<div class="gz-int-countdown">Next level in <span id="gz-int-timer">5</span>s</div>',
      '<button class="gz-int-skip" id="gz-int-skip" disabled>Skip in 3s</button>'
    ].join('');

    document.body.appendChild(overlay);

    // Skip button
    var skipBtn = document.getElementById('gz-int-skip');
    var timerEl = document.getElementById('gz-int-timer');
    var countdown = 5;

    skipBtn.addEventListener('click', function () {
      if (countdown <= 0) hide();
    });
  }

  function show(opt_level, opt_score) {
    if (!canShow()) return;
    var overlay = document.getElementById(OVERLAY_ID);
    if (!overlay) render();
    overlay = document.getElementById(OVERLAY_ID);

    overlay.classList.remove('gz-ad-hidden');
    overlay.classList.add('gz-ad-visible');

    // Freeze game canvas behind overlay
    window.dispatchEvent(new CustomEvent('gz-interstitial-showing'));

    recordShown();
    GZ_AB.track('impression', 'interstitial-level', location.pathname);

    // Countdown
    var timerEl = overlay.querySelector('#gz-int-timer');
    var skipBtn = overlay.querySelector('#gz-int-skip');
    var countdown = 5;

    var interval = setInterval(function () {
      countdown--;
      if (timerEl) timerEl.textContent = countdown;
      if (countdown <= 0) {
        clearInterval(interval);
        if (skipBtn) {
          skipBtn.disabled = false;
          skipBtn.textContent = 'Continue Playing →';
        }
      } else {
        if (skipBtn && countdown <= 3) {
          skipBtn.textContent = 'Skip in ' + countdown + 's';
        }
      }
    }, 1000);

    overlay._interval = interval;
  }

  function hide() {
    var overlay = document.getElementById(OVERLAY_ID);
    if (!overlay) return;
    if (overlay._interval) clearInterval(overlay._interval);
    overlay.classList.remove('gz-ad-visible');
    overlay.classList.add('gz-ad-hidden');
    window.dispatchEvent(new CustomEvent('gz-interstitial-hidden'));
  }

  function init() {
    if (!isGamePage()) return;
    if (!window.GZ_AB) {
      document.addEventListener('GZ_AB_ready', init, { once: true });
      return;
    }
    if (!GZ_AB.isActive('interstitial-level')) return;

    render();

    // Listen for level-complete events from games
    window.addEventListener('level-complete', function (e) {
      var score = e.detail && e.detail.score ? e.detail.score : 0;
      if (score >= MIN_LEVEL_SCORE) {
        setTimeout(function () { show(null, score); }, 300);
      }
    });

    // For Snake (no explicit levels): show after milestone scores
    window.addEventListener('milestone-reached', function (e) {
      var milestone = e.detail && e.detail.milestone ? e.detail.milestone : 0;
      if (milestone >= 50) {
        setTimeout(function () { show(null, milestone); }, 300);
      }
    });

    // ESC key to dismiss (accessibility)
    document.addEventListener('keydown', function (e) {
      if (e.key === 'Escape') {
        var overlay = document.getElementById(OVERLAY_ID);
        if (overlay && overlay.classList.contains('gz-ad-visible')) {
          hide();
        }
      }
    });
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init, { once: true });
  } else {
    init();
  }

  window.GZ_Interstitial = { show: show, hide: hide };
})();
