# BENCHMARK.md — Akinator-Style Mind-Reading Game

## 1. Game Overview

**Project:** GameZipper Akinator Clone
**Type:** Single-file HTML5 Browser Game
**Genre:** Inductive Reasoning / 20 Questions
**Target Platform:** GameZipper.com (desktop + mobile browser)

Akinator-style games are web-based inductive reasoning games where an AI attempts to guess a character, object, or animal the player is thinking of by asking a series of Yes/No/Maybe questions. The game narrows down a knowledge base through binary (or multi-choice) decision tree traversal, similar to a binary search algorithm. The genre traces its roots to the classic parlor game "Twenty Questions" and was popularized in digital form by Akinator (2007, Elokence) and 20Q (the electronic handheld toy brought online).

---

## 2. Core Mechanism Analysis

### 2.1 Game Loop
1. Player thinks of a character (real or fictional, human or animal)
2. AI asks a series of questions with answer options: **Yes / No / Probably / Probably Not / Don't Know**
3. Each answer narrows the candidate set
4. AI eventually makes a guess
5. Player confirms or denies
6. On wrong guess: recovery flow adds the missed character to the knowledge base

### 2.2 Information Theory Foundation
- 20 binary (Yes/No) questions can uniquely identify 2^20 = 1,048,576 candidates
- Optimal question strategy splits the remaining candidate set roughly in half each time (binary search principle)
- Shannon entropy is used to measure the "information gain" of each potential question
- Questions with answers closer to 50/50 split provide maximum information gain

### 2.3 Algorithm Classification
Akinator and 20Q operate as **statistical classifiers** or **expert systems**, not simple binary trees. The key differences:

| Algorithm | Description | Pros | Cons |
|---|---|---|---|
| Binary Decision Tree | Fixed tree, each question leads to two branches | Simple, fast | Inflexible, poor question ordering |
| Weighted Probability (Akinator-style) | Each candidate has a probability score updated after each answer | Learns from data, adaptive | More complex, requires training |
| Naive Bayes Classifier | Calculates P(candidate\|answers) using Bayes' theorem | Handles uncertain answers naturally | Assumes answer independence |
| Information Gain (Entropy-based) | Selects question that maximizes expected entropy reduction | Theoretically optimal for decision making | Computationally intensive for large KB |

**Reference:** Akinator uses a proprietary algorithm called "Limule" (Elokence). 20Q uses a learning neural network trained on millions of plays. Both are forms of **weighted probability narrowing** rather than a strict binary decision tree.

### 2.4 Answer Types and Weighting
Akinator's 5-answer system (Yes / No / Probably / Probably Not / Don't Know) maps to numerical weights:
- **Yes** = +1.0
- **Probably** = +0.5
- **Don't Know** = 0.0
- **Probably Not** = -0.5
- **No** = -1.0

Each candidate character has pre-assigned attribute values for each question. The weighted sum determines candidate probability after each answer.

---

## 3. Competitive Analysis

### 3.1 Akinator (akinator.com)

**Overview:** The category-defining game, launched August 2007 by French studio Elokence.

| Feature | Details |
|---|---|
| Platform | Web, iOS, Android, Fire OS, Windows Phone |
| Knowledge Base | ~10,000+ characters (real + fictional), growing via user submissions |
| Questions per round | Max 25; auto-guesses when 1 candidate remains |
| Answer options | Yes, No, Probably, Probably Not, Don't Know |
| Recovery flow | After 3 wrong guesses, prompts user to name the character |
| Character learning | Users can submit new characters with Q&A pairs |
| Themes | Characters, Animals, Objects |
| Algorithm | Limule (proprietary, internal) — learns from aggregate player data |
| Recognition | 10M+ players, viral popularity |

**Strengths:** Massive KB, proven engagement, polished UI, strong brand.
**Weaknesses:** Heavy server dependency, no offline play, no single-file HTML5 version.

### 3.2 20Q (20q.net)

**Overview:** The original electronic handheld toy (by Techno Source, distributed by Mattel) brought online. The game has been available since the early 2000s.

