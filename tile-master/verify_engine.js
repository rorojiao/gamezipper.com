#!/usr/bin/env node
/* tile-master engine verifier — 2026-08-25
 * Offline oracles (LEVELS data, exact solvability w/ path extraction, clog sequences,
 * visible-triple scan) + driven end-to-end play through REAL element clicks
 * (inline onclick buttons found in the parsed body tree, per-tile addEventListener('click'))
 * across boots A-D.
 * Engine fixes under test:
 *   P1 2026-08-25 fade-timer orphaned undo-restored tile's fresh element (unwinnable board)
 *   P3 2026-08-25 stale t.covered dropped sub-50ms taps on newly uncovered stack tiles
 * Documented (not fixed): window.* exports after IIFE return = dead code;
 * tm-win-stars textContent assignment overwritten by innerHTML; clearMatchedFromTray
 * no-op forEach; undo of a matched tile returns only 1 of the 3 cleared tiles (design);
 * save persists only {maxUnlocked, stars}; no mid-game persistence (exit discards run).
 * Harness note: els map holds the engine-mutated id nodes; static onclick buttons live in
 * the deep-parsed body tree — reached via a body walk (both are the live objects).
 */
"use strict";
const path = require("path");
const fs = require("fs");
const { execFileSync } = require("child_process");
const HL = require(path.resolve(__dirname, "..", "_optimization", "scripts", "harness-lib.js"));

let P = 0, F = 0; const fails = [];
function ck(name, cond, info) {
  if (cond) { P++; } else { F++; fails.push(name + (info !== undefined ? " :: " + info : "")); }
}
const S = (x) => String(x);

/* ============ OFFLINE: extract LEVELS from HTML ============ */
const html = fs.readFileSync(path.join(__dirname, "index.html"), "utf8");
const L0 = html.indexOf("var LEVELS = ");
ck("o-extract-marker", L0 >= 0, "LEVELS marker not found");
const L1 = html.indexOf("];", L0);
const LEVELS = JSON.parse(html.slice(L0 + "var LEVELS = ".length, L1 + 1));
const CHAPTERS = ["Fruits", "Animals", "Symbols", "Seasons", "Food", "Misc"];

ck("o-levels-count", Array.isArray(LEVELS) && LEVELS.length === 30, LEVELS.length);
ck("o-ids-seq", LEVELS.every((lv, i) => lv.id === i + 1));
for (const lv of LEVELS) {
  const tag = "L" + lv.id;
  ck(tag + "-total", lv.tiles.length === lv.total, lv.tiles.length + "!=" + lv.total);
  ck(tag + "-div3", lv.total % 3 === 0);
  ck(tag + "-chapter", lv.chapterName === CHAPTERS[lv.chapter], lv.chapterName);
  ck(tag + "-grid-range", [4, 5, 6, 7].includes(lv.grid), lv.grid);
  const typeCount = {};
  const seen = {};
  let okTypes = true, okPos = true, okDup = true;
  for (const t of lv.tiles) {
    if (!(t.t >= 0 && t.t < lv.emojis.length)) okTypes = false;
    typeCount[t.t] = (typeCount[t.t] || 0) + 1;
    if (!(t.r >= 0 && t.r < lv.grid && t.c >= 0 && t.c < lv.grid && (t.l === 0 || t.l === 1))) okPos = false;
    const k = t.r + "," + t.c + "," + t.l;
    if (seen[k]) okDup = false; seen[k] = 1;
  }
  ck(tag + "-types-range", okTypes);
  ck(tag + "-types-mult3", Object.values(typeCount).every((n) => n % 3 === 0), JSON.stringify(typeCount));
  ck(tag + "-pos-valid", okPos);
  ck(tag + "-no-dup-stack", okDup);
  ck(tag + "-powerups", lv.powerups.undo >= 1 && lv.powerups.shuffle >= 1 && lv.powerups.hint >= 1);
  ck(tag + "-emojis", lv.emojis.length >= 5 && lv.emojis.length <= 6, lv.emojis.length);
}
const groups = {};
LEVELS.forEach((lv) => { (groups[lv.chapter] = groups[lv.chapter] || []).push(lv.id); });
ck("o-chapter-groups", Object.keys(groups).length === 6 && Object.values(groups).every((a) => a.length === 5), JSON.stringify(groups));

