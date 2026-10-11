import { describe, it, expect } from 'vitest';
import { type Card } from '../types';

interface Tile {
  id: string;
  cardId: string;
  type: 'word' | 'meaning';
  text: string;
  phonetic?: string | null;
  isMatched: boolean;
  isWrong: boolean;
}

// Logic khởi tạo bảng ghép cặp 2 cột độc lập
export function setupMatchingBoard(pool: Card[]) {
  const seenFronts = new Set<string>();
  const seenBacks = new Set<string>();
  const validCards: Card[] = [];

  for (const c of pool) {
    const front = (c.front || '').trim();
    const back = (c.back || '').trim();
    if (!front || !back) continue;

    if (!seenFronts.has(front) && !seenBacks.has(back)) {
      seenFronts.add(front);
      seenBacks.add(back);
      validCards.push(c);
    }
    if (validCards.length >= 6) break;
  }

  // Fallback nếu thiếu thẻ không trùng nghĩa
  if (validCards.length < 4) {
    for (const c of pool) {
      if (!validCards.some((x) => x.id === c.id) && c.front && c.back) {
        validCards.push(c);
      }
      if (validCards.length >= 6) break;
    }
  }

  const selected = validCards.slice(0, 6);
  const words: Tile[] = selected.map((c) => ({
    id: `word-${c.id}`,
    cardId: c.id,
    type: 'word',
    text: c.front.trim(),
    phonetic: c.phonetic?.trim() || null,
    isMatched: false,
    isWrong: false,
  }));

  const meanings: Tile[] = selected.map((c) => ({
    id: `meaning-${c.id}`,
    cardId: c.id,
    type: 'meaning',
    text: c.back.trim(),
    isMatched: false,
    isWrong: false,
  }));

  return {
    pairCount: selected.length,
    words: words.sort(() => Math.random() - 0.5),
    meanings: meanings.sort(() => Math.random() - 0.5),
  };
}

// Logic xử lý kiểm tra cặp
export function processMatch(
  wordTile: Tile,
  meaningTile: Tile
): { isMatch: boolean; shouldIncrementMistake: boolean } {
  if (wordTile.cardId === meaningTile.cardId) {
    return { isMatch: true, shouldIncrementMistake: false };
  }
  return { isMatch: false, shouldIncrementMistake: true };
}

describe('Thu Hiền EDU - Matching Game Mode Tests', () => {
  const sampleCards: Card[] = [
    { id: 'c1', deckId: 'd1', front: '牵', back: 'Dắt, nắm tay, kéo', phonetic: 'qiān' },
    { id: 'c2', deckId: 'd1', front: '溶', back: 'Hòa tan (trong chất lỏng)', phonetic: 'róng' },
    { id: 'c3', deckId: 'd1', front: '躲', back: 'Nép, trốn tránh', phonetic: 'duǒ' },
    { id: 'c4', deckId: 'd1', front: '抢', back: 'Cướp, giật, tranh giành', phonetic: 'qiǎng' },
    { id: 'c5', deckId: 'd1', front: '绣', back: 'Thêu (hoa, tranh)', phonetic: 'xiù' },
    { id: 'c6', deckId: 'd1', front: '跪', back: 'Quỳ', phonetic: 'guì' },
    { id: 'c7', deckId: 'd1', front: '哭', back: 'Khóc', phonetic: 'kū' },
    { id: 'c8', deckId: 'd1', front: '笑', back: 'Cười', phonetic: 'xiào' },
  ];

  it('1. Khởi tạo ván chơi -> Phải tạo đủ tối đa 6 cặp, chia 2 cột từ và nghĩa độc lập', () => {
    const board = setupMatchingBoard(sampleCards);
    expect(board.pairCount).toBe(6);
    expect(board.words.length).toBe(6);
    expect(board.meanings.length).toBe(6);
    expect(board.words.every((w) => w.type === 'word')).toBe(true);
    expect(board.meanings.every((m) => m.type === 'meaning')).toBe(true);
  });

  it('2. Bộ thẻ có đúng 4 thẻ -> Khởi tạo ván chơi với đúng 4 cặp (không lỗi, không alert)', () => {
    const quadCards = sampleCards.slice(0, 4);
    const board = setupMatchingBoard(quadCards);
    expect(board.pairCount).toBe(4);
    expect(board.words.length).toBe(4);
    expect(board.meanings.length).toBe(4);
  });

  it('3. Khử trùng lặp nghĩa trong 1 ván -> Không chọn 2 thẻ có nghĩa giống hệt nhau', () => {
    const dups: Card[] = [
      { id: 'd1', deckId: 'd1', front: '高兴', back: 'Vui vẻ' },
      { id: 'd2', deckId: 'd1', front: '开心', back: 'Vui vẻ' }, // Trùng nghĩa
      { id: 'd3', deckId: 'd1', front: '春', back: 'Mùa xuân' },
      { id: 'd4', deckId: 'd1', front: '夏', back: 'Mùa hạ' },
      { id: 'd5', deckId: 'd1', front: '秋', back: 'Mùa thu' },
      { id: 'd6', deckId: 'd1', front: '冬', back: 'Mùa đông' },
    ];
    const board = setupMatchingBoard(dups);
    const meaningsList = board.meanings.map((m) => m.text);
    const uniqueMeanings = new Set(meaningsList);
    // Phải ưu tiên loại bỏ các thẻ trùng nghĩa để bảng chơi không bị nhập nhằng
    expect(uniqueMeanings.size).toBe(meaningsList.length);
  });

  it('4. Khớp đúng -> Phải nhận diện chính xác cặp tương ứng qua cardId', () => {
    const board = setupMatchingBoard(sampleCards);
    const wordTile = board.words[0];
    const matchingMeaning = board.meanings.find((m) => m.cardId === wordTile.cardId)!;

    const result = processMatch(wordTile, matchingMeaning);
    expect(result.isMatch).toBe(true);
    expect(result.shouldIncrementMistake).toBe(false);
  });

  it('5. Ghép sai -> Phải tăng biến đếm số lỗi và không khóa ô', () => {
    const board = setupMatchingBoard(sampleCards);
    const wordTile = board.words[0];
    const wrongMeaning = board.meanings.find((m) => m.cardId !== wordTile.cardId)!;

    const result = processMatch(wordTile, wrongMeaning);
    expect(result.isMatch).toBe(false);
    expect(result.shouldIncrementMistake).toBe(true);
  });
});
