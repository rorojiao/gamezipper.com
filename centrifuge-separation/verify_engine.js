#!/usr/bin/env node
// centrifuge-separation independent verifier (matches production physics exactly)
const fs = require('fs');
const path = require('path');
const levels = JSON.parse(fs.readFileSync(path.join(__dirname, 'levels.json'), 'utf-8'));

// Production physics: v = 0.0001 * (density - rho) * omega^2 * 0.01; y += v * dt
// dt from rAF = ~0.0167s at 60fps; 30s = 1800 frames; integrate
function simulate(level, rpm) {
  const omega = rpm * 2 * Math.PI / 60;
  const k = 0.002; // R88 fix: matched production physics constant (was 0.0001)
  const rho_fluid = 1.0;
  const particles = level.particles.map(p => ({ density: p.density, y: p.y }));
  const dt = 1/60; // 60 FPS, matches production
  const totalFrames = level.time_limit * 60;
  for (let f = 0; f < totalFrames; f++) {
    particles.forEach(p => {
      const v = k * (p.density - rho_fluid) * (omega * omega) * 0.01;
      p.y = Math.max(0.05, Math.min(0.95, p.y + v * dt));
    });
  }
  return particles;
}

function check(level, particles) {
  const target = level.target;
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

let pass = 0, fail = 0;
const failures = [];
levels.forEach((level) => {
  const [minRpm, maxRpm] = level.rpm_range;
  let found = false;
  // Try rpm from minRpm to maxRpm step 5
  for (let rpm = minRpm; rpm <= maxRpm; rpm += 5) {
    const p = simulate(level, rpm);
    if (check(level, p)) { found = true; break; }
  }
  if (found) pass++;
  else { fail++; failures.push(level.level); }
});
console.log(`Centrifuge: ${pass}/${levels.length} PASS, ${fail} FAIL`);
if (failures.length) console.log('Failed levels:', failures);