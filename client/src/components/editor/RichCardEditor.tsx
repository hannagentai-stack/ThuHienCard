import React, { useState } from 'react';
import {
  X,
  Sparkles,
  Image as ImageIcon,
  Mic,
  RotateCw,
  Eye,
  Check,
  Type,
} from 'lucide-react';
import { type Card } from '../../types';
import { autoGeneratePinyin } from '../../services/excelService';
import { HanziWriterCanvas } from '../cards/HanziWriterCanvas';

interface RichCardEditorProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (cardData: Partial<Card>) => Promise<boolean>;
  initialCard?: Card | null;
  deckLanguage: 'zh' | 'en';
}

export const RichCardEditor: React.FC<RichCardEditorProps> = ({
  isOpen,
  onClose,
  onSave,
  initialCard,
  deckLanguage,
}) => {
  const [front, setFront] = useState(initialCard?.front || '');
  const [back, setBack] = useState(initialCard?.back || '');
  const [phonetic, setPhonetic] = useState(initialCard?.phonetic || '');
  const [wordType, setWordType] = useState(initialCard?.wordType || '');
  const [example, setExample] = useState(initialCard?.example || '');
  const [exampleTrans, setExampleTrans] = useState(initialCard?.exampleTrans || '');
  const [notes, setNotes] = useState(initialCard?.notes || '');
  const [level, setLevel] = useState(initialCard?.level || (deckLanguage === 'zh' ? 'HSK1' : 'A1'));
  const [tags, setTags] = useState(
    initialCard?.tagsJson ? JSON.parse(initialCard.tagsJson).join(', ') : ''
  );
  const [imageUrl, setImageUrl] = useState(initialCard?.imageUrl || '');
  const [audioUrl, setAudioUrl] = useState(initialCard?.audioUrl || '');
  const [cardType, setCardType] = useState<'standard' | 'cloze'>(
    (initialCard?.cardType as any) || 'standard'
  );

  // Xem trước trực tiếp (Live 3D Preview)
  const [previewFlipped, setPreviewFlipped] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [isRecording, setIsRecording] = useState(false);

  if (!isOpen) return null;

  // Tự động điền Pinyin cho tiếng Trung
  const handleAutoPinyin = () => {
    if (front.trim()) {
      const generated = autoGeneratePinyin(front.trim());
      if (generated) setPhonetic(generated);
    }
  };

  // Nút tạo thẻ Cloze deletion {{c1::từ}}
  const handleInsertCloze = () => {
    setCardType('cloze');
    const textarea = document.getElementById('front-input') as HTMLTextAreaElement;
    if (textarea) {
      const start = textarea.selectionStart;
      const end = textarea.selectionEnd;
      const selected = front.substring(start, end);

      if (selected) {
        const replacement = `{{c1::${selected}}}`;
        const newFront = front.substring(0, start) + replacement + front.substring(end);
        setFront(newFront);
      } else {
        setFront(front + ' {{c1::từ cần điền}}');
      }
    }
  };

  // Ghi âm thử qua micro
  const handleRecordAudio = async () => {
    if (isRecording) {
      setIsRecording(false);
      return;
    }

    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const mediaRecorder = new MediaRecorder(stream);
      const chunks: Blob[] = [];

      setIsRecording(true);
      mediaRecorder.ondataavailable = (e) => chunks.push(e.data);
      mediaRecorder.onstop = () => {
        const blob = new Blob(chunks, { type: 'audio/webm' });
        const reader = new FileReader();
        reader.readAsDataURL(blob);
        reader.onloadend = () => {
          setAudioUrl(reader.result as string);
        };
      };

      mediaRecorder.start();
      setTimeout(() => {
        if (mediaRecorder.state === 'recording') {
          mediaRecorder.stop();
          stream.getTracks().forEach((t) => t.stop());
          setIsRecording(false);
        }
      }, 5000); // Tối đa 5 giây ghi âm cho 1 từ
    } catch {
      alert('Không thể truy cập microphone của bạn.');
      setIsRecording(false);
    }
  };

  // Lưu thẻ
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!front.trim() || !back.trim()) {
      alert('Vui lòng nhập cả mặt trước và mặt sau!');
      return;
    }

    setIsSaving(true);
    const parsedTags = tags
      .split(',')
      .map((t: string) => t.trim())
      .filter((t: string) => t.length > 0);

    const success = await onSave({
      front: front.trim(),
      back: back.trim(),
      phonetic: phonetic.trim() || null,
      wordType: wordType.trim() || null,
      example: example.trim() || null,
      exampleTrans: exampleTrans.trim() || null,
      notes: notes.trim() || null,
      level: level || null,
      tagsJson: parsedTags.length > 0 ? JSON.stringify(parsedTags) : null,
      imageUrl: imageUrl.trim() || null,
      audioUrl: audioUrl || null,
      cardType,
    });

    setIsSaving(false);
    if (success) onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-6 bg-black/50 backdrop-blur-sm animate-fade-in">
      <div className="relative w-full max-w-4xl max-h-[92vh] bg-white dark:bg-dark-card rounded-3xl shadow-kawaii-lg border-2 border-kawaii-200 dark:border-dark-border flex flex-col overflow-hidden">
        
        {/* Header */}
        <div className="p-4 sm:p-6 border-b border-kawaii-100 dark:border-dark-border flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-2xl bg-kawaii-100 dark:bg-dark-bg text-kawaii-600 dark:text-kawaii-400">
              <Sparkles className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-xl font-bold font-display text-gray-800 dark:text-white">
                {initialCard ? 'Chỉnh Sửa Thẻ Flashcard' : 'Tạo Thẻ Flashcard Mới 🌸'}
              </h2>
              <p className="text-xs text-gray-500 dark:text-dark-textMuted">
                Ngôn ngữ: {deckLanguage === 'zh' ? '🇨🇳 Tiếng Trung' : '🇬🇧 Tiếng Anh'}
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

        {/* Thân cửa sổ: 2 cột (Form soạn thảo bên trái & Xem trước trực tiếp bên phải) */}
        <div className="flex-1 overflow-y-auto p-4 sm:p-6 grid grid-cols-1 lg:grid-cols-12 gap-6">
          
          {/* CỘT TRÁI: FORM SOẠN THẢO */}
          <form onSubmit={handleSubmit} className="lg:col-span-7 space-y-4">
            
            {/* Mặt trước */}
            <div>
              <div className="flex items-center justify-between mb-1">
                <label className="text-xs font-bold text-gray-700 dark:text-gray-300">
                  Mặt trước (Từ vựng / Hán tự) <span className="text-kawaii-500">*</span>
                </label>
                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={handleInsertCloze}
                    title="Chèn điền chỗ trống {{c1::từ}}"
                    className="text-[11px] px-2 py-0.5 rounded-lg bg-purple-50 dark:bg-purple-950/40 text-purple-600 dark:text-purple-400 border border-purple-200 dark:border-purple-800 hover:bg-purple-100 font-semibold flex items-center gap-1"
                  >
                    <Type className="w-3 h-3" />
                    <span>Thẻ Cloze</span>
                  </button>
                  {deckLanguage === 'zh' && (
                    <button
                      type="button"
                      onClick={handleAutoPinyin}
                      className="text-[11px] px-2 py-0.5 rounded-lg bg-kawaii-50 dark:bg-dark-bg text-kawaii-600 dark:text-kawaii-400 border border-kawaii-200 dark:border-dark-border hover:bg-kawaii-100 font-semibold flex items-center gap-1"
                    >
                      <Sparkles className="w-3 h-3 text-kawaii-500" />
                      <span>Tự tạo Pinyin</span>
                    </button>
                  )}
                </div>
              </div>

              <textarea
                id="front-input"
                required
                rows={2}
                value={front}
                onChange={(e) => setFront(e.target.value)}
                placeholder={deckLanguage === 'zh' ? 'Ví dụ: 喜欢 hoặc 我喜欢吃{{c1::苹果}}' : 'Ví dụ: Serendipity'}
                className="w-full px-4 py-2.5 rounded-2xl bg-gray-50 dark:bg-dark-bg border border-kawaii-200 dark:border-dark-border text-sm outline-none focus:border-kawaii-500 dark:text-white font-medium"
              />
            </div>

            {/* Phiên âm (Pinyin / IPA) & Loại từ */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-bold text-gray-700 dark:text-gray-300 mb-1">
                  {deckLanguage === 'zh' ? 'Phiên âm Pinyin' : 'Phiên âm IPA'}
                </label>
                <input
                  type="text"
                  value={phonetic}
                  onChange={(e) => setPhonetic(e.target.value)}
                  placeholder={deckLanguage === 'zh' ? 'xǐ huan' : '/ˌser.ənˈdɪp.ə.ti/'}
                  className="w-full px-4 py-2 rounded-2xl bg-gray-50 dark:bg-dark-bg border border-kawaii-200 dark:border-dark-border text-sm outline-none focus:border-kawaii-500 dark:text-white font-mono"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-gray-700 dark:text-gray-300 mb-1">
                  Loại từ & Cấp độ
                </label>
                <div className="flex gap-2">
                  <input
                    type="text"
                    value={wordType}
                    onChange={(e) => setWordType(e.target.value)}
                    placeholder="Danh từ, Động từ..."
                    className="flex-1 px-3 py-2 rounded-2xl bg-gray-50 dark:bg-dark-bg border border-kawaii-200 dark:border-dark-border text-xs outline-none focus:border-kawaii-500 dark:text-white"
                  />
                  <input
                    type="text"
                    value={level}
                    onChange={(e) => setLevel(e.target.value)}
                    placeholder="HSK1, B2..."
                    className="w-20 px-3 py-2 rounded-2xl bg-gray-50 dark:bg-dark-bg border border-kawaii-200 dark:border-dark-border text-xs outline-none focus:border-kawaii-500 dark:text-white font-bold text-center"
                  />
                </div>
              </div>
            </div>

            {/* Mặt sau (Nghĩa tiếng Việt) */}
            <div>
              <label className="block text-xs font-bold text-gray-700 dark:text-gray-300 mb-1">
                Mặt sau (Nghĩa tiếng Việt) <span className="text-kawaii-500">*</span>
              </label>
              <textarea
                required
                rows={2}
                value={back}
                onChange={(e) => setBack(e.target.value)}
                placeholder="Nghĩa của từ, cách dịch tự nhiên..."
                className="w-full px-4 py-2.5 rounded-2xl bg-gray-50 dark:bg-dark-bg border border-kawaii-200 dark:border-dark-border text-sm outline-none focus:border-kawaii-500 dark:text-white font-medium"
              />
            </div>

            {/* Câu ví dụ & Dịch ví dụ */}
            <div className="space-y-2">
              <div>
                <label className="block text-xs font-bold text-gray-700 dark:text-gray-300 mb-1">
                  Câu ví dụ minh họa
                </label>
                <input
                  type="text"
                  value={example}
                  onChange={(e) => setExample(e.target.value)}
                  placeholder="Câu ví dụ thực tế..."
                  className="w-full px-4 py-2 rounded-2xl bg-gray-50 dark:bg-dark-bg border border-kawaii-200 dark:border-dark-border text-xs outline-none focus:border-kawaii-500 dark:text-white"
                />
              </div>

              <div>
                <input
                  type="text"
                  value={exampleTrans}
                  onChange={(e) => setExampleTrans(e.target.value)}
                  placeholder="Dịch nghĩa câu ví dụ sang tiếng Việt..."
                  className="w-full px-4 py-2 rounded-2xl bg-gray-50 dark:bg-dark-bg border border-kawaii-200 dark:border-dark-border text-xs outline-none focus:border-kawaii-500 dark:text-white"
                />
              </div>
            </div>

            {/* Ghi chú & Thẻ (Tags) */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-bold text-gray-700 dark:text-gray-300 mb-1">
                  Ghi chú / Mẹo nhớ
                </label>
                <input
                  type="text"
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  placeholder="Gốc từ, bộ thủ, mẹo liên tưởng..."
                  className="w-full px-4 py-2 rounded-2xl bg-gray-50 dark:bg-dark-bg border border-kawaii-200 dark:border-dark-border text-xs outline-none focus:border-kawaii-500 dark:text-white"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-gray-700 dark:text-gray-300 mb-1">
                  Thẻ phân loại (Tags)
                </label>
                <input
                  type="text"
                  value={tags}
                  onChange={(e) => setTags(e.target.value)}
                  placeholder="Du lịch, Ăn uống, HSK1..."
                  className="w-full px-4 py-2 rounded-2xl bg-gray-50 dark:bg-dark-bg border border-kawaii-200 dark:border-dark-border text-xs outline-none focus:border-kawaii-500 dark:text-white"
                />
              </div>
            </div>

            {/* Đính kèm Đa phương tiện (Ảnh & Âm thanh) */}
            <div className="p-3 rounded-2xl bg-gray-50 dark:bg-dark-bg/60 border border-kawaii-100 dark:border-dark-border space-y-2">
              <span className="text-xs font-bold text-gray-700 dark:text-gray-300 flex items-center gap-1.5">
                <ImageIcon className="w-3.5 h-3.5 text-blue-500" />
                <span>Đính kèm hình ảnh & ghi âm</span>
              </span>

              <div className="flex gap-2">
                <input
                  type="text"
                  value={imageUrl}
                  onChange={(e) => setImageUrl(e.target.value)}
                  placeholder="Dán URL hình ảnh..."
                  className="flex-1 px-3 py-1.5 rounded-xl bg-white dark:bg-dark-card border border-gray-200 dark:border-dark-border text-xs outline-none focus:border-kawaii-500 dark:text-white"
                />
                <button
                  type="button"
                  onClick={handleRecordAudio}
                  className={`px-3 py-1.5 rounded-xl text-xs font-bold border transition-colors flex items-center gap-1 ${
                    isRecording
                      ? 'bg-red-500 text-white border-red-600 animate-pulse'
                      : audioUrl
                      ? 'bg-emerald-50 text-emerald-600 border-emerald-300'
                      : 'bg-white dark:bg-dark-card text-gray-600 border-gray-200 hover:bg-gray-50'
                  }`}
                >
                  <Mic className="w-3.5 h-3.5" />
                  <span>{isRecording ? 'Đang ghi (5s)...' : audioUrl ? 'Đã có audio' : 'Ghi âm'}</span>
                </button>
              </div>
            </div>

          </form>

          {/* CỘT PHẢI: XEM TRƯỚC TRỰC TIẾP (LIVE PREVIEW) & NÉT CHỮ HÁN */}
          <div className="lg:col-span-5 flex flex-col items-center space-y-4">
            <div className="w-full flex items-center justify-between text-xs font-bold text-gray-500">
              <span className="flex items-center gap-1">
                <Eye className="w-3.5 h-3.5 text-kawaii-500" /> Xem trước trực tiếp
              </span>
              <button
                type="button"
                onClick={() => setPreviewFlipped(!previewFlipped)}
                className="text-kawaii-600 dark:text-kawaii-400 hover:underline flex items-center gap-1"
              >
                <RotateCw className="w-3 h-3" /> Lật thẻ 3D
              </button>
            </div>

            {/* Thẻ 3D Live Preview */}
            <div
              onClick={() => setPreviewFlipped(!previewFlipped)}
              className="w-full h-64 cursor-pointer perspective-1000 group select-none"
            >
              <div
                className={`relative w-full h-full duration-500 transform-style-3d transition-transform ${
                  previewFlipped ? 'rotate-y-180' : ''
                }`}
              >
                {/* MẶT TRƯỚC PREVIEW */}
                <div className="absolute inset-0 backface-hidden bg-white dark:bg-dark-card rounded-3xl p-5 border-2 border-kawaii-300 dark:border-dark-border shadow-kawaii flex flex-col justify-between items-center text-center">
                  <div className="w-full flex justify-between items-center text-xs">
                    <span className="px-2 py-0.5 rounded-full bg-kawaii-50 dark:bg-dark-bg text-kawaii-600 font-bold">
                      {level || 'HSK1'}
                    </span>
                    <span className="text-[10px] text-gray-400">Mặt trước</span>
                  </div>

                  <div className="space-y-1">
                    <h3 className="text-3xl font-extrabold text-gray-800 dark:text-white font-hanzi">
                      {front ? (
                        cardType === 'cloze' ? (
                          front.replace(/\{\{c\d+::(.*?)\}\}/g, '[ ... ]')
                        ) : (
                          front
                        )
                      ) : (
                        <span className="text-gray-300 italic font-sans text-lg">Chưa nhập từ...</span>
                      )}
                    </h3>
                    {phonetic && (
                      <p className="text-sm font-semibold text-kawaii-600 dark:text-kawaii-400 font-mono">
                        {phonetic}
                      </p>
                    )}
                  </div>

                  <span className="text-[11px] text-gray-400">Chạm để xem mặt sau</span>
                </div>

                {/* MẶT SAU PREVIEW */}
                <div className="absolute inset-0 backface-hidden rotate-y-180 bg-gradient-to-br from-pink-50 to-white dark:from-dark-card dark:to-dark-bg rounded-3xl p-5 border-2 border-kawaii-400 dark:border-kawaii-500 shadow-kawaii flex flex-col justify-between items-center text-center">
                  <div className="w-full flex justify-between items-center text-xs">
                    <span className="px-2 py-0.5 rounded-full bg-kawaii-100 dark:bg-dark-card text-kawaii-600 font-bold">
                      {wordType || 'Nghĩa'}
                    </span>
                    <span className="text-[10px] text-gray-400">Mặt sau</span>
                  </div>

                  <div className="space-y-1">
                    <h4 className="text-2xl font-extrabold text-gray-900 dark:text-white font-display">
                      {back || <span className="text-gray-300 italic font-sans text-base">Chưa nhập nghĩa...</span>}
                    </h4>
                    {example && (
                      <p className="text-xs text-gray-600 dark:text-dark-textMuted italic">
                        "{example}"
                      </p>
                    )}
                    {notes && (
                      <p className="text-[11px] text-purple-600 dark:text-purple-400 font-medium">
                        💡 {notes}
                      </p>
                    )}
                  </div>

                  <span className="text-[11px] text-emerald-500 font-bold">FSRS Sẵn Sàng</span>
                </div>
              </div>
            </div>

            {/* Nếu là tiếng Trung và có chữ Hán: Hiển thị nét viết Hanzi Writer */}
            {deckLanguage === 'zh' && front && (
              <div className="w-full pt-2">
                <span className="text-xs font-bold text-gray-700 dark:text-gray-300 mb-1 block">
                  Nét viết chữ Hán SVG tương tác:
                </span>
                <HanziWriterCanvas characters={front} size={130} />
              </div>
            )}

          </div>

        </div>

        {/* Footer & Nút Lưu */}
        <div className="p-4 sm:p-6 border-t border-kawaii-100 dark:border-dark-border flex justify-end gap-3 bg-gray-50/50 dark:bg-dark-bg/40">
          <button
            type="button"
            onClick={onClose}
            className="px-5 py-2.5 rounded-2xl bg-gray-100 dark:bg-dark-bg hover:bg-gray-200 text-gray-700 dark:text-gray-300 font-bold text-xs transition-colors"
          >
            Hủy bỏ
          </button>
          <button
            type="button"
            disabled={isSaving}
            onClick={handleSubmit}
            className="px-6 py-2.5 rounded-2xl bg-gradient-to-r from-kawaii-400 to-kawaii-500 hover:from-kawaii-500 hover:to-kawaii-600 text-white font-bold text-xs shadow-kawaii btn-bounce flex items-center gap-1.5"
          >
            <Check className="w-4 h-4" />
            <span>{isSaving ? 'Đang lưu...' : initialCard ? 'Cập nhật thẻ' : 'Thêm thẻ mới 🌸'}</span>
          </button>
        </div>

      </div>
    </div>
  );
};
