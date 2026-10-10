import React, { useEffect, useState, useRef } from 'react';
import confetti from 'canvas-confetti';
import {
  Sparkles,
  Volume2,
  Undo2,
  Pause,
  Edit,
  RotateCw,
  ArrowLeft,
  CheckCircle2,
} from 'lucide-react';
import { useStudyStore } from '../stores/studyStore';
import { useDeckStore } from '../stores/deckStore';
import { Mascot } from '../components/common/Mascot';
import { ttsService } from '../services/ttsService';
import { RichCardEditor } from '../components/editor/RichCardEditor';

interface StudyPageProps {
  deckId?: string | null;
  onExit: () => void;
}

export const StudyPage: React.FC<StudyPageProps> = ({ deckId, onExit }) => {
  const {
    cards,
    currentIndex,
    isFlipped,
    isLoading,
    isCompleted,
    xpEarned,
    reviewedCount,
    fetchStudyCards,
    flipCard,
    reviewCard,
    undoReview,
    suspendCard,
    resetSession,
  } = useStudyStore();

  const { decks, updateCard } = useDeckStore();

  const [autoSpeech, setAutoSpeech] = useState(true);
  const [isEditingCurrentCard, setIsEditingCurrentCard] = useState(false);
  const [startTime, setStartTime] = useState<number>(Date.now());
  const hasTriggeredConfetti = useRef(false);

  const currentCard = cards[currentIndex];
  const totalCards = cards.length;
  const currentDeck = decks.find((d) => d.id === (deckId || currentCard?.deckId));
  const deckLanguage = currentDeck?.language || (currentCard?.level?.startsWith('HSK') ? 'zh' : 'en');

  // Khởi tạo phiên học
  useEffect(() => {
    fetchStudyCards(deckId || undefined);
    hasTriggeredConfetti.current = false;
    return () => {
      resetSession();
    };
  }, [deckId, fetchStudyCards, resetSession]);

  // Đặt lại thời gian bắt đầu khi chuyển thẻ mới & tự động phát âm nếu bật
  useEffect(() => {
    setStartTime(Date.now());
    if (currentCard && autoSpeech && !isFlipped) {
      ttsService.speak(currentCard.front, deckLanguage, currentCard.audioUrl);
    }
  }, [currentIndex, currentCard, autoSpeech, deckLanguage, isFlipped]);

  // Nổ confetti khi hoàn thành phiên học
  useEffect(() => {
    if (isCompleted && totalCards > 0 && !hasTriggeredConfetti.current) {
      hasTriggeredConfetti.current = true;
      confetti({
        particleCount: 100,
        spread: 70,
        origin: { y: 0.6 },
        colors: ['#FF5C9E', '#FF8FB8', '#C084FC', '#FBBF24', '#34D399'],
      });
    }
  }, [isCompleted, totalCards]);

  // Lắng nghe phím tắt toàn cục trong phiên học
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (['INPUT', 'TEXTAREA', 'SELECT'].includes((e.target as HTMLElement).tagName)) {
        return;
      }

      if (e.code === 'Space' || e.code === 'Enter') {
        e.preventDefault();
        flipCard();
      } else if (isFlipped) {
        const reviewTime = Date.now() - startTime;
        if (e.key === '1') {
          e.preventDefault();
          reviewCard(1, reviewTime);
        } else if (e.key === '2') {
          e.preventDefault();
          reviewCard(2, reviewTime);
        } else if (e.key === '3') {
          e.preventDefault();
          reviewCard(3, reviewTime);
        } else if (e.key === '4') {
          e.preventDefault();
          reviewCard(4, reviewTime);
        }
      }

      // Phím tắt phụ
      if (e.key.toLowerCase() === 'r' || e.key.toLowerCase() === 'p') {
        e.preventDefault();
        if (currentCard) {
          ttsService.speak(currentCard.front, deckLanguage, currentCard.audioUrl);
        }
      } else if (e.key.toLowerCase() === 'z') {
        e.preventDefault();
        undoReview();
      } else if (e.key.toLowerCase() === 's') {
        e.preventDefault();
        suspendCard();
      } else if (e.key.toLowerCase() === 'e') {
        e.preventDefault();
        setIsEditingCurrentCard(true);
      } else if (e.key === 'Escape') {
        onExit();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isFlipped, currentCard, startTime, deckLanguage, flipCard, reviewCard, undoReview, suspendCard, onExit]);

  // Xử lý bấm đánh giá
  const handleRate = (rating: 1 | 2 | 3 | 4) => {
    const reviewTime = Date.now() - startTime;
    reviewCard(rating, reviewTime);
  };

  // 1. MÀN HÌNH ĐANG TẢI
  if (isLoading) {
    return (
      <div className="py-24 text-center space-y-3">
        <Mascot id="bunny_pink" mood="studying" size="lg" />
        <h3 className="text-base font-bold text-gray-700 dark:text-gray-300">
          Đang chuẩn bị thẻ học thông minh FSRS...
        </h3>
      </div>
    );
  }

  // 2. MÀN HÌNH HOÀN THÀNH PHIÊN HỌC (CONFETTI & GAMIFICATION)
  if (isCompleted || !currentCard) {
    return (
      <div className="max-w-lg mx-auto py-12 px-6 text-center space-y-6 bg-white dark:bg-dark-card rounded-3xl border-2 border-kawaii-200 dark:border-dark-border shadow-kawaii animate-fade-in">
        <div className="flex justify-center">
          <Mascot id="bunny_pink" mood="happy" size="xl" />
        </div>

        <div className="space-y-1">
          <span className="text-xs font-bold text-kawaii-600 dark:text-kawaii-400 uppercase tracking-widest">
            Xuất sắc tuyệt vời!
          </span>
          <h2 className="text-2xl sm:text-3xl font-extrabold font-display text-gray-900 dark:text-white">
            Bạn Đã Hoàn Thành Bài Học! 🌸
          </h2>
          <p className="text-xs sm:text-sm text-gray-500 dark:text-dark-textMuted">
            Tất cả các thẻ đến hạn đã được ôn tập và ghi vào trí nhớ dài hạn.
          </p>
        </div>

        {/* Thống kê phiên học */}
        <div className="grid grid-cols-2 gap-3 p-4 rounded-2xl bg-kawaii-50/60 dark:bg-dark-bg/60 border border-kawaii-100 dark:border-dark-border">
          <div className="space-y-0.5">
            <span className="text-xs text-gray-500 font-semibold">Đã ôn tập</span>
            <p className="text-2xl font-black text-kawaii-600 dark:text-kawaii-400">
              {reviewedCount} thẻ
            </p>
          </div>
          <div className="space-y-0.5">
            <span className="text-xs text-gray-500 font-semibold flex items-center justify-center gap-1">
              <Sparkles className="w-3.5 h-3.5 text-purple-500" /> Điểm XP
            </span>
            <p className="text-2xl font-black text-purple-600 dark:text-purple-400">
              +{xpEarned} XP
            </p>
          </div>
        </div>

        {/* Nút hành động */}
        <div className="flex flex-col sm:flex-row gap-3 pt-2">
          <button
            onClick={() => fetchStudyCards(deckId || undefined, 'cram')}
            className="flex-1 py-3 rounded-2xl bg-white dark:bg-dark-card hover:bg-kawaii-50 text-gray-700 dark:text-gray-200 font-bold text-xs border border-kawaii-200 dark:border-dark-border transition-all"
          >
            Ôn tập cấp tốc (Cram)
          </button>
          <button
            onClick={onExit}
            className="flex-1 py-3 rounded-2xl bg-gradient-to-r from-kawaii-400 to-kawaii-500 text-white font-bold text-xs shadow-kawaii btn-bounce"
          >
            Quay lại Bộ thẻ
          </button>
        </div>
      </div>
    );
  }

  // 3. MÀN HÌNH HỌC FLASHCARD SRS CHÍNH
  const nextIntervals = currentCard.nextIntervals || {
    1: { text: '<10p' },
    2: { text: '1 ngày' },
    3: { text: '3 ngày' },
    4: { text: '7 ngày' },
  };

  const progressPercent = Math.min(100, Math.round(((currentIndex) / totalCards) * 100));

  return (
    <div className="max-w-2xl mx-auto space-y-5 pb-16">
      
      {/* Thanh công cụ trên cùng: Nút thoát + Tiến độ + XP + Cài đặt âm thanh */}
      <div className="flex items-center justify-between gap-3">
        <button
          onClick={onExit}
          className="p-2 rounded-2xl bg-white dark:bg-dark-card hover:bg-gray-50 text-gray-600 dark:text-gray-300 border border-kawaii-100 dark:border-dark-border shadow-sm flex items-center gap-1 text-xs font-bold"
        >
          <ArrowLeft className="w-4 h-4" />
          <span className="hidden sm:inline">Thoát</span>
        </button>

        {/* Thanh tiến trình phần trăm */}
        <div className="flex-1 max-w-xs">
          <div className="flex justify-between text-[11px] font-bold text-gray-500 mb-1">
            <span>Thẻ {currentIndex + 1} / {totalCards}</span>
            <span>{progressPercent}%</span>
          </div>
          <div className="w-full bg-kawaii-100 dark:bg-dark-bg h-2 rounded-full overflow-hidden">
            <div
              className="bg-gradient-to-r from-kawaii-400 to-kawaii-500 h-full rounded-full transition-all duration-300"
              style={{ width: `${progressPercent}%` }}
            />
          </div>
        </div>

        {/* XP & Bật/Tắt tự động đọc */}
        <div className="flex items-center gap-2">
          <div className="px-2.5 py-1 rounded-xl bg-purple-50 dark:bg-purple-950/40 text-purple-600 font-bold text-xs border border-purple-200 dark:border-purple-900/60 flex items-center gap-1">
            <Sparkles className="w-3.5 h-3.5 text-purple-500" />
            <span>+{xpEarned} XP</span>
          </div>

          <button
            onClick={() => setAutoSpeech(!autoSpeech)}
            title={autoSpeech ? 'Tự động phát âm: Đang BẬT' : 'Tự động phát âm: Đang TẮT'}
            className={`p-2 rounded-2xl border text-xs font-bold transition-colors ${
              autoSpeech
                ? 'bg-kawaii-50 text-kawaii-600 border-kawaii-200'
                : 'bg-white dark:bg-dark-card text-gray-400 border-gray-200'
            }`}
          >
            <Volume2 className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* THẺ 3D FLASHCARD CHÍNH */}
      <div
        onClick={flipCard}
        className="w-full h-80 sm:h-96 cursor-pointer perspective-1000 select-none group"
      >
        <div
          className={`relative w-full h-full duration-500 transform-style-3d transition-transform ${
            isFlipped ? 'rotate-y-180' : ''
          }`}
        >
          
          {/* MẶT TRƯỚC (FRONT) */}
          <div className="absolute inset-0 backface-hidden bg-white dark:bg-dark-card rounded-3xl p-6 sm:p-8 border-2 border-kawaii-200 dark:border-dark-border shadow-kawaii flex flex-col justify-between items-center text-center">
            
            {/* Hàng thông tin cấp độ */}
            <div className="w-full flex justify-between items-center text-xs">
              <span className="px-2.5 py-0.5 rounded-full bg-kawaii-50 dark:bg-dark-bg text-kawaii-600 dark:text-kawaii-400 font-bold">
                {currentCard.level || (deckLanguage === 'zh' ? 'HSK' : 'Oxford')}
              </span>
              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  ttsService.speak(currentCard.front, deckLanguage, currentCard.audioUrl);
                }}
                className="p-1.5 rounded-xl bg-kawaii-50 hover:bg-kawaii-100 text-kawaii-600 transition-colors flex items-center gap-1 font-semibold text-xs"
              >
                <Volume2 className="w-4 h-4" />
                <span className="hidden sm:inline">Phát âm (R)</span>
              </button>
            </div>

            {/* Nội dung chính mặt trước */}
            <div className="space-y-3 max-w-md">
              <h2 className="text-4xl sm:text-6xl font-black text-gray-900 dark:text-white font-hanzi tracking-tight">
                {currentCard.cardType === 'cloze'
                  ? currentCard.front.replace(/\{\{c\d+::(.*?)\}\}/g, '[ ... ]')
                  : currentCard.front}
              </h2>

              {currentCard.phonetic && (
                <p className="text-base sm:text-lg font-bold text-kawaii-600 dark:text-kawaii-400 font-mono">
                  {currentCard.phonetic}
                </p>
              )}
            </div>

            {/* Gợi ý chạm lật */}
            <div className="text-xs text-gray-400 flex items-center gap-1.5 font-medium">
              <RotateCw className="w-3.5 h-3.5 text-kawaii-400" />
              <span>Chạm hoặc bấm <kbd className="px-1.5 py-0.5 rounded bg-gray-100 dark:bg-dark-bg text-[10px] font-mono">Space</kbd> để lật thẻ</span>
            </div>

          </div>

          {/* MẶT SAU (BACK) */}
          <div className="absolute inset-0 backface-hidden rotate-y-180 bg-gradient-to-br from-pink-50/70 via-white to-purple-50/60 dark:from-dark-card dark:via-dark-bg dark:to-dark-card rounded-3xl p-6 sm:p-8 border-2 border-kawaii-400 dark:border-kawaii-500 shadow-kawaii-lg flex flex-col justify-between items-center text-center overflow-y-auto">
            
            {/* Hàng thông tin loại từ */}
            <div className="w-full flex justify-between items-center text-xs">
              <span className="px-2.5 py-0.5 rounded-full bg-kawaii-100 dark:bg-dark-card text-kawaii-600 font-bold">
                {currentCard.wordType || 'Nghĩa tiếng Việt'}
              </span>
              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  ttsService.speak(currentCard.front, deckLanguage, currentCard.audioUrl);
                }}
                className="p-1.5 rounded-xl bg-kawaii-100 hover:bg-kawaii-200 text-kawaii-600 transition-colors flex items-center gap-1 font-semibold text-xs"
              >
                <Volume2 className="w-4 h-4" />
                <span className="hidden sm:inline">(R)</span>
              </button>
            </div>

            {/* Nội dung chính mặt sau */}
            <div className="space-y-3 max-w-lg my-auto py-2">
              <h3 className="text-2xl sm:text-3xl font-extrabold text-gray-900 dark:text-white font-display">
                {currentCard.back}
              </h3>

              {currentCard.example && (
                <div className="p-2.5 rounded-2xl bg-white/80 dark:bg-dark-bg/80 border border-kawaii-100 dark:border-dark-border space-y-1">
                  <p className="text-xs sm:text-sm font-semibold text-gray-800 dark:text-gray-200">
                    "{currentCard.example}"
                  </p>
                  {currentCard.exampleTrans && (
                    <p className="text-xs text-gray-500 italic">
                      {currentCard.exampleTrans}
                    </p>
                  )}
                </div>
              )}

              {currentCard.notes && (
                <p className="text-xs text-purple-600 dark:text-purple-400 font-medium">
                  💡 {currentCard.notes}
                </p>
              )}
            </div>

            {/* Trạng thái FSRS */}
            <div className="text-[11px] text-gray-400 flex items-center gap-1">
              <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500" />
              <span>FSRS v4 • Chọn mức nhớ bên dưới:</span>
            </div>

          </div>

        </div>
      </div>

      {/* 4 NÚT ĐÁNH GIÁ SRS FSRS v4 (HIỆN KHI ĐÃ LẬT THẺ) */}
      {isFlipped ? (
        <div className="grid grid-cols-4 gap-2 sm:gap-3 animate-fade-in">
          
          {/* Nút 1: Lại (Again) */}
          <button
            onClick={() => handleRate(1)}
            className="p-2.5 sm:p-3 rounded-2xl bg-red-50 hover:bg-red-100 dark:bg-red-950/40 dark:hover:bg-red-900/60 border-2 border-red-200 dark:border-red-900 text-red-600 dark:text-red-300 font-bold text-center btn-bounce flex flex-col items-center shadow-sm"
          >
            <span className="text-xs sm:text-sm font-black">Lại</span>
            <span className="text-[10px] text-red-500 font-mono mt-0.5">
              {nextIntervals[1]?.text || '<10p'}
            </span>
            <span className="hidden sm:inline-block text-[9px] px-1 rounded bg-white dark:bg-dark-card border border-red-200 text-red-400 font-mono mt-1">
              [1]
            </span>
          </button>

          {/* Nút 2: Khó (Hard) */}
          <button
            onClick={() => handleRate(2)}
            className="p-2.5 sm:p-3 rounded-2xl bg-amber-50 hover:bg-amber-100 dark:bg-amber-950/40 dark:hover:bg-amber-900/60 border-2 border-amber-200 dark:border-amber-900 text-amber-600 dark:text-amber-300 font-bold text-center btn-bounce flex flex-col items-center shadow-sm"
          >
            <span className="text-xs sm:text-sm font-black">Khó</span>
            <span className="text-[10px] text-amber-500 font-mono mt-0.5">
              {nextIntervals[2]?.text || '1 ngày'}
            </span>
            <span className="hidden sm:inline-block text-[9px] px-1 rounded bg-white dark:bg-dark-card border border-amber-200 text-amber-400 font-mono mt-1">
              [2]
            </span>
          </button>

          {/* Nút 3: Tốt (Good) */}
          <button
            onClick={() => handleRate(3)}
            className="p-2.5 sm:p-3 rounded-2xl bg-blue-50 hover:bg-blue-100 dark:bg-blue-950/40 dark:hover:bg-blue-900/60 border-2 border-blue-200 dark:border-blue-900 text-blue-600 dark:text-blue-300 font-bold text-center btn-bounce flex flex-col items-center shadow-sm"
          >
            <span className="text-xs sm:text-sm font-black">Tốt</span>
            <span className="text-[10px] text-blue-500 font-mono mt-0.5">
              {nextIntervals[3]?.text || '3 ngày'}
            </span>
            <span className="hidden sm:inline-block text-[9px] px-1 rounded bg-white dark:bg-dark-card border border-blue-200 text-blue-400 font-mono mt-1">
              [3]
            </span>
          </button>

          {/* Nút 4: Dễ (Easy) */}
          <button
            onClick={() => handleRate(4)}
            className="p-2.5 sm:p-3 rounded-2xl bg-emerald-50 hover:bg-emerald-100 dark:bg-emerald-950/40 dark:hover:bg-emerald-900/60 border-2 border-emerald-200 dark:border-emerald-900 text-emerald-600 dark:text-emerald-300 font-bold text-center btn-bounce flex flex-col items-center shadow-sm"
          >
            <span className="text-xs sm:text-sm font-black">Dễ</span>
            <span className="text-[10px] text-emerald-500 font-mono mt-0.5">
              {nextIntervals[4]?.text || '7 ngày'}
            </span>
            <span className="hidden sm:inline-block text-[9px] px-1 rounded bg-white dark:bg-dark-card border border-emerald-200 text-emerald-400 font-mono mt-1">
              [4]
            </span>
          </button>

        </div>
      ) : (
        /* Nút Lật Thẻ Lớn khi chưa lật */
        <button
          onClick={flipCard}
          className="w-full py-3.5 rounded-2xl bg-gradient-to-r from-kawaii-400 to-kawaii-500 hover:from-kawaii-500 hover:to-kawaii-600 text-white font-bold text-sm shadow-kawaii btn-bounce flex items-center justify-center gap-2"
        >
          <RotateCw className="w-4 h-4" />
          <span>Lật xem đáp án (Phím Space / Chạm)</span>
        </button>
      )}

      {/* THANH CÔNG CỤ PHỤ (UNDO, TẠM HOÃN, SỬA THẺ) */}
      <div className="flex items-center justify-center gap-2 pt-1 text-xs">
        <button
          onClick={undoReview}
          title="Hoàn tác lần chấm trước (Z)"
          className="px-3 py-1.5 rounded-xl bg-white dark:bg-dark-card hover:bg-gray-50 border border-kawaii-100 dark:border-dark-border text-gray-600 dark:text-gray-300 font-semibold flex items-center gap-1"
        >
          <Undo2 className="w-3.5 h-3.5" />
          <span>Hoàn tác (Z)</span>
        </button>

        <button
          onClick={suspendCard}
          title="Tạm hoãn thẻ này (S)"
          className="px-3 py-1.5 rounded-xl bg-white dark:bg-dark-card hover:bg-gray-50 border border-kawaii-100 dark:border-dark-border text-gray-600 dark:text-gray-300 font-semibold flex items-center gap-1"
        >
          <Pause className="w-3.5 h-3.5" />
          <span>Tạm hoãn (S)</span>
        </button>

        <button
          onClick={() => setIsEditingCurrentCard(true)}
          title="Chỉnh sửa thẻ này (E)"
          className="px-3 py-1.5 rounded-xl bg-white dark:bg-dark-card hover:bg-gray-50 border border-kawaii-100 dark:border-dark-border text-gray-600 dark:text-gray-300 font-semibold flex items-center gap-1"
        >
          <Edit className="w-3.5 h-3.5" />
          <span>Sửa thẻ (E)</span>
        </button>
      </div>

      {/* MODAL SỬA THẺ NHANH KHI ĐANG HỌC */}
      <RichCardEditor
        isOpen={isEditingCurrentCard}
        onClose={() => setIsEditingCurrentCard(false)}
        initialCard={currentCard}
        deckLanguage={deckLanguage}
        onSave={async (cardData) => {
          const success = await updateCard(currentCard.id, cardData);
          if (success) {
            fetchStudyCards(deckId || undefined);
          }
          return success;
        }}
      />

    </div>
  );
};
