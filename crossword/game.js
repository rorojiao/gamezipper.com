// Crossword Puzzle — Game Logic
// All puzzles: gridSize, words[{id,dir,row,col,answer,clue,num}]

const PUZZLES = [
  {
    title: "Getting Started",
    difficulty: "easy",
    rows: 5, cols: 5,
    words: [
      {id:'a1',dir:'across',row:0,col:0,answer:'HELLO',clue:'A common greeting (5)',num:1},
      {id:'a2',dir:'across',row:2,col:1,answer:'MIND',clue:'The brain, thoughts (4)',num:2},
      {id:'a3',dir:'across',row:4,col:0,answer:'YOUNG',clue:'Not old (5)',num:3},
      {id:'d1',dir:'down',row:0,col:0,answer:'HAPPY',clue:'Feeling joy (5)',num:1},
      {id:'d2',dir:'down',row:0,col:1,answer:'ELM',clue:'A type of tree (3)',num:2},
      {id:'d3',dir:'down',row:0,col:2,answer:'LOUD',clue:'High volume (4)',num:4},
      {id:'d4',dir:'down',row:0,col:3,answer:'OPEN',clue:'Not closed (4)',num:5},
    ]
  },
  {
    title: "Animal Friends",
    difficulty: "easy",
    rows: 5, cols: 5,
    words: [
      {id:'a1',dir:'across',row:0,col:0,answer:'MOUSE',clue:'A small rodent (5)',num:1},
      {id:'a2',dir:'across',row:2,col:0,answer:'FROG',clue:'Jumps in a pond (4)',num:2},
      {id:'a3',dir:'across',row:3,col:1,answer:'OWL',clue:'Night bird, hoots (3)',num:3},
      {id:'a4',dir:'across',row:4,col:0,answer:'ZEBRA',clue:'Black and white animal (5)',num:4},
      {id:'d1',dir:'down',row:0,col:0,answer:'MERRY',clue:'Full of joy (5)',num:1},
      {id:'d2',dir:'down',row:2,col:2,answer:'OGRE',clue:'A fairy tale monster (4)',num:5},
      {id:'d3',dir:'down',row:0,col:4,answer:'RAKE',clue:'Garden tool (4)',num:6},
    ]
  },
  {
    title: "Food & Drink",
    difficulty: "easy",
    rows: 5, cols: 6,
    words: [
      {id:'a1',dir:'across',row:0,col:0,answer:'PIZZA',clue:'Italian flatbread with toppings (5)',num:1},
      {id:'a2',dir:'across',row:1,col:1,answer:'COOK',clue:'Prepare food (4)',num:2},
      {id:'a3',dir:'across',row:2,col:0,answer:'SALAD',clue:'Cold vegetable mix (5)',num:3},
      {id:'a4',dir:'across',row:3,col:2,answer:'YUM',clue:'Tastes good! (3)',num:4},
      {id:'a5',dir:'across',row:4,col:0,answer:'FEAST',clue:'A big meal (5)',num:5},
      {id:'d1',dir:'down',row:0,col:0,answer:'PASTA',clue:'Italian carb dish (5)',num:1},
      {id:'d2',dir:'down',row:0,col:1,answer:'ICECREAM',clue:'Cold sweet treat (8)',num:6},
      {id:'d3',dir:'down',row:0,col:4,answer:'TEA',clue:'Hot leaf drink (3)',num:7},
    ]
  },
  {
    title: "Tech World",
    difficulty: "medium",
    rows: 7, cols: 7,
    words: [
      {id:'a1',dir:'across',row:0,col:0,answer:'COMPUTER',clue:'Electronic brain (8)',num:1},
      {id:'a2',dir:'across',row:2,col:0,answer:'APPLE',clue:'A fruit or a tech brand (5)',num:2},
      {id:'a3',dir:'across',row:4,col:1,answer:'LINUX',clue:'Open source OS (5)',num:3},
      {id:'a4',dir:'across',row:6,col:0,answer:'SCREEN',clue:'Monitor display (6)',num:4},
      {id:'d1',dir:'down',row:0,col:0,answer:'CABLES',clue:'Wires that connect devices (6)',num:1},
      {id:'d2',dir:'down',row:0,col:3,answer:'POINTER',clue:'Mouse cursor (7)',num:5},
      {id:'d3',dir:'down',row:0,col:6,answer:'NETWORK',clue:'Group of connected computers (7)',num:6},
    ]
  },
  {
    title: "Planet Earth",
    difficulty: "medium",
    rows: 7, cols: 7,
    words: [
      {id:'a1',dir:'across',row:0,col:0,answer:'PLANET',clue:'Celestial body like Earth (6)',num:1},
      {id:'a2',dir:'across',row:2,col:0,answer:'RIVER',clue:'Flowing body of water (5)',num:2},
      {id:'a3',dir:'across',row:4,col:0,answer:'OCEAN',clue:'Massive saltwater body (5)',num:3},
      {id:'a4',dir:'across',row:6,col:0,answer:'FOREST',clue:'Dense trees area (6)',num:4},
      {id:'d1',dir:'down',row:0,col:0,answer:'PRAISE',clue:'To speak highly of (6)',num:1},
      {id:'d2',dir:'down',row:0,col:3,answer:'TIGER',clue:'Striped big cat (5)',num:5},
      {id:'d3',dir:'down',row:0,col:5,answer:'NORTH',clue:'Compass direction (5)',num:6},
    ]
  },
  {
    title: "Science Lab",
    difficulty: "medium",
    rows: 8, cols: 8,
    words: [
      {id:'a1',dir:'across',row:0,col:0,answer:'SCIENTIST',clue:'Research professional (9)',num:1},
      {id:'a2',dir:'across',row:2,col:0,answer:'ENERGY',clue:'Power, vitality (6)',num:2},
      {id:'a3',dir:'across',row:4,col:1,answer:'ATOMS',clue:'Building blocks of matter (5)',num:3},
      {id:'a4',dir:'across',row:6,col:0,answer:'GRAVITY',clue:'What keeps us on Earth (7)',num:4},
      {id:'a5',dir:'across',row:7,col:0,answer:'SCALE',clue:'Measuring tool (5)',num:5},
      {id:'d1',dir:'down',row:0,col:0,answer:'SOLAR',clue:'Related to the sun (5)',num:1},
      {id:'d2',dir:'down',row:0,col:4,answer:'ELECTRON',clue:'Negative particle (8)',num:6},
      {id:'d3',dir:'down',row:0,col:7,answer:'GENOME',clue:'DNA set of an organism (6)',num:7},
    ]
  },
  {
    title: "History Class",
    difficulty: "hard",
    rows: 9, cols: 9,
    words: [
      {id:'a1',dir:'across',row:0,col:0,answer:'REVOLUTION',clue:'Dramatic political change (10)',num:1},
      {id:'a2',dir:'across',row:2,col:0,answer:'PYRAMID',clue:'Ancient Egyptian tomb (7)',num:2},
      {id:'a3',dir:'across',row:4,col:0,answer:'WARRIOR',clue:'Fighting hero (7)',num:3},
      {id:'a4',dir:'across',row:6,col:0,answer:'EMPEROR',clue:'Ruler of an empire (7)',num:4},
      {id:'a5',dir:'across',row:8,col:0,answer:'TOMB',clue:'Burial place (4)',num:5},
      {id:'d1',dir:'down',row:0,col:0,answer:'REPUBLIC',clue:'Government by elected reps (9)',num:1},
      {id:'d2',dir:'down',row:0,col:5,answer:'ANCIENT',clue:'From very long ago (7)',num:6},
      {id:'d3',dir:'down',row:0,col:8,answer:'WRITING',clue:'Text on paper (7)',num:7},
    ]
  },
  {
    title: "Bookworm",
    difficulty: "hard",
    rows: 9, cols: 9,
    words: [
      {id:'a1',dir:'across',row:0,col:0,answer:'LIBRARY',clue:'Place full of books (7)',num:1},
      {id:'a2',dir:'across',row:2,col:0,answer:'AUTHOR',clue:'Book writer (6)',num:2},
      {id:'a3',dir:'across',row:4,col:0,answer:'NOVEL',clue:'Long work of fiction (5)',num:3},
      {id:'a4',dir:'across',row:6,col:0,answer:'CHAPTER',clue:'Section of a book (7)',num:4},
      {id:'a5',dir:'across',row:8,col:0,answer:'POETRY',clue:'Verse and rhythm writing (6)',num:5},
      {id:'d1',dir:'down',row:0,col:0,answer:'LANGUAGE',clue:'System of communication (8)',num:1},
      {id:'d2',dir:'down',row:0,col:3,answer:'IDEA',clue:'A thought or concept (4)',num:6},
      {id:'d3',dir:'down',row:0,col:6,answer:'TALE',clue:'A story (4)',num:7},
    ]
  },
  {
    title: "Sports Arena",
    difficulty: "easy",
    rows: 6, cols: 6,
    words: [
      {id:'a1',dir:'across',row:0,col:0,answer:'SOCCER',clue:'11 players per side, goal kick (6)',num:1},
      {id:'a2',dir:'across',row:2,col:0,answer:'SWIM',clue:'Move through water (4)',num:2},
      {id:'a3',dir:'across',row:4,col:1,answer:'RUN',clue:'Move fast on foot (3)',num:3},
      {id:'a4',dir:'across',row:5,col:0,answer:'CHAMP',clue:'Winner, title holder (5)',num:4},
      {id:'d1',dir:'down',row:0,col:0,answer:'SKIING',clue:'Snow sport with poles (6)',num:1},
      {id:'d2',dir:'down',row:0,col:2,answer:'CURLING',clue:'Ice sliding stones sport (7)',num:5},
      {id:'d3',dir:'down',row:0,col:4,answer:'POLE',clue:'Long vertical stick (4)',num:6},
    ]
  },
  {
    title: "Music Notes",
    difficulty: "medium",
    rows: 7, cols: 7,
    words: [
      {id:'a1',dir:'across',row:0,col:0,answer:'MELODY',clue:'A tune, musical phrase (6)',num:1},
      {id:'a2',dir:'across',row:2,col:0,answer:'GUITAR',clue:'Six-stringed instrument (6)',num:2},
      {id:'a3',dir:'across',row:4,col:0,answer:'PIANO',clue:'88-key keyboard instrument (5)',num:3},
      {id:'a4',dir:'across',row:6,col:0,answer:'TEMPO',clue:'Speed of music (5)',num:4},
      {id:'d1',dir:'down',row:0,col:0,answer:'MUSIC',clue:'Organized sound art form (5)',num:1},
      {id:'d2',dir:'down',row:0,col:3,answer:'DRUM',clue:'Percussion instrument (4)',num:5},
      {id:'d3',dir:'down',row:0,col:5,answer:'CHOIR',clue:'Singing group (5)',num:6},
    ]
  },
  {
    title: "Ocean Deep",
    difficulty: "medium",
    rows: 8, cols: 8,
    words: [
      {id:'a1',dir:'across',row:0,col:0,answer:'WHALE',clue:'Largest mammal in the sea (5)',num:1},
      {id:'a2',dir:'across',row:2,col:0,answer:'CORAL',clue:'Reef-building organism (5)',num:2},
      {id:'a3',dir:'across',row:4,col:0,answer:'SHARK',clue:'Fearsome toothed fish (5)',num:3},
      {id:'a4',dir:'across',row:6,col:0,answer:'ANCHOR',clue:'Device that stops a ship (6)',num:4},
      {id:'a5',dir:'across',row:7,col:0,answer:'PEARL',clue:'Valuable gem from oysters (5)',num:5},
      {id:'d1',dir:'down',row:0,col:0,answer:'WAVES',clue:'Moving water on ocean surface (5)',num:1},
      {id:'d2',dir:'down',row:0,col:3,answer:'SAFETY',clue:'Protection from danger (6)',num:6},
      {id:'d3',dir:'down',row:0,col:6,answer:'KELP',clue:'Brown seaweed (4)',num:7},
    ]
  },
  {
    title: "City Life",
    difficulty: "hard",
    rows: 10, cols: 10,
    words: [
      {id:'a1',dir:'across',row:0,col:0,answer:'SKYSCRAPER',clue:'Very tall city building (10)',num:1},
      {id:'a2',dir:'across',row:2,col:0,answer:'SUBWAY',clue:'Underground train system (6)',num:2},
      {id:'a3',dir:'across',row:4,col:0,answer:'BRIDGE',clue:'Structure spanning a gap (6)',num:3},
      {id:'a4',dir:'across',row:6,col:0,answer:'TRAFFIC',clue:'Vehicles on roads (7)',num:4},
      {id:'a5',dir:'across',row:8,col:0,answer:'SIDEWALK',clue:'Pedestrian path on a street (8)',num:5},
      {id:'a6',dir:'across',row:9,col:0,answer:'PARK',clue:'Green public urban space (4)',num:6},
      {id:'d1',dir:'down',row:0,col:0,answer:'SUBURBS',clue:'Residential area outside city (7)',num:1},
      {id:'d2',dir:'down',row:0,col:5,answer:'AVENUE',clue:'Wide city street (6)',num:7},
      {id:'d3',dir:'down',row:0,col:9,answer:'MUSEUM',clue:'Building with exhibits (6)',num:8},
    ]
  },
];

