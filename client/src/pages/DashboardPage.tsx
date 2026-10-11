import React, { useEffect, useState } from 'react';
import {
  Sparkles,
  Flame,
  Snowflake,
  Play,
  Layers,
  Plus,
  ArrowRight,
  Trophy,
  Calendar,
  Gamepad2,
  HelpCircle,
} from 'lucide-react';
import { useAuthStore } from '../stores/authStore';
import { useDeckStore } from '../stores/deckStore';
import { Mascot } from '../components/common/Mascot';
import { type Deck } from '../types';

interface DashboardPageProps {
  onStartStudy: (deckId: string | null) => void;
  onGoToDecks: () => void;
  onGoToPractice: () => void;
  onGoToStats: () => void;
  onOpenCreateDeck: () => void;
  onOpenTour?: () => void;
}

export const DashboardPage: React.FC<DashboardPageProps> = ({
  onStartStudy,
  onGoToDecks,
  onGoToPractice,
  onGoToStats,
  onOpenCreateDeck,
  onOpenTour,
}) => {
  const { user, token } = useAuthStore();
  const { decks, fetchDecks } = useDeckStore();

  const [todaySummary, setTodaySummary] = useState<any>(null);

  useEffect(() => {
    fetchDecks();

    if (token) {
      fetch('/api/stats/summary', {
        headers: { Authorization: `Bearer ${token}` },
      })
        .then((res) => (res.ok ? res.json() : null))
        .then((data) => {
          if (data?.stats) setTodaySummary(data.stats);
        })
        .catch(() => {});
    }
  }, [fetchDecks, token]);

  // Tính tổng số thẻ đến hạn ôn & thẻ mới
  const totalDueCards = decks.reduce((sum, d) => sum + (d.stats?.dueCards || 0), 0);
  const totalNewCards = decks.reduce((sum, d) => sum + (d.stats?.newCards || 0), 0);
  const totalCards = decks.reduce((sum, d) => sum + (d.stats?.totalCards || 0), 0);

  // Lời chào theo thời gian trong ngày
  const getGreeting = () => {
    const hour = new Date().getHours();
    if (hour < 12) return 'Chào buổi sáng';
    if (hour < 18) return 'Chào buổi chiều';
    return 'Chào buổi tối';
  };

  const displayName = user?.displayName || user?.username || 'Bạn';
  const streak = todaySummary?.streakCount ?? user?.streakCount ?? 1;
  const streakFreezes = todaySummary?.streakFreezes ?? user?.streakFreezes ?? 0;
  const todayReviews = todaySummary?.todayReviews ?? 0;
  const dailyGoal = todaySummary?.dailyGoal ?? user?.dailyGoal ?? 20;
  const goalProgress = Math.min(Math.round((todayReviews / dailyGoal) * 100), 100);

  return (
    <div className="space-y-5 sm:space-y-6 pb-16">
      
      {/* 1. KHU VỰC HERO GREETING & STREAK (GỌN GÀNG TRÊN MOBILE) */}
      <div className="flex items-center justify-between gap-3 p-4 sm:p-6 rounded-3xl bg-white dark:bg-dark-card border-2 border-kawaii-100 dark:border-dark-border shadow-sm">
        <div className="flex items-center gap-3">
          <div className="shrink-0">
            <Mascot id="bunny_pink" mood="happy" size="sm" />
          </div>
          <div>
            <span className="text-[11px] font-bold text-gray-400 dark:text-dark-textMuted uppercase tracking-wider block">
              {getGreeting()} 🌸
            </span>
            <h1 className="text-lg sm:text-xl font-bold font-display text-gray-900 dark:text-white line-clamp-1">
              {displayName}!
            </h1>
            <p className="text-[11px] text-gray-500 dark:text-dark-textMuted hidden sm:block">
              Hôm nay hãy cùng giữ vững thói quen ghi nhớ từ vựng nhé.
            </p>
          </div>
        </div>

        {/* Nút Streak & Freeze nổi bật góc phải */}
        <button
          type="button"
          onClick={onGoToStats}
          className="flex items-center gap-2 p-2 sm:px-3 sm:py-2 rounded-2xl bg-orange-50 dark:bg-orange-950/40 border border-orange-200 dark:border-orange-900/50 hover:bg-orange-100 transition-all active:scale-95 shrink-0"
        >
          <div className="w-8 h-8 rounded-xl bg-orange-500 text-white flex items-center justify-center shrink-0 shadow-sm">
            <Flame className="w-5 h-5 fill-white animate-pulse" />
          </div>
          <div className="text-left hidden sm:block">
            <span className="text-[10px] text-orange-600 dark:text-orange-400 font-bold block uppercase">
              Chuỗi học
            </span>
            <span className="text-xs font-black text-gray-900 dark:text-white">
              {streak} ngày 🔥
            </span>
          </div>
          <span className="text-xs font-black text-orange-600 sm:hidden">
            {streak}d
          </span>
        </button>
      </div>

      {/* 2. KHU VỰC QUAN TRỌNG NHẤT: CẦN ÔN TẬP HÔM NAY (ABOVE THE FOLD & THUMB ZONE) */}
      <div className="relative overflow-hidden rounded-3xl p-5 sm:p-7 bg-gradient-to-br from-pink-500/15 via-kawaii-500/20 to-purple-500/15 border-2 border-kawaii-300 dark:border-kawaii-500/50 shadow-kawaii">
        <div className="relative z-10 space-y-4">
          
          <div className="flex items-start justify-between gap-3">
            <div>
              <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-white/90 dark:bg-dark-bg/90 text-kawaii-600 dark:text-kawaii-400 text-xs font-bold shadow-sm">
                <Sparkles className="w-3.5 h-3.5 text-kawaii-500" />
                <span>Nhiệm vụ ôn tập hôm nay</span>
              </span>
              <h2 className="text-2xl sm:text-3xl font-display font-extrabold text-gray-900 dark:text-white mt-2 leading-tight">
                {totalDueCards > 0 ? (
                  <>
                    <span className="text-kawaii-600 dark:text-kawaii-400">{totalDueCards}</span> thẻ cần ôn tập 🌸
                  </>
                ) : (
                  <>Đã ôn hết thẻ hôm nay! 🎉</>
                )}
              </h2>
            </div>

            {/* Huy hiệu thẻ mới nếu có */}
            {totalNewCards > 0 && (
              <span className="px-2.5 py-1 rounded-xl bg-blue-100 dark:bg-blue-950/60 text-blue-700 dark:text-blue-300 font-bold text-xs shrink-0">
                +{totalNewCards} thẻ mới
              </span>
            )}
          </div>

          <p className="text-xs text-gray-600 dark:text-gray-300">
            {totalDueCards > 0
              ? 'Thuật toán FSRS đã tính toán điểm rơi trí nhớ hoàn hảo cho bạn. Chạm nút dưới để bắt đầu ngay!'
              : 'Tuyệt đỉnh! Bạn không còn thẻ nào bị trễ hạn. Bạn có thể luyện tập game hoặc nạp thêm thẻ mới.'}
          </p>

          {/* NÚT ÔN TẬP NGAY CỰC TO VỪA NGÓN CÁI (CHIỀU CAO TỐI THIỂU 54PX) */}
          <div className="pt-1">
            {totalDueCards > 0 ? (
              <button
                type="button"
                onClick={() => onStartStudy(null)}
                className="w-full min-h-[54px] px-6 py-3.5 rounded-2xl bg-gradient-to-r from-kawaii-400 via-kawaii-500 to-pink-500 hover:from-kawaii-500 hover:to-pink-600 text-white font-extrabold text-base shadow-kawaii-lg btn-bounce flex items-center justify-center gap-2 active:scale-95"
              >
                <Play className="w-5 h-5 fill-current" />
                <span>ÔN TẬP NGAY ({totalDueCards} THẺ) 🌸</span>
              </button>
            ) : totalCards > 0 ? (
              <div className="flex flex-col sm:flex-row gap-2.5">
                <button
                  type="button"
                  onClick={onGoToPractice}
                  className="flex-1 min-h-[52px] px-5 py-3 rounded-2xl bg-gradient-to-r from-purple-500 to-pink-500 text-white font-bold text-sm shadow-md flex items-center justify-center gap-2 active:scale-95"
                >
                  <Gamepad2 className="w-4 h-4" />
                  <span>8 Chế độ luyện tập</span>
                </button>
                <button
                  type="button"
                  onClick={onGoToDecks}
                  className="flex-1 min-h-[52px] px-5 py-3 rounded-2xl bg-white dark:bg-dark-card border-2 border-kawaii-300 text-kawaii-600 dark:text-kawaii-300 font-bold text-sm shadow-sm flex items-center justify-center gap-2 active:scale-95"
                >
                  <Plus className="w-4 h-4" />
                  <span>Thêm từ vựng mới</span>
                </button>
              </div>
            ) : (
              <button
                type="button"
                onClick={onOpenCreateDeck}
                className="w-full min-h-[52px] px-6 py-3.5 rounded-2xl bg-kawaii-500 hover:bg-kawaii-600 text-white font-extrabold text-sm shadow-kawaii btn-bounce flex items-center justify-center gap-2 active:scale-95"
              >
                <Plus className="w-5 h-5" />
                <span>Tạo bộ thẻ đầu tiên của bạn 🌸</span>
              </button>
            )}
          </div>

        </div>
      </div>

      {/* 3. MỤC TIÊU HỌC TẬP HÀNG NGÀY (DAILY GOALS) */}
      <div className="p-4 sm:p-5 rounded-3xl bg-white dark:bg-dark-card border-2 border-kawaii-100 dark:border-dark-border shadow-sm space-y-2.5">
        <div className="flex items-center justify-between text-xs">
          <span className="font-bold text-gray-700 dark:text-gray-300 flex items-center gap-1.5">
            <Trophy className="w-4 h-4 text-amber-500" />
            <span>Mục tiêu hàng ngày:</span>
          </span>
          <span className="font-extrabold text-kawaii-600 dark:text-kawaii-400">
            {todayReviews} / {dailyGoal} thẻ ({goalProgress}%)
          </span>
        </div>

        {/* Thanh tiến trình */}
        <div className="w-full h-3 rounded-full bg-gray-100 dark:bg-dark-bg overflow-hidden p-0.5 border border-kawaii-200 dark:border-dark-border">
          <div
            className="h-full rounded-full bg-gradient-to-r from-kawaii-400 to-kawaii-500 transition-all duration-500"
            style={{ width: `${goalProgress}%` }}
          />
        </div>

        <div className="flex items-center justify-between text-[11px] text-gray-400">
          <span>
            {goalProgress >= 100
              ? '🎉 Xuất sắc! Bạn đã đạt chỉ tiêu hôm nay.'
              : `Còn ${Math.max(0, dailyGoal - todayReviews)} thẻ nữa để đạt mục tiêu.`}
          </span>
          {streakFreezes > 0 && (
            <span className="text-cyan-600 dark:text-cyan-400 font-semibold flex items-center gap-1">
              <Snowflake className="w-3 h-3" /> {streakFreezes} Freeze
            </span>
          )}
        </div>
      </div>

      {/* 4. DANH SÁCH BỘ THẺ TRUY CẬP NHANH (QUICK ACCESS DECKS - CUỘN NGANG HOẶC RÚT GỌN) */}
      <div className="space-y-3">
        <div className="flex items-center justify-between px-1">
          <h3 className="text-sm sm:text-base font-bold font-display text-gray-900 dark:text-white flex items-center gap-1.5">
            <Layers className="w-4 h-4 text-kawaii-500" />
            <span>Bộ Thẻ Của Bạn ({decks.length})</span>
          </h3>
          <button
            type="button"
            onClick={onGoToDecks}
            className="text-xs font-bold text-kawaii-600 dark:text-kawaii-400 hover:underline flex items-center gap-1"
          >
            <span>Tất cả</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </button>
        </div>

        {decks.length === 0 ? (
          /* Hướng dẫn người dùng mới (Onboarding 3 bước nhẹ nhàng) */
          <div className="p-5 sm:p-7 rounded-3xl bg-pink-50/50 dark:bg-dark-card border-2 border-dashed border-kawaii-300 dark:border-dark-border space-y-4 text-center">
            <div className="w-12 h-12 rounded-2xl bg-kawaii-100 text-kawaii-600 flex items-center justify-center mx-auto text-xl font-bold">
              🌱
            </div>
            <div className="space-y-1">
              <h4 className="font-bold text-base text-gray-900 dark:text-white">
                Khởi đầu dễ dàng trong 3 bước 🌸
              </h4>
              <p className="text-xs text-gray-500 max-w-sm mx-auto">
                Chỉ mất 1 phút để tạo bộ thẻ đầu tiên và bắt đầu phương pháp lặp lại ngắt quãng FSRS.
              </p>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5 text-left text-xs max-w-lg mx-auto">
              <div className="p-3 rounded-2xl bg-white dark:bg-dark-bg border border-kawaii-200 dark:border-dark-border">
                <span className="font-extrabold text-kawaii-600 block mb-0.5">1. Tạo bộ thẻ</span>
                <span className="text-gray-500 text-[11px]">Đặt tên bộ HSK hoặc Oxford</span>
              </div>
              <div className="p-3 rounded-2xl bg-white dark:bg-dark-bg border border-kawaii-200 dark:border-dark-border">
                <span className="font-extrabold text-purple-600 block mb-0.5">2. Thêm từ vựng</span>
                <span className="text-gray-500 text-[11px]">Tự gõ hoặc nạp file Excel 1 chạm</span>
              </div>
              <div className="p-3 rounded-2xl bg-white dark:bg-dark-bg border border-kawaii-200 dark:border-dark-border">
                <span className="font-extrabold text-emerald-600 block mb-0.5">3. Ôn tập SRS</span>
                <span className="text-gray-500 text-[11px]">Lật thẻ và đánh giá độ nhớ</span>
              </div>
            </div>

            <div className="flex flex-wrap items-center justify-center gap-2 pt-1">
              <button
                type="button"
                onClick={onOpenCreateDeck}
                className="px-6 py-3 rounded-2xl bg-kawaii-500 hover:bg-kawaii-600 text-white font-bold text-xs shadow-kawaii btn-bounce"
              >
                + Tạo bộ thẻ mới ngay
              </button>
              {onOpenTour && (
                <button
                  type="button"
                  onClick={onOpenTour}
                  className="px-4 py-3 rounded-2xl bg-white dark:bg-dark-bg border border-kawaii-200 dark:border-dark-border text-gray-700 dark:text-gray-300 font-bold text-xs flex items-center gap-1.5 active:scale-95"
                >
                  <HelpCircle className="w-3.5 h-3.5 text-kawaii-500" />
                  <span>Xem hướng dẫn</span>
                </button>
              )}
            </div>
          </div>
        ) : (
          /* Danh sách bộ thẻ cuộn ngang tiện lợi */
          <div className="flex gap-3 overflow-x-auto pb-2 scrollbar-thin">
            {decks.slice(0, 6).map((deck: Deck) => {
              const stats = deck.stats || { totalCards: 0, dueCards: 0, newCards: 0 };
              return (
                <div
                  key={deck.id}
                  className="w-64 shrink-0 p-4 rounded-3xl bg-white dark:bg-dark-card border-2 border-kawaii-100 dark:border-dark-border hover:border-kawaii-300 shadow-sm flex flex-col justify-between space-y-3"
                >
                  <div className="space-y-1">
                    <div className="flex items-center justify-between">
                      <span className="text-xl">
                        {deck.icon || (deck.language === 'zh' ? '🇨🇳' : '🇬🇧')}
                      </span>
                      <span className="px-2 py-0.5 rounded-full bg-kawaii-50 dark:bg-dark-bg text-kawaii-600 font-bold text-[10px]">
                        {stats.dueCards > 0 ? `${stats.dueCards} cần ôn` : 'Đã xong'}
                      </span>
                    </div>

                    <h4 className="font-bold text-sm text-gray-900 dark:text-white line-clamp-1">
                      {deck.title}
                    </h4>
                    <p className="text-[11px] text-gray-400">
                      {stats.totalCards} thẻ • {deck.language === 'zh' ? 'Tiếng Trung' : 'Tiếng Anh'}
                    </p>
                  </div>

                  <button
                    type="button"
                    onClick={() => onStartStudy(deck.id)}
                    className="w-full py-2.5 rounded-xl bg-kawaii-50 dark:bg-dark-bg hover:bg-kawaii-500 hover:text-white text-kawaii-600 dark:text-kawaii-300 font-bold text-xs transition-colors flex items-center justify-center gap-1 active:scale-95"
                  >
                    <Play className="w-3.5 h-3.5 fill-current" />
                    <span>Học bộ này</span>
                  </button>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* 5. PHÍM TẮT & CÁC CHẾ ĐỘ LUYỆN TẬP NHANH */}
      <div className="grid grid-cols-2 gap-3 pt-1">
        <button
          type="button"
          onClick={onGoToPractice}
          className="p-4 rounded-3xl bg-purple-50/60 dark:bg-purple-950/30 border border-purple-200 dark:border-purple-900/50 hover:bg-purple-100/70 text-left transition-all active:scale-95 flex items-center gap-3"
        >
          <div className="w-10 h-10 rounded-2xl bg-purple-500 text-white flex items-center justify-center shrink-0 shadow-sm">
            <Gamepad2 className="w-5 h-5" />
          </div>
          <div className="min-w-0">
            <span className="text-xs font-bold text-gray-900 dark:text-white block truncate">
              Mini-Games
            </span>
            <span className="text-[10px] text-purple-600 dark:text-purple-300 block truncate">
              Trắc nghiệm, nối từ, gõ chữ
            </span>
          </div>
        </button>

        <button
          type="button"
          onClick={onGoToStats}
          className="p-4 rounded-3xl bg-blue-50/60 dark:bg-blue-950/30 border border-blue-200 dark:border-blue-900/50 hover:bg-blue-100/70 text-left transition-all active:scale-95 flex items-center gap-3"
        >
          <div className="w-10 h-10 rounded-2xl bg-blue-500 text-white flex items-center justify-center shrink-0 shadow-sm">
            <Calendar className="w-5 h-5" />
          </div>
          <div className="min-w-0">
            <span className="text-xs font-bold text-gray-900 dark:text-white block truncate">
              Thống Kê FSRS
            </span>
            <span className="text-[10px] text-blue-600 dark:text-blue-300 block truncate">
              Heatmap & Dự báo ôn tập
            </span>
          </div>
        </button>
      </div>

    </div>
  );
};