const lvJson = JSON.parse(fs.readFileSync(path.join(__dirname, "levels.json"), "utf8"));
ck("o-levels-json-parity", JSON.stringify(lvJson) === JSON.stringify(LEVELS), "levels.json differs from inline LEVELS");

/* ============ OFFLINE: solvers (engine-faithful) ============ */
function mkAbove(lv) {
  const n = lv.tiles.length;
  const stacks = {};
  for (let i = 0; i < n; i++) { const k = lv.tiles[i].r + "," + lv.tiles[i].c; (stacks[k] = stacks[k] || []).push(i); }
  const above = Array(n).fill(0n);
  for (const ids of Object.values(stacks))
    for (const i of ids) for (const j of ids) if (lv.tiles[j].l > lv.tiles[i].l) above[i] |= 1n << BigInt(j);
  return above;
}
function applyTap(tiles, cleared, tray, i) {
  const c2 = cleared | (1n << BigInt(i));
  let t2 = tray.concat([tiles[i].t]);
  const ty = tiles[i].t;
  if (t2.filter((x) => x === ty).length >= 3) { let rm = 3; t2 = t2.filter((x) => x !== ty || rm-- <= 0); }
  return [c2, t2];
}
let nodes = 0;
function planSearch(lv, cleared0, tray0, mode) { // "solve" | "clog" -> tap-index path or null
  nodes = 0;
  const tiles = lv.tiles, n = tiles.length, above = mkAbove(lv);
  const all = (1n << BigInt(n)) - 1n;
  const memo = new Set();
  const path = [];
  function dfs(cleared, tray) {
    if (mode === "solve" && cleared === all) return true;
    if (mode === "clog" && tray.length >= 7) return true;
    if (mode === "solve" && tray.length >= 7) return false;
    if (++nodes > 3e6) throw new Error("node budget exceeded L" + lv.id);
    const k = cleared.toString(36) + "|" + tray.slice().sort((a, b) => a - b).join(",");
    if (memo.has(k)) return false; memo.add(k);
    const counts = {}; for (const t of tray) counts[t] = (counts[t] || 0) + 1;
    const vis = [];
    for (let i = 0; i < n; i++) if (!(cleared & (1n << BigInt(i))) && (above[i] & ~cleared) === 0n) vis.push(i);
    if (mode === "solve") vis.sort((a, b) => (counts[tiles[b].t] || 0) - (counts[tiles[a].t] || 0));
    else vis.sort((a, b) => (counts[tiles[a].t] || 0) - (counts[tiles[b].t] || 0));
    for (const i of vis) {
      if (mode === "clog" && (counts[tiles[i].t] || 0) >= 2) continue; // never allow a 3rd copy in tray
      const [c2, t2] = applyTap(tiles, cleared, tray, i);
      path.push(i);
      if (dfs(c2, t2)) return true;
      path.pop();
    }
    return false;
  }
  const ok = dfs(cleared0, tray0.slice());
  return ok ? path.slice() : null;
}
function replayPlan(lv, plan, cleared0, tray0) {
  const tiles = lv.tiles, above = mkAbove(lv);
  let cleared = cleared0, tray = tray0.slice();
  for (const i of plan) {
    if (cleared & (1n << BigInt(i))) return "tap cleared tile " + i;
    if ((above[i] & ~cleared) !== 0n) return "tap covered tile " + i;
    if (tray.length >= 7) return "tap with full tray " + i;
    [cleared, tray] = applyTap(tiles, cleared, tray, i);
  }
  return { cleared, tray };
}
const plans = {};
for (const id of [1, 2, 3, 5, 30]) {
  const p = planSearch(LEVELS[id - 1], 0n, [], "solve");
  ck("o-solve-L" + id, !!p, "no solution found");
  if (p) {
    plans[id] = p;
    const r = replayPlan(LEVELS[id - 1], p, 0n, []);
    ck("o-replay-L" + id, r && r.cleared === (1n << BigInt(LEVELS[id - 1].tiles.length)) - 1n, JSON.stringify(String(r && r.cleared)));
  }
}
const clog = planSearch(LEVELS[0], 0n, [], "clog");
ck("o-clog-L1", !!clog && clog.length === 7, clog && clog.length);
if (clog) {
  const r = replayPlan(LEVELS[0], clog, 0n, []);
  ck("o-clog-replay", r && r.tray.length === 7, "tray=" + (r && r.tray.length));
}
try {
  const out = execFileSync("node", [path.join(__dirname, "verify_levels.js")], { encoding: "utf8", timeout: 60000 });
  ck("o-verify-levels-exhaustive", /failures=0/.test(out), out.slice(-200));
} catch (e) { ck("o-verify-levels-exhaustive", false, String(e.message).slice(0, 200)); }
// visible-triple scan on initial boards (hint charge vs no-charge)
const noTripleLevels = [];
for (const lv of LEVELS) {
  const above = mkAbove(lv); const counts = {};
  for (let i = 0; i < lv.tiles.length; i++) if (above[i] === 0n) counts[lv.tiles[i].t] = (counts[lv.tiles[i].t] || 0) + 1;
  if (!Object.values(counts).some((n) => n >= 3)) noTripleLevels.push(lv.id);
}
const HINT_NOCHARGE_LEVEL = noTripleLevels[0] || 0;

