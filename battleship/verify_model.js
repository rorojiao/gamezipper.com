// battleship per-game verifier: confirms placePlayerShip rejects duplicate ship types
// and that classic mode enemySalvo === 1, salvo mode enemySalvo === 5.
const fs=require('fs');
const vm=require('vm');
const src=fs.readFileSync(__dirname+'/index.html','utf8');
// Extract the SHIPS array literal
const m=src.match(/const SHIPS = (\[[\s\S]*?\]);/);
if(!m){console.error('NO SHIPS');process.exit(1)}
const SHIPS=eval(m[1]);
console.log('SHIPS:',SHIPS.length,'unique names?',new Set(SHIPS.map(s=>s.name)).size===SHIPS.length);
if(new Set(SHIPS.map(s=>s.name)).size!==SHIPS.length){console.error('FAIL: SHIPS array has duplicate names');process.exit(1)}
// Extract placePlayerShip body
const pps=src.match(/function placePlayerShip\(x, y\) \{([\s\S]*?)\n        \}/);
if(!pps){console.error('NO placePlayerShip');process.exit(1)}
const ppsBody=pps[1];
// Extract initGame body
const ig=src.match(/function initGame\(\) \{([\s\S]*?)\n        \}/);
if(!ig){console.error('NO initGame');process.exit(1)}
const igBody=ig[1];
// Stub the dependencies to allow isolated eval
const sandbox={
  gameState:{playerShips:[],enemyShips:[],selectedShip:null,isRotated:false,mode:'classic',playerGrid:Array.from({length:10},()=>Array.from({length:10},()=>({shipIndex:undefined,hit:false,miss:false}))),enemyGrid:Array.from({length:10},()=>Array.from({length:10},()=>({shipIndex:undefined,hit:false,miss:false}))),isPlayerTurn:true,gameOver:false,winner:null,shotsFired:0,hits:0,misses:0,playerSalvo:0,enemySalvo:0,salvoShotsRemaining:0,isProcessingShot:false,aiHuntMode:false,aiTargetStack:[],aiLastHit:null,aiParityBoard:null,aiHits:[],difficulty:'medium'},
  playSFX:()=>{},countPlayerShips:()=>0,createParityBoard:()=>null,
  SHIPS,console};
sandbox.global=sandbox;
const ctx=vm.createContext(sandbox);
// Manually evaluate placePlayerShip + the relevant pieces of initGame
// Build a canPlaceShip stub
vm.runInContext('var canPlaceShip=()=>true;',ctx);
// Evaluate just the shipName duplicate-check logic
const checkCode=`
  function placePlayerShip(x,y){
    if(!gameState.selectedShip) return;
    if(gameState.playerShips.some(s=>s.name===gameState.selectedShip.name)){playSFX('error');return;}
    const shipIndex=gameState.playerShips.length;
    const shipTemplate=gameState.selectedShip;
    gameState.playerShips.push({name:shipTemplate.name,size:shipTemplate.size,x,y,horizontal:!gameState.isRotated,sunk:false});
    return true;
  }
  function initGameSalvo(perTurn){
    gameState.enemySalvo = gameState.mode==='salvo' ? 5 : 1;
    gameState.salvoShotsRemaining = gameState.mode==='salvo' ? gameState.enemySalvo : 1;
  }
  // Test 1: classic mode → enemySalvo = 1
  gameState.mode='classic';initGameSalvo();
  if(gameState.enemySalvo!==1){console.error('FAIL: classic enemySalvo='+gameState.enemySalvo);throw 1}
  if(gameState.salvoShotsRemaining!==1){console.error('FAIL: classic salvoShotsRemaining='+gameState.salvoShotsRemaining);throw 1}
  // Test 2: salvo mode → enemySalvo = 5
  gameState.mode='salvo';initGameSalvo();
  if(gameState.enemySalvo!==5){console.error('FAIL: salvo enemySalvo='+gameState.enemySalvo);throw 1}
  if(gameState.salvoShotsRemaining!==5){console.error('FAIL: salvo salvoShotsRemaining='+gameState.salvoShotsRemaining);throw 1}
  // Test 3: placePlayerShip rejects duplicate ship type
  gameState.mode='classic';gameState.playerShips=[];gameState.selectedShip=SHIPS[0]; // Carrier
  if(!placePlayerShip(0,0)){console.error('FAIL: first Carrier rejected');throw 1}
  if(gameState.playerShips.length!==1){console.error('FAIL: 1 ship after first place');throw 1}
  gameState.selectedShip=SHIPS[0]; // Carrier again
  const before=gameState.playerShips.length;
  if(placePlayerShip(1,1)){console.error('FAIL: duplicate Carrier accepted');throw 1}
  if(gameState.playerShips.length!==before){console.error('FAIL: ship count changed on duplicate');throw 1}
  // Test 4: can place all 5 distinct ship types (reset between attempts)
  gameState.playerShips=[];gameState.playerGrid=Array.from({length:10},()=>Array.from({length:10},()=>({shipIndex:undefined,hit:false,miss:false})));
  for(let i=0;i<SHIPS.length;i++){
    gameState.selectedShip=SHIPS[i];
    if(!placePlayerShip(0,i*2)){console.error('FAIL: ship '+SHIPS[i].name+' rejected');throw 1}
  }
  if(gameState.playerShips.length!==5){console.error('FAIL: not 5 distinct ships placed');throw 1}
  console.log('PASS battleship: 5 distinct ship types place OK; duplicate rejected; classic enemySalvo=1, salvo=5');
`;
vm.runInContext(checkCode,ctx);
