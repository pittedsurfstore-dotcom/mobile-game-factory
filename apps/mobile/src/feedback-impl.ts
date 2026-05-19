import * as Haptics from 'expo-haptics';
import type { Feedback, HapticKind, SoundKind } from '@mgf/game-core';

const HAPTIC_MAP: Record<HapticKind, () => Promise<void>> = {
  tap: () => Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light),
  select: () => Haptics.selectionAsync(),
  success: () => Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success),
  warn: () => Haptics.notificationAsync(Haptics.NotificationFeedbackType.Warning),
  error: () => Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error),
};

export function createDeviceFeedback(): Feedback {
  return {
    haptic(kind: HapticKind) {
      // Fire-and-forget — haptics never throw fatally, but iOS Simulator's
      // shim resolves immediately and Android no-ops on devices without a
      // vibration motor. We swallow errors so a flaky bridge never crashes
      // a tap handler.
      void HAPTIC_MAP[kind]().catch(() => {});
    },
    sound(_kind: SoundKind) {
      // Wired in batch 2 (expo-av).
    },
  };
}
