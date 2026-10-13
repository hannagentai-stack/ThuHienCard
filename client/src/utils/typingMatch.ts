/**
 * Helper so sánh và kiểm tra đáp án gõ từ thông minh cho WebFlashCard:
 * - Chiều 1: Hiện ngoại ngữ (tiếng Trung/Anh) ➔ Nhập nghĩa tiếng Việt
 * - Chiều 2: Hiện nghĩa tiếng Việt ➔ Nhập ngoại ngữ (chữ Hán/Pinyin hoặc tiếng Anh)
 */

/**
 * Tự động phát hiện ngôn ngữ của thẻ (tiếng Trung 'zh' hay tiếng Anh 'en')
 */
export function detectCardLanguage(
  card?: { front?: string; level?: string | null; phonetic?: string | null; deckId?: string } | null,
  decks?: { id: string; language?: string }[]
): 'zh' | 'en' {
  if (!card) return 'en';
  // 1. Chứa ký tự chữ Hán (CJK)
  if (card.front && /[\u4e00-\u9fa5\u3400-\u4dbf]/.test(card.front)) return 'zh';
  // 2. Level HSK
  if (card.level && card.level.toUpperCase().startsWith('HSK')) return 'zh';
  // 3. Tra cứu từ bộ thẻ cha
  if (card.deckId && decks) {
    const parent = decks.find((d) => d.id === card.deckId);
    if (parent?.language === 'zh' || parent?.language === 'en') return parent.language;
  }
  // 4. Có thanh điệu Pinyin
  if (card.phonetic && /[āáǎàōóǒòēéěèīíǐìūúǔùǖǘǚǜü]/.test(card.phonetic)) return 'zh';
  return 'en';
}

/**
 * Tính khoảng cách Levenshtein giữa 2 chuỗi để hỗ trợ dung sai gõ sai 1 phím/ký tự
 */
export function levenshteinDistance(a: string, b: string): number {
  if (a === b) return 0;
  if (!a.length) return b.length;
  if (!b.length) return a.length;

  const row = Array.from({ length: b.length + 1 }, (_, i) => i);

  for (let i = 1; i <= a.length; i++) {
    let prev = i;
    for (let j = 1; j <= b.length; j++) {
      const val =
        a[i - 1] === b[j - 1]
          ? row[j - 1]
          : Math.min(row[j - 1] + 1, prev + 1, row[j] + 1);
      row[j - 1] = prev;
      prev = val;
    }
    row[b.length] = prev;
  }

  return row[b.length];
}

/**
 * Loại bỏ dấu thanh tiếng Việt (cho phép người dùng gõ không dấu vẫn được công nhận)
 */
export function removeVietnameseTones(str: string): string {
  if (!str) return '';
  return str
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[đĐ]/g, (m) => (m === 'đ' ? 'd' : 'D'))
    .normalize('NFC');
}

/**
 * Chuẩn hóa chuỗi văn bản: Unicode NFC, chữ thường, bỏ dấu câu thừa, gom khoảng trắng
 */
