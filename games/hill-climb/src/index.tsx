import React, { useCallback, useRef, useState } from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { Button, Hud, theme } from '@mgf/ui';
import { useGameLoop, useHighScore, type GameModule } from '@mgf/game-core';
import { analytics } from '@mgf/analytics';
import {
  HORIZON,
  INITIAL_FUEL,
  SAMPLES,
  VIEW_H,
  burnFuel,
  distanceFromCamera,
  isCrashed,
  nextSpeed as advanceSpeed,
  terrainY,
  tiltAt,
} from './logic';

const meta = {
  id: 'hill-climb' as const,
  title: 'Hill Climb',
  blurb: 'Ride the hills before you flip. Hold gas.',
  emoji: '🚙',
};

function Game() {
  const [distance, setDistance] = useState(0);
  const [fuel, setFuel] = useState(INITIAL_FUEL);
  const [speed, setSpeed] = useState(0);
  const [tilt, setTilt] = useState(0);
  const [over, setOver] = useState(false);
  const cameraRef = useRef(0);
  const inputRef = useRef<'gas' | 'brake' | null>(null);
  const { high, submit } = useHighScore(meta.id);

  useGameLoop(
    (dt) => {
      if (over) return;
      const ns = advanceSpeed(speed, inputRef.current, dt);
      const camera = cameraRef.current + ns * dt;
      const newTilt = tiltAt(camera);
      const nextFuel = burnFuel(fuel, ns, dt);
      cameraRef.current = camera;
      setSpeed(ns);
      setTilt(newTilt);
      setDistance(distanceFromCamera(camera));
      setFuel(nextFuel);
      if (isCrashed(newTilt, nextFuel)) {
        setOver(true);
        const score = distanceFromCamera(camera);
        analytics().track('game_over', { id: meta.id, score });
        submit(score);
      }
    },
    { running: !over, fps: 30 },
  );

  const reset = useCallback(() => {
    cameraRef.current = 0;
    inputRef.current = null;
    setDistance(0);
    setFuel(INITIAL_FUEL);
    setSpeed(0);
    setTilt(0);
    setOver(false);
    analytics().track('game_restart', { id: meta.id });
  }, []);

  const samples: number[] = [];
  for (let i = 0; i < SAMPLES; i++) {
    const x = cameraRef.current + (i / SAMPLES) * 220;
    samples.push(terrainY(x));
  }
  const minY = Math.min(...samples);
  const maxY = Math.max(...samples);
  const span = Math.max(40, maxY - minY);

  return (
    <View style={{ flex: 1 }}>
      <Hud left={`Distance ${distance}m`} right={`Fuel ${Math.round(fuel)}   Best ${high}`} />
      <View style={styles.world}>
        {samples.map((y, i) => {
          const h = ((y - minY) / span) * 120 + 30;
          return <View key={i} style={[styles.slice, { height: h }]} />;
        })}
        <View style={[styles.car, { transform: [{ rotate: `${tilt}rad` }] }]}>
          <Text style={{ fontSize: 28 }}>🚙</Text>
        </View>
      </View>
      <View style={styles.controls}>
        <View style={styles.padBtn}>
          <Button
            label="Brake"
            variant="ghost"
            onPress={() => {
              inputRef.current = 'brake';
              setTimeout(() => {
                if (inputRef.current === 'brake') inputRef.current = null;
              }, 250);
            }}
          />
        </View>
        <View style={styles.padBtn}>
          <Button
            label="Gas"
            onPress={() => {
              inputRef.current = 'gas';
              setTimeout(() => {
                if (inputRef.current === 'gas') inputRef.current = null;
              }, 250);
            }}
          />
        </View>
      </View>
      {over && (
        <View style={styles.overlay}>
          <Text style={styles.overText}>Crashed</Text>
          <Text style={styles.overSub}>{distance}m</Text>
          <Button label="Try again" onPress={reset} />
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  world: {
    height: VIEW_H,
    backgroundColor: '#1b2230',
    borderRadius: theme.radius,
    overflow: 'hidden',
    flexDirection: 'row',
    alignItems: 'flex-end',
    marginVertical: 10,
    position: 'relative',
  },
  slice: { flex: 1, backgroundColor: '#3a8a4a' },
  car: {
    position: 'absolute',
    top: HORIZON - 60,
    left: 60,
    width: 32,
    height: 32,
    alignItems: 'center',
    justifyContent: 'center',
  },
  controls: { flexDirection: 'row', gap: 10 },
  padBtn: { flex: 1 },
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
  overText: { color: theme.text, fontSize: 28, fontWeight: '800' },
  overSub: { color: theme.mute, fontSize: 16 },
});

const mod: GameModule = { meta, Screen: Game };
export default mod;
