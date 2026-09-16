#!/usr/bin/env node
/**
 * giraffe Path QA checklist.
 * Validates index.html + game.js + data.js + art assets against the GZ gate.
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

  console.log('=== Giraffe Path QA Checklist ===\n');

  // HTML structure
  console.log('-- HTML Structure --');
  t('1. <!DOCTYPE html>', html.startsWith('<!DOCTYPE html>'));
  t('2. <html lang="en">', html.includes('<html lang="en">'));
  t('3. <meta charset="UTF-8">', html.includes('charset="UTF-8"'));
  t('4. <meta viewport>', html.includes('viewport'));
  t('5. <title>Giraffe Path', html.includes('<title>Giraffe Path'));
  t('6. <meta description>', html.includes('meta name="description"'));
  t('7. <link canonical>', html.includes('rel="canonical"'));
  t('8. <link rel=icon>', html.includes('rel="icon"'));
  t('9. theme-color meta', html.includes('theme-color'));
  t('10. og:type', html.includes('og:type'));

  // SEO
  console.log('\n-- SEO --');
  t('11. og:title', html.includes('og:title'));
  t('12. og:description', html.includes('og:description'));
  t('13. og:image', html.includes('og:image'));
  t('14. og:url', html.includes('og:url'));
  t('15. twitter:card', html.includes('twitter:card'));
  t('16. twitter:title', html.includes('twitter:title'));
  t('17. twitter:description', html.includes('twitter:description'));
  t('18. canonical URL', html.includes('https://gamezipper.com/giraffe-path/'));
  t('19. JSON-LD VideoGame', html.includes('"@type":"VideoGame"'));
  t('20. JSON-LD FAQPage', html.includes('"@type":"FAQPage"'));
  t('21. JSON-LD BreadcrumbList', html.includes('"@type":"BreadcrumbList"'));
  t('22. No aggregateRating (new game)', !html.includes('aggregateRating'));

  // Accessibility
  console.log('\n-- Accessibility --');
  t('23. gz-sr-only H1', html.includes('gz-sr-only') && /<h1[^>]*>Giraffe Path/i.test(html));
  t('24. Skip-link', html.includes('Skip to main content'));
  t('25. aria-label on Play btn', html.includes('aria-label="Play 30 levels"'));
  t('26. role=button', html.includes('role="button"'));
  t('27. aria-label on How To Play', html.includes('aria-label="How to play"'));

  // Game systems
  console.log('\n-- Game Systems --');
  t('28. AudioContext music', gameJs.includes('AudioContext') && gameJs.includes('playBgMusic'));
  t('29. Sound effects (sfx)', gameJs.includes('playSfx'));
  t('30. localStorage save', gameJs.includes('localStorage') && gameJs.includes('SAVE_KEY'));
  t('31. Hints (3 per level)', gameJs.includes('HINT_LIMIT') && gameJs.includes('useHint'));
  t('32. Undo', gameJs.includes('undoStep'));
  t('33. 3-star rating', gameJs.includes('computeStars') && gameJs.includes('bestTimes'));
  t('34. Level select', gameJs.includes('renderLevels'));
  t('35. Keyboard support', gameJs.includes('keydown') && gameJs.includes('Enter'));
  t('36. Touch support', gameJs.includes('touchstart'));
  t('37. Restart', gameJs.includes('resetLevel'));

  // Levels data
  console.log('\n-- Levels Data --');
  t('38. 30 levels total', levels.levels.length === 30);
  t('39. 5 tiers', new Set(levels.levels.map(l => l.tier)).size === 5);
  t('40. All levels have solution_path', levels.levels.every(l => Array.isArray(l.solution_path) && l.solution_path.length >= 2));
  t('41. All levels have start', levels.levels.every(l => Array.isArray(l.start) && l.start.length === 2));
  t('42. All levels have goal', levels.levels.every(l => Array.isArray(l.goal) && l.goal.length === 2));
  t('43. data.js window export', dataJs.includes('window.GIRAFFE_PATH_DATA'));

  // Mobile responsive
  console.log('\n-- Mobile --');
  t('44. viewport-fit=cover', html.includes('viewport-fit=cover'));
  t('45. env(safe-area-inset', html.includes('env(safe-area-inset'));
  t('46. touch-action:none on canvas', html.includes('touch-action:none'));
  t('47. -webkit-tap-highlight', html.includes('-webkit-tap-highlight-color'));

  // Ads and analytics
  console.log('\n-- Ads & Analytics --');
  t('48. gz-ad-above-game', html.includes('gz-ad-above-game'));
  t('49. gz-ad-below-canvas', html.includes('gz-ad-below-canvas'));
  t('50. gz-ad-below-game', html.includes('gz-ad-below-game'));
  t('51. gz-analytics loaded', html.includes('gz-analytics.js'));
  t('52. adsterra-manager', html.includes('adsterra-manager.js'));
  t('53. monetag-manager', html.includes('monetag-manager.js'));
  t('54. AdSense slot 1099212472', html.includes('1099212472'));
  t('55. AdSense slot 7373732357', html.includes('7373732357'));
  t('56. gzAnalytics.gameLoaded call', html.includes('gameLoaded'));
  t('57. gzAnalytics.gameStart call', html.includes('gameStart'));
  t('58. gzAnalytics.gameEnd call', html.includes('gameEnd'));
  t('59. game-footer.js', html.includes('game-footer.js'));
  t('60. pagehide cleanup', html.includes('pagehide'));

  // Audio cleanup
  console.log('\n-- Audio Cleanup --');
  t('61. visibilitychange handler', gameJs.includes('visibilitychange'));
  t('62. beforeunload audio close', gameJs.includes('beforeunload') && gameJs.includes('audioCtx.close'));
  t('63. pagehide audio close', gameJs.includes('pagehide') && gameJs.includes('audioCtx.close'));

  // No zombie ad networks
  console.log('\n-- Zombie Ad Network Check --');
  const zombieNetworks = ['1ktower', 'm2d.m2cdn', 'libtl', 'goomaphy', 'propellerads', 'adskeeper'];
  zombieNetworks.forEach((net, i) => {
    t(`${64 + i}. No zombie ad: ${net}`, !html.includes(net));
  });

  // Asset size
  console.log('\n-- Asset Size --');
  t('70. icon.png < 100KB', icon.size < 100 * 1024, `${(icon.size / 1024).toFixed(1)}KB`);
  t('71. og-image.jpg < 200KB', og.size < 200 * 1024, `${(og.size / 1024).toFixed(1)}KB`);

  // File sizes
  console.log('\n-- File Sizes --');
  const htmlSize = fs.statSync(path.join(ROOT, 'index.html')).size;
  const gameSize = fs.statSync(path.join(ROOT, 'game.js')).size;
  const dataSize = fs.statSync(path.join(ROOT, 'data.js')).size;
  t('72. index.html < 100KB', htmlSize < 100 * 1024, `${(htmlSize / 1024).toFixed(1)}KB`);
  t('73. game.js < 100KB', gameSize < 100 * 1024, `${(gameSize / 1024).toFixed(1)}KB`);
  t('74. data.js < 100KB', dataSize < 100 * 1024, `${(dataSize / 1024).toFixed(1)}KB`);

  // Tier distribution
  console.log('\n-- Tier Distribution --');
  const tierCounts = {};
  levels.levels.forEach(l => { tierCounts[l.tier] = (tierCounts[l.tier] || 0) + 1; });
  ['Beginner', 'Easy', 'Medium', 'Hard', 'Expert'].forEach((tier, i) => {
    t(`${75 + i}. Tier ${tier} has 6 levels`, tierCounts[tier] === 6, `n=${tierCounts[tier]}`);
  });

  // No console errors expected (manual check)
  console.log('\n-- Functional (manual) --');
  t('81. checkSolution function exists', gameJs.includes('checkSolution'));
  t('82. tryExtendPath exists', gameJs.includes('tryExtendPath'));
  t('83. draw() function exists', gameJs.includes('function draw('));
  t('84. resizeCanvas exists', gameJs.includes('resizeCanvas'));
  t('85. Confetti on win', gameJs.includes('spawnConfetti'));
  t('86. window.giraffepath exposed', gameJs.includes('window.giraffepath'));

  console.log(`\n=== RESULT: ${passed}/${passed + failed} PASS, ${failed} FAIL ===`);
  process.exit(failed === 0 ? 0 : 1);
}

main();
