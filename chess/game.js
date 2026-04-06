// Chess Game - Full Rules Implementation
// ♔♕♖♗♘♙  ♚♛♜♝♞♟

const PIECES = {
  WK: '♔', WQ: '♕', WR: '♖', WB: '♗', WN: '♘', WP: '♙',
  BK: '♚', BQ: '♛', BR: '♜', BB: '♝', BN: '♞', BP: '♟'
};

function isWhite(p) { return p && p[0] === 'w'; }
function isBlack(p) { return p && p[0] === 'b'; }
function other(color) { return color === 'white' ? 'black' : 'white'; }

class ChessGame {
  constructor() {
    this.audio = new AudioContext ? new AudioContext() : null;
    this.board = this.getInitialBoard();
    this.turn = 'white';
    this.selected = null;       // {r, c}
    this.legalMoves = [];
    this.capturedWhite = [];
    this.capturedBlack = [];
    this.history = [];
    this.lastMove = null;       // {from, to}
    this.castlingRights = {WK: true, WQ: true, BK: true, BQ: true};
    this.enPassantTarget = null; // {r, c}
    this.halfMoveClock = 0;
    this.isCheck = false;
    this.gameOver = false;
    this.pendingPromotion = null;
    this.$ = (sel) => document.querySelector(sel);
    this.$$ = (sel) => document.querySelectorAll(sel);
    this.render();
  }

  getInitialBoard() {
    return [
      ['br','bn','bb','bq','bk','bb','bn','br'],
      ['bp','bp','bp','bp','bp','bp','bp','bp'],
      [null,null,null,null,null,null,null,null],
      [null,null,null,null,null,null,null,null],
      [null,null,null,null,null,null,null,null],
      [null,null,null,null,null,null,null,null],
      ['wp','wp','wp','wp','wp','wp','wp','wp'],
      ['wr','wn','wb','wq','wk','wb','wn','wr'],
    ];
  }

  pieceChar(code) { return PIECES[code[0].toUpperCase() + code[1].toUpperCase()] || ''; }
  pieceColor(code) { return isWhite(code) ? 'white' : 'black'; }

  // ---- Board Render ----
  render() {
    const board = this.$('#board');
    board.innerHTML = '';
    for (let r = 0; r < 8; r++) {
      for (let c = 0; c < 8; c++) {
        const sq = document.createElement('div');
        sq.className = 'square ' + ((r + c) % 2 === 0 ? 'light' : 'dark');
        sq.dataset.r = r;
        sq.dataset.c = c;

        const code = this.board[r][c];
        if (code) {
          const span = document.createElement('span');
          span.className = 'piece ' + this.pieceColor(code);
          span.textContent = this.pieceChar(code);
          sq.appendChild(span);
        }

        if (this.selected && this.selected.r === r && this.selected.c === c) {
          sq.classList.add('selected');
        }
        if (this.legalMoves.some(m => m.r === r && m.c === c)) {
          sq.classList.add('legal');
          if (code) sq.classList.add('capture');
        }
        if (this.lastMove && ((this.lastMove.from.r === r && this.lastMove.from.c === c) || (this.lastMove.to.r === r && this.lastMove.to.c === c))) {
          sq.classList.add('lastmove');
        }
        if (code && code[1] === 'k' && this.pieceColor(code) === this.turn && this.isSquareAttacked(r, c, other(this.turn))) {
          sq.classList.add('check');
        }
        sq.addEventListener('click', () => this.onClick(r, c));
        board.appendChild(sq);
      }
    }
    this.renderCaptured();
    this.renderStatus();
  }

  renderCaptured() {
    const area = this.$('#captured-area');
    const caps = [
      ...this.capturedWhite.map(c => `<span class="cap-piece" style="color:#222">${this.pieceChar(c)}</span>`),
      ...this.capturedBlack.map(c => `<span class="cap-piece" style="color:#fff;text-shadow:0 1px 3px rgba(0,0,0,0.8)">${this.pieceChar(c)}</span>`)
    ];
    this.$('#capLabel').textContent = this.capturedWhite.length + this.capturedBlack.length === 0
      ? 'Captured Pieces' : `Captured: ${this.capturedWhite.length + this.capturedBlack.length}`;
    // rebuild
    const label = area.firstElementChild;
    area.innerHTML = '';
    area.appendChild(label);
    caps.forEach(h => { const s = document.createElement('span'); s.innerHTML = h; area.appendChild(s); });
  }

