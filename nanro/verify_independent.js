// Nanro Independent Verification (Node.js)
const fs = require('fs');
const levels = JSON.parse(fs.readFileSync('/home/msdn/gamezipper.com/nanro/levels.json', 'utf8'));

console.log('=== Nanro Independent Verification (Node.js) ===');
console.log('Total levels:', levels.length);
console.log();

let allPass = true;

levels.forEach(function(lvl) {
    var issues = [];
    var rows = lvl.rows, cols = lvl.cols;
    var rm = lvl.region_map, sol = lvl.solution, clues = lvl.clues;
    
    // 1. Check connectivity via BFS for each region
    for (var rid = 0; rid < lvl.num_regions; rid++) {
        var cells = [];
        for (var r = 0; r < rows; r++)
            for (var c = 0; c < cols; c++)
                if (rm[r][c] === rid) cells.push([r, c]);
        
        if (cells.length === 0) { issues.push('EMPTY_REGION_' + rid); continue; }
        
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
            issues.push('DISCONNECTED_REGION_' + rid + ': ' + Object.keys(visited).length + '/' + cells.length);
    }
    
    // 2. Count numbered cells per region
    var regionNums = {};
    for (var r = 0; r < rows; r++)
        for (var c = 0; c < cols; c++)
            if (sol[r][c] > 0) {
                var rid = rm[r][c];
                regionNums[rid] = (regionNums[rid] || 0) + 1;
            }
    
    // 3. Check all regions have >=1 numbered cell
    for (var rid = 0; rid < lvl.num_regions; rid++)
        if (!regionNums[rid]) issues.push('NO_NUMBERED_IN_REGION_' + rid);
    
    // 4. Check number values match region count
    for (var r = 0; r < rows; r++)
        for (var c = 0; c < cols; c++)
            if (sol[r][c] > 0) {
                var rid = rm[r][c];
                if (sol[r][c] !== regionNums[rid])
                    issues.push('NUMBER_MISMATCH at (' + r + ',' + c + '): ' + sol[r][c] + ' != ' + regionNums[rid]);
            }
    
    // 5. Check no cross-region same-number adjacency
    for (var r = 0; r < rows; r++)
        for (var c = 0; c < cols; c++)
            if (sol[r][c] > 0) {
                var rid = rm[r][c];
                [[-1,0],[1,0],[0,-1],[0,1]].forEach(function(d) {
                    var nr = r + d[0], nc = c + d[1];
                    if (nr >= 0 && nr < rows && nc >= 0 && nc < cols && sol[nr][nc] > 0) {
                        var nrid = rm[nr][nc];
                        if (nrid !== rid && sol[nr][nc] === sol[r][c])
                            issues.push('ADJACENT_SAME at (' + r + ',' + c + ')-(' + nr + ',' + nc + ') num=' + sol[r][c]);
                    }
                });
            }
    
    // 6. Check clues match solution
    Object.keys(clues).forEach(function(key) {
        var parts = key.split(',').map(Number);
        if (sol[parts[0]][parts[1]] !== clues[key])
            issues.push('CLUE_MISMATCH at (' + key + ')');
    });
    
    var status = issues.length === 0 ? 'PASS' : 'FAIL';
    if (issues.length > 0) allPass = false;
    console.log('  ' + status + ' Level ' + lvl.level + ': ' + rows + 'x' + cols + ' ' + lvl.difficulty + 
                ' -- ' + lvl.num_regions + ' regions, ' + Object.keys(clues).length + ' clues [' + status + ']');
    if (issues.length > 0) issues.slice(0, 3).forEach(function(i) { console.log('    -> ' + i); });
});

console.log();
if (allPass) console.log('=== RESULT: ALL ' + levels.length + ' LEVELS VALID ===');
else { console.log('=== RESULT: SOME LEVELS FAILED ==='); process.exit(1); }
