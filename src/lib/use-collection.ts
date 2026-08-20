'use client';

import { useCallback, useSyncExternalStore } from 'react';

/**
 * A tiny client-side collection store.
 *
 * The dashboard reads its data from module-level arrays in `mock-data.ts`,
 * which cannot be appended to — so every "Create" form used to close with a
 * toast and change nothing. This backs those lists with real state instead:
 * seeded from the mock array, mutated by the forms, persisted to localStorage,
 * and shared across every component that reads the same key.
 *
 * Swap this for API calls when a backend exists; the call sites stay the same.
 */

type Listener = () => void;

interface Entry<T> {
  value: T[];
  listeners: Set<Listener>;
  seed: T[];
}

const stores = new Map<string, Entry<unknown>>();

function storageKey(key: string) {
  return `cp.collection.${key}`;
}

function readPersisted<T>(key: string): T[] | null {
  if (typeof window === 'undefined') return null;
  try {
    const raw = window.localStorage.getItem(storageKey(key));
    if (!raw) return null;
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? (parsed as T[]) : null;
  } catch {
    // Corrupt or unavailable storage should never break the page.
    return null;
  }
}

function persist<T>(key: string, value: T[]) {
  if (typeof window === 'undefined') return;
  try {
    window.localStorage.setItem(storageKey(key), JSON.stringify(value));
  } catch {
    // Quota or private-mode failures are non-fatal; state still lives in memory.
  }
}

function getStore<T>(key: string, seed: T[]): Entry<T> {
  let entry = stores.get(key) as Entry<T> | undefined;
  if (!entry) {
    entry = { value: seed, listeners: new Set(), seed };
    stores.set(key, entry as Entry<unknown>);
  }
  return entry;
}

function emit<T>(entry: Entry<T>) {
  entry.listeners.forEach(l => l());
}

/** Replaces the collection and notifies every subscriber. */
function setValue<T>(key: string, entry: Entry<T>, next: T[]) {
  entry.value = next;
  persist(key, next);
  emit(entry);
}

export interface Collection<T> {
  items: T[];
  /** Prepend a record, so new entries are visible without scrolling. */
  add: (item: T) => void;
  update: (id: string, patch: Partial<T>) => void;
  remove: (id: string) => void;
  /** Discard local additions and return to the seeded data. */
  reset: () => void;
}

/**
 * @param key    Stable identifier; components sharing a key share state.
 * @param seed   Server-rendered baseline, normally the mock array.
 * @param idOf   How to read a record's identity. Defaults to `item.id`.
 */
export function useCollection<T>(
  key: string,
  seed: T[],
  idOf: (item: T) => string = (item) => (item as { id: string }).id,
): Collection<T> {
  const entry = getStore(key, seed);

  const subscribe = useCallback((listener: Listener) => {
    const e = getStore(key, seed);
    e.listeners.add(listener);
    return () => { e.listeners.delete(listener); };
  }, [key, seed]);

  const getSnapshot = useCallback(() => {
    const e = getStore(key, seed);
    // First client read adopts anything previously persisted.
    if (e.value === e.seed) {
      const stored = readPersisted<T>(key);
      if (stored) e.value = stored;
    }
    return e.value;
  }, [key, seed]);

  // The server has no localStorage, so it always renders the seed. The client
  // reconciles on hydration.
  const getServerSnapshot = useCallback(() => seed, [seed]);

  const items = useSyncExternalStore(subscribe, getSnapshot, getServerSnapshot);

  const add = useCallback((item: T) => {
    const e = getStore(key, seed);
    setValue(key, e, [item, ...e.value]);
  }, [key, seed]);

  const update = useCallback((id: string, patch: Partial<T>) => {
    const e = getStore(key, seed);
    setValue(key, e, e.value.map(i => (idOf(i) === id ? { ...i, ...patch } : i)));
  }, [key, seed, idOf]);

  const remove = useCallback((id: string) => {
    const e = getStore(key, seed);
    setValue(key, e, e.value.filter(i => idOf(i) !== id));
  }, [key, seed, idOf]);

  const reset = useCallback(() => {
    const e = getStore(key, seed);
    if (typeof window !== 'undefined') {
      try { window.localStorage.removeItem(storageKey(key)); } catch { /* ignore */ }
    }
    setValue(key, e, e.seed);
  }, [key, seed]);

  return { items, add, update, remove, reset };
}

/** Short unique id for records created in the browser. */
export function newId(prefix: string): string {
  return `${prefix}_${Math.random().toString(36).slice(2, 10)}`;
}