/* ============ DRIVEN helpers ============ */
function gid(ga, id) { return ga.call('document.getElementById("' + id + '")'); }
function bodyButtons(ga) {
  const out = [];
  const walk = (el) => { for (const c of (el.children || [])) { if (typeof c.onclick === "function") out.push(c); walk(c); } };
  walk(ga.call("document.body"));
  return out;
}
function btnByText(ga, text) { return bodyButtons(ga).find((b) => S(b.textContent) === text); }
function underId(btn, id) { let n = btn; while (n) { if (n.id === id) return true; n = n.parentNode; } return false; }
function ovBtn(ga, overlayId, label) { return bodyButtons(ga).find((b) => S(b.textContent) === label && underId(b, overlayId)); }
function menuBtn(ga) { return bodyButtons(ga).find((b) => b.classList._s.has("tm-btn-icon")); }
function screens(ga) { return ga.call('document.querySelectorAll(".gz-screen")'); }
function activeScreen(ga, id) { const s = screens(ga).find((x) => x.id === id); return !!s && s.classList._s.has("active"); }
function boardTiles(ga) { return (gid(ga,"tm-board").children || []).filter((e) => e._tileId !== undefined); }
function liveTiles(ga) { return boardTiles(ga).filter((e) => !(e.style && e.style.opacity === "0")); }
function firstTappable(ga) { const t = liveTiles(ga).find((e) => !e.classList._s.has("covered")); if (!t) throw new Error("no tappable tile"); return t; }
function tileTypeOf(el, lv) {
  const m = />([^<]+)</.exec(el.innerHTML || "");
  return m ? lv.emojis.indexOf(m[1]) : -1;
}
function snapshot(ga, lv) {
  const active = liveTiles(ga).map((e) => {
    const id = e._tileId, d = lv.tiles[id];
    return { id, type: tileTypeOf(e, lv), r: d.r, c: d.c, l: d.l };
  });
  const tray = gid(ga,"tm-tray").children.filter((s) => s.classList._s.has("filled")).map((s) => lv.emojis.indexOf(S(s.textContent)));
  return { active, tray };
}
function planFromSnapshot(snap) {
  const fakeLv = { tiles: snap.active.map((t) => ({ t: t.type, r: t.r, c: t.c, l: t.l })) };
  const idxToId = snap.active.map((t) => t.id);
  const p = planSearch(fakeLv, 0n, snap.tray, "solve");
  return p ? p.map((i) => idxToId[i]) : null;
}
function tapTile(ga, id) {
  const el = boardTiles(ga).find((e) => e._tileId === id && !(e.style && e.style.opacity === "0"));
  if (!el) throw new Error("no clickable el for tile " + id);
  el.dispatch("click");
}
function drivePlan(ga, plan) {
  for (const id of plan) { tapTile(ga, id); ga.pump(4); }
}
function trayFilled(ga) { return gid(ga,"tm-tray").children.filter((s) => s.classList._s.has("filled")).length; }
function remaining(ga) { return S(gid(ga,"tm-remaining").textContent); }
function levelButtons(ga) {
  const out = [];
  gid(ga,"tm-ls-scroll").children.forEach((ch) => { ch.children[1].children.forEach((b) => out.push(b)); });
  return out;
}
function unlockedCount(ga) { return levelButtons(ga).filter((b) => b.classList._s.has("unlocked")).length; }
function starSpansOf(btn) { return (String(btn.children[0].innerHTML).match(/class=.empty./g) || []).length; }
function readSave(ga) {
  const raw = ga.call('localStorage.getItem("tilemaster_save_v1")');
  return raw ? JSON.parse(raw) : null;
}
function playFromTitle(ga) {
  btnByText(ga, "PLAY").click();
  return activeScreen(ga, "level-select-screen");
}

