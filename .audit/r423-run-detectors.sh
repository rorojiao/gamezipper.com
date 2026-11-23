#!/bin/bash
cd /home/junze/gamezipper.com
python3 .audit/r338-fingerprint2.py > .audit/r423-fingerprint2.out 2> .audit/r423-fingerprint2.err
node .audit/r338-d21-dup-levels.js --all > .audit/r423-d21.out 2>&1
python3 .audit/r411-d21-chunked-catalog.py > .audit/r423-d21-chunked.out 2>&1
node .audit/r338-d21-advertised-axes.js > .audit/r423-axes.out 2>&1
python3 .audit/r332-redirect-leak-detector.py > .audit/r423-redirect.out 2>&1
node scripts/audit-uniqueness-gates.js > .audit/r423-uniqueness-gate.out 2>&1
echo DONE_ALL
