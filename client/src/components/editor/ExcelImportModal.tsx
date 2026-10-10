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

  // Tùy chọn xử lý trùng lặp
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

  // 3. Xử lý khi dán văn bản
  const handlePasteSubmit = () => {
    if (!pastedText.trim()) return;

    const parsed = parsePastedText(pastedText, deckLanguage);
    if (parsed.length === 0) {
      alert('Không nhận diện được định dạng. Bạn hãy dán dạng tab-separated hoặc "từ - nghĩa".');
      return;
    }

    setSheetsData({ 'Pasted Data': parsed });
    setSheetNames(['Pasted Data']);
    setSelectedSheet('Pasted Data');
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

  // 4. Xem trước 10 dòng đầu kèm báo lỗi
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
      phonetic: phoneticVal || (deckLanguage === 'zh' && autoPinyinEnabled && frontVal ? autoGeneratePinyin(frontVal) : ''),
      error,
    };
  });

  // 5. Thực hiện Import với thanh tiến trình mượt mà
  const handleStartImport = async () => {
    setStep('importing');
    setImportProgress(5);
    setStatusMessage('Đang xử lý chuẩn hóa dữ liệu thẻ...');

    const processedCards: any[] = [];
    const total = currentRows.length;

    // Xử lý chunking để không đơ giao diện
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

      if (i % 200 === 0 || i === total - 1) {
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
      }, 1000);
    } else {
      setStatusMessage(result?.message || 'Có lỗi xảy ra khi nhập.');
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-6 bg-black/50 backdrop-blur-sm animate-fade-in">
      <div className="relative w-full max-w-4xl max-h-[92vh] bg-white dark:bg-dark-card rounded-3xl shadow-kawaii-lg border-2 border-kawaii-200 dark:border-dark-border flex flex-col overflow-hidden">
        
        {/* Header */}
        <div className="p-4 sm:p-6 border-b border-kawaii-100 dark:border-dark-border flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-2xl bg-emerald-100 dark:bg-emerald-950/50 text-emerald-600 dark:text-emerald-400">
              <FileSpreadsheet className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-xl font-bold font-display text-gray-800 dark:text-white">
                Nhập Thẻ Thông Minh (Excel / CSV / Copy-Paste) 📊
              </h2>
              <p className="text-xs text-gray-500 dark:text-dark-textMuted">
                Tự động nhận diện cột, bổ sung Pinyin và xử lý tới 5.000 dòng mượt mà
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-2 text-gray-400 hover:text-gray-600 dark:hover:text-gray-200 rounded-full hover:bg-gray-100 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Nội dung theo từng bước */}
        <div className="flex-1 overflow-y-auto p-4 sm:p-6 space-y-6">
          
          {/* BƯỚC 1: CHỌN PHƯƠNG THỨC & NẠP DỮ LIỆU */}
          {step === 'select' && (
            <div className="space-y-6">
              
              {/* Tab Tải file hoặc Dán */}
              <div className="flex bg-kawaii-50 dark:bg-dark-bg p-1 rounded-2xl max-w-xs mx-auto">
                <button
                  type="button"
                  onClick={() => setTab('upload')}
                  className={`flex-1 py-2 text-xs font-bold rounded-xl transition-all ${
                    tab === 'upload'
                      ? 'bg-white dark:bg-dark-card text-kawaii-600 shadow-sm'
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
                      ? 'bg-white dark:bg-dark-card text-kawaii-600 shadow-sm'
                      : 'text-gray-500'
                  }`}
                >
                  Dán trực tiếp
                </button>
              </div>

              {tab === 'upload' ? (
                <div className="space-y-4">
                  {/* Vùng kéo thả File */}
                  <label className="border-2 border-dashed border-kawaii-300 dark:border-dark-border hover:border-kawaii-500 rounded-3xl p-8 sm:p-12 flex flex-col items-center justify-center text-center cursor-pointer bg-kawaii-50/30 dark:bg-dark-bg/40 transition-colors group">
                    <div className="w-16 h-16 rounded-full bg-kawaii-100 dark:bg-dark-card flex items-center justify-center text-kawaii-500 mb-3 group-hover:scale-110 transition-transform">
                      <Upload className="w-8 h-8" />
                    </div>
                    <span className="text-sm font-bold text-gray-800 dark:text-white">
                      Nhấp để chọn tệp hoặc kéo thả tệp vào đây
                    </span>
                    <span className="text-xs text-gray-500 dark:text-dark-textMuted mt-1">
                      Hỗ trợ định dạng .xlsx, .xls, .csv (lên tới 5.000 dòng)
                    </span>
                    <input
                      type="file"
                      accept=".xlsx,.xls,.csv"
                      onChange={handleFileChange}
                      className="hidden"
                    />
                  </label>

                  {/* Nút tải File Excel Mẫu */}
                  <div className="p-4 rounded-2xl bg-emerald-50 dark:bg-emerald-950/30 border border-emerald-200 dark:border-emerald-900/60 flex flex-col sm:flex-row items-center justify-between gap-3">
                    <div className="flex items-center gap-2.5">
                      <FileSpreadsheet className="w-5 h-5 text-emerald-600" />
                      <div>
                        <p className="text-xs font-bold text-emerald-900 dark:text-emerald-300">
                          Chưa có file mẫu? Tải ngay file template chuẩn:
                        </p>
                        <p className="text-[11px] text-emerald-700 dark:text-emerald-400">
                          Có sẵn cột Mặt trước, Mặt sau, Phiên âm, Ví dụ và vài dòng dữ liệu mẫu
                        </p>
                      </div>
                    </div>
                    <div className="flex gap-2 shrink-0">
                      <button
                        type="button"
                        onClick={() => downloadTemplate('zh')}
                        className="px-3 py-1.5 rounded-xl bg-white dark:bg-dark-card text-emerald-700 dark:text-emerald-300 border border-emerald-300 hover:bg-emerald-100 text-xs font-bold flex items-center gap-1 shadow-sm"
                      >
                        <Download className="w-3.5 h-3.5" />
                        <span>Mẫu HSK (Trung)</span>
                      </button>
                      <button
                        type="button"
                        onClick={() => downloadTemplate('en')}
                        className="px-3 py-1.5 rounded-xl bg-white dark:bg-dark-card text-emerald-700 dark:text-emerald-300 border border-emerald-300 hover:bg-emerald-100 text-xs font-bold flex items-center gap-1 shadow-sm"
                      >
                        <Download className="w-3.5 h-3.5" />
                        <span>Mẫu Oxford (Anh)</span>
                      </button>
                    </div>
                  </div>
                </div>
              ) : (
                /* Tab Dán văn bản */
                <div className="space-y-4">
                  <div className="p-3 bg-purple-50 dark:bg-purple-950/30 rounded-2xl text-xs text-purple-700 dark:text-purple-300 border border-purple-200 dark:border-purple-900/50 flex items-start gap-2">
                    <Clipboard className="w-4 h-4 shrink-0 mt-0.5" />
                    <span>
                      Bạn có thể copy các ô trực tiếp từ Excel / Google Sheets rồi dán vào đây, hoặc dán theo định dạng <strong>"từ - nghĩa"</strong> (mỗi từ trên một dòng).
                    </span>
                  </div>

                  <textarea
                    rows={8}
                    value={pastedText}
                    onChange={(e) => setPastedText(e.target.value)}
                    placeholder={
                      deckLanguage === 'zh'
                        ? '你好 - Xin chào\n谢谢 - Cảm ơn\n再见 - Tạm biệt'
                        : 'Serendipity - Sự tình cờ may mắn\nEffortless - Không tốn công sức'
                    }
                    className="w-full p-4 rounded-2xl bg-gray-50 dark:bg-dark-bg border border-kawaii-200 dark:border-dark-border text-sm outline-none focus:border-kawaii-500 dark:text-white font-mono"
                  />

                  <div className="flex justify-end">
                    <button
                      type="button"
                      onClick={handlePasteSubmit}
                      className="px-6 py-2.5 rounded-2xl bg-kawaii-500 text-white font-bold text-xs shadow-kawaii btn-bounce flex items-center gap-1.5"
                    >
                      <span>Tiếp tục sang bước ghép cột</span>
                      <ArrowRight className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              )}

            </div>
          )}

          {/* BƯỚC 2: GHÉP CỘT & XEM TRƯỚC 10 DÒNG */}
          {step === 'mapping' && (
            <div className="space-y-6">
              
              {/* Chọn Sheet nếu file có nhiều sheet */}
              {sheetNames.length > 1 && (
                <div className="p-3 rounded-2xl bg-kawaii-50 dark:bg-dark-bg border border-kawaii-200 dark:border-dark-border flex items-center justify-between">
                  <span className="text-xs font-bold text-gray-700 dark:text-gray-300 flex items-center gap-1.5">
                    <Layers className="w-4 h-4 text-kawaii-500" /> Chọn Sheet cần nhập:
                  </span>
                  <select
                    value={selectedSheet}
                    onChange={(e) => handleSheetChange(e.target.value)}
                    className="px-3 py-1.5 rounded-xl bg-white dark:bg-dark-card border border-kawaii-200 dark:border-dark-border text-xs font-bold outline-none dark:text-white"
                  >
                    {sheetNames.map((s) => (
                      <option key={s} value={s}>
                        {s} ({sheetsData[s]?.length || 0} dòng)
                      </option>
                    ))}
                  </select>
                </div>
              )}

              {/* Bảng chọn Ghép cột (Column Mapping) */}
              <div className="p-4 rounded-3xl bg-gray-50 dark:bg-dark-bg/60 border border-kawaii-200 dark:border-dark-border space-y-3">
                <div className="flex items-center justify-between">
                  <h3 className="text-xs font-bold text-gray-800 dark:text-white uppercase tracking-wider flex items-center gap-1.5">
                    <Sparkles className="w-3.5 h-3.5 text-kawaii-500" />
                    <span>Ghép Cột Tự Động (Điều chỉnh nếu cần)</span>
                  </h3>
                  <span className="text-xs text-kawaii-600 font-bold">
                    Tổng: {currentRows.length} dòng
                  </span>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                  <div>
                    <label className="block text-xs font-semibold text-gray-600 dark:text-gray-300 mb-1">
                      Mặt trước (Từ / Hán tự) <span className="text-red-500">*</span>
                    </label>
                    <select
                      value={columnMapping.front}
                      onChange={(e) => setColumnMapping({ ...columnMapping, front: e.target.value })}
                      className="w-full p-2 rounded-xl bg-white dark:bg-dark-card border border-kawaii-200 dark:border-dark-border text-xs font-semibold dark:text-white outline-none"
                    >
                      <option value="">-- Chọn cột --</option>
                      {availableHeaders.map((h) => (
                        <option key={h} value={h}>{h}</option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-gray-600 dark:text-gray-300 mb-1">
                      Mặt sau (Nghĩa tiếng Việt) <span className="text-red-500">*</span>
                    </label>
                    <select
                      value={columnMapping.back}
                      onChange={(e) => setColumnMapping({ ...columnMapping, back: e.target.value })}
                      className="w-full p-2 rounded-xl bg-white dark:bg-dark-card border border-kawaii-200 dark:border-dark-border text-xs font-semibold dark:text-white outline-none"
                    >
                      <option value="">-- Chọn cột --</option>
                      {availableHeaders.map((h) => (
                        <option key={h} value={h}>{h}</option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-gray-600 dark:text-gray-300 mb-1">
                      Phiên âm (Pinyin / IPA)
                    </label>
                    <select
                      value={columnMapping.phonetic}
                      onChange={(e) => setColumnMapping({ ...columnMapping, phonetic: e.target.value })}
                      className="w-full p-2 rounded-xl bg-white dark:bg-dark-card border border-kawaii-200 dark:border-dark-border text-xs font-semibold dark:text-white outline-none"
                    >
                      <option value="">-- Bỏ trống (tự sinh Pinyin) --</option>
                      {availableHeaders.map((h) => (
                        <option key={h} value={h}>{h}</option>
                      ))}
                    </select>
                  </div>
                </div>
              </div>

              {/* Tùy chọn xử lý trùng lặp & Tự động Pinyin */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="p-3.5 rounded-2xl bg-white dark:bg-dark-card border border-kawaii-100 dark:border-dark-border space-y-1.5">
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
                      />
                      <span>Giữ cả hai</span>
                    </label>
                    <label className="flex items-center gap-1.5 cursor-pointer">
                      <input
                        type="radio"
                        name="duplicateAction"
                        checked={duplicateAction === 'skip'}
                        onChange={() => setDuplicateAction('skip')}
                      />
                      <span>Bỏ qua</span>
                    </label>
                    <label className="flex items-center gap-1.5 cursor-pointer">
                      <input
                        type="radio"
                        name="duplicateAction"
                        checked={duplicateAction === 'overwrite'}
                        onChange={() => setDuplicateAction('overwrite')}
                      />
                      <span>Ghi đè</span>
                    </label>
                  </div>
                </div>

                {deckLanguage === 'zh' && (
                  <div className="p-3.5 rounded-2xl bg-white dark:bg-dark-card border border-kawaii-100 dark:border-dark-border flex items-center justify-between">
                    <div>
                      <p className="text-xs font-bold text-gray-700 dark:text-gray-300">
                        Tự động sinh Pinyin
                      </p>
                      <p className="text-[11px] text-gray-400">
                        Nếu ô phiên âm bị trống, tự tạo pinyin kèm dấu
                      </p>
                    </div>
                    <input
                      type="checkbox"
                      checked={autoPinyinEnabled}
                      onChange={(e) => setAutoPinyinEnabled(e.target.checked)}
                      className="w-4 h-4 accent-kawaii-500 rounded cursor-pointer"
                    />
                  </div>
                )}
              </div>

              {/* Xem trước 10 dòng đầu */}
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <h4 className="text-xs font-bold text-gray-700 dark:text-gray-300">
                    Xem trước 10 dòng đầu tiên:
                  </h4>
                  <span className="text-[11px] text-gray-400">
                    Kiểm tra độ chính xác trước khi lưu
                  </span>
                </div>

                <div className="border border-kawaii-200 dark:border-dark-border rounded-2xl overflow-hidden overflow-x-auto">
                  <table className="w-full text-left text-xs">
                    <thead className="bg-kawaii-50 dark:bg-dark-bg text-gray-700 dark:text-gray-300 font-bold border-b border-kawaii-100 dark:border-dark-border">
                      <tr>
                        <th className="p-2.5 w-12 text-center">#</th>
                        <th className="p-2.5">Mặt trước</th>
                        <th className="p-2.5">Mặt sau</th>
                        <th className="p-2.5">Phiên âm</th>
                        <th className="p-2.5 w-24">Trạng thái</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-100 dark:divide-dark-border">
                      {previewRows.map((r) => (
                        <tr key={r.index} className={r.error ? 'bg-red-50/50 dark:bg-red-950/20' : ''}>
                          <td className="p-2.5 text-center text-gray-400">{r.index}</td>
                          <td className="p-2.5 font-bold text-gray-800 dark:text-white font-hanzi">
                            {r.front || <span className="text-red-400 italic">(Trống)</span>}
                          </td>
                          <td className="p-2.5 text-gray-700 dark:text-gray-300">
                            {r.back || <span className="text-red-400 italic">(Trống)</span>}
                          </td>
                          <td className="p-2.5 text-kawaii-600 dark:text-kawaii-400 font-mono">
                            {r.phonetic || '-'}
                          </td>
                          <td className="p-2.5">
                            {r.error ? (
                              <span className="inline-flex items-center gap-1 text-[11px] text-red-500 font-bold">
                                <AlertCircle className="w-3.5 h-3.5" />
                                <span>{r.error}</span>
                              </span>
                            ) : (
                              <span className="inline-flex items-center gap-1 text-[11px] text-emerald-500 font-bold">
                                <CheckCircle2 className="w-3.5 h-3.5" />
                                <span>Hợp lệ</span>
                              </span>
                            )}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>

              {/* Nút hành động */}
              <div className="flex justify-between items-center pt-2">
                <button
                  type="button"
                  onClick={() => setStep('select')}
                  className="px-4 py-2 rounded-xl bg-gray-100 dark:bg-dark-bg text-gray-700 dark:text-gray-300 font-bold text-xs"
                >
                  Quay lại
                </button>

                <button
                  type="button"
                  onClick={handleStartImport}
                  className="px-6 py-2.5 rounded-2xl bg-gradient-to-r from-emerald-500 to-teal-500 text-white font-bold text-xs shadow-md btn-bounce flex items-center gap-2"
                >
                  <CheckCircle2 className="w-4 h-4" />
                  <span>Xác nhận nhập {currentRows.length} thẻ</span>
                </button>
              </div>

            </div>
          )}

          {/* BƯỚC 3: TIẾN TRÌNH IMPORT */}
          {step === 'importing' && (
            <div className="py-12 flex flex-col items-center justify-center text-center space-y-4">
              <div className="w-16 h-16 rounded-full bg-kawaii-100 dark:bg-dark-bg text-kawaii-500 flex items-center justify-center animate-spin">
                <Sparkles className="w-8 h-8" />
              </div>

              <div className="space-y-1">
                <h3 className="text-lg font-bold text-gray-800 dark:text-white">
                  Đang tiến hành nhập dữ liệu thẻ...
                </h3>
                <p className="text-xs text-gray-500 dark:text-dark-textMuted">
                  {statusMessage}
                </p>
              </div>

              {/* Thanh tiến trình */}
              <div className="w-full max-w-md bg-gray-100 dark:bg-dark-bg rounded-full h-3 overflow-hidden border border-kawaii-200 dark:border-dark-border">
                <div
                  className="bg-gradient-to-r from-kawaii-400 to-kawaii-500 h-full rounded-full transition-all duration-300"
                  style={{ width: `${importProgress}%` }}
                />
              </div>
              <span className="text-xs font-bold text-kawaii-600">{importProgress}%</span>
            </div>
          )}

        </div>

      </div>
    </div>
  );
};
