import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

async function main() {
  console.log('🌸 Bắt đầu nạp dữ liệu mẫu (Seeding)...');

  // 1. Tạo tài khoản Demo mặc định
  const passwordHash = await bcrypt.hash('password123', 10);
  const demoUser = await prisma.user.upsert({
    where: { username: 'demo' },
    update: {},
    create: {
      username: 'demo',
      passwordHash,
      displayName: 'Bạn Nhỏ Học Tiếng 🌸',
      avatar: 'bunny_pink',
      dailyGoal: 20,
      streakCount: 3,
      longestStreak: 5,
      streakFreezes: 2,
      xp: 450,
      level: 2,
    },
  });

  console.log(`✅ Đã tạo tài khoản demo: ${demoUser.username} (mật khẩu: password123)`);

  // 2. Bộ thẻ Tiếng Trung mẫu (10 từ HSK1 thông dụng)
  let zhDeck = await prisma.deck.findFirst({
    where: { userId: demoUser.id, language: 'zh' },
  });

  if (!zhDeck) {
    zhDeck = await prisma.deck.create({
      data: {
        userId: demoUser.id,
        title: '10 Từ Vựng HSK 1 Cơ Bản 🇨🇳',
        description: 'Các từ vựng tiếng Trung nhập môn thiết yếu kèm pinyin và ví dụ.',
        language: 'zh',
        color: '#FF5C9E',
        icon: '🇨🇳',
      },
    });

  const zhCards = [
    {
      front: '你好',
      back: 'Xin chào',
      phonetic: 'nǐ hǎo',
      wordType: 'Thán từ',
      example: '你好！很高兴认识你。',
      exampleTrans: 'Xin chào! Rất vui được quen biết bạn.',
      notes: 'Lời chào cơ bản nhất trong tiếng Trung.',
      level: 'HSK1',
    },
    {
      front: '谢谢',
      back: 'Cảm ơn',
      phonetic: 'xiè xie',
      wordType: 'Động từ',
      example: '太谢谢你了！',
      exampleTrans: 'Cảm ơn bạn nhiều lắm!',
      notes: 'Âm thứ 2 đọc thanh nhẹ.',
      level: 'HSK1',
    },
    {
      front: '再见',
      back: 'Tạm biệt',
      phonetic: 'zài jiàn',
      wordType: 'Động từ',
      example: '明天见，再见！',
      exampleTrans: 'Hẹn mai gặp, tạm biệt nhé!',
      notes: 'Tái kiến - hẹn gặp lại.',
      level: 'HSK1',
    },
    {
      front: '中国',
      back: 'Trung Quốc',
      phonetic: 'zhōng guó',
      wordType: 'Danh từ',
      example: '我想去中国旅游。',
      exampleTrans: 'Tôi muốn đi du lịch Trung Quốc.',
      notes: 'Trung Quốc - đất nước ở trung tâm.',
      level: 'HSK1',
    },
    {
      front: '朋友',
      back: 'Bạn bè',
      phonetic: 'péng you',
      wordType: 'Danh từ',
      example: '我们是好朋友。',
      exampleTrans: 'Chúng ta là bạn tốt của nhau.',
      notes: 'Bộ Nguyệt 月 ghép đôi.',
      level: 'HSK1',
    },
    {
      front: '学习',
      back: 'Học tập, học',
      phonetic: 'xué xí',
      wordType: 'Động từ',
      example: '我喜欢学习汉语。',
      exampleTrans: 'Tôi thích học tiếng Hán.',
      notes: 'Học tập.',
      level: 'HSK1',
    },
    {
      front: '喝茶',
      back: 'Uống trà',
      phonetic: 'hē chá',
      wordType: 'Cụm động từ',
      example: '请喝茶！',
      exampleTrans: 'Xin mời uống trà!',
      notes: 'Bộ Khẩu 口 trong chữ Uống (喝).',
      level: 'HSK1',
    },
    {
      front: '喜欢',
      back: 'Thích',
      phonetic: 'xǐ huan',
      wordType: 'Động từ',
      example: '你喜欢猫吗？',
      exampleTrans: 'Bạn có thích mèo không?',
      notes: 'Hỉ hoan.',
      level: 'HSK1',
    },
    {
      front: '高兴',
      back: 'Vui mừng, hạnh phúc',
      phonetic: 'gāo xìng',
      wordType: 'Tính từ',
      example: '今天我很高兴。',
      exampleTrans: 'Hôm nay tôi rất vui.',
      notes: 'Cao hứng.',
      level: 'HSK1',
    },
    {
      front: '漂亮',
      back: 'Xinh đẹp, đẹp đẽ',
      phonetic: 'piào liang',
      wordType: 'Tính từ',
      example: '这朵花真漂亮！',
      exampleTrans: 'Bông hoa này thật xinh đẹp!',
      notes: 'Phiêu lượng.',
      level: 'HSK1',
    },
  ];

  for (const c of zhCards) {
    const card = await prisma.card.create({
      data: {
        deckId: zhDeck.id,
        front: c.front,
        back: c.back,
        phonetic: c.phonetic,
        wordType: c.wordType,
        example: c.example,
        exampleTrans: c.exampleTrans,
        notes: c.notes,
        level: c.level,
        tagsJson: JSON.stringify(['HSK1', 'Mẫu']),
      },
    });

    // Tạo lịch học FSRS ban đầu
    await prisma.cardSchedule.create({
      data: {
        cardId: card.id,
        state: 'new',
        due: new Date(),
        stability: 0,
        difficulty: 0,
        reps: 0,
        lapses: 0,
      },
    });
  }
}

  // 3. Bộ thẻ Tiếng Anh mẫu (10 từ Oxford 3000 thông dụng)
  let enDeck = await prisma.deck.findFirst({
    where: { userId: demoUser.id, language: 'en' },
  });

  if (!enDeck) {
    enDeck = await prisma.deck.create({
      data: {
        userId: demoUser.id,
        title: '10 Từ Vựng Tiếng Anh Giao Tiếp Hàng Ngày 🇬🇧',
        description: 'Từ vựng tiếng Anh cơ bản có phiên âm IPA và ví dụ thực tế.',
        language: 'en',
        color: '#A855F7',
        icon: '🇬🇧',
      },
    });

  const enCards = [
    {
      front: 'Serendipity',
      back: 'Sự tình cờ may mắn',
      phonetic: '/ˌser.ənˈdɪp.ə.ti/',
      wordType: 'Noun',
      example: 'Meeting you was pure serendipity.',
      exampleTrans: 'Gặp được bạn là một điều tình cờ may mắn tuyệt vời.',
      notes: 'Một trong những từ đẹp nhất trong tiếng Anh.',
      level: 'B2',
    },
    {
      front: 'Effortless',
      back: 'Dễ dàng, không tốn công sức',
      phonetic: '/ˈef.ət.ləs/',
      wordType: 'Adjective',
      example: 'She made learning English look effortless.',
      exampleTrans: 'Cô ấy khiến việc học tiếng Anh trông thật nhẹ nhàng và dễ dàng.',
      notes: 'Gốc từ Effort (nỗ lực) + less (không).',
      level: 'B1',
    },
    {
      front: 'Persevere',
      back: 'Kiên trì, bền chí',
      phonetic: '/ˌpɜː.sɪˈvɪər/',
      wordType: 'Verb',
      example: 'If you persevere with flashcards, your vocabulary will soar.',
      exampleTrans: 'Nếu bạn kiên trì với flashcard, vốn từ của bạn sẽ tăng vọt.',
      notes: 'Từ đồng nghĩa: persist.',
      level: 'B2',
    },
    {
      front: 'Brilliant',
      back: 'Xuất sắc, rực rỡ',
      phonetic: '/ˈbrɪl.jənt/',
      wordType: 'Adjective',
      example: 'That is a brilliant idea!',
      exampleTrans: 'Đó quả là một ý tưởng xuất sắc!',
      notes: 'Thường dùng trong văn nói người Anh.',
      level: 'A2',
    },
    {
      front: 'Gratitude',
      back: 'Lòng biết ơn',
      phonetic: '/ˈɡræt.ɪ.tjuːd/',
      wordType: 'Noun',
      example: 'Expressing gratitude daily improves happiness.',
      exampleTrans: 'Bày tỏ lòng biết ơn mỗi ngày giúp tăng cảm giác hạnh phúc.',
      notes: 'Tính từ: grateful.',
      level: 'B1',
    },
    {
      front: 'Enthusiastic',
      back: 'Hào hứng, nhiệt tình',
      phonetic: '/ɪnˌθjuː.ziˈæs.tɪk/',
      wordType: 'Adjective',
      example: 'The students are enthusiastic about the new app.',
      exampleTrans: 'Các học sinh rất hào hứng với ứng dụng mới.',
      notes: 'Đi kèm giới từ about.',
      level: 'B1',
    },
    {
      front: 'Cherish',
      back: 'Trân trọng, yêu mến',
      phonetic: '/ˈtʃer.ɪʃ/',
      wordType: 'Verb',
      example: 'Cherish every moment you spend learning.',
      exampleTrans: 'Hãy trân trọng từng khoảnh khắc bạn dành để học hỏi.',
      notes: 'Mang hàm ý cảm xúc ấm áp.',
      level: 'B2',
    },
    {
      front: 'Resilient',
      back: 'Kiên cường, có khả năng phục hồi nhanh',
      phonetic: '/rɪˈzɪl.jənt/',
      wordType: 'Adjective',
      example: 'Kids are often very resilient.',
      exampleTrans: 'Trẻ em thường rất kiên cường và mau thích nghi.',
      notes: 'Danh từ: resilience.',
      level: 'B2',
    },
    {
      front: 'Luminous',
      back: 'Sáng ngời, tỏa sáng',
      phonetic: '/ˈluː.mɪ.nəs/',
      wordType: 'Adjective',
      example: 'The stars were luminous in the night sky.',
      exampleTrans: 'Những vì sao sáng ngời trên bầu trời đêm.',
      notes: 'Gốc từ lumen (ánh sáng).',
      level: 'C1',
    },
    {
      front: 'Wanderlust',
      back: 'Niềm khao khát đi du lịch khám phá',
      phonetic: '/ˈwɒn.də.lʌst/',
      wordType: 'Noun',
      example: 'Her wanderlust led her to travel across Asia.',
      exampleTrans: 'Niềm đam mê xê dịch đã đưa cô đi du lịch khắp châu Á.',
      notes: 'Từ gốc tiếng Đức mượn vào tiếng Anh.',
      level: 'B2',
    },
  ];

  for (const c of enCards) {
    const card = await prisma.card.create({
      data: {
        deckId: enDeck.id,
        front: c.front,
        back: c.back,
        phonetic: c.phonetic,
        wordType: c.wordType,
        example: c.example,
        exampleTrans: c.exampleTrans,
        notes: c.notes,
        level: c.level,
        tagsJson: JSON.stringify(['Oxford', 'Mẫu']),
      },
    });

    await prisma.cardSchedule.create({
      data: {
        cardId: card.id,
        state: 'new',
        due: new Date(),
        stability: 0,
        difficulty: 0,
        reps: 0,
        lapses: 0,
      },
    });
  }
}

  console.log('🎉 Đã nạp thành công bộ thẻ tiếng Trung & tiếng Anh mẫu!');
}

main()
  .catch((e) => {
    console.error('Lỗi khi seed dữ liệu:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
