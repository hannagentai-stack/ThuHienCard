import { useEffect, useState } from 'react';
import { Header } from './components/layout/Header';
import { Sidebar } from './components/layout/Sidebar';
import { BottomTabBar } from './components/layout/BottomTabBar';
import { LandingPage } from './pages/LandingPage';
import { DashboardPage } from './pages/DashboardPage';
import { ProfilePage } from './pages/ProfilePage';
import { GuidePage } from './pages/GuidePage';
import { DecksPage } from './pages/DecksPage';
import { StudyPage } from './pages/StudyPage';
import { PracticePage } from './pages/PracticePage';
import { StatsPage } from './pages/StatsPage';
import { AuthModal } from './components/auth/AuthModal';
import { ShortcutsModal } from './components/common/ShortcutsModal';
import { OnboardingTour } from './components/common/OnboardingTour';
import { ServerWakeupBanner } from './components/common/ServerWakeupBanner';
import { PwaInstallBanner } from './components/common/PwaInstallBanner';
import { useAuthStore } from './stores/authStore';
import { useDeckStore } from './stores/deckStore';
import { useThemeStore } from './stores/themeStore';
import { HelpCircle } from 'lucide-react';

export function App() {
  const [activeTab, setActiveTab] = useState<string>('home');
  const [selectedStudyDeckId, setSelectedStudyDeckId] = useState<string | null>(null);
  const [isAuthOpen, setIsAuthOpen] = useState(false);
  const [authMode, setAuthMode] = useState<'login' | 'register'>('login');
  const [isShortcutsOpen, setIsShortcutsOpen] = useState(false);
  const [isTourOpen, setIsTourOpen] = useState(false);

  const { checkAuth, isAuthenticated } = useAuthStore();
  const { decks } = useDeckStore();
  const { initTheme } = useThemeStore();

  useEffect(() => {
    initTheme();
    checkAuth();
  }, [initTheme, checkAuth]);

  // Xử lý nút Back của điện thoại (Android back / iOS swipe back) để đóng modal hoặc thoát ôn tập
  useEffect(() => {
    const handlePopState = () => {
      if (isAuthOpen) {
        setIsAuthOpen(false);
      } else if (isShortcutsOpen) {
        setIsShortcutsOpen(false);
      } else if (isTourOpen) {
        setIsTourOpen(false);
      } else if (activeTab === 'study') {
        setSelectedStudyDeckId(null);
        setActiveTab('decks');
      }
    };

    window.addEventListener('popstate', handlePopState);
    return () => window.removeEventListener('popstate', handlePopState);
  }, [isAuthOpen, isShortcutsOpen, isTourOpen, activeTab]);

  // Phím tắt toàn cục (? mở trợ giúp, Esc đóng modal trên máy tính)
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
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
    window.history.pushState({ modal: 'auth' }, '');
  };

  const handleOpenShortcuts = () => {
    setIsShortcutsOpen(true);
    window.history.pushState({ modal: 'shortcuts' }, '');
  };

  const handleOpenTour = () => {
    setIsTourOpen(true);
    window.history.pushState({ modal: 'tour' }, '');
  };

  const handleStartStudy = (deckId: string | null = null) => {
    setSelectedStudyDeckId(deckId);
    setActiveTab('study');
    window.history.pushState({ view: 'study' }, '');
  };

  return (
    <div className="min-h-[100dvh] flex flex-col bg-candy-cream dark:bg-dark-bg transition-colors duration-300">
      {/* Thông báo đánh thức máy chủ Render & Ngoại tuyến */}
      <ServerWakeupBanner />

      {/* Banner cài đặt ứng dụng PWA trên điện thoại */}
      <PwaInstallBanner />
      
      {/* 1. Header trên cùng (Tự động ẩn trong Study Mode) */}
      <Header
        activeTab={activeTab}
        setActiveTab={setActiveTab}
        onOpenAuth={handleOpenAuth}
        onOpenTour={handleOpenTour}
      />

      {/* 2. Thân trang: Sidebar Desktop + Nội dung chính */}
      <div className="flex-1 flex max-w-7xl w-full mx-auto">
        <Sidebar
          activeTab={activeTab}
          setActiveTab={setActiveTab}
          onOpenShortcuts={handleOpenShortcuts}
        />

        <main className={`flex-1 w-full max-w-5xl mx-auto transition-all ${
          activeTab === 'study'
            ? 'p-0 pb-0'
            : 'px-3 sm:px-6 lg:px-8 py-4 sm:py-6 pb-24 lg:pb-12'
        }`}>
          {activeTab === 'home' && (
            isAuthenticated || decks.length > 0 ? (
              <DashboardPage
                onStartStudy={(deckId) => handleStartStudy(deckId)}
                onGoToDecks={() => setActiveTab('decks')}
                onGoToPractice={() => setActiveTab('practice')}
                onGoToStats={() => setActiveTab('stats')}
                onOpenCreateDeck={() => setActiveTab('decks')}
                onOpenTour={handleOpenTour}
              />
            ) : (
              <LandingPage
                onOpenAuth={handleOpenAuth}
                onGoToDecks={() => setActiveTab('decks')}
                onGoToGuide={() => setActiveTab('guide')}
              />
            )
          )}

          {activeTab === 'profile' && <ProfilePage />}

          {activeTab === 'guide' && <GuidePage onOpenTour={handleOpenTour} />}

          {activeTab === 'decks' && (
            <DecksPage
              onStartStudy={(deckId) => handleStartStudy(deckId)}
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
              onStartSRS={() => handleStartStudy(null)}
              onNavigateToDecks={() => setActiveTab('decks')}
            />
          )}

          {activeTab === 'stats' && <StatsPage />}
        </main>
      </div>

      {/* 3. Nút cố định '?' chỉ hiện trên Desktop Keyboard (ẩn hoàn toàn trên Mobile để giải phóng vùng ngón cái) */}
      <button
        onClick={handleOpenShortcuts}
        aria-label="Mở bảng phím tắt và trợ giúp"
        className="hidden lg:flex fixed bottom-6 right-6 z-30 p-3.5 rounded-full bg-white dark:bg-dark-card hover:bg-kawaii-50 dark:hover:bg-dark-cardHover border-2 border-kawaii-300 dark:border-dark-border shadow-kawaii text-kawaii-600 dark:text-kawaii-400 btn-bounce items-center justify-center"
      >
        <HelpCircle className="w-6 h-6" />
      </button>

      {/* 4. Bottom Tab Bar trên thiết bị di động (Tự ẩn khi đang học thẻ) */}
      <BottomTabBar
        activeTab={activeTab}
        setActiveTab={setActiveTab}
      />

      {/* 5. Modal Đăng nhập / Đăng ký (Hỗ trợ Bottom Sheet di động) */}
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
