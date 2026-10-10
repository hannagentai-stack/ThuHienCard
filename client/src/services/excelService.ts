import * as XLSX from 'xlsx';
import { pinyin } from 'pinyin-pro';
import { type Card, type Deck } from '../types';

export interface ColumnMapping {
  front: string;
  back: string;
  phonetic: string;
  wordType: string;
  example: string;
  exampleTrans: string;
  notes: string;
  level: string;
  tags: string;
}

// 1. Tự động dự đoán ghép cột dựa trên tên tiêu đề (Anh/Việt/Trung)
export const guessColumnMapping = (headers: string[]): ColumnMapping => {
  const mapping: ColumnMapping = {
    front: '',
    back: '',
    phonetic: '',
    wordType: '',
    example: '',
    exampleTrans: '',
    notes: '',
    level: '',
    tags: '',
  };

  const normalize = (s: string) => s.toLowerCase().trim().replace(/[\s_-]+/g, '');

  headers.forEach((h) => {
    const norm = normalize(h);

    if (!mapping.front && (norm.includes('mat_truoc') || norm.includes('mattruoc') || norm.includes('front') || norm.includes('tu') || norm.includes('word') || norm.includes('hantu') || norm.includes('chuhan') || norm.includes('生词') || norm.includes('单词'))) {
      mapping.front = h;
    } else if (!mapping.back && (norm.includes('mat_sau') || norm.includes('matsau') || norm.includes('back') || norm.includes('nghia') || norm.includes('meaning') || norm.includes('dich') || norm.includes('tiengviet') || norm.includes('释义'))) {
      mapping.back = h;
    } else if (!mapping.phonetic && (norm.includes('pinyin') || norm.includes('phienam') || norm.includes('ipa') || norm.includes('binham') || norm.includes('phonetic') || norm.includes('拼音'))) {
      mapping.phonetic = h;
    } else if (!mapping.wordType && (norm.includes('loaitu') || norm.includes('tuloai') || norm.includes('partofspeech') || norm.includes('pos') || norm.includes('type') || norm.includes('词性'))) {
      mapping.wordType = h;
    } else if (!mapping.exampleTrans && (norm.includes('dichvidu') || norm.includes('nghiavidu') || norm.includes('exampletrans') || norm.includes('translation') || norm.includes('例句翻译'))) {
      mapping.exampleTrans = h;
    } else if (!mapping.example && (norm.includes('vidu') || norm.includes('example') || norm.includes('cauvidu') || norm.includes('sentence') || norm.includes('例句'))) {
      mapping.example = h;
    } else if (!mapping.notes && (norm.includes('ghichu') || norm.includes('notes') || norm.includes('meonho') || norm.includes('mnemonic') || norm.includes('备注'))) {
      mapping.notes = h;
    } else if (!mapping.level && (norm.includes('capdo') || norm.includes('level') || norm.includes('hsk') || norm.includes('cefr') || norm.includes('rank') || norm.includes('等级'))) {
      mapping.level = h;
    } else if (!mapping.tags && (norm.includes('the') || norm.includes('tags') || norm.includes('nhan') || norm.includes('chude') || norm.includes('tag') || norm.includes('标签'))) {
      mapping.tags = h;
    }
  });

  // Nếu vẫn chưa tìm thấy front/back, lấy cột đầu tiên và thứ hai theo mặc định
  if (!mapping.front && headers.length > 0) mapping.front = headers[0];
  if (!mapping.back && headers.length > 1) mapping.back = headers[1];
  if (!mapping.phonetic && headers.length > 2) mapping.phonetic = headers[2];

  return mapping;
};

// 2. Tự động sinh Pinyin cho chữ Hán nếu thiếu
export const autoGeneratePinyin = (text: string): string => {
  try {
    return pinyin(text, { toneType: 'symbol' });
  } catch {
    return '';
  }
};

// 3. Đọc tệp Excel (.xlsx, .xls, .csv)
export const parseExcelFile = async (
  file: File
): Promise<{ sheetNames: string[]; sheetsData: Record<string, any[]> }> => {
  const data = await file.arrayBuffer();
  const workbook = XLSX.read(data, { type: 'array' });

  const sheetNames = workbook.SheetNames;
  const sheetsData: Record<string, any[]> = {};

  sheetNames.forEach((name) => {
    const worksheet = workbook.Sheets[name];
    sheetsData[name] = XLSX.utils.sheet_to_json(worksheet, { defval: '' });
  });

  return { sheetNames, sheetsData };
};

// 4. Đọc dữ liệu dán trực tiếp (từ Excel/Google Sheets hoặc "từ - nghĩa")
export const parsePastedText = (rawText: string, language: 'zh' | 'en'): any[] => {
  const lines = rawText.split(/\r?\n/).filter((l) => l.trim().length > 0);
  const rows: any[] = [];

  for (const line of lines) {
    if (line.includes('\t')) {
      // Tab-separated (copy từ Excel / Sheets)
      const parts = line.split('\t').map((p) => p.trim());
      rows.push({
        front: parts[0] || '',
        back: parts[1] || '',
        phonetic: parts[2] || '',
        wordType: parts[3] || '',
        example: parts[4] || '',
      });
    } else if (line.includes(' - ') || line.includes(' : ') || line.includes(':')) {
      // Định dạng "từ - nghĩa" hoặc "từ: nghĩa"
      const separator = line.includes(' - ') ? ' - ' : line.includes(' : ') ? ' : ' : ':';
      const parts = line.split(separator).map((p) => p.trim());
      const front = parts[0] || '';
      const back = parts.slice(1).join(' - ') || '';
      rows.push({
        front,
        back,
        phonetic: language === 'zh' ? autoGeneratePinyin(front) : '',
      });
    }
  }

  return rows;
};

