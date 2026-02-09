export type Platform = 'web' | 'native';

export interface StorageAdapter {
  getItem(key: string): Promise<string | null>;
  setItem(key: string, value: string): Promise<void>;
  removeItem(key: string): Promise<void>;
}

export interface StatusBarStyle {
  isDark: boolean;
  backgroundColor: string;
}

export interface StatusBarAdapter {
  applyStyle(style: StatusBarStyle): Promise<void>;
  setOverlaysWebView(overlay: boolean): Promise<void>;
}
