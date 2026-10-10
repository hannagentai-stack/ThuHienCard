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
  const tabs = [
    { id: 'home', label: 'Trang chủ', icon: Home },
    { id: 'decks', label: 'Bộ thẻ', icon: Layers },
    { id: 'study', label: 'Ôn tập', icon: Sparkles, highlight: true },
    { id: 'stats', label: 'Thống kê', icon: BarChart3 },
    { id: 'profile', label: 'Cá nhân', icon: User },
  ];

  return (
    <nav className="lg:hidden fixed bottom-0 left-0 right-0 z-40 bg-white/90 dark:bg-dark-card/90 backdrop-blur-md border-t border-kawaii-200 dark:border-dark-border px-2 py-1 safe-area-pb">
      <div className="flex items-center justify-around h-16 max-w-md mx-auto">
        {tabs.map((tab) => {
          const Icon = tab.icon;
          const isActive = activeTab === tab.id;

          if (tab.highlight) {
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className="relative -top-3 flex flex-col items-center justify-center min-w-[56px] min-h-[56px] rounded-full bg-gradient-to-tr from-kawaii-500 to-kawaii-400 text-white shadow-kawaii active:scale-95 transition-transform"
                aria-label={tab.label}
              >
                <Icon className="w-6 h-6 animate-pulse" />
                <span className="text-[10px] font-bold mt-0.5">{tab.label}</span>
              </button>
            );
          }

          return (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`flex flex-col items-center justify-center min-w-[48px] min-h-[48px] px-3 py-1 rounded-2xl transition-all duration-200 ${
                isActive
                  ? 'text-kawaii-500 dark:text-kawaii-400 font-bold scale-105'
                  : 'text-gray-400 dark:text-dark-textMuted hover:text-gray-600'
              }`}
              aria-label={tab.label}
            >
              <Icon className="w-5 h-5" />
              <span className="text-[11px] mt-1 font-semibold">{tab.label}</span>
            </button>
          );
        })}
      </div>
    </nav>
  );
};
