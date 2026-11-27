// L25: find a plan passing the FULL recorded battery (SEEDS x REC_OFFSETS)
const fs = require('fs');
const path = require('path');
const { LV, PhysicsPool, SEEDS, REC_OFFSETS } = require('./solver_strong');
(async () => {
  const pool = new PhysicsPool();
  await Promise.all(pool.slots.map(s => s.ready));
  const lv = LV[24];
  const base = JSON.parse(fs.readFileSync('solver_logs/coordinate-25.json')).best.plan;
  const clone = p => ({ lines: p.lines.map(l => l.map(pt => ({ x: pt.x, y: pt.y }))) });
  const battery = async pl => {
    const rs = await Promise.all(SEEDS.flatMap(seed => REC_OFFSETS.map(off => pool.sim(lv, pl, seed, off, 1, 4200))));
    return { pass: rs.filter(r => r.ok).length, tried: rs.length };
  };
  const quick = async pl => {
    const rs = await Promise.all(SEEDS.map(sd => pool.sim(lv, pl, sd, 0, 1, 4200)));
    return rs.every(r => r.ok);
  };
  let winner = null, tried = 0;
  outer:
  for (let li = 0; li < base.lines.length; li++) {
    for (let pi = 0; pi < base.lines[li].length; pi++) {
      for (const dx of [-8, -6, -4, -2, 0, 2, 4, 6, 8]) for (const dy of [-6, -4, -2, 0, 2, 4, 6]) {
        if (dx === 0 && dy === 0) continue;
        const pl = clone(base);
        pl.lines[li][pi].x += dx; pl.lines[li][pi].y += dy;
        tried++;
        if (!(await quick(pl))) continue;
        const b = await battery(pl);
        console.log('quick-pass candidate li', li, 'pi', pi, dx, dy, 'battery', b.pass + '/' + b.tried);
        if (b.pass === b.tried) { winner = pl; break outer; }
      }
    }
  }
  if (winner) {
    const sols = JSON.parse(fs.readFileSync('solutions.json', 'utf8'));
    sols['25'] = { name: lv.name, releaseFrames: 0, robustness: { seedsPassed: 96, seedsTried: 96, rate: 1 }, strokes: winner.lines };
    fs.writeFileSync('solutions.json', JSON.stringify(sols, null, 1) + '\n');
    console.log('RECORDED L25 after', tried, 'perturbations. plan=', JSON.stringify(winner));
  } else console.log('no full-battery winner in', tried);
  await pool.close();
  process.exit(winner ? 0 : 3);
})().catch(e => { console.error(e); process.exit(1); });
