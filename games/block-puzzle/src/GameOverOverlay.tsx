import React from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { Button, theme } from '@mgf/ui';

export const CONTINUE_CLEAR_ROWS = 3;

export type GameOverOverlayProps = {
  score: number;
  usedContinue: boolean;
  waitingForAd: boolean;
  entitled: boolean;
  onContinue: () => void;
  onReset: () => void;
};

export function continueButtonLabel(waitingForAd: boolean, entitled: boolean): string {
  if (waitingForAd) return 'Loading ad…';
  if (entitled) return `Continue (clear bottom ${CONTINUE_CLEAR_ROWS} rows)`;
  return `Watch ad to clear bottom ${CONTINUE_CLEAR_ROWS} rows`;
}

export function GameOverOverlay({
  score,
  usedContinue,
  waitingForAd,
  entitled,
  onContinue,
  onReset,
}: GameOverOverlayProps) {
  return (
    <View style={styles.overlay}>
      <Text style={styles.overText}>Game Over</Text>
      <Text style={styles.overSub}>Score {score}</Text>
      {!usedContinue && (
        <Button
          label={continueButtonLabel(waitingForAd, entitled)}
          onPress={onContinue}
          disabled={waitingForAd}
        />
      )}
      <Button label="Play again" variant={usedContinue ? 'primary' : 'ghost'} onPress={onReset} />
    </View>
  );
}

const styles = StyleSheet.create({
  overlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(0,0,0,0.75)',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 14,
  },
  overText: { color: theme.text, fontSize: 30, fontWeight: '800' },
  overSub: { color: theme.mute, fontSize: 16 },
});
