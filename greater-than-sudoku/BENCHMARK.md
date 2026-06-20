# Greater-Than Sudoku — Competitive Benchmark & Product Analysis

> **Document purpose.** This benchmark defines the product, documents the rules in
> formal terms, profiles the target audience, analyzes the competitive landscape
> for Greater-Than Sudoku (also called Comparison Sudoku or Inequality Sudoku),
> and articulates how the GameZipper implementation differentiates itself. It is
> intended as the strategic reference for design, content, SEO, and monetization
> decisions on the `greater-than-sudoku` title at `gamezipper.com`.

---

## 1. Game Overview

**Greater-Than Sudoku** is a logic puzzle that combines the familiar constraints
of classic Sudoku with directional inequality clues placed between adjacent
cells. It is known by several names in the wider puzzle community —
**Comparison Sudoku**, **Inequality Sudoku**, and occasionally **"Futoshiki
Sudoku"** in casual references — but all describe the same underlying mechanic:
the standard Sudoku grid is augmented with **greater-than (`>`) and less-than
(`<`) signs** that sit on the borders between orthogonally adjacent cells,
telling the solver which of the two neighboring digits must be the larger.

The defining twist is that, unlike classic Sudoku, a Greater-Than Sudoku puzzle
does not necessarily rely on **given digits** (the pre-filled "clue" numbers a
player starts with). The pure or **"classic" form** of the variant supplies
**zero givens** — the solver begins with an empty grid and deduces the entire
solution from the inequality signs alone. This makes the puzzle a test of pure
deductive logic rather than pattern-matching against fixed starting numbers.
Softer variants add a handful of givens to create an approachable difficulty
ramp for newcomers.

### Core rule summary

1. Fill the grid so that every **row**, every **column**, and every **bolded
   box (block)** contains each permitted digit exactly once (Latin-square +
   box constraint, identical to standard Sudoku).
2. Obey every inequality sign between orthogonally adjacent cells. The **open
   jaw** (the wide, "open" end) of each sign points toward the **larger**
   digit. A `>` between two cells therefore means "the left/top cell is greater
   than the right/bottom cell"; a `<` means the reverse.
3. The puzzle has exactly **one valid solution** (uniqueness is verified at
   generation time in the GameZipper build).

### Why the variant is compelling

Greater-Than Sudoku rewards the same disciplined elimination skills as classic
Sudoku but shifts the cognitive load from "scan the givens" to "chain the
inequalities." A single sign can cascade into a long deduction — for example,
`5 > _ > _ > _ > 1` along a row instantly fixes several relationships before
any digit is even placed. Players who find classic Sudoku "solved out" or
repetitive tend to find the inequality variant refreshingly rigorous, while
newcomers appreciate that the signs give continuous feedback about whether a
candidate is even possible.

---

## 2. Rules in Detail

### 2.1 The grid

Two grid sizes are used across the title's tiers:

- **6×6 grid** divided into **6 boxes of size 2×3** (2 rows × 3 columns each).
  Digits used: **1–6**.
- **9×9 grid** divided into **9 boxes of size 3×3** (the classic Sudoku
  layout). Digits used: **1–9**.

### 2.2 The constraints

For an N×N grid (N = 6 or 9):

- **Row constraint.** Each row must contain each digit 1…N exactly once.
- **Column constraint.** Each column must contain each digit 1…N exactly once.
- **Box constraint.** Each bolded box must contain each digit 1…N exactly once.
- **Inequality constraint.** For every pair of orthogonally adjacent cells
  joined by a sign, the digits must satisfy that sign. Vertically adjacent
  cells are compared top-vs-bottom; horizontally adjacent cells are compared
  left-vs-right.

### 2.3 Reading the signs

- **`>` (greater-than).** The open jaw opens to the **left** (or **top**, for a
  vertical sign). The cell on the open side holds the **larger** digit.
- **`<` (less-than).** The open jaw opens to the **right** (or **bottom**).
  Again, the cell on the open side holds the **larger** digit.
- A useful mnemonic: **the open end always points to the greater number.**

### 2.4 Givens