  renderStatus() {
    const dot = this.$('#turnDot');
    const text = this.$('#turnText');
    const badge = this.$('#checkBadge');
    dot.className = 'turn-dot ' + this.turn;
    text.textContent = this.turn === 'white' ? "White's Turn" : "Black's Turn";
    badge.classList.toggle('show', this.isCheck);
  }

  // ---- Click Handler ----
  onClick(r, c) {
    if (this.gameOver || this.pendingPromotion) return;
    const code = this.board[r][c];

    // If clicking a legal move destination
    if (this.selected && this.legalMoves.some(m => m.r === r && m.c === c)) {
      this.doMove(this.selected.r, this.selected.c, r, c);
      this.selected = null;
      this.legalMoves = [];
      return;
    }

    // Select own piece
    if (code && this.pieceColor(code) === this.turn) {
      this.selected = {r, c};
      this.legalMoves = this.getLegalMoves(r, c);
      this.render();
    } else {
      this.selected = null;
      this.legalMoves = [];
      this.render();
    }
  }

  // ---- Move Execution ----
  doMove(fr, fc, tr, tc) {
    const piece = this.board[fr][fc];
    const captured = this.board[tr][tc];
    const color = this.pieceColor(piece);

    // Save state for undo
    this.history.push({
      board: this.board.map(row => [...row]),
      capturedWhite: [...this.capturedWhite],
      capturedBlack: [...this.capturedBlack],
      castlingRights: {...this.castlingRights},
      enPassantTarget: this.enPassantTarget ? {...this.enPassantTarget} : null,
      halfMoveClock: this.halfMoveClock,
    });

    // En passant capture
    let epCapture = null;
    if (piece[1] === 'p' && this.enPassantTarget && tr === this.enPassantTarget.r && tc === this.enPassantTarget.c) {
      const er = fr;
      epCapture = this.board[er][tc];
      this.board[er][tc] = null;
    }

    // Capture
    if (captured) {
      if (isWhite(captured)) this.capturedWhite.push(captured);
      else this.capturedBlack.push(captured);
      this.playSound('capture');
    } else {
      this.playSound('move');
    }

    // Castling
    if (piece[1] === 'k' && Math.abs(tc - fc) === 2) {
      if (tc === 6) { this.board[tr][5] = this.board[tr][7]; this.board[tr][7] = null; }
      else { this.board[tr][3] = this.board[tr][0]; this.board[tr][0] = null; }
    }

    // Move piece
    this.board[tr][tc] = piece;
    this.board[fr][fc] = null;

    // Update castling rights
    if (piece[1] === 'k') { this.castlingRights[color === 'white' ? 'WK' : 'BK'] = false; this.castlingRights[color === 'white' ? 'WQ' : 'BQ'] = false; }
    if (piece[1] === 'r') {
      if (fr === 7 && fc === 0) this.castlingRights.WQ = false;
      if (fr === 7 && fc === 7) this.castlingRights.WK = false;
      if (fr === 0 && fc === 0) this.castlingRights.BQ = false;
      if (fr === 0 && fc === 7) this.castlingRights.BK = false;
    }

    // En passant target
    if (piece[1] === 'p' && Math.abs(tr - fr) === 2) {
      this.enPassantTarget = {r: (fr + tr) / 2, c: fc};
    } else {
      this.enPassantTarget = null;
    }

    // Half-move clock (for 50-move rule)
    if (piece[1] === 'p' || captured) this.halfMoveClock = 0;
    else this.halfMoveClock++;

    // Pawn promotion check
    if (piece[1] === 'p' && (tr === 0 || tr === 7)) {
      this.pendingPromotion = {r: tr, c: tc, color};
      this.lastMove = {from: {r: fr, c: fc}, to: {r: tr, c: tc}};
      this.render();
      this.showPromotionUI(color);
      return;
    }

    this.lastMove = {from: {r: fr, c: fc}, to: {r: tr, c: tc}};
    this.finishTurn();
  }

  showPromotionUI(color) {
    const modal = this.$('#promotion-modal');
    const row = this.$('#promoRow');
    const pieces = color === 'white' ? ['WQ','WR','WB','WN'] : ['BQ','BR','BB','BN'];
    row.innerHTML = pieces.map((p, i) =>
      `<button class="promo-btn" onclick="game.promote('${p}')">${PIECES[p]}</button>`
    ).join('');
    modal.classList.add('show');
  }

