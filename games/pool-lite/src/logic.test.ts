import {
  H,
  POCKETS,
  POCKET_R,
  R,
  STOP_THRESHOLD,
  W,
  type Ball,
  collideBalls,
  initialBalls,
  isStopped,
  pocketHit,
} from './logic';

function ball(overrides: Partial<Ball> = {}): Ball {
  return {
    x: 0,
    y: 0,
    vx: 0,
    vy: 0,
    color: '#fff',
    sunk: false,
    ...overrides,
  };
}

describe('initialBalls', () => {
  it('returns one cue ball plus six racked balls', () => {
    const bs = initialBalls();
    expect(bs).toHaveLength(7);
    expect(bs.filter((b) => b.cue)).toHaveLength(1);
    expect(bs.filter((b) => !b.cue)).toHaveLength(6);
  });

  it('places the cue ball near the bottom centre', () => {
    const cue = initialBalls().find((b) => b.cue)!;
    expect(cue.x).toBeCloseTo(W / 2, 5);
    expect(cue.y).toBeCloseTo(H - 60, 5);
  });

  it('starts every ball at rest and not sunk', () => {
    for (const b of initialBalls()) {
      expect(b.vx).toBe(0);
      expect(b.vy).toBe(0);
      expect(b.sunk).toBe(false);
    }
  });

  it('assigns distinct colors to the rack', () => {
    const rack = initialBalls().filter((b) => !b.cue);
    const colors = new Set(rack.map((b) => b.color));
    expect(colors.size).toBe(rack.length);
  });
});

describe('isStopped', () => {
  it('returns true for a perfectly stationary ball', () => {
    expect(isStopped(ball())).toBe(true);
  });

  it('returns false when either component exceeds the threshold', () => {
    expect(isStopped(ball({ vx: STOP_THRESHOLD * 10 }))).toBe(false);
    expect(isStopped(ball({ vy: STOP_THRESHOLD * 10 }))).toBe(false);
  });

  it('returns true when both components are just under threshold', () => {
    const eps = STOP_THRESHOLD / 2;
    expect(isStopped(ball({ vx: eps, vy: -eps }))).toBe(true);
  });

  it('respects a custom threshold', () => {
    expect(isStopped(ball({ vx: 0.5, vy: 0.5 }), 1)).toBe(true);
    expect(isStopped(ball({ vx: 0.5, vy: 0.5 }), 0.1)).toBe(false);
  });
});

describe('pocketHit', () => {
  it('returns true at the centre of any pocket', () => {
    for (const p of POCKETS) {
      expect(pocketHit(ball({ x: p.x, y: p.y }), POCKETS, POCKET_R)).toBe(true);
    }
  });

  it('returns true just inside the pocket radius', () => {
    const p = POCKETS[0]!; // (0, 0)
    expect(pocketHit(ball({ x: POCKET_R - 1, y: 0 }), POCKETS, POCKET_R)).toBe(true);
    expect(p).toBeDefined();
  });

  it('returns false just outside the pocket radius', () => {
    expect(pocketHit(ball({ x: POCKET_R + 1, y: 0 }), POCKETS, POCKET_R)).toBe(false);
  });

  it('returns false at the centre of the table (far from any pocket)', () => {
    expect(pocketHit(ball({ x: W / 2, y: H / 2 }), POCKETS, POCKET_R)).toBe(false);
  });

  it('detects all six pockets — corners and side rails', () => {
    const cornerNW = ball({ x: 0, y: 0 });
    const cornerSE = ball({ x: W, y: H });
    const sideMidTop = ball({ x: W / 2, y: 0 });
    const sideMidBottom = ball({ x: W / 2, y: H });
    expect(pocketHit(cornerNW, POCKETS, POCKET_R)).toBe(true);
    expect(pocketHit(cornerSE, POCKETS, POCKET_R)).toBe(true);
    expect(pocketHit(sideMidTop, POCKETS, POCKET_R)).toBe(true);
    expect(pocketHit(sideMidBottom, POCKETS, POCKET_R)).toBe(true);
  });
});

describe('collideBalls', () => {
  it('is a no-op for balls that are not touching', () => {
    const a = ball({ x: 0, y: 0, vx: 1, vy: 0 });
    const b = ball({ x: R * 4, y: 0, vx: -1, vy: 0 });
    const [aOut, bOut] = collideBalls(a, b, R);
    expect(aOut).toEqual(a);
    expect(bOut).toEqual(b);
  });

  it('separates overlapping balls so the distance >= 2r', () => {
    const a = ball({ x: 0, y: 0 });
    const b = ball({ x: R, y: 0 }); // overlapping
    const [aOut, bOut] = collideBalls(a, b, R);
    const dx = bOut.x - aOut.x;
    const dy = bOut.y - aOut.y;
    expect(Math.hypot(dx, dy)).toBeCloseTo(R * 2, 5);
  });

  it('exchanges velocity along the contact normal for a head-on hit', () => {
    // a moving right into a stationary b
    const a = ball({ x: 0, y: 0, vx: 2, vy: 0 });
    const b = ball({ x: R * 1.5, y: 0 });
    const [aOut, bOut] = collideBalls(a, b, R);
    // Most of a's vx transfers to b along the +x normal; restitution is 0.9
    expect(bOut.vx).toBeGreaterThan(0);
    expect(aOut.vx).toBeLessThan(a.vx);
  });

  it('preserves tangential velocity in a glancing hit', () => {
    // overlapping vertically; a moves in y, b is stationary
    // contact normal is along y, so a's vy gets exchanged but vx stays
    const a = ball({ x: 0, y: 0, vx: 3, vy: 2 });
    const b = ball({ x: 0, y: R * 1.5 });
    const [aOut] = collideBalls(a, b, R);
    expect(aOut.vx).toBeCloseTo(3, 5);
  });

  it('separates two stationary overlapping balls without inducing velocity', () => {
    const a = ball({ x: 0, y: 0 });
    const b = ball({ x: R, y: 0 });
    const [aOut, bOut] = collideBalls(a, b, R);
    expect(aOut.vx).toBe(0);
    expect(aOut.vy).toBe(0);
    expect(bOut.vx).toBe(0);
    expect(bOut.vy).toBe(0);
    expect(Math.hypot(bOut.x - aOut.x, bOut.y - aOut.y)).toBeCloseTo(R * 2, 5);
  });

  it('does not mutate the input balls', () => {
    const a = ball({ x: 0, y: 0, vx: 2, vy: 0 });
    const b = ball({ x: R * 1.2, y: 0 });
    const aSnap = { ...a };
    const bSnap = { ...b };
    collideBalls(a, b, R);
    expect(a).toEqual(aSnap);
    expect(b).toEqual(bSnap);
  });

  it('handles coincident centres safely (returns inputs unchanged)', () => {
    const a = ball({ x: 5, y: 5, vx: 1, vy: 1 });
    const b = ball({ x: 5, y: 5, vx: -1, vy: -1 });
    const [aOut, bOut] = collideBalls(a, b, R);
    expect(aOut).toEqual(a);
    expect(bOut).toEqual(b);
  });
});