// ── Game State ────────────────────────────────────────────────────────────────
let currentPuzzle = null;
let grid = [];
let userGrid = [];
let selectedCell = null;
let selectedWordId = null;
let timerInterval = null;
let seconds = 0;
let hintsLeft = 3;
let gameStarted = false;
let completedWords = new Set();

// ── Audio ─────────────────────────────────────────────────────────────────────
function playSound(name) {
  try { if (window.GameAudio) GameAudio.play(name); } catch(e) {}
}
function playBGM() {
  try { if (window.GameAudio) GameAudio.playBGM('word-puzzle'); } catch(e) {}
}

// ── Puzzle Selection ──────────────────────────────────────────────────────────
function initPuzzleSelect() {
  const container = document.getElementById('puzzle-select');
  if (!container) return;
  container.innerHTML = '';
  PUZZLES.forEach((p, i) => {
    const btn = document.createElement('button');
    btn.innerHTML = `${p.title} <span class="diff">[${p.difficulty}]</span>`;
    btn.onclick = () => startPuzzle(i);
    container.appendChild(btn);
  });
}

function showStart() {
  const list = document.getElementById('puzzle-list');
  if (!list) return;
  list.innerHTML = '';
  PUZZLES.forEach((p, i) => {
    const card = document.createElement('div');
    card.className = 'puzzle-card';
    card.innerHTML = `
      <h4>${p.title}</h4>
      <div class="meta">${p.rows}×${p.cols} grid</div>
      <div class="tags">
        <span class="tag tag-${p.difficulty}">${p.difficulty.toUpperCase()}</span>
        <span class="tag" style="background:rgba(96,165,250,0.2);color:#93c5fd">${p.words.length} words</span>
      </div>`;
    card.onclick = () => { startPuzzle(i); hideStart(); };
    list.appendChild(card);
  });
  const overlay = document.getElementById('start-overlay');
  if (overlay) overlay.classList.remove('hidden');
}

