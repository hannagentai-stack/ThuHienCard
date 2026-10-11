import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

async function main() {
  console.log('🌸 [QA TEST] Bắt đầu khởi tạo dữ liệu kiểm thử chế độ luyện tập...');

  // 1. Tạo người dùng demo
  const passwordHash = await bcrypt.hash('password123', 10);
  const user = await prisma.user.upsert({
    where: { username: 'demo' },
    update: {},
    create: {
      username: 'demo',
      passwordHash,
      displayName: 'Học Viên Thu Hiền EDU 🌸',
      avatar: 'bunny_pink',
      dailyGoal: 20,
    },
  });

  console.log(`👤 Người dùng: ${user.username} (${user.id})`);

  // Helper tạo bộ thẻ
  async function getOrCreateDeck(title: string, language: string, color: string, icon: string) {
    let deck = await prisma.deck.findFirst({
      where: { userId: user.id, title, isDeleted: false },
    });
    if (!deck) {
      deck = await prisma.deck.create({
        data: {
          userId: user.id,
          title,
          language,
          color,
          icon,
        },
      });
      console.log(`📁 Đã tạo bộ thẻ: "${title}"`);
    } else {
      console.log(`📁 Bộ thẻ đã tồn tại: "${title}"`);
    }
    return deck;
  }

  // --- BỘ 1: 50 THẺ TIẾNG TRUNG ---
  const zh50Deck = await getOrCreateDeck('50 Từ Vựng HSK 1 Tiếng Trung 🇨🇳', 'zh', '#FF5C9E', '🇨🇳');
  const existingZhCount = await prisma.card.count({ where: { deckId: zh50Deck.id, isDeleted: false } });
  if (existingZhCount < 50) {
    const zhWords = [
      ['你好', 'Xin chào', 'nǐ hǎo', 'Thán từ', '你好！', 'Xin chào!'],
      ['谢谢', 'Cảm ơn', 'xiè xie', 'Động từ', '太谢谢你了！', 'Cảm ơn bạn nhiều!'],
      ['再见', 'Tạm biệt', 'zài jiàn', 'Động từ', '明天见，再见！', 'Hẹn mai gặp!'],
      ['中国', 'Trung Quốc', 'zhōng guó', 'Danh từ', '我想去中国。', 'Tôi muốn đi TQ.'],
      ['朋友', 'Bạn bè', 'péng you', 'Danh từ', '我们是好朋友。', 'Chúng tôi là bạn tốt.'],
      ['学习', 'Học tập', 'xué xí', 'Động từ', '我喜欢学习汉语。', 'Tôi thích học tiếng Hán.'],
      ['喝茶', 'Uống trà', 'hē chá', 'Cụm ĐT', '请喝茶！', 'Xin mời uống trà!'],
      ['喜欢', 'Thích', 'xǐ huan', 'Động từ', '你喜欢猫吗？', 'Bạn có thích mèo không?'],
      ['高兴', 'Vui vẻ', 'gāo xìng', 'Tính từ', '今天我很高兴。', 'Hôm nay tôi rất vui.'],
      ['漂亮', 'Xinh đẹp', 'piào liang', 'Tính từ', '这朵花真漂亮！', 'Bông hoa này đẹp quá!'],
      ['苹果', 'Quả táo', 'píng guǒ', 'Danh từ', '吃苹果。', 'Ăn táo.'],
      ['米饭', 'Cơm', 'mǐ fàn', 'Danh từ', '我想吃米饭。', 'Tôi muốn ăn cơm.'],
      ['水', 'Nước', 'shuǐ', 'Danh từ', '多喝水。', 'Uống nhiều nước.'],
      ['爸爸', 'Bố', 'bà ba', 'Danh từ', '我爸爸是老师。', 'Bố tôi là giáo viên.'],
      ['妈妈', 'Mẹ', 'mā ma', 'Danh từ', '妈妈做饭很好吃。', 'Mẹ nấu ăn ngon.'],
      ['儿子', 'Con trai', 'ér zi', 'Danh từ', '他有一个儿子。', 'Anh ấy có 1 con trai.'],
      ['女儿', 'Con gái', 'nǚ ér', 'Danh từ', '女儿很可爱。', 'Con gái rất đáng yêu.'],
      ['老师', 'Thầy cô giáo', 'lǎo shī', 'Danh từ', '李老师好！', 'Chào thầy Lý!'],
      ['学生', 'Học sinh', 'xué sheng', 'Danh từ', '我是大学生。', 'Tôi là sinh viên.'],
      ['同学', 'Bạn cùng lớp', 'tóng xué', 'Danh từ', '这是我的同学。', 'Đây là bạn cùng lớp.'],
      ['医生', 'Bác sĩ', 'yī shēng', 'Danh từ', '他在医院当医生。', 'Anh ấy làm bác sĩ.'],
      ['猫', 'Con mèo', 'māo', 'Danh từ', '那只猫很白。', 'Con mèo đó rất trắng.'],
      ['狗', 'Con chó', 'gǒu', 'Danh từ', '我家有一只小狗。', 'Nhà tôi có một con cún.'],
      ['天气', 'Thời tiết', 'tiān qì', 'Danh từ', '今天天气很好。', 'Hôm nay thời tiết đẹp.'],
      ['下雨', 'Mưa', 'xià yǔ', 'Động từ', '外面下雨了。', 'Bên ngoài trời mưa rồi.'],
      ['明天', 'Ngày mai', 'míng tiān', 'Danh từ', '明天星期一。', 'Ngày mai là thứ 2.'],
      ['今天', 'Hôm nay', 'jīn tiān', 'Danh từ', '今天天气不错。', 'Hôm nay trời đẹp.'],
      ['昨天', 'Hôm qua', 'zuó tiān', 'Danh từ', '昨天你去哪儿了？', 'Hôm qua bạn đi đâu?'],
      ['上午', 'Buổi sáng', 'shàng wǔ', 'Danh từ', '上午我有课。', 'Buổi sáng tôi có tiết.'],
      ['中午', 'Buổi trưa', 'zhōng wǔ', 'Danh từ', '中午一起吃饭吧。', 'Trưa cùng ăn cơm nhé.'],
      ['下午', 'Buổi chiều', 'xià wǔ', 'Danh từ', '下午去买东西。', 'Chiều đi mua đồ.'],
      ['晚上', 'Buổi tối', 'wǎn shang', 'Danh từ', '晚上看电视。', 'Tối xem ti vi.'],
      ['年', 'Năm', 'nián', 'Lượng từ', '我学汉语一年了。', 'Tôi học tiếng Hán 1 năm.'],
      ['月', 'Tháng', 'yuè', 'Danh từ', '五月一日。', 'Ngày 1 tháng 5.'],
      ['日', 'Ngày', 'rì', 'Danh từ', '今天几月几日？', 'Hôm nay ngày mấy tháng mấy?'],
      ['星期', 'Tuần', 'xīng qī', 'Danh từ', '一个星期有七天。', 'Một tuần có 7 ngày.'],
      ['看书', 'Đọc sách', 'kàn shū', 'Cụm ĐT', '他在图书馆看书。', 'Anh ấy đọc sách.'],
      ['听音乐', 'Nghe nhạc', 'tīng yīn yuè', 'Cụm ĐT', '我喜欢听音乐。', 'Tôi thích nghe nhạc.'],
      ['买东西', 'Mua sắm', 'mǎi dōng xi', 'Cụm ĐT', '去超市买东西。', 'Đi siêu thị mua sắm.'],
      ['工作', 'Làm việc', 'gōng zuò', 'Động từ', '努力工作。', 'Làm việc chăm chỉ.'],
      ['回家', 'Về nhà', 'huí jiā', 'Cụm ĐT', '我想早点回家。', 'Tôi muốn về nhà sớm.'],
      ['睡觉', 'Đi ngủ', 'shuì jiào', 'Động từ', '早点睡觉。', 'Ngủ sớm đi.'],
      ['起床', 'Thức dậy', 'qǐ chuáng', 'Động từ', '早上六点起床。', '6h sáng thức dậy.'],
      ['桌子', 'Cái bàn', 'zhuō zi', 'Danh từ', '桌子上有一本书。', 'Trên bàn có quyển sách.'],
      ['椅子', 'Cái ghế', 'yǐ zi', 'Danh từ', '请坐在这把椅子上。', 'Mời ngồi lên ghế này.'],
      ['电脑', 'Máy tính', 'diàn nǎo', 'Danh từ', '他在用电脑工作。', 'Anh ấy đang dùng máy tính.'],
      ['手机', 'Điện thoại', 'shǒu jī', 'Danh từ', '我的手机响了。', 'Điện thoại tôi reo.'],
      ['杯子', 'Cái cốc', 'bēi zi', 'Danh từ', '这个杯子很漂亮。', 'Cái cốc này đẹp quá.'],
      ['钱', 'Tiền', 'qián', 'Danh từ', '这个多少钱？', 'Cái này bao nhiêu tiền?'],
      ['汉语', 'Tiếng Trung', 'hàn yǔ', 'Danh từ', '学汉语很有意思。', 'Học tiếng Trung thú vị.'],
    ];

    for (let i = existingZhCount; i < zhWords.length; i++) {
      const [front, back, phonetic, wordType, example, exampleTrans] = zhWords[i];
      const card = await prisma.card.create({
        data: {
          deckId: zh50Deck.id,
          front,
          back,
          phonetic,
          wordType,
          example,
          exampleTrans,
          level: 'HSK1',
          tagsJson: JSON.stringify(['HSK1', 'Test50']),
        },
      });
      await prisma.cardSchedule.create({
        data: {
          cardId: card.id,
          state: i < 5 ? 'new' : 'review',
          due: new Date(),
          stability: 2.0,
          difficulty: 3.0,
          reps: 2,
          lapses: i === 0 || i === 1 ? 2 : 0, // 2 thẻ khó
        },
      });
    }
    console.log(`✅ Đã nạp đủ 50 thẻ tiếng Trung vào bộ "${zh50Deck.title}"!`);
  }

  // --- BỘ 2: 50 THẺ TIẾNG ANH ---
  const en50Deck = await getOrCreateDeck('50 Từ Vựng Tiếng Anh Oxford 🇬🇧', 'en', '#A855F7', '🇬🇧');
  const existingEnCount = await prisma.card.count({ where: { deckId: en50Deck.id, isDeleted: false } });
  if (existingEnCount < 50) {
    const enWords = [
      ['Serendipity', 'Sự tình cờ may mắn', '/ˌser.ənˈdɪp.ə.ti/', 'Noun'],
      ['Effortless', 'Dễ dàng, không tốn công', '/ˈef.ət.ləs/', 'Adjective'],
      ['Persevere', 'Kiên trì, bền chí', '/ˌpɜː.sɪˈvɪər/', 'Verb'],
      ['Brilliant', 'Xuất sắc, tài giỏi', '/ˈbrɪl.jənt/', 'Adjective'],
      ['Gratitude', 'Lòng biết ơn sâu sắc', '/ˈɡræt.ɪ.tjuːd/', 'Noun'],
      ['Enthusiastic', 'Nhiệt tình, hào hứng', '/ɪnˌθjuː.ziˈæs.tɪk/', 'Adjective'],
      ['Cherish', 'Trân trọng, yêu quý', '/ˈtʃer.ɪʃ/', 'Verb'],
      ['Resilient', 'Kiên cường, mau hồi phục', '/rɪˈzɪl.jənt/', 'Adjective'],
      ['Luminous', 'Sáng ngời, tỏa sáng', '/ˈluː.mɪ.nəs/', 'Adjective'],
      ['Wanderlust', 'Khao khát đi du lịch', '/ˈwɒn.də.lʌst/', 'Noun'],
      ['Courage', 'Lòng dũng cảm', '/ˈkʌr.ɪdʒ/', 'Noun'],
      ['Harmony', 'Sự hòa hợp, êm ấm', '/ˈhɑː.mə.ni/', 'Noun'],
      ['Inspire', 'Truyền cảm hứng', '/ɪnˈspaɪər/', 'Verb'],
      ['Kindness', 'Lòng tốt, sự tử tế', '/ˈkaɪnd.nəs/', 'Noun'],
      ['Mindful', 'Chánh niệm, tỉnh thức', '/ˈmaɪnd.fəl/', 'Adjective'],
      ['Nourish', 'Nuôi dưỡng, bồi bổ', '/ˈnʌr.ɪʃ/', 'Verb'],
      ['Optimism', 'Sự lạc quan', '/ˈɒp.tɪ.mɪ.zəm/', 'Noun'],
      ['Passion', 'Niềm đam mê', '/ˈpæʃ.ən/', 'Noun'],
      ['Radiant', 'Rạng rỡ, tỏa nắng', '/ˈreɪ.di.ənt/', 'Adjective'],
      ['Serenity', 'Sự thanh bình, tĩnh lặng', '/səˈren.ə.ti/', 'Noun'],
      ['Tranquil', 'Yên bình, thanh thản', '/ˈtræŋ.kwɪl/', 'Adjective'],
      ['Uplift', 'Nâng cao tinh thần', '/ʌpˈlɪft/', 'Verb'],
      ['Vibrant', 'Sôi động, tràn trề sức sống', '/ˈvaɪ.brənt/', 'Adjective'],
      ['Wisdom', 'Sự thông thái, trí tuệ', '/ˈwɪz.dəm/', 'Noun'],
      ['Zeal', 'Lòng sốt sắng, nhiệt huyết', '/ziːl/', 'Noun'],
      ['Abundance', 'Sự phong phú, dồi dào', '/əˈbʌn.dəns/', 'Noun'],
      ['Brave', 'Dũng cảm, gan dạ', '/breɪv/', 'Adjective'],
      ['Clarity', 'Sự rõ ràng, sáng suốt', '/ˈklær.ə.ti/', 'Noun'],
      ['Delight', 'Niềm vui sướng', '/dɪˈlaɪt/', 'Noun'],
      ['Empathy', 'Sự thấu cảm', '/ˈem.pə.θi/', 'Noun'],
      ['Flourish', 'Phát triển hưng thịnh', '/ˈflʌr.ɪʃ/', 'Verb'],
      ['Generous', 'Hào phóng, rộng lượng', '/ˈdʒen.ər.əs/', 'Adjective'],
      ['Honest', 'Trung thực, chân thật', '/ˈɒn.ɪst/', 'Adjective'],
      ['Insight', 'Cái nhìn sâu sắc', '/ˈɪn.saɪt/', 'Noun'],
      ['Joyful', 'Vui mừng, hân hoan', '/ˈdʒɔɪ.fəl/', 'Adjective'],
      ['Knowledge', 'Kiến thức, sự hiểu biết', '/ˈnɒl.ɪdʒ/', 'Noun'],
      ['Loyal', 'Trung thành', '/ˈlɔɪ.əl/', 'Adjective'],
      ['Miracle', 'Phép màu, điều kỳ diệu', '/ˈmɪr.ə.kəl/', 'Noun'],
      ['Noble', 'Cao quý, quý phái', '/ˈnəʊ.bəl/', 'Adjective'],
      ['Overcome', 'Vượt qua khó khăn', '/ˌəʊ.vəˈkʌm/', 'Verb'],
      ['Patience', 'Sự kiên nhẫn', '/ˈpeɪ.ʃəns/', 'Noun'],
      ['Quiet', 'Yên tĩnh, trầm lặng', '/ˈkwaɪ.ət/', 'Adjective'],
      ['Reliable', 'Đáng tin cậy', '/rɪˈlaɪ.ə.bəl/', 'Adjective'],
      ['Sincere', 'Chân thành, thật lòng', '/sɪnˈsɪər/', 'Adjective'],
      ['Thrive', 'Phát triển mạnh mẽ', '/θraɪv/', 'Verb'],
      ['Unique', 'Độc đáo, duy nhất', '/juːˈniːk/', 'Adjective'],
      ['Victory', 'Chiến thắng vang dội', '/ˈvɪk.tər.i/', 'Noun'],
      ['Warmth', 'Sự ấm áp, nồng hậu', '/wɔːmθ/', 'Noun'],
      ['Explore', 'Khám phá, thám hiểm', '/ɪkˈsplɔːr/', 'Verb'],
      ['Youthful', 'Trẻ trung, tươi trẻ', '/ˈjuːθ.fəl/', 'Adjective'],
    ];

    for (let i = existingEnCount; i < enWords.length; i++) {
      const [front, back, phonetic, wordType] = enWords[i];
      const card = await prisma.card.create({
        data: {
          deckId: en50Deck.id,
          front,
          back,
          phonetic,
          wordType,
          level: 'B1',
          tagsJson: JSON.stringify(['Oxford', 'Test50']),
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
    console.log(`✅ Đã nạp đủ 50 thẻ tiếng Anh vào bộ "${en50Deck.title}"!`);
  }

  // --- BỘ BIÊN: 0 THẺ ---
  await getOrCreateDeck('Bộ Thử Nghiệm 0 Thẻ ⚠️', 'zh', '#94A3B8', '📁');

  // --- BỘ BIÊN: 3 THẺ (THIẾU 1 THẺ CHO QUIZ) ---
  const deck3 = await getOrCreateDeck('Bộ Thử Nghiệm 3 Thẻ ⚠️', 'zh', '#F59E0B', '🧪');
  const count3 = await prisma.card.count({ where: { deckId: deck3.id, isDeleted: false } });
  if (count3 < 3) {
    const trio = [
      ['红色', 'Màu đỏ', 'hóng sè'],
      ['蓝色', 'Màu xanh da trời', 'lán sè'],
      ['绿色', 'Màu xanh lá cây', 'lǜ sè'],
    ];
    for (const [front, back, phonetic] of trio) {
      const c = await prisma.card.create({
        data: { deckId: deck3.id, front, back, phonetic },
      });
      await prisma.cardSchedule.create({
        data: { cardId: c.id, state: 'new', due: new Date() },
      });
    }
  }

  // --- BỘ BIÊN: 4 THẺ (VỪA ĐỦ ĐIỀU KIỆN QUIZ) ---
  const deck4 = await getOrCreateDeck('Bộ Thử Nghiệm 4 Thẻ ✅', 'zh', '#10B981', '🎯');
  const count4 = await prisma.card.count({ where: { deckId: deck4.id, isDeleted: false } });
  if (count4 < 4) {
    const quad = [
      ['春', 'Mùa xuân', 'chūn'],
      ['夏', 'Mùa hạ', 'xià'],
      ['秋', 'Mùa thu', 'qiū'],
      ['冬', 'Mùa đông', 'dōng'],
    ];
    for (const [front, back, phonetic] of quad) {
      const c = await prisma.card.create({
        data: { deckId: deck4.id, front, back, phonetic },
      });
      await prisma.cardSchedule.create({
        data: { cardId: c.id, state: 'new', due: new Date() },
      });
    }
  }

  // --- BỘ BIÊN: 5 THẺ TRÙNG NGHĨA ---
  const deckDup = await getOrCreateDeck('Bộ Thử Nghiệm 5 Thẻ Trùng Nghĩa 🔀', 'zh', '#8B5CF6', '🔀');
  const countDup = await prisma.card.count({ where: { deckId: deckDup.id, isDeleted: false } });
  if (countDup < 5) {
    const dups = [
      ['高兴', 'Vui vẻ', 'gāo xìng'],
      ['快乐', 'Vui vẻ', 'kuài lè'], // Trùng nghĩa tiếng Việt 'Vui vẻ'
      ['开心', 'Vui vẻ', 'kāi xīn'], // Trùng nghĩa tiếng Việt 'Vui vẻ'
      ['难过', 'Buồn bã', 'nán guò'],
      ['伤心', 'Đau lòng', 'shāng xīn'],
    ];
    for (const [front, back, phonetic] of dups) {
      const c = await prisma.card.create({
        data: { deckId: deckDup.id, front, back, phonetic },
      });
      await prisma.cardSchedule.create({
        data: { cardId: c.id, state: 'new', due: new Date() },
      });
    }
  }

  console.log('🎉 [QA TEST] Hoàn tất nạp dữ liệu kiểm thử toàn diện!');
}

main()
  .catch((e) => {
    console.error('Lỗi khi nạp seed QA test:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
