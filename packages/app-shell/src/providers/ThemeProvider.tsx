import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';

// =============================================================================
// Theme Provider — Dark/light with localStorage persistence
// =============================================================================

type ColorScheme = 'dark' | 'light';

interface ThemeContextValue {
  colorScheme: ColorScheme;
  isDark: boolean;
  toggleTheme: () => void;
  setColorScheme: (scheme: ColorScheme) => void;
}

const ThemeContext = createContext<ThemeContextValue | null>(null);

export const ThemeProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [colorScheme, setColorScheme] = useState<ColorScheme>(() => {
    try {
      return (localStorage.getItem('dp-theme') as ColorScheme) || 'dark';
    } catch {
      return 'dark';
    }
  });

  useEffect(() => {
    const root = document.documentElement;
    if (colorScheme === 'dark') {
      root.classList.add('dark');
    } else {
      root.classList.remove('dark');
    }
    root.setAttribute('data-theme', colorScheme);
    try {
      localStorage.setItem('dp-theme', colorScheme);
    } catch {
      // ignore
    }
  }, [colorScheme]);

  const toggleTheme = useCallback(() => {
    setColorScheme((s) => (s === 'dark' ? 'light' : 'dark'));
  }, []);

  return (
    <ThemeContext.Provider
      value={{
        colorScheme,
        isDark: colorScheme === 'dark',
        toggleTheme,
        setColorScheme,
      }}
    >
      {children}
    </ThemeContext.Provider>
  );
};

export const useTheme = (): ThemeContextValue => {
  const ctx = useContext(ThemeContext);
  if (!ctx) throw new Error('useTheme must be used within ThemeProvider');
  return ctx;
};
