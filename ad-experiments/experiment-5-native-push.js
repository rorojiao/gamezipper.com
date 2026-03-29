/**
 * EXPERIMENT 5: Native Browser Push Notification Prompt
 * 
 * Location: Hub page only (index.html)
 * Trigger: After user has been on page for 30s + has scrolled
 * Non-blocking: does NOT interrupt gameplay
 * 
 * Rollback: GZ_AB.rollback('native-push')
 * URL param: ?rollback=native-push
 */
(function () {
  'use strict';

  var PROMPT_ID = 'gz-push-notification-prompt';
  var OPTIN_KEY = 'gz_push_optin_shown';
  var DISMISS_KEY = 'gz_push_dismissed';
  var SESSION_DISMISS_KEY = 'gz_push_session_dismissed';

  var STYLE = [
    '#' + PROMPT_ID + '{position:fixed;bottom:20px;left:50%;transform:translateX(-50%) translateY(150%);z-index:9500;background:linear-gradient(135deg,#1a1a3e,#2d1b69);border:1px solid rgba(78,205,196,.4);border-radius:20px;padding:20px 24px;max-width:380px;width:calc(100vw - 32px);font-family:system-ui,-apple-system,sans-serif;box-shadow:0 20px 60px rgba(0,0,0,.5);transition:transform .4s cubic-bezier(.4,0,.2,1);}',
    '#' + PROMPT_ID + '.gz-ad-visible{transform:translateX(-50%) translateY(0);}',
    '#' + PROMPT_ID + '.gz-ad-hidden{display:none!important;}',
    '#' + PROMPT_ID + ' .gz-push-header{display:flex;align-items:flex-start;gap:12px;}',
    '#' + PROMPT_ID + ' .gz-push-icon{font-size:36px;flex-shrink:0;}',
    '#' + PROMPT_ID + ' .gz-push-body{flex:1;}',
    '#' + PROMPT_ID + ' .gz-push-title{color:#fff;font-size:15px;font-weight:700;margin-bottom:4px;}',
    '#' + PROMPT_ID + ' .gz-push-desc{color:#9fb0c8;font-size:12px;line-height:1.5;}',
    '#' + PROMPT_ID + ' .gz-push-actions{display:flex;gap:8px;margin-top:14px;}',
    '#' + PROMPT_ID + ' .gz-push-accept{background:#4ecdc4;color:#000;border:none;border-radius:999px;padding:9px 20px;font-size:13px;font-weight:700;cursor:pointer;flex:1;}',
    '#' + PROMPT_ID + ' .gz-push-dismiss{background:rgba(255,255,255,.08);color:#888;border:1px solid rgba(255,255,255,.15);border-radius:999px;padding:9px 16px;font-size:13px;cursor:pointer;}',
    '#' + PROMPT_ID + ' .gz-push-close{position:absolute;top:10px;right:12px;background:none;border:none;color:#555;font-size:18px;cursor:pointer;}'
  ].join('');

  function isHubPage() {
    return location.pathname === '/' || /games\.html$/.test(location.pathname);
  }

  function canShow() {
    if (!isHubPage()) return false;
    if (!window.GZ_AB) return false;
    if (!window.GZ_AB.isInVariant('native-push')) return false;
    try {
      if (sessionStorage.getItem(SESSION_DISMISS_KEY) === '1') return false;
      if (localStorage.getItem(DISMISS_KEY) === '1') return false;
      if (localStorage.getItem(OPTIN_KEY) === '1') return false;
    } catch (e) {}
    return true;
  }

  function ensureStyle() {
    if (document.getElementById('gz-push-style')) return;
    var el = document.createElement('style');
    el.id = 'gz-push-style';
    el.textContent = STYLE;
    document.head.appendChild(el);
  }

  function render() {
    if (document.getElementById(PROMPT_ID)) return;
    ensureStyle();

    var prompt = document.createElement('div');
    prompt.id = PROMPT_ID;
    prompt.className = 'gz-ad-hidden';
    prompt.setAttribute('role', 'dialog');
    prompt.setAttribute('aria-label', 'Enable notifications');
    prompt.style.position = 'relative';

    prompt.innerHTML = [
      '<button class="gz-push-close" id="gz-push-close-btn" aria-label="Close">×</button>',
      '<div class="gz-push-header">',
      '  <div class="gz-push-icon">🔔</div>',
      '  <div class="gz-push-body">',
      '    <div class="gz-push-title">Get notified for new games!</div>',
      '    <div class="gz-push-desc">We release 2-3 new free games every week. Get a heads-up when something new drops.</div>',
      '  </div>',
      '</div>',
      '<div class="gz-push-actions">',
      '  <button class="gz-push-accept" id="gz-push-accept-btn">Notify Me</button>',
      '  <button class="gz-push-dismiss" id="gz-push-dismiss-btn">No Thanks</button>',
      '</div>'
    ].join('');

    document.body.appendChild(prompt);

    document.getElementById('gz-push-close-btn').addEventListener('click', dismiss);
    document.getElementById('gz-push-dismiss-btn').addEventListener('click', dismiss);
    document.getElementById('gz-push-accept-btn').addEventListener('click', accept);
  }

  function show() {
    if (!canShow()) return;
    if (!document.getElementById(PROMPT_ID)) render();
    var el = document.getElementById(PROMPT_ID);
    if (!el) return;
    el.classList.remove('gz-ad-hidden');
    el.classList.add('gz-ad-visible');
    GZ_AB.track('impression', 'native-push', location.pathname);
  }

  function dismiss() {
    var el = document.getElementById(PROMPT_ID);
    if (el) {
      el.classList.remove('gz-ad-visible');
      el.classList.add('gz-ad-hidden');
    }
    try {
      sessionStorage.setItem(SESSION_DISMISS_KEY, '1');
      localStorage.setItem(DISMISS_KEY, '1');
    } catch (e) {}
    GZ_AB.track('dismiss', 'native-push', location.pathname);
  }

  function accept() {
    var el = document.getElementById(PROMPT_ID);
    if (el) {
      el.classList.remove('gz-ad-visible');
      el.classList.add('gz-ad-hidden');
    }
    try {
      localStorage.setItem(OPTIN_KEY, '1');
    } catch (e) {}
    GZ_AB.track('opt_in', 'native-push', location.pathname);

    // Try to request notification permission (Web Push API)
    if ('Notification' in window && Notification.permission === 'default') {
      Notification.requestPermission().then(function (permission) {
        if (permission === 'granted') {
          GZ_AB.track('notification_granted', 'native-push', location.pathname);
          // Subscribe to push (requires VAPID key setup on backend)
          subscribePush();
        } else {
          GZ_AB.track('notification_denied', 'native-push', location.pathname);
        }
      }).catch(function () {
        GZ_AB.track('notification_error', 'native-push', location.pathname);
      });
    } else {
      // Fallback: just track the opt-in, no real push
      GZ_AB.track('push_fallback_optin', 'native-push', location.pathname);
    }
  }

  function subscribePush() {
    // This requires a push service subscription (web-push + VAPID keys)
    // Placeholder for when backend push infrastructure is ready
    console.log('[GZ_Push] Push subscription would happen here');
  }

  function init() {
    if (!isHubPage()) return;
    if (!window.GZ_AB) {
      document.addEventListener('GZ_AB_ready', init, { once: true });
      return;
    }
    if (!GZ_AB.isActive('native-push')) return;

    // Trigger after: 30s on page + user has scrolled
    var hasScrolled = false;
    var triggered = false;

    function tryShow() {
      if (triggered || !canShow()) return;
      triggered = true;
      show();
    }

    window.addEventListener('scroll', function () {
      if (!hasScrolled) {
        hasScrolled = true;
        setTimeout(tryShow, 3000); // show 3s after first scroll
      }
    }, { passive: true });

    setTimeout(function () {
      if (!triggered && hasScrolled) tryShow();
    }, 30000); // fallback: show after 30s even without scroll

    // ESC to dismiss
    document.addEventListener('keydown', function (e) {
      if (e.key === 'Escape') dismiss();
    });
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init, { once: true });
  } else {
    init();
  }

  window.GZ_NativePush = { show: show, dismiss: dismiss, accept: accept };
})();
