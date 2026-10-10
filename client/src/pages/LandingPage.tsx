import React, { useState } from 'react';
import {
  Sparkles,
  Layers,
  CheckCircle2,
  Volume2,
  RotateCw,
  ArrowRight,
  Heart,
} from 'lucide-react';

interface LandingPageProps {
  onOpenAuth: (mode?: 'login' | 'register') => void;
  onGoToDecks: () => void;
  onGoToGuide: () => void;
}

export const LandingPage: React.FC<LandingPageProps> = ({
  onOpenAuth,
  onGoToDecks,
  onGoToGuide,
}) => {
  // Thẻ tương tác thử nghiệm ngay trên trang chủ
  const [isFlipped, setIsFlipped] = useState(false);
  const [demoLang, setDemoLang] = useState<'zh' | 'en'>('zh');

  const demoCard = demoLang === 'zh'
    ? {
        front: '喜欢',
        pinyin: 'xǐ huan',
        back: 'Thích, yêu thích',
        example: '我喜欢学习汉语。 (Tôi thích học tiếng Hán.)',
        type: 'Động từ',
        level: 'HSK 1',
      }
    : {
        front: 'Serendipity',
        pinyin: '/ˌser.ənˈdɪp.ə.ti/',
        back: 'Sự tình cờ may mắn',
        example: 'Meeting you was pure serendipity. (Gặp bạn là may mắn tình cờ.)',
        type: 'Noun',
        level: 'B2 Oxford',
      };

  return (
    <div className="space-y-16 pb-16">
      
      {/* 1. HERO SECTION */}
      <section className="relative overflow-hidden rounded-3xl p-6 sm:p-12 bg-gradient-to-br from-kawaii-100/80 via-pink-50 to-white dark:from-dark-card dark:via-dark-bg dark:to-dark-card border-2 border-kawaii-200 dark:border-dark-border shadow-kawaii">
        
        {/* Bong bóng trang trí */}
        <div className="absolute top-4 right-10 w-40 h-40 bg-kawaii-300/20 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute -bottom-10 left-10 w-36 h-36 bg-purple-300/20 rounded-full blur-3xl pointer-events-none" />

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-center">
          
          {/* Cột chữ giới thiệu */}
          <div className="lg:col-span-7 space-y-6 text-center lg:text-left">
            <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-pill bg-white/80 dark:bg-dark-bg/80 border border-kawaii-200 dark:border-dark-border text-kawaii-600 dark:text-kawaii-400 text-xs font-bold shadow-sm">
              <Sparkles className="w-3.5 h-3.5 text-kawaii-500 animate-spin" />
              <span>Ứng dụng Flashcard Kawaii chuẩn SRS FSRS v4</span>
            </div>

            <h1 className="text-3xl sm:text-4xl lg:text-5xl font-display font-extrabold text-gray-900 dark:text-white leading-tight tracking-tight">
              Học Tiếng Trung & Tiếng Anh{' '}
              <span className="bg-gradient-to-r from-kawaii-500 via-pink-500 to-purple-500 bg-clip-text text-transparent">
                Ngọt Ngào & Bền Bỉ
              </span>{' '}
              🌸
            </h1>

            <p className="text-base sm:text-lg text-gray-600 dark:text-dark-textMuted max-w-xl mx-auto lg:mx-0 leading-relaxed">
              Ghi nhớ từ vựng lâu gấp đôi bằng thuật toán lặp lại ngắt quãng (FSRS), tập viết nét chữ Hán từng nét, phát âm chuẩn, nhập Excel 1-click và chuỗi học giữ động lực mỗi ngày!
            </p>

            {/* Nhóm nút kêu gọi hành động */}
            <div className="flex flex-wrap items-center justify-center lg:justify-start gap-3 pt-2">
              <button
                onClick={() => onOpenAuth('register')}
                className="px-6 py-3.5 rounded-2xl bg-gradient-to-r from-kawaii-400 to-kawaii-500 hover:from-kawaii-500 hover:to-kawaii-600 text-white font-bold text-sm shadow-kawaii btn-bounce flex items-center gap-2"
              >
                <Sparkles className="w-4 h-4" />
                <span>Bắt đầu miễn phí ngay</span>
              </button>

              <button
                onClick={onGoToDecks}
                className="px-6 py-3.5 rounded-2xl bg-white dark:bg-dark-card hover:bg-kawaii-50 dark:hover:bg-dark-cardHover text-gray-700 dark:text-gray-200 font-bold text-sm border-2 border-kawaii-200 dark:border-dark-border transition-all flex items-center gap-2"
              >
                <Layers className="w-4 h-4 text-kawaii-500" />
                <span>Khám phá bộ thẻ mẫu</span>
              </button>
            </div>

            {/* Các cam kết nhanh */}
            <div className="flex flex-wrap items-center justify-center lg:justify-start gap-4 text-xs font-semibold text-gray-500 dark:text-dark-textMuted pt-2">
              <span className="flex items-center gap-1.5">
                <CheckCircle2 className="w-4 h-4 text-emerald-500" /> Không cần email
              </span>
              <span className="flex items-center gap-1.5">
                <CheckCircle2 className="w-4 h-4 text-emerald-500" /> Chạy mượt khi mất mạng
              </span>
              <span className="flex items-center gap-1.5">
                <CheckCircle2 className="w-4 h-4 text-emerald-500" /> Miễn phí 100%
              </span>
            </div>
          </div>

          {/* Cột Thẻ 3D Demo trải nghiệm trực tiếp */}
          <div className="lg:col-span-5 flex flex-col items-center">
            
            {/* Chuyển đổi ngôn ngữ demo */}
            <div className="flex bg-white/80 dark:bg-dark-bg p-1 rounded-2xl border border-kawaii-200 dark:border-dark-border mb-3 shadow-sm">
              <button
                onClick={() => { setDemoLang('zh'); setIsFlipped(false); }}
                className={`px-3 py-1 text-xs font-bold rounded-xl transition-all ${
                  demoLang === 'zh'
                    ? 'bg-kawaii-500 text-white shadow-sm'
                    : 'text-gray-600 dark:text-gray-400'
                }`}
              >
                🇨🇳 Tiếng Trung (HSK)
              </button>
              <button
                onClick={() => { setDemoLang('en'); setIsFlipped(false); }}
                className={`px-3 py-1 text-xs font-bold rounded-xl transition-all ${
                  demoLang === 'en'
                    ? 'bg-purple-500 text-white shadow-sm'
                    : 'text-gray-600 dark:text-gray-400'
                }`}
              >
                🇬🇧 Tiếng Anh (Oxford)
              </button>
            </div>

            {/* Thẻ Flashcard 3D lật thử */}
            <div
              onClick={() => setIsFlipped(!isFlipped)}
              className="w-full max-w-sm h-64 cursor-pointer perspective-1000 group select-none"
            >
              <div
                className={`relative w-full h-full duration-500 transform-style-3d transition-transform ${
                  isFlipped ? 'rotate-y-180' : ''
                }`}
              >
                {/* MẶT TRƯỚC */}
                <div className="absolute inset-0 backface-hidden bg-white dark:bg-dark-card rounded-3xl p-6 border-2 border-kawaii-300 dark:border-dark-border shadow-kawaii flex flex-col justify-between items-center text-center">
                  <div className="w-full flex justify-between items-center text-xs font-bold text-gray-400">
                    <span className="px-2 py-0.5 rounded-full bg-kawaii-50 dark:bg-dark-bg text-kawaii-600 dark:text-kawaii-400">
                      {demoCard.level}
                    </span>
                    <span className="flex items-center gap-1 text-kawaii-500">
                      <RotateCw className="w-3.5 h-3.5" /> Chạm để lật
                    </span>
                  </div>

                  <div>
                    <h2 className="text-4xl sm:text-5xl font-extrabold text-gray-800 dark:text-white font-hanzi">
                      {demoCard.front}
                    </h2>
                    <p className="text-sm font-semibold text-kawaii-600 dark:text-kawaii-400 mt-2 font-mono">
                      {demoCard.pinyin}
                    </p>
                  </div>

                  <div className="text-xs text-gray-400 flex items-center gap-1">
                    <Volume2 className="w-4 h-4 text-kawaii-400" /> Tự động phát âm khi lật
                  </div>
                </div>

                {/* MẶT SAU */}
                <div className="absolute inset-0 backface-hidden rotate-y-180 bg-gradient-to-br from-pink-50 to-white dark:from-dark-card dark:to-dark-bg rounded-3xl p-6 border-2 border-kawaii-400 dark:border-kawaii-500 shadow-kawaii flex flex-col justify-between items-center text-center">
                  <div className="w-full flex justify-between items-center text-xs font-bold">
                    <span className="px-2 py-0.5 rounded-full bg-kawaii-100 dark:bg-dark-card text-kawaii-600 dark:text-kawaii-400">
                      {demoCard.type}
                    </span>
                    <span className="text-emerald-500 flex items-center gap-1">
                      <Heart className="w-3.5 h-3.5 fill-emerald-500" /> Nhớ nghĩa
                    </span>
                  </div>

                  <div>
                    <h3 className="text-2xl font-extrabold text-gray-900 dark:text-white font-display">
                      {demoCard.back}
                    </h3>
                    <p className="text-xs text-gray-600 dark:text-dark-textMuted mt-2 italic px-2">
                      "{demoCard.example}"
                    </p>
                  </div>

                  {/* 4 Nút đánh giá SRS mô phỏng */}
                  <div className="w-full grid grid-cols-4 gap-1.5 pt-2">
                    <span className="py-1 px-1 rounded-xl bg-red-100 dark:bg-red-950/60 text-red-600 text-[10px] font-bold">
                      Lại (10p)
                    </span>
                    <span className="py-1 px-1 rounded-xl bg-amber-100 dark:bg-amber-950/60 text-amber-600 text-[10px] font-bold">
                      Khó (1d)
                    </span>
                    <span className="py-1 px-1 rounded-xl bg-blue-100 dark:bg-blue-950/60 text-blue-600 text-[10px] font-bold">
                      Tốt (3d)
                    </span>
                    <span className="py-1 px-1 rounded-xl bg-emerald-100 dark:bg-emerald-950/60 text-emerald-600 text-[10px] font-bold">
                      Dễ (7d)
                    </span>
                  </div>
                </div>

              </div>
            </div>

            <p className="text-xs text-gray-400 dark:text-dark-textMuted mt-2">
              👆 Thử chạm vào thẻ trên để lật xem mặt sau và khoảng cách FSRS
            </p>
          </div>

        </div>
      </section>

      {/* 2. CÁC TÍNH NĂNG NỔI BẬT (FEATURES GRID) */}
      <section className="space-y-8">
        <div className="text-center space-y-2 max-w-2xl mx-auto">
          <h2 className="text-2xl sm:text-3xl font-display font-extrabold text-gray-900 dark:text-white">
            Bộ Công Cụ Toàn Diện Để Chinh Phục Ngoại Ngữ 🎀
          </h2>
          <p className="text-sm text-gray-600 dark:text-dark-textMuted">
            Được thiết kế dựa trên khoa học nhận thức và tâm lý học hành vi giúp việc học trở nên nhẹ nhàng, vui tươi.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          
          {/* Feature 1: FSRS v4 */}
          <div className="p-6 rounded-3xl bg-white dark:bg-dark-card border-2 border-kawaii-100 dark:border-dark-border shadow-sm hover:shadow-kawaii transition-all duration-300 space-y-3">
            <div className="w-12 h-12 rounded-2xl bg-kawaii-100 dark:bg-dark-bg text-kawaii-500 flex items-center justify-center font-bold text-xl">
              🧠
            </div>
            <h3 className="text-lg font-bold text-gray-800 dark:text-white font-display">
              Thuật Toán FSRS v4 Hiện Đại
            </h3>
            <p className="text-xs text-gray-500 dark:text-dark-textMuted leading-relaxed">
              Mô hình hóa trí nhớ chính xác hơn 30% so với SM-2 cũ. Tự động tính toán thời gian ôn tối ưu để bạn không bao giờ quên từ vựng.
            </p>
          </div>

          {/* Feature 2: Hanzi Writer */}
          <div className="p-6 rounded-3xl bg-white dark:bg-dark-card border-2 border-kawaii-100 dark:border-dark-border shadow-sm hover:shadow-kawaii transition-all duration-300 space-y-3">
            <div className="w-12 h-12 rounded-2xl bg-purple-100 dark:bg-dark-bg text-purple-500 flex items-center justify-center font-bold text-xl">
              ✍️
            </div>
            <h3 className="text-lg font-bold text-gray-800 dark:text-white font-display">
              Tập Viết Hán Tự Theo Nét
            </h3>
            <p className="text-xs text-gray-500 dark:text-dark-textMuted leading-relaxed">
              Diễn hoạt thứ tự nét chữ Hán SVG sinh động. Chấm điểm luyện viết trực tiếp trên màn hình cảm ứng hoặc chuột.
            </p>
          </div>

          {/* Feature 3: Excel Import/Export */}
          <div className="p-6 rounded-3xl bg-white dark:bg-dark-card border-2 border-kawaii-100 dark:border-dark-border shadow-sm hover:shadow-kawaii transition-all duration-300 space-y-3">
            <div className="w-12 h-12 rounded-2xl bg-emerald-100 dark:bg-dark-bg text-emerald-500 flex items-center justify-center font-bold text-xl">
              📊
            </div>
            <h3 className="text-lg font-bold text-gray-800 dark:text-white font-display">
              Nhập Excel Thông Minh 1-Click
            </h3>
            <p className="text-xs text-gray-500 dark:text-dark-textMuted leading-relaxed">
              Kéo thả file .xlsx/.csv, tự động đoán cột, bổ sung Pinyin tự động cho tiếng Trung và tải mẫu template song ngữ có sẵn.
            </p>
          </div>

          {/* Feature 4: Gamification */}
          <div className="p-6 rounded-3xl bg-white dark:bg-dark-card border-2 border-kawaii-100 dark:border-dark-border shadow-sm hover:shadow-kawaii transition-all duration-300 space-y-3">
            <div className="w-12 h-12 rounded-2xl bg-amber-100 dark:bg-dark-bg text-amber-500 flex items-center justify-center font-bold text-xl">
              🔥
            </div>
            <h3 className="text-lg font-bold text-gray-800 dark:text-white font-display">
              Chuỗi Học & Đóng Băng Streak
            </h3>
            <p className="text-xs text-gray-500 dark:text-dark-textMuted leading-relaxed">
              Tích lũy ngày học liên tục, tự động dùng Streak Freeze nếu lỡ quên 1 ngày bận rộn. Tích lũy XP, lên cấp và mở khóa huy hiệu xinh xắn.
            </p>
          </div>

          {/* Feature 5: TTS Audio */}
          <div className="p-6 rounded-3xl bg-white dark:bg-dark-card border-2 border-kawaii-100 dark:border-dark-border shadow-sm hover:shadow-kawaii transition-all duration-300 space-y-3">
            <div className="w-12 h-12 rounded-2xl bg-blue-100 dark:bg-dark-bg text-blue-500 flex items-center justify-center font-bold text-xl">
              🔊
            </div>
            <h3 className="text-lg font-bold text-gray-800 dark:text-white font-display">
              Phát Âm Chuẩn Tự Động (TTS)
            </h3>
            <p className="text-xs text-gray-500 dark:text-dark-textMuted leading-relaxed">
              Hỗ trợ giọng đọc tiếng Trung (zh-CN, zh-TW) và tiếng Anh (en-US, en-GB), tùy chỉnh tốc độ, lưu đệm âm thanh để nghe offline.
            </p>
          </div>

          {/* Feature 6: PWA Offline */}
          <div className="p-6 rounded-3xl bg-white dark:bg-dark-card border-2 border-kawaii-100 dark:border-dark-border shadow-sm hover:shadow-kawaii transition-all duration-300 space-y-3">
            <div className="w-12 h-12 rounded-2xl bg-rose-100 dark:bg-dark-bg text-rose-500 flex items-center justify-center font-bold text-xl">
              📱
            </div>
            <h3 className="text-lg font-bold text-gray-800 dark:text-white font-display">
              Cài Như App & Học Mọi Nơi
            </h3>
            <p className="text-xs text-gray-500 dark:text-dark-textMuted leading-relaxed">
              Hỗ trợ PWA cài đặt trên iOS/Android/PC. Cơ sở dữ liệu Dexie IndexedDB lưu cục bộ, tự động đồng bộ khi có mạng trở lại.
            </p>
          </div>

        </div>
      </section>

      {/* 3. BANNER HƯỚNG DẪN & BẮT ĐẦU */}
      <section className="rounded-3xl p-8 sm:p-10 bg-gradient-to-r from-kawaii-500 to-purple-600 text-white shadow-kawaii-lg flex flex-col md:flex-row items-center justify-between gap-6">
        <div className="space-y-2 text-center md:text-left">
          <h3 className="text-2xl font-bold font-display">
            Sẵn sàng mở rộng vốn từ vựng của bạn? 🌸
          </h3>
          <p className="text-sm text-pink-100 max-w-lg">
            Khám phá 10 từ vựng HSK1 và 10 từ tiếng Anh giao tiếp đã được tạo sẵn trong tài khoản ngay hôm nay.
          </p>
        </div>

        <div className="flex gap-3 shrink-0">
          <button
            onClick={onGoToGuide}
            className="px-5 py-3 rounded-2xl bg-white/20 hover:bg-white/30 backdrop-blur-md text-white font-bold text-sm transition-all"
          >
            Xem hướng dẫn
          </button>
          <button
            onClick={() => onOpenAuth('register')}
            className="px-6 py-3 rounded-2xl bg-white text-kawaii-600 hover:bg-pink-50 font-bold text-sm shadow-md btn-bounce flex items-center gap-2"
          >
            <span>Tạo tài khoản ngay</span>
            <ArrowRight className="w-4 h-4" />
          </button>
        </div>
      </section>

    </div>
  );
};
