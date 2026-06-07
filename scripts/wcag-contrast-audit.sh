#!/usr/bin/env bash
# GameZipper WCAG 2.1 AA contrast audit (Hard Rule #33)
# Scans both INLINE style="color:..." AND CSS ruleset color:... values in index.html
# Computes WCAG 2.1 contrast ratios against the 5 known backgrounds.
# Exits 1 on any WCAG AA normal-text (4.5:1) FAIL.
#
# Usage: bash scripts/wcag-contrast-audit.sh
# Returns: list of FAIL sites with line number + old color + new color recommendation.
#
# KNOWN LIMITATION: only checks CSS ruleset and inline color:#XXXXXX patterns
# of the form color: (NOT background, NOT border, NOT fill). Border/UI contrast
# (WCAG 1.4.11 = 3.0:1) is not audited here.

set -e

REPO_ROOT="$(git rev-parse --show-toplevel 2>/dev/null || echo /home/msdn/gamezipper.com)"
cd "$REPO_ROOT" || exit 1

INDEX="index.html"
if [ ! -f "$INDEX" ]; then
  echo "❌ $INDEX not found"
  exit 1
fi

python3 << 'PYEOF'
import re, sys

# Known GameZipper background colors. Add new ones here as the design system evolves.
BGS = {
    'body-dark':     '#0a0a1a',
    'card-dark':     '#1a1a2e',
    'dialog-dark':   '#1a1a3e',
    'dialog-light':  '#f0f0f5',
    'card-light':    '#f5f5fa',
}

def hex_to_rgb(h):
    h = h.lstrip('#')
    if len(h) == 3:
        h = ''.join(c*2 for c in h)
    if len(h) != 6:
        raise ValueError(f"hex_to_rgb: expected 6 hex chars, got {h!r} (orig {h!r})")
    return tuple(int(h[i:i+2], 16) for i in (0, 2, 4))

def rel_lum(rgb):
    def chan(c):
        c = c / 255
        return c / 12.92 if c <= 0.03928 else ((c + 0.055) / 1.055) ** 2.4
    r, g, b = (chan(c) for c in rgb)
    return 0.2126 * r + 0.7152 * g + 0.0722 * b

def contrast(a, b):
    l1, l2 = rel_lum(hex_to_rgb(a)), rel_lum(hex_to_rgb(b))
    L, d = max(l1, l2), min(l1, l2)
    return (L + 0.05) / (d + 0.05)

# Pre-computed safe color mappings (from Phase 3 fixes 2026-06-07 18h)
SAFE_DARK = {  # good contrast on #0a0a1a / #1a1a2e / #1a1a3e
    '#fff': 21.0, '#bbb': 11.5, '#aaa': 8.4, '#9aa': 7.2,
    '#888': 4.5, '#7eeee5': 12.0, '#b8b8c8': 8.5, '#a9acc1': 6.7,
    '#78909c': 5.85, '#4ecdc4': 10.1, '#ffd93d': 12.0, '#ff6b6b': 4.5,
    '#f59e0b': 6.5, '#fbbf24': 9.5, '#d69e2e': 6.4, '#319795': 6.5,
    '#1a8a7a': 7.2, '#4fc3f7': 9.0, '#4ade80': 10.0, '#c084fc': 6.5,
    '#e53e3e': 5.0, '#00ff88': 11.0, '#1a1a2e': 1.0, '#1a1a3e': 1.0,
    '#2a2a4a': 1.5,
}
SAFE_LIGHT = {  # good contrast on #f0f0f5 / #f5f5fa
    '#000': 21.0, '#222': 16.0, '#333': 12.0, '#444': 9.0, '#555': 6.5,
    '#666': 5.0, '#777': 3.94, '#888': 3.0, '#1a8a7a': 4.5, '#319795': 4.7,
    '#4ecdc4': 2.5,  # accent — only on dark bg, would fail light. Excluded by context.
    '#e53e3e': 4.5, '#d69e2e': 3.5, '#38a169': 3.5, '#2b6cb0': 7.0,
    '#ccc': 1.6, '#ddd': 1.3, '#e0e0ea': 1.2, '#b0bec5': 2.0,
    '#0a0a1a': 18.0, '#1a1a2e': 14.0, '#1a1a3e': 13.0,
}

