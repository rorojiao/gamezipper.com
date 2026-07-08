#!/usr/bin/env node
/**
 * Spiral Galaxies — code-level QA checklist.
 * Runs without browser, verifies HTML structure, meta, scripts, assets, no obvious bugs.
 */
const fs = require('fs');
const path = require('path');
const DIR = path.join(__dirname);
const HTML = fs.readFileSync(path.join(DIR, 'index.html'), 'utf8');

let pass = 0, fail = 0;
function check(name, cond, detail=''){
  if(cond){ pass++; console.log('  ✓', name); }
  else   { fail++; console.log('  ✗', name, '—', detail); }
}

console.log('== Spiral Galaxies QA ==');
check('index.html present', fs.existsSync(path.join(DIR, 'index.html')));
check('icon.png present', fs.existsSync(path.join(DIR, 'icon.png')));
check('og-image.jpg present', fs.existsSync(path.join(DIR, 'og-image.jpg')));
check('levels.json present', fs.existsSync(path.join(DIR, 'levels.json')));
check('gen_levels.py present', fs.existsSync(path.join(DIR, 'gen_levels.py')));
check('verify_independent.js present', fs.existsSync(path.join(DIR, 'verify_independent.js')));
check('verify_engine.js present', fs.existsSync(path.join(DIR, 'verify_engine.js')));
check('BENCHMARK.md present', fs.existsSync(path.join(DIR, 'BENCHMARK.md')));

// HTML structural checks
check('HTML has <!DOCTYPE html>', /^<!DOCTYPE html>/i.test(HTML));
check('HTML has <html lang="en">', /<html\s+lang="en"/i.test(HTML));
check('HTML has viewport meta', /<meta\s+name="viewport"/i.test(HTML));
check('HTML has title', /<title>[^<]+<\/title>/i.test(HTML));
check('HTML has meta description', /<meta\s+name="description"/i.test(HTML));
check('HTML has canonical link', /<link\s+rel="canonical"/i.test(HTML));
check('HTML has og:title', /property="og:title"/i.test(HTML));
check('HTML has og:description', /property="og:description"/i.test(HTML));
check('HTML has og:image', /property="og:image"/i.test(HTML));
check('HTML has twitter:card', /name="twitter:card"/i.test(HTML));
check('HTML has VideoGame JSON-LD', /"@type":"VideoGame"/.test(HTML) || /VideoGame/.test(HTML));
check('HTML has HowTo JSON-LD', /"@type":"HowTo"/.test(HTML) || /HowTo/.test(HTML));
check('HTML has FAQPage JSON-LD', /"@type":"FAQPage"/.test(HTML) || /FAQPage/.test(HTML));
check('HTML has BreadcrumbList JSON-LD', /"@type":"BreadcrumbList"/.test(HTML) || /BreadcrumbList/.test(HTML));
check('HTML has gz-sr-only h1', /<h1[^>]*class="gz-sr-only"/.test(HTML));
check('HTML has board canvas', /<canvas[^>]+id="board"/.test(HTML));
check('HTML has levelGrid', /id="levelGrid"/.test(HTML));
check('HTML has palette', /id="palette"/.test(HTML));
check('HTML has hintBtn', /id="hintBtn"/.test(HTML));
check('HTML has undoBtn', /id="undoBtn"/.test(HTML));
check('HTML has restartBtn', /id="restartBtn"/.test(HTML));
check('HTML has winOverlay', /id="winOverlay"/.test(HTML));
check('HTML has adsterra-manager.js', /adsterra-manager\.js/.test(HTML));
check('HTML has game-footer.js', /game-footer\.js/.test(HTML));
check('HTML has gz-analytics.js', /gz-analytics\.js/.test(HTML));
check('HTML loads site-analytics pixel (deprecated — should NOT)', !/<script[^>]+site-analytics\.js/i.test(HTML));
check('HTML has monetag-manager.js', /monetag-manager\.js/.test(HTML));
check('HTML defines LEVELS array', /const\s+LEVELS\s*=\s*\[/.test(HTML));
check('HTML uses Web Audio', /AudioContext|webkitAudioContext/.test(HTML));
check('HTML has no external resources with HTTP:// (insecure)', !/src=["']http:\/\//i.test(HTML) && !/href=["']http:\/\/(?!gamezipper)/i.test(HTML));
check('HTML has keyboard shortcut "1-9" for stars', /['"]1-9['"]|\[1-9\]/.test(HTML));
check('HTML handles Undo (z/u)', /undo\(\)|'z'|'u'|'Z'|'U'/i.test(HTML));
check('HTML handles Restart (r)', /'r'|'R'/.test(HTML));
check('HTML handles Hint (h)', /'h'|'H'/.test(HTML));
check('HTML has localStorage save', /localStorage/.test(HTML));
check('HTML has 30 levels embedded', (HTML.match(/\{id:\d+,tier:/g) || []).length >= 30);
check('HTML 30 levels match all tier names', /Beginner/.test(HTML) && /Easy/.test(HTML) && /Medium/.test(HTML) && /Hard/.test(HTML) && /Expert/.test(HTML));
check('HTML no TODO/FIXME', !/TODO|FIXME/i.test(HTML));
check('HTML no obvious eval()', !/eval\(/.test(HTML));
check('HTML no document.write', !/document\.write\(/.test(HTML));

// Levels data integrity
const levels = JSON.parse(fs.readFileSync(path.join(DIR, 'levels.json'))).levels;
check('levels.json has 30 levels', levels.length === 30);
const tiers = new Set(levels.map(l => l.tier));
check('5 distinct tiers', tiers.size === 5);
check('all levels have stars', levels.every(l => l.stars.length >= 1));
check('all levels have solutions', levels.every(l => l.solution && l.solution.length === l.H && l.solution[0].length === l.W));

// Symmetry re-verify
function partner(cr, cc, sr2, sc2){ return [sr2 - cr - 1, sc2 - cc - 1]; }
let symErr = 0;
for(const lv of levels){
  const istars = lv.stars.map(s => [Math.round(s.r*2), Math.round(s.c*2)]);
  for(let si=0;si<lv.stars.length;si++){
    const [sr2, sc2] = istars[si];
    for(let r=0;r<lv.H;r++) for(let c=0;c<lv.W;c++){
      if(lv.solution[r][c] !== si) continue;
      const [pr, pc] = partner(r, c, sr2, sc2);
      if(pr<0||pr>=lv.H||pc<0||pc>=lv.W) continue;
      if(lv.solution[pr][pc] !== si) symErr++;
    }
  }
}
check('all level solutions are 180°-symmetric', symErr === 0, `${symErr} symmetry errors`);

console.log(`\n=== ${pass} pass, ${fail} fail ===`);
process.exit(fail === 0 ? 0 : 1);
