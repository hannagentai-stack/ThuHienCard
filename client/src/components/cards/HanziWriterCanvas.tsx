import React, { useEffect, useRef, useState } from 'react';
import HanziWriter from 'hanzi-writer';
import { Play, RotateCcw, PenTool, Eye, EyeOff } from 'lucide-react';

interface HanziWriterCanvasProps {
  characters: string;
  size?: number;
  className?: string;
  onQuizComplete?: (summary: any) => void;
}

export const HanziWriterCanvas: React.FC<HanziWriterCanvasProps> = ({
  characters,
  size = 180,
  className = '',
  onQuizComplete,
}) => {
  // Lọc chỉ lấy các ký tự chữ Hán thực tế (Unicode range 4E00-9FFF)
  const hanziList = (characters.match(/[\u4e00-\u9fa5]/g) || []).slice(0, 4);

  const [selectedCharIndex, setSelectedCharIndex] = useState(0);
  const [isQuizzing, setIsQuizzing] = useState(false);
  const [showOutline, setShowOutline] = useState(true);
  const [quizScore, setQuizScore] = useState<number | null>(null);

  const containerRef = useRef<HTMLDivElement>(null);
  const writerRef = useRef<HanziWriter | null>(null);

  const currentChar = hanziList[selectedCharIndex] || '';

  useEffect(() => {
    if (!currentChar || !containerRef.current) return;

    // Xóa nội dung cũ trong container
    containerRef.current.innerHTML = '';
    setQuizScore(null);

    try {
      const writer = HanziWriter.create(containerRef.current, currentChar, {
        width: size,
        height: size,
        padding: 10,
        showOutline,
        strokeAnimationSpeed: 1.2,
        delayBetweenStrokes: 150,
        strokeColor: '#FF5C9E',      // Màu nét hồng pastel
        radicalColor: '#9333EA',     // Màu bộ thủ tím nổi bật
        outlineColor: '#F3E8FF',     // Viền mờ
        drawingColor: '#E11D48',     // Nét người dùng tự vẽ
        highlightColor: '#10B981',   // Xanh lá khi vẽ đúng nét
      });

      writerRef.current = writer;

      if (!isQuizzing) {
        writer.animateCharacter();
      } else {
        startQuiz(writer);
      }
    } catch (err) {
      console.warn('Lỗi khởi tạo HanziWriter:', err);
    }

    return () => {
      writerRef.current = null;
    };
  }, [currentChar, size, showOutline, isQuizzing]);

  const handleAnimate = () => {
    setIsQuizzing(false);
    setQuizScore(null);
    writerRef.current?.animateCharacter();
  };

  const handleReset = () => {
    if (writerRef.current) {
      if (isQuizzing) {
        startQuiz(writerRef.current);
      } else {
        writerRef.current.animateCharacter();
      }
    }
  };

  const startQuiz = (writer: HanziWriter) => {
    setQuizScore(null);
    writer.quiz({
      onComplete: (summary) => {
        const accuracy = Math.max(0, Math.round(100 - (summary.totalMistakes * 15)));
        setQuizScore(accuracy);
        onQuizComplete?.(summary);
      },
    });
  };

  const handleToggleQuiz = () => {
    setIsQuizzing(!isQuizzing);
  };

  if (hanziList.length === 0) {
    return null;
  }

  return (
    <div className={`flex flex-col items-center p-3 rounded-2xl bg-pink-50/50 dark:bg-dark-bg/60 border border-kawaii-200 dark:border-dark-border ${className}`}>
      
      {/* Tab chọn chữ Hán nếu từ có nhiều hơn 1 chữ */}
      {hanziList.length > 1 && (
        <div className="flex gap-1.5 mb-2 bg-white/70 dark:bg-dark-card p-1 rounded-xl border border-kawaii-100 dark:border-dark-border">
          {hanziList.map((char, idx) => (
            <button
              key={idx}
              type="button"
              onClick={() => { setSelectedCharIndex(idx); setIsQuizzing(false); }}
              className={`px-2.5 py-1 text-sm font-bold rounded-lg transition-all ${
                selectedCharIndex === idx
                  ? 'bg-kawaii-500 text-white shadow-sm'
                  : 'text-gray-600 dark:text-gray-300 hover:text-kawaii-500'
              }`}
            >
              {char}
            </button>
          ))}
        </div>
      )}

      {/* Khung vẽ nét chữ Hán với lưới ô vuông mễ tự (米) */}
      <div className="relative rounded-2xl bg-white dark:bg-dark-card p-2 shadow-inner border border-kawaii-100 dark:border-dark-border overflow-hidden">
        
        {/* Đường kẻ mờ ô chữ mễ tự */}
        <svg
          className="absolute inset-0 w-full h-full pointer-events-none opacity-20 stroke-kawaii-400"
          strokeDasharray="4 4"
        >
          <line x1="0" y1="0" x2="100%" y2="100%" strokeWidth="1" />
          <line x1="100%" y1="0" x2="0" y2="100%" strokeWidth="1" />
          <line x1="50%" y1="0" x2="50%" y2="100%" strokeWidth="1" />
          <line x1="0" y1="50%" x2="100%" y2="50%" strokeWidth="1" />
        </svg>

        <div ref={containerRef} className="relative z-10 cursor-crosshair" />

        {/* Thông báo điểm chấm tập viết */}
        {quizScore !== null && (
          <div className="absolute inset-0 bg-white/90 dark:bg-dark-card/90 flex flex-col items-center justify-center z-20 animate-fade-in text-center p-3">
            <span className="text-3xl">🎉</span>
            <span className="text-base font-bold text-gray-800 dark:text-white mt-1">
              Đạt {quizScore}% độ chuẩn!
            </span>
            <button
              onClick={handleReset}
              className="mt-2 px-3 py-1 bg-kawaii-500 text-white rounded-lg text-xs font-bold shadow-sm"
            >
              Viết lại
            </button>
          </div>
        )}
      </div>

      {/* Thanh điều khiển nét viết */}
      <div className="flex items-center gap-1.5 mt-2.5">
        <button
          type="button"
          onClick={handleAnimate}
          title="Xem thứ tự nét viết"
          className="p-1.5 rounded-xl bg-white dark:bg-dark-card hover:bg-kawaii-50 text-kawaii-600 dark:text-kawaii-400 border border-kawaii-200 dark:border-dark-border text-xs flex items-center gap-1 font-semibold transition-all"
        >
          <Play className="w-3.5 h-3.5" />
          <span className="hidden sm:inline">Phát nét</span>
        </button>

        <button
          type="button"
          onClick={handleToggleQuiz}
          title={isQuizzing ? 'Hủy tập viết' : 'Tập viết từng nét'}
          className={`p-1.5 rounded-xl border text-xs flex items-center gap-1 font-semibold transition-all ${
            isQuizzing
              ? 'bg-rose-500 text-white border-rose-600 shadow-sm'
              : 'bg-white dark:bg-dark-card hover:bg-kawaii-50 text-purple-600 dark:text-purple-400 border-purple-200 dark:border-dark-border'
          }`}
        >
          <PenTool className="w-3.5 h-3.5" />
          <span>{isQuizzing ? 'Đang tập viết' : 'Tập viết'}</span>
        </button>

        <button
          type="button"
          onClick={() => setShowOutline(!showOutline)}
          title={showOutline ? 'Ẩn nét mờ' : 'Hiện nét mờ'}
          className="p-1.5 rounded-xl bg-white dark:bg-dark-card hover:bg-kawaii-50 text-gray-500 border border-gray-200 dark:border-dark-border text-xs transition-all"
        >
          {showOutline ? <Eye className="w-3.5 h-3.5" /> : <EyeOff className="w-3.5 h-3.5" />}
        </button>

        <button
          type="button"
          onClick={handleReset}
          title="Làm lại"
          className="p-1.5 rounded-xl bg-white dark:bg-dark-card hover:bg-kawaii-50 text-gray-500 border border-gray-200 dark:border-dark-border text-xs transition-all"
        >
          <RotateCcw className="w-3.5 h-3.5" />
        </button>
      </div>

    </div>
  );
};
