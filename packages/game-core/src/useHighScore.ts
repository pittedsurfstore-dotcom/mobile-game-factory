import { useCallback, useEffect, useState } from 'react';
import { getStore } from './storage';

export function useHighScore(gameId: string) {
  const key = `hs:${gameId}`;
  const [high, setHigh] = useState(0);

  useEffect(() => {
    let live = true;
    getStore()
      .get(key)
      .then((raw) => {
        if (!live || raw == null) return;
        const n = Number(raw);
        if (!Number.isNaN(n)) setHigh(n);
      });
    return () => {
      live = false;
    };
  }, [key]);

  const submit = useCallback(
    (score: number) => {
      if (score > high) {
        setHigh(score);
        void getStore().set(key, String(score));
      }
    },
    [high, key],
  );

  return { high, submit };
}
