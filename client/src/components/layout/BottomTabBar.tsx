import React from 'react';
import { Home, Layers, Sparkles, BarChart3, User } from 'lucide-react';

interface BottomTabBarProps {
  activeTab: string;
  setActiveTab: (tab: string) => void;
}

export const BottomTabBar: React.FC<BottomTabBarProps> = ({
  activeTab,
  setActiveTab,
}) => {
  // Tự động ẩn thanh Tab khi đang trong màn hình ôn tập (Study Mode) để dành trọn vùng ngón cái cho 4 nút chấm điểm
  if (activeTab === 'study') {
    return null;
  }

  const tabs = [
    { id: 'home', label: 'Trang chủ', icon: Home },
    { id: 'decks', label: 'Bộ thẻ', icon: Layers },
    { id: 'study', label: 'Ôn tập', icon: Sparkles, highlight: true },
    { id: 'stats', label: 'Thống kê', icon: BarChart3 },
    { id: 'profile', label: 'Tôi', icon: User },
  ];

  return (
    <nav
      style={{ paddingBottom: 'max(env(safe-area-inset-bottom, 0px), 6px)' }}
      className="lg:hidden fixed bottom-0 left-0 right-0 z-40 bg-white/95 dark:bg-dark-card/95 backdrop-blur-lg border-t border-kawaii-200 dark:border-dark-border px-2 pt-1 transition-transform duration-300"
    >
      <div className="flex items-center justify-around h-14 max-w-md mx-auto">
        {tabs.map((tab) => {
          const Icon = tab.icon;
          const isActive = activeTab === tab.id;

          if (tab.highlight) {
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className="relative -top-3.5 flex flex-col items-center justify-center w-14 h-14 rounded-full bg-gradient-to-tr from-kawaii-500 to-kawaii-400 text-white shadow-kawaii active:scale-90 transition-transform focus:outline-none"
                aria-label={tab.label}
              >
                <Icon className="w-6 h-6 animate-pulse" />
                <span className="text-[10px] font-extrabold tracking-tight mt-0.5">{tab.label}</span>
              </button>
            );
          }

          return (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`flex flex-col items-center justify-center min-w-[52px] h-12 px-2 rounded-2xl active:scale-90 transition-all duration-150 focus:outline-none ${
                isActive
                  ? 'text-kawaii-600 dark:text-kawaii-400 font-bold'
                  : 'text-gray-400 dark:text-dark-textMuted hover:text-gray-600'
              }`}
              aria-label={tab.label}
            >
              <div className="relative">
                <Icon className={`w-5 h-5 transition-transform ${isActive ? 'scale-110' : ''}`} />
                {isActive && (
                  <span className="absolute -bottom-1 left-1/2 -translate-x-1/2 w-1.5 h-1.5 rounded-full bg-kawaii-500 dark:bg-kawaii-400" />
                )}
              </div>
              <span className={`text-[11px] mt-0.5 font-semibold ${isActive ? 'font-bold' : ''}`}>
                {tab.label}
              </span>
            </button>
          );
        })}
      </div>
    </nav>
  );
};
