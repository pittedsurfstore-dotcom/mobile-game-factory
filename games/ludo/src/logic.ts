export const TRACK = 30;
export const SHORTCUTS: Record<number, number> = { 4: 12, 9: 20, 15: 5, 22: 11, 25: 28 };

/**
 * Advance a token along the track by `die` cells and apply any shortcut /
 * snake at the landing cell. The result is clamped to TRACK so the token
 * never overshoots the finish line.
 */
export function advance(pos: number, die: number, shortcuts: Record<number, number> = SHORTCUTS): number {
  let np = Math.min(TRACK, pos + die);
  if (shortcuts[np] != null) np = shortcuts[np]!;
  return np;
}

export function hasWon(pos: number): boolean {
  return pos >= TRACK;
}

/**
 * Score for a finished game: starts at 200 and loses 5 per roll, floored at 0.
 */
export function scoreForRolls(rolls: number): number {
  return Math.max(0, 200 - rolls * 5);
}

export function rollDie(rand: () => number): number {
  return Math.floor(rand() * 6) + 1;
}
