import type { StatusBarAdapter, StatusBarStyle } from '../types';

export class WebStatusBarAdapter implements StatusBarAdapter {
  async applyStyle(_style: StatusBarStyle): Promise<void> {
    // No-op
  }

  async setOverlaysWebView(_overlay: boolean): Promise<void> {
    // No-op
  }
}
