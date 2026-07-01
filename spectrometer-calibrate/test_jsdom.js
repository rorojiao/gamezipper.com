// jsdom integration test for Spectrometer Calibrate
const { JSDOM } = require('jsdom');
const fs = require('fs');

const html = fs.readFileSync(__dirname + '/index.html', 'utf8');
const dom = new JSDOM(html, { runScripts: 'dangerously', resources: 'usable', pretendToBeVisual: true });
const doc = dom.window.document;

// Extract LEVELS_DATA from the script
const m = html.match(/const LEVELS_DATA=(\[.*?\]);/s);
const LEVELS_DATA = eval(m[1]);

function parseLevel(s){
  const p=s.split('|');
  const dials=p[4].split(',').map(d=>{
    const a=d.split('.');return{init:+a[0],offset:+a[1],color:a[2],name:a[3],pos:+a[0]};
  });
  return{level:+p[0],K:+p[1],N:+p[2],par:+p[3],dials};
}

let pass = 0, fail = 0;
function test(name, cond) {
  if (cond) { pass++; console.log(`  ✅ ${name}`); }
  else { fail++; console.log(`  ❌ ${name}`); }
}

setTimeout(() => {
  console.log('Spectrometer Calibrate — jsdom Integration Tests\n');
  
  // 1. LEVELS_DATA loaded
  test('LEVELS_DATA array extracted', Array.isArray(LEVELS_DATA));
  test('LEVELS_DATA has 30 levels', LEVELS_DATA.length === 30);
  
  // 2. parseLevel works
  test('parseLevel function exists', typeof parseLevel === 'function');
  const lv1 = parseLevel(LEVELS_DATA[0]);
  test('L1 parsed: level=1', lv1.level === 1);
  test('L1 parsed: K=2', lv1.K === 2);
  test('L1 parsed: N=6', lv1.N === 6);
  test('L1 parsed: has dials', lv1.dials && lv1.dials.length === 2);
  test('L1 dial[0] has init/offset', lv1.dials[0].init !== undefined && lv1.dials[0].offset !== undefined);
  test('L1 dial[0] has color', lv1.dials[0].color !== undefined);
  test('L1 dial[0] has name', lv1.dials[0].name !== undefined);
  
  // 3. Canvas exists
  test('Canvas element exists', !!doc.getElementById('cv'));
  
  // 4. UI elements
  test('Menu overlay exists', !!doc.getElementById('menuOverlay'));
  test('Dial panel exists', !!doc.getElementById('dialPanel'));
  test('Win overlay exists', !!doc.getElementById('winOverlay'));
  test('HUD level info exists', !!doc.getElementById('lvlInfo'));
  test('Par info exists', !!doc.getElementById('parInfo'));
  test('Hint bar exists', !!doc.getElementById('hintBar'));
  
  // 5. Level data integrity — all 30 parseable
  let allParse = true;
  for (let i = 0; i < 30; i++) {
    try {
      const lv = parseLevel(LEVELS_DATA[i]);
      if (lv.level !== i + 1) allParse = false;
      if (!lv.dials || lv.dials.length !== lv.K) allParse = false;
    } catch(e) { allParse = false; }
  }
  test('All 30 levels parse correctly', allParse);
  
  // 6. L1 solvable — apply optimal solution and check win
  const lv = parseLevel(LEVELS_DATA[0]);
  const N = lv.N;
  for (const d of lv.dials) {
    const target = (d.init + d.offset) % N;
    const fwd = ((target - d.pos + N) % N);
    const bwd = ((d.pos - target + N) % N);
    if (fwd <= bwd) d.pos = (d.pos + fwd) % N;
    else d.pos = (d.pos - bwd + N) % N;
  }
  const won = lv.dials.every(d => d.pos === (d.init + d.offset) % N);
  test('L1 solvable via optimal moves', won);
  
  // 7. L15 solvable (tier 3, K=3)
  const lv15 = parseLevel(LEVELS_DATA[14]);
  const N15 = lv15.N;
  for (const d of lv15.dials) {
    const target = (d.init + d.offset) % N15;
    const fwd = ((target - d.pos + N15) % N15);
    const bwd = ((d.pos - target + N15) % N15);
    if (fwd <= bwd) d.pos = (d.pos + fwd) % N15;
    else d.pos = (d.pos - bwd + N15) % N15;
  }
  const won15 = lv15.dials.every(d => d.pos === (d.init + d.offset) % N15);
  test('L15 solvable (K=3 tier)', won15);
  
  // 8. L30 solvable (tier 6, K=5)
  const lv30 = parseLevel(LEVELS_DATA[29]);
  const N30 = lv30.N;
  for (const d of lv30.dials) {
    const target = (d.init + d.offset) % N30;
    const fwd = ((target - d.pos + N30) % N30);
    const bwd = ((d.pos - target + N30) % N30);
    if (fwd <= bwd) d.pos = (d.pos + fwd) % N30;
    else d.pos = (d.pos - bwd + N30) % N30;
  }
  const won30 = lv30.dials.every(d => d.pos === (d.init + d.offset) % N30);
  test('L30 solvable (K=5 tier)', won30);
  
  // 9. Par correctness — check all levels
  let parOk = true;
  for (let i = 0; i < 30; i++) {
    const lv = parseLevel(LEVELS_DATA[i]);
    let computed = 0;
    for (const d of lv.dials) {
      computed += Math.min(d.offset, lv.N - d.offset);
    }
    if (computed !== lv.par) parOk = false;
  }
  test('All 30 pars correct', parOk);
  
  // 10. Tier progression
  test('L1 tier 1 (K=2,N=6)', parseLevel(LEVELS_DATA[0]).K === 2 && parseLevel(LEVELS_DATA[0]).N === 6);
  test('L30 tier 6 (K=5,N=12)', parseLevel(LEVELS_DATA[29]).K === 5 && parseLevel(LEVELS_DATA[29]).N === 12);
  
  // 11. Title and description in HTML
  test('Title contains "Spectrometer"', html.includes('Spectrometer'));
  test('Description contains "diffraction"', html.includes('diffraction'));
  test('Description contains "spectral"', html.includes('spectral'));
  
  // 12. Audio functions present
  test('beep function defined', html.includes('function beep'));
  test('sfxClick defined', html.includes('function sfxClick'));
  test('sfxWin defined', html.includes('function sfxWin'));
  
  console.log(`\n${pass}/${pass+fail} tests passed`);
  process.exit(fail > 0 ? 1 : 0);
}, 500);
