import { describe, it, expect } from 'vitest';
import {
  checkVietnameseMeaningMatch,
  checkForeignWordMatch,
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

    it('tiếng Trung: khớp Pinyin có dấu thanh', () => {
      expect(checkForeignWordMatch('nǐ hǎo', '你好', 'nǐ hǎo', 'zh')).toBe(true);
      expect(checkForeignWordMatch('nǐhǎo', '你好', 'nǐ hǎo', 'zh')).toBe(true);
    });

    it('tiếng Trung: khớp Pinyin không dấu', () => {
      expect(checkForeignWordMatch('ni hao', '你好', 'nǐ hǎo', 'zh')).toBe(true);
      expect(checkForeignWordMatch('nihao', '你好', 'nǐ hǎo', 'zh')).toBe(true);
      expect(checkForeignWordMatch('xiexie', '谢谢', 'xièxie', 'zh')).toBe(true);
    });

    it('tiếng Anh: khớp từ vựng không phân biệt hoa thường', () => {
      expect(checkForeignWordMatch('hello', 'Hello', undefined, 'en')).toBe(true);
      expect(checkForeignWordMatch('THANK YOU', 'thank you', undefined, 'en')).toBe(true);
    });

    it('từ chối từ ngoại ngữ sai', () => {
      expect(checkForeignWordMatch('zaijian', '你好', 'nǐ hǎo', 'zh')).toBe(false);
      expect(checkForeignWordMatch('goodbye', 'Hello', undefined, 'en')).toBe(false);
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

