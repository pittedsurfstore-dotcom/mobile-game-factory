export const VIEW_H = 240;
export const HORIZON = VIEW_H * 0.75;
export const SAMPLES = 60;

export const MAX_SPEED = 160;
export const MIN_SPEED = -40;
export const GAS_ACCEL = 60;
export const BRAKE_ACCEL = 90;
export const COAST_DRAG = 0.4;
export const INITIAL_FUEL = 100;
export const FUEL_BURN_PER_SPEED = 0.04;
export const FUEL_IDLE_BURN = 1;
export const CRASH_TILT = 1.1;
export const SLOPE_DX = 20;

export type Input = 'gas' | 'brake' | null;

export function terrainY(x: number): number {
  return Math.sin(x * 0.012) * 30 + Math.sin(x * 0.04) * 12 + Math.sin(x * 0.001 + 1.2) * 50;
}

export function nextSpeed(speed: number, input: Input, dt: number): number {
  if (input === 'gas') return Math.min(MAX_SPEED, speed + GAS_ACCEL * dt);
  if (input === 'brake') return Math.max(MIN_SPEED, speed - BRAKE_ACCEL * dt);
  return speed * (1 - COAST_DRAG * dt);
}

export function tiltAt(camera: number): number {
  const slope = terrainY(camera + SLOPE_DX) - terrainY(camera);
  return Math.atan2(slope, SLOPE_DX);
}

export function burnFuel(fuel: number, speed: number, dt: number): number {
  return Math.max(0, fuel - (Math.abs(speed) * FUEL_BURN_PER_SPEED + FUEL_IDLE_BURN) * dt);
}

export function distanceFromCamera(camera: number): number {
  return Math.max(0, Math.floor(camera / 5));
}

export function isCrashed(tilt: number, fuel: number): boolean {
  return fuel <= 0 || Math.abs(tilt) > CRASH_TILT;
}
