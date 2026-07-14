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

 // Respect user dismissal — use sessionStorage so it persists within the tab
 if (sessionStorage.getItem('gz-footer-dismissed')) return;

 // Defer all DOM work to after DOMContentLoaded + requestIdleCallback
  function init() {
   // Guard: prevent duplicate footer if init() is called twice (RIC + setTimeout race)
   if (document.getElementById('game-footer')) return;
   var games = [
     {n:'Pattern Matrix',e:'🔢',u:'/pattern-matrix/',c:'puzzle'},
     {n:'2048',e:'🔢',u:'/2048/',c:'puzzle'},
     {n:'Snake',e:'🐍',u:'/snake/',c:'arcade'},
     {n:'Flappy Wings',e:'🐦',u:'/flappy-wings/',c:'arcade'},
     {n:'Color Sort',e:'🎨',u:'/color-sort/',c:'puzzle'},
     {n:'Goods Sort',e:'📦',u:'/goods-sort/',c:'puzzle'},
     {n:'Word Puzzle',e:'📝',u:'/word-puzzle/',c:'puzzle'},
     {n:'Circuit Logic',e:'⚡',u:'/circuit-logic/',c:'puzzle'},
     {n:'Whack-a-Mole',e:'🔨',u:'/whack-a-mole/',c:'arcade'},
     {n:'Memory Match',e:'🧠',u:'/memory-match/',c:'card'},
     {n:'Sushi Stack',e:'🍣',u:'/sushi-stack/',c:'puzzle'},
     {n:'Ocean Gem Pop',e:'💎',u:'/ocean-gem-pop/',c:'puzzle'},
     {n:'Color Block Jam',e:'🎨',u:'/color-block-jam/',c:'puzzle'},
     {n:'Color Switch',e:'🎨',u:'/color-switch/',c:'puzzle'},
     {n:'Bonsai Prune',e:'🌳',u:'/bonsai-prune/',c:'puzzle'},
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
     {n:'Block Blast Bingo',e:'🧩',u:'/block-blast-bingo/',c:'puzzle'},
     {n:'Mo Yu Fayu',e:'🐟',u:'/mo-yu-fayu/',c:'idle'},
     {n:'Tetris',e:'🧱',u:'/tetris/',c:'puzzle'},
     {n:'Sudoku',e:'🔢',u:'/sudoku/',c:'puzzle'},
     {n:'Chess',e:'♟️',u:'/chess/',c:'strategy'},
     {n:'Pong',e:'🏓',u:'/pong/',c:'arcade'},
     {n:'Crossword',e:'✏️',u:'/crossword/',c:'puzzle'},
     {n:'Minesweeper',e:'💣',u:'/minesweeper/',c:'puzzle'},
     {n:'Grass Master',e:'🌿',u:'/grass-master/',c:'puzzle'},
     {n:'Gecko Out',e:'🦎',u:'/gecko-out/',c:'puzzle'},
     {n:'Beads Out',e:'📿',u:'/beads-out/',c:'puzzle'},
     {n:'Pocket Sort',e:'🪙',u:'/pocket-sort/',c:'puzzle'},
     {n:'Emoji Merge',e:'🧩',u:'/emoji-merge/',c:'puzzle'},
     {n:'Slope',e:'⛷️',u:'/slope/',c:'arcade'},
     {n:'Bounce Bot',e:'🤖',u:'/bounce-bot/',c:'arcade'},
     {n:'Alien Whack',e:'👾',u:'/alien-whack/',c:'arcade'},
     {n:'Reaction Time',e:'⚡',u:'/reaction-time/',c:'skill'},
     {n:'Cloud Sheep',e:'☁️',u:'/cloud-sheep/',c:'puzzle'},
     {n:'Ball Catch',e:'⚾',u:'/ball-catch/',c:'arcade'},
     {n:'Abyss Chef',e:'🍳',u:'/abyss-chef/',c:'puzzle'},
     {n:'Neon Run',e:'⚡',u:'/neon-run/',c:'arcade'},
     {n:'Basketball Shoot',e:'🏀',u:'/basketball-shoot/',c:'arcade'},
     {n:'Glyph Quest',e:'🔤',u:'/glyph-quest/',c:'puzzle'},
     {n:'Fruit Slash',e:'🍉',u:'/fruit-slash/',c:'arcade'},
     {n:'Magic Sort',e:'✨',u:'/magic-sort/',c:'puzzle'},
     {n:'T-Rex',e:'🦖',u:'/t-rex/',c:'arcade'},
     {n:'Bubble Pop',e:'🫧',u:'/bubble-pop/',c:'puzzle'},
     {n:'Pixel Logic',e:'🧩',u:'/pixel-logic/',c:'puzzle'},
     {n:'Tile Dynasty',e:'🏮',u:'/tile-dynasty/',c:'puzzle'},
     {n:'Arrow Escape',e:'🚀',u:'/arrow-escape/',c:'puzzle'},
     {n:'Bubble Shooter',e:'🫧',u:'/bubble-shooter/',c:'puzzle'},
     {n:'Tic Tac Toe',e:'⭕',u:'/tic-tac-toe/',c:'puzzle'},
     {n:'One Line Connect',e:'🔗',u:'/one-line-connect/',c:'puzzle'},
     {n:'Physics Draw Puzzle',e:'✏️',u:'/physics-draw-puzzle/',c:'puzzle'},
     {n:'Dots and Boxes',e:'⬜',u:'/dots-and-boxes/',c:'puzzle'},
     {n:'Sliding Puzzle',e:'🔢',u:'/sliding-puzzle/',c:'puzzle'},
     {n:'Reversi',e:'⚫',u:'/reversi/',c:'puzzle'},
     {n:'Match Ninja',e:'🧊',u:'/match-ninja/',c:'puzzle'},
     {n:'Jewel Coloring',e:'💎',u:'/jewel-coloring/',c:'puzzle'},

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
     {n:'Zuma Marble Shooter',e:'🔮',u:'/zuma/',c:'puzzle'},
      {n:'Marble Shooter',e:'🔮',u:'/marble-shooter/',c:'puzzle'},
      {n:'Nonogram Puzzle',e:'🔲',u:'/nonogram/',c:'puzzle'},
      {n:'One Line Puzzle',e:'✏️',u:'/one-line-puzzle/',c:'puzzle'},
      {n:'Parking Jam',e:'🚗',u:'/parking-jam/',c:'puzzle'},
      {n:'Pipe Connect',e:'🔧',u:'/pipe-connect/',c:'puzzle'},
      {n:'Pull the Pin',e:'📌',u:'/pull-the-pin/',c:'puzzle'},
      {n:'Sand Balls',e:'🏐',u:'/sand-balls/',c:'puzzle'},
      {n:'Save the Doge',e:'🐕',u:'/save-the-doge/',c:'puzzle'},
      {n:'Screw Jam',e:'🔩',u:'/screw-jam/',c:'puzzle'},
      {n:'Slingshot Puzzle',e:'🎯',u:'/slingshot-puzzle/',c:'puzzle'},
      {n:'Fulcrum Balance',e:'⚖️',u:'/fulcrum-balance/',c:'puzzle'},
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
      {n:'Labyrinth Maze',e:'🌀',u:'/labyrinth/',c:'puzzle'},
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
      {n:'Tower of Hanoi',e:'🏰',u:'/tower-of-hanoi/',c:'puzzle'},
      {n:'Hashiwokakero',e:'🌉',u:'/hashiwokakero/',c:'puzzle'},
      {n:'Killer Sudoku',e:'🔢',u:'/killer-sudoku/',c:'puzzle'},
      {n:'Mancala',e:'🫘',u:'/mancala/',c:'board'},

      {n:'Merge Kingdom',e:'👑',u:'/merge-kingdom/',c:'puzzle'},
      {n:'Spider Solitaire',e:'🕷️',u:'/spider-solitaire/',c:'card'},
      {n:'FreeCell Solitaire',e:'🃏',u:'/freecell/',c:'card'},
      {n:'Chinese Checkers',e:'⭐',u:'/chinese-checkers/',c:'board'},
      {n:'Chinese Chess',e:'🐉',u:'/chinese-chess/',c:'puzzle'},
      {n:'Hearts',e:'♥️',u:'/hearts/',c:'card'},{n:'Pool',e:'🎱',u:'/pool/',c:'classic'},{n:'Pyramid Solitaire',e:'🃏',u:'/pyramid-solitaire/',c:'card'},{n:'Spades',e:'♠️',u:'/spades/',c:'card'},{n:'Tripeaks',e:'🏔️',u:'/tripeaks/',c:'card'},{n:'Golf Solitaire',e:'⛳',u:'/golf-solitaire/',c:'card'},
      {n:'Rummy',e:'🃏',u:'/rummy/',c:'card'},
      {n:'Bejeweled',e:'💎',u:'/bejeweled/',c:'puzzle'},
    {n:'Crazy Eights',e:'🃏',u:'/crazy-eights/',c:'card'},

      {n:'Happy Glass',e:'🥛',u:'/happy-glass/',c:'puzzle'},
      {n:'Farkle',e:'🎲',u:'/farkle/',c:'board'},
      {n:'Cribbage',e:'🃏',u:'/cribbage/',c:'card'},
      {n:'Euchre',e:'♠️',u:'/euchre/',c:'card'},
      {n:'Wordle',e:'🔤',u:'/wordle/',c:'puzzle'},
      {n:'Hidden Object',e:'🔍',u:'/hidden-object/',c:'puzzle'},
      {n:'Tiny Fishing',e:'🎣',u:'/tiny-fishing/',c:'casual'},{n:"Build A Queen",e:"👗",u:"/build-a-queen/",c:"casual"},{n:"Threes!",e:"🀄",u:"/threes/",c:"puzzle"},
      {n:'Doodle Jump',e:'🐸',u:'/doodle-jump/',c:'arcade'},
      {n:'Papas Freezeria',e:'🍦',u:'/papas-freezeria/',c:'simulation'},
      {n:'Gravity Run',e:'🏃',u:'/gravity-run/',c:'arcade'},
      {n:'Cookie Clicker',e:'🍪',u:'/cookie-clicker/',c:'idle'},
      {n:'Moto X3M',e:'🏍️',u:'/moto-x3m/',c:'racing'},
      {n:'Math 24',e:'🔢',u:'/math-24/',c:'puzzle'},
      {n:'Mind Reader',e:'🔮',u:'/akinator/',c:'puzzle'},
      {n:'Blocky Blast',e:'🧱',u:'/blocky-blast/',c:'puzzle'},
      {n:'Pin Master',e:'📌',u:'/pin-master/',c:'puzzle'},
      {n:'Word Scramble',e:'🔤',u:'/word-scramble/',c:'puzzle'},
      {n:'There Is No Game',e:'🎮',u:'/there-is-no-game/',c:'puzzle'},
      {n:'Bloxorz',e:'🔲',u:'/bloxorz/',c:'puzzle'},
      {n:'Draw To Home',e:'🏠',u:'/draw-to-home/',c:'puzzle'},
      {n:'Duck Life',e:'🦆',u:'/duck-life/',c:'puzzle'},
      {n:'Type Racer',e:'⌨️',u:'/type-racer/',c:'skill'},
      {n:'Drift Boss',e:'🏎️',u:'/drift-boss/',c:'racing'},
      {n:'Blockudoku',e:'🧩',u:'/blockudoku/',c:'puzzle'},
      {n:'Thief Puzzle',e:'🦝',u:'/thief-puzzle/',c:'puzzle'},
      {n:'Text Twist',e:'🔤',u:'/text-twist/',c:'puzzle'},
      {n:'Onet Connect',e:'🔗',u:'/onet/',c:'puzzle'},
      {n:'Neon Dash',e:'⚡',u:'/neon-dash/',c:'arcade'},
      {n:'Knit Off',e:'🧶',u:'/knit-off/',c:'puzzle'},
      {n:'Infinity Loop',e:'♾️',u:'/infinity-loop/',c:'puzzle'},
      {n:'Tens',e:'🔢',u:'/tens-game/',c:'puzzle'},
      {n:'Pinball',e:'🎱',u:'/pinball/',c:'arcade'},
      {n:'Word Card Sort',e:'🃏',u:'/word-card-sort/',c:'puzzle'},
      {n:'Stack Ball',e:'🔴',u:'/stack-ball/',c:'arcade'},
      {n:'Stickman Swing',e:'🏃',u:'/stickman-swing/',c:'arcade'},
      {n:'Words Klondike',e:'🃏',u:'/words-klondike/',c:'puzzle'},
      {n:'Find N Merge',e:'🔍',u:'/find-n-merge/',c:'puzzle'},
          {n:'Cover Orange',e:'🍊',u:'/cover-orange/',c:'puzzle'},
      {n:"Rubik's Cube",e:'🧊',u:'/rubiks-cube/',c:'puzzle'},
      {n:'Chocolate Bean Storm',e:'🍫',u:'/chocolate-bean-storm/',c:'arcade'},
      {n:'Compound Word',e:'🔗',u:'/compound-word/',c:'puzzle'},
      {n:'Contexto',e:'🧠',u:'/contexto/',c:'puzzle'},
      {n:'Quordle',e:'🔤',u:'/quordle/',c:'puzzle'},
      {n:'Schulte Table',e:'🧠',u:'/schulte-table/',c:'puzzle'},
      {n:'Waffle',e:'🧇',u:'/waffle/',c:'puzzle'},
      {n:'BoxRob',e:'📦',u:'/boxrob/',c:'puzzle'},
      {n:'Blackjack 21',e:'🃏',u:'/blackjack/',c:'card'},

      {n:'100 Doors Puzzle Box',e:'🚪',u:'/100-doors/',c:'puzzle'},
      {n:'Crossmath',e:'🧮',u:'/crossmath/',c:'puzzle'},
      {n:'Carrom Board',e:'🎯',u:'/carrom/',c:'puzzle'},
      {n:'Two Dots',e:'🔴',u:'/two-dots/',c:'puzzle'},
      {n:'Who Is',e:'🤔',u:'/who-is/',c:'puzzle'},
      {n:'Mekorama',e:'🤖',u:'/mekorama/',c:'puzzle'},
      {n:'IQ Ball',e:'🎯',u:'/iq-ball/',c:'puzzle'},
      {n:'Color Cars Parking',e:'🚗',u:'/color-cars-parking/',c:'puzzle'},
      {n:'Cryptograms',e:'🔐',u:'/cryptograms/',c:'puzzle'},
      {n:'Threes',e:'3️⃣',u:'/threes/',c:'puzzle'},
      {n:'Paper Fold Puzzle',e:'📄',u:'/paper-fold/',c:'puzzle'},
      {n:'Eggy Car',e:'🥚',u:'/eggy-car/',c:'driving'},
      {n:'Unpacking',e:'📦',u:'/unpacking/',c:'puzzle'},
      {n:'Merge Sweets',e:'🍰',u:'/merge-sweets/',c:'puzzle'},
      {n:'Traffic Escape',e:'🚗',u:'/traffic-escape/',c:'puzzle'},
      {n:'Ball Sort',e:'🎱',u:'/ball-sort/',c:'puzzle'},
      {n:'Slice Master',e:'🔪',u:'/slice-master/',c:'puzzle'},
      {n:'TriPeaks Solitaire',e:'🃏',u:'/tripeaks-solitaire/',c:'card'},
      {n:'Magic Tiles',e:'🎹',u:'/magic-tiles/',c:'puzzle'},
      {n:'Stick Hero',e:'🦸',u:'/stick-hero/',c:'skill'},
      {n:'Balls vs Bricks',e:'⚪',u:'/balls-vs-bricks/',c:'puzzle'},
{n:'Magnet Drop',e:'🧲',u:'/magnet-drop/',c:'puzzle'},
{n:'Rockfall',e:'🪨',u:'/rockfall/',c:'puzzle'},
{n:'Wood Turning',e:'🪵',u:'/wood-turning/',c:'puzzle'},{n:'Sextant Celestial',e:'🧭',u:'/sextant-celestial/',c:'puzzle'},
{n:'Resonance Lock',e:'🌊',u:'/resonance-lock/',c:'puzzle'},
{n:"Crucible Alloy",e:"🔥",u:"/crucible-alloy/",c:"puzzle"},
{n:"Armillary Align",e:"🌐",u:"/armillary-align/",c:"puzzle"},
{n:"Plug Master",e:"🔌",u:"/plug-master/",c:"puzzle"}
,{n:'Tetravex',e:'🔲',u:'/tetravex/',c:'puzzle'}
,{n:'Qwirkle',e:'🎮',u:'/qwirkle/',c:'puzzle'}
,{n:'Ships Finder',e:'🚢',u:'/ships-finder/',c:'puzzle'}
,{n:'Nerdle',e:'🧠',u:'/nerdle/',c:'puzzle'},{n:"Klotski",e:"🧩",u:"/klotski/",c:"puzzle"},{n:"Green",e:"💚",u:"/green/",c:"puzzle"},{n:"Orange",e:"🧡",u:"/orange/",c:"puzzle"},{n:"Purple",e:"💜",u:"/purple/",c:"puzzle"},{n:"Red",e:"❤️",u:"/red/",c:"puzzle"},{n:"Catch the Cat",e:"🐱",u:"/catch-the-cat/",c:"puzzle"},
{n:"Sticker Book Puzzle",e:"🎨",u:"/sticker-book-puzzle/",c:"puzzle"},{n:"Dotchi-Loop",e:"🔄",u:"/dotchi-loop/",c:"puzzle"},{n:"Chiyotsui",e:"🚪",u:"/chiyotsui/",c:"puzzle"}]

  var cur = location.pathname;
  var current = games.find(function(g){ return g && g.u === cur; });

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
       return raw ? JSON.parse(raw) : [,{n:'Domino Toppler',e:'🁢',u:'/domino-toppler/',c:'puzzle'}]
     } catch (e) { return [{name:'Compound Word',e:'🔗',u:'/compound-word/',c:'puzzle'},
{name:'Quordle',e:'🔤',u:'/quordle/',c:'puzzle'},
{name:'Schulte Table',e:'🧠',u:'/schulte-table/',c:'puzzle'},
{name:'Chocolate Bean Storm',e:'🍫',u:'/chocolate-bean-storm/',c:'arcade'},
{name:'Waffle',e:'🧇',u:'/waffle/',c:'puzzle'},
{name:'Contexto',e:'🧠',u:'/contexto/',c:'puzzle'},
      {n:'Pinball',e:'🎱',u:'/pinball/',c:'arcade'},
      {n:'Word Card Sort',e:'🃏',u:'/word-card-sort/',c:'puzzle'},
      {n:'Stack Ball',e:'🔴',u:'/stack-ball/',c:'arcade'},
      {n:'Stickman Swing',e:'🏃',u:'/stickman-swing/',c:'arcade'},
      {n:'Threes!',e:'🔢',u:'/threes/',c:'puzzle'},
      {n:'Words Klondike',e:'🃏',u:'/words-klondike/',c:'puzzle'},
      {n:'Find N Merge',e:'🔍',u:'/find-n-merge/',c:'puzzle'},
  {n:'Cryptograms',e:'🔐',u:'/cryptograms/',c:'puzzle'},
  {n:'Mekorama',e:'🤖',u:'/mekorama/',c:'puzzle'},
      {n:'Jewel Crush',e:'💎',u:'/jewel-crush/',c:'puzzle'},
      {n:'Go Fish',e:'🐟',u:'/go-fish/',c:'card'},
      {n:'Guess The Emoji',e:'🤔',u:'/guess-the-emoji/',c:'puzzle'},
      {n:'Trivia Crack',e:'❓',u:'/trivia-crack/',c:'puzzle'},
      {n:'Fireboy & Watergirl',e:'🔥',u:'/fireboy-watergirl/',c:'puzzle'},
      {n:'Plinko',e:'⚪',u:'/plinko/',c:'arcade'},
      {n:'Mahjong Dimensions',e:'🀄',u:'/mahjong-dimensions/',c:'puzzle'},
      {n:'Pattern Palace',e:'🔮',u:'/pattern-palace/',c:'puzzle'},
      {n:'Liquid Sort',e:'🧪',u:'/liquid-sort/',c:'puzzle'},
{n:"Factory Balls",e:"🎨",u:"/factory-balls/",c:"puzzle"},
{n:"4 Pics 1 Word",e:"🖼️",u:"/picture-word-guessing/",c:"puzzle"},
{n:"Antistress",e:"🧸",u:"/antistress/",c:"casual"},{n:"Monkey Mart",e:"🐒",u:"/monkey-mart/",c:"casual"},{n:"Gravity Drop",e:"🔴",u:"/gravity-drop/",c:"puzzle"},{n:'Number Nexus',e:'🔢',u:'/number-nexus/',c:'puzzle'},{n:'Poly Art 3D',e:'🎨',u:'/poly-art-3d/',c:'puzzle'},{n:"Baba Is You",e:"🧩",u:"/baba-is-you/",c:"puzzle"},{n:"Nut Sort",e:"🔩",u:"/nut-sort/",c:"puzzle"},
{n:"Pop Them",e:"💥",u:"/pop-them/",c:"puzzle"},{n:"Heyawake",e:"\u25a2",u:"/heyawake/",c:"puzzle"},{n:"Gokigen Naname",e:"\u25c7",u:"/gokigen-naname/",c:"puzzle"},{n:"Stained Glass",e:"🎨",u:"/stained-glass/",c:"puzzle"},{n:"Sandtrix Classic",e:"🏖",u:"/sandtrix-classic/",c:"puzzle"},{n:"Sandtrix",e:"🏖️",u:"/sandtrix/",c:"puzzle"},
{n:"Solitaire Roguelite",e:"\U0001f3f0",u:"/solitaire-roguelite/",c:"card"},
{n:'Peg Blast',e:'🎯',u:'/peg-blast/',c:'puzzle'},
      {n:'Delete One Part',e:'🧽',u:'/delete-one-part/',c:'puzzle'},
      {n:'Draw to Save',e:'🛡️',u:'/draw-to-save/',c:'puzzle'},
      {n:'Burn the Rope',e:'🔥',u:'/burn-the-rope/',c:'puzzle'},
      {n:'String Art Studio',e:'🧵',u:'/string-art/',c:'puzzle'},
{n:'Gem Paint',e:'💎',u:'/gem-paint/',c:'puzzle'},
{n:'Futoshiki',e:'🧩',u:'/futoshiki/',c:'puzzle'},
{n:'Hoop Stack',e:'🎯',u:'/hoop-stack/',c:'puzzle'},
{n:'Claw Master',e:'🦾',u:'/claw-machine/',c:'puzzle'},
      {n:'Nail Art Studio',e:'💅',u:'/nail-art/',c:'puzzle'},
      {n:'Odd One Out',e:'🔍',u:'/odd-one-out/',c:'puzzle'},
      {n:'Ships Finder',e:'🚢',u:'/ships-finder/',c:'puzzle'},
      {n:'Nerdle',e:'🧠',u:'/nerdle/',c:'puzzle'},
      {n:'Quoridor Strategy',e:'🧱',u:'/quoridor/',c:'puzzle'},
{n:'PathPix',e:'🎨',u:'/pathpix/',c:'puzzle'},{n:'Woodoku',e:'🪵',u:'/woodoku/',c:'puzzle'},{n:'Fill-a-Pix',e:'🔢',u:'/fill-a-pix/',c:'puzzle'},
      {n:'Yellow',e:'💛',u:'/yellow/',c:'puzzle'},
      {n:'Blue',e:'💙',u:'/blue/',c:'puzzle'},
      {n:'Purple',e:'💜',u:'/purple/',c:'puzzle'},
      {n:'Red',e:'❤️',u:'/red/',c:'puzzle'},
      {n:'Hexa 2048',e:'🔷',u:'/hexa-2048/',c:'puzzle'},
{n:'Drawer Sort',e:'🗂️',u:'/drawer-sort/',c:'puzzle'},
{n:'Hexa Away',e:'⬡',u:'/hexa-away/',c:'puzzle'},
{n:'Slide Cat',e:'🐱',u:'/slide-cat/',c:'puzzle'},
{n:'Gold Miner',e:'⛏️',u:'/gold-miner/',c:'puzzle'},
{n:'Catch the Cat',e:'🐱',u:'/catch-the-cat/',c:'puzzle'},
{n:'Sticker Book Puzzle',e:'🎨',u:'/sticker-book-puzzle/',c:'puzzle'},
{n:'Heart Star',e:'💛',u:'/heart-star/',c:'puzzle'},
{n:'Rubber Band Puzzle',e:'🔵',u:'/rubber-band-puzzle/',c:'puzzle'},
{n:'Pulse Path',e:'⚡',u:'/pulse-path/',c:'puzzle'},
{n:'Rullo',e:'🔢',u:'/rullo/',c:'puzzle'},
{n:'Pentopia',e:'🧩',u:'/pentopia/',c:'puzzle'},
{n:'Kaero',e:'🏠',u:'/kaero/',c:'puzzle'},
{n:'Renban',e:'🔢',u:'/renban/',c:'puzzle'}
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
      skill: {t:'⚡ More Skill', u:'/word-typing-games.html'}
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