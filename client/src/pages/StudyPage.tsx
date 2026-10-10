import React, { useEffect, useState, useRef, useCallback } from 'react';
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
  MoreVertical,
  SunMedium,
  HandMetal,
  X,
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

  // Cài đặt cá nhân hóa cho phiên học mobile
  const [autoSpeech, setAutoSpeech] = useState(true);
  const [swipeEnabled, setSwipeEnabled] = useState(true);
  const [wakeLockActive, setWakeLockActive] = useState(false);
  const [showOptionsMenu, setShowOptionsMenu] = useState(false);
  const [isEditingCurrentCard, setIsEditingCurrentCard] = useState(false);
  const [startTime, setStartTime] = useState<number>(Date.now());

  // Toast hoàn tác nổi trong 4 giây sau mỗi lần chấm điểm
  const [undoToast, setUndoToast] = useState<{ visible: boolean; label: string; timer?: any }>({
    visible: false,
    label: '',
  });

  // Trạng thái vuốt thẻ cảm ứng (Pointer Events)
  const [dragX, setDragX] = useState(0);
  const [isDragging, setIsDragging] = useState(false);
  const dragStartX = useRef(0);
  const cardContainerRef = useRef<HTMLDivElement>(null);
  const hasTriggeredConfetti = useRef(false);

  const currentCard = cards[currentIndex];
  const totalCards = cards.length;
  const currentDeck = decks.find((d) => d.id === (deckId || currentCard?.deckId));
  const deckLanguage = currentDeck?.language || (currentCard?.level?.startsWith('HSK') ? 'zh' : 'en');

  // Khởi tạo phiên học & mở khóa âm thanh cho Safari
  useEffect(() => {
    fetchStudyCards(deckId || undefined);
    hasTriggeredConfetti.current = false;
    ttsService.unlockAudio();
    return () => {
      resetSession();
    };
  }, [deckId, fetchStudyCards, resetSession]);

  // Screen Wake Lock API: Giữ màn hình luôn sáng khi đang học
  useEffect(() => {
    let wakeLockSentinel: any = null;
    if ('wakeLock' in navigator) {
      navigator.wakeLock
        .request('screen')
        .then((wl) => {
          wakeLockSentinel = wl;
          setWakeLockActive(true);
        })
        .catch(() => {
          setWakeLockActive(false);
        });
    }

    return () => {
      if (wakeLockSentinel) {
        wakeLockSentinel.release().catch(() => {});
      }
    };
  }, []);

  // Đặt lại thời gian bắt đầu khi chuyển thẻ & tự động phát âm nếu bật
  useEffect(() => {
    setStartTime(Date.now());
    setDragX(0);
    setIsDragging(false);
    if (currentCard && autoSpeech && !isFlipped) {
      ttsService.speak(currentCard.front, deckLanguage, currentCard.audioUrl);
    }
  }, [currentIndex, currentCard, autoSpeech, deckLanguage, isFlipped]);

  // Nổ confetti khi hoàn thành phiên học
  useEffect(() => {
    if (isCompleted && totalCards > 0 && !hasTriggeredConfetti.current) {
      hasTriggeredConfetti.current = true;
      confetti({
        particleCount: 110,
        spread: 75,
        origin: { y: 0.55 },
        colors: ['#FF5C9E', '#FF8FB8', '#C084FC', '#FBBF24', '#34D399'],
      });
    }
  }, [isCompleted, totalCards]);

  // Xử lý chấm điểm
  const handleRate = useCallback(
    (rating: 1 | 2 | 3 | 4) => {
      const reviewTime = Date.now() - startTime;
      const ratingLabels = { 1: 'Lại', 2: 'Khó', 3: 'Tốt', 4: 'Dễ' };
      reviewCard(rating, reviewTime);

      // Hiển thị toast hoàn tác nổi trong 4 giây
      if (undoToast.timer) clearTimeout(undoToast.timer);
      const timer = setTimeout(() => {
        setUndoToast({ visible: false, label: '' });
      }, 4000);
      setUndoToast({ visible: true, label: ratingLabels[rating], timer });
    },
    [startTime, reviewCard, undoToast.timer]
  );

  // Lắng nghe phím tắt toàn cục (hỗ trợ cả máy tính)
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (['INPUT', 'TEXTAREA', 'SELECT'].includes((e.target as HTMLElement).tagName)) {
        return;
      }

      if (e.code === 'Space' || e.code === 'Enter') {
        e.preventDefault();
        flipCard();
      } else if (isFlipped) {
        if (e.key === '1') { e.preventDefault(); handleRate(1); }
        else if (e.key === '2') { e.preventDefault(); handleRate(2); }
        else if (e.key === '3') { e.preventDefault(); handleRate(3); }
        else if (e.key === '4') { e.preventDefault(); handleRate(4); }
      }

      if (e.key.toLowerCase() === 'r' || e.key.toLowerCase() === 'p') {
        e.preventDefault();
        if (currentCard) {
          ttsService.speak(currentCard.front, deckLanguage, currentCard.audioUrl);
        }
      } else if (e.key.toLowerCase() === 'z') {
        e.preventDefault();
        undoReview();
        setUndoToast({ visible: false, label: '' });
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
  }, [isFlipped, currentCard, deckLanguage, flipCard, handleRate, undoReview, suspendCard, onExit]);

  // CỬ CHỈ VUỐT THẺ BẰNG NGÓN TAY (Pointer Events chống xung đột với mép màn hình)
  const handlePointerDown = (e: React.PointerEvent) => {
    if (!swipeEnabled || isEditingCurrentCard) return;

    // Chặn vuốt nếu ngón tay đặt sát mép 20px (bảo vệ cử chỉ Back vuốt mép của iOS/Android)
    if (e.clientX < 20 || e.clientX > window.innerWidth - 20) return;

    dragStartX.current = e.clientX;
    setIsDragging(true);
  };

  const handlePointerMove = (e: React.PointerEvent) => {
    if (!isDragging || !swipeEnabled) return;
    const deltaX = e.clientX - dragStartX.current;
    // Giới hạn độ kéo tối đa để không trôi mất kiểm soát
    setDragX(Math.max(-160, Math.min(160, deltaX)));
  };

  const handlePointerUp = () => {
    if (!isDragging) return;
    setIsDragging(false);

    // Ngưỡng kích hoạt vuốt: > 75px
    if (dragX > 75) {
      // Vuốt sang PHẢI = Đánh giá "Tốt" (hoặc lật thẻ nếu chưa lật)
      if (!isFlipped) {
        flipCard();
      } else {
        handleRate(3);
      }
    } else if (dragX < -75) {
      // Vuốt sang TRÁI = Đánh giá "Lại"
      if (!isFlipped) {
        flipCard();
      } else {
        handleRate(1);
      }
    }
    setDragX(0);
  };

  const handleCardClick = () => {
    // Chỉ lật nếu người dùng không kéo vuốt thẻ
    if (Math.abs(dragX) < 10) {
      flipCard();
    }
  };

  // 1. MÀN HÌNH ĐANG TẢI
  if (isLoading) {
    return (
      <div className="h-[100dvh] flex flex-col items-center justify-center p-6 text-center space-y-4">
        <Mascot id="bunny_pink" mood="studying" size="lg" />
        <h3 className="text-base font-bold text-gray-700 dark:text-gray-200">
          Đang chuẩn bị thẻ học thông minh FSRS...
        </h3>
      </div>
    );
  }

  // 2. MÀN HÌNH HOÀN THÀNH PHIÊN HỌC (Gamification & Confetti)
  if (isCompleted || !currentCard) {
    return (
      <div className="h-[100dvh] flex flex-col justify-between p-4 sm:p-6 max-w-lg mx-auto">
        <div className="my-auto space-y-6 text-center bg-white dark:bg-dark-card rounded-3xl p-6 sm:p-8 border-2 border-kawaii-200 dark:border-dark-border shadow-kawaii">
          <div className="flex justify-center">
            <Mascot id="bunny_pink" mood="happy" size="xl" />
          </div>

          <div className="space-y-1">
            <span className="text-xs font-bold text-kawaii-600 dark:text-kawaii-400 uppercase tracking-widest">
              Xuất sắc tuyệt vời!
            </span>
            <h2 className="text-2xl sm:text-3xl font-extrabold font-display text-gray-900 dark:text-white">
              Bạn Đã Hoàn Thành! 🌸
            </h2>
            <p className="text-xs sm:text-sm text-gray-500 dark:text-dark-textMuted">
              Tất cả các thẻ đến hạn đã được ôn tập và củng cố vào trí nhớ dài hạn.
            </p>
          </div>

          {/* Thống kê phiên học */}
          <div className="grid grid-cols-2 gap-3 p-3.5 rounded-2xl bg-kawaii-50/70 dark:bg-dark-bg/60 border border-kawaii-100 dark:border-dark-border">
            <div className="space-y-0.5">
              <span className="text-[11px] text-gray-500 font-semibold">Đã ôn tập</span>
              <p className="text-2xl font-black text-kawaii-600 dark:text-kawaii-400">
                {reviewedCount} thẻ
              </p>
            </div>
            <div className="space-y-0.5">
              <span className="text-[11px] text-gray-500 font-semibold flex items-center justify-center gap-1">
                <Sparkles className="w-3.5 h-3.5 text-purple-500" /> Điểm XP
              </span>
              <p className="text-2xl font-black text-purple-600 dark:text-purple-400">
                +{xpEarned} XP
              </p>
            </div>
          </div>
        </div>

        {/* Cụm nút hành động sát đáy ngón cái */}
        <div
          style={{ paddingBottom: 'max(env(safe-area-inset-bottom, 0px), 12px)' }}
          className="flex flex-col sm:flex-row gap-2.5 w-full"
        >
          <button
            onClick={() => fetchStudyCards(deckId || undefined, 'cram')}
            className="w-full py-3.5 min-h-[50px] rounded-2xl bg-white dark:bg-dark-card hover:bg-kawaii-50 text-gray-700 dark:text-gray-200 font-bold text-sm border-2 border-kawaii-200 dark:border-dark-border active:scale-95 transition-all"
          >
            Ôn tập cấp tốc (Cram)
          </button>
          <button
            onClick={onExit}
            className="w-full py-3.5 min-h-[50px] rounded-2xl bg-gradient-to-r from-kawaii-400 to-kawaii-500 text-white font-bold text-sm shadow-kawaii active:scale-95 transition-all"
          >
            Quay lại danh sách bộ thẻ
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
    <div
      style={{ overscrollBehaviorY: 'contain' }}
      className="h-[100dvh] flex flex-col justify-between max-w-xl mx-auto px-3 select-none overflow-hidden"
    >
      
      {/* 3.1. THANH ĐIỀU HƯỚNG TRÊN CÙNG (Safe Area Top) */}
      <div
        style={{ paddingTop: 'max(env(safe-area-inset-top, 0px), 8px)' }}
        className="flex items-center justify-between gap-2.5 pt-1 pb-2 shrink-0"
      >
        <button
          onClick={onExit}
          className="w-11 h-11 rounded-2xl bg-white dark:bg-dark-card hover:bg-gray-50 text-gray-600 dark:text-gray-300 border border-kawaii-100 dark:border-dark-border shadow-xs flex items-center justify-center active:scale-95 shrink-0"
          aria-label="Thoát phiên học"
        >
          <ArrowLeft className="w-5 h-5" />
        </button>

        {/* Thanh tiến trình phần trăm */}
        <div className="flex-1 max-w-xs">
          <div className="flex justify-between text-[11px] font-bold text-gray-500 dark:text-dark-textMuted mb-1">
            <span>{currentIndex + 1} / {totalCards} thẻ</span>
            <span>{progressPercent}%</span>
          </div>
          <div className="w-full bg-kawaii-100 dark:bg-dark-card h-2 rounded-full overflow-hidden">
            <div
              className="bg-gradient-to-r from-kawaii-400 to-kawaii-500 h-full rounded-full transition-all duration-300"
              style={{ width: `${progressPercent}%` }}
            />
          </div>
        </div>

        {/* Menu Tùy chọn 3 chấm */}
        <button
          onClick={() => setShowOptionsMenu(!showOptionsMenu)}
          className="w-11 h-11 rounded-2xl bg-white dark:bg-dark-card hover:bg-gray-50 text-gray-600 dark:text-gray-300 border border-kawaii-100 dark:border-dark-border shadow-xs flex items-center justify-center active:scale-95 shrink-0"
          aria-label="Tùy chọn phiên học"
        >
          <MoreVertical className="w-5 h-5 text-gray-500" />
        </button>
      </div>

      {/* 3.2. THẺ FLASHCARD 3D TẬP TRUNG Ở PHẦN GIỮA (FLEX-1) */}
      <div
        ref={cardContainerRef}
        onPointerDown={handlePointerDown}
        onPointerMove={handlePointerMove}
        onPointerUp={handlePointerUp}
        onPointerCancel={handlePointerUp}
        onClick={handleCardClick}
        style={{
          transform: isDragging ? `translateX(${dragX}px) rotate(${dragX * 0.04}deg)` : undefined,
          transition: isDragging ? 'none' : 'transform 0.25s ease-out',
          touchAction: 'pan-y',
        }}
        className="flex-1 w-full flex items-center justify-center py-2 relative cursor-pointer group"
      >
        {/* Chỉ báo gợi ý khi vuốt thẻ */}
        {dragX > 25 && (
          <div className="absolute top-6 right-6 z-30 px-3.5 py-1.5 rounded-full bg-emerald-500 text-white font-extrabold text-xs shadow-lg animate-fade-in flex items-center gap-1">
            <span>✓ Tốt (Vuốt phải)</span>
          </div>
        )}
        {dragX < -25 && (
          <div className="absolute top-6 left-6 z-30 px-3.5 py-1.5 rounded-full bg-rose-500 text-white font-extrabold text-xs shadow-lg animate-fade-in flex items-center gap-1">
            <span>✕ Lại (Vuốt trái)</span>
          </div>
        )}

        <div className="w-full h-full max-h-[62dvh] min-h-[300px] perspective-1000 relative">
          <div
            className={`w-full h-full duration-500 transform-style-3d transition-transform ${
              isFlipped ? 'rotate-y-180' : ''
            }`}
          >
            {/* MẶT TRƯỚC (FRONT) */}
            <div className="absolute inset-0 backface-hidden bg-white dark:bg-dark-card rounded-3xl p-5 sm:p-7 border-2 border-kawaii-200 dark:border-dark-border shadow-kawaii flex flex-col justify-between items-center text-center">
              
              {/* Header của thẻ */}
              <div className="w-full flex justify-between items-center text-xs">
                <span className="px-3 py-1 rounded-full bg-kawaii-50 dark:bg-dark-bg text-kawaii-600 dark:text-kawaii-400 font-bold border border-kawaii-100 dark:border-dark-border">
                  {currentCard.level || (deckLanguage === 'zh' ? 'HSK' : 'Oxford')}
                </span>
                
                {/* Nút phát âm lớn chuẩn ngón cái */}
                <button
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation();
                    ttsService.speak(currentCard.front, deckLanguage, currentCard.audioUrl);
                  }}
                  className="w-11 h-11 rounded-2xl bg-kawaii-50 dark:bg-dark-bg hover:bg-kawaii-100 text-kawaii-600 dark:text-kawaii-400 border border-kawaii-200 dark:border-dark-border transition-colors flex items-center justify-center active:scale-95"
                  aria-label="Phát âm từ vựng"
                >
                  <Volume2 className="w-5 h-5" />
                </button>
              </div>

              {/* Nội dung từ vựng chính co giãn mượt mà */}
              <div className="space-y-2.5 my-auto py-2">
                <h2 className="text-[clamp(2.4rem,8vw,4.2rem)] font-black text-gray-900 dark:text-white font-hanzi tracking-tight leading-tight break-words">
                  {currentCard.cardType === 'cloze'
                    ? currentCard.front.replace(/\{\{c\d+::(.*?)\}\}/g, '[ ... ]')
                    : currentCard.front}
                </h2>

                {currentCard.phonetic && (
                  <p className="text-[clamp(1.1rem,4vw,1.4rem)] font-bold text-kawaii-600 dark:text-kawaii-400 font-mono">
                    {currentCard.phonetic}
                  </p>
                )}
              </div>

              {/* Gợi ý chạm lật thẻ */}
              <div className="text-xs text-gray-400 dark:text-dark-textMuted flex items-center gap-1.5 font-medium pb-1">
                <RotateCw className="w-4 h-4 text-kawaii-400 animate-spin-slow" />
                <span>Chạm bất kỳ đâu để lật đáp án</span>
              </div>
            </div>

            {/* MẶT SAU (BACK) */}
            <div className="absolute inset-0 backface-hidden rotate-y-180 bg-gradient-to-br from-pink-50/80 via-white to-purple-50/70 dark:from-dark-card dark:via-dark-bg dark:to-dark-card rounded-3xl p-5 sm:p-7 border-2 border-kawaii-400 dark:border-kawaii-500 shadow-kawaii-lg flex flex-col justify-between items-center text-center overflow-y-auto">
              
              {/* Header mặt sau */}
              <div className="w-full flex justify-between items-center text-xs">
                <span className="px-3 py-1 rounded-full bg-kawaii-100 dark:bg-dark-card text-kawaii-600 font-bold border border-kawaii-200 dark:border-dark-border">
                  {currentCard.wordType || 'Nghĩa tiếng Việt'}
                </span>
                <button
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation();
                    ttsService.speak(currentCard.front, deckLanguage, currentCard.audioUrl);
                  }}
                  className="w-11 h-11 rounded-2xl bg-kawaii-100 dark:bg-dark-card hover:bg-kawaii-200 text-kawaii-600 dark:text-kawaii-400 border border-kawaii-200 dark:border-dark-border transition-colors flex items-center justify-center active:scale-95"
                  aria-label="Phát âm từ vựng"
                >
                  <Volume2 className="w-5 h-5" />
                </button>
              </div>

              {/* Nội dung nghĩa & ví dụ ngữ cảnh */}
              <div className="space-y-3 my-auto py-2 max-w-md">
                <h3 className="text-[clamp(1.4rem,5.5vw,2.2rem)] font-extrabold text-gray-900 dark:text-white font-display leading-snug break-words">
                  {currentCard.back}
                </h3>

                {currentCard.example && (
                  <div className="p-3 rounded-2xl bg-white/90 dark:bg-dark-bg/90 border border-kawaii-100 dark:border-dark-border space-y-1 text-left">
                    <p className="text-xs sm:text-sm font-semibold text-gray-800 dark:text-gray-200 leading-relaxed">
                      "{currentCard.example}"
                    </p>
                    {currentCard.exampleTrans && (
                      <p className="text-[11px] sm:text-xs text-gray-500 dark:text-dark-textMuted italic">
                        {currentCard.exampleTrans}
                      </p>
                    )}
                  </div>
                )}

                {currentCard.notes && (
                  <p className="text-xs text-purple-600 dark:text-purple-400 font-semibold text-left">
                    💡 {currentCard.notes}
                  </p>
                )}
              </div>

              {/* Trạng thái FSRS v4 */}
              <div className="text-[11px] text-gray-400 dark:text-dark-textMuted flex items-center gap-1 font-semibold pb-1">
                <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500" />
                <span>Chọn mức độ nhớ ở bên dưới:</span>
              </div>
            </div>

          </div>
        </div>
      </div>

      {/* 3.3. FLOATING UNDO TOAST (Nổi trong 4 giây sau khi chấm điểm) */}
      {undoToast.visible && (
        <div className="fixed bottom-24 left-1/2 -translate-x-1/2 z-40 bg-gray-900/90 dark:bg-gray-100/95 text-white dark:text-gray-900 px-4 py-2.5 rounded-full shadow-kawaii-lg backdrop-blur-md flex items-center gap-3 animate-fade-in text-xs font-bold">
          <span>✓ Đã đánh giá: {undoToast.label}</span>
          <button
            onClick={() => {
              undoReview();
              setUndoToast({ visible: false, label: '' });
            }}
            className="px-2.5 py-1 rounded-full bg-kawaii-500 text-white text-[11px] flex items-center gap-1 active:scale-90"
          >
            <Undo2 className="w-3.5 h-3.5" />
            <span>Hoàn tác</span>
          </button>
        </div>
      )}

      {/* 3.4. CỤM NÚT ĐÁNH GIÁ SÁT ĐÁY NGÓN CÁI (Safe Area Bottom) */}
      <div
        style={{ paddingBottom: 'max(env(safe-area-inset-bottom, 0px), 10px)' }}
        className="w-full shrink-0 pt-1 pb-2"
      >
        {isFlipped ? (
          <div className="grid grid-cols-4 gap-2 sm:gap-2.5">
            {/* 1. LẠI (AGAIN) */}
            <button
              onClick={() => handleRate(1)}
              className="min-h-[56px] h-14 rounded-2xl bg-red-50 hover:bg-red-100 dark:bg-red-950/40 border-2 border-red-300 dark:border-red-900 text-red-600 dark:text-red-300 font-extrabold text-center flex flex-col items-center justify-center active:scale-90 transition-transform shadow-xs"
            >
              <span className="text-xs sm:text-sm leading-tight">Lại</span>
              <span className="text-[10px] text-red-500 font-mono mt-0.5">
                {nextIntervals[1]?.text || '<10p'}
              </span>
            </button>

            {/* 2. KHÓ (HARD) */}
            <button
              onClick={() => handleRate(2)}
              className="min-h-[56px] h-14 rounded-2xl bg-amber-50 hover:bg-amber-100 dark:bg-amber-950/40 border-2 border-amber-300 dark:border-amber-900 text-amber-600 dark:text-amber-300 font-extrabold text-center flex flex-col items-center justify-center active:scale-90 transition-transform shadow-xs"
            >
              <span className="text-xs sm:text-sm leading-tight">Khó</span>
              <span className="text-[10px] text-amber-500 font-mono mt-0.5">
                {nextIntervals[2]?.text || '1d'}
              </span>
            </button>

            {/* 3. TỐT (GOOD) */}
            <button
              onClick={() => handleRate(3)}
              className="min-h-[56px] h-14 rounded-2xl bg-blue-50 hover:bg-blue-100 dark:bg-blue-950/40 border-2 border-blue-300 dark:border-blue-900 text-blue-600 dark:text-blue-300 font-extrabold text-center flex flex-col items-center justify-center active:scale-90 transition-transform shadow-xs"
            >
              <span className="text-xs sm:text-sm leading-tight">Tốt</span>
              <span className="text-[10px] text-blue-500 font-mono mt-0.5">
                {nextIntervals[3]?.text || '3d'}
              </span>
            </button>

            {/* 4. DỄ (EASY) */}
            <button
              onClick={() => handleRate(4)}
              className="min-h-[56px] h-14 rounded-2xl bg-emerald-50 hover:bg-emerald-100 dark:bg-emerald-950/40 border-2 border-emerald-300 dark:border-emerald-900 text-emerald-600 dark:text-emerald-300 font-extrabold text-center flex flex-col items-center justify-center active:scale-90 transition-transform shadow-xs"
            >
              <span className="text-xs sm:text-sm leading-tight">Dễ</span>
              <span className="text-[10px] text-emerald-500 font-mono mt-0.5">
                {nextIntervals[4]?.text || '7d'}
              </span>
            </button>
          </div>
        ) : (
          <button
            onClick={flipCard}
            className="w-full min-h-[56px] h-14 rounded-2xl bg-gradient-to-r from-kawaii-400 to-kawaii-500 hover:from-kawaii-500 hover:to-kawaii-600 text-white font-extrabold text-sm shadow-kawaii flex items-center justify-center gap-2 active:scale-95 transition-transform"
          >
            <RotateCw className="w-5 h-5" />
            <span>Lật xem đáp án (Chạm thẻ)</span>
          </button>
        )}
      </div>

      {/* 3.5. BOTTOM SHEET MENU TÙY CHỌN PHIÊN HỌC */}
      {showOptionsMenu && (
        <div className="fixed inset-0 z-50 flex items-end justify-center bg-black/40 backdrop-blur-xs animate-fade-in">
          <div className="fixed inset-0 -z-10" onClick={() => setShowOptionsMenu(false)} />
          <div
            style={{ paddingBottom: 'max(env(safe-area-inset-bottom, 0px), 16px)' }}
            className="w-full max-w-md bg-white dark:bg-dark-card rounded-t-3xl p-5 border-t-2 border-kawaii-200 dark:border-dark-border shadow-kawaii-lg animate-bottom-sheet space-y-3"
          >
            <div className="w-12 h-1.5 rounded-full bg-kawaii-200 dark:bg-dark-border mx-auto mb-2" />
            
            <div className="flex items-center justify-between pb-2 border-b border-kawaii-100 dark:border-dark-border">
              <h4 className="font-bold text-sm text-gray-800 dark:text-gray-200">
                Tùy chọn phiên học ⚙️
              </h4>
              <button
                onClick={() => setShowOptionsMenu(false)}
                className="w-9 h-9 flex items-center justify-center text-gray-400 rounded-full"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="space-y-1">
              <button
                onClick={() => {
                  setIsEditingCurrentCard(true);
                  setShowOptionsMenu(false);
                }}
                className="w-full px-3 py-2.5 rounded-2xl hover:bg-kawaii-50 dark:hover:bg-dark-bg text-gray-700 dark:text-gray-200 text-xs font-bold flex items-center gap-2.5 transition-colors"
              >
                <Edit className="w-4 h-4 text-kawaii-500" />
                <span>Chỉnh sửa nhanh thẻ này</span>
              </button>

              <button
                onClick={() => {
                  suspendCard();
                  setShowOptionsMenu(false);
                }}
                className="w-full px-3 py-2.5 rounded-2xl hover:bg-kawaii-50 dark:hover:bg-dark-bg text-amber-600 text-xs font-bold flex items-center gap-2.5 transition-colors"
              >
                <Pause className="w-4 h-4" />
                <span>Tạm hoãn thẻ này (Suspend)</span>
              </button>

              <div className="my-1 border-t border-kawaii-100 dark:border-dark-border" />

              <div className="flex items-center justify-between px-3 py-2 text-xs font-semibold text-gray-700 dark:text-gray-300">
                <span className="flex items-center gap-2">
                  <Volume2 className="w-4 h-4 text-kawaii-500" />
                  <span>Tự động phát âm khi lật</span>
                </span>
                <input
                  type="checkbox"
                  checked={autoSpeech}
                  onChange={(e) => setAutoSpeech(e.target.checked)}
                  className="w-4 h-4 rounded border-kawaii-300 text-kawaii-500 focus:ring-kawaii-400"
                />
              </div>

              <div className="flex items-center justify-between px-3 py-2 text-xs font-semibold text-gray-700 dark:text-gray-300">
                <span className="flex items-center gap-2">
                  <HandMetal className="w-4 h-4 text-purple-500" />
                  <span>Cử chỉ vuốt ngón tay (Trái/Phải)</span>
                </span>
                <input
                  type="checkbox"
                  checked={swipeEnabled}
                  onChange={(e) => setSwipeEnabled(e.target.checked)}
                  className="w-4 h-4 rounded border-kawaii-300 text-kawaii-500 focus:ring-kawaii-400"
                />
              </div>

              <div className="flex items-center justify-between px-3 py-2 text-xs font-semibold text-gray-700 dark:text-gray-300">
                <span className="flex items-center gap-2">
                  <SunMedium className="w-4 h-4 text-amber-500" />
                  <span>Giữ sáng màn hình (Screen Wake Lock)</span>
                </span>
                <span className="text-[10px] font-mono text-emerald-500">
                  {wakeLockActive ? 'Đang bật' : 'Không hỗ trợ'}
                </span>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Modal chỉnh sửa nhanh thẻ */}
      {isEditingCurrentCard && currentCard && (
        <RichCardEditor
          isOpen={isEditingCurrentCard}
          initialCard={currentCard}
          deckLanguage={deckLanguage}
          onSave={async (updatedData) => {
            const res = await updateCard(currentCard.id, updatedData);
            setIsEditingCurrentCard(false);
            return !!res;
          }}
          onClose={() => setIsEditingCurrentCard(false)}
        />
      )}

    </div>
  );
};
