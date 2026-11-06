#!/usr/bin/env node
/**
 * R333 D5 detector: AUTHORED RULE PROSE fingerprint.
 *
 * A game's JSON-LD HowTo block and/or its visible "How to Play" section is the
 * author-written statement of its rules. Two games whose rule prose describes
 * the SAME victory condition and the SAME allowed actions are reskin candidates
 * regardless of how different their code is styled.
 *
 * This detector is STRICTLY a nominator. It only ranks pairs for human reading.
 *
 * CALIBRATION (mandatory, Pitfall #62):
 *   - POSITIVE: two synthetic games with the same HowTo steps must score 1.0.
 *   - NEGATIVE: camel-path vs zebra-path (adjudicated DISTINCT in R319) must
 *     score < 0.6.
 *   - SENSITIVITY: a one-word change must drop the score measurably.
 */
const fs = require('fs');
const path = require('path');
const ROOT = path.resolve(__dirname, '..');

function liveGames() {
  const src = fs.readFileSync(path.join(ROOT, 'js/games-data.js'), 'utf8')
    .replace(/^const\s+(GAME_GRADIENTS|GAMES)\s*=/gm, 'var $1=');
  const GAMES = new Function(src + '; return GAMES;')();
  return GAMES.filter(g => g.status === 'live')
    .map(g => ({ slug: g.url.replace(/^\//, '').replace(/\/$/, ''), name: g.name, cat: g.cat, tags: g.tags || [] }));
}

// vocabulary of rule-bearing content words (theme words excluded)
const STOP = new Set(('a an the and or of to in on at for with your you is are be by from as it this that these those ' +
  'each every all any must can will when then if not no do does did use using used tap click drag swipe move ' +
  'level levels game player score points time seconds goal win winning complete completed success ' +
  'how to play steps step goal objective rules guide tutorial help tip tips learn more about ' +
  'new best score stars star time timer bonus combo power puzzle game games').split(/\s+/));

function tokens(s) {
  return (s.toLowerCase().match(/[a-z][a-z0-9-]{2,}/g) || []).filter(w => !STOP.has(w));
}

function howToProse(html) {
  const parts = [];
  // 1. JSON-LD HowTo / HowToStep
  const ldRe = /<script[^>]*type=["']application\/ld\+json["'][^>]*>([\s\S]*?)<\/script>/gi;
  let m;
  while ((m = ldRe.exec(html))) {
    try {
      const j = JSON.parse(m[1]);
      const walk = o => {
        if (!o || typeof o !== 'object') return;
        if (Array.isArray(o)) return o.forEach(walk);
        if (o['@type'] === 'HowTo' || o['@type'] === 'HowToStep' || o['@type'] === 'HowToSection') {
          if (typeof o.text === 'string') parts.push(o.text);
          if (typeof o.name === 'string') parts.push(o.name);
          if (typeof o.description === 'string') parts.push(o.description);
        }
        Object.values(o).forEach(walk);
      };
      walk(j);
    } catch (e) { /* not JSON, ignore */ }
  }
  // 2. visible How to Play section
  const h2 = html.match(/<h[23][^>]*>\s*(?:[^\w]{0,8})?(How to Play|Gameplay|Instructions|Rules|Objective)[^\w]{0,8}<\/h[23]>([\s\S]{0,2600}?)(?=<h[23]|<div[^>]*class=["'][^"']*footer|<footer|<\/section>)/i);
  if (h2) {
    let s = h2[2]
      .replace(/<script[\s\S]*?<\/script>/gi, ' ')
      .replace(/<style[\s\S]*?<\/style>/gi, ' ')
      .replace(/<[^>]+>/g, ' ');
    parts.push(s);
  }
  return parts.join(' \n ');
}

function main() {
  const games = liveGames();
  const info = {};
  let noProse = 0;
  for (const g of games) {
    const p = path.join(ROOT, g.slug, 'index.html');
    if (!fs.existsSync(p)) continue;
    const html = fs.readFileSync(p, 'utf8');
    const prose = howToProse(html);
    if (!prose.trim()) { noProse++; continue; }
    info[g.slug] = { toks: new Set(tokens(prose)), prose: prose.replace(/\s+/g, ' ').trim().slice(0, 400), name: g.name, tags: g.tags };
  }
  console.log(`LIVE: ${games.length}`);
  console.log(`games with authored rule prose: ${Object.keys(info).length}`);
  console.log(`games WITHOUT rule prose: ${noProse}`);

  const cont = (a, b) => (!a.size || !b.size) ? 0 : [...a].filter(x => b.has(x)).length / Math.min(a.size, b.size);

  const cands = [];
  const keys = Object.keys(info);
  for (let i = 0; i < keys.length; i++) {
    for (let j = i + 1; j < keys.length; j++) {
      const a = keys[i], b = keys[j];
      const sc = cont(info[a].toks, info[b].toks);
      if (sc < 0.70) continue;
      cands.push({ score: +sc.toFixed(3), a, b });
    }
  }
  cands.sort((x, y) => y.score - x.score);
  console.log(`\n=== D5 CANDIDATE PAIRS (rule-prose token containment >= 0.70): ${cands.length} ===`);
  for (const c of cands.slice(0, 30)) {
    console.log(`\n  ${c.score}  ${c.a}  <->  ${c.b}`);
    console.log(`     A: ${info[c.a].prose.slice(0, 240)}`);
    console.log(`     B: ${info[c.b].prose.slice(0, 240)}`);
  }

  console.log('\n=== CALIBRATION CONTROLS ===');
  const ca = new Set(tokens('Slide the ball until it hits a wall, collect every gem, then reach the exit. Avoid the mines.'));
  const cb = new Set(tokens('Slide the ball until it hits a wall, collect every gem, then reach the exit. Avoid the mines.'));
  const cc = new Set(tokens('Fill every region with a number so that each region shows its size and neighbours differ.'));
  console.log(`   SYNTH identical  : ${cont(ca, cb).toFixed(3)}  (must be 1.000)`);
  console.log(`   SYNTH one-word   : ${cont(ca, new Set(tokens('Slide the ball until it hits a wall, collect every gem, then reach the goal. Avoid the mines.'))).toFixed(3)}  (must be < 1.000)`);
  console.log(`   SYNTH disjoint   : ${cont(ca, cc).toFixed(3)}  (must be 0.000)`);
  for (const [a, b] of [['camel-path', 'zebra-path'], ['goods-sort', 'pocket-sort'], ['tomb-of-the-mask', 'inertia']]) {
    if (info[a] && info[b]) console.log(`   KNOWN ${a} <-> ${b}: ${cont(info[a].toks, info[b].toks).toFixed(3)}`);
    else console.log(`   KNOWN ${a} <-> ${b}: no prose`);
  }

  fs.writeFileSync(path.join(ROOT, '.audit/r333-d5-candidates.json'), JSON.stringify(cands, null, 1));
}

main();
