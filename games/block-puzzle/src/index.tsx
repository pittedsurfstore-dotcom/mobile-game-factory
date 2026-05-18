import React, { useCallback, useMemo, useRef, useState } from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { Button, Hud, theme } from '@mgf/ui';
import { useGameLoop, useHighScore, mulberry32, type GameModule } from '@mgf/game-core';
import { analytics } from '@mgf/analytics';
import { COLS, COLORS, SHAPES, type Board, clearLines, collides, makeBoard, merge, rotate } from './logic';

const meta = {
  id: 'block-puzzle' as const,
  title: 'Block Puzzle',
  blurb: 'Stack falling blocks, clear rows.',
  emoji: '🧱',
};

function Game() {
  const rngRef = useRef(mulberry32(Date.now() & 0xffffffff));
  const newPiece = useCallback(() => {
    const idx = Math.floor(rngRef.current() * SHAPES.length);
    return { shape: SHAPES[idx]!.map((r) => r.slice()), x: Math.floor(COLS / 2) - 1, y: -1 };
  }, []);

  const [board, setBoard] = useState<Board>(makeBoard);
  const [piece, setPiece] = useState(newPiece);
  const [score, setScore] = useState(0);
  const [running, setRunning] = useState(true);
  const [over, setOver] = useState(false);
  const dropAccRef = useRef(0);
  const dropIntervalRef = useRef(0.6);
  const { high, submit } = useHighScore(meta.id);

  const reset = useCallback(() => {
    setBoard(makeBoard());
    setPiece(newPiece());
    setScore(0);
    setOver(false);
    setRunning(true);
    dropAccRef.current = 0;
    dropIntervalRef.current = 0.6;
    analytics().track('game_restart', { id: meta.id });
  }, [newPiece]);

  const lockAndSpawn = useCallback(
    (b: Board, p: typeof piece) => {
      const merged = merge(b, p.shape, p.x, p.y);
      const { board: cleared, cleared: nCleared } = clearLines(merged);
      if (nCleared > 0) {
        setScore((s) => s + [0, 100, 300, 500, 800][nCleared]!);
        dropIntervalRef.current = Math.max(0.12, dropIntervalRef.current - 0.01);
      }
      const next = newPiece();
      if (collides(cleared, next.shape, next.x, next.y)) {
        setBoard(cleared);
        setRunning(false);
        setOver(true);
        analytics().track('game_over', { id: meta.id, score });
        submit(score);
        return;
      }
      setBoard(cleared);
      setPiece(next);
    },
    [newPiece, score, submit],
  );

  useGameLoop(
    (dt) => {
      dropAccRef.current += dt;
      if (dropAccRef.current < dropIntervalRef.current) return;
      dropAccRef.current = 0;
      setPiece((p) => {
        if (!collides(board, p.shape, p.x, p.y + 1)) return { ...p, y: p.y + 1 };
        lockAndSpawn(board, p);
        return p;
      });
    },
    { running },
  );

  const move = (dx: number) =>
    setPiece((p) => (collides(board, p.shape, p.x + dx, p.y) ? p : { ...p, x: p.x + dx }));
  const rotateAct = () =>
    setPiece((p) => {
      const r = rotate(p.shape);
      return collides(board, r, p.x, p.y) ? p : { ...p, shape: r };
    });
  const drop = () => {
    setPiece((p) => {
      let ny = p.y;
      while (!collides(board, p.shape, p.x, ny + 1)) ny++;
      lockAndSpawn(board, { ...p, y: ny });
      return p;
    });
  };

  const rendered = useMemo(() => {
    const view = board.map((row) => row.slice());
    for (let r = 0; r < piece.shape.length; r++) {
      for (let c = 0; c < piece.shape[r]!.length; c++) {
        const v = piece.shape[r]![c]!;
        const y = piece.y + r;
        if (v && y >= 0) view[y]![piece.x + c] = v;
      }
    }
    return view;
  }, [board, piece]);

  return (
    <View style={{ flex: 1 }}>
      <Hud left={`Score ${score}`} right={`Best ${high}`} />
      <View style={styles.board}>
        {rendered.map((row, ri) => (
          <View key={ri} style={styles.row}>
            {row.map((v, ci) => (
              <View key={ci} style={[styles.cell, { backgroundColor: v ? COLORS[v] : '#1f242c' }]} />
            ))}
          </View>
        ))}
      </View>
      <View style={styles.controls}>
        <Button label="◀" variant="ghost" onPress={() => move(-1)} />
        <Button label="⟳" variant="ghost" onPress={rotateAct} />
        <Button label="▼" variant="ghost" onPress={drop} />
        <Button label="▶" variant="ghost" onPress={() => move(1)} />
      </View>
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
  board: { flex: 1, gap: 1, marginVertical: 8 },
  row: { flex: 1, flexDirection: 'row', gap: 1 },
  cell: { flex: 1, borderRadius: 2 },
  controls: { flexDirection: 'row', gap: 8, justifyContent: 'space-around' },
  overlay: {
    position: 'absolute',
    inset: 0 as unknown as number,
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

const mod: GameModule = { meta, Screen: Game };
export default mod;
