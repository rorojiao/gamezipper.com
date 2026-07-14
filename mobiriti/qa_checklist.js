#!/usr/bin/env node
/**
 * Mobiriti QA checklist.
 * Verifies code-level quality gates for the index.html.
 */
const fs = require('fs');
const path = require('path');

const html = fs.readFileSync(path.join(__dirname, 'index.html'), 'utf8');
const levels = JSON.parse(fs.readFileSync(path.join(__dirname, 'levels.json'), 'utf8'));

let pass = 0, fail = 0;
function check(name, ok, detail) {
  if (ok) { pass++; console.log(`  PASS  ${name}`); }
  else { fail++; console.log(`  FAIL  ${name} -- ${detail || ''}`); }
}

// 1. HTML structure
check('HTML has <!DOCTYPE html>', html.startsWith('<!DOCTYPE html>'));
check('HTML has <title>', /<title>[^<]+<\/title>/.test(html));
check('HTML has meta description', /<meta name="description"/.test(html));
check('HTML has canonical link', /<link rel="canonical"/.test(html));
check('HTML has viewport meta', /<meta name="viewport"/.test(html));

// 2. SEO JSON-LD
check('Has VideoGame JSON-LD', /"@type":"VideoGame"/.test(html));
check('Has FAQPage JSON-LD', /"@type":"FAQPage"/.test(html));
check('Has BreadcrumbList JSON-LD', /"@type":"BreadcrumbList"/.test(html));

// 3. OG tags
check('Has og:title', /og:title/.test(html));
check('Has og:description', /og:description/.test(html));
check('Has og:image', /og:image/.test(html));
check('Has og:url', /og:url/.test(html));

// 4. H1 (sr-only)
check('Has gz-sr-only H1', /gz-sr-only[^>]*>[^<]+<\/h1>|class="gz-sr-only"/.test(html));

// 5. Game systems
check('Has canvas element', /<canvas id="c">/.test(html));
check('Has handlePointer', /addEventListener\('pointerdown'/.test(html));
check('Has checkWin / visibilityCount', /function visibilityCount|function checkWin/.test(html));
check('Has Web Audio code', /AudioContext|webkitAudioContext/.test(html));
check('Has hint system', /giveHint/.test(html));
check('Has level select / menu', /openMenu/.test(html));
check('Has saveProgress / localStorage', /localStorage/.test(html));
check('Has timer', /startTimer/.test(html));
check('Has confetti / win modal', /winModal/.test(html));
check('Has touch support', /touch-action/.test(html));
check('Has beforeunload cleanup', /beforeunload/.test(html));

// 6. LEVELS array
check('Has LEVELS const', /const LEVELS = \[/.test(html));
const m = html.match(/const LEVELS = (\[[\s\S]*?\]);/);
if (m) {
  try {
    const lvls = eval(m[1]);
    check('LEVELS has 30 entries', lvls.length === 30, `got ${lvls.length}`);
    check('Each level has rows, cols, clues, solution', lvls.every(L => L.rows && L.cols && L.clues && L.solution));
    // Tier distribution
    const tiers = {};
    lvls.forEach(L => { tiers[L.tier] = (tiers[L.tier] || 0) + 1; });
    check('Has all 5 tiers', ['Beginner', 'Easy', 'Medium', 'Hard', 'Expert'].every(t => tiers[t] >= 6), `tiers=${JSON.stringify(tiers)}`);
  } catch (e) {
    check('LEVELS parses', false, e.message);
  }
}

// 7. levels.json file exists and is valid
check('levels.json exists and parses', levels.length === 30);

// 8. Screenshots / assets (just structural, not visual)
check('icon.png referenced or exists', fs.existsSync(path.join(__dirname, 'icon.png')) || /icon\.png/.test(html));
check('og-image.jpg referenced', fs.existsSync(path.join(__dirname, 'og-image.jpg')) || /og-image\.jpg/.test(html));

console.log(`\n${pass} PASS, ${fail} FAIL`);
if (fail > 0) process.exit(1);
