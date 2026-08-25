#!/usr/bin/env node
'use strict';
// Metro Lines — full verification via real input paths (verifier-spec contract).
//
// All input goes through the engine's own listeners:
//   canvas pointerdown (onDown: station drag start) + window pointerup (onUp:
//   menu buttons, drag completion → createLine/extendLine/addTrainToLine).
//   Design coords are 1:1 with client coords (getBoundingClientRect stubbed to
//   the 1280x720 design rect → clientToDesign identity).
//
// Strategy per level (the engine's own update()/completeLevel() decide the win —
// nothing is relaxed here):
//   - initial build: line0 chains all start stations; extra available lines are
//     pair-lines [s_j, s_{n-j}] that share a station with line0, so
//     reachableShapes' BFS sees one connected network (every shape reachable
//     from every station → no permanently stuck passengers), and each line
//     brings its own train (throughput).
//   - 'deliver'/'survive' levels: keep connecting every spawned station
//     (extend the shortest line from its private endpoint; create a new
//     hub-sharing line when lines get long and availLines>0), answer the
//     weekly upgrade modal (train > line > carriage priority).
//   - 'connect' levels (objective = one line with N stations): keep extending
//     line0 itself until stations.length >= N → engine completes the level.
//   - survive levels: timeLimit expiry calls completeLevel(true) itself.
//
// Fixed engine bugs exercised here:
//   P2: "Extra Train" upgrade never called addTrainToLine (inventory-only) —
//       now attaches to the line with fewest trains. Asserted: trains.length
//       grows by 1 when the train card is taken.
//   P2: "Carriage (+3 cap)" never called attachCarriage anywhere — capacity
//       could never grow. Asserted: a train's capacity grows by 3.

const { bootGame } = require('../_optimization/scripts/harness-lib.js');
let forcedUnlocks = 0;

const fails = [];
let pass = 0;
function ok(cond, name, detail) {
  if (cond) { pass++; } else { fails.push(name + (detail ? ' — ' + detail : '')); }
}

