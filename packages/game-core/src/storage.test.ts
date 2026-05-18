import { getStore, setStore } from './storage';

describe('default in-memory store', () => {
  it('returns null for missing keys', async () => {
    const store = getStore();
    expect(await store.get('does-not-exist-xyz')).toBeNull();
  });

  it('round-trips values via set/get', async () => {
    const store = getStore();
    await store.set('k', 'v');
    expect(await store.get('k')).toBe('v');
  });

  it('removes keys', async () => {
    const store = getStore();
    await store.set('to-remove', '1');
    await store.remove('to-remove');
    expect(await store.get('to-remove')).toBeNull();
  });
});

describe('setStore', () => {
  it('lets callers swap in a custom implementation', async () => {
    const original = getStore();
    const calls: string[] = [];
    setStore({
      async get(k) {
        calls.push(`get:${k}`);
        return null;
      },
      async set(k) {
        calls.push(`set:${k}`);
      },
      async remove(k) {
        calls.push(`remove:${k}`);
      },
    });
    try {
      await getStore().get('a');
      await getStore().set('b', 'x');
      await getStore().remove('c');
      expect(calls).toEqual(['get:a', 'set:b', 'remove:c']);
    } finally {
      setStore(original);
    }
  });
});
