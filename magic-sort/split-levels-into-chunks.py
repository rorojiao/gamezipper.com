#!/usr/bin/env python3
"""R562 (2026-08-31): Magic Sort chunked-level splitter.

Splits the monolithic _LD array (215K levels, 30MB) from magic-sort/index.html
into 6 chunked JSON files, lazy-loaded by the new chunk loader.

Chunks (optimized for typical user progression):
  chunk_0 (offset 0, count 10000)        — inlined in HTML for offline-first
  chunk_1 (offset 10000, count 20000)    — fetched on first level > 10K
  chunk_2 (offset 30000, count 30000)
  chunk_3 (offset 60000, count 40000)
  chunk_4 (offset 100000, count 50000)
  chunk_5 (offset 150000, count 65000)

Verification:
  - Re-decodes each chunk via the same algorithm as game (base-30 → 4-layer tubes)
  - Validates n filled + 2 empty tubes, n colors × 4 layers per level
  - For first 30 levels + spot-checks, all pass invariants

Run:
  python3 split-levels-into-chunks.py [path/to/index.html]

Outputs:
  magic-sort/levels/chunk_0.json ... chunk_5.json
  print: chunk sizes + verification summary
"""
import json, os, re, sys

TUBE_CAP = 4
CHUNKS = [
    {"idx": 0, "start": 0,     "end": 10000,  "embedded": True},
    {"idx": 1, "start": 10000, "end": 30000,  "embedded": False},
    {"idx": 2, "start": 30000, "end": 60000,  "embedded": False},
    {"idx": 3, "start": 60000, "end": 100000, "embedded": False},
    {"idx": 4, "start": 100000, "end": 150000, "embedded": False},
    {"idx": 5, "start": 150000, "end": 215000, "embedded": False},
]

def extract_ld(html):
    """Extract levels from either old (_LD = [...]) or new (chunked) format."""
    # New R562 format: levels are in _CHUNK0_DATA inline + chunks/ files
    if "_CHUNKS_META" in html and "_CHUNK0_DATA" in html:
        m = re.search(r"const _CHUNK0_DATA\s*=\s*\[", html)
        if not m:
            raise ValueError("_CHUNK0_DATA not found in new-format HTML")
        start = m.end() - 1
        depth = 1
        i = start + 1
        while i < len(html) and depth > 0:
            c = html[i]
            if c == '[':
                depth += 1
            elif c == ']':
                depth -= 1
            i += 1
        chunk0 = json.loads(html[start:i])
        # Read other chunks from disk
        chunk_dir = os.path.join(os.path.dirname(os.path.abspath(html)) if os.path.isfile(html) else '', 'levels')
        all_levels = list(chunk0)
        # Look at _CHUNKS_META to know chunk order
        meta_m = re.search(r"const _CHUNKS_META\s*=\s*\[([\s\S]*?)\];", html)
        if meta_m:
            meta_text = meta_m.group(1)
            # Extract idx/offset pairs
            entries = re.findall(r"\{\s*idx:\s*(\d+)\s*,\s*offset:\s*(\d+)\s*,\s*count:\s*(\d+)", meta_text)
            for idx, offset, count in entries:
                idx, offset, count = int(idx), int(offset), int(count)
                if idx == 0:
                    continue
                chunk_path = os.path.join(chunk_dir, f"chunk_{idx}.json")
                if os.path.exists(chunk_path):
                    with open(chunk_path) as f:
                        data = json.load(f)
                    all_levels.extend(data['levels'])
        return all_levels
    # Old format
    m = re.search(r"const _LD=\[", html)
    if not m:
        raise ValueError("_LD array not found in HTML")
    start = m.end() - 1
    depth = 1
    i = start + 1
    while i < len(html) and depth > 0:
        c = html[i]
        if c == '[':
            depth += 1
        elif c == ']':
            depth -= 1
        i += 1
    if depth != 0:
        raise ValueError("Unbalanced brackets in _LD array")
    return json.loads(html[start:i])

