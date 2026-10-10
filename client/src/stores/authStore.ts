import { create } from 'zustand';

export interface User {
  id: string;
  username: string;
  displayName: string | null;
  avatar: string;
  dailyGoal: number;
  streakCount: number;
  longestStreak: number;
  streakFreezes: number;
  lastStudyDate?: string | null;
  xp: number;
  level: number;
  settingsJson?: string | null;
  createdAt?: string;
}

interface AuthState {
  user: User | null;
  token: string | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  error: string | null;

  login: (username: string, password: string, remember?: boolean) => Promise<boolean>;
  register: (username: string, password: string, displayName?: string) => Promise<boolean>;
  logout: () => void;
  checkAuth: () => Promise<void>;
  updateProfile: (data: Partial<User>) => Promise<boolean>;
  setError: (err: string | null) => void;
}

export const useAuthStore = create<AuthState>((set, get) => ({
  user: null,
  token: localStorage.getItem('token') || null,
  isAuthenticated: !!localStorage.getItem('token'),
  isLoading: false,
  error: null,

  setError: (err) => set({ error: err }),

  login: async (username, password, remember = true) => {
    set({ isLoading: true, error: null });
    try {
      const res = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username, password }),
      });

      const data = await res.json();
      if (!res.ok) {
        set({ isLoading: false, error: data.message || 'Đăng nhập không thành công' });
        return false;
      }

      const token = data.tokens.accessToken;
      if (remember) {
        localStorage.setItem('token', token);
        localStorage.setItem('refreshToken', data.tokens.refreshToken);
      } else {
        sessionStorage.setItem('token', token);
      }

      set({
        user: data.user,
        token,
        isAuthenticated: true,
        isLoading: false,
        error: null,
      });

      return true;
    } catch (err: any) {
      set({ isLoading: false, error: 'Không thể kết nối đến máy chủ. Vui lòng kiểm tra mạng.' });
      return false;
    }
  },

  register: async (username, password, displayName) => {
    set({ isLoading: true, error: null });
    try {
      const res = await fetch('/api/auth/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username, password, displayName }),
      });

      const data = await res.json();
      if (!res.ok) {
        set({ isLoading: false, error: data.message || 'Đăng ký không thành công' });
        return false;
      }

      const token = data.tokens.accessToken;
      localStorage.setItem('token', token);
      localStorage.setItem('refreshToken', data.tokens.refreshToken);

      set({
        user: data.user,
        token,
        isAuthenticated: true,
        isLoading: false,
        error: null,
      });

      return true;
    } catch (err: any) {
      set({ isLoading: false, error: 'Không thể kết nối đến máy chủ.' });
      return false;
    }
  },

  logout: () => {
    localStorage.removeItem('token');
    localStorage.removeItem('refreshToken');
    sessionStorage.removeItem('token');
    set({
      user: null,
      token: null,
      isAuthenticated: false,
      error: null,
    });
  },

  checkAuth: async () => {
    const token = localStorage.getItem('token') || sessionStorage.getItem('token');
    if (!token) {
      set({ isAuthenticated: false, user: null });
      return;
    }

    try {
      const res = await fetch('/api/auth/me', {
        headers: { Authorization: `Bearer ${token}` },
      });

      if (res.ok) {
        const data = await res.json();
        set({ user: data.user, isAuthenticated: true, token });
      } else {
        // Token hết hạn
        get().logout();
      }
    } catch {
      // Offline mode: Nếu có user trong cache thì vẫn giữ trạng thái
    }
  },

  updateProfile: async (data) => {
    const token = get().token;
    if (!token) return false;

    try {
      const res = await fetch('/api/auth/profile', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(data),
      });

      const result = await res.json();
      if (res.ok) {
        set({ user: result.user });
        return true;
      }
      return false;
    } catch {
      return false;
    }
  },
}));
