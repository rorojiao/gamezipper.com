# Trivia Crack — Competitive Benchmark

## Overview
Trivia Crack is the world's #1 trivia game with 100M+ downloads. Players spin a wheel to answer questions across 6 categories, competing against AI or other players to collect all 6 character crowns.

## Top Competitors

### 1. Trivia Crack (Etermax)
- **Downloads:** 100M+ on Google Play, 500M+ total (all platforms)
- **Mechanics:** Spin wheel → 6 categories → answer Q → collect crowns → win
- **Categories:** Art, Science, Sports, Entertainment, Geography, History
- **Features:** vs AI, vs friends, daily challenges, chat, item power-ups, leagues
- **Monetization:** Ads between turns, premium currency for power-ups

### 2. Trivia Crack 2 (Etermax)
- **Downloads:** 10M+
- **Upgrades:** Better graphics, new game modes (Tower Duel, Missions)
- **Key addition:** Real-time multiplayer, streak bonuses

### 3. QuizUp (defunct but influential)
- **Downloads:** 50M+ (peak)
- **Mechanics:** Category-specific rooms, real-time PvP
- **Best feature:** Deep category specialization (700+ topics)

### 4. Jeopardy! (Sony)
- **Downloads:** 10M+
- **Mechanics:** Clues → answers in question form → daily doubles
- **Best feature:** Classic TV format, daily puzzle

## Key Systems to Implement

### Core Loop
1. **Spin the wheel** → lands on a category (or "Crown" for stealing a crown)
2. **Answer question** → correct = keep turn + earn character if crown slot
3. **Win condition:** Collect all 6 characters before opponent
4. **Opponent AI:** Variable difficulty (easy/medium/hard)

### Categories (6)
Each with distinct icon and color:
- 🎨 Art (purple)
- 🔬 Science (green)
- ⚽ Sports (orange)
- 🎬 Entertainment (pink)
- 🌍 Geography (blue)
- 📜 History (yellow)

### Question Database
- **Target:** 200+ questions (30+ per category) — more than enough for fun gameplay
- **Format:** Multiple choice (4 options, 1 correct)
- **Difficulty:** Easy to medium for broad appeal

### Scoring & Progression
- Points per correct answer (streak bonus for consecutive correct)
- Win/loss record
- Statistics: total games, win rate, best streak, per-category accuracy

### Power-ups (optional, adds depth)
- 50/50: Remove 2 wrong answers
- Extra time: +15 seconds
- Skip: Pass the question

### Game Modes
1. **vs AI** (Easy/Medium/Hard) — main mode
2. **Solo Practice** — endless questions, no opponent
3. **Daily Challenge** — special themed questions

## Technical Requirements for GZ
- Single-file HTML5, Canvas rendering
- Question data embedded in JS (array of objects)
- Dark neon theme consistent with GZ aesthetic
- Touch-friendly wheel spin (tap to spin with animation)
- 10-second timer per question
- Sound effects (correct/wrong/timeout/spin)
- localStorage for stats and progress
- Web Audio API for all sounds
- Mobile responsive
