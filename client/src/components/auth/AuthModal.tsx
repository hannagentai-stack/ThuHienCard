import React, { useState } from 'react';
import { X, Eye, EyeOff, Sparkles, LogIn, UserPlus } from 'lucide-react';
import { useAuthStore } from '../../stores/authStore';
import { Mascot, type MascotMood } from '../common/Mascot';

interface AuthModalProps {
  isOpen: boolean;
  onClose: () => void;
  initialMode?: 'login' | 'register';
}

export const AuthModal: React.FC<AuthModalProps> = ({
  isOpen,
  onClose,
  initialMode = 'login',
}) => {
  const [mode, setMode] = useState<'login' | 'register'>(initialMode);
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [displayName, setDisplayName] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [rememberMe, setRememberMe] = useState(true);
  const [mascotMood, setMascotMood] = useState<MascotMood>('normal');

  const { login, register, isLoading, error, setError } = useAuthStore();

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!username.trim() || !password) {
      setError('Vui lòng nhập đầy đủ tên đăng nhập và mật khẩu nhé!');
      return;
    }

    if (mode === 'register' && password.length < 6) {
      setError('Mật khẩu cần có ít nhất 6 ký tự để bảo mật');
      return;
    }

    let success = false;
    if (mode === 'login') {
      success = await login(username, password, rememberMe);
    } else {
      success = await register(username, password, displayName);
    }

    if (success) {
      setMascotMood('happy');
      setTimeout(() => {
        onClose();
      }, 400);
    } else {
      setMascotMood('shy');
    }
  };

  // Nút 1-click đăng nhập tài khoản Demo mẫu
  const handleQuickDemo = async () => {
    setUsername('demo');
    setPassword('password123');
    setMascotMood('happy');
    const success = await login('demo', 'password123', true);
    if (success) {
      setTimeout(() => {
        onClose();
      }, 300);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-sm animate-fade-in">
      <div className="relative w-full max-w-md bg-white dark:bg-dark-card rounded-3xl shadow-kawaii-lg border-2 border-kawaii-200 dark:border-dark-border p-6 sm:p-8 overflow-hidden">
        
        {/* Nền trang trí hoa anh đào nhạt */}
        <div className="absolute -top-12 -right-12 w-32 h-32 bg-kawaii-100 dark:bg-dark-cardHover rounded-full blur-2xl pointer-events-none" />
        <div className="absolute -bottom-10 -left-10 w-28 h-28 bg-purple-100 dark:bg-dark-cardHover rounded-full blur-2xl pointer-events-none" />

        {/* Nút đóng */}
        <button
          onClick={onClose}
          className="absolute top-4 right-4 p-2 text-gray-400 hover:text-gray-600 dark:hover:text-gray-200 rounded-full hover:bg-kawaii-50 dark:hover:bg-dark-cardHover transition-colors"
          aria-label="Đóng"
        >
          <X className="w-5 h-5" />
        </button>

        {/* Mascot tương tác biểu cảm */}
        <div className="flex flex-col items-center text-center mb-6">
          <div className="p-3 bg-kawaii-50 dark:bg-dark-bg/60 rounded-full mb-2 border border-kawaii-100 dark:border-dark-border">
            <Mascot id="bunny_pink" mood={mascotMood} size="md" />
          </div>
          <h2 className="text-2xl font-bold font-display text-gray-800 dark:text-dark-text">
            {mode === 'login' ? 'Chào mừng bạn trở lại! 🌸' : 'Gia nhập Sakura Flashcard ✨'}
          </h2>
          <p className="text-sm text-gray-500 dark:text-dark-textMuted mt-1">
            {mode === 'login'
              ? 'Đăng nhập để tiếp tục chuỗi ngày học rực rỡ'
              : 'Tạo tài khoản siêu nhanh, không cần email'}
          </p>
        </div>

        {/* Tab chuyển đổi Đăng nhập / Đăng ký */}
        <div className="flex bg-kawaii-100 dark:bg-dark-bg p-1 rounded-2xl mb-6">
          <button
            type="button"
            onClick={() => { setMode('login'); setError(null); }}
            className={`flex-1 py-2 text-sm font-semibold rounded-xl transition-all duration-200 ${
              mode === 'login'
                ? 'bg-white dark:bg-dark-card text-kawaii-600 dark:text-kawaii-400 shadow-sm'
                : 'text-gray-600 dark:text-gray-400 hover:text-kawaii-500'
            }`}
          >
            Đăng nhập
          </button>
          <button
            type="button"
            onClick={() => { setMode('register'); setError(null); }}
            className={`flex-1 py-2 text-sm font-semibold rounded-xl transition-all duration-200 ${
              mode === 'register'
                ? 'bg-white dark:bg-dark-card text-kawaii-600 dark:text-kawaii-400 shadow-sm'
                : 'text-gray-600 dark:text-gray-400 hover:text-kawaii-500'
            }`}
          >
            Đăng ký mới
          </button>
        </div>

        {/* Thông báo lỗi nếu có */}
        {error && (
          <div className="mb-4 p-3 bg-red-50 dark:bg-red-950/40 border border-red-200 dark:border-red-900/60 rounded-xl text-red-600 dark:text-red-300 text-sm flex items-center gap-2">
            <span>⚠️</span>
            <span>{error}</span>
          </div>
        )}

        {/* Form nhập liệu */}
        <form onSubmit={handleSubmit} className="space-y-4">
          {mode === 'register' && (
            <div>
              <label className="block text-xs font-semibold text-gray-700 dark:text-gray-300 mb-1">
                Tên hiển thị (biệt danh)
              </label>
              <input
                type="text"
                value={displayName}
                onChange={(e) => setDisplayName(e.target.value)}
                onFocus={() => setMascotMood('studying')}
                onBlur={() => setMascotMood('normal')}
                placeholder="Ví dụ: Tiểu Thỏ, Bé Mèo..."
                className="w-full px-4 py-2.5 rounded-2xl bg-gray-50 dark:bg-dark-bg border border-kawaii-200 dark:border-dark-border focus:border-kawaii-500 focus:ring-2 focus:ring-kawaii-300/40 text-sm outline-none transition-all dark:text-white"
              />
            </div>
          )}

          <div>
            <label className="block text-xs font-semibold text-gray-700 dark:text-gray-300 mb-1">
              Tên đăng nhập <span className="text-kawaii-500">*</span>
            </label>
            <input
              type="text"
              required
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              onFocus={() => setMascotMood('studying')}
              onBlur={() => setMascotMood('normal')}
              placeholder="Nhập tên đăng nhập (viết liền không dấu)"
              className="w-full px-4 py-2.5 rounded-2xl bg-gray-50 dark:bg-dark-bg border border-kawaii-200 dark:border-dark-border focus:border-kawaii-500 focus:ring-2 focus:ring-kawaii-300/40 text-sm outline-none transition-all dark:text-white"
            />
          </div>

          <div>
            <div className="flex justify-between items-center mb-1">
              <label className="text-xs font-semibold text-gray-700 dark:text-gray-300">
                Mật khẩu <span className="text-kawaii-500">*</span>
              </label>
              {mode === 'register' && (
                <span className="text-[11px] text-gray-400">Tối thiểu 6 ký tự</span>
              )}
            </div>
            <div className="relative">
              <input
                type={showPassword ? 'text' : 'password'}
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                onFocus={() => setMascotMood('winking')}
                onBlur={() => setMascotMood('normal')}
                placeholder="Nhập mật khẩu của bạn"
                className="w-full px-4 py-2.5 pr-11 rounded-2xl bg-gray-50 dark:bg-dark-bg border border-kawaii-200 dark:border-dark-border focus:border-kawaii-500 focus:ring-2 focus:ring-kawaii-300/40 text-sm outline-none transition-all dark:text-white"
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-3.5 top-1/2 -translate-y-1/2 text-gray-400 hover:text-kawaii-500 transition-colors"
                aria-label={showPassword ? 'Ẩn mật khẩu' : 'Hiện mật khẩu'}
              >
                {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              </button>
            </div>
          </div>

          {mode === 'login' && (
            <div className="flex items-center justify-between text-xs pt-1">
              <label className="flex items-center gap-2 cursor-pointer select-none text-gray-600 dark:text-gray-400">
                <input
                  type="checkbox"
                  checked={rememberMe}
                  onChange={(e) => setRememberMe(e.target.checked)}
                  className="rounded border-kawaii-300 text-kawaii-500 focus:ring-kawaii-400"
                />
                <span>Ghi nhớ đăng nhập</span>
              </label>
            </div>
          )}

          {/* Nút Submit */}
          <button
            type="submit"
            disabled={isLoading}
            className="w-full py-3 mt-2 rounded-2xl bg-gradient-to-r from-kawaii-400 to-kawaii-500 hover:from-kawaii-500 hover:to-kawaii-600 text-white font-bold text-sm shadow-kawaii btn-bounce flex items-center justify-center gap-2 disabled:opacity-50"
          >
            {isLoading ? (
              <span className="inline-block w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
            ) : mode === 'login' ? (
              <>
                <LogIn className="w-4 h-4" />
                <span>Đăng nhập ngay</span>
              </>
            ) : (
              <>
                <UserPlus className="w-4 h-4" />
                <span>Tạo tài khoản & Học ngay</span>
              </>
            )}
          </button>
        </form>

        {/* Nút Đăng nhập Demo 1-click */}
        <div className="mt-5 pt-4 border-t border-kawaii-100 dark:border-dark-border text-center">
          <button
            type="button"
            onClick={handleQuickDemo}
            className="w-full py-2.5 px-4 rounded-2xl bg-kawaii-50 dark:bg-dark-bg/80 hover:bg-kawaii-100 dark:hover:bg-dark-cardHover text-kawaii-700 dark:text-kawaii-300 font-semibold text-xs border border-kawaii-200 dark:border-dark-border transition-all flex items-center justify-center gap-1.5"
          >
            <Sparkles className="w-4 h-4 text-kawaii-500" />
            <span>Thử nhanh tài khoản Demo (1-Click)</span>
          </button>
        </div>

      </div>
    </div>
  );
};
