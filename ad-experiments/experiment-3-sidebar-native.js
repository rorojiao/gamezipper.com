/**
 * EXPERIMENT 3: Sidebar Native Ad on Game Pages
 * 
 * Position: Right sidebar (desktop) / hidden on mobile
 * Ad is purely decorative/affiliate, not blocking any game element
 * Does NOT affect canvas rendering or game controls
 * 
 * Rollback: GZ_AB.rollback('sidebar-native')
 * URL param: ?rollback=sidebar-native
 */
(function () {
  'use strict';

  var SIDEBAR_ID = 'gz-sidebar-native-ad';
  var SHOWN_KEY = 'gz_sidebar_shown';

  var STYLE = [
    '#' + SIDEBAR_ID + '{position:fixed;top:50%;right:0;transform:translateY(-50%);z-index:800;width:200px;max-height:calc(100vh - 120px);overflow-y:auto;padding:8px;display:none;}',
    '#' + SIDEBAR_ID + '.gz-ad-visible{display:block;}',
    '#' + SIDEBAR_ID + '.gz-ad-hidden{display:none!important;}',
    '#' + SIDEBAR_ID + ' .gz-side-card{background:rgba(15,20,35,.96);border:1px solid rgba(78,205,196,.2);border-radius:12px;padding:12px 10px;margin-bottom:10px;text-decoration:none;display:block;transition:transform .2s,border-color .2s;}',
    '#' + SIDEBAR_ID + ' .gz-side-card:hover{transform:translateX(-3px);border-color:rgba(78,205,196,.5);}',
    '#' + SIDEBAR_ID + ' .gz-side-emoji{font-size:28px;text-align:center;margin-bottom:6px;}',
    '#' + SIDEBAR_ID + ' .gz-side-title{color:#fff;font-size:12px;font-weight:700;text-align:center;margin-bottom:3px;}',
    '#' + SIDEBAR_ID + ' .gz-side-tag{color:#4ecdc4;font-size:10px;text-align:center;}',
    '@media (max-width:900px){#' + SIDEBAR_ID + '{display:none!important;}}'
  ].join('');

  var ADS = [
    { emoji: '🧩', title: '2048 Galaxy', tag: 'Number Puzzle', url: '/2048/' },
    { emoji: '🍣', title: 'Sushi Stack', tag: '3D Sort Game', url: '/sushi-stack/' },
    { emoji: '🔩', title: 'Bolt Jam 3D', tag: '3D Puzzle', url: '/bolt-jam-3d/' },
    { emoji: '🧜', title: 'Ocean Gem Pop', tag: 'Bubble Shooter', url: '/ocean-gem-pop/' },
    { emoji: '⚡', title: 'Typing Speed', tag: 'Skill Game', url: '/typing-speed/' },
    { emoji: '🌟', title: 'Idle Clicker', tag: 'Idle Game', url: '/idle-clicker/' }
  ];

  function isGamePage() {
    return location.pathname !== '/' && /\/$/.test(location.pathname) && !/games\.html$/.test(location.pathname);
  }

  function canShow() {
    if (!isGamePage()) return false;
    if (!window.GZ_AB) return false;
    return window.GZ_AB.isInVariant('sidebar-native');
  }

  function ensureStyle() {
    if (document.getElementById('gz-side-style')) return;
    var el = document.createElement('style');
    el.id = 'gz-side-style';
    el.textContent = STYLE;
    document.head.appendChild(el);
  }

  function render() {
    if (document.getElementById(SIDEBAR_ID)) return;
    ensureStyle();

    var sidebar = document.createElement('div');
    sidebar.id = SIDEBAR_ID;
    sidebar.setAttribute('aria-label', 'Recommended games');
    sidebar.innerHTML = ADS.map(function (ad) {
      return '<a class="gz-side-card" href="' + ad.url + '" target="_blank" rel="noopener">' +
        '<div class="gz-side-emoji">' + ad.emoji + '</div>' +
        '<div class="gz-side-title">' + ad.title + '</div>' +
        '<div class="gz-side-tag">' + ad.tag + '</div>' +
        '</a>';
    }).join('');

    document.body.appendChild(sidebar);
  }

  function show() {
    if (!canShow()) return;
    if (document.getElementById(SIDEBAR_ID)) {
      var el = document.getElementById(SIDEBAR_ID);
      el.classList.remove('gz-ad-hidden');
      el.classList.add('gz-ad-visible');
    } else {
      render();
    }
    try { sessionStorage.setItem(SHOWN_KEY, '1'); } catch (e) {}
    GZ_AB.track('impression', 'sidebar-native', location.pathname);
  }

  function hide() {
    var el = document.getElementById(SIDEBAR_ID);
    if (!el) return;
    el.classList.remove('gz-ad-visible');
    el.classList.add('gz-ad-hidden');
  }

  function init() {
    if (!isGamePage()) return;
    if (!window.GZ_AB) {
      document.addEventListener('GZ_AB_ready', show, { once: true });
      return;
    }
    if (!GZ_AB.isActive('sidebar-native')) return;
    show();
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init, { once: true });
  } else {
    init();
  }

  window.GZ_SidebarNative = { show: show, hide: hide };
})();
