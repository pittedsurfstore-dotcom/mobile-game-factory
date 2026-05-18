import React, { useCallback, useMemo, useRef, useState } from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { Button, Hud, theme } from '@mgf/ui';
import { useGameLoop, useHighScore, mulberry32, type GameModule } from '@mgf/game-core';
import { analytics } from '@mgf/analytics';

const COLS = 10;
const ROWS = 18;
const EMPTY = 0;

type Cell = number;
type Board = Cell[][];

const SHAPES: number[][][] = [
  [[1, 1, 1, 1]],
  [
    [2, 0, 0],
    [2, 2, 2],
  ],
  [
    [0, 0, 3],
    [3, 3, 3],
  ],
  [
    [4, 4],
    [4, 4],
  ],
  [
    [0, 5, 5],
    [5, 5, 0],
  ],
  [
    [0, 6, 0],
    [6, 6, 6],
  ],
  [
    [7, 7, 0],
    [0, 7, 7],
  ],
];

const COLORS = ['transparent', '#7cf8ff', '#5a8cff', '#ffa552', '#ffd34d', '#7fdc7f', '#c779ff', '#ff5572'];

const makeBoard = (): Board => Array.from({ length: ROWS }, () => Array<Cell>(COLS).fill(EMPTY));

function rotate(shape: number[][]): number[][] {
  const rows = shape.length;
  const cols = shape[0]!.length;
  const out: number[][] = Array.from({ length: cols }, () => Array<number>(rows).fill(0));
  for (let r = 0; r < rows; r++) for (let c = 0; c < cols; c++) out[c]![rows - 1 - r] = shape[r]![c]!;
  return out;
}

function collides(board: Board, shape: number[][], x: number, y: number): boolean {
  for (let r = 0; r < shape.length; r++) {
    for (let c = 0; c < shape[r]!.length; c++) {
      if (!shape[r]![c]) continue;
      const nx = x + c;
      const ny = y + r;
      if (nx < 0 || nx >= COLS || ny >= ROWS) return true;
      if (ny >= 0 && board[ny]![nx]) return true;
    }
  }
  return false;
}

function merge(board: Board, shape: number[][], x: number, y: number): Board {
  const next = board.map((row) => row.slice());
  for (let r = 0; r < shape.length; r++) {
    for (let c = 0; c < shape[r]!.length; c++) {
      const v = shape[r]![c]!;
      if (v && y + r >= 0) next[y + r]![x + c] = v;
    }
  }
  return next;
}

function clearLines(board: Board): { board: Board; cleared: number } {
  const kept = board.filter((row) => row.some((v) => v === 0));
  const cleared = ROWS - kept.length;
  const empties: Board = Array.from({ length: cleared }, () => Array<Cell>(COLS).fill(EMPTY));
  return { board: [...empties, ...kept], cleared };
}

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
