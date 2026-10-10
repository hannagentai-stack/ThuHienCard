import React from 'react';
import { X, Keyboard, Volume2, Undo2, Pause, Edit, RotateCw } from 'lucide-react';

interface ShortcutsModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const ShortcutsModal: React.FC<ShortcutsModalProps> = ({ isOpen, onClose }) => {
  if (!isOpen) return null;

  const shortcuts = [
    { key: 'Space / Enter', desc: 'Lật thẻ (xem mặt sau hoặc trước)', icon: RotateCw },
    { key: 'Phím 1', desc: 'Chấm "Lại" (Again - Quên từ)', icon: null },
    { key: 'Phím 2', desc: 'Chấm "Khó" (Hard - Nhớ khó khăn)', icon: null },
    { key: 'Phím 3', desc: 'Chấm "Tốt" (Good - Nhớ bình thường)', icon: null },
    { key: 'Phím 4', desc: 'Chấm "Dễ" (Easy - Nhớ rất rõ)', icon: null },
    { key: 'R hoặc P', desc: 'Phát lại âm thanh (Phát âm TTS)', icon: Volume2 },
    { key: 'Z', desc: 'Hoàn tác (Undo) lần chấm trước', icon: Undo2 },
    { key: 'S', desc: 'Tạm hoãn thẻ này (Suspend)', icon: Pause },
    { key: 'E', desc: 'Chỉnh sửa nhanh thẻ đang học', icon: Edit },
    { key: '?', desc: 'Bật / tắt bảng trợ giúp phím tắt này', icon: Keyboard },
    { key: 'Esc', desc: 'Đóng cửa sổ / Thoát phiên học', icon: null },
  ];

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center sm:p-4 bg-black/40 backdrop-blur-xs animate-fade-in">
      <div className="fixed inset-0 -z-10" onClick={onClose} />

      <div
        style={{ paddingBottom: 'max(env(safe-area-inset-bottom, 0px), 16px)' }}
        className="relative w-full max-w-lg bg-white dark:bg-dark-card rounded-t-3xl sm:rounded-3xl shadow-kawaii-lg border-t-2 sm:border-2 border-kawaii-200 dark:border-dark-border p-5 sm:p-6 overflow-hidden max-h-[85dvh] flex flex-col animate-bottom-sheet sm:animate-none"
      >
        {/* Thanh kéo vuốt Bottom Sheet trên Mobile */}
        <div className="w-12 h-1.5 rounded-full bg-kawaii-200 dark:bg-dark-border mx-auto mb-2 sm:hidden shrink-0" />

        {/* Nút đóng */}
        <button
          onClick={onClose}
          className="absolute top-4 right-4 w-10 h-10 flex items-center justify-center text-gray-400 hover:text-gray-600 dark:hover:text-gray-200 rounded-full hover:bg-kawaii-50 dark:hover:bg-dark-cardHover transition-colors touch-manipulation"
          aria-label="Đóng"
        >
          <X className="w-5 h-5" />
        </button>

        <div className="flex items-center gap-3 mb-4 shrink-0 pr-8">
          <div className="p-2.5 rounded-2xl bg-kawaii-100 dark:bg-dark-bg text-kawaii-600 dark:text-kawaii-400 shrink-0">
            <Keyboard className="w-5 h-5 sm:w-6 sm:h-6" />
          </div>
          <div>
            <h3 className="text-lg sm:text-xl font-bold font-display text-gray-800 dark:text-dark-text">
              Bảng Phím Tắt Tiện Lợi ⌨️
            </h3>
            <p className="text-xs text-gray-500 dark:text-dark-textMuted">
              Học nhanh bằng bàn phím trên máy tính
            </p>
          </div>
        </div>

        {/* Danh sách phím tắt */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 overflow-y-auto pr-1 flex-1">
          {shortcuts.map((item, idx) => (
            <div
              key={idx}
              className="flex items-center justify-between p-2.5 rounded-2xl bg-kawaii-50/70 dark:bg-dark-bg/60 border border-kawaii-100 dark:border-dark-border"
            >
              <div className="flex items-center gap-2 min-w-0">
                {item.icon && <item.icon className="w-4 h-4 text-kawaii-500 shrink-0" />}
                <span className="text-xs text-gray-700 dark:text-gray-300 font-medium truncate">
                  {item.desc}
                </span>
              </div>
              <kbd className="px-2 py-1 rounded-lg bg-white dark:bg-dark-card border border-kawaii-200 dark:border-dark-border text-xs font-mono font-bold text-kawaii-600 dark:text-kawaii-400 shadow-xs shrink-0 ml-2">
                {item.key}
              </kbd>
            </div>
          ))}
        </div>

        <div className="mt-3 pt-3 border-t border-kawaii-100 dark:border-dark-border text-center shrink-0">
          <p className="text-[11px] text-gray-400 dark:text-gray-500">
            Mẹo: Trên điện thoại cảm ứng, chạm trực tiếp vào thẻ để lật và dùng ngón cái bấm 4 nút điểm 📱
          </p>
        </div>

      </div>
    </div>
  );
};