function hideStart() {
  const overlay = document.getElementById('start-overlay');
  if (overlay) overlay.classList.add('hidden');
}

function hideWin() {
  const overlay = document.getElementById('win-overlay');
  if (overlay) overlay.classList.add('hidden');
}

// ── Grid Building ─────────────────────────────────────────────────────────────
function buildGrid(puzzle) {
  const { rows, cols, words } = puzzle;
  const g = Array.from({length: rows}, () => Array(cols).fill(null));
  const u = Array.from({length: rows}, () => Array(cols).fill(''));

  const numberMap = {};
  const sortedWords = [...words].sort((a, b) => {
    if (a.row !== b.row) return a.row - b.row;
    return a.col - b.col;
  });

  let numCounter = 1;
  for (const w of sortedWords) {
    const key = `${w.row},${w.col}`;
    if (!(key in numberMap)) {
      numberMap[key] = numCounter++;
    }
    w.num = numberMap[key];
  }

  for (const w of words) {
    for (let i = 0; i < w.answer.length; i++) {
      const r = w.dir === 'across' ? w.row : w.row + i;
      const c = w.dir === 'across' ? w.col + i : w.col;
      if (!g[r][c]) {
        g[r][c] = { wordIds: [w.id], letter: w.answer[i], number: null };
      } else {
        g[r][c].wordIds.push(w.id);
      }
      if (i === 0) {
        g[r][c].number = w.num;
      }
    }
  }
  return { grid: g, userGrid: u };
}