/* ============ BOOT A: fresh ============ */
const ga = HL.bootGame("tile-master", {});
ck("a1-loaderrors", ga.loadErrors.length === 0, JSON.stringify(ga.loadErrors));
ck("a1-title-active", activeScreen(ga, "title-screen"));
ck("a1-tm-api", ga.call("typeof TM") === "object" && ga.call("TM.LEVELS.length") === 30 && ga.call("TM.LEVELS[0].total") === 15);

btnByText(ga, "HOW TO PLAY").click();
ck("a2-howto-active", activeScreen(ga, "howto-screen"));
btnByText(ga, "GOT IT").click();
ck("a2-title-back", activeScreen(ga, "title-screen"));

ck("a3-select", playFromTitle(ga));
ck("a3-chapters", gid(ga,"tm-ls-scroll").children.length === 6, gid(ga,"tm-ls-scroll").children.length);
let btns = levelButtons(ga);
ck("a3-30-buttons", btns.length === 30, btns.length);
ck("a3-only-L1-unlocked", unlockedCount(ga) === 1 && btns[0].classList._s.has("unlocked"));
ck("a3-locked-noop", (btns[1].click(), !activeScreen(ga, "game-screen")));
ck("a3-no-save-yet", readSave(ga) === null);

btns[0].click(); ga.pump(3);
ck("a4-game-active", activeScreen(ga, "game-screen"));
ck("a4-level-1", S(gid(ga,"tm-cur-level").textContent) === "1");
ck("a4-chapter", S(gid(ga,"tm-cur-chapter").textContent) === "Fruits");
ck("a4-remaining", remaining(ga) === "15");
ck("a4-pu-counts", S(gid(ga,"tm-pu-undo-c").textContent) === "5" && S(gid(ga,"tm-pu-shuffle-c").textContent) === "4" && S(gid(ga,"tm-pu-hint-c").textContent) === "5");
const bt0 = boardTiles(ga);
ck("a4-15-tiles", bt0.length === 15, bt0.length);
ck("a4-no-covered-L1", bt0.every((e) => !e.classList._s.has("covered")));
{
  const W = ga.call("document.getElementById('tm-board-wrap').clientWidth");
  const H = ga.call("document.getElementById('tm-board-wrap').clientHeight");
  let cs = Math.floor(Math.min((W - 4) / 4, (H - 4) / 4, 70)); if (cs < 28) cs = 28;
  ck("a4-board-width", gid(ga,"tm-board").style.width === cs * 4 + 4 + "px", gid(ga,"tm-board").style.width + " vs " + (cs * 4 + 4));
  ck("a4-tile-pos", bt0.every((e) => /^\d+px$/.test(e.style.left) && /^\d+px$/.test(e.style.top)));
}
ck("a5-tray-empty", trayFilled(ga) === 0 && gid(ga,"tm-tray").children.length === 7);

