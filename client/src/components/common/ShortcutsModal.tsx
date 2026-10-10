import React from 'react';
import { X, Keyboard, Volume2, Undo2, Pause, Edit, RotateCw } from 'lucide-react';

interface ShortcutsModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const ShortcutsModal: React.FC<ShortcutsModalProps> = ({ isOpen, onClose }) => {
  if (!isOpen) return null;

  const shortcuts = [
    { key: 'Space / Enter', desc: 'Lật thẻ (xem mặt sau hoặc mặt trước)', icon: RotateCw },
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
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-sm animate-fade-in">
      <div className="relative w-full max-w-lg bg-white dark:bg-dark-card rounded-3xl shadow-kawaii-lg border-2 border-kawaii-200 dark:border-dark-border p-6 overflow-hidden">
        
        {/* Nút đóng */}
        <button
          onClick={onClose}
          className="absolute top-4 right-4 p-2 text-gray-400 hover:text-gray-600 dark:hover:text-gray-200 rounded-full hover:bg-kawaii-50 dark:hover:bg-dark-cardHover transition-colors"
        >
          <X className="w-5 h-5" />
        </button>

        <div className="flex items-center gap-3 mb-5">
          <div className="p-2.5 rounded-2xl bg-kawaii-100 dark:bg-dark-bg text-kawaii-600 dark:text-kawaii-400">
            <Keyboard className="w-6 h-6" />
          </div>
          <div>
            <h3 className="text-xl font-bold font-display text-gray-800 dark:text-dark-text">
              Bảng Phím Tắt Tiện Lợi ⌨️
            </h3>
            <p className="text-xs text-gray-500 dark:text-dark-textMuted">
              Học nhanh hơn bằng bàn phím (không ảnh hưởng khi đang gõ chữ)
            </p>
          </div>
        </div>

        {/* Danh sách phím tắt */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 max-h-[60vh] overflow-y-auto pr-1">
          {shortcuts.map((item, idx) => (
            <div
              key={idx}
              className="flex items-center justify-between p-2.5 rounded-2xl bg-kawaii-50/70 dark:bg-dark-bg/60 border border-kawaii-100 dark:border-dark-border"
            >
              <div className="flex items-center gap-2">
                {item.icon && <item.icon className="w-3.5 h-3.5 text-kawaii-500" />}
                <span className="text-xs text-gray-700 dark:text-gray-300 font-medium">
                  {item.desc}
                </span>
              </div>
              <kbd className="px-2 py-1 rounded-lg bg-white dark:bg-dark-card border border-kawaii-200 dark:border-dark-border text-xs font-mono font-bold text-kawaii-600 dark:text-kawaii-400 shadow-sm shrink-0 ml-2">
                {item.key}
              </kbd>
            </div>
          ))}
        </div>

        <div className="mt-5 pt-3 border-t border-kawaii-100 dark:border-dark-border text-center">
          <p className="text-[11px] text-gray-400 dark:text-gray-500">
            Mẹo: Trên điện thoại cảm ứng, bạn có thể chạm để lật thẻ và bấm trực tiếp các nút lớn bên dưới 📱
          </p>
        </div>

      </div>
    </div>
  );
};
