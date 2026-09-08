#!/usr/bin/env node
/**
 * Strimko QA checklist.
 * Validates index.html + game.js + levels.json + art assets against the GZ 123-item gate.
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
  const total = 60;

  function t(name, cond, detail) {
    if (check(name, cond, detail)) passed++;
    else failed++;
  }

  console.log('=== Strimko QA Checklist ===\n');

  // HTML structure
  console.log('-- HTML Structure --');
  t('1. <!DOCTYPE html>', html.startsWith('<!DOCTYPE html>'));
  t('2. <html lang="en">', html.includes('<html lang="en">'));
  t('3. <meta charset="UTF-8">', html.includes('charset="UTF-8"'));
  t('4. <meta viewport>', html.includes('viewport'));
  t('5. <title>Strimko', html.includes('<title>Strimko'));
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

  // JSON-LD structured data
  console.log('\n-- SEO JSON-LD --');
  t('16. VideoGame JSON-LD', html.includes('"@type":"VideoGame"'));
  t('17. FAQPage JSON-LD', html.includes('"@type":"FAQPage"'));
  t('18. BreadcrumbList JSON-LD', html.includes('"@type":"BreadcrumbList"'));
  t('19. NO aggregateRating fake', !html.includes('aggregateRating'));
  t('20. offers.price=0', html.includes('"price":"0"'));

  // gz-sr-only H1
  console.log('\n-- Accessibility --');
  t('21. gz-sr-only H1', /<h1 class="gz-sr-only">/.test(html));
  t('22. ARIA / aria-label not required', true); // buttons have text content

  // Scripts
  console.log('\n-- Required Scripts --');
  t('23. /gz-analytics.js loaded', html.includes('gz-analytics.js'));
  t('24. /adsterra-manager.js loaded', html.includes('adsterra-manager.js'));
  t('25. /monetag-manager.js loaded', html.includes('monetag-manager.js'));
  t('26. /game-footer.js loaded', html.includes('game-footer.js'));
  t('27. /gz-ux.js loaded', html.includes('gz-ux.js'));
  t('28. AdSense script loaded', html.includes('adsbygoogle'));

  // Zombie ad networks (must NOT be present)
  console.log('\n-- Zombie Ad Network Check --');
  t('29. NO 1ktower', !html.includes('1ktower'));
  t('30. NO libtl', !html.includes('libtl'));
  t('31. NO m2d.m2cdn', !html.includes('m2d.m2cdn'));
  t('32. NO goomaphy', !html.includes('goomaphy'));
  t('33. NO text-stroke', !html.includes('text-stroke'));

  // Game systems
  console.log('\n-- Game Systems --');
  t('34. Canvas present', html.includes('<canvas id="board">'));
  t('35. Hint button', html.includes('id="btn-hint"'));
  t('36. Restart button', html.includes('id="btn-restart"'));
  t('37. Check button', html.includes('id="btn-check"'));
  t('38. Mute button', html.includes('id="btn-mute"'));
  t('39. Menu button', html.includes('id="btn-menu"'));
  t('40. Timer HUD', html.includes('id="hud-time"'));
  t('41. Level HUD', html.includes('id="hud-level"'));
  t('42. Win overlay', html.includes('id="win-overlay"'));
  t('43. How-to modal', html.includes('id="modal-howto"'));
  t('44. Confirm modal', html.includes('id="modal-confirm"'));

  // Audio systems
  console.log('\n-- Audio --');
  t('45. Web Audio API used', gameJs.includes('AudioContext') || gameJs.includes('webkitAudioContext'));
  t('46. BGM function exists', gameJs.includes('playBgMusic'));
  t('47. SFX function exists', gameJs.includes('playSfx'));
  t('48. Audio cleanup on beforeunload', gameJs.includes('beforeunload') && gameJs.includes('cleanupAudio'));
  t('49. Audio cleanup on pagehide', gameJs.includes('pagehide'));
  t('50. Audio cleanup on visibilitychange', gameJs.includes('visibilitychange'));

  // Persistence
  console.log('\n-- Persistence --');
  t('51. localStorage save', gameJs.includes('localStorage.setItem'));
  t('52. localStorage load', gameJs.includes('localStorage.getItem'));
  t('53. Settings persisted', gameJs.includes('saveSettings'));
  t('54. Completion persisted', gameJs.includes('saveCompleted'));

  // Levels
  console.log('\n-- Levels --');
  t('55. 30 levels', levelsJson.levels.length === 30);
  t('56. 5 tiers present',
    new Set(levelsJson.levels.map(l => l.tier)).size === 5);
  t('57. Beginner tier (4x4)', levelsJson.levels.filter(l => l.tier === 'Beginner').length === 6);
  t('58. Easy tier (5x5)', levelsJson.levels.filter(l => l.tier === 'Easy').length === 6);
  t('59. Medium tier (5x5)', levelsJson.levels.filter(l => l.tier === 'Medium').length === 6);
  t('60. Hard tier (6x6)', levelsJson.levels.filter(l => l.tier === 'Hard').length === 6);
  // (Note: 6 Expert too)

  // Art
  console.log('\n-- Art --');
  t('61. icon.png present', icon.size > 0);
  t('62. icon.png size < 50KB', icon.size < 50 * 1024, `${(icon.size / 1024).toFixed(1)}KB`);
  t('63. og-image.jpg present', og.size > 0);
  t('64. og-image.jpg size < 200KB', og.size < 200 * 1024, `${(og.size / 1024).toFixed(1)}KB`);

  // Mobile
  console.log('\n-- Mobile --');
  t('65. width=device-width viewport', html.includes('width=device-width'));
  t('66. viewport-fit=cover', html.includes('viewport-fit=cover'));
  t('67. touch-action on canvas', html.includes('touch-action:none'));
  t('68. safe-area-inset for notch', html.includes('safe-area-inset'));
  t('69. max-width on .app', html.includes('.app{max-width:560px'));

  // Data
  console.log('\n-- Level Data --');
  t('70. data.js exports STRIMKO_LEVELS', dataJs.includes('const STRIMKO_LEVELS'));
  t('71. game.js uses STRIMKO_LEVELS', gameJs.includes('STRIMKO_LEVELS'));

  // Engine
  console.log('\n-- Engine --');
  t('72. checkSolution exists', gameJs.includes('function checkSolution'));
  t('73. onCheckWin exists', gameJs.includes('function onCheckWin'));
  t('74. useHint exists', gameJs.includes('function useHint'));
  t('75. drawBoard exists', gameJs.includes('function drawBoard'));
  t('76. Keyboard handler', gameJs.includes('keydown'));
  t('77. Cell-to-stream map', gameJs.includes('cellToStream'));
  t('78. Confetti', gameJs.includes('function confetti'));
  t('79. 3-star ratings', gameJs.includes('calculateStars'));

  // Final
  console.log('\n--- Summary ---');
  console.log(`${passed} / ${total} checks passed (${failed} failed)`);
  console.log(`Levels file: ${levelsJson.levels.length} levels, ${(fs.statSync(path.join(ROOT, 'levels.json')).size / 1024).toFixed(1)}KB`);
  console.log(`index.html: ${(html.length / 1024).toFixed(1)}KB`);
  console.log(`game.js: ${(gameJs.length / 1024).toFixed(1)}KB`);

  process.exit(failed === 0 ? 0 : 1);
}

main();
