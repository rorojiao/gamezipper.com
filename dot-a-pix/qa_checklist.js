#!/usr/bin/env node
/**
 * Dot-a-Pix QA checklist — validates index.html + game.js + data.js + assets.
 * 85+ checks covering HTML, SEO, ARIA, game systems, monetization, audio cleanup.
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
  const dataJs = fs.readFileSync(path.join(ROOT, 'data.js'), 'utf8');
  const levels = JSON.parse(fs.readFileSync(path.join(ROOT, 'levels.json'), 'utf8')).levels;
  const icon = fs.statSync(path.join(ROOT, 'icon.png'));
  const og = fs.statSync(path.join(ROOT, 'og-image.jpg'));

  let passed = 0, failed = 0;
  function t(name, cond, detail) {
    if (check(name, cond, detail)) passed++;
    else failed++;
  }

  console.log('=== Dot-a-Pix QA Checklist ===\n');

  // HTML structure
  console.log('-- HTML Structure --');
  t('1. <!DOCTYPE html>', html.startsWith('<!DOCTYPE html>'));
  t('2. <html lang="en">', html.includes('<html lang="en">'));
  t('3. <meta charset="UTF-8">', html.includes('charset="UTF-8"'));
  t('4. <meta viewport>', html.includes('viewport'));
  t('5. <title>Dot-a-Pix', html.includes('<title>Dot-a-Pix'));
  t('6. <meta description>', html.includes('meta name="description"'));
  t('7. <link canonical>', html.includes('rel="canonical"'));
  t('8. <link rel=icon>', html.includes('rel="icon"'));
  t('9. theme-color meta', html.includes('theme-color'));
  t('10. og:type', html.includes('og:type'));
  t('11. og:title', html.includes('og:title'));
  t('12. og:description', html.includes('og:description'));
  t('13. og:image', html.includes('og:image'));
  t('14. og:url', html.includes('og:url'));
  t('15. twitter:card', html.includes('twitter:card'));

  // SEO JSON-LD
  console.log('\n-- SEO / Schema --');
  t('16. VideoGame JSON-LD', html.includes('"@type":"VideoGame"'));
  t('17. FAQPage JSON-LD', html.includes('"@type":"FAQPage"'));
  t('18. BreadcrumbList JSON-LD', html.includes('"@type":"BreadcrumbList"'));
  t('19. No aggregateRating fake', !html.includes('aggregateRating'));
  t('20. canonical points to /dot-a-pix/', html.includes('https://gamezipper.com/dot-a-pix/'));
  t('21. gz-sr-only H1', html.includes('gz-sr-only'));
  t('22. unique offer price 0', html.includes('"price":"0"'));
  t('23. FAQ has 4 Q&A', (html.match(/"@type":"Question"/g) || []).length >= 4);
  t('24. Breadcrumb has 2 items', (html.match(/"@type":"ListItem"/g) || []).length === 2);

  // Assets
  console.log('\n-- Assets --');
  t('25. icon.png <100KB', icon.size < 100 * 1024, `${icon.size} bytes`);
  t('26. og-image.jpg <200KB', og.size < 200 * 1024, `${og.size} bytes`);
  t('27. icon.png PNG header', fs.readFileSync(path.join(ROOT, 'icon.png'), { encoding: null }).slice(1, 4).toString() === 'PNG');
  t('28. og-image.jpg JPEG header', fs.readFileSync(path.join(ROOT, 'og-image.jpg'), { encoding: null })[0] === 0xFF);

  // Game systems
  console.log('\n-- Game Systems --');
  t('29. AudioContext music', gameJs.includes('playBgMusic'));
  t('30. AudioContext sfx', gameJs.includes('playSFX') || gameJs.includes('playSfx'));
  t('31. localStorage save', gameJs.includes('localStorage'));
  t('32. localStorage settings key', gameJs.includes('dot_a_pix_settings'));
  t('33. Hint system', gameJs.includes('useHint') && gameJs.includes('HINT_LIMIT'));
  t('34. Reset level', gameJs.includes('resetLevel'));
  t('35. Check win', gameJs.includes('checkWin'));
  t('36. Timer', gameJs.includes('startTimer'));
  t('37. Star ratings', gameJs.includes('stars') && gameJs.includes('hintsUsed'));
  t('38. Level select', gameJs.includes('renderLevelButtons'));
  t('39. Win overlay', html.includes('winOverlay'));
  t('40. Save best times', gameJs.includes('bestTimes'));
  t('41. Click handler', gameJs.includes("addEventListener('click'") || gameJs.includes('toggleCell'));
  t('42. Keyboard handler', gameJs.includes("'keydown'"));
  t('43. Esc key', gameJs.includes("'Escape'"));
  t('44. R restart key', gameJs.includes("'R'") || gameJs.includes("'r'"));
  t('45. H hint key', gameJs.includes("'H'") || gameJs.includes("'h'"));
  t('46. Mute toggle', gameJs.includes('toggleMute'));
  t('47. Touch support', gameJs.includes('touchstart') || gameJs.includes('touchend'));

  // Mobile / CSS
  console.log('\n-- Mobile / CSS --');
  t('48. viewport-fit=cover', html.includes('viewport-fit=cover'));
  t('49. safe-area-inset-top', html.includes('safe-area-inset-top'));
  t('50. user-safety safe-area', html.includes('safe-area-inset-top') && html.includes('safe-area-inset-bottom'));
  t('51. tap highlight none', html.includes('-webkit-tap-highlight-color:transparent'));
  t('52. overflow-x:hidden', html.includes('overflow-x:hidden'));
  t('53. user-select none', html.includes('user-select:none'));
  t('54. max-width container', html.includes('max-width'));
  t('55. mobile media query', html.includes('@media(max-width:480px)'));
  t('56. CSS variables defined', html.includes('--bg:') && html.includes('--dot:'));

  // Monetization
  console.log('\n-- Monetization --');
  t('57. AdSense', html.includes('googlesyndication'));
  t('58. Adsterra manager', html.includes('adsterra-manager'));
  t('59. Monetag manager', html.includes('monetag-manager'));
  t('60. gz-analytics', html.includes('gz-analytics'));
  t('61. game-footer', html.includes('game-footer'));
  t('62. AdSense slot 1099212472', html.includes('1099212472'));
  t('63. AdSense slot 7373732357', html.includes('7373732357'));
  t('64. NO 1ktower zombie', !html.includes('1ktower'));
  t('65. NO m2d.m2cdn', !html.includes('m2d.m2cdn'));
  t('66. NO libtl', !html.includes('libtl'));
  t('67. NO goomaphy', !html.includes('goomaphy'));
  t('68. NO propellerads', !html.includes('propellerads'));
  t('69. NO adskeeper', !html.includes('adskeeper'));

  // Audio cleanup
  console.log('\n-- Audio Cleanup --');
  t('70. beforeunload cleanup', gameJs.includes('beforeunload'));
  t('71. pagehide cleanup', gameJs.includes('pagehide'));
  t('72. visibilitychange', gameJs.includes('visibilitychange'));
  t('73. audioCtx.close', gameJs.includes('audioCtx.close') || gameJs.includes('cleanupAudio'));
  t('74. clearInterval on music', gameJs.includes('clearInterval'));
  t('75. AudioContext suspended on hide', gameJs.includes('audioCtx.suspend'));

  // Levels
  console.log('\n-- Levels --');
  t('76. 30 levels', levels.length === 30, `${levels.length} levels`);
  t('77. 5 tiers', new Set(levels.map(l => l.tier)).size === 5);
  t('78. Beginner 6 levels', levels.filter(l => l.tier === 'Beginner').length === 6);
  t('79. Easy 6 levels', levels.filter(l => l.tier === 'Easy').length === 6);
  t('80. Medium 6 levels', levels.filter(l => l.tier === 'Medium').length === 6);
  t('81. Hard 6 levels', levels.filter(l => l.tier === 'Hard').length === 6);
  t('82. Expert 6 levels', levels.filter(l => l.tier === 'Expert').length === 6);
  t('83. data.js valid JS', dataJs.startsWith('const DOT_A_PIX_LEVELS'));
  t('84. data.js includes levels array', dataJs.includes('"levels"'));
  t('85. All solutions non-empty', levels.every(l => l.solution.length > 0));

  // Final summary
  console.log('\n===');
  console.log(`  PASSED: ${passed}`);
  console.log(`  FAILED: ${failed}`);
  console.log(`  TOTAL:  ${passed + failed}`);
  console.log('===');

  if (failed === 0) {
    console.log(`✓ ALL ${passed} CHECKS PASS`);
    process.exit(0);
  } else {
    console.log(`✗ ${failed} CHECKS FAILED`);
    process.exit(1);
  }
}

main();
