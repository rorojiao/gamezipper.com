#!/usr/bin/env node
/**
 * R333 D6 detector: INHERITED-RULE-PROSE (HowTo copy-paste across games).
 *
 * NEW bug class found this tick: a game's JSON-LD HowTo / visible "How to Play"
 * block was copy-pasted from a DIFFERENT game, so the page teaches the WRONG rule.
 * Confirmed live on kropki-sudoku: its HowToStep text is byte-identical to
 * sandwich-sudoku's and describes the sandwich rule ("sum of the digits between
 * 1 and N"), NOT the kropki dot rule (|a-b|==1 / ratio 2).
 *
 * Detection: strip the SITE-WIDE boilerplate, then compare the remaining
 * rule-bearing sentences across games.  Two games that are KNOWN to have
 * different rules but share their rule prose are copy-paste victims.
 *
 * CALIBRATION (mandatory):
 *   - POSITIVE: kropki-sudoku vs sandwich-sudoku must be flagged (known defect).
 *   - NEGATIVE: camel-path vs zebra-path must NOT be flagged (same engine family,
 *     but each writes its own rule text -> distinct prose).
 *   - The site-wide boilerplate must be stripped, or every pair scores 1.0.
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

// The site-wide boilerplate that every game inherits.  MUST be stripped.
const BOILERPLATE = [
  /step-by-step instructions to play[\s\S]*?wait for it to load/gi,
  /navigate to the [\s\S]*?game page on gamezipper and wait for it to load/gi,
  /open gamezipper\.com\/[\w-]+ in your browser/gi,
  /no download needed[\s\S]{0,40}/gi,
  /play (?:it |the game )?(?:now|free)[\s\S]{0,30}/gi,
  /click or tap the play button to start the game/gi,
  /open the game/gi,
  /toggle notes to pencil in candidates,? and use hint if you get stuck\.?/gi,
  /fill every row, column and box so each digit appears exactly once,? just like standard sudoku\.?/gi,
  /use the arrow keys[\s\S]{0,60}/gi,
  /watch the ad[\s\S]{0,60}/gi,
  /your goal is to[\s\S]{0,40}(?=click|drag|tap|swipe|move|draw|match|find|sort|collect|stack|pop|swap|rotate|place|drop|fill|paint|light|aim|shoot|throw|cut|pull|slide|roll|drop|connect|group|order|reach|guide|help|lead|get|keep|complete|finish|earn|score|guide|learn|spot|choose|pick|remove|clear|solve|escape|return|bounce|jump|swipe|beat|pass|plan|start|press|read|look|drag|tilt|steer|bend|roll|hold|release|wait|watch|use)\b/gi,
];

function howToSteps(html) {
  const steps = [];
  const ldRe = /<script[^>]*type=["']application\/ld\+json["'][^>]*>([\s\S]*?)<\/script>/gi;
  let m;
  while ((m = ldRe.exec(html))) {
    try {
      const j = JSON.parse(m[1]);
      const walk = o => {
        if (!o || typeof o !== 'object') return;
        if (Array.isArray(o)) return o.forEach(walk);
        if (o['@type'] === 'HowToStep' && typeof o.text === 'string') steps.push(o.text.trim());
        if (o['@type'] === 'HowTo' && typeof o.name === 'string') steps.push('NAME: ' + o.name.trim());
        Object.values(o).forEach(walk);
      };
      walk(j);
    } catch (e) { /* ignore */ }
  }
  // visible how-to-play section paragraphs
  const h2 = html.match(/<h[23][^>]*>\s*(?:[^\w]{0,8})?(How to Play|Gameplay|Instructions|Rules|Objective)[^\w]{0,8}<\/h[23]>([\s\S]{0,3000}?)(?=<h[23]|<footer|<\/section>)/i);
  if (h2) {
    let s = h2[2]
      .replace(/<script[\s\S]*?<\/script>/gi, ' ')
      .replace(/<style[\s\S]*?<\/style>/gi, ' ')
      .replace(/<\/(p|li|div|h[1-6])>/gi, '\n')
      .replace(/<[^>]+>/g, ' ');
    for (const line of s.split('\n')) {
      const t = line.replace(/\s+/g, ' ').trim();
      if (t.length > 12) steps.push(t);
    }
  }
  return steps;
}

