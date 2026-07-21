#!/usr/bin/env node
// In-engine verifier for mid-loop. Delegates to shared-vm-verify.js.
process.argv[2] = 'mid-loop';
require('../.audit/shared-vm-verify.js');