export function normalizeText(str: string): string {
  if (!str) return '';
  return str
    .normalize('NFC')
    .toLowerCase()
    .replace(/[‘’]/g, "'")
    .replace(/[“”]/g, '"')
    .replace(/[.,;!?()（）"'/\\~`\-_[\]{}<>]/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}

/**
 * Loại bỏ dấu thanh Pinyin tiếng Trung (ā -> a, nǐ hǎo -> ni hao)
 * Hỗ trợ chuyển đổi cả ü -> v / u
 */
export function removePinyinTones(pinyinStr: string): string {
  if (!pinyinStr) return '';
  const toneMap: Record<string, string> = {
    ā: 'a', á: 'a', ǎ: 'a', à: 'a',
    ō: 'o', ó: 'o', ǒ: 'o', ò: 'o',
    ē: 'e', é: 'e', ě: 'e', è: 'e',
    ī: 'i', í: 'i', ǐ: 'i', ì: 'i',
    ū: 'u', ú: 'u', ǔ: 'u', ù: 'u',
    ǖ: 'v', ǘ: 'v', ǚ: 'v', ǜ: 'v', ü: 'v',
  };
  return pinyinStr
    .normalize('NFC')
    .toLowerCase()
    .replace(/[āáǎàōóǒòēéěèīíǐìūúǔùǖǘǚǜü]/g, (char) => toneMap[char] || char)
    .replace(/[1-5]/g, ''); // Bỏ số thanh điệu (vd: ni3 hao3 -> ni hao)
}

/**
 * Trích xuất tất cả các biến thể nghĩa tiếng Việt hợp lệ từ thẻ
 */
export function extractVietnameseCandidates(targetMeaning: string): string[] {
  if (!targetMeaning) return [];

  const candidates = new Set<string>();

  // 1. Tách theo các dấu phân cách thông dụng (; , / | xuống dòng, gạch ngang, từ "hoặc", "hay")
  const rawSegments = targetMeaning
    .split(/[;,\/|\n\r]+|\s+-\s+|\s+hoặc\s+|\s+hay\s+/i)
    .map((s) => s.trim())
    .filter(Boolean);

  // Danh sách từ loại chú thích thông dụng cần loại bỏ
  const posRegex =
    /^\s*(\((dt|đt|tt|danh từ|động từ|tính từ|phó từ|thán từ|lượng từ|giới từ|liên từ|n|v|adj|adv|prep)\)|\[(dt|đt|tt|n|v|adj|adv)\])\s*/i;

  for (const segment of rawSegments) {
    let clean = segment.replace(posRegex, '').trim();

    // Bỏ số thứ tự đầu dòng (1. 2. 1) 2) - * •)
    clean = clean.replace(/^[0-9]+[.)\/-]\s*|^[-*•]\s*/, '').trim();

    if (!clean) continue;

    // A. Thêm bản thân phân đoạn sạch
    const normClean = normalizeText(clean);
    if (normClean) candidates.add(normClean);

    // B. Xử lý các cụm trong ngoặc giải thích/đồng nghĩa: "quả táo (trái táo)" -> cả "quả táo" lẫn "trái táo"
    const bracketMatches = clean.match(/\(([^)]+)\)|\[([^\]]+)\]/g);
    if (bracketMatches) {
      // B1: Nghĩa khi bỏ ngoặc: "quả táo (trái táo)" -> "quả táo"
      const outside = normalizeText(
        clean.replace(/\([^)]+\)|\[[^\]]+\]/g, ' ')
      );
      if (outside) candidates.add(outside);

      // B2: Nghĩa nằm bên trong ngoặc: "(trái táo)" -> "trái táo"
      for (const b of bracketMatches) {
        const inner = normalizeText(b.slice(1, -1));
        // Chỉ nhận nếu không phải chú thích từ loại
        if (
          inner &&
          !/^(dt|đt|tt|danh từ|động từ|tính từ|phó từ|thán từ|lượng từ|giới từ|n|v|adj|adv)$/i.test(
            inner
          )
        ) {
          candidates.add(inner);
        }
      }

      // B3: Cụm ghép nếu ngoặc là từ bổ trợ: "ăn (cơm)" -> "ăn cơm"
      const combined = normalizeText(clean.replace(/[()[\]]/g, ' '));
      if (combined) candidates.add(combined);
    }
  }

  // 2. Thêm các biến thể loại từ / mạo từ tiếng Việt thông dụng
  // Ví dụ: thẻ là "con mèo" -> cho phép gõ "mèo"; thẻ là "cái bàn" -> cho phép gõ "bàn"
  const classifierPrefixes = [
    'con ',
    'cái ',
    'chiếc ',
    'cây ',
    'quả ',
    'trái ',
    'người ',
    'sự ',
    'việc ',
    'nơi ',
    'chỗ ',
  ];

  const currentList = Array.from(candidates);
  for (const c of currentList) {
    for (const prefix of classifierPrefixes) {
      if (c.startsWith(prefix)) {
        const stripped = c.slice(prefix.length).trim();
        if (stripped) candidates.add(stripped);
      }
    }
  }

  return Array.from(candidates);
}

