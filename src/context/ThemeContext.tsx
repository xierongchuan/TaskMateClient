import React, { createContext, useContext, useEffect, useState } from 'react';
import Cookies from 'js-cookie';
import { Capacitor } from '@capacitor/core';
import { StatusBar, Style } from '@capacitor/status-bar';

export type Theme = 'light' | 'dark' | 'system';
export type AccentColor = 'blue' | 'green' | 'purple' | 'orange' | 'teal';

const VALID_ACCENT_COLORS: AccentColor[] = ['blue', 'green', 'purple', 'orange', 'teal'];

interface ThemeContextType {
  theme: Theme;           // Currently applied theme
  pendingTheme: Theme;    // Theme selected but not yet saved
  setTheme: (theme: Theme) => void;  // Set pending theme (for UI preview before save)
  applyTheme: () => void;            // Apply and persist the pending theme
  resetPendingTheme: () => void;     // Reset pending to current
  isDark: boolean;
  hasPendingChanges: boolean;
  // Accent color
  accentColor: AccentColor;
  pendingAccentColor: AccentColor;
  setAccentColor: (color: AccentColor) => void;
  applyAccentColor: () => void;
  resetPendingAccentColor: () => void;
  hasAccentPendingChanges: boolean;
}

const ThemeContext = createContext<ThemeContextType | undefined>(undefined);

export const ThemeProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  // Initialize from cookie or default to 'system'
  const [theme, setThemeState] = useState<Theme>(() => {
    const savedTheme = Cookies.get('theme_preference');
    return (savedTheme as Theme) || 'system';
  });

  // Pending theme for settings page (before save)
  const [pendingTheme, setPendingTheme] = useState<Theme>(theme);

  const [isDark, setIsDark] = useState(false);

  // Initialize accent color from cookie or default to 'blue'
  const [accentColor, setAccentColorState] = useState<AccentColor>(() => {
    const savedAccent = Cookies.get('accent_color');
    return VALID_ACCENT_COLORS.includes(savedAccent as AccentColor)
      ? (savedAccent as AccentColor)
      : 'blue';
  });

  // Pending accent color for settings page (before save)
  const [pendingAccentColor, setPendingAccentColor] = useState<AccentColor>(accentColor);

  // Apply theme to DOM based on APPLIED theme (not pending)
  useEffect(() => {
    const computeIsDark = () => {
      if (theme === 'system') {
        return window.matchMedia('(prefers-color-scheme: dark)').matches;
      }
      return theme === 'dark';
    };

    const shouldBeDark = computeIsDark();
    setIsDark(shouldBeDark);

    const root = window.document.documentElement;
    if (shouldBeDark) {
      root.classList.add('dark');
    } else {
      root.classList.remove('dark');
    }
  }, [theme]);

  // Синхронизация цвета статус-бара с темой (Capacitor)
  useEffect(() => {
    if (!Capacitor.isNativePlatform()) return;
    StatusBar.setOverlaysWebView({ overlay: false });
    StatusBar.setBackgroundColor({ color: isDark ? '#171717' : '#f5f5f5' });
    StatusBar.setStyle({ style: isDark ? Style.Dark : Style.Light });
  }, [isDark]);

  // Apply accent color to DOM
  useEffect(() => {
    const root = window.document.documentElement;
    root.setAttribute('data-accent', accentColor);
  }, [accentColor]);

  // Listen for system changes if system theme is selected
  useEffect(() => {
    if (theme !== 'system') return;

    const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)');
    const handleChange = () => {
      const root = window.document.documentElement;
      if (mediaQuery.matches) {
        root.classList.add('dark');
        setIsDark(true);
      } else {
        root.classList.remove('dark');
        setIsDark(false);
      }
    };

    mediaQuery.addEventListener('change', handleChange);
    return () => mediaQuery.removeEventListener('change', handleChange);
  }, [theme]);

  // Set pending theme (UI-only, no save)
  const setTheme = (newTheme: Theme) => {
    setPendingTheme(newTheme);
  };

  // Apply pending theme and persist to cookie
  const applyTheme = () => {
    setThemeState(pendingTheme);
    Cookies.set('theme_preference', pendingTheme, { expires: 365, path: '/' });
  };

  // Reset pending to current (for cancel)
  const resetPendingTheme = () => {
    setPendingTheme(theme);
  };

  // Set pending accent color (UI-only, no save)
  const setAccentColor = (color: AccentColor) => {
    setPendingAccentColor(color);
  };

  // Apply pending accent color and persist to cookie
  const applyAccentColor = () => {
    setAccentColorState(pendingAccentColor);
    Cookies.set('accent_color', pendingAccentColor, { expires: 365, path: '/' });
  };

  // Reset pending accent color to current (for cancel)
  const resetPendingAccentColor = () => {
    setPendingAccentColor(accentColor);
  };

  const hasPendingChanges = pendingTheme !== theme;
  const hasAccentPendingChanges = pendingAccentColor !== accentColor;

  return (
    <ThemeContext.Provider value={{
      theme,
      pendingTheme,
      setTheme,
      applyTheme,
      resetPendingTheme,
      isDark,
      hasPendingChanges,
      accentColor,
      pendingAccentColor,
      setAccentColor,
      applyAccentColor,
      resetPendingAccentColor,
      hasAccentPendingChanges
    }}>
      {children}
    </ThemeContext.Provider>
  );
};

export const useTheme = () => {
  const context = useContext(ThemeContext);
  if (context === undefined) {
    throw new Error('useTheme must be used within a ThemeProvider');
  }
  return context;
};

// Export for UI components
export const ACCENT_COLOR_OPTIONS: { value: AccentColor; label: string; colorClass: string }[] = [
  { value: 'blue', label: 'Синий', colorClass: 'bg-blue-500' },
  { value: 'green', label: 'Зелёный', colorClass: 'bg-green-500' },
  { value: 'purple', label: 'Фиолетовый', colorClass: 'bg-purple-500' },
  { value: 'orange', label: 'Оранжевый', colorClass: 'bg-orange-500' },
  { value: 'teal', label: 'Бирюзовый', colorClass: 'bg-teal-500' },
];
