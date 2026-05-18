import React, { useCallback, useRef, useState } from 'react';
import { PanResponder, StyleSheet, Text, View } from 'react-native';
import { Button, Hud, theme } from '@mgf/ui';
import { useGameLoop, useHighScore, type GameModule } from '@mgf/game-core';
import { analytics } from '@mgf/analytics';
import {
  FRICTION,
  H,
  MAX_PULL,
  POCKETS,
  POCKET_R,
  POWER,
  R,
  STOP_THRESHOLD,
  W,
  type Ball,
  initialBalls,
  isStopped,
} from './logic';

const meta = {
  id: 'pool-lite' as const,
  title: 'Pool Lite',
  blurb: 'Drag from the cue ball. Sink the colors.',
  emoji: '🎱',
};

function Game() {
  const [balls, setBalls] = useState<Ball[]>(initialBalls);
  const [aim, setAim] = useState<{ dx: number; dy: number } | null>(null);
  const [score, setScore] = useState(0);
  const [shots, setShots] = useState(0);
  const [over, setOver] = useState(false);
  const { high, submit } = useHighScore(meta.id);
  const ballsRef = useRef(balls);
  ballsRef.current = balls;

  useGameLoop(
    (dt) => {
      const next = ballsRef.current.map((b) => ({ ...b }));
      for (const b of next) {
        if (b.sunk) continue;
        b.x += b.vx * dt * 60;
        b.y += b.vy * dt * 60;
        b.vx *= FRICTION;
        b.vy *= FRICTION;
        if (Math.abs(b.vx) < STOP_THRESHOLD) b.vx = 0;
        if (Math.abs(b.vy) < STOP_THRESHOLD) b.vy = 0;
        if (b.x - R < 0) {
          b.x = R;
          b.vx = -b.vx * 0.85;
        }
        if (b.x + R > W) {
          b.x = W - R;
          b.vx = -b.vx * 0.85;
        }
        if (b.y - R < 0) {
          b.y = R;
          b.vy = -b.vy * 0.85;
        }
        if (b.y + R > H) {
          b.y = H - R;
          b.vy = -b.vy * 0.85;
        }
        for (const p of POCKETS) {
          const dx = b.x - p.x;
          const dy = b.y - p.y;
          if (dx * dx + dy * dy < POCKET_R * POCKET_R) {
            b.sunk = true;
            b.vx = 0;
            b.vy = 0;
            if (b.cue) {
              b.sunk = false;
              b.x = W / 2;
              b.y = H - 60;
            } else {
              setScore((s) => s + 100);
            }
          }
        }
      }
      for (let i = 0; i < next.length; i++) {
        for (let j = i + 1; j < next.length; j++) {
          const a = next[i]!;
          const c = next[j]!;
          if (a.sunk || c.sunk) continue;
          const dx = c.x - a.x;
          const dy = c.y - a.y;
          const d2 = dx * dx + dy * dy;
          const min = R * 2;
          if (d2 > 0 && d2 < min * min) {
            const d = Math.sqrt(d2);
            const nx = dx / d;
            const ny = dy / d;
            const overlap = (min - d) / 2;
            a.x -= nx * overlap;
            a.y -= ny * overlap;
            c.x += nx * overlap;
            c.y += ny * overlap;
            const dvx = c.vx - a.vx;
            const dvy = c.vy - a.vy;
            const p = (dvx * nx + dvy * ny) * 0.9;
            a.vx += p * nx;
            a.vy += p * ny;
            c.vx -= p * nx;
            c.vy -= p * ny;
          }
        }
      }
      setBalls(next);
      if (!over && next.every((b) => b.cue || b.sunk)) {
        setOver(true);
        analytics().track('game_over', { id: meta.id, score, shots });
        submit(score);
      }
    },
    { running: !over, fps: 60 },
  );

  const stopped = balls.every((b) => isStopped(b));

  const responder = useRef(
    PanResponder.create({
      onStartShouldSetPanResponder: () => stopped && !over,
      onPanResponderMove: (_e, g) => {
        if (!stopped || over) return;
        let dx = -g.dx;
        let dy = -g.dy;
        const m = Math.hypot(dx, dy);
        if (m > MAX_PULL) {
          dx = (dx / m) * MAX_PULL;
          dy = (dy / m) * MAX_PULL;
        }
        setAim({ dx, dy });
      },
      onPanResponderRelease: () => {
        if (!aim) return;
        const cue = ballsRef.current.find((b) => b.cue);
        if (!cue) return;
        const power = Math.hypot(aim.dx, aim.dy) / MAX_PULL;
        const vx = (aim.dx / MAX_PULL) * POWER * Math.max(0.05, power);
        const vy = (aim.dy / MAX_PULL) * POWER * Math.max(0.05, power);
        setBalls((bs) => bs.map((b) => (b.cue ? { ...b, vx, vy } : b)));
        setShots((s) => s + 1);
        setAim(null);
      },
      onPanResponderTerminate: () => setAim(null),
    }),
  ).current;

  const reset = useCallback(() => {
    setBalls(initialBalls());
    setScore(0);
    setShots(0);
    setOver(false);
    setAim(null);
    analytics().track('game_restart', { id: meta.id });
  }, []);

  const cue = balls.find((b) => b.cue);

  return (
    <View style={{ flex: 1 }}>
      <Hud left={`Score ${score}   Shots ${shots}`} right={`Best ${high}`} />
      <View style={styles.table} {...responder.panHandlers}>
        {POCKETS.map((p, i) => (
          <View key={i} style={[styles.pocket, { left: p.x - POCKET_R, top: p.y - POCKET_R }]} />
        ))}
        {balls.map((b, i) =>
          b.sunk ? null : (
            <View
              key={i}
              style={[
                styles.ball,
                { left: b.x - R, top: b.y - R, backgroundColor: b.color, borderWidth: b.cue ? 0 : 1 },
              ]}
            />
          ),
        )}
        {aim && cue ? (
          <View
            pointerEvents="none"
            style={[
              styles.aimDot,
              {
                left: cue.x + aim.dx - 4,
                top: cue.y + aim.dy - 4,
                opacity: Math.hypot(aim.dx, aim.dy) / MAX_PULL,
              },
            ]}
          />
        ) : null}
      </View>
      <View style={{ marginTop: 10 }}>
        <Button label="Rack & reset" variant="ghost" onPress={reset} />
      </View>
      {over ? (
        <View style={styles.overlay}>
          <Text style={styles.overText}>Cleared</Text>
          <Text style={styles.overSub}>
            Score {score} • {shots} shots
          </Text>
          <Button label="Play again" onPress={reset} />
        </View>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  table: {
    width: W,
    height: H,
    backgroundColor: '#1a5a2a',
    borderRadius: 14,
    borderWidth: 6,
    borderColor: '#5b3a18',
    alignSelf: 'center',
    overflow: 'hidden',
    position: 'relative',
  },
  pocket: {
    position: 'absolute',
    width: POCKET_R * 2,
    height: POCKET_R * 2,
    borderRadius: POCKET_R,
    backgroundColor: '#0b0d10',
  },
  ball: {
    position: 'absolute',
    width: R * 2,
    height: R * 2,
    borderRadius: R,
    borderColor: 'rgba(0,0,0,0.4)',
  },
  aimDot: { position: 'absolute', width: 8, height: 8, borderRadius: 4, backgroundColor: '#fff' },
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
