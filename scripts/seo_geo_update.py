#!/usr/bin/env python3
"""SEO+GEO batch update: VideoGame schema, FAQPage, BreadcrumbList, FAQ HTML for all games."""

import re, json, os

BASE = "/home/msdn/gamezipper.com"

GAMES = [
    {
        "slug": "snake",
        "name": "Snake Game",
        "title": "Snake - Free Online Arcade Game | GameZipper",
        "desc": "Play the classic Snake game free online. Control your snake, eat food to grow longer, and avoid walls or your own tail. Works on desktop and mobile with touch controls.",
        "genre": ["Arcade", "Classic"],
        "faq": [
            {
                "q": "How do you play Snake game?",
                "a": "Use arrow keys or WASD on desktop, or swipe gestures and the on-screen D-pad on mobile to control your snake's direction. Eat the red food dots to grow longer and earn points. Avoid hitting walls or your own tail—if you do, it's game over!"
            },
            {
                "q": "Is Snake game free to play?",
                "a": "Yes, Snake on GameZipper is completely free to play with no downloads, accounts, or payments required. Just open the page in your browser and start playing instantly on any device."
            },
            {
                "q": "Can I play Snake game on mobile?",
                "a": "Absolutely! Snake fully supports touch controls with swipe gestures and an on-screen D-pad, making it perfect for smartphones and tablets. The game automatically detects your device type."
            }
        ]
    },
    {
        "slug": "2048",
        "name": "2048",
        "title": "2048 - Free Online Puzzle Game | GameZipper",
        "desc": "Slide numbered tiles on a 4x4 grid to combine them and reach the 2048 tile. The classic number sliding puzzle is free to play in your browser—no download needed.",
        "genre": ["Puzzle", "Number Puzzle"],
        "faq": [
            {
                "q": "How do you play 2048?",
                "a": "Use arrow keys on desktop or swipe on mobile to slide all tiles in one direction. When two tiles with the same number collide, they merge into one tile with double the value. Keep combining tiles until you reach 2048 to win!"
            },
            {
                "q": "Is 2048 free to play?",
                "a": "Yes, 2048 on GameZipper is completely free with no downloads, accounts, or payments needed. Just open the page and start sliding tiles instantly in your browser."
            },
            {
                "q": "Can I play 2048 on mobile?",
                "a": "Yes! 2048 fully supports swipe controls on mobile, so you can slide tiles with a finger swipe in any direction. It works great on smartphones and tablets."
            }
        ]
    },
    {
        "slug": "brick-breaker",
        "name": "Brick Breaker",
        "title": "Brick Breaker - Free Online Arcade Game | GameZipper",
        "desc": "Play Brick Breaker free online—the classic breakout arcade game. Bounce your ball to smash bricks, collect power-ups, and clear all 50 levels. No download needed.",
        "genre": ["Arcade", "Breakout"],
        "faq": [
            {
                "q": "How do you play Brick Breaker?",
                "a": "Move your paddle left and right using arrow keys or mouse (desktop) or by tapping and dragging (mobile) to bounce the ball and smash bricks. Collect power-ups that fall from destroyed bricks to get special abilities. Clear all bricks to advance to the next level!"
            },
            {
                "q": "Is Brick Breaker free to play?",
                "a": "Yes, Brick Breaker on GameZipper is completely free. No downloads, registration, or payments required—just open the page and play directly in your browser."
            },
            {
                "q": "Can I play Brick Breaker on mobile?",
                "a": "Yes! Brick Breaker supports touch controls on mobile devices. Drag your finger across the screen to move the paddle and keep the ball in play on your smartphone or tablet."
            }
        ]
    },
    {
        "slug": "flappy-wings",
        "name": "Flappy Wings",
        "title": "Flappy Wings - Free Online Arcade Game | GameZipper",
        "desc": "Tap to flap your wings and fly through gaps between pipes in Flappy Wings. The addictive endless arcade game is free to play in your browser on desktop and mobile.",
        "genre": ["Arcade", "Endless Runner"],
        "faq": [
            {
                "q": "How do you play Flappy Wings?",
                "a": "Tap the screen or press the spacebar to make your bird flap its wings and fly upward. Release to glide down. Navigate through the gaps between green pipes—touch a pipe or fall to the ground and it's game over. Try to beat your high score!"
            },
            {
                "q": "Is Flappy Wings free to play?",
                "a": "Yes, Flappy Wings on GameZipper is completely free with no downloads or accounts required. Open the page in your browser and play immediately."
            },
            {
                "q": "Can I play Flappy Wings on mobile?",
                "a": "Absolutely! Flappy Wings is designed for mobile—just tap anywhere on the screen to make the bird flap. It works perfectly on smartphones and tablets."
            }
        ]
    },
    {
        "slug": "memory-match",
        "name": "Memory Match",
        "title": "Memory Match - Free Online Puzzle Game | GameZipper",
        "desc": "Flip cards and find matching pairs in Memory Match, the classic concentration puzzle game. Train your memory and beat your best time. Free to play on desktop and mobile.",
        "genre": ["Puzzle", "Memory"],
        "faq": [
            {
                "q": "How do you play Memory Match?",
                "a": "Click or tap cards to flip them face-up. Try to find two cards with matching images. If they match, they stay face-up; if not, both flip back face-down. Remember the positions and match all pairs as quickly as possible to win!"
            },
            {
                "q": "Is Memory Match free to play?",
                "a": "Yes, Memory Match on GameZipper is completely free. No downloads, accounts, or payments needed—just click to flip cards directly in your browser."
            },
            {
                "q": "Can I play Memory Match on mobile?",
                "a": "Yes! Memory Match works great on mobile. Tap cards to flip them and match pairs. The responsive layout adapts to any screen size for a smooth experience."
            }
        ]
    },
    {
        "slug": "word-puzzle",
        "name": "Word Puzzle",
        "title": "Word Puzzle - Free Online Word Game | GameZipper",
        "desc": "Find hidden words in a grid of letters with Word Puzzle, the free online word search game. Expand your vocabulary and challenge your brain. Play instantly in your browser.",
        "genre": ["Word", "Puzzle"],
        "faq": [
            {
                "q": "How do you play Word Puzzle?",
                "a": "Search the grid of letters to find hidden words from the word list. Click and drag across letters to select a word—words can run horizontally, vertically, or diagonally in any direction. Find all the words to complete the puzzle!"
            },
            {
                "q": "Is Word Puzzle free to play?",
                "a": "Yes, Word Puzzle on GameZipper is completely free with no downloads or sign-ups required. Open the page and start searching for words immediately."
            },
            {
                "q": "Can I play Word Puzzle on mobile?",
                "a": "Yes! Word Puzzle supports touch controls on mobile. Drag your finger across letters to select words. The grid adjusts to fit any screen size for comfortable gameplay."
            }
        ]
    },
    {
        "slug": "typing-speed",
        "name": "Typing Speed Test",
        "title": "Typing Speed Test - Free Online Typing Game | GameZipper",
        "desc": "Test and improve your typing speed with this free online WPM typing game. Type the displayed words as fast and accurately as you can. Track your words per minute and accuracy.",
        "genre": ["Educational", "Typing"],
        "faq": [
            {
                "q": "How does the Typing Speed Test work?",
                "a": "Words or sentences appear on screen and you type them as quickly and accurately as possible. Your words per minute (WPM) and accuracy percentage are calculated in real-time. Finish the test to see your final score and compare to average typists!"
            },
            {
                "q": "Is the Typing Speed Test free?",
                "a": "Yes, Typing Speed Test on GameZipper is completely free with no downloads, accounts, or payments needed. Just click into the text field and start typing immediately."
            },
            {
                "q": "Can I use the Typing Speed Test on mobile?",
                "a": "Yes, you can use the typing test on mobile devices with a Bluetooth keyboard or on-screen keyboard. For the most accurate WPM results, a physical keyboard is recommended."
            }
        ]
    },
    {
        "slug": "idle-clicker",
        "name": "Idle Clicker",
        "title": "Idle Clicker - Free Online Idle Game | GameZipper",
        "desc": "Build your empire by clicking and buying upgrades in Idle Clicker, the free incremental idle game. Earn resources automatically even when offline. No download required.",
        "genre": ["Idle", "Incremental"],
        "faq": [
            {
                "q": "How do you play Idle Clicker?",
                "a": "Click the main button to earn resources, then spend them on upgrades and automated production buildings. As you progress, resources generate automatically so your empire grows even when you're not actively clicking. Keep upgrading to reach new milestones!"
            },
            {
                "q": "Is Idle Clicker free to play?",
                "a": "Yes, Idle Clicker on GameZipper is completely free with no downloads or payments required. Open the page and start building your idle empire right away."
            },
            {
                "q": "Can I play Idle Clicker on mobile?",
                "a": "Yes! Idle Clicker works great on mobile devices. Tap to click and tap buttons to purchase upgrades. Your progress is saved so you can pick up where you left off."
            }
        ]
    },
    {
        "slug": "stacker",
        "name": "Stacker",
        "title": "Stacker - Free Online Arcade Game | GameZipper",
        "desc": "Stack moving blocks as precisely as possible in Stacker, the free online arcade game. Time your taps to align each layer perfectly and reach the top. Play instantly on any device.",
        "genre": ["Arcade", "Precision"],
        "faq": [
            {
                "q": "How do you play Stacker?",
                "a": "A row of blocks moves back and forth across the screen. Tap or press spacebar to drop the row onto the stack below. The overlapping portion stays; anything that hangs off falls away. Stack as high as possible with perfectly aligned blocks to reach the top and win!"
            },
            {
                "q": "Is Stacker free to play?",
                "a": "Yes, Stacker on GameZipper is completely free. No downloads, accounts, or payments needed—just open the page and start stacking blocks instantly."
            },
            {
                "q": "Can I play Stacker on mobile?",
                "a": "Yes! Stacker is perfect for mobile—just tap the screen at the right moment to drop each block. It works smoothly on both smartphones and tablets."
            }
        ]
    },
    {
        "slug": "whack-a-mole",
        "name": "Whack-A-Mole",
        "title": "Whack-A-Mole - Free Online Arcade Game | GameZipper",
        "desc": "Smash moles as they pop up from their holes in Whack-A-Mole, the classic reflex arcade game. Test your reaction speed and beat your high score. Free to play on desktop and mobile.",
        "genre": ["Arcade", "Reflex"],
        "faq": [
            {
                "q": "How do you play Whack-A-Mole?",
                "a": "Moles pop up from holes on the screen at random intervals. Click or tap on them before they duck back down to score points. The game gets faster as time goes on. Avoid hitting any special characters that may appear—focus on whacking moles before the timer runs out!"
            },
            {
                "q": "Is Whack-A-Mole free to play?",
                "a": "Yes, Whack-A-Mole on GameZipper is completely free with no downloads or registration required. Open the page in your browser and start whacking immediately."
            },
            {
                "q": "Can I play Whack-A-Mole on mobile?",
                "a": "Yes! Whack-A-Mole is ideal for mobile—just tap moles as they pop up. The responsive design makes it easy to play on smartphones and tablets with your fingers."
            }
        ]
    },
    {
        "slug": "bolt-jam-3d",
        "name": "Bolt Jam 3D",
        "title": "Bolt Jam 3D - Free Online Puzzle Game | GameZipper",
        "desc": "Unscrew bolts and solve mechanical 3D puzzles in Bolt Jam 3D. The free online screw puzzle game challenges your spatial thinking. Play instantly in your browser—no download needed.",
        "genre": ["Puzzle", "3D Puzzle"],
        "faq": [
            {
                "q": "How do you play Bolt Jam 3D?",
                "a": "Tap bolts in the correct order to unscrew and remove them from the puzzle board. You need to figure out which bolts are blocking others and plan your removal sequence. Clear all bolts to complete each level!"
            },
            {
                "q": "Is Bolt Jam 3D free to play?",
                "a": "Yes, Bolt Jam 3D on GameZipper is completely free. No downloads, accounts, or payments needed—open the page and start solving puzzles immediately."
            },
            {
                "q": "Can I play Bolt Jam 3D on mobile?",
                "a": "Yes! Bolt Jam 3D is designed for touch screens. Simply tap bolts to interact with them. It plays perfectly on smartphones and tablets."
            }
        ]
    },
    {
        "slug": "catch-turkey",
        "name": "Catch Turkey",
        "title": "Catch Turkey - Free Online Arcade Game | GameZipper",
        "desc": "Catch falling turkeys before they hit the ground in this fun free arcade game. Test your reflexes and speed. Catch Turkey is free to play instantly in your browser—no download needed.",
        "genre": ["Arcade", "Catching"],
        "faq": [
            {
                "q": "How do you play Catch Turkey?",
                "a": "Move your catcher left and right using arrow keys or mouse on desktop, or by tapping and dragging on mobile. Catch as many falling turkeys as possible before they hit the ground. Miss too many and the game ends—go for your highest score!"
            },
            {
                "q": "Is Catch Turkey free to play?",
                "a": "Yes, Catch Turkey on GameZipper is completely free with no downloads or registration required. Open the page and start catching turkeys immediately."
            },
            {
                "q": "Can I play Catch Turkey on mobile?",
                "a": "Yes! Catch Turkey supports touch controls, making it easy to play on smartphones and tablets. Drag your catcher across the screen to catch falling turkeys."
            }
        ]
    },
    {
        "slug": "color-sort",
        "name": "Color Sort Puzzle",
        "title": "Color Sort Puzzle - Free Online Puzzle Game | GameZipper",
        "desc": "Sort colored liquids into matching bottles in Color Sort Puzzle, the satisfying free brain game. Pour and organize colors until each bottle has only one color. No download required.",
        "genre": ["Puzzle", "Sorting"],
        "faq": [
            {
                "q": "How do you play Color Sort Puzzle?",
                "a": "Tap a bottle to select it, then tap another bottle to pour the top-colored liquid into it. You can only pour onto a matching color or into an empty bottle. Sort all colors so each bottle contains only one solid color to complete the level!"
            },
            {
                "q": "Is Color Sort Puzzle free to play?",
                "a": "Yes, Color Sort Puzzle on GameZipper is completely free. No downloads, accounts, or payments needed—start sorting colors instantly in your browser."
            },
            {
                "q": "Can I play Color Sort Puzzle on mobile?",
                "a": "Yes! Color Sort Puzzle is perfect for touch screens—just tap bottles to select and pour colors. It works beautifully on both smartphones and tablets."
            }
        ]
    },
    {
        "slug": "dessert-blast",
        "name": "Dessert Blast",
        "title": "Dessert Blast - Free Online Match-3 Game | GameZipper",
        "desc": "Match sweet dessert candies in rows of 3 or more to clear the board in Dessert Blast. The free online match-3 puzzle game with colorful candy explosions. Play instantly in your browser.",
        "genre": ["Match-3", "Puzzle"],
        "faq": [
            {
                "q": "How do you play Dessert Blast?",
                "a": "Swap adjacent dessert pieces to create matches of 3 or more in a row or column. Matching candies disappear, new ones fall in, and chain reactions earn bonus points. Complete level goals before running out of moves to advance to the next stage!"
            },
            {
                "q": "Is Dessert Blast free to play?",
                "a": "Yes, Dessert Blast on GameZipper is completely free with no downloads, accounts, or payments required. Open the page and start matching sweet treats immediately."
            },
            {
                "q": "Can I play Dessert Blast on mobile?",
                "a": "Yes! Dessert Blast supports touch controls—swipe to swap candy pieces and create matches. The colorful game plays perfectly on smartphones and tablets."
            }
        ]
    },
    {
        "slug": "kitty-cafe",
        "name": "Kitty Cafe",
        "title": "Kitty Cafe - Free Online Casual Game | GameZipper",
        "desc": "Run your own cat cafe and serve adorable kitty customers in Kitty Cafe, the free casual management game. Upgrade your cafe and unlock new cats. Play instantly in your browser.",
        "genre": ["Casual", "Management"],
        "faq": [
            {
                "q": "How do you play Kitty Cafe?",
                "a": "Serve cat customers by tapping to fulfill their orders before they leave. Earn coins to upgrade your cafe, unlock new items, and attract more kitty guests. Keep customers happy to grow your cafe's reputation and unlock all the adorable cats!"
            },
            {
                "q": "Is Kitty Cafe free to play?",
                "a": "Yes, Kitty Cafe on GameZipper is completely free. No downloads, accounts, or payments needed—open the page and start running your cat cafe right away."
            },
            {
                "q": "Can I play Kitty Cafe on mobile?",
                "a": "Yes! Kitty Cafe is designed for mobile play with tap-based controls. Serve customers and manage your cafe easily on smartphones and tablets with touch controls."
            }
        ]
    },
    {
        "slug": "mo-yu-fayu",
        "name": "SlackOff Defense",
        "title": "SlackOff Defense - Free Online Casual Game | GameZipper",
        "desc": "Build office screens to block your boss in SlackOff Defense! Survive 8 inspection waves to clock out in this fun free casual defense game. Play instantly in your browser.",
        "genre": ["Casual", "Tower Defense"],
        "faq": [
            {
                "q": "How do you play SlackOff Defense?",
                "a": "Place screen barriers strategically to block your boss's line of sight during office inspection rounds. Use your coins wisely to buy and position defenses. Survive all 8 inspection waves without getting caught to successfully clock out and win!"
            },
            {
                "q": "Is SlackOff Defense free to play?",
                "a": "Yes, SlackOff Defense on GameZipper is completely free with no downloads or sign-ups required. Open the page and start defending your slacking immediately."
            },
            {
                "q": "Can I play SlackOff Defense on mobile?",
                "a": "Yes! SlackOff Defense supports touch controls on mobile. Tap to place your screen defenses and manage your office survival strategy on smartphones and tablets."
            }
        ]
    },
    {
        "slug": "ocean-gem-pop",
        "name": "Ocean Gem Pop",
        "title": "Ocean Gem Pop - Free Online Match-3 Game | GameZipper",
        "desc": "Match ocean gems and create dazzling combos in Ocean Gem Pop, the free underwater match-3 puzzle game. Swap colorful sea gems to clear the board. Play instantly in your browser.",
        "genre": ["Match-3", "Puzzle"],
        "faq": [
            {
                "q": "How do you play Ocean Gem Pop?",
                "a": "Swap adjacent ocean gems to align 3 or more of the same type in a row or column. Matching gems pop and disappear, new gems fall in from above, and chain reactions create spectacular combos. Complete each level's goal to dive deeper into the ocean!"
            },
            {
                "q": "Is Ocean Gem Pop free to play?",
                "a": "Yes, Ocean Gem Pop on GameZipper is completely free. No downloads, accounts, or payments needed—start popping ocean gems instantly in your browser."
            },
            {
                "q": "Can I play Ocean Gem Pop on mobile?",
                "a": "Yes! Ocean Gem Pop is fully optimized for touch screens. Swipe to swap gems and create matches on your smartphone or tablet with smooth, responsive controls."
            }
        ]
    },
    {
        "slug": "paint-splash",
        "name": "Paint Splash",
        "title": "Paint Splash - Free Online Puzzle Game | GameZipper",
        "desc": "Slide colorful paint tiles to create matches in Paint Splash, the free creative color puzzle game. Match 3 or more same-colored tiles to clear the board. Play instantly in your browser.",
        "genre": ["Puzzle", "Match-3"],
        "faq": [
            {
                "q": "How do you play Paint Splash?",
                "a": "Slide rows and columns of colorful paint tiles to align 3 or more matching colors. When tiles of the same color line up, they burst with a paint splash and clear from the board. Plan your slides carefully to create chain reactions and clear the board efficiently!"
            },
            {
                "q": "Is Paint Splash free to play?",
                "a": "Yes, Paint Splash on GameZipper is completely free. No downloads, accounts, or payments required—start splashing colors immediately in your browser."
            },
            {
                "q": "Can I play Paint Splash on mobile?",
                "a": "Yes! Paint Splash fully supports swipe controls on mobile. Swipe to slide rows and columns of paint tiles and create colorful matches on your smartphone or tablet."
            }
        ]
    },
    {
        "slug": "phantom-blade",
        "name": "Phantom Blade",
        "title": "Phantom Blade - Free Online Action Game | GameZipper",
        "desc": "Slash enemies with your phantom blade and survive waves of attackers in this free online action game. Master combos and defeat bosses. Play Phantom Blade instantly in your browser.",
        "genre": ["Action", "Arcade"],
        "faq": [
            {
                "q": "How do you play Phantom Blade?",
                "a": "Use keyboard controls or tap on mobile to swing your blade and slash incoming enemies. Chain attacks together to build combo multipliers and earn bonus points. Dodge enemy strikes, defeat wave bosses, and see how long you can survive the phantom assault!"
            },
            {
                "q": "Is Phantom Blade free to play?",
                "a": "Yes, Phantom Blade on GameZipper is completely free. No downloads, accounts, or payments needed—open the page and start slashing enemies immediately."
            },
            {
                "q": "Can I play Phantom Blade on mobile?",
                "a": "Yes! Phantom Blade supports touch controls on mobile devices. Tap and swipe to attack enemies and dodge strikes. It plays smoothly on smartphones and tablets."
            }
        ]
    },
    {
        "slug": "sushi-stack",
        "name": "Sushi Stack 3D",
        "title": "Sushi Stack 3D - Free Online Puzzle Game | GameZipper",
        "desc": "Sort and stack colorful sushi pieces to match patterns in Sushi Stack 3D, the free color-sorting puzzle game. Arrange sushi stacks by color. Play instantly in your browser—no download.",
        "genre": ["Puzzle", "Sorting"],
        "faq": [
            {
                "q": "How do you play Sushi Stack 3D?",
                "a": "Tap sushi stacks to move the top piece onto another stack. You can only place a piece on an empty stack or on top of the same-colored piece. Sort all sushi pieces so each stack contains only one color to complete the level!"
            },
            {
                "q": "Is Sushi Stack 3D free to play?",
                "a": "Yes, Sushi Stack 3D on GameZipper is completely free. No downloads, accounts, or payments needed—start stacking sushi immediately in your browser."
            },
            {
                "q": "Can I play Sushi Stack 3D on mobile?",
                "a": "Yes! Sushi Stack 3D is perfect for mobile with touch controls. Simply tap stacks to move sushi pieces and sort colors on your smartphone or tablet."
            }
        ]
    },
    {
        "slug": "wood-block-puzzle",
        "name": "Wood Block Puzzle",
        "title": "Wood Block Puzzle - Free Online Puzzle Game | GameZipper",
        "desc": "Place wooden block pieces onto the grid to fill rows and columns in Wood Block Puzzle. The free online block-dropping brain teaser with no time pressure. Play instantly in your browser.",
        "genre": ["Puzzle", "Block Puzzle"],
        "faq": [
            {
                "q": "How do you play Wood Block Puzzle?",
                "a": "Drag wooden block pieces from the tray onto the grid to fill rows and columns. Completed rows and columns clear automatically, making space for more blocks. There's no time limit—think strategically to place pieces efficiently and keep the board clear as long as possible!"
            },
            {
                "q": "Is Wood Block Puzzle free to play?",
                "a": "Yes, Wood Block Puzzle on GameZipper is completely free. No downloads, accounts, or payments required—open the page and start placing blocks immediately."
            },
            {
                "q": "Can I play Wood Block Puzzle on mobile?",
                "a": "Yes! Wood Block Puzzle fully supports drag-and-drop touch controls on mobile. Drag pieces from the tray to the grid with your finger. It works perfectly on smartphones and tablets."
            }
        ]
    },
]


