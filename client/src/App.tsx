import { useEffect, useState } from 'react';
import { Header } from './components/layout/Header';
import { Sidebar } from './components/layout/Sidebar';
import { BottomTabBar } from './components/layout/BottomTabBar';
import { LandingPage } from './pages/LandingPage';
import { ProfilePage } from './pages/ProfilePage';
import { GuidePage } from './pages/GuidePage';
import { DecksPage } from './pages/DecksPage';
import { StudyPage } from './pages/StudyPage';
import { PracticePage } from './pages/PracticePage';
import { StatsPage } from './pages/StatsPage';
import { AuthModal } from './components/auth/AuthModal';
import { ShortcutsModal } from './components/common/ShortcutsModal';
import { OnboardingTour } from './components/common/OnboardingTour';
import { useAuthStore } from './stores/authStore';
import { useThemeStore } from './stores/themeStore';
import { HelpCircle } from 'lucide-react';

export function App() {
  const [activeTab, setActiveTab] = useState<string>('home');
  const [selectedStudyDeckId, setSelectedStudyDeckId] = useState<string | null>(null);
  const [isAuthOpen, setIsAuthOpen] = useState(false);
  const [authMode, setAuthMode] = useState<'login' | 'register'>('login');
  const [isShortcutsOpen, setIsShortcutsOpen] = useState(false);
  const [isTourOpen, setIsTourOpen] = useState(false);

  const { checkAuth } = useAuthStore();
  const { initTheme } = useThemeStore();

  useEffect(() => {
    initTheme();
    checkAuth();
  }, [initTheme, checkAuth]);

  // Phím tắt toàn cục (? mở trợ giúp, Esc đóng modal)
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Không kích hoạt khi đang gõ vào input hoặc textarea
      if (['INPUT', 'TEXTAREA', 'SELECT'].includes((e.target as HTMLElement).tagName)) {
        return;
      }

      if (e.key === '?' || (e.shiftKey && e.key === '/')) {
        e.preventDefault();
        setIsShortcutsOpen((prev) => !prev);
      } else if (e.key === 'Escape') {
        setIsShortcutsOpen(false);
        setIsAuthOpen(false);
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  const handleOpenAuth = (mode: 'login' | 'register' = 'login') => {
    setAuthMode(mode);
    setIsAuthOpen(true);
  };

  return (
    <div className="min-h-screen flex flex-col bg-candy-cream dark:bg-dark-bg transition-colors duration-300">
      
      {/* 1. Header trên cùng */}
      <Header
        activeTab={activeTab}
        setActiveTab={setActiveTab}
        onOpenAuth={handleOpenAuth}
        onOpenTour={() => setIsTourOpen(true)}
      />

      {/* 2. Thân trang: Sidebar Desktop + Nội dung chính */}
      <div className="flex-1 flex max-w-7xl w-full mx-auto">
        <Sidebar
          activeTab={activeTab}
          setActiveTab={setActiveTab}
          onOpenShortcuts={() => setIsShortcutsOpen(true)}
        />

        <main className="flex-1 px-4 sm:px-6 lg:px-8 py-6 max-w-5xl mx-auto w-full pb-24 lg:pb-12">
          {activeTab === 'home' && (
            <LandingPage
              onOpenAuth={handleOpenAuth}
              onGoToDecks={() => setActiveTab('decks')}
              onGoToGuide={() => setActiveTab('guide')}
            />
          )}

          {activeTab === 'profile' && <ProfilePage />}

          {activeTab === 'guide' && <GuidePage onOpenTour={() => setIsTourOpen(true)} />}

          {activeTab === 'decks' && (
            <DecksPage
              onStartStudy={(deckId) => {
                setSelectedStudyDeckId(deckId);
                setActiveTab('study');
              }}
            />
          )}

          {activeTab === 'study' && (
            <StudyPage
              deckId={selectedStudyDeckId}
              onExit={() => {
                setSelectedStudyDeckId(null);
                setActiveTab('decks');
              }}
            />
          )}

          {activeTab === 'practice' && (
            <PracticePage
              onStartSRS={() => {
                setSelectedStudyDeckId(null);
                setActiveTab('study');
              }}
            />
          )}

          {activeTab === 'stats' && <StatsPage />}
        </main>
      </div>

      {/* 3. Nút cố định '?' ở góc dưới mở bảng phím tắt */}
      <button
        onClick={() => setIsShortcutsOpen(true)}
        aria-label="Mở bảng phím tắt và trợ giúp"
        className="fixed bottom-20 lg:bottom-6 right-6 z-30 p-3.5 rounded-full bg-white dark:bg-dark-card hover:bg-kawaii-50 dark:hover:bg-dark-cardHover border-2 border-kawaii-300 dark:border-dark-border shadow-kawaii text-kawaii-600 dark:text-kawaii-400 btn-bounce flex items-center justify-center"
      >
        <HelpCircle className="w-6 h-6" />
      </button>

      {/* 4. Bottom Tab Bar trên thiết bị di động */}
      <BottomTabBar
        activeTab={activeTab}
        setActiveTab={setActiveTab}
      />

      {/* 5. Modal Đăng nhập / Đăng ký */}
      <AuthModal
        isOpen={isAuthOpen}
        onClose={() => setIsAuthOpen(false)}
        initialMode={authMode}
      />

      {/* 6. Modal Phím tắt trợ giúp */}
      <ShortcutsModal
        isOpen={isShortcutsOpen}
        onClose={() => setIsShortcutsOpen(false)}
      />

      {/* 7. Hướng dẫn Onboarding cho người dùng mới */}
      <OnboardingTour
        forceOpen={isTourOpen}
        onClose={() => setIsTourOpen(false)}
      />

    </div>
  );
}

export default App;