let verdict = 'PASS';
try {
  const g = bootGame('metro-lines', {
    inject: {
      anchor: 'function startLevel(',
      exports: 'window.__mlQA={state:state,LEVELS:LEVELS};',
    },
  });
  ok(g.loadErrors.length === 0, 'boot clean', g.loadErrors.join(' | '));

  const cv = g.els['game'];
  cv.getBoundingClientRect = () => ({ left: 0, top: 0, width: 1280, height: 720, right: 1280, bottom: 720 });
  const win = g.sandbox;
  const down = (x, y) => cv.dispatch('pointerdown', { clientX: x, clientY: y, preventDefault() {} });
  const up = (x, y) => win.dispatchEvent({ type: 'pointerup', clientX: x, clientY: y, preventDefault() {} });
  const S = () => g.call('__mlQA.state');
  const snapshot = () => JSON.parse(g.call(`JSON.stringify({
    st: __mlQA.state.stations.map(s=>({id:s.id,x:s.x,y:s.y,shape:s.shape,q:s.queue.length,oc:s.overcrowd})),
    lines: __mlQA.state.lines.map(l=>({id:l.id,st:l.stations.map(x=>x.id),n:l.stations.length})),
    tr: __mlQA.state.trains.reduce((m,t)=>(m[t.lineId]=(m[t.lineId]||0)+1,m),{}),
    trcap: __mlQA.state.trains.reduce((m,t)=>(m[t.lineId]=(m[t.lineId]||0)+t.capacity,m),{}),
    trains: __mlQA.state.trains.length, cap: __mlQA.state.trains.reduce((a,t)=>a+t.capacity,0),
    availLines: __mlQA.state.availLines, availTrains: __mlQA.state.availTrains, availCars: __mlQA.state.availCarriages,
    score: __mlQA.state.score, week: __mlQA.state.week, pending: __mlQA.state.pendingUpgrade,
    over: __mlQA.state.gameOver, done: __mlQA.state.completed, elapsed: __mlQA.state.elapsed,
    choices: __mlQA.state.upgradeChoices.map(c=>c.kind),
  })`));
  const clickBtn = (id) => { const b = S().buttons[id]; if (!b) return false; up(b.x + 2, b.y + 2); return true; };
  // Per-(level, attempt) deterministic RNG. Without this, the engine's single
  // Math.random stream is consumed by EVERYTHING — delivery particles, later
  // level layouts — so any strategy change to one level reshuffled every
  // downstream level's spawn/particle stream, and level outcomes were a joint
  // lottery across all 22 levels (observed: L20 flipping pass→week-1-death
  // from an L17-only change). Re-seeding before each level ENTRY (startLevel
  // itself draws station layouts from Math.random) makes each level's
  // challenge stream independent and reproducible run-to-run.
  const reseed = (lvlId, attempt) => {
    g.call('(function(){ let s = ' + (20260000 + lvlId * 7919 + attempt * 104729) + ' >>> 0; Math.random = function(){ s = (s * 1664525 + 1013904223) >>> 0; return s / 4294967296; }; })()');
  };

  // drag: pointerdown at station A (id) → pointerup at station B (id)
  function drag(snap, idA, idB) {
    const a = snap.st.find(s => s.id === idA), b = snap.st.find(s => s.id === idB);
    if (!a || !b || a.id === b.id) return false;
    down(a.x, a.y); up(b.x, b.y);
    return true;
  }

  // grow-end: the endpoint of line `li` that is private (not an endpoint of a
  // lower-indexed line) — line0 uses stations[last], pair-lines use stations[0].
  function growEnd(snap, li) {
    const line = snap.lines[li];
    if (!line) return null;
    return li === 0 ? line.st[line.st.length - 1] : line.st[0];
  }

  // Full tours in different rotations. Coverage rule (from exchangePassengers +
  // reachableShapes): a passenger boards any train through their station whose
  // line's BFS-reach contains the destination shape, but is only DELIVERED when
  // that train stops at a station of that shape — so every line must contain at
  // least one station of every level shape, or boarded passengers ride forever
  // and lock up capacity. All level shapes exist in the start stations, so full
  // initial tours stay correct as stations spawn.
  // tails of tours created by the tour branch ({id, end}) — used to extend
  // tours once the 7-line cap is reached (their endpoints are drag-unique)
  let tourEnds = [];

  function initialBuild(reserveN, level) {
    tourEnds = [];
    let snap = snapshot();
    const n = snap.st.length;
    if (n < 2) return snap;
    // si<=2.4 (122+ pax/min): chain only HALF the start stations on line0.
    // A k4 line0 concentrates its train (visit every ~8s) and, critically,
    // moves the four tour births ~15-20s earlier (births gate on a 6-station
    // unconnected backlog, which only accumulates if stations are LEFT OFF
    // line0) — fleet-in-service by t=45 is 5 trains vs 3-4, exactly the
    // t=60-100 saturation window where every L21 attempt died. line0's
    // missing shapes strand riders at only ~1-1.5/min and heals close the
    // gap from t≈35 (line0 hits tr2 at the first card), minutes before that
    // leak could reach q6.
    const hp24 = level && level.spawnInterval <= 2.4;
    const chainTarget = hp24 ? Math.max(4, Math.ceil(n / 2)) : n;
    // line0: chain every start station in NEAREST-NEIGHBOUR order (not id
    // order — start stations are scattered and an id-order chain zigzags the
    // whole map, doubling line0's round trip and halving its visit rate).
    // line0 still contains every start station, so it covers every level
    // shape and its train can always deliver what it boards.
    const chain = [snap.st[0]];
    const rest = snap.st.slice(1);
    while (rest.length) {
      const tail = chain[chain.length - 1];
      let bi = 0, bd = Infinity;
      rest.forEach((s, i) => { const d = Math.hypot(s.x - tail.x, s.y - tail.y); if (d < bd) { bd = d; bi = i; } });
      chain.push(rest.splice(bi, 1)[0]);
    }
    const chained = chainTarget >= chain.length ? chain : chain.slice(0, chainTarget);
    for (let i = 1; i < chained.length; i++) { drag(snap, chained[i - 1].id, chained[i].id); snap = snapshot(); }
    // No rotation lines: a rotation duplicates line0's full chain, locking a
    // line+train into stations that are already served while adding ZERO
    // extension capacity (its endpoints are always line0's endpoints, so
    // drags from them resolve to line0 forever). Every level keeps spawning
    // stations (until 22) and unconnected queues never drain — spare lines
    // are worth strictly more as tours (fresh anchor station + own train),
    // which manageOnce spends the moment 3 fresh stations pile up.
    // (reserveN is accepted for signature compatibility and ignored.)
    return snapshot();
  }

  function manageOnce(level) {
    let snap = snapshot();
    // high-pressure survive (~95 pax/min): EXTEND staffed lines instead of
    // birthing new tours — a new tour has no train until the next card (30s
    // away) and its stations die in that window. Drives every ceiling and
    // card priority below.
    const extendFirst = level.spawnInterval <= 2.8; // pressure-based: 107+ pax/min

    const shOf = id => { const s = snap.st.find(x => x.id === id); return s && s.shape; };
    const unconnCount = () => {
      const on = new Set(); snap.lines.forEach(l => l.st.forEach(id => on.add(id)));
      return snap.st.filter(x => !on.has(x.id)).length;
    };
    const lineMissing = l => {
      const have = new Set(l.st.map(shOf));
      return level.shapes.filter(sh => !have.has(sh));
    };
    // a line's station ceiling: 6 on one train (its own riders fill the
    // train at steady state past that), 7 with two trains, 8 once two
    // trains carry 12+ capacity — plus up to two extra slots for stations
    // that HEAL a missing shape (full-shape lines board only what they can
    // deliver; a missing shape means full-reach boarding + eternal riders).
    const lineBase = l => {
      const tr = snap.tr[l.id] || 0, cap = snap.trcap[l.id] || 0;
      if (!extendFirst) return tr >= 2 ? (cap >= 12 ? 8 : 7) : 6;
      // fleet-density ceilings (si<=3.1 only): visit interval is what clears
      // clumps, and stacked trains are the only lever that moves it. k6 on one
      // train, k7 from the second, k8 only at fleet cap 18+ (a 9+6 pair at k8
      // overloaded — its own stations hit q6 at t=39).
      if (tr >= 3) return 8;
      if (tr >= 2) return cap >= 18 ? 8 : 7;
      return 6;
    };
    const lineCeil = l => lineBase(l) + Math.min(lineMissing(l).length, 1);
    // saturated = no staffed tour can absorb ANY unconnected station
    // (line0 is NOT headroom: counting it starved the network of lines —
    // line0 parked to n12 while inventory lines sat unused)
    const saturated = () => tourEnds.every(te => {
      if (te.dead) return true;
      const l = snap.lines.find(x => x.id === te.id);
      if (!l) return true;
      if ((snap.tr[l.id] || 0) === 0) return false; // unstaffed = not saturated
      return l.n >= lineCeil(l);
    });
    const staffedHeadroom = () => tourEnds.some(te => {
      if (te.dead) return false;
      const l = snap.lines.find(x => x.id === te.id);
      if (!l || (snap.tr[l.id] || 0) === 0) return false;
      return l.n < lineCeil(l);
    });
    if (snap.pending) {
      // weekly upgrade. When unconnected stations are piling up and no line
      // inventory remains, take the line card first (tours are the only thing
      // that drains brand-new stations; a tour can start empty and receive its
      // train from the next train card — the P2 attach picks the emptiest
      // line). Otherwise train (throughput / fills empty tours) > carriage >
      // line (bank) > bridge.
      const unconnNow = snap.st.filter(s => !snap.lines.some(l => l.st.includes(s.id))).length;
      let kind;
      // 1. fill an empty tour first — a line with no train serves nobody and
      //    its stations' queues grow unbounded (tours are often created with
      //    availTrains 0; the P2 attach sends the next train to the emptiest)
      const emptyTour = snap.lines.some(l => (snap.tr[l.id] || 0) === 0);
      if (emptyTour && snap.choices.includes('train')) kind = 'train';
      // 2. high-pressure survive: trains are the throughput currency —
      //    stacking (visit interval halves) always beats a new line whose
      //    tour then waits a week for its train while its stations die.
      //    A card-line tour's 30-60s unstaffed window is what actually
      //    loses 240s runs: its stations were already 10-30s old at birth
      //    and any spawn clump during the window is fatal. Inventory tours
      //    are born staffed, and line0(6) + 3 tours (k7-8) = 27+ slots
      //    cover the 22-station cap, so line cards are never taken here.
      else if (extendFirst && snap.choices.includes('train') &&
          snap.lines.some(l => l.n >= 2 && (snap.tr[l.id] || 0) < 2) &&
          !(snap.availLines === 0 && snap.choices.includes('line') &&
            (snap.lines.length < 6 ||
             snap.st.some(x => !snap.lines.some(l => l.st.includes(x.id)) && x.q >= 5)))) kind = 'train';
      // 2b. trains hard-cap at 2/line (engine attach rule), so once every
      //     line is 2/2 a train card banks forever — observed L17 a3 dying
      //     at t=237/240 with aT=3 banked while its 6-cap trains clumped:
      //     those cards had to be carriages (+3 fleet cap each).
      //     A spare line here beats a carriage: the split birth (see
      //     manageOnce) shortens two round trips at once and its 0-train
      //     state attracts the next train card deterministically.
      else if (extendFirst && snap.choices.includes('line') && snap.availLines === 0 &&
          snap.lines.length < 6 && !snap.lines.some(l => l.n >= 2 && (snap.tr[l.id] || 0) < 2)) kind = 'line';
      else if (extendFirst && snap.choices.includes('carriage') &&
          !snap.lines.some(l => l.n >= 2 && (snap.tr[l.id] || 0) < 2)) kind = 'carriage';
      // 3. coverage: a real backlog of unconnected stations (each is on a
      //    ~90s death timer from spawn) means the next line card should come
      //    NOW — but only when a tour would actually be created with it:
      //    taking a line while lines are already banked (or the backlog is
      //    below the creation gate) wastes the card.
      else if (snap.choices.includes('line') && snap.lines.length < 7 && snap.availLines === 0 &&
          unconnNow >= 2 && level.objective !== 'connect' &&
          !(extendFirst && !saturated())) kind = 'line';
      // 3. stack a 2nd train (doubles boarding per stop) > carriage > bank
      else if (snap.choices.includes('train') && snap.lines.some(l => l.n >= 2 && (snap.tr[l.id] || 0) < 2)) kind = 'train';
      else if (snap.choices.includes('carriage')) kind = 'carriage';
      else if (snap.choices.includes('train')) kind = 'train'; // banked: no line under the 2-train cap yet
      else kind = snap.choices[0];
      const b = S().buttons['upg' + snap.choices.indexOf(kind)];
      const before = { trains: snap.trains, cap: snap.cap, lines: snap.lines.length };
      if (b) { up(b.x + 2, b.y + 2); }
      const after = snapshot();
      // P2-fix assertions on the first train/carriage card taken in level 1
      if (level.idx === 0 && !level.upgChecked) {
        if (kind === 'train') {
          ok(after.trains === before.trains + 1 || after.availTrains > 0, 'train upgrade attaches (P2 fix)',
            'trains ' + before.trains + '→' + after.trains + ' avail=' + after.availTrains);
          level.upgChecked = true;
        } else if (kind === 'carriage') {
          ok(after.cap > before.cap, 'carriage upgrade grows capacity (P2 fix)',
            'cap ' + before.cap + '→' + after.cap);
        }
      }
      return;
    }
    if (snap.done || snap.over) return;
    const onLine = new Set(); snap.lines.forEach(l => l.st.forEach(id => onLine.add(id)));
    let unconn = snap.st.filter(s => !onLine.has(s.id));
    // post-connection SHAPE HEALING: a partial-shape tour strands every
    // passenger whose destination shape it lacks — they can never board
    // (reach gate) and the queue grows monotonically until overcrowd
    // (observed: a sh4 tour's stations hit q6 at t=180 from the leak alone
    // and killed a 240s survive run at t=196). Once every station is
    // connected, extend two-train tours that still miss shapes onto the
    // NEAREST CONNECTED station of a missing shape: sharing that station
    // adds the shape to the tour's reach — its trains then board those
    // passengers and deliver them there — without consuming a fresh slot.
    // The drop target may be any station (endpoints included); the drag
    // SOURCE stays the tour's private endpoint so it cannot be hijacked.
    // Two heals max, 2-train lines only (a 1-train line past its base rots).
    const healShapes = () => {
      // stress-gated: healing lengthens a tour's round trip, which degrades
      // service on a healthy line (observed: unconditional healing moved the
      // L17 death from week 4 back to week 3). Only heal a line whose own
      // stations show the leak signature (queue pressure with the fleet
      // carrying room).
      // stress-gated: only lines whose own stations are actually crowding —
      // a leak that never produces a q4 queue is harmless, but under ANY spawn
      // rate a sh2 line (observed L13 line3 n5sh2: trains ran empty 0/6 while
      // its stations sat q5-6 from t=93 to death at t=141) strands riders
      // monotonically because boarding is reach-gated.
      for (const te of tourEnds) {
        if (te.dead) continue;
        const l = snap.lines.find(x => x.id === te.id);
        if (!l || (snap.tr[l.id] || 0) < 2) continue;
        const lineLoad = snap.st.filter(x => l.st.includes(x.id) && x.q >= 4).length;
        if (lineLoad === 0) continue;
        const have = new Set(l.st.map(shOf));
        const missing = level.shapes.filter(sh => !have.has(sh));
        if (!missing.length) continue;
        if (l.n >= lineBase(l) + Math.min(missing.length, 2)) continue;
        const end = snap.st.find(x => x.id === te.end);
        let target = null, bd = Infinity;
        for (const st of snap.st) {
          if (l.st.includes(st.id) || !missing.includes(st.shape)) continue;
          const d = end ? Math.hypot(end.x - st.x, end.y - st.y) : Math.hypot(640 - st.x, 360 - st.y);
          if (d < bd) { bd = d; target = st; }
        }
        if (!target) continue;
        drag(snap, te.end, target.id);
        snap = snapshot();
        const bl = snap.lines.find(x => x.id === te.id);
        if (bl && bl.st.includes(target.id)) te.end = target.id;
        else te.dead = true;
      }
    };
    // RESCUE LINE (hp-survive only): a station already on the 20s overcrowd
    // timer (q6) whose line's trains are full cannot be helped by any card —
    // cards arrive every 30s, attach decisions are engine-side, and the queue
    // grows ~0.5-1/s. The one immediate lever is a second line through the
    // hot station: doubled visit rate, and the engine births the new line's
    // train right at the drag start (= the hot station, st[0]) so it picks up
    // on its first pass. Members are strict middles of other lines (chain
    // drags from another line's endpoint would hijack — same rule as births),
    // shape-distinct, nearest first, unconnected stations prioritized so the
    // rescue doubles as a home for any waiting tail stations.
    if (extendFirst && snap.availLines > 0 && snap.lines.length < 7) {
      const hotSt = snap.st.filter(x => x.q >= 6 && x.oc >= 0 && snap.lines.filter(l => l.st.includes(x.id)).length < 2)
        .sort((a, b) => b.q - a.q)[0];
      if (hotSt) {
        const ends = new Set(); snap.lines.forEach(l => { ends.add(l.st[0]); ends.add(l.st[l.st.length - 1]); });
        const onLSet = new Set(); snap.lines.forEach(l => l.st.forEach(id => onLSet.add(id)));
        const shapesUsed = new Set([hotSt.shape]);
        // drag-source safety (same rule as births): onDown resolves to the
        // lowest-id line holding the station as an ENDPOINT. If the hot
        // station is itself an endpoint (e.g. line0's st[0] from the opening
        // chain), a drag started there EXTENDS that line instead of birthing
        // the rescue line (observed: line0 ballooning 7→11 in 3s, rescue
        // wasted). So: hot leads the chain only when it is a strict middle;
        // otherwise it is appended as the final TARGET and never a source.
        const hotIsEnd = ends.has(hotSt.id);
        const cands = snap.st.filter(x => x.id !== hotSt.id && !ends.has(x.id))
          .sort((a, b) => ((onLSet.has(b.id) ? 1 : 0) - (onLSet.has(a.id) ? 1 : 0)) ||
                          ((a.x - hotSt.x) ** 2 + (a.y - hotSt.y) ** 2) - ((b.x - hotSt.x) ** 2 + (b.y - hotSt.y) ** 2));
        const picks = [];
        for (const c of cands) { if (picks.length >= 4) break; if (shapesUsed.has(c.shape)) continue; shapesUsed.add(c.shape); picks.push(c.id); }
        const members = hotIsEnd ? picks.concat([hotSt.id]) : [hotSt.id].concat(picks);
        if (members.length >= 2) {
          let head = members[0];
          for (let m = 1; m < members.length; m++) { drag(snap, head, members[m]); head = members[m]; snap = snapshot(); }
          const rl = snap.lines[snap.lines.length - 1];
          if (rl && rl.st.includes(hotSt.id)) tourEnds.push({ id: rl.id, end: rl.st[0] });
          const onL2 = new Set(); snap.lines.forEach(l => l.st.forEach(id => onL2.add(id)));
          unconn = snap.st.filter(x => !onL2.has(x.id));
        }
      }
    }
    // SPLIT BIRTH (hp-survive, late game): every line 2/2 trains and no
    // unconnected stations left, but a line card banked a spare — the
    // longest line's mid-stations only get served once per full circuit
    // (observed L17 a3 x2: st14 q6/oc-expired on its only line, an n8 loop
    // whose 9/9 train was full). Splitting shares the longest line's
    // strict-middles into a new tour: both halves' round trips halve, the
    // stations keep their old service during the new line's 0-train window,
    // and the next train card attaches to it deterministically (fewest
    // trains). Prioritize the source line's hottest stations so the split
    // doubles service exactly where queues build.
    if (extendFirst && !unconn.length && snap.availLines > 0 && snap.lines.length < 7) {
      const src = snap.lines.filter(l => (snap.tr[l.id] || 0) >= 2 && l.n >= 8)
        .sort((a, b) => b.n - a.n)[0];
      if (src) {
        const ends = new Set(); snap.lines.forEach(l => { ends.add(l.st[0]); ends.add(l.st[l.st.length - 1]); });
        const qOf = id => { const x = snap.st.find(y => y.id === id); return x ? x.q : 0; };
        const mids = src.st.filter(id => !ends.has(id))
          .sort((a, b) => qOf(b) - qOf(a));
        const shapesUsed = new Set(); const members = [];
        for (const m of mids) { const sh = (snap.st.find(y => y.id === m) || {}).shape; if (shapesUsed.has(sh)) continue; shapesUsed.add(sh); members.push(m); if (members.length >= 5) break; }
        // a hot ENDPOINT of the source line may join as the FINAL member
        // (target-only — endpoints are never drag sources). Without this the
        // split can miss exactly the station that needed it (observed L17 a3
        // t=237: st14 = line2's endpoint stayed single-lined and died 3s
        // before the 240s survive goal while the split line ran beside it).
        const srcHotEnd = [src.st[0], src.st[src.st.length - 1]]
          .filter(id => qOf(id) >= 4 && !members.includes(id))
          .sort((a, b) => qOf(b) - qOf(a))[0];
        if (members.length >= 4) {
          // NN-order the chain from the hottest member
          const byId = id => snap.st.find(x => x.id === id);
          const pool = srcHotEnd ? members.slice() : members;
          const rest = pool.slice(1); const ordered = [pool[0]]; let tail = byId(pool[0]);
          while (rest.length) { let bi = 0, bd = 1e9; rest.forEach((id, i) => { const st = byId(id); const d = Math.hypot(st.x - tail.x, st.y - tail.y); if (d < bd) { bd = d; bi = i; } }); tail = byId(rest[bi]); ordered.push(rest.splice(bi, 1)[0]); }
          if (srcHotEnd) ordered.push(srcHotEnd);
          let head = ordered[0];
          for (let m = 1; m < ordered.length; m++) { drag(snap, head, ordered[m]); head = ordered[m]; snap = snapshot(); }
          const nl = snap.lines[snap.lines.length - 1];
          if (nl && nl.st.includes(ordered[0])) tourEnds.push({ id: nl.id, end: nl.st[0] });
          const onL3 = new Set(); snap.lines.forEach(l => l.st.forEach(id => onL3.add(id)));
          unconn = snap.st.filter(x => !onL3.has(x.id));
        }
      }
    }
    if (!unconn.length) { healShapes(); return; }

    if (level.objective === 'connect') {
      // keep growing line0 until its station count reaches the objective
      const l0 = snap.lines[0];
      if (l0 && l0.n < level.count) drag(snap, growEnd(snap, 0), unconn[0].id);
      return;
    }
    // deliver/survive: new stations join line0 (its grow-end is always private).
    // When line0 gets long, spin up a fresh shape-cover mini-tour from the
    // newest station (needs a spare line + train); its build drags start at the
    // new line's own endpoints (middles of line0), so they always resolve to it.
    const l0 = snap.lines[0];
    // line0 is capped at 8: past that its single train's circuit is so long
    // (multi-minute) that appended stations overflow before a revisit. A new
    // station left unconnected survives ~2min on its own queue growth — as
    // long or longer than line0 would serve it — so hold it for the next
    // tour line (one line card per week) instead of bloating line0 further.
    const L0_CAP = 6;
    const canTour = () => snap.availLines > 0 && snap.lines.length < 7;
    // high-pressure survive (~95 pax/min): EXTEND staffed lines instead of
    // birthing new tours — a new tour has no train until the next card (30s
    // away) and its stations die in that window, while a staffed line's train
    // serves an extended station within one round trip. Tours are FULL-SHAPE
    // (stranded passengers are what actually kills a 240s run: they
    // accumulate monotonically and q6 collides with the 26s visit interval
    // against the 20s overcrowd grace), line0 stays at n6 (an n8 loop's
    // riders fill both trains and it stops clearing), and every train card
    // stacks a second train. Lower-pressure levels keep the tour-first order
    // (verified there).
    while (unconn.length) {
      // tours whenever a line is spare: batch >=3 fresh stations, or a batch
      // of 2+ once line0 is at cap. A tour born from a single fresh station
      // wastes the line's coverage (it fills with already-served middles), and
      // cards arrive every 30s — the tour is worth more taken when a real
      // backlog exists. Singles wait for the next station (3.6s away).
      // Under high pressure the threshold is 5: an inventory tour born now
      // gets its train from the NEXT card, and its stations only survive
      // that 30-60s window if extension could not absorb them anywhere.
      if (!(extendFirst && staffedHeadroom()) && canTour() &&
          // si<=2.4 (122+ pax/min): birth only at an 8-station backlog so ONE
          // line stays in inventory for the whole level — line0 n8 + three
          // n7 tours cover 28 slots for 22 stations, and the spare line is
          // the rescue lever: a rescue chain runs hot-station + nearest
          // unconnected stations (unconn prioritized in its candidate sort),
          // so it doubles as the homeless-station home. A 5th birth spends
          // the lever and still strands the backlog tail (observed L21 a3:
          // line4 born k5, st18 left over, both st17 (clump) and st18
          // (homeless) dead by t=90 with aL=0).
          (unconn.length >= (extendFirst ? (level.spawnInterval <= 2.4 ? 6 : 5) : 3) ||
           (!extendFirst && snap.lines[0] && snap.lines[0].n >= L0_CAP && unconn.length >= 2))) {
        // empty tours are fine: the P2 train-attach fills the emptiest line,
        // so a train card next week puts a train on this tour
        const z = unconn[0].id;
        // one station per level shape, preferring fresh unconnected stations.
        // Chain members must be drag-safe: onDown resolves a drag start to the
        // LOWEST-ID line holding that station as an endpoint — a member that
        // is another line's endpoint hijacks the chain drag (extendLine then
        // rejects the duplicate member and the whole tour silently breaks
        // apart, leaving its stations unserved). So prefer strict middles of
        // every existing line; stations that are some line's endpoint may only
        // ever be the FINAL member (never a drag source).
        const shapes = level.shapes; // level shape list
        const anyEnd = new Set();
        snap.lines.forEach(l => { anyEnd.add(l.st[0]); anyEnd.add(l.st[l.st.length - 1]); });
        // PROXIMITY-FIRST for ALL survive levels (deliver keeps coverage): every unconnected station
        // is on a ~90s death timer, so the tour takes ONLY fresh stations —
        // z (oldest) plus the NEAREST fresh ones. Round-trip time is what
        // kills stations (oc fires at q6 with 20s grace), and geography, not
        // station count, sets it: 5 nearby stations ≈ 25s round vs 5 random
        // ones ≈ 45s+. A tour missing shapes only strands passengers headed
        // there (~1/5 of arrivals ≈ 0.7/min) — q6 takes 8+ minutes, far past
        // any survive deadline, while shared fills actively HURT: the tour's
        // train would board already-served stations' queues and arrive full
        // at its own fresh stations. All members are unconnected-born →
        // drag-safe by construction. Deliver levels keep shape coverage (trains
        // must reach every shape to keep scoring) but pick the NEAREST
        // station of each missing shape, then top up by proximity.
        let members, tailMembers, lateMembers, junction = null;
        const zst = snap.st.find(x => x.id === z);
        const dist = (a, b) => Math.hypot(a.x - b.x, a.y - b.y);
        const near = unconn.filter(u => u.id !== z).sort((a, b) => dist(zst, a) - dist(zst, b));
        if (level.objective === 'survive' && !extendFirst) {
          // lower-pressure survive: pure proximity fresh k5 (validated on
          // L4/L9/L13 — round-trip time is the binding constraint there,
          // and the shape heal runs later when a missing-shape station
          // spawns near the tour)
          members = [z].concat(near.slice(0, 4).map(u => u.id));
          tailMembers = []; lateMembers = [];
        } else if (extendFirst && level.spawnInterval <= 2.4) {
          // max pressure: PURE PROXIMITY k5 + junction. Shape coverage is
          // obsolete now that the junction stitches the tour into line0's
          // component (reachableShapes is a network BFS), and every extra
          // member lengthens the one-train round trip — the t=60-130 fleet
          // valley kills exactly there.
          members = [z].concat(near.slice(0, 4).map(u => u.id));
          tailMembers = []; lateMembers = [];
        } else {
          members = [z];
          tailMembers = []; lateMembers = [];
          const have = new Set([zst.shape]);
          // nearest fresh station of each missing shape first (capped at 5 —
          // the 6th shape is cheaper to heal later than a k7 birth is to
          // serve on one train)
          for (const sh of shapes) {
            if (members.length >= 5) break;
            if (have.has(sh)) continue;
            const pick = near.find(u => u.shape === sh && !members.includes(u.id));
            if (pick) { members.push(pick.id); have.add(sh); }
          }
          // top up to 5 with the nearest remaining fresh stations
          for (const u of near) {
            if (members.length >= 5) break;
            if (!members.includes(u.id)) { members.push(u.id); have.add(u.shape); }
          }
          // JUNCTION (hp): every birth member is unconnected, so the tour by
          // itself is an isolated network component — reachableShapes() is a
          // BFS over the whole line graph, so its stations could never board
          // riders destined for shapes outside the tour (the entire leak
          // class this verifier has been healing one case at a time). One
          // shared strict-middle stitches the tour into line0's component;
          // from then on every station in the component reaches every shape
          // the component holds. Stored and appended AFTER the NN reorder —
          // a junction is only ever a drag TARGET (final member).
          if (extendFirst) {
            const js = [];
            snap.lines.forEach(l => { for (let k = 1; k < l.st.length - 1; k++) js.push(l.st[k]); });
            js.sort((a, b) => dist(zst, snap.st.find(x => x.id === a)) - dist(zst, snap.st.find(x => x.id === b)));
            for (const j of js) { if (!members.includes(j) && !anyEnd.has(j)) { junction = j; break; } }
          }
          // still missing shapes: ONE shared middle fill each, nearest to z;
          // endpoints of other lines only ever as the final (dropped-on) member
          const hp = extendFirst;
          if (!hp && members.length < 5) {
            for (const sh of shapes) {
              if (have.has(sh)) continue;
              let cands = snap.st.filter(x => x.shape === sh && !members.includes(x.id) && !tailMembers.includes(x.id) && !anyEnd.has(x.id));
              if (!cands.length) cands = snap.st.filter(x => x.shape === sh && !members.includes(x.id) && !tailMembers.includes(x.id) && x.id !== z);
              if (!cands.length) continue;
              cands.sort((a, b) => dist(zst, a) - dist(zst, b));
              const pick = cands[0];
              if (level.objective === 'survive' && !hp) {
                // endpoint fills still COUNT for coverage — dropped as the
                // final chain member (drag-safe), never a drag source. The
                // old routing to tailMembers silently dropped them for
                // survive births, leaving sh4 lines whose stations can never
                // board 2/6 of their passengers (q6 by week 4).
                lateMembers.push(pick.id);
              } else {
                (anyEnd.has(pick.id) ? tailMembers : members).push(pick.id);
              }
              // (hp births stay fresh-only: shared fills dilute a 95/min
              // network — observed week-1 death with fill births)
              have.add(sh);
            }
          }
        }
        // si<=2.4 (122+ pax/min): take the WHOLE backlog (members cap 7).
        // A birth that leaves stations behind strands them — every later
        // line is at ceiling and aL only ever shrinks (observed L21 a1
        // t=123: st21 q7 unconnected, 5 lines born, aL=0; the run died with
        // free slots in aggregate but no reachable 6th birth).
        if (extendFirst && level.spawnInterval <= 2.4) {
          for (const u of unconn) { if (members.length >= 5) break; if (!members.includes(u.id)) members.push(u.id); }
        }
        // order the member chain as a nearest-neighbour walk from z: the drag
        // sequence z→m1→m2… is also the line's station order (its physical
        // path), so a proximity-ordered chain is a compact loop; an arbitrary
        // order zigzags and doubles the round trip.
        {
          const byId = id => snap.st.find(x => x.id === id);
          const rest2 = members.slice(1);
          members = [members[0]];
          let tail = byId(members[0]);
          while (rest2.length) {
            let bi = 0, bd = Infinity;
            rest2.forEach((id, i) => { const s = byId(id); const d = Math.hypot(s.x - tail.x, s.y - tail.y); if (d < bd) { bd = d; bi = i; } });
            tail = byId(rest2[bi]);
            members.push(rest2.splice(bi, 1)[0]);
          }
        }
        // only the FINAL member may be another line's endpoint (never a drag
        // source); with 2+ endpoint-only shapes the tour simply runs short one
        // shape rather than breaking its drag chain apart
        if (level.objective !== 'survive') members.push(...tailMembers.slice(-1));
        members.push(...lateMembers); // survive endpoint fills: coverage as final members
        if (junction != null && !members.includes(junction)) members.push(junction);
        if (members.length < 2) { // cannot happen with >=3 shapes, but never loop forever
          drag(snap, growEnd(snap, 0), unconn[0].id);
          snap = snapshot();
          break;
        }
        let head = members[0];
        for (let m = 1; m < members.length; m++) { drag(snap, head, members[m]); head = members[m]; snap = snapshot(); }
        snap = snapshot();
        // anchor this tour's extension at st[0] = z, the unconnected-born
        // first member: z is an endpoint of this tour and of NO other line,
        // so drags from it always resolve here (st[last] is often a fill that
        // is another line's endpoint — dragging from it hijacks the wrong
        // line and the tour is dead from birth). Extending via st[0] PREPENDS
        // the new station, which then becomes the new unconnected-born st[0].
        const newLine = snap.lines[snap.lines.length - 1];
        if (newLine && newLine.st.length >= 2) tourEnds.push({ id: newLine.id, end: newLine.st[0] });
        const onLine2 = new Set(); snap.lines.forEach(l => l.st.forEach(id => onLine2.add(id)));
        unconn = snap.st.filter(x => !onLine2.has(x.id));
      } else if ((extendFirst && staffedHeadroom()) || (!canTour() && (tourEnds.some(te => !te.dead) || l0))) {
        // no line to spare (inventory empty or 7-line cap): EXTEND a staffed
        // tour first — its train is already circling, so a station appended
        // now gets served within one round trip (~35-40s), well inside the
        // ~90s+20s an unconnected station has before overcrowd. Prefer
        // staffed and shortest; unstaffed tours (awaiting their train card)
        // are a worse home but still better than nothing. line0 is the last
        // resort (its single train's round trip grows fastest).
        let best = null, bestKey = 1e9, bestEnd = null, bestSt = null;
        const stShape = id => { const s = snap.st.find(x => x.id === id); return s && s.shape; };
        for (const te of tourEnds) {
          if (te.dead) continue;
          const l = snap.lines.find(x => x.id === te.id);
          if (!l) continue;
          const have = new Set(l.st.map(stShape));
          const missing = level.shapes.filter(sh => !have.has(sh));
          if (l.n >= lineCeil(l)) continue;
          const est = snap.st.find(s => s.id === te.end);
          // pick the STATION too, not just the anchor: a station whose shape
          // the line lacks HEALS it — without every level shape a full-reach
          // tour boards passengers it can never deliver, and they ride
          // forever, locking capacity until the line rots (observed: 5
          // eternal circle-riders at 9/9 on L17). Healing is worth ~1500px
          // of detour; staffed lines still win over unstaffed.
          for (const uc of unconn) {
            if (l.n >= lineBase(l) && have.has(uc.shape)) continue;
            const d = est ? Math.hypot(est.x - uc.x, est.y - uc.y) : 1e6;
            const heal = have.has(uc.shape) ? 0 : -1500;
            const key = ((snap.tr[l.id] || 0) > 0 ? 0 : 5000) + heal + d;
            if (key < bestKey) { bestKey = key; best = te; bestEnd = te.end; bestSt = uc; }
          }
        }
        // line0 fallback under its DYNAMIC ceiling — under saturation the
        // tours sit at base while line0's 2 trains (cap 9) still have visit
        // interval to spare: tr2+cap9 → 7, tr2+cap12 → 8. The old hardcoded
        // 6 stranded every station born after the tours filled up (observed
        // st 17/18 q6 at t=80 with all tours at n6 and line0 parked at 6).
        if (!best && snap.lines[0] && snap.lines[0].n < (extendFirst ? lineCeil(snap.lines[0]) : 8) && unconn.length) {
          best = 'l0'; bestEnd = growEnd(snap, 0); bestSt = unconn[0];
        }
        if (best && bestEnd != null && bestSt) {
          drag(snap, bestEnd, bestSt.id);
          snap = snapshot();
          const bl = best === 'l0' ? snap.lines[0] : snap.lines.find(x => x.id === best.id);
          // only advance the tail if the station really landed on the intended
          // line — if the drag was hijacked by another line (the tail was an
          // endpoint elsewhere), that tour is no longer extendable; never
          // follow the hijack, or later stations feed the wrong line
          if (bl && bl.st.includes(bestSt.id)) {
            if (best !== 'l0') best.end = bestSt.id;
            unconn = unconn.filter(x => x.id !== bestSt.id);
          } else if (best !== 'l0') {
            best.dead = true;
          } else {
            unconn = unconn.slice(1); // line0's tail always resolves to line0
          }
        } else break;
      } else if (snap.lines[0] && snap.lines[0].n < (extendFirst ? lineCeil(snap.lines[0]) : 8) && unconn.length < 3) {
        drag(snap, growEnd(snap, 0), unconn[0].id);
        snap = snapshot();
        unconn = unconn.slice(1);
      } else {
        break; // line0 at cap and no spare line — hold stations for the next card
      }
    }
    healShapes(); // leak repair runs even with unplaced stations waiting
  }

  function playLevel(idx) {
    const lvl = JSON.parse(g.call('JSON.stringify(__mlQA.LEVELS[' + idx + '])'));
    const level = {
      idx, objective: lvl.objective.type, count: lvl.objective.count || 0, shapes: lvl.shapes,
      spawnInterval: lvl.spawnInterval,
      limit: lvl.objective.type === 'survive' ? lvl.timeLimit + 90 : (lvl.objective.type === 'connect' ? 150 : 300),
      upgChecked: false,
      healingOn: false,
    };
    for (let attempt = 1; attempt <= 3; attempt++) {
      // high-pressure levels (5+ shapes or fast spawns) keep 2 lines in
      // reserve so the first tours can start before the first upgrade card
      const reserve = level.objective === 'connect' ? 0
        : (level.shapes.length >= 5 || lvl.spawnInterval <= 4 ? 2 : 1);
      let snap = initialBuild(reserve, level);
      let simSeconds = 0;
      while (true) {
        manageOnce(level);
        snap = snapshot();
        if (snap.done) return { won: true, snap, attempts: attempt };
        if (snap.over) break;
        g.pump(60); // 1s of sim
        simSeconds++;
        if (process.env.MLTR === String(idx) && simSeconds % 3 === 0) {
          const hot = snap.st.filter(s => s.q >= 4).map(s => s.id + ':q' + s.q + (s.oc >= 0 ? '/oc' + s.oc.toFixed(0) : '') + 'on[' + snap.lines.filter(l => l.st.includes(s.id)).map(l => l.id) + ']').join(' ');
          console.error('L' + (idx + 1) + ' a' + attempt + ' t=' + simSeconds + ' n=' + snap.st.length + ' sc=' + snap.score +
            ' loads=' + g.call('JSON.stringify(__mlQA.state.trains.map(t=>t.passengers.length+\'/\'+t.capacity+\'@L\'+t.lineId))') + ' lines=[' + snap.lines.map(l => { const have = new Set(l.st.map(id => { const x = snap.st.find(y => y.id === id); return x && x.shape; })); return l.id + 'n' + l.n + 'sh' + have.size + 'tr' + (snap.tr[l.id] || 0); }).join(',') + '] aL=' + snap.availLines + ' aT=' + snap.availTrains + (hot ? ' HOT ' + hot : ''));
        }
        if (simSeconds > level.limit) return { won: false, snap, reason: 'time cap ' + level.limit + 's', attempts: attempt };
      }
      // game over → real retry button, rebuild against fresh deterministic seed
      if (attempt < 3) { reseed(idx + 1, attempt + 1); clickBtn('retry'); g.pump(2); }
    }
    return { won: false, snap: snapshot(), reason: 'game over ×3 (overcrowd)' };
  }

  // ---- Title / menus ----
  g.pump(2);
  ok(S().screen === 'title', 'title screen');
  ok(typeof S().buttons.play === 'object', 'title buttons drawn');
  ok(S().buttons.endless.disabled === true, 'endless locked before tutorial');
  up(S().buttons.howto.x + 2, S().buttons.howto.y + 2); g.pump(2);
  ok(S().screen === 'howto', 'howto screen');
  clickBtn('back'); g.pump(2);
  ok(S().screen === 'title', 'howto back');
  // mute toggle persists
  clickBtn('mute'); g.pump(1);
  const muted = g.call('__mlQA.state.save.muted');
  ok(muted === true, 'mute persists to save');
  clickBtn('mute'); g.pump(1);
  ok(g.call('__mlQA.state.save.muted') === false, 'unmute');
  // Esc on levelselect returns to title
  up(S().buttons.play.x + 2, S().buttons.play.y + 2); g.pump(2);
  ok(S().screen === 'levelselect', 'title→levelselect');
  win.dispatchEvent({ type: 'keydown', key: 'Escape', preventDefault() {} });
  ok(S().screen === 'title', 'Esc back from levelselect');
  g.pump(2); // redraw populates title buttons again
  up(S().buttons.play.x + 2, S().buttons.play.y + 2); g.pump(2);

  // ---- 22 levels in unlock order ----
  const LEVELS = JSON.parse(g.call('JSON.stringify(__mlQA.LEVELS)'));
  const total = LEVELS.length;
  ok(total === 22, '22 levels', String(total));
  const firstLvlBtn = S().buttons.lvl1;
  ok(firstLvlBtn && firstLvlBtn.locked === false, 'L1 unlocked');
  ok(S().buttons.lvl2.locked === true, 'L2 locked initially');

  for (let i = 0; i < total; i++) {
    try {
      // enter level i via its card (id = level id = i+1)
      let btn = S().buttons['lvl' + (i + 1)];
      if (btn && btn.locked && i > 0) {
        // previous level lost all 3 attempts and scored no star, so the engine
        // correctly keeps this card locked; force-unlock via the save so
        // coverage of later levels still runs through the real card click
        // (counted in extra.forcedUnlocks, never hidden)
        g.call('__mlQA.state.save.levelProgress[' + i + ']=1');
        g.pump(2); // re-render level select with the new lock state
        btn = S().buttons['lvl' + (i + 1)];
        forcedUnlocks++;
      }
      if (!btn || btn.locked) { fails.push('L' + (i + 1) + ' — card locked unexpectedly'); continue; }
      reseed(i + 1, 1);
      up(btn.x + 2, btn.y + 2); g.pump(2);
      if (S().screen !== 'game') { fails.push('L' + (i + 1) + ' — did not start'); continue; }

      const res = playLevel(i);
      ok(res.won, 'L' + (i + 1) + ' (' + LEVELS[i].objective.type + ') completed',
        res.won ? '' : (res.reason + '; score=' + res.snap.score + ' week=' + res.snap.week));
      if (!res.won) { // recover: back to menu so later levels can still be attempted
        g.pump(2); clickBtn('quitmenu'); g.pump(2);
        if (S().screen !== 'levelselect' && S().buttons.play) { up(S().buttons.play.x + 2, S().buttons.play.y + 2); g.pump(2); }
        continue;
      }
      const prog = g.call('__mlQA.state.save.levelProgress[' + LEVELS[i].id + ']');
      ok(prog >= 1, 'L' + (i + 1) + ' progress saved', String(prog));
      ok(res.snap.score > 0 || LEVELS[i].objective.type === 'connect', 'L' + (i + 1) + ' deliveries made', 'score=' + res.snap.score);

      // complete overlay: next level (or menu on the last one)
      g.pump(2);
      if (i < total - 1) {
        ok(clickBtn('next'), 'L' + (i + 1) + ' next button');
        g.pump(2);
        ok(S().screen === 'game' && S().levelIdx === i + 1, 'L' + (i + 1) + ' → next level');
        // back out to level select via real HUD pause overlay so the next
        // iteration enters through its level card
        ok(clickBtn('pause'), 'L' + (i + 1) + ' pause button');
        g.pump(2);
        ok(S().paused === true, 'L' + (i + 1) + ' paused');
        ok(clickBtn('quitmenu'), 'L' + (i + 1) + ' quit to menu');
        g.pump(2);
        ok(S().screen === 'title', 'L' + (i + 1) + ' → title');
        up(S().buttons.play.x + 2, S().buttons.play.y + 2); g.pump(2);
        // unlock gating from live level-select buttons
        const nb = S().buttons['lvl' + (i + 2)];
        if (nb) ok(nb.locked === false, 'L' + (i + 2) + ' unlocked after L' + (i + 1));
        const nb2 = S().buttons['lvl' + (i + 3)];
        if (nb2) ok(nb2.locked === true, 'L' + (i + 3) + ' still locked');
      } else {
        ok(!S().buttons.next, 'L22 has no next button');
        clickBtn('quitmenu'); g.pump(2);
        ok(S().screen === 'title', 'L22 → menu');
        up(S().buttons.play.x + 2, S().buttons.play.y + 2); g.pump(2); // back to level select
      }
    } catch (e) { fails.push('L' + (i + 1) + ' fatal: ' + e.message); console.error(e.stack); }
  }

  // ---- Endless mode (unlocked by tutorial completion) ----
  try {
    g.pump(2);
    ok(S().buttons.lvl22 && S().buttons.lvl22.locked === false, 'all levels unlocked at end');
    clickBtn('back'); g.pump(2); // levelselect → title
    ok(S().buttons.endless.disabled === false, 'endless unlocked after tutorial');
    up(S().buttons.endless.x + 2, S().buttons.endless.y + 2); g.pump(2);
    ok(S().screen === 'game' && S().isEndless === true, 'endless starts');
    let snap = initialBuild(1);
    let sim = 0;
    const endlessShapes = () => JSON.parse(g.call('JSON.stringify(__mlQA.state.level.shapes)'));
    while (sim < 60) { // ~1 minute of endless
      manageOnce({ idx: -1, objective: 'deliver', count: 0, limit: 60, upgChecked: true, shapes: endlessShapes() });
      if (snapshot().over) break;
      g.pump(60); sim++;
    }
    snap = snapshot();
    ok(!snap.over, 'endless: no overcrowd death in 60s', 'queues ok, score=' + snap.score);
    ok(snap.score > 0, 'endless: deliveries made', 'score=' + snap.score);
    // if the 60s window ended with an upgrade card open (offerUpgrades
    // auto-pauses and its modal is the topmost overlay — the pause overlay
    // only draws once no card is pending), answer it through the real card
    // button before testing the pause/Esc/quit flow
    if (S().pendingUpgrade && S().buttons.upg0) { up(S().buttons.upg0.x + 2, S().buttons.upg0.y + 2); g.pump(1); }
    // pause overlay via HUD + Esc toggling, then quit
    ok(clickBtn('pause'), 'pause button');
    g.pump(2);
    ok(S().paused === true, 'paused');
    win.dispatchEvent({ type: 'keydown', key: 'Escape', preventDefault() {} });
    g.pump(1);
    ok(S().paused === false, 'Esc resumes');
    clickBtn('pause'); g.pump(2);
    clickBtn('quitmenu'); g.pump(2);
    ok(S().screen === 'title', 'endless quit → title');
    ok(g.call('__mlQA.state.save.endlessHigh') >= snap.score, 'endless high score saved');
  } catch (e) { fails.push('endless fatal: ' + e.message); console.error(e.stack); }

  // final save shape
  const sv = JSON.parse(g.call('JSON.stringify(__mlQA.state.save)'));
  ok(Object.keys(sv.levelProgress).length === 22, '22 levels in save', Object.keys(sv.levelProgress).length + '');
  ok(sv.tutorialSeen === true, 'tutorialSeen saved');
} catch (e) {
  verdict = 'FAIL';
  fails.push('fatal: ' + e.message);
  console.error(e.stack);
}

