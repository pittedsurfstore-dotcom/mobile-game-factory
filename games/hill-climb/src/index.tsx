import React, { useCallback, useRef, useState } from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { Button, Hud, theme } from '@mgf/ui';
import { useGameLoop, useHighScore, type GameModule } from '@mgf/game-core';
import { analytics } from '@mgf/analytics';

const meta = {
  id: 'hill-climb' as const,
  title: 'Hill Climb',
  blurb: 'Ride the hills before you flip. Hold gas.',
  emoji: '🚙',
};

const VIEW_H = 240;
const HORIZON = VIEW_H * 0.75;
const SAMPLES = 60;

function terrainY(x: number): number {
  return Math.sin(x * 0.012) * 30 + Math.sin(x * 0.04) * 12 + Math.sin(x * 0.001 + 1.2) * 50;
}

function Game() {
  const [distance, setDistance] = useState(0);
  const [fuel, setFuel] = useState(100);
  const [speed, setSpeed] = useState(0);
  const [tilt, setTilt] = useState(0);
  const [over, setOver] = useState(false);
  const cameraRef = useRef(0);
  const inputRef = useRef<'gas' | 'brake' | null>(null);
  const { high, submit } = useHighScore(meta.id);

  useGameLoop(
    (dt) => {
      if (over) return;
      let nextSpeed = speed;
      if (inputRef.current === 'gas') nextSpeed = Math.min(160, nextSpeed + 60 * dt);
      else if (inputRef.current === 'brake') nextSpeed = Math.max(-40, nextSpeed - 90 * dt);
      else nextSpeed *= 1 - 0.4 * dt;
      const camera = cameraRef.current + nextSpeed * dt;
      const slope = terrainY(camera + 20) - terrainY(camera);
      const newTilt = Math.atan2(slope, 20);
      const nextFuel = Math.max(0, fuel - (Math.abs(nextSpeed) * 0.04 + 1) * dt);
      cameraRef.current = camera;
      setSpeed(nextSpeed);
      setTilt(newTilt);
      setDistance(Math.max(0, Math.floor(camera / 5)));
      setFuel(nextFuel);
      if (nextFuel <= 0 || Math.abs(newTilt) > 1.1) {
        setOver(true);
        const score = Math.max(0, Math.floor(camera / 5));
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
    setFuel(100);
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
