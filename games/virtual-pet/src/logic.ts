export const KEY = 'pet:state';

export const MAX_OFFLINE_SECONDS = 3600 * 12;
export const REST_THRESHOLD_SECONDS = 600;

export type State = {
  hunger: number;
  fun: number;
  energy: number;
  age: number;
  lastSeen: number;
  mood: string;
};

export const initial = (): State => ({
  hunger: 80,
  fun: 70,
  energy: 90,
  age: 0,
  lastSeen: Date.now(),
  mood: '😊',
});

export function clamp(n: number, lo = 0, hi = 100): number {
  return Math.max(lo, Math.min(hi, n));
}

export function applyOfflineDecay(s: State, now: number = Date.now()): State {
  const elapsed = Math.min(MAX_OFFLINE_SECONDS, (now - s.lastSeen) / 1000);
  return {
    ...s,
    hunger: clamp(s.hunger - elapsed * 0.01),
    fun: clamp(s.fun - elapsed * 0.008),
    energy: clamp(s.energy - elapsed * 0.005 + Math.max(0, elapsed - REST_THRESHOLD_SECONDS) * 0.01),
    age: s.age + elapsed,
    lastSeen: now,
  };
}

export function moodOf(s: State): string {
  if (s.energy < 15) return '😴';
  if (s.hunger < 20) return '🥺';
  if (s.fun < 20) return '😒';
  if (s.hunger > 70 && s.fun > 60 && s.energy > 50) return '🥰';
  return '🙂';
}
