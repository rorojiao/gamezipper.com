
#include <stdio.h>
#include <stdlib.h>
#include <string.h>
#include <stdbool.h>

// Akichiwake solver - binary grid coloring with uniqueness check
// Input (stdin): R C numClues clue_r clue_c clue_val ...
// clue_val: -1 = no clue, 0-4 = clue value
// Grid: 0=white, 1=black, -1=unassigned
// Constraint: numbered cell's clue = count of same-color neighbors

int R, C, N;
int clues[256];   // -1 = no clue, 0-4 = expected same-color neighbor count
int grid[256];    // -1=unassigned, 0=white, 1=black
int solutions;
long long nodes;

int dr[] = {-1, 1, 0, 0};
int dc[] = {0, 0, -1, 1};

bool inBounds(int r, int c) { return r>=0 && r<R && c>=0 && c<C; }

int getNeighborIdx(int r, int c, int d) {
    int nr = r + dr[d], nc = c + dc[d];
    if (!inBounds(nr, nc)) return -1;
    return nr * C + nc;
}

// Count same-color assigned neighbors of cell idx
int countSameNeighbors(int idx) {
    int r = idx / C, c = idx % C;
    int same = 0;
    for (int d = 0; d < 4; d++) {
        int nidx = getNeighborIdx(r, c, d);
        if (nidx >= 0 && grid[nidx] >= 0 && grid[nidx] == grid[idx]) same++;
    }
    return same;
}

// Count assigned neighbors
int countAssignedNeighbors(int idx) {
    int r = idx / C, c = idx % C;
    int cnt = 0;
    for (int d = 0; d < 4; d++) {
        int nidx = getNeighborIdx(r, c, d);
        if (nidx >= 0 && grid[nidx] >= 0) cnt++;
    }
    return cnt;
}

// Check if any clue is violated
bool checkClues() {
    for (int i = 0; i < N; i++) {
        if (clues[i] < 0) continue;
        if (grid[i] < 0) continue;  // not assigned yet
        
        int assigned = countAssignedNeighbors(i);
        int same = countSameNeighbors(i);
        int unassigned = 4 - countTotalNeighbors(i);
        
        // same can only increase as more neighbors are assigned
        // if same > clue: violated
        if (same > clues[i]) return false;
        // if same + remaining_unassigned < clue: can't reach
        int remaining = 0;
        int r = i / C, c = i % C;
        for (int d = 0; d < 4; d++) {
            int nidx = getNeighborIdx(r, c, d);
            if (nidx >= 0 && grid[nidx] < 0) remaining++;
        }
        if (same + remaining < clues[i]) return false;
    }
    return true;
}

int countTotalNeighbors(int idx) {
    int r = idx / C, c = idx % C;
    int cnt = 0;
    for (int d = 0; d < 4; d++) {
        if (getNeighborIdx(r, c, d) >= 0) cnt++;
    }
    return cnt;
}

// Check no 2x2 of same color
bool checkNoSquare(int idx) {
    int r = idx / C, c = idx % C;
    // Check all 2x2 squares containing this cell
    for (int r0 = r-1; r0 <= r; r0++) {
        for (int c0 = c-1; c0 <= c; c0++) {
            if (r0 < 0 || c0 < 0 || r0+1 >= R || c0+1 >= C) continue;
            int i00 = r0*C+c0, i01 = r0*C+c0+1, i10 = (r0+1)*C+c0, i11 = (r0+1)*C+c0+1;
            if (grid[i00]>=0 && grid[i01]>=0 && grid[i10]>=0 && grid[i11]>=0) {
                if (grid[i00]==grid[i01] && grid[i01]==grid[i10] && grid[i10]==grid[i11])
                    return false;
            }
        }
    }
    return true;
}

// Check connectivity using flood fill
bool isConnected(int color) {
    int start = -1;
    for (int i = 0; i < N; i++) {
        if (grid[i] == color) { start = i; break; }
    }
    if (start == -1) return true;  // empty = connected
    
    bool visited[256] = {false};
    int queue[256], qh=0, qt=0;
    queue[qt++] = start; visited[start] = true;
    int count = 1;
    
    while (qh < qt) {
        int cur = queue[qh++];
        int r = cur / C, c = cur % C;
        for (int d = 0; d < 4; d++) {
            int nidx = getNeighborIdx(r, c, d);
            if (nidx >= 0 && grid[nidx] == color && !visited[nidx]) {
                visited[nidx] = true; count++; queue[qt++] = nidx;
            }
        }
    }
    
    int total = 0;
    for (int i = 0; i < N; i++) if (grid[i] == color) total++;
    return count == total;
}

void backtrack(int idx) {
    nodes++;
    if (nodes > 50000000LL) return;
    if (solutions >= 2) return;
    
    if (idx == N) {
        // Final checks
        if (!checkClues()) return;
        if (!isConnected(0)) return;
        if (!isConnected(1)) return;
        solutions++;
        return;
    }
    
    // Try white (0) then black (1)
    for (int color = 0; color <= 1; color++) {
        grid[idx] = color;
        
        bool valid = true;
        
        // Check no 2x2
        if (valid && !checkNoSquare(idx)) valid = false;
        
        // Check clues for this cell and neighbors
        if (valid) {
            // Check this cell's clue
            if (clues[idx] >= 0) {
                int same = countSameNeighbors(idx);
                int remaining = 0;
                int r = idx / C, c = idx % C;
                for (int d = 0; d < 4; d++) {
                    int nidx = getNeighborIdx(r, c, d);
                    if (nidx >= 0 && grid[nidx] < 0) remaining++;
                }
                if (same > clues[idx]) valid = false;
                if (same + remaining < clues[idx]) valid = false;
            }
        }
        
        // Check neighbor clues
        if (valid) {
            int r = idx / C, c = idx % C;
            for (int d = 0; d < 4; d++) {
                int nidx = getNeighborIdx(r, c, d);
                if (nidx >= 0 && clues[nidx] >= 0 && grid[nidx] >= 0) {
                    int same = countSameNeighbors(nidx);
                    int rem = 0;
                    int nr = nidx / C, nc = nidx % C;
                    for (int dd = 0; dd < 4; dd++) {
                        int nnidx = getNeighborIdx(nr, nc, dd);
                        if (nnidx >= 0 && grid[nnidx] < 0) rem++;
                    }
                    if (same > clues[nidx]) { valid = false; break; }
                    if (same + rem < clues[nidx]) { valid = false; break; }
                }
            }
        }
        
        if (valid) backtrack(idx + 1);
        
        grid[idx] = -1;
        if (solutions >= 2) return;
    }
}

int main() {
    scanf("%d %d", &R, &C);
    N = R * C;
    
    int numClues;
    scanf("%d", &numClues);
    
    memset(clues, -1, sizeof(int) * N);
    for (int i = 0; i < numClues; i++) {
        int cr, cc, cv;
        scanf("%d %d %d", &cr, &cc, &cv);
        clues[cr * C + cc] = cv;
    }
    
    memset(grid, -1, sizeof(int) * N);
    solutions = 0;
    nodes = 0;
    
    backtrack(0);
    
    printf("%d %lld\n", solutions, nodes);
    return 0;
}
