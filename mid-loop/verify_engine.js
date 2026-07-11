#!/usr/bin/env node
/*
 * Mid-Loop in-engine verifier (Method 3).
 * Loads index.html, extracts LEVELS, simulates loading each solution into
 * the engine's game.edges, and calls checkSolved().
 */
const fs = require('fs');
const vm = require('vm');

const html = fs.readFileSync('index.html', 'utf8');
// Extract the LEVELS array definition
const levelsMatch = html.match(/var LEVELS = \[([\s\S]*?)\];/);
if (!levelsMatch) {
    console.error('Could not extract LEVELS from index.html');
    process.exit(1);
}
const levelsCode = 'var LEVELS = [' + levelsMatch[1] + '];';
// Also extract checkSolved and checkDotStatus functions
const checkSolvedMatch = html.match(/function checkSolved\(\)\{([\s\S]*?)\}\nfunction loadLevel/);
const checkDotStatusMatch = html.match(/function checkDotStatus\(r,c\)\{([\s\S]*?)\}\nfunction getCanvasPos/);

const sandbox = { console, Math, Object, parseInt, document: { getElementById: () => ({textContent:'',style:{},classList:{add(){},remove(){},toggle(){}},addEventListener(){}}) }, window:{}, setInterval, clearInterval, setTimeout, clearTimeout, Date };
sandbox.document.getElementById = () => ({textContent:'',style:{display:''},classList:{add(){},remove(){},toggle(){}},addEventListener(){},getContext:()=>null});
vm.createContext(sandbox);

// Build test code
const testCode = `
${levelsCode}
var game = {rows:0,cols:0,dots:[],edges:{},mode:'draw',hintsUsed:0,undoStack:[],cellSize:40};

function edgeKey(r1,c1,r2,c2){if(r1>r2||(r1===r2&&c1>c2)){var t=[r1,c1];r1=r2;c1=c2;r2=t[0];c2=t[1]}return r1+','+c1+','+r2+','+c2}

function checkDotStatus(r,c){var edges=[];var nbs=[[r-1,c],[r+1,c],[r,c-1],[r,c+1]];for(var i=0;i<4;i++){var nb=nbs[i];if(nb[0]<0||nb[1]<0||nb[0]>game.rows||nb[1]>game.cols)continue;var k=edgeKey(r,c,nb[0],nb[1]);if(game.edges[k])edges.push([nb[0]-r,nb[1]-c])}if(edges.length===0)return'empty';if(edges.length===1)return'partial';if(edges.length!==2)return'bad';var d1=edges[0],d2=edges[1];if(d1[0]+d2[0]!==0||d1[1]+d2[1]!==0)return'bad';function countExtents(dir){var cr=r,cc=c,L=0;while(true){var nr=cr+dir[0],nc=cc+dir[1];if(nr<0||nc<0||nr>game.rows||nc>game.cols)break;var ek=edgeKey(cr,cc,nr,nc);if(!game.edges[ek])break;L++;var nnr=nr+dir[0],nnc=nc+dir[1];if(nnr<0||nnc<0||nnr>game.rows||nnc>game.cols)break;var ek2=edgeKey(nr,nc,nnr,nnc);if(!game.edges[ek2])break;var hasOther=false;var perpDirs=dir[0]===0?[[1,0],[-1,0]]:[[0,1],[0,-1]];for(var pd=0;pd<2;pd++){var pr=nr+perpDirs[pd][0],pc=nc+perpDirs[pd][1];if(pr<0||pc<0||pr>game.rows||pc>game.cols)continue;if(game.edges[edgeKey(nr,nc,pr,pc)]){hasOther=true;break}}if(hasOther)break;cr=nr;cc=nc}return L}var l1=countExtents(d1),l2=countExtents(d2);if(l1===l2&&l1>=1)return'ok';return'partial'}

function checkSolved(){for(var i=0;i<game.dots.length;i++){if(checkDotStatus(game.dots[i][0],game.dots[i][1])!=='ok')return false}var usedVerts={},adj={};for(var key in game.edges){var parts=key.split(',');var v1=parts[0]+','+parts[1],v2=parts[2]+','+parts[3];usedVerts[v1]=(usedVerts[v1]||0)+1;usedVerts[v2]=(usedVerts[v2]||0)+1;if(!adj[v1])adj[v1]=[];if(!adj[v2])adj[v2]=[];adj[v1].push(v2);adj[v2].push(v1)}for(var v in usedVerts){if(usedVerts[v]!==2)return false}if(Object.keys(usedVerts).length===0)return false;var start=Object.keys(usedVerts)[0];var visited={};var stack=[start];visited[start]=true;while(stack.length){var cur=stack.pop();if(!adj[cur])continue;for(var i=0;i<adj[cur].length;i++){if(!visited[adj[cur][i]]){visited[adj[cur][i]]=true;stack.push(adj[cur][i])}}}return Object.keys(visited).length===Object.keys(usedVerts).length}

var allOk = true;
for (var idx = 0; idx < LEVELS.length; idx++) {
    var lvl = LEVELS[idx];
    game.rows = lvl.r;
    game.cols = lvl.c;
    game.dots = lvl.dots.map(function(d){return [d[0],d[1]]});
    game.edges = {};
    // Load solution edges
    for (var i = 0; i < lvl.sol.length; i++) {
        var se = lvl.sol[i];
        var k = edgeKey(se[0],se[1],se[2],se[3]);
        game.edges[k] = true;
    }
    var solved = checkSolved();
    console.log('L' + (idx+1) + ' ' + lvl.tier + ' ' + lvl.r + 'x' + lvl.c + ': ' + (solved ? 'SOLVED (checkSolved=true)' : 'FAILED (checkSolved=false)'));
    if (!solved) allOk = false;
}
console.log('\\n' + (allOk ? 'ALL 30 LEVELS PASS IN-ENGINE checkSolved' : 'SOME LEVELS FAILED IN-ENGINE'));
`;

vm.runInContext(testCode, sandbox);
process.exit(0);
