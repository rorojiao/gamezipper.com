#!/usr/bin/env node
// In-engine verifier for suraromu. Delegates to shared-vm-verify.js.
process.argv[2] = 'suraromu';
require('../.audit/shared-vm-verify.js');
