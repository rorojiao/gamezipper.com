# Build A Queen — Competitive Benchmark

## Competitor Analysis

### 1. Build A Queen (Supersonic Studios)
- **Downloads**: 100M+, 4.2★ on Google Play
- **Core Mechanic**: Swipe-based runner collecting fashion items (dress, shoes, accessories, hair) on a catwalk. Avoid wrong items. End with a catwalk showdown against an opponent.
- **Level Design**: Infinite procedurally generated levels, 25-60 seconds per level
- **Scoring**: +10-50 per correct item, -10-30 for wrong items, +200 perfect bonus
- **Star System**: 1★ at 40%, 2★ at 70%, 3★ at 90% of max score
- **Economy**: 10-50 coins/level, items cost 50-500 coins in shop
- **Systems**: Doll-maker customization, daily rewards, outfit collection, catwalk finale with AI opponent
- **Art**: Pastel pinks/purples, chibi proportions, sparkle particles, gradient backgrounds
- **Audio**: 120-130 BPM synth pop BGM, procedural collection sounds

### 2. Fashion Queen: Dress Up Game (CASUAL AZUR GAMES)
- **Downloads**: 50M+, 4.5★
- **Core Mechanic**: Strategic dress-up with judge preferences, weather conditions, catwalk scoring
- **Key Differentiator**: Judge preference system (elegant, casual, sporty themes)
- **Systems**: Weather-themed levels, unlock wardrobe, fashion scores, daily challenges

### 3. Bride Race: Makeup, Dress Up (Fried Chicken Games)
- **Downloads**: 10M+, 4.3★
- **Core Mechanic**: Wedding-themed runner with body mechanics, collect items to transform
- **Key Differentiator**: Body transformation (thin/fat), cultural wedding themes
- **Systems**: Multiple wedding themes, groom selection, photo mode

### 4. Fashion Battle - Dress Up Game (Apps Mobile Games)
- **Core Mechanic**: Head-to-head fashion battle format
- **Key Differentiator**: Real-time opponent comparison
- **Systems**: Tournament mode, outfit rating, social sharing

### 5. Build a Doll (Fried Chicken Games)
- **Downloads**: 10M+, 4.3★
- **Core Mechanic**: Direct Build A Queen clone with doll aesthetic
- **Systems**: Doll customization, outfit collection, runner mechanics

## Market Gap
- **Build A Queen is NOT available on any web portal** (CrazyGames 404, Poki 404)
- Clear opportunity for gamezipper.com to capture this audience

## Our Implementation Plan

### Core Loop
1. Start with theme description (e.g., "Elegant Night Out", "Beach Party", "Wedding")
2. Run along a 3-lane track collecting fashion items matching the theme
3. Avoid wrong items (incorrect color/style/theme)
4. Catwalk finale — score based on outfit completeness and accuracy
5. Star rating → coins → unlock new outfits/accessories

### Systems to Implement
- **25+ levels** with progressive difficulty
- **Scoring**: +15 per correct item, -10 for wrong, combo multiplier, +100 perfect bonus
- **Star rating**: 1★ (50%), 2★ (75%), 3★ (95%)
- **Coin economy**: 20-80 coins per level, spend on cosmetic upgrades
- **Combo system**: Consecutive correct picks increase multiplier (x2, x3, x4)
- **Tutorial**: First 2 levels guided
- **Progress save**: localStorage with version
- **Achievement system**: "Fashionista" (10 3-stars), "Speed Queen" (under 30s), etc.
- **Daily challenge**: Special themed level

### Art Style
- Dark gradient backgrounds with neon accents (GameZipper style)
- Chibi-proportioned character
- Sparkle particle effects on correct collection
- Screen shake on wrong collection
- Celebration animation on catwalk finish
- Pastel color palette for fashion items

### Audio
- BGM: 120 BPM synth pop loop (Web Audio API)
- SFX: Collection ding, wrong buzzer, combo chime, star celebration, button click

### Level Themes (25+)
1. Casual Day, 2. Office Look, 3. Beach Party, 4. Elegant Night, 5. Sporty Style
6. Wedding, 7. Rock Star, 8. Winter Wonderland, 9. Garden Party, 10. Red Carpet
11. Festival Fun, 12. Cozy Autumn, 13. Tropical Vacation, 14. Prom Night, 15. Street Style
16. Royal Ball, 17. Halloween Costume, 18. Summer Camp, 19. Business Meeting, 20. Date Night
21. Music Festival, 22. Ski Trip, 23. Tea Party, 24. Carnival, 25. Hollywood Premiere