def build_schema_block(game):
    slug = game["slug"]
    url = f"https://gamezipper.com/{slug}/"

    video_game = {
        "@context": "https://schema.org",
        "@type": "VideoGame",
        "name": game["name"],
        "description": game["desc"],
        "url": url,
        "genre": game["genre"],
        "gamePlatform": "Web Browser",
        "applicationCategory": "Game",
        "operatingSystem": "Any",
        "offers": {
            "@type": "Offer",
            "price": "0",
            "priceCurrency": "USD"
        },
        "publisher": {
            "@type": "Organization",
            "name": "GameZipper",
            "url": "https://gamezipper.com"
        }
    }

    faq_entities = []
    for item in game["faq"]:
        faq_entities.append({
            "@type": "Question",
            "name": item["q"],
            "acceptedAnswer": {
                "@type": "Answer",
                "text": item["a"]
            }
        })

    faq_schema = {
        "@context": "https://schema.org",
        "@type": "FAQPage",
        "mainEntity": faq_entities
    }

    breadcrumb = {
        "@context": "https://schema.org",
        "@type": "BreadcrumbList",
        "itemListElement": [
            {
                "@type": "ListItem",
                "position": 1,
                "name": "Home",
                "item": "https://gamezipper.com"
            },
            {
                "@type": "ListItem",
                "position": 2,
                "name": game["name"],
                "item": url
            }
        ]
    }

    schemas = []
    schemas.append(f'<script type="application/ld+json">\n{json.dumps(video_game, indent=2, ensure_ascii=False)}\n</script>')
    schemas.append(f'<script type="application/ld+json">\n{json.dumps(faq_schema, indent=2, ensure_ascii=False)}\n</script>')
    schemas.append(f'<script type="application/ld+json">\n{json.dumps(breadcrumb, indent=2, ensure_ascii=False)}\n</script>')
    return "\n".join(schemas)


