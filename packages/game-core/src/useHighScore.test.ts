import { act, renderHook, waitFor } from '@testing-library/react';
import { setStore, type KVStore } from './storage';
import { useHighScore } from './useHighScore';

function memoryStore(initial: Record<string, string> = {}): KVStore & { dump: () => Record<string, string> } {
  const map = new Map(Object.entries(initial));
  return {
    async get(k) {
      return map.get(k) ?? null;
    },
    async set(k, v) {
      map.set(k, v);
    },
    async remove(k) {
      map.delete(k);
    },
    dump() {
      return Object.fromEntries(map.entries());
    },
  };
}

describe('useHighScore', () => {
  it('initializes from the store when a value is present', async () => {
    const store = memoryStore({ 'hs:game-x': '42' });
    setStore(store);
    const { result } = renderHook(() => useHighScore('game-x'));
    await waitFor(() => expect(result.current.high).toBe(42));
  });

  it('starts at 0 when no stored value exists', () => {
    setStore(memoryStore());
    const { result } = renderHook(() => useHighScore('game-fresh'));
    expect(result.current.high).toBe(0);
  });

  it('updates and persists when submit is higher than current', async () => {
    const store = memoryStore();
    setStore(store);
    const { result } = renderHook(() => useHighScore('g'));
    act(() => {
      result.current.submit(100);
    });
    await waitFor(() => expect(result.current.high).toBe(100));
    await waitFor(() => expect(store.dump()['hs:g']).toBe('100'));
  });

  it('ignores a submit lower than current', async () => {
    const store = memoryStore({ 'hs:g': '500' });
    setStore(store);
    const { result } = renderHook(() => useHighScore('g'));
    await waitFor(() => expect(result.current.high).toBe(500));
    act(() => {
      result.current.submit(50);
    });
    expect(result.current.high).toBe(500);
    expect(store.dump()['hs:g']).toBe('500');
  });
});
