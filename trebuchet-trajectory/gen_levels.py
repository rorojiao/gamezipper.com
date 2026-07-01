#!/usr/bin/env python3
"""
Trebuchet Trajectory — Level Generator v4 (CALIBRATED)
Key insight: projectile range R = v²sin(2θ)/g. For uniqueness we need each (p,a)
combo to produce a DISTINCT landing x with enough separation.

Strategy: Use COARSE power steps (large v jumps) so even tier-1 combos spread out.
For each level, exhaustively verify the chosen target is hit by exactly 1 combo.
If a tier can't produce enough unique targets, adjust v range.
"""
import json
import math
import random

G = 9.81
SCALE = 18
CANVAS_W = 360
GROUND_Y = 280
LAUNCH_X = 35
LAUNCH_Y = 240
TARGET_W = 12   # px tolerance in x
TARGET_H = 18   # px tolerance in y

def simulate_landing(v0, theta_deg, obstacles):
    """Return (land_x, land_y, blocked)."""
    theta = math.radians(theta_deg)
    vx = v0 * math.cos(theta)
    vy = v0 * math.sin(theta)
    t = 0.0
    dt = 0.003
    prev_x, prev_y = LAUNCH_X, LAUNCH_Y

    while t < 8.0:
        t += dt
        new_x = LAUNCH_X + vx * t * SCALE
        new_y = LAUNCH_Y - (vy * t - 0.5 * G * t * t) * SCALE

        if new_y >= GROUND_Y:
            frac = (GROUND_Y - prev_y) / (new_y - prev_y) if (new_y - prev_y) != 0 else 1.0
            gx = prev_x + frac * (new_x - prev_x)
            return (gx, GROUND_Y, False)
        if new_x > CANVAS_W + 5 or new_x < -5:
            return (new_x, min(new_y, GROUND_Y), False)

        for obs in obstacles:
            if obs['x'] <= new_x <= obs['x']+obs['w'] and obs['y'] <= new_y <= obs['y']+obs['h']:
                return (new_x, new_y, True)

        prev_x, prev_y = new_x, new_y

    return (new_x, new_y, False)

def enumerate_all(n_power, n_angle, v_list, a_list, obstacles):
    """v_list, a_list are the actual values for each index."""
    res = {}
    for p in range(n_power):
        for a in range(n_angle):
            lx, ly, blocked = simulate_landing(v_list[p], a_list[a], obstacles)
            res[(p,a)] = (lx, ly, blocked)
    return res

def count_hitters(landings, tx, ty):
    """Count combos landing within target box."""
    cnt = 0
    hitter = None
    for (p,a), (lx,ly,blocked) in landings.items():
        if blocked:
            continue
        if abs(lx - tx) < TARGET_W and abs(ly - ty) < TARGET_H:
            cnt += 1
            if hitter is None:
                hitter = (p,a)
    return cnt, hitter

def find_unique_targets(landings, used):
    """Find all landing positions hit by exactly 1 combo, not overlapping used.
    Also verify the hitter IS that combo (not just some combo nearby)."""
    uniques = []
    seen_pos = set()
    for (p,a), (lx,ly,blocked) in landings.items():
        if blocked:
            continue
        if lx < LAUNCH_X + 40 or lx > CANVAS_W - 8:
            continue
        # Round to avoid float duplicates
        rx, ry = round(lx), round(ly)
        if (rx, ry) in seen_pos:
            continue
        seen_pos.add((rx, ry))
        cnt, hitter = count_hitters(landings, lx, ly)
        if cnt == 1 and hitter == (p,a):
            # Check not too close to used targets
            ok = True
            for (ux, uy) in used:
                if abs(lx - ux) < 28 and abs(ly - uy) < 16:
                    ok = False
                    break
            if ok:
                uniques.append(((p,a), lx, ly))
    return uniques

