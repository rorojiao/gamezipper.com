(function(){
  const r = { tested: 0, pass: 0, fail: 0, fails: [] };

  function checkLevel(i) {
    const L = LEVELS[i];
    state.lvl = i;
    state.placed = {};
    state.trayState = [];
    state.dragItem = null;
    state.moveMode = false;
    state.fulcrumPos = 0;
    if (L.fl === -1 || L.af !== undefined) {
      state.moveMode = true;
      state.fulcrumPos = L.fr ? L.fr[0] : 0;
    }
    let result = false;
    if (L.t === 1 && L.tr && L.tr.length === 1 && L.fl !== -1) {
      const w = L.tr[0];
      for (let p = L.pr[0]; p <= L.pr[1]; p++) {
        let sum = 0;
        for (const [fp, fw] of L.f) sum += (fp - 0) * fw;
        sum += (p - 0) * w;
        if (sum === 0) { state.placed = { ['' + p]: w }; result = true; break; }
      }
    } else if (L.t === 3 && L.af !== undefined) {
      state.moveMode = true;
      state.fulcrumPos = L.af;
      result = checkBalance();
    } else if (L.t === 2 || L.t === 4 || L.t === 6) {
      result = solveType(L);
    } else if (L.t === 5) {
      result = solveType5(L);
    }
    return { result };
  }

  function solveType(L) {
    if (!L.tr || L.tr.length === 0) return false;
    if (L.tr.length > 3) return null;
    const pr_min = L.pr[0], pr_max = L.pr[1];
    function rec(weights, positions, sum) {
      if (weights.length === 0) return sum === 0 ? positions.slice() : null;
      const w = weights[0];
      for (let p = pr_min; p <= pr_max; p++) {
        if (positions.includes(p)) continue;
        positions.push(p);
        const res = rec(weights.slice(1), positions, sum + (p - 0) * w);
        if (res) return res;
        positions.pop();
      }
      return null;
    }
    let baseSum = 0;
    for (const [fp, fw] of L.f) baseSum += (fp - 0) * fw;
    const positions = rec(L.tr, [], -baseSum);
    if (positions) {
      const placed = {};
      for (let i = 0; i < L.tr.length; i++) placed['' + positions[i]] = L.tr[i];
      state.placed = placed;
      return true;
    }
    return false;
  }

  function solveType5(L) {
    for (let mask = 1; mask < (1 << L.tr.length); mask++) {
      const sub = L.tr.filter((_, i) => mask & (1 << i));
      const r = solveType({ ...L, tr: sub });
      if (r) return true;
    }
    return false;
  }

  for (let i = 0; i < LEVELS.length; i++) {
    const result = checkLevel(i);
    r.tested++;
    if (result.result) r.pass++;
    else { r.fail++; r.fails.push({i, t: LEVELS[i].t}); }
  }
  return r;
})()
