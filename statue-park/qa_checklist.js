// qa_checklist.js — Code-level QA for Statue Park
const fs = require('fs');

let pass = 0, fail = 0;
const issues = [];
function check(name, cond) {
    if (cond) { pass++; console.log('  ✓', name); }
    else { fail++; issues.push(name); console.log('  ✗', name); }
}

console.log('\n=== Statue Park QA Checklist ===\n');

const html = fs.readFileSync('index.html', 'utf8');

// 1. Required meta tags
console.log('[1] Meta tags & SEO');
check('title tag', /<title>Statue Park[^<]*<\/title>/i.test(html));
check('meta description', /<meta name="description"/i.test(html));
check('canonical link', /<link rel="canonical"/i.test(html));
check('og:title', /<meta property="og:title"/i.test(html));
check('og:description', /<meta property="og:description"/i.test(html));
check('og:url', /<meta property="og:url"/i.test(html));
check('og:image', /<meta property="og:image"/i.test(html));
check('twitter:card', /<meta name="twitter:card"/i.test(html));
check('icon link', /<link rel="icon"[^>]*icon\.png/i.test(html));

// 2. JSON-LD blocks
console.log('\n[2] JSON-LD structured data');
const ldCount = (html.match(/<script type="application\/ld\+json">/g) || []).length;
check('4 JSON-LD blocks', ldCount === 4);
check('VideoGame JSON-LD', /"@type":"VideoGame"/.test(html));
check('HowTo JSON-LD', /"@type":"HowTo"/.test(html));
check('FAQPage JSON-LD', /"@type":"FAQPage"/.test(html));
check('BreadcrumbList JSON-LD', /"@type":"BreadcrumbList"/.test(html));

// 3. Accessibility
console.log('\n[3] Accessibility');
check('gz-sr-only H1', /<h1 class="gz-sr-only">.*Statue Park/.test(html));
check('viewport meta', /viewport/.test(html));

// 4. Game features
console.log('\n[4] Game features');
const lvlMatch = html.match(/var LEVELS=(\[[\s\S]*?\]);/);
const lvlData = lvlMatch ? JSON.parse(lvlMatch[1]) : [];
check('30 levels in data', lvlData.length === 30);
check('5 shape bank', /SHAPE_ORDER\s*=\s*\[['"]I['"],\s*['"]O['"],\s*['"]T['"],\s*['"]L['"],\s*['"]S['"]\]/.test(html));
check('Shape palette UI', /palette[\s\S]*?shapeBtn/.test(html) || /id="palette"/.test(html));
check('Hint system', /useHint[\s\S]*?hintsLeft/.test(html) || /function useHint/.test(html));
check('Undo system', /function undo/.test(html) && /history/.test(html));
check('Restart button', /function restart/.test(html));
check('Level select', /function renderLevelGrid/.test(html));
check('localStorage save', /localStorage/.test(html));
check('Win detection', /function isWinState|isWinState\s*\(/.test(html));
check('Web Audio API', /AudioContext|webkitAudioContext/.test(html));
check('Keyboard support', /keydown/.test(html));
check('Rotation (R)', /activeOrient/.test(html));
check('Touch support', /touchstart/.test(html));
check('Music toggle', /musicBtn/.test(html));
check('Sound toggle', /soundBtn/.test(html));
check('Mouse hover preview', /hoverCell/.test(html));
check('Invalid placement warning', /canPlace[\s\S]*?return false/.test(html));

// 5. Game logic
console.log('\n[5] Game logic invariants');
check('All 8 orientations generator', /function allOrientations/.test(html));
check('Adjacency check in canPlace', /blocked[\s\S]*?orthogonal|ortho|adjacent/i.test(html) || /ortho/.test(html));
check('Connectivity check', /is_connected|isConnected|connected/i.test(html));

// 6. Asset references
console.log('\n[6] Asset references');
check('icon.png referenced in HTML', /icon\.png/.test(html));
check('og-image.jpg referenced in HTML', /og-image\.jpg/.test(html));
check('icon.png file exists', fs.existsSync('icon.png'));
check('og-image.jpg file exists', fs.existsSync('og-image.jpg'));

// 7. Clean code
console.log('\n[7] External scripts');
check('No site-analytics pixel', !/site-analytics/.test(html));
check('Has gz-analytics', /gz-analytics/.test(html));
check('Has adsterra-manager', /adsterra-manager/.test(html));
check('Has monetag-manager', /monetag-manager/.test(html));
check('Has game-footer', /game-footer/.test(html));

// 8. Level data
console.log('\n[8] Level data');
const tiers = ['Beginner','Easy','Medium','Hard','Expert'];
tiers.forEach(t => {
    const count = lvlData.filter(l => l.tier === t).length;
    check(`6 levels in ${t}`, count === 6);
});
let dataOk = true;
lvlData.forEach(l => {
    if (l.shapes.length !== 5) { issues.push(`L${l.id} shape count ${l.shapes.length}`); dataOk = false; }
    if (l.solution.length !== 5) { issues.push(`L${l.id} solution count`); dataOk = false; }
    if (!l.R || !l.C) { issues.push(`L${l.id} dims`); dataOk = false; }
    // validate solution structure
    l.solution.forEach(([name, cells]) => {
        if (!cells || cells.length !== 4) { issues.push(`L${l.id} ${name} not 4 cells`); dataOk = false; }
    });
});
check('All levels have 5 shapes and 5 solutions with 4 cells each', dataOk);

// 9. SEO content
console.log('\n[9] SEO content');
check('"How to Play" section', /How to Play/i.test(html));
check('Tips section', /Tips/i.test(html));
check('Related games links', /Related Games/i.test(html));
check('About section', /About the Puzzle/i.test(html));
check('Mention GM Puzzles', /Grandmaster Puzzles|GM Puzzles|gmpuzzles/i.test(html));
check('Mention Palmer Mebane', /Palmer Mebane/i.test(html));

// 10. Required URL/category mentions
console.log('\n[10] Categorization');
check('Category: Puzzle', /"puzzle"|"Puzzle"/i.test(html) || /genre/i.test(html));
check('ApplicationCategory: Game', /applicationCategory.*Game/.test(html));
check('Free price', /price.*0/.test(html));

console.log('\n=== Summary ===');
console.log(`PASS: ${pass}`);
console.log(`FAIL: ${fail}`);
if (issues.length) {
    console.log('\nIssues:');
    issues.forEach(i => console.log(' -', i));
}
process.exit(fail === 0 ? 0 : 1);
