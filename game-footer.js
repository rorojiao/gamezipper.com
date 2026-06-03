(function(){
 // BI tracking â defer to requestIdleCallback so it never blocks page render
 function sendBI() {
   try {
     var img = new Image();
     img.src = 'https://site-analytics.gamezipper.com/hit?s=' + encodeURIComponent(location.hostname || 'gamezipper.com') + '&p=' + encodeURIComponent(location.pathname || '/') + '&t=' + Date.now();
   } catch (e) {}
 }
 if ('requestIdleCallback' in window) {
   requestIdleCallback(sendBI);
 } else {
   setTimeout(sendBI, 200);
 }

 // Respect user dismissal â use sessionStorage so it persists within the tab
 if (sessionStorage.getItem('gz-footer-dismissed')) return;

 // Defer all DOM work to after DOMContentLoaded + requestIdleCallback
 function init() {
   var games = [
     {n:'2048',e:'ð¢',u:'/2048/',c:'puzzle'},
     {n:'Snake',e:'ð',u:'/snake/',c:'arcade'},
     {n:'Flappy Wings',e:'ð¦',u:'/flappy-wings/',c:'arcade'},
     {n:'Color Sort',e:'ð¨',u:'/color-sort/',c:'puzzle'},
     {n:'Word Puzzle',e:'ð',u:'/word-puzzle/',c:'puzzle'},
     {n:'Circuit Logic',e:'â¡',u:'/circuit-logic/',c:'puzzle'},
     {n:'Whack-a-Mole',e:'ð¨',u:'/whack-a-mole/',c:'arcade'},
     {n:'Memory Match',e:'ð§ ',u:'/memory-match/',c:'card'},
     {n:'Sushi Stack',e:'ð£',u:'/sushi-stack/',c:'puzzle'},
     {n:'Ocean Gem Pop',e:'ð',u:'/ocean-gem-pop/',c:'puzzle'},
     {n:'Typing Speed',e:'â¨ï¸',u:'/typing-speed/',c:'skill'},
     {n:'Brick Breaker',e:'ð§±',u:'/brick-breaker/',c:'arcade'},
     {n:'Dessert Blast',e:'ð°',u:'/dessert-blast/',c:'puzzle'},
     {n:'Catch Turkey',e:'ð¦',u:'/catch-turkey/',c:'arcade'},
     {n:'Paint Splash',e:'ð¨',u:'/paint-splash/',c:'puzzle'},
     {n:'Phantom Blade',e:'âï¸',u:'/phantom-blade/',c:'arcade'},
     {n:'Kitty Cafe',e:'ð±',u:'/kitty-cafe/',c:'puzzle'},
     {n:'Idle Clicker',e:'ð',u:'/idle-clicker/',c:'idle'},
     {n:'Stacker',e:'ð¦',u:'/stacker/',c:'arcade'},
     {n:'Wood Block',e:'ðªµ',u:'/wood-block-puzzle/',c:'puzzle'},
     {n:'Bolt Jam 3D',e:'ð©',u:'/bolt-jam-3d/',c:'puzzle'},
     {n:'Block Blast Bingo',e:'ð§©',u:'/block-blast-bingo/',c:'puzzle'},
     {n:'Mo Yu Fayu',e:'ð',u:'/mo-yu-fayu/',c:'idle'},
     {n:'Tetris',e:'ð§±',u:'/tetris/',c:'puzzle'},
     {n:'Sudoku',e:'ð¢',u:'/sudoku/',c:'puzzle'},
     {n:'Chess',e:'âï¸',u:'/chess/',c:'strategy'},
     {n:'Pong',e:'ð',u:'/pong/',c:'arcade'},
     {n:'Crossword',e:'âï¸',u:'/crossword/',c:'puzzle'},
     {n:'Minesweeper',e:'ð£',u:'/minesweeper/',c:'puzzle'},
     {n:'Slope',e:'â·ï¸',u:'/slope/',c:'arcade'},
     {n:'Bounce Bot',e:'ð¤',u:'/bounce-bot/',c:'arcade'},
     {n:'Alien Whack',e:'ð¾',u:'/alien-whack/',c:'arcade'},
     {n:'Reaction Time',e:'â¡',u:'/reaction-time/',c:'skill'},
     {n:'Cloud Sheep',e:'âï¸',u:'/cloud-sheep/',c:'puzzle'},
     {n:'Ball Catch',e:'â¾',u:'/ball-catch/',c:'arcade'},
     {n:'Abyss Chef',e:'ð³',u:'/abyss-chef/',c:'puzzle'},
     {n:'Neon Run',e:'â¡',u:'/neon-run/',c:'arcade'},
     {n:'Basketball Shoot',e:'ð',u:'/basketball-shoot/',c:'arcade'},
     {n:'Glyph Quest',e:'ð¤',u:'/glyph-quest/',c:'puzzle'},
     {n:'Fruit Slash',e:'ð',u:'/fruit-slash/',c:'arcade'},
     {n:'Magic Sort',e:'â¨',u:'/magic-sort/',c:'puzzle'},
     {n:'T-Rex',e:'ð¦',u:'/t-rex/',c:'arcade'},
     {n:'Bubble Pop',e:'ð«§',u:'/bubble-pop/',c:'puzzle'},
     {n:'Pixel Logic',e:'ð§©',u:'/pixel-logic/',c:'puzzle'},
     {n:'Tile Dynasty',e:'ð®',u:'/tile-dynasty/',c:'puzzle'},
     {n:'Arrow Escape',e:'ð',u:'/arrow-escape/',c:'puzzle'},
     {n:'Bubble Shooter',e:'ð«§',u:'/bubble-shooter/',c:'puzzle'},
     {n:'Tic Tac Toe',e:'â­',u:'/tic-tac-toe/',c:'puzzle'},
     {n:'One Line Connect',e:'ð',u:'/one-line-connect/',c:'puzzle'},
     {n:'Physics Draw Puzzle',e:'âï¸',u:'/physics-draw-puzzle/',c:'puzzle'},
     {n:'Dots and Boxes',e:'â¬',u:'/dots-and-boxes/',c:'puzzle'},
     {n:'Sliding Puzzle',e:'ð¢',u:'/sliding-puzzle/',c:'puzzle'},
     {n:'Reversi',e:'â«',u:'/reversi/',c:'puzzle'},
     {n:'Match Ninja',e:'ð§',u:'/match-ninja/',c:'puzzle'},
     {n:'Jewel Coloring',e:'ð',u:'/jewel-coloring/',c:'puzzle'},

      {n:'Brain Out',e:'ð§ ',u:'/brain-out/',c:'puzzle'},
      {n:'Bridge Builder',e:'ð',u:'/bridge-builder/',c:'puzzle'},
      {n:'Checkers',e:'â¬¤',u:'/checkers/',c:'puzzle'},
      {n:'Gomoku',e:'â«',u:'/gomoku/',c:'puzzle'},
      {n:'Cut the Rope',e:'ð¬',u:'/cut-the-rope/',c:'puzzle'},
      {n:'Drive Fury',e:'ðï¸',u:'/drive-fury/',c:'arcade'},
      {n:'Escape Manor',e:'ðï¸',u:'/escape-manor/',c:'puzzle'},
      {n:'Fill The Fridge',e:'ð§',u:'/fill-fridge/',c:'puzzle'},
      {n:'Flow Connect',e:'ð',u:'/flow-connect/',c:'puzzle'},
      {n:'Hex Block Puzzle',e:'â¬¡',u:'/hex-block/',c:'puzzle'},
      {n:'The Impossible Quiz',e:'ð§ ',u:'/impossible-quiz/',c:'puzzle'},
      {n:'Jigsaw Puzzle',e:'ð§©',u:'/jigsaw-puzzle/',c:'puzzle'},
      {n:'Kitchen Rush',e:'ð³',u:'/kitchen-rush/',c:'casual'},
      {n:'Level Devil',e:'ð',u:'/level-devil/',c:'arcade'},
      {n:'Little Alchemy',e:'âï¸',u:'/little-alchemy/',c:'puzzle'},
      {n:'Mahjong Solitaire',e:'ð',u:'/mahjong-solitaire/',c:'puzzle'},
      {n:'Marble Run',e:'ð®',u:'/marble-run/',c:'puzzle'},
     {n:'Zuma Marble Shooter',e:'ð®',u:'/zuma/',c:'puzzle'},
      {n:'Marble Shooter',e:'ð®',u:'/marble-shooter/',c:'puzzle'},
      {n:'Nonogram Puzzle',e:'ð²',u:'/nonogram/',c:'puzzle'},
      {n:'One Line Puzzle',e:'âï¸',u:'/one-line-puzzle/',c:'puzzle'},
      {n:'Parking Jam',e:'ð',u:'/parking-jam/',c:'puzzle'},
      {n:'Pipe Connect',e:'ð§',u:'/pipe-connect/',c:'puzzle'},
      {n:'Pull the Pin',e:'ð',u:'/pull-the-pin/',c:'puzzle'},
      {n:'Sand Balls',e:'ð',u:'/sand-balls/',c:'puzzle'},
      {n:'Save the Doge',e:'🐕',u:'/save-the-doge/',c:'puzzle'},
      {n:'Screw Jam',e:'🔩',u:'/screw-jam/',c:'puzzle'},
      {n:'Solitaire',e:'ð',u:'/solitaire/',c:'puzzle'},
      {n:'SoliTen',e:'ð¢',u:'/soliten/',c:'puzzle'},
      {n:'Twisted Tangle',e:'ð§¶',u:'/tangled-yarn/',c:'puzzle'},
      {n:'Tangram Puzzle',e:'ðº',u:'/tangram/',c:'puzzle'},
      {n:'Tangram Puzzle 2',e:'ð§©',u:'/tangram-puzzle/',c:'puzzle'},
      {n:'Triple Tile Match',e:'ð§©',u:'/triple-tile/',c:'puzzle'},
      {n:'Unblock Me',e:'ð§±',u:'/unblock-me/',c:'puzzle'},
      {n:'Watermelon Merge',e:'ð',u:'/watermelon-merge/',c:'puzzle'},
      {n:'Word Connections',e:'ð',u:'/word-connections/',c:'puzzle'},
      {n:'Word Search',e:'ð',u:'/word-search/',c:'puzzle'},
      {n:'Wordscapes',e:'ð¿',u:'/wordscapes/',c:'puzzle'},
      {n:'Yahtzee',e:'ð²',u:'/yahtzee/',c:'dice'},
      {n:'Ludo',e:'ð²',u:'/ludo/',c:'board'},
      {n:'Number Slide',e:'ð¢',u:'/number-slide/',c:'puzzle'},
      {n:'Rope Rescue',e:'ðª¢',u:'/rope-rescue/',c:'puzzle'},
      {n:'Peg Solitaire',e:'ð±',u:'/peg-solitaire/',c:'puzzle'},
      {n:'Path Finder',e:'ð',u:'/path-finder/',c:'puzzle'},
      {n:'Ice Breaker',e:'ð§',u:'/ice-breaker/',c:'puzzle'},
      {n:'Logic Gates',e:'ð',u:'/logic-gates/',c:'puzzle'},
      {n:'KenKen Puzzle',e:'ð§®',u:'/kenken/',c:'puzzle'},
      {n:'Kakuro Puzzle',e:'ð¢',u:'/kakuro/',c:'puzzle'},
      {n:'Mastermind',e:'ð',u:'/mastermind/',c:'puzzle'},
      {n:'Simon Says',e:'ð§ ',u:'/simon-says/',c:'puzzle'},
      {n:'Maze Runner',e:'ð',u:'/maze-runner/',c:'puzzle'},
      {n:'Slitherlink',e:'ð',u:'/slitherlink/',c:'puzzle'},
      {n:'Battleship',e:'ð¢',u:'/battleship/',c:'puzzle'},
      {n:'Lights Out',e:'ð¡',u:'/lights-out/',c:'puzzle'},
      {n:'Backgammon',e:'ð²',u:'/backgammon/',c:'board'},
      {n:'Color by Number',e:'ð¨',u:'/color-by-number/',c:'puzzle'},
      {n:'Connect Four',e:'ð´',u:'/connect-four/',c:'puzzle'},
      {n:'Dominoes',e:'ð£',u:'/dominoes/',c:'puzzle'},
      {n:'Hangman',e:'ð¯',u:'/hangman/',c:'puzzle'},
      {n:'Sokoban',e:'ð¦',u:'/sokoban/',c:'puzzle'},
      {n:'Spot the Difference',e:'ð',u:'/spot-the-difference/',c:'puzzle'},
      {n:'Tower Defense',e:'ð°',u:'/tower-defense/',c:'puzzle'},
      {n:'Tower of Hanoi',e:'ð°',u:'/tower-of-hanoi/',c:'puzzle'},
      {n:'Hashiwokakero',e:'ð',u:'/hashiwokakero/',c:'puzzle'},
      {n:'Killer Sudoku',e:'ð¢',u:'/killer-sudoku/',c:'puzzle'},
      {n:'Mancala',e:'ð«',u:'/mancala/',c:'board'},

      {n:'Merge Kingdom',e:'ð',u:'/merge-kingdom/',c:'puzzle'},
      {n:'Spider Solitaire',e:'ð·ï¸',u:'/spider-solitaire/',c:'card'},
      {n:'FreeCell Solitaire',e:'ð',u:'/freecell/',c:'card'},
      {n:'Chinese Checkers',e:'â­',u:'/chinese-checkers/',c:'board'},
      {n:'Chinese Chess',e:'ð',u:'/chinese-chess/',c:'puzzle'},
      {n:'Hearts',e:'â¥ï¸',u:'/hearts/',c:'card'},{n:'Pool',e:'ð±',u:'/pool/',c:'classic'},{n:'Pyramid Solitaire',e:'ð',u:'/pyramid-solitaire/',c:'card'},{n:'Spades',e:'â ï¸',u:'/spades/',c:'card'},{n:'Tripeaks',e:'ðï¸',u:'/tripeaks/',c:'card'},{n:'Golf Solitaire',e:'â³',u:'/golf-solitaire/',c:'card'},
      {n:'Rummy',e:'ð',u:'/rummy/',c:'card'},
      {n:'Bejeweled',e:'ð',u:'/bejeweled/',c:'puzzle'},
    {n:'Crazy Eights',e:'ð',u:'/crazy-eights/',c:'card'},

      {n:'Happy Glass',e:'ð¥',u:'/happy-glass/',c:'puzzle'},
      {n:'Farkle',e:'ð²',u:'/farkle/',c:'board'},
      {n:'Cribbage',e:'ð',u:'/cribbage/',c:'card'},
      {n:'Euchre',e:'â ï¸',u:'/euchre/',c:'card'},
      {n:'Wordle',e:'ð¤',u:'/wordle/',c:'puzzle'},
      {n:'Hidden Object',e:'ð',u:'/hidden-object/',c:'puzzle'},
      {n:'Tiny Fishing',e:'ð£',u:'/tiny-fishing/',c:'casual'},{n:"Threes!",e:"ð¢",u:"/threes/",c:"puzzle"},
      {n:'Doodle Jump',e:'ð¸',u:'/doodle-jump/',c:'arcade'},
      {n:'Papas Freezeria',e:'ð¦',u:'/papas-freezeria/',c:'simulation'},
      {n:'Gravity Run',e:'ð',u:'/gravity-run/',c:'arcade'},
      {n:'Cookie Clicker',e:'ðª',u:'/cookie-clicker/',c:'idle'},
      {n:'Moto X3M',e:'ðï¸',u:'/moto-x3m/',c:'racing'},
      {n:'Math 24',e:'ð¢',u:'/math-24/',c:'puzzle'},
      {n:'Mind Reader',e:'ð®',u:'/akinator/',c:'puzzle'},
      {n:'Blocky Blast',e:'ð§±',u:'/blocky-blast/',c:'puzzle'},
      {n:'Pin Master',e:'ð',u:'/pin-master/',c:'puzzle'},
      {n:'Word Scramble',e:'ð¤',u:'/word-scramble/',c:'puzzle'},
      {n:'There Is No Game',e:'ð®',u:'/there-is-no-game/',c:'puzzle'},
      {n:'Bloxorz',e:'ð²',u:'/bloxorz/',c:'puzzle'},
      {n:'Draw To Home',e:'ð ',u:'/draw-to-home/',c:'puzzle'},
      {n:'Duck Life',e:'ð¦',u:'/duck-life/',c:'puzzle'},
      {n:'Type Racer',e:'â¨ï¸',u:'/type-racer/',c:'skill'},
      {n:'Drift Boss',e:'ðï¸',u:'/drift-boss/',c:'racing'},
      {n:'Blockudoku',e:'ð§©',u:'/blockudoku/',c:'puzzle'},
      {n:'Thief Puzzle',e:'ð¦',u:'/thief-puzzle/',c:'puzzle'},
      {n:'Text Twist',e:'ð¤',u:'/text-twist/',c:'puzzle'},
      {n:'Onet Connect',e:'ð',u:'/onet/',c:'puzzle'},
      {n:'Neon Dash',e:'â¡',u:'/neon-dash/',c:'arcade'},
      {n:'Knit Off',e:'ð§¶',u:'/knit-off/',c:'puzzle'},
      {n:'Infinity Loop',e:'â¾ï¸',u:'/infinity-loop/',c:'puzzle'},
      {n:'Tens',e:'ð¢',u:'/tens-game/',c:'puzzle'},
      {n:'Pinball',e:'ð±',u:'/pinball/',c:'arcade'},
      {n:'Word Card Sort',e:'ð',u:'/word-card-sort/',c:'puzzle'},
      {n:'Stack Ball',e:'ð´',u:'/stack-ball/',c:'arcade'},
      {n:'Stickman Swing',e:'ð',u:'/stickman-swing/',c:'arcade'},
      {n:'Words Klondike',e:'ð',u:'/words-klondike/',c:'puzzle'},
      {n:'Find N Merge',e:'ð',u:'/find-n-merge/',c:'puzzle'},
          {n:'Cover Orange',e:'ð',u:'/cover-orange/',c:'puzzle'},
      {n:"Rubik's Cube",e:'ð§',u:'/rubiks-cube/',c:'puzzle'},
      {n:'Chocolate Bean Storm',e:'ð«',u:'/chocolate-bean-storm/',c:'arcade'},
      {n:'Compound Word',e:'ð',u:'/compound-word/',c:'puzzle'},
      {n:'Contexto',e:'ð§ ',u:'/contexto/',c:'puzzle'},
      {n:'Quordle',e:'ð¤',u:'/quordle/',c:'puzzle'},
      {n:'Schulte Table',e:'ð§ ',u:'/schulte-table/',c:'puzzle'},
      {n:'Waffle',e:'ð§',u:'/waffle/',c:'puzzle'},
      {n:'BoxRob',e:'ð¦',u:'/boxrob/',c:'puzzle'},
      {n:'Blackjack 21',e:'ð',u:'/blackjack/',c:'card'},

      {n:'100 Doors Puzzle Box',e:'ðª',u:'/100-doors/',c:'puzzle'},
      {n:'Crossmath',e:'ð§®',u:'/crossmath/',c:'puzzle'},
      {n:'Carrom Board',e:'ð¯',u:'/carrom/',c:'puzzle'},
      {n:'Two Dots',e:'ð´',u:'/two-dots/',c:'puzzle'},
      {n:'Who Is',e:'ð¤',u:'/who-is/',c:'puzzle'},
      {n:'Mekorama',e:'ð¤',u:'/mekorama/',c:'puzzle'},
      {n:'IQ Ball',e:'ð¯',u:'/iq-ball/',c:'puzzle'},
      {n:'Color Cars Parking',e:'ð',u:'/color-cars-parking/',c:'puzzle'},
      {n:'Cryptograms',e:'ð',u:'/cryptograms/',c:'puzzle'},
      {n:'Threes',e:'3ï¸â£',u:'/threes/',c:'puzzle'},
      {n:'Paper Fold Puzzle',e:'ð',u:'/paper-fold/',c:'puzzle'},
      {n:'Eggy Car',e:'ð¥',u:'/eggy-car/',c:'driving'},
      {n:'Unpacking',e:'ð¦',u:'/unpacking/',c:'puzzle'},
      {n:'Merge Sweets',e:'ð°',u:'/merge-sweets/',c:'puzzle'},
      {n:'Traffic Escape',e:'ð',u:'/traffic-escape/',c:'puzzle'},
      {n:'Ball Sort',e:'ð±',u:'/ball-sort/',c:'puzzle'},
      {n:'Slice Master',e:'ðª',u:'/slice-master/',c:'puzzle'},
      {n:'TriPeaks Solitaire',e:'ð',u:'/tripeaks-solitaire/',c:'card'},
      {n:'Magic Tiles',e:'ð¹',u:'/magic-tiles/',c:'puzzle'}
   ];

  var cur = location.pathname;
  var current = games.find(function(g){ return g.u === cur; });

  // SAVE current game to localStorage for homepage "Continue Playing" feature
  // This was missing â caused gz_recent_games to never be populated
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
  var sameCat = games.filter(function(g){ return current && g.c === current.c && g.u !== cur; });
   var others = games.filter(function(g){ return g.u !== cur && (!current || g.c !== current.c); });

   // Deterministic sort: use localStorage recent-play data, fallback to date-hash seed
   function getRecentGames() {
     try {
       var raw = localStorage.getItem('gz-recent-games');
       return raw ? JSON.parse(raw) : [];
     } catch (e) { return [{name:'Compound Word',e:'ð',u:'/compound-word/',c:'puzzle'},
{name:'Quordle',e:'ð¤',u:'/quordle/',c:'puzzle'},
{name:'Schulte Table',e:'ð§ ',u:'/schulte-table/',c:'puzzle'},
{name:'Chocolate Bean Storm',e:'ð«',u:'/chocolate-bean-storm/',c:'arcade'},
{name:'Waffle',e:'ð§',u:'/waffle/',c:'puzzle'},
{name:'Contexto',e:'ð§ ',u:'/contexto/',c:'puzzle'},
      {n:'Pinball',e:'ð±',u:'/pinball/',c:'arcade'},
      {n:'Word Card Sort',e:'ð',u:'/word-card-sort/',c:'puzzle'},
      {n:'Stack Ball',e:'ð´',u:'/stack-ball/',c:'arcade'},
      {n:'Stickman Swing',e:'ð',u:'/stickman-swing/',c:'arcade'},
      {n:'Threes!',e:'ð¢',u:'/threes/',c:'puzzle'},
      {n:'Words Klondike',e:'ð',u:'/words-klondike/',c:'puzzle'},
      {n:'Find N Merge',e:'ð',u:'/find-n-merge/',c:'puzzle'},
  {n:'Cryptograms',e:'ð',u:'/cryptograms/',c:'puzzle'},
  {n:'Mekorama',e:'ð¤',u:'/mekorama/',c:'puzzle'},
      {n:'Jewel Crush',e:'ð',u:'/jewel-crush/',c:'puzzle'},
      {n:'Go Fish',e:'ð',u:'/go-fish/',c:'card'},
      {n:'Guess The Emoji',e:'ð¤',u:'/guess-the-emoji/',c:'puzzle'},
      {n:'Trivia Crack',e:'â',u:'/trivia-crack/',c:'puzzle'},
      {n:'Fireboy & Watergirl',e:'ð¥',u:'/fireboy-watergirl/',c:'puzzle'},
      {n:'Plinko',e:'âª',u:'/plinko/',c:'arcade'},
      {n:'Mahjong Dimensions',e:'ð',u:'/mahjong-dimensions/',c:'puzzle'},
      {n:'Pattern Palace',e:'ð®',u:'/pattern-palace/',c:'puzzle'},
      {n:'Liquid Sort',e:'ð§ª',u:'/liquid-sort/',c:'puzzle'},
{n:"Factory Balls",e:"ð¨",u:"/factory-balls/",c:"puzzle"},
{n:"4 Pics 1 Word",e:"ð¼ï¸",u:"/picture-word-guessing/",c:"puzzle"},
{n:"Antistress",e:"ð§¸",u:"/antistress/",c:"casual"},{n:"Monkey Mart",e:"ð",u:"/monkey-mart/",c:"casual"},{n:"Gravity Drop",e:"ð´",u:"/gravity-drop/",c:"puzzle"},{n:'Number Nexus',e:'ð¢',u:'/number-nexus/',c:'puzzle'},{n:'Poly Art 3D',e:'ð¨',u:'/poly-art-3d/',c:'puzzle'},{n:"Baba Is You",e:"ð§©",u:"/baba-is-you/",c:"puzzle"},{n:"Nut Sort",e:"ð©",u:"/nut-sort/",c:"puzzle"},
{n:"Pop Them",e:"ð¥",u:"/pop-them/",c:"puzzle"}
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
     puzzle: {t:'ð§© More Puzzle', u:'/puzzle-games.html'},
     arcade: {t:'ð¹ï¸ More Arcade', u:'/arcade-games.html'},
     idle: {t:'â° More Idle', u:'/idle-games.html'},
     card: {t:'ð More Card', u:'/card-games.html'},
      strategy: {t:'âï¸ More Strategy', u:'/simulation-games.html'},
      skill: {t:'â¡ More Skill', u:'/word-typing-games.html'}
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
   h += '<a href="/" style="display:inline-flex;align-items:center;gap:4px;background:#4ecdc4;padding:4px 10px;border-radius:12px;text-decoration:none;color:#000;font-size:11px;font-family:sans-serif;font-weight:700;flex-shrink:0">ð® All Games</a>';
   h += '<a href="https://tools.gamezipper.com" style="display:inline-flex;align-items:center;gap:4px;background:#ffd93d;padding:4px 10px;border-radius:12px;text-decoration:none;color:#000;font-size:11px;font-family:sans-serif;font-weight:700;flex-shrink:0">ð  Tools</a>';
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
    // Trigger commercialBreak asynchronously â don't block navigation
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
   // DOM already ready â still defer to requestIdleCallback with hard timeout fallback.
   // RIC may never fire on idle headless browsers (Kachilu, Lighthouse), so always
   // schedule a setTimeout fallback that runs init() within 2s regardless.
   if ('requestIdleCallback' in window) {
     requestIdleCallback(init, { timeout: 2000 });
   }
   setTimeout(init, 2000);
 }
})();