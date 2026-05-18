import React, { useCallback, useEffect, useRef, useState } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { Button, Hud, theme } from '@mgf/ui';
import { mulberry32, useHighScore, type GameModule } from '@mgf/game-core';
import { analytics } from '@mgf/analytics';
import { COLORS, type Board, collapse, findMatches, randomBoard } from './logic';

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
