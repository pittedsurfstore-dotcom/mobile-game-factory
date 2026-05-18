import React, { useCallback, useRef, useState } from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { Button, Hud, theme } from '@mgf/ui';
import { mulberry32, useHighScore, type GameModule } from '@mgf/game-core';
import { analytics } from '@mgf/analytics';

const meta = {
  id: 'ludo' as const,
  title: 'Ludo Lite',
  blurb: 'Race to the finish. Mind the snakes.',
  emoji: '🎲',
};

const TRACK = 30;
const SHORTCUTS: Record<number, number> = { 4: 12, 9: 20, 15: 5, 22: 11, 25: 28 };

function Game() {
  const rngRef = useRef(mulberry32(Date.now() & 0xffffffff));
  const [pos, setPos] = useState(0);
  const [die, setDie] = useState<number | null>(null);
  const [rolls, setRolls] = useState(0);
  const [won, setWon] = useState(false);
  const [rolling, setRolling] = useState(false);
  const { high, submit } = useHighScore(meta.id);

  const roll = useCallback(() => {
    if (won || rolling) return;
    setRolling(true);
    let ticks = 0;
    const interval = setInterval(() => {
      setDie(Math.floor(rngRef.current() * 6) + 1);
      ticks++;
      if (ticks >= 6) {
        clearInterval(interval);
        const value = Math.floor(rngRef.current() * 6) + 1;
        setDie(value);
        setRolls((r) => r + 1);
        setPos((p) => {
          let np = Math.min(TRACK, p + value);
          if (SHORTCUTS[np] != null) np = SHORTCUTS[np]!;
          if (np >= TRACK) {
            setWon(true);
            const score = Math.max(0, 200 - rolls * 5);
            analytics().track('game_over', { id: meta.id, rolls: rolls + 1, score });
            submit(score);
          }
          return np;
        });
        setRolling(false);
      }
    }, 80);
  }, [won, rolling, rolls, submit]);

  const reset = useCallback(() => {
    rngRef.current = mulberry32(Date.now() & 0xffffffff);
    setPos(0);
    setDie(null);
    setRolls(0);
    setWon(false);
    analytics().track('game_restart', { id: meta.id });
  }, []);

  const cells: number[] = [];
  for (let i = 0; i <= TRACK; i++) cells.push(i);

  return (
    <View style={{ flex: 1 }}>
      <Hud left={`Rolls ${rolls}`} right={`Best ${high}`} />
      <View style={styles.track}>
        {cells.map((i) => {
          const sc = SHORTCUTS[i];
          const isHere = pos === i;
          const isStart = i === 0;
          const isEnd = i === TRACK;
          return (
            <View
              key={i}
              style={[
                styles.cell,
                isStart && styles.start,
                isEnd && styles.end,
                sc != null && sc > i && styles.ladder,
                sc != null && sc < i && styles.snake,
                isHere && styles.here,
              ]}
            >
              <Text style={styles.cellTxt}>
                {isHere ? '🧍' : isEnd ? '🏁' : sc != null ? (sc > i ? '↑' : '↓') : i}
              </Text>
            </View>
          );
        })}
      </View>
      <View style={styles.dieRow}>
        <Text style={styles.die}>{die ?? '–'}</Text>
        <View style={{ flex: 1 }}>
          <Button
            label={rolling ? 'Rolling…' : won ? 'You won!' : 'Roll'}
            onPress={roll}
            disabled={rolling || won}
          />
        </View>
      </View>
      {won ? (
        <View style={{ marginTop: 12 }}>
          <Button label="Play again" variant="ghost" onPress={reset} />
        </View>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  track: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 6,
    marginVertical: 12,
  },
  cell: {
    width: '14%',
    aspectRatio: 1,
    backgroundColor: theme.surface,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
  },
  start: { backgroundColor: '#2d4a30' },
  end: { backgroundColor: '#4a3a2d' },
  ladder: { backgroundColor: '#1d3a55' },
  snake: { backgroundColor: '#552020' },
  here: { borderWidth: 2, borderColor: theme.accent },
  cellTxt: { color: theme.text, fontSize: 14 },
  dieRow: { flexDirection: 'row', alignItems: 'center', gap: 12, marginTop: 8 },
  die: {
    width: 64,
    height: 64,
    backgroundColor: theme.surface,
    borderRadius: 12,
    color: theme.text,
    textAlign: 'center',
    fontSize: 36,
    lineHeight: 64,
    fontWeight: '700',
  },
});

const mod: GameModule = { meta, Screen: Game };
export default mod;
