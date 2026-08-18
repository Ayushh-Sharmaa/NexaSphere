import React, { createContext, useState, useEffect, useLayoutEffect } from 'react';

type Theme = 'light' | 'dark' | 'system';
type ResolvedTheme = 'light' | 'dark';

/** All 25 design styles supported by NexaSphere */
export type DesignStyle =
  | 'default'
  | 'skeuomorphism'
  | 'flat'
  | 'neumorphism'
  | 'glassmorphism'
  | 'claymorphism'
  | 'aurora'
  | 'material'
  | 'bento'
  | 'minimalism'
  | 'monochromatic'
  | 'color-blocking'
  | 'neo-brutalism'
  | 'maximalism'
  | 'cyberpunk'
  | 'vaporwave'
  | 'pixel-art'
  | 'art-deco'
  | 'card-based'
  | 'typography'
  | 'asymmetric'
  | 'illustrative'
  | 'parallax'
  | 'spatial'
  | 'dark-native'
  | 'vui';

export const DESIGN_STYLES: { value: DesignStyle; label: string; emoji: string }[] = [
  { value: 'default', label: 'Default', emoji: '⚡' },
  { value: 'skeuomorphism', label: 'Skeuomorphism', emoji: '🪵' },
  { value: 'flat', label: 'Flat Design', emoji: '🟥' },
  { value: 'neumorphism', label: 'Neumorphism', emoji: '🫧' },
  { value: 'glassmorphism', label: 'Glassmorphism', emoji: '🔮' },
  { value: 'claymorphism', label: 'Claymorphism', emoji: '🧸' },
  { value: 'aurora', label: 'Aurora UI', emoji: '🌌' },
  { value: 'material', label: 'Material Design', emoji: '📐' },
  { value: 'bento', label: 'Bento Grid', emoji: '🍱' },
  { value: 'minimalism', label: 'Minimalism', emoji: '◻️' },
  { value: 'monochromatic', label: 'Monochromatic', emoji: '🔴' },
  { value: 'color-blocking', label: 'Color Blocking', emoji: '🎨' },
  { value: 'neo-brutalism', label: 'Neo-Brutalism', emoji: '🏗️' },
  { value: 'maximalism', label: 'Maximalism', emoji: '🌈' },
  { value: 'cyberpunk', label: 'Cyberpunk', emoji: '🤖' },
  { value: 'vaporwave', label: 'Vaporwave', emoji: '🌸' },
  { value: 'pixel-art', label: 'Pixel Art', emoji: '👾' },
  { value: 'art-deco', label: 'Art Deco', emoji: '✦' },
  { value: 'card-based', label: 'Card-Based', emoji: '🃏' },
  { value: 'typography', label: 'Typography', emoji: '𝐓' },
  { value: 'asymmetric', label: 'Asymmetric', emoji: '⚖️' },
  { value: 'illustrative', label: 'Illustrative', emoji: '✏️' },
  { value: 'parallax', label: 'Parallax', emoji: '🏔️' },
  { value: 'spatial', label: 'Spatial UI', emoji: '🥽' },
  { value: 'dark-native', label: 'Dark Native', emoji: '🌑' },
  { value: 'vui', label: 'Voice / VUI', emoji: '🎙️' },
];

interface ThemeContextType {
  theme: Theme;
  resolvedTheme: ResolvedTheme;
  isDark: boolean;
  setTheme: (theme: Theme) => void;
  toggleTheme: () => void;
  /** The active design style (data-style attribute on <html>) */
  designStyle: DesignStyle;
  setDesignStyle: (style: DesignStyle) => void;
}

export const ThemeContext = createContext<ThemeContextType | undefined>(undefined);

export const ThemeProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [theme, setThemeState] = useState<Theme>(() => {
    try {
      const stored = (localStorage.getItem('ns-theme') ||
        localStorage.getItem('nexasphere-theme')) as Theme | null;
      return stored || 'system';
    } catch {
      return 'system';
    }
  });

  const [designStyle, setDesignStyleState] = useState<DesignStyle>(() => {
    try {
      const stored = localStorage.getItem('ns-style') as DesignStyle | null;
      // Validate it's a known style to avoid setting garbage
      if (stored && DESIGN_STYLES.some((s) => s.value === stored)) return stored;
    } catch {
      // Storage unavailable
    }
    return 'default';
  });

  const [systemTheme, setSystemTheme] = useState<ResolvedTheme>(() => {
    if (typeof window !== 'undefined') {
      return window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
    }
    return 'dark';
  });

  useEffect(() => {
    if (typeof window === 'undefined') return;
    const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)');
    const handleChange = (e: MediaQueryListEvent) => {
      setSystemTheme(e.matches ? 'dark' : 'light');
    };

    if (mediaQuery.addEventListener) {
      mediaQuery.addEventListener('change', handleChange);
    } else {
      mediaQuery.addListener(handleChange);
    }

    return () => {
      if (mediaQuery.removeEventListener) {
        mediaQuery.removeEventListener('change', handleChange);
      } else {
        mediaQuery.removeListener(handleChange);
      }
    };
  }, []);

  const resolvedTheme: ResolvedTheme = theme === 'system' ? systemTheme : theme;
  const isDark = resolvedTheme === 'dark';

  // Apply data-theme attribute and dark class to <html>
  useLayoutEffect(() => {
    document.documentElement.setAttribute('data-theme', resolvedTheme);
    if (resolvedTheme === 'dark') {
      document.documentElement.classList.add('dark');
      document.documentElement.classList.remove('light');
    } else {
      document.documentElement.classList.add('light');
      document.documentElement.classList.remove('dark');
    }
  }, [resolvedTheme]);

  // Apply data-style attribute to <html>
  useLayoutEffect(() => {
    if (designStyle === 'default') {
      document.documentElement.removeAttribute('data-style');
    } else {
      document.documentElement.setAttribute('data-style', designStyle);
    }
  }, [designStyle]);

  const setTheme = (newTheme: Theme) => {
    setThemeState(newTheme);
    try {
      localStorage.setItem('ns-theme', newTheme);
      localStorage.setItem('nexasphere-theme', newTheme);

      fetch('/api/auth/theme', {
        method: 'POST',
        credentials: 'include',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ theme: newTheme }),
      }).catch((err) => console.error('Failed to sync theme preference:', err));
    } catch {
      // Storage/Network unavailable
    }
  };

  const setDesignStyle = (style: DesignStyle) => {
    setDesignStyleState(style);
    try {
      localStorage.setItem('ns-style', style);
    } catch {
      // Storage unavailable
    }
  };

  const toggleTheme = () => {
    setTheme(resolvedTheme === 'dark' ? 'light' : 'dark');
  };

  return (
    <ThemeContext.Provider
      value={{ theme, resolvedTheme, isDark, setTheme, toggleTheme, designStyle, setDesignStyle }}
    >
      {children}
    </ThemeContext.Provider>
  );
};
