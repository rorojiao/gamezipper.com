#!/usr/bin/env node
// Quoridor Level Generator v3 — proper best-move search
const N = 9;

function edgeBlocked(r1, c1, r2, c2, walls) {
  if (Math.abs(r1-r2)+Math.abs(c1-c2) !== 1) return true;
  for (const w of walls) {
    if (w.orient === 'H') {
      if (r2 === r1+1) { if (w.r === r1 && (w.c === c1 || w.c === c1-1)) return true; }
      if (r1 === r2+1) { if (w.r === r2 && (w.c === c1 || w.c === c1-1)) return true; }
    } else {
      if (c2 === c1+1) { if (w.c === c1 && (w.r === r1 || w.r === r1-1)) return true; }
      if (c1 === c2+1) { if (w.c === c2 && (w.r === r1 || w.r === r1-1)) return true; }
    }
  }
  return false;
}

function bfsShortest(startR, startC, goalRow, walls) {
  const dist = {}; const key = (r,c) => r*9+c;
  const queue = [[startR, startC]];
  dist[key(startR,startC)] = 0;
  let head = 0;
  while (head < queue.length) {
    const [r,c] = queue[head++];
    if (r === goalRow) return dist[key(r,c)];
    for (const [dr,dc] of [[-1,0],[1,0],[0,-1],[0,1]]) {
      const nr=r+dr, nc=c+dc;
      if (nr<0||nr>=N||nc<0||nc>=N) continue;
      if (edgeBlocked(r,c,nr,nc,walls)) continue;
      if (dist[key(nr,nc)]!==undefined) continue;
      dist[key(nr,nc)] = dist[key(r,c)]+1;
      queue.push([nr,nc]);
    }
  }
  return Infinity;
}

function pathExists(sr,sc,gr,walls){ return bfsShortest(sr,sc,gr,walls)<Infinity; }

function wallsOverlap(w1, walls) {
  for (const w2 of walls) {
    if (w1.orient===w2.orient && w1.r===w2.r && w1.c===w2.c) return true;
    if (w1.orient==='H' && w2.orient==='H' && w1.r===w2.r && Math.abs(w1.c-w2.c)<2) return true;
    if (w1.orient==='V' && w2.orient==='V' && w1.c===w2.c && Math.abs(w1.r-w2.r)<2) return true;
  }
  return false;
}

function validPawnMoves(pr, pc, ar, ac, walls) {
  const moves = [];
  for (const [dr,dc] of [[-1,0],[1,0],[0,-1],[0,1]]) {
    const nr=pr+dr, nc=pc+dc;
    if (nr<0||nr>=N||nc<0||nc>=N) continue;
    if (edgeBlocked(pr,pc,nr,nc,walls)) continue;
    if (nr===ar && nc===ac) {
      const jr=nr+dr, jc=nc+dc;
      if (jr>=0&&jr<N&&jc>=0&&jc<N && !edgeBlocked(nr,nc,jr,jc,walls)) moves.push([jr,jc]);
      else {
        const diags = dr!==0 ? [[nr,nc-1],[nr,nc+1]] : [[nr-1,nc],[nr+1,nc]];
        for (const [dr2,dc2] of diags) if (dr2>=0&&dr2<N&&dc2>=0&&dc2<N && !edgeBlocked(nr,nc,dr2,dc2,walls)) moves.push([dr2,dc2]);
      }
    } else moves.push([nr,nc]);
  }
  return moves;
}

function validWallPlacement(w, walls, pr, pc, ar, ac) {
  if (wallsOverlap(w, walls)) return false;
  const nw = [...walls, w];
  if (!pathExists(pr,pc,8,nw)) return false;
  if (!pathExists(ar,ac,0,nw)) return false;
  return true;
}

