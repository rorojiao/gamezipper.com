#!/usr/bin/env python3
"""
Inject gz-ad-below-game div + monetag-manager.js into all blog/*.html
Idempotent: skips files that already have the ad container.

Usage:
  python3 scripts/inject_blog_ads.py            # inject all
  python3 scripts/inject_blog_ads.py --dry-run  # preview only
  python3 scripts/inject_blog_ads.py --remove   # remove injected ads (rollback)

Logic:
  - For each blog/*.html, check if 'gz-ad-below-game' already present → skip
  - Otherwise inject a 2-line block right before </body>:
        <div id="gz-ad-below-game" style="min-height:100px;margin:16px auto;max-width:728px;text-align:center"></div>
        <script src="/monetag-manager.js?v=20260611v5"></script>
"""
import os
import sys
import glob
import re

BLOG_DIR = os.path.join(os.path.dirname(os.path.dirname(os.path.abspath(__file__))), "blog")

INJECT_BLOCK = (
    '<div id="gz-ad-below-game" style="min-height:100px;margin:16px auto;max-width:728px;text-align:center"></div>\n'
    '<script src="/monetag-manager.js?v=20260611v5"></script>\n'
)

REMOVE_PATTERN = re.compile(
    r'<div id="gz-ad-below-game"[^>]*></div>\s*'
    r'<script src="/monetag-manager\.js[^"]*"></script>\s*',
    re.IGNORECASE
)


def main():
    dry_run = "--dry-run" in sys.argv
    remove = "--remove" in sys.argv

    htmls = sorted(glob.glob(os.path.join(BLOG_DIR, "*.html")))
    if not htmls:
        print(f"❌ No .html files in {BLOG_DIR}")
        sys.exit(1)

    injected = skipped = removed = errors = 0
    samples = []

    for path in htmls:
        try:
            with open(path, "r", encoding="utf-8") as f:
                content = f.read()

            if remove:
                new_content, n = REMOVE_PATTERN.subn("", content)
                if n:
                    if not dry_run:
                        with open(path, "w", encoding="utf-8") as f:
                            f.write(new_content)
                    removed += 1
                    if len(samples) < 3:
                        samples.append(f"REMOVED {os.path.basename(path)} ({n} block(s))")
                continue

            if "gz-ad-below-game" in content:
                skipped += 1
                continue
            if "monetag-manager.js" in content:
                # Has monetag script but no gz-ad div — inject the div only
                new_content = content.replace(
                    'src="/monetag-manager.js?v=20260611v5"></script>',
                    'src="/monetag-manager.js?v=20260611v5"></script>\n<div id="gz-ad-below-game" style="min-height:100px;margin:16px auto;max-width:728px;text-align:center"></div>',
                    1,
                )
                if new_content == content:
                    print(f"  ⚠️  monetag script present but injection failed: {os.path.basename(path)}")
                    errors += 1
                    continue
                assert "gz-ad-below-game" in new_content
                if not dry_run:
                    with open(path, "w", encoding="utf-8") as f:
                        f.write(new_content)
                injected += 1
                if len(samples) < 3:
                    samples.append(f"INJECTED-DIV-ONLY {os.path.basename(path)}")
                continue

            if "</body>" not in content:
                print(f"  ⚠️  No </body> in {os.path.basename(path)}, skipping")
                errors += 1
                continue

            new_content = content.replace("</body>", INJECT_BLOCK + "</body>", 1)

            # Sanity check
            assert "gz-ad-below-game" in new_content
            assert "monetag-manager.js" in new_content
            assert new_content.count("gz-ad-below-game") == 1
            assert new_content.count("monetag-manager.js") == 1

            if not dry_run:
                with open(path, "w", encoding="utf-8") as f:
                    f.write(new_content)

            injected += 1
            if len(samples) < 3:
                samples.append(f"INJECTED {os.path.basename(path)}")

        except Exception as e:
            print(f"  ❌ Error in {os.path.basename(path)}: {e}")
            errors += 1

    action = "REMOVED" if remove else ("DRY-RUN" if dry_run else "INJECTED")
    print(f"\n=== {action} ===")
    print(f"Total files:   {len(htmls)}")
    print(f"Injected:      {injected}")
    print(f"Skipped:       {skipped} (already have gz-ad-below-game)")
    if remove:
        print(f"Removed:       {removed}")
    print(f"Errors:        {errors}")
    print(f"\nSamples:")
    for s in samples:
        print(f"  {s}")


if __name__ == "__main__":
    main()
