import type { StorageAdapter } from '../types';
import { isNative } from '../detect';

let _instance: StorageAdapter | null = null;

export async function createPlatformStorage(): Promise<StorageAdapter> {
  if (_instance) return _instance;

  if (isNative()) {
    const { NativeStorageAdapter } = await import('./native.storage');
    _instance = new NativeStorageAdapter();
  } else {
    const { WebStorageAdapter } = await import('./web.storage');
    _instance = new WebStorageAdapter();
  }

  return _instance;
}

export function getPlatformStorage(): StorageAdapter {
  if (_instance) return _instance;

  if (!isNative()) {
    // Inline localStorage adapter for synchronous web access (no static import needed)
    _instance = {
      getItem: (key) => Promise.resolve(localStorage.getItem(key)),
      setItem: (key, value) => { localStorage.setItem(key, value); return Promise.resolve(); },
      removeItem: (key) => { localStorage.removeItem(key); return Promise.resolve(); },
    };
    return _instance;
  }

  throw new Error('Platform storage not initialized. Call createPlatformStorage() first.');
}
