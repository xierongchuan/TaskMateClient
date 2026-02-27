import { useState, useEffect } from 'react';
import { getPlatformStorage } from '../platform';

type ViewMode = 'list' | 'grid';

/**
 * Hook for responsive view mode switching with platform storage persistence.
 * Automatically switches to grid mode on mobile/tablet devices.
 *
 * @param defaultMode - Default view mode for desktop
 * @param mobileMode - Mode to use on mobile (default: 'grid')
 * @param breakpoint - Breakpoint in pixels (default: 768 = md)
 * @param storageKey - Optional key to persist the view mode
 */
export function useResponsiveViewMode(
  defaultMode: ViewMode = 'list',
  mobileMode: ViewMode = 'grid',
  breakpoint: number = 768,
  storageKey?: string
) {
  const [viewMode, setViewModeState] = useState<ViewMode>(defaultMode);
  const [isMobile, setIsMobile] = useState(false);

  // Hydrate from platform storage
  useEffect(() => {
    if (!storageKey) return;
    const storage = getPlatformStorage();
    storage.getItem(storageKey).then((savedMode) => {
      if (savedMode === 'cards') {
        setViewModeState('grid'); // Migrate legacy 'cards' to 'grid'
      } else if (savedMode && ['list', 'grid'].includes(savedMode)) {
        setViewModeState(savedMode as ViewMode);
      }
    });
  }, [storageKey]);

  // Wrapper for setViewMode to handle persistence
  const setViewMode = (mode: ViewMode) => {
    setViewModeState(mode);
    if (storageKey) {
      const storage = getPlatformStorage();
      storage.setItem(storageKey, mode);
    }
  };

  useEffect(() => {
    const checkMobile = () => {
      const mobile = window.innerWidth < breakpoint;
      setIsMobile(mobile);

      // Note: We don't auto-switch the state itself anymore to preserve
      // the user's desktop preference in the state/storage.
      // Instead we rely on effectiveViewMode below.
    };

    // Check on mount
    checkMobile();

    // Listen for resize
    window.addEventListener('resize', checkMobile);
    return () => window.removeEventListener('resize', checkMobile);
  }, [breakpoint]);

  // Force mobile mode when on mobile device, otherwise use the selected mode (from state/storage)
  const effectiveViewMode = isMobile ? mobileMode : viewMode;

  return {
    viewMode: effectiveViewMode,
    setViewMode,
    isMobile,
  };
}
