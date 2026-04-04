#!/bin/bash
# Add "More Games" cross-link section to game pages that lack it
cd "$(dirname "$0")/.."

# All game directories (exclude non-game dirs)
GAMES=(2048 abyss-chef bolt-jam-3d bounce-bot brick-breaker catch-turkey cloud-sheep color-sort dessert-blast flappy-wings glyph-quest idle-clicker kitty-cafe memory-match mo-yu-fayu ocean-gem-pop paint-splash phantom-blade snake stacker sushi-stack typing-speed whack-a-mole wood-block-puzzle word-puzzle)

# Pick 6 random related games for each
for game in "${GAMES[@]}"; do
    file="$game/index.html"
    [ ! -f "$file" ] && continue
    
    # Check if already has More Games section
    if grep -q 'More.*Free Games\|More Games Section' "$file"; then
        echo "SKIP $game (already has More Games)"
        continue
    fi
    
    # Pick 6 random other games (not itself)
    others=()
    for g in "${GAMES[@]}"; do
        [ "$g" != "$game" ] && others+=("$g")
    done
    
    # Shuffle and pick 6
    shuffled=($(shuf -e "${others[@]}"))
    picks=("${shuffled[@]:0:6}")
    
    # Build links
    links=""
    for pick in "${picks[@]}"; do
        # Get display name from title
        name=$(grep -oP '(?<=<title>Play )[^O]*' "$pick/index.html" 2>/dev/null | sed 's/ *$//' || echo "$pick")
        [ -z "$name" ] && name="$pick"
        links="${links}<a href=\"/${pick}/\" style=\"display:inline-block;padding:6px 12px;background:#1a1f34;border:1px solid #2a3252;border-radius:999px;text-decoration:none;color:#fff;font-size:13px\">${name}</a>"
    done
    
    # Build the section HTML
    section="<!-- More Games Section -->
<section style=\"max-width:700px;margin:30px auto 24px;padding:0 16px;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',sans-serif;color:#ccc;line-height:1.7;\">
<h2 style=\"font-size:20px;font-weight:700;color:#fff;margin-bottom:10px;\">🎮 More Free Games Like This</h2>
<p>If you enjoyed this game, you'll love these free online games too:</p>
<div style=\"display:flex;flex-wrap:wrap;gap:8px;margin-top:12px\">${links}</div>
<div style=\"margin-top:16px\"><a href=\"/\" style=\"display:inline-block;padding:8px 16px;background:#00ff88;color:#000;border-radius:999px;text-decoration:none;font-weight:700;font-size:14px;margin-top:12px\">🎮 All Free Games</a></div>
</section>"

    # Insert before </body>
    sed -i "s|</body>|${section}\n</body>|" "$file"
    echo "DONE $game"
done
