import { SYMBOLS, TOTAL, deal, scoreForMoves } from './logic';

describe('deal', () => {
  it('returns exactly TOTAL tiles', () => {
    expect(deal(1)).toHaveLength(TOTAL);
  });

  it('starts every tile as unmatched with a unique id 0..TOTAL-1', () => {
    const tiles = deal(7);
    expect(tiles.every((t) => t.matched === false)).toBe(true);
    const ids = new Set(tiles.map((t) => t.id));
    expect(ids.size).toBe(TOTAL);
    expect(Math.min(...ids)).toBe(0);
    expect(Math.max(...ids)).toBe(TOTAL - 1);
  });

  it('makes every symbol appear exactly twice (pair-matched deck)', () => {
    const tiles = deal(42);
    const counts = new Map<string, number>();
    for (const t of tiles) counts.set(t.sym, (counts.get(t.sym) ?? 0) + 1);
    for (const count of counts.values()) expect(count).toBe(2);
    expect(counts.size).toBe(TOTAL / 2);
  });

  it('only draws symbols from the SYMBOLS table', () => {
    const allowed = new Set(SYMBOLS);
    const tiles = deal(123);
    for (const t of tiles) expect(allowed.has(t.sym)).toBe(true);
  });

  it('is deterministic for a given seed', () => {
    const a = deal(99).map((t) => t.sym);
    const b = deal(99).map((t) => t.sym);
    expect(a).toEqual(b);
  });

  it('produces different orderings for different seeds (at least one cell differs)', () => {
    const a = deal(1).map((t) => t.sym);
    const b = deal(2).map((t) => t.sym);
    expect(a).not.toEqual(b);
  });
});

describe('scoreForMoves', () => {
  it('returns 1000 at zero moves', () => {
    expect(scoreForMoves(0)).toBe(1000);
  });

  it('loses 10 per move', () => {
    expect(scoreForMoves(1)).toBe(990);
    expect(scoreForMoves(50)).toBe(500);
  });

  it('clamps at 0; never negative no matter how many moves', () => {
    expect(scoreForMoves(100)).toBe(0);
    expect(scoreForMoves(10_000)).toBe(0);
  });
});
