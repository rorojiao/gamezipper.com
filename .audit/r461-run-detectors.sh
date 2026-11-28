#!/bin/bash
cd /home/msdn/gamezipper.com
node .audit/r332-atomic-consistency.js > .audit/r461-atomic.out 2>&1
node .audit/r339-nominate.js > .audit/r461-nominate.out 2>&1
python3 .audit/r456-fingerprint2.py > .audit/r461-fingerprint2.out 2> .audit/r461-fingerprint2.err
node .audit/r338-d21-dup-levels.js --all > .audit/r461-d21.out 2>&1
node .audit/r338-d21-advertised-axes.js > .audit/r461-axes.out 2>&1
node scripts/audit-uniqueness-gates.js > .audit/r461-uniqueness-gate.out 2>&1
python3 scripts/gz-link-leak-detector.py > .audit/r461-linkleak.out 2>&1
echo DONE_ALL
