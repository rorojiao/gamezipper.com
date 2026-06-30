// jsdom integration test for Sextant Celestial.
// Verifies: LEVELS loaded, DOM structure, L1 solvable by simulating dial presses.
const fs = require('fs');
let JSDOM;
try { JSDOM = require('jsdom').JSDOM; } catch(e){ console.error('jsdom not installed:', e.message); process.exit(2); }

const html = fs.readFileSync('index.html','utf8');
const dom = new JSDOM(html, { runScripts: 'dangerously', resources: undefined, pretendToBeVisual: true });
const w = dom.window;

// jsdom doesn't auto-run requestAnimationFrame. Patch it to tick via setTimeout.
w.requestAnimationFrame = (cb)=>setTimeout(()=>cb(performance.now?performance.now():Date.now()),16);

let pass=0, fail=0;
function check(name, cond){ console.log(`${cond?'✅':'❌'} ${name}`); if(cond)pass++;else fail++; }

// wait for script to run. const-scoped vars need eval to access.
const e = (expr)=>{ try { return w.eval(expr); } catch(_) { return undefined; } };
setTimeout(()=>{
  try {
    const lvLen = e('LEVELS.length');
    check('LEVELS loaded (30)', typeof lvLen==='number' && lvLen === 30);
    check('canvas#board present', !!w.document.getElementById('board'));
    check('#dialRow present', !!w.document.getElementById('dialRow'));
    check('#hdrLvl present', !!w.document.getElementById('hdrLvl'));
    check('#mvCount present', !!w.document.getElementById('mvCount'));
    check('play button (#btnStart) present', !!w.document.getElementById('btnStart'));
    // menu overlay initially shown
    check('intro overlay shown', w.document.getElementById('ovIntro').classList.contains('show'));
    // L1: start=[0,2,2], N=6, dials=[[3,1,4],[5,1,1]], optimal=2 (press dial1 twice)
    check('L1 state initial', JSON.stringify(e('state'))===JSON.stringify([0,2,2]));
    check('L1 N=6', e('N')===6);
    check('L1 dials count=2', e('dials.length')===2);
    // simulate pressing dial index 1 twice (optimal solution [1,1])
    // pressDial triggers a 280ms animation that sets `won` on completion;
    // wait between presses for the animation to resolve.
    e('pressDial(1)');
    setTimeout(()=>{
      e('pressDial(1)');
      setTimeout(()=>{
        check('L1 solved after pressing dial 1 twice', e('won') === true);
        check('L1 moves=2', e('moves') === 2);
        // stars for L1 with 2 moves (optimal=2) = 3
        check('L1 earns 3 stars', e('starsFor(0,2)') === 3);
        console.log(`\n${pass}/${pass+fail} jsdom checks passed`);
        if(fail>0) process.exit(1);
        process.exit(0);
      }, 400);
    }, 400);
  } catch(err){
    console.error('ERROR:', err.message, err.stack);
    process.exit(1);
  }
}, 300);
