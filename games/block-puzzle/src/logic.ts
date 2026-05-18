export const COLS = 10;
export const ROWS = 18;
export const EMPTY = 0;

export type Cell = number;
export type Board = Cell[][];

export const SHAPES: number[][][] = [
  [[1, 1, 1, 1]],
  [
    [2, 0, 0],
    [2, 2, 2],
  ],
  [
    [0, 0, 3],
    [3, 3, 3],
  ],
  [
    [4, 4],
    [4, 4],
  ],
  [
    [0, 5, 5],
    [5, 5, 0],
  ],
  [
    [0, 6, 0],
    [6, 6, 6],
  ],
  [
    [7, 7, 0],
    [0, 7, 7],
  ],
];

export const COLORS = [
  'transparent',
  '#7cf8ff',
  '#5a8cff',
  '#ffa552',
  '#ffd34d',
  '#7fdc7f',
  '#c779ff',
  '#ff5572',
];

export const makeBoard = (): Board => Array.from({ length: ROWS }, () => Array<Cell>(COLS).fill(EMPTY));

export function rotate(shape: number[][]): number[][] {
  const rows = shape.length;
  const cols = shape[0]!.length;
  const out: number[][] = Array.from({ length: cols }, () => Array<number>(rows).fill(0));
  for (let r = 0; r < rows; r++) for (let c = 0; c < cols; c++) out[c]![rows - 1 - r] = shape[r]![c]!;
  return out;
}

export function collides(board: Board, shape: number[][], x: number, y: number): boolean {
  for (let r = 0; r < shape.length; r++) {
    for (let c = 0; c < shape[r]!.length; c++) {
      if (!shape[r]![c]) continue;
      const nx = x + c;
      const ny = y + r;
      if (nx < 0 || nx >= COLS || ny >= ROWS) return true;
      if (ny >= 0 && board[ny]![nx]) return true;
    }
  }
  return false;
}

export function merge(board: Board, shape: number[][], x: number, y: number): Board {
  const next = board.map((row) => row.slice());
  for (let r = 0; r < shape.length; r++) {
    for (let c = 0; c < shape[r]!.length; c++) {
      const v = shape[r]![c]!;
      if (v && y + r >= 0) next[y + r]![x + c] = v;
    }
  }
  return next;
}

export function clearLines(board: Board): { board: Board; cleared: number } {
  const kept = board.filter((row) => row.some((v) => v === 0));
  const cleared = ROWS - kept.length;
  const empties: Board = Array.from({ length: cleared }, () => Array<Cell>(COLS).fill(EMPTY));
  return { board: [...empties, ...kept], cleared };
}

/**
 * Removes the bottom `n` rows of the board and replaces them with empty rows
 * at the top. Used by the "watch ad to continue" flow so the player can keep
 * playing after a game-over without losing their whole stack.
 */
export function clearBottomRows(board: Board, n: number): Board {
  const drop = Math.max(0, Math.min(ROWS, n));
  if (drop === 0) return board.map((row) => row.slice());
  const empties: Board = Array.from({ length: drop }, () => Array<Cell>(COLS).fill(EMPTY));
  const survivors = board.slice(0, ROWS - drop);
  return [...empties, ...survivors];
}
