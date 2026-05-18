import { mulberry32 } from '@mgf/game-core';

export const ROWS = 5;
export const COLS = 6;
export const TOTAL = ROWS * COLS;

export const SYMBOLS = ['🀇', '🀈', '🀉', '🀊', '🀋', '🀌', '🀍', '🀎', '🀐', '🀑', '🀒', '🀓', '🀔', '🀕', '🀖'];

export type Tile = { id: number; sym: string; matched: boolean };

/**
 * Builds a shuffled deck of pair-matched tiles. Every distinct symbol used
 * appears exactly twice. The order is deterministic for a given seed
 * (Fisher–Yates over `mulberry32(seed)`).
 */
export function deal(seed: number): Tile[] {
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

/**
 * Score formula used at clear: 1000 floor-clamped, minus 10 per move.
 */
export function scoreForMoves(moves: number): number {
  return Math.max(0, 1000 - moves * 10);
}
