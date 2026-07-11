// qa_checklist.js — Code-level QA checklist for Round Trip
const fs = require('fs');
const html = fs.readFileSync('index.html', 'utf8');

const checks = {
  'DOCTYPE': html.includes('<!DOCTYPE html>'),
  'lang attr': html.includes('<html lang="en">'),
  'viewport meta': html.includes('name="viewport"'),
  'theme-color': html.includes('name="theme-color"'),
  'title tag': html.includes('<title>') && html.includes('Round Trip'),
  'meta description': html.includes('name="description"'),
  'meta keywords': html.includes('name="keywords"'),
  'canonical link': html.includes('rel="canonical"'),
  'og:title': html.includes('property="og:title"'),
  'og:description': html.includes('property="og:description"'),
  'og:image': html.includes('property="og:image"'),
  'twitter:card': html.includes('name="twitter:card"'),
  'JSON-LD VideoGame': html.includes('"@type":"VideoGame"'),
  'JSON-LD FAQPage': html.includes('"@type":"FAQPage"'),
  'JSON-LD HowTo': html.includes('"@type":"HowTo"'),
  'JSON-LD BreadcrumbList': html.includes('"@type":"BreadcrumbList"'),
  'gz-sr-only H1': html.includes('class="gz-sr-only"'),
  'Canvas element': html.includes('<canvas id="c">'),
  'LEVELS data': html.includes('const LEVELS = ['),
  '30 levels': html.includes('"level":30,') || html.includes('"level": 30,'),
  'initLevel function': html.includes('function initLevel('),
  'checkWin function': html.includes('function checkWin('),
  'useHint function': html.includes('function useHint('),
  'clearGrid function': html.includes('function clearGrid('),
  'saveProgress/localStorage': html.includes('localStorage') && html.includes('saveProgress'),
  'Web Audio initAudio': html.includes('function initAudio('),
  'BGM start/stop': html.includes('function startBGM(') && html.includes('function stopBGM('),
  'SFX functions': html.includes('sfxPlace') && html.includes('sfxWin') && html.includes('sfxHint'),
  'Tier names': html.includes('TIER_NAMES'),
  'Tier colors': html.includes('TIER_COLORS'),
  'Menu rendering': html.includes('function drawMenu('),
  'Game rendering': html.includes('function drawGame('),
  'Win overlay': html.includes('function drawWon('),
  'Confetti': html.includes('function spawnConfetti('),
  'Keyboard support': html.includes('addEventListener(\'keydown\''),
  'Touch/pointer support': html.includes('addEventListener(\'pointerdown\''),
  'Star ratings': html.includes('stars') && html.includes('3 - hintsUsed'),
  'Settings sound toggle': html.includes('settings.sound'),
  'Settings music toggle': html.includes('settings.music'),
  'Autocheck option': html.includes('autocheck'),
  'gz-analytics.js': html.includes('gz-analytics.js'),
  'game-footer.js': html.includes('game-footer.js'),
  'icon.png link': html.includes('/round-trip/icon.png'),
  'og-image.jpg link': html.includes('/round-trip/og-image.jpg'),
  'Inter font': html.includes('fonts.googleapis.com'),
  'Monetag ad zone': html.includes('monetag-ad') || html.includes('monetag'),
};

let passCount = 0;
let failCount = 0;
for (const [name, ok] of Object.entries(checks)) {
  console.log(`  ${ok ? '✅' : '❌'} ${name}`);
  if (ok) passCount++; else failCount++;
}

console.log(`\n${passCount}/${passCount + failCount} checks passed (${failCount} failed)`);

// Check for JS errors via syntax
try {
  const scriptMatch = html.match(/<script>([\s\S]*?)<\/script>\s*<!--/);
  if (scriptMatch) {
    new Function(scriptMatch[1]);
    console.log('✅ JS syntax OK');
  }
} catch(e) {
  console.log('❌ JS syntax ERROR:', e.message);
  failCount++;
}

process.exit(failCount === 0 ? 0 : 1);
