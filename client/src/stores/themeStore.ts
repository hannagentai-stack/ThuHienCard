import { create } from 'zustand';

interface ThemeState {
  isDark: boolean;
  toggleTheme: () => void;
  initTheme: () => void;
}

export const useThemeStore = create<ThemeState>((set, get) => ({
  isDark: false,

  initTheme: () => {
    // 1. Kiểm tra lựa chọn đã lưu trong localStorage
    const savedTheme = localStorage.getItem('theme');
    let isDark = false;

    if (savedTheme) {
      isDark = savedTheme === 'dark';
    } else {
      // 2. Tự động theo cài đặt hệ điều hành người dùng
      isDark = window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches;
    }

    if (isDark) {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }

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
    set({ isDark: nextDark });
  },
}));
