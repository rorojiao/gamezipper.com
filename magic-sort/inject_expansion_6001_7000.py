"""
Inject expansion levels into Magic Sort index.html.
Reads expansion txt, inserts into LEVELS array, updates DIFF_SECTIONS.
"""
import sys
import os
import re

INDEX_HTML = "/home/msdn/gamezipper.com/magic-sort/index.html"
EXPANSION_FILE = "/home/msdn/gamezipper.com/magic-sort/expansion_6001_7000.txt"

def main():
    # Read expansion levels
    if not os.path.exists(EXPANSION_FILE):
        print(f"ERROR: {EXPANSION_FILE} not found")
        sys.exit(1)
    
    with open(EXPANSION_FILE, 'r') as f:
        new_levels = f.read().strip()
    
    # Count new levels
    new_count = new_levels.count('{n:')
    print(f"New levels to inject: {new_count}")
    
    # Read current index.html
    with open(INDEX_HTML, 'r') as f:
        content = f.read()
    
    original_size = len(content)
    
    # 1. Find and update LEVELS comment (line 239)
    old_comment = "// Magic Sort - 6000 solvable levels (DFS-verified, deduped)"
    new_total = 7000  # 6000 existing + 1000 new
    new_comment = f"// Magic Sort - {new_total} solvable levels (DFS-verified, deduped)"
    content = content.replace(old_comment, new_comment)
    print(f"Updated level count comment to {new_total}")
    
    # 2. Inject new levels before the closing ]; of LEVELS array
    # Find the LEVELS array closing - it's the ]; that comes after level data
    # We need to find the ]; at the right position
    
    # Strategy: find the last {n: pattern before ]; and insert after it
    # The LEVELS array ends with ];\n\nconst TOTAL_LEVELS
    target = "];\n\nconst TOTAL_LEVELS"
    
    if target not in content:
        print("ERROR: Could not find LEVELS array end marker")
        sys.exit(1)
    
    # Insert new levels before ];
    replacement = new_levels + "\n];\n\nconst TOTAL_LEVELS"
    content = content.replace(target, replacement, 1)
    print(f"Injected {new_count} levels into LEVELS array")
    
    # 3. Update DIFF_SECTIONS - add new sections after APEX ULTIMATE (5901)
    # Current last section: { start: 5901, label: "👑 APEX ULTIMATE", color: "#ff0066" },
    # We need to add sections for 6001-7000
    
    new_sections = """  { start: 6001, label: "🖤 OMEGA+", color: "#1a1a4e" },
  { start: 6151, label: "💎 TITAN", color: "#b9f2ff" },
  { start: 6301, label: "⚡ COLOSSUS", color: "#33ff99" },
  { start: 6451, label: "🌀 LEVIATHAN", color: "#cc33ff" },
  { start: 6601, label: "🔥 BEHEMOTH", color: "#ff3300" },
  { start: 6751, label: "👑 MYTHOS", color: "#ffdd00" },
  { start: 6901, label: "🌟 APEX ETERNAL", color: "#ff0066" },
];"""
    
    old_diff_end = """  { start: 5901, label: "👑 APEX ULTIMATE", color: "#ff0066" },
];"""
    
    if old_diff_end not in content:
        # Try alternate - maybe there's more after 5901
        print("WARNING: Exact DIFF_SECTIONS end not found, trying alternate match...")
        # Search for the pattern more flexibly
        alt_match = re.search(r'\{ start: 5901, label: "👑 APEX ULTIMATE", color: "#ff0066" \},\s*\];', content)
        if alt_match:
            content = content[:alt_match.start()] + """  { start: 5901, label: "👑 APEX ULTIMATE", color: "#ff0066" },
""" + new_sections + content[alt_match.end():]
            print("Injected DIFF_SECTIONS using regex match")
        else:
            print("ERROR: Could not find DIFF_SECTIONS end")
            sys.exit(1)
    else:
        content = content.replace(old_diff_end, """  { start: 5901, label: "👑 APEX ULTIMATE", color: "#ff0066" },
""" + new_sections, 1)
        print("Added 7 new DIFF_SECTIONS for 6001-7000")
    
    # 4. Update difficulty comment in LEVELS header to include new sections
    # Add comment lines for 6001-7000
    level_comment_addition = "  // 6001-6150:Omega+(22c) 6151-6450:Titan(23c) 6451-6600:Colossus(23c-extreme) 6601-6900:Behemoth(24c) 6901-7000:ApexEternal(25c)"
    
    # Find the last line of the existing level range comment (line 247 area)
    # It's the line with "3951-4000:Chaos(16c,fully-unsort)"
    old_last_comment_line = "  // 3951-4000:Chaos(16c,fully-unsort)"
    if old_last_comment_line in content:
        content = content.replace(old_last_comment_line, old_last_comment_line + "\n" + level_comment_addition)
        print("Updated level range comments")
    else:
        print("WARNING: Could not find last comment line, skipping comment update")
    
    # Write updated content
    with open(INDEX_HTML, 'w') as f:
        f.write(content)
    
    new_size = len(content)
    print(f"\n=== INJECTION COMPLETE ===")
    print(f"  Original size: {original_size:,} bytes")
    print(f"  New size:      {new_size:,} bytes")
    print(f"  Size increase: {new_size - original_size:,} bytes (+{((new_size-original_size)/original_size*100):.1f}%)")
    print(f"  Total levels:  {new_total}")
    print(f"  New sections:   7 (6001-7000)")

if __name__ == "__main__":
    main()
