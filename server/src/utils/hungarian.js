// Kuhn-Munkres (Hungarian) algorithm for the rectangular assignment problem.
// Minimizes total cost, O(n^2 * m) where n = min(rows, cols), i.e. O(n^3) when square.
function transpose(matrix) {
  const rows = matrix.length;
  const cols = matrix[0].length;
  const result = Array.from({ length: cols }, () => new Array(rows));
  for (let i = 0; i < rows; i++) {
    for (let j = 0; j < cols; j++) result[j][i] = matrix[i][j];
  }
  return result;
}

// Returns [{ row, col, cost }] using original (pre-transpose) row/col indices,
// at most min(rows, cols) pairs — unmatched rows/cols simply don't appear.
function hungarianAlgorithm(costMatrix) {
  const origRows = costMatrix.length;
  if (origRows === 0) return [];
  const origCols = costMatrix[0].length;
  if (origCols === 0) return [];

  const transposed = origRows > origCols;
  const cost = transposed ? transpose(costMatrix) : costMatrix;

  const n = cost.length; // n <= m
  const m = cost[0].length;
  const INF = Infinity;

  const u = new Array(n + 1).fill(0);
  const v = new Array(m + 1).fill(0);
  const p = new Array(m + 1).fill(0); // p[j] = 1-indexed row currently matched to column j
  const way = new Array(m + 1).fill(0);

  for (let i = 1; i <= n; i++) {
    p[0] = i;
    let j0 = 0;
    const minv = new Array(m + 1).fill(INF);
    const used = new Array(m + 1).fill(false);

    do {
      used[j0] = true;
      const i0 = p[j0];
      let delta = INF;
      let j1 = -1;

      for (let j = 1; j <= m; j++) {
        if (!used[j]) {
          const cur = cost[i0 - 1][j - 1] - u[i0] - v[j];
          if (cur < minv[j]) {
            minv[j] = cur;
            way[j] = j0;
          }
          if (minv[j] < delta) {
            delta = minv[j];
            j1 = j;
          }
        }
      }

      for (let j = 0; j <= m; j++) {
        if (used[j]) {
          u[p[j]] += delta;
          v[j] -= delta;
        } else {
          minv[j] -= delta;
        }
      }

      j0 = j1;
    } while (p[j0] !== 0);

    do {
      const j1 = way[j0];
      p[j0] = p[j1];
      j0 = j1;
    } while (j0 !== 0);
  }

  const rowToCol = new Array(n).fill(-1);
  for (let j = 1; j <= m; j++) {
    if (p[j] !== 0) rowToCol[p[j] - 1] = j - 1;
  }

  const assignments = [];
  for (let i = 0; i < n; i++) {
    if (rowToCol[i] === -1) continue;
    const j = rowToCol[i];
    const [row, col] = transposed ? [j, i] : [i, j];
    assignments.push({ row, col, cost: costMatrix[row][col] });
  }

  return assignments;
}

export { hungarianAlgorithm };
