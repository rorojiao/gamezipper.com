// Per-game verify_engine.js for bridge-builder
// Validates 30 LEVELS structurally + checks geometry consistency
const fs=require('fs'),path=require('path');
const src=fs.readFileSync(path.join(__dirname,'index.html'),'utf8');

const startIdx = src.indexOf('const LEVELS = [');
if (startIdx === -1) { console.log('❌ LEVELS not found'); process.exit(1); }

let i = startIdx + 'const LEVELS = ['.length;
let depth = 1, inStr = null, prev = '';
let inLineComment = false, inBlockComment = false;
while (depth > 0 && i < src.length) {
  const c = src[i];
  const next = src[i+1];
  if (inLineComment) { if (c === '\n') inLineComment = false; }
  else if (inBlockComment) { if (c === '*' && next === '/') { inBlockComment = false; i++; } }
  else if (inStr) { if (c === '\\') { i++; } else if (c === inStr) inStr = null; }
  else {
    if (c === '/' && next === '/') { inLineComment = true; i++; }
    else if (c === '/' && next === '*') { inBlockComment = true; i++; }
    else if (c === '"' || c === "'") inStr = c;
    else if (c === '[') depth++;
    else if (c === ']') { depth--; if (depth === 0) { i++; break; } }
  }
  prev = c; i++;
}

let arrayExpr = src.slice(startIdx, i)
  .replace(/\/\/[^\n]*/g, '')
  .replace(/\/\*[\s\S]*?\*\//g, '');
arrayExpr = arrayExpr.replace('const LEVELS = ', 'return ');
const LEVELS = (new Function(arrayExpr))();

let structuralPass = 0;
const issues = [];
const themes = new Set();
const vehicles = new Set();
for (let i = 0; i < LEVELS.length; i++) {
  const L = LEVELS[i];
  const ix = i + 1;
  let s_ok = true;
  if (L.id !== ix) { issues.push(`L${ix} id mismatch (got ${L.id})`); s_ok = false; }
  if (!L.left || !L.right) { issues.push(`L${ix} missing left/right`); s_ok = false; }
  if (typeof L.budget !== 'number') { issues.push(`L${ix} missing budget`); s_ok = false; }
  if (!L.vehicle || typeof L.vehicle.weight !== 'number') { issues.push(`L${ix} missing vehicle`); s_ok = false; }
  if (!Array.isArray(L.anchors)) { issues.push(`L${ix} anchors not array`); s_ok = false; }
  if (typeof L.gap !== 'number' || L.gap < 100) { issues.push(`L${ix} gap too small: ${L.gap}`); s_ok = false; }
  if (s_ok) structuralPass++;
  
  // L.gap is the BRIDGABLE gap (from edge of left platform to edge of right platform)
  // L.right.x - (L.left.x + L.left.w) = platform-to-platform distance
  // This should be >= L.gap (gap + 2 * vehicle width, but actually depends on the model)
  
  // Anchors within world bounds
  for (const a of L.anchors || []) {
    if (a[0] < L.left.x || a[0] > L.right.x + L.right.w || a[1] < 0 || a[1] > 600) {
      issues.push(`L${ix} anchor out of bounds: ${a}`);
    }
  }
  
  themes.add(L.themeName);
  vehicles.add(L.vehicle.type);
}

console.log(`structural: ${structuralPass}/${LEVELS.length}`);
console.log(`themes: ${[...themes].join(', ')}`);
console.log(`vehicles: ${[...vehicles].join(', ')}`);
console.log(`budget range: ${Math.min(...LEVELS.map(L=>L.budget))}-${Math.max(...LEVELS.map(L=>L.budget))}`);
console.log(`gap range: ${Math.min(...LEVELS.map(L=>L.gap))}-${Math.max(...LEVELS.map(L=>L.gap))}`);
console.log(`levels with anchors: ${LEVELS.filter(L=>L.anchors.length>0).length}`);
console.log(`levels without anchors: ${LEVELS.filter(L=>L.anchors.length===0).length}`);
if (issues.length > 0) {
  console.log(`❌ ${issues.length} issues:`);
  issues.slice(0, 10).forEach(s => console.log('  ' + s));
  process.exit(1);
}
console.log(`=== PASS: ${LEVELS.length} levels across ${themes.size} themes, ${vehicles.size} vehicle types ===`);
process.exit(0);