// LOSE path: clog 7 no-triple taps
for (const i of clog) { tapTile(ga, i); ga.pump(4); }
ck("a6-tray-7", trayFilled(ga) === 7);
ck("a6-danger-class", gid(ga,"tm-tray").children.filter((s) => s.classList._s.has("danger")).length === 7);
ga.pump(25);
ck("a6-lose-overlay", gid(ga,"tm-lose-overlay").classList._s.has("active"));
ck("a6-remaining-left", remaining(ga) !== "0");

ovBtn(ga, "tm-lose-overlay", "Retry").click(); ga.pump(3);
ck("a7-lose-hidden", !gid(ga,"tm-lose-overlay").classList._s.has("active"));
ck("a7-reset-remaining", remaining(ga) === "15");
ck("a7-reset-tray", trayFilled(ga) === 0);
ck("a7-reset-pu", S(gid(ga,"tm-pu-undo-c").textContent) === "5" && S(gid(ga,"tm-pu-hint-c").textContent) === "5");

ck("a8-undo-disabled", gid(ga,"tm-pu-undo").disabled === true);
gid(ga,"tm-pu-undo").dispatch("click");
ck("a8-undo-noop", remaining(ga) === "15" && S(gid(ga,"tm-pu-undo-c").textContent) === "5");

// P1 regression: undo within 260ms of tap must not orphan the restored element
{
  const id = firstTappable(ga)._tileId;
  tapTile(ga, id);                        // no pump — 260ms fade timer pending
  ck("a9-tray-1", trayFilled(ga) === 1);
  gid(ga,"tm-pu-undo").dispatch("click"); // undo BEFORE the fade fires
  ga.pump(20);                            // fire the 260ms timer
  const el = boardTiles(ga).find((e) => e._tileId === id);
  ck("a9-p1-el-survives", !!el && el.style.opacity !== "0", el ? "opacity=" + el.style.opacity : "element gone");
  ck("a9-p1-restored", remaining(ga) === "15");
  if (el) { el.dispatch("click"); ga.pump(4); ck("a9-p1-clickable", remaining(ga) === "14", remaining(ga)); }
  gid(ga,"tm-pu-undo").dispatch("click"); ga.pump(20);
  ck("a9-p1-restored-2", remaining(ga) === "15" && trayFilled(ga) === 0);
}
// exit via menu + re-enter for a clean puUsed=0 run
menuBtn(ga).click(); ga.pump(2);
ck("a9b-exit-select", activeScreen(ga, "level-select-screen"));
btns = levelButtons(ga); btns[0].click(); ga.pump(3);
ck("a9b-reenter-L1", remaining(ga) === "15" && S(gid(ga,"tm-pu-undo-c").textContent) === "5");