# ── CALIBRATED tier configs ──
# Coarse steps ensure each combo lands in a clearly different spot.
# v_list and a_list are pre-computed to maximize spread.
TIER_CONFIG = [
    # tier, l_start, l_end, n_power, n_angle, v_min, v_max, a_min, a_max
    (1, 1, 5,    4, 5,   8.0, 14.0,  35.0, 65.0),   # 20 combos, big steps
    (2, 6, 10,   5, 6,   8.0, 15.0,  30.0, 68.0),   # 30 combos
    (3, 11, 15,  6, 7,   8.5, 15.5,  28.0, 70.0),   # 42 combos
    (4, 16, 20,  7, 8,   9.0, 16.0,  28.0, 72.0),   # 56 combos
    (5, 21, 25,  8, 9,   9.0, 16.5,  27.0, 72.0),   # 72 combos
    (6, 26, 30,  9, 10,  9.5, 17.0,  26.0, 74.0),   # 90 combos
]

def make_v_a_lists(n_power, n_angle, v_min, v_max, a_min, a_max):
    v_list = [v_min + (v_max - v_min) * i / max(1, n_power-1) for i in range(n_power)]
    a_list = [a_min + (a_max - a_min) * i / max(1, n_angle-1) for i in range(n_angle)]
    return v_list, a_list

def make_obstacles(tier, variant):
    rng = random.Random(tier * 5000 + variant * 211)
    obstacles = []
    if tier == 1:
        pass
    elif tier == 2:
        if variant >= 2:
            mx = rng.randint(110, 150)
            mh = rng.randint(12, 22)
            obstacles.append({'type':'rect','x':mx,'y':GROUND_Y-mh,'w':28,'h':mh})
    elif tier == 3:
        wx = rng.randint(120, 165)
        wh = rng.randint(45, 70)
        obstacles.append({'type':'rect','x':wx,'y':GROUND_Y-wh,'w':8,'h':wh})
    elif tier == 4:
        wx = rng.randint(115, 155)
        wh = rng.randint(65, 90)
        obstacles.append({'type':'rect','x':wx,'y':GROUND_Y-wh,'w':8,'h':wh})
    elif tier == 5:
        wx = rng.randint(125, 155)
        obstacles.append({'type':'rect','x':wx,'y':GROUND_Y-60,'w':8,'h':60})
        cy = rng.randint(38, 52)
        obstacles.append({'type':'rect','x':45,'y':cy,'w':275,'h':6})
    elif tier == 6:
        wx1 = rng.randint(105, 125)
        wx2 = rng.randint(215, 235)
        obstacles.append({'type':'rect','x':wx1,'y':GROUND_Y-80,'w':8,'h':80})
        obstacles.append({'type':'rect','x':wx2,'y':GROUND_Y-80,'w':8,'h':80})
        obstacles.append({'type':'rect','x':45,'y':32,'w':275,'h':6})
    return obstacles