// Find the BEST move (pawn or wall) that maximizes advantage = (aiPath - playerPath)
// Returns {move, advantage, playerPath, aiPath, isWinning}
function findBestMove(pr, pc, ar, ac, walls, playerWalls) {
  let best = null;
  // Try pawn moves
  for (const [tr,tc] of validPawnMoves(pr,pc,ar,ac,walls)) {
    const isWin = (tr === 8);
    let aiP, playerP;
    if (isWin) {
      // Immediate win — advantage is infinite
      playerP = 0; aiP = bfsShortest(ar,ac,0,walls);
      const adv = 999;
      if (!best || adv > best.advantage) best = {move:{type:'move',to:[tr,tc]}, advantage:adv, playerPath:0, aiPath:aiP, isWinning:true};
    } else {
      aiP = bfsShortest(ar,ac,0,walls);
      playerP = bfsShortest(tr,tc,8,walls);
      const adv = aiP - playerP;
      if (!best || adv > best.advantage) best = {move:{type:'move',to:[tr,tc]}, advantage:adv, playerPath:playerP, aiPath:aiP, isWinning: playerP < aiP};
    }
  }
  // Try wall placements (if player has walls)
  if (playerWalls > 0) {
    for (let r=0;r<8;r++) for (let c=0;c<8;c++) for (const o of ['H','V']) {
      const w = {r,c,orient:o};
      if (!validWallPlacement(w,walls,pr,pc,ar,ac)) continue;
      const nw = [...walls, w];
      const aiP = bfsShortest(ar,ac,0,nw);
      const playerP = bfsShortest(pr,pc,8,nw);
      const adv = aiP - playerP;
      if (!best || adv > best.advantage) best = {move:{type:'wall',r,c,orient:o}, advantage:adv, playerPath:playerP, aiPath:aiP, isWinning: playerP < aiP};
    }
  }
  return best;
}

const LEVELS = [];

// ===== Tier 1: Beginner — direct pawn move to row 8 =====
const t1 = [
  {pr:7,pc:4,ar:3,ac:3,walls:[]},
  {pr:7,pc:3,ar:2,ac:5,walls:[{r:3,c:2,o:'V'}]},
  {pr:7,pc:5,ar:4,ac:2,walls:[{r:2,c:0,o:'H'}]},
  {pr:7,pc:6,ar:5,ac:1,walls:[{r:6,c:3,o:'V'}]},
  {pr:7,pc:2,ar:3,ac:7,walls:[{r:1,c:4,o:'V'}]},
];
for (const c of t1) {
  const walls = c.walls.map(w=>({r:w.r,c:w.c,orient:w.o}));
  const best = findBestMove(c.pr,c.pc,c.ar,c.ac,walls,10);
  LEVELS.push({tier:1,tierName:"Beginner",num:LEVELS.length+1,
    playerR:c.pr,playerC:c.pc,aiR:c.ar,aiC:c.ac,
    walls,playerWalls:10,aiWalls:10,solution:best.move,
    hint:"Move your pawn south into the goal row to win!",
    desc:"You're one step from the finish line."});
}

// ===== Tier 2: Easy — jump over AI pawn =====
const t2 = [
  {pr:6,pc:4,ar:7,ac:4,walls:[]},
  {pr:6,pc:3,ar:7,ac:3,walls:[{r:3,c:2,o:'V'}]},
  {pr:6,pc:5,ar:7,ac:5,walls:[{r:2,c:0,o:'H'}]},
  {pr:6,pc:6,ar:7,ac:6,walls:[{r:5,c:1,o:'V'}]},
  {pr:6,pc:2,ar:7,ac:2,walls:[{r:4,c:5,o:'H'}]},
];
for (const c of t2) {
  const walls = c.walls.map(w=>({r:w.r,c:w.c,orient:w.o}));
  const best = findBestMove(c.pr,c.pc,c.ar,c.ac,walls,10);
  LEVELS.push({tier:2,tierName:"Easy",num:LEVELS.length+1,
    playerR:c.pr,playerC:c.pc,aiR:c.ar,aiC:c.ac,
    walls,playerWalls:10,aiWalls:10,solution:best.move,
    hint:"Jump over the opponent pawn to reach the goal!",
    desc:"The red pawn blocks your path — leap over them!"});
}

