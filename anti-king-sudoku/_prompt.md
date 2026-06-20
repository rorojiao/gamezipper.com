Build a complete, commercial S-grade HTML5 game: **Anti-King Sudoku** as a single self-contained file at `/home/msdn/gamezipper.com/anti-king-sudoku/index.html`. ALL UI TEXT MUST BE ENGLISH.

## STEP 1 — READ THESE FILES FIRST (required)
1. Reference template (proven 50KB sudoku-variant architecture): `/home/msdn/gamezipper.com/consecutive-sudoku/index.html`. Study its FULL structure: screens (splash/level/game), HUD, canvas rendering loop, setupCanvas with height-constraint, numpad, toolbar, audio (initAudio/tone/sfx/bgmTick/startBGM/stopBGM), save/load (localStorage v1), star calc, confetti, tutorial modal, daily challenge, pause, pointer input. ADAPT this architecture. Do NOT copy the "consecutive bars" logic — anti-king has NO bars.
2. Level data: `/home/msdn/gamezipper.com/anti-king-sudoku/levels.json`. It has `{levels:[{id,tier,N,p,s},...]}` where p=puzzle grid (0=empty, givens=prefilled), s=full solution. Embed ALL 27 levels INLINE as `const LEVELS_DATA = [...]` inside index.html (use the p/s fields, drop the "clues"/"unique" fields). Format each as `{id,tier,N,p,s}`. Read the JSON file and inline it — do NOT fetch it at runtime. (N is 6 for Beginner/Easy/Medium, 9 for Hard/Expert/Master.)
3. BENCHMARK: `/home/msdn/gamezipper.com/anti-king-sudoku/BENCHMARK.md` for the systems list.

## GAME RULES (Anti-King Sudoku)
Standard Sudoku (each row, column, and box contains digits 1–N exactly once) PLUS the Anti-King constraint: **no two cells a king's-move apart (the 8 surrounding cells: horizontal, vertical, AND diagonal neighbours) may contain the same digit.** There are NO extra given dots/bars/arrows — givens are just prefilled digits. NOTE: 4×4 is mathematically impossible for anti-king, so Beginner uses 6×6 (smallest viable grid). Reflect this in the FAQ/tutorial text.

## SIGNATURE VISUAL (most important differentiator — make it prominent & satisfying)
When a cell is selected, SOFTLY GLOW its 8 king-neighbours (the 3×3 ring around it) in gold. This visually teaches/reinforces the rule: "these glowing cells can't repeat my digit." Draw this in `drawBoard()` using layered rounded-rect fills with gold tint (e.g. rgba(255,209,102,0.16)) behind the 8 neighbour cells, with the selected cell itself in a purple tint. This glow MUST appear every time a cell is selected. Add a legend line: "Glowing cells = king moves (no repeat)".

## REQUIRED SYSTEMS (match BENCHMARK S-grade parity)
- Scoring + 3-star rating per level (3★=no mistakes & no hints; 2★=≤2 mistakes & ≤1 hint; else 1★). Show stars on win modal + level select cells.
- Notes/pencil-marks (toggle button "Notes"; toggle candidate digits per cell; render small candidates in a grid).
- Hints (limited; reveals one correct cell; increments hintsUsed; affects stars).
- Undo (full move history) + Erase.
- Timer (per-level, HUD mm:ss) + best-time saved to localStorage.
- Daily challenge (one seeded puzzle/day from date hash).
- Mistake counter + wrong-cell red flagging (placed digit != solution).
- King-move highlight (signature UX above).
- 3-step tutorial modal (skippable; shown once via localStorage flag).
- localStorage v1 save with a `version:1` field; progress keyed by level; daily key separate; sound preference.
- Win confetti animation.
- Procedural Web Audio API: ambient puzzle BGM loop + at least 6 SFX (select, place-correct, place-wrong/conflict, complete/row, hint, win) + erase/btn. Volume via master gain; mute toggle button (🔊/🔇).
- Canvas-based rendering at 60fps with delta-time logic (requestAnimationFrame loop), responsive via setupCanvas.

## RESPONSIVE / MOBILE
- Works desktop 1280×720 AND mobile 390×844. `touch-action:none` on canvas. Pointer events. Min 44px tap targets.
- setupCanvas MUST constrain board by BOTH width and available height (reserve ~310px for chrome: header/HUD/toolbar/numpad/margins) so the numpad stays visible on short viewports — exactly like the reference template. Add a `@media(max-height:...)` rule and use `window.innerHeight`.
- window resize listener re-runs setupCanvas + drawBoard.

## VISUAL STYLE
- Dark royal-purple/indigo gradient background. Neon accents: **royal purple (#9d78ff / #7c5cff) + gold (#ffd166)** for the "king" theme (NOT the reference's cyan/magenta).
- Glass-morphism panels (backdrop-filter:blur, semi-transparent), rounded corners, subtle borders.
- Title `<h1>` uses gradient background-clip:text + text-shadow glow. **NEVER use -webkit-text-stroke.** NO emoji in the title text.
- Polished, modern, premium feel.

## HEAD / META (include EXACTLY)
- `<title>Play Anti-King Sudoku Online Free - King Move Logic Puzzle | GameZipper</title>`
- meta description, theme-color (royal purple, e.g. #1a1030).
- `<link rel="canonical" href="https://gamezipper.com/anti-king-sudoku/">`
- `<link rel="icon" type="image/png" href="/anti-king-sudoku/icon.png">`
- og:title, og:description, og:image=`https://gamezipper.com/anti-king-sudoku/og-image.png`, og:url, twitter:card.
- JSON-LD structured data (4 blocks): VideoGame (name "Anti-King Sudoku", url, genre [Puzzle,Sudoku,Logic], publisher GameZipper, Offer price 0, aggregateRating ~4.8), FAQPage (4 Q&As: what is anti-king sudoku, how to play, is it free, how many levels — mention king-move rule & 6×6/9×9 grids & 27 levels), HowTo (steps), BreadcrumbList (GameZipper > Puzzle > Anti-King Sudoku).
- Analytics tag EXACTLY once: `<script src='https://site-analytics.cap.1ktower.com/hit?s=gamezipper.com&p=anti-king-sudoku'></script>`
- body style: `overflow-x:hidden; user-select:none; -webkit-user-select:none;`

## CODE HYGIENE
- Single `cleanup()` function that cancels ALL timers (clearInterval/clearTimeout), cancels requestAnimationFrame, removes event listeners, and stops/closes audio nodes (stopBGM, suspend AudioContext). Call it before starting a new level and on unload. No memory leaks. Prevent duplicate-click/double-fire on buttons (debounce or guard flags).
- Single self-contained file. NO external dependencies except CDN web fonts (optional). NO runtime fetch of level data. Embed LEVELS_DATA inline.
- Footer scripts: include `<script src="/game-footer.js?v=f70e3a9c"></script>` and `<script src="/monetag-manager.js?v=20260611v5"></script>` and a `<div id="gz-ad-below-game">` near the end, mirroring the reference.

## DELIVERABLE
Write the complete file to `/home/msdn/gamezipper.com/anti-king-sudoku/index.html`. Target ≥35KB. It must contain `</html>`, the 27 levels inline, all systems above. Use the reference template as your structural backbone and adapt — do not reinvent the wheel. After writing, you do NOT need to run anything.

Build it now, completely, in this single response. Do not ask questions.
