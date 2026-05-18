import React, { useCallback, useEffect, useRef, useState } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { Button, Hud, theme } from '@mgf/ui';
import { mulberry32, useHighScore, type GameModule } from '@mgf/game-core';
import { analytics } from '@mgf/analytics';

const COLS = 7;
const ROWS = 8;
const COLORS = ['#ff5572', '#7cf8ff', '#ffd34d', '#7fdc7f', '#c779ff', '#ffa552'];

type Board = number[][];

function randomBoard(rand: () => number): Board {
  const b: Board = Array.from({ length: ROWS }, () => Array<number>(COLS).fill(0));
  for (let r = 0; r < ROWS; r++) for (let c = 0; c < COLS; c++) b[r]![c] = Math.floor(rand() * COLORS.length);
  return removeInitialMatches(b, rand);
}

function removeInitialMatches(b: Board, rand: () => number): Board {
  let changed = true;
  while (changed) {
    changed = false;
    for (let r = 0; r < ROWS; r++) {
      for (let c = 0; c < COLS; c++) {
        const v = b[r]![c]!;
        if (c >= 2 && b[r]![c - 1] === v && b[r]![c - 2] === v) {
          b[r]![c] = (v + 1 + Math.floor(rand() * (COLORS.length - 1))) % COLORS.length;
          changed = true;
        }
        if (r >= 2 && b[r - 1]![c] === v && b[r - 2]![c] === v) {
          b[r]![c] = (v + 1 + Math.floor(rand() * (COLORS.length - 1))) % COLORS.length;
          changed = true;
        }
      }
    }
  }
  return b;
}

function findMatches(b: Board): boolean[][] {
  const m = Array.from({ length: ROWS }, () => Array<boolean>(COLS).fill(false));
  for (let r = 0; r < ROWS; r++) {
    let run = 1;
    for (let c = 1; c <= COLS; c++) {
      if (c < COLS && b[r]![c] === b[r]![c - 1]) run++;
      else {
        if (run >= 3) for (let k = c - run; k < c; k++) m[r]![k] = true;
        run = 1;
      }
    }
  }
  for (let c = 0; c < COLS; c++) {
    let run = 1;
    for (let r = 1; r <= ROWS; r++) {
      if (r < ROWS && b[r]![c] === b[r - 1]![c]) run++;
      else {
        if (run >= 3) for (let k = r - run; k < r; k++) m[k]![c] = true;
        run = 1;
      }
    }
  }
  return m;
}

function collapse(b: Board, m: boolean[][], rand: () => number): { board: Board; cleared: number } {
  let cleared = 0;
  const next = b.map((row) => row.slice());
  for (let c = 0; c < COLS; c++) {
    const col: number[] = [];
    for (let r = ROWS - 1; r >= 0; r--) {
      if (m[r]![c]) cleared++;
      else col.push(next[r]![c]!);
    }
    while (col.length < ROWS) col.push(Math.floor(rand() * COLORS.length));
    for (let r = 0; r < ROWS; r++) next[ROWS - 1 - r]![c] = col[r]!;
  }
  return { board: next, cleared };
}

const meta = {
  id: 'match-3' as const,
  title: 'Match-3',
  blurb: 'Swap adjacent gems to clear matches.',
  emoji: '💎',
};

function Game() {
  const rngRef = useRef(mulberry32(Date.now() & 0xffffffff));
  const [board, setBoard] = useState<Board>(() => randomBoard(rngRef.current));
  const [sel, setSel] = useState<{ r: number; c: number } | null>(null);
  const [score, setScore] = useState(0);
  const [moves, setMoves] = useState(20);
  const [over, setOver] = useState(false);
  const { high, submit } = useHighScore(meta.id);

  const resolve = useCallback((b: Board): Board => {
    let cur = b;
    let combo = 0;
    while (true) {
      const m = findMatches(cur);
      const cleared = m.some((row) => row.some(Boolean));
      if (!cleared) break;
      const { board: nb, cleared: n } = collapse(cur, m, rngRef.current);
      combo++;
      setScore((s) => s + n * 10 * combo);
      cur = nb;
    }
    return cur;
  }, []);

  const swap = (a: { r: number; c: number }, b: { r: number; c: number }) => {
    if (Math.abs(a.r - b.r) + Math.abs(a.c - b.c) !== 1) return;
    const next = board.map((row) => row.slice());
    [next[a.r]![a.c], next[b.r]![b.c]] = [next[b.r]![b.c]!, next[a.r]![a.c]!];
    const m = findMatches(next);
    if (!m.some((row) => row.some(Boolean))) return;
    setMoves((mv) => mv - 1);
    setBoard(resolve(next));
  };

  useEffect(() => {
    if (moves <= 0 && !over) {
      setOver(true);
      analytics().track('game_over', { id: meta.id, score });
      submit(score);
    }
  }, [moves, over, score, submit]);

  const tap = (r: number, c: number) => {
    if (over) return;
    if (!sel) {
      setSel({ r, c });
      return;
    }
    if (sel.r === r && sel.c === c) {
      setSel(null);
      return;
    }
    swap(sel, { r, c });
    setSel(null);
  };

  const reset = () => {
    rngRef.current = mulberry32(Date.now() & 0xffffffff);
    setBoard(randomBoard(rngRef.current));
    setScore(0);
    setMoves(20);
    setSel(null);
    setOver(false);
    analytics().track('game_restart', { id: meta.id });
  };

  return (
    <View style={{ flex: 1 }}>
      <Hud left={`Score ${score}`} right={`Moves ${moves}   Best ${high}`} />
      <View style={styles.board}>
        {board.map((row, ri) => (
          <View key={ri} style={styles.row}>
            {row.map((v, ci) => {
              const isSel = sel?.r === ri && sel?.c === ci;
              return (
                <Pressable key={ci} style={styles.cellWrap} onPress={() => tap(ri, ci)}>
                  <View style={[styles.cell, { backgroundColor: COLORS[v]! }, isSel && styles.cellSel]} />
                </Pressable>
              );
            })}
          </View>
        ))}
      </View>
      <Button label="New game" variant="ghost" onPress={reset} />
      {over && (
        <View style={styles.overlay}>
          <Text style={styles.overText}>Out of moves</Text>
          <Text style={styles.overSub}>Score {score}</Text>
          <Button label="Play again" onPress={reset} />
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  board: { flex: 1, gap: 4, marginVertical: 8 },
  row: { flex: 1, flexDirection: 'row', gap: 4 },
  cellWrap: { flex: 1 },
  cell: { flex: 1, borderRadius: 8 },
  cellSel: { borderWidth: 3, borderColor: theme.text },
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
