import React, { useState, useEffect } from 'react';
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

  // Trắc nghiệm kiểm tra
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
    }, 1200);
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
      } else {
        finishGame();
      }
    }, 1500);
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

        // Kiểm tra xem đã ghép hết chưa
        if (updated.every((c) => c.isMatched)) {
          finishGame();
        }
      } else {
        // Sai -> Đổi lựa chọn sau 500ms
        setTimeout(() => setSelectedMatch(null), 500);
      }
    }
  };

  // Đếm ngược Speed Review
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
    confetti({ particleCount: 80, spread: 60 });
  };

  // 1. MENU CHÍNH: DANH SÁCH 8 CHẾ ĐỘ LUYỆN TẬP
  if (mode === 'menu') {
    return (
      <div className="space-y-8 pb-16">
        
        {/* Tiêu đề & Chọn bộ thẻ */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h1 className="text-2xl sm:text-3xl font-display font-extrabold text-gray-900 dark:text-white flex items-center gap-2">
              <Gamepad2 className="w-8 h-8 text-kawaii-500" />
              <span>Chế Độ Luyện Tập Phong Phú 🎮</span>
            </h1>
            <p className="text-xs text-gray-500 dark:text-dark-textMuted mt-1">
              8 chế độ mini-games đa dạng giúp bạn đổi gió và tăng phản xạ từ vựng
            </p>
          </div>

          <div className="flex items-center gap-2">
            <span className="text-xs font-bold text-gray-600 dark:text-gray-300">Bộ thẻ:</span>
            <select
              value={selectedDeckId}
              onChange={(e) => setSelectedDeckId(e.target.value)}
              className="px-3 py-2 rounded-2xl bg-white dark:bg-dark-card border border-kawaii-200 dark:border-dark-border text-xs font-bold dark:text-white outline-none shadow-sm"
            >
              <option value="all">Tất cả bộ thẻ 🌸</option>
              {decks.map((d) => (
                <option key={d.id} value={d.id}>
                  {d.icon || '🌸'} {d.title}
                </option>
              ))}
            </select>
          </div>
        </div>

        {/* Lưới 8 Chế độ chơi */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          
          {/* Chế độ 1: SRS Lật Thẻ Cổ Điển */}
          <div
            onClick={onStartSRS}
            className="p-5 rounded-3xl bg-gradient-to-br from-pink-500 to-rose-400 text-white shadow-kawaii cursor-pointer btn-bounce flex flex-col justify-between space-y-4"
          >
            <div>
              <span className="text-3xl">📇</span>
              <h3 className="font-extrabold text-base font-display mt-2">1. Lật Thẻ FSRS</h3>
              <p className="text-xs text-pink-100 mt-1">
                Lặp lại ngắt quãng khoa học, lật 3D và 4 nút đánh giá chuẩn Anki.
              </p>
            </div>
            <span className="text-xs font-bold bg-white/20 px-3 py-1 rounded-full self-start">
              Chế độ chính ⭐
            </span>
          </div>

          {/* Chế độ 2: Trắc Nghiệm 4 Đáp Án */}
          <div
            onClick={() => startMode('quiz')}
            className="p-5 rounded-3xl bg-white dark:bg-dark-card border-2 border-kawaii-200 dark:border-dark-border hover:border-kawaii-400 shadow-sm hover:shadow-kawaii cursor-pointer btn-bounce flex flex-col justify-between space-y-4"
          >
            <div>
              <span className="text-3xl">🎯</span>
              <h3 className="font-extrabold text-base font-display text-gray-900 dark:text-white mt-2">
                2. Trắc Nghiệm 4 Đáp Án
              </h3>
              <p className="text-xs text-gray-500 dark:text-dark-textMuted mt-1">
                Tự sinh 3 đáp án nhiễu từ cùng bộ thẻ để bạn chọn nghĩa chuẩn xác.
              </p>
            </div>
            <span className="text-xs font-bold text-kawaii-600 dark:text-kawaii-400">
              Chơi ngay →
            </span>
          </div>

          {/* Chế độ 3: Gõ Đáp Án */}
          <div
            onClick={() => startMode('typing')}
            className="p-5 rounded-3xl bg-white dark:bg-dark-card border-2 border-kawaii-200 dark:border-dark-border hover:border-kawaii-400 shadow-sm hover:shadow-kawaii cursor-pointer btn-bounce flex flex-col justify-between space-y-4"
          >
            <div>
              <span className="text-3xl">⌨️</span>
              <h3 className="font-extrabold text-base font-display text-gray-900 dark:text-white mt-2">
                3. Gõ Từ / Pinyin
              </h3>
              <p className="text-xs text-gray-500 dark:text-dark-textMuted mt-1">
                Luyện trí nhớ chủ động bằng cách tự gõ từ tiếng Anh hoặc Pinyin/Hán tự.
              </p>
            </div>
            <span className="text-xs font-bold text-kawaii-600 dark:text-kawaii-400">
              Chơi ngay →
            </span>
          </div>

          {/* Chế độ 4: Luyện Nghe */}
          <div
            onClick={() => startMode('listening')}
            className="p-5 rounded-3xl bg-white dark:bg-dark-card border-2 border-kawaii-200 dark:border-dark-border hover:border-kawaii-400 shadow-sm hover:shadow-kawaii cursor-pointer btn-bounce flex flex-col justify-between space-y-4"
          >
            <div>
              <span className="text-3xl">🎧</span>
              <h3 className="font-extrabold text-base font-display text-gray-900 dark:text-white mt-2">
                4. Luyện Nghe Audio
              </h3>
              <p className="text-xs text-gray-500 dark:text-dark-textMuted mt-1">
                Nghe phát âm chuẩn TTS rồi chọn nghĩa đúng mà không nhìn chữ trước.
              </p>
            </div>
            <span className="text-xs font-bold text-kawaii-600 dark:text-kawaii-400">
              Chơi ngay →
            </span>
          </div>

          {/* Chế độ 5: Ghép Cặp (Matching Game) */}
          <div
            onClick={() => startMode('matching')}
            className="p-5 rounded-3xl bg-white dark:bg-dark-card border-2 border-kawaii-200 dark:border-dark-border hover:border-kawaii-400 shadow-sm hover:shadow-kawaii cursor-pointer btn-bounce flex flex-col justify-between space-y-4"
          >
            <div>
              <span className="text-3xl">🧩</span>
              <h3 className="font-extrabold text-base font-display text-gray-900 dark:text-white mt-2">
                5. Ghép Cặp Từ & Nghĩa
              </h3>
              <p className="text-xs text-gray-500 dark:text-dark-textMuted mt-1">
                Lật mở các ô tương ứng giữa Từ vựng và Nghĩa tiếng Việt nhanh tay.
              </p>
            </div>
            <span className="text-xs font-bold text-kawaii-600 dark:text-kawaii-400">
              Chơi ngay →
            </span>
          </div>

          {/* Chế độ 6: Tập Viết Chữ Hán */}
          <div
            onClick={() => startMode('hanzi')}
            className="p-5 rounded-3xl bg-white dark:bg-dark-card border-2 border-kawaii-200 dark:border-dark-border hover:border-kawaii-400 shadow-sm hover:shadow-kawaii cursor-pointer btn-bounce flex flex-col justify-between space-y-4"
          >
            <div>
              <span className="text-3xl">✍️</span>
              <h3 className="font-extrabold text-base font-display text-gray-900 dark:text-white mt-2">
                6. Tập Viết Chữ Hán
              </h3>
              <p className="text-xs text-gray-500 dark:text-dark-textMuted mt-1">
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
            className="p-5 rounded-3xl bg-white dark:bg-dark-card border-2 border-kawaii-200 dark:border-dark-border hover:border-kawaii-400 shadow-sm hover:shadow-kawaii cursor-pointer btn-bounce flex flex-col justify-between space-y-4"
          >
            <div>
              <span className="text-3xl">⚡</span>
              <h3 className="font-extrabold text-base font-display text-gray-900 dark:text-white mt-2">
                7. Thử Thách 60 Giây
              </h3>
              <p className="text-xs text-gray-500 dark:text-dark-textMuted mt-1">
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
            className="p-5 rounded-3xl bg-white dark:bg-dark-card border-2 border-kawaii-200 dark:border-dark-border hover:border-kawaii-400 shadow-sm hover:shadow-kawaii cursor-pointer btn-bounce flex flex-col justify-between space-y-4"
          >
            <div>
              <span className="text-3xl">🔥</span>
              <h3 className="font-extrabold text-base font-display text-gray-900 dark:text-white mt-2">
                8. Luyện Thẻ Khó / Hay Quên
              </h3>
              <p className="text-xs text-gray-500 dark:text-dark-textMuted mt-1">
                Tập trung đặc biệt vào các thẻ bạn hay bấm "Lại" để giải quyết triệt để.
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

  // 2. MÀN HÌNH CHƠI: TRẮC NGHIỆM & LUYỆN NGHE & SPEED REVIEW
  if (mode === 'quiz' || mode === 'listening' || mode === 'speed') {
    const currentCard = practiceCards[currentIdx];
    return (
      <div className="max-w-xl mx-auto space-y-6 pb-16">
        
        {/* Thanh điều hướng quay lại & điểm số */}
        <div className="flex items-center justify-between">
          <button
            onClick={() => setMode('menu')}
            className="p-2 rounded-xl bg-white dark:bg-dark-card border border-kawaii-100 dark:border-dark-border text-xs font-bold flex items-center gap-1"
          >
            <ArrowLeft className="w-4 h-4" /> Quay lại
          </button>

          <div className="flex items-center gap-3">
            {mode === 'speed' && (
              <span className="px-3 py-1 rounded-full bg-red-100 text-red-600 font-extrabold text-xs flex items-center gap-1">
                <Timer className="w-3.5 h-3.5 animate-spin" /> {timeLeft}s
              </span>
            )}
            <span className="text-xs font-bold text-kawaii-600 dark:text-kawaii-400">
              Điểm: {score} / {practiceCards.length}
            </span>
          </div>
        </div>

        {/* Thẻ câu hỏi */}
        <div className="p-8 rounded-3xl bg-white dark:bg-dark-card border-2 border-kawaii-200 dark:border-dark-border shadow-kawaii text-center space-y-4">
          <span className="text-xs font-bold text-gray-400">
            {mode === 'listening' ? '🎧 Nghe và chọn nghĩa đúng' : `Câu ${currentIdx + 1} / ${practiceCards.length}`}
          </span>

          {mode === 'listening' ? (
            <button
              onClick={() => {
                const lang = currentCard?.level?.startsWith('HSK') ? 'zh' : 'en';
                ttsService.speak(currentCard.front, lang, currentCard.audioUrl);
              }}
              className="p-6 rounded-full bg-kawaii-100 dark:bg-dark-bg text-kawaii-600 hover:scale-105 transition-transform mx-auto shadow-sm"
            >
              <Volume2 className="w-10 h-10 animate-pulse" />
            </button>
          ) : (
            <div>
              <h2 className="text-4xl sm:text-5xl font-black text-gray-900 dark:text-white font-hanzi">
                {currentCard?.front}
              </h2>
              {currentCard?.phonetic && (
                <p className="text-sm font-bold text-kawaii-600 font-mono mt-1">
                  {currentCard.phonetic}
                </p>
              )}
            </div>
          )}
        </div>

        {/* 4 Đáp án lựa chọn */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          {quizOptions.map((opt, i) => {
            const isSelected = selectedAnswer === opt;
            const isCorrect = opt === currentCard?.back;

            let btnClass = 'bg-white dark:bg-dark-card border-kawaii-200 hover:border-kawaii-400';
            if (isAnswerChecked) {
              if (isCorrect) btnClass = 'bg-emerald-50 border-emerald-500 text-emerald-700 font-bold';
              else if (isSelected) btnClass = 'bg-red-50 border-red-500 text-red-700';
            }

            return (
              <button
                key={i}
                disabled={isAnswerChecked}
                onClick={() => handleSelectQuizAnswer(opt)}
                className={`p-4 rounded-2xl border-2 text-left text-sm font-semibold transition-all btn-bounce ${btnClass} flex items-center justify-between shadow-sm`}
              >
                <span>{opt}</span>
                {isAnswerChecked && isCorrect && <CheckCircle2 className="w-5 h-5 text-emerald-500" />}
                {isAnswerChecked && isSelected && !isCorrect && <XCircle className="w-5 h-5 text-red-500" />}
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
      <div className="max-w-xl mx-auto space-y-6 pb-16">
        <div className="flex items-center justify-between">
          <button
            onClick={() => setMode('menu')}
            className="p-2 rounded-xl bg-white dark:bg-dark-card border border-kawaii-100 text-xs font-bold flex items-center gap-1"
          >
            <ArrowLeft className="w-4 h-4" /> Quay lại
          </button>
          <span className="text-xs font-bold text-kawaii-600">
            Từ {currentIdx + 1} / {practiceCards.length}
          </span>
        </div>

        <div className="p-8 rounded-3xl bg-white dark:bg-dark-card border-2 border-kawaii-200 dark:border-dark-border shadow-kawaii text-center space-y-4">
          <span className="text-xs font-bold text-gray-400">Nghĩa tiếng Việt:</span>
          <h2 className="text-2xl sm:text-3xl font-extrabold text-gray-900 dark:text-white font-display">
            {currentCard?.back}
          </h2>
          {currentCard?.example && (
            <p className="text-xs text-gray-500 italic">"{currentCard.exampleTrans || currentCard.example}"</p>
          )}

          <form onSubmit={handleCheckTyping} className="pt-4 space-y-3">
            <input
              type="text"
              autoFocus
              value={typedInput}
              onChange={(e) => setTypedInput(e.target.value)}
              placeholder="Gõ từ vựng hoặc Pinyin tại đây..."
              className="w-full p-3.5 rounded-2xl bg-gray-50 dark:bg-dark-bg border-2 border-kawaii-300 dark:border-dark-border text-center text-lg font-bold outline-none focus:border-kawaii-500 dark:text-white"
            />

            <button
              type="submit"
              className="w-full py-3 rounded-2xl bg-kawaii-500 hover:bg-kawaii-600 text-white font-bold text-sm shadow-kawaii btn-bounce"
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
                <span>❌ Chưa đúng rồi! Đáp án: {currentCard?.front} ({currentCard?.phonetic})</span>
              )}
            </div>
          )}
        </div>
      </div>
    );
  }

  // 4. MÀN HÌNH CHƠI: GHÉP CẶP (MATCHING GAME)
  if (mode === 'matching') {
    return (
      <div className="max-w-2xl mx-auto space-y-6 pb-16">
        <div className="flex items-center justify-between">
          <button
            onClick={() => setMode('menu')}
            className="p-2 rounded-xl bg-white dark:bg-dark-card border border-kawaii-100 text-xs font-bold flex items-center gap-1"
          >
            <ArrowLeft className="w-4 h-4" /> Quay lại
          </button>
          <span className="text-xs font-bold text-kawaii-600">
            Khớp được: {score} cặp
          </span>
        </div>

        <div className="text-center space-y-1">
          <h2 className="text-xl font-bold font-display text-gray-900 dark:text-white">
            Ghép Ô Từ Vựng Với Nghĩa Tương Ứng 🧩
          </h2>
          <p className="text-xs text-gray-500">Chạm vào một từ rồi chạm vào ô nghĩa tương ứng</p>
        </div>

        <div className="grid grid-cols-3 sm:grid-cols-4 gap-3">
          {matchingCards.map((item, idx) => {
            const isSelected = selectedMatch === idx;
            if (item.isMatched) {
              return (
                <div
                  key={item.id}
                  className="p-4 rounded-2xl bg-emerald-50 dark:bg-emerald-950/30 border border-emerald-300 text-emerald-600 text-xs font-bold text-center opacity-40 select-none"
                >
                  ✓ {item.text}
                </div>
              );
            }

            return (
              <button
                key={item.id}
                onClick={() => handleMatchCardClick(idx)}
                className={`p-4 rounded-2xl border-2 text-xs font-bold text-center transition-all btn-bounce shadow-sm flex items-center justify-center min-h-[72px] ${
                  isSelected
                    ? 'border-kawaii-500 bg-kawaii-50 dark:bg-dark-bg text-kawaii-600 scale-105 shadow-kawaii'
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
      <div className="max-w-md mx-auto space-y-6 pb-16">
        <div className="flex items-center justify-between">
          <button
            onClick={() => setMode('menu')}
            className="p-2 rounded-xl bg-white dark:bg-dark-card border border-kawaii-100 text-xs font-bold flex items-center gap-1"
          >
            <ArrowLeft className="w-4 h-4" /> Quay lại
          </button>
          <span className="text-xs font-bold text-kawaii-600">
            Từ {currentIdx + 1} / {practiceCards.length}
          </span>
        </div>

        <div className="p-6 rounded-3xl bg-white dark:bg-dark-card border-2 border-kawaii-200 dark:border-dark-border shadow-kawaii text-center space-y-4">
          <div>
            <h3 className="text-2xl font-black text-gray-900 dark:text-white font-hanzi">
              {currentCard?.front}
            </h3>
            <p className="text-xs font-bold text-kawaii-600 font-mono">{currentCard?.phonetic}</p>
            <p className="text-xs text-gray-500 mt-1">Nghĩa: {currentCard?.back}</p>
          </div>

          <HanziWriterCanvas characters={currentCard?.front || ''} size={180} />

          <div className="flex justify-between gap-2 pt-2">
            <button
              onClick={() => setCurrentIdx((i) => Math.max(0, i - 1))}
              disabled={currentIdx === 0}
              className="px-4 py-2 rounded-xl bg-gray-100 dark:bg-dark-bg text-xs font-bold disabled:opacity-40"
            >
              Từ trước
            </button>
            <button
              onClick={() => setCurrentIdx((i) => Math.min(practiceCards.length - 1, i + 1))}
              disabled={currentIdx >= practiceCards.length - 1}
              className="px-4 py-2 rounded-xl bg-kawaii-500 text-white text-xs font-bold disabled:opacity-40"
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
      <div className="max-w-md mx-auto space-y-6 pb-16">
        <div className="flex items-center justify-between">
          <button
            onClick={() => setMode('menu')}
            className="p-2 rounded-xl bg-white dark:bg-dark-card border border-kawaii-100 text-xs font-bold flex items-center gap-1"
          >
            <ArrowLeft className="w-4 h-4" /> Quay lại
          </button>
          <span className="text-xs font-bold text-red-500 flex items-center gap-1">
            <Flame className="w-3.5 h-3.5 fill-red-500" /> Thẻ khó: {currentIdx + 1}/{practiceCards.length}
          </span>
        </div>

        <div className="p-8 rounded-3xl bg-red-50/40 dark:bg-dark-card border-2 border-red-200 dark:border-red-900/50 shadow-kawaii text-center space-y-4">
          <span className="text-xs font-bold text-red-500">
            ⚠️ Thẻ này đã từng bị bấm quên {currentCard?.schedule?.lapses || 1} lần!
          </span>

          <h2 className="text-4xl font-black text-gray-900 dark:text-white font-hanzi">
            {currentCard?.front}
          </h2>
          <p className="text-sm font-bold text-kawaii-600 font-mono">{currentCard?.phonetic}</p>
          <h3 className="text-2xl font-bold text-gray-800 dark:text-white font-display pt-2">
            {currentCard?.back}
          </h3>

          {currentCard?.notes && (
            <p className="text-xs text-purple-600 bg-white dark:bg-dark-bg p-2.5 rounded-xl border border-purple-200">
              💡 Mẹo nhớ: {currentCard.notes}
            </p>
          )}

          <div className="pt-4">
            <button
              onClick={() => {
                if (currentIdx + 1 < practiceCards.length) {
                  setCurrentIdx(currentIdx + 1);
                } else {
                  finishGame();
                  setMode('menu');
                }
              }}
              className="w-full py-3 rounded-2xl bg-gradient-to-r from-red-500 to-rose-500 text-white font-bold text-xs shadow-md btn-bounce"
            >
              Đã ghi nhớ lại từ này! Tiếp tục →
            </button>
          </div>
        </div>
      </div>
    );
  }

  return null;
};
