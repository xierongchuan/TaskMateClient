import { Capacitor } from '@capacitor/core';
import type { Platform } from './types';

let _platform: Platform | null = null;

export function getPlatform(): Platform {
  if (_platform === null) {
    _platform = Capacitor.isNativePlatform() ? 'native' : 'web';
  }
  return _platform;
}

export function isNative(): boolean {
  return getPlatform() === 'native';
}

export function isWeb(): boolean {
  return getPlatform() === 'web';
}
