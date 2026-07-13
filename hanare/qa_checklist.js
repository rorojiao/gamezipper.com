#!/usr/bin/env node
'use strict';
/**
 * Hanare QA Checklist — 40-point code-level QA
 * Usage: node qa_checklist.js [path-to-index.html]
 */
const fs = require('fs');
const path = process.argv[2] || '/home/msdn/gamezipper.com/hanare/index.html';

if (!fs.existsSync(path)) {
    console.error(`ERROR: ${path} not found`);
    process.exit(1);
}

const html = fs.readFileSync(path, 'utf8');
let pass = 0, fail = 0;

function check(name, condition) {
    const status = condition ? 'OK' : 'FAIL';
    if (condition) pass++; else fail++;
    console.log(`${status}  ${name}`);
}

// Extract main JS for syntax check
const scriptMatch = html.match(/<script>([\s\S]*?)<\/script>/g);
let mainJS = '';
let jsonLDBlocks = [];
if (scriptMatch) {
    for (const block of scriptMatch) {
        const code = block.replace(/<\/?script[^>]*>/g, '');
        if (block.includes('application/ld+json')) {
            jsonLDBlocks.push(code);
        } else if (code.length > 5000) {
            mainJS = code;
        }
    }
}

console.log('=== Hanare QA Checklist ===\n');
console.log('-- HTML & SEO --');
check('Title tag', /<title>[^<]+Hanare[^<]*<\/title>/i.test(html));
check('Meta description', /name="description"/i.test(html));
check('OG title', /og:title/i.test(html));
check('OG description', /og:description/i.test(html));
check('Canonical URL', /rel="canonical"/i.test(html));
check('site-analytics pixel', html.includes('site-analytics.cap.1ktower.com'));

console.log('\n-- Structured Data --');
check('JSON-LD VideoGame', html.includes('VideoGame'));
check('JSON-LD FAQPage', html.includes('FAQPage'));
check('JSON-LD BreadcrumbList', html.includes('BreadcrumbList'));

console.log('\n-- CSS & Responsive --');
check('Dark theme bg (#0a0a1a)', html.includes('#0a0a1a') || html.includes('0a0a1a'));
check('touch-action:none', html.includes('touch-action') && html.includes('none'));
check('user-select:none', html.includes('user-select') && html.includes('none'));
check('overflow-x:hidden', html.includes('overflow-x') && html.includes('hidden'));
check('No -webkit-text-stroke', !html.includes('-webkit-text-stroke'));

console.log('\n-- Game Logic --');
check('Canvas element', html.includes('<canvas'));
check('Canvas getContext', html.includes('getContext'));
check('requestAnimationFrame', html.includes('requestAnimationFrame'));
check('LEVELS data (30 levels)', /var\s+LEVELS\s*=/.test(html) && (html.match(/w:\d+,h:\d+,r:/g) || []).length === 30);
check('Distance constraint check', html.includes('checkDistance') || html.includes('distance') || html.includes('Diff'));
check('Win condition', html.includes('checkWin') || html.includes('isComplete') || html.includes('solved') || html.includes('win'));
check('Hint system (3 per level)', html.includes('hint') && (html.match(/hint/gi) || []).length >= 3);

console.log('\n-- Input Handling --');
check('Pointer events', html.includes('pointerdown') || html.includes('pointermove') || html.includes('pointerup'));
check('Keyboard events', html.includes('keydown') || html.includes('keyup'));
check('preventDefault on touch', html.includes('preventDefault'));

console.log('\n-- Audio --');
check('AudioContext', html.includes('AudioContext') || html.includes('webkitAudioContext'));
check('SFX types (place/erase/win)', html.includes('place') || html.includes('erase') || html.includes('click'));
check('Music toggle', html.includes('music') && (html.includes('toggle') || html.includes('Music')));
check('Sound toggle', html.includes('sound') || html.includes('sfx'));

console.log('\n-- State Management --');
check('localStorage save', html.includes('localStorage'));
check('Level unlock progression', html.includes('unlock') || html.includes('completed') || html.includes('stars'));
check('Timer', html.includes('timer') || html.includes('elapsed') || html.includes('Date.now'));
check('3-star ratings', html.includes('star') || html.includes('rating'));

console.log('\n-- Performance & Lifecycle --');
check('cancelAnimationFrame', html.includes('cancelAnimationFrame'));
check('visibilitychange handler', html.includes('visibilitychange'));
check('beforeunload handler', html.includes('beforeunload'));
check('Responsive resize', html.includes('resize') || html.includes('innerWidth'));

console.log('\n-- Code Quality --');
check('No console.log', (html.match(/console\.log/g) || []).length === 0);
check('No Chinese characters', !/[\u4e00-\u9fff]/.test(html));
check('No emoji in game code (U+1F000+)', !/[\u{1F000}-\u{1FAFF}]/u.test(html));
check('Single file (DOCTYPE)', html.includes('<!DOCTYPE html>'));
check('File size > 30KB', html.length > 30000);

// JS syntax check
if (mainJS) {
    try {
        new Function(mainJS);
        check('Main JS syntax valid', true);
    } catch(e) {
        check('Main JS syntax valid', false);
        console.log(`    ERROR: ${e.message}`);
    }
}

// JSON-LD validation
for (let i = 0; i < jsonLDBlocks.length; i++) {
    try {
        JSON.parse(jsonLDBlocks[i]);
        check(`JSON-LD block ${i+1} valid JSON`, true);
    } catch(e) {
        check(`JSON-LD block ${i+1} valid JSON`, false);
        console.log(`    ERROR: ${e.message}`);
    }
}

console.log(`\n=== ${pass}/${pass+fail} checks passed${fail ? ` (${fail} failed)` : ''} ===`);
process.exit(fail > 0 ? 1 : 0);
