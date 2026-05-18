export const COLS = 7;
export const ROWS = 8;
export const COLORS = ['#ff5572', '#7cf8ff', '#ffd34d', '#7fdc7f', '#c779ff', '#ffa552'];

export type Board = number[][];

export function randomBoard(rand: () => number): Board {
  const b: Board = Array.from({ length: ROWS }, () => Array<number>(COLS).fill(0));
  for (let r = 0; r < ROWS; r++) for (let c = 0; c < COLS; c++) b[r]![c] = Math.floor(rand() * COLORS.length);
  return removeInitialMatches(b, rand);
}

export function removeInitialMatches(b: Board, rand: () => number): Board {
  let changed = true;
  while (changed) {
    changed = false;
    for (let r = 0; r < ROWS; r++) {
      for (let c = 0; c < COLS; c++) {
        const v = b[r]![c]!;
        if (c >= 2 && b[r]![c - 1] === v && b[r]![c - 2] === v) {
          b[r]![c] = (v + 1 + Math.floor(rand() * (COLORS.length - 1))) % COLORS.length;
          changed = true;
        }
        if (r >= 2 && b[r - 1]![c] === v && b[r - 2]![c] === v) {
          b[r]![c] = (v + 1 + Math.floor(rand() * (COLORS.length - 1))) % COLORS.length;
          changed = true;
        }
      }
    }
  }
  return b;
}

export function findMatches(b: Board): boolean[][] {
  const m = Array.from({ length: ROWS }, () => Array<boolean>(COLS).fill(false));
  for (let r = 0; r < ROWS; r++) {
    let run = 1;
    for (let c = 1; c <= COLS; c++) {
      if (c < COLS && b[r]![c] === b[r]![c - 1]) run++;
      else {
        if (run >= 3) for (let k = c - run; k < c; k++) m[r]![k] = true;
        run = 1;
      }
    }
  }
  for (let c = 0; c < COLS; c++) {
    let run = 1;
    for (let r = 1; r <= ROWS; r++) {
      if (r < ROWS && b[r]![c] === b[r - 1]![c]) run++;
      else {
        if (run >= 3) for (let k = r - run; k < r; k++) m[k]![c] = true;
        run = 1;
      }
    }
  }
  return m;
}

export function collapse(b: Board, m: boolean[][], rand: () => number): { board: Board; cleared: number } {
  let cleared = 0;
  const next = b.map((row) => row.slice());
  for (let c = 0; c < COLS; c++) {
    const col: number[] = [];
    for (let r = ROWS - 1; r >= 0; r--) {
      if (m[r]![c]) cleared++;
      else col.push(next[r]![c]!);
    }
    while (col.length < ROWS) col.push(Math.floor(rand() * COLORS.length));
    for (let r = 0; r < ROWS; r++) next[ROWS - 1 - r]![c] = col[r]!;
  }
  return { board: next, cleared };
}