  promote(pieceCode) {
    this.$('#promotion-modal').classList.remove('show');
    const {r, c} = this.pendingPromotion;
    this.board[r][c] = pieceCode;
    this.pendingPromotion = null;
    this.playSound('promote');
    this.finishTurn();
  }

  finishTurn() {
    this.turn = other(this.turn);
    this.isCheck = this.isInCheck(this.turn);

    // Check game over
    const hasLegal = this.hasAnyLegalMove(this.turn);
    if (!hasLegal) {
      this.gameOver = true;
      if (this.isCheck) {
        this.showGameOver(this.turn === 'white' ? 'Black wins by Checkmate!' : 'White wins by Checkmate!');
      } else {
        this.showGameOver('Stalemate! Draw.');
      }
      this.playSound('gameover');
    } else if (this.isCheck) {
      this.playSound('check');
    }
    this.render();
  }

  showGameOver(msg) {
    this.$('#gameOverTitle').textContent = 'Game Over';
    this.$('#gameOverMsg').textContent = msg;
    this.$('#game-over-modal').classList.add('show');
    if (window.GZMonetagSafe && window.GZMonetagSafe.maybeLoad) {
      window.GZMonetagSafe.maybeLoad(10687757);
    }
  }

  // ---- Legal Move Generation ----
  getLegalMoves(r, c) {
    const piece = this.board[r][c];
    if (!piece) return [];
    const color = this.pieceColor(piece);
    let moves = this.getPseudoMoves(r, c, piece, color);

    // Filter out moves that leave king in check
    moves = moves.filter(m => {
      if (!this.isLegalMove(r, c, m.r, m.c, piece, color)) return false;
      return true;
    });
    return moves;
  }

  getPseudoMoves(r, c, piece, color) {
    const type = piece[1];
    const moves = [];
    const ep = this.enPassantTarget;

    switch (type) {
      case 'p': {
        const dir = color === 'white' ? -1 : 1;
        const startRow = color === 'white' ? 6 : 1;
        // Forward
        if (this.board[r+dir] && this.board[r+dir][c] === null) {
          moves.push({r: r+dir, c});
          if (r === startRow && this.board[r+2*dir][c] === null) moves.push({r: r+2*dir, c});
        }
        // Captures
        for (const dc of [-1, 1]) {
          const nr = r+dir, nc = c+dc;
          if (nr < 0 || nr > 7 || nc < 0 || nc > 7) continue;
          const target = this.board[nr][nc];
          if (target && this.pieceColor(target) !== color) moves.push({r: nr, c: nc});
          // En passant
          if (ep && ep.r === nr && ep.c === nc) moves.push({r: nr, c: nc});
        }
        break;
      }
      case 'n': {
        const deltas = [[-2,-1],[-2,1],[-1,-2],[-1,2],[1,-2],[1,2],[2,-1],[2,1]];
        for (const [dr, dc] of deltas) {
          const nr = r+dr, nc = c+dc;
          if (nr < 0 || nr > 7 || nc < 0 || nc > 7) continue;
          const t = this.board[nr][nc];
          if (!t || this.pieceColor(t) !== color) moves.push({r: nr, c: nc});
        }
        break;
      }
      case 'b': {
        this.slideMoves(moves, r, c, [[-1,-1],[-1,1],[1,-1],[1,1]], color);
        break;
      }
      case 'r': {
        this.slideMoves(moves, r, c, [[-1,0],[1,0],[0,-1],[0,1]], color);
        break;
      }
      case 'q': {
        this.slideMoves(moves, r, c, [[-1,-1],[-1,1],[1,-1],[1,1],[-1,0],[1,0],[0,-1],[0,1]], color);
        break;
      }
      case 'k': {
        const deltas = [[-1,-1],[-1,0],[-1,1],[0,-1],[0,1],[1,-1],[1,0],[1,1]];
        for (const [dr, dc] of deltas) {
          const nr = r+dr, nc = c+dc;
          if (nr < 0 || nr > 7 || nc < 0 || nc > 7) continue;
          const t = this.board[nr][nc];
          if (!t || this.pieceColor(t) !== color) moves.push({r: nr, c: nc});
        }
        // Castling
        const row = color === 'white' ? 7 : 0;
        if (r === row && c === 4 && !this.isSquareAttacked(r, c, other(color))) {
          if (this.castlingRights[color==='white'?'WK':'BK'] && !this.board[row][5] && !this.board[row][6] && !this.isSquareAttacked(row,5,other(color)) && !this.isSquareAttacked(row,6,other(color))) {
            moves.push({r: row, c: 6});
          }
          if (this.castlingRights[color==='white'?'WQ':'BQ'] && !this.board[row][1] && !this.board[row][2] && !this.board[row][3] && !this.isSquareAttacked(row,2,other(color)) && !this.isSquareAttacked(row,3,other(color))) {
            moves.push({r: row, c: 2});
          }
        }
        break;
      }
    }
    return moves;
  }