/**
 * Kiểm tra câu trả lời nghĩa tiếng Việt của người dùng với nghĩa trong thẻ
 * Cực kỳ linh hoạt, chịu lỗi tốt:
 * - Chuẩn hóa NFC tiếng Việt (tránh lệch bảng mã iOS/Android/Windows)
 * - Chấp nhận gõ có dấu hoặc không dấu
 * - Tách nhiều nghĩa (, ; / | hoặc)
 * - Chấp nhận cả từ chính hoặc từ đồng nghĩa trong ngoặc
 * - Chấp nhận có/không có loại từ (con mèo <-> mèo, cái bàn <-> bàn, quả táo <-> trái táo)
 * - Chấp nhận từ ngữ thông dụng (ăn cơm <-> ăn, uống nước <-> uống, cảm ơn bạn <-> cảm ơn)
 * - Dung sai lỗi chính tả 1 ký tự (gõ nhầm phím) với từ dài
 */
export function checkVietnameseMeaningMatch(
  userInput: string,
  targetMeaning: string
): boolean {
  const normUser = normalizeText(userInput);
  if (!normUser || !targetMeaning) return false;

  const candidates = extractVietnameseCandidates(targetMeaning);
  if (candidates.length === 0) {
    // Dự phòng nếu không trích xuất được
    const normTarget = normalizeText(targetMeaning);
    if (!normTarget) return false;
    candidates.push(normTarget);
  }

  const userNoTone = removeVietnameseTones(normUser);

  // Danh sách tiền tố loại từ tiếng Việt để kiểm tra 2 chiều
  const classifiers = [
    'con',
    'cai',
    'chiec',
    'cay',
    'qua',
    'trai',
    'nguoi',
    'su',
    'viec',
  ];

  // Các cặp từ thông dụng hay lược bỏ trong giao tiếp
  const commonCouples: [string, string][] = [
    ['an', 'an com'],
    ['uong', 'uong nuoc'],
    ['cam on', 'cam on ban'],
    ['tam biet', 'tam biet nhe'],
    ['xin chao', 'chao'],
    ['xin chao', 'chao ban'],
    ['hoc', 'hoc tap'],
    ['ban', 'ban be'],
    ['di', 'di lai'],
  ];

  for (const cand of candidates) {
    const candNoTone = removeVietnameseTones(cand);

    // 1. Khớp chính xác có dấu
    if (normUser === cand) return true;

    // 2. Khớp chính xác không dấu
    if (userNoTone === candNoTone) return true;

    // 3. Khớp khi một bên có thêm loại từ (ví dụ user gõ "con mèo" vs thẻ là "mèo", hoặc ngược lại)
    for (const cl of classifiers) {
      if (userNoTone === `${cl} ${candNoTone}` || candNoTone === `${cl} ${userNoTone}`) {
        return true;
      }
    }

    // 4. Khớp các cặp từ cốt lõi thông dụng
    for (const [shortForm, longForm] of commonCouples) {
      if (
        (userNoTone === shortForm && candNoTone === longForm) ||
        (userNoTone === longForm && candNoTone === shortForm)
      ) {
        return true;
      }
    }

    // 5. Dung sai lỗi gõ phím 1 ký tự (Levenshtein distance <= 1) cho từ có độ dài >= 4
    if (userNoTone.length >= 4 && candNoTone.length >= 4) {
      if (levenshteinDistance(userNoTone, candNoTone) <= 1) {
        return true;
      }
    }
  }

  return false;
}

