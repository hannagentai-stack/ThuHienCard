import React, { useState, useEffect, useRef } from 'react';
import confetti from 'canvas-confetti';
import {
  ArrowLeft,
  Volume2,
  VolumeX,
  Eye,
  EyeOff,
  Timer,
  CheckCircle2,
  RotateCcw,
  Sparkles,
} from 'lucide-react';
import { type Card } from '../../types';
import { ttsService } from '../../services/ttsService';
import { useAuthStore } from '../../stores/authStore';

export interface MatchingTile {
  id: string; // Unique tile id
  cardId: string;
  type: 'word' | 'meaning';
  text: string;
  phonetic?: string | null;
  deckLang: 'zh' | 'en';
  isMatched: boolean;
  isWrong: boolean;
}

interface MatchingGameViewProps {
  cardsPool: Card[];
  onExit: () => void;
  onNextRound?: () => void;
}

export const MatchingGameView: React.FC<MatchingGameViewProps> = ({
  cardsPool,
  onExit,
  onNextRound,
}) => {
  const { checkAuth } = useAuthStore();

  // Cấu hình cá nhân hóa lưu localStorage
  const [showPinyin, setShowPinyin] = useState<boolean>(
    localStorage.getItem('matching_show_pinyin') !== 'false'
  );
  const [soundEnabled, setSoundEnabled] = useState<boolean>(
    localStorage.getItem('matching_sound') !== 'false'
  );

  // Danh sách ô 2 cột (Cột Trái: Từ | Cột Phải: Nghĩa)
  const [wordTiles, setWordTiles] = useState<MatchingTile[]>([]);
  const [meaningTiles, setMeaningTiles] = useState<MatchingTile[]>([]);

  // Lựa chọn hiện tại của 2 bên
  const [selectedWordTileId, setSelectedWordTileId] = useState<string | null>(null);
  const [selectedMeaningTileId, setSelectedMeaningTileId] = useState<string | null>(null);

  // Cờ khóa tương tác chống double-click / race condition khi đang so sánh
  const [isChecking, setIsChecking] = useState<boolean>(false);

  // Thống kê ván chơi
  const [matchedCount, setMatchedCount] = useState<number>(0);
  const [totalPairs, setTotalPairs] = useState<number>(0);
  const [mistakesCount, setMistakesCount] = useState<number>(0);
  const [timerSeconds, setTimerSeconds] = useState<number>(0);
  const [isGameCompleted, setIsGameCompleted] = useState<boolean>(false);
  const [xpEarned, setXpEarned] = useState<number>(0);

  // Tập hợp các ID thẻ bị sai trong ván này (dùng cho chế độ Thẻ khó)
  const mistakeCardIdsRef = useRef<Set<string>>(new Set());

  // Haptic feedback nhẹ trên thiết bị di động
  const triggerHaptic = (duration = 15) => {
    if (typeof navigator !== 'undefined' && navigator.vibrate) {
      navigator.vibrate([duration]);
    }
  };

  // 1. Khởi tạo ván chơi mới
  const initBoard = (pool: Card[]) => {
    // Lọc các thẻ hợp lệ (có front và back) và khử trùng lặp mặt trước / mặt sau
    const seenFronts = new Set<string>();
    const seenBacks = new Set<string>();
    const validUniqueCards: Card[] = [];

    // Xáo trộn pool trước khi chọn
    const shuffledPool = [...pool].sort(() => Math.random() - 0.5);

    for (const card of shuffledPool) {
      const front = (card.front || '').trim();
      const back = (card.back || '').trim();
      if (!front || !back) continue;

      if (!seenFronts.has(front) && !seenBacks.has(back)) {
        seenFronts.add(front);
        seenBacks.add(back);
        validUniqueCards.push(card);
      }
      if (validUniqueCards.length >= 6) break;
    }

    // Nếu không đủ thẻ không trùng, lấy các thẻ còn lại để đảm bảo ít nhất 4 cặp
    if (validUniqueCards.length < 4) {
      for (const card of shuffledPool) {
        if (!validUniqueCards.some((c) => c.id === card.id) && card.front && card.back) {
          validUniqueCards.push(card);
        }
        if (validUniqueCards.length >= 6) break;
      }
    }

    const selectedCards = validUniqueCards.slice(0, 6);
    const count = selectedCards.length;
    setTotalPairs(count);
    setMatchedCount(0);
    setMistakesCount(0);
    setTimerSeconds(0);
    setIsGameCompleted(false);
    setSelectedWordTileId(null);
    setSelectedMeaningTileId(null);
    setIsChecking(false);
    mistakeCardIdsRef.current = new Set();

    // Tạo các ô cột Trái (Từ)
    const words: MatchingTile[] = selectedCards.map((c) => ({
      id: `word-${c.id}`,
      cardId: c.id,
      type: 'word',
      text: c.front.trim(),
      phonetic: c.phonetic?.trim() || null,
      deckLang: (c as any).deckLang || (c.level?.startsWith('HSK') ? 'zh' : 'en'),
      isMatched: false,
      isWrong: false,
    }));

    // Tạo các ô cột Phải (Nghĩa)
    const meanings: MatchingTile[] = selectedCards.map((c) => ({
      id: `meaning-${c.id}`,
      cardId: c.id,
      type: 'meaning',
      text: c.back.trim(),
      deckLang: (c as any).deckLang || (c.level?.startsWith('HSK') ? 'zh' : 'en'),
      isMatched: false,
      isWrong: false,
    }));

    // Xáo trộn độc lập 2 bên
    setWordTiles(words.sort(() => Math.random() - 0.5));
    setMeaningTiles(meanings.sort(() => Math.random() - 0.5));
  };

  useEffect(() => {
    initBoard(cardsPool);
  }, [cardsPool]);

  // 2. Đồng hồ bấm giờ (Stopwatch)
  useEffect(() => {
    let interval: any = null;
    if (!isGameCompleted && totalPairs > 0) {
      interval = setInterval(() => {
        setTimerSeconds((prev) => prev + 1);
      }, 1000);
    }
    return () => clearInterval(interval);
  }, [isGameCompleted, totalPairs]);

  // Định dạng thời gian mm:ss
  const formatTimer = (sec: number) => {
    const mins = Math.floor(sec / 60);
    const remainingSec = sec % 60;
    return `${mins.toString().padStart(2, '0')}:${remainingSec.toString().padStart(2, '0')}`;
  };

  // 3. Xử lý chạm ô Cột Từ (Trái)
  const handleWordClick = (tile: MatchingTile) => {
    if (isChecking || tile.isMatched) return;

    // Chạm lại chính ô đó -> Bỏ chọn (toggle unselect)
    if (selectedWordTileId === tile.id) {
      setSelectedWordTileId(null);
      return;
    }

    // Tự động phát âm TTS khi chạm từ
    if (soundEnabled) {
      ttsService.speak(tile.text, tile.deckLang);
    }
    triggerHaptic(10);
    setSelectedWordTileId(tile.id);

    // Nếu bên nghĩa đã chọn từ trước -> Tiến hành kiểm tra khớp ngay
    if (selectedMeaningTileId) {
      checkMatch(tile.id, selectedMeaningTileId);
    }
  };

  // 4. Xử lý chạm ô Cột Nghĩa (Phải)
  const handleMeaningClick = (tile: MatchingTile) => {
    if (isChecking || tile.isMatched) return;

    // Chạm lại chính ô đó -> Bỏ chọn (toggle unselect)
    if (selectedMeaningTileId === tile.id) {
      setSelectedMeaningTileId(null);
      return;
    }

    triggerHaptic(10);
    setSelectedMeaningTileId(tile.id);

    // Nếu bên từ đã chọn từ trước -> Tiến hành kiểm tra khớp ngay
    if (selectedWordTileId) {
      checkMatch(selectedWordTileId, tile.id);
    }
  };

  // 5. Kiểm tra cặp đã chọn
  const checkMatch = (wordId: string, meaningId: string) => {
    const wordTile = wordTiles.find((w) => w.id === wordId);
    const meaningTile = meaningTiles.find((m) => m.id === meaningId);
    if (!wordTile || !meaningTile) return;

    setIsChecking(true);

    const isCorrect = wordTile.cardId === meaningTile.cardId;

    if (isCorrect) {
      // ✅ GHÉP ĐÚNG
      triggerHaptic(20);
      const newMatchedCount = matchedCount + 1;
      setMatchedCount(newMatchedCount);

      setTimeout(() => {
        setWordTiles((prev) =>
          prev.map((t) => (t.id === wordId ? { ...t, isMatched: true } : t))
        );
        setMeaningTiles((prev) =>
          prev.map((t) => (t.id === meaningId ? { ...t, isMatched: true } : t))
        );
        setSelectedWordTileId(null);
        setSelectedMeaningTileId(null);
        setIsChecking(false);

        // Kiểm tra xem đã hoàn thành toàn bộ bảng chưa
        if (newMatchedCount >= totalPairs) {
          handleVictory();
        }
      }, 320);
    } else {
      // ❌ GHÉP SAI
      triggerHaptic(60);
      setMistakesCount((prev) => prev + 1);
      mistakeCardIdsRef.current.add(wordTile.cardId);

      // Đổi màu viền đỏ + rung lắc
      setWordTiles((prev) =>
        prev.map((t) => (t.id === wordId ? { ...t, isWrong: true } : t))
      );
      setMeaningTiles((prev) =>
        prev.map((t) => (t.id === meaningId ? { ...t, isWrong: true } : t))
      );

      setTimeout(() => {
        setWordTiles((prev) =>
          prev.map((t) => (t.id === wordId ? { ...t, isWrong: false } : t))
        );
        setMeaningTiles((prev) =>
          prev.map((t) => (t.id === meaningId ? { ...t, isWrong: false } : t))
        );
        setSelectedWordTileId(null);
        setSelectedMeaningTileId(null);
        setIsChecking(false);
      }, 550);
    }
  };

  // 6. Xử lý khi hoàn thành ván (Chiến thắng)
  const handleVictory = async () => {
    setIsGameCompleted(true);
    confetti({
      particleCount: 110,
      spread: 75,
      origin: { y: 0.55 },
    });

    // Thưởng XP: 20 XP nếu ít lỗi, 15 XP nếu có lỗi
    const earned = mistakesCount === 0 ? 25 : mistakesCount <= 2 ? 20 : 15;
    setXpEarned(earned);

    // Gửi kết quả lên server để lưu XP và Streak
    const token = localStorage.getItem('token') || sessionStorage.getItem('token');
    if (token) {
      try {
        const mistakeIds = Array.from(mistakeCardIdsRef.current);
        const res = await fetch('/api/study/practice-reward', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify({
            xp: earned,
            mode: 'matching',
            mistakeCardIds: mistakeIds,
          }),
        });
        if (res.ok) {
          checkAuth(); // Cập nhật lại số XP hiển thị trên Header
        }
      } catch {
        // Tiếp tục chế độ offline nếu mất mạng
      }
    }
  };

  // Toggle Pinyin
  const handleTogglePinyin = () => {
    const next = !showPinyin;
    setShowPinyin(next);
    localStorage.setItem('matching_show_pinyin', String(next));
  };

  // Toggle Sound
  const handleToggleSound = () => {
    const next = !soundEnabled;
    setSoundEnabled(next);
    localStorage.setItem('matching_sound', String(next));
  };

  return (
    <div className="max-w-xl mx-auto space-y-4 pb-20 select-none px-2 sm:px-0 animate-fade-in">
      {/* 1. THANH ĐIỀU HƯỚNG TRÊN CÙNG */}
      <div className="flex items-center justify-between gap-2">
        <button
          onClick={onExit}
          className="min-h-[44px] px-3.5 py-1.5 rounded-2xl bg-white dark:bg-dark-card border border-kawaii-200 dark:border-dark-border text-xs font-bold flex items-center gap-1.5 active:scale-95 shadow-xs text-gray-700 dark:text-gray-200"
          aria-label="Quay lại danh sách chế độ"
        >
          <ArrowLeft className="w-4 h-4 text-kawaii-500" />
          <span>Thoát</span>
        </button>

        {/* Bộ đếm thời gian & Số lỗi */}
        <div className="flex items-center gap-2">
          <div className="flex items-center gap-1 px-3 py-1.5 rounded-full bg-kawaii-50 dark:bg-dark-card border border-kawaii-200 dark:border-dark-border text-xs font-mono font-bold text-kawaii-700 dark:text-kawaii-300">
            <Timer className="w-3.5 h-3.5 text-kawaii-500" />
            <span>{formatTimer(timerSeconds)}</span>
          </div>

          {mistakesCount > 0 && (
            <div className="px-2.5 py-1 rounded-full bg-red-50 dark:bg-red-950/40 border border-red-200 dark:border-red-900/50 text-[11px] font-bold text-red-600 dark:text-red-400 animate-scale-up">
              Lỗi: {mistakesCount}
            </div>
          )}
        </div>

        {/* Nút bật tắt Pinyin & Âm thanh */}
        <div className="flex items-center gap-1.5">
          <button
            onClick={handleTogglePinyin}
            className={`min-h-[40px] px-2.5 py-1.5 rounded-xl border text-xs font-bold flex items-center gap-1 active:scale-90 transition-all ${
              showPinyin
                ? 'bg-kawaii-500 text-white border-kawaii-600 shadow-xs'
                : 'bg-white dark:bg-dark-card text-gray-500 border-gray-200 dark:border-dark-border'
            }`}
            title="Bật/Tắt hiển thị Pinyin/IPA"
          >
            {showPinyin ? <Eye className="w-3.5 h-3.5" /> : <EyeOff className="w-3.5 h-3.5" />}
            <span className="text-[11px]">Pinyin</span>
          </button>

          <button
            onClick={handleToggleSound}
            className={`min-h-[40px] p-2 rounded-xl border text-xs font-bold active:scale-90 transition-all ${
              soundEnabled
                ? 'bg-purple-500 text-white border-purple-600 shadow-xs'
                : 'bg-white dark:bg-dark-card text-gray-400 border-gray-200 dark:border-dark-border'
            }`}
            title="Bật/Tắt tự động đọc phát âm"
          >
            {soundEnabled ? <Volume2 className="w-4 h-4" /> : <VolumeX className="w-4 h-4" />}
          </button>
        </div>
      </div>

      {/* 2. THANH TIẾN TRÌNH GHÉP CẶP */}
      <div className="bg-white dark:bg-dark-card p-3 rounded-2xl border border-kawaii-100 dark:border-dark-border shadow-xs space-y-1.5">
        <div className="flex items-center justify-between text-xs">
          <span className="font-extrabold text-gray-800 dark:text-gray-100 flex items-center gap-1.5">
            <span>Ghép cặp từ & nghĩa</span>
            <span className="text-kawaii-500">🧩</span>
          </span>
          <span className="font-black text-kawaii-600 dark:text-kawaii-400">
            {matchedCount} / {totalPairs} cặp
          </span>
        </div>

        {/* Progress Bar */}
        <div className="w-full h-2 rounded-full bg-gray-100 dark:bg-dark-bg overflow-hidden">
          <div
            className="h-full bg-gradient-to-r from-kawaii-400 to-kawaii-600 rounded-full transition-all duration-300"
            style={{ width: `${totalPairs > 0 ? (matchedCount / totalPairs) * 100 : 0}%` }}
          />
        </div>
      </div>

      {/* 3. BẢNG 2 CỘT TÁCH BẠCH (TRÁI: TỪ VỰNG 🌸 | PHẢI: NGHĨA 💜) */}
      <div className="grid grid-cols-2 gap-3 pt-1">
        {/* CỘT TRÁI: TỪ VỰNG */}
        <div className="space-y-2.5">
          <div className="text-center pb-0.5">
            <span className="px-3 py-1 rounded-full bg-kawaii-100 dark:bg-kawaii-950/50 text-kawaii-700 dark:text-kawaii-300 text-[11px] font-extrabold tracking-wide uppercase">
              🌸 Từ Vựng
            </span>
          </div>

          <div className="space-y-2">
            {wordTiles.map((tile) => {
              const isSelected = selectedWordTileId === tile.id;

              // Trạng thái đã khớp xong
              if (tile.isMatched) {
                return (
                  <div
                    key={tile.id}
                    className="min-h-[64px] p-2.5 rounded-2xl bg-emerald-50 dark:bg-emerald-950/20 border-2 border-emerald-200 dark:border-emerald-900/40 text-emerald-600 dark:text-emerald-400 text-center opacity-40 select-none flex flex-col items-center justify-center transition-all scale-98"
                  >
                    <CheckCircle2 className="w-4 h-4 text-emerald-500" />
                    <span className="text-sm font-bold font-hanzi line-through">{tile.text}</span>
                  </div>
                );
              }

              // Định kiểu ô đang chọn hoặc sai
              let tileStyle =
                'bg-white dark:bg-dark-card border-kawaii-200 dark:border-dark-border text-gray-800 dark:text-gray-100 hover:border-kawaii-400';
              if (tile.isWrong) {
                tileStyle =
                  'bg-red-50 dark:bg-red-950/40 border-red-500 text-red-700 dark:text-red-300 animate-shake';
              } else if (isSelected) {
                tileStyle =
                  'bg-kawaii-50 dark:bg-dark-bg border-kawaii-500 text-kawaii-700 dark:text-kawaii-300 scale-102 shadow-kawaii ring-2 ring-kawaii-300';
              }

              const isHanzi = /[\u4e00-\u9fa5]/.test(tile.text);

              return (
                <button
                  key={tile.id}
                  disabled={isChecking}
                  onClick={() => handleWordClick(tile)}
                  role="button"
                  aria-pressed={isSelected}
                  className={`w-full min-h-[64px] p-2 rounded-2xl border-2 text-center transition-all active:scale-95 shadow-xs flex flex-col items-center justify-center cursor-pointer ${tileStyle}`}
                >
                  <span
                    className={`font-black ${
                      isHanzi ? 'text-2xl sm:text-3xl font-hanzi' : 'text-base sm:text-lg font-display'
                    }`}
                  >
                    {tile.text}
                  </span>
                  {showPinyin && tile.phonetic && (
                    <span className="text-[11px] font-mono font-bold text-kawaii-600 dark:text-kawaii-400 mt-0.5">
                      {tile.phonetic}
                    </span>
                  )}
                </button>
              );
            })}
          </div>
        </div>

        {/* CỘT PHẢI: NGHĨA TIẾNG VIỆT */}
        <div className="space-y-2.5">
          <div className="text-center pb-0.5">
            <span className="px-3 py-1 rounded-full bg-purple-100 dark:bg-purple-950/50 text-purple-700 dark:text-purple-300 text-[11px] font-extrabold tracking-wide uppercase">
              💜 Nghĩa Tiếng Việt
            </span>
          </div>

          <div className="space-y-2">
            {meaningTiles.map((tile) => {
              const isSelected = selectedMeaningTileId === tile.id;

              // Trạng thái đã khớp xong
              if (tile.isMatched) {
                return (
                  <div
                    key={tile.id}
                    className="min-h-[64px] p-2.5 rounded-2xl bg-emerald-50 dark:bg-emerald-950/20 border-2 border-emerald-200 dark:border-emerald-900/40 text-emerald-600 dark:text-emerald-400 text-center opacity-40 select-none flex flex-col items-center justify-center transition-all scale-98"
                  >
                    <CheckCircle2 className="w-4 h-4 text-emerald-500" />
                    <span className="text-xs font-bold line-through line-clamp-2">{tile.text}</span>
                  </div>
                );
              }

              // Định kiểu ô đang chọn hoặc sai
              let tileStyle =
                'bg-white dark:bg-dark-card border-purple-200 dark:border-dark-border text-gray-800 dark:text-gray-100 hover:border-purple-400';
              if (tile.isWrong) {
                tileStyle =
                  'bg-red-50 dark:bg-red-950/40 border-red-500 text-red-700 dark:text-red-300 animate-shake';
              } else if (isSelected) {
                tileStyle =
                  'bg-purple-50 dark:bg-dark-bg border-purple-500 text-purple-700 dark:text-purple-300 scale-102 shadow-kawaii ring-2 ring-purple-300';
              }

              return (
                <button
                  key={tile.id}
                  disabled={isChecking}
                  onClick={() => handleMeaningClick(tile)}
                  role="button"
                  aria-pressed={isSelected}
                  className={`w-full min-h-[64px] p-2.5 rounded-2xl border-2 text-center transition-all active:scale-95 shadow-xs flex items-center justify-center cursor-pointer ${tileStyle}`}
                >
                  <span className="text-xs sm:text-sm font-bold leading-snug break-words line-clamp-3">
                    {tile.text}
                  </span>
                </button>
              );
            })}
          </div>
        </div>
      </div>

      {/* 4. MODAL CHIẾN THẮNG HOÀN THÀNH VÁN (VICTORY MODAL) */}
      {isGameCompleted && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-xs animate-fade-in">
          <div
            className="w-full max-w-sm rounded-3xl bg-white dark:bg-dark-card border-2 border-kawaii-300 dark:border-dark-border p-6 shadow-kawaii text-center space-y-4 animate-scale-up"
            role="dialog"
            aria-modal="true"
          >
            {/* Mascot chúc mừng */}
            <div className="w-20 h-20 rounded-3xl bg-gradient-to-tr from-kawaii-100 to-pink-50 dark:from-dark-bg dark:to-dark-card mx-auto flex items-center justify-center text-4xl shadow-xs animate-bounce">
              🎉
            </div>

            <div>
              <span className="text-[11px] font-bold uppercase tracking-wider text-kawaii-600 dark:text-kawaii-400">
                Xuất Sắc!
              </span>
              <h3 className="text-xl font-black font-display text-gray-900 dark:text-white mt-0.5">
                Hoàn Thành Ghép Cặp! 🌸
              </h3>
            </div>

            {/* Bảng tổng kết số liệu */}
            <div className="grid grid-cols-3 gap-2 p-3 rounded-2xl bg-kawaii-50/70 dark:bg-dark-bg border border-kawaii-100 dark:border-dark-border text-center">
              <div>
                <span className="text-[11px] text-gray-400 font-semibold block">Thời gian</span>
                <span className="text-sm font-black text-kawaii-700 dark:text-kawaii-300 font-mono">
                  {formatTimer(timerSeconds)}
                </span>
              </div>
              <div>
                <span className="text-[11px] text-gray-400 font-semibold block">Số lỗi</span>
                <span className="text-sm font-black text-gray-800 dark:text-gray-200">
                  {mistakesCount === 0 ? '✓ 0' : mistakesCount}
                </span>
              </div>
              <div>
                <span className="text-[11px] text-gray-400 font-semibold block">Thưởng</span>
                <span className="text-sm font-black text-emerald-600 dark:text-emerald-400 flex items-center justify-center gap-0.5">
                  <Sparkles className="w-3.5 h-3.5" />+{xpEarned} XP
                </span>
              </div>
            </div>

            {/* Các nút hành động */}
            <div className="space-y-2 pt-2">
              <button
                onClick={() => {
                  if (onNextRound) {
                    onNextRound();
                  } else {
                    initBoard(cardsPool);
                  }
                }}
                className="w-full py-3.5 min-h-[48px] rounded-2xl bg-kawaii-500 hover:bg-kawaii-600 text-white font-extrabold text-xs shadow-kawaii active:scale-95 transition-transform flex items-center justify-center gap-2"
              >
                <RotateCcw className="w-4 h-4" />
                <span>Chơi ván tiếp theo (Từ mới)</span>
              </button>

              <button
                onClick={() => initBoard(cardsPool)}
                className="w-full py-3 min-h-[44px] rounded-2xl bg-purple-50 dark:bg-dark-bg hover:bg-purple-100 dark:hover:bg-dark-cardHover text-purple-700 dark:text-purple-300 font-bold text-xs border border-purple-200 dark:border-purple-900/50 active:scale-95 transition-all"
              >
                Chơi lại ván này
              </button>

              <button
                onClick={onExit}
                className="w-full py-2.5 min-h-[44px] rounded-2xl bg-gray-100 dark:bg-dark-bg hover:bg-gray-200 dark:hover:bg-dark-cardHover text-gray-600 dark:text-gray-300 font-bold text-xs active:scale-95 transition-all"
              >
                Quay lại menu Luyện tập
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
