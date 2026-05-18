import { COLS, ROWS, type Board, clearLines, collides, makeBoard, merge, rotate } from './logic';

function row(...cells: number[]): number[] {
  return cells;
}
function fullRow(v = 1): number[] {
  return Array<number>(COLS).fill(v);
}

describe('makeBoard', () => {
  it('returns ROWS x COLS of zeros', () => {
    const b = makeBoard();
    expect(b).toHaveLength(ROWS);
    for (const r of b) {
      expect(r).toHaveLength(COLS);
      expect(r.every((c) => c === 0)).toBe(true);
    }
  });
});

describe('rotate', () => {
  it('rotates 1x4 to 4x1', () => {
    const I = [[1, 1, 1, 1]];
    const out = rotate(I);
    expect(out).toEqual([[1], [1], [1], [1]]);
  });

  it('preserves a 2x2 square', () => {
    const O = [
      [4, 4],
      [4, 4],
    ];
    expect(rotate(O)).toEqual(O);
  });

  it('rotates an L-piece counterclockwise (per existing convention)', () => {
    const L = [
      [2, 0, 0],
      [2, 2, 2],
    ];
    const r = rotate(L);
    expect(r).toEqual([
      [2, 2],
      [2, 0],
      [2, 0],
    ]);
  });

  it('returns to original after four rotations', () => {
    const T = [
      [0, 6, 0],
      [6, 6, 6],
    ];
    expect(rotate(rotate(rotate(rotate(T))))).toEqual(T);
  });
});

describe('collides', () => {
  const piece = [[1, 1]];

  it('returns false for a piece fully inside an empty board', () => {
    expect(collides(makeBoard(), piece, 0, 0)).toBe(false);
    expect(collides(makeBoard(), piece, COLS - 2, ROWS - 1)).toBe(false);
  });

  it('returns true when the piece runs off the left wall', () => {
    expect(collides(makeBoard(), piece, -1, 0)).toBe(true);
  });

  it('returns true when the piece runs off the right wall', () => {
    expect(collides(makeBoard(), piece, COLS - 1, 0)).toBe(true);
  });

  it('returns true when the piece runs off the floor', () => {
    expect(collides(makeBoard(), piece, 0, ROWS)).toBe(true);
  });

  it('allows the piece partially above the board (negative y)', () => {
    const tall = [
      [1, 1],
      [1, 1],
    ];
    expect(collides(makeBoard(), tall, 0, -1)).toBe(false);
  });

  it('returns true when overlapping an existing block on the board', () => {
    const b = makeBoard();
    b[5]![3] = 9;
    expect(collides(b, piece, 2, 5)).toBe(true);
    expect(collides(b, piece, 4, 5)).toBe(false);
  });

  it('ignores zero cells in the shape when checking overlap', () => {
    const shape = [
      [0, 1],
      [1, 0],
    ];
    const b = makeBoard();
    b[0]![0] = 9;
    b[1]![1] = 9;
    expect(collides(b, shape, 0, 0)).toBe(false);
  });
});

describe('merge', () => {
  it('writes piece cells into a copy of the board, not the original', () => {
    const before = makeBoard();
    const out = merge(before, [[1, 1]], 0, 0);
    expect(before[0]![0]).toBe(0);
    expect(out[0]![0]).toBe(1);
    expect(out[0]![1]).toBe(1);
  });

  it('skips zero cells in the shape', () => {
    const out = merge(makeBoard(), [[0, 1, 0]], 0, 0);
    expect(out[0]).toEqual(row(0, 1, 0, 0, 0, 0, 0, 0, 0, 0));
  });

  it('skips rows above the board (y + r < 0)', () => {
    const tall = [
      [1, 1],
      [2, 2],
    ];
    const out = merge(makeBoard(), tall, 0, -1);
    // top row of the piece (y=-1) is above the board and dropped;
    // bottom row lands at y=0
    expect(out[0]![0]).toBe(2);
    expect(out[0]![1]).toBe(2);
  });
});

describe('clearLines', () => {
  it('returns 0 cleared for a board with no full rows', () => {
    const b = makeBoard();
    b[ROWS - 1]![0] = 1;
    const { board, cleared } = clearLines(b);
    expect(cleared).toBe(0);
    expect(board).toEqual(b);
  });

  it('clears a single full row at the bottom and prepends an empty row', () => {
    const b = makeBoard();
    b[ROWS - 1] = fullRow(3);
    const { board, cleared } = clearLines(b);
    expect(cleared).toBe(1);
    expect(board).toHaveLength(ROWS);
    expect(board[0]!.every((c) => c === 0)).toBe(true);
    expect(board[ROWS - 1]!.every((c) => c === 0)).toBe(true);
  });

  it('clears multiple full rows and preserves stack order of survivors', () => {
    const b = makeBoard();
    b[ROWS - 3] = fullRow(5);
    b[ROWS - 2] = row(1, 0, 1, 0, 1, 0, 1, 0, 1, 0);
    b[ROWS - 1] = fullRow(7);
    const { board, cleared } = clearLines(b);
    expect(cleared).toBe(2);
    expect(board[ROWS - 1]).toEqual(row(1, 0, 1, 0, 1, 0, 1, 0, 1, 0));
    expect(board[0]!.every((c) => c === 0)).toBe(true);
    expect(board[1]!.every((c) => c === 0)).toBe(true);
  });

  it('does not mutate the input board', () => {
    const b: Board = makeBoard();
    b[ROWS - 1] = fullRow(1);
    const snapshot = b.map((r) => r.slice());
    clearLines(b);
    expect(b).toEqual(snapshot);
  });
});
