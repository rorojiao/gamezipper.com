# BENCHMARK.md — Happy Glass

## Core Mechanics
- Draw freehand lines that become solid physics objects
- Water flows from a fixed faucet/spout
- Guide water into a glass with a face (sad→happy)
- Limited ink (line length constraint)
- 1-3 stars based on ink efficiency

## Competitors
- Happy Glass (Lion Studios) - 100M+ downloads, original
- Love Balls (Lion Studios) - draw lines to connect balls
- Where's My Water? (Disney) - dig through dirt
- Fill The Glass (Game5Mobile) - clone

## Key Systems to Implement
1. Physics-based drawing (lines become static colliders)
2. Water particle simulation (50-200 small circles with gravity)
3. Glass fill detection (count particles in glass bounds)
4. Ink meter + star scoring (ink efficiency)
5. Glass face animation (sad/neutral/happy)
6. 30+ levels with progressive difficulty
7. Hints system
8. Level select with star tracking
9. Progress save (localStorage)
10. Tutorial (first 3 levels guided)

## Level Design
- Tutorial (1-5): Direct path, short lines needed
- Easy (6-15): Angles, offsets, ramps
- Medium (16-25): Obstacles, platforms, moving parts
- Hard (26-35): Complex routing, multiple obstacles

## Visual Style
- Clean minimalist, child-friendly
- White/light background, blue water, transparent glass
- Pencil-style drawn lines
- Glass has cute face (sad→happy)
- Dark GameZipper theme variant

