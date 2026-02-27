import type { PersistStorage, StorageValue } from 'zustand/middleware';
import { createJSONStorage } from 'zustand/middleware';
import { isNative } from '../detect';
import { getPlatformStorage } from './index';

/**
 * Lazy PersistStorage for native: gracefully returns null before
 * createPlatformStorage() is called, delegates to NativeStorageAdapter after.
 */
function createLazyNativeStorage<S>(): PersistStorage<S> {
  return {
    getItem(name: string): Promise<StorageValue<S> | null> {
      let adapter;
      try {
        adapter = getPlatformStorage();
      } catch {
        return Promise.resolve(null);
      }
      return adapter.getItem(name).then((str) => {
        if (str === null) return null;
        return JSON.parse(str) as StorageValue<S>;
      });
    },

    setItem(name: string, value: StorageValue<S>): Promise<void> {
      let adapter;
      try {
        adapter = getPlatformStorage();
      } catch {
        return Promise.resolve();
      }
      return adapter.setItem(name, JSON.stringify(value));
    },

    removeItem(name: string): Promise<void> {
      let adapter;
      try {
        adapter = getPlatformStorage();
      } catch {
        return Promise.resolve();
      }
      return adapter.removeItem(name);
    },
  };
}

export function createZustandStorage<S>() {
  if (!isNative()) {
    return createJSONStorage<S>(() => localStorage);
  }
  return createLazyNativeStorage<S>();
}
