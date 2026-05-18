export const W = 320;
export const H = 360;
export const R = 11;
export const POCKET_R = 18;
export const FRICTION = 0.985;
export const MAX_PULL = 110;
export const POWER = 5;
export const STOP_THRESHOLD = 0.02;

export type Vec = { x: number; y: number };
export type Ball = {
  x: number;
  y: number;
  vx: number;
  vy: number;
  color: string;
  sunk: boolean;
  cue?: boolean;
};

export const POCKETS: Vec[] = [
  { x: 0, y: 0 },
  { x: W, y: 0 },
  { x: 0, y: H },
  { x: W, y: H },
  { x: W / 2, y: 0 },
  { x: W / 2, y: H },
];

export const RACK_COLORS = ['#ff5572', '#7cf8ff', '#ffd34d', '#7fdc7f', '#c779ff', '#ffa552'];

export function initialBalls(): Ball[] {
  const cue: Ball = { x: W / 2, y: H - 60, vx: 0, vy: 0, color: '#f5f5f5', sunk: false, cue: true };
  const rack: Ball[] = [];
  const cx = W / 2;
  const cy = 100;
  let i = 0;
  for (let row = 0; row < 3; row++) {
    for (let col = 0; col <= row; col++) {
      if (i >= RACK_COLORS.length) break;
      const x = cx + (col - row / 2) * (R * 2.1);
      const y = cy + row * R * 1.85;
      rack.push({ x, y, vx: 0, vy: 0, color: RACK_COLORS[i]!, sunk: false });
      i++;
    }
  }
  return [cue, ...rack];
}

export function isStopped(b: Ball, threshold: number = STOP_THRESHOLD): boolean {
  return Math.abs(b.vx) < threshold && Math.abs(b.vy) < threshold;
}

export function pocketHit(b: Ball, pockets: readonly Vec[], pocketR: number): boolean {
  for (const p of pockets) {
    const dx = b.x - p.x;
    const dy = b.y - p.y;
    if (dx * dx + dy * dy < pocketR * pocketR) return true;
  }
  return false;
}

/**
 * Elastic collision between two equal-mass circles of radius r. Returns a new
 * pair with positional overlap corrected and velocities exchanged along the
 * collision normal. Returns the inputs unchanged when the balls do not actually
 * overlap.
 */
export function collideBalls(a: Ball, b: Ball, r: number): [Ball, Ball] {
  const dx = b.x - a.x;
  const dy = b.y - a.y;
  const d2 = dx * dx + dy * dy;
  const min = r * 2;
  if (d2 <= 0 || d2 >= min * min) return [a, b];

  const d = Math.sqrt(d2);
  const nx = dx / d;
  const ny = dy / d;
  const overlap = (min - d) / 2;

  const aOut: Ball = { ...a, x: a.x - nx * overlap, y: a.y - ny * overlap };
  const bOut: Ball = { ...b, x: b.x + nx * overlap, y: b.y + ny * overlap };

  const dvx = b.vx - a.vx;
  const dvy = b.vy - a.vy;
  const p = (dvx * nx + dvy * ny) * 0.9;
  aOut.vx = a.vx + p * nx;
  aOut.vy = a.vy + p * ny;
  bOut.vx = b.vx - p * nx;
  bOut.vy = b.vy - p * ny;

  return [aOut, bOut];
}