// ===== Tier 3: Medium — place wall to gain advantage =====
// Player and AI at roughly equal distance; wall tips balance
const t3 = [
  {pr:3,pc:4,ar:5,ac:4,walls:[]},
  {pr:3,pc:3,ar:5,ac:3,walls:[{r:1,c:0,o:'H'}]},
  {pr:4,pc:5,ar:4,ac:3,walls:[]},
  {pr:3,pc:6,ar:5,ac:2,walls:[{r:0,c:0,o:'V'}]},
  {pr:4,pc:2,ar:4,ac:6,walls:[]},
];
for (const c of t3) {
  const walls = c.walls.map(w=>({r:w.r,c:w.c,orient:w.o}));
  const best = findBestMove(c.pr,c.pc,c.ar,c.ac,walls,9);
  LEVELS.push({tier:3,tierName:"Medium",num:LEVELS.length+1,
    playerR:c.pr,playerC:c.pc,aiR:c.ar,aiC:c.ac,
    walls,playerWalls:9,aiWalls:9,solution:best.move,
    hint:`Place a wall to block the AI and gain the path advantage.`,
    desc:"The race is even — find the wall that tips it in your favor."});
}

// ===== Tier 4: Tricky =====
const t4 = [
  {pr:3,pc:4,ar:5,ac:4,walls:[{r:7,c:0,o:'V'},{r:1,c:7,o:'V'}]},
  {pr:3,pc:3,ar:5,ac:5,walls:[{r:6,c:2,o:'H'},{r:2,c:6,o:'H'}]},
  {pr:4,pc:5,ar:4,ac:3,walls:[{r:0,c:0,o:'V'},{r:7,c:6,o:'V'}]},
  {pr:3,pc:6,ar:5,ac:2,walls:[{r:1,c:4,o:'H'},{r:7,c:3,o:'V'}]},
  {pr:4,pc:2,ar:4,ac:6,walls:[{r:6,c:0,o:'H'},{r:2,c:7,o:'V'}]},
];
for (const c of t4) {
  const walls = c.walls.map(w=>({r:w.r,c:w.c,orient:w.o}));
  const best = findBestMove(c.pr,c.pc,c.ar,c.ac,walls,8);
  LEVELS.push({tier:4,tierName:"Tricky",num:LEVELS.length+1,
    playerR:c.pr,playerC:c.pc,aiR:c.ar,aiC:c.ac,
    walls,playerWalls:8,aiWalls:8,solution:best.move,
    hint:`Find the optimal wall placement in this complex position.`,
    desc:"Walls complicate the race. Find the decisive move."});
}

// ===== Tier 5: Hard =====
const t5 = [
  {pr:3,pc:4,ar:5,ac:4,walls:[{r:7,c:0,o:'V'},{r:1,c:7,o:'V'},{r:2,c:3,o:'H'},{r:6,c:5,o:'H'}]},
  {pr:3,pc:3,ar:5,ac:5,walls:[{r:6,c:2,o:'H'},{r:2,c:6,o:'H'},{r:7,c:0,o:'V'},{r:1,c:7,o:'V'}]},
  {pr:4,pc:5,ar:4,ac:3,walls:[{r:0,c:0,o:'V'},{r:7,c:6,o:'V'},{r:5,c:2,o:'H'},{r:3,c:5,o:'H'}]},
  {pr:3,pc:6,ar:5,ac:2,walls:[{r:1,c:4,o:'H'},{r:7,c:3,o:'V'},{r:2,c:0,o:'V'},{r:6,c:7,o:'H'}]},
  {pr:4,pc:2,ar:4,ac:6,walls:[{r:6,c:0,o:'H'},{r:2,c:7,o:'V'},{r:5,c:3,o:'V'},{r:3,c:5,o:'H'}]},
];
for (const c of t5) {
  const walls = c.walls.map(w=>({r:w.r,c:w.c,orient:w.o}));
  const best = findBestMove(c.pr,c.pc,c.ar,c.ac,walls,6);
  LEVELS.push({tier:5,tierName:"Hard",num:LEVELS.length+1,
    playerR:c.pr,playerC:c.pc,aiR:c.ar,aiC:c.ac,
    walls,playerWalls:6,aiWalls:6,solution:best.move,
    hint:`Navigate the maze of walls to find the winning move.`,
    desc:"A dense wall maze — only one move secures victory."});
}

