import React, { useCallback, useMemo, useRef, useState } from 'react';
import { StyleSheet, View } from 'react-native';
import { Button, Hud } from '@mgf/ui';
import { feedback, useGameLoop, useHighScore, mulberry32, type GameModule } from '@mgf/game-core';
import { analytics } from '@mgf/analytics';
import { NOADS_ENTITLEMENT, ads, iap } from '@mgf/monetization';
import {
  COLS,
  COLORS,
  SHAPES,
  type Board,
  clearBottomRows,
  clearLines,
  collides,
  makeBoard,
  merge,
  rotate,
} from './logic';
import { CONTINUE_CLEAR_ROWS, GameOverOverlay } from './GameOverOverlay';

export { GameOverOverlay, continueButtonLabel } from './GameOverOverlay';

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
  const [usedContinue, setUsedContinue] = useState(false);
  const [waitingForAd, setWaitingForAd] = useState(false);
  const dropAccRef = useRef(0);
  const dropIntervalRef = useRef(0.6);
  const { high, submit } = useHighScore(meta.id);

  const reset = useCallback(() => {
    setBoard(makeBoard());
    setPiece(newPiece());
    setScore(0);
    setOver(false);
    setRunning(true);
    setUsedContinue(false);
    dropAccRef.current = 0;
    dropIntervalRef.current = 0.6;
    analytics().track('game_restart', { id: meta.id });
  }, [newPiece]);

  const grantContinue = useCallback(() => {
    setBoard((b) => clearBottomRows(b, CONTINUE_CLEAR_ROWS));
    setPiece(newPiece());
    setOver(false);
    setRunning(true);
    setUsedContinue(true);
    dropAccRef.current = 0;
  }, [newPiece]);

  const continueWithAd = useCallback(async () => {
    if (usedContinue || waitingForAd) return;
    if (iap().isEntitled(NOADS_ENTITLEMENT)) {
      analytics().track('continue_entitled', { id: meta.id, score });
      grantContinue();
      return;
    }
    setWaitingForAd(true);
    analytics().track('ad_continue_requested', { id: meta.id, score });
    try {
      const result = await ads().show('rewarded');
      if (!result.rewarded) {
        analytics().track('ad_continue_skipped', { id: meta.id });
        return;
      }
      analytics().track('ad_continue_granted', { id: meta.id, score });
      grantContinue();
    } finally {
      setWaitingForAd(false);
    }
  }, [grantContinue, score, usedContinue, waitingForAd]);

  const lockAndSpawn = useCallback(
    (b: Board, p: typeof piece) => {
      const merged = merge(b, p.shape, p.x, p.y);
      const { board: cleared, cleared: nCleared } = clearLines(merged);
      if (nCleared > 0) {
        setScore((s) => s + [0, 100, 300, 500, 800][nCleared]!);
        dropIntervalRef.current = Math.max(0.12, dropIntervalRef.current - 0.01);
        feedback().haptic('success');
        feedback().sound('success');
      }
      const next = newPiece();
      if (collides(cleared, next.shape, next.x, next.y)) {
        setBoard(cleared);
        setRunning(false);
        setOver(true);
        analytics().track('game_over', { id: meta.id, score });
        feedback().haptic('error');
        feedback().sound('fail');
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

  const move = (dx: number) => {
    feedback().haptic('tap');
    setPiece((p) => (collides(board, p.shape, p.x + dx, p.y) ? p : { ...p, x: p.x + dx }));
  };
  const rotateAct = () => {
    feedback().haptic('select');
    setPiece((p) => {
      const r = rotate(p.shape);
      return collides(board, r, p.x, p.y) ? p : { ...p, shape: r };
    });
  };
  const drop = () => {
    feedback().haptic('tap');
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
        <GameOverOverlay
          score={score}
          usedContinue={usedContinue}
          waitingForAd={waitingForAd}
          entitled={iap().isEntitled(NOADS_ENTITLEMENT)}
          onContinue={continueWithAd}
          onReset={reset}
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  board: { flex: 1, gap: 1, marginVertical: 8 },
  row: { flex: 1, flexDirection: 'row', gap: 1 },
  cell: { flex: 1, borderRadius: 2 },
  controls: { flexDirection: 'row', gap: 8, justifyContent: 'space-around' },
});

const mod: GameModule = { meta, Screen: Game };
export default mod;
