import React from 'react';
import { AlertCircle, CheckCircle2, X, PlusCircle, ArrowRightLeft } from 'lucide-react';
import { type EligibilityResult } from '../../hooks/usePracticeCards';

interface PracticeIneligibleModalProps {
  isOpen: boolean;
  onClose: () => void;
  modeTitle: string;
  eligibility: EligibilityResult | null;
  onSelectAllDecks?: () => void;
  onOpenAddCards?: () => void;
}

export const PracticeIneligibleModal: React.FC<PracticeIneligibleModalProps> = ({
  isOpen,
  onClose,
  modeTitle,
  eligibility,
  onSelectAllDecks,
  onOpenAddCards,
}) => {
  if (!isOpen || !eligibility) return null;

  const isSuccessType = eligibility.actionType === 'completed_fsrs' || eligibility.actionType === 'no_leeches';

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-xs animate-fade-in">
      <div
        className="w-full max-w-sm rounded-3xl bg-white dark:bg-dark-card border-2 border-kawaii-200 dark:border-dark-border p-6 shadow-kawaii space-y-4 animate-scale-up text-center relative"
        role="dialog"
        aria-modal="true"
      >
        {/* Nút đóng */}
        <button
          onClick={onClose}
          className="absolute top-4 right-4 p-2 rounded-full text-gray-400 hover:text-gray-600 dark:hover:text-gray-200 active:scale-90"
          aria-label="Đóng thông báo"
        >
          <X className="w-5 h-5" />
        </button>

        {/* Biểu tượng Mascot / Icon */}
        <div className="w-16 h-16 rounded-3xl mx-auto flex items-center justify-center text-3xl shadow-xs transition-transform hover:scale-105 select-none bg-gradient-to-tr from-kawaii-100 to-pink-50 dark:from-dark-bg dark:to-dark-card">
          {isSuccessType ? '🌸' : '🐰'}
        </div>

        {/* Tiêu đề */}
        <div>
          <span className="text-[11px] font-bold uppercase tracking-wider text-kawaii-600 dark:text-kawaii-400">
            {modeTitle}
          </span>
          <h3 className="text-lg font-black font-display text-gray-900 dark:text-white mt-1">
            {isSuccessType ? 'Thông Báo Luyện Tập' : 'Chưa Đủ Điều Kiện Bắt Đầu'}
          </h3>
        </div>

        {/* Nội dung lý do cụ thể */}
        <div className="p-3.5 rounded-2xl bg-kawaii-50/60 dark:bg-dark-bg border border-kawaii-100 dark:border-dark-border text-left space-y-1.5 text-xs">
          <div className="flex items-start gap-2">
            {isSuccessType ? (
              <CheckCircle2 className="w-4 h-4 text-emerald-500 shrink-0 mt-0.5" />
            ) : (
              <AlertCircle className="w-4 h-4 text-kawaii-500 shrink-0 mt-0.5" />
            )}
            <p className="font-bold text-gray-800 dark:text-gray-200 leading-relaxed">
              {eligibility.reason}
            </p>
          </div>

          {eligibility.suggestion && (
            <p className="text-gray-500 dark:text-dark-textMuted pl-6 leading-relaxed">
              💡 {eligibility.suggestion}
            </p>
          )}

          {/* Huy hiệu số liệu thẻ */}
          {!isSuccessType && eligibility.requiredCount > 0 && (
            <div className="flex items-center justify-between pt-2 border-t border-kawaii-100 dark:border-dark-border text-[11px] font-semibold text-gray-500">
              <span>Số thẻ hiện có: <strong className="text-kawaii-600">{eligibility.currentCount}</strong></span>
              <span>Yêu cầu tối thiểu: <strong className="text-gray-800 dark:text-gray-200">{eligibility.requiredCount} từ</strong></span>
            </div>
          )}
        </div>

        {/* Các nút hành động */}
        <div className="space-y-2 pt-1">
          {eligibility.actionType === 'switch_deck' && onSelectAllDecks && (
            <button
              onClick={() => {
                onSelectAllDecks();
                onClose();
              }}
              className="w-full py-3 px-4 min-h-[44px] rounded-2xl bg-kawaii-500 hover:bg-kawaii-600 text-white font-bold text-xs shadow-kawaii active:scale-95 transition-transform flex items-center justify-center gap-2"
            >
              <ArrowRightLeft className="w-4 h-4" />
              <span>Chuyển sang "Tất cả bộ thẻ"</span>
            </button>
          )}

          {eligibility.actionType === 'add_cards' && onOpenAddCards && (
            <button
              onClick={() => {
                onOpenAddCards();
                onClose();
              }}
              className="w-full py-3 px-4 min-h-[44px] rounded-2xl bg-kawaii-500 hover:bg-kawaii-600 text-white font-bold text-xs shadow-kawaii active:scale-95 transition-transform flex items-center justify-center gap-2"
            >
              <PlusCircle className="w-4 h-4" />
              <span>Quản lý & Thêm thẻ mới</span>
            </button>
          )}

          <button
            onClick={onClose}
            className="w-full py-2.5 px-4 min-h-[44px] rounded-2xl bg-gray-100 dark:bg-dark-bg hover:bg-gray-200 dark:hover:bg-dark-cardHover text-gray-700 dark:text-gray-300 font-bold text-xs active:scale-95 transition-all"
          >
            Đã hiểu
          </button>
        </div>
      </div>
    </div>
  );
};
