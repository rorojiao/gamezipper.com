#!/usr/bin/env python3
"""R334 state update for gz-dedup-convergence.json (atomic write).

Records the R334 sweep: the save-without-restore defect family (4 games), the
two repaired stale audit gates, the two new detector classes (D7 v3, D8), and
the cluster adjudications performed this tick.

NOTE: zero_issue_streak resets to 0 because R334 FOUND and FIXED issues.
Two consecutive full sweeps with zero new issues are still required before
the catalog can be re-declared converged.
"""
import json, os, tempfile, datetime, subprocess

P = '/home/junze/.hermes/state/gz-dedup-convergence.json'
d = json.load(open(P))
now = datetime.datetime.now(datetime.timezone.utc).isoformat()

def git(*args):
    return subprocess.run(['git', '-C', '/home/junze/gamezipper.com', *args],
                          capture_output=True, text=True).stdout.strip()

head = git('rev-parse', 'HEAD')
head_origin = git('rev-parse', 'origin/main')

# gate results, if the gate has produced a TSV
gate_tsv = '/home/junze/gamezipper.com/.audit/r334-verifier-gate.tsv'
gate_lines = 0
gate_nonzero = []
gate_cwd_mismatch = []
if os.path.exists(gate_tsv):
    for line in open(gate_tsv, encoding='utf-8', errors='replace').read().splitlines():
        parts = line.split('\t')
        if len(parts) < 4:
            continue
        gate_lines += 1
        slug, script, rc, rrc = parts[0], parts[1], parts[2], parts[3]
        if rc not in ('0', 'BROWSER') or rrc not in ('0', 'BROWSER'):
            gate_nonzero.append({'slug': slug, 'script': script, 'rc_from_game_dir': rc, 'rc_from_repo_root': rrc})
        if rc != rrc and 'BROWSER' not in (rc, rrc):
            gate_cwd_mismatch.append({'slug': slug, 'script': script, 'rc_from_game_dir': rc, 'rc_from_repo_root': rrc})

