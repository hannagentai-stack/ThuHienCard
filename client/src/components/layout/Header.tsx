import React, { useState, useEffect } from 'react';
import {
  Sun,
  Moon,
  Flame,
  Award,
  User as UserIcon,
  LogOut,
  Sparkles,
  LogIn,
  BookOpen,
  Wifi,
  WifiOff,
  RefreshCw,
  Download,
  HelpCircle,
} from 'lucide-react';
import { useAuthStore } from '../../stores/authStore';
import { useThemeStore } from '../../stores/themeStore';
import { useSyncStore } from '../../services/syncService';
import { Mascot, type MascotId } from '../common/Mascot';

interface HeaderProps {
  onOpenAuth: (mode?: 'login' | 'register') => void;
  activeTab?: string;
  setActiveTab: (tab: string) => void;
  onOpenTour?: () => void;
}

export const Header: React.FC<HeaderProps> = ({
  onOpenAuth,
  setActiveTab,
  onOpenTour,
}) => {
  const { user, isAuthenticated, logout } = useAuthStore();
  const { isDark, toggleTheme } = useThemeStore();
  const { isOnline, isSyncing, pendingCount, syncNow } = useSyncStore();
  const [showUserMenu, setShowUserMenu] = useState(false);
  const [installPrompt, setInstallPrompt] = useState<any>(null);

  useEffect(() => {
    const handler = (e: any) => {
      e.preventDefault();
      setInstallPrompt(e);
    };
    window.addEventListener('beforeinstallprompt', handler);
    return () => window.removeEventListener('beforeinstallprompt', handler);
  }, []);

  const handleInstallClick = async () => {
    if (!installPrompt) return;
    installPrompt.prompt();
    const { outcome } = await installPrompt.userChoice;
    if (outcome === 'accepted') {
      setInstallPrompt(null);
    }
  };

  return (
    <header className="sticky top-0 z-40 w-full glass-card border-b border-kawaii-100 dark:border-dark-border transition-colors duration-200">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
        
        {/* Logo & Tên ứng dụng */}
        <div
          onClick={() => setActiveTab('home')}
          className="flex items-center gap-2.5 cursor-pointer select-none group"
        >
          <div className="group-hover:rotate-12 transition-transform duration-300">
            <Mascot id="bunny_pink" mood="happy" size="sm" animate={false} />
          </div>
          <div>
            <span className="font-display font-extrabold text-xl sm:text-2xl tracking-tight bg-gradient-to-r from-kawaii-500 to-kawaii-600 dark:from-kawaii-400 dark:to-pink-300 bg-clip-text text-transparent">
              Sakura Flashcard
            </span>
            <span className="hidden sm:inline-block ml-1.5 text-[11px] font-semibold px-2 py-0.5 rounded-full bg-kawaii-100 dark:bg-dark-card text-kawaii-600 dark:text-kawaii-400 border border-kawaii-200 dark:border-dark-border">
              SRS 🌸
            </span>
          </div>
        </div>

        {/* Khối Trạng thái Gamification & Điều khiển */}
        <div className="flex items-center gap-2 sm:gap-2.5">
          
          {/* Nút/Huy hiệu Đồng bộ & Mạng */}
          <button
            onClick={() => {
              if (isOnline && !isSyncing) syncNow();
            }}
            disabled={!isOnline || isSyncing}
            title={
              !isOnline
                ? 'Đang ngoại tuyến. Dữ liệu sẽ lưu trên máy và tự động đồng bộ khi có mạng.'
                : isSyncing
                ? 'Đang đồng bộ dữ liệu với máy chủ...'
                : pendingCount > 0
                ? `Có ${pendingCount} thay đổi chưa đồng bộ. Nhấp để đồng bộ ngay!`
                : 'Dữ liệu đã được đồng bộ an toàn.'
            }
            className={`flex items-center gap-1.5 px-2.5 py-1.5 rounded-2xl text-xs font-bold border transition-all ${
              !isOnline
                ? 'bg-amber-50 dark:bg-amber-950/40 border-amber-200 dark:border-amber-900/60 text-amber-600 dark:text-amber-400'
                : isSyncing
                ? 'bg-blue-50 dark:bg-blue-950/40 border-blue-200 dark:border-blue-900/60 text-blue-600 dark:text-blue-400'
                : pendingCount > 0
                ? 'bg-kawaii-50 dark:bg-kawaii-950/40 border-kawaii-300 text-kawaii-600 dark:text-kawaii-300 animate-pulse'
                : 'bg-emerald-50 dark:bg-emerald-950/40 border-emerald-200 dark:border-emerald-900/60 text-emerald-600 dark:text-emerald-400'
            }`}
          >
            {!isOnline ? (
              <>
                <WifiOff className="w-3.5 h-3.5 text-amber-500" />
                <span className="hidden md:inline">Offline</span>
              </>
            ) : isSyncing ? (
              <>
                <RefreshCw className="w-3.5 h-3.5 animate-spin text-blue-500" />
                <span className="hidden md:inline">Đang đồng bộ</span>
              </>
            ) : pendingCount > 0 ? (
              <>
                <RefreshCw className="w-3.5 h-3.5 text-kawaii-500" />
                <span>Chờ ({pendingCount})</span>
              </>
            ) : (
              <>
                <Wifi className="w-3.5 h-3.5 text-emerald-500" />
                <span className="hidden lg:inline">Đã đồng bộ</span>
              </>
            )}
          </button>

          {/* Nút Cài đặt PWA nếu trình duyệt hỗ trợ */}
          {installPrompt && (
            <button
              onClick={handleInstallClick}
              title="Cài đặt Sakura Flashcard lên thiết bị"
              className="hidden sm:flex items-center gap-1.5 px-3 py-1.5 rounded-2xl bg-gradient-to-r from-pink-500 to-kawaii-500 text-white font-bold text-xs shadow-kawaii btn-bounce"
            >
              <Download className="w-3.5 h-3.5" />
              <span>Cài app</span>
            </button>
          )}

          {/* Nút Mở Tour hướng dẫn */}
          {onOpenTour && (
            <button
              onClick={onOpenTour}
              title="Xem hướng dẫn nhanh về ứng dụng"
              className="p-2 sm:p-2.5 rounded-2xl bg-kawaii-50 dark:bg-dark-card hover:bg-kawaii-100 dark:hover:bg-dark-cardHover border border-kawaii-100 dark:border-dark-border text-kawaii-600 dark:text-kawaii-400 transition-all btn-bounce"
              aria-label="Mở hướng dẫn nhanh"
            >
              <HelpCircle className="w-4 h-4 sm:w-5 sm:h-5" />
            </button>
          )}

          {isAuthenticated && user && (
            <>
              {/* Daily Streak Pill */}
              <div
                title={`Chuỗi học: ${user.streakCount} ngày liên tiếp!`}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-pill bg-orange-50 dark:bg-orange-950/40 border border-orange-200 dark:border-orange-900/60 text-orange-600 dark:text-orange-400 font-bold text-xs shadow-sm"
              >
                <Flame className="w-4 h-4 fill-orange-500 text-orange-500 animate-pulse" />
                <span>{user.streakCount}</span>
                <span className="hidden sm:inline">ngày</span>
              </div>

              {/* Level & XP Pill */}
              <div
                title={`Cấp độ ${user.level} (${user.xp} XP)`}
                className="hidden sm:flex items-center gap-1.5 px-3 py-1.5 rounded-pill bg-purple-50 dark:bg-purple-950/40 border border-purple-200 dark:border-purple-900/60 text-purple-600 dark:text-purple-300 font-bold text-xs shadow-sm"
              >
                <Award className="w-4 h-4 text-purple-500" />
                <span>Lv.{user.level}</span>
                <span className="text-[10px] text-purple-400">({user.xp} XP)</span>
              </div>
            </>
          )}

          {/* Nút bật/tắt Dark Mode */}
          <button
            onClick={toggleTheme}
            aria-label={isDark ? 'Chuyển sang Chế độ sáng' : 'Chuyển sang Chế độ tối'}
            className="p-2 sm:p-2.5 rounded-2xl bg-kawaii-50 dark:bg-dark-card hover:bg-kawaii-100 dark:hover:bg-dark-cardHover border border-kawaii-100 dark:border-dark-border text-gray-600 dark:text-gray-300 transition-all btn-bounce"
          >
            {isDark ? (
              <Sun className="w-4 h-4 sm:w-5 sm:h-5 text-amber-400" />
            ) : (
              <Moon className="w-4 h-4 sm:w-5 sm:h-5 text-purple-500" />
            )}
          </button>

          {/* Menu Người dùng hoặc Nút Đăng nhập */}
          {isAuthenticated && user ? (
            <div className="relative">
              <button
                onClick={() => setShowUserMenu(!showUserMenu)}
                className="flex items-center gap-2 p-1.5 pr-2.5 rounded-2xl bg-kawaii-50 dark:bg-dark-card hover:bg-kawaii-100 dark:hover:bg-dark-cardHover border border-kawaii-200 dark:border-dark-border transition-all"
              >
                <div className="w-8 h-8 rounded-full overflow-hidden bg-white dark:bg-dark-bg p-0.5 border border-kawaii-300">
                  <Mascot id={(user.avatar as MascotId) || 'bunny_pink'} size="sm" animate={false} />
                </div>
                <span className="hidden md:inline font-bold text-xs text-gray-700 dark:text-gray-200 max-w-[100px] truncate">
                  {user.displayName || user.username}
                </span>
              </button>

              {/* Dropdown Menu */}
              {showUserMenu && (
                <>
                  <div
                    className="fixed inset-0 z-40"
                    onClick={() => setShowUserMenu(false)}
                  />
                  <div className="absolute right-0 mt-2 w-52 bg-white dark:bg-dark-card rounded-2xl shadow-kawaii-lg border border-kawaii-200 dark:border-dark-border py-2 z-50 animate-fade-in text-sm">
                    <div className="px-4 py-2 border-b border-kawaii-100 dark:border-dark-border">
                      <p className="font-bold text-gray-800 dark:text-gray-200 truncate">
                        {user.displayName || user.username}
                      </p>
                      <p className="text-xs text-gray-400">@{user.username}</p>
                    </div>

                    <button
                      onClick={() => {
                        setActiveTab('profile');
                        setShowUserMenu(false);
                      }}
                      className="w-full px-4 py-2 text-left text-gray-700 dark:text-gray-300 hover:bg-kawaii-50 dark:hover:bg-dark-cardHover flex items-center gap-2 transition-colors"
                    >
                      <UserIcon className="w-4 h-4 text-kawaii-500" />
                      <span>Hồ sơ & Cài đặt</span>
                    </button>

                    <button
                      onClick={() => {
                        setActiveTab('guide');
                        setShowUserMenu(false);
                      }}
                      className="w-full px-4 py-2 text-left text-gray-700 dark:text-gray-300 hover:bg-kawaii-50 dark:hover:bg-dark-cardHover flex items-center gap-2 transition-colors"
                    >
                      <BookOpen className="w-4 h-4 text-purple-500" />
                      <span>Hướng dẫn sử dụng</span>
                    </button>

                    <div className="my-1 border-t border-kawaii-100 dark:border-dark-border" />

                    <button
                      onClick={() => {
                        logout();
                        setShowUserMenu(false);
                      }}
                      className="w-full px-4 py-2 text-left text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-950/30 flex items-center gap-2 transition-colors"
                    >
                      <LogOut className="w-4 h-4" />
                      <span>Đăng xuất</span>
                    </button>
                  </div>
                </>
              )}
            </div>
          ) : (
            <div className="flex items-center gap-2">
              <button
                onClick={() => onOpenAuth('login')}
                className="px-3.5 py-1.5 rounded-2xl text-xs font-bold text-kawaii-600 dark:text-kawaii-400 hover:bg-kawaii-50 dark:hover:bg-dark-card transition-colors flex items-center gap-1.5"
              >
                <LogIn className="w-3.5 h-3.5" />
                <span>Đăng nhập</span>
              </button>
              <button
                onClick={() => onOpenAuth('register')}
                className="px-3.5 py-1.5 rounded-2xl text-xs font-bold bg-gradient-to-r from-kawaii-400 to-kawaii-500 text-white shadow-kawaii btn-bounce flex items-center gap-1"
              >
                <Sparkles className="w-3.5 h-3.5" />
                <span>Đăng ký</span>
              </button>
            </div>
          )}

        </div>

      </div>
    </header>
  );
};
