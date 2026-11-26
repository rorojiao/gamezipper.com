#!/bin/bash
cd /home/junze/gamezipper.com
node .audit/r332-atomic-consistency.js > .audit/r442-atomic.out 2>&1
python3 .audit/r333-nominate.py > .audit/r442-nominate.out 2>&1
python3 .audit/r338-fingerprint2.py > .audit/r442-fingerprint2.out 2> .audit/r442-fingerprint2.err
node .audit/r338-d21-dup-levels.js --all > .audit/r442-d21.out 2>&1
python3 .audit/r411-d21-chunked-catalog.py > .audit/r442-d21-chunked.out 2>&1
node .audit/r338-d21-advertised-axes.js > .audit/r442-axes.out 2>&1
python3 .audit/r332-redirect-leak-detector.py > .audit/r442-redirect.out 2>&1
node scripts/audit-uniqueness-gates.js > .audit/r442-uniqueness-gate.out 2>&1
python3 .audit/r332-internal-link-audit.py > .audit/r442-internallink.out 2>&1
python3 scripts/gz-link-leak-detector.py > .audit/r442-linkleak.out 2>&1
echo DONE_ALL
