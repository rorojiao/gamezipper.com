#!/usr/bin/env node
/* Phase 3 scoring: 9-dimension 1–5 scores for every real game.
 * Inputs: state/inventory.json (static signals), reports/smoke-results.json,
 *         reports/solvability-results.json, reports/playtest-results.json,
 *         reports/difficulty-curves.json, static keyword scans (this script).
 * Output: reports/scoring-data.json (per-game dims + evidence refs + auto flags)
 * NOTE: automated scores are evidence proxies; top-traffic games get designer deep-review
 *       overlays in Phase 3b (manual notes merged into scoring.md). */
const fs = require('fs');
const path = require('path');
const repo = path.resolve(__dirname, '..', '..');
const inv = JSON.parse(fs.readFileSync(path.join(__dirname, '..', 'state', 'inventory.json'), 'utf8'));
const smoke = JSON.parse(fs.readFileSync(path.join(__dirname, '..', 'reports', 'smoke-results.json'), 'utf8')).results;
let solv = {}; try { solv = JSON.parse(fs.readFileSync(path.join(__dirname, '..', 'reports', 'solvability-results.json'), 'utf8')).results || {}; } catch (e) {}
let pt = {}; try { pt = JSON.parse(fs.readFileSync(path.join(__dirname, '..', 'reports', 'playtest-results.json'), 'utf8')).results || {}; } catch (e) {}
let curves = {}; try { curves = JSON.parse(fs.readFileSync(path.join(__dirname, '..', 'reports', 'difficulty-curves.json'), 'utf8')).curves || {}; } catch (e) {}

const KW = {
  tutorial: /tutorial|how\s*to\s*play|guide|instructions|说明|教程/i,
  hint: /hint|提示/i,
  daily: /daily|每日|streak|连击签到/i,
  star: /star|achievement|badge|成就/i,
  undo: /undo|撤销/i,
  sound: /AudioContext|oscillator|Howl|\.mp3|\.ogg|\.wav|snd/i,
  particles: /particle|spawnParticles|confetti|burst/i,
  anim: /transition|animate\(|@keyframes|animation:/i,
  diffSel: /difficulty|简单|困难|easy.*medium.*hard/i,
};

const rows = [];
for (const g of inv.games) {
  if (g.isStub) continue;
  const slug = g.slug;
  let html = '';
  try { html = fs.readFileSync(path.join(repo, slug, 'index.html'), 'utf8'); } catch (e) { continue; }
  // static signals must cover the game's OWN local JS too (game.js etc.) — games like
  // 2048/tetris/slope keep their engine in a sibling game.js, invisible to an html-only scan
  let corpus = html;
  try {
    for (const m of html.matchAll(/<script[^>]*src="([^"]+)"[^>]*>/g)) {
      const src = m[1];
      if (/^https?:|^\/\//.test(src)) continue;          // external
      if (src.startsWith('/')) continue;                  // site-shared infra (analytics/ads/game-audio)
      if (/verify_engine|test\.spec/.test(src)) continue;
      const p2 = path.join(repo, slug, src);
      try { corpus += '\n' + fs.readFileSync(p2, 'utf8'); } catch (e) {}
    }
  } catch (e) {}
  const has = {}; for (const [k, re] of Object.entries(KW)) has[k] = re.test(corpus);
  const audioCount = (corpus.match(/AudioContext|createOscillator|oscillator|new Audio\(|\.mp3|\.ogg|\.wav/g) || []).length;
  const sm = smoke[slug] || {};
  const sv = solv[slug] || {};
  const p = pt[slug] || {};
  const cv = curves[slug];

  // ---- 9 dimensions (evidence-proxied) ----
  // 1 核心玩法乐趣: baseline by playtest engagement + verify status
  let fun = 3;
  if (p.verdict === 'PLAYABLE') fun = 3.5; else if (p.verdict === 'DEGRADED') fun = 2.5; else if (p.verdict === 'DEAD') fun = 1.5;
  if (sv.verdict === 'PASS') fun += 0.5; else if (sv.verdict === 'FAIL') fun = Math.min(fun, 1.5);
  fun = Math.max(1, Math.min(5, fun));
  // 2 操作手感: playtest canvas response + input richness
  let feel = 3;
  if (p.canvasChanged !== undefined) feel = p.canvasChanged >= 0.8 ? 4 : p.canvasChanged >= 0.3 ? 3 : 2;
  if (p.rafAlive) feel = Math.min(5, feel + 0.5);
  // 3 难度曲线
  let curveS = 3;
  if (cv) curveS = cv.verdict === 'PASS' ? 4 : 2;
  if (has.diffSel) curveS = Math.min(5, curveS + 0.5);
  // 4 关卡节奏: level count + variety
  let pacing = 3;
  const lv = g.hasLevelsData ? 4 : 3;
  pacing = Math.min(5, lv);
  // 5 视觉动效
  let visual = 2.5; if (has.anim) visual += 0.5; if (has.particles) visual += 0.5; visual = Math.min(5, visual);
  // 6 音效反馈
  let audio = 2; const ac = audioCount || 0;
  if (has.sound) audio = ac >= 6 ? 4.5 : ac >= 3 ? 4 : 3.5;
  // 7 新手引导
  let onboarding = 2; if (has.tutorial) onboarding += 1; if (has.hint) onboarding += 1; if (sm.verdict === 'PASS') onboarding += 0.5;
  onboarding = Math.min(5, onboarding);
  // 8 失败惩罚合理性 (proxy: undo/retry affordances = forgiving)
  let penalty = 3; if (has.undo) penalty += 0.5; if (has.hint) penalty += 0.5; penalty = Math.min(5, penalty);
  // 9 留存钩子
  let retention = 1.5; if (has.daily) retention += 1.5; if (has.star) retention += 1; if (has.diffSel) retention += 0.5;
  retention = Math.min(5, retention);

  const dims = { fun, feel, curve: curveS, pacing, visual, audio, onboarding, penalty, retention };
  const avg = +(Object.values(dims).reduce((a, b) => a + b, 0) / 9).toFixed(2);
  const flags = [];
  if (sv.verdict === 'FAIL') flags.push('P0-unsolvable');
  if (sm.verdict === 'FAIL') flags.push('P0-crash');
  if (p.verdict === 'DEAD' && !g.isStub) flags.push('P0-dead-input');
  if (p.verdict === 'DEAD-UNCONFIRMED') flags.push('P2-playtest-unconfirmed');
  if (has.tutorial === false && (p.verdict === 'PLAYABLE' || p.verdict === 'DEGRADED')) flags.push('P2-no-onboarding');
  if (!has.sound && (p.verdict === 'PLAYABLE' || p.verdict === 'DEGRADED')) flags.push('P1-no-audio');
  if (!has.daily && !has.star) flags.push('P2-no-retention-hook');
  rows.push({ slug, title: g.title || slug, category: g.category, dims, avg, flags,
    evidence: { smoke: sm.verdict, solvability: sv.verdict || (g.hasVerifier ? 'PASS' : 'no-verifier'), playtest: p.verdict || 'not-run', curve: cv ? cv.verdict : 'n/a' } });
}
fs.writeFileSync(path.join(__dirname, '..', 'reports', 'scoring-data.json'), JSON.stringify({ generated: new Date().toISOString(), games: rows }, null, 1));
const flagCount = {};
rows.forEach(r => r.flags.forEach(f => flagCount[f] = (flagCount[f] || 0) + 1));
console.log(`scored ${rows.length} games`);
console.log('flag distribution:', JSON.stringify(flagCount));
console.log('avg score:', (rows.reduce((a, r) => a + r.avg, 0) / rows.length).toFixed(2));
