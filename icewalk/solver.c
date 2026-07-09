
#include <stdio.h>
#include <stdlib.h>
#include <string.h>
#include <stdbool.h>

// Icewalk solver - finds Hamiltonian paths with ice-slide constraints
// Input format (from stdin, one line):
// R C startRow startCol goalRow goalCol numIce iceCells...
// where iceCells are pairs of row,col

int R, C, N;
bool isIce[256];
bool visited[256];
int numSolutions;
long long nodes;
int startR, startC, goalR, goalC;

// directions: 0=N, 1=S, 2=W, 3=E
int dr[] = {-1, 1, 0, 0};
int dc[] = {0, 0, -1, 1};

bool inBounds(int r, int c) {
    return r >= 0 && r < R && c >= 0 && c < C;
}

// Count unvisited neighbors (for pruning)
int countUnvisited() {
    int cnt = 0;
    for (int i = 0; i < N; i++) {
        if (!visited[i]) cnt++;
    }
    return cnt;
}

void backtrack(int r, int c, int enteredDir, int visitedCount) {
    nodes++;
    if (nodes > 100000000LL) return;
    if (numSolutions >= 2) return;
    
    visited[r*C+c] = true;
    visitedCount++;
    
    // Check if goal reached
    if (r == goalR && c == goalC) {
        if (visitedCount == N) {
            numSolutions++;
        }
        visited[r*C+c] = false;
        return;
    }
    
    // If all cells visited but not at goal, fail
    if (visitedCount == N) {
        visited[r*C+c] = false;
        return;
    }
    
    if (isIce[r*C+c] && enteredDir >= 0) {
        // Must continue in same direction
        int nr = r + dr[enteredDir];
        int nc = c + dc[enteredDir];
        
        if (inBounds(nr, nc) && !visited[nr*C+nc]) {
            // Continue sliding on ice
            backtrack(nr, nc, enteredDir, visitedCount);
        } else if (!inBounds(nr, nc)) {
            // Hit wall while on ice - stop, can turn
            // Try all directions except the one we came from
            for (int d = 0; d < 4; d++) {
                if (d == enteredDir) continue;
                int nr2 = r + dr[d];
                int nc2 = c + dc[d];
                if (inBounds(nr2, nc2) && !visited[nr2*C+nc2]) {
                    backtrack(nr2, nc2, d, visitedCount);
                }
            }
        } else {
            // Hit visited cell - fail
        }
    } else {
        // Normal cell or start cell - try all directions
        for (int d = 0; d < 4; d++) {
            int nr = r + dr[d];
            int nc = c + dc[d];
            if (inBounds(nr, nc) && !visited[nr*C+nc]) {
                backtrack(nr, nc, d, visitedCount);
            }
        }
    }
    
    visited[r*C+c] = false;
}

int main() {
    scanf("%d %d %d %d %d %d", &R, &C, &startR, &startC, &goalR, &goalC);
    N = R * C;
    
    int numIce;
    scanf("%d", &numIce);
    memset(isIce, false, sizeof(isIce));
    for (int i = 0; i < numIce; i++) {
        int ir, ic;
        scanf("%d %d", &ir, &ic);
        isIce[ir*C+ic] = true;
    }
    
    memset(visited, false, sizeof(visited));
    numSolutions = 0;
    nodes = 0;
    
    backtrack(startR, startC, -1, 0);
    
    printf("%d %lld\n", numSolutions, nodes);
    return 0;
}
