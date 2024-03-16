import { create } from 'zustand';
import { createJSONStorage, persist } from 'zustand/middleware';

type ThemeType = 'light' | 'dark' | 'system';

interface ThemeStoreType {
  theme: ThemeType;
  setTheme: (theme: ThemeType) => void;
}

export function getSystemColorMode() {
  return window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
}

export const useThemeStore = create<
  ThemeStoreType,
  [['zustand/persist', ThemeStoreType]]
>(
  persist(
    (set, get) => ({
      theme: 'system',
      setTheme(theme) {
        set({ theme });
      },
    }),
    {
      name: 'persist-theme',
      storage: createJSONStorage(() => localStorage),
    },
  ),
);
