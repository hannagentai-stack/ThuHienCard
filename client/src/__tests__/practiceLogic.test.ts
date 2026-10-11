import { describe, it, expect } from 'vitest';
import { type Card, type Deck } from '../types';

// Trích xuất các hàm logic thuần túy để unit test độc lập
const HANZI_REGEX = /[\u4e00-\u9fa5]/;

export function filterScopedCards(decks: Deck[], selectedDeckId: string) {
  if (selectedDeckId === 'all') {
    const list: (Card & { deckLang: 'zh' | 'en' })[] = [];
    decks.forEach((deck) => {
      (deck.cards || []).forEach((c) => {
        if (!c.isDeleted) {
          list.push({ ...c, deckLang: deck.language || 'zh' });
        }
      });
    });
    return list;
  }
  const current = decks.find((d) => d.id === selectedDeckId);
  if (!current) return [];
  return (current.cards || [])
    .filter((c) => !c.isDeleted)
    .map((c) => ({ ...c, deckLang: current.language || 'zh' }));
}

export function evaluateEligibility(
  mode: string,
  scopedCards: (Card & { deckLang?: 'zh' | 'en' })[],
  currentDeck: Deck | null
) {
  const total = scopedCards.length;
  if (total === 0) {
    return { isEligible: false, currentCount: 0, requiredCount: 4, reason: 'Chưa có từ vựng' };
  }

  const now = new Date();
  const fsrsCards = scopedCards.filter((c) => {
    if (c.schedule?.isSuspended) return false;
    if (!c.schedule || c.schedule.state === 'new') return true;
    return new Date(c.schedule.due) <= now;
  });
  const quizCards = scopedCards.filter((c) => c.front?.trim() && c.back?.trim());
  const typingCards = scopedCards.filter((c) => c.back?.trim() && (c.front?.trim() || c.phonetic?.trim()));
  const listeningCards = scopedCards.filter((c) => c.front?.trim() && c.back?.trim());
  const matchingCards = scopedCards.filter((c) => c.front?.trim() && c.back?.trim());
  const hanziCards = scopedCards.filter((c) => HANZI_REGEX.test(c.front || ''));
  const speedCards = quizCards;
  const leechCards = scopedCards.filter((c) => (c.schedule?.lapses || 0) >= 1);

  switch (mode) {
    case 'srs':
      return { isEligible: fsrsCards.length > 0, currentCount: fsrsCards.length, requiredCount: 1 };
    case 'quiz':
      return { isEligible: quizCards.length >= 4, currentCount: quizCards.length, requiredCount: 4 };
    case 'typing':
      return { isEligible: typingCards.length >= 1, currentCount: typingCards.length, requiredCount: 1 };
    case 'listening':
      return { isEligible: listeningCards.length >= 4, currentCount: listeningCards.length, requiredCount: 4 };
    case 'matching':
      return { isEligible: matchingCards.length >= 4, currentCount: matchingCards.length, requiredCount: 4 };
    case 'hanzi':
      if (currentDeck && currentDeck.language === 'en') {
        return { isEligible: false, currentCount: 0, requiredCount: 1, reason: 'Chỉ hỗ trợ tiếng Trung' };
      }
      return { isEligible: hanziCards.length > 0, currentCount: hanziCards.length, requiredCount: 1 };
    case 'speed':
      return { isEligible: speedCards.length >= 4, currentCount: speedCards.length, requiredCount: 4 };
    case 'leech':
      return { isEligible: leechCards.length > 0, currentCount: leechCards.length, requiredCount: 1 };
    default:
      return { isEligible: true, currentCount: total, requiredCount: 1 };
  }
}

