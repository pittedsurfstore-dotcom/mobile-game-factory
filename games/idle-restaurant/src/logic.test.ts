import { INITIAL_UPGRADES, fmt, totalCps } from './logic';

describe('fmt', () => {
  it('renders integers below 1,000 with no suffix', () => {
    expect(fmt(0)).toBe('0');
    expect(fmt(1)).toBe('1');
    expect(fmt(999)).toBe('999');
  });

  it('renders thousands with a "k" suffix and 1 decimal', () => {
    expect(fmt(1_000)).toBe('1.0k');
    expect(fmt(1_500)).toBe('1.5k');
    expect(fmt(999_949)).toBe('999.9k');
  });

  it('renders millions with an "M" suffix and 2 decimals', () => {
    expect(fmt(1_000_000)).toBe('1.00M');
    expect(fmt(2_345_678)).toBe('2.35M');
  });

  it('renders billions with a "B" suffix and 2 decimals', () => {
    expect(fmt(1_000_000_000)).toBe('1.00B');
    expect(fmt(7_500_000_000)).toBe('7.50B');
  });

  it('switches suffix exactly at thresholds', () => {
    expect(fmt(999)).not.toContain('k');
    expect(fmt(1_000)).toContain('k');
    expect(fmt(999_999)).toContain('k');
    expect(fmt(1_000_000)).toContain('M');
    expect(fmt(999_999_999)).toContain('M');
    expect(fmt(1_000_000_000)).toContain('B');
  });
});

describe('totalCps', () => {
  it('returns 0 when nothing is owned', () => {
    expect(totalCps(INITIAL_UPGRADES)).toBe(0);
  });

  it('sums cps * owned across upgrades', () => {
    const u = INITIAL_UPGRADES.map((x) => ({ ...x }));
    u[0]!.owned = 3; // line cook: 1 cps × 3 = 3
    u[1]!.owned = 2; // sous chef: 8 cps × 2 = 16
    u[2]!.owned = 1; // chef: 50 cps × 1 = 50
    expect(totalCps(u)).toBe(3 + 16 + 50);
  });

  it('ignores upgrades with owned=0 even if cps is high', () => {
    const u = INITIAL_UPGRADES.map((x) => ({ ...x }));
    u[3]!.cps = 10_000; // franchise unowned
    expect(totalCps(u)).toBe(0);
  });
});
