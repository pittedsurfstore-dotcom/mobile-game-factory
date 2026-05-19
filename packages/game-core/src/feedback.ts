/**
 * Cross-game haptic and sound feedback shims. Games call these from event
 * handlers without depending on react-native or expo-haptics directly, which
 * keeps the game packages testable under ts-jest and lets us swap in
 * platform-specific implementations from apps/mobile at startup.
 *
 * Real implementations are wired in apps/mobile/src/feedback-impl.ts.
 */

export type HapticKind = 'tap' | 'select' | 'success' | 'warn' | 'error';
export type SoundKind = 'tap' | 'select' | 'success' | 'fail' | 'pop';

export interface Feedback {
  haptic(kind: HapticKind): void;
  sound(kind: SoundKind): void;
}

const noopFeedback: Feedback = {
  haptic() {},
  sound() {},
};

let impl: Feedback = noopFeedback;

export function setFeedback(f: Feedback) {
  impl = f;
}

export function feedback(): Feedback {
  return impl;
}
