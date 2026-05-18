import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { Button, Hud, theme } from '@mgf/ui';
import { useHighScore, mulberry32, type GameModule } from '@mgf/game-core';
import { analytics } from '@mgf/analytics';

const ROWS = 5;
const COLS = 6;
const TOTAL = ROWS * COLS;
const SYMBOLS = ['🀇', '🀈', '🀉', '🀊', '🀋', '🀌', '🀍', '🀎', '🀐', '🀑', '🀒', '🀓', '🀔', '🀕', '🀖'];

type Tile = { id: number; sym: string; matched: boolean };

function deal(seed: number): Tile[] {
  const pairs = TOTAL / 2;
  const syms: string[] = [];
  for (let i = 0; i < pairs; i++) syms.push(SYMBOLS[i % SYMBOLS.length]!, SYMBOLS[i % SYMBOLS.length]!);
  const rand = mulberry32(seed);
  for (let i = syms.length - 1; i > 0; i--) {
    const j = Math.floor(rand() * (i + 1));
    [syms[i], syms[j]] = [syms[j]!, syms[i]!];
  }
  return syms.map((sym, id) => ({ id, sym, matched: false }));
}

const meta = {
  id: 'mahjong' as const,
  title: 'Mahjong Match',
  blurb: 'Pair identical tiles to clear the board.',
  emoji: '🀄',
};

function Game() {
  const [seed, setSeed] = useState(() => Date.now() & 0xffffffff);
  const [tiles, setTiles] = useState<Tile[]>(() => deal(seed));
  const [first, setFirst] = useState<number | null>(null);
  const [second, setSecond] = useState<number | null>(null);
  const [moves, setMoves] = useState(0);
  const [done, setDone] = useState(false);
  const { high, submit } = useHighScore(meta.id);

  useEffect(() => {
    if (first == null || second == null) return;
    setMoves((m) => m + 1);
    const a = tiles[first]!;
    const b = tiles[second]!;
    if (a.sym === b.sym) {
      const next = tiles.slice();
      next[first] = { ...a, matched: true };
      next[second] = { ...b, matched: true };
      setTiles(next);
      setFirst(null);
      setSecond(null);
      if (next.every((t) => t.matched)) {
        const score = Math.max(0, 1000 - moves * 10);
        analytics().track('game_over', { id: meta.id, moves, score });
        submit(score);
        setDone(true);
      }
    } else {
      const t = setTimeout(() => {
        setFirst(null);
        setSecond(null);
      }, 600);
      return () => clearTimeout(t);
    }
  }, [first, second, tiles, moves, submit]);

  const tap = (i: number) => {
    if (tiles[i]!.matched) return;
    if (first === i) return;
    if (first == null) setFirst(i);
    else if (second == null) setSecond(i);
  };

  const reset = useCallback(() => {
    const s = Date.now() & 0xffffffff;
    setSeed(s);
    setTiles(deal(s));
    setFirst(null);
    setSecond(null);
    setMoves(0);
    setDone(false);
    analytics().track('game_restart', { id: meta.id });
  }, []);

  const grid = useMemo(() => {
    const rows: Tile[][] = [];
    for (let r = 0; r < ROWS; r++) rows.push(tiles.slice(r * COLS, (r + 1) * COLS));
    return rows;
  }, [tiles]);

  return (
    <View style={{ flex: 1 }}>
      <Hud left={`Moves ${moves}`} right={`Best ${high}`} />
      <View style={styles.board}>
        {grid.map((row, ri) => (
          <View key={ri} style={styles.row}>
            {row.map((t, ci) => {
              const i = ri * COLS + ci;
              const revealed = t.matched || first === i || second === i;
              return (
                <Pressable
                  key={t.id}
                  style={[styles.tile, t.matched && styles.matched]}
                  onPress={() => tap(i)}
                  disabled={t.matched}
                >
                  <Text style={styles.sym}>{revealed ? t.sym : '?'}</Text>
                </Pressable>
              );
            })}
          </View>
        ))}
      </View>
      <Button label="New game" variant="ghost" onPress={reset} />
      {done && (
        <View style={styles.overlay}>
          <Text style={styles.overText}>Cleared!</Text>
          <Text style={styles.overSub}>{moves} moves</Text>
          <Button label="Play again" onPress={reset} />
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  board: { flex: 1, gap: 6, marginVertical: 10 },
  row: { flex: 1, flexDirection: 'row', gap: 6 },
  tile: {
    flex: 1,
    backgroundColor: theme.surface,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
  },
  matched: { backgroundColor: '#1d3a23', opacity: 0.55 },
  sym: { fontSize: 28, color: theme.text },
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
  overText: { color: theme.text, fontSize: 30, fontWeight: '800' },
  overSub: { color: theme.mute, fontSize: 16 },
});

const mod: GameModule = { meta, Screen: Game };
export default mod;
