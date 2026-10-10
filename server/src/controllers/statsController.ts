import { Response } from 'express';
import { prisma } from '../db';
import { AuthRequest } from '../middlewares/authMiddleware';

// 1. Tổng quan thống kê người dùng (Summary Stats)
export const getSummaryStats = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const userId = req.user?.userId;
    if (!userId) {
      res.status(401).json({ success: false, message: 'Chưa xác thực.' });
      return;
    }

    const user = await prisma.user.findUnique({
      where: { id: userId },
    });

    if (!user) {
      res.status(404).json({ success: false, message: 'Người dùng không tồn tại.' });
      return;
    }

    // Đếm số thẻ hôm nay đã học
    const todayStr = new Date().toISOString().slice(0, 10);
    const startOfToday = new Date(`${todayStr}T00:00:00.000Z`);

    const todayReviews = await prisma.reviewLog.count({
      where: {
        userId,
        reviewedAt: { gte: startOfToday },
      },
    });

    // Đếm tổng số thẻ trong tất cả bộ
    const totalCards = await prisma.card.count({
      where: { isDeleted: false, deck: { userId } },
    });

    // Đếm tổng số lượt ôn tập từ trước đến nay
    const totalReviews = await prisma.reviewLog.count({
      where: { userId },
    });

    // Phân bố trạng thái thẻ (New, Learning, Review, Relearning)
    const cards = await prisma.card.findMany({
      where: { isDeleted: false, deck: { userId } },
      include: { schedule: true },
    });

    let newCount = 0;
    let learningCount = 0;
    let reviewCount = 0;
    let relearningCount = 0;

    for (const c of cards) {
      const state = c.schedule?.state || 'new';
      if (state === 'new') newCount++;
      else if (state === 'learning') learningCount++;
      else if (state === 'review') reviewCount++;
      else if (state === 'relearning') relearningCount++;
    }

    res.json({
      success: true,
      stats: {
        streakCount: user.streakCount,
        longestStreak: user.longestStreak,
        streakFreezes: user.streakFreezes,
        xp: user.xp,
        level: user.level,
        dailyGoal: user.dailyGoal,
        todayReviews,
        todayProgress: Math.min(100, Math.round((todayReviews / user.dailyGoal) * 100)),
        totalCards,
        totalReviews,
        distribution: {
          new: newCount,
          learning: learningCount,
          review: reviewCount,
          relearning: relearningCount,
        },
      },
    });
  } catch (error) {
    console.error('Lỗi lấy thống kê tổng quan:', error);
    res.status(500).json({ success: false, message: 'Lỗi tải thống kê tổng quan.' });
  }
};

// 2. Dự báo số thẻ đến hạn trong 7 ngày & 30 ngày tới (Review Forecast)
export const getForecastStats = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const userId = req.user?.userId;
    const cards = await prisma.card.findMany({
      where: {
        isDeleted: false,
        deck: { userId },
        schedule: { isSuspended: false },
      },
      include: { schedule: true },
    });

    const now = new Date();
    const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());

    // Mảng 30 ngày tới
    const forecastMap = new Map<string, number>();
    for (let i = 0; i < 30; i++) {
      const d = new Date(today);
      d.setDate(d.getDate() + i);
      const key = d.toISOString().slice(0, 10);
      forecastMap.set(key, 0);
    }

    // Gom số thẻ đến hạn vào từng ngày
    for (const c of cards) {
      if (!c.schedule) continue;
      const dueDate = new Date(c.schedule.due);
      // Nếu thẻ đã quá hạn trong quá khứ -> tính dồn vào ngày hôm nay
      const dueDay = dueDate < today ? today : new Date(dueDate.getFullYear(), dueDate.getMonth(), dueDate.getDate());
      const key = dueDay.toISOString().slice(0, 10);
      if (forecastMap.has(key)) {
        forecastMap.set(key, (forecastMap.get(key) || 0) + 1);
      }
    }

    const forecastData = Array.from(forecastMap.entries()).map(([date, count]) => {
      const d = new Date(date);
      const dayLabel = `${d.getDate()}/${d.getMonth() + 1}`;
      return { date, dayLabel, count };
    });

    res.json({
      success: true,
      forecast: forecastData,
      next7Days: forecastData.slice(0, 7),
      next30Days: forecastData,
    });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Lỗi tải dữ liệu dự báo ôn tập.' });
  }
};

// 3. Activity Heatmap 12 tháng (cường độ học theo ngày kiểu GitHub)
export const getHeatmapStats = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const userId = req.user?.userId;
    const oneYearAgo = new Date();
    oneYearAgo.setFullYear(oneYearAgo.getFullYear() - 1);

    const logs = await prisma.reviewLog.findMany({
      where: {
        userId,
        reviewedAt: { gte: oneYearAgo },
      },
      select: { reviewedAt: true, rating: true },
    });

    const heatmapMap = new Map<string, number>();

    for (const log of logs) {
      const dateKey = log.reviewedAt.toISOString().slice(0, 10);
      heatmapMap.set(dateKey, (heatmapMap.get(dateKey) || 0) + 1);
    }

    const heatmapData = Array.from(heatmapMap.entries()).map(([date, count]) => ({
      date,
      count,
      level: count >= 30 ? 4 : count >= 15 ? 3 : count >= 5 ? 2 : count > 0 ? 1 : 0,
    }));

    res.json({
      success: true,
      heatmap: heatmapData,
      totalActiveDays: heatmapData.length,
    });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Lỗi tải biểu đồ Heatmap.' });
  }
};

