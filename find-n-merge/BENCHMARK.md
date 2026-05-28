# Find N Merge — Competitive Benchmark

## Target Game
- **Slug**: find-n-merge
- **Type**: Hidden Object + Merge Puzzle Hybrid
- **Concept**: Find hidden objects in cluttered scenes, then merge 3 matching items to create higher-tier items

## Top Competitors

### 1. Merge Treasure Hunt (Lucky Spin Games)
- **Platform**: Android, iOS, Web
- **Core**: Travel adventure + find antiques + merge relics
- **Features**: Story-driven, world locations, cat helper, artifact sets
- **Monetization**: Free + ads

### 2. Hidden Merge Puzzle (Ninova Games)
- **Platform**: Android, iOS
- **Core**: Discover hidden objects + merge to restore color
- **Features**: Time-based challenges, color restoration theme
- **Monetization**: Free + ads

### 3. Find N Merge (ELECTRA GAMES)
- **Platform**: iOS, TapTap
- **Core**: Place identical items adjacent, merge 3 to progress
- **Features**: Clean visuals, standard merge mechanics
- **Monetization**: Free + ads

## Key Systems to Implement
1. **Hidden Object Finding**: Items hidden in cluttered scenes, tap to collect
2. **Merge Tray**: Bottom tray holds found items, merge 3 identical = 1 upgraded
3. **Merge Chain**: 3-tier merge (basic → mid → advanced → final goal)
4. **30 Levels**: 6 categories x 5 levels each
5. **Hint System**: Highlight hidden items (limited uses)
6. **Score + Stars**: Time bonus, merge combo multiplier
7. **Progress Save**: localStorage with level unlock

## Design Decisions
- Browser-first (Canvas), no story/narrative (casual quick sessions)
- Merge chain: 3 identical → 1 next tier (like 2048 but with objects)
- Each level has a goal: merge X final-tier items
- Categories: Kitchen, Garden, Ocean, Space, Candy, Animals
- Visual: Dark neon GameZipper style, NOT the colorful mobile aesthetic
