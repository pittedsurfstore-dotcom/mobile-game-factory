import { useCallback, useEffect, useState } from 'react';
import { cloudHighScore } from './cloudScore';
import { getStore } from './storage';

/**
 * Local high-score hook. Persists synchronously to the KV store and, when a
 * non-noop CloudHighScore is configured at app startup, also reads the
 * remote best on mount and writes back any candidate score that beats it.
 *
 * Local wins as the source of truth for what's shown immediately — the cloud
 * value catches up in the background and updates the displayed high if it
 * was higher (e.g. user reinstalled and forgot they had a higher score).
 */
export function useHighScore(gameId: string) {
  const key = `hs:${gameId}`;
  const [high, setHigh] = useState(0);

  useEffect(() => {
    let live = true;
    void (async () => {
      const raw = await getStore().get(key);
      if (!live) return;
      const localBest = raw == null ? 0 : Number(raw);
      if (!Number.isNaN(localBest) && localBest > 0) setHigh(localBest);

      // Best-effort cloud read. If the cloud is unconfigured or offline,
      // cloudHighScore() resolves to null and we just keep the local value.
      try {
        const remote = await cloudHighScore().fetch(gameId);
        if (!live || remote == null) return;
        if (remote > localBest) {
          setHigh(remote);
          await getStore().set(key, String(remote));
        }
      } catch {
        // Ignore — local already shown, no UX impact.
      }
    })();
    return () => {
      live = false;
    };
  }, [key, gameId]);

  const submit = useCallback(
    (score: number) => {
      if (score > high) {
        setHigh(score);
        void getStore().set(key, String(score));
        // Fire-and-forget cloud sync; failures are silent so a flaky network
        // never blocks the user from seeing their new local high.
        void cloudHighScore()
          .submit({ gameId, score })
          .catch(() => {});
      }
    },
    [high, key, gameId],
  );

  return { high, submit };
}
