import React, { useEffect, useState } from 'react';
import {
  Layers,
  Plus,
  Search,
  Sparkles,
  FileSpreadsheet,
  Download,
  Trash2,
  Edit,
  Copy,
  ArrowRightLeft,
  BookOpen,
  X,
  Play,
  Filter,
} from 'lucide-react';
import { useDeckStore } from '../stores/deckStore';
import { type Deck, type Card } from '../types';
import { Mascot } from '../components/common/Mascot';
import { RichCardEditor } from '../components/editor/RichCardEditor';
import { ExcelImportModal } from '../components/editor/ExcelImportModal';
import { exportDeck } from '../services/excelService';
import { HanziWriterCanvas } from '../components/cards/HanziWriterCanvas';

interface DecksPageProps {
  onStartStudy?: (deckId: string) => void;
}

export const DecksPage: React.FC<DecksPageProps> = ({ onStartStudy }) => {
  const {
    decks,
    isLoading,
    fetchDecks,
    createDeck,
    updateDeck,
    deleteDeck,
    fetchDeckById,
    currentDeck,
    addCard,
    updateCard,
    deleteCard,
    duplicateCard,
    moveCard,
    batchImportCards,
  } = useDeckStore();

  const [searchQuery, setSearchQuery] = useState('');
  const [langFilter, setLangFilter] = useState<'all' | 'zh' | 'en'>('all');

  // Modal tạo/sửa bộ thẻ
  const [isDeckModalOpen, setIsDeckModalOpen] = useState(false);
  const [editingDeck, setEditingDeck] = useState<Deck | null>(null);
  const [deckTitle, setDeckTitle] = useState('');
  const [deckDesc, setDeckDesc] = useState('');
  const [deckLang, setDeckLang] = useState<'zh' | 'en'>('zh');
  const [deckColor, setDeckColor] = useState('#FF5C9E');

  // Xem chi tiết danh sách thẻ trong bộ
  const [activeDeckId, setActiveDeckId] = useState<string | null>(null);
  const [cardSearchQuery, setCardSearchQuery] = useState('');
  const [cardStateFilter, setCardStateFilter] = useState<'all' | 'new' | 'learning' | 'review'>('all');

  // Modals cho thẻ & Excel
  const [isCardEditorOpen, setIsCardEditorOpen] = useState(false);
  const [editingCard, setEditingCard] = useState<Card | null>(null);
  const [isExcelImportOpen, setIsExcelImportOpen] = useState(false);
  const [selectedHanziCard, setSelectedHanziCard] = useState<Card | null>(null);
  const [movingCardId, setMovingCardId] = useState<string | null>(null);
  const [targetMoveDeckId, setTargetMoveDeckId] = useState<string>('');

  useEffect(() => {
    fetchDecks();
  }, [fetchDecks]);

  // Lọc danh sách bộ thẻ
  const filteredDecks = decks.filter((deck: Deck) => {
    const matchLang = langFilter === 'all' || deck.language === langFilter;
    const matchSearch =
      deck.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (deck.description && deck.description.toLowerCase().includes(searchQuery.toLowerCase()));
    return matchLang && matchSearch;
  });

  // Mở modal tạo bộ thẻ mới
  const handleOpenCreateDeck = () => {
    setEditingDeck(null);
    setDeckTitle('');
    setDeckDesc('');
    setDeckLang('zh');
    setDeckColor('#FF5C9E');
    setIsDeckModalOpen(true);
  };

  // Mở modal sửa bộ thẻ
  const handleOpenEditDeck = (deck: Deck, e: React.MouseEvent) => {
    e.stopPropagation();
    setEditingDeck(deck);
    setDeckTitle(deck.title);
    setDeckDesc(deck.description || '');
    setDeckLang(deck.language);
    setDeckColor(deck.color || '#FF5C9E');
    setIsDeckModalOpen(true);
  };

  // Lưu tạo/sửa bộ thẻ
  const handleSaveDeck = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!deckTitle.trim()) return;

    if (editingDeck) {
      await updateDeck(editingDeck.id, {
        title: deckTitle.trim(),
        description: deckDesc.trim() || null,
        language: deckLang,
        color: deckColor,
      });
    } else {
      await createDeck({
        title: deckTitle.trim(),
        description: deckDesc.trim() || null,
        language: deckLang,
        color: deckColor,
        icon: deckLang === 'zh' ? '🇨🇳' : '🇬🇧',
      });
    }
    setIsDeckModalOpen(false);
  };

  // Mở trình duyệt thẻ trong bộ
  const handleOpenDeckCards = async (deckId: string) => {
    setActiveDeckId(deckId);
    await fetchDeckById(deckId);
  };

  // Đóng trình duyệt thẻ
  const handleCloseDeckCards = () => {
    setActiveDeckId(null);
    fetchDecks();
  };

  // Lọc thẻ bên trong bộ
  const cardsInActiveDeck = (currentDeck?.cards || []).filter((c: Card) => {
    const q = cardSearchQuery.toLowerCase();
    const matchQuery =
      c.front.toLowerCase().includes(q) ||
      c.back.toLowerCase().includes(q) ||
      (c.phonetic && c.phonetic.toLowerCase().includes(q));

    const state = c.schedule?.state || 'new';
    const matchState =
      cardStateFilter === 'all' ||
      (cardStateFilter === 'new' && state === 'new') ||
      (cardStateFilter === 'learning' && (state === 'learning' || state === 'relearning')) ||
      (cardStateFilter === 'review' && state === 'review');

    return matchQuery && matchState;
  });

  return (
    <div className="space-y-6 pb-20">
      
      {/* 1. HEADER & CÔNG CỤ TÌM KIẾM BỘ THẺ */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-display font-extrabold text-gray-900 dark:text-white flex items-center gap-2">
            <Layers className="w-7 h-7 text-kawaii-500" />
            <span>Bộ Thẻ Của Tôi 🌸</span>
          </h1>
          <p className="text-xs text-gray-500 dark:text-dark-textMuted mt-1">
            Quản lý từ vựng tiếng Trung & tiếng Anh, nhập file Excel và bắt đầu phiên học SRS
          </p>
        </div>

        <button
          onClick={handleOpenCreateDeck}
          className="min-h-[48px] px-5 py-2.5 rounded-2xl bg-gradient-to-r from-kawaii-400 to-kawaii-500 hover:from-kawaii-500 hover:to-kawaii-600 text-white font-bold text-xs shadow-kawaii btn-bounce flex items-center justify-center gap-1.5 shrink-0 active:scale-95"
        >
          <Plus className="w-4 h-4" />
          <span>Tạo bộ thẻ mới</span>
        </button>
      </div>

      {/* Thanh lọc ngôn ngữ & Tìm kiếm */}
      <div className="flex flex-col sm:flex-row gap-3 items-center justify-between">
        {/* Bộ lọc tab ngôn ngữ */}
        <div className="flex bg-white dark:bg-dark-card p-1 rounded-2xl border border-kawaii-200 dark:border-dark-border shadow-sm w-full sm:w-auto">
          <button
            onClick={() => setLangFilter('all')}
            className={`flex-1 sm:flex-initial px-3.5 py-2 text-xs font-bold rounded-xl transition-all ${
              langFilter === 'all'
                ? 'bg-kawaii-500 text-white shadow-sm'
                : 'text-gray-600 dark:text-gray-300'
            }`}
          >
            Tất cả ({decks.length})
          </button>
          <button
            onClick={() => setLangFilter('zh')}
            className={`flex-1 sm:flex-initial px-3.5 py-2 text-xs font-bold rounded-xl transition-all ${
              langFilter === 'zh'
                ? 'bg-kawaii-500 text-white shadow-sm'
                : 'text-gray-600 dark:text-gray-300'
            }`}
          >
            🇨🇳 Tiếng Trung
          </button>
          <button
            onClick={() => setLangFilter('en')}
            className={`flex-1 sm:flex-initial px-3.5 py-2 text-xs font-bold rounded-xl transition-all ${
              langFilter === 'en'
                ? 'bg-purple-500 text-white shadow-sm'
                : 'text-gray-600 dark:text-gray-300'
            }`}
          >
            🇬🇧 Tiếng Anh
          </button>
        </div>

        {/* Ô tìm kiếm */}
        <div className="relative w-full sm:w-72">
          <Search className="w-4 h-4 text-gray-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            placeholder="Tìm tên bộ thẻ..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-9 pr-4 py-2.5 rounded-2xl bg-white dark:bg-dark-card border border-kawaii-200 dark:border-dark-border text-base sm:text-xs outline-none focus:border-kawaii-500 dark:text-white"
          />
        </div>
      </div>

      {/* 2. DANH SÁCH BỘ THẺ GRID */}
      {isLoading && decks.length === 0 ? (
        <div className="text-center py-20 text-gray-400">
          <span className="inline-block w-8 h-8 border-3 border-kawaii-500 border-t-transparent rounded-full animate-spin mb-2" />
          <p className="text-xs font-bold">Đang tải danh sách bộ thẻ...</p>
        </div>
      ) : filteredDecks.length === 0 ? (
        <div className="text-center py-16 bg-white dark:bg-dark-card rounded-3xl border-2 border-kawaii-200 dark:border-dark-border p-8 shadow-sm space-y-3">
          <Mascot id="bunny_pink" mood="shy" size="md" />
          <h3 className="text-lg font-bold text-gray-800 dark:text-white">
            Chưa có bộ thẻ nào phù hợp 🌸
          </h3>
          <p className="text-xs text-gray-500 max-w-sm mx-auto">
            Bạn có thể tạo bộ thẻ mới để bắt đầu học ngay bây giờ!
          </p>
          <button
            onClick={handleOpenCreateDeck}
            className="px-5 py-2.5 rounded-xl bg-kawaii-500 text-white font-bold text-xs shadow-sm active:scale-95"
          >
            Tạo bộ thẻ đầu tiên
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          {filteredDecks.map((deck: Deck) => {
            const stats = deck.stats || { totalCards: 0, newCards: 0, dueCards: 0, learnedCards: 0 };
            return (
              <div
                key={deck.id}
                onClick={() => handleOpenDeckCards(deck.id)}
                className="group relative p-5 rounded-3xl bg-white dark:bg-dark-card border-2 border-kawaii-200 dark:border-dark-border hover:border-kawaii-400 dark:hover:border-kawaii-400 shadow-sm hover:shadow-kawaii transition-all duration-200 cursor-pointer flex flex-col justify-between overflow-hidden active:scale-[0.99]"
              >
                {/* Viền màu trên đầu card */}
                <div
                  className="absolute top-0 left-0 right-0 h-1.5"
                  style={{ backgroundColor: deck.color || '#FF5C9E' }}
                />

                <div className="space-y-3">
                  {/* Tiêu đề & Ngôn ngữ & Sửa/Xóa với Touch Target ≥44px */}
                  <div className="flex items-start justify-between gap-2">
                    <div className="flex items-center gap-2.5">
                      <span className="text-2xl p-1 bg-gray-50 dark:bg-dark-bg rounded-xl">
                        {deck.icon || (deck.language === 'zh' ? '🇨🇳' : '🇬🇧')}
                      </span>
                      <div>
                        <h3 className="font-bold text-base text-gray-900 dark:text-white font-display group-hover:text-kawaii-600 dark:group-hover:text-kawaii-400 transition-colors line-clamp-1">
                          {deck.title}
                        </h3>
                        <span className="text-[11px] font-semibold text-gray-400">
                          {deck.language === 'zh' ? 'Tiếng Trung (HSK)' : 'Tiếng Anh (CEFR)'}
                        </span>
                      </div>
                    </div>

                    {/* Nút Sửa & Xóa Touch target ≥44px */}
                    <div className="flex items-center gap-1">
                      <button
                        type="button"
                        onClick={(e) => handleOpenEditDeck(deck, e)}
                        title="Sửa bộ thẻ"
                        className="w-10 h-10 flex items-center justify-center text-gray-400 hover:text-kawaii-600 rounded-xl hover:bg-kawaii-50 dark:hover:bg-dark-bg transition-colors active:scale-95"
                      >
                        <Edit className="w-4 h-4" />
                      </button>
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          if (confirm(`Bạn có chắc muốn xóa bộ thẻ "${deck.title}" không?`)) {
                            deleteDeck(deck.id);
                          }
                        }}
                        title="Xóa bộ thẻ"
                        className="w-10 h-10 flex items-center justify-center text-gray-400 hover:text-red-500 rounded-xl hover:bg-red-50 dark:hover:bg-dark-bg transition-colors active:scale-95"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </div>

                  {/* Mô tả ngắn */}
                  {deck.description && (
                    <p className="text-xs text-gray-500 dark:text-dark-textMuted line-clamp-2">
                      {deck.description}
                    </p>
                  )}

                  {/* Thống kê thẻ: Tổng / Mới / Đến hạn SRS */}
                  <div className="grid grid-cols-3 gap-2 pt-2 border-t border-gray-100 dark:border-dark-border text-center">
                    <div className="p-2 rounded-2xl bg-kawaii-50/60 dark:bg-dark-bg/60">
                      <span className="block text-base font-extrabold text-kawaii-600 dark:text-kawaii-400">
                        {stats.totalCards}
                      </span>
                      <span className="text-[10px] text-gray-400 font-semibold">Tổng thẻ</span>
                    </div>

                    <div className="p-2 rounded-2xl bg-blue-50/60 dark:bg-blue-950/30">
                      <span className="block text-base font-extrabold text-blue-600 dark:text-blue-400">
                        {stats.newCards}
                      </span>
                      <span className="text-[10px] text-gray-400 font-semibold">Thẻ mới</span>
                    </div>

                    <div className="p-2 rounded-2xl bg-emerald-50/60 dark:bg-emerald-950/30">
                      <span className="block text-base font-extrabold text-emerald-600 dark:text-emerald-400">
                        {stats.dueCards}
                      </span>
                      <span className="text-[10px] text-gray-400 font-semibold">Đến hạn</span>
                    </div>
                  </div>
                </div>

                {/* Các nút hành động nhanh dưới thẻ - Nút Học SRS to rõ vừa ngón cái */}
                <div className="pt-4 flex items-center justify-between gap-2 mt-2">
                  <span className="text-xs font-bold text-gray-400 flex items-center gap-1 group-hover:text-kawaii-500">
                    <BookOpen className="w-3.5 h-3.5" /> Xem {stats.totalCards} thẻ
                  </span>

                  <button
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation();
                      onStartStudy?.(deck.id);
                    }}
                    className="min-h-[44px] px-5 py-2 rounded-2xl bg-gradient-to-r from-kawaii-400 to-kawaii-500 hover:from-kawaii-500 hover:to-kawaii-600 text-white font-bold text-xs shadow-kawaii-sm btn-bounce flex items-center gap-1.5 active:scale-95"
                  >
                    <Play className="w-3.5 h-3.5 fill-current" />
                    <span>Học SRS</span>
                  </button>
                </div>

              </div>
            );
          })}
        </div>
      )}

      {/* 3. MODAL TẠO / SỬA BỘ THẺ DẠNG BOTTOM SHEET TRÊN MOBILE */}
      {isDeckModalOpen && (
        <div className="fixed inset-0 z-50 flex flex-col justify-end sm:justify-center sm:items-center bg-black/60 backdrop-blur-sm animate-fade-in p-0 sm:p-4">
          <div className="relative w-full max-w-md bg-white dark:bg-dark-card rounded-t-3xl sm:rounded-3xl p-5 sm:p-7 border-t-2 sm:border-2 border-kawaii-200 dark:border-dark-border shadow-kawaii-lg space-y-4 animate-slide-up sm:animate-none">
            <div className="flex items-center justify-between border-b border-kawaii-100 dark:border-dark-border pb-3">
              <h3 className="text-lg font-bold font-display text-gray-900 dark:text-white flex items-center gap-2">
                <span>{deckLang === 'zh' ? '🇨🇳' : '🇬🇧'}</span>
                <span>{editingDeck ? 'Chỉnh Sửa Bộ Thẻ' : 'Tạo Bộ Thẻ Mới 🌸'}</span>
              </h3>
              <button
                onClick={() => setIsDeckModalOpen(false)}
                className="p-2 text-gray-400 hover:text-gray-600 rounded-full"
                aria-label="Đóng"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSaveDeck} className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-gray-700 dark:text-gray-300 mb-1">
                  Tên bộ thẻ <span className="text-kawaii-500">*</span>
                </label>
                <input
                  type="text"
                  required
                  value={deckTitle}
                  onChange={(e) => setDeckTitle(e.target.value)}
                  placeholder="Ví dụ: 50 Từ HSK 2 Ăn Uống, Oxford B2..."
                  className="w-full px-4 py-3 rounded-2xl bg-gray-50 dark:bg-dark-bg border border-kawaii-200 dark:border-dark-border text-base sm:text-sm outline-none focus:border-kawaii-500 dark:text-white font-medium"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-gray-700 dark:text-gray-300 mb-1">
                  Ngôn ngữ bộ thẻ
                </label>
                <div className="grid grid-cols-2 gap-2">
                  <button
                    type="button"
                    onClick={() => setDeckLang('zh')}
                    className={`py-2.5 rounded-xl text-xs font-bold border-2 transition-all ${
                      deckLang === 'zh'
                        ? 'border-kawaii-500 bg-kawaii-50 dark:bg-dark-bg text-kawaii-600'
                        : 'border-gray-200 dark:border-dark-border text-gray-600'
                    }`}
                  >
                    🇨🇳 Tiếng Trung
                  </button>
                  <button
                    type="button"
                    onClick={() => setDeckLang('en')}
                    className={`py-2.5 rounded-xl text-xs font-bold border-2 transition-all ${
                      deckLang === 'en'
                        ? 'border-purple-500 bg-purple-50 dark:bg-dark-bg text-purple-600'
                        : 'border-gray-200 dark:border-dark-border text-gray-600'
                    }`}
                  >
                    🇬🇧 Tiếng Anh
                  </button>
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-gray-700 dark:text-gray-300 mb-1">
                  Mô tả ngắn
                </label>
                <textarea
                  rows={2}
                  value={deckDesc}
                  onChange={(e) => setDeckDesc(e.target.value)}
                  placeholder="Ghi chú thêm về mục tiêu bộ thẻ..."
                  className="w-full px-4 py-2.5 rounded-2xl bg-gray-50 dark:bg-dark-bg border border-kawaii-200 dark:border-dark-border text-base sm:text-xs outline-none focus:border-kawaii-500 dark:text-white"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-gray-700 dark:text-gray-300 mb-1">
                  Màu sắc điểm nhấn
                </label>
                <div className="flex gap-3">
                  {['#FF5C9E', '#A855F7', '#38BDF8', '#34D399', '#FBBF24', '#FB7185'].map((c) => (
                    <button
                      key={c}
                      type="button"
                      onClick={() => setDeckColor(c)}
                      className={`w-8 h-8 rounded-full border-2 transition-transform ${
                        deckColor === c ? 'scale-125 border-gray-900 dark:border-white shadow-sm' : 'border-transparent'
                      }`}
                      style={{ backgroundColor: c }}
                    />
                  ))}
                </div>
              </div>

              {/* Nút hành động dính dưới màn hình an toàn cho ngón cái */}
              <div className="flex justify-end gap-2 pt-2 border-t border-gray-100 dark:border-dark-border safe-pb">
                <button
                  type="button"
                  onClick={() => setIsDeckModalOpen(false)}
                  className="px-4 py-3 rounded-2xl text-xs font-bold text-gray-500 hover:bg-gray-100"
                >
                  Hủy
                </button>
                <button
                  type="submit"
                  className="flex-1 sm:flex-initial min-h-[48px] px-6 py-3 rounded-2xl bg-kawaii-500 text-white font-bold text-xs shadow-kawaii btn-bounce"
                >
                  {editingDeck ? 'Lưu thay đổi' : 'Tạo bộ thẻ 🌸'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* 4. CARD BROWSER: FULL-SCREEN TRÊN MOBILE */}
      {activeDeckId && currentDeck && (
        <div className="fixed inset-0 z-40 flex flex-col justify-end sm:justify-center sm:items-center bg-black/60 backdrop-blur-sm animate-fade-in p-0 sm:p-4">
          <div className="relative w-full sm:max-w-5xl h-[100dvh] sm:h-[92vh] bg-white dark:bg-dark-card rounded-t-3xl sm:rounded-3xl shadow-kawaii-lg border-t-2 sm:border-2 border-kawaii-200 dark:border-dark-border flex flex-col overflow-hidden animate-slide-up sm:animate-none">
            
            {/* Header trình duyệt thẻ */}
            <div className="px-4 py-3 sm:px-6 sm:py-4 border-b border-kawaii-100 dark:border-dark-border flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-pink-50/40 dark:bg-dark-bg/60 shrink-0">
              <div className="flex items-center gap-3">
                <button
                  onClick={handleCloseDeckCards}
                  className="w-10 h-10 rounded-2xl bg-white dark:bg-dark-card border border-kawaii-200 dark:border-dark-border text-gray-600 dark:text-gray-300 hover:text-kawaii-600 flex items-center justify-center active:scale-95 shrink-0"
                  aria-label="Đóng trình duyệt thẻ"
                >
                  <X className="w-5 h-5" />
                </button>
                <div className="min-w-0">
                  <h2 className="text-base sm:text-lg font-bold font-display text-gray-900 dark:text-white flex items-center gap-2 truncate">
                    <span>{currentDeck.icon || '🌸'}</span>
                    <span className="truncate">{currentDeck.title}</span>
                  </h2>
                  <p className="text-[11px] text-gray-500 truncate">
                    {currentDeck.cards?.length || 0} thẻ • {currentDeck.language === 'zh' ? 'Tiếng Trung' : 'Tiếng Anh'}
                  </p>
                </div>
              </div>

              {/* Các nút hành động chính của bộ */}
              <div className="flex items-center gap-2 overflow-x-auto pb-1 sm:pb-0">
                <button
                  onClick={() => {
                    setEditingCard(null);
                    setIsCardEditorOpen(true);
                  }}
                  className="min-h-[40px] px-3.5 py-2 rounded-xl bg-kawaii-500 hover:bg-kawaii-600 text-white font-bold text-xs shadow-kawaii-sm btn-bounce flex items-center gap-1.5 shrink-0"
                >
                  <Plus className="w-4 h-4" />
                  <span>+ Thẻ</span>
                </button>

                <button
                  onClick={() => setIsExcelImportOpen(true)}
                  className="min-h-[40px] px-3.5 py-2 rounded-xl bg-emerald-500 hover:bg-emerald-600 text-white font-bold text-xs shadow-sm flex items-center gap-1.5 shrink-0"
                >
                  <FileSpreadsheet className="w-4 h-4" />
                  <span>Nhập Excel</span>
                </button>

                <button
                  onClick={() => exportDeck(currentDeck, 'xlsx')}
                  className="min-h-[40px] px-3 py-2 rounded-xl bg-white dark:bg-dark-card text-gray-700 dark:text-gray-200 border border-gray-200 dark:border-dark-border font-bold text-xs shadow-sm flex items-center gap-1 shrink-0"
                >
                  <Download className="w-3.5 h-3.5" />
                  <span className="hidden sm:inline">Xuất</span>
                </button>

                <button
                  onClick={() => onStartStudy?.(currentDeck.id)}
                  className="min-h-[40px] px-4 py-2 rounded-xl bg-gradient-to-r from-purple-500 to-pink-500 text-white font-bold text-xs shadow-sm btn-bounce flex items-center gap-1.5 shrink-0"
                >
                  <Sparkles className="w-4 h-4" />
                  <span>Học SRS</span>
                </button>
              </div>
            </div>

            {/* Thanh tìm kiếm thẻ & Bộ lọc trạng thái ghim trên cùng */}
            <div className="p-3 sm:px-6 border-b border-kawaii-100 dark:border-dark-border flex flex-col sm:flex-row sm:items-center justify-between gap-2.5 bg-white dark:bg-dark-card shrink-0">
              <div className="relative flex-1">
                <Search className="w-4 h-4 text-gray-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                <input
                  type="text"
                  placeholder="Tìm từ vựng, pinyin, nghĩa..."
                  value={cardSearchQuery}
                  onChange={(e) => setCardSearchQuery(e.target.value)}
                  className="w-full pl-9 pr-3 py-2 rounded-xl bg-gray-50 dark:bg-dark-bg border border-kawaii-200 dark:border-dark-border text-base sm:text-xs outline-none focus:border-kawaii-500 dark:text-white"
                />
              </div>

              {/* Bộ lọc trạng thái thẻ (Tất cả / Mới / Ôn tập) */}
              <div className="flex items-center gap-1 overflow-x-auto text-xs">
                <Filter className="w-3.5 h-3.5 text-gray-400 shrink-0 ml-1 hidden sm:block" />
                <button
                  type="button"
                  onClick={() => setCardStateFilter('all')}
                  className={`px-2.5 py-1.5 rounded-lg font-bold transition-colors ${
                    cardStateFilter === 'all'
                      ? 'bg-kawaii-100 dark:bg-dark-bg text-kawaii-700 dark:text-kawaii-300'
                      : 'text-gray-500 hover:bg-gray-100'
                  }`}
                >
                  Tất cả ({currentDeck.cards?.length || 0})
                </button>
                <button
                  type="button"
                  onClick={() => setCardStateFilter('new')}
                  className={`px-2.5 py-1.5 rounded-lg font-bold transition-colors ${
                    cardStateFilter === 'new'
                      ? 'bg-blue-100 dark:bg-blue-950/50 text-blue-700 dark:text-blue-300'
                      : 'text-gray-500 hover:bg-gray-100'
                  }`}
                >
                  Mới
                </button>
                <button
                  type="button"
                  onClick={() => setCardStateFilter('review')}
                  className={`px-2.5 py-1.5 rounded-lg font-bold transition-colors ${
                    cardStateFilter === 'review'
                      ? 'bg-emerald-100 dark:bg-emerald-950/50 text-emerald-700 dark:text-emerald-300'
                      : 'text-gray-500 hover:bg-gray-100'
                  }`}
                >
                  Ôn tập
                </button>
              </div>
            </div>

            {/* Danh sách thẻ dạng cards tối ưu cho mobile */}
            <div className="flex-1 overflow-y-auto p-4 sm:p-6 pb-24 sm:pb-6">
              {cardsInActiveDeck.length === 0 ? (
                <div className="text-center py-20 text-gray-400 space-y-3">
                  <Mascot id="kitty_purple" mood="shy" size="sm" />
                  <p className="text-xs font-bold">Chưa có thẻ nào trong bộ này</p>
                  <button
                    onClick={() => setIsCardEditorOpen(true)}
                    className="px-4 py-2 bg-kawaii-500 text-white rounded-xl text-xs font-bold active:scale-95"
                  >
                    Thêm thẻ ngay
                  </button>
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3.5">
                  {cardsInActiveDeck.map((card: Card) => (
                    <div
                      key={card.id}
                      className="p-4 rounded-3xl bg-white dark:bg-dark-card border border-kawaii-200 dark:border-dark-border hover:border-kawaii-400 shadow-sm flex flex-col justify-between space-y-3"
                    >
                      <div className="space-y-1.5">
                        {/* Hàng trên: Cấp độ + Các nút thao tác Touch target ≥40px */}
                        <div className="flex items-center justify-between text-xs">
                          <span className="px-2.5 py-0.5 rounded-full bg-kawaii-50 dark:bg-dark-bg text-kawaii-600 dark:text-kawaii-400 font-bold text-[11px]">
                            {card.level || 'HSK1'}
                          </span>

                          <div className="flex items-center gap-1">
                            {currentDeck.language === 'zh' && (
                              <button
                                type="button"
                                onClick={() => setSelectedHanziCard(card)}
                                title="Xem nét viết chữ Hán"
                                className="w-9 h-9 flex items-center justify-center text-purple-600 hover:bg-purple-50 dark:hover:bg-dark-bg rounded-xl font-bold active:scale-95"
                              >
                                ✍️
                              </button>
                            )}

                            <button
                              type="button"
                              onClick={() => {
                                setEditingCard(card);
                                setIsCardEditorOpen(true);
                              }}
                              title="Sửa thẻ"
                              className="w-9 h-9 flex items-center justify-center text-gray-400 hover:text-kawaii-600 hover:bg-kawaii-50 dark:hover:bg-dark-bg rounded-xl active:scale-95"
                            >
                              <Edit className="w-4 h-4" />
                            </button>

                            <button
                              type="button"
                              onClick={() => duplicateCard(card.id)}
                              title="Nhân bản thẻ"
                              className="w-9 h-9 flex items-center justify-center text-gray-400 hover:text-blue-500 hover:bg-blue-50 dark:hover:bg-dark-bg rounded-xl active:scale-95"
                            >
                              <Copy className="w-4 h-4" />
                            </button>

                            <button
                              type="button"
                              onClick={() => {
                                setMovingCardId(card.id);
                                setTargetMoveDeckId(decks.find((d: Deck) => d.id !== currentDeck.id)?.id || '');
                              }}
                              title="Chuyển sang bộ khác"
                              className="w-9 h-9 flex items-center justify-center text-gray-400 hover:text-emerald-500 hover:bg-emerald-50 dark:hover:bg-dark-bg rounded-xl active:scale-95"
                            >
                              <ArrowRightLeft className="w-4 h-4" />
                            </button>

                            <button
                              type="button"
                              onClick={() => {
                                if (confirm(`Xóa thẻ "${card.front}"?`)) {
                                  deleteCard(card.id);
                                }
                              }}
                              title="Xóa thẻ"
                              className="w-9 h-9 flex items-center justify-center text-gray-400 hover:text-red-500 hover:bg-red-50 dark:hover:bg-dark-bg rounded-xl active:scale-95"
                            >
                              <Trash2 className="w-4 h-4" />
                            </button>
                          </div>
                        </div>

                        {/* Mặt trước & Phiên âm */}
                        <div>
                          <h4 className="text-xl font-extrabold text-gray-900 dark:text-white font-hanzi">
                            {card.front}
                          </h4>
                          {card.phonetic && (
                            <p className="text-xs font-semibold text-kawaii-600 dark:text-kawaii-400 font-mono mt-0.5">
                              {card.phonetic}
                            </p>
                          )}
                        </div>

                        {/* Mặt sau */}
                        <p className="text-sm font-bold text-gray-800 dark:text-gray-200">
                          {card.back}
                        </p>

                        {/* Ví dụ */}
                        {card.example && (
                          <p className="text-xs text-gray-500 dark:text-dark-textMuted italic border-l-2 border-kawaii-300 pl-2 mt-1">
                            {card.example}
                          </p>
                        )}
                      </div>

                      {/* Trạng thái FSRS */}
                      <div className="pt-2 border-t border-gray-100 dark:border-dark-border flex items-center justify-between text-[11px] text-gray-400">
                        <span>Lặp: {card.schedule?.reps || 0} lần</span>
                        <span className="capitalize text-kawaii-500 font-semibold">
                          {card.schedule?.state === 'new' ? 'Mới' : card.schedule?.state === 'review' ? 'Ôn tập' : 'Đang học'}
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* FLOATING ACTION BUTTON (FAB) GÓC DƯỚI PHẢI TRÊN MOBILE */}
            <div className="absolute bottom-6 right-6 z-30 sm:hidden">
              <button
                type="button"
                onClick={() => {
                  setEditingCard(null);
                  setIsCardEditorOpen(true);
                }}
                className="w-14 h-14 rounded-full bg-gradient-to-r from-kawaii-400 to-kawaii-500 text-white shadow-kawaii-lg flex items-center justify-center active:scale-90 transition-transform"
                aria-label="Thêm thẻ mới"
              >
                <Plus className="w-7 h-7" />
              </button>
            </div>

          </div>
        </div>
      )}

      {/* 5. MODAL TẬP VIẾT CHỮ HÁN NHANH */}
      {selectedHanziCard && (
        <div className="fixed inset-0 z-50 flex flex-col justify-end sm:justify-center sm:items-center bg-black/60 backdrop-blur-sm animate-fade-in p-0 sm:p-4">
          <div className="bg-white dark:bg-dark-card rounded-t-3xl sm:rounded-3xl p-6 max-w-sm w-full border-t-2 sm:border-2 border-kawaii-200 dark:border-dark-border shadow-xl text-center space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="font-bold text-base font-display text-gray-900 dark:text-white">
                Nét Viết: {selectedHanziCard.front} ✍️
              </h3>
              <button onClick={() => setSelectedHanziCard(null)}>
                <X className="w-5 h-5 text-gray-400" />
              </button>
            </div>

            <HanziWriterCanvas characters={selectedHanziCard.front} size={180} />

            <button
              onClick={() => setSelectedHanziCard(null)}
              className="w-full py-3 bg-kawaii-500 text-white rounded-2xl text-xs font-bold active:scale-95"
            >
              Đóng
            </button>
          </div>
        </div>
      )}

      {/* 6. MODAL DI CHUYỂN THẺ SANG BỘ KHÁC */}
      {movingCardId && (
        <div className="fixed inset-0 z-50 flex flex-col justify-end sm:justify-center sm:items-center bg-black/60 backdrop-blur-sm animate-fade-in p-0 sm:p-4">
          <div className="bg-white dark:bg-dark-card rounded-t-3xl sm:rounded-3xl p-6 max-w-sm w-full border-t-2 sm:border-2 border-kawaii-200 dark:border-dark-border shadow-xl space-y-4 safe-pb">
            <h3 className="font-bold text-base font-display text-gray-900 dark:text-white">
              Di Chuyển Thẻ Sang Bộ Khác 🔄
            </h3>
            <div>
              <label className="text-xs text-gray-600 dark:text-gray-300 block mb-1">
                Chọn bộ thẻ đích:
              </label>
              <select
                value={targetMoveDeckId}
                onChange={(e) => setTargetMoveDeckId(e.target.value)}
                className="w-full p-3 rounded-2xl border border-kawaii-200 dark:border-dark-border text-base sm:text-xs dark:text-white bg-white dark:bg-dark-bg"
              >
                {decks
                  .filter((d: Deck) => d.id !== currentDeck?.id)
                  .map((d: Deck) => (
                    <option key={d.id} value={d.id}>
                      {d.icon || '🌸'} {d.title} ({d.language === 'zh' ? 'Trung' : 'Anh'})
                    </option>
                  ))}
              </select>
            </div>
            <div className="flex justify-end gap-2 pt-2">
              <button
                onClick={() => setMovingCardId(null)}
                className="px-4 py-2.5 rounded-xl text-xs font-bold text-gray-500"
              >
                Hủy
              </button>
              <button
                onClick={async () => {
                  if (targetMoveDeckId) {
                    await moveCard(movingCardId, targetMoveDeckId);
                    setMovingCardId(null);
                  }
                }}
                className="px-5 py-2.5 rounded-2xl bg-kawaii-500 text-white text-xs font-bold active:scale-95"
              >
                Xác nhận chuyển
              </button>
            </div>
          </div>
        </div>
      )}

      {/* 7. RICH CARD EDITOR MODAL */}
      <RichCardEditor
        isOpen={isCardEditorOpen}
        onClose={() => setIsCardEditorOpen(false)}
        initialCard={editingCard}
        deckLanguage={currentDeck?.language || 'zh'}
        onSave={async (cardData) => {
          if (!currentDeck) return false;
          if (editingCard) {
            return await updateCard(editingCard.id, cardData);
          } else {
            const newC = await addCard(currentDeck.id, cardData);
            return !!newC;
          }
        }}
      />

      {/* 8. EXCEL IMPORT MODAL */}
      <ExcelImportModal
        isOpen={isExcelImportOpen}
        onClose={() => setIsExcelImportOpen(false)}
        deckId={currentDeck?.id || ''}
        deckLanguage={currentDeck?.language || 'zh'}
        onImportComplete={async (cards, duplicateAction) => {
          if (!currentDeck) return { success: false };
          return await batchImportCards(currentDeck.id, cards, duplicateAction);
        }}
      />

    </div>
  );
};