function renderGrid(puzzle) {
  const { rows, cols } = puzzle;
  const container = document.getElementById('crossword-grid');
  if (!container) return;
  container.innerHTML = '';
  container.style.gridTemplateColumns = `repeat(${cols}, 36px)`;

  for (let r = 0; r < rows; r++) {
    for (let c = 0; c < cols; c++) {
      const cell = document.createElement('div');
      cell.className = 'cell';
      cell.dataset.row = r;
      cell.dataset.col = c;

      if (!grid[r][c]) {
        cell.classList.add('block');
      } else {
        const num = grid[r][c].number;
        if (num) {
          const numSpan = document.createElement('span');
          numSpan.className = 'num';
          numSpan.textContent = num;
          cell.appendChild(numSpan);
        }
        const input = document.createElement('input');
        input.maxLength = 1;
        input.value = userGrid[r][c];
        input.addEventListener('input', (e) => onInput(r, c, e.target.value));
        input.addEventListener('keydown', (e) => onKeyDown(r, c, e));
        input.addEventListener('focus', () => selectCell(r, c));
        input.addEventListener('click', (e) => { e.stopPropagation(); selectCell(r, c); });
        cell.appendChild(input);
        cell.addEventListener('click', () => {
          selectCell(r, c);
          const inp = cell.querySelector('input');
          if (inp) inp.focus();
        });
      }
      container.appendChild(cell);
    }
  }
}

