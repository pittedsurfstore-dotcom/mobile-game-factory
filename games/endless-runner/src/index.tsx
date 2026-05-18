import React, { useCallback, useRef, useState } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { Button, Hud, theme } from '@mgf/ui';
import { useGameLoop, useHighScore, mulberry32, type GameModule } from '@mgf/game-core';
import { analytics } from '@mgf/analytics';

const meta = {
  id: 'endless-runner' as const,
  title: 'Endless Runner',
  blurb: 'Tap to jump. Don’t get hit.',
  emoji: '🏃',
};

import {
  GROUND,
  H,
  INITIAL_SPEED,
  JUMP_V,
  RUNNER_SIZE,
  RUNNER_X,
  W,
  type Obstacle,
  applyGravity,
  canJump,
  nextSpeed as advanceSpeed,
  obstacleCollides,
  spawnInterval,
} from './logic';

function Game() {
  const [score, setScore] = useState(0);
  const [over, setOver] = useState(false);
  const yRef = useRef(GROUND - RUNNER_SIZE);
  const vyRef = useRef(0);
  const obsRef = useRef<Obstacle[]>([]);
  const speedRef = useRef(INITIAL_SPEED);
  const spawnAccRef = useRef(0);
  const rngRef = useRef(mulberry32(Date.now() & 0xffffffff));
  const [tick, setTick] = useState(0);
  const { high, submit } = useHighScore(meta.id);

  useGameLoop(
    (dt) => {
      if (over) return;
      const step = applyGravity(yRef.current, vyRef.current, dt);
      yRef.current = step.y;
      vyRef.current = step.vy;
      speedRef.current = advanceSpeed(speedRef.current, dt);
      const next: Obstacle[] = [];
      for (const o of obsRef.current) {
        const nx = o.x - speedRef.current * dt;
        if (nx + o.w > 0) next.push({ ...o, x: nx });
      }
      spawnAccRef.current += dt;
      if (spawnAccRef.current >= spawnInterval(speedRef.current)) {
        spawnAccRef.current = 0;
        const big = rngRef.current() > 0.6;
        next.push({ x: W + 20, w: big ? 26 : 18, h: big ? 36 : 24 });
      }
      obsRef.current = next;
      for (const o of next) {
        if (obstacleCollides(yRef.current, o)) {
          setOver(true);
          analytics().track('game_over', { id: meta.id, score });
          submit(score);
          return;
        }
      }
      setScore((s) => s + Math.floor(speedRef.current * dt));
      setTick((t) => t + 1);
    },
    { running: !over, fps: 60 },
  );

  const jump = () => {
    if (over) return;
    if (canJump(yRef.current)) vyRef.current = JUMP_V;
  };

  const reset = useCallback(() => {
    yRef.current = GROUND - RUNNER_SIZE;
    vyRef.current = 0;
    obsRef.current = [];
    speedRef.current = INITIAL_SPEED;
    spawnAccRef.current = 0;
    rngRef.current = mulberry32(Date.now() & 0xffffffff);
    setScore(0);
    setOver(false);
    analytics().track('game_restart', { id: meta.id });
  }, []);

  return (
    <View style={{ flex: 1 }}>
      <Hud left={`Score ${score}`} right={`Best ${high}`} />
      <Pressable onPress={jump} style={styles.world}>
        <View style={styles.sky} />
        <View style={[styles.runner, { top: yRef.current }]}>
          <Text style={{ fontSize: 24 }}>🏃</Text>
        </View>
        {obsRef.current.map((o, i) => (
          <View
            key={`${i}-${tick % 2}`}
            style={[styles.obstacle, { left: o.x, top: GROUND - o.h, width: o.w, height: o.h }]}
          />
        ))}
        <View style={styles.ground} />
      </Pressable>
      <Text style={styles.hint}>Tap the field to jump</Text>
      {over && (
        <View style={styles.overlay}>
          <Text style={styles.overText}>Game Over</Text>
          <Text style={styles.overSub}>Score {score}</Text>
          <Button label="Play again" onPress={reset} />
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  world: {
    height: H,
    backgroundColor: '#0f1620',
    borderRadius: theme.radius,
    overflow: 'hidden',
    marginVertical: 10,
    position: 'relative',
  },
  sky: { ...StyleSheet.absoluteFillObject, backgroundColor: '#11151c' },
  ground: {
    position: 'absolute',
    left: 0,
    right: 0,
    top: GROUND,
    height: H - GROUND,
    backgroundColor: '#3a8a4a',
  },
  runner: { position: 'absolute', left: RUNNER_X, width: RUNNER_SIZE, height: RUNNER_SIZE },
  obstacle: { position: 'absolute', backgroundColor: theme.danger, borderRadius: 4 },
  hint: { color: theme.mute, textAlign: 'center', marginBottom: 8 },
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
