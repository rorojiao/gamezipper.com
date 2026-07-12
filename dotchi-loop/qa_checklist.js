// Code-level QA checklist for Dotchi-Loop
const fs = require('fs');
const html = fs.readFileSync('index.html', 'utf8');

const checks = {
  // SEO / metadata
  'Title tag': /<title>Dotchi-Loop/.test(html),
  'Meta description': /name="description"/.test(html) && /Dotchi-Loop/.test(html),
  'Canonical link': /rel="canonical".*dotchi-loop/.test(html),
  'OG title': /og:title.*Dotchi-Loop/.test(html),
  'OG image': /og:image.*dotchi-loop\/og-image/.test(html),
  'VideoGame JSON-LD': /@type":"VideoGame"/.test(html),
  'FAQPage JSON-LD': /@type":"FAQPage"/.test(html),
  'BreadcrumbList JSON-LD': /@type":"BreadcrumbList"/.test(html),
  'SR-only H1': /gz-sr-only/.test(html) && /<h1[^>]*>Dotchi-Loop/.test(html),
  // Game systems
  'Canvas board': /getContext/.test(html),
  'LEVELS embedded': /const LEVELS=/.test(html),
  '30 levels': (html.match(/"num":\d+/g) || []).length >= 30,
  'Edge interaction': /getEdgeNear/.test(html),
  'Draw mode': /setMode\('draw'\)/.test(html),
  'Erase mode': /setMode\('erase'\)/.test(html),
  'checkSolution': /function checkSolution/.test(html),
  'Hint system': /function useHint/.test(html),
  'Hint count display': /hint-count/.test(html),
  'Clear button': /function clearEdges/.test(html),
  'Level select menu': /function buildMenu/.test(html),
  'Settings overlay': /settings-overlay/.test(html),
  'Help overlay': /help-overlay/.test(html),
  'Win overlay': /win-overlay/.test(html),
  'Star ratings': /stars/.test(html),
  'Timer': /function startTimer/.test(html),
  'Web Audio init': /function initAudio/.test(html),
  'SFX function': /function playSfx/.test(html),
  'BGM function': /function startMusic/.test(html),
  'localStorage progress': /function saveProgress/.test(html),
  'localStorage settings': /function saveSettings/.test(html),
  'Confetti': /function launchConfetti/.test(html),
  'Toast messages': /function showToast/.test(html),
  'Keyboard support': /addEventListener\('keydown'/.test(html),
  'Touch/pointer support': /addEventListener\('pointerdown'/.test(html),
  'Region rendering': /regions\[r\]\[c\]/.test(html) || /regionColors/.test(html),
  'Region borders': /#ff6b9d/.test(html),
  'White circles': /white circles/.test(html) || /L\.white/.test(html),
  'Resize handler': /window.addEventListener\('resize'/.test(html),
  // Site chrome
  'gz-topnav': /gz-topnav/.test(html),
  'GameZipper link': /gamezipper\.com\//.test(html),
  'gz-analytics': /gz-analytics\.js/.test(html),
  'game-footer': /game-footer\.js/.test(html),
  'Monetag': /monetag/.test(html),
  'Adsterra': /adsterra/.test(html),
  'Ad div below game': /gz-ad-below-game/.test(html),
  // Favicon
  'Favicon data URI': /rel="icon".*data:image/.test(html),
};

let pass = 0, fail = 0;
for (const [name, ok] of Object.entries(checks)) {
  console.log((ok ? '✅' : '❌') + ' ' + name);
  if (ok) pass++; else fail++;
}
console.log(`\nQA: ${pass}/${pass + fail} checks passed`);
// JS syntax check
try {
  // extract main script
  const m = html.match(/<script>\n\/\/ ============ LEVELS[\s\S]*?<\/script>/);
  if (m) {
    const code = m[0].replace(/<\/?script>/g, '');
    new Function(code);
    console.log('✅ JS syntax valid');
    pass++;
  } else {
    console.log('❌ Could not extract main script for syntax check');
    fail++;
  }
} catch (e) {
  console.log('❌ JS syntax error: ' + e.message);
  fail++;
}
console.log(`\nFinal: ${pass}/${pass + fail - (pass+fail > 0 ? 0 : 0)} total checks`);
process.exit(fail > 0 ? 1 : 0);
