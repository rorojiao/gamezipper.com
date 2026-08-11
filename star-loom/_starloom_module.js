// Extracted from index.html for in-engine verification
const StarLoom = (function() {

  function allChordsPairs(N) {
    const edges = [];
    for (let i = 0; i < N; i++) edges.push([i, (i + 1) % N]);
    for (let i = 0; i < N; i++) {
      for (let j = i + 2; j < N; j++) {
        if (!(i === 0 && j === N - 1)) edges.push([i, j]);
      }
    }
    return edges;
  }
  function solveUnique(allE, anchors, N, timeLimitMs) {
    const start = Date.now();
    const neighbors = Array.from({length: N}, () => []);
    for (let idx = 0; idx < allE.length; idx++) {
      const [i, j] = allE[idx];
      neighbors[i].push([j, idx]);
      neighbors[j].push([i, idx]);
    }
    const nChords = allE.length;
    const used = new Array(nChords).fill(false);
    const currentDeg = new Array(N).fill(0);
    const solutions = [];
    const order = Array.from({length: nChords}, (_, k) => k).sort((a, b) => {
      const [ai, aj] = allE[a];
      const [bi, bj] = allE[b];
      const aMin = Math.min(anchors[ai] !== undefined ? anchors[ai] : 99, anchors[aj] !== undefined ? anchors[aj] : 99);
      const bMin = Math.min(anchors[bi] !== undefined ? anchors[bi] : 99, anchors[bj] !== undefined ? anchors[bj] : 99);
      return bMin - aMin;
    });
    function feasible() {
      for (const nStr of Object.keys(anchors)) {
        const n = parseInt(nStr);
        const target = anchors[n];
        if (currentDeg[n] > target) return false;
        let remaining = 0;
        for (const [, eidx] of neighbors[n]) if (!used[eidx]) remaining++;
        if (currentDeg[n] + remaining < target) return false;
      }
      return true;
    }
    function backtrack(idx) {
      if (Date.now() - start > timeLimitMs) return;
      if (solutions.length >= 2) return;
      if (idx === order.length) {
        for (const nStr of Object.keys(anchors)) {
          const n = parseInt(nStr);
          if (currentDeg[n] !== anchors[n]) return;
        }
        const visited = new Set([0]);
        const stack = [0];
        while (stack.length > 0) {
          const cur = stack.pop();
          for (const [nb, eidx] of neighbors[cur]) {
            if (used[eidx] && !visited.has(nb)) { visited.add(nb); stack.push(nb); }
          }
        }
        if (visited.size === N) solutions.push([...used]);
        return;
      }
      const ci = order[idx];
      const [i, j] = allE[ci];
      used[ci] = true;
      currentDeg[i]++; currentDeg[j]++;
      if (feasible()) backtrack(idx + 1);
      currentDeg[i]--; currentDeg[j]--;
      const mustExclude = (anchors[i] !== undefined && currentDeg[i] === anchors[i]) || (anchors[j] !== undefined && currentDeg[j] === anchors[j]);
      used[ci] = false;
      if (mustExclude) backtrack(idx + 1);
      else if (feasible()) backtrack(idx + 1);
    }
    backtrack(0);
    return solutions;
  }
  function findHint(anchors, drawnChords, N) {
    // Find one chord in solution that isn't drawn yet
    const allE = allChordsPairs(N);
    const sols = solveUnique(allE, anchors, N, 3000);
    if (sols.length !== 1) return null;
    const drawnSet = new Set(drawnChords.map(c => [c.i, c.j].sort((a, b) => a - b).join(',')));
    for (let idx = 0; idx < allE.length; idx++) {
      if (sols[0][idx]) {
        const [i, j] = allE[idx];
        const key = [i, j].sort((a, b) => a - b).join(',');
        if (!drawnSet.has(key)) return { i, j };
      }
    }
    return null;
  }
  return { solveUnique, findHint };

})();
module.exports = StarLoom;
