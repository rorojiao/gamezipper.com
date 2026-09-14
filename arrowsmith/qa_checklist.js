#!/usr/bin/env node
/**
 * Arrowsmith QA checklist.
 * Validates index.html + game.js + data.js + art assets against the GZ 85-item gate.
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
  const levels = JSON.parse(fs.readFileSync(path.join(ROOT, 'levels.json'), 'utf8'));
  const icon = fs.statSync(path.join(ROOT, 'icon.png'));
  const og = fs.statSync(path.join(ROOT, 'og-image.jpg'));

  let passed = 0;
  let failed = 0;

  function t(name, cond, detail) {
    if (check(name, cond, detail)) passed++;
    else failed++;
  }

  console.log('=== Arrowsmith QA Checklist ===\n');

  // HTML structure (10)
  console.log('-- HTML Structure --');
  t('1. <!DOCTYPE html>', html.startsWith('<!DOCTYPE html>'));
  t('2. <html lang="en">', html.includes('<html lang="en">'));
  t('3. <meta charset="UTF-8">', html.includes('charset="UTF-8"'));
  t('4. <meta viewport>', html.includes('viewport'));
  t('5. <title>Arrowsmith', html.includes('<title>Arrowsmith'));
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
  t('16. VideoGame JSON-LD', html.includes('"@type":"VideoGame"'));
  t('17. FAQPage JSON-LD', html.includes('"@type":"FAQPage"'));
  t('18. BreadcrumbList JSON-LD', html.includes('"@type":"BreadcrumbList"'));
  t('19. No aggregateRating fake', !html.includes('aggregateRating'));
  t('20. canonical points to /arrowsmith/', html.includes('https://gamezipper.com/arrowsmith/'));
  t('21. gz-sr-only H1 present', html.includes('gz-sr-only'));
  t('22. unique offer price 0', html.includes('"price":"0"'));

  // Art assets (8)
  console.log('\n-- Art Assets --');
  t('23. icon.png <100KB', icon.size < 100 * 1024, `${icon.size} bytes`);
  t('24. og-image.jpg <200KB', og.size < 200 * 1024, `${og.size} bytes`);
  t('25. icon.png exists', icon.size > 0);
  t('26. og-image.jpg exists', og.size > 0);
  t('27. icon.png PNG header', fs.readFileSync(path.join(ROOT, 'icon.png')).slice(1, 4).toString() === 'PNG');
  t('28. og-image.jpg JPEG header', fs.readFileSync(path.join(ROOT, 'og-image.jpg'))[0] === 0xFF);

  // Game systems (15)
  console.log('\n-- Game Systems --');
  t('29. AudioContext music', gameJs.includes('playBgMusic'));
  t('30. AudioContext sfx', gameJs.includes('playSfx'));
  t('31. localStorage save', gameJs.includes('localStorage'));
  t('32. localStorage settings', gameJs.includes('musicEnabled') && gameJs.includes('sfxEnabled'));
  t('33. canvas rendering', gameJs.includes("getContext('2d')"));
  t('34. Click handler', gameJs.includes('onCanvasClick'));
  t('35. Touch handler', gameJs.includes('onCanvasTouch'));
  t('36. Keyboard handler', gameJs.includes('onKey'));
  t('37. Hint system', gameJs.includes('useHint') && gameJs.includes('HINT_LIMIT'));
  t('38. Check system', gameJs.includes('checkSolution'));
  t('39. Restart system', gameJs.includes('resetLevel'));
  t('40. Win detection', gameJs.includes('allSatisfied') || gameJs.includes('win()'));
  t('41. Star ratings', gameJs.includes('computeStars') || gameJs.includes('stars'));
  t('42. Confetti', gameJs.includes('showConfetti'));
  t('43. AudioContext cleanup', gameJs.includes('cleanupAudio') || gameJs.includes('audioCtx.close'));

  // Level data (10)
  console.log('\n-- Level Data --');
  t('44. data.js has 30 levels', levels.levels.length === 30, `${levels.levels.length} levels`);
  t('45. levels have tiers', levels.levels.every(l => l.tier));
  t('46. levels have arrows', levels.levels.every(l => l.arrows && l.arrows.length > 0));
  t('47. levels have counts', levels.levels.every(l => l.counts && l.counts.length > 0));
  t('48. levels have anchors', levels.levels.every(l => l.anchors && l.anchors.length > 0));
  t('49. all levels have names', levels.levels.every(l => l.name && l.name.length > 0));
  t('50. tier distribution OK',
    levels.levels.filter(l => l.tier === 'Beginner').length === 6 &&
    levels.levels.filter(l => l.tier === 'Easy').length === 6 &&
    levels.levels.filter(l => l.tier === 'Medium').length === 6 &&
    levels.levels.filter(l => l.tier === 'Hard').length === 6 &&
    levels.levels.filter(l => l.tier === 'Expert').length === 6);

  // Ads + scripts (8)
  console.log('\n-- Ads & Scripts --');
  t('51. AdSense script', html.includes('adsbygoogle.js'));
  t('52. AdSense slot 109', html.includes('1099212472'));
  t('53. AdSense slot 737', html.includes('7373732357'));
  t('54. gz-analytics.js', html.includes('gz-analytics.js'));
  t('55. monetag-manager.js', html.includes('monetag-manager.js'));
  t('56. adsterra-manager.js', html.includes('adsterra-manager.js'));
  t('57. game-footer.js', html.includes('game-footer.js'));
  t('58. data.js before game.js', html.indexOf('data.js') < html.indexOf('game.js'));

  // No zombies (5)
  console.log('\n-- No Zombie Ad Networks --');
  t('59. No 1ktower', !html.includes('1ktower'));
  t('60. No libtl', !html.includes('libtl.com'));
  t('61. No goomaphy', !html.includes('goomaphy'));
  t('62. No m2d.m2cdn', !html.includes('m2d.m2cdn'));
  t('63. No propellerads', !html.includes('propellerads'));

  // Responsive design (5)
  console.log('\n-- Responsive --');
  t('64. viewport-fit=cover', html.includes('viewport-fit=cover'));
  t('65. safe-area-inset', html.includes('safe-area-inset'));
  t('66. max-width media', html.includes('max-width') || html.includes('clamp('));
  t('67. touch-action: none', html.includes('touch-action'));
  t('68. user-select: none', html.includes('user-select'));

  // Accessibility (5)
  console.log('\n-- Accessibility --');
  t('69. gz-sr-only H1', html.includes('class="gz-sr-only"'));
  t('70. button aria/title', html.includes('title='));
  t('71. role/aria', html.includes('aria-') || html.includes('role='));
  t('72. Focus management', html.includes('tabindex') || html.includes('focus'));
  t('73. Keyboard accessible', html.includes('keydown'));

  // Game rules (8)
  console.log('\n-- Game Rules Documentation --');
  t('74. How to Play modal', html.includes('modal-howto'));
  t('75. Settings modal', html.includes('modal-settings'));
  t('76. Confirm modal', html.includes('modal-confirm'));
  t('77. Restart button', html.includes('btn-restart'));
  t('78. Check button', html.includes('btn-check'));
  t('79. Hint button', html.includes('btn-hint'));
  t('80. Menu button', html.includes('btn-menu'));
  t('81. Mute button', html.includes('btn-mute'));

  // Level select (4)
  console.log('\n-- Level Select --');
  t('82. tiers-container exists', html.includes('tiers-container'));
  t('83. level-grid class', html.includes('level-grid'));
  t('84. tier-section class', html.includes('tier-section'));
  t('85. back-to-title button', html.includes('btn-back-title'));

  console.log(`\n=== ${passed} PASS, ${failed} FAIL, ${passed + failed} TOTAL ===`);
  process.exit(failed === 0 ? 0 : 1);
}

main();
