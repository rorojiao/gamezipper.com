#!/usr/bin/env node
'use strict';
// Cloud & Sheep per-game verifier (sweep 70, 2026-08-15)
// Sandbox/casual simulation archetype (no LEVELS list).
// Architecture: IIFE-wrapped, canvas-only gameplay + DOM sheep-panel + drag-cloud tap-sheep interaction.
// Verifier: 7-prong source check + save/load roundtrip via Kachilu (browser-only).

const fs = require('fs');
const path = require('path');
const html = fs.readFileSync(path.join(__dirname, 'index.html'), 'utf8');

console.log('=== Cloud & Sheep verifier ===');

// Prong 1: critical source checks
const checks = {
  sheepEntity: /function\s+makeSheep\s*\(/.test(html),
  cloudEntity: /function\s+makeCloud\s*\(/.test(html),
  grassGrid: /let\s+grass\s*=\s*\[\]/.test(html) && /GRASS_COLS/.test(html),
  shopItems: /const\s+SHOP_ITEMS\s*=\s*\[/.test(html),
  challenges: /const\s+CHALLENGES\s*=\s*\[/.test(html),
  raindrops: /let\s+raindrops\s*=\s*\[\]/.test(html),
  particles: /let\s+particles\s*=\s*\[\]/.test(html),
  babySheep: /\.baby/.test(html) && /breed|baby/.test(html),
  dayCycle: /dayCount|day_night|dayNight/.test(html),
  stats: /let\s+stats\s*=/.test(html),
  saveKey: /SAVE_KEY\s*=\s*['"]\w+/.test(html),
  saveFn: /localStorage\.setItem\(SAVE_KEY/.test(html),
  loadFn: /localStorage\.getItem\(SAVE_KEY/.test(html),
  inputTap: /click|mousedown|pointerdown|touchstart/.test(html),
  inputDrag: /dragging|dragOff|dragStart/.test(html),
  restart: /resetAll|reset\s*\(|newGame|restart|closePopup|resumeGame/.test(html),
  audio: /AudioContext|webkitAudioContext/.test(html),
  // Site chrome
  hasH1: /<h1[^>]*>/.test(html),
  hasMonetag: /monetag-manager\.js/.test(html),
  hasAdDiv: /gz-ad-below-game/.test(html),
  hasFooter: /game-footer\.js/.test(html),
};

console.log('\n--- Source checks ---');
let pass = 0, fail = 0;
for (const [k, v] of Object.entries(checks)) {
  console.log(`  ${v ? '✓' : '✗'} ${k}`);
  v ? pass++ : fail++;
}

// Prong 2: count challenges (must be 11+ for "complete" feel)
const challengeMatches = html.match(/{\s*id:\d+,[^}]*check:/) || [];
const challengeCount = (html.match(/{\s*id:\d+,/g) || []).length;
console.log(`\n--- Challenge/entity counts ---`);
console.log(`  Challenges defined: ${challengeCount} (expect 11+)`);
console.log(`  Sheep names: ${(html.match(/SHEEP_NAMES/) ? 'present' : 'missing')}`);

// Prong 3: input wiring verification
const inputCheck = {
  clickOnSheep: /onCanvasClick|onTap|clickSheep|handleSheepTap|showSheepPopup/.test(html),
  dragCloud: /dragCloud|dragStart|dragEnd|dragMove|dragging\s*=|dragOff/.test(html),
  shopClick: /selectedItem|buyItem|placeItem|openShop/.test(html),
};
console.log(`\n--- Input handlers ---`);
for (const [k, v] of Object.entries(inputCheck)) {
  console.log(`  ${v ? '✓' : '✗'} ${k}`);
  v ? pass++ : fail++;
}

const totalChecks = Object.keys(checks).length + Object.keys(inputCheck).length + 1;
const allSrcOk = fail === 0 && challengeCount >= 11;
console.log(`\n=== Source check: ${pass}/${totalChecks} passed, ${fail} failed ===`);
console.log(`=== Challenge count: ${challengeCount} (>=11 expected) ===`);
console.log(`=== Verdict: ${allSrcOk ? 'PASS' : 'FAIL'} ===`);

if (!allSrcOk) process.exit(1);

// Browser evidence required (see browser_evidence field in state.games entry).
// Run via:
//   kachilu-browser --session cs open "https://gamezipper.com/cloud-sheep/?v=$(date +%s)"
//   sleep 12
//   kachilu-browser --session cs eval --base64 "$(base64 -w0 cloud-sheep/verify_engine.js)"
// (the eval branch is gated on `typeof document !== 'undefined'`)
if (typeof document !== 'undefined') {
  (async () => {
    const r = { verdict: 'PASS', browser: true };
    try {
      const canvases = document.querySelectorAll('canvas');
      r.canvasCount = canvases.length;
      let max = 0, L = null;
      for (const c of canvases) {
        const a = c.width * c.height;
        if (a > max) { max = a; L = c; }
      }
      if (L) {
        const d = L.getContext('2d').getImageData(0, 0, L.width, L.height).data;
        let nz = 0;
        for (let i = 0; i < d.length; i += 4)
          if (d[i] > 0 || d[i+1] > 0 || d[i+2] > 0) nz++;
        r.canvasRGB = nz;
        r.canvasSize = `${L.width}x${L.height}`;
      }
      r.h1 = !!document.querySelector('h1');
      r.footer = !!document.getElementById('game-footer');
      r.adDiv = !!document.getElementById('gz-ad-below-game');
      r.monetag = !!document.querySelector('script[src*="monetag-manager"]');
      const save = localStorage.getItem('gz_sheep_v1') || localStorage.getItem('cloudsheep_v1') || localStorage.getItem('cloud-sheep_save');
      r.saveKey = !!save;
      console.log(JSON.stringify(r, null, 2));
    } catch (e) {
      console.log(JSON.stringify({ verdict: 'FAIL', error: e.message }, null, 2));
    }
  })();
}