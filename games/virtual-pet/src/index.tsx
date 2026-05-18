import React, { useEffect, useRef, useState } from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { Button, Hud, theme } from '@mgf/ui';
import { getStore, useGameLoop, type GameModule } from '@mgf/game-core';
import { analytics } from '@mgf/analytics';
import { KEY, type State, applyOfflineDecay, clamp, initial, moodOf } from './logic';

const meta = {
  id: 'virtual-pet' as const,
  title: 'Virtual Pet',
  blurb: 'Feed, play, sleep. Keep them happy.',
  emoji: '🐶',
};

function Game() {
  const [state, setState] = useState<State>(initial);
  const loadedRef = useRef(false);

  useEffect(() => {
    let live = true;
    getStore()
      .get(KEY)
      .then((raw) => {
        if (!live) return;
        if (raw) {
          try {
            const parsed = JSON.parse(raw) as State;
            setState(applyOfflineDecay(parsed));
          } catch {
            setState(initial());
          }
        }
        loadedRef.current = true;
      });
    return () => {
      live = false;
    };
  }, []);

  useGameLoop(
    (dt) => {
      setState((s) => {
        const next = {
          ...s,
          hunger: clamp(s.hunger - 0.6 * dt),
          fun: clamp(s.fun - 0.5 * dt),
          energy: clamp(s.energy - 0.3 * dt),
          age: s.age + dt,
          lastSeen: Date.now(),
        };
        next.mood = moodOf(next);
        return next;
      });
    },
    { running: true, fps: 4 },
  );

  useEffect(() => {
    if (!loadedRef.current) return;
    const t = setTimeout(() => {
      void getStore().set(KEY, JSON.stringify(state));
    }, 250);
    return () => clearTimeout(t);
  }, [state]);

  const act = (label: string, mut: (s: State) => State) => {
    analytics().track('pet_action', { id: meta.id, action: label });
    setState((s) => {
      const next = mut(s);
      next.mood = moodOf(next);
      return next;
    });
  };

  const ageMins = Math.floor(state.age / 60);

  return (
    <View style={{ flex: 1 }}>
      <Hud left={`Age ${ageMins}m`} right={state.mood} />
      <View style={styles.stage}>
        <Text style={styles.pet}>🐶</Text>
        <Text style={styles.mood}>{state.mood}</Text>
      </View>
      <Stat label="Hunger" value={state.hunger} color="#ffa552" />
      <Stat label="Fun" value={state.fun} color="#7cf8ff" />
      <Stat label="Energy" value={state.energy} color="#7fdc7f" />
      <View style={styles.row}>
        <View style={styles.btn}>
          <Button label="Feed" onPress={() => act('feed', (s) => ({ ...s, hunger: clamp(s.hunger + 25) }))} />
        </View>
        <View style={styles.btn}>
          <Button
            label="Play"
            variant="ghost"
            onPress={() =>
              act('play', (s) => ({ ...s, fun: clamp(s.fun + 25), energy: clamp(s.energy - 10) }))
            }
          />
        </View>
        <View style={styles.btn}>
          <Button
            label="Sleep"
            variant="ghost"
            onPress={() => act('sleep', (s) => ({ ...s, energy: clamp(s.energy + 35) }))}
          />
        </View>
      </View>
    </View>
  );
}

function Stat({ label, value, color }: { label: string; value: number; color: string }) {
  return (
    <View style={styles.statRow}>
      <Text style={styles.statLabel}>{label}</Text>
      <View style={styles.bar}>
        <View style={[styles.barFill, { width: `${Math.round(value)}%`, backgroundColor: color }]} />
      </View>
      <Text style={styles.statValue}>{Math.round(value)}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  stage: {
    height: 180,
    backgroundColor: theme.surface,
    borderRadius: theme.radius,
    alignItems: 'center',
    justifyContent: 'center',
    marginVertical: 10,
  },
  pet: { fontSize: 92 },
  mood: { fontSize: 28, marginTop: 4 },
  row: { flexDirection: 'row', gap: 8, marginTop: 12 },
  btn: { flex: 1 },
  statRow: { flexDirection: 'row', alignItems: 'center', gap: 10, marginVertical: 4 },
  statLabel: { color: theme.text, width: 70 },
  bar: { flex: 1, height: 10, backgroundColor: theme.surface, borderRadius: 5, overflow: 'hidden' },
  barFill: { height: '100%' },
  statValue: { color: theme.mute, width: 40, textAlign: 'right' },
});

const mod: GameModule = { meta, Screen: Game };
export default mod;
