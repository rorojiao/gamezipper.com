// QA Checklist for Nuritwin - code-level verification
const fs = require('fs');
const vm = require('vm');

const html = fs.readFileSync('/home/msdn/gamezipper.com/nuritwin/index.html', 'utf8');
let checks = [];
function check(name, cond) { checks.push({name, pass: !!cond}); }

// 1. HTML structure
check('Has DOCTYPE', html.startsWith('<!DOCTYPE html>'));
check('Has <html lang="en">', html.includes('<html lang="en">'));
check('Has charset UTF-8', html.includes('charset="UTF-8"'));
check('Has viewport meta', html.includes('viewport'));
check('Has theme-color', html.includes('theme-color'));
check('Has title with Nuritwin', html.includes('<title>') && html.includes('Nuritwin'));
check('Has meta description', html.includes('name="description"'));
check('Has meta keywords', html.includes('name="keywords"'));
check('Has canonical link', html.includes('rel="canonical"') && html.includes('gamezipper.com/nuritwin/'));
check('Has og:title', html.includes('og:title'));
check('Has og:description', html.includes('og:description'));
check('Has og:url', html.includes('og:url'));
check('Has og:image', html.includes('og:image'));
check('Has twitter:card', html.includes('twitter:card'));
check('Has favicon SVG', html.includes('rel="icon"'));

// 2. JSON-LD structured data
check('Has VideoGame JSON-LD', html.includes('"@type":"VideoGame"') && html.includes('Nuritwin'));
check('Has FAQPage JSON-LD', html.includes('"@type":"FAQPage"'));
check('Has BreadcrumbList JSON-LD', html.includes('"@type":"BreadcrumbList"'));
check('JSON-LD has offers price 0', html.includes('"price":"0"'));
check('JSON-LD has publisher GameZipper', html.includes('GameZipper'));

// 3. SEO essentials
check('Has gz-sr-only H1', html.includes('gz-sr-only') && html.includes('Nuritwin'));
check('No site-analytics pixel (deprecated)', !html.includes('site-analytics') || html.toLowerCase().indexOf('site-analytics') === -1);

// 4. Game code checks
const scriptMatch = html.match(/<script>([\s\S]*?)<\/script>\s*<\/body>/);
check('Has main script block', !!scriptMatch);
if (scriptMatch) {
  const js = scriptMatch[1];
  check('Has LEVELS array', js.includes('var LEVELS='));
  check('Has PUZZLES', js.includes('PUZZLES'));
  check('Has state object', js.includes('var state='));
  check('Has checkSolution function', js.includes('function checkSolution'));
  check('Has drawBoard function', js.includes('function drawBoard'));
  check('Has startLevel function', js.includes('function startLevel'));
  check('Has useHint function', js.includes('function useHint'));
  check('Has restartLevel function', js.includes('function restartLevel'));
  check('Has nextLevel function', js.includes('function nextLevel'));
  check('Has showLevelSelect function', js.includes('function showLevelSelect'));
  check('Has localStorage save', js.includes('localStorage'));
  check('Has Web Audio', js.includes('AudioContext') || js.includes('audioCtx'));
  check('Has playSfx', js.includes('function playSfx'));
  check('Has startBGM', js.includes('function startBGM'));
  check('Has confetti/particles', js.includes('particles'));
  check('Has keyboard support', js.includes('addEventListener(\'keydown\''));
  check('Has touch support', js.includes('touchstart') || js.includes('touches'));
  check('Has canvas', js.includes('canvas') && js.includes('getContext'));
  check('Has 30 levels embedded', (js.match(/{r:\d+,c:\d+,rg:/g) || []).length === 30);
  check('Has tier system', js.includes('TIER_NAMES'));
  check('Has star ratings', js.includes('saveBest') && js.includes('stars'));
  check('Has settings (sfx/music/autocheck)', js.includes('toggleSfx') && js.includes('toggleMusic') && js.includes('toggleAutoCheck'));
  check('Has region rendering', js.includes('getRegionColor'));
  check('Has violation detection (2x2)', js.includes('checkViolations') || js.includes('2x2'));
  check('JS syntax valid', (() => { try { new Function(js.replace('__LEVELS_JS__','var LEVELS=[];')); return true; } catch(e){ return false; } })());
}

// 5. Assets
check('icon.png exists', fs.existsSync('/home/msdn/gamezipper.com/nuritwin/icon.png'));
check('og-image.jpg exists', fs.existsSync('/home/msdn/gamezipper.com/nuritwin/og-image.jpg'));
check('BENCHMARK.md exists', fs.existsSync('/home/msdn/gamezipper.com/nuritwin/BENCHMARK.md'));
check('gen_levels.py exists', fs.existsSync('/home/msdn/gamezipper.com/nuritwin/gen_levels.py'));
check('levels.json exists', fs.existsSync('/home/msdn/gamezipper.com/nuritwin/levels.json'));

// Report
let pass = 0, fail = 0;
checks.forEach(c => {
  console.log((c.pass ? 'PASS' : 'FAIL') + ': ' + c.name);
  if (c.pass) pass++; else fail++;
});
console.log('\n' + pass + '/' + checks.length + ' checks passed, ' + fail + ' failed');
process.exit(fail > 0 ? 1 : 0);
