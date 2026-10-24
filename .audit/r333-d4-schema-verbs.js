#!/usr/bin/env node
/**
 * R333 D4 detector: LEVEL-SCHEMA + ACTION-VERB fingerprint.
 *
 * Uses the CANONICAL extractor (.audit/gz-extract-levels.js) — do not
 * re-implement it (it handles comments, string literals, and eval-parse).
 *
 * Identity of a game = (level-object key schema) x (action verbs actually
 * reachable from input handlers).
 *
 * CALIBRATION (mandatory, Pitfall #62):
 *   - POSITIVE: a synthetic pair with identical schema+verbs must score 1.0.
 *   - NEGATIVE: camel-path vs zebra-path (adjudicated DISTINCT in R319) must
 *     NOT score 1.0 on BOTH axes.
 *   - SENSITIVITY: a synthetic pair differing by ONE key must score < 1.0.
 */
const fs = require('fs');
const path = require('path');
const ROOT = path.resolve(__dirname, '..');
const extractLevels = require(path.join(ROOT, '.audit/gz-extract-levels.js'));

function liveGames() {
  const src = fs.readFileSync(path.join(ROOT, 'js/games-data.js'), 'utf8')
    .replace(/^const\s+(GAME_GRADIENTS|GAMES)\s*=/gm, 'var $1=');
  const GAMES = new Function(src + '; return GAMES;')();
  return GAMES.filter(g => g.status === 'live')
    .map(g => ({ slug: g.url.replace(/^\//, '').replace(/\/$/, ''), name: g.name, cat: g.cat, tags: g.tags || [], desc: g.desc || '' }));
}

const VERBS = ['move','drop','place','put','swap','match','merge','sort','fill','paint','draw','slide','tap',
  'rotate','flip','stack','pop','shoot','aim','swing','cut','pull','push','lift','connect','link','select',
  'choose','pick','remove','delete','clear','collect','grab','throw','tilt','steer','jump','roll','drag',
  'extend','grow','shrink','split','join','group','light','shade','mark','cross','trace','path','steal','rescue'];

function actionVerbs(raw) {
  const found = new Set();
  const fnRe = /function\s+([A-Za-z_$][\w$]*)\s*\(([^)]*)\)\s*\{/g;
  let m;
  while ((m = fnRe.exec(raw))) {
    const name = m[1], args = m[2];
    if (!/(e|ev|event|dir|dx|dy|key|idx|col|row|btn|tap|ch|letter|n)/i.test(args)) continue;
    // heuristics: a handler usually mentions a pointer/key event or an index
    let i = m.index + m[0].length - 1, depth = 0, end = -1;
    for (let j = i; j < raw.length && j < i + 3000; j++) {
      if (raw[j] === '{') depth++;
      else if (raw[j] === '}') { depth--; if (depth === 0) { end = j; break; } }
    }
    if (end < 0) continue;
    const body = raw.slice(i, end + 1);
    for (const v of VERBS) {
      if (new RegExp('\\b' + v + '\\w*\\b', 'i').test(body)) found.add(v);
    }
  }
  // also inline arrow/function handlers attached to events
  const evRe = /(?:onclick|onpointerdown|onpointerup|onmousedown|onmouseup|ontouchstart|ontouchend|onkeydown)\s*=\s*([\s\S]{0,400}?)(?:>|;)/g;
  while ((m = evRe.exec(raw))) {
    for (const v of VERBS) {
      if (new RegExp('\\b' + v + '\\w*\\b', 'i').test(m[1])) found.add(v);
    }
  }
  return found;
}

function schemaOf(arr) {
  if (!Array.isArray(arr) || !arr.length) return { keys: new Set(), n: 0 };
  const objs = arr.filter(o => o && typeof o === 'object' && !Array.isArray(o));
  if (!objs.length) return { keys: new Set(), n: 0 };
  const counts = new Map();
  for (const o of objs) {
    const ks = Object.keys(o).map(k => k.toLowerCase()).sort().join(',');
    counts.set(ks, (counts.get(ks) || 0) + 1);
  }
  let modal = '', best = -1;
  for (const [k, c] of counts) if (c > best) { best = c; modal = k; }
  return { keys: new Set(modal ? modal.split(',') : []), n: objs.length, modalShare: best / objs.length };
}

const containment = (a, b) => (!a.size || !b.size) ? 0 : [...a].filter(x => b.has(x)).length / Math.min(a.size, b.size);
const jac = (a, b) => (!a.size || !b.size) ? 0 : [...a].filter(x => b.has(x)).length / new Set([...a, ...b]).size;

function main() {
  const games = liveGames();
  console.log(`LIVE: ${games.length}`);
  const info = {};
  let noData = 0;
  for (const g of games) {
    const idx = path.join(ROOT, g.slug, 'index.html');
    if (!fs.existsSync(idx)) continue;
    const raw = fs.readFileSync(idx, 'utf8');
    let arr = null;
    try { arr = extractLevels(g.slug); } catch (e) { arr = null; }
    const sch = schemaOf(arr);
    if (!sch.keys.size) noData++;
    info[g.slug] = { keys: sch.keys, verbs: actionVerbs(raw), nlev: sch.n, share: sch.modalShare, name: g.name, desc: g.desc, cat: g.cat, tags: g.tags };
  }
  const withData = Object.entries(info).filter(([k, v]) => v.keys.size >= 2);
  console.log(`games with an extractable level schema (>=2 keys): ${withData.length}`);
  console.log(`games WITHOUT extractable schema: ${noData}`);

  console.log('\n=== D4 CANDIDATE PAIRS (schema containment >=0.80 AND verb containment >=0.65) ===');
  const cands = [];
  for (let i = 0; i < withData.length; i++) {
    for (let j = i + 1; j < withData.length; j++) {
      const [a, A] = withData[i], [b, B] = withData[j];
      const sc = containment(A.keys, B.keys);
      if (sc < 0.80) continue;
      const vc = containment(A.verbs, B.verbs);
      if (vc < 0.65) continue;
      cands.push({ sc: +sc.toFixed(3), vc: +vc.toFixed(3), a, b, jc: +jac(A.keys, B.keys).toFixed(3) });
    }
  }
  cands.sort((x, y) => y.sc * y.vc - x.sc * x.vc);
  console.log(`  ${cands.length} candidate pairs`);
  for (const c of cands.slice(0, 40)) {
    console.log(`   schema=${c.sc} verbs=${c.vc} jac=${c.jc}  ${c.a} <-> ${c.b}`);
  }

  console.log('\n=== IDENTICAL SCHEMA GROUPS (>=2 games, same modal key set) ===');
  const bySchema = new Map();
  for (const [k, v] of withData) {
    const key = [...v.keys].sort().join(',');
    if (!bySchema.has(key)) bySchema.set(key, []);
    bySchema.get(key).push(k);
  }
  const groups = [...bySchema.entries()].filter(([, v]) => v.length >= 2).sort((a, b) => b[1].length - a[1].length);
  for (const [k, v] of groups) {
    console.log(`   n=${v.length}: ${v.join(', ')}`);
    console.log(`        schema = [${k}]`);
  }

  console.log('\n=== CALIBRATION CONTROLS ===');
  const mk = ks => new Set(ks);
  console.log(`   SYNTH identical schema      : ${containment(mk(['grid','start','exit','gems','par']), mk(['grid','start','exit','gems','par'])).toFixed(3)}  (must be 1.000)`);
  console.log(`   SYNTH one-key-diff sensitivity: ${containment(mk(['grid','start','exit','gems','par']), mk(['grid','start','exit','gems','time'])).toFixed(3)}  (must be < 1.000)`);
  console.log(`   SYNTH disjoint schema         : ${containment(mk(['a','b']), mk(['x','y'])).toFixed(3)}  (must be 0.000)`);
  for (const [a, b] of [['camel-path', 'zebra-path'], ['camel-path', 'bishop-path'], ['goods-sort', 'hexa-sort'], ['goods-sort', 'pocket-sort']]) {
    if (info[a] && info[b]) {
      console.log(`   KNOWN pair ${a} <-> ${b}: schema=${containment(info[a].keys, info[b].keys).toFixed(3)} verbs=${containment(info[a].verbs, info[b].verbs).toFixed(3)} keysA=[${[...info[a].keys]}] keysB=[${[...info[b].keys]}]`);
    } else {
      console.log(`   KNOWN pair ${a} <-> ${b}: NOT EXTRACTED`);
    }
  }
  fs.writeFileSync(path.join(ROOT, '.audit/r333-d4-candidates.json'), JSON.stringify(cands.map(c => ({ ...c })), null, 1));
  fs.writeFileSync(path.join(ROOT, '.audit/r333-d4-groups.json'), JSON.stringify(Object.fromEntries(groups.map(([k, v]) => [k, v])), null, 1));
}

main();
