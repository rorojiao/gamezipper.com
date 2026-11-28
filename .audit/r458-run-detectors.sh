#!/bin/bash
cd /home/junze/gamezipper.com
node .audit/r332-atomic-consistency.js > .audit/r458-atomic.out 2>&1
node .audit/r339-nominate.js > .audit/r458-nominate.out 2>&1
python3 .audit/r338-fingerprint2.py > .audit/r458-fingerprint2.out 2> .audit/r458-fingerprint2.err
node .audit/r338-d21-dup-levels.js --all > .audit/r458-d21.out 2>&1
node .audit/r338-d21-advertised-axes.js > .audit/r458-axes.out 2>&1
python3 .audit/r332-redirect-leak-detector.py > .audit/r458-redirect.out 2>&1
node scripts/audit-uniqueness-gates.js > .audit/r458-uniqueness-gate.out 2>&1
python3 .audit/r332-internal-link-audit.py > .audit/r458-internallink.out 2>&1
python3 scripts/gz-link-leak-detector.py > .audit/r458-linkleak.out 2>&1
echo DONE_ALL
