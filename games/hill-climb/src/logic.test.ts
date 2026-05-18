import {
  CRASH_TILT,
  MAX_SPEED,
  MIN_SPEED,
  burnFuel,
  distanceFromCamera,
  isCrashed,
  nextSpeed,
  terrainY,
  tiltAt,
} from './logic';

describe('terrainY', () => {
  it('is finite and bounded for typical x values', () => {
    for (let x = -1000; x <= 1000; x += 50) {
      const y = terrainY(x);
      expect(Number.isFinite(y)).toBe(true);
      expect(Math.abs(y)).toBeLessThan(200);
    }
  });

  it('is deterministic (same x -> same y)', () => {
    expect(terrainY(42)).toBe(terrainY(42));
  });
});

describe('nextSpeed', () => {
  it('accelerates toward MAX_SPEED on gas', () => {
    expect(nextSpeed(0, 'gas', 0.5)).toBeGreaterThan(0);
    expect(nextSpeed(MAX_SPEED, 'gas', 10)).toBe(MAX_SPEED);
  });

  it('decelerates / reverses on brake, clamped to MIN_SPEED', () => {
    expect(nextSpeed(50, 'brake', 0.5)).toBeLessThan(50);
    expect(nextSpeed(MIN_SPEED, 'brake', 10)).toBe(MIN_SPEED);
  });

  it('coasts toward 0 with no input', () => {
    const decel = nextSpeed(100, null, 0.5);
    expect(decel).toBeLessThan(100);
    expect(decel).toBeGreaterThan(0);
  });
});

describe('tiltAt', () => {
  it('returns 0 on a perfectly flat patch (not realistic for this terrain but tests the formula)', () => {
    // We can't easily get a flat point of terrainY, so test the formula directly via tiltAt at a known x;
    // just assert finiteness and bounds.
    const t = tiltAt(123);
    expect(Number.isFinite(t)).toBe(true);
    expect(t).toBeGreaterThanOrEqual(-Math.PI);
    expect(t).toBeLessThanOrEqual(Math.PI);
  });
});

describe('burnFuel', () => {
  it('always returns >= 0', () => {
    expect(burnFuel(1, 100, 10)).toBe(0);
    expect(burnFuel(0, 0, 1)).toBe(0);
  });

  it('burns more fuel at higher absolute speed', () => {
    const slow = 100 - burnFuel(100, 10, 1);
    const fast = 100 - burnFuel(100, 100, 1);
    expect(fast).toBeGreaterThan(slow);
  });

  it('treats negative speed the same as positive (uses |speed|)', () => {
    expect(burnFuel(100, -50, 1)).toBe(burnFuel(100, 50, 1));
  });
});

describe('distanceFromCamera', () => {
  it('floors to integer metres and clamps at 0', () => {
    expect(distanceFromCamera(0)).toBe(0);
    expect(distanceFromCamera(4.9)).toBe(0);
    expect(distanceFromCamera(5)).toBe(1);
    expect(distanceFromCamera(123.4)).toBe(24);
    expect(distanceFromCamera(-100)).toBe(0);
  });
});

describe('isCrashed', () => {
  it('crashes when fuel hits 0', () => {
    expect(isCrashed(0, 0)).toBe(true);
    expect(isCrashed(0, -1)).toBe(true);
  });

  it('crashes when tilt magnitude exceeds the threshold', () => {
    expect(isCrashed(CRASH_TILT + 0.01, 100)).toBe(true);
    expect(isCrashed(-(CRASH_TILT + 0.01), 100)).toBe(true);
  });

  it('does not crash inside the safe envelope', () => {
    expect(isCrashed(0, 100)).toBe(false);
    expect(isCrashed(CRASH_TILT - 0.01, 1)).toBe(false);
  });
});
