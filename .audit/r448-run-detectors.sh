#!/bin/bash
cd /home/msdn/gamezipper.com
node .audit/r332-atomic-consistency.js > .audit/r448-atomic.out 2>&1
python3 .audit/r438-fp-resync.py > .audit/r448-fingerprint.out 2>&1
node .audit/r338-d21-dup-levels.js --all > .audit/r448-d21.out 2>&1
node .audit/r338-d21-advertised-axes.js > .audit/r448-axes.out 2>&1
node scripts/audit-uniqueness-gates.js > .audit/r448-uniqueness-gate.out 2>&1
python3 scripts/gz-link-leak-detector.py > .audit/r448-linkleak.out 2>&1
echo DONE_ALL
