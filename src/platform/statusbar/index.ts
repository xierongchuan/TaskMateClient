import type { StatusBarAdapter } from '../types';
import { isNative } from '../detect';

let _instance: StatusBarAdapter | null = null;

export async function createStatusBarAdapter(): Promise<StatusBarAdapter> {
  if (_instance) return _instance;

  if (isNative()) {
    const { NativeStatusBarAdapter } = await import('./native.statusbar');
    _instance = new NativeStatusBarAdapter();
  } else {
    const { WebStatusBarAdapter } = await import('./web.statusbar');
    _instance = new WebStatusBarAdapter();
  }

  return _instance;
}

export function getStatusBarAdapter(): StatusBarAdapter {
  if (_instance) return _instance;

  if (!isNative()) {
    // Inline no-op adapter for synchronous web access (no static import needed)
    _instance = {
      applyStyle: async () => {},
      setOverlaysWebView: async () => {},
    };
    return _instance;
  }

  throw new Error('StatusBar adapter not initialized. Call createStatusBarAdapter() first.');
}
