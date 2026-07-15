#!/usr/bin/env node
// Shirokuro QA checklist - code-level checks

const fs = require('fs');

const html = fs.readFileSync('index.html', 'utf8');
const checks = [];
let pass = 0, fail = 0;

function check(name, fn) {
  try {
    const ok = fn();
    if (ok) {
      checks.push(`✓ ${name}`);
      pass++;
    } else {
      checks.push(`✗ ${name}`);
      fail++;
    }
  } catch (e) {
    checks.push(`✗ ${name} (error: ${e.message})`);
    fail++;
  }
}

// === HTML structure ===
check('HTML5 doctype', () => /<!DOCTYPE html>/i.test(html));
check('Title is set', () => /<title>Shirokuro/i.test(html));
check('Meta description is set', () => /<meta name="description"/i.test(html));
check('Meta viewport is set', () => /<meta name="viewport"/i.test(html));
check('Canonical URL is set', () => /<link rel="canonical"/i.test(html));
check('OG title is set', () => /<meta property="og:title"/i.test(html));
check('OG image is set', () => /<meta property="og:image"/i.test(html));
check('OG type is set', () => /<meta property="og:type"/i.test(html));
check('Twitter card is set', () => /<meta name="twitter:card"/i.test(html));
check('Favicon (SVG) is set', () => /<link rel="icon"/i.test(html));
check('gz-sr-only H1 is present', () => /<h1 class="gz-sr-only">Shirokuro/i.test(html));

// === SEO JSON-LD ===
check('VideoGame JSON-LD is present', () => {
  return /"@type":"VideoGame"/.test(html) && /"name":"Shirokuro"/.test(html);
});
check('FAQPage JSON-LD is present', () => {
  return /"@type":"FAQPage"/.test(html) && /How do you play Shirokuro/.test(html);
});
check('BreadcrumbList JSON-LD is present', () => {
  return /"@type":"BreadcrumbList"/.test(html) && /GameZipper/.test(html);
});
// === Art assets ===
check('icon.png exists', () => fs.existsSync('icon.png') && fs.statSync('icon.png').size > 1000);
check('og-image.jpg exists', () => fs.existsSync('og-image.jpg') && fs.statSync('og-image.jpg').size > 1000);

// === Game systems ===
check('LEVELS array is defined', () => /const LEVELS=\[/.test(html));
check('curLevel state', () => /curLevel=0/.test(html));
check('Edges Map', () => /edges=new Map\(\)/.test(html));
check('Hints system', () => /useHint\(\)/.test(html));
check('3-star ratings', () => /win-stars/.test(html));
check('Menu overlay', () => /menu-overlay/.test(html));
check('Settings overlay', () => /settings-overlay/.test(html));
check('Help overlay', () => /help-overlay/.test(html));
check('Win overlay', () => /win-overlay/.test(html));
check('Autocheck toggle', () => /toggleAuto/.test(html));
check('Music toggle', () => /toggleMusic/.test(html));
check('SFX toggle', () => /toggleSfx/.test(html));
check('Clear button', () => /clearEdges/.test(html));
check('Check button', () => /checkSolution/.test(html));
check('Level select', () => /lvl-list/.test(html));
check('Timer', () => /startTimer/.test(html));
check('localStorage save', () => /localStorage/.test(html));
check('Confetti', () => /showConfetti/.test(html));

// === Audio (Web Audio API) ===
check('Web Audio API used', () => /AudioContext/.test(html));
check('Music notes', () => /notes=\[261\.63/.test(html) || /Cmaj7/.test(html) || /notes=\[/.test(html));
check('SFX system', () => /playSfx/.test(html));
check('beforeunload cleanup', () => /beforeunload/.test(html));
check('pagehide cleanup', () => /pagehide/.test(html));
check('visibilitychange cleanup', () => /visibilitychange/.test(html));

// === Input / Interaction ===
check('Pointer events for drawing', () => /pointerdown|pointermove/.test(html));
check('Touch support', () => /touch-action/.test(html));
check('Edge-click detection', () => /getEdgeNear/.test(html));
check('Mode switching (Draw/Erase)', () => /setMode/.test(html));

// === Keyboard support ===
check('Keyboard 1=Draw', () => /'1'\)\s*setMode\('draw'\)/.test(html) || /'1'.*setMode/.test(html));
check('Keyboard 2=Erase', () => /'2'.*setMode\('erase'\)/.test(html) || /'2'.*setMode/.test(html));
check('Keyboard H=Hint', () => /'h'.*useHint/i.test(html) || /'H'.*useHint/i.test(html));
check('Keyboard R=Restart', () => /'r'.*clearEdges/i.test(html) || /'R'.*clearEdges/i.test(html));
check('Keyboard Enter=Check', () => /Enter.*check/i.test(html) || /'Enter'.*check/.test(html));
check('Keyboard Esc=Menu', () => /Escape.*showMenu/i.test(html) || /'Escape'.*showMenu/.test(html));

// === Footer / monetization ===
check('game-footer script', () => /game-footer\.js/.test(html));
check('monetag-manager script', () => /monetag-manager\.js/.test(html));
check('gz-analytics script', () => /gz-analytics\.js/.test(html));
check('game-audio script', () => /game-audio\.js/.test(html));
check('sound-toggle script', () => /sound-toggle\.js/.test(html));
check('play-counter script', () => /play-counter\.js/.test(html));

// === Related games ===
check('Related games section', () => /gz-related-games/.test(html));
check('Related games links', () => {
  const m = html.match(/gz-related-card[\s\S]+?href="\/[^/]+\//g);
  return m && m.length >= 4;
});

// === Validation - run verify_engine ===
const { execSync } = require('child_process');
check('All 30 levels pass verify_engine.js', () => {
  try {
    const out = execSync('node verify_engine.js 2>&1', { encoding: 'utf8' });
    return out.includes('✓ ALL 30 LEVELS PASS');
  } catch (e) { return false; }
});
check('All 30 levels pass verify_independent.js', () => {
  try {
    const out = execSync('node verify_independent.js 2>&1', { encoding: 'utf8' });
    return out.includes('✓ ALL 30 LEVELS PASS');
  } catch (e) { return false; }
});

// Output
console.log(checks.join('\n'));
console.log(`\n${pass} passed, ${fail} failed`);
process.exit(fail === 0 ? 0 : 1);
