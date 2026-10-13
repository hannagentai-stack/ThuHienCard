import React, { useState, useEffect, useRef } from 'react';
import confetti from 'canvas-confetti';
import {
  Gamepad2,
  CheckCircle2,
  XCircle,
  Volume2,
  Timer,
  ArrowLeft,
  Flame,
  ArrowLeftRight,
} from 'lucide-react';
import { useDeckStore } from '../stores/deckStore';
import { type Card } from '../types';
import { ttsService } from '../services/ttsService';
import { HanziWriterCanvas } from '../components/cards/HanziWriterCanvas';
import {
  usePracticeCards,
  type PracticeModeType,
  type EligibilityResult,
} from '../hooks/usePracticeCards';
import { PracticeIneligibleModal } from '../components/practice/PracticeIneligibleModal';
import { MatchingGameView } from '../components/practice/MatchingGameView';
import {
  checkVietnameseMeaningMatch,
  checkForeignWordMatch,
} from '../utils/typingMatch';

export type TypingDirection = 'both' | 'foreign_to_vi' | 'vi_to_foreign';

type PracticeMode =
  | 'menu'
  | 'quiz'      // 2. Trắc nghiệm 4 đáp án
  | 'typing'    // 3. Gõ đáp án
  | 'listening' // 4. Luyện nghe
  | 'matching'  // 5. Ghép cặp (Matching Game)
  | 'hanzi'     // 6. Tập viết chữ Hán
  | 'speed'     // 7. Speed Review (60s)
  | 'leech';    // 8. Thẻ khó / hay quên

interface PracticePageProps {
  onStartSRS: () => void;
  onNavigateToDecks?: () => void;
}

const PINYIN_TONES = [
  'ā', 'á', 'ǎ', 'à',
  'ō', 'ó', 'ǒ', 'ò',
  'ē', 'é', 'ě', 'è',
  'ī', 'í', 'ǐ', 'ì',
  'ū', 'ú', 'ǔ', 'ù',
  'ǖ', 'ǘ', 'ǚ', 'ǜ',
];

