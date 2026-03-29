/**
 * GameZipper UX-safe promo rail
 * 目标：绝不打断游戏，不再弹全屏、不拦截返回、不注入定时遮罩。
 * 行为：仅在首页/分类页渲染一个页面内联推荐条；游戏页完全不做任何打断式动作。
 */
(function () {
  'use strict';

  var RAIL_ID = 'gz-promo-rail';
  var STYLE_ID = 'gz-promo-rail-style';

  function isGamePage() {
    return location.pathname !== '/' && /\/$/.test(location.pathname) && !/games\.html$/.test(location.pathname);
  }

  function isHubPage() {
    return location.pathname === '/' || /games\.html$/.test(location.pathname);
  }

  function ensureStyle() {
    if (document.getElementById(STYLE_ID)) return;
    var style = document.createElement('style');
    style.id = STYLE_ID;
    style.textContent = [
      '#' + RAIL_ID + '{margin:24px auto 32px;max-width:1100px;padding:0 16px;}',
      '#' + RAIL_ID + ' .gz-card{background:linear-gradient(180deg,rgba(17,24,39,.98),rgba(15,23,42,.96));border:1px solid rgba(78,205,196,.22);border-radius:20px;padding:18px 18px 14px;box-shadow:0 10px 30px rgba(0,0,0,.15);}',
      '#' + RAIL_ID + ' .gz-head{display:flex;align-items:center;justify-content:space-between;gap:12px;margin-bottom:14px;flex-wrap:wrap;}',
      '#' + RAIL_ID + ' .gz-title{font:700 18px/1.3 system-ui,-apple-system,sans-serif;color:#e6fffb;}',
      '#' + RAIL_ID + ' .gz-sub{font:400 13px/1.5 system-ui,-apple-system,sans-serif;color:#9fb0c8;}',
      '#' + RAIL_ID + ' .gz-grid{display:grid;grid-template-columns:repeat(auto-fit,minmax(150px,1fr));gap:12px;}',
      '#' + RAIL_ID + ' a.gz-item{text-decoration:none;background:rgba(255,255,255,.03);border:1px solid rgba(255,255,255,.08);border-radius:16px;padding:14px 12px;display:flex;flex-direction:column;align-items:flex-start;min-height:94px;transition:transform .18s ease,border-color .18s ease,background .18s ease;}',
      '#' + RAIL_ID + ' a.gz-item:hover{transform:translateY(-2px);border-color:rgba(78,205,196,.5);background:rgba(78,205,196,.08);}',
      '#' + RAIL_ID + ' .gz-emoji{font-size:28px;margin-bottom:8px;}',
      '#' + RAIL_ID + ' .gz-name{font:700 14px/1.4 system-ui,-apple-system,sans-serif;color:#f8fafc;}',
      '#' + RAIL_ID + ' .gz-tag{font:500 12px/1.3 system-ui,-apple-system,sans-serif;color:#8ddad1;margin-top:4px;}',
      '@media (max-width:640px){#' + RAIL_ID + '{padding:0 12px;margin:18px auto 24px;}}'
    ].join('');
    document.head.appendChild(style);
  }

  function chooseGames() {
    var items = [
      { name: '2048 Galaxy', emoji: '🌌', url: '/2048/', tag: 'Number Puzzle' },
      { name: 'Sushi Stack', emoji: '🍣', url: '/sushi-stack/', tag: '3D Sort' },
      { name: 'Bolt Jam 3D', emoji: '🔩', url: '/bolt-jam-3d/', tag: 'Puzzle 3D' },
      { name: 'Ocean Gem Pop', emoji: '🧜', url: '/ocean-gem-pop/', tag: 'Bubble Shooter' },
      { name: 'Typing Speed', emoji: '⚡', url: '/typing-speed/', tag: 'Skill Typing' },
      { name: 'Snake', emoji: '🐍', url: '/snake/', tag: 'Arcade Retro' }
    ];
    return items.filter(function (item) { return item.url !== location.pathname; }).slice(0, 6);
  }

  function findMountPoint() {
    return document.querySelector('.faq-section, #faq, footer') || document.body;
  }

  function renderHubRail() {
    if (!isHubPage() || document.getElementById(RAIL_ID)) return;
    ensureStyle();
    var games = chooseGames();
    var wrap = document.createElement('section');
    wrap.id = RAIL_ID;
    wrap.setAttribute('aria-label', 'Recommended games');
    wrap.innerHTML = [
      '<div class="gz-card">',
      '  <div class="gz-head">',
      '    <div>',
      '      <div class="gz-title">🎮 Continue with another quick game</div>',
      '      <div class="gz-sub">In-page recommendations only. No popups, no overlays, no interruptions.</div>',
      '    </div>',
      '  </div>',
      '  <div class="gz-grid">',
      games.map(function (g) {
        return '<a class="gz-item" href="' + g.url + '"><div class="gz-emoji">' + g.emoji + '</div><div class="gz-name">' + g.name + '</div><div class="gz-tag">' + g.tag + '</div></a>';
      }).join(''),
      '  </div>',
      '</div>'
    ].join('');
    var mount = findMountPoint();
    if (mount === document.body) document.body.appendChild(wrap);
    else mount.parentNode.insertBefore(wrap, mount);
  }

  function init() {
    if (isGamePage()) {
      window.dispatchEvent(new CustomEvent('gz-ads-disabled-on-gamepage'));
      return;
    }
    renderHubRail();
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init, { once: true });
  } else {
    init();
  }
})();
