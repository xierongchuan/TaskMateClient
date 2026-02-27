import type { StatusBarAdapter, StatusBarStyle } from '../types';

export class NativeStatusBarAdapter implements StatusBarAdapter {
  async applyStyle(style: StatusBarStyle): Promise<void> {
    const { StatusBar, Style } = await import('@capacitor/status-bar');
    await StatusBar.setBackgroundColor({ color: style.backgroundColor });
    await StatusBar.setStyle({
      style: style.isDark ? Style.Dark : Style.Light,
    });
  }

  async setOverlaysWebView(overlay: boolean): Promise<void> {
    const { StatusBar } = await import('@capacitor/status-bar');
    await StatusBar.setOverlaysWebView({ overlay });
  }
}
