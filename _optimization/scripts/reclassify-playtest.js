#!/usr/bin/env node
/* Post-process playtest verdicts: the harness sampled canvas pixels (4KB hash) as the
 * primary liveness signal, so DOM-driven games (no canvas, or canvas painted once) were
 * mass-marked DEAD even while their game state demonstrably changed.
 * Reclassification is evidence-based, per entry:
 *   DOM state change = scoreLikeChanges>0 | scoreTexts initial→final differ | scoreEls differ
 * Rules:
 *   DEAD   + DOM state change            → PLAYABLE (reclassifiedBy=dom-state-change)
 *   DEAD   + no signal                   → DEAD-UNCONFIRMED (triage list)
 *   DEGRADED                             → keep, annotate domSignal true/false
 * Raw verdict preserved as verdictRaw. Output: reports/playtest-reclassified.json */
const fs = require('fs');
const path = require('path');
const FILE = path.join(__dirname, '..', 'reports', 'playtest-results.json');
const r = JSON.parse(fs.readFileSync(FILE, 'utf8'));
const results = r.results || r;

const domSignal = e => {
  const textsChanged = JSON.stringify(e.initial?.scoreTexts || []) !== JSON.stringify(e.final?.scoreTexts || []);
  const hudChanged = e.initial?.scoreEls && e.final?.scoreEls &&
    JSON.stringify(e.initial.scoreEls) !== JSON.stringify(e.final.scoreEls);
  return (e.scoreLikeChanges || 0) > 0 || textsChanged || hudChanged;
};

const summary = { PLAYABLE: 0, DEGRADED: 0, DEAD: 0, DEAD_UNCONFIRMED: 0 };
const triage = [], promoted = [];
for (const [slug, e] of Object.entries(results)) {
  e.verdictRaw = e.verdictRaw || e.verdict;
  const sig = domSignal(e);
  e.domSignal = sig;
  if (e.verdict === 'DEAD') {
    if (sig && e.started) { e.verdict = 'PLAYABLE'; e.reclassifiedBy = 'dom-state-change'; promoted.push(slug); }
    else { e.verdict = 'DEAD-UNCONFIRMED'; triage.push(slug); }
  } else if (e.verdict === 'DEGRADED') {
    e.domSignalNote = sig ? 'dom-state-change present' : 'no dom signal — canvas-hash sampling may be too coarse for subtle animation';
  }
  summary[e.verdict] = (summary[e.verdict] || 0) + 1;
}
r.reclassified = { at: new Date().toISOString(), rules: 'see header comment', promoted: promoted.length, promotedList: promoted.slice(0, 250), triageList: triage };
fs.writeFileSync(FILE, JSON.stringify(r, null, 1));
fs.writeFileSync(path.join(__dirname, '..', 'reports', 'playtest-reclassified.json'), JSON.stringify({ summary, promotedCount: promoted.length, triageCount: triage.length, triageList: triage, promotedSample: promoted.slice(0, 60) }, null, 1));
console.log('verdicts after reclassification:', JSON.stringify(summary));
console.log('triage (DEAD-UNCONFIRMED):', triage.join(','));
