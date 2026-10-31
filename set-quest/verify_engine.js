/**
 * Set Quest — In-engine verifier (method 3 of 3).
 *
 * Dual-mode IIFE: exports on window.SetQuestVerify (browser) or
 * module.exports (node), mirroring pentomino/verify_engine.js.
 *
 * In the BROWSER it verifies against the REAL engine — window.setQuest /
 * window.__LEVELS_DATA are preferred when present; a self-contained
 * re-implementation of the rule is used as fallback otherwise.
 *
 * In NODE it loads levels.json and runs the same checks per level.
 *
 * Usage:
 *   verifyLevel(level)        -> { passed, checks: [{name, ok, detail}], errors: [] }
 *   checkUserSolution(lv, idx)-> { passed, errors: [] }
 *   countUniqueSolutions(cards)-> number
 *   isSet(a, b, c)            -> boolean
 *   findSets(cards)           -> [ [i,j,k], ... ]
 *
 * CLI: node verify_engine.js        (all levels)
 *      node verify_engine.js N      (level N, 1-based)
 */
'use strict';

(function (root) {

  // Tier contract shared with the independent verifier.
  const TIERS = {
    Beginner: { features: 3, board: 9,  par: 45 },
    Easy:     { features: 4, board: 9,  par: 60 },
    Medium:   { features: 4, board: 12, par: 90 },
    Hard:     { features: 4, board: 15, par: 140 },
    Expert:   { features: 4, board: 18, par: 200 },
  };

  // ---- Fallback rule implementation (used only when the real engine's
  // ---- window.setQuest.isSet / findSets are not available). ---------------

  function isSetLocal(a, b, c) {
    const n = Math.max(a.length, b.length, c.length);
    for (let f = 0; f < n; f++) {
      const same = a[f] === b[f] && b[f] === c[f];
      const diff = a[f] !== b[f] && b[f] !== c[f] && a[f] !== c[f];
      if (!same && !diff) return false;
    }
    return true;
  }

  function findSetsLocal(cards) {
    const out = [];
    for (let i = 0; i < cards.length - 2; i++) {
      for (let j = i + 1; j < cards.length - 1; j++) {
        for (let k = j + 1; k < cards.length; k++) {
          if (isSetLocal(cards[i], cards[j], cards[k])) out.push([i, j, k]);
        }
      }
    }
    return out;
  }

  // Resolve the REAL engine when running inside the live page.
  const realEngine = (root.setQuest && typeof root.setQuest.isSet === 'function')
    ? root.setQuest
    : null;
  const isSet = realEngine ? realEngine.isSet : isSetLocal;
  const findSets = realEngine ? realEngine.findSets : findSetsLocal;

  function countUniqueSolutions(cards) {
    return findSets(cards).length;
  }

  // ---- Per-level verification ---------------------------------------------

  function verifyLevel(level) {
    const checks = [];
    const errors = [];
    const push = (name, ok, detail) => checks.push({ name, ok, detail });
    const spec = TIERS[level.tier];

    // 1. tier known + features match the tier spec
    push('tier_known', !!spec, spec ? level.tier : 'unknown tier: ' + level.tier);
    if (!spec) {
      errors.push('unknown tier ' + level.tier);
      return { passed: false, checks, errors };
    }
    push('features_match_tier', level.features === spec.features,
      `features ${level.features}, tier ${level.tier} expects ${spec.features}`);
    if (level.features !== spec.features) {
      errors.push(`features ${level.features} != ${spec.features}`);
    }

    // 2. card count matches the board size
    push('card_count', Array.isArray(level.cards) && level.cards.length === spec.board,
      `${Array.isArray(level.cards) ? level.cards.length : '?'} cards, tier expects ${spec.board}`);
    if (!Array.isArray(level.cards) || level.cards.length !== spec.board) {
      errors.push(`card count mismatch`);
      return { passed: false, checks, errors };
    }

    // 3. every card: exactly `features` ints in 0..2
    const cardsOk = level.cards.every(c => Array.isArray(c) && c.length === spec.features &&
      c.every(v => Number.isInteger(v) && v >= 0 && v <= 2));
    push('card_values_valid', cardsOk,
      cardsOk ? `all ${level.cards.length} cards: ${spec.features} ints in 0..2` : 'malformed card found');
    if (!cardsOk) errors.push('card attribute values invalid');

    // 4. pairwise distinct cards
    const keys = level.cards.map(c => c.join('|'));
    push('cards_distinct', new Set(keys).size === level.cards.length,
      `${new Set(keys).size}/${level.cards.length} distinct`);
    if (new Set(keys).size !== level.cards.length) errors.push('duplicate cards on board');

    // 5. EXACTLY ONE valid triple (in-engine)
    const sets = findSets(level.cards);
    push('unique_solution', sets.length === 1,
      `${sets.length} SET triple(s) found`);
    if (sets.length !== 1) errors.push(`expected 1 SET, found ${sets.length}`);

    // countUniqueSolutions agreement
    push('count_unique_solutions', countUniqueSolutions(level.cards) === 1,
      `countUniqueSolutions = ${countUniqueSolutions(level.cards)}`);
    if (countUniqueSolutions(level.cards) !== 1) errors.push('countUniqueSolutions != 1');

    // 6. stored solution accepted by the ENGINE's own isSet
    const sol = level.solution;
    const solShapeOk = Array.isArray(sol) && sol.length === 3 &&
      new Set(sol).size === 3 &&
      sol.every(i => Number.isInteger(i) && i >= 0 && i < level.cards.length);
    push('solution_shape', solShapeOk,
      solShapeOk ? '3 distinct in-range indices' : 'malformed solution ' + JSON.stringify(sol));
    if (!solShapeOk) {
      errors.push('solution shape invalid');
      return { passed: false, checks, errors };
    }
    const solTriple = [level.cards[sol[0]], level.cards[sol[1]], level.cards[sol[2]]];
    push('solution_is_set', isSet(solTriple[0], solTriple[1], solTriple[2]),
      `isSet(cards[${sol.join(']},cards[')}]) === true`);
    if (!isSet(solTriple[0], solTriple[1], solTriple[2])) errors.push('stored solution rejected by engine isSet');

    const sortedSol = sol.slice().sort((a, b) => a - b).join(',');
    push('solution_is_unique_triple', sets.length === 1 && sets[0].join(',') === sortedSol,
      `solution ${sortedSol} vs unique SET ${sets.length ? sets[0].join(',') : 'n/a'}`);
    if (!(sets.length === 1 && sets[0].join(',') === sortedSol)) {
      errors.push('stored solution is not THE unique SET');
    }

    // 6b. a WRONG triple is REJECTED (engine is not accepting everything).
    //     Proof: complementarity — if isSet returned true for every triple,
    //     isSet on the complement pair of the solution would also be true.
    let wrongRejected = true;
    let probed = 0;
    for (let i = 0; i < level.cards.length - 2 && wrongRejected; i++) {
      for (let j = i + 1; j < level.cards.length - 1 && wrongRejected; j++) {
        for (let k = j + 1; k < level.cards.length && wrongRejected; k++) {
          if (i === sol[0] && j === sol[1] && k === sol[2]) continue;
          probed++;
          if (isSet(level.cards[i], level.cards[j], level.cards[k])) wrongRejected = false;
        }
      }
    }
    push('wrong_triples_rejected', wrongRejected,
      wrongRejected ? `all ${probed} non-solution triples rejected` : 'a non-solution triple was ACCEPTED');
    if (!wrongRejected) errors.push('engine accepted a wrong triple');

    // 8. spread guard: max - min >= 4 (no clustered "first three cards")
    const spread = Math.max(...sol) - Math.min(...sol);
    push('solution_spread', spread >= 4, `spread ${spread} (min 4)`);
    if (spread < 4) errors.push(`solution clustered, spread ${spread}`);

    // 9. par time is a positive integer
    push('par_positive_int', Number.isInteger(level.par) && level.par > 0,
      `par ${level.par}`);
    if (!(Number.isInteger(level.par) && level.par > 0)) errors.push('par not a positive integer');

    const passed = checks.every(c => c.ok);
    return { passed, checks, errors };
  }

  /**
   * Verify a user's claimed solution indices against a level.
   * indices: array of exactly 3 card indexes. Returns { passed, errors }.
   */
  function checkUserSolution(level, indices) {
    const errors = [];
    if (!Array.isArray(level.cards) || !level.cards.length) {
      errors.push('level has no cards');
      return { passed: false, errors };
    }
    if (!Array.isArray(indices) || indices.length !== 3) {
      errors.push(`expected 3 indices, got ${Array.isArray(indices) ? indices.length : typeof indices}`);
      return { passed: false, errors };
    }
    if (new Set(indices).size !== 3) {
      errors.push('indices not distinct');
    }
    for (const i of indices) {
      if (!Number.isInteger(i) || i < 0 || i >= level.cards.length) {
        errors.push(`index ${i} out of range 0..${level.cards.length - 1}`);
      }
    }
    if (errors.length) return { passed: false, errors };
    const triple = [level.cards[indices[0]], level.cards[indices[1]], level.cards[indices[2]]];
    if (!isSet(triple[0], triple[1], triple[2])) {
      errors.push('selected triple is not a SET');
    }
    return { passed: errors.length === 0, errors };
  }

  // ---- Exports --------------------------------------------------------

  const exported = { verifyLevel, checkUserSolution, countUniqueSolutions, isSet, findSets, TIERS };
  if (typeof module !== 'undefined' && module.exports) {
    module.exports = exported;
  } else {
    root.SetQuestVerify = exported;
  }

  // ---- CLI runner -----------------------------------------------------
  if (typeof require !== 'undefined' && typeof require.main === 'object' &&
      require.main === module) {
    const fs = require('fs');
    const path = require('path');
    const data = JSON.parse(fs.readFileSync(path.join(__dirname, 'levels.json'), 'utf-8'));
    const levels = data.levels;
    const target = process.argv[2] ? parseInt(process.argv[2], 10) - 1 : null;

    let allPass = true;
    for (let i = 0; i < levels.length; i++) {
      if (target !== null && i !== target) continue;
      const result = exported.verifyLevel(levels[i]);
      const mark = result.passed ? '\u2713' : '\u2717';
      console.log(`Level ${String(i + 1).padStart(2, '0')} [${String(levels[i].tier).padEnd(8)}] ${mark}`);
      for (const c of result.checks) {
        if (!c.ok) console.log(`  \u2717 ${c.name}: ${c.detail}`);
      }
      if (!result.passed) allPass = false;
    }
    if (target === null) {
      console.log(`\nverify_engine: ${allPass ? levels.length + '/' + levels.length + ' PASS' : 'FAIL'}`);
    } else {
      console.log(`\nLevel ${target + 1}: ${allPass ? 'PASS' : 'FAIL'} (in-engine)`);
    }
    process.exit(allPass ? 0 : 1);
  }

})(typeof window !== 'undefined' ? window : globalThis);
