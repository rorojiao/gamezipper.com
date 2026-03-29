/**
 * EXPERIMENT 4: Tools Site Recommendation Section
 * 
 * Location: tools.gamezipper.com - below results
 * Shows recommended games/tools after user finishes using a tool
 * 
 * Rollback: GZ_AB.rollback('tools-recommendation')
 * URL param: ?rollback=tools-recommendation
 */
(function () {
  'use strict';

  var REC_ID = 'gz-tools-recommendation';
  var SHOWN_KEY = 'gz_tools_rec_shown';
  var STYLE = [
    '#' + REC_ID + '{margin:32px 0;padding:0 16px;max-width:800px;margin-left:auto;margin-right:auto;}',
    '#' + REC_ID + '.gz-ad-hidden{display:none!important;}',
    '#' + REC_ID + ' .gz-rec-card{background:linear-gradient(135deg,#1a1a3e,#2d1b69);border:1px solid rgba(78,205,196,.25);border-radius:20px;padding:24px;}',
    '#' + REC_ID + ' .gz-rec-title{color:#fff;font-size:18px;font-weight:700;margin-bottom:6px;}',
    '#' + REC_ID + ' .gz-rec-sub{color:#9fb0c8;font-size:13px;margin-bottom:18px;}',
    '#' + REC_ID + ' .gz-rec-grid{display:grid;grid-template-columns:repeat(auto-fit,minmax(160px,1fr));gap:12px;}',
    '#' + REC_ID + ' a.gz-rec-item{background:rgba(255,255,255,.04);border:1px solid rgba(255,255,255,.1);border-radius:16px;padding:14px 12px;display:flex;flex-direction:column;align-items:center;text-decoration:none;transition:transform .18s,border-color .18s;}',
    '#' + REC_ID + ' a.gz-rec-item:hover{transform:translateY(-2px);border-color:rgba(78,205,196,.5);}',
    '#' + REC_ID + ' .gz-rec-emoji{font-size:32px;margin-bottom:8px;}',
    '#' + REC_ID + ' .gz-rec-name{color:#fff;font-size:13px;font-weight:700;text-align:center;}',
    '#' + REC_ID + ' .gz-rec-tag{color:#4ecdc4;font-size:11px;margin-top:4px;text-align:center;}'
  ].join('');

  // Recommendations that differ by tool type
  var RECS_BY_TOOL = {
    default: [
      { name: '2048 Galaxy', emoji: '🌌', url: '/2048/', tag: 'Number Puzzle' },
      { name: 'Sushi Stack', emoji: '🍣', url: '/sushi-stack/', tag: '3D Sort' },
      { name: 'Bolt Jam 3D', emoji: '🔩', url: '/bolt-jam-3d/', tag: '3D Puzzle' },
      { name: 'Snake Classic', emoji: '🐍', url: '/snake/', tag: 'Arcade' },
      { name: 'Idle Clicker', emoji: '🖱️', url: '/idle-clicker/', tag: 'Idle Game' },
      { name: 'Typing Speed', emoji: '⚡', url: '/typing-speed/', tag: 'Skill' }
    ]
  };

  function isToolsPage() {
    return location.hostname.indexOf('tools.gamezipper.com') !== -1 ||
           location.pathname.indexOf('/tools') !== -1 ||
           document.body.dataset.toolPage === 'true';
  }

  function findMountPoint() {
    // Insert after results container or main content
    return document.querySelector('.results-container, main, .tool-content, #result, article') ||
           document.body;
  }

  function canShow() {
    if (!isToolsPage()) return false;
    if (!window.GZ_AB) return false;
    if (!window.GZ_AB.isInVariant('tools-recommendation')) return false;
    try { if (sessionStorage.getItem(SHOWN_KEY) === '1') return false; } catch (e) {}
    return true;
  }

  function ensureStyle() {
    if (document.getElementById('gz-tools-rec-style')) return;
    var el = document.createElement('style');
    el.id = 'gz-tools-rec-style';
    el.textContent = STYLE;
    document.head.appendChild(el);
  }

  function render() {
    if (document.getElementById(REC_ID)) return;
    ensureStyle();

    var toolType = document.body.dataset.toolType || 'default';
    var recs = RECS_BY_TOOL[toolType] || RECS_BY_TOOL.default;

    var wrap = document.createElement('section');
    wrap.id = REC_ID;
    wrap.setAttribute('aria-label', 'Recommended games after using tools');
    wrap.innerHTML = [
      '<div class="gz-rec-card">',
      '  <div class="gz-rec-title">🎮 Enjoyed that tool? Play a quick game!</div>',
      '  <div class="gz-rec-sub">No download needed — 20+ free games, instantly in your browser</div>',
      '  <div class="gz-rec-grid">',
      recs.map(function (r) {
        return '<a class="gz-rec-item" href="' + r.url + '">' +
          '<div class="gz-rec-emoji">' + r.emoji + '</div>' +
          '<div class="gz-rec-name">' + r.name + '</div>' +
          '<div class="gz-rec-tag">' + r.tag + '</div>' +
          '</a>';
      }).join(''),
      '  </div>',
      '</div>'
    ].join('');

    var mount = findMountPoint();
    if (mount === document.body) {
      document.body.appendChild(wrap);
    } else {
      mount.parentNode.insertBefore(wrap, mount.nextSibling);
    }

    // Track clicks on recommendation items
    wrap.querySelectorAll('.gz-rec-item').forEach(function (link) {
      link.addEventListener('click', function () {
        GZ_AB.track('click', 'tools-recommendation', location.pathname);
      });
    });
  }

  function show() {
    if (!canShow()) return;
    render();
    var el = document.getElementById(REC_ID);
    if (el) el.classList.remove('gz-ad-hidden');
    try { sessionStorage.setItem(SHOWN_KEY, '1'); } catch (e) {}
    GZ_AB.track('impression', 'tools-recommendation', location.pathname);
  }

  function hide() {
    var el = document.getElementById(REC_ID);
    if (!el) return;
    el.classList.add('gz-ad-hidden');
  }

  function init() {
    if (!isToolsPage()) return;
    if (!window.GZ_AB) {
      document.addEventListener('GZ_AB_ready', show, { once: true });
      return;
    }
    if (!GZ_AB.isActive('tools-recommendation')) return;

    // Show after user completes a tool action (simulated by custom event)
    var shown = false;
    window.addEventListener('tool-result-ready', function () {
      if (shown) return;
      shown = true;
      setTimeout(show, 1500);
    });

    // Also show after 10s on tools page regardless
    setTimeout(show, 10000);
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init, { once: true });
  } else {
    init();
  }

  window.GZ_ToolsRec = { show: show, hide: hide };
})();