function renderClues(puzzle) {
  const across = puzzle.words.filter(w => w.dir === 'across').sort((a, b) => a.num - b.num);
  const down = puzzle.words.filter(w => w.dir === 'down').sort((a, b) => a.num - b.num);
  const acrossEl = document.getElementById('across-clues');
  const downEl = document.getElementById('down-clues');
  if (!acrossEl || !downEl) return;

  acrossEl.innerHTML = '';
  downEl.innerHTML = '';

  across.forEach(w => {
    const item = document.createElement('div');
    item.className = 'clue-item';
    item.id = `clue-${w.id}`;
    item.innerHTML = `<span class="num">${w.num}.</span> ${w.clue}`;
    item.onclick = () => { selectWord(w.id); playSound('click'); };
    acrossEl.appendChild(item);
  });

  down.forEach(w => {
    const item = document.createElement('div');
    item.className = 'clue-item';
    item.id = `clue-${w.id}`;
    item.innerHTML = `<span class="num">${w.num}.</span> ${w.clue}`;
    item.onclick = () => { selectWord(w.id); playSound('click'); };
    downEl.appendChild(item);
  });
}

function getWordCells(wordId) {
  const w = currentPuzzle.words.find(x => x.id === wordId);
  if (!w) return [];
  const cells = [];
  for (let i = 0; i < w.answer.length; i++) {
    const r = w.dir === 'across' ? w.row : w.row + i;
    const c = w.dir === 'across' ? w.col + i : w.col;
    cells.push({row: r, col: c});
  }
  return cells;
}

function selectWord(wordId) {
  selectedWordId = wordId;
  const w = currentPuzzle.words.find(x => x.id === wordId);
  if (!w) return;

  document.querySelectorAll('.cell').forEach(c => {
    c.classList.remove('active','word-highlight');
  });
  document.querySelectorAll('.clue-item').forEach(c => c.classList.remove('active'));

  const cells = getWordCells(wordId);
  const allCells = new Set();
  cells.forEach(({row, col}) => allCells.add(`${row},${col}`));

  // Add crossing cells
  cells.forEach(({row, col}) => {
    const cellData = grid[row][col];
    if (cellData) {
      cellData.wordIds.forEach(wid => {
        if (wid !== wordId) {
          getWordCells(wid).forEach(({row: r, col: c}) => allCells.add(`${r},${c}`));
        }
      });
    }
  });

  allCells.forEach(key => {
    const [r, c] = key.split(',').map(Number);
    const cell = document.querySelector(`.cell[data-row="${r}"][data-col="${c}"]`);
    if (cell && !cell.classList.contains('block')) {
      if (cells.some(c => c.row === r && c.col === c)) {
        cell.classList.add('active');
      }
      cell.classList.add('word-highlight');
    }
  });

  if (cells.length > 0) {
    selectCell(cells[0].row, cells[0].col);
  }

  const clueEl = document.getElementById(`clue-${wordId}`);
  if (clueEl) {
    clueEl.classList.add('active');
    clueEl.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
  }
}

