import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { analytics } from '../utils/analytics';

type Theme = 'dark' | 'light';

interface ThemeStore {
  theme: Theme;
  toggleTheme: () => void;
  setTheme: (theme: Theme) => void;
}

export const useThemeStore = create<ThemeStore>()(
  persist(
    (set) => ({
      theme: 'dark',
      toggleTheme: () => {
        set((state) => {
          const newTheme = state.theme === 'dark' ? 'light' : 'dark';
          analytics.trackThemeChanged(newTheme);
          return { theme: newTheme };
        });
      },
      setTheme: (theme) => {
        analytics.trackThemeChanged(theme);
        set({ theme });
      },
    }),
    {
      name: 'theme-storage',
    }
  )
);