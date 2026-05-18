import {
  MAX_OFFLINE_SECONDS,
  REST_THRESHOLD_SECONDS,
  type State,
  applyOfflineDecay,
  clamp,
  moodOf,
} from './logic';

function state(overrides: Partial<State> = {}): State {
  return {
    hunger: 80,
    fun: 70,
    energy: 90,
    age: 0,
    lastSeen: 0,
    mood: '🙂',
    ...overrides,
  };
}

describe('clamp', () => {
  it('returns the value unchanged when in range', () => {
    expect(clamp(50)).toBe(50);
    expect(clamp(0)).toBe(0);
    expect(clamp(100)).toBe(100);
  });

  it('clips to 0 below the floor by default', () => {
    expect(clamp(-5)).toBe(0);
    expect(clamp(-1000)).toBe(0);
  });

  it('clips to 100 above the ceiling by default', () => {
    expect(clamp(150)).toBe(100);
    expect(clamp(Number.POSITIVE_INFINITY)).toBe(100);
  });

  it('respects custom bounds', () => {
    expect(clamp(7, 5, 6)).toBe(6);
    expect(clamp(3, 5, 6)).toBe(5);
    expect(clamp(5.5, 5, 6)).toBe(5.5);
  });
});

describe('moodOf', () => {
  it('returns the sleepy face when energy is below 15', () => {
    expect(moodOf(state({ energy: 14 }))).toBe('😴');
    expect(moodOf(state({ energy: 0 }))).toBe('😴');
  });

  it('prioritises low energy over low hunger', () => {
    // both conditions true; energy check comes first in the cascade
    expect(moodOf(state({ energy: 10, hunger: 5 }))).toBe('😴');
  });

  it('returns the sad face when hunger is below 20 (and energy is fine)', () => {
    expect(moodOf(state({ hunger: 19, energy: 80 }))).toBe('🥺');
  });

  it('returns the bored face when fun is below 20 (and hunger/energy are fine)', () => {
    expect(moodOf(state({ fun: 10, hunger: 80, energy: 80 }))).toBe('😒');
  });

  it('returns the happy face when all three stats are well above threshold', () => {
    expect(moodOf(state({ hunger: 90, fun: 80, energy: 80 }))).toBe('🥰');
  });

  it('returns the neutral face as the catch-all', () => {
    expect(moodOf(state({ hunger: 50, fun: 50, energy: 50 }))).toBe('🙂');
  });
});

describe('applyOfflineDecay', () => {
  it('updates lastSeen to the given now', () => {
    const s = state({ lastSeen: 1000 });
    const next = applyOfflineDecay(s, 5000);
    expect(next.lastSeen).toBe(5000);
  });

  it('advances age by elapsed seconds (capped)', () => {
    const s = state({ lastSeen: 0, age: 100 });
    const next = applyOfflineDecay(s, 30_000); // 30 seconds
    expect(next.age).toBeCloseTo(130, 5);
  });

  it('decays hunger and fun proportionally to elapsed time', () => {
    const s = state({ lastSeen: 0, hunger: 80, fun: 70 });
    const next = applyOfflineDecay(s, 100_000); // 100 seconds elapsed
    expect(next.hunger).toBeCloseTo(80 - 1, 5);
    expect(next.fun).toBeCloseTo(70 - 0.8, 5);
  });

  it('caps elapsed at 12 hours regardless of how long the pet was offline', () => {
    const s = state({ lastSeen: 0, hunger: 100, age: 0 });
    // Two days offline
    const next = applyOfflineDecay(s, 2 * 24 * 3600 * 1000);
    expect(next.age).toBe(MAX_OFFLINE_SECONDS);
    // hunger decay = 12h * 3600 * 0.01 = 432, clamped to 0
    expect(next.hunger).toBe(0);
  });

  it('clamps stats at 0, never negative', () => {
    const s = state({ lastSeen: 0, hunger: 1, fun: 1 });
    const next = applyOfflineDecay(s, 60_000); // 60s -> -0.6 hunger -> clamps to 0.4
    // but try a longer interval to push past 0
    const longer = applyOfflineDecay(s, 1_000_000); // 1000s -> -10 hunger
    expect(longer.hunger).toBe(0);
    expect(longer.fun).toBe(0);
    void next;
  });

  it('applies the rest bonus to energy after the rest threshold', () => {
    const before = state({ lastSeen: 0, energy: 50 });
    // exactly at the threshold: only the decay term applies
    const atThreshold = applyOfflineDecay(before, REST_THRESHOLD_SECONDS * 1000);
    expect(atThreshold.energy).toBeCloseTo(50 - REST_THRESHOLD_SECONDS * 0.005, 5);

    // past the threshold: decay AND rest bonus apply
    const past = applyOfflineDecay(before, (REST_THRESHOLD_SECONDS + 1000) * 1000);
    const expectedDecay = (REST_THRESHOLD_SECONDS + 1000) * 0.005;
    const expectedRest = 1000 * 0.01;
    expect(past.energy).toBeCloseTo(50 - expectedDecay + expectedRest, 5);
  });

  it('preserves the mood field on the returned state (does not recompute)', () => {
    const s = state({ lastSeen: 0, mood: '😴' });
    const next = applyOfflineDecay(s, 1000);
    expect(next.mood).toBe('😴');
  });
});
