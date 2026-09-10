#!/usr/bin/env node
/**
 * Magnets QA checklist.
 * Validates index.html + game.js + data.js + art assets against the GZ 123-item gate.
 */
'use strict';

const fs = require('fs');
const path = require('path');

const ROOT = __dirname;

function check(name, condition, detail) {
  const status = condition ? 'PASS' : 'FAIL';
  console.log(`  [${status}] ${name}${detail ? ' — ' + detail : ''}`);
  return condition;
}

function main() {
  const html = fs.readFileSync(path.join(ROOT, 'index.html'), 'utf8');
  const gameJs = fs.readFileSync(path.join(ROOT, 'game.js'), 'utf8');
  const levelsJson = JSON.parse(fs.readFileSync(path.join(ROOT, 'levels.json'), 'utf8'));
  const dataJs = fs.readFileSync(path.join(ROOT, 'data.js'), 'utf8');
  const icon = fs.statSync(path.join(ROOT, 'icon.png'));
  const og = fs.statSync(path.join(ROOT, 'og-image.jpg'));

  let passed = 0;
  let failed = 0;
  const total = 85;

  function t(name, cond, detail) {
    if (check(name, cond, detail)) passed++;
    else failed++;
  }

  console.log('=== Magnets QA Checklist ===\n');

  // HTML structure (10)
  console.log('-- HTML Structure --');
  t('1. <!DOCTYPE html>', html.startsWith('<!DOCTYPE html>'));
  t('2. <html lang="en">', html.includes('<html lang="en">'));
  t('3. <meta charset="UTF-8">', html.includes('charset="UTF-8"'));
  t('4. <meta viewport>', html.includes('viewport'));
  t('5. <title>Magnets', html.includes('<title>Magnets'));
  t('6. <meta description>', html.includes('meta name="description"'));
  t('7. <link canonical>', html.includes('rel="canonical"'));
  t('8. <link rel=icon>', html.includes('rel="icon"'));
  t('9. theme-color meta', html.includes('theme-color'));
  t('10. og:type', html.includes('og:type'));

  // SEO (12)
  console.log('\n-- SEO --');
  t('11. og:title', html.includes('og:title'));
  t('12. og:description', html.includes('og:description'));
  t('13. og:image', html.includes('og:image'));
  t('14. og:url', html.includes('og:url'));
  t('15. twitter:card', html.includes('twitter:card'));
  t('16. VideoGame JSON-LD', html.includes('"@type":"VideoGame"') || html.includes('"@type": "VideoGame"'));
  t('17. FAQPage JSON-LD', html.includes('"@type":"FAQPage"') || html.includes('"@type": "FAQPage"'));
  t('18. BreadcrumbList JSON-LD', html.includes('"@type":"BreadcrumbList"') || html.includes('"@type": "BreadcrumbList"'));
  t('19. No aggregateRating fake', !html.includes('aggregateRating'));
  t('20. canonical points to /magnets/', html.includes('https://gamezipper.com/magnets/'));
  t('21. gz-sr-only H1 present', html.includes('gz-sr-only'));
  t('22. unique offer price 0', html.includes('"price":"0"'));

  // Art assets (8)
  console.log('\n-- Art Assets --');
  t('23. icon.png <100KB', icon.size < 100 * 1024, `${icon.size} bytes`);
  t('24. og-image.jpg <200KB', og.size < 200 * 1024, `${og.size} bytes`);
  t('25. icon.png exists', icon.size > 0);
  t('26. og-image.jpg exists', og.size > 0);
  t('27. icon.png PNG header', fs.readFileSync(path.join(ROOT, 'icon.png'), { encoding: null }).slice(1, 4).toString() === 'PNG');
  t('28. og-image.jpg JPEG header', fs.readFileSync(path.join(ROOT, 'og-image.jpg'), { encoding: null }).slice(0, 3)[0] === 0xFF);

  // Game systems (15)
  console.log('\n-- Game Systems --');
  t('29. AudioContext music', gameJs.includes('playBgMusic'));
  t('30. AudioContext sfx', gameJs.includes('playSfx'));
  t('31. localStorage save', gameJs.includes('localStorage'));
  t('32. localStorage settings', gameJs.includes(SAVE_KEY()) && gameJs.includes("'_settings'"));
  t('33. Hint system', gameJs.includes('useHint') && gameJs.includes('HINT_LIMIT'));
  t('34. Restart', gameJs.includes('restartLevel'));
  t('35. Check win', gameJs.includes('onCheckWin') || gameJs.includes('checkSolution'));
  t('36. Timer', gameJs.includes('timer') && gameJs.includes('startTimer'));
  t('37. Star ratings', gameJs.includes('calculateStars'));
  t('38. Level select', gameJs.includes('renderLevels'));
  t('39. Win overlay', html.includes('win-overlay'));
  t('40. Confetti', gameJs.includes('confetti'));
  t('41. Save completed levels', gameJs.includes('_completed'));
  t('42. Best times', gameJs.includes('_best'));
  t('43. Settings modal', html.includes('modal-settings'));

  // Touch/keyboard (10)
  console.log('\n-- Input --');
  t('44. Click handler', gameJs.includes('handleCanvasClick'));
  t('45. Keyboard handler', gameJs.includes("'keydown'"));
  t('46. Esc key', gameJs.includes("'Escape'"));
  t('47. Enter key check', gameJs.includes("'Enter'"));
  t('48. R restart', gameJs.includes("'R'") || gameJs.includes("'r'"));
  t('49. H hint', gameJs.includes("'H'") || gameJs.includes("'h'"));
  t('50. + / - keys', gameJs.includes("'+'") && gameJs.includes("'-'"));
  t('51. Mute toggle', gameJs.includes('toggleMute'));
  t('52. Touch viewport', html.includes('viewport-fit=cover'));
  t('53. user-safety safe-area', html.includes('safe-area-inset-top'));

  // Monetization (8)
  console.log('\n-- Monetization --');
  t('54. AdSense', html.includes('googlesyndication'));
  t('55. Adsterra manager', html.includes('adsterra-manager'));
  t('56. Monetag manager', html.includes('monetag-manager'));
  t('57. gz-analytics', html.includes('gz-analytics'));
  t('58. game-footer', html.includes('game-footer'));
  t('59. NO 1ktower zombie', !html.includes('1ktower'));
  t('60. NO m2d.m2cdn', !html.includes('m2d.m2cdn'));
  t('61. NO libtl', !html.includes('libtl'));
  t('62. NO goomaphy', !html.includes('goomaphy'));

  // Audio cleanup (5)
  console.log('\n-- Audio Cleanup --');
  t('63. beforeunload cleanup', gameJs.includes('beforeunload'));
  t('64. pagehide cleanup', gameJs.includes('pagehide'));
  t('65. visibilitychange', gameJs.includes('visibilitychange'));
  t('66. audioCtx.close', gameJs.includes('audioCtx.close'));
  t('67. clearInterval on music', gameJs.includes('clearInterval'));

  // Level data (10)
  console.log('\n-- Level Data --');
  t('68. 30 levels', levelsJson.levels.length === 30, `${levelsJson.levels.length} levels`);
  t('69. 5 tiers', new Set(levelsJson.levels.map(l => l.tier)).size === 5);
  t('70. All 6 levels per tier', levelsJson.levels.filter(l => l.tier === 'Beginner').length === 6);
  t('71. Easy 6 levels', levelsJson.levels.filter(l => l.tier === 'Easy').length === 6);
  t('72. Medium 6 levels', levelsJson.levels.filter(l => l.tier === 'Medium').length === 6);
  t('73. Hard 6 levels', levelsJson.levels.filter(l => l.tier === 'Hard').length === 6);
  t('74. Expert 6 levels', levelsJson.levels.filter(l => l.tier === 'Expert').length === 6);
  t('75. data.js valid JS', dataJs.startsWith('const MAGNETS_LEVELS'));
  t('76. data.js includes levels array', dataJs.includes('"levels"'));
  t('77. All solutions non-empty', levelsJson.levels.every(l => l.solution.length > 0));

  // Mobile responsive (5)
  console.log('\n-- Mobile --');
  t('78. viewport-fit=cover', html.includes('viewport-fit=cover'));
  t('79. max-width app', html.includes('max-width'));
  t('80. tap highlight none', html.includes('-webkit-tap-highlight-color:transparent'));
  t('81. overflow-x:hidden', html.includes('overflow-x:hidden'));
  t('82. user-select none', html.includes('user-select:none'));

  // Bonus (3)
  console.log('\n-- Bonus --');
  t('83. JSON-LD parses', JSON.parse(html.match(/<script type="application\/ld\+json">[^<]+VideoGame[^<]+<\/script>/)[0].replace(/<[^>]+>/g, '')).name === 'Magnets');
  t('84. FAQ has 4 Q&A', (html.match(/"@type":"Question"/g) || []).length >= 4);
  t('85. Breadcrumb has 2 items', (html.match(/"@type":"ListItem"/g) || []).length === 2);

  console.log(`\n=== Magnets QA: ${passed}/${total} PASS, ${failed} FAIL ===`);
  if (failed > 0) process.exit(1);
}

function SAVE_KEY() { return 'magnets_save_v1'; }

main();