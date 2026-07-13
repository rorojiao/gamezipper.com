#!/usr/bin/env node
// Kin-Kon-Kan QA Checklist - Phase 7
const fs = require('fs');

const html = fs.readFileSync('/home/msdn/gamezipper.com/kinkonkan/index.html', 'utf8');

const checks = [
  // HTML & SEO
  ['Analytics pixel', html.includes('site-analytics')],
  ['Touch support', html.includes('touch-action')],
  ['Overflow hidden', html.includes('overflow-x:hidden')],
  ['User select none', html.includes('user-select:none')],
  ['No text-stroke', !html.includes('-webkit-text-stroke')],
  ['JSON-LD VideoGame', html.includes('VideoGame')],
  ['JSON-LD FAQPage', html.includes('FAQPage')],
  ['JSON-LD BreadcrumbList', html.includes('BreadcrumbList')],
  ['OG tags', html.includes('og:title')],
  ['Canonical URL', html.includes('canonical')],
  
  // Game logic
  ['Canvas rendering', html.includes('getContext')],
  ['requestAnimationFrame', html.includes('requestAnimationFrame')],
  ['Delta time', html.includes('dt')],
  ['Pointer events', html.includes('pointerdown')],
  ['Touch action CSS', html.includes('touch-action')],
  ['Responsive', html.includes('resize') || html.includes('innerWidth')],
  ['Particles', html.includes('particle')],
  ['BGM start+stop', html.includes('startBGM') && html.includes('stopBGM')],
  ['Sound effects', html.includes('playTone')],
  
  // UI/UX
  ['Tutorial overlay', html.includes('tutorial')],
  ['Level select', html.includes('showLevelSelect')],
  ['Settings modal', html.includes('settings')],
  ['Sound toggle', html.includes('sound-toggle')],
  ['Music toggle', html.includes('music-toggle')],
  ['Progress save', html.includes('localStorage')],
  
  // Code quality
  ['Cleanup function', html.includes('cleanup')],
  ['No console.log', !html.includes('console.log')],
  ['No TODO/FIXME', !html.includes('TODO') && !html.includes('FIXME')],
  ['File size > 40KB', html.length > 40000],
  ['Single file', html.includes('<!DOCTYPE html>')],
  ['No external CSS', !html.includes('rel="stylesheet"')],
];

let pass = 0, fail = 0;
checks.forEach(function(c) {
  console.log((c[1] ? 'OK' : 'FAIL') + ' ' + c[0]);
  c[1] ? pass++ : fail++;
});

console.log('\n' + pass + '/' + checks.length + ' passed' + (fail ? ' (' + fail + ' failed)' : ''));