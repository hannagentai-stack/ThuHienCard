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
} from 'lucide-react';
import { useDeckStore } from '../stores/deckStore';
import { type Card } from '../types';
import { ttsService } from '../services/ttsService';
import { HanziWriterCanvas } from '../components/cards/HanziWriterCanvas';

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
}

const PINYIN_TONES = [
  'ā', 'á', 'ǎ', 'à',
  'ō', 'ó', 'ǒ', 'ò',
  'ē', 'é', 'ě', 'è',
  'ī', 'í', 'ǐ', 'ì',
  'ū', 'ú', 'ǔ', 'ù',
  'ǖ', 'ǘ', 'ǚ', 'ǜ',
];

export const PracticePage: React.FC<PracticePageProps> = ({ onStartSRS }) => {
  const { decks, fetchDecks } = useDeckStore();

  const [selectedDeckId, setSelectedDeckId] = useState<string>('all');
  const [mode, setMode] = useState<PracticeMode>('menu');

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

  // Matching game state
  const [matchingCards, setMatchingCards] = useState<{ id: string; text: string; cardId: string; type: 'front' | 'back'; isMatched: boolean }[]>([]);
  const [selectedMatch, setSelectedMatch] = useState<number | null>(null);

  // Speed review state (60s timer)
  const [timeLeft, setTimeLeft] = useState(60);
  const [isSpeedRunning, setIsSpeedRunning] = useState(false);

  useEffect(() => {
    fetchDecks();
  }, [fetchDecks]);

  // Thu thập danh sách thẻ để chơi
  const getCardsForPractice = (): Card[] => {
    let pool: Card[] = [];
    if (selectedDeckId === 'all') {
      decks.forEach((d) => {
        if (d.cards) pool.push(...d.cards);
      });
    } else {
      const d = decks.find((x) => x.id === selectedDeckId);
      if (d?.cards) pool = [...d.cards];
    }
    return pool;
  };

  // Khởi động chế độ chơi
  const startMode = (chosenMode: PracticeMode) => {
    const cards = getCardsForPractice();
    if (cards.length < 4 && (chosenMode === 'quiz' || chosenMode === 'matching')) {
      alert('Bộ thẻ cần có ít nhất 4 từ để bắt đầu chế độ này!');
      return;
    }

    if (cards.length === 0) {
      alert('Chưa có thẻ nào trong bộ để luyện tập.');
      return;
    }

    // Xáo trộn ngẫu nhiên
    const shuffled = [...cards].sort(() => Math.random() - 0.5);

    if (chosenMode === 'leech') {
      // Lọc thẻ sai nhiều (lapses >= 1 hoặc ngẫu nhiên nếu chưa có)
      const leeches = shuffled.filter((c) => (c.schedule?.lapses || 0) >= 1);
      setPracticeCards(leeches.length > 0 ? leeches : shuffled.slice(0, 10));
    } else {
      setPracticeCards(shuffled);
    }

    setCurrentIdx(0);
    setScore(0);
    setMode(chosenMode);

    if (chosenMode === 'quiz' || chosenMode === 'listening') {
      setupQuizQuestion(shuffled[0], shuffled);
    } else if (chosenMode === 'matching') {
      setupMatchingGame(shuffled);
    } else if (chosenMode === 'speed') {
      setTimeLeft(60);
      setIsSpeedRunning(true);
      setupQuizQuestion(shuffled[0], shuffled);
    } else if (chosenMode === 'typing') {
      setTypedInput('');
      setTypingResult(null);
      setTimeout(() => typingInputRef.current?.focus(), 150);
    }
  };

  // Thiết lập câu hỏi trắc nghiệm (1 đáp án đúng + 3 đáp án nhiễu)
  const setupQuizQuestion = (card: Card, pool: Card[]) => {
    if (!card) return;
    const correct = card.back;
    const distractors = pool
      .filter((c) => c.id !== card.id)
      .map((c) => c.back)
      .sort(() => Math.random() - 0.5)
      .slice(0, 3);

    const options = [correct, ...distractors].sort(() => Math.random() - 0.5);
    setQuizOptions(options);
    setSelectedAnswer(null);
    setIsAnswerChecked(false);

    if (mode === 'listening') {
      const lang = card.level?.startsWith('HSK') ? 'zh' : 'en';
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

  // Kiểm tra gõ đáp án
  const handleCheckTyping = (e: React.FormEvent) => {
    e.preventDefault();
    const current = practiceCards[currentIdx];
    if (!current) return;

    const target = current.front.toLowerCase().trim();
    const input = typedInput.toLowerCase().trim();
    const phoneticTarget = (current.phonetic || '').toLowerCase().trim();

    // Cho phép gõ đúng từ hoặc đúng pinyin (tiếng Trung)
    const isCorrect = input === target || (phoneticTarget && input === phoneticTarget);
    setTypingResult(isCorrect ? 'correct' : 'wrong');

    if (isCorrect) setScore((s) => s + 1);

    setTimeout(() => {
      const next = currentIdx + 1;
      if (next < practiceCards.length) {
        setCurrentIdx(next);
        setTypedInput('');
        setTypingResult(null);
        typingInputRef.current?.focus();
      } else {
        finishGame();
      }
    }, 1400);
  };

  // Thiết lập Matching Game (Ghép cặp 4-6 từ)
  const setupMatchingGame = (pool: Card[]) => {
    const selected = pool.slice(0, 6);
    const items: any[] = [];

    selected.forEach((c) => {
      items.push({ id: `front-${c.id}`, text: c.front, cardId: c.id, type: 'front', isMatched: false });
      items.push({ id: `back-${c.id}`, text: c.back, cardId: c.id, type: 'back', isMatched: false });
    });

    setMatchingCards(items.sort(() => Math.random() - 0.5));
    setSelectedMatch(null);
  };

  // Xử lý chọn ô Matching
  const handleMatchCardClick = (idx: number) => {
    const card = matchingCards[idx];
    if (card.isMatched || selectedMatch === idx) return;

    if (selectedMatch === null) {
      setSelectedMatch(idx);
    } else {
      const first = matchingCards[selectedMatch];
      if (first.cardId === card.cardId && first.type !== card.type) {
        // Khớp nhau!
        const updated = [...matchingCards];
        updated[selectedMatch].isMatched = true;
        updated[idx].isMatched = true;
        setMatchingCards(updated);
        setSelectedMatch(null);
        setScore((s) => s + 1);

        if (updated.every((c) => c.isMatched)) {
          finishGame();
        }
      } else {
        // Sai -> Tự bỏ chọn sau 450ms
        setTimeout(() => setSelectedMatch(null), 450);
      }
    }
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
    return (
      <div className="space-y-6 pb-20 max-w-4xl mx-auto">
        {/* Tiêu đề & Chọn bộ từ */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
          <div>
            <h1 className="text-2xl sm:text-3xl font-display font-extrabold text-gray-900 dark:text-white flex items-center gap-2">
              <Gamepad2 className="w-7 h-7 text-kawaii-500" />
              <span>8 Chế Độ Luyện Tập 🎮</span>
            </h1>
            <p className="text-xs text-gray-500 dark:text-dark-textMuted mt-0.5">
              Học qua trò chơi phản xạ, gõ từ, nghe và tập viết nét
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
              <option value="all">Tất cả bộ thẻ</option>
              {decks.map((d) => (
                <option key={d.id} value={d.id}>
                  {d.title} ({d.cards?.length || 0} từ)
                </option>
              ))}
            </select>
          </div>
        </div>

        {/* Lưới 8 Thẻ Chế Độ - Mobile Friendly */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3.5">
          
          {/* Chế độ 1: SRS Ôn Tập Chuẩn */}
          <div
            onClick={onStartSRS}
            className="p-4 sm:p-5 rounded-3xl bg-gradient-to-br from-pink-50 to-white dark:from-dark-card dark:to-dark-cardHover border-2 border-kawaii-300 dark:border-dark-border shadow-xs hover:shadow-kawaii cursor-pointer btn-bounce flex flex-col justify-between space-y-3"
          >
            <div>
              <div className="flex items-center justify-between">
                <span className="text-2xl sm:text-3xl">🌸</span>
                <span className="px-2 py-0.5 rounded-full bg-kawaii-500 text-white text-[10px] font-bold">Khuyên dùng</span>
              </div>
              <h3 className="font-extrabold text-base font-display text-gray-900 dark:text-white mt-2">
                1. Ôn Tập Chuẩn FSRS
              </h3>
              <p className="text-xs text-gray-500 dark:text-dark-textMuted mt-1 leading-relaxed">
                Thuật toán lặp lại ngắt quãng khoa học: Lại, Khó, Tốt, Dễ.
              </p>
            </div>
            <span className="text-xs font-bold text-kawaii-600 dark:text-kawaii-400">
              Vào học ngay →
            </span>
          </div>

          {/* Chế độ 2: Trắc Nghiệm 4 Đáp Án */}
          <div
            onClick={() => startMode('quiz')}
            className="p-4 sm:p-5 rounded-3xl bg-white dark:bg-dark-card border-2 border-kawaii-200 dark:border-dark-border hover:border-kawaii-400 shadow-xs hover:shadow-kawaii cursor-pointer btn-bounce flex flex-col justify-between space-y-3"
          >
            <div>
              <span className="text-2xl sm:text-3xl">🎯</span>
              <h3 className="font-extrabold text-base font-display text-gray-900 dark:text-white mt-2">
                2. Trắc Nghiệm 4 Đáp Án
              </h3>
              <p className="text-xs text-gray-500 dark:text-dark-textMuted mt-1 leading-relaxed">
                Nhìn từ vựng và chọn 1 trong 4 nghĩa tiếng Việt nhanh nhất.
              </p>
            </div>
            <span className="text-xs font-bold text-kawaii-600 dark:text-kawaii-400">
              Chơi ngay →
            </span>
          </div>

          {/* Chế độ 3: Gõ Đáp Án */}
          <div
            onClick={() => startMode('typing')}
            className="p-4 sm:p-5 rounded-3xl bg-white dark:bg-dark-card border-2 border-kawaii-200 dark:border-dark-border hover:border-kawaii-400 shadow-xs hover:shadow-kawaii cursor-pointer btn-bounce flex flex-col justify-between space-y-3"
          >
            <div>
              <span className="text-2xl sm:text-3xl">⌨️</span>
              <h3 className="font-extrabold text-base font-display text-gray-900 dark:text-white mt-2">
                3. Gõ Từ / Pinyin Chính Xác
              </h3>
              <p className="text-xs text-gray-500 dark:text-dark-textMuted mt-1 leading-relaxed">
                Rèn trí nhớ cơ bắp, hỗ trợ thanh phím nhanh thanh điệu tiếng Trung.
              </p>
            </div>
            <span className="text-xs font-bold text-kawaii-600 dark:text-kawaii-400">
              Chơi ngay →
            </span>
          </div>

          {/* Chế độ 4: Luyện Nghe TTS */}
          <div
            onClick={() => startMode('listening')}
            className="p-4 sm:p-5 rounded-3xl bg-white dark:bg-dark-card border-2 border-kawaii-200 dark:border-dark-border hover:border-kawaii-400 shadow-xs hover:shadow-kawaii cursor-pointer btn-bounce flex flex-col justify-between space-y-3"
          >
            <div>
              <span className="text-2xl sm:text-3xl">🎧</span>
              <h3 className="font-extrabold text-base font-display text-gray-900 dark:text-white mt-2">
                4. Luyện Nghe & Đoán Từ
              </h3>
              <p className="text-xs text-gray-500 dark:text-dark-textMuted mt-1 leading-relaxed">
                Nghe giọng chuẩn bản xứ rồi chọn nghĩa đúng mà không nhìn chữ trước.
              </p>
            </div>
            <span className="text-xs font-bold text-kawaii-600 dark:text-kawaii-400">
              Chơi ngay →
            </span>
          </div>

          {/* Chế độ 5: Ghép Cặp (Matching Game) */}
          <div
            onClick={() => startMode('matching')}
            className="p-4 sm:p-5 rounded-3xl bg-white dark:bg-dark-card border-2 border-kawaii-200 dark:border-dark-border hover:border-kawaii-400 shadow-xs hover:shadow-kawaii cursor-pointer btn-bounce flex flex-col justify-between space-y-3"
          >
            <div>
              <span className="text-2xl sm:text-3xl">🧩</span>
              <h3 className="font-extrabold text-base font-display text-gray-900 dark:text-white mt-2">
                5. Ghép Cặp Từ & Nghĩa
              </h3>
              <p className="text-xs text-gray-500 dark:text-dark-textMuted mt-1 leading-relaxed">
                Lật mở các ô tương ứng giữa Từ vựng và Nghĩa tiếng Việt.
              </p>
            </div>
            <span className="text-xs font-bold text-kawaii-600 dark:text-kawaii-400">
              Chơi ngay →
            </span>
          </div>

          {/* Chế độ 6: Tập Viết Chữ Hán */}
          <div
            onClick={() => startMode('hanzi')}
            className="p-4 sm:p-5 rounded-3xl bg-white dark:bg-dark-card border-2 border-kawaii-200 dark:border-dark-border hover:border-kawaii-400 shadow-xs hover:shadow-kawaii cursor-pointer btn-bounce flex flex-col justify-between space-y-3"
          >
            <div>
              <span className="text-2xl sm:text-3xl">✍️</span>
              <h3 className="font-extrabold text-base font-display text-gray-900 dark:text-white mt-2">
                6. Tập Viết Chữ Hán
              </h3>
              <p className="text-xs text-gray-500 dark:text-dark-textMuted mt-1 leading-relaxed">
                Hanzi Writer hướng dẫn nét viết và chấm điểm viết tay từng nét.
              </p>
            </div>
            <span className="text-xs font-bold text-kawaii-600 dark:text-kawaii-400">
              Chơi ngay →
            </span>
          </div>

          {/* Chế độ 7: Speed Review (60 Giây) */}
          <div
            onClick={() => startMode('speed')}
            className="p-4 sm:p-5 rounded-3xl bg-white dark:bg-dark-card border-2 border-kawaii-200 dark:border-dark-border hover:border-kawaii-400 shadow-xs hover:shadow-kawaii cursor-pointer btn-bounce flex flex-col justify-between space-y-3"
          >
            <div>
              <span className="text-2xl sm:text-3xl">⚡</span>
              <h3 className="font-extrabold text-base font-display text-gray-900 dark:text-white mt-2">
                7. Thử Thách 60 Giây
              </h3>
              <p className="text-xs text-gray-500 dark:text-dark-textMuted mt-1 leading-relaxed">
                Đếm ngược 60 giây, trả lời nhanh càng nhiều từ vựng càng tốt!
              </p>
            </div>
            <span className="text-xs font-bold text-kawaii-600 dark:text-kawaii-400">
              Chơi ngay →
            </span>
          </div>

          {/* Chế độ 8: Ôn Thẻ Khó (Leech Review) */}
          <div
            onClick={() => startMode('leech')}
            className="p-4 sm:p-5 rounded-3xl bg-white dark:bg-dark-card border-2 border-kawaii-200 dark:border-dark-border hover:border-kawaii-400 shadow-xs hover:shadow-kawaii cursor-pointer btn-bounce flex flex-col justify-between space-y-3"
          >
            <div>
              <span className="text-2xl sm:text-3xl">🔥</span>
              <h3 className="font-extrabold text-base font-display text-gray-900 dark:text-white mt-2">
                8. Luyện Thẻ Khó / Hay Quên
              </h3>
              <p className="text-xs text-gray-500 dark:text-dark-textMuted mt-1 leading-relaxed">
                Tập trung đặc biệt vào các thẻ bạn hay quên để ghi nhớ sâu.
              </p>
            </div>
            <span className="text-xs font-bold text-kawaii-600 dark:text-kawaii-400">
              Chơi ngay →
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
                    const lang = currentCard?.level?.startsWith('HSK') ? 'zh' : 'en';
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

            let btnStyle = 'border-kawaii-200 dark:border-dark-border bg-white dark:bg-dark-card text-gray-800 dark:text-gray-100';
            if (isAnswerChecked) {
              if (isCorrect) {
                btnStyle = 'border-emerald-500 bg-emerald-50 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-300 font-bold';
              } else if (isSelected) {
                btnStyle = 'border-red-500 bg-red-50 dark:bg-red-950/40 text-red-700 dark:text-red-300';
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
                {isAnswerChecked && isCorrect && <CheckCircle2 className="w-5 h-5 text-emerald-500 shrink-0" />}
                {isAnswerChecked && isSelected && !isCorrect && <XCircle className="w-5 h-5 text-red-500 shrink-0" />}
              </button>
            );
          })}
        </div>
      </div>
    );
  }

  // 3. MÀN HÌNH CHƠI: GÕ ĐÁP ÁN (TYPING QUIZ)
  if (mode === 'typing') {
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
          <span className="text-xs font-black text-purple-600 dark:text-purple-400">
            Điểm: {score}
          </span>
        </div>

        <div className="p-6 rounded-3xl bg-white dark:bg-dark-card border-2 border-kawaii-200 dark:border-dark-border shadow-kawaii text-center space-y-3">
          <span className="text-xs font-bold text-gray-400">Gõ từ tương ứng với nghĩa:</span>
          <h2 className="text-2xl sm:text-3xl font-extrabold text-gray-900 dark:text-white font-display">
            {currentCard?.back}
          </h2>
          {currentCard?.example && (
            <p className="text-xs text-gray-500 dark:text-dark-textMuted italic">
              "{currentCard.exampleTrans || currentCard.example}"
            </p>
          )}

          {/* Thanh phím nhanh chọn ký tự thanh điệu Pinyin trên điện thoại */}
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
              placeholder="Gõ từ vựng hoặc Pinyin..."
              className="w-full p-3.5 rounded-2xl bg-gray-50 dark:bg-dark-bg border-2 border-kawaii-300 dark:border-dark-border text-center text-base sm:text-lg font-bold outline-none focus:border-kawaii-500 dark:text-white"
            />

            <button
              type="submit"
              className="w-full py-3.5 min-h-[48px] rounded-2xl bg-kawaii-500 hover:bg-kawaii-600 text-white font-bold text-sm shadow-kawaii active:scale-95 transition-transform"
            >
              Kiểm tra đáp án
            </button>
          </form>

          {typingResult && (
            <div
              className={`p-3 rounded-2xl text-xs font-bold animate-fade-in ${
                typingResult === 'correct'
                  ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                  : 'bg-red-50 text-red-700 border border-red-200'
              }`}
            >
              {typingResult === 'correct' ? (
                <span>🎉 Chính xác tuyệt vời!</span>
              ) : (
                <span>❌ Chưa đúng! Đáp án: {currentCard?.front} ({currentCard?.phonetic})</span>
              )}
            </div>
          )}
        </div>
      </div>
    );
  }

  // 4. MÀN HÌNH CHƠI: GHÉP CẶP (MATCHING GAME - LƯỚI 2 CỘT CHỐNG TRÀN)
  if (mode === 'matching') {
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
            Khớp được: {score} cặp
          </span>
        </div>

        <div className="text-center space-y-0.5">
          <h2 className="text-lg sm:text-xl font-bold font-display text-gray-900 dark:text-white">
            Ghép Ô Từ Vựng Với Nghĩa 🧩
          </h2>
          <p className="text-xs text-gray-500">Chạm 1 ô từ rồi chạm ô nghĩa tương ứng</p>
        </div>

        {/* Lưới 2 Cột trên Mobile chống tràn ngang */}
        <div className="grid grid-cols-2 gap-2.5 pt-1">
          {matchingCards.map((item, idx) => {
            const isSelected = selectedMatch === idx;
            if (item.isMatched) {
              return (
                <div
                  key={item.id}
                  className="p-3.5 min-h-[58px] rounded-2xl bg-emerald-50 dark:bg-emerald-950/30 border border-emerald-300 text-emerald-600 text-xs font-bold text-center opacity-30 select-none flex items-center justify-center break-words"
                >
                  ✓ {item.text}
                </div>
              );
            }

            return (
              <button
                key={item.id}
                onClick={() => handleMatchCardClick(idx)}
                className={`p-3.5 min-h-[58px] rounded-2xl border-2 text-xs font-bold text-center transition-all active:scale-95 shadow-xs flex items-center justify-center break-words ${
                  isSelected
                    ? 'border-kawaii-500 bg-kawaii-50 dark:bg-dark-bg text-kawaii-600 scale-102 shadow-kawaii'
                    : 'border-kawaii-200 dark:border-dark-border bg-white dark:bg-dark-card text-gray-800 dark:text-gray-200'
                }`}
              >
                {item.text}
              </button>
            );
          })}
        </div>
      </div>
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
              className="w-full py-3.5 min-h-[48px] rounded-2xl bg-gradient-to-r from-red-500 to-rose-500 text-white font-bold text-xs shadow-md active:scale-95"
            >
              Đã nhớ lại từ này! Tiếp tục →
            </button>
          </div>
        </div>
      </div>
    );
  }

  return null;
};