A Greater-Than Sudoku puzzle **may include zero or more given digits** as
starting clues. The classic competitive form uses **no givens at all**; softer
forms add givens to lower the entry barrier. In the GameZipper build, the
number of givens is the **primary difficulty lever** — Beginner puzzles carry
many givens, while Master puzzles carry very few, approaching the pure form.

### 2.5 Worked mini-example

Below is a small 4-cell fragment of a grid showing how the signs constrain the
digits. Consider four cells in a 2×2 block; the digit on the **open side** of
each sign must be larger.

```
        Column 1            Column 2
        (left cell)         (right cell)
        ┌─────────┐   <     ┌─────────┐
Row 1   │    5    │ ◀─────  │    3    │      sign reads 5  >  3   ✓
        └─────────┘         └─────────┘
            ▲                    ▲
            │                    │
            v                    v
        ┌─────────┐         ┌─────────┐
Row 2   │    1    │   >     │    4    │      sign reads 1  <  4   ✓
        └─────────┘ ──────▶ └─────────┘
```

Reading the four signs in this fragment:

- **Top row, between col 1 and col 2:** sign is `>` opening left, so
  `left > right` → `5 > 3` ✔ (satisfied).
- **Bottom row, between col 1 and col 2:** sign is `>` opening right, so
  `left < right` → `1 < 4` ✔ (satisfied).
- **Left column, between row 1 and row 2:** sign opens up, so
  `top > bottom` → `5 > 1` ✔ (satisfied).
- **Right column, between row 1 and row 2:** sign opens up, so
  `top > bottom` → `3 > 4` ✘ — **violated.** This fragment is therefore not a
  valid placement, illustrating how the inequality constraint rejects
  candidates that row/column/box logic alone would permit.

In real play the solver uses these signs to prune candidates long before
placing digits: any candidate that would force a violation of a neighboring
sign is immediately eliminated.

---

## 3. Target Audience

Greater-Than Sudoku sits at the intersection of several large, overlapping
audiences. Understanding them is essential for SEO, onboarding copy, and
feature prioritization.

### 3.1 Core segments

- **Classic Sudoku fans seeking variety.** Players who have exhausted standard
  Sudoku and want a fresh constraint layer. They arrive with strong elimination
  habits and want a steeper logical challenge, not a gentler one.
- **Logic-puzzle enthusiasts.** Fans of Futoshiki, Kakuro, Hashi, Nonograms,
  Slitherlink, and other Nikoli-style puzzles. The inequality mechanic is
  directly familiar from Futoshiki, so the conceptual leap is small.
- **"Cracking the Cryptic" viewers.** A large, active audience discovered
  variant Sudoku (including inequality Sudoku) through YouTube solve videos.
  They are highly motivated, tech-comfortable, and often search specifically
  for "inequality sudoku" or "comparison sudoku online."
- **Brain-training and cognitive-wellness users.** Adults (skewing 35–65) who
  play puzzles to maintain mental sharpness. They value daily play, gentle
  difficulty curves, and clear feedback.
- **Students and casual learners.** Younger solvers (roughly 12–22) who enjoy
  math-adjacent games and use browser play during breaks.
- **Mobile casual gamers.** Players looking for a quick, ad-supported,
  no-download puzzle to fill short sessions on a phone.

### 3.2 Demographic profile

- **Age range.** Broad — effectively **10 to 75+**. The 6×6 Beginner tiers
  serve younger solvers and newcomers; the 9×9 Master tier serves experienced
  adults. The sweet spot for engagement is **25–60**.
- **Skill levels.** Span from absolute beginner (needs givens + tutorial) to
  expert (wants near-zero-given pure puzzles with no hints). The 6-tier
  structure is designed to serve this entire spectrum.
- **Device mix.** Predominantly **mobile and tablet** for casual sessions,
  with a meaningful **desktop** share from office/workplace play. Mobile-first
  responsive design is non-negotiable.
- **Session intent.** Short, repeatable sessions (3–15 minutes for 6×6; 10–45
  minutes for 9×9). Daily-challenge and progression mechanics align well with
  habit formation.

### 3.3 Motivations and pain points

