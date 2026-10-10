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

  // Tính toán kích thước co giãn theo màn hình điện thoại (tối đa bằng size hoặc vừa khung 360px)
  const [responsiveSize, setResponsiveSize] = useState(size);

  useEffect(() => {
    const handleResize = () => {
      const availableWidth = window.innerWidth - 64;
      setResponsiveSize(Math.min(size, Math.max(160, availableWidth)));
    };
    handleResize();
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, [size]);

  useEffect(() => {
    if (!currentChar || !containerRef.current) return;

    // Xóa nội dung cũ trong container
    containerRef.current.innerHTML = '';
    setQuizScore(null);

    try {
      const writer = HanziWriter.create(containerRef.current, currentChar, {
        width: responsiveSize,
        height: responsiveSize,
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
  }, [currentChar, responsiveSize, showOutline, isQuizzing]);

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
              className={`px-3 py-1.5 text-base font-bold rounded-lg transition-all min-h-[44px] min-w-[44px] flex items-center justify-center ${
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
      <div className="relative rounded-2xl bg-white dark:bg-dark-card p-2 shadow-inner border border-kawaii-100 dark:border-dark-border overflow-hidden select-none">
        
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

        {/* Khung chứa Canvas - QUAN TRỌNG: touch-action: none để không cuộn trang khi vẽ */}
        <div
          ref={containerRef}
          style={{ touchAction: 'none' }}
          className="relative z-10 cursor-crosshair touch-none"
        />

        {/* Thông báo điểm chấm tập viết */}
        {quizScore !== null && (
          <div className="absolute inset-0 bg-white/95 dark:bg-dark-card/95 flex flex-col items-center justify-center z-20 animate-fade-in text-center p-3">
            <span className="text-4xl animate-bounce">🎉</span>
            <span className="text-base font-extrabold text-gray-800 dark:text-white mt-1">
              Đạt {quizScore}% độ chuẩn!
            </span>
            <button
              onClick={handleReset}
              className="mt-2.5 px-4 py-2 min-h-[44px] bg-kawaii-500 text-white rounded-xl text-xs font-bold shadow-kawaii active:scale-95"
            >
              Viết lại nét này
            </button>
          </div>
        )}
      </div>

      {/* Thanh điều khiển nét viết - Chuẩn vùng ngón cái 44px */}
      <div className="flex items-center gap-2 mt-3">
        <button
          type="button"
          onClick={handleAnimate}
          title="Xem thứ tự nét viết"
          className="px-3 py-2 min-h-[44px] rounded-xl bg-white dark:bg-dark-card hover:bg-kawaii-50 text-kawaii-600 dark:text-kawaii-400 border border-kawaii-200 dark:border-dark-border text-xs flex items-center gap-1.5 font-bold transition-all active:scale-95"
        >
          <Play className="w-4 h-4" />
          <span>Phát nét</span>
        </button>

        <button
          type="button"
          onClick={handleToggleQuiz}
          title={isQuizzing ? 'Hủy tập viết' : 'Tập viết từng nét'}
          className={`px-3 py-2 min-h-[44px] rounded-xl border text-xs flex items-center gap-1.5 font-bold transition-all active:scale-95 ${
            isQuizzing
              ? 'bg-rose-500 text-white border-rose-600 shadow-sm'
              : 'bg-white dark:bg-dark-card hover:bg-kawaii-50 text-purple-600 dark:text-purple-400 border-purple-200 dark:border-dark-border'
          }`}
        >
          <PenTool className="w-4 h-4" />
          <span>{isQuizzing ? 'Đang tập viết' : 'Tập viết'}</span>
        </button>

        <button
          type="button"
          onClick={() => setShowOutline(!showOutline)}
          title={showOutline ? 'Ẩn nét mờ' : 'Hiện nét mờ'}
          className="w-11 h-11 flex items-center justify-center rounded-xl bg-white dark:bg-dark-card hover:bg-kawaii-50 text-gray-500 border border-gray-200 dark:border-dark-border text-xs transition-all active:scale-95"
          aria-label={showOutline ? 'Ẩn nét mờ' : 'Hiện nét mờ'}
        >
          {showOutline ? <Eye className="w-4 h-4" /> : <EyeOff className="w-4 h-4" />}
        </button>

        <button
          type="button"
          onClick={handleReset}
          title="Làm lại"
          className="w-11 h-11 flex items-center justify-center rounded-xl bg-white dark:bg-dark-card hover:bg-kawaii-50 text-gray-500 border border-gray-200 dark:border-dark-border text-xs transition-all active:scale-95"
          aria-label="Làm lại"
        >
          <RotateCcw className="w-4 h-4" />
        </button>
      </div>

    </div>
  );
};
