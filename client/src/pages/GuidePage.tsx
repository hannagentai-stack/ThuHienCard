import React, { useState } from 'react';
import { BookOpen, Sparkles, HelpCircle, Brain, ChevronDown, ChevronUp } from 'lucide-react';
import { Mascot } from '../components/common/Mascot';

interface GuidePageProps {
  onOpenTour?: () => void;
}

export const GuidePage: React.FC<GuidePageProps> = ({ onOpenTour }) => {
  const [openFaq, setOpenFaq] = useState<number | null>(0);

  const faqs = [
    {
      q: 'Thuật toán SRS (FSRS v4) hoạt động như thế nào?',
      a: 'SRS (Spaced Repetition System) là phương pháp lặp lại ngắt quãng. Khi bạn mới học một từ vựng, não bộ sẽ quên rất nhanh. Ứng dụng sử dụng FSRS v4 để tính toán thời điểm chính xác ngay trước khi bạn chuẩn bị quên từ đó để nhắc bạn ôn lại (ví dụ sau 10 phút, 1 ngày, 3 ngày, 10 ngày, 1 tháng...). Nhờ đó, bạn ôn ít hơn nhưng nhớ lâu gấp đôi!',
    },
    {
      q: 'Tôi nên đánh giá 4 nút (Lại, Khó, Tốt, Dễ) như thế nào?',
      a: '• Lại (1): Bạn hoàn toàn không nhớ nghĩa hoặc đoán sai hoàn toàn. Thẻ sẽ xuất hiện lại ngay trong vài phút.\n• Khó (2): Bạn nhớ ra nghĩa nhưng phải suy nghĩ rất lâu hoặc còn lúng túng.\n• Tốt (3): Bạn nhớ được nghĩa với tốc độ bình thường (đây là nút bạn nên bấm nhiều nhất).\n• Dễ (4): Bạn vừa nhìn thấy từ là đã biết ngay lập tức mà không cần suy nghĩ một giây nào.',
    },
    {
      q: 'Làm thế nào để nhập bộ từ vựng từ file Excel?',
      a: 'Vào mục "Bộ thẻ của tôi" -> Chọn "Nhập từ Excel". Bạn có thể tải file mẫu (.xlsx) về điền từ vào, hoặc kéo thả file Excel có sẵn của bạn. Hệ thống sẽ tự động ghép các cột Mặt trước, Mặt sau, Phiên âm, Ví dụ... và tự động điền Pinyin cho tiếng Trung nếu bị trống!',
    },
    {
      q: 'Luyện viết chữ Hán hoạt động ra sao?',
      a: 'Ứng dụng tích hợp thư viện Hanzi Writer. Với các thẻ tiếng Trung, bạn có thể bấm xem thứ tự từng nét viết (nét nào trước, nét nào sau) hoặc chuyển sang chế độ "Tập viết" để tự dùng chuột/ngón tay viết theo từng nét và nhận chấm điểm!',
    },
    {
      q: 'Streak Freeze (Đóng băng chuỗi học) là gì?',
      a: 'Mỗi tài khoản được tặng sẵn 2 lượt đóng băng chuỗi ngày học. Nếu vào một ngày bạn quá bận rộn và quên học, hệ thống sẽ tự động sử dụng 1 lượt đóng băng để bảo vệ số ngày học liên tục (Streak) của bạn không bị về 0.',
    },
    {
      q: 'Ứng dụng có thể học khi không có mạng (Offline) không?',
      a: 'Hoàn toàn được! Ứng dụng hỗ trợ PWA và cơ sở dữ liệu IndexedDB Dexie. Mọi thẻ bạn đã học và lịch ôn tập đều được lưu trên thiết bị của bạn. Khi có kết nối mạng trở lại, hệ thống sẽ tự động đồng bộ lên đám mây.',
    },
  ];

  return (
    <div className="max-w-4xl mx-auto space-y-10 pb-16">
      
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="p-3 rounded-2xl bg-kawaii-100 dark:bg-dark-card text-kawaii-600 dark:text-kawaii-400">
            <BookOpen className="w-6 h-6" />
          </div>
          <div>
            <h1 className="text-2xl sm:text-3xl font-display font-extrabold text-gray-900 dark:text-white">
              Hướng Dẫn Sử Dụng & FAQ 📖
            </h1>
            <p className="text-xs text-gray-500 dark:text-dark-textMuted">
              Khám phá bí quyết học từ vựng hiệu quả cùng Thu Hiền EDU
            </p>
          </div>
        </div>

        {onOpenTour && (
          <button
            onClick={onOpenTour}
            className="self-start sm:self-auto px-4 py-2 rounded-2xl bg-gradient-to-r from-kawaii-400 to-kawaii-500 text-white font-bold text-xs shadow-kawaii btn-bounce flex items-center gap-1.5"
          >
            <Sparkles className="w-3.5 h-3.5" />
            <span>Mở tour hướng dẫn (4 bước)</span>
          </button>
        )}
      </div>

      {/* 1. GIẢI THÍCH SRS VỚI HÌNH ẢNH MINH HỌA DỄ THƯƠNG */}
      <div className="p-6 sm:p-8 rounded-3xl bg-gradient-to-br from-pink-50 via-white to-purple-50 dark:from-dark-card dark:via-dark-bg dark:to-dark-card border-2 border-kawaii-200 dark:border-dark-border shadow-kawaii">
        <div className="grid grid-cols-1 md:grid-cols-12 gap-6 items-center">
          
          <div className="md:col-span-8 space-y-3">
            <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-kawaii-100 dark:bg-dark-bg text-kawaii-600 dark:text-kawaii-400 text-xs font-bold">
              <Brain className="w-3.5 h-3.5" />
              <span>Khoa Học Về Trí Nhớ</span>
            </div>
            <h2 className="text-xl sm:text-2xl font-bold font-display text-gray-900 dark:text-white">
              Đường Cong Quên Lãng & Thuật Toán FSRS 🌸
            </h2>
            <p className="text-xs sm:text-sm text-gray-600 dark:text-dark-textMuted leading-relaxed">
              Theo nhà tâm lý học Hermann Ebbinghaus, não người quên tới 70% lượng kiến thức mới học chỉ sau 24 giờ nếu không được nhắc lại.
            </p>
            <p className="text-xs sm:text-sm text-gray-600 dark:text-dark-textMuted leading-relaxed">
              Thay vì nhồi nhét hàng trăm từ trong 1 đêm rồi quên sạch, thuật toán FSRS của Thu Hiền EDU sẽ chia nhỏ việc ôn tập: chỉ cần <strong>10–15 phút mỗi ngày</strong> đúng vào thời điểm vàng, bạn sẽ khắc sâu từ vựng vào trí nhớ dài hạn suốt đời!
            </p>
          </div>

          <div className="md:col-span-4 flex flex-col items-center justify-center text-center p-4 bg-white dark:bg-dark-bg rounded-2xl border border-kawaii-100 dark:border-dark-border">
            <Mascot id="bunny_pink" mood="studying" size="lg" />
            <span className="text-xs font-bold text-kawaii-600 dark:text-kawaii-400 mt-2">
              Học ít hơn, nhớ lâu hơn! ✨
            </span>
          </div>

        </div>
      </div>

      {/* 2. CÁC BƯỚC BẮT ĐẦU NHANH */}
      <div className="space-y-4">
        <h2 className="text-xl font-bold font-display text-gray-900 dark:text-white flex items-center gap-2">
          <Sparkles className="w-5 h-5 text-kawaii-500" />
          <span>3 Bước Bắt Đầu Nhanh Cho Người Mới</span>
        </h2>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <div className="p-5 rounded-2xl bg-white dark:bg-dark-card border border-kawaii-200 dark:border-dark-border space-y-2">
            <div className="w-8 h-8 rounded-full bg-kawaii-500 text-white font-bold text-sm flex items-center justify-center shadow-sm">
              1
            </div>
            <h3 className="font-bold text-sm text-gray-800 dark:text-white">Khám phá bộ thẻ mẫu</h3>
            <p className="text-xs text-gray-500 dark:text-dark-textMuted">
              Tài khoản của bạn đã có sẵn 10 từ HSK1 tiếng Trung và 10 từ tiếng Anh Oxford để bạn trải nghiệm ngay.
            </p>
          </div>

          <div className="p-5 rounded-2xl bg-white dark:bg-dark-card border border-kawaii-200 dark:border-dark-border space-y-2">
            <div className="w-8 h-8 rounded-full bg-purple-500 text-white font-bold text-sm flex items-center justify-center shadow-sm">
              2
            </div>
            <h3 className="font-bold text-sm text-gray-800 dark:text-white">Ôn tập thẻ mỗi ngày</h3>
            <p className="text-xs text-gray-500 dark:text-dark-textMuted">
              Chạm hoặc bấm <kbd className="px-1.5 py-0.5 rounded bg-gray-100 dark:bg-dark-bg text-[10px] font-mono">Space</kbd> để lật thẻ, sau đó chọn 1 trong 4 mức đánh giá phù hợp.
            </p>
          </div>

          <div className="p-5 rounded-2xl bg-white dark:bg-dark-card border border-kawaii-200 dark:border-dark-border space-y-2">
            <div className="w-8 h-8 rounded-full bg-emerald-500 text-white font-bold text-sm flex items-center justify-center shadow-sm">
              3
            </div>
            <h3 className="font-bold text-sm text-gray-800 dark:text-white">Duy trì Streak liên tục</h3>
            <p className="text-xs text-gray-500 dark:text-dark-textMuted">
              Hoàn thành mục tiêu 20 thẻ/ngày để giữ ngọn lửa Streak rực rỡ, tích lũy XP và nâng cấp huy hiệu.
            </p>
          </div>
        </div>
      </div>

      {/* 3. CÂU HỎI THƯỜNG GẶP (FAQ ACCORDION) */}
      <div className="space-y-4">
        <h2 className="text-xl font-bold font-display text-gray-900 dark:text-white flex items-center gap-2">
          <HelpCircle className="w-5 h-5 text-purple-500" />
          <span>Câu Hỏi Thường Gặp (FAQ)</span>
        </h2>

        <div className="space-y-3">
          {faqs.map((faq, idx) => {
            const isOpen = openFaq === idx;
            return (
              <div
                key={idx}
                className="rounded-2xl bg-white dark:bg-dark-card border border-kawaii-100 dark:border-dark-border overflow-hidden transition-all"
              >
                <button
                  type="button"
                  onClick={() => setOpenFaq(isOpen ? null : idx)}
                  className="w-full p-4 text-left flex items-center justify-between gap-4 font-bold text-sm text-gray-800 dark:text-white hover:text-kawaii-600 transition-colors"
                >
                  <span>{faq.q}</span>
                  {isOpen ? (
                    <ChevronUp className="w-4 h-4 text-kawaii-500 shrink-0" />
                  ) : (
                    <ChevronDown className="w-4 h-4 text-gray-400 shrink-0" />
                  )}
                </button>

                {isOpen && (
                  <div className="px-4 pb-4 text-xs sm:text-sm text-gray-600 dark:text-dark-textMuted whitespace-pre-line leading-relaxed border-t border-gray-50 dark:border-dark-border pt-3">
                    {faq.a}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>

    </div>
  );
};
