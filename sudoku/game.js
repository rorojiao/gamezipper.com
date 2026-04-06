// ============================================================
// Sudoku Game — GameZipper
// ============================================================

(function() {
'use strict';

// ---- Audio (Web Audio API) ----
var audioCtx = null;
function getAudio() {
  if (!audioCtx) audioCtx = new (window.AudioContext || window.webkitAudioContext)();
  return audioCtx;
}
function playTone(freq, dur, type) {
  try {
    var ac = getAudio();
    var osc = ac.createOscillator();
    var gain = ac.createGain();
    osc.connect(gain);
    gain.connect(ac.destination);
    osc.type = type || 'sine';
    osc.frequency.value = freq;
    gain.gain.setValueAtTime(0.12, ac.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.001, ac.currentTime + dur);
    osc.start(ac.currentTime);
    osc.stop(ac.currentTime + dur);
  } catch(e) {}
}
function sfxSelect()  { playTone(440, 0.08, 'sine'); }
function sfxNumber()  { playTone(523, 0.07, 'sine'); }
function sfxClear()   { playTone(330, 0.06, 'sine'); }
function sfxError()   { playTone(180, 0.25, 'sawtooth'); }
function sfxWin() {
  [523,659,784,1047].forEach(function(f, i) {
    setTimeout(function(){ playTone(f, 0.3, 'sine'); }, i * 150);
  });
}
function sfxFail()   { playTone(200, 0.4, 'sawtooth'); }

// ---- Constants ----
var DIFFICULTIES = {
  easy:   { label: 'Easy',   given: [38,42] },
  medium: { label: 'Medium', given: [30,34] },
  hard:   { label: 'Hard',   given: [22,28] }
};
var EMPTY = 0;
var MAX_MISTAKES = 3;
var MAX_UNDO = 50;

// ---- State ----
var board, solution, given;
var selectedRow, selectedCol;
var notesMode, errorHighlight;
var mistakes, gameStarted, gameOver;
var timerInterval, seconds;
var undoStack;
var bestTimes = { easy: Infinity, medium: Infinity, hard: Infinity };
var currentDifficulty;

// ---- DOM refs ----
var canvas, ctx;
var timerEl, mistakesEl;
var difficultyScreen, boardWrap, controls;
var winOverlay, failOverlay, winTimeEl;
var notesBtnEl, errBtnEl;

// ---- Init ----
function init() {
  canvas  = document.getElementById('board');
  ctx     = canvas.getContext('2d');
  timerEl       = document.getElementById('timer-val');
  mistakesEl    = document.getElementById('mistakes-val');
  difficultyScreen = document.getElementById('difficulty-screen');
  boardWrap     = document.getElementById('board-wrap');
  controls      = document.getElementById('controls');
  winOverlay    = document.getElementById('win-overlay');
  failOverlay   = document.getElementById('fail-overlay');
  winTimeEl     = document.getElementById('win-time');
  notesBtnEl    = document.getElementById('notes-btn');
  errBtnEl      = document.getElementById('err-btn');

  notesMode = false;
  errorHighlight = true;
  mistakes = 0;
  gameStarted = false;
  gameOver = false;
  seconds = 0;
  undoStack = [];
  selectedRow = -1;
  selectedCol = -1;

  // Keyboard
  window.addEventListener('keydown', onKeyDown);

  // Canvas click / touch
  canvas.addEventListener('click', onCanvasClick);
  canvas.addEventListener('touchend', onCanvasTouch, {passive:false});

  // Canvas focus fix
  canvas.setAttribute('tabindex', '0');
  canvas.focus();

  // Load best times
  try {
    var saved = localStorage.getItem('sudoku_best');
    if (saved) bestTimes = JSON.parse(saved);
  } catch(e) {}

  resizeCanvas();
  window.addEventListener('resize', resizeCanvas);

  renderDifficulty();
}

function resizeCanvas() {
  var wrap = document.getElementById('board-wrap');
  var size = Math.min(wrap.clientWidth, wrap.clientHeight);
  canvas.width  = size * window.devicePixelRatio;
  canvas.height = size * window.devicePixelRatio;
  canvas.style.width  = size + 'px';
  canvas.style.height = size + 'px';
  ctx.setTransform(window.devicePixelRatio, 0, 0, window.devicePixelRatio, 0, 0);
  if (board) render();
}

// ---- Difficulty ----
function renderDifficulty() {
  difficultyScreen.style.display = 'flex';
  boardWrap.style.display = 'none';
  controls.style.display = 'none';
  stopTimer();
  timerEl.textContent = '00:00';
  mistakesEl.textContent = '0/3';
}

window.game = {
  showDifficulty: function() {
    // Remove any existing game-over overlay blocking
    winOverlay.style.display = 'none';
    failOverlay.style.display = 'none';
    renderDifficulty();
  },

  start: function(diff) {
    currentDifficulty = diff;
    mistakes = 0;
    seconds  = 0;
    gameOver = false;
    gameStarted = false;
    undoStack = [];
    selectedRow = -1;
    selectedCol = -1;
    notesMode = false;
    errorHighlight = document.getElementById('err-btn').classList.contains('active');

    // Generate puzzle
    var gen = generateSudoku(diff);
    solution = gen.solution;
    board    = gen.board;
    given    = gen.given;

    difficultyScreen.style.display = 'none';
    boardWrap.style.display = 'block';
    controls.style.display = 'flex';

    notesBtnEl.classList.toggle('active', notesMode);
    errBtnEl.classList.toggle('active', errorHighlight);
    mistakesEl.textContent = '0/' + MAX_MISTAKES;
    timerEl.textContent = '00:00';

    resizeCanvas();
    render();
    stopTimer();
  },

  toggleNotes: function() {
    notesMode = !notesMode;
    notesBtnEl.classList.toggle('active', notesMode);
    render();
  },

  toggleErrorHighlight: function() {
    errorHighlight = !errorHighlight;
    errBtnEl.classList.toggle('active', errorHighlight);
    render();
  },

  enterNumber: function(n) {
    if (gameOver || selectedRow < 0) return;
    if (given[selectedRow][selectedCol]) return; // can't edit given cells

    if (!gameStarted) {
      gameStarted = true;
      startTimer();
    }

    var r = selectedRow, c = selectedCol;

    if (notesMode) {
      // Toggle note
      var prev = board[r][c];
      board[r][c] = toggleNote(prev, n);
      undoStack.push({type:'note', r, c, prev, val: board[r][c]});
      if (undoStack.length > MAX_UNDO) undoStack.shift();
      sfxSelect();
      render();
      return;
    }

    // Regular number entry
    var prev = board[r][c];
    undoStack.push({type:'number', r, c, prev, val: n});
    if (undoStack.length > MAX_UNDO) undoStack.shift();

    board[r][c] = n;

    // Check for error
    if (n !== solution[r][c]) {
      mistakes++;
      mistakesEl.textContent = mistakes + '/' + MAX_MISTAKES;
      sfxError();
      if (mistakes >= MAX_MISTAKES) {
        endGame(false);
        return;
      }
    } else {
      sfxNumber();
      // Auto-clear notes in same row/col/block
      clearNotesInInfluenced(r, c, n);
    }

    render();
    checkWin();
  },

  clearCell: function() {
    if (gameOver || selectedRow < 0) return;
    if (given[selectedRow][selectedCol]) return;
    if (!gameStarted) return;

    var r = selectedRow, c = selectedCol;
    if (board[r][c] === EMPTY && !hasNotes(board[r][c])) return;

    undoStack.push({type:'clear', r, c, prev: board[r][c]});
    if (undoStack.length > MAX_UNDO) undoStack.shift();
    board[r][c] = EMPTY;
    sfxClear();
    render();
  },

  undo: function() {
    if (undoStack.length === 0) return;
    var action = undoStack.pop();
    board[action.r][action.c] = action.prev;
    selectedRow = action.r;
    selectedCol = action.c;
    sfxSelect();
    render();
  },

  restart: function() {
    if (currentDifficulty) this.start(currentDifficulty);
  }
};

// ---- Keyboard ----
function onKeyDown(e) {
  if (difficultyScreen.style.display !== 'none') return;

  var key = e.key;
  if (key >= '1' && key <= '9') {
    game.enterNumber(parseInt(key));
    e.preventDefault();
  } else if (key === 'Backspace' || key === 'Delete' || key === '0') {
    game.clearCell();
    e.preventDefault();
  } else if (key === 'n' || key === 'N') {
    game.toggleNotes();
    e.preventDefault();
  } else if (key === 'z' || key === 'Z') {
    game.undo();
    e.preventDefault();
  } else if (key === 'ArrowUp' || key === 'w' || key === 'W') {
    moveSelect(-1, 0); e.preventDefault();
  } else if (key === 'ArrowDown' || key === 's' || key === 'S') {
    moveSelect(1, 0); e.preventDefault();
  } else if (key === 'ArrowLeft' || key === 'a' || key === 'A') {
    moveSelect(0, -1); e.preventDefault();
  } else if (key === 'ArrowRight' || key === 'd' || key === 'D') {
    moveSelect(0, 1); e.preventDefault();
  }
}

function moveSelect(dr, dc) {
  var r = selectedRow, c = selectedCol;
  if (r < 0) { r = 0; c = 0; }
  else {
    r = (r + dr + 9) % 9;
    c = (c + dc + 9) % 9;
  }
  selectedRow = r; selectedCol = c;
  sfxSelect();
  render();
}

// ---- Canvas Input ----
function getCell(e) {
  var rect = canvas.getBoundingClientRect();
  var size = rect.width;
  var cellSize = size / 9;
  var x, y;
  if (e.touches) {
    x = e.touches[0].clientX - rect.left;
    y = e.touches[0].clientY - rect.top;
  } else {
    x = e.clientX - rect.left;
    y = e.clientY - rect.top;
  }
  var row = Math.floor(y / cellSize);
  var col = Math.floor(x / cellSize);
  if (row < 0 || row > 8 || col < 0 || col > 8) return null;
  return {row, col};
}

function onCanvasClick(e) {
  var cell = getCell(e);
  if (!cell) return;
  selectedRow = cell.row;
  selectedCol = cell.col;
  sfxSelect();
  render();
  canvas.focus();
}

function onCanvasTouch(e) {
  e.preventDefault();
  var cell = getCell(e);
  if (!cell) return;
  selectedRow = cell.row;
  selectedCol = cell.col;
  sfxSelect();
  render();
}

// ---- Timer ----
function startTimer() {
  stopTimer();
  timerInterval = setInterval(function() {
    seconds++;
    timerEl.textContent = formatTime(seconds);
  }, 1000);
}

function stopTimer() {
  if (timerInterval) { clearInterval(timerInterval); timerInterval = null; }
}

function formatTime(s) {
  var m = Math.floor(s / 60);
  var sec = s % 60;
  return String(m).padStart(2,'0') + ':' + String(sec).padStart(2,'0');
}

// ---- Win / Fail ----
function endGame(won) {
  gameOver = true;
  stopTimer();
  if (won) {
    sfxWin();
    winTimeEl.textContent = 'Time: ' + formatTime(seconds);
    winOverlay.style.display = 'flex';
    // Save best time
    if (seconds < bestTimes[currentDifficulty]) {
      bestTimes[currentDifficulty] = seconds;
      try { localStorage.setItem('sudoku_best', JSON.stringify(bestTimes)); } catch(e) {}
    }
    // Trigger ad
    if (window.GZMonetagSafe) window.GZMonetagSafe.maybeLoad();
  } else {
    sfxFail();
    failOverlay.style.display = 'flex';
    // Trigger ad
    if (window.GZMonetagSafe) window.GZMonetagSafe.maybeLoad();
  }
}

function checkWin() {
  for (var r = 0; r < 9; r++)
    for (var c = 0; c < 9; c++)
      if (board[r][c] === EMPTY || board[r][c] !== solution[r][c]) return;
  endGame(true);
}

// ---- Notes helpers ----
function hasNotes(cell) {
  return cell && typeof cell === 'object' && cell.notes && cell.notes.length > 0;
}
function isEmpty(cell) {
  return !cell || cell === EMPTY;
}

function toggleNote(cell, n) {
  var notes = [];
  if (cell && typeof cell === 'object' && cell.notes) {
    notes = cell.notes.slice();
    var idx = notes.indexOf(n);
    if (idx >= 0) notes.splice(idx, 1);
    else { notes.push(n); notes.sort(function(a,b){return a-b;}); }
  } else {
    notes = [n];
  }
  return notes.length ? {notes: notes} : EMPTY;
}

function clearNotesInInfluenced(row, col, n) {
  for (var c = 0; c < 9; c++) {
    var cell = board[row][c];
    if (cell && typeof cell === 'object' && cell.notes) {
      var idx = cell.notes.indexOf(n);
      if (idx >= 0) { cell.notes.splice(idx, 1); if (!cell.notes.length) board[row][c] = EMPTY; }
    }
  }
  for (var r = 0; r < 9; r++) {
    var cell = board[r][col];
    if (cell && typeof cell === 'object' && cell.notes) {
      var idx = cell.notes.indexOf(n);
      if (idx >= 0) { cell.notes.splice(idx, 1); if (!cell.notes.length) board[r][col] = EMPTY; }
    }
  }
  var br0 = Math.floor(row/3)*3, bc0 = Math.floor(col/3)*3;
  for (var r = br0; r < br0+3; r++)
    for (var c = bc0; c < bc0+3; c++) {
      var cell = board[r][c];
      if (cell && typeof cell === 'object' && cell.notes) {
        var idx = cell.notes.indexOf(n);
        if (idx >= 0) { cell.notes.splice(idx, 1); if (!cell.notes.length) board[r][c] = EMPTY; }
      }
    }
}

// ---- Rendering ----
function render() {
  if (!ctx) return;
  var w = canvas.width / (window.devicePixelRatio || 1);
  var h = canvas.height / (window.devicePixelRatio || 1);
  var cellSize = w / 9;

  ctx.clearRect(0, 0, w, h);

  // Background
  ctx.fillStyle = '#0a1628';
  ctx.fillRect(0, 0, w, h);

  // Cells
  for (var r = 0; r < 9; r++) {
    for (var c = 0; c < 9; c++) {
      drawCell(r, c, cellSize);
    }
  }

  // Grid lines
  drawGrid(cellSize);

  // Selection highlight
  if (selectedRow >= 0 && selectedCol >= 0) {
    drawSelection(selectedRow, selectedCol, cellSize);
  }
}

function drawCell(r, c, cellSize) {
  var x = c * cellSize, y = r * cellSize;
  var cell = board[r][c];
  var isGiven = given[r][c];
  var isSelected = r === selectedRow && c === selectedCol;

  // Cell background
  var bg = '#0d1f35';
  if (isSelected) bg = 'rgba(96,165,250,0.25)';
  else if (isGiven) bg = '#0f2540';

  ctx.fillStyle = bg;
  ctx.fillRect(x, y, cellSize, cellSize);

  // Highlight row/col/block of selected
  if (selectedRow >= 0 && selectedCol >= 0 && !isSelected) {
    if (r === selectedRow || c === selectedCol ||
        (Math.floor(r/3) === Math.floor(selectedRow/3) && Math.floor(c/3) === Math.floor(selectedCol/3))) {
      ctx.fillStyle = 'rgba(96,165,250,0.06)';
      ctx.fillRect(x, y, cellSize, cellSize);
    }
  }

  // Error highlight (wrong number)
  if (errorHighlight && !isGiven && !gameOver) {
    var val = typeof cell === 'object' ? 0 : cell;
    if (val !== EMPTY && val !== solution[r][c]) {
      ctx.fillStyle = 'rgba(239,68,68,0.35)';
      ctx.fillRect(x+1, y+1, cellSize-2, cellSize-2);
    }
  }

  // Draw content
  if (typeof cell === 'object' && cell && cell.notes) {
    // Notes (small numbers)
    drawNotes(cell.notes, x, y, cellSize);
  } else if (cell !== EMPTY) {
    drawNumber(cell, x, y, cellSize, isGiven);
  }
}

function drawNumber(n, x, y, cellSize, isGiven) {
  var fontSize = cellSize * 0.55;
  ctx.font = 'bold ' + fontSize + 'px "Segoe UI",Helvetica,Arial,sans-serif';
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';

  var cx = x + cellSize/2, cy = y + cellSize/2;

  // Given numbers: bright white/blue, User numbers: lighter
  ctx.fillStyle = isGiven ? '#e2e8f0' : '#93c5fd';
  ctx.fillText(String(n), cx, cy + 1);
}

function drawNotes(notes, x, y, cellSize) {
  var fontSize = cellSize * 0.22;
  ctx.font = String(fontSize) + 'px "Segoe UI",Helvetica,Arial,sans-serif';
  ctx.fillStyle = 'rgba(148,163,184,0.8)';
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  var cx = x + cellSize/2, cy = y + cellSize/2;
  var offsetX = [-cellSize*0.3, 0, cellSize*0.3];
  var offsetY = [-cellSize*0.3, 0, cellSize*0.3];
  notes.forEach(function(n) {
    var col = (n-1) % 3, row = Math.floor((n-1) / 3);
    ctx.fillText(String(n), cx + offsetX[col], cy + offsetY[row] + 1);
  });
}

function drawGrid(cellSize) {
  ctx.strokeStyle = 'rgba(96,165,250,0.18)';
  ctx.lineWidth = 1;
  // Minor lines
  for (var i = 1; i < 9; i++) {
    ctx.beginPath();
    ctx.moveTo(i * cellSize, 0);
    ctx.lineTo(i * cellSize, cellSize * 9);
    ctx.stroke();
    ctx.beginPath();
    ctx.moveTo(0, i * cellSize);
    ctx.lineTo(cellSize * 9, i * cellSize);
    ctx.stroke();
  }
  // Major lines (3x3 blocks)
  ctx.strokeStyle = 'rgba(147,197,253,0.6)';
  ctx.lineWidth = 2.5;
  for (var i = 0; i <= 9; i += 3) {
    ctx.beginPath();
    ctx.moveTo(i * cellSize, 0);
    ctx.lineTo(i * cellSize, cellSize * 9);
    ctx.stroke();
    ctx.beginPath();
    ctx.moveTo(0, i * cellSize);
    ctx.lineTo(cellSize * 9, i * cellSize);
    ctx.stroke();
  }

  // Outer border
  ctx.strokeStyle = 'rgba(96,165,250,0.5)';
  ctx.lineWidth = 3;
  ctx.strokeRect(0, 0, cellSize * 9, cellSize * 9);
}

function drawSelection(r, c, cellSize) {
  ctx.strokeStyle = '#60a5fa';
  ctx.lineWidth = 2.5;
  ctx.strokeRect(c * cellSize + 1.5, r * cellSize + 1.5, cellSize - 3, cellSize - 3);
}

// ---- Sudoku Generator ----
function generateSudoku(diff) {
  var givenRange = DIFFICULTIES[diff].given;
  var numGiven = givenRange[0] + Math.floor(Math.random() * (givenRange[1] - givenRange[0] + 1));
  var numRemove = 81 - numGiven;

  // Generate a solved board
  var sol = Array.from({length:9}, function(){return Array(9).fill(0);});
  fillBoard(sol);

  // Make a copy for the puzzle
  var puzzle = sol.map(function(row){return row.slice();});
  var givens = Array.from({length:9}, function(){return Array(9).fill(true);});

  // Remove numbers
  var positions = [];
  for (var i = 0; i < 9; i++) for (var j = 0; j < 9; j++) positions.push([i,j]);
  shuffle(positions);

  var removed = 0;
  for (var idx = 0; idx < positions.length && removed < numRemove; idx++) {
    var pr = positions[idx][0], pc = positions[idx][1];
    var backup = puzzle[pr][pc];
    puzzle[pr][pc] = EMPTY;

    // Check unique solution
    if (countSolutions(puzzle, 0, 2) === 1) {
      givens[pr][pc] = false;
      removed++;
    } else {
      puzzle[pr][pc] = backup; // restore if not unique
    }
  }

  return { solution: sol, board: puzzle, given: givens };
}

function fillBoard(board) {
  var nums = [1,2,3,4,5,6,7,8,9];
  shuffle(nums);
  return solve(board, true);
}

function solve(board, randomize) {
  var empty = findEmpty(board);
  if (!empty) return true;
  var row = empty[0], col = empty[1];

  var nums = [1,2,3,4,5,6,7,8,9];
  if (randomize) shuffle(nums);

  for (var i = 0; i < nums.length; i++) {
    var n = nums[i];
    if (isValid(board, row, col, n)) {
      board[row][col] = n;
      if (solve(board, randomize)) return true;
      board[row][col] = EMPTY;
    }
  }
  return false;
}

function findEmpty(board) {
  for (var r = 0; r < 9; r++)
    for (var c = 0; c < 9; c++)
      if (board[r][c] === EMPTY) return [r, c];
  return null;
}

function isValid(board, row, col, n) {
  // Row
  for (var c = 0; c < 9; c++) if (board[row][c] === n) return false;
  // Col
  for (var r = 0; r < 9; r++) if (board[r][col] === n) return false;
  // Block
  var br = Math.floor(row/3)*3, bc = Math.floor(col/3)*3;
  for (var r = br; r < br+3; r++)
    for (var c = bc; c < bc+3; c++)
      if (board[r][c] === n) return false;
  return true;
}

function countSolutions(board, count, limit) {
  if (count >= limit) return count;
  var empty = findEmpty(board);
  if (!empty) return count + 1;

  var row = empty[0], col = empty[1];
  for (var n = 1; n <= 9 && count < limit; n++) {
    if (isValid(board, row, col, n)) {
      board[row][col] = n;
      count = countSolutions(board, count, limit);
      board[row][col] = EMPTY;
    }
  }
  return count;
}

function shuffle(arr) {
  for (var i = arr.length - 1; i > 0; i--) {
    var j = Math.floor(Math.random() * (i+1));
    var tmp = arr[i]; arr[i] = arr[j]; arr[j] = tmp;
  }
  return arr;
}

// ---- Boot ----
window.addEventListener('DOMContentLoaded', init);

})();
