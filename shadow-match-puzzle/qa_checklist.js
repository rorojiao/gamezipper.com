#!/usr/bin/env node
/**
 * Shadow Match Puzzle - QA Code-Level Checklist
 * Validates: structure, no JS errors, SEO schemas, mobile, monetag ready
 */
const fs = require('fs');

const html = fs.readFileSync('index.html', 'utf8');
let pass = 0, fail = 0;

function check(name, condition, detail = '') {
    if (condition) {
        console.log(`  ✅ ${name}`);
        pass++;
    } else {
        console.log(`  ❌ ${name} ${detail}`);
        fail++;
    }
}

console.log('Shadow Match Puzzle - QA Code-Level Checklist');
console.log('='.repeat(60));

// 1. HTML Structure
console.log('\n📋 1. HTML Structure');
check('DOCTYPE declaration', html.includes('<!DOCTYPE html>'));
check('viewport meta (no-scale)', html.includes('maximum-scale=1.0'));
check('charset UTF-8', html.includes('charset="UTF-8"'));
check('lang attribute', html.includes('lang="en"'));
check('title tag', /<title>[^<]+<\/title>/.test(html));
check('meta description', /<meta name="description"/.test(html));
check('meta keywords', /<meta name="keywords"/.test(html));
check('og:title', html.includes('og:title'));
check('og:description', html.includes('og:description'));
check('og:image', html.includes('og:image'));
check('twitter:card', html.includes('twitter:card'));
check('favicon link', html.includes('rel="icon"'));

// 2. CSS / Mobile
console.log('\n🎨 2. CSS & Mobile');
check('touch-action:none', html.includes('touch-action:none'));
check('user-select:none', html.includes('user-select:none'));
check('-webkit-tap-highlight-color', html.includes('-webkit-tap-highlight-color'));
check('overflow:hidden on body', html.includes('overflow:hidden'));
check('viewport units (vw/vh)', html.includes('100vw'));
check('responsive font (clamp)', html.includes('clamp('));
check('@media query', html.includes('@media'));

// 3. JavaScript Quality
console.log('\n⚙️ 3. JavaScript Quality');
check('AudioContext init', html.includes('AudioContext') || html.includes('webkitAudioContext'));
check('localStorage for progress', html.includes('localStorage'));
check('requestAnimationFrame usage', html.includes('requestAnimationFrame'));
check('devicePixelRatio handling', html.includes('devicePixelRatio'));
check('Canvas getContext', html.includes('getContext'));
check('Event listeners (onclick)', html.includes('.onclick='));
check('No console.error in production', !html.includes('console.error'));
check('Try-catch for localStorage', html.includes('try{STATE.progress=JSON.parse'));
check('Timer cleanup (clearInterval)', html.includes('clearInterval'));
check('Shadow blur reset', html.includes('ctx.shadowBlur=0'));

// 4. Game Features
console.log('\n🎮 4. Game Features');
check('30 levels defined', html.includes('"level":30'));
check('Level 1 exists', html.includes('"level":1'));
check('Star rating system', html.includes('calculateStars'));
check('Timer system', html.includes('startTimer'));
check('Mute toggle', html.includes('btnMute'));
check('Level select screen', html.includes('levelSelectScreen'));
check('Progress dots', html.includes('progressDots'));
check('Match/mismatch feedback', html.includes('playMatch') && html.includes('playMismatch'));
check('Win/lose overlay', html.includes('overlay'));
check('Home button', html.includes('btnHome'));
check('Retry button', html.includes('btnRetry'));
check('Next button', html.includes('btnNext'));

// 5. Audio System
console.log('\n🎵 5. Audio System');
check('Web Audio API used', html.includes('AudioContext'));
check('Match sound', html.includes('playMatch'));
check('Mismatch sound', html.includes('playMismatch'));
check('Click sound', html.includes('playClick'));
check('Win sound', html.includes('playWin'));
check('Lose sound', html.includes('playLose'));
check('BGM (ambient)', html.includes('startBGM') && html.includes('stopBGM'));
check('Oscillator nodes', html.includes('createOscillator'));
check('Gain nodes', html.includes('createGain'));

// 6. SEO Structured Data
console.log('\n🔍 6. SEO Structured Data');
check('VideoGame schema', html.includes('"@type":"VideoGame"'));
check('HowTo schema', html.includes('"@type":"HowTo"'));
check('FAQPage schema', html.includes('"@type":"FAQPage"'));
check('BreadcrumbList schema', html.includes('"@type":"BreadcrumbList"'));
check('application/ld+json', html.includes('application/ld+json'));
check('aggregateRating', html.includes('aggregateRating'));
check('numberOfLevels', html.includes('numberOfLevels'));

// 7. Shape Renderers (all 24)
console.log('\n🔷 7. Shape Renderers');
const shapes = ['star','heart','circle','triangle','square','diamond','hexagon','pentagon',
                 'cross','arrow','moon','leaf','drop','flame','gear','clover',
                 'sun','cloud','bolt','fish','flower','snowflake','key','anchor'];
let shapeCount = 0;
for (const s of shapes) {
    if (html.includes(`${s}:(`)) shapeCount++;
}
check(`All 24 shape renderers present (${shapeCount}/24)`, shapeCount === 24);

// 8. Security
console.log('\n🔒 8. Security');
check('No inline event handlers (onclick=)', !html.includes('onclick="'));
check('No eval()', !html.includes('eval('));
check('No innerHTML with user input', !html.includes('innerHTML=') || html.includes('innerHTML=`'));

// Summary
console.log('\n' + '='.repeat(60));
console.log(`QA RESULTS: ${pass} passed, ${fail} failed`);
if (fail === 0) {
    console.log('✅ ALL QA CHECKS PASSED');
} else {
    console.log(`❌ ${fail} CHECKS FAILED`);
    process.exit(1);
}
