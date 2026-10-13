/**
 * Helper so sánh và kiểm tra đáp án gõ từ thông minh cho WebFlashCard:
 * - Chiều 1: Hiện ngoại ngữ (tiếng Trung/Anh) ➔ Nhập nghĩa tiếng Việt
 * - Chiều 2: Hiện nghĩa tiếng Việt ➔ Nhập ngoại ngữ (chữ Hán/Pinyin hoặc tiếng Anh)
 */

/**
 * Loại bỏ dấu thanh tiếng Việt (cho phép người dùng gõ không dấu vẫn được công nhận)
 */
export function removeVietnameseTones(str: string): string {
  return str
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[đĐ]/g, (m) => (m === 'đ' ? 'd' : 'D'));
}

/**
 * Chuẩn hóa chuỗi văn bản: chữ thường, bỏ dấu câu thừa, gom khoảng trắng
 */
export function normalizeText(str: string): string {
  if (!str) return '';
  return str
    .toLowerCase()
    .trim()
    .replace(/[.,;!?()（）"'/\\~`\-_[\]]/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}

/**
 * Loại bỏ dấu thanh Pinyin tiếng Trung (ā -> a, nǐ hǎo -> ni hao)
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
    .toLowerCase()
    .replace(/[āáǎàōóǒòēéěèīíǐìūúǔùǖǘǚǜü]/g, (char) => toneMap[char] || char);
}

/**
 * Kiểm tra câu trả lời nghĩa tiếng Việt của người dùng với nghĩa trong thẻ
 * Hỗ trợ:
 * - Khớp chính xác
 * - Khớp một trong các nghĩa phân tách bởi dấu `;`, `,`, `/`, `|`
 * - Bỏ qua các chú thích từ loại hoặc diễn giải trong ngoặc đơn `(...)`
 * - Chấp nhận cả gõ có dấu hoặc không dấu tiếng Việt
 */
export function checkVietnameseMeaningMatch(userInput: string, targetMeaning: string): boolean {
  const normUser = normalizeText(userInput);
  const normTarget = normalizeText(targetMeaning);
  if (!normUser || !normTarget) return false;

  // 1. Khớp chính xác chuỗi chuẩn hóa
  if (normUser === normTarget) return true;

  // 2. So sánh không dấu toàn bộ chuỗi
  const userNoTone = removeVietnameseTones(normUser);
  const targetNoTone = removeVietnameseTones(normTarget);
  if (userNoTone === targetNoTone) return true;

  // 3. Tách nghĩa theo các ký tự phân cách thông dụng trong từ điển (; , / |)
  const rawParts = targetMeaning.split(/[;,\/|]/);
  const candidates: string[] = [];

  for (const part of rawParts) {
    // Loại bỏ phần trong ngoặc giải thích: "(danh từ) mèo" -> "mèo"
    const cleaned = part.replace(/\([^)]*\)/g, '').replace(/\[[^\]]*\]/g, '');
    const normPart = normalizeText(cleaned);
    if (normPart) {
      candidates.push(normPart);
    }
  }

  for (const candidate of candidates) {
    // Khớp có dấu
    if (normUser === candidate) return true;
    // Khớp không dấu
    if (userNoTone === removeVietnameseTones(candidate)) return true;
  }

  // 4. Nếu target chứa chú thích ở đầu chuỗi: "(danh từ) bạn bè" -> kiểm tra "bạn bè"
  const cleanTargetOverall = normalizeText(
    targetMeaning.replace(/\([^)]*\)/g, '').replace(/\[[^\]]*\]/g, '')
  );
  if (cleanTargetOverall) {
    if (normUser === cleanTargetOverall) return true;
    if (userNoTone === removeVietnameseTones(cleanTargetOverall)) return true;
  }

  return false;
}

/**
 * Kiểm tra câu trả lời ngoại ngữ (Tiếng Trung hoặc Tiếng Anh)
 * - Với tiếng Trung: chấp nhận chữ Hán, Pinyin có dấu, Pinyin không dấu, Pinyin viết liền
 * - Với tiếng Anh: chấp nhận từ vựng (không phân biệt hoa thường, khoảng trắng)
 */
export function checkForeignWordMatch(
  userInput: string,
  targetFront: string,
  targetPhonetic?: string | null,
  lang: 'zh' | 'en' = 'zh'
): boolean {
  const normUser = normalizeText(userInput);
  const normTarget = normalizeText(targetFront);
  if (!normUser || !normTarget) return false;

  // Khớp trực tiếp mặt chữ
  if (normUser === normTarget) return true;

  if (lang === 'zh') {
    const rawUser = userInput.trim().toLowerCase();
    const rawTarget = targetFront.trim().toLowerCase();

    // Khớp nguyên bản chữ Hán (bỏ khoảng trắng)
    if (rawUser.replace(/\s+/g, '') === rawTarget.replace(/\s+/g, '')) return true;

    // Kiểm tra Pinyin nếu có
    if (targetPhonetic) {
      const normPhonetic = normalizeText(targetPhonetic);
      // Gõ đúng Pinyin có dấu (kèm hoặc không kèm dấu cách)
      if (normUser === normPhonetic) return true;
      if (normUser.replace(/\s+/g, '') === normPhonetic.replace(/\s+/g, '')) return true;

      // Gõ Pinyin không dấu
      const userNoTone = removePinyinTones(normUser).replace(/\s+/g, '');
      const phoneticNoTone = removePinyinTones(normPhonetic).replace(/\s+/g, '');
      if (userNoTone && userNoTone === phoneticNoTone) return true;
    }
  }

  return false;
}
