#!/usr/bin/env python3
"""R3 verifier post-processor — fix common breakage patterns after
the bulk helper replacement."""
import re, sys
from pathlib import Path

ROOT=Path('/home/msdn/gamezipper.com')

def post_fix(path:Path):
    src=path.read_text()
    orig=src
    # Pattern 1: orphan reference to deleted `lvlMatch` / `levelMatch` / `levelsMatch` / `m`
    # Replace bare references with our helper-loaded LEVELS.
    # The verifier uses `lvlMatch[1]` etc. — replace with `LEVELS`.
    src=re.sub(r'\blvlMatch\b(?!\s*=)', 'LEVELS', src)
    src=re.sub(r'\blevelMatch\b(?!\s*=)', 'LEVELS', src)
    src=re.sub(r'\blevelsMatch\b(?!\s*=)', 'LEVELS', src)
    # `m` is too generic to safely replace.
    # Pattern 2: leftover `levelsCode = '... lvlMatch[1] ...'` strings
    src=re.sub(r"const\s+levelsCode\s*=\s*['\"]globalThis\.LEVELS\s*=\s*['\"]\s*\+\s*\w+\s*\+\s*['\"];['\"]\s*;?", 'const levelsCode="globalThis.LEVELS="+JSON.stringify(LEVELS)+";";', src)
    # Pattern 3: vm.runInContext(engineCode, ctx) followed by reference to LEVELS in main scope
    # Add `const LEVELS = ctx.LEVELS;` right after `vm.runInContext(engineCode, ctx)` if missing.
    if 'vm.runInContext(engineCode' in src and 'const LEVELS = ctx.LEVELS' not in src and 'const LEVELS=' not in src[:src.find('vm.runInContext(engineCode')]:
        src=src.replace('vm.runInContext(engineCode, ctx);', 'vm.runInContext(engineCode, ctx);\nconst LEVELS = ctx.LEVELS;', 1)
    # Pattern 4: line `levelsCode = 'globalThis.LEVELS = [' + lvlMatch[1] + '\n];'` still around
    src=re.sub(r"const\s+levelsCode\s*=\s*'globalThis\.LEVELS\s*=.*lvlMatch\[1\].*';", 'const levelsCode="globalThis.LEVELS="+JSON.stringify(LEVELS)+";";', src)
    # Pattern 5: `vm.runInContext(levelsCode, ctx)` references dead `levelsCode`
    src=re.sub(r'vm\.runInContext\(\s*levelsCode\s*,\s*ctx\s*\)', 'vm.runInContext("globalThis.LEVELS="+JSON.stringify(LEVELS)+";", ctx)', src)
    if src!=orig:
        path.write_text(src)
        return 'fixed', len(src)-len(orig)
    return 'no-change', 0

def main():
    fixed=unchanged=0
    for f in ROOT.rglob('verify_*.js'):
        s, d = post_fix(f)
        if s=='fixed':
            print(f'  [fixed] {f.relative_to(ROOT)} (delta={d})')
            fixed+=1
        else:
            unchanged+=1
    print(f'fixed={fixed} unchanged={unchanged}')

if __name__=='__main__':
    main()