// CLEAN 3★ solve of L1 through real taps
{
  let matched = false;
  const plan = plans[1];
  for (let k = 0; k < plan.length; k++) {
    tapTile(ga, plan[k]); ga.pump(4);
    if (!matched && trayFilled(ga) === 0 && k >= 2) matched = true;
  }
  ck("a10-triple-popped", matched, "no auto-triple observed");
  ga.pump(30);
  ck("a10-remaining-0", remaining(ga) === "0");
  ck("a10-win-overlay", gid(ga,"tm-win-overlay").classList._s.has("active"));
  ck("a10-3star-text", S(gid(ga,"tm-win-text").textContent) === "Perfect! No power-ups used!", S(gid(ga,"tm-win-text").textContent));
  const gold = (S(gid(ga,"tm-win-stars").innerHTML).match(/#ffd93d/g) || []).length;
  ck("a10-3star-spans", gold === 3, gold + "/3");
  ck("a10-next-shown", gid(ga,"tm-next-btn").style.display === "");
  const sv = readSave(ga);
  ck("a10-save", sv && sv.stars["1"] === 3 && sv.maxUnlocked === 2, JSON.stringify(sv));
}

ovBtn(ga, "tm-win-overlay", "Next").click(); ga.pump(3);
ck("a11-L2", S(gid(ga,"tm-cur-level").textContent) === "2" && remaining(ga) === "15" && activeScreen(ga, "game-screen"));
{
  const id = firstTappable(ga)._tileId;
  tapTile(ga, id); ga.pump(4);
  gid(ga,"tm-pu-undo").dispatch("click"); ga.pump(20);
  ck("a12-undo-restores", remaining(ga) === "15" && trayFilled(ga) === 0 && S(gid(ga,"tm-pu-undo-c").textContent) === "4");
  drivePlan(ga, plans[2]); ga.pump(30);
  ck("a12-win", gid(ga,"tm-win-overlay").classList._s.has("active"));
  ck("a12-2star-text", S(gid(ga,"tm-win-text").textContent) === "Well done!", S(gid(ga,"tm-win-text").textContent));
  const sv = readSave(ga);
  ck("a12-save", sv && sv.stars["2"] === 2 && sv.maxUnlocked === 3, JSON.stringify(sv));
}

ovBtn(ga, "tm-win-overlay", "Next").click(); ga.pump(3);
ck("a13-L3-covered", S(gid(ga,"tm-cur-level").textContent) === "3" && boardTiles(ga).some((e) => e.classList._s.has("covered")));
for (let u = 0; u < 3; u++) {
  const id = firstTappable(ga)._tileId;
  tapTile(ga, id); ga.pump(4);
  gid(ga,"tm-pu-undo").dispatch("click"); ga.pump(20);
}
ck("a14-undo-2-left", S(gid(ga,"tm-pu-undo-c").textContent) === "2");
drivePlan(ga, plans[3]); ga.pump(30);
ck("a14-win", gid(ga,"tm-win-overlay").classList._s.has("active"));
ck("a14-1star-text", S(gid(ga,"tm-win-text").textContent) === "You cleared it!", S(gid(ga,"tm-win-text").textContent));
{ const sv = readSave(ga); ck("a14-save", sv && sv.stars["3"] === 1 && sv.maxUnlocked === 4, JSON.stringify(sv)); }

ovBtn(ga, "tm-win-overlay", "Next").click(); ga.pump(3);
ck("a15-L4", remaining(ga) === "18");
let expectedPuUsed = 0;
{
  const above4 = mkAbove(LEVELS[3]); const counts = {};
  for (let i = 0; i < LEVELS[3].tiles.length; i++) if (above4[i] === 0n) counts[LEVELS[3].tiles[i].t] = (counts[LEVELS[3].tiles[i].t] || 0) + 1;
  const hasTriple = Object.values(counts).some((n) => n >= 3);
  gid(ga,"tm-pu-hint").dispatch("click");
  if (hasTriple) {
    expectedPuUsed += 1;
    ck("a16-hint-charged", S(gid(ga,"tm-pu-hint-c").textContent) === "4", S(gid(ga,"tm-pu-hint-c").textContent));
    const pulses = () => boardTiles(ga).filter((e) => e.classList._s.has("hint-pulse")).length;
    ck("a16-pulse-3", pulses() === 3, pulses());
    ga.pump(190);
    ck("a16-pulse-gone", pulses() === 0, pulses());
  } else {
    ck("a16-hint-nocharge", S(gid(ga,"tm-pu-hint-c").textContent) === "5" && S(gid(ga,"tm-toast").textContent).includes("No direct match"));
  }
}
{
  const before = liveTiles(ga).map((e) => ({ id: e._tileId, type: tileTypeOf(e, LEVELS[3]), left: e.style.left, top: e.style.top }));
  gid(ga,"tm-pu-shuffle").dispatch("click");
  ck("a17-shuffle-count", S(gid(ga,"tm-pu-shuffle-c").textContent) === "3", S(gid(ga,"tm-pu-shuffle-c").textContent));
  const after = liveTiles(ga).map((e) => ({ id: e._tileId, type: tileTypeOf(e, LEVELS[3]), left: e.style.left, top: e.style.top }));
  ck("a17-positions-same", before.length === after.length && before.every((b) => after.some((a) => a.id === b.id && a.left === b.left && a.top === b.top)));
  const ms = (a) => a.map((x) => x.type).sort().join(",");
  ck("a17-multiset-same", ms(before) === ms(after));
  ck("a17-toast", gid(ga,"tm-toast").classList._s.has("show") && S(gid(ga,"tm-toast").textContent) === "Tiles shuffled!");
  ga.pump(110);
  ck("a17-toast-gone", !gid(ga,"tm-toast").classList._s.has("show"));
  expectedPuUsed += 1;
}
{
  const snap = snapshot(ga, LEVELS[3]);
  const livePlan = planFromSnapshot(snap);
  ck("a18-replan-found", !!livePlan);
  if (livePlan) {
    drivePlan(ga, livePlan); ga.pump(30);
    ck("a18-win", gid(ga,"tm-win-overlay").classList._s.has("active") && remaining(ga) === "0");
    const expText = expectedPuUsed >= 3 ? "You cleared it!" : expectedPuUsed > 0 ? "Well done!" : "Perfect! No power-ups used!";
    ck("a18-star-text", S(gid(ga,"tm-win-text").textContent) === expText, S(gid(ga,"tm-win-text").textContent) + " expected " + expText);
  }
}
ovBtn(ga, "tm-win-overlay", "Levels").click(); ga.pump(2);
ck("a19-select", activeScreen(ga, "level-select-screen"));
btns = levelButtons(ga);
ck("a19-unlocked-5", unlockedCount(ga) === 5);
ck("a19-stars-render", starSpansOf(btns[0]) === 0 && starSpansOf(btns[1]) === 1 && starSpansOf(btns[2]) === 2 && starSpansOf(btns[3]) === 1, [0, 1, 2, 3].map((i) => starSpansOf(btns[i])).join(","));
if (HINT_NOCHARGE_LEVEL && HINT_NOCHARGE_LEVEL <= 5) {
  btns[HINT_NOCHARGE_LEVEL - 1].click(); ga.pump(3);
  gid(ga,"tm-pu-hint").dispatch("click");
  ck("a20-hint-nocharge", S(gid(ga,"tm-toast").textContent).indexOf("No direct match") === 0 && S(gid(ga,"tm-pu-hint-c").textContent) === S(LEVELS[HINT_NOCHARGE_LEVEL - 1].powerups.hint), S(gid(ga,"tm-toast").textContent));
}
ck("aZ-loaderrors-clean", ga.loadErrors.length === 0, JSON.stringify(ga.loadErrors));

/* ============ BOOT B: seeded save ============ */
{
  const gb = HL.bootGame("tile-master", { seedLS: { tilemaster_save_v1: JSON.stringify({ maxUnlocked: 5, stars: { "1": 3, "2": 2, "5": 1 } }) } });
  ck("b1-loaderrors", gb.loadErrors.length === 0, JSON.stringify(gb.loadErrors));
  playFromTitle(gb);
  const bb = levelButtons(gb);
  ck("b1-unlocked-5", unlockedCount(gb) === 5);
  ck("b1-stars", starSpansOf(bb[0]) === 0 && starSpansOf(bb[1]) === 1 && starSpansOf(bb[4]) === 2);
  bb[4].click(); gb.pump(3);
  ck("b2-L5", S(gid(gb,"tm-cur-level").textContent) === "5" && remaining(gb) === "18");
  drivePlan(gb, plans[5]); gb.pump(30);
  ck("b2-win", gid(gb,"tm-win-overlay").classList._s.has("active"));
  { const sv = readSave(gb); ck("b2-upgrade-3star", sv && sv.stars["5"] === 3 && sv.maxUnlocked === 6, JSON.stringify(sv)); }
  ovBtn(gb, "tm-win-overlay", "Levels").click(); gb.pump(2);
  ck("b3-L6-unlocked", unlockedCount(gb) === 6);
}
/* ============ BOOT C: corrupt save ============ */
{
  const gc = HL.bootGame("tile-master", { seedLS: { tilemaster_save_v1: "{not json" } });
  playFromTitle(gc);
  ck("c1-corrupt-defaults", unlockedCount(gc) === 1);
}
/* ============ BOOT C2: forward-compatible save ============ */
{
  const g2 = HL.bootGame("tile-master", { seedLS: { tilemaster_save_v1: JSON.stringify({ maxUnlocked: 9, stars: { "7": 2 }, version: 2, foo: 1 }) } });
  playFromTitle(g2);
  ck("c2-future-save", unlockedCount(g2) === 9 && starSpansOf(levelButtons(g2)[6]) === 1);
}
/* ============ BOOT D: full unlock — L30 endgame, resize, menu ============ */
{
  const gd = HL.bootGame("tile-master", { seedLS: { tilemaster_save_v1: JSON.stringify({ maxUnlocked: 30, stars: {} }) } });
  ck("d0-loaderrors", gd.loadErrors.length === 0, JSON.stringify(gd.loadErrors));
  playFromTitle(gd);
  ck("d0-30-unlocked", unlockedCount(gd) === 30);
  levelButtons(gd)[29].click(); gd.pump(3);
  ck("d1-L30", S(gid(gd,"tm-cur-level").textContent) === "30" && S(gid(gd,"tm-cur-chapter").textContent) === "Misc" && remaining(gd) === "72");
  ck("d1-pu-212", S(gid(gd,"tm-pu-undo-c").textContent) === "2" && S(gid(gd,"tm-pu-shuffle-c").textContent) === "1" && S(gid(gd,"tm-pu-hint-c").textContent) === "2");
  drivePlan(gd, plans[30]); gd.pump(30);
  ck("d2-win-L30", gid(gd,"tm-win-overlay").classList._s.has("active") && remaining(gd) === "0");
  ck("d2-next-hidden", gid(gd,"tm-next-btn").style.display === "none", gid(gd,"tm-next-btn").style.display);
  { const sv = readSave(gd); ck("d2-save-cap", sv && sv.maxUnlocked === 30 && sv.stars["30"] === 3, JSON.stringify(sv)); }
  if (HINT_NOCHARGE_LEVEL && HINT_NOCHARGE_LEVEL > 5) {
    ovBtn(gd, "tm-win-overlay", "Levels").click(); gd.pump(2);
    levelButtons(gd)[HINT_NOCHARGE_LEVEL - 1].click(); gd.pump(3);
    gid(gd,"tm-pu-hint").dispatch("click");
    ck("d3-hint-nocharge", S(gid(gd,"tm-toast").textContent).indexOf("No direct match") === 0 && S(gid(gd,"tm-pu-hint-c").textContent) === S(LEVELS[HINT_NOCHARGE_LEVEL - 1].powerups.hint), S(gid(gd,"tm-toast").textContent));
    menuBtn(gd).click(); gd.pump(2);
  }
  {
    ovBtn(gd, "tm-win-overlay", "Levels").click(); gd.pump(2);
    levelButtons(gd)[28].click(); gd.pump(3);
    ck("d4-L29", remaining(gd) === "72");
    const before = liveTiles(gd).length;
    gd.call("window").dispatchEvent({ type: "resize" });
    gd.pump(10);
    ck("d4-resize-kept", liveTiles(gd).length === before && gid(gd,"tm-board").style.width !== "");
    menuBtn(gd).click(); gd.pump(2);
    ck("d5-menu-exit", activeScreen(gd, "level-select-screen"));
    levelButtons(gd)[28].click(); gd.pump(3);
    ck("d5-fresh-reenter", remaining(gd) === "72" && trayFilled(gd) === 0);
  }
  ck("dZ-loaderrors", gd.loadErrors.length === 0, JSON.stringify(gd.loadErrors));
}

/* ============ REPORT ============ */
const total = P + F;
console.log(JSON.stringify({
  pass: P, fail: F, total,
  verdict: F === 0 ? "PASS" : "FAIL",
  fails: fails.slice(0, 20),
  extra: { offline: "30-level data oracle + exhaustive solver spawn", boots: "A(fresh)+B(seeded)+C(corrupt)+C2(future)+D(full-unlock)", hintNoChargeLevel: HINT_NOCHARGE_LEVEL || "none", fixes: "P1 fade-timer orphan, P3 stale coverage" },
}));
process.exit(F === 0 ? 0 : 1);
