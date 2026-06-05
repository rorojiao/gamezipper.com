#!/usr/bin/env node
/**
 * Adaptive testing depth decision
 * Per user policy:
 * - 0 issues in 2 consecutive rounds: reduce testing depth by 20%
 * - 3+ issues in single round: increase testing depth by 50% + add 10 random test cases
 * - Recurring feature issue: dedicated hourly test suite
 *
 * Usage: node adaptive-depth.js <slug> <current_iter> <issues_history_json>
 */

const fs = require('fs');
const path = require('path');

const BASE_DEPTH = 10;  // 10 iter * 3 agents = 30 checks per game per round
const REDUCTION = 0.2;
const INCREASE = 0.5;

function loadHistory(slug) {
  const file = path.join(__dirname, 'verify-results', `history-${slug}.json`);
  if (fs.existsSync(file)) {
    return JSON.parse(fs.readFileSync(file, 'utf8'));
  }
  return { rounds: [] };
}

function decide(slug, currentIssues) {
  const history = loadHistory(slug);
  history.rounds.push({
    timestamp: new Date().toISOString(),
    issues: currentIssues,
  });
  fs.writeFileSync(
    path.join(__dirname, 'verify-results', `history-${slug}.json`),
    JSON.stringify(history, null, 2)
  );

  const last2 = history.rounds.slice(-2);
  const last1 = last2[last2.length - 1];

  let newDepth = BASE_DEPTH;
  let reason = 'baseline';

  // 0 issues in 2 consecutive rounds → reduce 20%
  if (last2.length === 2 && last2.every(r => r.issues === 0)) {
    newDepth = Math.max(5, Math.round(BASE_DEPTH * (1 - REDUCTION)));
    reason = 'reduced: 0 issues in 2 rounds';
  }

  // 3+ issues in single round → increase 50% + add 10 random cases
  if (last1.issues >= 3) {
    newDepth = Math.min(30, Math.round(BASE_DEPTH * (1 + INCREASE)));
    reason = `increased: ${last1.issues} issues in last round`;
  }

  return { depth: newDepth, reason, addRandomCases: last1.issues >= 3 ? 10 : 0 };
}

if (require.main === module) {
  const slug = process.argv[2];
  const issues = parseInt(process.argv[3] || '0', 10);
  if (!slug) { console.error('Usage: node adaptive-depth.js <slug> [issues]'); process.exit(1); }
  const result = decide(slug, issues);
  console.log(JSON.stringify(result, null, 2));
}

module.exports = { decide, BASE_DEPTH };
