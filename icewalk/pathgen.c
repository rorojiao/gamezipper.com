
#include <stdio.h>
#include <stdlib.h>
#include <string.h>
#include <stdbool.h>
#include <time.h>

int R, C, N;
bool isIce[256];
bool visited[256];
int path[256];
int pathLen;
int startR, startC, goalR, goalC;
bool found;
int dr[] = {-1, 1, 0, 0};
int dc[] = {0, 0, -1, 1};

bool inBounds(int r, int c) {
    return r >= 0 && r < R && c >= 0 && c < C;
}

// Check if remaining unvisited cells form a connected graph containing goal
bool checkConnectivity() {
    // Find any unvisited cell
    int start = -1;
    int unvisitedCount = 0;
    for (int i = 0; i < N; i++) {
        if (!visited[i]) {
            if (start == -1) start = i;
            unvisitedCount++;
        }
    }
    if (unvisitedCount == 0) return true;
    if (visited[goalR*C+goalC]) return false;  // goal already visited but cells remain
    
    // BFS from first unvisited cell
    bool bfs_visited[256] = {false};
    int queue[256], qh = 0, qt = 0;
    queue[qt++] = start;
    bfs_visited[start] = true;
    int reachable = 1;
    
    while (qh < qt) {
        int cur = queue[qh++];
        int r = cur / C, c = cur % C;
        for (int d = 0; d < 4; d++) {
            int nr = r + dr[d];
            int nc = c + dc[d];
            if (inBounds(nr, nc)) {
                int nidx = nr * C + nc;
                if (!visited[nidx] && !bfs_visited[nidx]) {
                    bfs_visited[nidx] = true;
                    reachable++;
                    queue[qt++] = nidx;
                }
            }
        }
    }
    return reachable == unvisitedCount;
}

// Dead-end check: no unvisited cell should have 0 unvisited neighbors (except goal)
bool checkDeadEnds() {
    for (int i = 0; i < N; i++) {
        if (visited[i]) continue;
        int r = i / C, c = i % C;
        int unvisNbrs = 0;
        for (int d = 0; d < 4; d++) {
            int nr = r + dr[d], nc = c + dc[d];
            if (inBounds(nr, nc) && !visited[nr*C+nc]) unvisNbrs++;
        }
        if (unvisNbrs == 0 && i != goalR*C+goalC) return false;
        // Also check: goal shouldn't be a dead-end before the end
        if (i == goalR*C+goalC && pathLen < N-1 && unvisNbrs == 0) return false;
    }
    return true;
}

void backtrack(int r, int c, int enteredDir, int visitedCount) {
    if (found) return;
    
    visited[r*C+c] = true;
    path[visitedCount-1] = r*C+c;
    
    if (r == goalR && c == goalC) {
        if (visitedCount == N) {
            found = true;
        }
        visited[r*C+c] = false;
        return;
    }
    
    if (visitedCount == N) {
        visited[r*C+c] = false;
        return;
    }
    
    // Pruning
    if (!checkConnectivity()) {
        visited[r*C+c] = false;
        return;
    }
    if (!checkDeadEnds()) {
        visited[r*C+c] = false;
        return;
    }
    
    // Build move list
    int moves[4][2];
    int numMoves = 0;
    
    for (int d = 0; d < 4; d++) {
        int nr = r + dr[d];
        int nc = c + dc[d];
        if (inBounds(nr, nc) && !visited[nr*C+nc]) {
            moves[numMoves][0] = d;
            moves[numMoves][1] = nr * C + nc;
            numMoves++;
        }
    }
    
    // Sort by Warnsdorff (fewer remaining options first)
    for (int i = 0; i < numMoves; i++) {
        for (int j = i+1; j < numMoves; j++) {
            int r1 = moves[j][1] / C, c1 = moves[j][1] % C;
            int r2 = moves[i][1] / C, c2 = moves[i][1] % C;
            int d1 = 0, d2 = 0;
            for (int dd = 0; dd < 4; dd++) {
                int nr1 = r1+dr[dd], nc1 = c1+dc[dd];
                if (inBounds(nr1,nc1) && !visited[nr1*C+nc1]) d1++;
                int nr2 = r2+dr[dd], nc2 = c2+dc[dd];
                if (inBounds(nr2,nc2) && !visited[nr2*C+nc2]) d2++;
            }
            if (d1 < d2) {
                int tmp0 = moves[i][0], tmp1 = moves[i][1];
                moves[i][0] = moves[j][0]; moves[i][1] = moves[j][1];
                moves[j][0] = tmp0; moves[j][1] = tmp1;
            }
        }
    }
    
    for (int i = 0; i < numMoves && !found; i++) {
        backtrack(moves[i][1] / C, moves[i][1] % C, moves[i][0], visitedCount + 1);
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
    found = false;
    backtrack(startR, startC, -1, 1);
    
    if (found) {
        for (int i = 0; i < N; i++) {
            printf("%d %d", path[i] / C, path[i] % C);
            if (i < N-1) printf(" ");
        }
        printf("\n");
    } else {
        printf("NONE\n");
    }
    return 0;
}
