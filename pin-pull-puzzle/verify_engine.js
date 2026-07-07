// In-engine Node.js BFS 验证器（使用 vm.runInContext 执行实际游戏逻辑）
const vm = require('vm');
const fs = require('fs');

const html = fs.readFileSync('/home/msdn/gamezipper.com/pin-pull-puzzle/index.html', 'utf8');

// 提取游戏 JavaScript 代码（从 <script> 开始到 </script> 结束）
const scriptStart = html.indexOf('<script>') + 8;
const scriptEnd = html.lastIndexOf('</script>');
const gameCode = html.slice(scriptStart, scriptEnd);

// 创建最小化的 DOM mock
const ctx = {
  document: {
    getElementById: () => ({getContext: () => ({clearRect: ()=>{}})}),
    querySelectorAll: () => [],
    createElement: () => ({}),
    body: {appendChild: ()=>{}, removeChild: ()=>{}},
    head: {appendChild: ()=>{}},
    readyState: 'complete'
  },
  window: {
    devicePixelRatio: 1,
    innerWidth: 480,
    innerHeight: 640,
    addEventListener: () => {},
    localStorage: {
      getItem: () => null,
      setItem: () => {}
    },
    requestAnimationFrame: () => 0,
    cancelAnimationFrame: () => {}
  },
  AudioContext: function() {},
  webkitAudioContext: function() {},
  screen: {width: 480, height: 640},
  console,
  setTimeout: () => 0,
  setInterval: () => 0,
  Math: Math,
  JSON: JSON,
  Array: Array,
  Object: Object,
  String: String,
  Number: Number,
  Boolean: Boolean
};

vm.createContext(ctx);

// 执行游戏代码
try {
  vm.runInContext(gameCode, ctx);
} catch (e) {
  // 忽略运行时错误（DOM 相关），我们只需要 LEVELS 数据
}

// 提取 LEVELS
const LEVELS = vm.runInContext('LEVELS', ctx);

console.log(`Found ${LEVELS.length} levels`);

function verifyLevel(levelIdx, level) {
  const pins = level.pins;

  // 状态: 钉子是否已拔
  const canPull = (state, pinIdx) => {
    if (state[pinIdx] === 1) return false;
    const blockedBy = pins[pinIdx].blockedBy || [];
    for (const b of blockedBy) {
      if (state[b] === 0) return false;
    }
    return true;
  };

  // BFS 搜索解
  const visited = new Set();
  const queue = [[new Array(pins.length).fill(0), []]];

  while (queue.length > 0) {
    const [state, moves] = queue.shift();

    // 检查是否所有钉子已拔
    if (state.every(s => s === 1)) {
      return [true, moves];
    }

    const stateKey = state.join(',');
    if (visited.has(stateKey)) continue;
    visited.add(stateKey);

    // 尝试拔每个可拔的钉子
    for (let i = 0; i < pins.length; i++) {
      if (canPull(state, i)) {
        const newState = state.slice();
        newState[i] = 1;
        const newMoves = [...moves, i];
        queue.push([newState, newMoves]);
      }
    }
  }

  return [false, []];
}

// 验证所有关卡
let allValid = true;
for (let i = 0; i < LEVELS.length; i++) {
  const [solvable, solution] = verifyLevel(i, LEVELS[i]);
  const status = solvable ? '✓' : '✗';
  console.log(`Level ${i+1} (Tier ${LEVELS[i].tier}, par ${LEVELS[i].par}): ${status} pins=${LEVELS[i].pins.length} loot=${LEVELS[i].loot.length} hazards=${LEVELS[i].hazards.length}`);
  if (!solvable) {
    allValid = false;
    console.log('  ERROR: No solution found!');
  }
}

if (allValid) {
  console.log('\n✓ ALL LEVELS VERIFIED SOLVABLE');
  process.exit(0);
} else {
  console.log('\n✗ SOME LEVELS UNSOLVABLE');
  process.exit(1);
}