#!/bin/bash
cd /home/junze/gamezipper.com
node .audit/r332-atomic-consistency.js > .audit/r431-atomic.out 2>&1
python3 .audit/r333-nominate.py > .audit/r431-nominate.out 2>&1
python3 .audit/r338-fingerprint2.py > .audit/r431-fingerprint2.out 2> .audit/r431-fingerprint2.err
node .audit/r338-d21-dup-levels.js --all > .audit/r431-d21.out 2>&1
python3 .audit/r411-d21-chunked-catalog.py > .audit/r431-d21-chunked.out 2>&1
node .audit/r338-d21-advertised-axes.js > .audit/r431-axes.out 2>&1
python3 .audit/r332-redirect-leak-detector.py > .audit/r431-redirect.out 2>&1
node scripts/audit-uniqueness-gates.js > .audit/r431-uniqueness-gate.out 2>&1
python3 .audit/r332-internal-link-audit.py > .audit/r431-internallink.out 2>&1
echo DONE_ALL