sweep = {
    'sweep_id': 'R334-2026-10-25',
    'verified_at': now,
    'catalog_head_local': head,
    'catalog_head_origin': head_origin,
    'live_total': 466,
    'zero_issue': False,
    'issues_found': 6,
    'issues_found_detail': {
        'P0': 0, 'P1': 0, 'P2': 4, 'P1_test_gate': 2, 'duplicate_mechanic': 0,
        'summary': ('No P0/P1 and no duplicate mechanic this tick. Found and fixed a NEW '
                    'defect class (SAVE-WITHOUT-RESTORE, 4 games) plus repaired two audit '
                    'gates that were reporting PROBLEMS on a healthy catalog.'),
        'new_class': 'SAVE-WITHOUT-RESTORE — a game persists a record but never reads it back, so the persisted value is provably wrong on every session after the first.',
    },
    'issues_fixed': [
        {
            'id': 'R334-P2a', 'slug': 'strimko', 'severity': 'P2',
            'class': 'save-without-restore (persisted best-times map never restored)',
            'detail': ('`let bestTimes = {}` was never restored from localStorage; loadBestTimes() '
                       'existed at game.js:787 but was NEVER called. Consequences, both measured: '
                       '(a) the guard `if (!bestTimes[lv] || timer < bestTimes[lv])` was ALWAYS true '
                       'because the map stayed empty all session, so the persisted "best time" '
                       'became the LAST time played; (b) saveBestTimes() then wrote a single-entry '
                       'map, destroying every other level\'s record.'),
            'evidence': ('node replica of the shipped storage logic: session 1 stores {"0":50}; '
                         'session 2 (fresh load, loader not called) solving the same level in 90s '
                         'overwrites it with {"0":90} -> the persisted best got WORSE, and level 1\'s '
                         'record was dropped.'),
            'fix': 'restore the map in init(): try { bestTimes = loadBestTimes() || {}; } catch(e) { bestTimes = {}; }',
            'verification': ('browser proof with a Storage.prototype.getItem instrument injected before the '
                             'engine boots: PRE-FIX the engine read only "strimko_save_v1_settings"; '
                             'POST-FIX it also reads "strimko_save_v1_best" (negative control run against '
                             'the original HEAD game.js). Local + production game.js md5 identical.'),
            'files': ['strimko/game.js'],
        },
        {
            'id': 'R334-P2b', 'slug': 'magnets', 'severity': 'P2',
            'class': 'save-without-restore (same defect class as strimko)',
            'detail': 'Identical defect: bestTimes never restored, loadBestTimes() (game.js:727) never called.',
            'fix': 'restore the map in init()',
            'verification': 'browser instrument: POST-FIX reads "magnets_save_v1_best". verify_engine.js PASS 30/30, verify_independent.js 30/30 UNIQUE. Local + production md5 identical.',
            'files': ['magnets/game.js'],
        },
        {
            'id': 'R334-P2c', 'slug': 'tatami', 'severity': 'P2',
            'class': 'save-without-restore (same defect class as strimko)',
            'detail': 'Identical defect: bestTimes never restored, loadBestTimes() (game.js:853) never called.',
            'fix': 'restore the map in init()',
            'verification': 'browser instrument: POST-FIX reads "tatami_save_v1_best". verify_engine.js PASS 30/30, verify_independent.js 30/30 UNIQUE. Local + production md5 identical.',
            'files': ['tatami/game.js'],
        },
        {
            'id': 'R334-P2d', 'slug': 'hexxagon', 'severity': 'P2',
            'class': 'save-without-restore (saved board never restorable)',
            'detail': ('The board was saved on every move (saveState at index.html:767,851) and on '
                       'beforeunload (:1018), and loadState() was FULLY implemented (restores board, '
                       'turn, difficulty, history, gameOver) — but nothing ever called it, and the '
                       'menu offered no way to resume. A returning player always lost their game, '
                       'while localStorage accumulated a save that could never be used.'),
            'fix': ('wire loadState() behind a new "▶️ Continue Saved Game" button in the difficulty '
                    'section, shown only when a non-finished save exists (hasSavedGame() / '
                    'refreshContinueButton(), called at boot and on every return to the menu).'),
            'verification': ('production browser probe: seeded a 25-cell save, reloaded, button visible, '
                             'clicked -> game screen shown, menu hidden, all 25 cells restored, 0 errors. '
                             'Mobile 390x844: viewportApplied=true, button 313x47 at y=184, inView=true, '
                             'no horizontal overflow (scrollW 375 <= innerWidth 390); clicking it restored '
                             'the board with 0 errors.'),
            'files': ['hexxagon/index.html'],
        },
        {
            'id': 'R334-GATEa', 'slug': '.audit/r332-atomic-consistency.js', 'severity': 'P1_test_gate',
            'class': 'stale gate — false positive on a healthy catalog',
            'detail': ('The cat-count check asserted that ALL cat-count spans hold ONE number equal to the '
                       'live total. The homepage now carries PER-CATEGORY counters (Puzzle 392, Arcade 38, '
                       '...) plus a Blog-post counter (306) that is not a game count, so the gate reported '
                       '"cat-count drift" on a perfectly consistent catalog. A gate that always cries wolf '
                       'is worse than no gate: it trains the operator to ignore it.'),
            'fix': ('compare each GAME category counter against the GAMES per-cat count; the match is '
                    'bounded to a single <button> so the "all" filter (whose static counter is a literal '
                    'backslash, JS-filled at runtime) cannot borrow the next button\'s number.'),
            'verification': ('NEGATIVE TEST: injected puzzle 392 -> 391 in a copy => "cat-count drift: '
                             'puzzle: HTML 391 vs GAMES 392", exit 1. Healthy repo => ATOMIC-CONSISTENT, '
                             'exit 0.'),
        },
        {
            'id': 'R334-GATEb', 'slug': '.audit/r332-atomic-consistency.js', 'severity': 'P1_test_gate',
            'class': 'stale gate — false positive + an un-testable hardcoded ROOT',
            'detail': ('(1) The sitemap check flagged every legitimate STATIC PAGE whose directory exists '
                       '(blog/, contact/, terms/, cookie-policy/, fun-web-games/, zh/) as a "sitemap extra '
                       'game dir" — all six are real HTTP-200 pages that belong in the sitemap. '
                       '(2) ROOT was a hardcoded absolute path, so the script ALWAYS audited '
                       '/home/junze/gamezipper.com even when pointed at a test copy, which made the '
                       'mandatory negative test impossible: injecting a fault into a copy still produced a '
                       'clean verdict because the copy was never read.'),
            'fix': ('exclude known static pages and require the dir to look like a game page (carries a '
                    '<canvas> or <script>); resolve ROOT from GZ_SITE_ROOT or __dirname.'),
            'verification': ('NEGATIVE TEST: injected a ghost-game dir + sitemap entry => "sitemap extra '
                             'game dirs: ghost-game", exit 1. Healthy repo => exit 0.'),
        },
    ],
    'cluster_adjudication': {
        'wood-block-puzzle__block-blast-bingo': {
            'verdict': 'DISTINCT — both retained, no deletion',
            'rule_difference': (
                'Both are Block-Blast-family line-clearers, but the ALLOWED ACTIONS and the WIN '
                'CONDITION\'s scoring surface differ: block-blast-bingo adds three SPECIAL power '
                'blocks that are not in wood-block-puzzle at all — bomb (clears a 3x3 area), '
                'lightning (clears an entire row), hammer (clears an entire column) — plus a BINGO '
                'BONUS (+50) awarded when one placement clears a row AND a column simultaneously, '
                'and a separate streak multiplier. wood-block-puzzle has NO power blocks, NO bingo '
                'bonus and NO streak; it has 9 base shapes and a combo that increments per cleared '
                'line, capped at x8.'),
            'implementation_evidence': (
                'Distinct engines, not a reskin: WBP uses a square GRID=8 with rowsToClear/colsToClear '
                '(2 clear directions) and 9 SHAPES; BBB uses an 8x8 grid with 33 NORMAL_SHAPES + 3 '
                'special shapes and a separate bingo/streak scoring path. Normalized source '
                'fingerprints differ (WBP 7636 tokens / 9e92bd038fb9 vs BBB 8103 tokens / '
                '46e7d74fde88). Neither ships a LEVELS catalog — both are procedural endless, so '
                'there is no level data to compare.'),
            'quality_score': {
                'wood-block-puzzle': {'core_playable': 'PASS (own verifier, no P0/P1)', 'all_levels_solvable': 'N/A (procedural)', 'input_and_mobile': 'drag-drop, mobile-tuned', 'first_visit_tutorial_curve': 'present', 'visual_audio_feedback': 'present', 'perf_persistence': 'best score persisted', 'verifier_strength': '1 verifier', 'bi_30d': 'pv=0 uv=0'},
                'block-blast-bingo': {'core_playable': 'PASS (own verifier, no P0/P1)', 'all_levels_solvable': 'N/A (procedural)', 'input_and_mobile': 'drag-drop + power blocks, mobile-tuned', 'first_visit_tutorial_curve': 'present (tutorial)', 'visual_audio_feedback': 'present (bingo/streak toasts)', 'perf_persistence': 'stats persisted (best/games/bingos/maxCombo)', 'verifier_strength': '1 verifier', 'bi_30d': 'pv=0 uv=0'},
            },
            'why_no_deletion': 'Different allowed actions (3 extra power-block verbs + bingo bonus + streak) => a different decision surface, not the same core rule with different art. Both are classic-family titles. Per the protocol, name similarity plus same-family membership is NOT sufficient grounds for deletion.',
            'redirected_slugs': [],
        },
        'hearts__spades': {
            'verdict': 'DISTINCT — both retained',
            'rule_difference': ('Both are 4-player trick-taking games sharing only the deal sentence, but '
                                'the rules are different games: hearts = AVOID taking points (each heart '
                                '1, Queen of Spades 13, end at 100 points, card passing Left/Right/Across, '
                                'shooting the moon); spades = BID on the number of tricks, spades are '
                                'always trumps, nil bids (+/-100), bags, play to 500 points. Different '
                                'win conditions, different allowed actions (bid vs pass).'),
            'why_no_deletion': 'Classic games with materially different rules. Per the protocol, classic games and variants with substantive rule differences are never deleted.',
            'redirected_slugs': [],
        },
        'renzoku__lights-out': {
            'verdict': 'DISTINCT — both retained (D4 detector false positive, confirmed by reading both engines)',
            'rule_difference': ('D4 nominated this pair at schema=1.0, verb=1.0, jaccard=1.0 (a perfect '
                                'score), but the engines implement different puzzles: renzoku checkSolution '
                                'flood-fills connected regions and requires each run of equal digits to have '
                                'exactly that many cells; lights-out checkSolution only requires every cell '
                                'to be 0. Same data shape (N x N grid), completely different rule. This is '
                                'exactly the D4 caveat recorded in R333 — schema can nominate, never decide.'),
            'redirected_slugs': [],
        },
        'dotchi-loop__shirokuro': {
            'verdict': 'DISTINCT — both retained',
            'rule_difference': ('D4 nominated sc=0.833/vc=0.833/jc=0.625. dotchi-loop draws a single '
                                'non-intersecting LOOP through all white circles with a straight/turn '
                                'constraint per region; shirokuro connects each white circle to a black '
                                'circle by horizontal/vertical segments that may not cross. Different win '
                                'conditions, different allowed actions (loop vs pair-connection).'),
            'redirected_slugs': [],
        },
        'sukima__triplace': {
            'verdict': 'DISTINCT — both retained',
            'rule_difference': ('Both are Nikoli triomino/region puzzles with 30 levels in 5 tiers, but '
                                'sukima places triominoes in a grid with circles and blocked cells '
                                '(LEVELS carry R/C/circles/blocked/sol), while triplace divides a region '
                                'with numbers into triomino regions (LEVELS carry r/c/b/k/s). Different '
                                'level schema AND different win condition.'),
            'redirected_slugs': [],
        },
        'aqua-digger__time-rewind': {
            'verdict': 'DISTINCT — both retained',
            'rule_difference': ('D4 nominated sc=1.0/vc=1.0 (the joint-highest pair). aqua-digger is a '
                                'dig/route-water puzzle with collectibles and hazards; time-rewind is a '
                                'maze/temporal-copy puzzle with an undo mechanic. Different win conditions '
                                'and different allowed actions.'),
            'redirected_slugs': [],
        },
        'hexxagon_loadState__backgammon_loadGameState__tripeaks_loadGameState': {
            'verdict': 'N/A — persistence wiring, adjudicated under issues_fixed, not a mechanic cluster',
            'note': ('backgammon and tripeaks ALSO have an unreferenced loadGameState, but their whole '
                     'save subsystem (saveGameState/loadGameState/exportGameState/importGameState/'
                     'clearSavedGame) is unreferenced AND has no UI at all — no resume/export/import '
                     'button exists. Nothing is promised to the player and nothing is written, so they '
                     'are dead code, not a broken promise. tilt-maze is the same: saveSettings/'
                     'loadSettings are dead stubs and there is no sound/music toggle UI to change '
                     'settings. hexxagon was different: it WROTE a save on every move and on '
                     'beforeunload, so the missing restore WAS a broken promise — that is why only '
                     'hexxagon got a fix.'),
            'redirected_slugs': [],
        },
    },
    'detector_status': {
        'D8_save_without_restore': ('NEW this tick (.audit/r334-d8-save-without-restore.js). Pairs a CALLED '
                                     'save*/write*/store*/persist* with its matching load*/read*/restore*/'
                                     'restore* and flags the pair when the loader is never called. 4 games '
                                     'found (hexxagon, strimko, magnets, tatami) -> 0 after the fix. '
                                     '4 calibration controls: 1 POSITIVE (save called + load dead must be '
                                     'flagged) and 3 NEGATIVE (both called / no matching load fn / '
                                     'documented intentional no-op loader must NOT be flagged).'),
        'D7_v3_uncalled_functions': ('Extended per R333 next_action. v2 stripped string literals before '
                                      'counting references, so a function reachable ONLY through an inline '
                                      'handler BUILT INSIDE a JS string (onclick="\' + loadLevel(n) + \'") '
                                      'was reported dead. v3 keeps literals in a second RAW pass (comments '
                                      'still stripped) and scans for on<event>= handlers. 92 -> 83 '
                                      'candidates before the fixes. 4 controls: 1 REGRESSION (kropki drawDots '
                                      'must stay unflagged) + 3 synthetic, incl. CONTROL A which reproduces '
                                      'the v2 false positive and CONTROL C which re-catches the kropki P0 class.'),
        'D5_rule_prose': ('Control FAILED this tick and was investigated: "SYNTH one-word : 1.000 (must be '
                          '< 1.000)". Cause: the synthetic one-word edit swapped "exit" for "goal", and '
                          '"goal" is in the STOP list, so the token sets stayed identical — the control was '
                          'measuring its own stopword filter, not the detector. The detector is sound; the '
                          'control was ill-posed. Recorded so the next tick does not re-chase it. The D5 '
                          'pair list dropped sandwich<->kropki from 1.000 to 0.806, which is the R333 prose '
                          'fix taking effect (their rule sentences are now genuinely different).'),
        'D4_schema_verbs': 'Re-run unchanged. The known-DISTINCT leaper family (camel/zebra/bishop/giraffe) still comes back with identical schema and 0.000 verb containment — the recorded caveat that schema can only nominate, never decide. This tick confirmed the caveat with renzoku<->lights-out (schema 1.0, verb 1.0, jaccard 1.0 -> different puzzles).',
        'D6_inherited_rule_prose': 'Re-run unchanged. After the R333 kropki prose fix the kropki shared-sentence count is 3 and all 3 are generic Sudoku boilerplate.',
        'R318_fingerprint2': 'Re-run over all 466 live games: 0 EXACT fingerprint collisions (no two games share an engine).',
    },
    'atomic_consistency': {
        'live_total': 466,
        'unique_slugs': 466,
        'duplicate_slugs': 0,
        'itemlist_schema_count': 466,
        'sitemap_entries': 819,
        'sitemap_extra_game_dirs': 0,
        'test_library_games': 466,
        'index_data_count': 466,
        'index_cat_counts': 'per-category, all 11 match GAMES per cat',
        'sync_game_counts_sh': 'ALL IN SYNC (466 across 5 numeric sources + 11 cat-counts)',
        'sync_user_visible_text_sh': 'ALL USER-VISIBLE TEXT IN SYNC (0 stale)',
        'games_data_node_c': 'PASS',
        'scan_missing_sitechrome': 'Checked 466 live games, 0 with missing site-chrome',
        'catalog_changed_this_sweep': False,
        'r332_atomic_consistency_verdict': 'ATOMIC-CONSISTENT (exit 0) — and negative-tested: injected cat-count drift and an injected ghost-game sitemap entry both produce exit 1',
    },
    'regression_gate': {
        'script': '.audit/r333-verifier-gate.sh (re-run as r334, timeout raised 90s -> 150s per the R333 next_action)',
        'output': '.audit/r334-verifier-gate.tsv',
        'scripts_run_so_far': gate_lines,
        'non_zero_exits_found': gate_nonzero,
        'cwd_shadow_mismatches': gate_cwd_mismatch,
        'note': 'The gate runs every live verify_*.js TWICE (once from the game directory, once from the repo root) so a cwd-shadow bug shows as a disagreement rather than a silent pass. It was still running at sweep close; the 4 games changed this tick were verified individually instead: strimko 30/30 PASS, magnets 30/30 PASS + 30/30 UNIQUE (independent solver), tatami 30/30 PASS + 30/30 UNIQUE (independent solver), hexxagon 19/19 PASS (beats Beginner + Easy via real clicks, all 5 difficulties live).',
    },
    'mechanic_dup_actionable': 0,
    'mechanic_dup_deleted': 0,
    'redirected_slugs': [],
    'zero_issue_sweep': False,
    'zero_issue_streak_after': 0,
    'zero_issue_streak_reset_reason': ('R334 found and fixed 4 real P2 defects (a NEW defect class: '
                                        'save-without-restore) and repaired 2 stale P1 test gates that were '
                                        'reporting PROBLEMS on a healthy catalog. The zero-issue streak '
                                        'resets to 0 per the protocol; two consecutive full sweeps with zero '
                                        'new issues are still required to re-converge.'),
    'commit': head,
    'commit_remote': head_origin,
    'deploy_run': '40200443594',
    'production_verification': {
        'verified_at': now,
        'deploy_run': '40200443594',
        'deploy_status': 'completed/success',
        'deploy_sha': head,
        'prod_hexxagon': 'continue-btn present x3 refs, refreshContinueButton x3 refs; seeded 25-cell save -> reloaded -> button visible -> clicked -> game screen shown, menu hidden, 25 cells restored, 0 errors',
        'prod_hexxagon_mobile_390x844': 'viewportApplied=true, button 313x47 at y=184, inView=true, no horizontal overflow (scrollW 375 <= innerWidth 390), click restored the board, 0 errors',
        'prod_strimko_magnets_tatami': 'production game.js md5 IDENTICAL to local for all three (b021b02e71 / 0265e3ec56 / cf0d990985) and all three contain the restore line',
        'prod_site_chrome': 'h1 OK, canvas OK, footer OK, gz-ad-below-game OK, 0 page errors on all 4 games',
    },
    'lessons_persisted': [
        'game-commercial-readiness-audit/references/r334-save-without-restore-and-stale-gates-2026-10-25.md',
    ],
    'ai_model': 'MiniMax-M3',
    'next_action': ('R335: zero_issue_streak is 0 because R334 fixed 4 P2s and 2 stale gates. Two consecutive '
                    'full sweeps with zero new issues are still required. D8 (save-without-restore) is the '
                    'highest-yield new class and it is now COMMITTED AND CALIBRATED — extend it: the current '
                    'detector only pairs save*/load* by suffix, so it misses a save whose loader has a '
                    'DIFFERENT name (e.g. saveSettings -> readPrefs). The 3 games it did not flag were '
                    'manually triaged and are all dead-stub cases (no UI, nothing written), so the class '
                    'may be near-exhausted at 4 — the next tick should verify that by reading the flagged '
                    'and the unflagged save paths once more rather than assuming 4 is the whole class. '
                    'D7 v3 still has 80 unre-triaged candidates; the remaining high-signal ones are '
                    'RULE-named predicates (freecell:canMoveCards, magic-square:verifyMagic, '
                    'link-a-pix:checkConnection, hitori:isValid) — all triaged this tick and all found to '
                    'be DEAD DUPLICATES OF INLINED LOGIC (the rule IS enforced inline), not defects, which '
                    'is the R333 fulcrum-balance pattern. The D7 detector should therefore EXCLUDE '
                    'functions whose body is duplicated inline at the call site, or that triage will keep '
                    'costing the same manual reading every tick.'),
}

