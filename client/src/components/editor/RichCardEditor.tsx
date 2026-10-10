import React, { useState, useEffect, useRef } from 'react';
import {
  X,
  Sparkles,
  Image as ImageIcon,
  Mic,
  RotateCw,
  Eye,
  Check,
  Type,
  Camera,
  Trash2,
  Plus,
  Play,
  Square,
  FileText,
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

const DRAFT_KEY_PREFIX = 'sakura_card_editor_draft_';

export const RichCardEditor: React.FC<RichCardEditorProps> = ({
  isOpen,
  onClose,
  onSave,
  initialCard,
  deckLanguage,
}) => {
  // Mobile tab: 'edit' (Soạn thảo) vs 'preview' (Xem trước 3D)
  const [activeTab, setActiveTab] = useState<'edit' | 'preview'>('edit');

  const [front, setFront] = useState(initialCard?.front || '');
  const [back, setBack] = useState(initialCard?.back || '');
  const [phonetic, setPhonetic] = useState(initialCard?.phonetic || '');
  const [wordType, setWordType] = useState(initialCard?.wordType || '');
  const [example, setExample] = useState(initialCard?.example || '');
  const [exampleTrans, setExampleTrans] = useState(initialCard?.exampleTrans || '');
  const [notes, setNotes] = useState(initialCard?.notes || '');
  const [level, setLevel] = useState(
    initialCard?.level || (deckLanguage === 'zh' ? 'HSK1' : 'A1')
  );
  const [tags, setTags] = useState(
    initialCard?.tagsJson ? JSON.parse(initialCard.tagsJson).join(', ') : ''
  );
  const [imageUrl, setImageUrl] = useState(initialCard?.imageUrl || '');
  const [audioUrl, setAudioUrl] = useState(initialCard?.audioUrl || '');
  const [cardType, setCardType] = useState<'standard' | 'cloze'>(
    (initialCard?.cardType as any) || 'standard'
  );

  // 3D Live preview flip state
  const [previewFlipped, setPreviewFlipped] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [hasDraftLoaded, setHasDraftLoaded] = useState(false);

  // Media recording state
  const [isRecording, setIsRecording] = useState(false);
  const [recordSeconds, setRecordSeconds] = useState(0);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const audioChunksRef = useRef<Blob[]>([]);
  const recordIntervalRef = useRef<any>(null);
  const fileInputRef = useRef<HTMLInputElement | null>(null);

  // Audio preview playback
  const [isPlayingAudio, setIsPlayingAudio] = useState(false);

  // Load draft from localStorage if creating a new card
  useEffect(() => {
    if (!isOpen) return;

    if (initialCard) {
      setFront(initialCard.front || '');
      setBack(initialCard.back || '');
      setPhonetic(initialCard.phonetic || '');
      setWordType(initialCard.wordType || '');
      setExample(initialCard.example || '');
      setExampleTrans(initialCard.exampleTrans || '');
      setNotes(initialCard.notes || '');
      setLevel(initialCard.level || (deckLanguage === 'zh' ? 'HSK1' : 'A1'));
      setTags(
        initialCard.tagsJson ? JSON.parse(initialCard.tagsJson).join(', ') : ''
      );
      setImageUrl(initialCard.imageUrl || '');
      setAudioUrl(initialCard.audioUrl || '');
      setCardType((initialCard.cardType as any) || 'standard');
      setHasDraftLoaded(false);
    } else {
      // Check draft
      try {
        const savedDraft = localStorage.getItem(`${DRAFT_KEY_PREFIX}${deckLanguage}`);
        if (savedDraft) {
          const draft = JSON.parse(savedDraft);
          if (draft.front || draft.back) {
            setFront(draft.front || '');
            setBack(draft.back || '');
            setPhonetic(draft.phonetic || '');
            setWordType(draft.wordType || '');
            setExample(draft.example || '');
            setExampleTrans(draft.exampleTrans || '');
            setNotes(draft.notes || '');
            setLevel(draft.level || (deckLanguage === 'zh' ? 'HSK1' : 'A1'));
            setTags(draft.tags || '');
            setImageUrl(draft.imageUrl || '');
            setAudioUrl(draft.audioUrl || '');
            setCardType(draft.cardType || 'standard');
            setHasDraftLoaded(true);
          }
        }
      } catch {}
    }
  }, [isOpen, initialCard, deckLanguage]);

  // Auto-save draft when fields change (only when creating new card)
  useEffect(() => {
    if (!isOpen || initialCard) return;

    if (front || back || notes || example) {
      const draftData = {
        front,
        back,
        phonetic,
        wordType,
        example,
        exampleTrans,
        notes,
        level,
        tags,
        imageUrl,
        audioUrl,
        cardType,
      };
      localStorage.setItem(
        `${DRAFT_KEY_PREFIX}${deckLanguage}`,
        JSON.stringify(draftData)
      );
    }
  }, [
    isOpen,
    initialCard,
    deckLanguage,
    front,
    back,
    phonetic,
    wordType,
    example,
    exampleTrans,
    notes,
    level,
    tags,
    imageUrl,
    audioUrl,
    cardType,
  ]);

  const clearDraft = () => {
    localStorage.removeItem(`${DRAFT_KEY_PREFIX}${deckLanguage}`);
    setFront('');
    setBack('');
    setPhonetic('');
    setWordType('');
    setExample('');
    setExampleTrans('');
    setNotes('');
    setTags('');
    setImageUrl('');
    setAudioUrl('');
    setCardType('standard');
    setHasDraftLoaded(false);
  };

  if (!isOpen) return null;

  // Auto Pinyin generator
  const handleAutoPinyin = () => {
    if (front.trim()) {
      const generated = autoGeneratePinyin(front.trim());
      if (generated) setPhonetic(generated);
    }
  };

  // Cloze deletion insertion {{c1::...}}
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

  // Mobile image pick from gallery or camera
  const handleImageFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (file.size > 3 * 1024 * 1024) {
      alert('Vui lòng chọn ảnh dung lượng dưới 3MB.');
      return;
    }

    const reader = new FileReader();
    reader.onloadend = () => {
      setImageUrl(reader.result as string);
    };
    reader.readAsDataURL(file);
  };

  // Audio recording toggle
  const handleToggleRecordAudio = async () => {
    if (isRecording) {
      // Stop recording
      if (mediaRecorderRef.current && mediaRecorderRef.current.state === 'recording') {
        mediaRecorderRef.current.stop();
      }
      clearInterval(recordIntervalRef.current);
      setIsRecording(false);
      return;
    }

    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const mediaRecorder = new MediaRecorder(stream);
      mediaRecorderRef.current = mediaRecorder;
      audioChunksRef.current = [];
      setRecordSeconds(0);

      mediaRecorder.ondataavailable = (e) => {
        if (e.data.size > 0) audioChunksRef.current.push(e.data);
      };

      mediaRecorder.onstop = () => {
        const blob = new Blob(audioChunksRef.current, { type: 'audio/webm' });
        const reader = new FileReader();
        reader.readAsDataURL(blob);
        reader.onloadend = () => {
          setAudioUrl(reader.result as string);
        };
        stream.getTracks().forEach((track) => track.stop());
      };

      mediaRecorder.start();
      setIsRecording(true);

      recordIntervalRef.current = setInterval(() => {
        setRecordSeconds((sec) => {
          if (sec >= 9) {
            // Auto stop after 10s
            handleToggleRecordAudio();
            return 10;
          }
          return sec + 1;
        });
      }, 1000);
    } catch {
      alert('Không thể truy cập microphone. Vui lòng cấp quyền trong cài đặt trình duyệt.');
      setIsRecording(false);
    }
  };

  // Play audio preview
  const handlePlayAudio = () => {
    if (!audioUrl) return;
    setIsPlayingAudio(true);
    const audio = new Audio(audioUrl);
    audio.onended = () => setIsPlayingAudio(false);
    audio.onerror = () => setIsPlayingAudio(false);
    audio.play().catch(() => setIsPlayingAudio(false));
  };

  // Save Card (keepOpen flag allows "Lưu & Tiếp tục thêm")
  const handleSaveCard = async (keepOpen: boolean = false) => {
    if (!front.trim() || !back.trim()) {
      alert('Vui lòng nhập đầy đủ mặt trước và mặt sau!');
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

    if (success) {
      localStorage.removeItem(`${DRAFT_KEY_PREFIX}${deckLanguage}`);
      if (keepOpen) {
        // Reset form for next card, keep level
        setFront('');
        setBack('');
        setPhonetic('');
        setWordType('');
        setExample('');
        setExampleTrans('');
        setNotes('');
        setImageUrl('');
        setAudioUrl('');
        setCardType('standard');
        setHasDraftLoaded(false);
      } else {
        onClose();
      }
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex flex-col justify-end sm:justify-center sm:items-center bg-black/60 backdrop-blur-sm animate-fade-in p-0 sm:p-4">
      {/* Container: Fullscreen on mobile, rounded card on tablet/desktop */}
      <div className="relative w-full sm:max-w-4xl h-[100dvh] sm:h-[90vh] bg-white dark:bg-dark-card rounded-t-3xl sm:rounded-3xl shadow-kawaii-lg border-t-2 sm:border-2 border-kawaii-200 dark:border-dark-border flex flex-col overflow-hidden animate-slide-up sm:animate-none">
        
        {/* Header with Title and Mobile Tab Switcher */}
        <div className="px-4 py-3 sm:px-6 sm:py-4 border-b border-kawaii-100 dark:border-dark-border bg-white dark:bg-dark-card shrink-0">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2.5">
              <div className="p-2 rounded-2xl bg-kawaii-100 dark:bg-dark-bg text-kawaii-600 dark:text-kawaii-400">
                <Sparkles className="w-5 h-5" />
              </div>
              <div>
                <h2 className="text-base sm:text-lg font-bold font-display text-gray-800 dark:text-white leading-tight">
                  {initialCard ? 'Chỉnh Sửa Thẻ' : 'Tạo Thẻ Flashcard 🌸'}
                </h2>
                <p className="text-[11px] text-gray-500 dark:text-dark-textMuted">
                  {deckLanguage === 'zh' ? '🇨🇳 Tiếng Trung' : '🇬🇧 Tiếng Anh'} • Cấp độ {level}
                </p>
              </div>
            </div>

            <button
              onClick={onClose}
              className="p-2.5 text-gray-400 hover:text-gray-700 dark:hover:text-gray-200 rounded-full hover:bg-gray-100 dark:hover:bg-dark-bg transition-colors active:scale-95"
              aria-label="Đóng"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Tab Switcher on Mobile (Hidden on Desktop grid) */}
          <div className="mt-3 flex lg:hidden bg-kawaii-50 dark:bg-dark-bg p-1 rounded-2xl">
            <button
              type="button"
              onClick={() => setActiveTab('edit')}
              className={`flex-1 py-2 text-xs font-bold rounded-xl transition-all flex items-center justify-center gap-1.5 ${
                activeTab === 'edit'
                  ? 'bg-white dark:bg-dark-card text-kawaii-600 dark:text-kawaii-400 shadow-sm'
                  : 'text-gray-500'
              }`}
            >
              <FileText className="w-4 h-4" />
              <span>Soạn thảo</span>
            </button>
            <button
              type="button"
              onClick={() => setActiveTab('preview')}
              className={`flex-1 py-2 text-xs font-bold rounded-xl transition-all flex items-center justify-center gap-1.5 ${
                activeTab === 'preview'
                  ? 'bg-white dark:bg-dark-card text-kawaii-600 dark:text-kawaii-400 shadow-sm'
                  : 'text-gray-500'
              }`}
            >
              <Eye className="w-4 h-4" />
              <span>Xem trước 3D</span>
            </button>
          </div>
        </div>

        {/* Draft Notification Banner */}
        {hasDraftLoaded && !initialCard && (
          <div className="px-4 py-2 bg-amber-50 dark:bg-amber-950/40 border-b border-amber-200 dark:border-amber-900/50 flex items-center justify-between text-xs text-amber-800 dark:text-amber-300 shrink-0">
            <span>📝 Đã khôi phục bản nháp chưa lưu</span>
            <button
              type="button"
              onClick={clearDraft}
              className="text-[11px] font-bold text-red-500 hover:underline px-2 py-0.5"
            >
              Xóa bản nháp
            </button>
          </div>
        )}

        {/* Content Body: Responsive Tab / 2-Column Grid */}
        <div className="flex-1 overflow-y-auto p-4 sm:p-6">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
            
            {/* CỘT SOẠN THẢO: Visible when activeTab === 'edit' OR on desktop */}
            <div
              className={`space-y-5 lg:col-span-7 ${
                activeTab === 'edit' ? 'block' : 'hidden lg:block'
              }`}
            >
              {/* NHÓM 1: MẶT TRƯỚC (Từ vựng, Phiên âm, Cấp độ) */}
              <div className="p-4 rounded-3xl bg-pink-50/40 dark:bg-dark-bg/60 border border-kawaii-200 dark:border-dark-border space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-kawaii-700 dark:text-kawaii-300 uppercase tracking-wider flex items-center gap-1">
                    <span>Mặt trước thẻ</span>
                    <span className="text-red-500">*</span>
                  </span>
                  <div className="flex items-center gap-1.5">
                    <button
                      type="button"
                      onClick={handleInsertCloze}
                      className="text-[11px] px-2.5 py-1 rounded-xl bg-purple-100/70 dark:bg-purple-950/60 text-purple-700 dark:text-purple-300 border border-purple-200 dark:border-purple-800 font-bold flex items-center gap-1 active:scale-95 transition-transform"
                    >
                      <Type className="w-3 h-3" />
                      <span>Thẻ điền từ</span>
                    </button>
                    {deckLanguage === 'zh' && (
                      <button
                        type="button"
                        onClick={handleAutoPinyin}
                        className="text-[11px] px-2.5 py-1 rounded-xl bg-kawaii-100 dark:bg-dark-bg text-kawaii-700 dark:text-kawaii-300 border border-kawaii-300 dark:border-dark-border font-bold flex items-center gap-1 active:scale-95 transition-transform"
                      >
                        <Sparkles className="w-3 h-3 text-kawaii-500" />
                        <span>Tự sinh Pinyin</span>
                      </button>
                    )}
                  </div>
                </div>

                {/* Ô nhập mặt trước */}
                <textarea
                  id="front-input"
                  required
                  rows={2}
                  value={front}
                  onChange={(e) => setFront(e.target.value)}
                  placeholder={
                    deckLanguage === 'zh'
                      ? 'Ví dụ: 喜欢 hoặc 我喜欢吃{{c1::苹果}}'
                      : 'Ví dụ: Serendipity hoặc I love {{c1::learning}}'
                  }
                  className="w-full px-4 py-3 rounded-2xl bg-white dark:bg-dark-card border border-kawaii-200 dark:border-dark-border text-base sm:text-sm outline-none focus:border-kawaii-500 dark:text-white font-medium"
                />

                {/* Phiên âm, Loại từ & Cấp độ */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-1">
                  <div>
                    <label className="block text-[11px] font-bold text-gray-600 dark:text-gray-300 mb-1">
                      {deckLanguage === 'zh' ? 'Phiên âm Pinyin' : 'Phiên âm IPA'}
                    </label>
                    <input
                      type="text"
                      value={phonetic}
                      onChange={(e) => setPhonetic(e.target.value)}
                      placeholder={deckLanguage === 'zh' ? 'xǐ huan' : '/ˌser.ənˈdɪp.ə.ti/'}
                      className="w-full px-3.5 py-2.5 rounded-2xl bg-white dark:bg-dark-card border border-kawaii-200 dark:border-dark-border text-base sm:text-sm outline-none focus:border-kawaii-500 dark:text-white font-mono"
                    />
                  </div>

                  <div>
                    <label className="block text-[11px] font-bold text-gray-600 dark:text-gray-300 mb-1">
                      Loại từ & Cấp độ
                    </label>
                    <div className="flex gap-2">
                      <input
                        type="text"
                        value={wordType}
                        onChange={(e) => setWordType(e.target.value)}
                        placeholder="Động từ, Danh từ..."
                        className="flex-1 px-3.5 py-2.5 rounded-2xl bg-white dark:bg-dark-card border border-kawaii-200 dark:border-dark-border text-base sm:text-sm outline-none focus:border-kawaii-500 dark:text-white"
                      />
                      <input
                        type="text"
                        value={level}
                        onChange={(e) => setLevel(e.target.value)}
                        placeholder="HSK1"
                        className="w-20 px-2 py-2.5 rounded-2xl bg-white dark:bg-dark-card border border-kawaii-200 dark:border-dark-border text-base sm:text-sm outline-none focus:border-kawaii-500 dark:text-white font-bold text-center"
                      />
                    </div>
                  </div>
                </div>
              </div>

              {/* NHÓM 2: MẶT SAU (Nghĩa, Ví dụ, Ghi chú, Tags) */}
              <div className="p-4 rounded-3xl bg-purple-50/30 dark:bg-dark-bg/60 border border-purple-200 dark:border-dark-border space-y-3">
                <span className="text-xs font-bold text-purple-700 dark:text-purple-300 uppercase tracking-wider flex items-center gap-1">
                  <span>Mặt sau thẻ</span>
                  <span className="text-red-500">*</span>
                </span>

                {/* Nghĩa */}
                <div>
                  <textarea
                    required
                    rows={2}
                    value={back}
                    onChange={(e) => setBack(e.target.value)}
                    placeholder="Nghĩa tiếng Việt của từ..."
                    className="w-full px-4 py-3 rounded-2xl bg-white dark:bg-dark-card border border-purple-200 dark:border-dark-border text-base sm:text-sm outline-none focus:border-purple-500 dark:text-white font-medium"
                  />
                </div>

                {/* Câu ví dụ & Bản dịch */}
                <div className="space-y-2 pt-1">
                  <div>
                    <label className="block text-[11px] font-bold text-gray-600 dark:text-gray-300 mb-1">
                      Câu ví dụ minh họa
                    </label>
                    <input
                      type="text"
                      value={example}
                      onChange={(e) => setExample(e.target.value)}
                      placeholder="Ví dụ trong ngữ cảnh thực tế..."
                      className="w-full px-3.5 py-2.5 rounded-2xl bg-white dark:bg-dark-card border border-gray-200 dark:border-dark-border text-base sm:text-sm outline-none focus:border-kawaii-500 dark:text-white"
                    />
                  </div>
                  <div>
                    <input
                      type="text"
                      value={exampleTrans}
                      onChange={(e) => setExampleTrans(e.target.value)}
                      placeholder="Dịch nghĩa câu ví dụ sang tiếng Việt..."
                      className="w-full px-3.5 py-2.5 rounded-2xl bg-white dark:bg-dark-card border border-gray-200 dark:border-dark-border text-base sm:text-sm outline-none focus:border-kawaii-500 dark:text-white"
                    />
                  </div>
                </div>

                {/* Ghi chú & Thẻ phân loại */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-1">
                  <div>
                    <label className="block text-[11px] font-bold text-gray-600 dark:text-gray-300 mb-1">
                      Ghi chú / Mẹo nhớ
                    </label>
                    <input
                      type="text"
                      value={notes}
                      onChange={(e) => setNotes(e.target.value)}
                      placeholder="Bộ thủ, gốc từ, liên tưởng..."
                      className="w-full px-3.5 py-2.5 rounded-2xl bg-white dark:bg-dark-card border border-gray-200 dark:border-dark-border text-base sm:text-sm outline-none focus:border-kawaii-500 dark:text-white"
                    />
                  </div>

                  <div>
                    <label className="block text-[11px] font-bold text-gray-600 dark:text-gray-300 mb-1">
                      Thẻ phân loại (Tags)
                    </label>
                    <input
                      type="text"
                      value={tags}
                      onChange={(e) => setTags(e.target.value)}
                      placeholder="Ăn uống, Du lịch, HSK1..."
                      className="w-full px-3.5 py-2.5 rounded-2xl bg-white dark:bg-dark-card border border-gray-200 dark:border-dark-border text-base sm:text-sm outline-none focus:border-kawaii-500 dark:text-white"
                    />
                  </div>
                </div>
              </div>

              {/* NHÓM 3: ĐA PHƯƠNG TIỆN (Ảnh & Micro thu âm trực tiếp) */}
              <div className="p-4 rounded-3xl bg-blue-50/30 dark:bg-dark-bg/60 border border-blue-200 dark:border-dark-border space-y-3">
                <span className="text-xs font-bold text-blue-700 dark:text-blue-300 uppercase tracking-wider flex items-center gap-1.5">
                  <ImageIcon className="w-3.5 h-3.5" />
                  <span>Hình ảnh & Ghi âm giọng đọc</span>
                </span>

                {/* Chọn ảnh từ máy / Chụp camera hoặc dán URL */}
                <div className="space-y-2">
                  <div className="flex gap-2">
                    <input
                      type="text"
                      value={imageUrl}
                      onChange={(e) => setImageUrl(e.target.value)}
                      placeholder="Dán link ảnh hoặc chọn từ máy..."
                      className="flex-1 px-3.5 py-2 rounded-2xl bg-white dark:bg-dark-card border border-gray-200 dark:border-dark-border text-base sm:text-sm outline-none focus:border-kawaii-500 dark:text-white"
                    />

                    {/* Nút mở thư viện ảnh / Camera trên điện thoại */}
                    <input
                      ref={fileInputRef}
                      type="file"
                      accept="image/*"
                      onChange={handleImageFileChange}
                      className="hidden"
                    />
                    <button
                      type="button"
                      onClick={() => fileInputRef.current?.click()}
                      className="px-3 py-2 rounded-2xl bg-white dark:bg-dark-card border border-blue-300 dark:border-blue-900 text-blue-600 dark:text-blue-400 text-xs font-bold flex items-center gap-1 hover:bg-blue-50 active:scale-95"
                    >
                      <Camera className="w-4 h-4" />
                      <span className="hidden sm:inline">Chụp / Chọn</span>
                    </button>

                    {imageUrl && (
                      <button
                        type="button"
                        onClick={() => setImageUrl('')}
                        title="Xóa ảnh"
                        className="p-2 text-red-500 hover:bg-red-50 rounded-xl"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    )}
                  </div>

                  {/* Thumbnail xem trước ảnh */}
                  {imageUrl && (
                    <div className="w-20 h-20 rounded-2xl overflow-hidden border border-kawaii-300 shadow-sm relative group">
                      <img
                        src={imageUrl}
                        alt="Đính kèm"
                        className="w-full h-full object-cover"
                      />
                    </div>
                  )}
                </div>

                {/* Micro thu âm trực tiếp */}
                <div className="flex items-center gap-2 pt-1">
                  <button
                    type="button"
                    onClick={handleToggleRecordAudio}
                    className={`flex-1 py-2.5 px-4 rounded-2xl font-bold text-xs border transition-all flex items-center justify-center gap-2 active:scale-95 ${
                      isRecording
                        ? 'bg-red-500 text-white border-red-600 animate-pulse shadow-md'
                        : audioUrl
                        ? 'bg-emerald-50 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-300 border-emerald-300'
                        : 'bg-white dark:bg-dark-card text-gray-700 dark:text-gray-300 border-gray-200 dark:border-dark-border'
                    }`}
                  >
                    {isRecording ? (
                      <>
                        <Square className="w-4 h-4 fill-current" />
                        <span>Dừng ghi ({recordSeconds}s/10s)</span>
                      </>
                    ) : (
                      <>
                        <Mic className="w-4 h-4 text-kawaii-500" />
                        <span>{audioUrl ? 'Ghi âm lại' : 'Thu âm giọng đọc (Micro)'}</span>
                      </>
                    )}
                  </button>

                  {/* Nút nghe lại audio vừa ghi */}
                  {audioUrl && !isRecording && (
                    <button
                      type="button"
                      onClick={handlePlayAudio}
                      className={`p-2.5 rounded-2xl border text-xs font-bold flex items-center gap-1 active:scale-95 ${
                        isPlayingAudio
                          ? 'bg-kawaii-500 text-white border-kawaii-600'
                          : 'bg-kawaii-50 text-kawaii-700 border-kawaii-200'
                      }`}
                      title="Nghe lại"
                    >
                      <Play className="w-4 h-4 fill-current" />
                      <span className="hidden sm:inline">Nghe lại</span>
                    </button>
                  )}

                  {audioUrl && !isRecording && (
                    <button
                      type="button"
                      onClick={() => setAudioUrl('')}
                      className="p-2.5 text-red-500 hover:bg-red-50 rounded-2xl border border-red-200"
                      title="Xóa âm thanh"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  )}
                </div>
              </div>

            </div>

            {/* CỘT XEM TRƯỚC 3D: Visible when activeTab === 'preview' OR on desktop */}
            <div
              className={`lg:col-span-5 flex flex-col items-center space-y-4 ${
                activeTab === 'preview' ? 'block' : 'hidden lg:block'
              }`}
            >
              <div className="w-full flex items-center justify-between text-xs font-bold text-gray-500">
                <span className="flex items-center gap-1">
                  <Eye className="w-3.5 h-3.5 text-kawaii-500" /> Xem trước 3D Live
                </span>
                <button
                  type="button"
                  onClick={() => setPreviewFlipped(!previewFlipped)}
                  className="text-kawaii-600 dark:text-kawaii-400 hover:underline flex items-center gap-1 font-semibold"
                >
                  <RotateCw className="w-3.5 h-3.5" /> Lật mặt thẻ
                </button>
              </div>

              {/* Thẻ 3D Live Preview */}
              <div
                onClick={() => setPreviewFlipped(!previewFlipped)}
                className="w-full h-72 cursor-pointer perspective-1000 select-none"
              >
                <div
                  className={`relative w-full h-full duration-500 transform-style-3d transition-transform ${
                    previewFlipped ? 'rotate-y-180' : ''
                  }`}
                >
                  {/* MẶT TRƯỚC PREVIEW */}
                  <div className="absolute inset-0 backface-hidden bg-white dark:bg-dark-card rounded-3xl p-5 border-2 border-kawaii-300 dark:border-dark-border shadow-kawaii flex flex-col justify-between items-center text-center">
                    <div className="w-full flex justify-between items-center text-xs">
                      <span className="px-2.5 py-0.5 rounded-full bg-kawaii-50 dark:bg-dark-bg text-kawaii-600 dark:text-kawaii-400 font-bold">
                        {level || 'HSK1'}
                      </span>
                      <span className="text-[10px] text-gray-400">Mặt trước</span>
                    </div>

                    <div className="space-y-1.5 my-auto">
                      <h3 className="text-3xl font-extrabold text-gray-800 dark:text-white font-hanzi">
                        {front ? (
                          cardType === 'cloze' ? (
                            front.replace(/\{\{c\d+::(.*?)\}\}/g, '[ ... ]')
                          ) : (
                            front
                          )
                        ) : (
                          <span className="text-gray-300 italic font-sans text-base">Chưa nhập từ...</span>
                        )}
                      </h3>
                      {phonetic && (
                        <p className="text-sm font-semibold text-kawaii-600 dark:text-kawaii-400 font-mono">
                          {phonetic}
                        </p>
                      )}
                      {imageUrl && (
                        <div className="w-16 h-16 mx-auto rounded-xl overflow-hidden border border-kawaii-200 mt-2">
                          <img src={imageUrl} alt="" className="w-full h-full object-cover" />
                        </div>
                      )}
                    </div>

                    <span className="text-[11px] text-gray-400">Chạm để lật xem mặt sau</span>
                  </div>

                  {/* MẶT SAU PREVIEW */}
                  <div className="absolute inset-0 backface-hidden rotate-y-180 bg-gradient-to-br from-pink-50 to-white dark:from-dark-card dark:to-dark-bg rounded-3xl p-5 border-2 border-kawaii-400 dark:border-kawaii-500 shadow-kawaii flex flex-col justify-between items-center text-center">
                    <div className="w-full flex justify-between items-center text-xs">
                      <span className="px-2.5 py-0.5 rounded-full bg-kawaii-100 dark:bg-dark-card text-kawaii-600 font-bold">
                        {wordType || 'Nghĩa'}
                      </span>
                      <span className="text-[10px] text-gray-400">Mặt sau</span>
                    </div>

                    <div className="space-y-2 my-auto">
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

              {/* Nét viết chữ Hán nếu là tiếng Trung */}
              {deckLanguage === 'zh' && front && (
                <div className="w-full p-4 rounded-3xl bg-pink-50/30 dark:bg-dark-bg/40 border border-kawaii-200 dark:border-dark-border">
                  <span className="text-xs font-bold text-gray-700 dark:text-gray-300 mb-2 block text-center">
                    Tập viết nét chữ Hán:
                  </span>
                  <div className="flex justify-center">
                    <HanziWriterCanvas characters={front} size={140} />
                  </div>
                </div>
              )}

            </div>

          </div>
        </div>

        {/* Sticky Thumb-Zone Bottom Action Bar */}
        <div className="px-4 py-3 sm:px-6 sm:py-4 border-t border-kawaii-100 dark:border-dark-border bg-white/95 dark:bg-dark-card/95 backdrop-blur shrink-0 safe-pb flex items-center justify-between gap-3">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-3 rounded-2xl bg-gray-100 dark:bg-dark-bg hover:bg-gray-200 text-gray-700 dark:text-gray-300 font-bold text-xs transition-colors shrink-0"
          >
            Hủy
          </button>

          <div className="flex items-center gap-2 flex-1 justify-end">
            {!initialCard && (
              <button
                type="button"
                disabled={isSaving}
                onClick={() => handleSaveCard(true)}
                className="px-3.5 py-3 rounded-2xl bg-kawaii-100 dark:bg-dark-bg hover:bg-kawaii-200 text-kawaii-700 dark:text-kawaii-300 font-bold text-xs transition-all active:scale-95 flex items-center gap-1 shrink-0"
              >
                <Plus className="w-4 h-4" />
                <span className="hidden sm:inline">Lưu & thêm tiếp</span>
                <span className="sm:hidden">+ Thêm tiếp</span>
              </button>
            )}

            <button
              type="button"
              disabled={isSaving}
              onClick={() => handleSaveCard(false)}
              className="px-5 py-3 rounded-2xl bg-gradient-to-r from-kawaii-400 to-kawaii-500 hover:from-kawaii-500 hover:to-kawaii-600 text-white font-bold text-xs shadow-kawaii btn-bounce flex items-center justify-center gap-1.5 flex-1 sm:flex-initial"
            >
              <Check className="w-4 h-4" />
              <span>
                {isSaving
                  ? 'Đang lưu...'
                  : initialCard
                  ? 'Cập nhật thẻ'
                  : 'Lưu & Đóng 🌸'}
              </span>
            </button>
          </div>
        </div>

      </div>
    </div>
  );
};