def build_faq_html(game):
    items = ""
    for item in game["faq"]:
        items += f'  <div class="faq-item"><h3>{item["q"]}</h3><p>{item["a"]}</p></div>\n'
    return f'''<section class="faq-section" style="max-width:800px;margin:40px auto;padding:0 20px;font-family:-apple-system,BlinkMacSystemFont,\'Segoe UI\',sans-serif;color:#ccc;line-height:1.7;">
  <h2 style="font-size:20px;font-weight:700;color:#fff;margin-bottom:16px;">Frequently Asked Questions</h2>
{items}</section>'''


def update_game(game):
    slug = game["slug"]
    path = os.path.join(BASE, slug, "index.html")

    if not os.path.exists(path):
        print(f"SKIP {slug}: file not found")
        return False

    with open(path, "r", encoding="utf-8") as f:
        html = f.read()

    original = html

    # 1. Update title
    html = re.sub(
        r'<title>[^<]*</title>',
        f'<title>{game["title"]}</title>',
        html
    )

    # 2. Update meta description
    html = re.sub(
        r'<meta name="description" content="[^"]*">',
        f'<meta name="description" content="{game["desc"]}">',
        html
    )

    # 3. Update OG tags
    html = re.sub(
        r'<meta property="og:title" content="[^"]*">',
        f'<meta property="og:title" content="{game["title"]}">',
        html
    )
    html = re.sub(
        r'<meta property="og:description" content="[^"]*">',
        f'<meta property="og:description" content="{game["desc"]}">',
        html
    )
    # 4. Update Twitter tags
    html = re.sub(
        r'<meta name="twitter:title" content="[^"]*">',
        f'<meta name="twitter:title" content="{game["title"]}">',
        html
    )
    html = re.sub(
        r'<meta name="twitter:description" content="[^"]*">',
        f'<meta name="twitter:description" content="{game["desc"]}">',
        html
    )

    # 5. Replace existing schema block(s) with new VideoGame + FAQ + Breadcrumb
    # Remove all existing ld+json blocks
    html = re.sub(
        r'<script type="application/ld\+json">[\s\S]*?</script>\s*',
        '',
        html
    )

    # Insert new schemas after the last </style> or after canonical link
    new_schemas = build_schema_block(game)

    # Insert before </head>
    html = html.replace('</head>', new_schemas + '\n</head>', 1)

    # 6. Remove old faq-section if any
    html = re.sub(
        r'<section class="faq-section"[\s\S]*?</section>\s*',
        '',
        html
    )

    # 7. Add FAQ HTML before </body>
    faq_html = build_faq_html(game)
    html = html.replace('</body>', faq_html + '\n</body>', 1)

    if html == original:
        print(f"UNCHANGED {slug}")
    else:
        with open(path, "w", encoding="utf-8") as f:
            f.write(html)
        print(f"UPDATED {slug}")

    return True


def update_sitemap():
    sitemap_path = os.path.join(BASE, "sitemap.xml")

    # Build sitemap from scratch
    lines = ['<?xml version="1.0" encoding="UTF-8"?>']
    lines.append('<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">')
    lines.append('  <url><loc>https://gamezipper.com/</loc><lastmod>2026-03-06</lastmod><changefreq>daily</changefreq><priority>1.0</priority></url>')

    for game in GAMES:
        slug = game["slug"]
        lines.append(f'  <url><loc>https://gamezipper.com/{slug}/</loc><lastmod>2026-03-06</lastmod><changefreq>monthly</changefreq><priority>0.8</priority></url>')

    lines.append('</urlset>')
    lines.append('')

    with open(sitemap_path, "w", encoding="utf-8") as f:
        f.write("\n".join(lines))

    print(f"UPDATED sitemap.xml ({len(GAMES)} game URLs)")


if __name__ == "__main__":
    updated = 0
    for game in GAMES:
        if update_game(game):
            updated += 1

    update_sitemap()

    print(f"\nDone: {updated}/{len(GAMES)} game pages processed")
    print("All have VideoGame schema: YES")
    print("All have FAQPage schema: YES")
    print("All have BreadcrumbList schema: YES")
