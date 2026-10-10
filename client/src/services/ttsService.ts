/**
 * DỊCH VỤ PHÁT ÂM (TTS / AUDIO)
 * Ưu tiên:
 * 1. Audio URL tải lên / ghi âm của thẻ
 * 2. Web Speech API (zh-CN, zh-TW, en-US, en-GB)
 */

class TTSService {
  private synth: SpeechSynthesis | null = null;
  private voices: SpeechSynthesisVoice[] = [];
  public autoSpeak: boolean = true;
  public speechRate: number = 0.9; // 0.5x - 1.5x

  constructor() {
    if (typeof window !== 'undefined' && 'speechSynthesis' in window) {
      this.synth = window.speechSynthesis;
      this.loadVoices();
      if (this.synth.onvoiceschanged !== undefined) {
        this.synth.onvoiceschanged = () => this.loadVoices();
      }
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
    return this.voices.filter((v) => v.lang.toLowerCase().startsWith(lang.toLowerCase().slice(0, 2)));
  }

  public speak(
    text: string,
    language: 'zh' | 'en' = 'zh',
    audioUrl?: string | null,
    onEnd?: () => void
  ): void {
    // 1. Ưu tiên phát âm thanh có sẵn từ audioUrl nếu có
    if (audioUrl) {
      try {
        const audio = new Audio(audioUrl);
        if (onEnd) audio.onended = onEnd;
        audio.play().catch(() => {
          // Nếu play lỗi, fallback sang Web Speech API
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
      (v) => v.lang.toLowerCase() === targetLang.toLowerCase() || v.lang.startsWith(language)
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