| Feature | Details |
|---|---|
| Platform | Web, mobile web, handheld electronic version |
| Knowledge Base | ~10^6 concepts; themed versions ( Simpsons, Harry Potter, Star Wars, Doctor Who) |
| Questions per round | 20 (classic mode) |
| Answer options | Yes, No, Maybe, Unknown (sometimes "Probably") |
| Algorithm | Neural network — learns and adapts answers based on collective player base |
| Character learning | New items added through crowd-sourced corrections |
| Versions | 20Q Classics, 20Q Sports, 20Q Music, 20Q Movies, 20Q Disney, 20Q Harry Potter |

**Strengths:** Original brand, strong licensing (Harry Potter, Simpsons, etc.), adaptive learning.
**Weaknesses:** Dated web UI, less polished than Akinator, no single-file HTML5.

### 3.3 Guess Who? (SilverGames / Various)

**Overview:** Browser-based adaptation of the classic Milton Bradley board game. Two-player asymmetric guessing.

| Feature | Details |
|---|---|
| Platform | Browser (SilverGames, CrazyGames, etc.) |
| Knowledge Base | 24 fixed characters with attribute cards |
| Questions per round | Unlimited; first to guess wins |
| Answer options | Yes/No (binary) |
| Multiplayer | Real-time 2-player online |
| Character attributes | Name, gender, hair color, hair style, facial hair, glasses, hats, mustache, etc. |

**Strengths:** Classic brand recognition, fun social gameplay, simple to implement.
**Weaknesses:** Not single-player vs AI, limited KB (24 fixed characters), no learning.

### 3.4 Other Guessing Games on Game Platforms

Listed on SilverGames under "Guessing Games":
- **Guess the Kitty** — guess the cat breed
- **Logo Quiz** — guess the brand from logo
- **Guess The Flag** — geography quiz
- **Who Wants to Be a Millionaire?** — trivia with lifelines
- **Wheel of Fortune Quiz** — word puzzle trivia
- **That's Not My Neighbor** — identify the imposter

These are trivia/quiz games, not inductive reasoning games. They differ fundamentally from Akinator.

---

## 4. Feature Matrix

| Feature | Akinator | 20Q | Guess Who | GameZipper Target |
|---|---|---|---|---|
| Single-player AI mode | YES | YES | NO | YES |
| Multiplayer mode | NO | NO | YES | NO |
| Question pool (pre-defined) | YES | YES | YES (fixed attributes) | YES |
| Dynamic question generation | NO | NO | NO | NO |
| Probability-based narrowing | YES | YES | NO (binary elimination) | YES |
| Character learning (user adds new) | YES | YES | NO | YES (localStorage) |
| "I was wrong" recovery | YES | YES | N/A | YES |
| Scoring system | Partial | Partial | WIN/LOSE | YES |
| Achievement system | NO | Limited | NO | YES |
| Theme categories | YES | YES | NO | YES (Characters, Animals) |
| Answer options (5-type) | YES | YES (4-type) | NO (binary) | YES |
| Mobile responsive | YES | YES | YES | YES |
| Offline-capable (no server) | NO | NO | YES | YES (localStorage) |
| Single HTML file | NO | NO | N/A | YES |
| Dark neon theme | NO | NO | NO | YES |

---

## 5. Recommended Feature Set for GameZipper Clone

### 5.1 Must-Have (MVP)
1. **Pre-defined Knowledge Base** — 100+ characters with attributes stored as JSON in the HTML file
2. **5-Answer System** — Yes / No / Probably / Probably Not / Don't Know
3. **Entropy-Based Question Selection** — Maximize information gain at each step
4. **Character Guessing Flow** — AI guesses when confident enough or after 20 questions
5. **"I was wrong" Recovery** — Prompt user to name the correct character, add to localStorage KB
6. **Score Tracking** — Questions asked, win/loss record, streak counter
7. **Dark Neon GameZipper Theme** — Canvas/DOM hybrid rendering
8. **Web Audio API Sounds** — Feedback sounds for answers and guesses

### 5.2 Should-Have (Polish)
1. **Character Categories** — "Characters" and "Animals" tabs
2. **Achievement System** — "First Win", "10 Win Streak", "Perfect 20" (win in 20 questions or fewer)
3. **High Score Board** — Best streak, fewest questions to win
4. **localStorage Persistence** — Save progress, learned characters, statistics
5. **Progress Indicator** — Visual narrowing bar showing candidates remaining
6. **Hint System** — After 15+ wrong guesses, reveal a hint (category narrowing)

