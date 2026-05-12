/**
 * GameZipper Engagement Optimizer v1.0
 * 
 * Goals:
 * 1. Track recently played games (localStorage) → enable "Continue Playing" on return
 * 2. Show personalized "Continue Playing" section on homepage for returning visitors
 * 3. Detect game session end / user idle → show "Play More" recommendation
 * 4. Cross-promote: tools↔games
 * 
 * Privacy: localStorage only, no cookies, no tracking servers, no PII
 * Performance: < 2KB gzipped, zero external deps, requestIdleCallback
 */
(function() {
  'use strict';
  if (window.GZEngage) return;
  window.GZEngage = true;

  var STORAGE_KEY = 'gz_recent_games';
  var VISIT_KEY = 'gz_visits';
  var MAX_RECENT = 12;
  var TTL_DAYS = 30;

  // ── Helpers ──────────────────────────────────────────────
  function ls(key) {
    try { return localStorage; } catch(e) { return null; }
  }

  function isGamePage() {
    var p = location.pathname;
    // Game pages: /2048/, /snake/, etc — not root, not .html, not /blog/
    return p !== '/' && !/\.html?$/.test(p) && !p.startsWith('/blog') && !p.startsWith('/shared');
  }

  function isToolsSite() {
    return location.hostname === 'tools.gamezipper.com';
  }

  function getGameName() {
    // Extract from <title> or pathname
    var title = document.title;
    // "2048 Unblocked — Play Free 2048 Puzzle Game Online | GameZipper"
    var match = title.match(/^(.+?)\s*[-–—|]/);
    return match ? match[1].trim() : location.pathname.replace(/\//g, '');
  }

  function getGameEmoji() {
    // Try to get emoji from meta or og tags
    var og = document.querySelector('meta[property="og:description"]');
    if (og) {
      var emojiMatch = og.content.match(/[\u{1F300}-\u{1F9FF}\u{2600}-\u{26FF}\u{2700}-\u{27BF}]/u);
      if (emojiMatch) return emojiMatch[0];
    }
    // Default emojis by category
    var path = location.pathname.toLowerCase();
    if (path.includes('2048') || path.includes('puzzle') || path.includes('sort')) return '🧩';
    if (path.includes('snake')) return '🐍';
    if (path.includes('basketball')) return '🏀';
    if (path.includes('brick') || path.includes('break')) return '🧱';
    if (path.includes('flappy')) return '🐦';
    if (path.includes('mine')) return '💣';
    if (path.includes('word')) return '📝';
    if (path.includes('memory')) return '🧠';
    return '🎮';
  }

  // ── 1. Track Visit ──────────────────────────────────────
  function trackVisit() {
    if (!ls()) return;

    var recent = [];
    try { recent = JSON.parse(localStorage.getItem(STORAGE_KEY) || '[]'); } catch(e) {}

    var entry = {
      url: location.pathname,
      name: getGameName(),
      emoji: getGameEmoji(),
      ts: Date.now()
    };

    // Remove duplicate
    recent = recent.filter(function(r) { return r.url !== entry.url; });
    // Add to front
    recent.unshift(entry);
    // Limit
    if (recent.length > MAX_RECENT) recent = recent.slice(0, MAX_RECENT);

    // Filter expired
    var cutoff = Date.now() - TTL_DAYS * 86400000;
    recent = recent.filter(function(r) { return r.ts > cutoff; });

    try { localStorage.setItem(STORAGE_KEY, JSON.stringify(recent)); } catch(e) {}

    // Track visit count
    var visits = 0;
    try { visits = parseInt(localStorage.getItem(VISIT_KEY) || '0', 10); } catch(e) {}
    try { localStorage.setItem(VISIT_KEY, String(visits + 1)); } catch(e) {}
  }

  // ── 2. Show "Continue Playing" on Homepage ───────────────
  function showContinuePlaying() {
    if (!ls()) return;
    if (location.pathname !== '/') return;

    var recent = [];
    try { recent = JSON.parse(localStorage.getItem(STORAGE_KEY) || '[]'); } catch(e) {}
    if (recent.length < 1) return;

    var visits = 0;
    try { visits = parseInt(localStorage.getItem(VISIT_KEY) || '0', 10); } catch(e) {}
    // Only show for returning visitors (2+ visits)
    if (visits < 2) return;

    var container = document.createElement('section');
    container.id = 'gz-continue-playing';
    container.style.cssText = 'max-width:900px;margin:20px auto;padding:0 20px';

    var html = '<h2 style="font-size:20px;font-weight:700;color:#fff;margin-bottom:14px">🔄 Continue Playing</h2>';
    html += '<div style="display:grid;grid-template-columns:repeat(auto-fill,minmax(200px,1fr));gap:10px">';

    recent.slice(0, 6).forEach(function(game) {
      var timeAgo = getTimeAgo(game.ts);
      html += '<a href="' + game.url + '" style="background:linear-gradient(135deg,#1a1a2e,#16213e);border:1px solid #2a3a5c;border-radius:12px;padding:14px;text-decoration:none;color:#fff;display:flex;align-items:center;gap:10px;transition:transform 0.2s,border-color 0.2s" onmouseover="this.style.transform=\'translateY(-2px)\';this.style.borderColor=\'#4ecdc4\'" onmouseout="this.style.transform=\'none\';this.style.borderColor=\'#2a3a5c\'">';
      html += '<span style="font-size:28px">' + (game.emoji || '🎮') + '</span>';
      html += '<div><div style="font-size:14px;font-weight:600">' + escapeHtml(game.name) + '</div>';
      html += '<div style="font-size:11px;color:#888">' + timeAgo + '</div></div>';
      html += '</a>';
    });

    html += '</div>';
    container.innerHTML = html;

    // Insert before FAQ or "Recently Updated" section
    var insertBefore = document.getElementById('recently-updated') || 
                       document.querySelector('.faq-section');
    if (insertBefore) {
      insertBefore.parentNode.insertBefore(container, insertBefore);
    } else {
      document.body.insertBefore(container, document.body.firstChild);
    }
  }

  // ── 3. Game Session End Detection → "Play More" ────────
  function showPlayMoreOnIdle() {
    if (!isGamePage()) return;
    if (!ls()) return;

    var shown = false;
    var idleTime = 0;
    var IDLE_THRESHOLD = 45000; // 45 seconds idle on game page = likely done playing
    var MIN_SESSION = 30000;    // 30 seconds minimum before showing

    function resetIdle() {
      idleTime = 0;
    }

    function checkIdle() {
      if (shown) return;
      idleTime += 5000;
      if (idleTime >= IDLE_THRESHOLD && Date.now() - sessionStart >= MIN_SESSION) {
        showPlayMoreModal();
        shown = true;
      }
    }

    var sessionStart = Date.now();

    // Listen for user activity
    ['mousemove', 'keydown', 'touchstart', 'click', 'scroll'].forEach(function(evt) {
      document.addEventListener(evt, resetIdle, { passive: true });
    });

    // Also show when user tries to leave (beforeunload is limited, so use visibilitychange)
    document.addEventListener('visibilitychange', function() {
      if (document.hidden && !shown && Date.now() - sessionStart >= MIN_SESSION) {
        // User switched tabs — too late for modal, but save for next visit
        shown = true;
      } else if (!document.hidden && !shown) {
        // User came back — check if they were idle long enough
        idleTime = IDLE_THRESHOLD; // Force show since they were away
        checkIdle();
      }
    });

    // Periodic idle check
    setInterval(checkIdle, 5000);
  }

  function showPlayMoreModal() {
    var recent = [];
    try { recent = JSON.parse(localStorage.getItem(STORAGE_KEY) || '[]'); } catch(e) {}
    var currentPath = location.pathname;
    // Exclude current game, get 3-4 recommendations
    var others = recent.filter(function(r) { return r.url !== currentPath; }).slice(0, 4);

    // If not enough from history, add some popular ones
    if (others.length < 3) {
      var popular = [
        { url: '/2048/', name: '2048', emoji: '🧩' },
        { url: '/snake/', name: 'Snake', emoji: '🐍' },
        { url: '/basketball-shoot/', name: 'Basketball Shoot', emoji: '🏀' },
        { url: '/minesweeper/', name: 'Minesweeper', emoji: '💣' },
        { url: '/color-sort/', name: 'Color Sort', emoji: '🎨' }
      ];
      popular.forEach(function(p) {
        if (others.length < 4 && !others.some(function(o) { return o.url === p.url; }) && p.url !== currentPath) {
          others.push(p);
        }
      });
    }

    if (others.length === 0) return;

    // Build recommendation bar at top of page (non-blocking, no overlay)
    var bar = document.createElement('div');
    bar.id = 'gz-play-more';
    bar.style.cssText = 'position:fixed;top:0;left:0;right:0;background:linear-gradient(135deg,#0f0f23 0%,#1a1a3e 100%);border-bottom:2px solid #4ecdc4;padding:12px 20px;z-index:9998;display:flex;align-items:center;gap:12px;transform:translateY(-100%);transition:transform 0.4s ease;font-family:system-ui,sans-serif;box-shadow:0 4px 20px rgba(0,0,0,0.5)';

    var html = '<span style="font-size:18px;white-space:nowrap">🎮 Play Next:</span>';
    html += '<div style="display:flex;gap:8px;overflow-x:auto;flex:1">';
    others.forEach(function(game) {
      html += '<a href="' + game.url + '" style="background:#2a2a4a;color:#fff;padding:8px 16px;border-radius:20px;text-decoration:none;font-size:13px;font-weight:600;white-space:nowrap;transition:background 0.2s" onmouseover="this.style.background=\'#4ecdc4\';this.style.color=\'#000\'" onmouseout="this.style.background=\'#2a2a4a\';this.style.color=\'#fff\'">' + (game.emoji || '🎮') + ' ' + escapeHtml(game.name) + '</a>';
    });
    html += '</div>';
    html += '<button onclick="this.parentElement.remove()" style="background:none;border:none;color:#666;font-size:20px;cursor:pointer;padding:4px 8px;line-height:1" title="Close">&times;</button>';

    bar.innerHTML = html;
    document.body.appendChild(bar);

    // Animate in
    requestAnimationFrame(function() {
      requestAnimationFrame(function() {
        bar.style.transform = 'translateY(0)';
      });
    });

    // Auto-hide after 15 seconds
    setTimeout(function() {
      if (bar.parentNode) {
        bar.style.transform = 'translateY(-100%)';
        setTimeout(function() { if (bar.parentNode) bar.remove(); }, 400);
      }
    }, 15000);
  }

  // ── 4. Cross-Promote tools↔games ───────────────────────
  function crossPromote() {
    if (!ls()) return;
    var visits = 0;
    try { visits = parseInt(localStorage.getItem(VISIT_KEY) || '0', 10); } catch(e) {}

    // On game site: show tools link for frequent visitors (5+ visits)
    if (!isToolsSite() && visits >= 5 && isGamePage()) {
      var footer = document.querySelector('.gz-related-games') || document.querySelector('footer');
      if (footer) {
        var link = document.createElement('div');
        link.style.cssText = 'text-align:center;padding:16px;margin-top:20px';
        link.innerHTML = '<a href="https://tools.gamezipper.com/?utm_source=gamezipper&utm_medium=games&utm_campaign=cross-promote" style="display:inline-flex;align-items:center;gap:8px;background:#1a1a2e;border:1px solid #2a3a5c;border-radius:12px;padding:10px 20px;color:#4ecdc4;text-decoration:none;font-weight:600;font-size:14px;transition:all 0.2s" onmouseover="this.style.borderColor=\'#4ecdc4\'" onmouseout="this.style.borderColor=\'#2a3a5c\'">🔧 Need tools? Try 50+ Free Online Utilities →</a>';
        footer.parentNode.insertBefore(link, footer.nextSibling);
      }
    }

    // On tools site: show games link for frequent visitors
    if (isToolsSite() && visits >= 3) {
      var body = document.body;
      // Check if sticky-ad banner already exists to avoid overlap
      if (document.getElementById('gz-tools-sticky')) return;
      var banner = document.createElement('div');
      banner.style.cssText = 'text-align:center;padding:10px;background:#0a0a1a;border-top:1px solid #2a2a4a;position:fixed;bottom:0;left:0;right:0;z-index:9997';
      banner.innerHTML = '<a href="https://gamezipper.com/?utm_source=tools&utm_medium=games&utm_campaign=cross-promote" style="color:#4ecdc4;text-decoration:none;font-size:13px">🎮 Take a break? Play free games on GameZipper →</a>';
      body.appendChild(banner);
      // Auto-remove after 20s to avoid permanent overlap with sticky-ad
      setTimeout(function(){ if (banner.parentNode) banner.remove(); }, 20000);
    }
  }

  // ── Utilities ───────────────────────────────────────────
  function getTimeAgo(ts) {
    var diff = Date.now() - ts;
    var mins = Math.floor(diff / 60000);
    if (mins < 1) return 'Just now';
    if (mins < 60) return mins + 'm ago';
    var hours = Math.floor(mins / 60);
    if (hours < 24) return hours + 'h ago';
    var days = Math.floor(hours / 24);
    return days + 'd ago';
  }

  function escapeHtml(str) {
    var div = document.createElement('div');
    div.appendChild(document.createTextNode(str));
    return div.innerHTML;
  }

  // ── Initialize ──────────────────────────────────────────
  // Use requestIdleCallback for non-critical initialization
  function init() {
    trackVisit();
    showContinuePlaying();

    if ('requestIdleCallback' in window) {
      requestIdleCallback(function() {
        showPlayMoreOnIdle();
        crossPromote();
      });
    } else {
      setTimeout(function() {
        showPlayMoreOnIdle();
        crossPromote();
      }, 1000);
    }
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }

})();
