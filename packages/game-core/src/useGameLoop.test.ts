import { renderHook } from '@testing-library/react';
import { useGameLoop } from './useGameLoop';

describe('useGameLoop', () => {
  beforeEach(() => {
    jest.useFakeTimers();
  });
  afterEach(() => {
    jest.useRealTimers();
  });

  it('does not call tick when running=false', () => {
    const tick = jest.fn();
    renderHook(() => useGameLoop(tick, { running: false }));
    jest.advanceTimersByTime(1000);
    expect(tick).not.toHaveBeenCalled();
  });

  it('calls tick on the interval when running=true', () => {
    const tick = jest.fn();
    renderHook(() => useGameLoop(tick, { running: true, fps: 10 }));
    jest.advanceTimersByTime(500);
    // 10fps -> 100ms interval -> 5 ticks within 500ms
    expect(tick.mock.calls.length).toBeGreaterThanOrEqual(4);
    expect(tick.mock.calls.length).toBeLessThanOrEqual(6);
  });

  it('passes a positive dt to tick', () => {
    const tick = jest.fn();
    renderHook(() => useGameLoop(tick, { running: true, fps: 20 }));
    jest.advanceTimersByTime(200);
    for (const call of tick.mock.calls) {
      expect(call[0]).toBeGreaterThan(0);
    }
  });

  it('stops ticking after the hook unmounts', () => {
    const tick = jest.fn();
    const { unmount } = renderHook(() => useGameLoop(tick, { running: true, fps: 10 }));
    jest.advanceTimersByTime(300);
    const before = tick.mock.calls.length;
    unmount();
    jest.advanceTimersByTime(500);
    expect(tick.mock.calls.length).toBe(before);
  });
});