| Motivation | What the audience wants | How the title serves it |
|---|---|---|
| Mental stimulation | Hard logic, no guessing | Verified-unique puzzles; Master tier near-pure |
| Progression | Sense of advancement | 27 levels, 6 tiers, star ratings |
| Convenience | Play anywhere, instantly | Browser, no download, no sign-up, mobile-ready |
| Learning | Gentle on-ramp | 6×6 Beginner with many givens + tutorial |
| Daily habit | A reason to return | Daily challenge + localStorage progress |

---

## 4. Competitive / Reference Landscape

The Greater-Than Sudoku niche is served by a mix of large commercial
platforms, content-driven channels, dedicated puzzle sites, and print/digital
puzzle books. Each occupies a distinct position; none combines free, instant,
browser-based play with a graded 6-tier, 6×6-and-9×9 progression the way this
title does.

### 4.1 sudoku.com (inequality / "Greater Than" variant)

**What it offers.** sudoku.com is the dominant mass-market Sudoku brand on the
web and app stores. It offers a "Greater Than" (inequality) Sudoku variant
alongside its classic, killer, and sandwich modes. The 9×9 puzzles are
presented in the pure or near-pure style (zero or very few givens), with
production-grade UX: tap-to-place input, pencil notes, mistake highlighting,
hints, undo, a timer, and daily puzzles.

**Strengths.** Enormous organic reach, polished interface, brand trust,
cross-promotion across many Sudoku variants, and mature monetization
(banner + interstitial + rewarded ads plus in-app purchases for hints and
unlocks). A first-class mobile app presence drives retention.

**How a free browser game differentiates.** sudoku.com's variant is locked
behind an app-or-account funnel on many surfaces, runs interstitials that
interrupt short sessions, and offers only 9×9 grids. A no-download, no-sign-up
browser title that loads instantly, adds a **6×6 on-ramp tier set**, and
provides the full toolset (notes, hints, undo) for free captures the player who
wants to try the variant *now* without installing anything. The lighter ad
load (a single display unit below the board) is also a differentiator for
session quality.

### 4.2 Cracking the Cryptic (YouTube channel & apps)

**What it offers.** Cracking the Cryptic is the most influential
variant-Sudoku brand in the English-speaking world. Its YouTube channel
popularized inequality/comparison Sudoku through long-form solve videos, and
its companion mobile apps (e.g., the "Cracking the Cryptic" app and
variant-specific packs) ship hand-crafted puzzles by world-class constructors,
including pure zero-given Greater-Than Sudoku.

**Strengths.** Best-in-class puzzle curation, celebrity constructors, deep
editorial explainers, and a devoted community. The brand effectively
*defines* the modern taste for variant Sudoku and drives enormous search
demand for terms like "inequality sudoku" and "greater than sudoku."

**How a free browser game differentiates.** Cracking the Cryptic's content is
**paid** (apps are one-time purchases) and **video-first** (watching a solve
is not the same as playing). There is no free, instant, browser-playable entry
point under that brand. A free web title captures the long tail of viewers who
search the variant after watching a video but are not ready to buy an app —
serving as the frictionless "try it" destination. Linking out to CtC content
(and using accurate, CtC-aligned terminology) also builds credibility.

### 4.3 Sudokuno.com and similar free Sudoku portals

**What it offers.** Sudokuno.com and comparable ad-supported Sudoku portals
offer free browser Sudoku, typically classic 9×9 with daily puzzles,
difficulty ratings, and basic tools (notes, hints, timer). Some carry a
limited selection of variants.

**Strengths.** Zero friction (instant browser play), broad device support, and
SEO presence for high-volume "sudoku" terms. They prove the demand model for
free, ad-supported puzzle play.

**How a free browser game differentiates.** Most general Sudoku portals treat
variants as an afterthought — if they offer inequality Sudoku at all, it is
often a single mode with no progression, no 6×6 tier, and no uniqueness
guarantee. A title purpose-built around Greater-Than Sudoku — with a
**dedicated 27-level campaign across six tiers**, a **daily challenge**, and
**independently verified unique solutions** — is a meaningfully deeper product
than a one-mode afterthought, and it ranks for the specific long-tail terms
("greater than sudoku," "comparison sudoku") that generic portals do not
target.