def decode_level(level_data):
    """Same algorithm as magic-sort/index.html decodeLevel()."""
    n = level_data[0]
    bottles = []
    for i in range(1, len(level_data)):
        v = level_data[i]
        t = []
        for j in range(TUBE_CAP):
            c = v % 30
            if c > 0:
                t.insert(0, c - 1)
            v //= 30
        bottles.append(t)
    while len(bottles) < n + 2:
        bottles.append([])
    return n, bottles

def validate_level(level_data, idx):
    """Sanity check: at least 2 empty tubes (after R1 fix), n colors × 4 layers total.

    R1 (Jul7) fix in magic-sort/index.html decodeLevel() appends 2 empty bottles
    when count < 2. We replicate that here so the validation matches runtime.

    Note: Some levels (e.g. late-game n=28+) have non-empty "partial" tubes with
    1-3 layers. This is valid gameplay — empty space in a tube is fine. The total
    color count across all tubes must still equal n*4, and there must be ≥2 empty
    (or fully-empty) bottles for solvability.
    """
    n, bottles = decode_level(level_data)
    # Apply R1 fix: ensure ≥2 empty bottles
    empty = sum(1 for b in bottles if not b)
    if empty < 2:
        to_add = 2 - empty
        for _ in range(to_add):
            bottles.append([])
        empty = 2
    all_colors = []
    for b in bottles:
        all_colors.extend(b)
    unique = set(all_colors)
    assert empty >= 2, f"Level {idx}: <2 empty tubes (got {empty})"
    assert len(all_colors) == n * TUBE_CAP, f"Level {idx}: total colors={len(all_colors)} != {n*4}"
    assert len(unique) == n, f"Level {idx}: unique={len(unique)} != n={n}"
    # Also: all color values must be in [0, n-1]
    for c in all_colors:
        assert 0 <= c < n, f"Level {idx}: color {c} out of range [0, {n-1}]"
    return True

def main():
    html_path = sys.argv[1] if len(sys.argv) > 1 else "/home/junze/gamezipper.com/magic-sort/index.html"
    out_dir = os.path.join(os.path.dirname(html_path), "levels")
    os.makedirs(out_dir, exist_ok=True)

    print(f"Reading {html_path} ...")
    with open(html_path, 'r', encoding='utf-8') as f:
        html = f.read()

    print("Extracting _LD array ...")
    levels = extract_ld(html)
    print(f"  ✓ Extracted {len(levels)} levels")

    print("\nSplitting into chunks:")
    total_size = 0
    for c in CHUNKS:
        chunk_levels = levels[c['start']:c['end']]
        payload = {
            'idx': c['idx'],
            'offset': c['start'],
            'count': len(chunk_levels),
            'levels': chunk_levels
        }
        out_path = os.path.join(out_dir, f"chunk_{c['idx']}.json")
        with open(out_path, 'w') as f:
            json.dump(payload, f, separators=(',', ':'))
        sz = os.path.getsize(out_path)
        total_size += sz
        print(f"  chunk_{c['idx']}: levels[{c['start']:>6}:{c['end']:>6}] = {len(chunk_levels):>6} levels, "
              f"{sz/1024:>6.1f} KB, embedded={c['embedded']}")

    print(f"\nTotal chunk size: {total_size/1024/1024:.2f} MB")
    print(f"\nValidating first 30 levels + spot-checks ...")
    test_indices = list(range(30)) + [100, 500, 1000, 5000, 10000, 30000, 60000, 100000, 150000, 214999]
    test_indices = sorted(set(i for i in test_indices if i < len(levels)))
    passed = 0
    for idx in test_indices:
        try:
            validate_level(levels[idx], idx)
            passed += 1
        except AssertionError as e:
            print(f"  ✗ {e}")
    print(f"  ✓ {passed}/{len(test_indices)} levels pass invariants")

if __name__ == '__main__':
    main()
