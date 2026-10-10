import React from 'react';
import {
  Home,
  Layers,
  Sparkles,
  Gamepad2,
  BarChart3,
  User,
  BookOpen,
  HelpCircle,
} from 'lucide-react';
import { Mascot } from '../common/Mascot';

interface SidebarProps {
  activeTab: string;
  setActiveTab: (tab: string) => void;
  onOpenShortcuts?: () => void;
}

export const Sidebar: React.FC<SidebarProps> = ({
  activeTab,
  setActiveTab,
  onOpenShortcuts,
}) => {
  const menuItems = [
    { id: 'home', label: 'Trang chủ', icon: Home, badge: null },
    { id: 'decks', label: 'Bộ thẻ của tôi', icon: Layers, badge: null },
    { id: 'study', label: 'Ôn tập SRS', icon: Sparkles, badge: 'FSRS' },
    { id: 'practice', label: 'Chế độ luyện tập', icon: Gamepad2, badge: '8 games' },
    { id: 'stats', label: 'Thống kê & Chuỗi', icon: BarChart3, badge: null },
    { id: 'profile', label: 'Cá nhân & Cài đặt', icon: User, badge: null },
    { id: 'guide', label: 'Hướng dẫn sử dụng', icon: BookOpen, badge: null },
  ];

  return (
    <aside className="hidden lg:flex flex-col w-64 min-h-[calc(100vh-4rem)] p-4 border-r border-kawaii-100 dark:border-dark-border bg-white/70 dark:bg-dark-card/60 backdrop-blur-md transition-colors duration-200">
      
      {/* Danh sách các tab điều hướng */}
      <nav className="space-y-1.5 flex-1">
        {menuItems.map((item) => {
          const Icon = item.icon;
          const isActive = activeTab === item.id;

          return (
            <button
              key={item.id}
              onClick={() => setActiveTab(item.id)}
              className={`w-full flex items-center justify-between px-4 py-3 rounded-2xl text-sm font-bold transition-all duration-200 ${
                isActive
                  ? 'bg-gradient-to-r from-kawaii-400 to-kawaii-500 text-white shadow-kawaii transform translate-x-1'
                  : 'text-gray-600 dark:text-dark-textMuted hover:bg-kawaii-50 dark:hover:bg-dark-cardHover hover:text-kawaii-600 dark:hover:text-kawaii-300'
              }`}
            >
              <div className="flex items-center gap-3">
                <Icon className={`w-5 h-5 ${isActive ? 'text-white' : 'text-kawaii-400 dark:text-kawaii-400'}`} />
                <span>{item.label}</span>
              </div>

              {item.badge && (
                <span
                  className={`text-[10px] px-2 py-0.5 rounded-full font-bold ${
                    isActive
                      ? 'bg-white/20 text-white'
                      : 'bg-kawaii-100 dark:bg-dark-bg text-kawaii-600 dark:text-kawaii-400'
                  }`}
                >
                  {item.badge}
                </span>
              )}
            </button>
          );
        })}
      </nav>

      {/* Nút Trợ giúp & Phím tắt nhanh */}
      {onOpenShortcuts && (
        <button
          onClick={onOpenShortcuts}
          className="my-3 w-full py-2 px-3 rounded-xl bg-purple-50 dark:bg-purple-950/30 hover:bg-purple-100 dark:hover:bg-purple-900/40 text-purple-600 dark:text-purple-300 text-xs font-semibold border border-purple-200 dark:border-purple-900/60 transition-colors flex items-center justify-center gap-1.5"
        >
          <HelpCircle className="w-4 h-4" />
          <span>Bảng phím tắt nhanh (?)</span>
        </button>
      )}

      {/* Hộp cổ vũ Kawaii ở góc dưới */}
      <div className="mt-auto p-4 rounded-3xl bg-gradient-to-br from-kawaii-50 to-pink-100 dark:from-dark-bg dark:to-dark-card border border-kawaii-200 dark:border-dark-border text-center relative overflow-hidden">
        <div className="flex justify-center mb-1">
          <Mascot id="bunny_pink" mood="happy" size="sm" animate={true} />
        </div>
        <p className="text-xs font-bold text-gray-800 dark:text-gray-200">
          Chăm chỉ mỗi ngày!
        </p>
        <p className="text-[11px] text-gray-500 dark:text-dark-textMuted mt-0.5">
          10 phút flashcard hôm nay, tự tin ngày mai 🌸
        </p>
      </div>

    </aside>
  );
};
