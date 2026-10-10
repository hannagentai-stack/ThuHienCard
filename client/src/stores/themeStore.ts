import { create } from 'zustand';

interface ThemeState {
  isDark: boolean;
  toggleTheme: () => void;
  initTheme: () => void;
}

const updateThemeMeta = (isDark: boolean) => {
  if (typeof document === 'undefined') return;
  const meta = document.getElementById('theme-color-meta');
  if (meta) {
    meta.setAttribute('content', isDark ? '#14101A' : '#FF5C9E');
  }
};

export const useThemeStore = create<ThemeState>((set, get) => ({
  isDark: false,

  initTheme: () => {
    const savedTheme = localStorage.getItem('theme');
    let isDark = false;

    if (savedTheme) {
      isDark = savedTheme === 'dark';
    } else {
      isDark = window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches;
    }

    if (isDark) {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }

    updateThemeMeta(isDark);
    set({ isDark });
  },

  toggleTheme: () => {
    const nextDark = !get().isDark;
    if (nextDark) {
      document.documentElement.classList.add('dark');
      localStorage.setItem('theme', 'dark');
    } else {
      document.documentElement.classList.remove('dark');
      localStorage.setItem('theme', 'light');
    }

    updateThemeMeta(nextDark);
    set({ isDark: nextDark });
  },
}));