function selectCell(row, col) {
  if (!grid[row][col]) return;
  selectedCell = {row, col};

  document.querySelectorAll('.cell').forEach(c => c.classList.remove('active'));
  const cell = document.querySelector(`.cell[data-row="${row}"][data-col="${col}"]`);
  if (cell) cell.classList.add('active');

  const cellData = grid[row][col];
  if (cellData && cellData.wordIds.length > 0) {
    const currentWordId = cellData.wordIds[0];
    if (selectedWordId !== currentWordId) {
      selectWord(currentWordId);
    }
  }
}

function onInput(row, col, value) {
  const letter = value.toUpperCase().replace(/[^A-Z]/g, '').slice(-1);
  userGrid[row][col] = letter;
  const input = document.querySelector(`.cell[data-row="${row}"][data-col="${col}"] input`);
  if (input) input.value = letter;
  if (letter) {
    playSound('keytype');
    moveToNextCell(row, col);
  }
  checkWordCompletion();
}

function onKeyDown(row, col, e) {
  const key = e.key;
  if (key === 'Backspace') {
    e.preventDefault();
    userGrid[row][col] = '';
    if (e.target) e.target.value = '';
    moveToPrevCell(row, col);
    return;
  }
  if (key === 'ArrowRight') { e.preventDefault(); moveDir(row, col, 0, 1); return; }
  if (key === 'ArrowLeft') { e.preventDefault(); moveDir(row, col, 0, -1); return; }
  if (key === 'ArrowDown') { e.preventDefault(); moveDir(row, col, 1, 0); return; }
  if (key === 'ArrowUp') { e.preventDefault(); moveDir(row, col, -1, 0); return; }
  if (key === 'Tab') { e.preventDefault(); moveToNextWord(); return; }
  if (key === 'Enter') { e.preventDefault(); moveToNextWord(); return; }
  if (/^[a-zA-Z]$/.test(key)) {
    e.preventDefault();
    onInput(row, col, key);
  }
}

function moveDir(row, col, dr, dc) {
  const { rows, cols } = currentPuzzle;
  let nr = row + dr, nc = col + dc;
  while (nr >= 0 && nr < rows && nc >= 0 && nc < cols && !grid[nr][nc]) {
    nr += dr; nc += dc;
  }
  if (nr >= 0 && nr < rows && nc >= 0 && nc < cols && grid[nr][nc]) {
    selectCell(nr, nc);
    focusInput(nr, nc);
  }
}

function moveToNextCell(row, col) {
  if (!selectedWordId) return;
  const w = currentPuzzle.words.find(x => x.id === selectedWordId);
  if (!w) return;
  const cells = getWordCells(selectedWordId);
  const idx = cells.findIndex(c => c.row === row && c.col === col);
  if (idx < cells.length - 1) {
    const next = cells[idx + 1];
    selectCell(next.row, next.col);
    focusInput(next.row, next.col);
  }
}

function moveToPrevCell(row, col) {
  if (!selectedWordId) return;
  const cells = getWordCells(selectedWordId);
  const idx = cells.findIndex(c => c.row === row && c.col === col);
  if (idx > 0) {
    const prev = cells[idx - 1];
    selectCell(prev.row, prev.col);
    focusInput(prev.row, prev.col);
  }
}

function moveToNextWord() {
  if (!currentPuzzle) return;
  const words = currentPuzzle.words;
  const idx = words.findIndex(w => w.id === selectedWordId);
  const next = words[(idx + 1) % words.length];
  selectWord(next.id);
}

function focusInput(row, col) {
  const cell = document.querySelector(`.cell[data-row="${row}"][data-col="${col}"]`);
  if (cell) {
    const inp = cell.querySelector('input');
    if (inp) inp.focus();
  }
}