### 4.4 Puzzle books (Conceptis, Simon Tatham, Nikoli, print anthologies)

**What they offer.** Print and digital anthologies from publishers like
**Conceptis Puzzles**, **Nikoli**, and various magazine/book packagers include
inequality/Futoshiki-style and comparison-Sudoku puzzles. **Simon Tatham's
Portable Puzzle Collection** includes a free "Unequal" puzzle (a Latin-square
inequality puzzle, closely related mechanically) beloved by logic-puzzle
purists.

**Strengths.** High editorial quality, curated difficulty, and (for Simon
Tatham's collection) a cult following for clean, distraction-free play.
Conceptis puzzles in particular are trusted by serious solvers.

**How a free browser game differentiates.** Books are static (finite content,
no progression, no daily refresh) and offline-only. Simon Tatham's collection
is excellent but desktop-oriented, visually austere, and lacks the
Sudoku-specific box constraint and modern mobile UX. A mobile-responsive,
dark-themed, audio-enabled web title with a daily challenge and persistent
progression offers the *feel* of a curated book with the *convenience* of a
modern web app — and adds the Sudoku box constraint that pure Futoshiki
collections lack.

### 4.5 Landscape summary

| Competitor / reference | Grid sizes | Givens style | Access model | Key gap this title fills |
|---|---|---|---|---|
| sudoku.com (Greater Than) | 9×9 | pure / few givens | App + web, heavy ads, IAP | 6×6 on-ramp, lighter ad load, instant play |
| Cracking the Cryptic | 9×9 (curated) | pure | Paid apps + free video | Free, instant, browser-playable, with progression |
| Sudokuno.com & portals | mostly 9×9 | classic focus | Free web, generic | Dedicated inequality focus, tiers, uniqueness |
| Conceptis / print books | 6×6, 9×9 | mixed | Paid, static | Free, dynamic daily, mobile-first, audio |
| Simon Tatham "Unequal" | NxN (Latin) | pure | Free, desktop UX | Sudoku box constraint, modern mobile UX |

---

## 5. GameZipper Differentiation

The GameZipper Greater-Than Sudoku title is engineered around a single thesis:
**be the fastest, friendliest, most complete free place to play Greater-Than
Sudoku in a browser.** The specific differentiators are:

### 5.1 A graded 27-level campaign across six tiers

The progression is the product's spine. Twenty-seven hand-verified puzzles are
distributed across six tiers, with grid size and given-count both scaling
difficulty:

- **Beginner (6×6)** — 7 givens + full inequality grid. Gentle on-ramp to reading the signs.
- **Easy (6×6)** — 5 givens. Light deduction from the comparison signs.
- **Medium (6×6)** — 3 givens. Real comparison reasoning takes over.
- **Hard (9×9)** — 12 givens. Introduction to the full 9×9 grid of signs.
- **Expert (9×9)** — 7 givens. Serious solving, heavy reliance on the signs.
- **Master (9×9)** — 3 givens. Near-pure comparison sudoku solved almost entirely from > and <.

The use of **given count as the primary difficulty lever** — rather than
removing inequality signs — keeps every puzzle solvable by clean logic and
makes the difficulty curve legible to the player.

### 5.2 Two grid sizes, one coherent product

Offering both **6×6 (2×3 boxes)** and **9×9 (3×3 boxes)** is rare among free
web competitors, who almost universally default to 9×9 only. The 6×6 tiers
serve newcomers, younger solvers, and quick sessions; the 9×9 tiers serve
experienced solvers. This broadens the addressable audience considerably.

### 5.3 Free, instant, frictionless

- **No download.** Pure browser play.
- **No sign-up.** No account, no email, no data collection gate.
- **No paywall.** Every level, every tier, every tool is free.
- **Mobile-responsive.** Touch-first input with a responsive layout tuned down
  to small viewports.

### 5.4 Verified unique solutions

Every one of the 27 puzzles is checked for uniqueness by an
**independent inequality-aware solver** (see `verify_independent.js` in the
build). This is a non-trivial quality bar: poorly generated Greater-Than
Sudoku can admit multiple solutions, which destroys player trust. The
uniqueness guarantee is a credibility differentiator versus generic portals.

### 5.5 A complete, modern toolset

- **Notes/pencil marks** for candidate tracking.
- **Hints** that reveal a correct digit when the solver is stuck.
- **Undo and erase** for safe experimentation.
- **Timer and star ratings** (reward fast, mistake- and hint-free solves).
- **Daily challenge** for habit formation and return visits.
- **Tutorial** that teaches the inequality mechanic inline.
- **Persistent progress** via `localStorage` (cross-session continuity).
- **Web Audio** background music and sound effects, toggleable.

### 5.6 A distinct visual identity

The title uses a **dark theme with emerald-green and amber/gold (#fbbf24)
accents** — deliberately different from the default light, blue-heavy Sudoku
aesthetic. The board is **Canvas-rendered** for crisp, fluid interaction on
both desktop and mobile, with a procedurally generated icon and Open Graph
image for consistent social sharing.

---

## 6. System Requirements

The title is a self-contained, standards-based web application with no
dependencies on plugins, runtimes, or external services at runtime.

### 6.1 Browser support

A **modern, evergreen web browser** is required. Supported and tested:

- **Google Chrome** (current and previous major release)
- **Mozilla Firefox** (current and previous major release)
- **Apple Safari** (macOS and iOS, current)
- **Microsoft Edge** (Chromium-based, current)

Any Chromium-derived browser (Brave, Opera, Vivaldi, Android Chrome) is
implicitly supported.

### 6.2 Required web platform features

- **HTML5 Canvas** — the board is rendered to a `<canvas>` element. Required.
- **Web Audio API** — used for background music and sound effects. The game
  degrades gracefully (playable without sound) but a browser with Web Audio is
  expected for the intended experience.
- **localStorage** — used to persist progress, settings, and star ratings.
  Required for cross-session continuity; the game remains playable in a
  private/incognito session but will not persist progress.
- **Touch and pointer input** — full touch support for mobile/tablet, plus
  keyboard and mouse/trackpad input on desktop.

### 6.3 Network and installation

- **No plugins** (no Flash, no Java, no native client). Pure HTML/CSS/JS.
- **Offline-capable design.** The game is built as a single, self-contained
  HTML file with all logic, levels, and assets inlined or co-located. After the
  initial load it can be played without a network connection (subject to the
  browser's cache and the ad/analytics scripts, which require connectivity).
- **No installation.** There is nothing to download or install; the URL is the
  product.

### 6.4 Performance expectations

Smooth 60 FPS board interaction on any device made in the last several years,
including budget Android phones. The Canvas board is the only
performance-sensitive surface and is lightweight by design.

---

## 7. SEO Keywords

The following target keywords reflect actual search demand for this variant
and should drive on-page copy, headings, alt text, internal links, and
metadata. Long-tail variant terms are prioritized because they face less
competition than generic "sudoku" while converting well.

**Primary (head) terms:**

1. Greater Than Sudoku
2. Comparison Sudoku
3. Inequality Sudoku

**Secondary (descriptive) terms:**

4. Greater Than Sudoku online
5. Comparison Sudoku free
6. Inequality Sudoku puzzle
7. Play Greater Than Sudoku
8. Greater Than Sudoku 9×9
9. Greater Than Sudoku 6×6
10. Comparison Sudoku rules
11. How to play Greater Than Sudoku

**Adjacent / cross-sell terms (capture Futoshiki and variant-Sudoku intent):**

12. Futoshiki-like puzzle
13. Futoshiki Sudoku
14. Greater than less than Sudoku
15. Logic puzzle with inequality signs
16. Sudoku with signs between cells
17. Math inequality puzzle
18. Variant Sudoku
19. Daily comparison Sudoku
20. Free inequality Sudoku no download

**Content guidance.** Use the exact phrases "Greater-Than Sudoku," "Comparison
Sudoku," and "Inequality Sudoku" in the H1, intro paragraph, and at least one
H2, since users search all three names interchangeably. Mirror the
terminology used by Cracking the Cryptic (which drives much of the search
demand) to align with viewer intent.

---

## 8. Monetization

The title is monetized through **Google AdSense** display advertising. No
paywalls, no in-app purchases, and no gated content are present or planned —
monetization is purely impression-based, which preserves the frictionless
"free, no sign-up" value proposition that differentiates the product.

### 8.1 AdSense configuration

- **Publisher ID:** `ca-pub-8346383990981353`
- **AdSense platform account meta tag** is declared in the page head, and the
  AdSense loader script (`adsbygoogle.js`) is included with the correct
  `client` parameter.
- **Ad placement.** A single, responsive display ad unit is rendered
  **below the game board**. This placement monetizes without interrupting
  gameplay (no interstitials mid-solve), protecting session quality and
  completion rate — the two metrics most correlated with return visits.

### 8.2 Design principles for the ad surface

- **Never interrupt a solve.** Mid-puzzle interstitials raise abandonment;
  they are deliberately avoided.
- **One visible unit at a time** above/below the fold of the play area, to
  keep the experience clean and policy-compliant.
- **Responsive formatting** so the unit adapts to mobile and desktop without
  shifting the board layout.

### 8.3 Future monetization options (not active)

Reserved, low-friction options if scale warrants: a second display unit on the
level-select screen, a rewarded "extra hint" video (opt-in only), or
non-personalized house promotion of other GameZipper titles. Any addition must
preserve the core promise of free, uninterrupted play.

---

## 9. Success Metrics

The title's health is measured against four headline metrics, each chosen
because it maps directly to a product lever and is capturable from the
existing analytics and `localStorage` instrumentation.

### 9.1 Headline metrics

- **Play count (sessions / level starts).** Top-of-funnel reach. Tracks SEO
  performance and the effectiveness of the daily challenge in driving new and
  repeat visits. Target: steady week-over-week growth, with a measurable daily
  spike from the challenge.
- **Average session duration.** Depth of engagement. A healthy Greater-Than
  Sudoku session runs several minutes (6×6) to tens of minutes (9×9). Rising
  average session duration indicates players are progressing into harder
  tiers rather than bouncing at Beginner.
- **Completion rate.** The share of started puzzles that are solved to the
  end. This is the single best signal of puzzle *fairness* and *fun*: a drop
  in completion rate at a specific tier flags a tuning problem (too few
  givens, ambiguous deductions, or a uniqueness issue). Target: high and
  stable per tier, with a graceful slope downward from Beginner to Master.
- **Return rate (D1 / D7 / D30 retention).** Habit strength. Driven primarily
  by the daily challenge and persistent progression. This is the leading
  indicator of long-term value and the metric most tied to the product's
  "free, no sign-up, come back tomorrow" thesis.

### 9.2 Supporting diagnostics

- **Tier progression funnel.** Where do players drop off between Beginner and
  Master? A cliff at the 6×6→9×9 transition or at the Master tier informs
  whether to add intermediate levels or adjust given counts.
- **Hint and undo usage.** High hint usage at a tier suggests the puzzles may
  be too hard or the onboarding insufficient; near-zero usage at Beginner
  suggests the tier could be made leaner.
- **Star-rating distribution.** Whether players earn 3-star ratings (fast,
  no mistakes, no hints) tells us whether difficulty calibration matches
  solver skill.
- **Device breakdown.** Confirms the mobile-first design assumption and
  flags any viewport where the board renders poorly.
- **Organic landing keywords.** Validates the SEO keyword set in Section 7 and
  reveals emerging search terms to fold into copy.

### 9.3 Definition of success

The title succeeds when it becomes the default **free, instant, browser
destination** for Greater-Than Sudoku — measured by sustained growth in play
count driven primarily by organic search for the variant's name, a completion
rate that holds up across all six tiers (proving the puzzles are fair and
unique), and a return rate that proves the daily challenge is building a
habit. Revenue follows engagement: maximizing session quality and retention is
also the optimal path to sustainable AdSense performance.

---

*End of benchmark. Maintained alongside the `greater-than-sudoku` title at
`gamezipper.com`. Update competitor notes and tier calibration whenever the
level set or competitive landscape changes.*