export function generateDistractorsTest(
  targetCard: Card,
  pool: Card[],
  allCards: (Card & { deckLang: 'zh' | 'en' })[]
): string[] {
  const targetMeaning = targetCard.back.trim();
  const targetLang =
    (targetCard as any).deckLang ||
    (targetCard.level?.startsWith('HSK') || HANZI_REGEX.test(targetCard.front || '') ? 'zh' : 'en');

  const localDistractors = Array.from(
    new Set(
      pool
        .filter((c) => c.id !== targetCard.id && c.back?.trim() && c.back.trim() !== targetMeaning)
        .map((c) => c.back.trim())
    )
  );

  let chosen = localDistractors.sort(() => Math.random() - 0.5).slice(0, 3);

  if (chosen.length < 3) {
    const extra = Array.from(
      new Set(
        allCards
          .filter(
            (c) =>
              c.deckLang === targetLang &&
              c.back?.trim() &&
              c.back.trim() !== targetMeaning &&
              !chosen.includes(c.back.trim())
          )
          .map((c) => c.back.trim())
      )
    );
    chosen = [...chosen, ...extra.slice(0, 3 - chosen.length)];
  }

  return [targetMeaning, ...chosen];
}

describe('Thu Hiền EDU - Practice Mode Logic Tests', () => {
  // Mock dữ liệu: 50 thẻ tiếng Trung + 50 thẻ tiếng Anh
  const zhDeck: Deck = {
    id: 'deck-zh',
    title: '50 Từ Vựng HSK 1 Cơ Bản 🇨🇳',
    language: 'zh',
    cards: Array.from({ length: 50 }, (_, i) => ({
      id: `zh-card-${i + 1}`,
      deckId: 'deck-zh',
      front: `你好_${i + 1}`,
      back: `Xin chào ${i + 1}`,
      phonetic: `nǐ hǎo ${i + 1}`,
      schedule: {
        id: `sch-${i}`,
        cardId: `zh-card-${i + 1}`,
        state: i < 10 ? 'new' : 'review',
        due: new Date(Date.now() - 1000 * 3600).toISOString(),
        stability: 2.0,
        difficulty: 3.0,
        reps: 2,
        lapses: i === 0 ? 2 : 0, // 1 thẻ khó
      },
    })),
  };

  const enDeck: Deck = {
    id: 'deck-en',
    title: '50 Từ Vựng Tiếng Anh Oxford 🇬🇧',
    language: 'en',
    cards: Array.from({ length: 50 }, (_, i) => ({
      id: `en-card-${i + 1}`,
      deckId: 'deck-en',
      front: `Word_${i + 1}`,
      back: `Nghĩa tiếng Anh ${i + 1}`,
      phonetic: `/wɜːd ${i + 1}/`,
      schedule: {
        id: `sch-en-${i}`,
        cardId: `en-card-${i + 1}`,
        state: 'new',
        due: new Date().toISOString(),
        stability: 0,
        difficulty: 0,
        reps: 0,
        lapses: 0,
      },
    })),
  };

  const decks = [zhDeck, enDeck];

  it('Kịch bản 1: Khi có 2 bộ tổng 100 thẻ và chọn "Tất cả bộ thẻ" -> Phải lấy đủ 100 thẻ', () => {
    const scoped = filterScopedCards(decks, 'all');
    expect(scoped.length).toBe(100);
  });

  it('Kịch bản 2: Khi có 100 thẻ -> Các chế độ phù hợp (Quiz, Typing, Listening, Matching, Speed, FSRS) phải ĐỦ ĐIỀU KIỆN', () => {
    const scoped = filterScopedCards(decks, 'all');
    expect(evaluateEligibility('quiz', scoped, null).isEligible).toBe(true);
    expect(evaluateEligibility('typing', scoped, null).isEligible).toBe(true);
    expect(evaluateEligibility('listening', scoped, null).isEligible).toBe(true);
    expect(evaluateEligibility('matching', scoped, null).isEligible).toBe(true);
    expect(evaluateEligibility('speed', scoped, null).isEligible).toBe(true);
    expect(evaluateEligibility('srs', scoped, null).isEligible).toBe(true);
  });

  it('Kịch bản 3: Chế độ 6 (Tập viết chữ Hán) với bộ tiếng Anh -> Phải báo không đủ điều kiện và giải thích rõ', () => {
    const scopedEn = filterScopedCards(decks, 'deck-en');
    const result = evaluateEligibility('hanzi', scopedEn, enDeck);
    expect(result.isEligible).toBe(false);
    expect(result.reason).toContain('Chỉ hỗ trợ tiếng Trung');
  });

  it('Kịch bản 4: Chế độ 6 (Tập viết chữ Hán) với bộ tiếng Trung -> Phải đủ điều kiện với 50 chữ Hán', () => {
    const scopedZh = filterScopedCards(decks, 'deck-zh');
    const result = evaluateEligibility('hanzi', scopedZh, zhDeck);
    expect(result.isEligible).toBe(true);
    expect(result.currentCount).toBe(50);
  });

  it('Kịch bản 5: Bộ thẻ biên 3 thẻ -> Quiz, Matching, Listening, Speed phải báo thiếu (3/4 thẻ)', () => {
    const smallDeck: Deck = {
      id: 'deck-small',
      title: 'Bộ 3 thẻ',
      language: 'zh',
      cards: zhDeck.cards!.slice(0, 3),
    };
    const scoped = filterScopedCards([smallDeck], 'deck-small');
    expect(scoped.length).toBe(3);

    const quizRes = evaluateEligibility('quiz', scoped, smallDeck);
    expect(quizRes.isEligible).toBe(false);
    expect(quizRes.currentCount).toBe(3);
    expect(quizRes.requiredCount).toBe(4);

    const matchRes = evaluateEligibility('matching', scoped, smallDeck);
    expect(matchRes.isEligible).toBe(false);

    // Nhưng Typing vẫn chơi được vì chỉ cần >= 1 thẻ
    const typingRes = evaluateEligibility('typing', scoped, smallDeck);
    expect(typingRes.isEligible).toBe(true);
  });

  it('Kịch bản 6: Bộ thẻ biên 0 thẻ -> Không được vào bất kỳ chế độ nào', () => {
    const emptyDeck: Deck = {
      id: 'deck-empty',
      title: 'Bộ rỗng',
      language: 'zh',
      cards: [],
    };
    const scoped = filterScopedCards([emptyDeck], 'deck-empty');
    expect(evaluateEligibility('quiz', scoped, emptyDeck).isEligible).toBe(false);
    expect(evaluateEligibility('typing', scoped, emptyDeck).isEligible).toBe(false);
  });

  it('Kịch bản 7: Sinh đáp án trắc nghiệm -> Không được có đáp án trùng nhau', () => {
    const scoped = filterScopedCards(decks, 'deck-zh');
    const all = filterScopedCards(decks, 'all');
    const card = scoped[0];
    const options = generateDistractorsTest(card, scoped, all);

    expect(options.length).toBe(4);
    expect(options).toContain(card.back);
    // Kiểm tra tính duy nhất (set size === length)
    const unique = new Set(options);
    expect(unique.size).toBe(4);
  });

  it('Kịch bản 8: Thẻ trùng nghĩa trong bộ -> Tự động bù đáp án nhiễu từ bộ khác cùng ngôn ngữ', () => {
    // Giả sử bộ có 4 thẻ nhưng 2 thẻ cùng nghĩa 'Xin chào'
    const duplicateMeaningCards: Card[] = [
      { id: 'c1', deckId: 'd1', front: '你好', back: 'Xin chào' },
      { id: 'c2', deckId: 'd2', front: '您好', back: 'Xin chào' }, // trùng nghĩa!
      { id: 'c3', deckId: 'd1', front: '再见', back: 'Tạm biệt' },
      { id: 'c4', deckId: 'd1', front: '谢谢', back: 'Cảm ơn' },
    ];
    // Bộ phụ tiếng Trung khác có thêm từ
    const backupZhCards: (Card & { deckLang: 'zh' | 'en' })[] = [
      { id: 'b1', deckId: 'd-other', front: '高兴', back: 'Vui vẻ', deckLang: 'zh' },
      { id: 'b2', deckId: 'd-other', front: '喝茶', back: 'Uống trà', deckLang: 'zh' },
    ];

    const options = generateDistractorsTest(
      duplicateMeaningCards[0],
      duplicateMeaningCards,
      backupZhCards
    );

    // Không được có đáp án trùng và phải có đủ 4 lựa chọn khác nhau
    const unique = new Set(options);
    expect(unique.size).toBe(4);
  });
});
