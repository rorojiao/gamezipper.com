(function(){
  try {
    var img = new Image();
    img.src = 'https://site-analytics.cap.1ktower.com/hit?s=' + encodeURIComponent(location.hostname || 'gamezipper.com') + '&p=' + encodeURIComponent(location.pathname || '/') + '&t=' + Date.now();
  } catch (e) {}

  var games = [
    {n:'2048',e:'🔢',u:'/2048/',c:'puzzle'},
    {n:'Snake',e:'🐍',u:'/snake/',c:'arcade'},
    {n:'Flappy Wings',e:'🐦',u:'/flappy-wings/',c:'arcade'},
    {n:'Color Sort',e:'🎨',u:'/color-sort/',c:'puzzle'},
    {n:'Word Puzzle',e:'📝',u:'/word-puzzle/',c:'puzzle'},
    {n:'Whack-a-Mole',e:'🔨',u:'/whack-a-mole/',c:'arcade'},
    {n:'Memory Match',e:'🧠',u:'/memory-match/',c:'card'},
    {n:'Sushi Stack',e:'🍣',u:'/sushi-stack/',c:'puzzle'},
    {n:'Ocean Gem Pop',e:'💎',u:'/ocean-gem-pop/',c:'puzzle'},
    {n:'Typing Speed',e:'⌨️',u:'/typing-speed/',c:'skill'},
    {n:'Brick Breaker',e:'🧱',u:'/brick-breaker/',c:'arcade'},
    {n:'Dessert Blast',e:'🍰',u:'/dessert-blast/',c:'puzzle'},
    {n:'Catch Turkey',e:'🦃',u:'/catch-turkey/',c:'arcade'},
    {n:'Paint Splash',e:'🎨',u:'/paint-splash/',c:'puzzle'},
    {n:'Phantom Blade',e:'⚔️',u:'/phantom-blade/',c:'arcade'},
    {n:'Kitty Cafe',e:'🐱',u:'/kitty-cafe/',c:'puzzle'},
    {n:'Idle Clicker',e:'👆',u:'/idle-clicker/',c:'idle'},
    {n:'Stacker',e:'📦',u:'/stacker/',c:'arcade'},
    {n:'Wood Block',e:'🪵',u:'/wood-block-puzzle/',c:'puzzle'},
    {n:'Bolt Jam 3D',e:'🔩',u:'/bolt-jam-3d/',c:'puzzle'},
    {n:'Mo Yu Fayu',e:'🐟',u:'/mo-yu-fayu/',c:'idle'},
    {n:'Tetris',e:'🧱',u:'/tetris/',c:'puzzle'},
    {n:'Sudoku',e:'🔢',u:'/sudoku/',c:'puzzle'},
    {n:'Chess',e:'♟️',u:'/chess/',c:'strategy'},
    {n:'Pong',e:'🏓',u:'/pong/',c:'arcade'},
    {n:'Crossword',e:'✏️',u:'/crossword/',c:'puzzle'},
    {n:'Minesweeper',e:'💣',u:'/minesweeper/',c:'puzzle'},
    {n:'Slope',e:'⛷️',u:'/slope/',c:'arcade'},
    {n:'Bounce Bot',e:'🤖',u:'/bounce-bot/',c:'arcade'},
    {n:'Alien Whack',e:'👾',u:'/alien-whack/',c:'arcade'},
    {n:'Reaction Time',e:'⚡',u:'/reaction-time/',c:'skill'},
    {n:'Cloud Sheep',e:'☁️',u:'/cloud-sheep/',c:'puzzle'},
    {n:'Ball Catch',e:'⚾',u:'/ball-catch/',c:'arcade'},
    {n:'Abyss Chef',e:'🍳',u:'/abyss-chef/',c:'puzzle'},
    {n:'Neon Run',e:'⚡',u:'/neon-run/',c:'arcade'},
    {n:'Basketball Shoot',e:'🏀',u:'/basketball-shoot/',c:'arcade'},
    {n:'Glyph Quest',e:'🔤',u:'/glyph-quest/',c:'puzzle'}
  ];

  var cur = location.pathname;
  var current = games.find(function(g){ return g.u === cur; });
  var sameCat = games.filter(function(g){ return current && g.c === current.c && g.u !== cur; });
  var others = games.filter(function(g){ return g.u !== cur && (!current || g.c !== current.c); });
  sameCat.sort(function(){ return 0.5 - Math.random(); });
  others.sort(function(){ return 0.5 - Math.random(); });
  var pick = sameCat.slice(0, 4).concat(others.slice(0, Math.max(0, 6 - sameCat.length)));

  var categoryLinks = {
    puzzle: {t:'🧩 More Puzzle Games', u:'/puzzle-games.html'},
    arcade: {t:'🕹️ More Arcade Games', u:'/arcade-games.html'},
    idle: {t:'⏰ More Idle Games', u:'/idle-games.html'},
    card: {t:'🃏 More Card Games', u:'/card-games.html'}
  };

  var d = document.createElement('section');
  d.id = 'game-footer';
  d.setAttribute('aria-label', 'Related games');
  d.style.cssText = 'position:fixed;bottom:0;left:0;right:0;background:rgba(10,10,26,0.96);padding:8px 12px;z-index:100;border-top:1px solid #333;display:none';

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
  h += '</div>';
  d.innerHTML = h;
  document.body.appendChild(d);
  setTimeout(function(){ d.style.display = 'block'; }, 2500);
})();
