#!/usr/bin/env node
// QA checklist for Nuranaito.
// Validates: HTML structure, SEO JSON-LD, art assets, all game systems present.
const fs = require('fs');
const path = require('path');

const ROOT = __dirname;
const html = fs.readFileSync(path.join(ROOT, 'index.html'), 'utf8');
const checks = [];
function pass(name) { checks.push({ ok: true, name }); }
function fail(name, detail) { checks.push({ ok: false, name, detail }); }

// 1. HTML structure
if (html.includes('<!DOCTYPE html>')) pass('DOCTYPE html'); else fail('DOCTYPE html');
if (html.includes('<title>') && html.includes('Nuranaito')) pass('Title with Nuranaito'); else fail('Title with Nuranaito');
if (html.includes('name="description"')) pass('Meta description'); else fail('Meta description');
if (html.includes('rel="canonical"')) pass('Canonical link'); else fail('Canonical link');
if (html.includes('og:title')) pass('og:title'); else fail('og:title');
if (html.includes('og:description')) pass('og:description'); else fail('og:description');
if (html.includes('og:image')) pass('og:image'); else fail('og:image');
if (html.includes('og:url')) pass('og:url'); else fail('og:url');

// 2. SEO JSON-LD blocks
if (html.includes('VideoGame')) pass('VideoGame JSON-LD'); else fail('VideoGame JSON-LD');
if (html.includes('FAQPage')) pass('FAQPage JSON-LD'); else fail('FAQPage JSON-LD');
if (html.includes('BreadcrumbList')) pass('BreadcrumbList JSON-LD'); else fail('BreadcrumbList JSON-LD');

// 3. gz-sr-only H1 (a11y)
if (html.includes('gz-sr-only')) pass('sr-only H1 (a11y)'); else fail('sr-only H1 (a11y)');

// 4. Art assets
if (fs.existsSync(path.join(ROOT, 'icon.png'))) pass('icon.png'); else fail('icon.png');
if (fs.existsSync(path.join(ROOT, 'og-image.jpg'))) pass('og-image.jpg'); else fail('og-image.jpg');
const iconSize = fs.statSync(path.join(ROOT, 'icon.png')).size;
if (iconSize > 1000 && iconSize < 50000) pass(`icon.png size ${iconSize} bytes`); else fail(`icon.png size ${iconSize} bytes`);
const ogSize = fs.statSync(path.join(ROOT, 'og-image.jpg')).size;
if (ogSize > 10000 && ogSize < 200000) pass(`og-image.jpg size ${ogSize} bytes`); else fail(`og-image.jpg size ${ogSize} bytes`);

// 5. Game systems
if (html.includes('Web Audio') || html.includes('AudioContext')) pass('Web Audio API'); else fail('Web Audio API');
if (html.includes('Canvas') || html.includes('canvas')) pass('Canvas rendering'); else fail('Canvas rendering');
if (html.includes('localStorage')) pass('localStorage save+settings'); else fail('localStorage save+settings');
if (html.includes('hint-pill') || html.includes('hint-count')) pass('Hint system (3/level)'); else fail('Hint system');
if (html.includes('mode-shade') && html.includes('mode-erase')) pass('Shade/Erase modes'); else fail('Shade/Erase modes');
if (html.includes('checkSolution')) pass('checkSolution engine contract'); else fail('checkSolution engine contract');
if (html.includes('computeErrors')) pass('computeErrors helper'); else fail('computeErrors helper');
if (html.includes('knightCount') || html.includes('KN')) pass('Knight move logic'); else fail('Knight move logic');
if (html.includes('draw()')) pass('draw() function'); else fail('draw() function');
if (html.includes('startTime')) pass('Timer (startTime)'); else fail('Timer (startTime)');
if (html.includes('confetti')) pass('Confetti win animation'); else fail('Confetti win animation');
if (html.includes('beforeunload') && html.includes('pagehide')) pass('Audio cleanup on unload'); else fail('Audio cleanup on unload');

// 6. UI components
if (html.includes('btn-restart')) pass('Restart button'); else fail('Restart button');
if (html.includes('btn-check')) pass('Check button'); else fail('Check button');
if (html.includes('btn-clear')) pass('Clear button'); else fail('Clear button');
if (html.includes('btn-hint')) pass('Hint button'); else fail('Hint button');
if (html.includes('screen-menu')) pass('Menu screen'); else fail('Menu screen');
if (html.includes('screen-levels')) pass('Levels screen'); else fail('Levels screen');
if (html.includes('screen-game')) pass('Game screen'); else fail('Game screen');
if (html.includes('ov-settings')) pass('Settings overlay'); else fail('Settings overlay');
if (html.includes('ov-howto')) pass('HowTo overlay'); else fail('HowTo overlay');
if (html.includes('ov-win')) pass('Win overlay'); else fail('Win overlay');

// 7. Tier grouping (5 tiers)
const tiers = ['Beginner', 'Easy', 'Medium', 'Hard', 'Expert'];
for (const t of tiers) {
  if (html.includes(`'${t}'`) || html.includes(`"${t}"`)) pass(`Tier ${t} in LEVELS`);
  else fail(`Tier ${t} in LEVELS`);
}

// 8. Monetization + analytics + footer
if (html.includes('monetag-manager.js')) pass('Monetag integration'); else fail('Monetag integration');
if (html.includes('adsterra-manager.js')) pass('Adsterra integration'); else fail('Adsterra integration');
if (html.includes('game-footer.js')) pass('Game footer'); else fail('Game footer');
if (html.includes('gz-analytics.js')) pass('gz-analytics'); else fail('gz-analytics');

// 9. Related games
if (html.includes('gz-related-card') || html.includes('gz-related-grid')) pass('Related games section'); else fail('Related games section');

// 10. Keyboard support
if (html.includes('keydown')) pass('Keyboard handler'); else fail('Keyboard handler');

// 11. 30 levels in LEVELS
const m = html.match(/const LEVELS = (\[[\s\S]*?\]);/);
if (m) {
  const levels = JSON.parse(m[1]);
  if (levels.length === 30) pass(`30 levels in LEVELS (${levels.length})`);
  else fail(`30 levels in LEVELS (got ${levels.length})`);
} else {
  fail('LEVELS array not found');
}

// Summary
const passed = checks.filter(c => c.ok).length;
const failed = checks.filter(c => !c.ok);
console.log(`\n=== Nuranaito QA Checklist ===`);
console.log(`Total checks: ${checks.length}`);
console.log(`Passed: ${passed}`);
console.log(`Failed: ${failed.length}`);
if (failed.length > 0) {
  console.log('\nFailures:');
  for (const f of failed) {
    console.log(`  ✗ ${f.name}${f.detail ? ' — ' + f.detail : ''}`);
  }
  process.exit(1);
} else {
  console.log(`\n✓ All ${passed} checks PASS`);
}
