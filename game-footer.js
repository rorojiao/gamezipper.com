     1|(function(){
     2|  // BI tracking — defer to requestIdleCallback so it never blocks page render
     3|  function sendBI() {
     4|    try {
     5|      var img = new Image();
     6|      img.src = 'https://site-analytics.gamezipper.com/hit?s=' + encodeURIComponent(location.hostname || 'gamezipper.com') + '&p=' + encodeURIComponent(location.pathname || '/') + '&t=' + Date.now();
     7|    } catch (e) {}
     8|  }
     9|  if ('requestIdleCallback' in window) {
    10|    requestIdleCallback(sendBI);
    11|  } else {
    12|    setTimeout(sendBI, 200);
    13|  }
    14|
    15|  // Respect user dismissal — use sessionStorage so it persists within the tab
    16|  if (sessionStorage.getItem('gz-footer-dismissed')) return;
    17|
    18|  // Defer all DOM work to after DOMContentLoaded + requestIdleCallback
    19|  function init() {
    20|    var games = [
    21|      {n:'2048',e:'🔢',u:'/2048/',c:'puzzle'},
    22|      {n:'Snake',e:'🐍',u:'/snake/',c:'arcade'},
    23|      {n:'Flappy Wings',e:'🐦',u:'/flappy-wings/',c:'arcade'},
    24|      {n:'Color Sort',e:'🎨',u:'/color-sort/',c:'puzzle'},
    25|      {n:'Word Puzzle',e:'📝',u:'/word-puzzle/',c:'puzzle'},
    26|      {n:'Whack-a-Mole',e:'🔨',u:'/whack-a-mole/',c:'arcade'},
    27|      {n:'Memory Match',e:'🧠',u:'/memory-match/',c:'card'},
    28|      {n:'Sushi Stack',e:'🍣',u:'/sushi-stack/',c:'puzzle'},
    29|      {n:'Ocean Gem Pop',e:'💎',u:'/ocean-gem-pop/',c:'puzzle'},
    30|      {n:'Typing Speed',e:'⌨️',u:'/typing-speed/',c:'skill'},
    31|      {n:'Brick Breaker',e:'🧱',u:'/brick-breaker/',c:'arcade'},
    32|      {n:'Dessert Blast',e:'🍰',u:'/dessert-blast/',c:'puzzle'},
    33|      {n:'Catch Turkey',e:'🦃',u:'/catch-turkey/',c:'arcade'},
    34|      {n:'Paint Splash',e:'🎨',u:'/paint-splash/',c:'puzzle'},
    35|      {n:'Phantom Blade',e:'⚔️',u:'/phantom-blade/',c:'arcade'},
    36|      {n:'Kitty Cafe',e:'🐱',u:'/kitty-cafe/',c:'puzzle'},
    37|      {n:'Idle Clicker',e:'👆',u:'/idle-clicker/',c:'idle'},
    38|      {n:'Stacker',e:'📦',u:'/stacker/',c:'arcade'},
    39|      {n:'Wood Block',e:'🪵',u:'/wood-block-puzzle/',c:'puzzle'},
    40|      {n:'Bolt Jam 3D',e:'🔩',u:'/bolt-jam-3d/',c:'puzzle'},
    41|      {n:'Block Blast Bingo',e:'🧩',u:'/block-blast-bingo/',c:'puzzle'},
    42|      {n:'Mo Yu Fayu',e:'🐟',u:'/mo-yu-fayu/',c:'idle'},
    43|      {n:'Tetris',e:'🧱',u:'/tetris/',c:'puzzle'},
    44|      {n:'Sudoku',e:'🔢',u:'/sudoku/',c:'puzzle'},
    45|      {n:'Chess',e:'♟️',u:'/chess/',c:'strategy'},
    46|      {n:'Pong',e:'🏓',u:'/pong/',c:'arcade'},
    47|      {n:'Crossword',e:'✏️',u:'/crossword/',c:'puzzle'},
    48|      {n:'Minesweeper',e:'💣',u:'/minesweeper/',c:'puzzle'},
    49|      {n:'Slope',e:'⛷️',u:'/slope/',c:'arcade'},
    50|      {n:'Bounce Bot',e:'🤖',u:'/bounce-bot/',c:'arcade'},
    51|      {n:'Alien Whack',e:'👾',u:'/alien-whack/',c:'arcade'},
    52|      {n:'Reaction Time',e:'⚡',u:'/reaction-time/',c:'skill'},
    53|      {n:'Cloud Sheep',e:'☁️',u:'/cloud-sheep/',c:'puzzle'},
    54|      {n:'Ball Catch',e:'⚾',u:'/ball-catch/',c:'arcade'},
    55|      {n:'Abyss Chef',e:'🍳',u:'/abyss-chef/',c:'puzzle'},
    56|      {n:'Neon Run',e:'⚡',u:'/neon-run/',c:'arcade'},
    57|      {n:'Basketball Shoot',e:'🏀',u:'/basketball-shoot/',c:'arcade'},
    58|      {n:'Glyph Quest',e:'🔤',u:'/glyph-quest/',c:'puzzle'},
    59|      {n:'Fruit Slash',e:'🍉',u:'/fruit-slash/',c:'arcade'},
    60|      {n:'Magic Sort',e:'✨',u:'/magic-sort/',c:'puzzle'},
    61|      {n:'T-Rex',e:'🦖',u:'/t-rex/',c:'arcade'},
    62|      {n:'Bubble Pop',e:'🫧',u:'/bubble-pop/',c:'puzzle'},
    63|      {n:'Pixel Logic',e:'🧩',u:'/pixel-logic/',c:'puzzle'},
    64|      {n:'Tile Dynasty',e:'🏮',u:'/tile-dynasty/',c:'puzzle'},
    65|      {n:'Arrow Escape',e:'🚀',u:'/arrow-escape/',c:'puzzle'},
    66|      {n:'Bubble Shooter',e:'🫧',u:'/bubble-shooter/',c:'puzzle'},
    67|      {n:'Tic Tac Toe',e:'⭕',u:'/tic-tac-toe/',c:'puzzle'},
    68|      {n:'One Line Connect',e:'🔗',u:'/one-line-connect/',c:'puzzle'},
    69|      {n:'Physics Draw Puzzle',e:'✏️',u:'/physics-draw-puzzle/',c:'puzzle'},
    70|      {n:'Dots and Boxes',e:'⬜',u:'/dots-and-boxes/',c:'puzzle'},
    71|      {n:'Sliding Puzzle',e:'🔢',u:'/sliding-puzzle/',c:'puzzle'},
    72|      {n:'Reversi',e:'⚫',u:'/reversi/',c:'puzzle'},
    73|      {n:'Match Ninja',e:'🧊',u:'/match-ninja/',c:'puzzle'},
    74|      {n:'Jewel Coloring',e:'💎',u:'/jewel-coloring/',c:'puzzle'},

      {n:'Brain Out',e:'🧠',u:'/brain-out/',c:'puzzle'},
      {n:'Bridge Builder',e:'🌉',u:'/bridge-builder/',c:'puzzle'},
      {n:'Checkers',e:'⬤',u:'/checkers/',c:'puzzle'},
      {n:'Gomoku',e:'⚫',u:'/gomoku/',c:'puzzle'},
      {n:'Cut the Rope',e:'🍬',u:'/cut-the-rope/',c:'puzzle'},
      {n:'Drive Fury',e:'🏎️',u:'/drive-fury/',c:'arcade'},
      {n:'Escape Manor',e:'🏚️',u:'/escape-manor/',c:'puzzle'},
      {n:'Fill The Fridge',e:'🧊',u:'/fill-fridge/',c:'puzzle'},
      {n:'Flow Connect',e:'🔗',u:'/flow-connect/',c:'puzzle'},
      {n:'Hex Block Puzzle',e:'⬡',u:'/hex-block/',c:'puzzle'},
      {n:'The Impossible Quiz',e:'🧠',u:'/impossible-quiz/',c:'puzzle'},
      {n:'Jigsaw Puzzle',e:'🧩',u:'/jigsaw-puzzle/',c:'puzzle'},
      {n:'Kitchen Rush',e:'🍳',u:'/kitchen-rush/',c:'casual'},
      {n:'Level Devil',e:'😈',u:'/level-devil/',c:'arcade'},
      {n:'Little Alchemy',e:'⚗️',u:'/little-alchemy/',c:'puzzle'},
      {n:'Mahjong Solitaire',e:'🀄',u:'/mahjong-solitaire/',c:'puzzle'},
      {n:'Marble Run',e:'🔮',u:'/marble-run/',c:'puzzle'},
      {n:'Marble Shooter',e:'🔮',u:'/marble-shooter/',c:'puzzle'},
      {n:'Nonogram Puzzle',e:'🔲',u:'/nonogram/',c:'puzzle'},
      {n:'One Line Puzzle',e:'✏️',u:'/one-line-puzzle/',c:'puzzle'},
      {n:'Parking Jam',e:'🚗',u:'/parking-jam/',c:'puzzle'},
      {n:'Pipe Connect',e:'🔧',u:'/pipe-connect/',c:'puzzle'},
      {n:'Pull the Pin',e:'📌',u:'/pull-the-pin/',c:'puzzle'},
      {n:'Sand Balls',e:'🏐',u:'/sand-balls/',c:'puzzle'},
      {n:'Screw Jam',e:'🔩',u:'/screw-jam/',c:'puzzle'},
      {n:'Solitaire',e:'🃏',u:'/solitaire/',c:'puzzle'},
      {n:'SoliTen',e:'🔢',u:'/soliten/',c:'puzzle'},
      {n:'Twisted Tangle',e:'🧶',u:'/tangled-yarn/',c:'puzzle'},
      {n:'Tangram Puzzle',e:'🔺',u:'/tangram/',c:'puzzle'},
      {n:'Tangram Puzzle 2',e:'🧩',u:'/tangram-puzzle/',c:'puzzle'},
      {n:'Triple Tile Match',e:'🧩',u:'/triple-tile/',c:'puzzle'},
      {n:'Unblock Me',e:'🧱',u:'/unblock-me/',c:'puzzle'},
      {n:'Watermelon Merge',e:'🍉',u:'/watermelon-merge/',c:'puzzle'},
      {n:'Word Connections',e:'🔗',u:'/word-connections/',c:'puzzle'},
      {n:'Word Search',e:'🔍',u:'/word-search/',c:'puzzle'},
      {n:'Wordscapes',e:'🌿',u:'/wordscapes/',c:'puzzle'},
      {n:'Yahtzee',e:'🎲',u:'/yahtzee/',c:'dice'},
      {n:'Ludo',e:'🎲',u:'/ludo/',c:'board'},
      {n:'Number Slide',e:'🔢',u:'/number-slide/',c:'puzzle'},
      {n:'Rope Rescue',e:'🪢',u:'/rope-rescue/',c:'puzzle'},
      {n:'Peg Solitaire',e:'🎱',u:'/peg-solitaire/',c:'puzzle'},
      {n:'Path Finder',e:'🔗',u:'/path-finder/',c:'puzzle'},
      {n:'Ice Breaker',e:'🧊',u:'/ice-breaker/',c:'puzzle'},
      {n:'Logic Gates',e:'🔌',u:'/logic-gates/',c:'puzzle'},
      {n:'KenKen Puzzle',e:'🧮',u:'/kenken/',c:'puzzle'},
      {n:'Kakuro Puzzle',e:'🔢',u:'/kakuro/',c:'puzzle'},
      {n:'Mastermind',e:'🔐',u:'/mastermind/',c:'puzzle'},
      {n:'Simon Says',e:'🧠',u:'/simon-says/',c:'puzzle'},
      {n:'Maze Runner',e:'🏃',u:'/maze-runner/',c:'puzzle'},
      {n:'Slitherlink',e:'🔗',u:'/slitherlink/',c:'puzzle'},
      {n:'Battleship',e:'🚢',u:'/battleship/',c:'puzzle'},
      {n:'Lights Out',e:'💡',u:'/lights-out/',c:'puzzle'},
      {n:'Backgammon',e:'🎲',u:'/backgammon/',c:'board'},
      {n:'Color by Number',e:'🎨',u:'/color-by-number/',c:'puzzle'},
      {n:'Connect Four',e:'🔴',u:'/connect-four/',c:'puzzle'},
      {n:'Dominoes',e:'🁣',u:'/dominoes/',c:'puzzle'},
      {n:'Hangman',e:'🎯',u:'/hangman/',c:'puzzle'},
      {n:'Sokoban',e:'📦',u:'/sokoban/',c:'puzzle'},
      {n:'Spot the Difference',e:'🔍',u:'/spot-the-difference/',c:'puzzle'},
      {n:'Tower Defense',e:'🏰',u:'/tower-defense/',c:'puzzle'},
      {n:'Tower of Hanoi',e:'🏰',u:'/tower-of-hanoi/',c:'puzzle'}

    75|    ];
    76|
    77|    var cur = location.pathname;
    78|    var current = games.find(function(g){ return g.u === cur; });
    79|    var sameCat = games.filter(function(g){ return current && g.c === current.c && g.u !== cur; });
    80|    var others = games.filter(function(g){ return g.u !== cur && (!current || g.c !== current.c); });
    81|
    82|    // Deterministic sort: use localStorage recent-play data, fallback to date-hash seed
    83|    function getRecentGames() {
    84|      try {
    85|        var raw = localStorage.getItem('gz-recent-games');
    86|        return raw ? JSON.parse(raw) : [];
    87|      } catch (e) { return [{name:'Compound Word',e:'🔗',u:'/compound-word/',c:'puzzle'},
{name:'Quordle',e:'🔤',u:'/quordle/',c:'puzzle'},
{name:'Schulte Table',e:'🧠',u:'/schulte-table/',c:'puzzle'},
{name:'Chocolate Bean Storm',e:'🍫',u:'/chocolate-bean-storm/',c:'arcade'},
{name:'Waffle',e:'🧇',u:'/waffle/',c:'puzzle'},
{name:'Contexto',e:'🧠',u:'/contexto/',c:'puzzle'},
]; }
    88|    }
    89|    function getDateSeed() {
    90|      // Deterministic seed based on today's date string
    91|      var today = new Date().toISOString().slice(0, 10); // YYYY-MM-DD
    92|      var hash = 0;
    93|      for (var i = 0; i < today.length; i++) {
    94|        hash = ((hash << 5) - hash) + today.charCodeAt(i);
    95|        hash = hash & hash; // clamp to 32-bit
    96|      }
    97|      return hash;
    98|    }
    99|    function hashStr(s) {
   100|      var h = getDateSeed();
   101|      for (var i = 0; i < s.length; i++) {
   102|        h = ((h << 5) - h) + s.charCodeAt(i);
   103|        h = h & h;
   104|      }
   105|      return h;
   106|    }
   107|    function sortGames(arr) {
   108|      var recent = getRecentGames();
   109|      var recentUrls = {};
   110|      try { recent.forEach(function(u){ recentUrls[u] = true; }); } catch(e){}
   111|      arr.sort(function(a, b){
   112|        var aRec = recentUrls[a.u] ? 1 : 0;
   113|        var bRec = recentUrls[b.u] ? 1 : 0;
   114|        if (aRec !== bRec) return bRec - aRec; // recent first
   115|        var ha = hashStr(a.n);
   116|        var hb = hashStr(b.n);
   117|        return ha - hb;
   118|      });
   119|    }
   120|    sortGames(sameCat);
   121|    sortGames(others);
   122|
   123|    var pick = sameCat.slice(0, 4).concat(others.slice(0, Math.max(0, 6 - sameCat.length)));
   124|
   125|    var categoryLinks = {
   126|      puzzle: {t:'🧩 More Puzzle', u:'/puzzle-games.html'},
   127|      arcade: {t:'🕹️ More Arcade', u:'/arcade-games.html'},
   128|      idle: {t:'⏰ More Idle', u:'/idle-games.html'},
   129|      card: {t:'🃏 More Card', u:'/card-games.html'},
   130|      strategy: {t:'♟️ More Strategy', u:'/strategy-games.html'},
   131|      skill: {t:'⚡ More Skill', u:'/skill-games.html'}
   132|    };
   133|
   134|    var d = document.createElement('section');
   135|    d.id = 'game-footer';
   136|    d.setAttribute('aria-label', 'Related games');
   137|    d.style.cssText = 'position:fixed;bottom:0;left:0;right:0;background:rgba(10,10,26,0.96);padding:8px 12px;z-index:40;border-top:1px solid #333;display:none;transition:transform .3s ease';
   138|
   139|    var h = '<div style="display:flex;align-items:center;gap:8px;overflow-x:auto;white-space:nowrap">';
   140|    h += '<span style="color:#4ecdc4;font-size:11px;font-family:sans-serif;flex-shrink:0">Related Games:</span>';
   141|    for (var i = 0; i < pick.length; i++) {
   142|      h += '<a href="' + pick[i].u + '" style="display:inline-flex;align-items:center;gap:4px;background:#1a1a3e;padding:4px 10px;border-radius:12px;text-decoration:none;color:#fff;font-size:11px;font-family:sans-serif;flex-shrink:0">' + pick[i].e + ' ' + pick[i].n + '</a>';
   143|    }
   144|    if (current && categoryLinks[current.c]) {
   145|      h += '<a href="' + categoryLinks[current.c].u + '" style="display:inline-flex;align-items:center;gap:4px;background:#ffd93d;padding:4px 10px;border-radius:12px;text-decoration:none;color:#000;font-size:11px;font-family:sans-serif;font-weight:700;flex-shrink:0">' + categoryLinks[current.c].t + '</a>';
   146|    }
   147|    h += '<a href="/" style="display:inline-flex;align-items:center;gap:4px;background:#4ecdc4;padding:4px 10px;border-radius:12px;text-decoration:none;color:#000;font-size:11px;font-family:sans-serif;font-weight:700;flex-shrink:0">🎮 All Games</a>';
   148|    h += '<a href="https://tools.gamezipper.com" style="display:inline-flex;align-items:center;gap:4px;background:#ffd93d;padding:4px 10px;border-radius:12px;text-decoration:none;color:#000;font-size:11px;font-family:sans-serif;font-weight:700;flex-shrink:0">🛠 Tools</a>';
   149|    h += '<button onclick="var f=document.getElementById(\'game-footer\');if(f){f.style.transform=\'translateY(100%)\';setTimeout(function(){f.remove()},300);}sessionStorage.setItem(\'gz-footer-dismissed\',\'1\');" style="background:none;border:none;color:#666;font-size:16px;cursor:pointer;padding:4px 6px;flex-shrink:0;line-height:1" aria-label="Close">&times;</button>';
   150|    h += '</div>';
   151|    d.innerHTML = h;
   152|    document.body.appendChild(d);
   153|
   154|    // Smart display: show footer at natural pause points, not during active gameplay
   155|    // Strategy: listen for gameover/level-complete events; fallback to 8s delay
   156|    var footerShown = false;
   157|    function showFooter() {
   158|      if (footerShown) return;
   159|      footerShown = true;
   160|      d.style.display = 'block';
   161|    }
   162|    document.addEventListener('gameover', showFooter, { once: true });
   163|    document.addEventListener('level-complete', showFooter, { once: true });
   164|    document.addEventListener('level-fail', showFooter, { once: true });
   165|    // Fallback: show after 8 seconds (user is likely taking a break by then)
   166|    setTimeout(showFooter, 8000);
   167|  }
   168|
   169|  if (document.readyState === 'loading') {
   170|    document.addEventListener('DOMContentLoaded', function() {
   171|      if ('requestIdleCallback' in window) {
   172|        requestIdleCallback(init);
   173|      } else {
   174|        setTimeout(init, 100);
   175|      }
   176|    });
   177|  } else {
   178|    // DOM already ready — still defer to requestIdleCallback
   179|    if ('requestIdleCallback' in window) {
   180|      requestIdleCallback(init);
   181|    } else {
   182|      setTimeout(init, 100);
   183|    }
   184|  }
   185|})();
   186|