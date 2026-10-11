import { useMemo } from 'react';
import { useDeckStore } from '../stores/deckStore';
import { type Card, type Deck } from '../types';

export type PracticeModeType =
  | 'srs'        // 1. Ôn tập chuẩn FSRS
  | 'quiz'       // 2. Trắc nghiệm 4 đáp án
  | 'typing'     // 3. Gõ từ / Pinyin
  | 'listening'  // 4. Luyện nghe
  | 'matching'   // 5. Ghép cặp
  | 'hanzi'      // 6. Tập viết chữ Hán
  | 'speed'      // 7. Thử thách 60s
  | 'leech';     // 8. Thẻ khó

export interface EligibilityResult {
  isEligible: boolean;
  currentCount: number;
  requiredCount: number;
  reason?: string;
  suggestion?: string;
  actionType?: 'add_cards' | 'switch_deck' | 'import_excel' | 'completed_fsrs' | 'no_leeches';
}

// Regex kiểm tra có ít nhất 1 chữ Hán
const HANZI_REGEX = /[\u4e00-\u9fa5]/;

export function usePracticeCards(selectedDeckId: string) {
  const { decks, isLoading } = useDeckStore();

  // 1. Thu thập toàn bộ thẻ của tất cả bộ thẻ (kèm ngôn ngữ tương ứng)
  const allCardsWithMeta = useMemo(() => {
    const list: (Card & { deckLang: 'zh' | 'en'; deckTitle: string })[] = [];
    decks.forEach((deck: Deck) => {
      const cards = deck.cards || [];
      cards.forEach((c) => {
        if (!c.isDeleted) {
          list.push({
            ...c,
            deckLang: deck.language || 'zh',
            deckTitle: deck.title,
          });
        }
      });
    });
    return list;
  }, [decks]);

  // 2. Thu thập thẻ thuộc phạm vi đang chọn (all hoặc 1 bộ thẻ cụ thể)
  const scopedCards = useMemo(() => {
    if (selectedDeckId === 'all') {
      return allCardsWithMeta;
    }
    const current = decks.find((d) => d.id === selectedDeckId);
    if (!current) return [];
    return (current.cards || [])
      .filter((c) => !c.isDeleted)
      .map((c) => ({
        ...c,
        deckLang: current.language || 'zh',
        deckTitle: current.title,
      }));
  }, [selectedDeckId, allCardsWithMeta, decks]);

  const currentDeck = useMemo(() => {
    if (selectedDeckId === 'all') return null;
    return decks.find((d) => d.id === selectedDeckId) || null;
  }, [selectedDeckId, decks]);

  // 3. Phân loại thẻ theo từng chế độ
  const pools = useMemo(() => {
    const now = new Date();

    // 1) FSRS: Thẻ đến hạn (due <= now) hoặc thẻ mới (state === 'new')
    const fsrsCards = scopedCards.filter((c) => {
      if (c.schedule?.isSuspended) return false;
      if (!c.schedule || c.schedule.state === 'new') return true;
      return new Date(c.schedule.due) <= now;
    });

    // 2) Quiz & Speed: Có front và back không rỗng
    const quizCards = scopedCards.filter((c) => c.front?.trim() && c.back?.trim());

    // 3) Typing: Có nghĩa (back) và có đáp án gõ được (front hoặc phonetic)
    const typingCards = scopedCards.filter(
      (c) => c.back?.trim() && (c.front?.trim() || c.phonetic?.trim())
    );

    // 4) Listening: Có front để TTS đọc và có back làm đáp án
    const listeningCards = scopedCards.filter((c) => c.front?.trim() && c.back?.trim());

    // 5) Matching: Có cả front và back rõ ràng
    const matchingCards = scopedCards.filter((c) => c.front?.trim() && c.back?.trim());

    // 6) Hanzi: Mặt trước chứa chữ Hán
    const hanziCards = scopedCards.filter((c) => HANZI_REGEX.test(c.front || ''));

    // 7) Speed: Tương tự quizCards
    const speedCards = quizCards;

    // 8) Leech: Thẻ có lapses >= 1 hoặc stability < 1.0
    const leechCards = scopedCards.filter(
      (c) => (c.schedule?.lapses || 0) >= 1 || (c.schedule && c.schedule.stability > 0 && c.schedule.stability < 1.0)
    );

    return {
      fsrsCards,
      quizCards,
      typingCards,
      listeningCards,
      matchingCards,
      hanziCards,
      speedCards,
      leechCards,
    };
  }, [scopedCards]);

  // 4. Hàm kiểm tra điều kiện khởi chạy từng chế độ
  const checkEligibility = (mode: PracticeModeType): EligibilityResult => {
    const totalScoped = scopedCards.length;

    // Nếu không có bất kỳ thẻ nào trong bộ đang chọn
    if (totalScoped === 0) {
      return {
        isEligible: false,
        currentCount: 0,
        requiredCount: 4,
        reason: 'Bộ thẻ đang chọn hiện chưa có từ vựng nào.',
        suggestion: 'Bạn hãy thêm từ vựng mới hoặc nhập tệp Excel để bắt đầu luyện tập.',
        actionType: 'add_cards',
      };
    }

    switch (mode) {
      case 'srs': {
        const count = pools.fsrsCards.length;
        if (count === 0) {
          return {
            isEligible: false,
            currentCount: 0,
            requiredCount: 1,
            reason: 'Hôm nay bạn đã hoàn thành tất cả thẻ cần ôn tập! 🎉',
            suggestion: 'Bạn có thể chọn bộ thẻ khác, thêm thẻ mới hoặc thử các chế độ luyện tập trò chơi bên dưới.',
            actionType: 'completed_fsrs',
          };
        }
        return { isEligible: true, currentCount: count, requiredCount: 1 };
      }

      case 'quiz': {
        const count = pools.quizCards.length;
        if (count < 4) {
          return {
            isEligible: false,
            currentCount: count,
            requiredCount: 4,
            reason: `Bộ thẻ đang chọn có ${count} thẻ hợp lệ, chế độ Trắc nghiệm cần ít nhất 4 từ để tạo 4 đáp án.`,
            suggestion: 'Hãy thêm thêm từ vựng hoặc chọn "Tất cả bộ thẻ" để có đủ câu hỏi.',
            actionType: selectedDeckId !== 'all' ? 'switch_deck' : 'add_cards',
          };
        }
        return { isEligible: true, currentCount: count, requiredCount: 4 };
      }

      case 'typing': {
        const count = pools.typingCards.length;
        if (count < 1) {
          return {
            isEligible: false,
            currentCount: 0,
            requiredCount: 1,
            reason: 'Không tìm thấy thẻ nào có đủ từ vựng và nghĩa để luyện gõ.',
            suggestion: 'Hãy kiểm tra các thẻ trong bộ đã có đầy đủ mặt trước và mặt sau chưa nhé.',
            actionType: 'add_cards',
          };
        }
        return { isEligible: true, currentCount: count, requiredCount: 1 };
      }

      case 'listening': {
        const count = pools.listeningCards.length;
        if (count < 4) {
          return {
            isEligible: false,
            currentCount: count,
            requiredCount: 4,
            reason: `Bộ thẻ đang chọn có ${count} thẻ hợp lệ, chế độ Luyện nghe cần ít nhất 4 từ để chọn đáp án.`,
            suggestion: 'Hãy thêm thêm từ vựng hoặc chuyển sang bộ thẻ khác.',
            actionType: selectedDeckId !== 'all' ? 'switch_deck' : 'add_cards',
          };
        }
        return { isEligible: true, currentCount: count, requiredCount: 4 };
      }

      case 'matching': {
        const count = pools.matchingCards.length;
        if (count < 4) {
          return {
            isEligible: false,
            currentCount: count,
            requiredCount: 4,
            reason: `Bộ thẻ đang chọn có ${count} thẻ, trò chơi Ghép cặp cần ít nhất 4 cặp từ và nghĩa.`,
            suggestion: 'Hãy bổ sung thêm từ vựng vào bộ thẻ này nhé.',
            actionType: selectedDeckId !== 'all' ? 'switch_deck' : 'add_cards',
          };
        }
        return { isEligible: true, currentCount: count, requiredCount: 4 };
      }

      case 'hanzi': {
        // Kiểm tra xem bộ hiện tại có phải là tiếng Anh không
        if (currentDeck && currentDeck.language === 'en') {
          return {
            isEligible: false,
            currentCount: 0,
            requiredCount: 1,
            reason: 'Chế độ Tập viết chữ Hán chỉ dành cho bộ thẻ Tiếng Trung 🇨🇳.',
            suggestion: 'Bộ thẻ bạn đang chọn là Tiếng Anh 🇬🇧. Vui lòng chuyển sang bộ Tiếng Trung nhé!',
            actionType: 'switch_deck',
          };
        }

        const count = pools.hanziCards.length;
        if (count === 0) {
          return {
            isEligible: false,
            currentCount: 0,
            requiredCount: 1,
            reason: 'Không có thẻ nào chứa chữ Hán (Hán tự) trong danh sách đang chọn.',
            suggestion: 'Vui lòng chọn bộ thẻ tiếng Trung có chứa ký tự chữ Hán để luyện viết từng nét.',
            actionType: 'switch_deck',
          };
        }
        return { isEligible: true, currentCount: count, requiredCount: 1 };
      }

      case 'speed': {
        const count = pools.speedCards.length;
        if (count < 4) {
          return {
            isEligible: false,
            currentCount: count,
            requiredCount: 4,
            reason: `Bộ thẻ đang chọn có ${count} thẻ, Thử thách 60s cần ít nhất 4 thẻ để tạo trắc nghiệm phản xạ.`,
            suggestion: 'Hãy chọn "Tất cả bộ thẻ" hoặc nhập thêm từ vào bộ này nhé.',
            actionType: selectedDeckId !== 'all' ? 'switch_deck' : 'add_cards',
          };
        }
        return { isEligible: true, currentCount: count, requiredCount: 4 };
      }

      case 'leech': {
        const count = pools.leechCards.length;
        if (count === 0) {
          return {
            isEligible: false,
            currentCount: 0,
            requiredCount: 1,
            reason: 'Bạn chưa có thẻ nào bị xếp vào nhóm "Thẻ khó" 🎉',
            suggestion: 'Thẻ khó là những thẻ bạn từng bấm "Lại" (Again) khi ôn tập. Hiện tại bạn đang nhớ bài rất tốt!',
            actionType: 'no_leeches',
          };
        }
        return { isEligible: true, currentCount: count, requiredCount: 1 };
      }

      default:
        return { isEligible: true, currentCount: totalScoped, requiredCount: 1 };
    }
  };

  // 5. Hàm sinh 4 đáp án trắc nghiệm thông minh (không trùng lặp, có bổ sung đáp án nhiễu)
  const generateQuizDistractors = (targetCard: Card, pool: Card[]): string[] => {
    const targetMeaning = targetCard.back.trim();
    const targetLang =
      (targetCard as any).deckLang ||
      (targetCard.level?.startsWith('HSK') || HANZI_REGEX.test(targetCard.front || '') ? 'zh' : 'en');

    // Lấy các nghĩa khác từ chính pool đang chơi (lọc trùng nghĩa)
    const localDistractors = Array.from(
      new Set(
        pool
          .filter((c) => c.id !== targetCard.id && c.back?.trim() && c.back.trim() !== targetMeaning)
          .map((c) => c.back.trim())
      )
    );

    // Xáo trộn ngẫu nhiên
    let chosenDistractors = localDistractors.sort(() => Math.random() - 0.5).slice(0, 3);

    // Nếu vẫn chưa đủ 3 đáp án nhiễu, lấy từ tất cả các thẻ cùng ngôn ngữ
    if (chosenDistractors.length < 3) {
      const extraDistractors = Array.from(
        new Set(
          allCardsWithMeta
            .filter(
              (c) =>
                c.deckLang === targetLang &&
                c.back?.trim() &&
                c.back.trim() !== targetMeaning &&
                !chosenDistractors.includes(c.back.trim())
            )
            .map((c) => c.back.trim())
        )
      ).sort(() => Math.random() - 0.5);

      chosenDistractors = [
        ...chosenDistractors,
        ...extraDistractors.slice(0, 3 - chosenDistractors.length),
      ];
    }

    // Ghép 1 đúng + 3 nhiễu và xáo trộn vị trí
    return [targetMeaning, ...chosenDistractors].sort(() => Math.random() - 0.5);
  };

  return {
    isLoading,
    decks,
    scopedCards,
    allCards: allCardsWithMeta,
    pools,
    checkEligibility,
    generateQuizDistractors,
  };
}
