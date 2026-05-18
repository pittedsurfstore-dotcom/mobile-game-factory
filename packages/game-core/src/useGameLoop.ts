import { useEffect, useRef } from 'react';

export type LoopOptions = {
  running: boolean;
  fps?: number;
};

export function useGameLoop(tick: (dt: number) => void, { running, fps = 60 }: LoopOptions) {
  const tickRef = useRef(tick);
  tickRef.current = tick;

  useEffect(() => {
    if (!running) return;
    const interval = 1000 / fps;
    let last = Date.now();
    const id = setInterval(() => {
      const now = Date.now();
      const dt = (now - last) / 1000;
      last = now;
      tickRef.current(dt);
    }, interval);
    return () => clearInterval(id);
  }, [running, fps]);
}