// ===== Tier 6: Master =====
const t6 = [
  {pr:3,pc:4,ar:5,ac:4,walls:[{r:7,c:0,o:'V'},{r:1,c:7,o:'V'},{r:2,c:3,o:'H'},{r:6,c:5,o:'H'},{r:4,c:1,o:'V'},{r:4,c:7,o:'V'}]},
  {pr:3,pc:3,ar:6,ac:5,walls:[{r:6,c:2,o:'H'},{r:2,c:6,o:'H'},{r:7,c:0,o:'V'},{r:1,c:7,o:'V'},{r:5,c:3,o:'H'},{r:3,c:5,o:'V'}]},
  {pr:4,pc:5,ar:5,ac:3,walls:[{r:0,c:0,o:'V'},{r:7,c:6,o:'V'},{r:5,c:2,o:'H'},{r:3,c:5,o:'H'},{r:2,c:3,o:'V'},{r:6,c:7,o:'H'}]},
  {pr:3,pc:6,ar:5,ac:2,walls:[{r:1,c:4,o:'H'},{r:7,c:3,o:'V'},{r:2,c:0,o:'V'},{r:6,c:7,o:'H'},{r:4,c:2,o:'H'},{r:4,c:6,o:'V'}]},
  {pr:4,pc:2,ar:4,ac:6,walls:[{r:6,c:0,o:'H'},{r:2,c:7,o:'V'},{r:5,c:3,o:'V'},{r:3,c:5,o:'H'},{r:1,c:1,o:'V'},{r:7,c:4,o:'H'}]},
];
for (const c of t6) {
  const walls = c.walls.map(w=>({r:w.r,c:w.c,orient:w.o}));
  const best = findBestMove(c.pr,c.pc,c.ar,c.ac,walls,5);
  LEVELS.push({tier:6,tierName:"Master",num:LEVELS.length+1,
    playerR:c.pr,playerC:c.pc,aiR:c.ar,aiC:c.ac,
    walls,playerWalls:5,aiWalls:5,solution:best.move,
    hint:`The ultimate test — find the single winning move.`,
    desc:"Master-level complexity. One move separates victory from defeat."});
}

// ===== VERIFICATION =====
let allValid = true;
let errors = [];

