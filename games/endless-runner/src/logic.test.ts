import {
  GROUND,
  INITIAL_SPEED,
  JUMP_V,
  MAX_SPEED,
  RUNNER_SIZE,
  RUNNER_X,
  applyGravity,
  canJump,
  nextSpeed,
  obstacleCollides,
  spawnInterval,
} from './logic';

describe('applyGravity', () => {
  it('accelerates downward when in the air', () => {
    const out = applyGravity(50, 0, 0.016);
    expect(out.vy).toBeGreaterThan(0);
    expect(out.y).toBeGreaterThan(50);
  });

  it('clamps to the ground line and zeroes vy on contact', () => {
    const out = applyGravity(GROUND - RUNNER_SIZE - 1, 200, 0.5);
    expect(out.y).toBe(GROUND - RUNNER_SIZE);
    expect(out.vy).toBe(0);
  });

  it('honours JUMP_V as a launch velocity and lifts the runner off the ground', () => {
    const out = applyGravity(GROUND - RUNNER_SIZE, JUMP_V, 0.016);
    expect(out.y).toBeLessThan(GROUND - RUNNER_SIZE);
  });
});

describe('canJump', () => {
  it('is true at the ground line', () => {
    expect(canJump(GROUND - RUNNER_SIZE)).toBe(true);
  });

  it('is true at one pixel below the ground line (slack for floating-point drift)', () => {
    expect(canJump(GROUND - RUNNER_SIZE - 1)).toBe(true);
  });

  it('is false in mid-air', () => {
    expect(canJump(GROUND - RUNNER_SIZE - 20)).toBe(false);
  });
});

describe('nextSpeed', () => {
  it('accelerates from the initial speed', () => {
    expect(nextSpeed(INITIAL_SPEED, 0.016)).toBeGreaterThan(INITIAL_SPEED);
  });

  it('clamps at MAX_SPEED', () => {
    expect(nextSpeed(MAX_SPEED, 1)).toBe(MAX_SPEED);
    expect(nextSpeed(MAX_SPEED - 0.5, 1)).toBe(MAX_SPEED);
  });
});

describe('spawnInterval', () => {
  it('is at most 1.6 at very low speed', () => {
    expect(spawnInterval(0)).toBe(1.6);
  });

  it('shortens as speed increases', () => {
    expect(spawnInterval(400)).toBeLessThan(spawnInterval(0));
  });

  it('clamps to a 0.6s floor at very high speed', () => {
    expect(spawnInterval(10_000)).toBe(0.6);
  });
});

describe('obstacleCollides', () => {
  const y = GROUND - RUNNER_SIZE; // runner on the ground

  it('is false when the obstacle is far to the right', () => {
    expect(obstacleCollides(y, { x: RUNNER_X + 200, w: 20, h: 30 })).toBe(false);
  });

  it('is false when the obstacle is far to the left (already passed)', () => {
    expect(obstacleCollides(y, { x: -200, w: 20, h: 30 })).toBe(false);
  });

  it('is true when an obstacle overlaps the runner box', () => {
    expect(obstacleCollides(y, { x: RUNNER_X + 5, w: 20, h: 30 })).toBe(true);
  });

  it('is false when the runner is high enough to clear a short obstacle', () => {
    // Runner is well above ground, obstacle is short
    expect(obstacleCollides(y - 60, { x: RUNNER_X + 5, w: 20, h: 20 })).toBe(false);
  });

  it('is true when the runner clips the top of a tall obstacle in mid-jump', () => {
    expect(obstacleCollides(y - 20, { x: RUNNER_X + 5, w: 20, h: 36 })).toBe(true);
  });
});