// ── Game Logic ────────────────────────────────────────────────────────────────
function startPuzzle(puzzleIndex) {
  currentPuzzle = PUZZLES[puzzleIndex];
  const { grid: g, userGrid: u } = buildGrid(currentPuzzle);
  grid = g;
  userGrid = u;
  selectedCell = null;
  selectedWordId = null;
  hintsLeft = 3;
  seconds = 0;
  gameStarted = false;
  completedWords = new Set();

  clearInterval(timerInterval);
  const timerEl = document.getElementById('timer');
  const hintsCountEl = document.getElementById('hints-count');
  const hintsDisplayEl = document.getElementById('hints-display');
  const hintBtn = document.getElementById('hint-btn');
  if (timerEl) timerEl.textContent = '00:00';
  if (hintsCountEl) hintsCountEl.textContent = '3';
  if (hintsDisplayEl) hintsDisplayEl.textContent = '3/3';
  if (hintBtn) hintBtn.style.display = '';

  renderGrid(currentPuzzle);
  renderClues(currentPuzzle);

  if (currentPuzzle.words.length > 0) {
    selectWord(currentPuzzle.words[0].id);
  }

  hideStart();
  hideWin();
  playBGM();
  playSound('success');
}

function startTimer() {
  if (gameStarted) return;
  gameStarted = true;
  timerInterval = setInterval(() => {
    seconds++;
    const m = String(Math.floor(seconds / 60)).padStart(2, '0');
    const s = String(seconds % 60).padStart(2, '0');
    const timerEl = document.getElementById('timer');
    if (timerEl) timerEl.textContent = `${m}:${s}`;
  }, 1000);
}

function checkWordCompletion() {
  startTimer();
  if (!currentPuzzle) return;

  currentPuzzle.words.forEach(w => {
    if (completedWords.has(w.id)) return;
    const cells = getWordCells(w.id);
    const allFilled = cells.every(({row, col}) => userGrid[row][col] !== '');
    if (allFilled) {
      const correct = cells.every(({row, col}) =>
        userGrid[row][col] === grid[row][col].letter
      );
      if (correct) {
        completedWords.add(w.id);
        markWordComplete(w.id);
        playSound('success');
      }
    }
  });

  if (completedWords.size === currentPuzzle.words.length) {
    setTimeout(puzzleComplete, 300);
  }
}

function markWordComplete(wordId) {
  const cells = getWordCells(wordId);
  cells.forEach(({row, col}) => {
    const cell = document.querySelector(`.cell[data-row="${row}"][data-col="${col}"]`);
    if (cell) cell.classList.add('correct');
  });
  const clueEl = document.getElementById(`clue-${wordId}`);
  if (clueEl) clueEl.classList.add('completed');
}

function checkAnswer() {
  playSound('click');
  if (!currentPuzzle) return;
  let hasErrors = false;
  let hasEmpty = false;

  currentPuzzle.words.forEach(w => {
    const cells = getWordCells(w.id);
    cells.forEach(({row, col}) => {
      if (!userGrid[row][col]) {
        hasEmpty = true;
        const cell = document.querySelector(`.cell[data-row="${row}"][data-col="${col}"]`);
        if (cell) {
          cell.classList.add('wrong');
          setTimeout(() => cell.classList.remove('wrong'), 600);
        }
      } else if (userGrid[row][col] !== grid[row][col].letter) {
        hasErrors = true;
        const cell = document.querySelector(`.cell[data-row="${row}"][data-col="${col}"]`);
        if (cell) {
          cell.classList.add('wrong');
          setTimeout(() => cell.classList.remove('wrong'), 600);
        }
      }
    });
  });

  if (hasErrors) {
    playSound('wrong');
  } else if (hasEmpty) {
    playSound('buzz');
  } else {
    playSound('success');
  }
}

function clearGrid() {
  playSound('click');
  if (!currentPuzzle) return;
  userGrid = Array.from({length: currentPuzzle.rows}, () => Array(currentPuzzle.cols).fill(''));
  document.querySelectorAll('.cell input').forEach(inp => inp.value = '');
  document.querySelectorAll('.cell').forEach(c => {
    c.classList.remove('correct','wrong','revealed');
  });
  completedWords = new Set();
  document.querySelectorAll('.clue-item').forEach(c => c.classList.remove('completed'));
}