### 5.3 Nice-to-Have (Future)
1. **Multiple difficulty levels** — Easy (more obvious questions), Hard (obscure attributes)
2. **Timed mode** — Score bonus for fast answers
3. **Daily challenge** — Featured character of the day
4. **Share results** — Generate shareable result card

---

## 6. Technical Approach

### 6.1 Single-File HTML5 Architecture

```
index.html
├── <style>        — All CSS (dark neon GameZipper theme)
├── <script>       — Game logic (no external dependencies)
│   ├── KB         — Knowledge base (100+ characters as JS object)
│   ├── Engine     — Question selection + narrowing algorithm
│   ├── UI         — DOM manipulation + Canvas elements
│   └── Audio      — Web Audio API sound effects
└── <body>         — Minimal HTML structure
```

**No external dependencies** — no CDN scripts, no external fonts, no images (inline SVG only).

### 6.2 Rendering Approach
- **DOM hybrid** — HTML elements for buttons, text, containers
- **Canvas** — Used only for animated background effects (particle field / grid)
- **CSS transitions** — Smooth answer button interactions
- **Viewport meta** — `width=device-width, initial-scale=1.0` for mobile

### 6.3 State Management
```javascript
const gameState = {
  phase: 'start' | 'playing' | 'guessing' | 'wrong' | 'learn' | 'result',
  currentCharacter: null,       // secretly chosen character
  candidates: [...],            // remaining candidates
  questionHistory: [],          // [{q, a}] for undo/history
  questionsAsked: 0,
  wrongGuesses: 0,
  score: { wins: 0, losses: 0, streak: 0, bestStreak: 0 },
  learnedCharacters: [],       // from localStorage
  theme: 'characters' | 'animals'
};
```

### 6.4 localStorage Schema
```javascript
// Key: 'gz_akinator_data'
{
  stats: { wins, losses, streak, bestStreak, totalQuestions },
  learned: [{ name, attributes: { q1: +1, q2: -1, ... }, category }],
  settings: { sound: true }
}
```

---

## 7. Knowledge Base Design

### 7.1 Character Object Structure
```javascript
{
  id: 'char_001',
  name: 'Darth Vader',
  category: 'characters',
  attributes: {
    is_fictional: 1,
    is_human: 1,
    is_male: 1,
    wears_clothes: 1,
    has_weapon: 1,
    is_evil: 1,
    has_special_power: 1,
    from_movies: 1,
    uses_technology: 1,
    has_mask: 1,
    leads_organization: 1,
    // ... 50-100 attribute keys total
  }
}
```

### 7.2 Question Pool (50 questions minimum)
Pre-defined questions mapped to attribute keys:

| Q ID | Question Text | Positive meaning (Yes = +1) |
|---|---|---|
| q1 | Is your character fictional? | Character is from fiction |
| q2 | Is your character a real person? | is_real_person = 1 |
| q3 | Is your character male? | is_male = 1 |
| q4 | Is your character female? | is_female = 1 |
| q5 | Is your character an animal? | is_animal = 1 |
| q6 | Does your character have supernatural powers? | has_super_power = 1 |
| q7 | Is your character a villain? | is_evil = 1 |
| q8 | Does your character wear a costume or uniform? | wears_costume = 1 |
| q9 | Is your character from a movie? | from_movies = 1 |
| q10 | Is your character from a TV show? | from_tv = 1 |
| ... | ... | ... |

### 7.3 Minimum Viable KB for 100+ Characters
**Characters (70+):** Darth Vader, Harry Potter, Sherlock Holmes, Batman, Superman, Spider-Man, Mickey Mouse, SpongeBob, Elvis Presley, Albert Einstein, Napoleon, Cleopatra, Michael Jackson, Madonna, Barack Obama, Donald Trump, Justin Bieber, Cristiano Ronaldo, Lionel Messi, Tom Hanks, Leonardo DiCaprio, Beyonce, Lady Gaga, Britney Spears, Naruto, Goku, Pikachu, Mario, Link (Zelda), Sonic, SpongeBob, Patrick Star, Squidward, Shrek, Donkey, Elsa (Frozen), Anna (Frozen), Iron Man, Captain America, Thor, Hulk, Black Widow, Hawkeye, Wolverine, Gandalf, Frodo, Superman (Clark Kent), Wonder Woman, Catwoman, Joker (Batman), Mario (Nintendo), Luigi, Princess Peach, Bowser, Charizard, Bulbasaur, Charmander, Squirtle, Batman (Bruce Wayne), Robin (Dick Grayson), ... etc.

