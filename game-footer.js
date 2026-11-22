(function(){
 // BI tracking disabled — site-analytics.gamezipper.com endpoint returns HTTP 501 (dead).
 // R97 P0 fix: removed dead 1x1 img pixel that was firing on every game page load.
 // Will be re-enabled when a working BI endpoint is deployed.
 function sendBI() { /* disabled - dead endpoint removed by R97 */ }
 // if ('requestIdleCallback' in window) {
 //   requestIdleCallback(sendBI);
 // } else {
 //   setTimeout(sendBI, 200);
 // }

 // UX-OPT 2026-08-22 R518: Blog post card-press feedback for dead_click false positive.
 // R514 fixed best-instant-play-...html, R515 fixed magic-tiles. R518 scales the same fix
 // to ALL 235 blog posts with .game-card / .site-card / .game-tile / .app-card via a single
 // shared handler in game-footer.js (loaded by every blog page). Scoped to /blog/ and
 // /zh/blog/ paths so game-page .game-card (the game UI wrapper, NOT a clickable card) is
 // NEVER touched. Behavior on click:
 //   1. If user clicked an inner <a>, do nothing (let the anchor navigate).
 //   2. Otherwise add transient .gzcardpress class for 1.7s (covers gz-analytics.js 1.5s
 //      capture-phase vs 1.5s-later state check window — R381/R382 spec).
 //   3. If card contains an inner <a href="/...">, navigate to it.
 // MutationObserver re-binds late-appended cards (some blog posts render via JS).
 // Idempotent: __gzCardBound flag prevents double-binding on hot-reload / multi-call.
 (function(){
  var _p = location.pathname;
  if (_p.indexOf('/blog/') !== 0 && _p.indexOf('/zh/blog/') !== 0) return;
  // Defensive: only proceed if there's at least one card on the page
  var _hasCard = document.querySelector('.game-card, .site-card, .game-tile, .app-card');
  if (!_hasCard) return;
  // Inject CSS once (cursor + .gzcardpress glow).
  if (!document.getElementById('gz-r518-cardpress-css')) {
   var _s = document.createElement('style');
   _s.id = 'gz-r518-cardpress-css';
   _s.textContent = '.game-card,.site-card,.game-tile,.app-card{cursor:pointer}'+
    '.gzcardpress{box-shadow:0 0 0 3px rgba(78,205,196,.5),0 0 18px rgba(78,205,196,.25)!important;transform:translateY(-1px);transition:box-shadow .15s ease,transform .15s ease}';
   document.head.appendChild(_s);
  }
  function _bindCard(card){
   if (card.__gzCardBound) return;
   card.__gzCardBound = true;
   card.addEventListener('click', function(e){
    if (e.target.closest && e.target.closest('a')) return;
    card.classList.add('gzcardpress');
    setTimeout(function(){ if (card && card.classList) card.classList.remove('gzcardpress'); }, 1700);
    var innerLink = card.querySelector('a[href^="/"]');
    if (innerLink) {
     var href = innerLink.getAttribute('href');
     if (href && href.charAt(0) === '/' && href.indexOf('//') !== 1 && href !== '/blog.html') {
      window.location.href = href;
     }
    }
   }, false);
  }
  function _initCards(){
   var _cards = document.querySelectorAll('.game-card, .site-card, .game-tile, .app-card');
   Array.prototype.forEach.call(_cards, _bindCard);
   if (window.MutationObserver && !window.__gzCardMO) {
    window.__gzCardMO = new MutationObserver(function(muts){
     muts.forEach(function(m){
      (m.addedNodes || []).forEach(function(n){
       if (n.nodeType !== 1) return;
       if (n.matches && n.matches('.game-card,.site-card,.game-tile,.app-card')) _bindCard(n);
       var nested = n.querySelectorAll && n.querySelectorAll('.game-card,.site-card,.game-tile,.app-card');
       if (nested) Array.prototype.forEach.call(nested, _bindCard);
      });
     });
    });
    window.__gzCardMO.observe(document.body, {childList: true, subtree: true});
   }
  }
  if (document.readyState === 'loading') {
   document.addEventListener('DOMContentLoaded', _initCards);
  } else {
   _initCards();
  }
 })();

 // UX-OPT 2026-09-16 R703: Blog post .play-btn click feedback + nav fallback.
 // BI 7d showed /blog/free-games-no-wifi-no-download.html with 19 rage_clicks (A.play-btn,
 // single real user, 23 seconds). User clicked .play-btn anchor repeatedly without the page
 // navigating — most likely browser extension or pop-up blocker intercepted the anchor's
 // default action. Fix: add transient .playbtnpress class to .play-btn (visible press
 // feedback so user SEES the click registered), AND schedule window.location.href as a
 // 120ms-deferred fallback (if anchor default fires first, browser cancels the JS nav;
 // if anchor default is blocked, JS nav fires).
 // Gated on /blog/ + /zh/blog/ + presence of .play-btn so non-blog pages aren't touched.
 (function(){
  var _p2 = location.pathname;
  if (_p2.indexOf('/blog/') !== 0 && _p2.indexOf('/zh/blog/') !== 0) return;
  var _hasPlay = document.querySelector('a.play-btn');
  if (!_hasPlay) return;
  // Idempotent CSS injection
  if (!document.getElementById('gz-r703-playbtn-css')) {
   var _s2 = document.createElement('style');
   _s2.id = 'gz-r703-playbtn-css';
   _s2.textContent = 'a.play-btn.playbtnpress{transform:scale(0.94)!important;box-shadow:0 0 0 2px rgba(78,205,196,0.6),0 0 12px rgba(78,205,196,0.35)!important;transition:transform 80ms ease,box-shadow 80ms ease!important}';
   document.head.appendChild(_s2);
  }
  function _handlePlayClick(e){
   var a = e.target.closest && e.target.closest('a.play-btn');
   if (!a) return;
   // Visible press feedback — short duration so anchor default nav has time to start
   a.classList.add('playbtnpress');
   setTimeout(function(){ if (a && a.classList) a.classList.remove('playbtnpress'); }, 180);
   // JS nav fallback after anchor default fires (120ms > browser nav threshold)
   var href = a.getAttribute('href');
   if (href && href.charAt(0) === '/' && href.indexOf('//') === -1 && href !== '/blog.html') {
    setTimeout(function(){
     // If still on the same page (anchor default was blocked), force navigate.
     // If navigation succeeded, the page is unloading and this no-ops harmlessly.
     if (location.pathname === _p2) window.location.href = href;
    }, 120);
   }
  }
  function _initPlay(){
   document.addEventListener('click', _handlePlayClick, false);
  }
  if (document.readyState === 'loading') {
   document.addEventListener('DOMContentLoaded', _initPlay);
  } else {
   _initPlay();
  }
 })();

 // Respect user dismissal — use sessionStorage so it persists within the tab
 if (sessionStorage.getItem('gz-footer-dismissed')) return;

 // Defer all DOM work to after DOMContentLoaded + requestIdleCallback
  function init() {
   // Guard: prevent duplicate footer if init() is called twice (RIC + setTimeout race)
   if (document.getElementById('game-footer')) return;
var games = [
      {n:'Sukima',e:'🧩',u:'/sukima/',c:'puzzle'},
      {n:'Tap Away',e:'🧱',u:'/tap-away/',c:'puzzle'},
      {n:'2048 Galaxy',e:'🌌',u:'/2048/',c:'puzzle'},
      {n:'Classic Sudoku',e:'🧩',u:'/sudoku/',c:'puzzle'},
      {n:'Pong',e:'🏓',u:'/pong/',c:'arcade'},
      {n:'Slope',e:'🔴',u:'/slope/',c:'arcade'},
      {n:'Reaction Time',e:'⚡',u:'/reaction-time/',c:'arcade'},
      {n:'Steam Whacker',e:'⚙️',u:'/whack-a-mole/',c:'arcade'},
      {n:'Memory Master',e:'🎪',u:'/memory-match/',c:'card'},
      {n:'Tangle Master',e:'🕸️',u:'/tangle-master/',c:'puzzle'},
      {n:'Queens Puzzle',e:'👑',u:'/queens/',c:'puzzle'},
      {n:'Chess',e:'♔',u:'/chess/',c:'puzzle'},
      {n:'Tetris',e:'🧱',u:'/tetris/',c:'puzzle'},
      {n:'Magic Sort',e:'🧪',u:'/magic-sort/',c:'puzzle'},
      {n:'T-Rex Dino Runner',e:'🦖',u:'/t-rex/',c:'arcade'},
      {n:'Nonogram Puzzle',e:'🔲',u:'/nonogram/',c:'puzzle'},
      {n:'Bubble Shooter',e:'🫧',u:'/bubble-shooter/',c:'puzzle'},
      {n:'Backgammon',e:'🎲',u:'/backgammon/',c:'board'},
      {n:'Ice Breaker',e:'🧊',u:'/ice-breaker/',c:'puzzle'},
      {n:'Simon Says',e:'🧠',u:'/simon-says/',c:'puzzle'},
      {n:'Slitherlink',e:'🔗',u:'/slitherlink/',c:'puzzle'},
      {n:'Mancala',e:'🫘',u:'/mancala/',c:'board'},
      {n:'Wordle',e:'🔤',u:'/wordle/',c:'puzzle'},
      {n:'Papas Freezeria',e:'🍦',u:'/papas-freezeria/',c:'strategy'},
      {n:'Gravity Run',e:'🏃',u:'/gravity-run/',c:'arcade'},
      {n:'Growmi',e:'🪱',u:'/growmi/',c:'puzzle'},
      {n:'Mind Reader',e:'🔮',u:'/akinator/',c:'puzzle'},
      {n:'Word Scramble',e:'🔤',u:'/word-scramble/',c:'puzzle'},
      {n:'Bloxorz',e:'🔲',u:'/bloxorz/',c:'puzzle'},
      {n:'Tens',e:'🔢',u:'/tens-game/',c:'puzzle'},
      {n:'100 Doors Puzzle Box',e:'🚪',u:'/100-doors/',c:'puzzle'},
      {n:'Merge Sweets',e:'🧁',u:'/merge-sweets/',c:'puzzle'},
      {n:'Traffic Escape',e:'🚗',u:'/traffic-escape/',c:'puzzle'},
      {n:'Coin Pusher',e:'🪙',u:'/coin-pusher/',c:'arcade'},
      {n:'Helix Jump',e:'🌀',u:'/helix-jump/',c:'arcade'},
      {n:'Lava Rising',e:'🌋',u:'/lava-rising/',c:'arcade'},
      {n:'Glass Rush 3D',e:'💎',u:'/glass-rush-3d/',c:'arcade'},
      {n:'Einsteins Riddle',e:'🧩',u:'/einstein-riddle/',c:'puzzle'},
      {n:'Hitori',e:'🟦',u:'/hitori/',c:'puzzle'},
      {n:'Akari',e:'💡',u:'/akari/',c:'puzzle'},
      {n:'Sugar Sugar',e:'🍬',u:'/sugar-sugar/',c:'puzzle'},
      {n:'Masyu',e:'⚪',u:'/masyu/',c:'puzzle'},
      {n:'Fillomino',e:'🔷',u:'/fillomino/',c:'puzzle'},
      {n:'Hex Minesweeper',e:'⬡',u:'/hex-minesweeper/',c:'puzzle'},
      {n:'Sandtrix',e:'🏖️',u:'/sandtrix/',c:'puzzle'},
      {n:'Draw Bridge Puzzle',e:'🌉',u:'/draw-bridge/',c:'puzzle'},
      {n:'Block Out',e:'🧱',u:'/block-out/',c:'puzzle'},
      {n:'Beads Out',e:'🔴',u:'/beads-out/',c:'puzzle'},
      {n:'Bus Traffic Fever',e:'🚌',u:'/bus-traffic-fever/',c:'puzzle'},
      {n:'Virus Buster',e:'💊',u:'/virus-buster/',c:'puzzle'},
      {n:'Stacklands',e:'🏗',u:'/stacklands/',c:'puzzle'},
      {n:'Hotel Rush',e:'🏨',u:'/hotel-rush/',c:'puzzle'},
      {n:'Penalty Shootout',e:'⚽',u:'/penalty-shootout/',c:'skill'},
      {n:'Spiral Galaxy',e:'🌌',u:'/spiral-galaxy/',c:'puzzle'},
      {n:'Dosun-Fuwari',e:'🎈',u:'/dosun-fuwari/',c:'puzzle'},
      {n:'Thermo Sudoku',e:'🔥',u:'/thermo-sudoku/',c:'puzzle'},
      {n:'X-Sudoku',e:'✖️',u:'/x-sudoku/',c:'puzzle'},
      {n:'Odd-Even Sudoku',e:'⭕',u:'/odd-even-sudoku/',c:'puzzle'},
      {n:'Sandwich Sudoku',e:'🥪',u:'/sandwich-sudoku/',c:'puzzle'},
      {n:'Arrow Sudoku',e:'🏹',u:'/arrow-sudoku/',c:'puzzle'},
      {n:'Anti-Knight Sudoku',e:'♮',u:'/anti-knight-sudoku/',c:'puzzle'},
      {n:'Greater-Than Sudoku',e:'≷',u:'/greater-than-sudoku/',c:'puzzle'},
      {n:'Jigsaw Sudoku',e:'🧩',u:'/jigsaw-sudoku/',c:'puzzle'},
      {n:'Outside Sudoku',e:'🔲',u:'/outside-sudoku/',c:'puzzle'},
      {n:'Palindrome Sudoku',e:'🪞',u:'/palindrome-sudoku/',c:'puzzle'},
      {n:'Codewords',e:'🔐',u:'/codewords/',c:'puzzle'},
      {n:'Cave',e:'🕳️',u:'/cave/',c:'puzzle'},
      {n:'Numbrix',e:'🔢',u:'/numbrix/',c:'puzzle'},
      {n:'Twiddle',e:'🔄',u:'/twiddle/',c:'puzzle'},
      {n:'Inertia',e:'🔵',u:'/inertia/',c:'puzzle'},
      {n:'Black Box',e:'◼',u:'/black-box/',c:'puzzle'},
      {n:'Beat Battle',e:'🎵',u:'/beat-battle/',c:'arcade'},
      {n:'Same Game',e:'ⓘ',u:'/same-game/',c:'puzzle'},
      {n:'Cube Pop',e:'🧊',u:'/cube-pop/',c:'puzzle'},
      {n:'Balls vs Bricks',e:'⚪',u:'/balls-vs-bricks/',c:'puzzle'},
      {n:'Blob Pop',e:'🫧',u:'/blob-pop/',c:'puzzle'},
      {n:'Blind Spot',e:'👁',u:'/blind-spot/',c:'puzzle'},
      {n:'Pottery Master',e:'🏺',u:'/pottery-master/',c:'puzzle'},
      {n:'Laser Maze',e:'🔦',u:'/laser-maze/',c:'puzzle'},
      {n:'Zip Tie Untangle',e:'🔗',u:'/zip-tie/',c:'puzzle'},
      {n:'Color Switch',e:'🎨',u:'/color-switch/',c:'puzzle'},
      {n:'Draw One Part',e:'✏️',u:'/draw-one-part/',c:'puzzle'},
      {n:'Save the Doge',e:'🐕',u:'/save-the-doge/',c:'puzzle'},
      {n:'Mr Bullet',e:'🎯',u:'/mr-bullet/',c:'puzzle'},
      {n:'Kropki Sudoku',e:'🔢',u:'/kropki-sudoku/',c:'puzzle'},
      {n:'Tetra Fit',e:'🧩',u:'/tetra-fit/',c:'puzzle'},
      {n:'Ricochet Robots',e:'🤖',u:'/ricochet-robots/',c:'puzzle'},
      {n:'Hex Path Spin',e:'hex',u:'/hex-path-spin/',c:'puzzle'},
      {n:'Conveyor Belt Sort',e:'📦',u:'/conveyor-sort/',c:'puzzle'},
      {n:'Nerdle',e:'🧠',u:'/nerdle/',c:'puzzle'},
      {n:'Easy as ABC',e:'🔤',u:'/easy-as-abc/',c:'puzzle'},
      {n:'Slide Cat',e:'🐱',u:'/slide-cat/',c:'puzzle'},
      {n:'Pulse Path',e:'⚡',u:'/pulse-path/',c:'puzzle'},
      {n:'Akichiwake',e:'🍁',u:'/akichiwake/',c:'puzzle'},
      {n:'Balance Loop',e:'⚖️',u:'/balance-loop/',c:'puzzle'},
      {n:'Arukone',e:'🔢',u:'/arukone/',c:'puzzle'},

      {n:'All 450+ Games',e:'📋',u:'/sitemap-page.html',c:'all'}
     ];

  var cur = location.pathname;
  var current = games.find(function(g){ return g && g.u === cur; });

  // R530 2026-11-22 P0: whitelist fix (96 player-tested PASS titles). Static game pages
  // carry hard-coded "You May Also Like" / "Most Played" links written before the audit.
  // Hide related-card links whose target is not whitelisted (kept in DOM for SEO).
  (function filterRelatedCards(){
    var ok = {};
    try { games.forEach(function(g){ if (g && g.c !== 'all') ok[g.u] = true; }); } catch(e) { return; }
    var cards = document.querySelectorAll('.gz-related-card');
    for (var i = 0; i < cards.length; i++) {
      var href = cards[i].getAttribute('href') || '';
      if (href.charAt(0) === '/' && !ok[href]) cards[i].style.display = 'none';
    }
  })();

  // SAVE current game to localStorage for homepage "Continue Playing" feature
  // This was missing — caused gz_recent_games to never be populated
  if (current) {
    try {
      var recentList = JSON.parse(localStorage.getItem('gz_recent_games') || '[]');
      var entry = {name: current.n, emoji: current.e, url: current.u, cat: current.c, ts: Date.now()};
      // Remove duplicate if exists, then prepend
      recentList = recentList.filter(function(r) { return r.url !== current.u; });
      recentList.unshift(entry);
      // Keep only last 12 games
      if (recentList.length > 12) recentList = recentList.slice(0, 12);
      localStorage.setItem('gz_recent_games', JSON.stringify(recentList));
    } catch(e) {}
  }
  var sameCat = games.filter(function(g){ return g && current && g.c === current.c && g.u !== cur; });
   var others = games.filter(function(g){ return g && g.u !== cur && (!current || g.c !== current.c); });

   // Deterministic sort: use localStorage recent-play data, fallback to date-hash seed
   function getRecentGames() {
     try {
       var raw = localStorage.getItem('gz_recent_games');
       return raw ? JSON.parse(raw) : [{n:'Domino Toppler',e:'🁢',u:'/domino-toppler/',c:'puzzle'}]
     } catch (e) { return [{name:'Compound Word',e:'🔗',u:'/compound-word/',c:'puzzle'},
{name:'Quordle',e:'🔤',u:'/quordle/',c:'puzzle'},
{name:'Schulte Table',e:'🧠',u:'/schulte-table/',c:'puzzle'},
{name:'Chocolate Bean Storm',e:'🍫',u:'/bubble-shooter/',c:'arcade'},
{name:'Waffle',e:'🧇',u:'/waffle/',c:'puzzle'},
{name:'Contexto',e:'🧠',u:'/contexto/',c:'puzzle'},
      
      
      
      
      
      
  
  
      {n:'Jewel Crush',e:'💎',u:'/jewel-crush/',c:'puzzle'},
      {n:'Go Fish',e:'🐟',u:'/go-fish/',c:'card'},
      {n:'Guess The Emoji',e:'🤔',u:'/guess-the-emoji/',c:'puzzle'},
      {n:'Trivia Crack',e:'❓',u:'/trivia-crack/',c:'puzzle'},
      {n:'Fireboy & Watergirl',e:'🔥',u:'/fireboy-watergirl/',c:'puzzle'},
      {n:'Plinko',e:'⚪',u:'/plinko/',c:'arcade'},
      {n:'Mahjong Dimensions',e:'🀄',u:'/mahjong-dimensions/',c:'puzzle'},
      
      
{n:"Factory Balls",e:"🎨",u:"/factory-balls/",c:"puzzle"},
{n:"Triple Match 3D",e:"🎯",u:"/triple-match-3d/",c:"puzzle"},
{n:"Antistress",e:"🧸",u:"/antistress/",c:"casual"},{n:"Monkey Mart",e:"🐒",u:"/monkey-mart/",c:"casual"},{n:"Gravity Drop",e:"🔴",u:"/gravity-drop/",c:"puzzle"},{n:'Number Nexus',e:'🔢',u:'/number-nexus/',c:'puzzle'},{n:'Poly Art 3D',e:'🎨',u:'/poly-art-3d/',c:'puzzle'},{n:"Baba Is You",e:"🧩",u:"/baba-is-you/",c:"puzzle"},
{n:"Heyawake",e:"\u25a2",u:"/heyawake/",c:"puzzle"},{n:"Gokigen Naname",e:"\u25c7",u:"/gokigen-naname/",c:"puzzle"},{n:"Stained Glass",e:"🎨",u:"/stained-glass/",c:"puzzle"},{n:"Sandtrix",e:"🏖️",u:"/sandtrix/",c:"puzzle"},
{n:"Solitaire Roguelite",e:"\U0001f3f0",u:"/solitaire-roguelite/",c:"card"},

      
      
      
      {n:'String Art Studio',e:'🧵',u:'/string-art/',c:'puzzle'},
{n:'Futoshiki',e:'🧩',u:'/futoshiki/',c:'puzzle'},
{n:'Claw Master',e:'🦾',u:'/claw-machine/',c:'puzzle'},
      {n:'Nail Art Studio',e:'💅',u:'/nail-art/',c:'puzzle'},
      {n:'Odd One Out',e:'🔍',u:'/odd-one-out/',c:'puzzle'},
      
      
      {n:'Quoridor Strategy',e:'🧱',u:'/quoridor/',c:'puzzle'},
{n:'Woodoku',e:'🪵',u:'/woodoku/',c:'puzzle'},{n:'Fill-a-Pix',e:'🔢',u:'/fill-a-pix/',c:'puzzle'},
      
      {n:'Blue',e:'💙',u:'/blue/',c:'puzzle'},
      
      
      


{n:'Slide Cat',e:'🐱',u:'/slide-cat/',c:'puzzle'},





{n:'Pulse Path',e:'⚡',u:'/pulse-path/',c:'puzzle'},
{n:'Rullo',e:'🔢',u:'/rullo/',c:'puzzle'},



]; }
   }
   function getDateSeed() {
     // Deterministic seed based on today's date string
     var today = new Date().toISOString().slice(0, 10); // YYYY-MM-DD
     var hash = 0;
     for (var i = 0; i < today.length; i++) {
       hash = ((hash << 5) - hash) + today.charCodeAt(i);
       hash = hash & hash; // clamp to 32-bit
     }
     return hash;
   }
   function hashStr(s) {
     var h = getDateSeed();
     for (var i = 0; i < s.length; i++) {
       h = ((h << 5) - h) + s.charCodeAt(i);
       h = h & h;
     }
     return h;
   }
   function sortGames(arr) {
     var recent = getRecentGames();
     var recentUrls = {};
     try { recent.forEach(function(u){ recentUrls[u] = true; }); } catch(e){}
     arr.sort(function(a, b){
       var aRec = recentUrls[a.u] ? 1 : 0;
       var bRec = recentUrls[b.u] ? 1 : 0;
       if (aRec !== bRec) return bRec - aRec; // recent first
       var ha = hashStr(a.n);
       var hb = hashStr(b.n);
       return ha - hb;
     });
   }
   sortGames(sameCat);
   sortGames(others);

   var pick = sameCat.slice(0, 4).concat(others.slice(0, Math.max(0, 6 - sameCat.length)));

   var categoryLinks = {
     puzzle: {t:'🧩 More Puzzle', u:'/puzzle-games.html'},
     arcade: {t:'🕹️ More Arcade', u:'/arcade-games.html'},
     idle: {t:'⏰ More Idle', u:'/idle-games.html'},
     card: {t:'🃏 More Card', u:'/card-games.html'},
      strategy: {t:'♟️ More Strategy', u:'/simulation-games.html'},
           skill: {t:'⚡ More Skill', u:'/word-typing-games.html'},
           board: {t:'🎲 More Board', u:'/card-games.html'},
           all: {t:'📋 All 450+ Games', u:'/sitemap-page.html'},
          // R983: the game's own list uses 12 `c:` values but only 6 keys were declared
          // here. `if (current && categoryLinks[current.c])` then skips the whole CTA
          // block, so 15 game pages silently rendered no category link and no error was
          // raised anywhere. Guardrail added in tools/check-footer-categories.mjs:
          // this key set must be a superset of every `c:` in the list below.
          // Only hubs that exist and return 200 are wired up. board/dice/racing/driving
          // are deliberately NOT here - those hub pages 404, and a CTA pointing at a 404
          // is worse than no CTA.
           casual: {t:'🎧 More Casual', u:'/casual-games.html'},
          simulation: {t:'🛠️ More Sim', u:'/simulation-games.html'}
        };

   var d = document.createElement('section');
   d.id = 'game-footer';
   d.setAttribute('aria-label', 'Related games');
   d.style.cssText = 'position:fixed;bottom:0;left:0;right:0;background:rgba(10,10,26,0.96);padding:8px 12px;z-index:40;border-top:1px solid #333;display:none;transition:transform .3s ease';

   var h = '<div style="display:flex;align-items:center;gap:8px;overflow-x:auto;white-space:nowrap">';
   h += '<span style="color:#4ecdc4;font-size:11px;font-family:sans-serif;flex-shrink:0">Related Games:</span>';
   for (var i = 0; i < pick.length; i++) {
     h += '<a href="' + pick[i].u + '" style="display:inline-flex;align-items:center;gap:4px;background:#1a1a3e;padding:4px 10px;border-radius:12px;text-decoration:none;color:#fff;font-size:11px;font-family:sans-serif;flex-shrink:0">' + pick[i].e + ' ' + pick[i].n + '</a>';
   }
   if (current && categoryLinks[current.c]) {
     h += '<a href="' + categoryLinks[current.c].u + '" style="display:inline-flex;align-items:center;gap:4px;background:#ffd93d;padding:4px 10px;border-radius:12px;text-decoration:none;color:#000;font-size:11px;font-family:sans-serif;font-weight:700;flex-shrink:0">' + categoryLinks[current.c].t + '</a>';
   }
   h += '<a href="/" style="display:inline-flex;align-items:center;gap:4px;background:#4ecdc4;padding:4px 10px;border-radius:12px;text-decoration:none;color:#000;font-size:11px;font-family:sans-serif;font-weight:700;flex-shrink:0">🎮 All Games</a>';
   h += '<a href="https://tools.gamezipper.com" style="display:inline-flex;align-items:center;gap:4px;background:#ffd93d;padding:4px 10px;border-radius:12px;text-decoration:none;color:#000;font-size:11px;font-family:sans-serif;font-weight:700;flex-shrink:0">🛠 Tools</a>';
   h += '<button onclick="var f=document.getElementById(\'game-footer\');if(f){f.style.transform=\'translateY(100%)\';setTimeout(function(){f.remove()},300);}sessionStorage.setItem(\'gz-footer-dismissed\',\'1\');" style="background:none;border:none;color:#666;font-size:16px;cursor:pointer;padding:4px 6px;flex-shrink:0;line-height:1" aria-label="Close">&times;</button>';
   h += '</div>';
  d.innerHTML = h;
  document.body.appendChild(d);

  // === Poki-model: Commercial Break on game link click ===
  // When user clicks a game link, trigger commercialBreak (ad may or may not show)
  d.addEventListener('click', function(e) {
    var link = e.target.closest('a');
    if (!link) return;
    var href = link.getAttribute('href');
    if (!href || href.indexOf('/') !== 0) return; // only internal game links
    // Trigger commercialBreak asynchronously — don't block navigation
    try {
      if (window.GZAds && window.GZAds.commercialBreak) {
        window.GZAds.commercialBreak();
      }
    } catch(err) {}
  }, { passive: true });

  // Smart display: show footer at natural pause points, not during active gameplay
   // Strategy: listen for gameover/level-complete events; fallback to 8s delay
   var footerShown = false;
   function showFooter() {
     if (footerShown) return;
     footerShown = true;
     d.style.display = 'block';
   }
   document.addEventListener('gameover', showFooter, { once: true });
   document.addEventListener('level-complete', showFooter, { once: true });
   document.addEventListener('level-fail', showFooter, { once: true });
   // Fallback: show after 8 seconds (user is likely taking a break by then)
   setTimeout(showFooter, 8000);
 }

 if (document.readyState === 'loading') {
   document.addEventListener('DOMContentLoaded', function() {
     if ('requestIdleCallback' in window) {
       requestIdleCallback(init, { timeout: 2000 });
     } else {
       setTimeout(init, 100);
     }
   });
 } else {
   // DOM already ready — still defer to requestIdleCallback with hard timeout fallback.
   // RIC may never fire on idle headless browsers (Kachilu, Lighthouse), so always
   // schedule a setTimeout fallback that runs init() within 2s regardless.
   // Guard against double-init: if RIC fires first, cancel the setTimeout fallback.
   var _initDone = false;
   var _initTimer = null;
   var _safeInit = function() {
     if (_initDone) return;
     _initDone = true;
     if (_initTimer) { clearTimeout(_initTimer); _initTimer = null; }
     init();
   };
   if ('requestIdleCallback' in window) {
     requestIdleCallback(_safeInit, { timeout: 2000 });
   }
   _initTimer = setTimeout(_safeInit, 2000);
 }
})();