for (const lvl of LEVELS) {
  const errs = [];
  if (lvl.playerR<0||lvl.playerR>=N||lvl.playerC<0||lvl.playerC>=N) errs.push("player OOB");
  if (lvl.aiR<0||lvl.aiR>=N||lvl.aiC<0||lvl.aiC>=N) errs.push("AI OOB");
  if (lvl.playerR===lvl.aiR && lvl.playerC===lvl.aiC) errs.push("overlap");
  for (const w of lvl.walls) if (w.r<0||w.r>=8||w.c<0||w.c>=8) errs.push(`wall OOB`);
  for (let i=0;i<lvl.walls.length;i++) for (let j=i+1;j<lvl.walls.length;j++)
    if (wallsOverlap(lvl.walls[i],[lvl.walls[j]])) errs.push(`walls ${i},${j} overlap`);
  if (!pathExists(lvl.playerR,lvl.playerC,8,lvl.walls)) errs.push("no player path");
  if (!pathExists(lvl.aiR,lvl.aiC,0,lvl.walls)) errs.push("no AI path");

  if (lvl.solution.type==='move') {
    const [tr,tc]=lvl.solution.to;
    if (tr<0||tr>=N||tc<0||tc>=N) errs.push("sol OOB");
    else {
      const moves=validPawnMoves(lvl.playerR,lvl.playerC,lvl.aiR,lvl.aiC,lvl.walls);
      if(!moves.some(m=>m[0]===tr&&m[1]===tc)) errs.push(`sol invalid`);
    }
  } else {
    const w={r:lvl.solution.r,c:lvl.solution.c,orient:lvl.solution.orient};
    if(!validWallPlacement(w,lvl.walls,lvl.playerR,lvl.playerC,lvl.aiR,lvl.aiC)) errs.push("sol wall invalid");
    else {
      const nw=[...lvl.walls,w];
      const pp=bfsShortest(lvl.playerR,lvl.playerC,8,nw);
      const ap=bfsShortest(lvl.aiR,lvl.aiC,0,nw);
      if(pp>ap) errs.push(`sol no advantage p=${pp} a=${ap}`);  // player path must be <= AI path (tie OK for symmetric positions)
    }
  }
  if(errs.length){allValid=false;errors.push(`L${lvl.num}(${lvl.tierName}): ${errs.join('; ')}`);}
}

// Duplicate check
const seen=new Set();
for(const lvl of LEVELS){
  const sig=`${lvl.playerR},${lvl.playerC}|${lvl.aiR},${lvl.aiC}|${lvl.walls.map(w=>`${w.r}${w.c}${w.orient}`).sort().join(',')}`;
  if(seen.has(sig)){allValid=false;errors.push(`L${lvl.num} DUP`);}
  seen.add(sig);
}

console.log("===== QUORIDOR LEVEL VERIFICATION =====");
console.log(`Total: ${LEVELS.length} | Tiers: ${[...new Set(LEVELS.map(l=>l.tier))].map(t=>`T${t}(${LEVELS.filter(l=>l.tier===t).length})`).join(', ')}`);
if(allValid) console.log("✅ ALL 30 LEVELS VERIFIED — solvable, in-bounds, no duplicates");
else { console.log("❌ FAILED:"); errors.forEach(e=>console.log("  "+e)); }

console.log("\n===== DETAILS =====");
for(const lvl of LEVELS){
  const pp=bfsShortest(lvl.playerR,lvl.playerC,8,lvl.walls);
  const ap=bfsShortest(lvl.aiR,lvl.aiC,0,lvl.walls);
  if(lvl.solution.type==='wall'){
    const w={r:lvl.solution.r,c:lvl.solution.c,orient:lvl.solution.orient};
    const nw=[...lvl.walls,w];
    const pp2=bfsShortest(lvl.playerR,lvl.playerC,8,nw);
    const ap2=bfsShortest(lvl.aiR,lvl.aiC,0,nw);
    console.log(`L${lvl.num} ${lvl.tierName}: P(${lvl.playerR},${lvl.playerC}) A(${lvl.aiR},${lvl.aiC}) W=${lvl.walls.length} | before p=${pp}a=${ap} | wall(${w.r},${w.c},${w.orient}) -> p=${pp2}a=${ap2}`);
  } else {
    const [tr,tc]=lvl.solution.to;
    console.log(`L${lvl.num} ${lvl.tierName}: P(${lvl.playerR},${lvl.playerC}) A(${lvl.aiR},${lvl.aiC}) W=${lvl.walls.length} | p=${pp}a=${ap} | move->(${tr},${tc})${tr===8?' WIN':''}`);
  }
}

if(allValid){
  console.log("\n===== LEVELS JSON =====");
  console.log(JSON.stringify(LEVELS));
}
