// 独立 Node.js BFS 验证器（直接解析 HTML 中的关卡数据）
const fs = require('fs');

const html = fs.readFileSync('/home/msdn/gamezipper.com/pin-pull-puzzle/index.html', 'utf8');

// 直接提取 LEVELS 数组内容（从 IIFE 结束后的实际数组定义）
// HTML 中 LEVELS 是通过立即执行函数生成的，我们需要找到生成的实际数据

// 方法：使用正则提取每个 LEVELS.push 调用中的对象字面量
const levelRegex = /LEVELS\.push\(\{tier:(\d+),\s*par:(\d+),\s*pins:\[([\s\S]*?)\],\s*loot:\[([\s\S]*?)\],\s*hazards:\[([\s\S]*?)\],\s*goal:\{x:(\d+),y:(\d+),width:(\d+),height:(\d+)\}\}\);/g;

const LEVELS = [];
let match;
let matchCount = 0;

while ((match = levelRegex.exec(html)) !== null) {
  matchCount++;
  const tier = parseInt(match[1]);
  const par = parseInt(match[2]);
  const pinsStr = match[3];
  const lootStr = match[4];
  const hazardsStr = match[5];
  const goal = {x: parseInt(match[6]), y: parseInt(match[7]), width: parseInt(match[8]), height: parseInt(match[9])};

  // 解析 pins
  const pins = [];
  const pinRegex = /pin\((\d+),\s*(\d+),\s*'([^']+)'\s*(?:,\s*\[([\s\d,]+)\])?(?:,\s*'([^']+)')?\)/g;
  let pinMatch;
  while ((pinMatch = pinRegex.exec(pinsStr)) !== null) {
    const blockedBy = pinMatch[4] ? pinMatch[4].split(',').map(n => parseInt(n.trim())) : [];
    pins.push({
      x: parseInt(pinMatch[1]),
      y: parseInt(pinMatch[2]),
      color: pinMatch[3],
      blockedBy: blockedBy,
      type: pinMatch[5] || 'standard'
    });
  }

  // 解析 loot
  const loot = [];
  const lootRegex = /loot\((\d+),\s*(\d+),\s*(\d+)\)/g;
  let lootMatch;
  while ((lootMatch = lootRegex.exec(lootStr)) !== null) {
    loot.push({
      x: parseInt(lootMatch[1]),
      y: parseInt(lootMatch[2]),
      value: parseInt(lootMatch[3])
    });
  }

  // 解析 hazards
  const hazards = [];
  const hazardRegex = /hazard\((\d+),\s*(\d+),\s*(\d+),\s*(\d+),\s*'([^']+)'\)/g;
  let hazardMatch;
  while ((hazardMatch = hazardRegex.exec(hazardsStr)) !== null) {
    hazards.push({
      x: parseInt(hazardMatch[1]),
      y: parseInt(hazardMatch[2]),
      width: parseInt(hazardMatch[3]),
      height: parseInt(hazardMatch[4]),
      type: hazardMatch[5]
    });
  }

  LEVELS.push({tier, par, pins, loot, hazards, goal});
}

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
  console.log(`Level ${i+1} (Tier ${LEVELS[i].tier}, par ${LEVELS[i].par}): ${status} pins=${LEVELS[i].pins.length}`);
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