export const W = 320;
export const H = 220;
export const GROUND = H - 40;
export const RUNNER_X = 60;
export const RUNNER_SIZE = 30;
export const GRAVITY = 1600;
export const JUMP_V = -620;
export const INITIAL_SPEED = 180;
export const MAX_SPEED = 380;
export const SPEED_ACCEL = 6;

export type Obstacle = { x: number; w: number; h: number };

/**
 * Runs one physics step on the runner's vertical motion under gravity, clamping
 * to the ground line. Pure: returns the next (y, vy) pair.
 */
export function applyGravity(y: number, vy: number, dt: number): { y: number; vy: number } {
  let nextVy = vy + GRAVITY * dt;
  let nextY = y + nextVy * dt;
  if (nextY >= GROUND - RUNNER_SIZE) {
    nextY = GROUND - RUNNER_SIZE;
    nextVy = 0;
  }
  return { y: nextY, vy: nextVy };
}

export function canJump(y: number): boolean {
  return y >= GROUND - RUNNER_SIZE - 1;
}

export function nextSpeed(speed: number, dt: number): number {
  return Math.min(MAX_SPEED, speed + SPEED_ACCEL * dt);
}

export function spawnInterval(speed: number): number {
  return Math.max(0.6, 1.6 - speed / 400);
}

/**
 * Axis-aligned bounding-box collision between the runner's hitbox and one
 * obstacle. Runner is fixed at x=RUNNER_X, size RUNNER_SIZE.
 */
export function obstacleCollides(y: number, o: Obstacle): boolean {
  return RUNNER_X < o.x + o.w && RUNNER_X + RUNNER_SIZE > o.x && y + RUNNER_SIZE > GROUND - o.h && y < GROUND;
}
