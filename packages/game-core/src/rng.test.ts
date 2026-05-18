import { mulberry32, randInt, pick } from './rng';

describe('mulberry32', () => {
  it('is deterministic for a given seed', () => {
    const a = mulberry32(42);
    const b = mulberry32(42);
    const seqA = Array.from({ length: 5 }, () => a());
    const seqB = Array.from({ length: 5 }, () => b());
    expect(seqA).toEqual(seqB);
  });

  it('produces values in [0, 1)', () => {
    const r = mulberry32(7);
    for (let i = 0; i < 1000; i++) {
      const v = r();
      expect(v).toBeGreaterThanOrEqual(0);
      expect(v).toBeLessThan(1);
    }
  });

  it('produces different sequences for different seeds', () => {
    const a = mulberry32(1);
    const b = mulberry32(2);
    expect(a()).not.toEqual(b());
  });
});

describe('randInt', () => {
  it('returns integers within [min, maxExclusive)', () => {
    const r = mulberry32(99);
    for (let i = 0; i < 500; i++) {
      const n = randInt(r, 5, 10);
      expect(Number.isInteger(n)).toBe(true);
      expect(n).toBeGreaterThanOrEqual(5);
      expect(n).toBeLessThan(10);
    }
  });
});

describe('pick', () => {
  it('returns an element from the array', () => {
    const r = mulberry32(123);
    const arr = ['a', 'b', 'c', 'd'] as const;
    for (let i = 0; i < 100; i++) {
      const v = pick(r, arr);
      expect(arr).toContain(v);
    }
  });
});
