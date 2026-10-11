import React, { useState, useEffect } from 'react';
import { X, ChevronRight, ChevronLeft, Sparkles, Brain, PenTool, WifiOff } from 'lucide-react';
import { Mascot, type MascotId } from './Mascot';

interface OnboardingTourProps {
  forceOpen?: boolean;
  onClose?: () => void;
}

interface Step {
  title: string;
  subtitle: string;
  description: string;
  mascot: MascotId;
  mascotMood: 'normal' | 'happy' | 'winking' | 'shy' | 'studying';
  icon: React.ReactNode;
  highlight: string;
}

export const OnboardingTour: React.FC<OnboardingTourProps> = ({
  forceOpen = false,
  onClose,
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const [currentStep, setCurrentStep] = useState(0);

  const steps: Step[] = [
    {
      title: 'Chào mừng đến Thu Hiền EDU! 🌸',
      subtitle: 'Học tiếng Trung & Tiếng Anh siêu tốc',
      description:
        'Hệ thống flashcard thông minh được thiết kế đặc biệt cho người Việt. Tự động phiên âm Pinyin, phiên âm quốc tế IPA, ví dụ ngữ cảnh và phát âm chuẩn bản xứ.',
      mascot: 'bunny_pink',
      mascotMood: 'happy',
      icon: <Sparkles className="w-4 h-4 text-kawaii-500" />,
      highlight: 'Học thông minh, nhớ lâu dài',
    },
    {
      title: 'Thuật toán SRS FSRS v4 🧠',
      subtitle: 'Khoa học ghi nhớ thế hệ mới',
      description:
        'Vượt trội hơn 20-30% so với Anki SM-2 truyền thống. Tự động tính toán độ khó (Difficulty) và độ bền (Stability) của từng từ để xếp lịch ôn tập đúng thời điểm vàng.',
      mascot: 'kitty_purple',
      mascotMood: 'studying',
      icon: <Brain className="w-4 h-4 text-purple-500" />,
      highlight: 'Chu kỳ ôn tập tối ưu theo não bộ',
    },
    {
      title: '8 Chế độ & Viết chữ Hán ✍️',
      subtitle: 'Đa giác quan: Nghe, Nhìn, Gõ, Viết',
      description:
        'Tập viết từng nét chữ Hán chuẩn theo thứ tự quy chuẩn với Hanzi Writer, thử thách 60 giây tăng tốc, gõ từ luyện nhớ chính xác và trắc nghiệm phản xạ.',
      mascot: 'star_gold',
      mascotMood: 'winking',
      icon: <PenTool className="w-4 h-4 text-amber-500" />,
      highlight: 'Biến việc học thành trò chơi thú vị',
    },
    {
      title: 'Học ngoại tuyến & Cài PWA 📱',
      subtitle: 'Mọi lúc mọi nơi, không lo mất mạng',
      description:
        'Ứng dụng hoạt động mượt mà ngay cả khi mất mạng nhờ IndexedDB. Dữ liệu sẽ tự động đồng bộ khi có Internet. Bạn có thể cài đặt trực tiếp lên điện thoại như một App thông thường!',
      mascot: 'boba_mint',
      mascotMood: 'happy',
      icon: <WifiOff className="w-4 h-4 text-emerald-500" />,
      highlight: 'Sẵn sàng học tập ở bất cứ đâu',
    },
  ];

  useEffect(() => {
    if (forceOpen) {
      setIsOpen(true);
      setCurrentStep(0);
      return;
    }
    const seen = localStorage.getItem('onboarding_seen');
    if (!seen) {
      setIsOpen(true);
    }
  }, [forceOpen]);

  const handleFinish = () => {
    localStorage.setItem('onboarding_seen', 'true');
    setIsOpen(false);
    if (onClose) onClose();
  };

  const handleNext = () => {
    if (currentStep < steps.length - 1) {
      setCurrentStep((prev) => prev + 1);
    } else {
      handleFinish();
    }
  };

  const handlePrev = () => {
    if (currentStep > 0) {
      setCurrentStep((prev) => prev - 1);
    }
  };

  if (!isOpen) return null;

  const step = steps[currentStep];

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/50 backdrop-blur-xs animate-fade-in">
      <div className="relative w-full max-w-md bg-white dark:bg-dark-card rounded-3xl shadow-kawaii-lg border-2 border-kawaii-200 dark:border-dark-border overflow-hidden max-h-[92dvh] flex flex-col">
        {/* Nút đóng lớn chuẩn chạm ngón cái */}
        <button
          onClick={handleFinish}
          className="absolute top-3 right-3 z-10 w-10 h-10 flex items-center justify-center rounded-full text-gray-400 hover:text-gray-600 dark:hover:text-gray-200 hover:bg-white/60 dark:hover:bg-dark-bg transition-colors touch-manipulation"
          aria-label="Đóng hướng dẫn"
        >
          <X className="w-5 h-5" />
        </button>

        {/* Nền hoạt họa Header */}
        <div className="relative bg-gradient-to-br from-kawaii-100 via-pink-50 to-kawaii-200 dark:from-dark-card dark:via-pink-950/20 dark:to-dark-cardHover pt-6 pb-3 px-4 flex flex-col items-center border-b border-kawaii-100 dark:border-dark-border shrink-0">
          <div className="relative animate-bounce">
            <Mascot id={step.mascot} mood={step.mascotMood} size="md" />
          </div>
          <div className="mt-1.5 inline-flex items-center gap-1.5 px-3 py-0.5 rounded-full bg-white/80 dark:bg-dark-card/80 backdrop-blur-xs text-[11px] font-bold text-kawaii-600 dark:text-kawaii-400 shadow-xs border border-kawaii-200/50 dark:border-dark-border">
            {step.icon}
            <span>{step.highlight}</span>
          </div>
        </div>

        {/* Nội dung bước có cuộn an toàn */}
        <div className="p-4 sm:p-6 space-y-3 text-center flex-1 overflow-y-auto">
          <div>
            <h3 className="font-display font-extrabold text-lg sm:text-xl text-gray-800 dark:text-gray-100">
              {step.title}
            </h3>
            <p className="text-xs font-semibold text-kawaii-500 dark:text-kawaii-400 mt-0.5">
              {step.subtitle}
            </p>
          </div>

          <p className="text-xs sm:text-sm text-gray-600 dark:text-gray-300 leading-relaxed max-w-sm mx-auto">
            {step.description}
          </p>

          {/* Dots Chỉ số tiến trình */}
          <div className="flex items-center justify-center gap-2 pt-1">
            {steps.map((_, idx) => (
              <button
                key={idx}
                onClick={() => setCurrentStep(idx)}
                className={`h-2 rounded-full transition-all duration-300 ${
                  idx === currentStep
                    ? 'w-7 bg-kawaii-500'
                    : 'w-2 bg-kawaii-200 dark:bg-gray-700 hover:bg-kawaii-300'
                }`}
                aria-label={`Đi tới bước ${idx + 1}`}
              />
            ))}
          </div>
        </div>

        {/* Chân trang Điều hướng chuẩn ngón cái */}
        <div
          style={{ paddingBottom: 'max(env(safe-area-inset-bottom, 0px), 12px)' }}
          className="px-4 py-3 bg-gray-50/80 dark:bg-dark-bg/60 border-t border-kawaii-100 dark:border-dark-border flex items-center justify-between shrink-0"
        >
          <button
            onClick={handleFinish}
            className="text-xs font-bold text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 transition-colors px-2 py-2 min-h-[44px] flex items-center"
          >
            Bỏ qua
          </button>

          <div className="flex items-center gap-2">
            {currentStep > 0 && (
              <button
                onClick={handlePrev}
                className="px-3.5 py-2 min-h-[44px] rounded-2xl text-xs font-bold text-gray-600 dark:text-gray-300 bg-white dark:bg-dark-card border border-kawaii-200 dark:border-dark-border hover:bg-kawaii-50 dark:hover:bg-dark-cardHover transition-colors flex items-center gap-1 active:scale-95"
              >
                <ChevronLeft className="w-4 h-4" />
                <span>Trước</span>
              </button>
            )}

            <button
              onClick={handleNext}
              className="px-4 py-2 min-h-[44px] rounded-2xl text-xs font-bold text-white bg-gradient-to-r from-kawaii-500 to-kawaii-600 shadow-kawaii active:scale-95 flex items-center gap-1"
            >
              <span>{currentStep === steps.length - 1 ? 'Bắt đầu ngay!' : 'Tiếp theo'}</span>
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
