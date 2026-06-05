"""Fix DIFF_SECTIONS for 11001-12000."""
with open('/home/msdn/gamezipper.com/magic-sort/index.html') as f:
    content = f.read()

import re

# Find the last DIFF_SECTIONS entry (10801 GOD EMPEROR)
old = '{ start: 10801, label: "\U0001F451 GOD EMPEROR", color: "#ff00ff" },\n];'

new_sections = (
    '{ start: 10801, label: "\U0001F451 GOD EMPEROR", color: "#ff00ff" },\n'
    '  { start: 11001, label: "\U0001F531 OMEGA PRIME", color: "#ff3300" },\n'
    '  { start: 11201, label: "COSMIC FORGE", color: "#00ccff" },\n'
    '  { start: 11401, label: "\u2620 VOID REAPER", color: "#330066" },\n'
    '  { start: 11601, label: "ETERNAL FLAME", color: "#ff6600" },\n'
    '  { start: 11801, label: "ZENITH ASCENDED", color: "#ccff00" }\n'
    '];'
)

if old in content:
    content = content.replace(old, new_sections)
    with open('/home/msdn/gamezipper.com/magic-sort/index.html', 'w') as f:
        f.write(content)
    print('OK: DIFF_SECTIONS updated with 5 new sections')
else:
    print('ERROR: pattern not found, trying regex fallback')
    m = re.search(r'(\{ start: 10801.*?\}),\n\];', content, re.DOTALL)
    if m:
        print(f"Found: {repr(m.group(1)[:80])}")
    else:
        print("Could not find 10801 section at all")
