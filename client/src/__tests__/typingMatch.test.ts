import { describe, it, expect } from 'vitest';
import {
  checkVietnameseMeaningMatch,
  checkForeignWordMatch,
  detectCardLanguage,
  removeVietnameseTones,
  removePinyinTones,
} from '../utils/typingMatch';

describe('Typing Match Utilities', () => {
  describe('checkVietnameseMeaningMatch (Hiện tiếng Trung/Anh ➔ Nhập nghĩa tiếng Việt)', () => {
    it('khớp chính xác từ đơn tiếng Việt', () => {
      expect(checkVietnameseMeaningMatch('xin chào', 'Xin chào')).toBe(true);
      expect(checkVietnameseMeaningMatch('cảm ơn', 'Cảm ơn')).toBe(true);
    });

    it('khớp khi người dùng gõ không dấu', () => {
      expect(checkVietnameseMeaningMatch('xin chao', 'Xin chào')).toBe(true);
      expect(checkVietnameseMeaningMatch('cam on', 'Cảm ơn')).toBe(true);
      expect(checkVietnameseMeaningMatch('ban be', 'Bạn bè')).toBe(true);
    });

    it('khớp với một trong các nghĩa phân tách bởi dấu chấm phẩy (;)', () => {
      const target = 'Xin chào; Chào bạn; Lời chào';
      expect(checkVietnameseMeaningMatch('xin chào', target)).toBe(true);
      expect(checkVietnameseMeaningMatch('chào bạn', target)).toBe(true);
      expect(checkVietnameseMeaningMatch('chao ban', target)).toBe(true);
      expect(checkVietnameseMeaningMatch('lời chào', target)).toBe(true);
    });

    it('khớp với một trong các nghĩa phân tách bởi dấu phẩy hoặc gạch chéo (, /)', () => {
      const target = 'cô ấy, bà ấy / chị ấy';
      expect(checkVietnameseMeaningMatch('cô ấy', target)).toBe(true);
      expect(checkVietnameseMeaningMatch('bà ấy', target)).toBe(true);
      expect(checkVietnameseMeaningMatch('chị ấy', target)).toBe(true);
      expect(checkVietnameseMeaningMatch('co ay', target)).toBe(true);
    });

    it('bỏ qua chú thích trong ngoặc đơn (danh từ, động từ...)', () => {
      const target = '(đt) ăn cơm, dùng bữa';
      expect(checkVietnameseMeaningMatch('ăn cơm', target)).toBe(true);
      expect(checkVietnameseMeaningMatch('dùng bữa', target)).toBe(true);
      expect(checkVietnameseMeaningMatch('an com', target)).toBe(true);
    });

    it('chấp nhận từ đồng nghĩa nằm bên trong ngoặc đơn', () => {
      const target = 'quả táo (trái táo)';
      expect(checkVietnameseMeaningMatch('quả táo', target)).toBe(true);
      expect(checkVietnameseMeaningMatch('trái táo', target)).toBe(true);
      expect(checkVietnameseMeaningMatch('trai tao', target)).toBe(true);
      expect(checkVietnameseMeaningMatch('táo', target)).toBe(true);
    });

    it('chấp nhận có hoặc không có loại từ (con mèo <-> mèo, cái bàn <-> bàn)', () => {
      expect(checkVietnameseMeaningMatch('mèo', 'con mèo')).toBe(true);
      expect(checkVietnameseMeaningMatch('con mèo', 'mèo')).toBe(true);
      expect(checkVietnameseMeaningMatch('bàn', 'cái bàn')).toBe(true);
      expect(checkVietnameseMeaningMatch('cái bàn', 'bàn')).toBe(true);
    });

    it('chấp nhận các cặp từ thông dụng (ăn cơm <-> ăn, uống nước <-> uống, cảm ơn bạn <-> cảm ơn)', () => {
      expect(checkVietnameseMeaningMatch('ăn', 'ăn cơm')).toBe(true);
      expect(checkVietnameseMeaningMatch('ăn cơm', 'ăn')).toBe(true);
      expect(checkVietnameseMeaningMatch('uống', 'uống nước')).toBe(true);
      expect(checkVietnameseMeaningMatch('cảm ơn bạn', 'cảm ơn')).toBe(true);
      expect(checkVietnameseMeaningMatch('học', 'học tập')).toBe(true);
    });

    it('từ chối đáp án sai', () => {
      expect(checkVietnameseMeaningMatch('tạm biệt', 'Xin chào')).toBe(false);
      expect(checkVietnameseMeaningMatch('ngủ ngon', 'Cảm ơn')).toBe(false);
      expect(checkVietnameseMeaningMatch('', 'Xin chào')).toBe(false);
    });
  });

  describe('checkForeignWordMatch (Hiện nghĩa tiếng Việt ➔ Nhập Tiếng Trung / Tiếng Anh)', () => {
    it('tiếng Trung: khớp chữ Hán chính xác', () => {
      expect(checkForeignWordMatch('你好', '你好', 'nǐ hǎo', 'zh')).toBe(true);
      expect(checkForeignWordMatch('谢谢', '谢谢', 'xièxie', 'zh')).toBe(true);
    });

    it('tiếng Trung: khớp Pinyin có dấu thanh (viết liền hoặc có cách)', () => {
      expect(checkForeignWordMatch('nǐ hǎo', '你好', 'nǐ hǎo', 'zh')).toBe(true);
      expect(checkForeignWordMatch('nǐhǎo', '你好', 'nǐ hǎo', 'zh')).toBe(true);
    });

    it('tiếng Trung: khớp Pinyin không dấu (viết liền hoặc có cách)', () => {
      expect(checkForeignWordMatch('ni hao', '你好', 'nǐ hǎo', 'zh')).toBe(true);
      expect(checkForeignWordMatch('nihao', '你好', 'nǐ hǎo', 'zh')).toBe(true);
      expect(checkForeignWordMatch('xiexie', '谢谢', 'xiè xie', 'zh')).toBe(true);
    });

    it('tiếng Trung: khớp Pinyin kèm số thanh điệu (ni3 hao3, xie4xie)', () => {
      expect(checkForeignWordMatch('ni3 hao3', '你好', 'nǐ hǎo', 'zh')).toBe(true);
      expect(checkForeignWordMatch('ni3hao3', '你好', 'nǐ hǎo', 'zh')).toBe(true);
      expect(checkForeignWordMatch('xie4xie', '谢谢', 'xièxie', 'zh')).toBe(true);
    });

    it('tiếng Trung: xử lý linh hoạt ü -> v hoặc u (lǚ -> lv, lu)', () => {
      expect(checkForeignWordMatch('lv', '绿', 'lǜ', 'zh')).toBe(true);
      expect(checkForeignWordMatch('lu', '绿', 'lǜ', 'zh')).toBe(true);
    });

    it('tiếng Trung: tự động nhận diện tiếng Trung từ chữ Hán hoặc Pinyin dù lang không truyền', () => {
      expect(checkForeignWordMatch('ni hao', '你好', 'nǐ hǎo')).toBe(true);
      expect(checkForeignWordMatch('nihao', '你好', 'nǐ hǎo')).toBe(true);
    });

    it('tiếng Anh: khớp từ vựng không phân biệt hoa thường và bỏ mạo từ (a, an, the, to)', () => {
      expect(checkForeignWordMatch('hello', 'Hello', undefined, 'en')).toBe(true);
      expect(checkForeignWordMatch('THANK YOU', 'thank you', undefined, 'en')).toBe(true);
      expect(checkForeignWordMatch('apple', 'an apple', undefined, 'en')).toBe(true);
      expect(checkForeignWordMatch('run', 'to run', undefined, 'en')).toBe(true);
    });

    it('từ chối từ ngoại ngữ sai', () => {
      expect(checkForeignWordMatch('zaijian', '你好', 'nǐ hǎo', 'zh')).toBe(false);
      expect(checkForeignWordMatch('goodbye', 'Hello', undefined, 'en')).toBe(false);
    });
  });

  describe('detectCardLanguage', () => {
    it('nhận diện tiếng Trung khi front có chữ Hán', () => {
      expect(detectCardLanguage({ front: '你好' })).toBe('zh');
      expect(detectCardLanguage({ front: '学习' })).toBe('zh');
    });

    it('nhận diện tiếng Trung khi level là HSK', () => {
      expect(detectCardLanguage({ front: 'Word', level: 'HSK1' })).toBe('zh');
    });

    it('nhận diện từ deck language', () => {
      const decks = [{ id: 'd1', language: 'zh' }, { id: 'd2', language: 'en' }];
      expect(detectCardLanguage({ front: 'Card1', deckId: 'd1' }, decks as any)).toBe('zh');
      expect(detectCardLanguage({ front: 'Card2', deckId: 'd2' }, decks as any)).toBe('en');
    });

    it('nhận diện tiếng Anh khi là từ Latinh thông thường', () => {
      expect(detectCardLanguage({ front: 'Welcome', level: 'A1' })).toBe('en');
    });
  });

  describe('Helper Functions', () => {
    it('removeVietnameseTones xóa đúng dấu tiếng Việt', () => {
      expect(removeVietnameseTones('Tiếng Việt')).toBe('Tieng Viet');
      expect(removeVietnameseTones('Đồng hồ')).toBe('Dong ho');
    });

    it('removePinyinTones xóa đúng dấu thanh Pinyin', () => {
      expect(removePinyinTones('nǐ hǎo')).toBe('ni hao');
      expect(removePinyinTones('xièxie')).toBe('xiexie');
      expect(removePinyinTones('lǚ xíng')).toBe('lv xing');
    });
  });
});