with open('index.html', 'r', encoding='utf-8') as f:
    lines = f.readlines()

# Detect both INLINE style="...color:#XXX..." and CSS ruleset ...{color:#XXX...}
# Use a per-line scan with regex.
# Skip comment lines (//) and HTML attribute lines that are obviously not color.
inline_pat = re.compile(r'style="[^"]*color:#([0-9a-fA-F]{3,6})')
ruleset_pat = re.compile(r'\{[^}]*color:#([0-9a-fA-F]{3,6})')
# Lines that should be SKIPPED (background, border, fill, stroke, outline, accent)
skip_pat = re.compile(r'(background[^-:]*:|border[a-z-]*:|fill:|stroke:|outline[^-:]*:|accent-color|box-shadow|@keyframes|//|/\*)')

results = []  # (line_no, line, color, context, type, max_contrast_on_known_bg)

for i, line in enumerate(lines, start=1):
    if skip_pat.search(line):
        continue
    for pat, kind in [(inline_pat, 'inline'), (ruleset_pat, 'ruleset')]:
        for m in pat.finditer(line):
            hex_str = m.group(1).lower()
            # Skip non-3/6 digit hex
            if len(hex_str) not in (3, 6):
                continue
            color = '#' + hex_str
            # Normalize 3-digit to 6-digit
            if len(color) == 4:
                color = '#' + ''.join(c*2 for c in color[1:])
            # Defensive: if color is empty or non-hex, skip
            if len(color) != 7 or not all(c in '0123456789abcdef#' for c in color):
                print(f"DEBUG SKIP line {i} kind={kind} hex_str={hex_str!r}", file=sys.stderr)
                continue
            # Check against each bg
            ratios = {bg: round(contrast(color, bg_hex), 2) for bg, bg_hex in BGS.items()}
            # Worst case is the most likely bg for this selector
            max_r = max(ratios.values())
            min_r = min(ratios.values())
            # Determine which bg applies — heuristic: if line has 'dark' words OR no 'light' override, assume dark
            is_dark_selector = ('dark' in line.lower() or 'onboard' in line.lower() or
                                'card-tip' in line or 'cookie' in line.lower() or
                                not re.search(r'@media\(prefers-color-scheme:light\)|data-gz-theme=light|light-', line))
            target_bg_name = 'body-dark' if is_dark_selector else 'card-light'
            target_r = ratios[target_bg_name]
            if target_r < 4.5 and color not in ('#000', '#fff', '#fff0', '#0a0a1a', '#1a1a2e', '#1a1a3e'):
                # Find a recommended replacement
                candidates_safe = SAFE_DARK if is_dark_selector else SAFE_LIGHT
                # Find first candidate with ratio >= 4.5
                rec = None
                for c2 in ['#888', '#999', '#aaa', '#bbb', '#ccc', '#666', '#777', '#555', '#444', '#333', '#78909c']:
                    r2 = contrast(c2, BGS[target_bg_name])
                    if r2 >= 4.5:
                        rec = c2
                        break
                results.append({
                    'line': i,
                    'color': color,
                    'bg': target_bg_name,
                    'bg_hex': BGS[target_bg_name],
                    'ratio': target_r,
                    'all_ratios': ratios,
                    'kind': kind,
                    'recommend': rec,
                    'snippet': line.strip()[:100],
                })

if not results:
    print("=== WCAG 2.1 AA Contrast Audit (Hard Rule #33) ===")
    print(f"Scanned {len(lines)} lines, 5 known backgrounds.")
    print("✅ No FAILs found. All text colors meet WCAG 2.1 AA (4.5:1 normal text).")
    sys.exit(0)

print("=== WCAG 2.1 AA Contrast Audit (Hard Rule #33) ===")
print(f"Scanned {len(lines)} lines, 5 known backgrounds.")
print(f"❌ {len(results)} FAIL(s) found:\n")
for r in sorted(results, key=lambda x: x['ratio']):
    print(f"  L{r['line']} [{r['kind']}] {r['color']} on {r['bg']} ({r['bg_hex']}) = {r['ratio']:.2f}:1")
    print(f"    fix → {r['recommend']} ({contrast(r['recommend'], r['bg_hex']):.2f}:1)")
    print(f"    all bgs: {r['all_ratios']}")
    print(f"    {r['snippet']}")
    print()
sys.exit(1)
PYEOF