**Animals (30+):** Dog, Cat, Lion, Tiger, Elephant, Giraffe, Penguin, Eagle, Dolphin, Whale, Snake, Spider, Octopus, Kangaroo, Koala, Panda, Tiger, Bear, Wolf, Fox, Rabbit, Horse, Cow, Pig, Chicken, Duck, Owl, Bat, Butterfly, Bee, ...

### 7.4 Character Count Target
- **100+ total characters** (75 characters, 25 animals) — achievable in a single HTML file at ~50KB KB data
- Each character has 20-40 attributes (sparse matrix — most attributes are 0 or null)
- Attribute data stored as compact object: `{ attr_key: 1/-1, attr_key: 0.5/-0.5 }`

---

## 8. Question Selection Algorithm

### 8.1 Information Gain (Entropy-Based) Approach

```
For each candidate question Q not yet asked:
  1. For each answer type A in {YES, NO, PROBABLY, PROBABLY_NOT, DONT_KNOW}:
     a. Calculate weight w(A) using Akinator scale: +1, +0.5, 0, -0.5, -1
     b. Filter candidates to those where character.attributes[Q.attr] * w(A) > threshold
     c. Count remaining candidates: n(A)
  2. Calculate entropy: H(Q) = -sum( p(A) * log2(p(A)) ) for all A
     where p(A) = n(A) / total_candidates
  3. Information gain = 1 - H(Q) / current_entropy

Select Q with maximum information gain (most entropy reduction).
```

### 8.2 Confidence Scoring
After each answer, calculate confidence for each remaining candidate:

```
confidence(c) = sum( w(answer) * c.attributes[q.attr] ) / questions_asked
```

Sort candidates by confidence descending. If top candidate has confidence > 0.85 AND questions_asked >= 10, trigger a guess.

### 8.3 Guessing Trigger Conditions
- **Auto-guess:** Top candidate confidence > 0.9 at any point
- **Question limit:** After 20 questions, force a guess (top candidate)
- **Last candidate:** When only 1 candidate remains, guess immediately
- **"I give up":** Player can trigger guess at any time

### 8.4 Question Prioritization
To keep game engaging, incorporate a **question history** to avoid:
1. Repetitive questions (same attribute asked again)
2. Zero-information questions (all remaining candidates have same attribute value)
3. Questions with low variance in the current candidate set

---

## 9. UI/Flow Specification

### 9.1 Screen Flow

```
[START SCREEN]
    |
    v
[THEME SELECT]  "Choose: Characters or Animals?"
    |
    v
[GAME SCREEN]
    |
    +-- AI asks question --> [ANSWER BUTTONS: Yes / No / Probably / Probably Not / Don't Know]
    |       |
    |       v
    |   [NARROWING ANIMATION] --> back to GAME SCREEN (next question)
    |
    +-- AI makes guess --> [GUESS SCREEN: "Is it [Character Name]?"]
    |       |
    |       v
    |   [CORRECT] --> [WIN SCREEN]
    |   [WRONG x3] --> [LEARN SCREEN: "What were you thinking?"]
    |   [WRONG once/twice] --> back to GAME SCREEN (continue asking)
    |
    +-- Player gives up --> [GUESS SCREEN (player-triggered)]
    |       |
    |       v
    |   [WRONG] --> [LEARN SCREEN]
    |
    v
[WIN SCREEN]  "I guessed it in X questions!" [Play Again] [Share]
    |
    v
[LEARN SCREEN]  "I need to learn! Enter the character name:"
    |
    +-- User enters name + answers a few quick questions --> saved to localStorage
    |
    v
[GAME OVER / RESULTS SCREEN]
```

### 9.2 UI Components

**Header Bar:**
- Game title (GameZipper Akinator logo)
- Score display (W: X | L: X | Streak: X)
- Sound toggle button
- Theme toggle (Characters / Animals)

**Main Game Area:**
- Large question text (centered, animated fade-in)
- 5 answer buttons arranged horizontally (or 2x3 on mobile)
- Progress bar showing candidates remaining (e.g., "Narrowed down to 12 possibilities")
- Question counter ("Question 7 of 20+")
- "I Give Up" link (subtle, bottom)

