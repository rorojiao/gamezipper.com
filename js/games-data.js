/**
 * GameZipper - Centralized Game Data
 * Each game has a `status` field: "live" (visible on main site) or "beta" (test zone only)
 * Admin panel can change status via localStorage overrides.
 */
const GAME_GRADIENTS = [
  'linear-gradient(135deg,#667eea,#764ba2)',
  'linear-gradient(135deg,#f093fb,#f5576c)',
  'linear-gradient(135deg,#4facfe,#00f2fe)',
  'linear-gradient(135deg,#43e97b,#38f9d7)',
  'linear-gradient(135deg,#fa709a,#fee140)',
  'linear-gradient(135deg,#a18cd1,#fbc2eb)',
  'linear-gradient(135deg,#fccb90,#d57eeb)',
  'linear-gradient(135deg,#ff9a9e,#fecfef)',
  'linear-gradient(135deg,#ffecd2,#fcb69f)',
  'linear-gradient(135deg,#a1c4fd,#c2e9fb)'
];

const GAMES = [
  {name:"Fruit Slash",emoji:"🍉",cat:"arcade",tags:["Arcade","Swipe","Fruit"],url:"/fruit-slash/",desc:"Swipe to slice fruits! Cut fast, combo big, dodge bombs. 60 seconds of juicy action!",isNew:true,status:"live"},
  {name:"Basketball Shoot",emoji:"🏀",cat:"arcade",tags:["Arcade","Sports","Physics"],url:"/basketball-shoot/",desc:"Shoot hoops in 60 seconds! Drag to aim, release to shoot. Swish for bonus points!",isNew:true,status:"live"},
  {name:"Neon Run",emoji:"⚡",cat:"arcade",tags:["Arcade","Runner","Platformer"],url:"/neon-run/",desc:"Run, jump, double-jump! Collect stars, dodge neon spikes. Endless neon platform runner.",isNew:true,status:"live"},
  {name:"2048 Galaxy",emoji:"🌌",cat:"puzzle",tags:["Puzzle","Number"],url:"/2048/",desc:"Merge tiles to reach 2048! Classic number puzzle game.",status:"live"},
  {name:"Typing Speed Test",emoji:"⚡",cat:"skill",tags:["Skill","Typing"],url:"/typing-speed/",desc:"Test your typing speed! How fast can you type?",status:"live"},
  {name:"Crystal Sort Puzzle",emoji:"🧊",cat:"puzzle",tags:["Puzzle","Sort"],url:"/color-sort/",desc:"Sort colored balls into tubes. 25 challenging levels!",status:"live"},
  {name:"Daily Word Puzzle",emoji:"📜",cat:"puzzle",tags:["Word","Daily"],url:"/word-puzzle/",desc:"Guess the hidden word in 6 tries. New puzzle daily!",status:"live"},
  {name:"Crossword Puzzle",emoji:"✏️",cat:"puzzle",tags:["Word","Puzzle","Daily"],url:"/crossword/",desc:"Fill in the crossword grid! New puzzle daily. Classic crossword clues and word play.",isNew:true,status:"live"},
  {name:"Classic Sudoku",emoji:"🧩",cat:"puzzle",tags:["Puzzle","Number","Logic"],url:"/sudoku/",desc:"Classic 9×9 Sudoku! Three difficulty levels, notes mode, timer, undo. The timeless number logic puzzle!",isNew:true,status:"live"},
  {name:"Classic Minesweeper",emoji:"💣",cat:"puzzle",tags:["Puzzle","Logic","Classic"],url:"/minesweeper/",desc:"Classic mine sweeper! Three difficulty levels, timer, auto-reveal. The timeless logic puzzle classic!",isNew:true,status:"live"},
  {name:"SlackOff Defense",emoji:"🐟",cat:"idle",tags:["Strategy","Idle","Office"],url:"/mo-yu-fayu/",desc:"Build screen turrets, dodge your boss, and survive 8 inspection waves in this office tower defense game!",isNew:true,status:"live"},
  {name:"Pong",emoji:"🏓",cat:"arcade",tags:["Arcade","Retro","Sports"],url:"/pong/",desc:"Classic arcade tennis! Hit the ball back against the AI. 3 difficulty levels. Retro neon style!",isNew:true,status:"live"},
  {name:"Ball Catch",emoji:"🎾",cat:"arcade",tags:["Arcade","Reflex","Catch"],url:"/ball-catch/",desc:"Catch falling balls with your paddle! Test your reflexes in this fast-paced arcade game.",isNew:true,status:"live"},
  {name:"Dessert Blast",emoji:"🍰",cat:"puzzle",tags:["Match-3","Sweets"],url:"/dessert-blast/",desc:"Match and blast delicious desserts in this sweet puzzle!",status:"live"},
  {name:"Catch Turkey",emoji:"🦃",cat:"arcade",tags:["Arcade","Catch"],url:"/catch-turkey/",desc:"Catch the cheeky turkeys before they escape!",status:"live"},
  {name:"Cyberpunk Flappy",emoji:"🐦",cat:"arcade",tags:["Arcade","Fly"],url:"/flappy-wings/",desc:"Flap through pipes! How far can you fly?",status:"live"},
  {name:"Slope",emoji:"🔴",cat:"arcade",tags:["Arcade","Runner","Speed"],url:"/slope/",desc:"Roll down the slope at insane speed! Dodge obstacles, collect gems. How far can you go?",status:"live"},
  {name:"Reaction Time",emoji:"⚡",cat:"arcade",tags:["Arcade","Reflex","Test"],url:"/reaction-time/",desc:"Test your reaction speed! Click as fast as you can when the screen turns green. How quick are your reflexes?",status:"live"},
  {name:"Alien Whack",emoji:"👽",cat:"arcade",tags:["Arcade","Space","Reflex"],url:"/alien-whack/",desc:"Whack aliens from space! Green=1pt, Gold=3pts, Bombs=-2pts. Build combos for 2x bonus! 60 seconds!",status:"live"},
  {name:"Steam Whacker",emoji:"⚙️",cat:"arcade",tags:["Arcade","Whack"],url:"/whack-a-mole/",desc:"Whack moles for points, dodge bombs! 60 second challenge!",status:"live"},
  {name:"Memory Master",emoji:"🎪",cat:"card",tags:["Card","Memory"],url:"/memory-match/",desc:"Flip cards and find matching pairs. Train your memory!",status:"live"},
  {name:"Alchemy Workshop",emoji:"🧪",cat:"idle",tags:["Idle","Clicker"],url:"/idle-clicker/",desc:"Click cookies, buy upgrades, automate your cookie empire!",status:"live"},
  {name:"Kitty's Café",emoji:"🐱",cat:"puzzle",tags:["Merge","Cat"],url:"/kitty-cafe/",desc:"Adopt a stray kitty and build the cutest cat café! Merge items to fulfill orders.",status:"live"},
  {name:"Paint Splash",emoji:"🎨",cat:"puzzle",tags:["Puzzle","Art"],url:"/paint-splash/",desc:"Swipe color blocks to create stunning abstract art! Match & splash paint!",status:"live"},
  {name:"Ocean Gem Pop",emoji:"🧜",cat:"puzzle",tags:["Bubble","Shooter"],url:"/ocean-gem-pop/",desc:"Shoot gem bubbles in the deep ocean! Match 3+ to pop. 10 levels of sparkling fun!",status:"live"},
  {name:"Phantom Blade",emoji:"🗡️",cat:"arcade",tags:["Arcade","Knife"],url:"/phantom-blade/",desc:"Throw glowing blades into a spinning rune disc. Dark neon aesthetics, 15 levels!",status:"live"},
  {name:"Sushi Stack",emoji:"🍣",cat:"puzzle",tags:["Sort","Puzzle"],url:"/sushi-stack/",desc:"Stack matching sushi rolls on chopsticks to clear the board! Japanese-themed 3D color sort puzzle!",isNew:true,status:"live"},
  {name:"Bolt Jam 3D",emoji:"🔩",cat:"puzzle",tags:["Puzzle","3D"],url:"/bolt-jam-3d/",desc:"Unscrew bolts and untangle rings in this mind-bending 3D screw puzzle game!",isNew:true,status:"live"},
  {name:"Brick Breaker",emoji:"🧱",cat:"arcade",tags:["Arcade","Classic"],url:"/brick-breaker/",desc:"Break all the bricks with your paddle! Classic breakout arcade action with power-ups!",status:"live"},
  {name:"Classic Snake",emoji:"🐍",cat:"arcade",tags:["Arcade","Retro"],url:"/snake/",desc:"Guide the snake to eat food and grow longer! The timeless retro arcade classic!",status:"live"},
  {name:"Chess",emoji:"♔",cat:"puzzle",tags:["Board","Strategy","Classic"],url:"/chess/",desc:"Classic chess against a friend on the same device! Full rules: castling, en passant, promotion, checkmate. No download needed.",status:"live"},
  {name:"Checkers",emoji:"⬤",cat:"puzzle",tags:["Board","Strategy","Classic","Draughts"],url:"/checkers/",desc:"Play Checkers online free! Classic American Draughts with AI opponent, mandatory captures, multi-jumps, king promotion. 3 difficulty levels!",isNew:true,status:"live"},
  {name:"Tetris",emoji:"🧱",cat:"puzzle",tags:["Puzzle","Block","Classic"],url:"/tetris/",desc:"Stack falling blocks and clear lines! Classic Tetris with neon cyberpunk style. Chase your high score!",isNew:true,status:"live"},
  {name:"Block Stacker",emoji:"📦",cat:"arcade",tags:["Arcade","Precision"],url:"/stacker/",desc:"Stack blocks with perfect precision! How high can you build before it topples?",status:"live"},
  {name:"Wood Block Puzzle",emoji:"🪵",cat:"puzzle",tags:["Puzzle","Block"],url:"/wood-block-puzzle/",desc:"Drag wooden blocks to fill rows and columns. A relaxing yet challenging puzzle!",isNew:true,status:"live"},
  {name:"Bounce Bot",emoji:"🤖",cat:"arcade",tags:["Arcade","Runner","Gravity"],url:"/bounce-bot/",desc:"Flip gravity to guide ZIP the robot through 30 levels of factory mayhem! One-tap runner!",isNew:true,status:"live"},
  {name:"Glyph Quest",emoji:"🏺",cat:"puzzle",tags:["Puzzle","Hexagon","Ancient"],url:"/glyph-quest/",desc:"Rotate hexagonal runes to connect ancient energy paths across 5 civilizations!",isNew:true,status:"live"},
  {name:"Abyss Chef",emoji:"🐙",cat:"idle",tags:["Idle","Fishing","Cooking"],url:"/abyss-chef/",desc:"Play as Ollie the octopus chef! Fish deep sea creatures, cook meals, and build your underwater restaurant!",isNew:true,status:"live"},
  {name:"Cloud & Sheep",emoji:"☁️",cat:"idle",tags:["Simulation","Care","Cute"],url:"/cloud-sheep/",desc:"Care for adorable sheep! Drag clouds to make rain, grow grass, and keep your fluffy flock happy!",isNew:true,status:"live"},
  {name:"Magic Sort",emoji:"🧪",cat:"puzzle",tags:["Puzzle","Sort","Water","Casual"],url:"/magic-sort/",desc:"Sort colored water into matching bottles! A relaxing color sorting puzzle with many levels.",isNew:true,status:"live"},
  {name:"T-Rex Dino Runner",emoji:"🦖",cat:"arcade",tags:["Arcade","Runner","Retro","Dinosaur"],url:"/t-rex/",desc:"The classic Chrome dinosaur game! Jump over cacti, dodge pterodactyls, beat your high score. No download needed!",isNew:false,status:"live"},
  {name:"Arrow Escape",emoji:"🚀",cat:"puzzle",tags:["Puzzle","Space","Logic","Arrow"],url:"/arrow-escape/",desc:"Launch spaceships in the right order! A cosmic logic puzzle with 20+ levels. Only ships with a clear flight path can escape!",isNew:true,status:"live"},
  {name:"Tile Dynasty",emoji:"🀄",cat:"puzzle",tags:["Puzzle","Mahjong","Tile","Matching","Strategy"],url:"/tile-dynasty/",desc:"Classic Mahjong Solitaire! Match free tiles to clear the board across 24 levels. Hint & shuffle included!",isNew:true,status:"live"},
  {name:"Bubble Pop",emoji:"🫧",cat:"puzzle",tags:["Puzzle","Bubble","Shooter","Arcade","Casual"],url:"/bubble-pop/",desc:"Aim and shoot colorful bubbles! Match 3+ to pop them and clear 25 levels of bubble-shooting fun!",isNew:true,status:"live"},
  {name:"Pixel Logic",emoji:"🧩",cat:"puzzle",tags:["Puzzle","Nonogram","Logic","Grid","Brain"],url:"/pixel-logic/",desc:"Solve Nonogram logic puzzles to reveal hidden pixel art! 30+ handcrafted puzzles in 3 difficulty levels.",isNew:true,status:"live"},
  {name:"Watermelon Merge",emoji:"🍉",cat:"puzzle",tags:["Puzzle","Merge","Physics","Fruit","Casual","Suika"],url:"/watermelon-merge/",desc:"Drop and merge fruits to grow a giant watermelon! A satisfying physics puzzle where matching fruits combine into bigger ones. Can you reach the watermelon?",isNew:true,status:"live"},
  {name:"Solitaire",emoji:"🃏",cat:"puzzle",tags:["card","classic","klondike"],url:"/solitaire/",desc:"Play free Klondike Solitaire online with undo, hints, scoring and smooth card animations. The classic card game — no download needed.",isNew:true,status:"live"},
  {name:"Triple Tile Match",emoji:"🧩",cat:"puzzle",tags:["Puzzle","Match-3","Tile","3D","Casual"],url:"/triple-tile/",desc:"Match 3 identical tiles in this addictive 3D puzzle! Tap tiles, fill the tray, clear matches before it fills up. 30 levels of layered tile fun!",isNew:true,status:"live"},
  {name:"Unblock Me",emoji:"🧱",cat:"puzzle",tags:["Puzzle","Sliding","Block","Logic","Brain","Classic"],url:"/unblock-me/",desc:"Slide blocks to free the red block in this classic sliding puzzle! 50 handcrafted levels, hints, undo, and 3-star ratings. No download needed.",isNew:true,status:"live"},
  {name:"Sand Balls",emoji:"🏐",cat:"puzzle",tags:["Puzzle","Physics","Digging","Ball","Casual","Satisfying"],url:"/sand-balls/",desc:"Dig through sand to guide colorful balls into matching containers! A satisfying physics puzzle with 20+ handcrafted levels, stars, and obstacles. Play free now!",isNew:true,status:"live"},
  {name:"Pipe Connect",emoji:"🔧",cat:"puzzle",tags:["Puzzle","Pipe","Logic","Rotate","Plumbing","Brain"],url:"/pipe-connect/",desc:"Rotate pipe pieces to connect water from source to drain! 50+ levels of logic puzzle fun with progressive difficulty, hints, and 3-star ratings. No download needed.",isNew:true,status:"live"},
  {name:"Hex Block Puzzle",emoji:"⬡",cat:"puzzle",tags:["Puzzle","Hex","Block","Strategy","Brain","Casual"],url:"/hex-block/",desc:"Drag hex-shaped blocks onto the honeycomb grid and complete lines in 3 directions to clear them! An addictive hexagonal block puzzle with combo bonuses and satisfying effects. Play free now!",isNew:true,status:"live"},
  {name:"Fill The Fridge",emoji:"🧊",cat:"puzzle",tags:["Puzzle","Organize","Drag","Fit","Casual","Brain"],url:"/fill-fridge/",desc:"Drag groceries into the fridge and fit everything perfectly! A satisfying organizing puzzle with 20 levels, undo, hints, and shuffle. No download needed!",isNew:true,status:"live"},
  {name:"Little Alchemy",emoji:"⚗️",cat:"puzzle",tags:["Puzzle","Alchemy","Combine","Craft","Discovery","Casual"],url:"/little-alchemy/",desc:"Combine Water, Fire, Earth and Air to discover 100+ elements! A relaxing alchemy crafting puzzle with drag-and-drop, hints, and satisfying discovery animations. Play free online!",isNew:true,status:"live"},
  {name:"The Impossible Quiz",emoji:"🧠",cat:"puzzle",tags:["Puzzle","Quiz","Brain","Trivia","Trick","Riddle","Humor","Casual"],url:"/impossible-quiz/",desc:"65 hilarious trick questions, riddles and brain teasers! The obvious answer is always wrong. 3 lives, bomb timers, skip power-ups, and outrageous humor. Can you beat them all?",isNew:true,status:"live"},
  {name:"Marble Run",emoji:"🔮",cat:"puzzle",tags:["Puzzle","Physics","Marble","Building","Track","Strategy","Casual","Simulation"],url:"/marble-run/",desc:"Build epic marble tracks with ramps, curves, trampolines and tubes! Place pieces on the grid, hit play, and watch your marble roll through physics-powered paths. 20 levels of creative puzzle fun!",isNew:true,status:"live"},
  {name:"Flow Connect",emoji:"🔗",cat:"puzzle",tags:["Puzzle","Flow","Connect","Dots","Logic","Brain","Casual"],url:"/flow-connect/",desc:"Connect matching colored dots by drawing paths! 100 levels across 5 difficulty packs from 5×5 to 9×9 grids. Hints, undo, daily puzzle. No download needed!",isNew:true,status:"live"},
  {name:"Wordscapes",emoji:"🌿",cat:"puzzle",tags:["Puzzle","Word","Crossword","Spelling","Brain","Casual"],url:"/wordscapes/",desc:"Swipe letters to find hidden words and fill the crossword! 30 levels across 6 themed packs — Forest, Ocean, Mountain, Desert, Arctic & Space. Hints, coins, and beautiful particle effects!",isNew:true,status:"live"},
  {name:"Jigsaw Puzzle",emoji:"🧩",cat:"puzzle",tags:["Puzzle","Jigsaw","Drag","Brain","Casual","Relaxing"],url:"/jigsaw-puzzle/",desc:"Solve beautiful jigsaw puzzles! 20 unique puzzles across 5 categories — Nature, Abstract, City, Art & Seasonal. Drag and drop pieces, use hints, earn stars. Procedurally generated art!",isNew:true,status:"live"},
  {name:"Nonogram Puzzle",emoji:"🔲",cat:"puzzle",tags:["Puzzle","Nonogram","Picross","Logic","Grid","Brain","Pixel Art"],url:"/nonogram/",desc:"Solve logic puzzles to reveal hidden pixel art! 30 handcrafted nonogram puzzles from 5×5 to 15×15. Fill cells using number clues, use marks to track empty cells. Hints, undo, error check, and 3-star ratings. No download needed!",isNew:true,status:"live"},
  {name:"Tangram Puzzle",emoji:"🔺",cat:"puzzle",tags:["Puzzle","Tangram","Shape","Geometry","Brain","Casual","Drag"],url:"/tangram/",desc:"Arrange 7 geometric tangram pieces to complete 30 silhouette puzzles! 5 difficulty tiers from simple shapes to complex figures. Drag, rotate, flip pieces. Hints, undo, achievements, star ratings, and progress saving!",isNew:true,status:"live"},
  {name:"Cut the Rope",emoji:"🍬",cat:"puzzle",tags:["Puzzle","Physics","Cut","Rope","Candy","Om Nom","Casual","Swipe","Brain"],url:"/cut-the-rope/",desc:"Swipe to cut ropes and feed candy to Om Nom! 25 handcrafted physics puzzle levels with Verlet rope physics, bumpers, and bubbles. Collect 3 stars per level. No download needed!",isNew:true,status:"live"},
  {name:"Pull the Pin",emoji:"📌",cat:"puzzle",tags:["Puzzle","Physics","Pin","Ball","Color","Casual","Brain","Strategy"],url:"/pull-the-pin/",desc:"Pull pins to guide balls into the bucket! 30 handcrafted physics puzzle levels with color mixing, bombs, and gravity. Gray balls need color to count — route them through colored ones. 3-star ratings, progress saving, and satisfying particle effects. No download needed!",isNew:true,status:"live"},
  {name:"Parking Jam",emoji:"🚗",cat:"puzzle",tags:["Puzzle","Parking","Car","Unblock","Logic","Brain","Casual"],url:"/parking-jam/",desc:"Unblock cars and clear the parking lot! 30 handcrafted levels with smooth slide mechanics, 3-star ratings, hints, undo, and progress saving. Think ahead to solve each traffic jam. No download needed!",isNew:true,status:"live"},
  {name:"SoliTen",emoji:"🔢",cat:"puzzle",tags:["Puzzle","Number","Sum","Math","Casual","Brain","Zen"],url:"/soliten/",desc:"Tap numbered cards that sum to exactly 10 to clear them from the board! 30 handcrafted levels with progressive difficulty, combo scoring, 3-star ratings, and power-ups (hint, shuffle, undo). A zen-inspired number puzzle that trains your math skills. No download needed!",isNew:true,status:"live"},
  {name:"Brain Out",emoji:"🧠",cat:"puzzle",tags:["Puzzle","Brain","Trick","Lateral Thinking","IQ","Casual","Riddle"],url:"/brain-out/",desc:"30 mind-bending levels that test your IQ with creative lateral thinking puzzles! The obvious answer is usually wrong. Drag, tap, and think outside the box. Hints, stars, progress saving. No download needed!",isNew:true,status:"live"},
  {name:"Mahjong Solitaire",emoji:"🀄",cat:"puzzle",tags:["Mahjong","Tile","Matching","Solitaire","Classic","Relaxing","Casual"],url:"/mahjong-solitaire/",desc:"Play Mahjong Solitaire online free! Classic tile-matching puzzle with 20 levels, 10 unique layouts, traditional 144-tile set. Hints, shuffles, undo, scoring, star ratings. No download!",isNew:true,status:"live"},
  {name:"Bubble Shooter",emoji:"🫧",cat:"puzzle",tags:["Puzzle","Bubble","Shooter","Arcade","Casual","Match-3"],url:"/bubble-shooter/",desc:"Aim and shoot bubbles to match 3+ and pop them! Classic bubble shooter with 30 levels, wall bouncing, score combos, power-ups, and progressive difficulty. No download needed!",isNew:true,status:"live"},
  {name:"Tic Tac Toe",emoji:"⭕",cat:"puzzle",tags:["Puzzle","Strategy","Board Game","Classic","2-Player","AI","XO","Noughts","Crosses"],url:"/tic-tac-toe/",desc:"Play Tic Tac Toe online free! Challenge AI in Easy, Medium, or Hard mode with minimax algorithm. Play with friends locally or watch AI vs AI battles. Win streaks, stats tracking, and neon visuals. No download needed!",isNew:true,status:"live"},
];

/**
 * Get effective game status (checks localStorage overrides from admin panel)
 */
function getGameStatus(game) {
  const overrides = JSON.parse(localStorage.getItem('gz_status_overrides') || '{}');
  return overrides[game.url] || game.status || 'live';
}

/**
 * Get games filtered by status
 */
function getGamesByStatus(status) {
  return GAMES.filter(g => getGameStatus(g) === status);
}

/**
 * Get all games with effective statuses
 */
function getAllGames() {
  return GAMES.map(g => ({...g, status: getGameStatus(g)}));
}
