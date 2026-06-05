# GameZipper QA Process & Protocol (v1.0)

## Overview
This document defines the operating procedures for GameZipper QA system.
Effective 2026-06-06 per user policy: **100% P0-P3 fix rate (zero-tolerance)**.

## 1. Test Plan & Execution

### Per-Game Test Process
For each game (out of 126 total):
1. **Static check** (1 iter, 3 agents): HTTP 200, content has required elements
2. **Functional check** (1 subagent): 6 dimensions (load, render, gameplay, console, GAME BREAK, ads/footer)
3. **Verification** (10 iter × 3 agents = 30 checks): All must pass

### Issue Severity (per user policy)
- **P0**: Blocker (game unplayable, site broken). 100% fix.
- **P1**: Critical (core gameplay broken, data error). 100% fix.
- **P2**: Major (UI/experience). 100% fix.
- **P3**: Minor (text, cosmetic). 100% fix.

## 2. Issue Management

### Issue Recording Standard
Each issue must include:
- Issue ID (auto: `GZ-YYYYMMDD-NNN`)
- Game slug
- Test environment (browser, device, OS)
- Issue type (P0/P1/P2/P3)
- Severity
- Reproduction steps
- Actual result
- Expected result
- Screenshot/video

### Fix Process
1. Test engineer submits issue
2. PM (auto-assigned via cron) reviews within 24h
3. Developer fixes, marks "Pending Verification"
4. Test engineer runs 3-agent × 10-iter verification
5. If pass: close issue
6. If fail: reopen

### SLA
- P0/P1: fix + verify within 48h
- P2/P3: fix + verify within 7d

## 3. Verification Protocol

### 3-Agent × 10-Iter
Per user policy 2026-06-06:
- Every fix must be verified by 3 independent agents
- Each agent runs same test case 10 times
- All 30 checks must pass
- Tool: `test-library/verify-lite.js <slug>`

```bash
cd /home/msdn/gamezipper.com
node test-library/verify-lite.js <slug>
# Exit 0 = all pass
# Exit 1 = at least one fail (need to re-fix)
```

### Regression Testing
- After P0/P1 fix: full regression test on entire game (126 games)
- After P2/P3 fix: regression on related features (e.g. all ad-related games)

## 4. Continuous Cycle

### 3-Round Verification
- R1: All 126 games tested, all issues fixed
- R2: All 126 games re-tested, all new issues fixed
- R3: All 126 games re-tested, all new issues fixed
- Cycle resets to R1 if ANY new issues found in R2 or R3

### Termination Criteria (ALL must be satisfied)
✅ 3 consecutive rounds with 0 new issues
✅ Test library evolved at least 3 times via Dynamic Test Intelligence
✅ 100% of all issues (P0-P3) fixed and verified
✅ Performance metrics met (homepage ≤ 2s, game ≤ 3s)
✅ All games run flawlessly on all tested devices/browsers
✅ No security or compliance issues

## 5. Dynamic Test Intelligence (4h cycle)

### Process
1. Search web for new testing techniques / browser updates / security advisories
2. Identify 5-10 new test cases
3. Add to master library with version bump
4. Commit to git
5. Update CHANGELOG

### Coverage Targets
- ≥3 library evolutions before termination
- Each evolution must add ≥5 new test cases
- Sources must be cited

## 6. Adaptive Testing Depth

### Rules
- 0 issues in 2 consecutive rounds → reduce depth 20% (e.g. 10 → 8 iter)
- 3+ issues in single round → increase depth 50% + add 10 random cases (10 → 15 iter)
- Recurring feature issue → dedicated hourly test suite

### Implementation
Tool: `test-library/adaptive-depth.js <slug> [issues]`

## 7. Agent Task Allocation

### Cron Jobs
- **36e21d25f954**: R1 batch (5 games per 6h tick)
- **43a2bdf357bb**: Dynamic Test Intelligence (4h, library evolution)
- Future: Per-feature dedicated suites

### Subagent Guidelines
- 1 subagent per game (not 1 per dimension)
- 3-min budget per subagent
- Kachilu CLI preferred (NOT Camoufox MCP)
- Real fixes only, no fake reports
- Subagents commit only (parent pushes)

## 8. Push Protocol

### Subagents
- **Only commit** to local branch
- **Never push** (prevents race with cron)

### Parent Agent
- After collecting subagent fixes: `git add -A && git commit && git push origin main`
- **Wait 120s** between any two pushes (rule from memory)
- Monitor push result; if 5xx retry once, if 4xx check auth

## 9. Reporting

### Per-Tick Report
- Games tested: N
- Pass/FAIL count
- Bugs fixed: list of (game, bug, commit hash)
- Library version used
- Remaining games count
- Save to: `test-library/verify-results/r{N}-report.md`

### Final Acceptance Report
- Full coverage statistics
- Complete issue history
- Library evolution history
- Performance benchmarks
- Compatibility results
- Security audit
- Acceptance conclusion

## 10. Special Considerations

### Network & CDN
- Wait 60s after push for Vercel deploy
- Cache-bust version on game-data.js, gz-analytics.js
- Cloudflare cache 4h, Vercel CDN 30-60s

### External Endpoints (lessons learned)
- **Never** use HTTP endpoints in HTTPS pages (mixed-content)
- **Never** reference dead domains (1ktower, alwingulla, rye.io)
- **Verify** all external script srcs return HTTP 200
- Vercel 12月 2025+: /api/*.js no longer routes to Edge function (use /api/* without .js OR `export async function POST()`)

### Local Resources
- localStorage keys: `gz_<game>_v<N>` (e.g. `gz_dunk_v1`)
- Archive: `gz_aa` (long-term), `gz_ab` (batch buffer)
- Maximum 500 events in archive (FIFO)