  slideMoves(moves, r, c, dirs, color) {
    for (const [dr, dc] of dirs) {
      let nr = r+dr, nc = c+dc;
      while (nr >= 0 && nr <= 7 && nc >= 0 && nc <= 7) {
        const t = this.board[nr][nc];
        if (!t) { moves.push({r: nr, c: nc}); }
        else { if (this.pieceColor(t) !== color) moves.push({r: nr, c: nc}); break; }
        nr += dr; nc += dc;
      }
    }
  }

  isLegalMove(fr, fc, tr, tc, piece, color) {
    // Simulate move
    const board = this.board.map(row => [...row]);
    let epCapture = null;
    if (piece[1] === 'p' && this.enPassantTarget && tr === this.enPassantTarget.r && tc === this.enPassantTarget.c) {
      epCapture = board[fr][tc];
      board[fr][tc] = null;
    }
    // Castling rook move
    if (piece[1] === 'k' && Math.abs(tc - fc) === 2) {
      if (tc === 6) { board[fr][5] = board[fr][7]; board[fr][7] = null; }
      else { board[fr][3] = board[fr][0]; board[fr][0] = null; }
    }
    board[tr][tc] = board[fr][fc];
    board[fr][fc] = null;

    // Find king position
    let kr, kc;
    for (let i = 0; i < 8; i++) {
      for (let j = 0; j < 8; j++) {
        if (board[i][j] && board[i][j][1] === 'k' && this.pieceColor(board[i][j]) === color) {
          kr = i; kc = j;
        }
      }
    }
    return !this.isAttacked(kr, kc, other(color), board);
  }

  // ---- Attack Detection ----
  isSquareAttacked(r, c, byColor) {
    return this.isAttacked(r, c, byColor, this.board);
  }

  isAttacked(r, c, byColor, board) {
    const opp = byColor;
    // Knight attack
    const knightD = [[-2,-1],[-2,1],[-1,-2],[-1,2],[1,-2],[1,2],[2,-1],[2,1]];
    for (const [dr, dc] of knightD) {
      const nr = r+dr, nc = c+dc;
      if (nr < 0 || nr > 7 || nc < 0 || nc > 7) continue;
      const p = board[nr][nc];
      if (p && this.pieceColor(p) === opp && p[1] === 'n') return true;
    }
    // King attack
    const kingD = [[-1,-1],[-1,0],[-1,1],[0,-1],[0,1],[1,-1],[1,0],[1,1]];
    for (const [dr, dc] of kingD) {
      const nr = r+dr, nc = c+dc;
      if (nr < 0 || nr > 7 || nc < 0 || nc > 7) continue;
      const p = board[nr][nc];
      if (p && this.pieceColor(p) === opp && p[1] === 'k') return true;
    }
    // Pawn attack
    const pawnDir = opp === 'white' ? 1 : -1;
    for (const dc of [-1, 1]) {
      const nr = r+pawnDir, nc = c+dc;
      if (nr < 0 || nr > 7 || nc < 0 || nc > 7) continue;
      const p = board[nr][nc];
      if (p && this.pieceColor(p) === opp && p[1] === 'p') return true;
    }
    // Rook/queen straight
    const rookDirs = [[-1,0],[1,0],[0,-1],[0,1]];
    for (const [dr, dc] of rookDirs) {
      let nr = r+dr, nc = c+dc;
      while (nr >= 0 && nr <= 7 && nc >= 0 && nc <= 7) {
        const p = board[nr][nc];
        if (p) {
          if (this.pieceColor(p) === opp && (p[1] === 'r' || p[1] === 'q')) return true;
          break;
        }
        nr += dr; nc += dc;
      }
    }
    // Bishop/queen diagonal
    const bishopDirs = [[-1,-1],[-1,1],[1,-1],[1,1]];
    for (const [dr, dc] of bishopDirs) {
      let nr = r+dr, nc = c+dc;
      while (nr >= 0 && nr <= 7 && nc >= 0 && nc <= 7) {
        const p = board[nr][nc];
        if (p) {
          if (this.pieceColor(p) === opp && (p[1] === 'b' || p[1] === 'q')) return true;
          break;
        }
        nr += dr; nc += dc;
      }
    }
    return false;
  }