**Guess Screen:**
- Character name (large, dramatic reveal)
- Image placeholder (colored silhouette / icon)
- YES / NO buttons

**Win Screen:**
- "I did it!" celebration text
- Questions asked, score earned
- Achievements unlocked (if any)
- [Play Again] [Try Other Theme] buttons

**Learn Screen:**
- Text input: "Who were you thinking of?"
- Quick Q&A: "Answer a few questions about [name]"
- Save button

### 9.3 Dark Neon GameZipper Theme

```css
body {
  background: #0a0a0f;
  color: #e0e0e0;
  font-family: 'Segoe UI', system-ui, sans-serif;
}

.neon-purple { color: #b366ff; text-shadow: 0 0 10px #b366ff; }
.neon-cyan   { color: #00ffff; text-shadow: 0 0 10px #00ffff; }
.neon-pink   { color: #ff3399; text-shadow: 0 0 10px #ff3399; }
.neon-green  { color: #39ff14; text-shadow: 0 0 10px #39ff14; }

.btn-answer {
  background: #1a1a2e;
  border: 2px solid #b366ff;
  color: #e0e0e0;
  border-radius: 8px;
  padding: 12px 20px;
  transition: all 0.2s;
}
.btn-answer:hover {
  background: #b366ff;
  color: #0a0a0f;
  box-shadow: 0 0 20px #b366ff;
}
```

### 9.4 Responsive Breakpoints
- **Desktop (>768px):** Full layout, 5 answer buttons in a row
- **Mobile (<768px):** Stacked buttons (2 rows), compact header

---

## 10. Monetization Points

### 10.1 Ad Integration (Primary Revenue)
- **Interstitial ad** on game over / win screen (every 3rd game)
- **Banner ad** at bottom of screen (non-intrusive, collapsible on mobile)
- **Reward video ad** — Watch ad to unlock hint or continue after loss streak
- **Native ad placement** — "More Games" carousel on win screen

### 10.2 In-Game Purchases (Optional)
- **Hint packs** — $0.99 to unlock 10 hints (reveals attribute category)
- **Remove ads** — $1.99 one-time (ad-free for 30 days)
- **Custom themes** — $0.99 for alternate color schemes
- **Extra lives** — continue after loss without learning new character

### 10.3 Engagement Hooks for Ad Revenue
- **Daily streak bonus** — Play every day for bonus coins/rewards
- **Challenge mode** — Limited attempts, creates urgency to return
- **Share CTA** — "Share your score" drives viral traffic (free)
- **Achievement notifications** — Drive re-playability, increase session length (more ad impressions)

### 10.4 Data Collection (Privacy-Compliant)
- Track question difficulty popularity to optimize KB
- Aggregate learned characters to expand future KB versions
- Anonymous analytics for session length, drop-off points

---

## 11. Implementation Checklist

### Phase 1: Core (Single HTML File)
- [ ] Create index.html shell with GameZipper dark neon CSS
- [ ] Embed 100+ character KB (JSON)
- [ ] Implement question selection (entropy-based)
- [ ] Implement answer handling and candidate narrowing
- [ ] Implement guess trigger logic
- [ ] Implement "I was wrong" recovery with localStorage
- [ ] Web Audio API sound effects
- [ ] Canvas animated background
- [ ] Mobile responsive layout
- [ ] localStorage persistence

### Phase 2: Polish
- [ ] Score and streak tracking
- [ ] Achievement system (5 achievements)
- [ ] Theme toggle (Characters / Animals)
- [ ] Progress bar showing candidates remaining
- [ ] Share results CTA

### Phase 3: Monetization
- [ ] Ad placement integration
- [ ] Reward video ad for hints
- [ ] "More Games" carousel

---

## Sources & References

- Akinator Wikipedia: https://en.wikipedia.org/wiki/Akinator
- Twenty Questions Wikipedia: https://en.wikipedia.org/wiki/Twenty_questions
- 20Q Official: https://20q.net
- Stack Overflow Discussion on Akinator Algorithm: https://stackoverflow.com/questions/2380408/
- Information Theory & Binary Search analogy: Shannon entropy, 2^20 = 1,048,576
- SilverGames Guess Who: https://www.silvergames.com/en/guess-who
