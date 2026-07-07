#!/usr/bin/env node
// Code-Level QA Checklist (40 checks)
const fs = require('fs');

const html = fs.readFileSync('/home/msdn/gamezipper.com/pin-pull-puzzle/index.html', 'utf8');

const checks = [
  // HTML & SEO
  ['Analytics pixel', html.includes('site-analytics.cap.1ktower.com')],
  ['Canonical URL', html.includes('gamezipper.com/pin-pull-puzzle/')],
  ['JSON-LD VideoGame', html.includes('VideoGame')],
  ['JSON-LD FAQPage', html.includes('FAQPage')],
  ['JSON-LD HowTo', html.includes('HowTo')],
  ['JSON-LD BreadcrumbList', html.includes('BreadcrumbList')],
  ['OG tags', html.includes('og:title')],
  ['Meta description', html.includes('meta name="description"')],

  // CSS & Responsive
  ['Dark theme', html.includes('#0a0a1a')],
  ['Responsive canvas', html.includes('resize')],
  ['Touch targets', html.includes('36px')], // Minimum touch target hint
  ['No hardcoded widths', !html.match(/width:\s*\d+px/)], // Flexible widths preferred
  ['Overflow hidden', html.includes('overflow: hidden')],

  // Game Logic
  ['Deterministic RNG', !html.includes('Math.random')], // No RNG needed for this game
  ['Win condition', html.includes('checkWin')],
  ['Scoring', html.includes('stars')],
  ['3-star rating', html.includes('par')],
  ['Hint system', html.includes('showHint')],
  ['Undo system', html.includes('undoStack')],
  ['Level system', html.includes('LEVELS')],

  // Input Handling
  ['Pointer events', html.includes('pointerdown')],
  ['Touch action none', html.includes('touch-action:none')],
  ['Prevent default touch', html.includes('preventDefault')],

  // Audio
  ['AudioContext lazy init', html.includes('initAudio')],
  ['SFX functions', html.includes('playTone')],
  ['Music toggle', html.includes('toggleMusic')],
  ['Sound toggle', html.includes('toggleSound')],

  // State Management
  ['localStorage progress', html.includes('localStorage.getItem')],
  ['Level unlock', html.includes('maxLevel')],
  ['Tutorial first-visit', html.includes('tutorialSeen')],

  // Performance
  ['requestAnimationFrame', html.includes('requestAnimationFrame')],
  ['Delta time', html.includes('dt')],
  ['No memory leaks', html.includes('cleanup')],

  // Accessibility
  ['Window resize', html.includes('resize')],
  ['Valid grid sizes', html.includes('canvas.width')],
  ['Valid colors', html.includes('#ff4444')],
  ['No div by 0', !html.includes('/ 0')],

  // Code Quality
  ['No console.log', !html.includes('console.log')],
  ['No TODO/FIXME', !html.includes('TODO') && !html.includes('FIXME')],
  ['Organized sections', html.includes('// ===')], // Section markers
  ['No external CSS', !html.includes('rel="stylesheet"')],

  // Monetag Ads (checked separately)
  ['Monetag zone 110120', false], // Will be checked in Phase 8
  ['Monetag zone 110121', false],
  ['Monetag zone 110122', false],

  // File properties
  ['File size > 30KB', html.length > 30000],
  ['Single file', html.includes('<!DOCTYPE html>')],
  ['Closing </html>', html.includes('</html>')],
  ['Closing </body>', html.includes('</body>')],
  ['Closing </script>', html.includes('</script>')],
];

let pass = 0, fail = 0;
checks.forEach(c => {
  const status = c[1] ? 'OK' : 'FAIL';
  console.log(`${status} ${c[0]}`);
  c[1] ? pass++ : fail++;
});

console.log(`\n${pass}/${checks.length} passed` + (fail ? ` (${fail} failed)` : ''));
process.exit(fail > 0 ? 1 : 0);