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
  {name:"Fruit Slash",emoji:"🍉",cat:"arcade",tags:["Arcade","Swipe","Fruit"],url:"/fruit-slash/",desc:"Swipe to slice fruits! Cut fast, combo big, dodge bombs. 60 seconds of juicy action!",isNew:true,status:"beta"},
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
  {name:"Chess",emoji:"♔",cat:"puzzle",tags:["Board","Strategy","Classic"],url:"/chess/",desc:"Classic chess against a friend on the same device! Full rules: castling, en passant, promotion, checkmate. No download needed.",isNew:true,status:"live"},
  {name:"Tetris",emoji:"🧱",cat:"puzzle",tags:["Puzzle","Block","Classic"],url:"/tetris/",desc:"Stack falling blocks and clear lines! Classic Tetris with neon cyberpunk style. Chase your high score!",isNew:true,status:"live"},
  {name:"Block Stacker",emoji:"📦",cat:"arcade",tags:["Arcade","Precision"],url:"/stacker/",desc:"Stack blocks with perfect precision! How high can you build before it topples?",status:"live"},
  {name:"Wood Block Puzzle",emoji:"🪵",cat:"puzzle",tags:["Puzzle","Block"],url:"/wood-block-puzzle/",desc:"Drag wooden blocks to fill rows and columns. A relaxing yet challenging puzzle!",isNew:true,status:"live"},
  {name:"Bounce Bot",emoji:"🤖",cat:"arcade",tags:["Arcade","Runner","Gravity"],url:"/bounce-bot/",desc:"Flip gravity to guide ZIP the robot through 30 levels of factory mayhem! One-tap runner!",isNew:true,status:"live"},
  {name:"Glyph Quest",emoji:"🏺",cat:"puzzle",tags:["Puzzle","Hexagon","Ancient"],url:"/glyph-quest/",desc:"Rotate hexagonal runes to connect ancient energy paths across 5 civilizations!",isNew:true,status:"live"},
  {name:"Abyss Chef",emoji:"🐙",cat:"idle",tags:["Idle","Fishing","Cooking"],url:"/abyss-chef/",desc:"Play as Ollie the octopus chef! Fish deep sea creatures, cook meals, and build your underwater restaurant!",isNew:true,status:"live"},
  {name:"Cloud & Sheep",emoji:"☁️",cat:"idle",tags:["Simulation","Care","Cute"],url:"/cloud-sheep/",desc:"Care for adorable sheep! Drag clouds to make rain, grow grass, and keep your fluffy flock happy!",isNew:true,status:"live"},
  {name:"Magic Sort",emoji:"🧪",cat:"puzzle",tags:["Puzzle","Sort","Water","Casual"],url:"/magic-sort/",desc:"Sort colored water into matching bottles! A relaxing color sorting puzzle with many levels.",isNew:true,status:"live"}
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