function showHint() {
  if (!currentPuzzle || hintsLeft <= 0) return;
  playSound('ding');

  // Find first incomplete word
  let targetWord = null;
  let targetCell = null;

  for (const w of currentPuzzle.words) {
    if (completedWords.has(w.id)) continue;
    const cells = getWordCells(w.id);
    for (const {row, col} of cells) {
      if (!userGrid[row][col] || userGrid[row][col] !== grid[row][col].letter) {
        targetWord = w;
        targetWord = w;
        targetCell = {row, col};
        break;
      }
    }
    if (targetWord) break;
  }

  if (!targetWord || !targetCell) return;

  hintsLeft--;
  document.getElementById('hints-count').textContent = hintsLeft;
  document.getElementById('hints-display').textContent = `${hintsLeft}/3`;
  if (hintsLeft <= 0) {
    document.getElementById('hint-btn').style.display = 'none';
  }

  userGrid[targetCell.row][targetCell.col] = grid[targetCell.row][targetCell.col].letter;
  const cell = document.querySelector(`.cell[data-row="${targetCell.row}"][data-col="${targetCell.col}"]`);
  if (cell) {
    const inp = cell.querySelector('input');
    if (inp) inp.value = grid[targetCell.row][targetCell.col].letter;
    cell.classList.add('revealed');
    cell.classList.add('correct');
    setTimeout(() => cell.classList.remove('revealed'), 1500);
  }

  selectWord(targetWord.id);
  checkWordCompletion();
}

function revealPuzzle() {
  playSound('click');
  if (!currentPuzzle) return;
  for (let r = 0; r < currentPuzzle.rows; r++) {
    for (let c = 0; c < currentPuzzle.cols; c++) {
      if (grid[r][c]) {
        userGrid[r][c] = grid[r][c].letter;
        const cell = document.querySelector(`.cell[data-row="${r}"][data-col="${c}"]`);
        if (cell) {
          const inp = cell.querySelector('input');
          if (inp) inp.value = grid[r][c].letter;
          cell.classList.add('revealed');
        }
      }
    }
  }
  currentPuzzle.words.forEach(w => {
    completedWords.add(w.id);
    markWordComplete(w.id);
  });
}

function puzzleComplete() {
  clearInterval(timerInterval);
  playSound('win');
  const m = String(Math.floor(seconds / 60)).padStart(2, '0');
  const s = String(seconds % 60).padStart(2, '0');
  const msg = `Time: ${m}:${s} — Hints used: ${3 - hintsLeft}`;
  const msgEl = document.getElementById('win-msg');
  if (msgEl) msgEl.textContent = msg;
  const winOverlay = document.getElementById('win-overlay');
  if (winOverlay) winOverlay.classList.remove('hidden');

  // Trigger Monetag ad
  try {
    if (window.GZMonetagSafe) {
      window.GZMonetagSafe.maybeLoad(10687757);
    }
  } catch(e) {}
}

// ── Keyboard global handler ───────────────────────────────────────────────────
document.addEventListener('keydown', (e) => {
  if (!currentPuzzle) return;
  if (e.target.tagName === 'INPUT') return;
  if (/^[a-zA-Z]$/.test(e.key) && selectedCell) {
    userGrid[selectedCell.row][selectedCell.col] = e.key.toUpperCase();
    const cell = document.querySelector(`.cell[data-row="${selectedCell.row}"][data-col="${selectedCell.col}"]`);
    if (cell) {
      const inp = cell.querySelector('input');
      if (inp) inp.value = e.key.toUpperCase();
    }
    playSound('keytype');
    moveToNextCell(selectedCell.row, selectedCell.col);
    checkWordCompletion();
  }
  if (e.key === 'Backspace' && selectedCell) {
    e.preventDefault();
    userGrid[selectedCell.row][selectedCell.col] = '';
    const cell = document.querySelector(`.cell[data-row="${selectedCell.row}"][data-col="${selectedCell.col}"]`);
    if (cell) {
      const inp = cell.querySelector('input');
      if (inp) inp.value = '';
    }
    moveToPrevCell(selectedCell.row, selectedCell.col);
  }
});

// ── Init ─────────────────────────────────────────────────────────────────────
window.addEventListener('DOMContentLoaded', () => {
  initPuzzleSelect();
  // Auto-show start screen
  setTimeout(showStart, 200);
});

// ── Prevent zoom on double tap (mobile) ──────────────────────────────────────
document.addEventListener('touchend', (e) => {
  const now = Date.now();
  if (now - (window.lastTouchEnd || 0) < 300) {
    e.preventDefault();
  }
  window.lastTouchEnd = now;
}, { passive: false });
