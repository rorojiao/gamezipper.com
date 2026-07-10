// Nanro In-Engine Verification — loads LEVELS from index.html and validates
const fs = require('fs');
const vm = require('vm');

const html = fs.readFileSync('/home/msdn/gamezipper.com/nanro/index.html', 'utf8');

// Extract LEVELS from the HTML
const match = html.match(/const LEVELS=(\[.*?\]);/);
if (!match) { console.log('ERROR: Cannot find LEVELS array'); process.exit(1); }

// Execute the LEVELS assignment in a VM context
const ctx = { console: console };
vm.createContext(ctx);
vm.runInContext('var LEVELS=' + match[1] + ';', ctx);
const LEVELS = ctx.LEVELS;

console.log('=== Nanro In-Engine Verification ===');
console.log('Levels extracted from index.html:', LEVELS.length);
console.log();

let allPass = true;

LEVELS.forEach(function(lvl) {
    var issues = [];
    var rows = lvl.rows, cols = lvl.cols;
    var rm = lvl.region_map, sol = lvl.solution, clues = lvl.clues;
    
    // 1. Connectivity
    for (var rid = 0; rid < lvl.num_regions; rid++) {
        var cells = [];
        for (var r = 0; r < rows; r++)
            for (var c = 0; c < cols; c++)
                if (rm[r][c] === rid) cells.push([r, c]);
        if (cells.length === 0) continue;
        
        var visited = {};
        var queue = [cells[0].join(',')];
        visited[cells[0].join(',')] = true;
        while (queue.length > 0) {
            var parts = queue.shift().split(',').map(Number);
            var r = parts[0], c = parts[1];
            [[-1,0],[1,0],[0,-1],[0,1]].forEach(function(d) {
                var nr = r + d[0], nc = c + d[1];
                if (nr >= 0 && nr < rows && nc >= 0 && nc < cols && rm[nr][nc] === rid) {
                    var key = nr + ',' + nc;
                    if (!visited[key]) { visited[key] = true; queue.push(key); }
                }
            });
        }
        if (Object.keys(visited).length !== cells.length)
            issues.push('DISCONNECTED_' + rid);
    }
    
    // 2. Region numbered counts
    var regionNums = {};
    for (var r = 0; r < rows; r++)
        for (var c = 0; c < cols; c++)
            if (sol[r][c] > 0) regionNums[rm[r][c]] = (regionNums[rm[r][c]] || 0) + 1;
    
    for (var rid = 0; rid < lvl.num_regions; rid++)
        if (!regionNums[rid]) issues.push('NO_NUM_REGION_' + rid);
    
    // 3. Number = region count
    for (var r = 0; r < rows; r++)
        for (var c = 0; c < cols; c++)
            if (sol[r][c] > 0 && sol[r][c] !== regionNums[rm[r][c]])
                issues.push('NUM_MISMATCH_(' + r + ',' + c + ')');
    
    // 4. Cross-region adjacency
    for (var r = 0; r < rows; r++)
        for (var c = 0; c < cols; c++)
            if (sol[r][c] > 0) {
                var rid = rm[r][c];
                [[-1,0],[1,0],[0,-1],[0,1]].forEach(function(d) {
                    var nr = r + d[0], nc = c + d[1];
                    if (nr >= 0 && nr < rows && nc >= 0 && nc < cols && sol[nr][nc] > 0)
                        if (rm[nr][nc] !== rid && sol[nr][nc] === sol[r][c])
                            issues.push('ADJ_SAME_(' + r + ',' + c + ')');
                });
            }
    
    // 5. Clues match
    Object.keys(clues).forEach(function(key) {
        var parts = key.split(',').map(Number);
        if (sol[parts[0]][parts[1]] !== clues[key])
            issues.push('CLUE_BAD_(' + key + ')');
    });
    
    var status = issues.length === 0 ? 'OK' : 'FAIL';
    if (issues.length > 0) allPass = false;
    var emoji = issues.length === 0 ? '\u2705' : '\u274c';
    console.log('  ' + emoji + ' Level ' + lvl.level + ': ' + rows + 'x' + cols + ' ' + lvl.difficulty + 
                ' \u2014 ' + lvl.num_regions + '/' + lvl.num_regions + ' regions ' + (issues.length === 0 ? '\u2713' : '\u2717') + 
                ' ' + (issues.length === 0 ? '\u2713' : '\u2717'));
    if (issues.length > 0) issues.slice(0, 3).forEach(function(i) { console.log('    -> ' + i); });
});

console.log();
if (allPass) console.log('=== RESULT: ALL ' + LEVELS.length + ' LEVELS VALID \u2705 ===');
else { console.log('=== RESULT: SOME LEVELS FAILED ==='); process.exit(1); }
