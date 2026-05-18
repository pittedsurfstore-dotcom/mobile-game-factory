import { mulberry32 } from '@mgf/game-core';
import { COLS, ROWS, type Board, collapse, findMatches, randomBoard, removeInitialMatches } from './logic';

function fill(value: number): Board {
  return Array.from({ length: ROWS }, () => Array<number>(COLS).fill(value));
}

function emptyMask(): boolean[][] {
  return Array.from({ length: ROWS }, () => Array<boolean>(COLS).fill(false));
}

describe('findMatches', () => {
  it('returns no matches when no run of 3+ exists', () => {
    const b: Board = [
      [0, 1, 0, 1, 0, 1, 0],
      [1, 0, 1, 0, 1, 0, 1],
      [0, 1, 0, 1, 0, 1, 0],
      [1, 0, 1, 0, 1, 0, 1],
      [0, 1, 0, 1, 0, 1, 0],
      [1, 0, 1, 0, 1, 0, 1],
      [0, 1, 0, 1, 0, 1, 0],
      [1, 0, 1, 0, 1, 0, 1],
    ];
    const m = findMatches(b);
    expect(m.flat().some(Boolean)).toBe(false);
  });

  it('flags a horizontal 3-in-a-row at the right indices', () => {
    // Use a checkered base so no vertical runs of 3 form by accident.
    const b = Array.from({ length: ROWS }, (_, r) => Array.from({ length: COLS }, (_, c) => (r + c) % 5));
    b[3] = [0, 2, 2, 2, 0, 1, 0];
    const m = findMatches(b);
    expect(m[3]![1]).toBe(true);
    expect(m[3]![2]).toBe(true);
    expect(m[3]![3]).toBe(true);
    // cells outside the run on the same row should not be flagged from row scan
    expect(m[3]![0]).toBe(false);
    expect(m[3]![4]).toBe(false);
  });

  it('flags a vertical 3-in-a-row at the right indices', () => {
    const b = Array.from({ length: ROWS }, (_, r) => Array.from({ length: COLS }, (_, c) => (r + c) % 5));
    b[2]![4] = 5;
    b[3]![4] = 5;
    b[4]![4] = 5;
    const m = findMatches(b);
    expect(m[2]![4]).toBe(true);
    expect(m[3]![4]).toBe(true);
    expect(m[4]![4]).toBe(true);
  });

  it('flags a run of 4 entirely', () => {
    const b = fill(9);
    b[0] = [3, 3, 3, 3, 9, 9, 9];
    const m = findMatches(b);
    expect(m[0]!.slice(0, 4)).toEqual([true, true, true, true]);
  });
});

describe('collapse', () => {
  it('returns 0 cleared when mask is empty and board is unchanged', () => {
    const rand = mulberry32(1);
    const b = fill(2);
    const { board, cleared } = collapse(b, emptyMask(), rand);
    expect(cleared).toBe(0);
    expect(board).toEqual(b);
  });

  it('counts cleared cells across the board', () => {
    const rand = mulberry32(1);
    const b = fill(7);
    const mask = emptyMask();
    mask[7]![0] = true;
    mask[7]![1] = true;
    mask[7]![2] = true;
    const { cleared } = collapse(b, mask, rand);
    expect(cleared).toBe(3);
  });

  it('drops survivors and fills the top with new values', () => {
    const rand = mulberry32(42);
    // Column 0 has [1, 2, 3, ...] top to bottom; mark row 3 cleared
    const b = fill(0);
    for (let r = 0; r < ROWS; r++) b[r]![0] = r + 1;
    const mask = emptyMask();
    mask[3]![0] = true; // clear the "4" cell
    const { board, cleared } = collapse(b, mask, rand);
    expect(cleared).toBe(1);
    // The kept survivors from row 3 down: rows 0,1,2,4,5,6,7 = values 1,2,3,5,6,7,8
    // Survivors fall to fill the bottom; col 0 bottom-to-top should be: 8,7,6,5,3,2,1, then 1 new fill at top
    const col0 = board.map((row) => row[0]);
    // bottom (ROWS-1) was the bottom-most survivor before clear, which was value 8
    expect(col0[ROWS - 1]).toBe(8);
    expect(col0[ROWS - 2]).toBe(7);
    expect(col0[ROWS - 3]).toBe(6);
    expect(col0[ROWS - 4]).toBe(5);
    expect(col0[ROWS - 5]).toBe(3);
    expect(col0[ROWS - 6]).toBe(2);
    expect(col0[ROWS - 7]).toBe(1);
    // top cell is a freshly generated number (0 .. COLORS.length-1)
    expect(col0[0]).toBeGreaterThanOrEqual(0);
    expect(col0[0]).toBeLessThan(6);
  });

  it('does not mutate the input board', () => {
    const rand = mulberry32(1);
    const b = fill(4);
    const snapshot = b.map((row) => row.slice());
    const mask = emptyMask();
    mask[ROWS - 1]![0] = true;
    collapse(b, mask, rand);
    expect(b).toEqual(snapshot);
  });
});

describe('randomBoard / removeInitialMatches', () => {
  it('produces a ROWS x COLS board', () => {
    const b = randomBoard(mulberry32(1));
    expect(b).toHaveLength(ROWS);
    expect(b[0]).toHaveLength(COLS);
  });

  it('contains no initial 3-in-a-row matches', () => {
    for (const seed of [1, 2, 7, 99, 1234]) {
      const b = randomBoard(mulberry32(seed));
      const m = findMatches(b);
      expect(m.flat().some(Boolean)).toBe(false);
    }
  });

  it('removeInitialMatches eliminates pre-existing 3-runs', () => {
    const b = fill(2);
    const out = removeInitialMatches(b, mulberry32(1));
    const m = findMatches(out);
    expect(m.flat().some(Boolean)).toBe(false);
  });
});
