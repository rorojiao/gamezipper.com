#!/bin/bash
cd /home/junze/gamezipper.com
node .audit/r332-atomic-consistency.js > .audit/r450-atomic.out 2>&1
python3 .audit/r333-nominate.py > .audit/r450-nominate.out 2>&1
python3 .audit/r338-fingerprint2.py > .audit/r450-fingerprint2.out 2> .audit/r450-fingerprint2.err
node .audit/r338-d21-dup-levels.js --all > .audit/r450-d21.out 2>&1
python3 .audit/r411-d21-chunked-catalog.py > .audit/r450-d21-chunked.out 2>&1
node .audit/r338-d21-advertised-axes.js > .audit/r450-axes.out 2>&1
python3 .audit/r332-redirect-leak-detector.py > .audit/r450-redirect.out 2>&1
node scripts/audit-uniqueness-gates.js > .audit/r450-uniqueness-gate.out 2>&1
python3 .audit/r332-internal-link-audit.py > .audit/r450-internallink.out 2>&1
python3 scripts/gz-link-leak-detector.py > .audit/r450-linkleak.out 2>&1
echo DONE_ALL