// 4. Danh sách Huy hiệu (Badges) & Tỉ lệ nhớ (Retention Rate)
export const getBadgesAndRetention = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const userId = req.user?.userId;
    const user = await prisma.user.findUnique({
      where: { id: userId },
      include: { userBadges: true },
    });

    if (!user) {
      res.status(404).json({ success: false, message: 'Người dùng không tồn tại.' });
      return;
    }

    // Tính toán Tỉ lệ nhớ Retention = (Good + Easy) / Tổng lượt ôn
    const allLogs = await prisma.reviewLog.findMany({
      where: { userId },
      select: { rating: true },
    });

    const totalReviews = allLogs.length;
    const correctReviews = allLogs.filter((l) => l.rating >= 3).length;
    const retentionRate = totalReviews > 0 ? Math.round((correctReviews / totalReviews) * 100) : 100;

    // Danh sách các danh hiệu/huy hiệu hệ thống
    const systemBadges = [
      {
        id: 'first_step',
        title: 'Bước Đầu Tiên',
        desc: 'Hoàn thành lượt ôn tập flashcard đầu tiên',
        icon: '🌱',
        isUnlocked: totalReviews >= 1,
        progress: Math.min(1, totalReviews / 1),
      },
      {
        id: 'streak_3',
        title: 'Bền Bỉ 3 Ngày',
        desc: 'Duy trì chuỗi học liên tục trong 3 ngày',
        icon: '🔥',
        isUnlocked: user.longestStreak >= 3,
        progress: Math.min(1, user.streakCount / 3),
      },
      {
        id: 'streak_7',
        title: 'Ngọn Lửa 7 Ngày',
        desc: 'Học liên tục suốt 1 tuần không gián đoạn',
        icon: '⚡',
        isUnlocked: user.longestStreak >= 7,
        progress: Math.min(1, user.streakCount / 7),
      },
      {
        id: 'streak_30',
        title: 'Thói Quen Vàng 30 Ngày',
        desc: 'Duy trì học tập liên tục suốt 1 tháng',
        icon: '👑',
        isUnlocked: user.longestStreak >= 30,
        progress: Math.min(1, user.streakCount / 30),
      },
      {
        id: 'cards_50',
        title: 'Tích Lũy 50 Thẻ',
        desc: 'Ôn tập tích lũy được 50 lượt thẻ vựng',
        icon: '📚',
        isUnlocked: totalReviews >= 50,
        progress: Math.min(1, totalReviews / 50),
      },
      {
        id: 'cards_100',
        title: 'Kho Từ Vựng 100 Thẻ',
        desc: 'Chinh phục 100 lượt ôn tập từ vựng',
        icon: '🏆',
        isUnlocked: totalReviews >= 100,
        progress: Math.min(1, totalReviews / 100),
      },
      {
        id: 'hanzi_master',
        title: 'Bút Thần Chữ Hán',
        desc: 'Luyện viết nét Hán tự qua Hanzi Writer',
        icon: '✍️',
        isUnlocked: true, // Đã trải nghiệm
        progress: 1,
      },
      {
        id: 'freeze_saver',
        title: 'Đóng Băng Thông Thái',
        desc: 'Sở hữu ít nhất 2 lượt Streak Freeze dự phòng',
        icon: '❄️',
        isUnlocked: user.streakFreezes >= 2,
        progress: Math.min(1, user.streakFreezes / 2),
      },
    ];

    res.json({
      success: true,
      retentionRate,
      totalReviews,
      correctReviews,
      badges: systemBadges,
    });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Lỗi tải danh hiệu và tỉ lệ nhớ.' });
  }
};

// 5. Đổi XP lấy thêm lượt Streak Freeze (Đóng băng chuỗi học)
export const buyStreakFreeze = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const userId = req.user?.userId;
    const user = await prisma.user.findUnique({ where: { id: userId } });

    if (!user) {
      res.status(404).json({ success: false, message: 'Người dùng không tồn tại.' });
      return;
    }

    const COST_XP = 150;
    if (user.xp < COST_XP) {
      res.status(400).json({
        success: false,
        message: `Bạn cần ít nhất ${COST_XP} XP để đổi 1 lượt đóng băng chuỗi (Hiện có: ${user.xp} XP).`,
      });
      return;
    }

    const updated = await prisma.user.update({
      where: { id: userId },
      data: {
        xp: { decrement: COST_XP },
        streakFreezes: { increment: 1 },
      },
      select: {
        xp: true,
        streakFreezes: true,
      },
    });

    res.json({
      success: true,
      message: 'Đổi thành công 1 lượt Đóng Băng Chuỗi Học ❄️!',
      user: updated,
    });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Lỗi đổi lượt đóng băng chuỗi.' });
  }
};
