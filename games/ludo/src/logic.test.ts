import { SHORTCUTS, TRACK, advance, hasWon, rollDie, scoreForRolls } from './logic';

describe('advance', () => {
  it('moves forward by the die value when no shortcut applies', () => {
    expect(advance(0, 3)).toBe(3);
    expect(advance(10, 1)).toBe(11);
  });

  it('jumps to the shortcut destination when landing on a ladder', () => {
    // 4 -> 12 per SHORTCUTS
    expect(advance(1, 3)).toBe(12);
  });

  it('drops back to the snake destination when landing on a snake', () => {
    // 15 -> 5 per SHORTCUTS
    expect(advance(12, 3)).toBe(5);
  });

  it('clamps at TRACK so the token cannot overshoot the finish', () => {
    expect(advance(TRACK - 1, 6)).toBe(TRACK);
    expect(advance(TRACK, 6)).toBe(TRACK);
  });

  it('accepts a custom shortcuts table', () => {
    expect(advance(0, 5, { 5: 25 })).toBe(25);
    expect(advance(0, 5, {})).toBe(5);
  });

  it('uses the default SHORTCUTS when not provided', () => {
    expect(SHORTCUTS[9]).toBe(20);
    expect(advance(8, 1)).toBe(20);
  });
});

describe('hasWon', () => {
  it('is true at TRACK or beyond', () => {
    expect(hasWon(TRACK)).toBe(true);
    expect(hasWon(TRACK + 1)).toBe(true);
  });

  it('is false before reaching TRACK', () => {
    expect(hasWon(TRACK - 1)).toBe(false);
    expect(hasWon(0)).toBe(false);
  });
});

describe('scoreForRolls', () => {
  it('starts at 200 and decreases by 5 per roll', () => {
    expect(scoreForRolls(0)).toBe(200);
    expect(scoreForRolls(1)).toBe(195);
    expect(scoreForRolls(10)).toBe(150);
  });

  it('clamps to 0; never negative no matter how many rolls', () => {
    expect(scoreForRolls(100)).toBe(0);
    expect(scoreForRolls(10_000)).toBe(0);
  });
});

describe('rollDie', () => {
  it('returns an integer in [1, 6] for any rand in [0, 1)', () => {
    // Test extreme and intermediate rand values
    const samples = [0, 0.0001, 0.16, 0.5, 0.83, 0.9999];
    for (const r of samples) {
      const d = rollDie(() => r);
      expect(Number.isInteger(d)).toBe(true);
      expect(d).toBeGreaterThanOrEqual(1);
      expect(d).toBeLessThanOrEqual(6);
    }
  });

  it('rolls every face given a uniform-ish rand source', () => {
    const seen = new Set<number>();
    for (let i = 0; i < 6; i++) {
      seen.add(rollDie(() => i / 6 + 0.001));
    }
    expect(seen.size).toBe(6);
  });
});
