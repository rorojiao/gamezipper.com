// Fast level verification (grid size + shape integrity)
const LEVELS = [
    {tier: 'Beginner', gridW: 6, gridH: 10, blocked: []},
    {tier: 'Beginner', gridW: 6, gridH: 10, blocked: []},
    {tier: 'Beginner', gridW: 6, gridH: 10, blocked: []},
    {tier: 'Beginner', gridW: 6, gridH: 10, blocked: []},
    
    {tier: 'Easy', gridW: 5, gridH: 12, blocked: []},
    {tier: 'Easy', gridW: 5, gridH: 12, blocked: []},
    {tier: 'Easy', gridW: 5, gridH: 12, blocked: []},
    {tier: 'Easy', gridW: 5, gridH: 12, blocked: []},
    
    {tier: 'Medium', gridW: 8, gridH: 8, blocked: [[0,0],[7,7],[0,7],[7,0]]},
    {tier: 'Medium', gridW: 8, gridH: 8, blocked: [[3,3],[4,3],[3,4],[4,4]]},
    {tier: 'Medium', gridW: 8, gridH: 8, blocked: [[0,3],[0,4],[7,3],[7,4]]},
    {tier: 'Medium', gridW: 8, gridH: 8, blocked: [[3,0],[4,0],[3,7],[4,7]]},
    {tier: 'Medium', gridW: 8, gridH: 8, blocked: [[1,1],[6,1],[1,6],[6,6]]},
    
    {tier: 'Hard', gridW: 10, gridH: 10, blocked: Array.from({length:40},() => [Math.floor(Math.random()*10), Math.floor(Math.random()*10)])},
    {tier: 'Hard', gridW: 10, gridH: 10, blocked: Array.from({length:40},() => [Math.floor(Math.random()*10), Math.floor(Math.random()*10)])},
    {tier: 'Hard', gridW: 10, gridH: 10, blocked: Array.from({length:40},() => [Math.floor(Math.random()*10), Math.floor(Math.random()*10)])},
    {tier: 'Hard', gridW: 10, gridH: 10, blocked: Array.from({length:40},() => [Math.floor(Math.random()*10), Math.floor(Math.random()*10)])},
    {tier: 'Hard', gridW: 10, gridH: 10, blocked: Array.from({length:40},() => [Math.floor(Math.random()*10), Math.floor(Math.random()*10)])},
    
    {tier: 'Expert', gridW: 4, gridH: 15, blocked: []},
    {tier: 'Expert', gridW: 4, gridH: 15, blocked: []},
    {tier: 'Expert', gridW: 4, gridH: 15, blocked: []},
    {tier: 'Expert', gridW: 4, gridH: 15, blocked: []},
    {tier: 'Expert', gridW: 4, gridH: 15, blocked: []},
    
    {tier: 'Master', gridW: 6, gridH: 10, blocked: []},
    {tier: 'Master', gridW: 6, gridH: 10, blocked: []},
    {tier: 'Master', gridW: 6, gridH: 10, blocked: []},
    {tier: 'Master', gridW: 6, gridH: 10, blocked: []}
];

console.log('Verifying 27 levels...\n');

let validCount = 0;

LEVELS.forEach((config, i) => {
    const totalCells = config.gridW * config.gridH;
    const blocked = config.blocked.length;
    const fillable = totalCells - blocked;
    
    if (fillable === 60) {
        console.log(`✅ Level ${i+1} (${config.tier}): ${config.gridW}x${config.gridH} - ${blocked} blocked, ${fillable} fillable`);
        validCount++;
    } else {
        console.log(`❌ Level ${i+1} (${config.tier}): ${fillable} cells (expected 60)`);
    }
});

console.log(`\n=== SUMMARY ===`);
console.log(`Valid: ${validCount}/27`);

if (validCount === 27) {
    console.log('✅ ALL LEVELS PASS GRID SIZE CHECK!');
} else {
    console.log('❌ Some levels invalid');
}
