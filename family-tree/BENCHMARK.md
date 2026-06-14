# Family Tree Logic Puzzle — Competitor Benchmark

## Selected Game
**Family Tree** — deductive logic puzzle (Lion Studios "Family Tree! - Logic Puzzles" clone)
Slug: `/family-tree/` | Category: puzzle

## Why This Game (Score 20/25)
- D (Market): 10M+ downloads, 4.6★, #1 logic puzzle on Poki → 4
- S (SEO): "family tree puzzle", "logic deduction game" — zero GZ coverage → 4
- R (Retention): 500+ levels, daily puzzles, high brain-teaser replayability → 4
- F (Feasibility): Clue list + tree grid, Canvas doable, moderate deduction engine → 4
- Z (Zero-overlap): Distinct from einstein-riddle/who-is (tree-placement mechanic) → 4

## Primary Competitor
| Attribute | Value |
|---|---|
| Title | Family Tree! - Logic Puzzles |
| Developer | Lion Studios Plus (AppLovin) |
| Downloads | 10,000,000+ (Google Play) |
| Rating | 4.6★ / ~45,600 reviews |
| Levels | 500+ across 16 chapters |

## Core Mechanic
Deductive logic puzzle as genealogy reconstruction:
1. Partially-filled family tree diagram with empty slots
2. Character portrait tiles in a scrollable tray at bottom
3. Text clues displayed below tree
4. Player drags-and-drops tiles into correct slots
5. Correct → locks in with animation; Wrong → lose 1 heart
6. Win when all nodes correctly filled

## Tree Structure Rules
- Married couples connected horizontally (side by side)
- Children connected vertically below parents
- Siblings share the same parent node
- Trees span multiple generations
- Age-ordering: oldest child on the left

## Clue Types (Must Support All)
1. **Direct**: "Mary is John's daughter"
2. **Marriage**: "Quincy is married to Dorsey"; "Jason is married to a doctor" (profession)
3. **Sibling**: "Alex is the only child of Sarah"; "Willie has 2 big sisters"
4. **Age**: "Joe is older than Missy"; "Ben is the older twin"
5. **Step/blended**: "Zachary's step-father is Randy"
6. **Negation/exclusion**: "James is an only child"; "X is not married to A"
7. **Chained**: "John's only brother is the father of Sarah"

## Difficulty Tiers
| Tier | Levels | Characters | Notes |
|---|---|---|---|
| Beginner | 1-10 | 4-6 | Simple parent-child + marriage |
| Easy | 11-20 | 6-8 | Add siblings, age ordering |
| Intermediate | 21-30 | 8-12 | Multi-generation, step-families, exclusion |
| Expert | 31-40 | 10-15 | Chained deductions, cousins, in-laws |

## Systems to Implement (P0 — required)
- Family tree diagram with empty/filled nodes
- Drag-and-drop placement (mouse + touch, pointer events)
- Text clue system (all clue types above)
- Hearts system (3 hearts, -1 on wrong placement)
- Level progression + level map/select
- 40+ handcrafted puzzles (min 20, target 40)
- Correct/wrong feedback (shake + particles)
- Level complete celebration (confetti)
- LocalStorage progress save (with version field)
- Star rating (0-3 based on hearts remaining)
- Hint system (auto-place one correct tile, limited per level)
- Tutorial overlay (skippable) for first play
- Procedural BGM (Web Audio API)
- SFX: correct, wrong, place, complete, button
- Mobile + desktop responsive (portrait primary)
- ALL English UI

## Art Direction
- Flat cartoon avatars via CSS/emoji (👨👩👴👵👦👧)
- Color-coded nodes: blue=male, pink=female
- Connection lines: solid lines between connected nodes
- Portrait orientation mobile; landscape desktop
- Soft gradient background (GameZipper dark style with warm accents)
- Large readable text (competitor complaint: small text)

## Differentiators from Competitor (Opportunity)
1. Far fewer ads (competitor #1 complaint = excessive ads)
2. Meaningful star/coin economy (competitor coins worthless)
3. Hand-crafted unique puzzles (competitor repetitive)
4. Large readable UI (competitor text too small)
5. Complete shipped content (no "Coming Soon" walls)

## Puzzle Data Structure
```js
{
  id, difficulty, characters: [{id,name,gender,age,profession}],
  nodes: [{id, type:'slot', expectsGender}],
  edges: [{type:'marriage'|'parent', from, to}],
  clues: [{id, text, type, involves:[], determines:[nodeId]}],
  solution: {nodeId: characterId}
}
```