// 5. Tải file Excel mẫu (Template) có sẵn cột và dữ liệu mẫu
export const downloadTemplate = (language: 'zh' | 'en') => {
  let headers: string[] = [];
  let sampleData: any[] = [];
  let filename = '';

  if (language === 'zh') {
    headers = [
      'Mặt trước (Hán tự)',
      'Mặt sau (Nghĩa Việt)',
      'Phiên âm (Pinyin)',
      'Loại từ',
      'Câu ví dụ',
      'Dịch câu ví dụ',
      'Ghi chú',
      'Cấp độ (HSK)',
      'Thẻ (Tags)',
    ];
    sampleData = [
      {
        'Mặt trước (Hán tự)': '苹果',
        'Mặt sau (Nghĩa Việt)': 'Quả táo',
        'Phiên âm (Pinyin)': 'píng guǒ',
        'Loại từ': 'Danh từ',
        'Câu ví dụ': '我喜欢吃苹果。',
        'Dịch câu ví dụ': 'Tôi thích ăn táo.',
        'Ghi chú': 'Bộ Thảo đầu 艹',
        'Cấp độ (HSK)': 'HSK1',
        'Thẻ (Tags)': 'Hoa quả, Đồ ăn',
      },
      {
        'Mặt trước (Hán tự)': '喝水',
        'Mặt sau (Nghĩa Việt)': 'Uống nước',
        'Phiên âm (Pinyin)': 'hē shuǐ',
        'Loại từ': 'Cụm động từ',
        'Câu ví dụ': '多喝水对身体好。',
        'Dịch câu ví dụ': 'Uống nhiều nước tốt cho sức khỏe.',
        'Ghi chú': 'Bộ Khẩu 口 trong chữ Uống',
        'Cấp độ (HSK)': 'HSK1',
        'Thẻ (Tags)': 'Hàng ngày',
      },
    ];
    filename = 'Mau_Nhap_The_Tieng_Trung_HSK_Sakura.xlsx';
  } else {
    headers = [
      'Mặt trước (Từ vựng)',
      'Mặt sau (Nghĩa Việt)',
      'Phiên âm (IPA)',
      'Loại từ',
      'Câu ví dụ',
      'Dịch câu ví dụ',
      'Ghi chú',
      'Cấp độ (CEFR)',
      'Thẻ (Tags)',
    ];
    sampleData = [
      {
        'Mặt trước (Từ vựng)': 'Ephemeral',
        'Mặt sau (Nghĩa Việt)': 'Phù du, chóng tàn',
        'Phiên âm (IPA)': '/ɪˈfem.ər.əl/',
        'Loại từ': 'Adjective',
        'Câu ví dụ': 'Fame in the digital age can be ephemeral.',
        'Dịch câu ví dụ': 'Sự nổi tiếng trong thời đại số có thể rất chóng tàn.',
        'Ghi chú': 'Đồng nghĩa: short-lived',
        'Cấp độ (CEFR)': 'C1',
        'Thẻ (Tags)': 'Nâng cao, Cảm xúc',
      },
      {
        'Mặt trước (Từ vựng)': 'Resilience',
        'Mặt sau (Nghĩa Việt)': 'Khả năng phục hồi, kiên cường',
        'Phiên âm (IPA)': '/rɪˈzɪl.jəns/',
        'Loại từ': 'Noun',
        'Câu ví dụ': 'He showed great resilience during difficult times.',
        'Dịch câu ví dụ': 'Anh ấy đã thể hiện sự kiên cường tuyệt vời trong lúc khó khăn.',
        'Ghi chú': 'Tính từ: resilient',
        'Cấp độ (CEFR)': 'B2',
        'Thẻ (Tags)': 'Tính cách',
      },
    ];
    filename = 'Mau_Nhap_The_Tieng_Anh_Oxford_Sakura.xlsx';
  }

  const worksheet = XLSX.utils.json_to_sheet(sampleData, { header: headers });
  const workbook = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(workbook, worksheet, 'Flashcards');
  XLSX.writeFile(workbook, filename);
};

// 6. Xuất bộ thẻ ra file (Excel / CSV / JSON)
export const exportDeck = (deck: Deck, format: 'xlsx' | 'csv' | 'json') => {
  const cards = deck.cards || [];
  const safeTitle = deck.title.replace(/[/\\?%*:|"<>]/g, '_');

  if (format === 'json') {
    const jsonStr = JSON.stringify(deck, null, 2);
    const blob = new Blob([jsonStr], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${safeTitle}_backup.json`;
    a.click();
    URL.revokeObjectURL(url);
    return;
  }

  const exportRows = cards.map((c: Card) => ({
    'Mặt trước': c.front,
    'Mặt sau': c.back,
    'Phiên âm': c.phonetic || '',
    'Loại từ': c.wordType || '',
    'Câu ví dụ': c.example || '',
    'Dịch ví dụ': c.exampleTrans || '',
    'Ghi chú': c.notes || '',
    'Cấp độ': c.level || '',
    'Thẻ (Tags)': c.tagsJson ? (Array.isArray(JSON.parse(c.tagsJson || '[]')) ? JSON.parse(c.tagsJson).join(', ') : '') : '',
    'Trạng thái SRS': c.schedule?.state || 'new',
  }));

  const worksheet = XLSX.utils.json_to_sheet(exportRows);
  const workbook = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(workbook, worksheet, 'Cards');

  if (format === 'csv') {
    XLSX.writeFile(workbook, `${safeTitle}.csv`, { bookType: 'csv' });
  } else {
    XLSX.writeFile(workbook, `${safeTitle}.xlsx`, { bookType: 'xlsx' });
  }
};