  isInCheck(color) {
    for (let r = 0; r < 8; r++) {
      for (let c = 0; c < 8; c++) {
        const p = this.board[r][c];
        if (p && this.pieceColor(p) === color && p[1] === 'k') {
          return this.isSquareAttacked(r, c, other(color));
        }
      }
    }
    return false;
  }

  hasAnyLegalMove(color) {
    for (let r = 0; r < 8; r++) {
      for (let c = 0; c < 8; c++) {
        const p = this.board[r][c];
        if (p && this.pieceColor(p) === color) {
          if (this.getLegalMoves(r, c).length > 0) return true;
        }
      }
    }
    return false;
  }

  // ---- Undo ----
  undo() {
    if (this.history.length === 0 || this.gameOver) return;
    const state = this.history.pop();
    this.board = state.board;
    this.capturedWhite = state.capturedWhite;
    this.capturedBlack = state.capturedBlack;
    this.castlingRights = state.castlingRights;
    this.enPassantTarget = state.enPassantTarget;
    this.halfMoveClock = state.halfMoveClock;
    this.turn = other(this.turn);
    this.isCheck = this.isInCheck(this.turn);
    this.selected = null;
    this.legalMoves = [];
    if (this.lastMove && this.history.length > 0) {
      const prev = this.history[this.history.length - 1];
      // Try to restore last move from previous state
      this.lastMove = null;
    }
    this.render();
  }

  // ---- Reset ----
  reset() {
    this.board = this.getInitialBoard();
    this.turn = 'white';
    this.selected = null;
    this.legalMoves = [];
    this.capturedWhite = [];
    this.capturedBlack = [];
    this.history = [];
    this.lastMove = null;
    this.castlingRights = {WK:true, WQ:true, BK:true, BQ:true};
    this.enPassantTarget = null;
    this.halfMoveClock = 0;
    this.isCheck = false;
    this.gameOver = false;
    this.pendingPromotion = null;
    this.render();
  }

  // ---- Sound (Web Audio API) ----
  playSound(type) {
    try {
      if (!this.audio) this.audio = new (window.AudioContext || window.webkitAudioContext)();
      const ctx = this.audio;
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.connect(gain);
      gain.connect(ctx.destination);
      const now = ctx.currentTime;
      switch(type) {
        case 'move':
          osc.frequency.setValueAtTime(440, now);
          osc.frequency.exponentialRampToValueAtTime(220, now + 0.1);
          gain.gain.setValueAtTime(0.15, now);
          gain.gain.exponentialRampToValueAtTime(0.001, now + 0.1);
          osc.start(now); osc.stop(now + 0.1);
          break;
        case 'capture':
          osc.frequency.setValueAtTime(300, now);
          osc.frequency.exponentialRampToValueAtTime(150, now + 0.15);
          gain.gain.setValueAtTime(0.2, now);
          gain.gain.exponentialRampToValueAtTime(0.001, now + 0.15);
          osc.start(now); osc.stop(now + 0.15);
          break;
        case 'check':
          osc.type = 'square';
          osc.frequency.setValueAtTime(600, now);
          osc.frequency.setValueAtTime(400, now + 0.1);
          gain.gain.setValueAtTime(0.15, now);
          gain.gain.exponentialRampToValueAtTime(0.001, now + 0.25);
          osc.start(now); osc.stop(now + 0.25);
          break;
        case 'promote':
          osc.type = 'triangle';
          osc.frequency.setValueAtTime(440, now);
          osc.frequency.setValueAtTime(660, now + 0.1);
          osc.frequency.setValueAtTime(880, now + 0.2);
          gain.gain.setValueAtTime(0.2, now);
          gain.gain.exponentialRampToValueAtTime(0.001, now + 0.35);
          osc.start(now); osc.stop(now + 0.35);
          break;
        case 'gameover':
          osc.type = 'sawtooth';
          osc.frequency.setValueAtTime(300, now);
          osc.frequency.setValueAtTime(200, now + 0.2);
          osc.frequency.setValueAtTime(100, now + 0.4);
          gain.gain.setValueAtTime(0.15, now);
          gain.gain.exponentialRampToValueAtTime(0.001, now + 0.6);
          osc.start(now); osc.stop(now + 0.6);
          break;
      }
    } catch(e) {}
  }
}

function hideGameOver() {
  document.getElementById('game-over-modal').classList.remove('show');
}
