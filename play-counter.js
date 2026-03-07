(function() {
  'use strict';
  
  const ANALYTICS_URL = 'https://site-analytics.cap.1ktower.com';
  const SITE = 'gamezipper.com';
  
  function formatCount(n) {
    if (n >= 1000) return (n / 1000).toFixed(1).replace(/\.0$/, '') + 'k';
    return String(n);
  }
  
  // Aggregate counts across all dates, extract game slugs
  function extractGameCounts(stats) {
    const siteData = stats[SITE] || {};
    const counts = {};
    
    for (const [dateKey, paths] of Object.entries(siteData)) {
      if (typeof paths !== 'object') continue;
      for (const [path, count] of Object.entries(paths)) {
        // Match /game-slug/ but not / alone, not /privacy.html etc
        const match = path.match(/^\/([a-z0-9-]+)\/$/);
        if (match && count > 0) {
          const game = match[1];
          if (!['tools', 'about', 'privacy', 'sitemap', 'ads'].includes(game)) {
            counts[game] = (counts[game] || 0) + count;
          }
        }
      }
    }
    return counts;
  }
  
  function updateGameCards(counts) {
    if (!counts || Object.keys(counts).length === 0) return;
    
    const sorted = Object.entries(counts).sort((a, b) => b[1] - a[1]);
    const top3 = new Set(sorted.slice(0, 3).map(([k]) => k));
    
    const cards = document.querySelectorAll('a.game-card[href]');
    cards.forEach(card => {
      const href = card.getAttribute('href') || '';
      const match = href.match(/^\/?([a-z0-9-]+)\/?$/);
      if (!match) return;
      const game = match[1];
      if (!counts[game]) return;
      
      const count = counts[game];
      
      if (!card.querySelector('.play-count')) {
        const badge = document.createElement('div');
        badge.className = 'play-count';
        badge.style.cssText = 'position:absolute;bottom:6px;right:8px;font-size:11px;color:rgba(255,255,255,0.85);background:rgba(0,0,0,0.45);border-radius:10px;padding:2px 7px;pointer-events:none;font-family:sans-serif;font-weight:600;backdrop-filter:blur(4px);z-index:3;';
        badge.textContent = '🎮 ' + formatCount(count) + ' plays';
        card.appendChild(badge);
      }
      
      if (top3.has(game) && !card.querySelector('.hot-badge')) {
        // Remove existing NEW badge if this is a hot game
        const newBadge = card.querySelector('.new-badge');
        if (newBadge) newBadge.remove();
        
        const hot = document.createElement('div');
        hot.className = 'hot-badge';
        hot.style.cssText = 'position:absolute;top:10px;right:10px;font-size:0.7em;color:#fff;background:linear-gradient(135deg,#ff4500,#ff8c00);border-radius:10px;padding:3px 10px;pointer-events:none;font-family:sans-serif;font-weight:700;z-index:3;box-shadow:0 1px 4px rgba(0,0,0,0.3);animation:pulse 2s infinite;';
        hot.textContent = '🔥 Hot';
        card.appendChild(hot);
      }
      
      card.dataset.playCount = count;
    });
    
    
  }
  
  function sortGameCards() {
    const allCards = Array.from(document.querySelectorAll('a.game-card[data-play-count]'));
    if (allCards.length < 2) return;
    
    const container = allCards[0].parentElement;
    if (!container) return;
    
    // Also include cards without play count (put them at the end)
    const allGameCards = Array.from(container.querySelectorAll('a.game-card'));
    allGameCards.sort((a, b) => 
      parseInt(b.dataset.playCount || 0) - parseInt(a.dataset.playCount || 0)
    );
    
    allGameCards.forEach(card => container.appendChild(card));
  }
  
  function init() {
    fetch(ANALYTICS_URL + '/stats', { mode: 'cors' })
      .then(r => r.json())
      .then(stats => {
        const counts = extractGameCounts(stats);
        updateGameCards(counts);
      })
      .catch(() => {});
  }
  
  // Wait for the game cards to be rendered (they're rendered by inline script)
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    // Small delay to ensure render() has run
    setTimeout(init, 100);
  }
})();
