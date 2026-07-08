const fs = require('fs');
const path = require('path');
const vm = require('vm');
const html = fs.readFileSync(path.join(__dirname, 'index.html'), 'utf8');
const m = html.match(/const LEVELS = (\[[\s\S]*?\]);\nconst DIRS/);
if (!m) throw new Error('LEVELS not found in index.html');
const ctx = vm.createContext({});
vm.runInContext('LEVELS=' + m[1], ctx);
const LEVELS = ctx.LEVELS;
const DIRS = {U:[-1,0],D:[1,0],L:[0,-1],R:[0,1]};
function key(r,c){return r+','+c;}
function wallsSet(L){return new Set((L.walls||[]).map(x=>key(x[0],x[1])));}
function findNodeAt(L,r,c){for(let i=0;i<L.nodes.length;i++){if(L.nodes[i].r===r && L.nodes[i].c===c)return i;}return -1;}
function ray(L,nodeIndex,dir){const n=L.nodes[nodeIndex];const d=DIRS[dir];const walls=wallsSet(L);let cells=[];let r=n.r,c=n.c;for(let i=0;i<n.n;i++){r+=d[0];c+=d[1];if(r<0||c<0||r>=L.size||c>=L.size)return {ok:false,reason:'outside',cells};if(walls.has(key(r,c)))return {ok:false,reason:'blocked',cells};cells.push([r,c]);}if(r===L.goal[0]&&c===L.goal[1])return {ok:true,target:'goal',cells};const idx=findNodeAt(L,r,c);if(idx>=0)return {ok:true,target:idx,cells};return {ok:false,reason:'empty',cells};}
function edgesFrom(L,nodeIndex,visited){const out=[];for(const d of Object.keys(DIRS)){const r=ray(L,nodeIndex,d);if(r.ok && (r.target==='goal'||!visited.has(r.target)))out.push([d,r.target]);}return out;}
function countSolutions(L,cap=3){let count=0;let first=[];function dfs(idx,seen,path){if(count>=cap)return;for(const [d,to] of edgesFrom(L,idx,seen)){if(to==='goal'){count++; if(!first.length) first=path.concat([[idx,d]]); if(count>=cap)return;}else if(!seen.has(to)){const ns=new Set(seen);ns.add(to);dfs(to,ns,path.concat([[idx,d]]));}}}dfs(0,new Set([0]),[]);return {count, first};}
let problems=[];
for (const L of LEVELS) {
  if (!L.id || !L.size || !Array.isArray(L.nodes) || !Array.isArray(L.solution)) problems.push(`L${L.id}: malformed`);
  const cells = new Set();
  for (let r=0;r<L.size;r++) for (let c=0;c<L.size;c++) cells.add(key(r,c));
  for (const w of L.walls||[]) if (!cells.has(key(w[0],w[1]))) problems.push(`L${L.id}: wall OOB ${w}`);
  for (const n of L.nodes) {
    if (!cells.has(key(n.r,n.c))) problems.push(`L${L.id}: node OOB ${n.id}`);
    if (!(n.n>=1 && n.n<L.size)) problems.push(`L${L.id}: bad node length ${n.id}:${n.n}`);
  }
  const res = countSolutions(L,3);
  if (res.count !== 1) problems.push(`L${L.id}: solutions=${res.count}`);
  const sol = JSON.stringify(res.first);
  const expected = JSON.stringify(L.solution.map(s=>[s.node,s.dir]));
  if (sol !== expected) problems.push(`L${L.id}: embedded solution mismatch got ${sol} expected ${expected}`);
  if (res.first.length !== L.par) problems.push(`L${L.id}: par mismatch ${res.first.length} vs ${L.par}`);
}
if (problems.length) { console.error('FAIL'); console.error(problems.join('\n')); process.exit(1); }
console.log(`✅ verify_independent: ${LEVELS.length}/${LEVELS.length} levels unique and solution-matched`);
console.log('tiers:', [...new Set(LEVELS.map(l=>l.tier))].join(', '));
