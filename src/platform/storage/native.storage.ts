import type { StorageAdapter } from '../types';

// Store the module reference, not the Preferences proxy directly.
// Capacitor plugins are Proxy objects — returning them from async functions
// triggers Promise.resolve() thenable check → Preferences.then() → "not implemented".
let _mod: typeof import('@capacitor/preferences') | null = null;

async function ensurePreferences(): Promise<void> {
  if (!_mod) {
    _mod = await import('@capacitor/preferences');
  }
}

export class NativeStorageAdapter implements StorageAdapter {
  async getItem(key: string): Promise<string | null> {
    await ensurePreferences();
    const { value } = await _mod!.Preferences.get({ key });
    return value;
  }

  async setItem(key: string, value: string): Promise<void> {
    await ensurePreferences();
    await _mod!.Preferences.set({ key, value });
  }

  async removeItem(key: string): Promise<void> {
    await ensurePreferences();
    await _mod!.Preferences.remove({ key });
  }
}