def generate_levels():
    all_levels = []
    for tier, l_start, l_end, n_power, n_angle, v_min, v_max, a_min, a_max in TIER_CONFIG:
        v_list, a_list = make_v_a_lists(n_power, n_angle, v_min, v_max, a_min, a_max)
        used = []

        for li in range(l_start, l_end + 1):
            variant = li - l_start
            placed = False

            for attempt in range(120):
                obstacles = make_obstacles(tier, variant + attempt)
                landings = enumerate_all(n_power, n_angle, v_list, a_list, obstacles)
                uniques = find_unique_targets(landings, used)

                if uniques:
                    (sp, sa), sx, sy = uniques[0]
                    all_levels.append({
                        'level': li, 'tier': tier,
                        'n_power': n_power, 'n_angle': n_angle,
                        'v_list': [round(v,2) for v in v_list],
                        'a_list': [round(a,1) for a in a_list],
                        'solution_power': sp, 'solution_angle': sa,
                        'target_x': round(sx), 'target_y': round(sy),
                        'target_w': TARGET_W,
                        'obstacles': obstacles,
                    })
                    used.append((round(sx), round(sy)))
                    placed = True
                    break

            if not placed:
                # Relax: allow overlapping targets (still unique per-level)
                for attempt in range(120):
                    obstacles = make_obstacles(tier, variant + attempt + 200)
                    landings = enumerate_all(n_power, n_angle, v_list, a_list, obstacles)
                    uniques = find_unique_targets(landings, [])
                    if uniques:
                        (sp, sa), sx, sy = uniques[0]
                        all_levels.append({
                            'level': li, 'tier': tier,
                            'n_power': n_power, 'n_angle': n_angle,
                            'v_list': [round(v,2) for v in v_list],
                            'a_list': [round(a,1) for a in a_list],
                            'solution_power': sp, 'solution_angle': sa,
                            'target_x': round(sx), 'target_y': round(sy),
                            'target_w': TARGET_W,
                            'obstacles': obstacles,
                        })
                        used.append((round(sx), round(sy)))
                        placed = True
                        break

            if not placed:
                # Fallback
                obstacles = make_obstacles(tier, variant)
                landings = enumerate_all(n_power, n_angle, v_list, a_list, obstacles)
                best = None
                best_cnt = 999
                for (p,a), (lx,ly,blocked) in landings.items():
                    if blocked or lx < LAUNCH_X+40 or lx > CANVAS_W-8:
                        continue
                    cnt, _ = count_hitters(landings, lx, ly)
                    if cnt < best_cnt:
                        best_cnt = cnt
                        best = ((p,a), lx, ly)
                if best:
                    (sp,sa), sx, sy = best
                else:
                    sp, sa, sx, sy = 0, 0, 120, GROUND_Y
                all_levels.append({
                    'level': li, 'tier': tier,
                    'n_power': n_power, 'n_angle': n_angle,
                    'v_list': [round(v,2) for v in v_list],
                    'a_list': [round(a,1) for a in a_list],
                    'solution_power': sp, 'solution_angle': sa,
                    'target_x': round(sx), 'target_y': round(sy),
                    'target_w': TARGET_W,
                    'obstacles': obstacles,
                })
                used.append((round(sx), round(sy)))

    return all_levels

def verify(levels):
    results = []
    all_pass = True
    for lv in levels:
        landings = enumerate_all(lv['n_power'], lv['n_angle'], lv['v_list'], lv['a_list'], lv['obstacles'])
        cnt, hitter = count_hitters(landings, lv['target_x'], lv['target_y'])
        is_unique = (cnt == 1)
        sol_valid = (lv['solution_power'], lv['solution_angle']) == hitter if hitter else False
        results.append({
            'level': lv['level'], 'tier': lv['tier'],
            'hitters': cnt, 'unique': is_unique, 'solution_valid': sol_valid,
            'sol': (lv['solution_power'], lv['solution_angle']),
            'tgt': (lv['target_x'], lv['target_y']),
        })
        if not is_unique or not sol_valid:
            all_pass = False
    return all_pass, results

if __name__ == '__main__':
    levels = generate_levels()
    all_pass, results = verify(levels)
    u = sum(1 for r in results if r['unique'])
    v = sum(1 for r in results if r['solution_valid'])
    print(f"\n{'='*70}")
    print(f"RESULTS: {u}/30 unique, {v}/30 solution valid")
    print(f"Overall: {'✅ ALL PASS' if all_pass else '❌ PARTIAL'}")
    print(f"{'='*70}")
    for r in results:
        s = '✅' if r['unique'] and r['solution_valid'] else '❌'
        print(f"  L{r['level']:2d} T{r['tier']} | h={r['hitters']} | u={r['unique']} | v={r['solution_valid']} | sol={r['sol']} | tgt={r['tgt']} {s}")

    with open('levels.json','w') as f:
        json.dump(levels, f, indent=2)
    compact = []
    for lv in levels:
        compact.append([
            lv['level'], lv['tier'], lv['n_power'], lv['n_angle'],
            lv['v_list'], lv['a_list'],
            lv['solution_power'], lv['solution_angle'],
            lv['target_x'], lv['target_y'], lv['target_w'],
            lv['obstacles']
        ])
    with open('levels_compact.json','w') as f:
        json.dump(compact, f, separators=(',',':'))
    print(f"\nFiles: levels.json, levels_compact.json")
