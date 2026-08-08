import React, { createContext, useState, useEffect, useLayoutEffect } from 'react';

export type Theme = "light" | "dark" | "system";

interface ThemeContextType {
  theme: Theme;
  resolvedTheme: "light" | "dark";
  isDark: boolean;
  setTheme: (theme: Theme) => void;
  toggleTheme: () => void;
}

export const ThemeContext = createContext<ThemeContextType | undefined>(
  undefined
);

export const ThemeProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [theme, setThemeState] = useState<Theme | null>(() => {
    // Priority a: check localStorage
    const stored = localStorage.getItem('nexasphere-theme') as Theme | null;
    return stored || null;
  });

  const [systemTheme, setSystemTheme] = useState<"light" | "dark">(() => {
    if (typeof window !== "undefined") {
      return window.matchMedia("(prefers-color-scheme: dark)").matches
        ? "dark"
        : "light";
    }
    return "dark"; // Fallback for SSR/safety
  });

  // Keep system theme updated in real-time
  useEffect(() => {
    const mediaQuery = window.matchMedia("(prefers-color-scheme: dark)");
    const handleChange = (e: MediaQueryListEvent) => {
      setSystemTheme(e.matches ? "dark" : "light");
    };

    // Modern API
    if (mediaQuery.addEventListener) {
      mediaQuery.addEventListener("change", handleChange);
    } else {
      // Fallback for older browsers
      mediaQuery.addListener(handleChange);
    }

    return () => {
      if (mediaQuery.removeEventListener) {
        mediaQuery.removeEventListener("change", handleChange);
      } else {
        mediaQuery.removeListener(handleChange);
      }
    };
  }, []);

  // Listen for storage changes across tabs to synchronize theme state
  useEffect(() => {
    const syncTheme = (e: StorageEvent) => {
      if (e.key === 'nexasphere-theme') {
        const nextTheme = (e.newValue as Theme) || 'system';
        setThemeState(nextTheme);
      }
    };
    window.addEventListener("storage", syncTheme);
    return () => window.removeEventListener("storage", syncTheme);
  }, []);

  const resolvedTheme = theme === "system" ? systemTheme : theme;
  const isDark = resolvedTheme === "dark";

  useLayoutEffect(() => {
    // Apply the resolved theme to documentElement synchronously before paint
    document.documentElement.setAttribute('data-theme', resolvedTheme);
  }, [resolvedTheme]);

  const setTheme = (newTheme: Theme) => {
    setThemeState(newTheme);
    localStorage.setItem('nexasphere-theme', newTheme);
  };

  const toggleTheme = () => {
    if (theme === "system") {
      // If system is currently dark, toggle to light. If system is light, toggle to dark.
      setTheme(systemTheme === "dark" ? "light" : "dark");
    } else {
      setTheme(theme === "dark" ? "light" : "dark");
    }
  };

  return (
    <ThemeContext.Provider
      value={{ theme, resolvedTheme, isDark, setTheme, toggleTheme }}
    >
      {children}
    </ThemeContext.Provider>
  );
};