export const PracticePage: React.FC<PracticePageProps> = ({
  onStartSRS,
  onNavigateToDecks,
}) => {
  const { fetchDecks } = useDeckStore();
  const [selectedDeckId, setSelectedDeckId] = useState<string>('all');
  const [mode, setMode] = useState<PracticeMode>('menu');

  // Unified Hook: Đồng bộ dữ liệu thẻ, kiểm tra điều kiện & sinh đáp án nhiễu
  const {
    isLoading,
    decks,
    scopedCards,
    pools,
    checkEligibility,
    generateQuizDistractors,
  } = usePracticeCards(selectedDeckId);

  // Modal thông báo lý do không đủ điều kiện (Kawaii Dialog thay alert)
  const [modalState, setModalState] = useState<{
    isOpen: boolean;
    modeTitle: string;
    eligibility: EligibilityResult | null;
  }>({
    isOpen: false,
    modeTitle: '',
    eligibility: null,
  });

  // Thẻ cho phiên luyện tập
  const [practiceCards, setPracticeCards] = useState<Card[]>([]);
  const [currentIdx, setCurrentIdx] = useState(0);
  const [score, setScore] = useState(0);

  // Trắc nghiệm & Luyện nghe state
  const [quizOptions, setQuizOptions] = useState<string[]>([]);
  const [selectedAnswer, setSelectedAnswer] = useState<string | null>(null);
  const [isAnswerChecked, setIsAnswerChecked] = useState(false);

  // Gõ từ state
  const [typedInput, setTypedInput] = useState('');
  const [typingResult, setTypingResult] = useState<'correct' | 'wrong' | null>(null);
  const typingInputRef = useRef<HTMLInputElement>(null);

  // Hướng kiểm tra gõ từ 2 chiều: 'both' | 'foreign_to_vi' | 'vi_to_foreign'
  const [typingDirection, setTypingDirection] = useState<TypingDirection>(() => {
    return (localStorage.getItem('practice_typing_direction') as TypingDirection) || 'both';
  });
  const [typingQuestionDirs, setTypingQuestionDirs] = useState<('foreign_to_vi' | 'vi_to_foreign')[]>([]);
  const [showPinyinHint, setShowPinyinHint] = useState(false);

  const handleSetTypingDirection = (dir: TypingDirection) => {
    setTypingDirection(dir);
    localStorage.setItem('practice_typing_direction', dir);
  };

  // Speed review state (60s timer)
  const [timeLeft, setTimeLeft] = useState(60);
  const [isSpeedRunning, setIsSpeedRunning] = useState(false);

  useEffect(() => {
    fetchDecks();
  }, [fetchDecks]);

  // Khởi động chế độ chơi với kiểm tra điều kiện kỹ lưỡng
  const handleStartMode = (
    chosenMode: PracticeModeType,
    modeTitle: string
  ) => {
    // 1. Chế độ SRS chuẩn
    if (chosenMode === 'srs') {
      const eligibility = checkEligibility('srs');
      if (!eligibility.isEligible) {
        setModalState({ isOpen: true, modeTitle, eligibility });
        return;
      }
      onStartSRS();
      return;
    }

    // 2. Các chế độ trò chơi khác
    const eligibility = checkEligibility(chosenMode);
    if (!eligibility.isEligible) {
      setModalState({ isOpen: true, modeTitle, eligibility });
      return;
    }

    // Lấy đúng pool thẻ của chế độ đó
    let cardsToPlay: Card[] = [];
    switch (chosenMode) {
      case 'quiz':
        cardsToPlay = pools.quizCards;
        break;
      case 'typing':
        cardsToPlay = pools.typingCards;
        break;
      case 'listening':
        cardsToPlay = pools.listeningCards;
        break;
      case 'matching':
        cardsToPlay = pools.matchingCards;
        break;
      case 'hanzi':
        cardsToPlay = pools.hanziCards;
        break;
      case 'speed':
        cardsToPlay = pools.speedCards;
        break;
      case 'leech':
        cardsToPlay = pools.leechCards;
        break;
      default:
        cardsToPlay = scopedCards;
    }

    // Xáo trộn ngẫu nhiên danh sách thẻ
    const shuffled = [...cardsToPlay].sort(() => Math.random() - 0.5);
    setPracticeCards(shuffled);
    setCurrentIdx(0);
    setScore(0);
    setMode(chosenMode as PracticeMode);

    if (chosenMode === 'quiz' || chosenMode === 'listening') {
      setupQuizQuestion(shuffled[0], shuffled);
    } else if (chosenMode === 'speed') {
      setTimeLeft(60);
      setIsSpeedRunning(true);
      setupQuizQuestion(shuffled[0], shuffled);
    } else if (chosenMode === 'typing') {
      const dirs = shuffled.map((_, idx) => {
        if (typingDirection === 'foreign_to_vi') return 'foreign_to_vi';
        if (typingDirection === 'vi_to_foreign') return 'vi_to_foreign';
        return idx % 2 === 0 ? 'foreign_to_vi' : 'vi_to_foreign';
      });
      setTypingQuestionDirs(dirs);
      setShowPinyinHint(false);
      setTypedInput('');
      setTypingResult(null);
      setTimeout(() => typingInputRef.current?.focus(), 150);
    }
  };

  // Thiết lập câu hỏi trắc nghiệm (1 đáp án đúng + 3 đáp án nhiễu thông minh, không trùng lặp)
  const setupQuizQuestion = (card: Card, pool: Card[]) => {
    if (!card) return;
    const options = generateQuizDistractors(card, pool);
    setQuizOptions(options);
    setSelectedAnswer(null);
    setIsAnswerChecked(false);

    if (mode === 'listening') {
      const lang =
        card.level?.startsWith('HSK') || (card as any).deckLang === 'zh' ? 'zh' : 'en';
      ttsService.speak(card.front, lang, card.audioUrl);
    }
  };

  // Trắc nghiệm kiểm tra (chống double-click bằng cờ isAnswerChecked)
  const handleSelectQuizAnswer = (ans: string) => {
    if (isAnswerChecked) return;
    setSelectedAnswer(ans);
    setIsAnswerChecked(true);

    const isCorrect = ans === practiceCards[currentIdx]?.back;
    if (isCorrect) {
      setScore((s) => s + 1);
    }

    setTimeout(() => {
      const next = currentIdx + 1;
      if (next < practiceCards.length) {
        setCurrentIdx(next);
        setupQuizQuestion(practiceCards[next], practiceCards);
      } else {
        finishGame();
      }
    }, 1100);
  };

  // Chèn ký tự thanh điệu vào ô gõ
  const handleInsertTone = (tone: string) => {
    setTypedInput((prev) => prev + tone);
    typingInputRef.current?.focus();
  };

  // Kiểm tra gõ đáp án 2 chiều thông minh
  const handleCheckTyping = (e: React.FormEvent) => {
    e.preventDefault();
    const current = practiceCards[currentIdx];
    if (!current) return;

    const currentDir = typingQuestionDirs[currentIdx] || 'foreign_to_vi';
    const lang =
      current.level?.startsWith('HSK') || (current as any).deckLang === 'zh' ? 'zh' : 'en';

    let isCorrect = false;
    if (currentDir === 'foreign_to_vi') {
      // Chiều 1: Hiện tiếng Trung/Anh ➔ Nhập nghĩa tiếng Việt
      isCorrect = checkVietnameseMeaningMatch(typedInput, current.back);
    } else {
      // Chiều 2: Hiện nghĩa tiếng Việt ➔ Nhập tiếng Trung / tiếng Anh
      isCorrect = checkForeignWordMatch(typedInput, current.front, current.phonetic, lang);
    }

    setTypingResult(isCorrect ? 'correct' : 'wrong');
    if (isCorrect) setScore((s) => s + 1);

    // Phát âm từ vựng để hỗ trợ người dùng luyện nghe
    ttsService.speak(current.front, lang, current.audioUrl);

    setTimeout(() => {
      const next = currentIdx + 1;
      if (next < practiceCards.length) {
        setCurrentIdx(next);
        setTypedInput('');
        setTypingResult(null);
        setShowPinyinHint(false);
        typingInputRef.current?.focus();
      } else {
        finishGame();
      }
    }, 1400);
  };

  // Đếm ngược Speed Review (60s)
  useEffect(() => {
    let timer: any;
    if (mode === 'speed' && isSpeedRunning && timeLeft > 0) {
      timer = setInterval(() => setTimeLeft((t) => t - 1), 1000);
    } else if (mode === 'speed' && timeLeft === 0 && isSpeedRunning) {
      setIsSpeedRunning(false);
      finishGame();
    }
    return () => clearInterval(timer);
  }, [mode, isSpeedRunning, timeLeft]);

  const finishGame = () => {
    confetti({ particleCount: 90, spread: 65, origin: { y: 0.6 } });
  };

  // 1. MENU CHÍNH: DANH SÁCH 8 CHẾ ĐỘ LUYỆN TẬP
  if (mode === 'menu') {
    // Tính trạng thái điều kiện của từng chế độ để hiển thị badge
    const elSRS = checkEligibility('srs');
    const elQuiz = checkEligibility('quiz');
    const elTyping = checkEligibility('typing');
    const elListening = checkEligibility('listening');
    const elMatching = checkEligibility('matching');
    const elHanzi = checkEligibility('hanzi');
    const elSpeed = checkEligibility('speed');
    const elLeech = checkEligibility('leech');

    const isChineseDeck =
      selectedDeckId === 'all'
        ? scopedCards.some(
            (c) =>
              (c as any).deckLang === 'zh' ||
              c.level?.startsWith('HSK') ||
              /[\u4e00-\u9fa5]/.test(c.front || '')
          )
        : decks.find((d) => d.id === selectedDeckId)?.language !== 'en';

    return (
      <div className="space-y-6 pb-20 max-w-4xl mx-auto">
        {/* Modal Thông Báo Thân Thiện (Thay Alert) */}
        <PracticeIneligibleModal
          isOpen={modalState.isOpen}
          onClose={() => setModalState((prev) => ({ ...prev, isOpen: false }))}
          modeTitle={modalState.modeTitle}
          eligibility={modalState.eligibility}
          onSelectAllDecks={() => setSelectedDeckId('all')}
          onOpenAddCards={onNavigateToDecks}
        />

        {/* Tiêu đề & Chọn bộ từ */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
          <div>
            <h1 className="text-2xl sm:text-3xl font-display font-extrabold text-gray-900 dark:text-white flex items-center gap-2">
              <Gamepad2 className="w-7 h-7 text-kawaii-500" />
              <span>8 Chế Độ Luyện Tập 🎮</span>
            </h1>
            <p className="text-xs text-gray-500 dark:text-dark-textMuted mt-0.5">
              Học qua trò chơi phản xạ, gõ từ, nghe và tập viết nét ({scopedCards.length} từ khả dụng)
            </p>
          </div>

          {/* Dropdown chọn bộ thẻ có font 16px chống iOS auto-zoom */}
          <div className="flex items-center gap-2">
            <span className="text-xs font-bold text-gray-600 dark:text-gray-300 shrink-0">Bộ thẻ:</span>
            <select
              value={selectedDeckId}
              onChange={(e) => setSelectedDeckId(e.target.value)}
              className="px-3 py-2 min-h-[44px] rounded-2xl bg-white dark:bg-dark-card border border-kawaii-200 dark:border-dark-border text-base sm:text-xs font-bold text-gray-800 dark:text-gray-200 outline-none focus:border-kawaii-500 shadow-xs"
            >
              <option value="all">
                Tất cả bộ thẻ ({decks.reduce((acc, d) => acc + (d.cards?.length || d.stats?.totalCards || 0), 0)} từ)
              </option>
              {decks.map((d) => (
                <option key={d.id} value={d.id}>
                  {d.title} ({d.cards?.length ?? d.stats?.totalCards ?? 0} từ)
                </option>
              ))}
            </select>
          </div>
        </div>

        {/* Loading state trong lúc nạp thẻ chống race-condition */}
        {isLoading && decks.length === 0 && (
          <div className="p-8 rounded-3xl bg-white dark:bg-dark-card border border-kawaii-100 dark:border-dark-border text-center space-y-3">
            <div className="w-8 h-8 border-3 border-kawaii-500 border-t-transparent rounded-full animate-spin mx-auto" />
            <p className="text-xs font-bold text-kawaii-600">Đang chuẩn bị bộ thẻ cho bạn... 🌸</p>
          </div>
        )}

        {/* Lưới 8 Thẻ Chế Độ - Mobile Friendly */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3.5">
          {/* Chế độ 1: SRS Ôn Tập Chuẩn */}
          <div
            onClick={() => handleStartMode('srs', '1. Ôn Tập Chuẩn FSRS')}
            className={`p-4 sm:p-5 rounded-3xl bg-gradient-to-br from-pink-50 to-white dark:from-dark-card dark:to-dark-cardHover border-2 border-kawaii-300 dark:border-dark-border shadow-xs hover:shadow-kawaii cursor-pointer btn-bounce flex flex-col justify-between space-y-3 transition-all ${
              !elSRS.isEligible ? 'opacity-85' : ''
            }`}
          >
            <div>
              <div className="flex items-center justify-between">
                <span className="text-2xl sm:text-3xl">🌸</span>
                <div className="flex items-center gap-1">
                  <span className="px-2 py-0.5 rounded-full bg-kawaii-500 text-white text-[10px] font-bold">
                    Khuyên dùng
                  </span>
                  <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                    elSRS.isEligible
                      ? 'bg-emerald-100 text-emerald-700 dark:bg-emerald-950/50 dark:text-emerald-300'
                      : 'bg-gray-100 text-gray-600 dark:bg-gray-800 dark:text-gray-300'
                  }`}>
                    {elSRS.currentCount} đến hạn
                  </span>
                </div>
              </div>
              <h3 className="font-extrabold text-base font-display text-gray-900 dark:text-white mt-2">
                1. Ôn Tập Chuẩn FSRS
              </h3>
              <p className="text-xs text-gray-500 dark:text-dark-textMuted mt-1 leading-relaxed">
                Thuật toán lặp lại ngắt quãng khoa học: Lại, Khó, Tốt, Dễ.
              </p>
            </div>
            <span className="text-xs font-bold text-kawaii-600 dark:text-kawaii-400">
              {elSRS.isEligible ? 'Vào học ngay →' : 'Đã học xong hôm nay 🌸'}
            </span>
          </div>

          {/* Chế độ 2: Trắc Nghiệm 4 Đáp Án */}
          <div
            onClick={() => handleStartMode('quiz', '2. Trắc Nghiệm 4 Đáp Án')}
            className={`p-4 sm:p-5 rounded-3xl bg-white dark:bg-dark-card border-2 border-kawaii-200 dark:border-dark-border hover:border-kawaii-400 shadow-xs hover:shadow-kawaii cursor-pointer btn-bounce flex flex-col justify-between space-y-3 transition-all ${
              !elQuiz.isEligible ? 'opacity-85' : ''
            }`}
          >
            <div>
              <div className="flex items-center justify-between">
                <span className="text-2xl sm:text-3xl">🎯</span>
                <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                  elQuiz.isEligible
                    ? 'bg-emerald-100 text-emerald-700 dark:bg-emerald-950/50 dark:text-emerald-300'
                    : 'bg-amber-100 text-amber-700 dark:bg-amber-950/50 dark:text-amber-300'
                }`}>
                  {elQuiz.isEligible ? `${elQuiz.currentCount} từ sẵn sàng` : `Cần ≥4 từ (${elQuiz.currentCount}/4)`}
                </span>
              </div>
              <h3 className="font-extrabold text-base font-display text-gray-900 dark:text-white mt-2">
                2. Trắc Nghiệm 4 Đáp Án
              </h3>
              <p className="text-xs text-gray-500 dark:text-dark-textMuted mt-1 leading-relaxed">
                Nhìn từ vựng và chọn 1 trong 4 nghĩa tiếng Việt nhanh nhất.
              </p>
            </div>
            <span className="text-xs font-bold text-kawaii-600 dark:text-kawaii-400">
              {elQuiz.isEligible ? 'Chơi ngay →' : 'Xem điều kiện →'}
            </span>
          </div>

          {/* Chế độ 3: Kiểm Tra Nhập Từ 2 Chiều */}
          <div
            className={`p-4 sm:p-5 rounded-3xl bg-white dark:bg-dark-card border-2 border-kawaii-200 dark:border-dark-border hover:border-kawaii-400 shadow-xs hover:shadow-kawaii flex flex-col justify-between space-y-3 transition-all ${
              !elTyping.isEligible ? 'opacity-85' : ''
            }`}
          >
            <div>
              <div className="flex items-center justify-between">
                <span className="text-2xl sm:text-3xl">⌨️</span>
                <span
                  className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                    elTyping.isEligible
                      ? 'bg-emerald-100 text-emerald-700 dark:bg-emerald-950/50 dark:text-emerald-300'
                      : 'bg-amber-100 text-amber-700 dark:bg-amber-950/50 dark:text-amber-300'
                  }`}
                >
                  {elTyping.isEligible ? `${elTyping.currentCount} từ` : 'Cần có thẻ'}
                </span>
              </div>
              <h3 className="font-extrabold text-base font-display text-gray-900 dark:text-white mt-2">
                3. Kiểm Tra Nhập Từ (2 Chiều)
              </h3>
              <p className="text-xs text-gray-500 dark:text-dark-textMuted mt-1 leading-relaxed">
                {isChineseDeck
                  ? 'Hiện tiếng Trung ➔ Gõ nghĩa tiếng Việt hoặc Hiện nghĩa ➔ Gõ chữ Hán/Pinyin.'
                  : 'Hiện tiếng Anh ➔ Gõ nghĩa tiếng Việt hoặc Hiện nghĩa ➔ Gõ từ tiếng Anh.'}
              </p>

              {/* Bộ chọn hướng kiểm tra nhanh */}
              <div className="mt-3 pt-2.5 border-t border-kawaii-100 dark:border-dark-border/60">
                <span className="text-[11px] font-bold text-gray-400 block mb-1.5">
                  Hướng kiểm tra:
                </span>
                <div className="grid grid-cols-3 gap-1 bg-gray-100/70 dark:bg-dark-bg p-1 rounded-2xl">
                  <button
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation();
                      handleSetTypingDirection('both');
                    }}
                    className={`py-1.5 px-1 rounded-xl text-[10px] font-bold transition-all text-center ${
                      typingDirection === 'both'
                        ? 'bg-white dark:bg-dark-card text-kawaii-600 dark:text-kawaii-400 shadow-xs'
                        : 'text-gray-500 dark:text-gray-400 hover:text-gray-700'
                    }`}
                    title="Đan xen ngẫu nhiên cả hai chiều"
                  >
                    🔄 Cả 2 chiều
                  </button>
                  <button
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation();
                      handleSetTypingDirection('foreign_to_vi');
                    }}
                    className={`py-1.5 px-1 rounded-xl text-[10px] font-bold transition-all text-center ${
                      typingDirection === 'foreign_to_vi'
                        ? 'bg-white dark:bg-dark-card text-kawaii-600 dark:text-kawaii-400 shadow-xs'
                        : 'text-gray-500 dark:text-gray-400 hover:text-gray-700'
                    }`}
                    title={
                      isChineseDeck
                        ? 'Hiện tiếng Trung ➔ Nhập nghĩa tiếng Việt'
                        : 'Hiện tiếng Anh ➔ Nhập nghĩa tiếng Việt'
                    }
                  >
                    {isChineseDeck ? '🇨🇳 ➔ 🇻🇳' : '🇬🇧 ➔ 🇻🇳'} Sang Việt
                  </button>
                  <button
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation();
                      handleSetTypingDirection('vi_to_foreign');
                    }}
                    className={`py-1.5 px-1 rounded-xl text-[10px] font-bold transition-all text-center ${
                      typingDirection === 'vi_to_foreign'
                        ? 'bg-white dark:bg-dark-card text-kawaii-600 dark:text-kawaii-400 shadow-xs'
                        : 'text-gray-500 dark:text-gray-400 hover:text-gray-700'
                    }`}
                    title={
                      isChineseDeck
                        ? 'Hiện nghĩa tiếng Việt ➔ Nhập chữ Hán/Pinyin'
                        : 'Hiện nghĩa tiếng Việt ➔ Nhập từ tiếng Anh'
                    }
                  >
                    {isChineseDeck ? '🇻🇳 ➔ 🇨🇳' : '🇻🇳 ➔ 🇬🇧'} Sang{' '}
                    {isChineseDeck ? 'Trung' : 'Anh'}
                  </button>
                </div>
              </div>
            </div>

            <button
              type="button"
              onClick={() => handleStartMode('typing', '3. Kiểm Tra Nhập Từ (2 Chiều)')}
              className="w-full text-xs font-bold text-kawaii-600 dark:text-kawaii-400 text-left pt-1 flex items-center justify-between"
            >
              <span>{elTyping.isEligible ? 'Bắt đầu kiểm tra →' : 'Xem điều kiện →'}</span>
              <span className="text-[10px] text-gray-400 font-normal">
                {typingDirection === 'both'
                  ? 'Cả 2 chiều'
                  : typingDirection === 'foreign_to_vi'
                    ? 'Sang Tiếng Việt'
                    : 'Sang Ngoại ngữ'}
              </span>
            </button>
          </div>

          {/* Chế độ 4: Luyện Nghe TTS */}
          <div
            onClick={() => handleStartMode('listening', '4. Luyện Nghe & Đoán Từ')}
            className={`p-4 sm:p-5 rounded-3xl bg-white dark:bg-dark-card border-2 border-kawaii-200 dark:border-dark-border hover:border-kawaii-400 shadow-xs hover:shadow-kawaii cursor-pointer btn-bounce flex flex-col justify-between space-y-3 transition-all ${
              !elListening.isEligible ? 'opacity-85' : ''
            }`}
          >
            <div>
              <div className="flex items-center justify-between">
                <span className="text-2xl sm:text-3xl">🎧</span>
                <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                  elListening.isEligible
                    ? 'bg-emerald-100 text-emerald-700 dark:bg-emerald-950/50 dark:text-emerald-300'
                    : 'bg-amber-100 text-amber-700 dark:bg-amber-950/50 dark:text-amber-300'
                }`}>
                  {elListening.isEligible ? `${elListening.currentCount} từ` : `Cần ≥4 từ (${elListening.currentCount}/4)`}
                </span>
              </div>
              <h3 className="font-extrabold text-base font-display text-gray-900 dark:text-white mt-2">
                4. Luyện Nghe & Đoán Từ
              </h3>
              <p className="text-xs text-gray-500 dark:text-dark-textMuted mt-1 leading-relaxed">
                Nghe giọng chuẩn bản xứ rồi chọn nghĩa đúng mà không nhìn chữ trước.
              </p>
            </div>
            <span className="text-xs font-bold text-kawaii-600 dark:text-kawaii-400">
              {elListening.isEligible ? 'Chơi ngay →' : 'Xem điều kiện →'}
            </span>
          </div>

          {/* Chế độ 5: Ghép Cặp (Matching Game) */}
          <div
            onClick={() => handleStartMode('matching', '5. Ghép Cặp Từ & Nghĩa')}
            className={`p-4 sm:p-5 rounded-3xl bg-white dark:bg-dark-card border-2 border-kawaii-200 dark:border-dark-border hover:border-kawaii-400 shadow-xs hover:shadow-kawaii cursor-pointer btn-bounce flex flex-col justify-between space-y-3 transition-all ${
              !elMatching.isEligible ? 'opacity-85' : ''
            }`}
          >
            <div>
              <div className="flex items-center justify-between">
                <span className="text-2xl sm:text-3xl">🧩</span>
                <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                  elMatching.isEligible
                    ? 'bg-emerald-100 text-emerald-700 dark:bg-emerald-950/50 dark:text-emerald-300'
                    : 'bg-amber-100 text-amber-700 dark:bg-amber-950/50 dark:text-amber-300'
                }`}>
                  {elMatching.isEligible ? `${elMatching.currentCount} từ khả dụng` : `Cần ≥4 từ (${elMatching.currentCount}/4)`}
                </span>
              </div>
              <h3 className="font-extrabold text-base font-display text-gray-900 dark:text-white mt-2">
                5. Ghép Cặp Từ & Nghĩa
              </h3>
              <p className="text-xs text-gray-500 dark:text-dark-textMuted mt-1 leading-relaxed">
                Lật mở các ô tương ứng giữa Từ vựng và Nghĩa tiếng Việt.
              </p>
            </div>
            <span className="text-xs font-bold text-kawaii-600 dark:text-kawaii-400">
              {elMatching.isEligible ? 'Chơi ngay →' : 'Xem điều kiện →'}
            </span>
          </div>

          {/* Chế độ 6: Tập Viết Chữ Hán */}
          <div
            onClick={() => handleStartMode('hanzi', '6. Tập Viết Chữ Hán')}
            className={`p-4 sm:p-5 rounded-3xl bg-white dark:bg-dark-card border-2 border-kawaii-200 dark:border-dark-border hover:border-kawaii-400 shadow-xs hover:shadow-kawaii cursor-pointer btn-bounce flex flex-col justify-between space-y-3 transition-all ${
              !elHanzi.isEligible ? 'opacity-85' : ''
            }`}
          >
            <div>
              <div className="flex items-center justify-between">
                <span className="text-2xl sm:text-3xl">✍️</span>
                <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                  elHanzi.isEligible
                    ? 'bg-emerald-100 text-emerald-700 dark:bg-emerald-950/50 dark:text-emerald-300'
                    : 'bg-purple-100 text-purple-700 dark:bg-purple-950/50 dark:text-purple-300'
                }`}>
                  {elHanzi.isEligible ? `${elHanzi.currentCount} chữ Hán` : 'Chỉ tiếng Trung 🇨🇳'}
                </span>
              </div>
              <h3 className="font-extrabold text-base font-display text-gray-900 dark:text-white mt-2">
                6. Tập Viết Chữ Hán
              </h3>
              <p className="text-xs text-gray-500 dark:text-dark-textMuted mt-1 leading-relaxed">
                Hanzi Writer hướng dẫn nét viết và chấm điểm viết tay từng nét.
              </p>
            </div>
            <span className="text-xs font-bold text-kawaii-600 dark:text-kawaii-400">
              {elHanzi.isEligible ? 'Chơi ngay →' : 'Xem điều kiện →'}
            </span>
          </div>

          {/* Chế độ 7: Speed Review (60 Giây) */}
          <div
            onClick={() => handleStartMode('speed', '7. Thử Thách 60 Giây')}
            className={`p-4 sm:p-5 rounded-3xl bg-white dark:bg-dark-card border-2 border-kawaii-200 dark:border-dark-border hover:border-kawaii-400 shadow-xs hover:shadow-kawaii cursor-pointer btn-bounce flex flex-col justify-between space-y-3 transition-all ${
              !elSpeed.isEligible ? 'opacity-85' : ''
            }`}
          >
            <div>
              <div className="flex items-center justify-between">
                <span className="text-2xl sm:text-3xl">⚡</span>
                <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                  elSpeed.isEligible
                    ? 'bg-emerald-100 text-emerald-700 dark:bg-emerald-950/50 dark:text-emerald-300'
                    : 'bg-amber-100 text-amber-700 dark:bg-amber-950/50 dark:text-amber-300'
                }`}>
                  {elSpeed.isEligible ? `${elSpeed.currentCount} từ` : `Cần ≥4 từ (${elSpeed.currentCount}/4)`}
                </span>
              </div>
              <h3 className="font-extrabold text-base font-display text-gray-900 dark:text-white mt-2">
                7. Thử Thách 60 Giây
              </h3>
              <p className="text-xs text-gray-500 dark:text-dark-textMuted mt-1 leading-relaxed">
                Đếm ngược 60 giây, trả lời nhanh càng nhiều từ vựng càng tốt!
              </p>
            </div>
            <span className="text-xs font-bold text-kawaii-600 dark:text-kawaii-400">
              {elSpeed.isEligible ? 'Chơi ngay →' : 'Xem điều kiện →'}
            </span>
          </div>

          {/* Chế độ 8: Ôn Thẻ Khó (Leech Review) */}
          <div
            onClick={() => handleStartMode('leech', '8. Luyện Thẻ Khó / Hay Quên')}
            className="p-4 sm:p-5 rounded-3xl bg-white dark:bg-dark-card border-2 border-kawaii-200 dark:border-dark-border hover:border-kawaii-400 shadow-xs hover:shadow-kawaii cursor-pointer btn-bounce flex flex-col justify-between space-y-3 transition-all"
          >
            <div>
              <div className="flex items-center justify-between">
                <span className="text-2xl sm:text-3xl">🔥</span>
                <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                  elLeech.isEligible
                    ? 'bg-red-100 text-red-700 dark:bg-red-950/50 dark:text-red-300'
                    : 'bg-gray-100 text-gray-600 dark:bg-gray-800 dark:text-gray-300'
                }`}>
                  {elLeech.isEligible ? `${elLeech.currentCount} thẻ khó` : 'Chưa có thẻ khó'}
                </span>
              </div>
              <h3 className="font-extrabold text-base font-display text-gray-900 dark:text-white mt-2">
                8. Luyện Thẻ Khó / Hay Quên
              </h3>
              <p className="text-xs text-gray-500 dark:text-dark-textMuted mt-1 leading-relaxed">
                Tập trung đặc biệt vào các thẻ bạn hay quên để ghi nhớ sâu.
              </p>
            </div>
            <span className="text-xs font-bold text-kawaii-600 dark:text-kawaii-400">
              {elLeech.isEligible ? 'Chơi ngay →' : 'Xem chi tiết →'}
            </span>
          </div>
        </div>
      </div>
    );
  }

  // 2. MÀN HÌNH CHƠI: TRẮC NGHIỆM & LUYỆN NGHE & SPEED REVIEW (1 CỘT DỌC CHUẨN NGÓN CÁI)
  if (mode === 'quiz' || mode === 'listening' || mode === 'speed') {
    const currentCard = practiceCards[currentIdx];
    return (
      <div className="max-w-md mx-auto space-y-4 pb-20 select-none">
        {/* Thanh điều hướng quay lại & điểm số */}
        <div className="flex items-center justify-between">
          <button
            onClick={() => setMode('menu')}
            className="min-h-[44px] px-3 py-1.5 rounded-2xl bg-white dark:bg-dark-card border border-kawaii-100 dark:border-dark-border text-xs font-bold flex items-center gap-1 active:scale-95 shadow-xs"
          >
            <ArrowLeft className="w-4 h-4" /> Quay lại
          </button>

          {mode === 'speed' ? (
            <div className="flex items-center gap-1.5 px-3 py-1 rounded-full bg-orange-100 text-orange-600 font-black text-xs">
              <Timer className="w-4 h-4 animate-spin" />
              <span>{timeLeft}s</span>
            </div>
          ) : (
            <span className="text-xs font-bold text-kawaii-600 dark:text-kawaii-400">
              Câu {currentIdx + 1} / {practiceCards.length}
            </span>
          )}

          <div className="text-xs font-black text-purple-600 dark:text-purple-400">
            Điểm: {score}
          </div>
        </div>

        {/* Khối đề bài câu hỏi */}
        <div className="p-6 rounded-3xl bg-white dark:bg-dark-card border-2 border-kawaii-200 dark:border-dark-border shadow-kawaii text-center space-y-3">
          {mode === 'listening' ? (
            <div className="py-4 space-y-2">
              <span className="text-xs font-bold text-gray-400">Nghe và chọn nghĩa đúng:</span>
              <div>
                <button
                  onClick={() => {
                    const lang =
                      currentCard?.level?.startsWith('HSK') || (currentCard as any)?.deckLang === 'zh'
                        ? 'zh'
                        : 'en';
                    ttsService.speak(currentCard?.front || '', lang, currentCard?.audioUrl);
                  }}
                  className="w-16 h-16 rounded-full bg-kawaii-500 text-white shadow-kawaii flex items-center justify-center mx-auto active:scale-90 transition-transform"
                  aria-label="Phát lại âm thanh"
                >
                  <Volume2 className="w-8 h-8" />
                </button>
              </div>
              <p className="text-[11px] text-gray-400">Chạm để nghe lại</p>
            </div>
          ) : (
            <div>
              <span className="text-xs font-bold text-gray-400">Nghĩa của từ này là gì?</span>
              <h2 className="text-3xl sm:text-4xl font-black text-gray-900 dark:text-white font-hanzi mt-1">
                {currentCard?.front}
              </h2>
              {currentCard?.phonetic && (
                <p className="text-xs font-bold text-kawaii-600 dark:text-kawaii-400 font-mono mt-1">
                  {currentCard.phonetic}
                </p>
              )}
            </div>
          )}
        </div>

        {/* 4 Đáp án dạng nút lớn xếp dọc - Chống bấm đúp nhầm */}
        <div className="space-y-2.5 pt-1">
          {quizOptions.map((opt, idx) => {
            const isSelected = selectedAnswer === opt;
            const isCorrect = opt === currentCard?.back;

            let btnStyle =
              'border-kawaii-200 dark:border-dark-border bg-white dark:bg-dark-card text-gray-800 dark:text-gray-100';
            if (isAnswerChecked) {
              if (isCorrect) {
                btnStyle =
                  'border-emerald-500 bg-emerald-50 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-300 font-bold';
              } else if (isSelected) {
                btnStyle =
                  'border-red-500 bg-red-50 dark:bg-red-950/40 text-red-700 dark:text-red-300';
              } else {
                btnStyle = 'opacity-40 border-gray-200 bg-gray-50';
              }
            }

            return (
              <button
                key={idx}
                disabled={isAnswerChecked}
                onClick={() => handleSelectQuizAnswer(opt)}
                className={`w-full min-h-[54px] p-3.5 rounded-2xl border-2 text-sm font-bold text-left transition-all active:scale-95 shadow-xs flex items-center justify-between ${btnStyle}`}
              >
                <span className="flex-1 pr-2">{opt}</span>
                {isAnswerChecked && isCorrect && (
                  <CheckCircle2 className="w-5 h-5 text-emerald-500 shrink-0" />
                )}
                {isAnswerChecked && isSelected && !isCorrect && (
                  <XCircle className="w-5 h-5 text-red-500 shrink-0" />
                )}
              </button>
            );
          })}
        </div>
      </div>
    );
  }

  // 3. MÀN HÌNH CHƠI: KIỂM TRA NHẬP TỪ 2 CHIỀU
  if (mode === 'typing') {
    const currentCard = practiceCards[currentIdx];
    const currentDir = typingQuestionDirs[currentIdx] || 'foreign_to_vi';
    const cardLang =
      currentCard?.level?.startsWith('HSK') || (currentCard as any)?.deckLang === 'zh'
        ? 'zh'
        : 'en';
    const isChinese = cardLang === 'zh';

    return (
      <div className="max-w-md mx-auto space-y-4 pb-20 select-none">
        {/* Thanh header điều hướng & đổi chiều */}
        <div className="flex items-center justify-between gap-1.5">
          <button
            onClick={() => setMode('menu')}
            className="min-h-[44px] px-3 py-1.5 rounded-2xl bg-white dark:bg-dark-card border border-kawaii-100 dark:border-dark-border text-xs font-bold flex items-center gap-1 active:scale-95 shadow-xs shrink-0"
          >
            <ArrowLeft className="w-4 h-4" /> Quay lại
          </button>

          {/* Badge chiều câu hỏi kèm nút bấm đổi chiều */}
          <button
            type="button"
            onClick={() => {
              const newDirs = [...typingQuestionDirs];
              newDirs[currentIdx] =
                currentDir === 'foreign_to_vi' ? 'vi_to_foreign' : 'foreign_to_vi';
              setTypingQuestionDirs(newDirs);
              setTypedInput('');
              setTypingResult(null);
              setShowPinyinHint(false);
              typingInputRef.current?.focus();
            }}
            className={`min-h-[36px] px-3 py-1 rounded-full text-[11px] font-extrabold flex items-center gap-1.5 transition-all active:scale-95 shadow-xs border ${
              currentDir === 'foreign_to_vi'
                ? 'bg-pink-50 text-pink-700 border-pink-200 dark:bg-pink-950/40 dark:text-pink-300 dark:border-pink-900'
                : 'bg-sky-50 text-sky-700 border-sky-200 dark:bg-sky-950/40 dark:text-sky-300 dark:border-sky-900'
            }`}
            title="Nhấn để đổi chiều câu hỏi này"
          >
            <span>
              {currentDir === 'foreign_to_vi'
                ? isChinese
                  ? '🇨🇳 ➔ 🇻🇳 Nhập Tiếng Việt'
                  : '🇬🇧 ➔ 🇻🇳 Nhập Tiếng Việt'
                : isChinese
                  ? '🇻🇳 ➔ 🇨🇳 Nhập Tiếng Trung'
                  : '🇻🇳 ➔ 🇬🇧 Nhập Tiếng Anh'}
            </span>
            <ArrowLeftRight className="w-3 h-3 opacity-70 shrink-0" />
          </button>

          <span className="text-xs font-black text-purple-600 dark:text-purple-400 shrink-0">
            Điểm: {score}
          </span>
        </div>

        {/* Tiến độ câu */}
        <div className="flex items-center justify-between text-xs px-1 text-gray-500 font-bold">
          <span>
            Từ {currentIdx + 1} / {practiceCards.length}
          </span>
          <span className="text-[11px] text-gray-400 font-normal">
            {currentDir === 'foreign_to_vi'
              ? 'Hiện ngoại ngữ ➔ Gõ nghĩa tiếng Việt'
              : isChinese
                ? 'Hiện nghĩa ➔ Gõ chữ Hán hoặc Pinyin'
                : 'Hiện nghĩa ➔ Gõ từ tiếng Anh'}
          </span>
        </div>

        {/* Khối thẻ câu hỏi */}
        <div className="p-6 rounded-3xl bg-white dark:bg-dark-card border-2 border-kawaii-200 dark:border-dark-border shadow-kawaii text-center space-y-3">
          {currentDir === 'foreign_to_vi' ? (
            /* CHIỀU 1: HIỆN TIẾNG TRUNG/NGOẠI NGỮ ➔ NHẬP NGHĨA TIẾNG VIỆT */
            <div className="space-y-2">
              <span className="text-xs font-bold text-gray-400">
                Nghĩa tiếng Việt của {isChinese ? 'từ tiếng Trung' : 'từ tiếng Anh'} này là gì?
              </span>

              <div className="flex items-center justify-center gap-2 py-1">
                <h2 className="text-3xl sm:text-5xl font-black text-gray-900 dark:text-white font-hanzi">
                  {currentCard?.front}
                </h2>
                <button
                  type="button"
                  onClick={() =>
                    ttsService.speak(
                      currentCard?.front || '',
                      cardLang,
                      currentCard?.audioUrl
                    )
                  }
                  className="p-2.5 rounded-full bg-kawaii-100 hover:bg-kawaii-200 text-kawaii-600 dark:bg-dark-bg dark:text-kawaii-300 active:scale-90 transition-transform shadow-xs"
                  aria-label="Nghe phát âm"
                  title="Nghe phát âm chuẩn"
                >
                  <Volume2 className="w-5 h-5" />
                </button>
              </div>

              {/* Gợi ý Pinyin nếu là tiếng Trung */}
              {isChinese && currentCard?.phonetic && (
                <div className="pt-0.5">
                  {showPinyinHint ? (
                    <span className="inline-block px-3 py-1 rounded-full text-xs font-mono font-bold bg-purple-50 text-purple-700 dark:bg-purple-950/40 dark:text-purple-300 border border-purple-200">
                      Pinyin: {currentCard.phonetic}
                    </span>
                  ) : (
                    <button
                      type="button"
                      onClick={() => setShowPinyinHint(true)}
                      className="text-[11px] font-bold text-kawaii-600 dark:text-kawaii-400 hover:underline active:scale-95"
                    >
                      💡 Xem gợi ý Pinyin
                    </button>
                  )}
                </div>
              )}

              {currentCard?.example && (
                <p className="text-xs text-gray-500 dark:text-dark-textMuted italic pt-1">
                  "{currentCard.example}"
                </p>
              )}
            </div>
          ) : (
            /* CHIỀU 2: HIỆN NGHĨA TIẾNG VIỆT ➔ NHẬP TIẾNG TRUNG/NGOẠI NGỮ */
            <div className="space-y-2">
              <span className="text-xs font-bold text-gray-400">
                Gõ {isChinese ? 'chữ Hán hoặc Pinyin' : 'từ tiếng Anh'} tương ứng với nghĩa:
              </span>
              <h2 className="text-2xl sm:text-3xl font-extrabold text-gray-900 dark:text-white font-display">
                {currentCard?.back}
              </h2>
              {currentCard?.example && (
                <p className="text-xs text-gray-500 dark:text-dark-textMuted italic">
                  "{currentCard.exampleTrans || currentCard.example}"
                </p>
              )}

              {/* Thanh phím nhanh chọn ký tự thanh điệu Pinyin trên điện thoại */}
              {isChinese && (
                <div className="pt-2">
                  <span className="text-[11px] font-semibold text-gray-400 block mb-1">
                    Phím thanh điệu Pinyin:
                  </span>
                  <div className="flex gap-1 overflow-x-auto pb-1.5 no-scrollbar">
                    {PINYIN_TONES.map((tone) => (
                      <button
                        key={tone}
                        type="button"
                        onClick={() => handleInsertTone(tone)}
                        className="min-w-[34px] h-9 px-1.5 rounded-xl bg-kawaii-50 dark:bg-dark-bg border border-kawaii-200 dark:border-dark-border text-kawaii-700 dark:text-kawaii-300 font-bold text-xs active:scale-90 shrink-0"
                      >
                        {tone}
                      </button>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}

          {/* Form nhập đáp án */}
          <form onSubmit={handleCheckTyping} className="pt-2 space-y-3">
            <input
              ref={typingInputRef}
              type="text"
              autoCapitalize="none"
              autoCorrect="off"
              spellCheck="false"
              enterKeyHint="done"
              value={typedInput}
              onChange={(e) => setTypedInput(e.target.value)}
              placeholder={
                currentDir === 'foreign_to_vi'
                  ? 'Gõ nghĩa tiếng Việt (vd: xin chào, cảm ơn...)'
                  : isChinese
                    ? 'Gõ chữ Hán hoặc Pinyin...'
                    : 'Gõ từ tiếng Anh...'
              }
              className="w-full p-3.5 rounded-2xl bg-gray-50 dark:bg-dark-bg border-2 border-kawaii-300 dark:border-dark-border text-center text-base sm:text-lg font-bold outline-none focus:border-kawaii-500 dark:text-white shadow-inner"
            />

            <button
              type="submit"
              className="w-full py-3.5 min-h-[48px] rounded-2xl bg-kawaii-500 hover:bg-kawaii-600 text-white font-bold text-sm shadow-kawaii active:scale-95 transition-transform"
            >
              Kiểm tra đáp án
            </button>
          </form>

          {/* Phản hồi kết quả thông minh */}
          {typingResult && (
            <div
              className={`p-3.5 rounded-2xl text-xs font-bold animate-fade-in ${
                typingResult === 'correct'
                  ? 'bg-emerald-50 text-emerald-700 border border-emerald-200 dark:bg-emerald-950/40 dark:text-emerald-300 dark:border-emerald-800'
                  : 'bg-red-50 text-red-700 border border-red-200 dark:bg-red-950/40 dark:text-red-300 dark:border-red-800'
              }`}
            >
              {typingResult === 'correct' ? (
                <div>
                  <p className="text-sm">🎉 Chính xác tuyệt vời!</p>
                  <p className="text-xs font-normal mt-0.5 opacity-90">
                    {currentDir === 'foreign_to_vi' ? (
                      <>
                        Nghĩa chuẩn: <strong>{currentCard?.back}</strong> ({currentCard?.front}{' '}
                        {currentCard?.phonetic && `- ${currentCard?.phonetic}`})
                      </>
                    ) : (
                      <>
                        Từ vựng: <strong>{currentCard?.front}</strong>{' '}
                        {currentCard?.phonetic && `(${currentCard?.phonetic})`} • Nghĩa:{' '}
                        {currentCard?.back}
                      </>
                    )}
                  </p>
                </div>
              ) : (
                <div>
                  <p className="text-sm">❌ Chưa đúng rồi!</p>
                  <p className="text-xs font-normal mt-0.5 opacity-90">
                    {currentDir === 'foreign_to_vi' ? (
                      <>
                        Đáp án đúng: <strong>{currentCard?.back}</strong>
                      </>
                    ) : (
                      <>
                        Đáp án đúng: <strong>{currentCard?.front}</strong>{' '}
                        {currentCard?.phonetic && `(${currentCard?.phonetic})`}
                      </>
                    )}
                  </p>
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    );
  }

  // 4. MÀN HÌNH CHƠI: GHÉP CẶP (MATCHING GAME - 2 CỘT TÁCH BẠCH CHUYÊN NGHIỆP)
  if (mode === 'matching') {
    return (
      <MatchingGameView
        cardsPool={pools.matchingCards}
        onExit={() => setMode('menu')}
        onNextRound={() => {
          // Xáo trộn và đổi bộ nếu muốn
          const reshuffled = [...pools.matchingCards].sort(() => Math.random() - 0.5);
          setPracticeCards(reshuffled);
        }}
      />
    );
  }

  // 5. MÀN HÌNH CHƠI: TẬP VIẾT CHỮ HÁN THEO NÉT
  if (mode === 'hanzi') {
    const currentCard = practiceCards[currentIdx];
    return (
      <div className="max-w-md mx-auto space-y-4 pb-20 select-none">
        <div className="flex items-center justify-between">
          <button
            onClick={() => setMode('menu')}
            className="min-h-[44px] px-3 py-1.5 rounded-2xl bg-white dark:bg-dark-card border border-kawaii-100 text-xs font-bold flex items-center gap-1 active:scale-95 shadow-xs"
          >
            <ArrowLeft className="w-4 h-4" /> Quay lại
          </button>
          <span className="text-xs font-bold text-kawaii-600 dark:text-kawaii-400">
            Từ {currentIdx + 1} / {practiceCards.length}
          </span>
        </div>

        <div className="p-5 rounded-3xl bg-white dark:bg-dark-card border-2 border-kawaii-200 dark:border-dark-border shadow-kawaii text-center space-y-3">
          <div>
            <h3 className="text-2xl font-black text-gray-900 dark:text-white font-hanzi">
              {currentCard?.front}
            </h3>
            <p className="text-xs font-bold text-kawaii-600 font-mono">{currentCard?.phonetic}</p>
            <p className="text-xs text-gray-500 mt-0.5">Nghĩa: {currentCard?.back}</p>
          </div>

          <HanziWriterCanvas characters={currentCard?.front || ''} size={180} />

          <div className="flex justify-between gap-2 pt-2">
            <button
              onClick={() => setCurrentIdx((i) => Math.max(0, i - 1))}
              disabled={currentIdx === 0}
              className="px-4 py-2.5 min-h-[44px] rounded-xl bg-gray-100 dark:bg-dark-bg text-xs font-bold disabled:opacity-30 active:scale-95"
            >
              Từ trước
            </button>
            <button
              onClick={() => setCurrentIdx((i) => Math.min(practiceCards.length - 1, i + 1))}
              disabled={currentIdx >= practiceCards.length - 1}
              className="px-4 py-2.5 min-h-[44px] rounded-xl bg-kawaii-500 text-white text-xs font-bold disabled:opacity-30 active:scale-95 shadow-kawaii"
            >
              Từ tiếp theo
            </button>
          </div>
        </div>
      </div>
    );
  }

  // 6. MÀN HÌNH CHƠI: ÔN THẺ KHÓ (LEECH REVIEW)
  if (mode === 'leech') {
    const currentCard = practiceCards[currentIdx];
    return (
      <div className="max-w-md mx-auto space-y-4 pb-20 select-none">
        <div className="flex items-center justify-between">
          <button
            onClick={() => setMode('menu')}
            className="min-h-[44px] px-3 py-1.5 rounded-2xl bg-white dark:bg-dark-card border border-kawaii-100 text-xs font-bold flex items-center gap-1 active:scale-95 shadow-xs"
          >
            <ArrowLeft className="w-4 h-4" /> Quay lại
          </button>
          <span className="text-xs font-bold text-red-500 flex items-center gap-1">
            <Flame className="w-3.5 h-3.5 fill-red-500" /> Thẻ khó: {currentIdx + 1}/{practiceCards.length}
          </span>
        </div>

        <div className="p-6 rounded-3xl bg-red-50/50 dark:bg-dark-card border-2 border-red-200 dark:border-red-900/50 shadow-kawaii text-center space-y-3.5">
          <span className="text-xs font-bold text-red-500">
            ⚠️ Thẻ này đã từng bị bấm quên {currentCard?.schedule?.lapses || 1} lần!
          </span>

          <h2 className="text-3xl sm:text-4xl font-black text-gray-900 dark:text-white font-hanzi">
            {currentCard?.front}
          </h2>
          <p className="text-xs sm:text-sm font-bold text-kawaii-600 font-mono">{currentCard?.phonetic}</p>
          <h3 className="text-xl sm:text-2xl font-bold text-gray-800 dark:text-white font-display pt-1">
            {currentCard?.back}
          </h3>

          {currentCard?.notes && (
            <p className="text-xs text-purple-600 bg-white dark:bg-dark-bg p-2.5 rounded-xl border border-purple-200">
              💡 Mẹo nhớ: {currentCard.notes}
            </p>
          )}

          <div className="pt-2">
            <button
              onClick={() => {
                if (currentIdx + 1 < practiceCards.length) {
                  setCurrentIdx(currentIdx + 1);
                } else {
                  finishGame();
                  setMode('menu');
                }
              }}
              className="w-full py-3.5 min-h-[48px] rounded-2xl bg-kawaii-500 hover:bg-kawaii-600 text-white font-bold text-sm shadow-kawaii active:scale-95 transition-transform"
            >
              {currentIdx + 1 < practiceCards.length ? 'Thẻ khó tiếp theo →' : 'Hoàn thành ôn thẻ khó 🎉'}
            </button>
          </div>
        </div>
      </div>
    );
  }

  return null;
};