function stripBoiler(s) {
  let t = s;
  for (const re of BOILERPLATE) t = t.replace(re, ' ');
  return t.replace(/\s+/g, ' ').trim();
}

function norm(s) {
  return s.toLowerCase()
    .replace(/[^a-z0-9 ]+/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}

function main() {
  const games = liveGames();
  const info = {};
  let noSteps = 0;
  for (const g of games) {
    const p = path.join(ROOT, g.slug, 'index.html');
    if (!fs.existsSync(p)) continue;
    const html = fs.readFileSync(p, 'utf8');
    const steps = howToSteps(html);
    if (!steps.length) { noSteps++; continue; }
    const kept = steps.map(stripBoiler).filter(s => s.length > 14);
    const nameNorm = norm(g.name);
    // drop sentences that merely repeat the game name
    const meaningful = kept.filter(s => {
      const n = norm(s);
      const toks = n.split(' ').filter(w => w.length > 3);
      if (!toks.length) return false;
      const nameToks = new Set(nameNorm.split(' '));
      const hit = toks.filter(t => nameToks.has(t)).length;
      return hit / toks.length < 0.6;
    });
    info[g.slug] = { steps: meaningful, allSteps: steps, name: g.name, slug: g.slug };
  }
  console.log(`LIVE: ${games.length}`);
  console.log(`games with HowTo content: ${Object.keys(info).length}   without: ${noSteps}`);

  // sentence-level sharing: two games sharing >=1 IDENTICAL long rule sentence
  const sentIndex = new Map();
  for (const [slug, v] of Object.entries(info)) {
    for (const s of v.steps) {
      const n = norm(s);
      if (n.length < 35) continue;
      if (!sentIndex.has(n)) sentIndex.set(n, new Set());
      sentIndex.get(n).add(slug);
    }
  }
  const shared = [];
  for (const [sent, slugs] of sentIndex) {
    if (slugs.size >= 2) shared.push({ sent, slugs: [...slugs] });
  }
  shared.sort((a, b) => b.sent.length - a.sent.length);
  console.log(`\n=== D6 IDENTICAL RULE SENTENCES SHARED BY >=2 GAMES: ${shared.length} ===`);
  for (const s of shared) {
    console.log(`\n  [${s.slugs.join(' | ')}]`);
    console.log(`    "${s.sent.slice(0, 300)}"`);
  }

  console.log('\n=== CALIBRATION CONTROLS ===');
  const k = 'kropki-sudoku', sd = 'sandwich-sudoku';
  const sharedKS = shared.filter(s => s.slugs.includes(k) && s.slugs.includes(sd));
  console.log(`   POSITIVE kropki<->sandwich flagged: ${sharedKS.length > 0 ? 'YES (' + sharedKS.length + ' sentences)' : 'NO  <-- DETECTOR IS A NO-OP'}`);
  const c = 'camel-path', z = 'zebra-path';
  const sharedCZ = shared.filter(s => s.slugs.includes(c) && s.slugs.includes(z));
  console.log(`   NEGATIVE camel<->zebra flagged: ${sharedCZ.length > 0 ? 'YES (' + sharedCZ.length + ') <-- FALSE POSITIVE' : 'no (correct)'}`);
  // boilerplate-strip effectiveness
  const boiler = info['bloxorz'];
  if (boiler) console.log(`   bloxorz meaningful steps after strip: ${boiler.steps.length} (of ${boiler.allSteps.length} raw) -> ${boiler.steps.slice(0,3).map(s=>s.slice(0,90)).join(' || ')}`);

  fs.writeFileSync(path.join(ROOT, '.audit/r333-d6-shared-rule-sentences.json'), JSON.stringify(shared, null, 1));
}

main();
