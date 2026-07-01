#!/usr/bin/env node
/**
 * jsdom integration test for Trebuchet Trajectory.
 * Loads index.html in a DOM, verifies LEVELS loaded, UI elements present,
 * and that levels L1, L15, L30 are solvable via the embedded physics.
 */
const { JSDOM } = require('jsdom');
const fs = require('fs');
const path = require('path');

const html = fs.readFileSync(path.join(__dirname, 'index.html'), 'utf8');

const dom = new JSDOM(html, {
    runScripts: 'dangerously',
    pretendToBeVisual: true,
    storageQuota: 10000000,
});

const { window } = dom;
const { document } = window;

// Wait for script execution
setTimeout(() => {
    let pass = 0, fail = 0;
    function check(name, cond) {
        if (cond) { pass++; console.log(`  ✅ ${name}`); }
        else { fail++; console.log(`  ❌ ${name}`); }
    }

    console.log('='.repeat(70));
    console.log('jsdom Integration Test — Trebuchet Trajectory');
    console.log('='.repeat(70));

    // Check LEVELS loaded (const LEVELS isn't on window, extract from simulate usage)
    // We can verify by checking loadLevel works and cur() returns valid data
    let levels = null;
    if (typeof window.simulate === 'function') {
        // Reconstruct levels by calling loadLevel for each and reading state
        // Actually, check if LEVELS is accessible via eval
        try { levels = window.eval('LEVELS'); } catch(e) {}
        if (!levels) {
            try { levels = window.eval('typeof LEVELS !== "undefined" ? LEVELS : null'); } catch(e) {}
        }
    }
    check('LEVELS array exists', Array.isArray(levels));
    check('LEVELS has 30 entries', levels && levels.length === 30);

    // Check UI elements
    const canvas = document.getElementById('game');
    check('Canvas element present', !!canvas);
    check('Canvas is 360x320', canvas && canvas.width === 360 && canvas.height === 320);

    check('Power slider present', !!document.getElementById('power'));
    check('Angle slider present', !!document.getElementById('angle'));
    check('Level grid present', !!document.getElementById('grid'));
    check('Message element present', !!document.getElementById('msg'));
    check('Launch button text correct', document.body.innerHTML.includes('🚀 Launch'));

    // Check grid buttons
    const gridBtns = document.querySelectorAll('.lvl-btn');
    check('Grid has 30 level buttons', gridBtns.length === 30);

    // Check physics functions exist
    check('simulate function exists', typeof window.simulate === 'function');
    check('fire function exists', typeof window.fire === 'function');
    check('loadLevel function exists', typeof window.loadLevel === 'function');

    // Verify L1, L15, L30 solvable using the game's own simulate()
    if (typeof window.simulate === 'function' && levels) {
        const testLevels = [0, 14, 29]; // L1, L15, L30
        for (const li of testLevels) {
            const lv = levels[li];
            let solutionHits = false;
            let hitterCount = 0;
            for (let p = 0; p < lv.np; p++) {
                for (let a = 0; a < lv.na; a++) {
                    const res = window.simulate(lv.v[p], lv.a[a], lv.o || []);
                    if (!res.blocked) {
                        if (Math.abs(res.landX - lv.tx) < lv.tw && Math.abs(res.landY - lv.ty) < 18) {
                            hitterCount++;
                            if (p === lv.sp && a === lv.sa) solutionHits = true;
                        }
                    }
                }
            }
            check(`L${li + 1} solution valid (sol combo hits target)`, solutionHits);
            check(`L${li + 1} unique (exactly 1 hitter)`, hitterCount === 1);
        }
    }

    console.log('='.repeat(70));
    console.log(`RESULTS: ${pass} passed, ${fail} failed`);
    console.log(`Overall: ${fail === 0 ? '✅ ALL PASS' : '❌ FAILURES'}`);
    console.log('='.repeat(70));
    process.exit(fail === 0 ? 0 : 1);
}, 500);
