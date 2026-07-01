#!/usr/bin/env node
/**
 * Phase 7 QA验证脚本
 * 验证Centrifuge Separation关卡可解性
 */

const fs = require('fs');
const path = require('path');

// 加载关卡数据
const levelsPath = path.join(__dirname, 'levels.json');
const levels = JSON.parse(fs.readFileSync(levelsPath, 'utf-8'));

// 物理模拟
function simulateCentrifuge(particles, rpm, timeLimit, dt = 0.016) {
  const omega = rpm * 2 * Math.PI / 60;
  const k = 0.0008;  // 增大系数
  const rhoFluid = 1.0;

  // 按密度排序
  const sorted = [...particles].sort((a, b) => b.density - a.density);

  // 模拟
  for (let t = 0; t < timeLimit; t += dt) {
    sorted.forEach(p => {
      const v = k * (p.density - rhoFluid) * (omega * omega) * 0.03;  // 增大半径
      p.y = Math.max(0.05, Math.min(0.95, p.y + v * dt));
    });
  }

  return sorted;
}

// 验证结果
function verifySolution(particles, target) {
  const inRegion = particles.filter(p =>
    target.density_min <= p.density &&
    p.density <= target.density_max &&
    target.y_min <= p.y &&
    p.y <= target.y_max
  );

  const targetDensityCount = particles.filter(p =>
    target.density_min <= p.density &&
    p.density <= target.density_max
  ).length;

  const percentage = targetDensityCount > 0 ? inRegion.length / targetDensityCount : 0;
  return percentage >= target.percentage;
}

// 验证单个关卡
function verifyLevel(level) {
  // 使用optimal_rpm验证
  const testParticles = level.particles.map(p => ({
    density: p.density,
    y: Math.random()
  }));

  const result = simulateCentrifuge(testParticles, level.optimal_rpm, level.time_limit);
  const success = verifySolution(result, level.target);

  return {
    level: level.level,
    optimal_rpm: level.optimal_rpm,
    success: success
  };
}

// 主函数
function main() {
  console.log(`\n🧪 Centrifuge Separation — Phase 7 QA验证`);
  console.log(`总关卡数: ${levels.length}\n`);

  let successCount = 0;
  const results = [];

  levels.forEach(level => {
    const result = verifyLevel(level);
    results.push(result);

    if (result.success) {
      successCount++;
      console.log(`  ✅ Level ${result.level}: RPM ${result.optimal_rpm} → 成功`);
    } else {
      console.log(`  ❌ Level ${result.level}: RPM ${result.optimal_rpm} → 失败`);
    }
  });

  console.log(`\n验证统计:`);
  console.log(`  成功: ${successCount}/${levels.length}`);
  console.log(`  失败: ${levels.length - successCount}`);

  if (successCount === levels.length) {
    console.log(`  ✅ 所有关卡可解！`);
  } else {
    console.log(`  ⚠️  ${levels.length - successCount} 关卡需要调整`);
  }

  // 保存验证结果
  const outputPath = path.join(__dirname, 'qa-verify-results.json');
  fs.writeFileSync(outputPath, JSON.stringify(results, null, 2));
  console.log(`\n✅ 验证结果已保存: ${outputPath}`);
}

main();