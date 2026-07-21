#!/usr/bin/env node
// In-engine verifier for nuritwin. Delegates to shared-vm-verify.js.
// (Original had scriptMatch[1] ReferenceError from R3 batch rewriter — fixed via shared verifier.)
process.argv[2] = 'nuritwin';
require('../.audit/shared-vm-verify.js');