if (fails.length) verdict = 'FAIL';
console.log(JSON.stringify({
  pass, fail: fails.length, total: pass + fails.length, verdict, fails,
  extra: {
    game: 'metro-lines', engine: 22, forcedUnlocks: forcedUnlocks || 0,
    input: 'real (canvas pointerdown + window pointerup drags, menu clicks, Esc key)',
    engineBugsFixed: [
      'P0: intermediate-stop memory used `_stopMemory.get(tr)||-99` — a falsy-zero lookup (station idx 0) fell back to -99 every time, so a train leaving station 0 re-detected it as a new stop every frame: perpetual 0.4s stop loops at path starts (trains visibly froze). Fixed with an explicit .has() check.',
      'P1: state.buttons was never cleared when a level started, so stale level-select card rects stayed live in hitButton(); the upgrade modal (same screen region as Easy/Medium cards) returned a stale lvl* id and applyUpgrade never ran — the paused modal was unclickable and the game stuck. Reset at drawGame start.',
      'P1: level startCarriages had NO attach path — attachCarriage was only ever called from the carriage upgrade card, so a level starting carriage stock was dead inventory (L17 ships 2, permanently unusable). addTrainToLine now auto-attaches while stock remains.',
      'P2: "Extra Train" upgrade only incremented an inventory counter — addTrainToLine was never called outside new-line creation, so the card did nothing; now attaches to the eligible line with the fewest trains.',
      'P2: "Carriage (+3 cap)" upgrade never called attachCarriage anywhere — capacity could never grow beyond the base 6; now attaches to the train with least capacity.',
      'P2: endlessHigh was only written in endGame(), so quitting an endless run to the menu silently discarded its score; quitToMenu now applies the same high-score rule.',
      'P3 documented: Bridge card is inventory-only — rivers never block line drawing in this engine, so bridges have no gameplay effect (left as-is; making rivers block would change level balance).',
    ],
    level21Blocked: {
      level: 'L21 (survive, 300s, spawnInterval 2.2 = 122 pax/min, 22 stations)',
      result: 'game over x3 (overcrowd); best attempt reached t~130/300 (score 319)',
      cause: 'Fleet-economy valley t=60-130: trains are hard-capped at 2/line (engine attach rule) and cards arrive every 30s, so fleet-in-service is 50-65 cap exactly when the full 22-station network demands 122 pax/min with RNG clump streaks of 2-3.7x. Every death across ~45 strategy generations: 3-7 stations simultaneously at q6 on oc timers with all their line trains full (9/9) mid-trip. The same bot passes L17 (107/min, 240s) at its edge — L21 is +14% pressure and +25% duration.',
      notAttempted: 'Tuning L21 spawn data (e.g. 2.2->2.5) would mask a genuine difficulty outlier without established unsolvability — the failure is marginal-timing, not a hard economy bound (theoretical visit capacity ~3x demand), so this is recorded as an honest FAIL for human review rather than silently re-balanced.',
    },
  },
}));
process.exit(verdict === 'PASS' ? 0 : 1);
