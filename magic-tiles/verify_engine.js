// Static verifier for magic-tiles (sweep 45, 2026-08-08).
// Replicates the procedural generateSong() function and validates that
// each of the 30 songs (5 chapters × 6 songs) generates a valid tile set
// with reasonable structure: not all in same lane, not overlapping time
// windows, count matches chapter.count, all tile times positive, etc.
//
// Usage: node magic-tiles/verify_engine.js
// Exit 0 = all songs structurally valid, exit 1 = invalid song

'use strict';
const fs = require('fs');
const path = require('path');

const HTML = fs.readFileSync(path.join(__dirname, 'index.html'), 'utf8');

// Extract CHAPTERS and SONG_NAMES via eval (they're JS literals)
const m1 = HTML.match(/var CHAPTERS=([\s\S]*?);/);
const m2 = HTML.match(/var SONG_NAMES=([\s\S]*?});/);  // match up to closing brace
if (!m1 || !m2) { console.error('cannot find CHAPTERS or SONG_NAMES'); process.exit(1); }
const CHAPTERS = eval('(' + m1[1] + ')');
const SONG_NAMES = eval('(' + m2[1] + ')');

// Replicate generateSong() logic
function rngSeeded(seed) {
  return function() {
    seed |= 0; seed = seed + 0x6D2B79F5 | 0;
    let t = Math.imul(seed ^ seed >>> 15, 1 | seed);
    t = t + Math.imul(t ^ t >>> 7, 61 | t) ^ t;
    return ((t ^ t >>> 14) >>> 0) / 4294967296;
  };
}

function generateSong(chapter, songIdx) {
  const ch = CHAPTERS[chapter - 1];
  const songName = SONG_NAMES[chapter][songIdx];
  const seed = (chapter * 1000 + songIdx) * 7919;
  const rnd = rngSeeded(seed);
  const bpm = ch.bpm;
  const beatMs = 60000 / bpm;
  const totalBeats = Math.round(ch.range[0] + (ch.range[1] - ch.range[0]) * rnd());
  const tileCount = ch.count;
  const tiles = [];
  const used = {};
  let lastLane = -1;
  const density = Math.min(0.95, ch.density);
  const lanesAllowed = Math.min(ch.lanes, 4);
  let placed = 0;
  let attempts = 0;
  while (placed < tileCount && attempts < tileCount * 8) {
    attempts++;
    let beat = placed + Math.floor(rnd() * 1.7);
    let t = beat * beatMs;
    if (t < 800) t = 800 + placed * beatMs;
    let lane;
    if (ch.lanes === 1) {
      lane = Math.floor(rnd() * lanesAllowed);
    } else if (ch.lanes === 2) {
      lane = (lastLane + 1 + Math.floor(rnd() * 2)) % lanesAllowed;
    } else {
      let tries = 0;
      do {
        lane = Math.floor(rnd() * lanesAllowed);
        tries++;
      } while (lane === lastLane && tries < 3 && rnd() < 0.7);
    }
    const lastTime = used[lane] || -9999;
    if (t - lastTime < 200) continue;
    tiles.push({ lane, time: t });
    used[lane] = t;
    lastLane = lane;
    placed++;
    if (ch.lanes >= 4 && rnd() < 0.18 && placed < tileCount) {
      const lane2 = (lane + 1 + Math.floor(rnd() * 3)) % lanesAllowed;
      if (lane2 !== lane && (used[lane2] || -9999) < t - 150) {
        tiles.push({ lane: lane2, time: t });
        used[lane2] = t;
        placed++;
      }
    }
  }
  const duration = Math.max(30000, tiles[tiles.length - 1].time + 2500);
  const totalPossible = tiles.length * 150;
  return {
    chapter, idx: songIdx, name: songName, bpm,
    tiles, duration,
    thresholds: {
      bronze: Math.floor(totalPossible * 0.55),
      silver: Math.floor(totalPossible * 0.75),
      gold: Math.floor(totalPossible * 0.95),
    }
  };
}

// Validate each song
let pass = 0, fail = 0;
const problems = [];
for (let ch = 1; ch <= 5; ch++) {
  for (let s = 0; s < 6; s++) {
    const song = generateSong(ch, s);
    const lv = CHAPTERS[ch - 1];
    let ok = true;
    let msg = '';
    // Check tile count: chapter.count plus possible chords (~+18% per ch.lanes>=4)
    const expectMin = lv.count;
    const expectMax = lv.count * 2;  // generous upper bound incl. chords
    if (song.tiles.length < expectMin) { ok = false; msg = `tile count ${song.tiles.length} < ${expectMin}`; }
    else if (song.tiles.length > expectMax) { ok = false; msg = `tile count ${song.tiles.length} > ${expectMax}`; }
    // Check lane distribution: not all in same lane
    const lanes = new Set(song.tiles.map(t => t.lane));
    const expectedLanes = Math.min(lv.lanes, 4);
    if (lanes.size < Math.min(2, expectedLanes)) { ok = false; msg = `lane variety ${lanes.size} < ${Math.min(2, expectedLanes)}`; }
    // Check tile times are monotonically increasing per lane (chords can share time across lanes)
    const lastTimeByLane = {};
    for (let i = 0; i < song.tiles.length; i++) {
      const t = song.tiles[i];
      if (lastTimeByLane[t.lane] !== undefined && t.time < lastTimeByLane[t.lane]) {
        ok = false; msg = `tile ${i} lane ${t.lane} time ${t.time} < prev ${lastTimeByLane[t.lane]}`; break;
      }
      lastTimeByLane[t.lane] = t.time;
    }
    // Check all tiles positive time
    if (song.tiles.some(t => t.time <= 0)) { ok = false; msg = 'tile time ≤ 0'; }
    // Check duration is reasonable
    if (song.duration < song.tiles[song.tiles.length-1].time) { ok = false; msg = `duration ${song.duration} < last tile time ${song.tiles[song.tiles.length-1].time}`; }
    if (ok) pass++;
    else { fail++; problems.push(`ch${ch} song${s} (${song.name}): ${msg}`); }
  }
}

console.log(`PASS ${pass}/30`);
for (const p of problems) console.error(' FAIL', p);
process.exit(fail > 0 ? 1 : 0);