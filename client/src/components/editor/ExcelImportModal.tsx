import React, { useState } from 'react';
import {
  X,
  FileSpreadsheet,
  Upload,
  Download,
  Clipboard,
  CheckCircle2,
  AlertCircle,
  Sparkles,
  ArrowRight,
  Layers,
  Share2,
  Info,
} from 'lucide-react';
import {
  parseExcelFile,
  parsePastedText,
  guessColumnMapping,
  autoGeneratePinyin,
  downloadTemplate,
  type ColumnMapping,
} from '../../services/excelService';

interface ExcelImportModalProps {
  isOpen: boolean;
  onClose: () => void;
  deckId: string;
  deckLanguage: 'zh' | 'en';
  onImportComplete: (cards: any[], duplicateAction: string) => Promise<any>;
}

export const ExcelImportModal: React.FC<ExcelImportModalProps> = ({
  isOpen,
  onClose,
  deckLanguage,
  onImportComplete,
}) => {
  const [tab, setTab] = useState<'upload' | 'paste'>('upload');
  const [step, setStep] = useState<'select' | 'mapping' | 'importing'>('select');

  // Dữ liệu từ file
  const [sheetNames, setSheetNames] = useState<string[]>([]);
  const [selectedSheet, setSelectedSheet] = useState<string>('');
  const [sheetsData, setSheetsData] = useState<Record<string, any[]>>({});
  const [availableHeaders, setAvailableHeaders] = useState<string[]>([]);
  const [columnMapping, setColumnMapping] = useState<ColumnMapping>({
    front: '',
    back: '',
    phonetic: '',
    wordType: '',
    example: '',
    exampleTrans: '',
    notes: '',
    level: '',
    tags: '',
  });

  // Dán văn bản
  const [pastedText, setPastedText] = useState('');

  // Tùy chọn xử lý trùng lặp & Pinyin
  const [duplicateAction, setDuplicateAction] = useState<'keep' | 'skip' | 'overwrite'>('keep');
  const [autoPinyinEnabled, setAutoPinyinEnabled] = useState(true);

  // Tiến trình import
  const [importProgress, setImportProgress] = useState(0);
  const [statusMessage, setStatusMessage] = useState('');

  if (!isOpen) return null;

  // 1. Xử lý khi chọn hoặc kéo thả file
  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    try {
      const { sheetNames: names, sheetsData: data } = await parseExcelFile(file);
      setSheetNames(names);
      setSelectedSheet(names[0] || '');
      setSheetsData(data);

      const firstSheetRows = data[names[0]] || [];
      if (firstSheetRows.length > 0) {
        const headers = Object.keys(firstSheetRows[0]);
        setAvailableHeaders(headers);
        setColumnMapping(guessColumnMapping(headers));
        setStep('mapping');
      } else {
        alert('Tệp Excel không có dòng dữ liệu nào!');
      }
    } catch {
      alert('Không thể đọc tệp Excel. Vui lòng kiểm tra định dạng tệp .xlsx, .xls hoặc .csv');
    }
  };

  // 2. Chuyển đổi Sheet
  const handleSheetChange = (sheetName: string) => {
    setSelectedSheet(sheetName);
    const rows = sheetsData[sheetName] || [];
    if (rows.length > 0) {
      const headers = Object.keys(rows[0]);
      setAvailableHeaders(headers);
      setColumnMapping(guessColumnMapping(headers));
    }
  };

  // 3. Dán từ bộ nhớ tạm (Clipboard API)
  const handlePasteFromClipboard = async () => {
    try {
      if (navigator.clipboard?.readText) {
        const text = await navigator.clipboard.readText();
        if (text) {
          setPastedText(text);
          return;
        }
      }
    } catch {}
    alert('Vui lòng chạm giữ ô bên dưới và chọn "Dán" để nạp nội dung.');
  };

  // Xử lý khi xác nhận văn bản dán
  const handlePasteSubmit = () => {
    if (!pastedText.trim()) return;

    const parsed = parsePastedText(pastedText, deckLanguage);
    if (parsed.length === 0) {
      alert('Không nhận diện được định dạng. Bạn hãy dán dạng tab-separated hoặc "từ - nghĩa".');
      return;
    }

    setSheetsData({ 'Dữ liệu dán': parsed });
    setSheetNames(['Dữ liệu dán']);
    setSelectedSheet('Dữ liệu dán');
    setAvailableHeaders(['front', 'back', 'phonetic', 'wordType', 'example']);
    setColumnMapping({
      front: 'front',
      back: 'back',
      phonetic: 'phonetic',
      wordType: 'wordType',
      example: 'example',
      exampleTrans: '',
      notes: '',
      level: '',
      tags: '',
    });
    setStep('mapping');
  };

  // 4. Xem trước dữ liệu
  const currentRows = sheetsData[selectedSheet] || [];
  const previewRows = currentRows.slice(0, 10).map((row, index) => {
    const frontVal = String(row[columnMapping.front] || '').trim();
    const backVal = String(row[columnMapping.back] || '').trim();
    const phoneticVal = String(row[columnMapping.phonetic] || '').trim();

    let error = '';
    if (!frontVal && !backVal) error = 'Dòng trống';
    else if (!frontVal) error = 'Thiếu mặt trước';
    else if (!backVal) error = 'Thiếu mặt sau';

    return {
      index: index + 1,
      front: frontVal,
      back: backVal,
      phonetic:
        phoneticVal ||
        (deckLanguage === 'zh' && autoPinyinEnabled && frontVal
          ? autoGeneratePinyin(frontVal)
          : ''),
      error,
    };
  });

  // 5. Thực hiện Import
  const handleStartImport = async () => {
    setStep('importing');
    setImportProgress(10);
    setStatusMessage('Đang xử lý chuẩn hóa dữ liệu thẻ...');

    const processedCards: any[] = [];
    const total = currentRows.length;

    for (let i = 0; i < total; i++) {
      const row = currentRows[i];
      const frontVal = String(row[columnMapping.front] || '').trim();
      const backVal = String(row[columnMapping.back] || '').trim();

      if (!frontVal || !backVal) continue;

      let phoneticVal = String(row[columnMapping.phonetic] || '').trim();
      if (!phoneticVal && deckLanguage === 'zh' && autoPinyinEnabled) {
        phoneticVal = autoGeneratePinyin(frontVal);
      }

      processedCards.push({
        front: frontVal,
        back: backVal,
        phonetic: phoneticVal || null,
        wordType: String(row[columnMapping.wordType] || '').trim() || null,
        example: String(row[columnMapping.example] || '').trim() || null,
        exampleTrans: String(row[columnMapping.exampleTrans] || '').trim() || null,
        notes: String(row[columnMapping.notes] || '').trim() || null,
        level: String(row[columnMapping.level] || '').trim() || null,
        tagsJson: row[columnMapping.tags]
          ? JSON.stringify(String(row[columnMapping.tags]).split(',').map((s) => s.trim()))
          : null,
      });

      if (i % 100 === 0 || i === total - 1) {
        setImportProgress(Math.round((i / total) * 60) + 10);
      }
    }

    setStatusMessage(`Đang lưu ${processedCards.length} thẻ vào bộ...`);
    setImportProgress(75);

    const result = await onImportComplete(processedCards, duplicateAction);
    setImportProgress(100);

    if (result?.success) {
      setStatusMessage('Nhập hoàn tất thành công! 🎉');
      setTimeout(() => {
        onClose();
      }, 900);
    } else {
      setStatusMessage(result?.message || 'Có lỗi xảy ra khi nhập.');
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex flex-col justify-end sm:justify-center sm:items-center bg-black/60 backdrop-blur-sm animate-fade-in p-0 sm:p-4">
      {/* Container: Fullscreen on mobile, rounded card on tablet/desktop */}
      <div className="relative w-full sm:max-w-4xl h-[100dvh] sm:h-[90vh] bg-white dark:bg-dark-card rounded-t-3xl sm:rounded-3xl shadow-kawaii-lg border-t-2 sm:border-2 border-kawaii-200 dark:border-dark-border flex flex-col overflow-hidden animate-slide-up sm:animate-none">
        
        {/* Header */}
        <div className="px-4 py-3 sm:px-6 sm:py-4 border-b border-kawaii-100 dark:border-dark-border bg-white dark:bg-dark-card flex items-center justify-between shrink-0">
          <div className="flex items-center gap-2.5">
            <div className="p-2 rounded-2xl bg-emerald-100 dark:bg-emerald-950/50 text-emerald-600 dark:text-emerald-400">
              <FileSpreadsheet className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base sm:text-lg font-bold font-display text-gray-800 dark:text-white leading-tight">
                Nhập Thẻ Excel / CSV / Dán 📊
              </h2>
              <p className="text-[11px] text-gray-500 dark:text-dark-textMuted">
                Tự nhận diện cột, bổ sung Pinyin tự động
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-2.5 text-gray-400 hover:text-gray-700 dark:hover:text-gray-200 rounded-full hover:bg-gray-100 dark:hover:bg-dark-bg transition-colors"
            aria-label="Đóng"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Nội dung theo từng bước */}
        <div className="flex-1 overflow-y-auto p-4 sm:p-6 space-y-5">
          
          {/* BƯỚC 1: CHỌN PHƯƠNG THỨC & NẠP DỮ LIỆU */}
          {step === 'select' && (
            <div className="space-y-5">
              
              {/* Tab Tải file hoặc Dán */}
              <div className="flex bg-kawaii-50 dark:bg-dark-bg p-1 rounded-2xl max-w-sm mx-auto">
                <button
                  type="button"
                  onClick={() => setTab('upload')}
                  className={`flex-1 py-2 text-xs font-bold rounded-xl transition-all ${
                    tab === 'upload'
                      ? 'bg-white dark:bg-dark-card text-kawaii-600 dark:text-kawaii-400 shadow-sm'
                      : 'text-gray-500'
                  }`}
                >
                  Tải tệp Excel / CSV
                </button>
                <button
                  type="button"
                  onClick={() => setTab('paste')}
                  className={`flex-1 py-2 text-xs font-bold rounded-xl transition-all ${
                    tab === 'paste'
                      ? 'bg-white dark:bg-dark-card text-kawaii-600 dark:text-kawaii-400 shadow-sm'
                      : 'text-gray-500'
                  }`}
                >
                  Dán từ Clipboard
                </button>
              </div>

              {tab === 'upload' ? (
                <div className="space-y-4">
                  {/* Vùng chọn File to rõ */}
                  <label className="border-2 border-dashed border-kawaii-300 dark:border-dark-border hover:border-kawaii-500 rounded-3xl p-6 sm:p-10 flex flex-col items-center justify-center text-center cursor-pointer bg-kawaii-50/30 dark:bg-dark-bg/40 transition-colors group active:scale-[0.99]">
                    <div className="w-16 h-16 rounded-full bg-kawaii-100 dark:bg-dark-card flex items-center justify-center text-kawaii-500 mb-3 group-hover:scale-110 transition-transform shadow-sm">
                      <Upload className="w-7 h-7" />
                    </div>
                    <span className="text-base font-bold text-gray-800 dark:text-white">
                      Chạm để chọn tệp từ điện thoại
                    </span>
                    <span className="text-xs text-gray-500 dark:text-dark-textMuted mt-1 max-w-xs">
                      Hỗ trợ tệp <strong>.xlsx, .xls, .csv</strong> (từ Google Drive, Zalo, Tệp máy)
                    </span>
                    <span className="mt-3 px-4 py-2 rounded-xl bg-kawaii-500 text-white font-bold text-xs shadow-kawaii-sm">
                      Duyệt tệp tin
                    </span>
                    <input
                      type="file"
                      accept=".xlsx,.xls,.csv"
                      onChange={handleFileChange}
                      className="hidden"
                    />
                  </label>

                  {/* Hướng dẫn trên di động */}
                  <div className="p-3.5 rounded-2xl bg-blue-50/60 dark:bg-blue-950/30 border border-blue-200 dark:border-blue-900/40 flex items-start gap-2.5 text-xs text-blue-800 dark:text-blue-300">
                    <Info className="w-4 h-4 shrink-0 mt-0.5 text-blue-500" />
                    <span>
                      <strong>Mẹo di động:</strong> Khi tải tệp về từ Zalo hoặc Google Drive, bấm nút "Duyệt tệp tin" ở trên rồi chọn mục <em>Tải xuống</em> hoặc <em>Files/Tệp</em>.
                    </span>
                  </div>

                  {/* Tải hoặc Chia sẻ file mẫu */}
                  <div className="p-4 rounded-3xl bg-emerald-50/60 dark:bg-emerald-950/30 border border-emerald-200 dark:border-emerald-900/60 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
                    <div className="flex items-center gap-2.5">
                      <div className="p-2 rounded-xl bg-emerald-100 dark:bg-emerald-900 text-emerald-700 dark:text-emerald-300">
                        <FileSpreadsheet className="w-5 h-5" />
                      </div>
                      <div>
                        <p className="text-xs font-bold text-emerald-900 dark:text-emerald-300">
                          Chưa có file mẫu chuẩn?
                        </p>
                        <p className="text-[11px] text-emerald-700 dark:text-emerald-400">
                          Tải hoặc chia sẻ file template có sẵn cột chuẩn
                        </p>
                      </div>
                    </div>
                    <div className="flex gap-2 w-full sm:w-auto">
                      <button
                        type="button"
                        onClick={() => downloadTemplate('zh')}
                        className="flex-1 sm:flex-initial px-3.5 py-2 rounded-xl bg-white dark:bg-dark-card text-emerald-700 dark:text-emerald-300 border border-emerald-300 hover:bg-emerald-100 text-xs font-bold flex items-center justify-center gap-1.5 shadow-sm active:scale-95"
                      >
                        <Download className="w-3.5 h-3.5" />
                        <span>Mẫu HSK Trung</span>
                      </button>
                      <button
                        type="button"
                        onClick={() => downloadTemplate('en')}
                        className="flex-1 sm:flex-initial px-3.5 py-2 rounded-xl bg-white dark:bg-dark-card text-emerald-700 dark:text-emerald-300 border border-emerald-300 hover:bg-emerald-100 text-xs font-bold flex items-center justify-center gap-1.5 shadow-sm active:scale-95"
                      >
                        <Share2 className="w-3.5 h-3.5" />
                        <span>Mẫu Tiếng Anh</span>
                      </button>
                    </div>
                  </div>
                </div>
              ) : (
                /* Tab Dán văn bản */
                <div className="space-y-4">
                  <div className="p-3 bg-purple-50 dark:bg-purple-950/30 rounded-2xl text-xs text-purple-700 dark:text-purple-300 border border-purple-200 dark:border-purple-900/50 flex items-start justify-between gap-2">
                    <div className="flex items-start gap-2">
                      <Clipboard className="w-4 h-4 shrink-0 mt-0.5" />
                      <span>
                        Sao chép bảng từ Google Sheets/Excel hoặc định dạng <strong>"từ - nghĩa"</strong> rồi dán vào đây:
                      </span>
                    </div>
                    <button
                      type="button"
                      onClick={handlePasteFromClipboard}
                      className="px-2.5 py-1 rounded-lg bg-purple-200 dark:bg-purple-900 text-purple-800 dark:text-purple-200 font-bold text-[11px] shrink-0 active:scale-95"
                    >
                      Dán nhanh
                    </button>
                  </div>

                  <textarea
                    rows={7}
                    value={pastedText}
                    onChange={(e) => setPastedText(e.target.value)}
                    placeholder={
                      deckLanguage === 'zh'
                        ? '你好 - Xin chào\n谢谢 - Cảm ơn\n再见 - Tạm biệt'
                        : 'Serendipity - Sự tình cờ may mắn\nEffortless - Không tốn công sức'
                    }
                    className="w-full p-4 rounded-2xl bg-gray-50 dark:bg-dark-bg border border-kawaii-200 dark:border-dark-border text-base sm:text-sm outline-none focus:border-kawaii-500 dark:text-white font-mono"
                  />

                  <div className="flex justify-end">
                    <button
                      type="button"
                      onClick={handlePasteSubmit}
                      className="w-full sm:w-auto px-6 py-3 rounded-2xl bg-kawaii-500 text-white font-bold text-xs shadow-kawaii btn-bounce flex items-center justify-center gap-1.5"
                    >
                      <span>Tiếp tục ghép cột</span>
                      <ArrowRight className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              )}

            </div>
          )}

          {/* BƯỚC 2: GHÉP CỘT & XEM TRƯỚC DỮ LIỆU */}
          {step === 'mapping' && (
            <div className="space-y-5">
              
              {/* Chọn Sheet nếu có nhiều sheet */}
              {sheetNames.length > 1 && (
                <div className="p-3.5 rounded-2xl bg-kawaii-50 dark:bg-dark-bg border border-kawaii-200 dark:border-dark-border flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                  <span className="text-xs font-bold text-gray-700 dark:text-gray-300 flex items-center gap-1.5">
                    <Layers className="w-4 h-4 text-kawaii-500" /> Chọn Sheet cần nhập:
                  </span>
                  <select
                    value={selectedSheet}
                    onChange={(e) => handleSheetChange(e.target.value)}
                    className="px-3 py-2 rounded-xl bg-white dark:bg-dark-card border border-kawaii-200 dark:border-dark-border text-base sm:text-xs font-bold outline-none dark:text-white"
                  >
                    {sheetNames.map((s) => (
                      <option key={s} value={s}>
                        {s} ({sheetsData[s]?.length || 0} dòng)
                      </option>
                    ))}
                  </select>
                </div>
              )}

              {/* Danh sách dọc Ánh xạ cột (Column Mapping) */}
              <div className="p-4 sm:p-5 rounded-3xl bg-gray-50 dark:bg-dark-bg/60 border border-kawaii-200 dark:border-dark-border space-y-4">
                <div className="flex items-center justify-between">
                  <h3 className="text-xs font-bold text-gray-800 dark:text-white uppercase tracking-wider flex items-center gap-1.5">
                    <Sparkles className="w-3.5 h-3.5 text-kawaii-500" />
                    <span>Ghép cột dữ liệu</span>
                  </h3>
                  <span className="text-xs text-kawaii-600 font-bold">
                    Tổng: {currentRows.length} dòng
                  </span>
                </div>

                <div className="space-y-3">
                  <div>
                    <label className="block text-xs font-bold text-gray-700 dark:text-gray-300 mb-1">
                      Mặt trước (Từ vựng / Chữ Hán) <span className="text-red-500">*</span>
                    </label>
                    <select
                      value={columnMapping.front}
                      onChange={(e) => setColumnMapping({ ...columnMapping, front: e.target.value })}
                      className="w-full px-3.5 py-3 rounded-2xl bg-white dark:bg-dark-card border border-kawaii-200 dark:border-dark-border text-base sm:text-xs font-semibold dark:text-white outline-none focus:border-kawaii-500"
                    >
                      <option value="">-- Chọn cột tương ứng --</option>
                      {availableHeaders.map((h) => (
                        <option key={h} value={h}>{h}</option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-gray-700 dark:text-gray-300 mb-1">
                      Mặt sau (Nghĩa tiếng Việt) <span className="text-red-500">*</span>
                    </label>
                    <select
                      value={columnMapping.back}
                      onChange={(e) => setColumnMapping({ ...columnMapping, back: e.target.value })}
                      className="w-full px-3.5 py-3 rounded-2xl bg-white dark:bg-dark-card border border-kawaii-200 dark:border-dark-border text-base sm:text-xs font-semibold dark:text-white outline-none focus:border-kawaii-500"
                    >
                      <option value="">-- Chọn cột tương ứng --</option>
                      {availableHeaders.map((h) => (
                        <option key={h} value={h}>{h}</option>
                      ))}
                    </select>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <div>
                      <label className="block text-xs font-semibold text-gray-700 dark:text-gray-300 mb-1">
                        Phiên âm (Pinyin / IPA)
                      </label>
                      <select
                        value={columnMapping.phonetic}
                        onChange={(e) => setColumnMapping({ ...columnMapping, phonetic: e.target.value })}
                        className="w-full px-3.5 py-2.5 rounded-2xl bg-white dark:bg-dark-card border border-kawaii-200 dark:border-dark-border text-base sm:text-xs font-semibold dark:text-white outline-none"
                      >
                        <option value="">-- Bỏ trống (tự sinh Pinyin) --</option>
                        {availableHeaders.map((h) => (
                          <option key={h} value={h}>{h}</option>
                        ))}
                      </select>
                    </div>

                    <div>
                      <label className="block text-xs font-semibold text-gray-700 dark:text-gray-300 mb-1">
                        Loại từ (Danh từ, động từ...)
                      </label>
                      <select
                        value={columnMapping.wordType}
                        onChange={(e) => setColumnMapping({ ...columnMapping, wordType: e.target.value })}
                        className="w-full px-3.5 py-2.5 rounded-2xl bg-white dark:bg-dark-card border border-kawaii-200 dark:border-dark-border text-base sm:text-xs font-semibold dark:text-white outline-none"
                      >
                        <option value="">-- Bỏ trống --</option>
                        {availableHeaders.map((h) => (
                          <option key={h} value={h}>{h}</option>
                        ))}
                      </select>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <div>
                      <label className="block text-xs font-semibold text-gray-700 dark:text-gray-300 mb-1">
                        Câu ví dụ
                      </label>
                      <select
                        value={columnMapping.example}
                        onChange={(e) => setColumnMapping({ ...columnMapping, example: e.target.value })}
                        className="w-full px-3.5 py-2.5 rounded-2xl bg-white dark:bg-dark-card border border-kawaii-200 dark:border-dark-border text-base sm:text-xs font-semibold dark:text-white outline-none"
                      >
                        <option value="">-- Bỏ trống --</option>
                        {availableHeaders.map((h) => (
                          <option key={h} value={h}>{h}</option>
                        ))}
                      </select>
                    </div>

                    <div>
                      <label className="block text-xs font-semibold text-gray-700 dark:text-gray-300 mb-1">
                        Ghi chú / Mẹo nhớ
                      </label>
                      <select
                        value={columnMapping.notes}
                        onChange={(e) => setColumnMapping({ ...columnMapping, notes: e.target.value })}
                        className="w-full px-3.5 py-2.5 rounded-2xl bg-white dark:bg-dark-card border border-kawaii-200 dark:border-dark-border text-base sm:text-xs font-semibold dark:text-white outline-none"
                      >
                        <option value="">-- Bỏ trống --</option>
                        {availableHeaders.map((h) => (
                          <option key={h} value={h}>{h}</option>
                        ))}
                      </select>
                    </div>
                  </div>
                </div>
              </div>

              {/* Tùy chọn xử lý trùng lặp & Pinyin */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div className="p-3.5 rounded-2xl bg-white dark:bg-dark-card border border-kawaii-200 dark:border-dark-border space-y-2">
                  <label className="text-xs font-bold text-gray-700 dark:text-gray-300 block">
                    Xử lý từ trùng lặp trong bộ:
                  </label>
                  <div className="flex gap-4 text-xs">
                    <label className="flex items-center gap-1.5 cursor-pointer">
                      <input
                        type="radio"
                        name="duplicateAction"
                        checked={duplicateAction === 'keep'}
                        onChange={() => setDuplicateAction('keep')}
                        className="w-4 h-4 accent-kawaii-500"
                      />
                      <span>Giữ cả hai</span>
                    </label>
                    <label className="flex items-center gap-1.5 cursor-pointer">
                      <input
                        type="radio"
                        name="duplicateAction"
                        checked={duplicateAction === 'skip'}
                        onChange={() => setDuplicateAction('skip')}
                        className="w-4 h-4 accent-kawaii-500"
                      />
                      <span>Bỏ qua</span>
                    </label>
                    <label className="flex items-center gap-1.5 cursor-pointer">
                      <input
                        type="radio"
                        name="duplicateAction"
                        checked={duplicateAction === 'overwrite'}
                        onChange={() => setDuplicateAction('overwrite')}
                        className="w-4 h-4 accent-kawaii-500"
                      />
                      <span>Ghi đè</span>
                    </label>
                  </div>
                </div>

                {deckLanguage === 'zh' && (
                  <div className="p-3.5 rounded-2xl bg-white dark:bg-dark-card border border-kawaii-200 dark:border-dark-border flex items-center justify-between">
                    <div>
                      <p className="text-xs font-bold text-gray-700 dark:text-gray-300">
                        Tự động sinh Pinyin
                      </p>
                      <p className="text-[11px] text-gray-400">
                        Bổ sung phiên âm nếu ô trống
                      </p>
                    </div>
                    <input
                      type="checkbox"
                      checked={autoPinyinEnabled}
                      onChange={(e) => setAutoPinyinEnabled(e.target.checked)}
                      className="w-5 h-5 accent-kawaii-500 rounded cursor-pointer"
                    />
                  </div>
                )}
              </div>

              {/* Xem trước dạng thẻ cuộn dọc trên mobile (Card-Style Preview) */}
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <h4 className="text-xs font-bold text-gray-700 dark:text-gray-300">
                    Xem trước 10 dòng đầu:
                  </h4>
                  <span className="text-[11px] text-gray-400">
                    Kiểm tra độ chính xác trước khi lưu
                  </span>
                </div>

                {/* Mobile: Card list view */}
                <div className="space-y-2.5">
                  {previewRows.map((r) => (
                    <div
                      key={r.index}
                      className={`p-3.5 rounded-2xl border text-xs flex flex-col justify-between gap-1.5 ${
                        r.error
                          ? 'bg-red-50/60 dark:bg-red-950/20 border-red-200'
                          : 'bg-white dark:bg-dark-card border-kawaii-200 dark:border-dark-border shadow-sm'
                      }`}
                    >
                      <div className="flex items-start justify-between gap-2">
                        <div className="flex items-center gap-2">
                          <span className="text-[11px] font-bold text-gray-400">#{r.index}</span>
                          <span className="font-bold text-sm text-gray-900 dark:text-white font-hanzi">
                            {r.front || <span className="text-red-400 italic">(Trống mặt trước)</span>}
                          </span>
                          {r.phonetic && (
                            <span className="text-kawaii-600 dark:text-kawaii-400 font-mono font-semibold">
                              ({r.phonetic})
                            </span>
                          )}
                        </div>

                        {r.error ? (
                          <span className="inline-flex items-center gap-1 text-[11px] text-red-500 font-bold shrink-0">
                            <AlertCircle className="w-3.5 h-3.5" />
                            <span>{r.error}</span>
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1 text-[11px] text-emerald-500 font-bold shrink-0">
                            <CheckCircle2 className="w-3.5 h-3.5" />
                            <span>Hợp lệ</span>
                          </span>
                        )}
                      </div>

                      <p className="text-gray-700 dark:text-gray-300 font-medium pl-6">
                        {r.back || <span className="text-red-400 italic">(Trống mặt sau)</span>}
                      </p>
                    </div>
                  ))}
                </div>
              </div>

            </div>
          )}

          {/* BƯỚC 3: TIẾN TRÌNH IMPORT */}
          {step === 'importing' && (
            <div className="py-16 flex flex-col items-center justify-center text-center space-y-4">
              <div className="w-16 h-16 rounded-full bg-kawaii-100 dark:bg-dark-bg text-kawaii-500 flex items-center justify-center animate-spin">
                <Sparkles className="w-8 h-8" />
              </div>

              <div className="space-y-1">
                <h3 className="text-lg font-bold text-gray-800 dark:text-white">
                  Đang tiến hành nhập dữ liệu...
                </h3>
                <p className="text-xs text-gray-500 dark:text-dark-textMuted">
                  {statusMessage}
                </p>
              </div>

              {/* Thanh tiến trình */}
              <div className="w-full max-w-xs bg-gray-100 dark:bg-dark-bg rounded-full h-3 overflow-hidden border border-kawaii-200 dark:border-dark-border">
                <div
                  className="bg-gradient-to-r from-kawaii-400 to-kawaii-500 h-full rounded-full transition-all duration-300"
                  style={{ width: `${importProgress}%` }}
                />
              </div>
              <span className="text-xs font-bold text-kawaii-600">{importProgress}%</span>
            </div>
          )}

        </div>

        {/* Sticky Bottom Actions Bar */}
        {step === 'mapping' && (
          <div className="px-4 py-3 sm:px-6 sm:py-4 border-t border-kawaii-100 dark:border-dark-border bg-white/95 dark:bg-dark-card/95 backdrop-blur shrink-0 safe-pb flex items-center justify-between gap-3">
            <button
              type="button"
              onClick={() => setStep('select')}
              className="px-4 py-3 rounded-2xl bg-gray-100 dark:bg-dark-bg text-gray-700 dark:text-gray-300 font-bold text-xs"
            >
              Quay lại
            </button>

            <button
              type="button"
              onClick={handleStartImport}
              className="flex-1 sm:flex-initial px-6 py-3 rounded-2xl bg-gradient-to-r from-emerald-500 to-teal-500 hover:from-emerald-600 hover:to-teal-600 text-white font-bold text-xs shadow-md btn-bounce flex items-center justify-center gap-2"
            >
              <CheckCircle2 className="w-4 h-4" />
              <span>Xác nhận nhập {currentRows.length} thẻ</span>
            </button>
          </div>
        )}

      </div>
    </div>
  );
};
