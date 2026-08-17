import { useContext } from 'react';
import { ThemeContext } from '../context/theme/ThemeProvider';
import type { DesignStyle } from '../context/theme/ThemeProvider';

export const useTheme = () => {
  const context = useContext(ThemeContext);
  if (context === undefined) {
    console.warn(
      'useTheme was called outside of a ThemeProvider. Returning a fallback theme context.'
    );
    return {
      theme: 'system' as const,
      resolvedTheme: 'light' as const,
      isDark: false,
      setTheme: (newTheme: string) => {
        console.warn(
          `setTheme("${newTheme}") called outside a ThemeProvider. Theme was not persisted.`
        );
      },
      toggleTheme: () => {
        console.warn('toggleTheme() called outside a ThemeProvider.');
      },
      designStyle: 'default' as DesignStyle,
      setDesignStyle: (style: DesignStyle) => {
        console.warn(`setDesignStyle("${style}") called outside a ThemeProvider.`);
      },
    };
  }
  return context;
};

export type { DesignStyle };