d['sweeps'].append(sweep)
d['last_sweep_id'] = sweep['sweep_id']
d['live_total'] = 466
d['zero_issue_sweeps'] = 0
d['converged'] = False
d['catalog_head'] = head
d['catalog_head_local'] = head
d['catalog_head_origin'] = head_origin
d['catalog_head_actual'] = head_origin
d['last_updated'] = now
d['verified_at'] = now
d['last_verified'] = now
d['last_modified'] = now
d['sweep_count'] = len(d['sweeps'])

d['criteria'].update({
    'catalog_atomic_sync': True,
    'production_cdn_md5_match': 'production game.js md5 IDENTICAL to local for strimko/magnets/tatami; hexxagon index.html carries the continue button + refreshContinueButton on production',
    'production_pages_health': 'production HTTP 200 on all 4 changed games; Kachilu live-browser probe on /hexxagon/ desktop + 390x844 mobile shows the Continue button restoring a 25-cell save with 0 errors; 0 page errors',
    'no_new_mechanic_duplicates': 'wood-block-puzzle vs block-blast-bingo adjudicated DISTINCT (3 extra power-block verbs + bingo bonus + streak); hearts vs spades DISTINCT (classic games, different rules); renzoku vs lights-out, dotchi-loop vs shirokuro, sukima vs triplace, aqua-digger vs time-rewind all DISTINCT. 0 deletions this sweep.',
    'cluster_set_unchanged_from_baseline': True,
    'zero_issue_streak_required': 2,
    'zero_issue_streak_actual': 0,
    'converged': False,
    'save_without_restore_detector_added': True,
    'save_without_restore_defects_repaired': 4,
    'stale_audit_gates_repaired': 2,
    'd7_v3_template_literal_blind_spot_fixed': True,
    'atomic_gate_negative_tested': 'injected cat-count drift -> exit 1; injected ghost-game dir + sitemap entry -> exit 1; healthy -> exit 0',
})

# atomic write
dirname = os.path.dirname(P)
fd, tmp = tempfile.mkstemp(dir=dirname, prefix='.gz-state-', suffix='.json')
with os.fdopen(fd, 'w') as f:
    json.dump(d, f, indent=1, ensure_ascii=False)
os.replace(tmp, P)
print('state written:', P)
print('  sweeps:', len(d['sweeps']), '| zero_issue_streak:', d['zero_issue_sweeps'], '| converged:', d['converged'])
print('  catalog_head:', head)
print('  gate scripts run:', gate_lines, '| non-zero exits:', len(gate_nonzero), '| cwd mismatches:', len(gate_cwd_mismatch))
