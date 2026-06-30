// Hourglass Swap — Level Verification (Node.js)
const LEVELS = [
  {id:1,glasses:[4,7],target:9,par:3},{id:2,glasses:[3,5],target:4,par:2},{id:3,glasses:[5,8],target:3,par:1},
  {id:4,glasses:[4,6],target:2,par:1},{id:5,glasses:[7,11],target:15,par:2},{id:6,glasses:[5,7],target:12,par:1},
  {id:7,glasses:[8,13],target:5,par:1},{id:8,glasses:[6,11],target:17,par:1},{id:9,glasses:[7,9],target:16,par:1},
  {id:10,glasses:[9,14],target:4,par:1},{id:11,glasses:[3,5,7],target:11,par:2},{id:12,glasses:[4,7,9],target:13,par:1},
  {id:13,glasses:[5,8,3],target:14,par:2},{id:14,glasses:[4,6,9],target:7,par:1},{id:15,glasses:[3,7,11],target:8,par:1},
  {id:16,glasses:[5,7,12],target:19,par:1},{id:17,glasses:[4,9,11],target:17,par:2},{id:18,glasses:[6,7,13],target:20,par:1},
  {id:19,glasses:[3,8,13],target:10,par:1},{id:20,glasses:[5,9,14],target:22,par:2},{id:21,glasses:[3,5,7,11],target:13,par:2},
  {id:22,glasses:[4,7,9,13],target:15,par:2},{id:23,glasses:[5,7,11,13],target:9,par:1},{id:24,glasses:[3,7,11,13],target:20,par:1},
  {id:25,glasses:[4,6,9,11],target:17,par:1},{id:26,glasses:[5,7,11,13],target:24,par:1},{id:27,glasses:[3,5,8,13],target:19,par:2},
  {id:28,glasses:[4,7,9,11],target:23,par:2},{id:29,glasses:[5,8,11,13],target:6,par:1},{id:30,glasses:[3,7,9,13],target:25,par:2}
];

function gcd(a, b) { while (b) { [a, b] = [b, a % b]; } return a; }

function solve(glasses, target, maxTime=200) {
  const caps = glasses;
  const initial = [0, ...caps];
  const q = [[initial, 0]];
  const visited = new Set();

  function key(state) { return state.join(','); }
  function isWin(state) {
    if (state[0] === target) return true;
    for (let i = 1; i < state.length; i++) {
      if (state[i] === target || caps[i-1] - state[i] === target) return true;
    }
    return false;
  }

  if (isWin(initial)) return [0];

  while (q.length) {
    const [state, flips] = q.shift();
    const [time, ...tops] = state;

    if (flips > 15) continue;

    for (let i = 0; i < tops.length; i++) {
      const newTops = [...tops];
      newTops[i] = caps[i] - tops[i];
      const newState = [time, ...newTops];
      const k = key(newState);
      if (!visited.has(k)) {
        visited.add(k);
        if (isWin(newState)) return [flips + 1];
        q.push([newState, flips + 1]);
      }
    }

    for (let i = 0; i < tops.length; i++) {
      if (tops[i] > 0) {
        const dt = tops[i];
        const newTime = time + dt;
        if (newTime > maxTime) continue;
        const newTops = tops.map(t => Math.max(0, t - dt));
        const newState = [newTime, ...newTops];
        const k = key(newState);
        if (!visited.has(k)) {
          visited.add(k);
          if (isWin(newState)) return [flips];
          q.push([newState, flips]);
        }
      }
    }
  }
  return null;
}

console.log('=== HOURGLASS SWAP LEVEL VERIFICATION ===\n');
let allValid = true;

LEVELS.forEach((lv, i) => {
  const result = solve(lv.glasses, lv.target);
  const status = result ? 'OK' : 'FAIL';
  const flips = result ? result[0] : 'N/A';
  const capsStr = lv.glasses.join('+');
  const pad = (s, n) => String(s).padStart(n);
  console.log(`L${pad(lv.id,2)} T${Math.ceil(lv.id/5)} ${lv.name.padEnd(18)} caps=[${capsStr.padEnd(11)}] target=${pad(lv.target,3)}  par=${pad(lv.par,2)}  flips=${pad(flips,3)}  ${status}`);
  if (!result) allValid = false;
});

console.log(`\n${allValid ? 'ALL 30 LEVELS VALID' : 'SOME LEVELS FAILED'}`);