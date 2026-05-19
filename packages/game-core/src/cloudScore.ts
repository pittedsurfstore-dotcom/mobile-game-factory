/**
 * Optional cloud sync layer for high scores. By default the @mgf/game-core
 * `useHighScore` hook persists locally to the KVStore (AsyncStorage in
 * apps/mobile). When `setCloudHighScore(...)` is called at app startup,
 * scores are also mirrored to a remote backend so they survive reinstall
 * and roam across devices.
 *
 * Real implementation lives in apps/mobile/src/cloud-score-supabase.ts.
 */

export type CloudHighScoreSubmission = {
  gameId: string;
  score: number;
};

export interface CloudHighScore {
  /** Fetch the best remote score for a given game, or null when none exists. */
  fetch(gameId: string): Promise<number | null>;
  /** Submit a candidate score. The remote keeps the max. */
  submit(submission: CloudHighScoreSubmission): Promise<void>;
}

const noopCloud: CloudHighScore = {
  async fetch() {
    return null;
  },
  async submit() {},
};

let impl: CloudHighScore = noopCloud;

export function setCloudHighScore(c: CloudHighScore) {
  impl = c;
}

export function cloudHighScore(): CloudHighScore {
  return impl;
}