/**
 * Kiểm tra câu trả lời ngoại ngữ (Tiếng Trung hoặc Tiếng Anh)
 * - Tiếng Trung:
 *   + Chữ Hán: khớp chữ Hán chuẩn
 *   + Pinyin: chấp nhận có dấu, không dấu, viết liền, có dấu cách, Pinyin số (ni3 hao3), ü <-> v / u
 * - Tiếng Anh:
 *   + Không phân biệt hoa thường, bỏ mạo từ (a, an, the, to)
 *   + Dung sai 1 ký tự lỗi gõ phím
 */
export function checkForeignWordMatch(
  userInput: string,
  targetFront: string,
  targetPhonetic?: string | null,
  lang?: 'zh' | 'en'
): boolean {
  const normUser = normalizeText(userInput);
  const normTarget = normalizeText(targetFront);
  if (!normUser || !normTarget) return false;

  // 1. Khớp trực tiếp mặt chữ
  if (normUser === normTarget) return true;

  // Tự động nhận diện tiếng Trung nếu chứa chữ Hán hoặc có phonetic pinyin
  const isChinese =
    lang === 'zh' ||
    /[\u4e00-\u9fa5\u3400-\u4dbf]/.test(targetFront) ||
    Boolean(targetPhonetic && /[āáǎàōóǒòēéěèīíǐìūúǔùǖǘǚǜü]/.test(targetPhonetic));

  if (isChinese) {
    const rawUserClean = userInput
      .normalize('NFC')
      .trim()
      .toLowerCase()
      .replace(/\s+/g, '');
    const rawTargetClean = targetFront
      .normalize('NFC')
      .trim()
      .toLowerCase()
      .replace(/\s+/g, '');

    // Khớp chữ Hán bỏ khoảng trắng
    if (rawUserClean === rawTargetClean) return true;

    // Kiểm tra Pinyin
    if (targetPhonetic) {
      const phoneticSegments = targetPhonetic
        .split(/[;,\/|]/)
        .map((s) => s.trim())
        .filter(Boolean);

      for (const seg of phoneticSegments) {
        const normPinyin = normalizeText(seg);
        const normPinyinCompact = normPinyin.replace(/\s+/g, '');

        // A. Khớp Pinyin có dấu (có hoặc không có khoảng trắng)
        if (normUser === normPinyin) return true;
        if (rawUserClean === normPinyinCompact) return true;

        // B. Khớp Pinyin không dấu
        const userNoTone = removePinyinTones(normUser).replace(/\s+/g, '');
        const pinyinNoTone = removePinyinTones(normPinyin).replace(/\s+/g, '');

        if (userNoTone && pinyinNoTone) {
          if (userNoTone === pinyinNoTone) return true;

          // Xử lý biến thể ü -> v và ü -> u (ví dụ lǚ -> lv, lu, lü)
          const userV = userNoTone.replace(/[üu]/g, 'v');
          const pinyinV = pinyinNoTone.replace(/[üu]/g, 'v');
          if (userV === pinyinV) return true;

          const userU = userNoTone.replace(/[üv]/g, 'u');
          const pinyinU = pinyinNoTone.replace(/[üv]/g, 'u');
          if (userU === pinyinU) return true;

          // Dung sai 1 ký tự lỗi chính tả cho Pinyin dài (>= 5 ký tự)
          if (userNoTone.length >= 5 && pinyinNoTone.length >= 5) {
            if (levenshteinDistance(userNoTone, pinyinNoTone) <= 1) {
              return true;
            }
          }
        }
      }
    }
  } else {
    // TIẾNG ANH
    // Bỏ mạo từ: a, an, the, to ở đầu từ
    const stripArticles = (s: string) =>
      s.replace(/^(a|an|the|to)\s+/i, '').trim();

    const userClean = stripArticles(normUser);
    const targetClean = stripArticles(normTarget);

    if (userClean === targetClean) return true;

    // Dung sai 1 ký tự gõ nhầm cho từ tiếng Anh dài >= 5
    if (userClean.length >= 5 && targetClean.length >= 5) {
      if (levenshteinDistance(userClean, targetClean) <= 1) {
        return true;
      }
    }
  }

  return false;
}
