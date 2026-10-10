/**
 * DỊCH VỤ PHÁT ÂM (TTS / AUDIO)
 * Tối ưu hóa cho iOS Safari & Android:
 * 1. Mở khóa AudioContext/SpeechSynthesis ở lần tương tác chạm đầu tiên
 * 2. Ưu tiên Audio URL tải lên / ghi âm của thẻ
 * 3. Web Speech API (zh-CN, zh-TW, en-US, en-GB)
 * 4. Kiểm tra sự tồn tại của giọng đọc tiếng Trung / tiếng Anh trên thiết bị
 */

class TTSService {
  private synth: SpeechSynthesis | null = null;
  private voices: SpeechSynthesisVoice[] = [];
  public autoSpeak: boolean = true;
  public speechRate: number = 0.9; // 0.5x - 1.5x
  private isUnlocked: boolean = false;

  constructor() {
    if (typeof window !== 'undefined' && 'speechSynthesis' in window) {
      this.synth = window.speechSynthesis;
      this.loadVoices();
      if (this.synth.onvoiceschanged !== undefined) {
        this.synth.onvoiceschanged = () => this.loadVoices();
      }

      // Tự động mở khóa âm thanh ở lần chạm đầu tiên của người dùng trên iOS Safari
      const unlockHandler = () => {
        this.unlockAudio();
        window.removeEventListener('touchstart', unlockHandler);
        window.removeEventListener('click', unlockHandler);
      };
      window.addEventListener('touchstart', unlockHandler, { once: true, passive: true });
      window.addEventListener('click', unlockHandler, { once: true, passive: true });
    }
  }

  /**
   * Mở khóa chính sách Autoplay của Safari / Chrome trên điện thoại
   */
  public unlockAudio(): void {
    if (this.isUnlocked || !this.synth) return;
    try {
      const silent = new SpeechSynthesisUtterance(' ');
      silent.volume = 0.01;
      silent.rate = 2;
      this.synth.speak(silent);
      this.isUnlocked = true;
    } catch {
      // Bỏ qua lỗi mở khóa
    }
  }

  private loadVoices() {
    if (!this.synth) return;
    this.voices = this.synth.getVoices();
  }

  public getAvailableVoices(lang?: string): SpeechSynthesisVoice[] {
    if (this.voices.length === 0 && this.synth) {
      this.voices = this.synth.getVoices();
    }
    if (!lang) return this.voices;
    return this.voices.filter((v) =>
      v.lang.toLowerCase().startsWith(lang.toLowerCase().slice(0, 2))
    );
  }

  /**
   * Kiểm tra thiết bị người dùng có sẵn gói giọng đọc cho ngôn ngữ này không
   */
  public hasVoice(language: 'zh' | 'en'): boolean {
    const list = this.getAvailableVoices(language);
    return list.length > 0;
  }

  public speak(
    text: string,
    language: 'zh' | 'en' = 'zh',
    audioUrl?: string | null,
    onEnd?: () => void
  ): void {
    this.unlockAudio();

    // 1. Ưu tiên phát âm thanh có sẵn từ audioUrl nếu có
    if (audioUrl) {
      try {
        const audio = new Audio(audioUrl);
        if (onEnd) audio.onended = onEnd;
        audio.play().catch(() => {
          // Nếu play lỗi (vd URL hỏng), fallback sang Web Speech API
          this.speakWebSpeech(text, language, onEnd);
        });
        return;
      } catch {
        // Fallback
      }
    }

    // 2. Web Speech API
    this.speakWebSpeech(text, language, onEnd);
  }

  private speakWebSpeech(text: string, language: 'zh' | 'en', onEnd?: () => void): void {
    if (!this.synth) {
      console.warn('Trình duyệt không hỗ trợ Web Speech API.');
      onEnd?.();
      return;
    }

    // Hủy phát âm cũ nếu đang chạy
    this.synth.cancel();

    // Làm sạch ký tự lạ và Cloze deletion {{c1::từ}}
    const cleanText = text.replace(/\{\{c\d+::(.*?)\}\}/g, '$1').trim();
    if (!cleanText) {
      onEnd?.();
      return;
    }

    const utterance = new SpeechSynthesisUtterance(cleanText);
    const targetLang = language === 'zh' ? 'zh-CN' : 'en-US';
    utterance.lang = targetLang;
    utterance.rate = this.speechRate;

    // Tìm giọng đọc phù hợp nhất
    const matchingVoice = this.voices.find(
      (v) =>
        v.lang.toLowerCase() === targetLang.toLowerCase() ||
        v.lang.toLowerCase().startsWith(language)
    );
    if (matchingVoice) {
      utterance.voice = matchingVoice;
    }

    if (onEnd) {
      utterance.onend = onEnd;
      utterance.onerror = () => onEnd();
    }

    this.synth.speak(utterance);
  }

  public stop(): void {
    if (this.synth) {
      this.synth.cancel();
    }
  }
}

export const ttsService = new TTSService();
