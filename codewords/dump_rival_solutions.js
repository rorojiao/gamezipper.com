#!/usr/bin/env node
'use strict';
/*
 * codewords — RIVAL-SOLUTION DUMP.
 *
 * The engine's win check is a SOLUTION-COMPARE:
 *     for (var n in lv.s) { if (state.playerMap[n] !== lv.s[n]) return false; }
 * So if a level admits TWO valid number->letter maps, a player who reasons
 * correctly to the rival map is PERMANENTLY marked wrong (Pitfall #59/#86).
 *
 * This script enumerates solutions and prints the rival alongside the stored
 * one, plus the WORD each map spells for every row, so the rival can be
 * checked by hand against the dictionary.
 */
const fs = require('fs');
const path = require('path');
const HERE = __dirname;
const levels = JSON.parse(fs.readFileSync(path.join(HERE, 'levels.json'), 'utf8'));
const WORDS = JSON.parse(fs.readFileSync(path.join(HERE, 'wordlist.json'), 'utf8'));
const WORDSET = new Set(WORDS);
const BY_LEN = new Map();
for (const w of WORDS) { if (!BY_LEN.has(w.length)) BY_LEN.set(w.length, []); BY_LEN.get(w.length).push(w); }
const ALPHA = 'abcdefghijklmnopqrstuvwxyz'.split('');

function enumerate(grid, hints, limit, deadlineMs) {
  const rows = grid.map(r => r.map(String));
  const nums = [...new Set(rows.flat())].sort();
  const pool = rows.map(row => BY_LEN.get(row.length) || []);
  let timedOut = false;
  const sols = [];
  const assign = new Map();

  function rowWords(idx) {
    const row = rows[idx]; const out = [];
    for (const w of pool[idx]) {
      let ok = true;
      for (let i = 0; i < row.length; i++) {
        const a = assign.get(row[i]);
        if (a !== undefined && w[i] !== a) { ok = false; break; }
      }
      if (ok) out.push(w);
    }
    return out;
  }
  function feasible() { for (let i = 0; i < rows.length; i++) if (!rowWords(i).length) return false; return true; }
  function leafValid() {
    for (let i = 0; i < rows.length; i++) {
      let word = '';
      for (const num of rows[i]) { const l = assign.get(num); if (l === undefined) return false; word += l; }
      if (!WORDSET.has(word)) return false;
    }
    return true;
  }
  function search() {
    if (timedOut || sols.length >= limit) return;
    if (Date.now() > deadlineMs) { timedOut = true; return; }
    let best = null, bestSet = null;
    for (const num of nums) {
      if (assign.has(num)) continue;
      const s = new Set();
      for (let ri = 0; ri < rows.length; ri++) {
        const i = rows[ri].indexOf(num);
        if (i < 0) continue;
        for (const w of rowWords(ri)) s.add(w[i]);
      }
      if (!s.size) return;
      if (bestSet === null || s.size < bestSet.size) { best = num; bestSet = s; }
      if (s.size === 1) break;
    }
    if (best === null) {
      if (leafValid()) sols.push(new Map(assign));
      return;
    }
    for (const letter of [...bestSet].sort()) {
      if (timedOut || sols.length >= limit) break;
      let conflict = false;
      for (const [num, l] of assign) if (num !== best && l === letter) { conflict = true; break; }
      if (conflict) continue;
      assign.set(best, letter);
      if (feasible()) search();
      assign.delete(best);
    }
  }
  search();
  return { sols, timedOut };
}

const only = process.argv[2] ? Number(process.argv[2]) : null;
for (const lv of levels.levels) {
  if (only && lv.level !== only) continue;
  const res = enumerate(lv.rows, lv.hints || {}, 2, Date.now() + 120000);
  if (res.timedOut) { console.log(`L${lv.level} TIMEOUT`); continue; }
  if (res.sols.length < 2) { console.log(`L${lv.level} solutions=${res.sols.length} (unique)`); continue; }
  console.log(`\n=== L${lv.level} (${lv.tier}) MULTI-SOLUTION: ${res.sols.length}+ ===`);
  const stored = new Map(Object.entries(lv.solution).map(([k, v]) => [String(k), v]));
  for (let si = 0; si < res.sols.length; si++) {
    const m = res.sols[si];
    const diff = [...m].filter(([k, v]) => stored.get(k) !== v).map(([k, v]) => `${k}:${stored.get(k)}->${v}`);
    const words = lv.rows.map(row => row.map(n => m.get(String(n))).join(''));
    const wordsOk = words.every(w => WORDSET.has(w));
    const isStored = diff.length === 0;
    console.log(`  sol${si}: ${isStored ? 'STORED' : 'RIVAL'}  diff=[${diff.join(', ')}]`);
    console.log(`         words=[${words.join(', ')}] allInDictionary=${wordsOk}`);
  }
}
