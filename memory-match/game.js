// 🧠 记忆大师 - Memory Match Game
(function() {
'use strict';

const canvas = document.getElementById('c');
const ctx = canvas.getContext('2d');
let W, H, dpr;

// ========== CONFIG ==========
// Animal image assets
const ANIMAL_NAMES = ['bear','buffalo','chicken','chick','cow','crocodile','dog','duck','elephant','frog','giraffe','goat','gorilla','hippo','horse','monkey','moose','narwhal','owl','panda','penguin','pig','rabbit','rhino','sloth','snake','walrus','whale','zebra'];
const animalImages = {};
let imagesLoaded = 0;
const cardBackImg = new Image();
cardBackImg.src = 'images/card_back.png';
const panelImg = new Image();
panelImg.src = 'images/panel.png';
ANIMAL_NAMES.forEach(name => {
  const img = new Image();
  img.src = 'images/' + name + '.png';
  img.onload = () => imagesLoaded++;
  animalImages[name] = img;
});

const THEMES = {
  '🐱动物': ANIMAL_NAMES.slice(0, 15),
  '🍎水果': ['🍎','🍊','🍋','🍇','🍓','🍑','🍒','🍌','🥝','🍍','🍉','🫐','🥭','🍈','🍐'],
  '🌍国旗': ['🇨🇳','🇺🇸','🇯🇵','🇬🇧','🇫🇷','🇩🇪','🇰🇷','🇧🇷','🇮🇳','🇨🇦','🇦🇺','🇮🇹','🇪🇸','🇷🇺','🇲🇽'],
  '😀表情': ['😀','😂','🥰','😎','🤩','😴','🤔','😱','🥳','🤪','😈','👻','💀','🤖','👽']
};
const THEME_KEYS = Object.keys(THEMES);
const DIFFICULTIES = [
  { name: '简单', cols: 4, rows: 3, pairs: 6 },
  { name: '普通', cols: 4, rows: 4, pairs: 8 },
  { name: '困难', cols: 5, rows: 4, pairs: 10 },
  { name: '地狱', cols: 6, rows: 5, pairs: 15 }
];

// ========== STATE ==========
let state = 'menu'; // menu, playing, complete
let currentTheme = 0;
let currentDiff = 0;
let cards = [];
let flipped = [];
let matched = [];
let steps = 0;
let startTime = 0;
let elapsed = 0;
let lockInput = false;
let peekTimer = 0;
let particles = [];
let animatingCards = []; // {index, progress, direction: 'flip'|'unflip', startTime}
let shakeCards = []; // {index, startTime}
let disappearCards = []; // {index, startTime}
let bestScores = JSON.parse(localStorage.getItem('mm_best') || '{}');
let stars = 0;
let menuHover = -1;

// ========== WEB AUDIO ==========
let audioCtx;
function getAC(){if(!audioCtx)audioCtx=new(window.AudioContext||window.webkitAudioContext)();return audioCtx;}
function playFlipSound(){
  try{const ac=getAC();const o=ac.createOscillator();const g=ac.createGain();
  o.connect(g);g.connect(ac.destination);o.type='sine';o.frequency.value=800;
  g.gain.setValueAtTime(0.15,ac.currentTime);g.gain.exponentialRampToValueAtTime(0.01,ac.currentTime+0.08);
  o.start(ac.currentTime);o.stop(ac.currentTime+0.08);}catch(e){}
}
function playMatchSound(){
  try{const ac=getAC();
  [523,659,784].forEach((f,i)=>{const o=ac.createOscillator();const g=ac.createGain();
  o.connect(g);g.connect(ac.destination);o.type='triangle';o.frequency.value=f;
  g.gain.setValueAtTime(0.2,ac.currentTime+i*0.08);g.gain.exponentialRampToValueAtTime(0.01,ac.currentTime+i*0.08+0.2);
  o.start(ac.currentTime+i*0.08);o.stop(ac.currentTime+i*0.08+0.2);});}catch(e){}
}
function playFailSound(){
  try{const ac=getAC();const o=ac.createOscillator();const g=ac.createGain();
  o.connect(g);g.connect(ac.destination);o.type='square';o.frequency.setValueAtTime(300,ac.currentTime);
  o.frequency.exponentialRampToValueAtTime(200,ac.currentTime+0.15);
  g.gain.setValueAtTime(0.1,ac.currentTime);g.gain.exponentialRampToValueAtTime(0.01,ac.currentTime+0.15);
  o.start(ac.currentTime);o.stop(ac.currentTime+0.15);}catch(e){}
}

// ========== RESIZE ==========
function resize() {
  dpr = window.devicePixelRatio || 1;
  W = window.innerWidth;
  H = window.innerHeight;
  canvas.width = W * dpr;
  canvas.height = H * dpr;
  canvas.style.width = W + 'px';
  canvas.style.height = H + 'px';
  ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
}
window.addEventListener('resize', resize);
resize();

// ========== UTILS ==========
function shuffle(arr) {
  for (let i = arr.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [arr[i], arr[j]] = [arr[j], arr[i]];
  }
  return arr;
}

function formatTime(s) {
  const m = Math.floor(s / 60);
  const sec = Math.floor(s % 60);
  return m + ':' + (sec < 10 ? '0' : '') + sec;
}

// ========== CARD LAYOUT ==========
function getCardLayout() {
  const diff = DIFFICULTIES[currentDiff];
  const topBar = 60;
  const bottomBar = 70;
  const playH = H - topBar - bottomBar;
  const playW = W;
  const gap = 8;
  const cardW = Math.min(90, (playW - gap * (diff.cols + 1)) / diff.cols);
  const cardH = Math.min(120, (playH - gap * (diff.rows + 1)) / diff.rows);
  const totalW = diff.cols * cardW + (diff.cols - 1) * gap;
  const totalH = diff.rows * cardH + (diff.rows - 1) * gap;
  const startX = (playW - totalW) / 2;
  const startY = topBar + (playH - totalH) / 2;
  return { cardW, cardH, startX, startY, gap, cols: diff.cols, rows: diff.rows, topBar, bottomBar };
}

function getCardRect(index) {
  const layout = getCardLayout();
  const col = index % layout.cols;
  const row = Math.floor(index / layout.cols);
  const x = layout.startX + col * (layout.cardW + layout.gap);
  const y = layout.startY + row * (layout.cardH + layout.gap);
  return { x, y, w: layout.cardW, h: layout.cardH };
}

// ========== GAME INIT ==========
function startGame() {
  const diff = DIFFICULTIES[currentDiff];
  const theme = THEMES[THEME_KEYS[currentTheme]];
  const selected = shuffle([...theme]).slice(0, diff.pairs);
  const deck = shuffle([...selected, ...selected]);
  cards = deck.map((emoji, i) => ({ emoji, index: i }));
  flipped = [];
  matched = [];
  steps = 0;
  elapsed = 0;
  lockInput = true;
  particles = [];
  animatingCards = [];
  shakeCards = [];
  disappearCards = [];
  state = 'playing';
  
  // Peek: show all cards for 2 seconds
  peekTimer = performance.now();
  setTimeout(() => {
    lockInput = false;
    peekTimer = 0;
    startTime = performance.now();
  }, 2000);
}

// ========== DRAWING ==========
function drawRoundRect(x, y, w, h, r) {
  ctx.beginPath();
  ctx.moveTo(x + r, y);
  ctx.lineTo(x + w - r, y);
  ctx.quadraticCurveTo(x + w, y, x + w, y + r);
  ctx.lineTo(x + w, y + h - r);
  ctx.quadraticCurveTo(x + w, y + h, x + w - r, y + h);
  ctx.lineTo(x + r, y + h);
  ctx.quadraticCurveTo(x, y + h, x, y + h - r);
  ctx.lineTo(x, y + r);
  ctx.quadraticCurveTo(x, y, x + r, y);
  ctx.closePath();
}

function drawCard(index, now) {
  if (matched.includes(index)) {
    // Check disappear animation
    const da = disappearCards.find(d => d.index === index);
    if (da) {
      const p = Math.min(1, (now - da.startTime) / 400);
      if (p >= 1) return; // fully gone
      const rect = getCardRect(index);
      const scale = 1 - p;
      ctx.save();
      ctx.globalAlpha = 1 - p;
      ctx.translate(rect.x + rect.w/2, rect.y + rect.h/2);
      ctx.scale(scale, scale);
      drawRoundRect(-rect.w/2, -rect.h/2, rect.w, rect.h, 8);
      ctx.fillStyle = '#fff';
      ctx.fill();
      ctx.font = Math.min(rect.w, rect.h) * 0.5 + 'px serif';
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.fillText(cards[index].emoji, 0, 0);
      ctx.restore();
    }
    return;
  }

  const rect = getCardRect(index);
  const isFaceUp = peekTimer > 0 || flipped.includes(index);
  
  // Check flip animation
  const anim = animatingCards.find(a => a.index === index);
  let scaleX = 1;
  let animFaceUp = isFaceUp;
  
  if (anim) {
    const p = Math.min(1, (now - anim.startTime) / 400);
    if (p < 0.5) {
      scaleX = 1 - p * 2; // shrink to 0
    } else {
      scaleX = (p - 0.5) * 2; // grow back
      animFaceUp = anim.direction === 'flip';
    }
    if (p >= 1) {
      animatingCards.splice(animatingCards.indexOf(anim), 1);
    }
  }

  // Check shake
  const sk = shakeCards.find(s => s.index === index);
  let shakeX = 0;
  if (sk) {
    const p = Math.min(1, (now - sk.startTime) / 300);
    shakeX = Math.sin(p * Math.PI * 4) * 5 * (1 - p);
    if (p >= 1) shakeCards.splice(shakeCards.indexOf(sk), 1);
  }

  ctx.save();
  ctx.translate(rect.x + rect.w/2 + shakeX, rect.y + rect.h/2);
  ctx.scale(scaleX, 1);
  
  drawRoundRect(-rect.w/2, -rect.h/2, rect.w, rect.h, 8);
  
  if (animFaceUp) {
    // Face up - white card with emoji or animal image
    ctx.fillStyle = '#fff';
    ctx.fill();
    ctx.strokeStyle = '#ddd';
    ctx.lineWidth = 1;
    ctx.stroke();
    const emoji = cards[index].emoji;
    // Check if it's an animal name (string without emoji)
    if (animalImages[emoji] && animalImages[emoji].complete) {
      const imgSize = Math.min(rect.w, rect.h) * 0.7;
      ctx.drawImage(animalImages[emoji], -imgSize/2, -imgSize/2 + 2, imgSize, imgSize);
    } else {
      ctx.font = Math.min(rect.w, rect.h) * 0.5 + 'px serif';
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.fillText(emoji, 0, 4);
    }
  } else {
    // Face down - textured card with panel image
    if (cardBackImg.complete) {
      drawRoundRect(-rect.w/2, -rect.h/2, rect.w, rect.h, 8);
      ctx.save();
      ctx.clip();
      ctx.drawImage(cardBackImg, -rect.w/2, -rect.h/2, rect.w, rect.h);
      ctx.restore();
      // Overlay gradient for depth
      const grd = ctx.createLinearGradient(-rect.w/2, -rect.h/2, rect.w/2, rect.h/2);
      grd.addColorStop(0, 'rgba(100,40,40,0.3)');
      grd.addColorStop(1, 'rgba(60,20,20,0.5)');
      drawRoundRect(-rect.w/2, -rect.h/2, rect.w, rect.h, 8);
      ctx.fillStyle = grd;
      ctx.fill();
    } else {
      const grd = ctx.createLinearGradient(-rect.w/2, -rect.h/2, rect.w/2, rect.h/2);
      grd.addColorStop(0, '#2d3436');
      grd.addColorStop(1, '#636e72');
      ctx.fillStyle = grd;
      ctx.fill();
    }
    ctx.strokeStyle = '#555';
    ctx.lineWidth = 1;
    ctx.stroke();
    if(scaleX>0.3){
      ctx.font = Math.min(rect.w, rect.h) * 0.4 + 'px serif';
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.fillStyle = '#aaa';
      ctx.fillText('❓', 0, 2);
    }
  }
  
  ctx.restore();
}

function drawParticles(now) {
  particles = particles.filter(p => {
    const age = (now - p.born) / 1000;
    if (age > 1) return false;
    const alpha = 1 - age;
    ctx.save();
    ctx.globalAlpha = alpha;
    ctx.font = (p.size * (1 - age * 0.5)) + 'px serif';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText(p.char, p.x + p.vx * age * 60, p.y + p.vy * age * 60 - age * 30);
    ctx.restore();
    return true;
  });
}

function spawnParticles(x, y) {
  const chars = ['✨','⭐','💫','🌟','✨'];
  for (let i = 0; i < 8; i++) {
    const angle = (Math.PI * 2 * i) / 8;
    particles.push({
      x, y,
      vx: Math.cos(angle) * (1.5 + Math.random()),
      vy: Math.sin(angle) * (1.5 + Math.random()),
      char: chars[Math.floor(Math.random() * chars.length)],
      size: 14 + Math.random() * 10,
      born: performance.now()
    });
  }
}

function drawBackground() {
  const grd = ctx.createLinearGradient(0, 0, W, H);
  grd.addColorStop(0, '#8b0000');
  grd.addColorStop(0.5, '#660000');
  grd.addColorStop(1, '#4a0000');
  ctx.fillStyle = grd;
  ctx.fillRect(0, 0, W, H);
  // Panel texture overlay
  if (panelImg.complete) {
    ctx.globalAlpha = 0.08;
    for (let x = 0; x < W; x += 256) {
      for (let y = 0; y < H; y += 256) {
        ctx.drawImage(panelImg, x, y, 256, 256);
      }
    }
    ctx.globalAlpha = 1;
  }
  // Gold spotlight accents
  ctx.globalAlpha = 0.06;
  ctx.fillStyle = '#ffd700';
  ctx.beginPath(); ctx.arc(W * 0.2, H * 0.3, 180, 0, Math.PI * 2); ctx.fill();
  ctx.beginPath(); ctx.arc(W * 0.8, H * 0.5, 150, 0, Math.PI * 2); ctx.fill();
  ctx.globalAlpha = 1;
}

function drawHUD(now) {
  if (state !== 'playing') return;
  const diff = DIFFICULTIES[currentDiff];
  if (!lockInput || peekTimer === 0) {
    elapsed = (now - startTime) / 1000;
  }
  
  // Top bar
  ctx.fillStyle = 'rgba(0,0,0,0.3)';
  ctx.fillRect(0, 0, W, 50);
  
  ctx.fillStyle = '#fff';
  ctx.font = 'bold 18px sans-serif';
  ctx.textAlign = 'left';
  ctx.textBaseline = 'middle';
  ctx.fillText(diff.name + ' ' + THEME_KEYS[currentTheme], 12, 25);
  
  ctx.textAlign = 'center';
  ctx.fillText('步数: ' + steps, W/2, 25);
  
  ctx.textAlign = 'right';
  ctx.fillText('⏱ ' + formatTime(elapsed), W - 12, 25);
  
  // Bottom bar
  ctx.fillStyle = 'rgba(0,0,0,0.3)';
  ctx.fillRect(0, H - 55, W, 55);
  
  // Theme button
  ctx.fillStyle = '#fff';
  ctx.font = '14px sans-serif';
  ctx.textAlign = 'center';
  ctx.fillText('主题: ' + THEME_KEYS[currentTheme], W/4, H - 28);
  ctx.fillText('🏠 菜单', W * 3/4, H - 28);
}

function drawMenu(now) {
  drawBackground();
  
  // Title
  ctx.fillStyle = '#fff';
  ctx.font = 'bold 42px sans-serif';
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.fillText('🧠 记忆大师', W/2, H * 0.12);
  
  ctx.font = '16px sans-serif';
  ctx.fillStyle = 'rgba(255,255,255,0.7)';
  ctx.fillText('翻牌配对记忆游戏', W/2, H * 0.18);
  
  // Difficulty buttons
  const btnW = Math.min(220, W * 0.6);
  const btnH = 48;
  const startY = H * 0.25;
  const gap = 12;
  
  ctx.font = 'bold 18px sans-serif';
  DIFFICULTIES.forEach((d, i) => {
    const y = startY + i * (btnH + gap);
    const x = (W - btnW) / 2;
    
    drawRoundRect(x, y, btnW, btnH, 12);
    if (i === currentDiff) {
      ctx.fillStyle = 'rgba(255,255,255,0.95)';
      ctx.fill();
      ctx.fillStyle = '#764ba2';
    } else {
      ctx.fillStyle = 'rgba(255,255,255,0.2)';
      ctx.fill();
      ctx.strokeStyle = 'rgba(255,255,255,0.4)';
      ctx.lineWidth = 1;
      ctx.stroke();
      ctx.fillStyle = '#fff';
    }
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText(d.name + ' (' + d.cols + '×' + d.rows + ')', W/2, y + btnH/2);
    
    // Best score
    const key = currentTheme + '_' + i;
    if (bestScores[key]) {
      ctx.font = '12px sans-serif';
      ctx.fillStyle = i === currentDiff ? '#999' : 'rgba(255,255,255,0.6)';
      ctx.fillText('最佳: ' + bestScores[key].steps + '步 ' + formatTime(bestScores[key].time), W/2, y + btnH/2 + 18);
      ctx.font = 'bold 18px sans-serif';
    }
  });
  
  // Theme selector
  const themeY = startY + 4 * (btnH + gap) + 20;
  ctx.font = 'bold 16px sans-serif';
  ctx.fillStyle = '#fff';
  ctx.textAlign = 'center';
  ctx.fillText('选择主题', W/2, themeY);
  
  const tBtnW = Math.min(100, (W - 40) / 4 - 8);
  const tStartX = (W - (tBtnW * 4 + 24)) / 2;
  const tBtnH = 42;
  
  THEME_KEYS.forEach((t, i) => {
    const x = tStartX + i * (tBtnW + 8);
    const y = themeY + 16;
    drawRoundRect(x, y, tBtnW, tBtnH, 8);
    if (i === currentTheme) {
      ctx.fillStyle = 'rgba(255,255,255,0.9)';
      ctx.fill();
      ctx.fillStyle = '#764ba2';
    } else {
      ctx.fillStyle = 'rgba(255,255,255,0.15)';
      ctx.fill();
      ctx.fillStyle = '#fff';
    }
    ctx.font = '14px sans-serif';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText(t, x + tBtnW/2, y + tBtnH/2);
  });
  
  // Start button
  const startBtnY = themeY + 80;
  const startBtnW = Math.min(200, W * 0.5);
  const startBtnX = (W - startBtnW) / 2;
  drawRoundRect(startBtnX, startBtnY, startBtnW, 54, 27);
  ctx.fillStyle = '#ff6b6b';
  ctx.fill();
  ctx.fillStyle = '#fff';
  ctx.font = 'bold 22px sans-serif';
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.fillText('开始游戏 🎮', W/2, startBtnY + 27);
  
  // Store button rects for click handling
  window._menuBtns = {
    diffs: DIFFICULTIES.map((d, i) => ({ x: (W - btnW)/2, y: startY + i*(btnH+gap), w: btnW, h: btnH, i })),
    themes: THEME_KEYS.map((t, i) => ({ x: tStartX + i*(tBtnW+8), y: themeY+16, w: tBtnW, h: tBtnH, i })),
    start: { x: startBtnX, y: startBtnY, w: startBtnW, h: 54 }
  };
}

function drawComplete(now) {
  // Overlay
  ctx.fillStyle = 'rgba(0,0,0,0.6)';
  ctx.fillRect(0, 0, W, H);
  
  const boxW = Math.min(300, W * 0.8);
  const boxH = 320;
  const boxX = (W - boxW) / 2;
  const boxY = (H - boxH) / 2;
  
  drawRoundRect(boxX, boxY, boxW, boxH, 16);
  ctx.fillStyle = '#fff';
  ctx.fill();
  
  ctx.fillStyle = '#333';
  ctx.font = 'bold 28px sans-serif';
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.fillText('🎉 完成！', W/2, boxY + 40);
  
  // Stars
  const starStr = '⭐'.repeat(stars) + '☆'.repeat(3 - stars);
  ctx.font = '36px sans-serif';
  ctx.fillText(starStr, W/2, boxY + 85);
  
  // Stats
  ctx.font = '18px sans-serif';
  ctx.fillStyle = '#666';
  ctx.fillText('步数: ' + steps, W/2, boxY + 130);
  ctx.fillText('用时: ' + formatTime(elapsed), W/2, boxY + 158);
  
  const diff = DIFFICULTIES[currentDiff];
  const key = currentTheme + '_' + currentDiff;
  if (bestScores[key]) {
    ctx.font = '14px sans-serif';
    ctx.fillStyle = '#999';
    ctx.fillText('最佳: ' + bestScores[key].steps + '步 ' + formatTime(bestScores[key].time), W/2, boxY + 185);
  }
  
  // Buttons
  const btnW = (boxW - 40) / 2;
  const btnH = 44;
  const btnY = boxY + boxH - 70;
  
  // Replay
  drawRoundRect(boxX + 12, btnY, btnW, btnH, 10);
  ctx.fillStyle = '#667eea';
  ctx.fill();
  ctx.fillStyle = '#fff';
  ctx.font = 'bold 16px sans-serif';
  ctx.fillText('🔄 重玩', boxX + 12 + btnW/2, btnY + btnH/2);
  
  // Next / Menu
  drawRoundRect(boxX + boxW - 12 - btnW, btnY, btnW, btnH, 10);
  ctx.fillStyle = '#ff6b6b';
  ctx.fill();
  ctx.fillStyle = '#fff';
  if (currentDiff < DIFFICULTIES.length - 1) {
    ctx.fillText('下一关 ▶', boxX + boxW - 12 - btnW/2, btnY + btnH/2);
  } else {
    ctx.fillText('🏠 菜单', boxX + boxW - 12 - btnW/2, btnY + btnH/2);
  }
  
  window._completeBtns = {
    replay: { x: boxX+12, y: btnY, w: btnW, h: btnH },
    next: { x: boxX + boxW - 12 - btnW, y: btnY, w: btnW, h: btnH },
    boxW, boxH, boxX, boxY
  };
}

// ========== MAIN LOOP ==========
function frame(now) {
  drawBackground();
  
  if (state === 'menu') {
    drawMenu(now);
  } else if (state === 'playing') {
    // Draw cards
    const diff = DIFFICULTIES[currentDiff];
    const total = diff.cols * diff.rows;
    for (let i = 0; i < total; i++) {
      drawCard(i, now);
    }
    drawParticles(now);
    drawHUD(now);
    
    // Peek text
    if (peekTimer > 0) {
      ctx.fillStyle = 'rgba(0,0,0,0.5)';
      ctx.font = 'bold 24px sans-serif';
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      const remaining = Math.max(0, 2 - (now - peekTimer) / 1000);
      ctx.fillStyle = '#fff';
      ctx.fillText('记住它们！ ' + remaining.toFixed(1) + 's', W/2, H - 80);
    }
  } else if (state === 'complete') {
    // Draw cards underneath
    const diff = DIFFICULTIES[currentDiff];
    for (let i = 0; i < diff.cols * diff.rows; i++) drawCard(i, now);
    drawHUD(now);
    drawComplete(now);
  }
  
  requestAnimationFrame(frame);
}

// ========== INPUT ==========
function hitTest(x, y) {
  const diff = DIFFICULTIES[currentDiff];
  for (let i = 0; i < diff.cols * diff.rows; i++) {
    const r = getCardRect(i);
    if (x >= r.x && x <= r.x + r.w && y >= r.y && y <= r.y + r.h) return i;
  }
  return -1;
}

function inRect(x, y, r) {
  return x >= r.x && x <= r.x + r.w && y >= r.y && y <= r.y + r.h;
}

function handleClick(px, py) {
  if (state === 'menu') {
    const b = window._menuBtns;
    if (!b) return;
    for (const d of b.diffs) {
      if (inRect(px, py, d)) { currentDiff = d.i; return; }
    }
    for (const t of b.themes) {
      if (inRect(px, py, t)) { currentTheme = t.i; return; }
    }
    if (inRect(px, py, b.start)) { startGame(); return; }
  } else if (state === 'playing') {
    // Bottom bar buttons
    if (py > H - 55) {
      if (px < W/2) {
        // Cycle theme
        currentTheme = (currentTheme + 1) % THEME_KEYS.length;
        startGame();
        return;
      } else {
        state = 'menu';
        return;
      }
    }
    
    if (lockInput) return;
    const idx = hitTest(px, py);
    if (idx < 0 || matched.includes(idx) || flipped.includes(idx)) return;
    
    // Flip card
    flipped.push(idx);
    animatingCards.push({ index: idx, startTime: performance.now(), direction: 'flip' });
    playFlipSound();
    
    if (flipped.length === 2) {
      steps++;
      lockInput = true;
      const [a, b] = flipped;
      
      if (cards[a].emoji === cards[b].emoji) {
        // Match!
        playMatchSound();
        setTimeout(() => {
          matched.push(a, b);
          disappearCards.push({ index: a, startTime: performance.now() });
          disappearCards.push({ index: b, startTime: performance.now() });
          const ra = getCardRect(a);
          const rb = getCardRect(b);
          spawnParticles(ra.x + ra.w/2, ra.y + ra.h/2);
          spawnParticles(rb.x + rb.w/2, rb.y + rb.h/2);
          flipped = [];
          lockInput = false;
          
          // Check win
          if (matched.length === DIFFICULTIES[currentDiff].pairs * 2) {
            setTimeout(() => {
              const pairs = DIFFICULTIES[currentDiff].pairs;
              if (steps <= pairs) stars = 3;
              else if (steps <= pairs * 1.5) stars = 2;
              else stars = 1;
              
              const key = currentTheme + '_' + currentDiff;
              if (!bestScores[key] || steps < bestScores[key].steps) {
                bestScores[key] = { steps, time: elapsed };
                localStorage.setItem('mm_best', JSON.stringify(bestScores));
              }
              state = 'complete';
            }, 500);
          }
        }, 500);
      } else {
        // No match
        playFailSound();
        setTimeout(() => {
          shakeCards.push({ index: a, startTime: performance.now() });
          shakeCards.push({ index: b, startTime: performance.now() });
          setTimeout(() => {
            animatingCards.push({ index: a, startTime: performance.now(), direction: 'unflip' });
            animatingCards.push({ index: b, startTime: performance.now(), direction: 'unflip' });
            flipped = [];
            lockInput = false;
          }, 350);
        }, 600);
      }
    }
  } else if (state === 'complete') {
    const b = window._completeBtns;
    if (!b) return;
    if (inRect(px, py, b.replay)) { startGame(); return; }
    if (inRect(px, py, b.next)) {
      if (currentDiff < DIFFICULTIES.length - 1) {
        currentDiff++;
        startGame();
      } else {
        state = 'menu';
      }
    }
  }
}

function getPos(e) {
  if (e.touches) return { x: e.touches[0].clientX, y: e.touches[0].clientY };
  return { x: e.clientX, y: e.clientY };
}

canvas.addEventListener('click', e => {
  const p = getPos(e);
  handleClick(p.x, p.y);
});
canvas.addEventListener('touchstart', e => {
  e.preventDefault();
  const p = getPos(e);
  handleClick(p.x, p.y);
}, { passive: false });

// ========== START ==========
requestAnimationFrame(frame);

})();
