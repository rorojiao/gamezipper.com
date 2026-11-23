#!/bin/bash
cd /home/junze/gamezipper.com
python3 .audit/r338-fingerprint2.py > .audit/r426-fingerprint2.out 2> .audit/r426-fingerprint2.err
node .audit/r338-d21-dup-levels.js --all > .audit/r426-d21.out 2>&1
python3 .audit/r411-d21-chunked-catalog.py > .audit/r426-d21-chunked.out 2>&1
node .audit/r338-d21-advertised-axes.js > .audit/r426-axes.out 2>&1
python3 .audit/r332-redirect-leak-detector.py > .audit/r426-redirect.out 2>&1
node scripts/audit-uniqueness-gates.js > .audit/r426-uniqueness-gate.out 2>&1
echo DONE_ALL
