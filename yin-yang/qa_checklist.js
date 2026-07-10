/**
 * Yin-Yang — Code-level QA Checklist
 */
const fs=require('fs');
const html=fs.readFileSync(__dirname+'/index.html','utf8');
let pass=0,fail=0;const fails=[];
function chk(name,cond){if(cond){pass++;}else{fail++;fails.push(name);}}

// SEO / head
chk('has <title> with Yin-Yang',/<title>[^<]*Yin-Yang/.test(html));
chk('has meta description',/<meta name="description"/.test(html));
chk('has meta keywords',/<meta name="keywords"/.test(html));
chk('has canonical',/rel="canonical"/.test(html));
chk('has og:title',/property="og:title"/.test(html));
chk('has og:image',/property="og:image"/.test(html));
chk('has twitter:card',/name="twitter:card"/.test(html));
chk('has favicon icon',/rel="icon"/.test(html));
chk('VideoGame JSON-LD',/"@type":"VideoGame"/.test(html));
chk('FAQPage JSON-LD',/"@type":"FAQPage"/.test(html));
chk('HowTo JSON-LD',/"@type":"HowTo"/.test(html));
chk('BreadcrumbList JSON-LD',/"@type":"BreadcrumbList"/.test(html));
chk('gz-sr-only H1',/<h1 class="gz-sr-only"/.test(html));
chk('theme-color meta',/name="theme-color"/.test(html));
chk('viewport meta',/name="viewport"/.test(html));

// site integration
chk('gz-topnav present',/id="gz-topnav"/.test(html));
chk('gz-analytics.js included',/gz-analytics\.js/.test(html));
chk('game-footer.js included',/game-footer\.js/.test(html));
chk('monetag-manager.js included',/monetag-manager\.js/.test(html));
chk('NO deprecated site-analytics pixel',!/site-analytics/.test(html));

// game systems
chk('LEVELS array present',/const LEVELS=\[/.test(html));
chk('30 levels embedded',(html.match(/"tier"/g)||[]).length===30);
chk('canvas element',/id="game-canvas"/.test(html));
chk('checkWin function',/function checkWin\(/.test(html));
chk('connectedColor function',/function connectedColor\(/.test(html));
chk('findMonoBlocks function',/function findMonoBlocks\(/.test(html));
chk('hint system',/function doHint\(/.test(html));
chk('check button handler',/function doCheck\(/.test(html));
chk('clear handler',/function doClear\(/.test(html));
chk('restart handler',/function doRestart\(/.test(html));
chk('level select builder',/function buildLevelSelect\(/.test(html));
chk('win overlay',/id="win-overlay"/.test(html));
chk('confetti',/function launchConfetti\(/.test(html));
chk('3-star rating logic',/hintsUsed===0\?3/.test(html));

// audio
chk('AudioContext init',/function initAudio\(/.test(html));
chk('startMusic',/function startMusic\(/.test(html));
chk('SFX white',/function sfxWhite\(/.test(html));
chk('SFX win',/function sfxWin\(/.test(html));
chk('SFX error',/function sfxError\(/.test(html));

// persistence & settings
chk('localStorage progress',/yinyang-progress/.test(html));
chk('localStorage settings',/yinyang-settings/.test(html));
chk('sfx toggle',/id="toggle-sfx"/.test(html));
chk('music toggle',/id="toggle-music"/.test(html));
chk('autocheck toggle',/id="toggle-autocheck"/.test(html));

// input
chk('click handler',/canvas\.addEventListener\('click'/.test(html));
chk('touch handler',/canvas\.addEventListener\('touchstart'/.test(html));
chk('contextmenu handler',/canvas\.addEventListener\('contextmenu'/.test(html));
chk('keyboard handler',/addEventListener\('keydown'/.test(html));

// no leftover placeholder
chk('no __LEVELS__ placeholder',!/__LEVELS__/.test(html));

console.log('\n=== Yin-Yang QA Checklist ===');
console.log('PASS:',pass,' FAIL:',fail,' TOTAL:',pass+fail);
if(fail>0){console.log('\nFailed checks:');fails.forEach(f=>console.log('  ❌',f));}
else console.log('\n✅ ALL QA CHECKS PASSED');
process.exit(fail>0?1:0);
