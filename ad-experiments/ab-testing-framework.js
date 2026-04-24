/**
 * A/B Testing Framework for Monetag Ad Experiments
 * Usage:
 *   GZ_AB.isInVariant('bottom-banner')  // returns boolean
 *   GZ_AB.track('impression', 'bottom-banner', 'game-page')
 *   GZ_AB.track('click', 'bottom-banner', 'game-page')
 *   GZ_AB.getVariant('bottom-banner')   // 'control' | 'variant' | null
 */
(function () {
  'use strict';

  var STORAGE_KEY = 'gz_ab_';
  var EXPERIMENTS_KEY = STORAGE_KEY + 'experiments';
  var SESSION_KEY = STORAGE_KEY + 'session';
  var VARIANT_RATIO = 0.5; // 50% variant, 50% control

  // Active experiments config — dates extended to 2026-05-15 for continued testing
  var EXPERIMENTS = {
    'bottom-banner': {
      id: 'exp_bottom_banner_v1',
      description: 'Bottom fixed banner ad on game pages',
      startDate: '2026-03-30',
      endDate: '2026-05-15',
      targetZone: 'game',
      targetGame: 'snake',
      variantRatio: VARIANT_RATIO,
      metrics: ['impression', 'click', 'bounce_rate', 'game_completion', 'revenue']
    },
    'interstitial-level': {
      id: 'exp_interstitial_level_v1',
      description: 'Interstitial ad between game levels',
      startDate: '2026-03-31',
      endDate: '2026-05-15',
      targetZone: 'game',
      targetGame: 'all',
      variantRatio: VARIANT_RATIO,
      metrics: ['impression', 'click', 'level_skip_rate', 'session_length', 'revenue']
    },
    'sidebar-native': {
      id: 'exp_sidebar_native_v1',
      description: 'Sidebar native ad on game pages',
      startDate: '2026-04-01',
      endDate: '2026-05-15',
      targetZone: 'game',
      targetGame: 'all',
      variantRatio: VARIANT_RATIO,
      metrics: ['impression', 'click', 'scroll_depth', 'revenue']
    },
    'tools-recommendation': {
      id: 'exp_tools_recommendation_v1',
      description: 'Recommendation section below tool results',
      startDate: '2026-04-01',
      endDate: '2026-05-15',
      targetZone: 'tools',
      targetGame: null,
      variantRatio: VARIANT_RATIO,
      metrics: ['impression', 'click', 'tools_usage', 'revenue']
    },
    'native-push': {
      id: 'exp_native_push_v1',
      description: 'Native browser push notification prompt',
      startDate: '2026-04-02',
      endDate: '2026-05-15',
      targetZone: 'hub',
      targetGame: null,
      variantRatio: VARIANT_RATIO,
      metrics: ['impression', 'opt_in', 'returning_user_rate', 'revenue']
    }
  };

  // Rollback configs
  var ROLLBACK = {
    'bottom-banner': {
      selector: '#gz-bottom-banner-ad',
      cssClass: 'gz-ad-hidden',
      localStorageKeys: ['gz_bottom_banner_session', 'gz_bb_impressions']
    },
    'interstitial-level': {
      selector: '#gz-interstitial-ad-overlay',
      cssClass: 'gz-ad-hidden',
      localStorageKeys: ['gz_interstitial_count', 'gz_interstitial_last']
    },
    'sidebar-native': {
      selector: '#gz-sidebar-native-ad',
      cssClass: 'gz-ad-hidden',
      localStorageKeys: ['gz_sidebar_shown']
    },
    'tools-recommendation': {
      selector: '#gz-tools-recommendation',
      cssClass: 'gz-ad-hidden',
      localStorageKeys: ['gz_tools_rec_shown']
    },
    'native-push': {
      selector: '#gz-push-notification-prompt',
      cssClass: 'gz-ad-hidden',
      localStorageKeys: ['gz_push_optin_shown', 'gz_push_dismissed']
    }
  };

  function isActive(expKey) {
    var exp = EXPERIMENTS[expKey];
    if (!exp) return false;
    var now = new Date();
    return now >= new Date(exp.startDate) && now <= new Date(exp.endDate);
  }

  function hashString(str) {
    var hash = 0;
    for (var i = 0; i < str.length; i++) {
      hash = ((hash << 5) - hash) + str.charCodeAt(i);
      hash = hash & hash;
    }
    return Math.abs(hash);
  }

  function getUserId() {
    var uid = sessionStorage.getItem(STORAGE_KEY + 'uid');
    if (!uid) {
      uid = 'u_' + Math.random().toString(36).substr(2, 9) + '_' + Date.now();
      sessionStorage.setItem(STORAGE_KEY + 'uid', uid);
    }
    return uid;
  }

  function assignVariant(expKey) {
    var exp = EXPERIMENTS[expKey];
    if (!exp) return null;
    var hash = hashString(getUserId() + expKey);
    return (hash % 1000) / 1000 < exp.variantRatio ? 'variant' : 'control';
  }

  function getExperimentData() {
    try {
      return JSON.parse(localStorage.getItem(EXPERIMENTS_KEY) || '{}');
    } catch (e) { return {}; }
  }

  function saveExperimentData(data) {
    try { localStorage.setItem(EXPERIMENTS_KEY, JSON.stringify(data)); } catch (e) {}
  }

  function getVariant(expKey) {
    if (!isActive(expKey)) return null;
    var data = getExperimentData();
    if (data[expKey] && data[expKey].rolledBack) return null;
    if (data[expKey] && data[expKey].variant) return data[expKey].variant;
    var variant = assignVariant(expKey);
    data[expKey] = { variant: variant, assignedAt: Date.now() };
    saveExperimentData(data);
    return variant;
  }

  function track(event, expKey, location) {
    var exp = EXPERIMENTS[expKey];
    if (!exp || !isActive(expKey)) return;
    var variant = getVariant(expKey);
    var payload = {
      event: event,
      experiment: exp.id,
      variant: variant,
      location: location || window.location.pathname,
      timestamp: Date.now(),
      userId: getUserId()
    };
    try {
      new Image().src = 'https://gamezipper-bi.cap.1ktower.com/ab-track?d=' + encodeURIComponent(JSON.stringify(payload));
    } catch (e) { console.warn('[GZ_AB]', e); }
  }

  function rollback(expKey) {
    var rb = ROLLBACK[expKey];
    if (!rb) return;
    var els = document.querySelectorAll(rb.selector);
    els.forEach(function (el) {
      el.classList.add(rb.cssClass);
      el.style.display = 'none';
    });
    (rb.localStorageKeys || []).forEach(function (k) { localStorage.removeItem(k); });
    var data = getExperimentData();
    if (data[expKey]) data[expKey].rolledBack = true;
    saveExperimentData(data);
    console.warn('[GZ_AB] Rollback executed for:', expKey);
    track('rollback', expKey, window.location.pathname);
  }

  window.GZ_AB = {
    EXPERIMENTS: EXPERIMENTS,
    isActive: isActive,
    getVariant: getVariant,
    isInVariant: function (expKey) {
      if (!isActive(expKey)) return false;
      var data = getExperimentData();
      return !data[expKey]?.rolledBack && getVariant(expKey) === 'variant';
    },
    track: track,
    rollback: rollback,
    emergencyRollback: function (expKey) {
      rollback(expKey);
      console.warn('[GZ_AB] EMERGENCY ROLLBACK for', expKey);
    },
    getUserId: getUserId
  };

  // Auto-rollback from URL param: ?rollback=bottom-banner
  try {
    var params = new URLSearchParams(window.location.search);
    var rbKey = params.get('rollback');
    if (rbKey && ROLLBACK[rbKey]) rollback(rbKey);
  } catch (e) {}

  console.log('[GZ_AB] Loaded. Active:', Object.keys(EXPERIMENTS).filter(isActive));
})();
