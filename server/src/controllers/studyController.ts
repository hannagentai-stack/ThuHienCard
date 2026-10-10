import { Response } from 'express';
import { prisma } from '../db';
import { AuthRequest } from '../middlewares/authMiddleware';
import { defaultFSRS, type Rating, type CardFSRSState } from '../services/fsrsAlgorithm';

// 1. Lấy danh sách các thẻ cần học / ôn tập theo tiêu chí SRS hoặc Luyện tập
export const getStudyCards = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const userId = req.user?.userId;
    if (!userId) {
      res.status(401).json({ success: false, message: 'Chưa xác thực.' });
      return;
    }

    const { deckId, mode = 'srs', limit = 50 } = req.query;
    const now = new Date();

    const whereDeck: any = { userId, isDeleted: false };
    if (deckId && typeof deckId === 'string') {
      whereDeck.id = deckId;
    }

    // Lấy tất cả các thẻ của user thỏa mãn điều kiện
    let cards = await prisma.card.findMany({
      where: {
        isDeleted: false,
        deck: whereDeck,
        schedule: {
          isSuspended: false,
        },
      },
      include: {
        schedule: true,
        deck: { select: { id: true, title: true, language: true, color: true } },
      },
      take: Number(limit) || 50,
    });

    if (mode === 'srs') {
      // Chế độ SRS chuẩn: Ưu tiên thẻ đến hạn trước, sau đó đến thẻ mới
      cards = cards.filter((c) => {
        if (!c.schedule || c.schedule.state === 'new') return true;
        return new Date(c.schedule.due) <= now;
      });

      // Sắp xếp: Thẻ đang học dở (learning/relearning) -> Thẻ đến hạn -> Thẻ mới
      cards.sort((a, b) => {
        const stateOrder: Record<string, number> = { learning: 0, relearning: 1, review: 2, new: 3 };
        const orderA = stateOrder[a.schedule?.state || 'new'] ?? 3;
        const orderB = stateOrder[b.schedule?.state || 'new'] ?? 3;
        if (orderA !== orderB) return orderA - orderB;
        return new Date(a.schedule?.due || 0).getTime() - new Date(b.schedule?.due || 0).getTime();
      });
    } else if (mode === 'leech') {
      // Chế độ học thẻ khó / hay quên (Lapses >= 2)
      cards = cards.filter((c) => (c.schedule?.lapses || 0) >= 2);
    } else if (mode === 'cram') {
      // Chế độ ôn cấp tốc: Xáo trộn ngẫu nhiên toàn bộ thẻ
      cards.sort(() => Math.random() - 0.5);
    }

    // Dự đoán trước 4 khoảng thời gian cho từng thẻ
    const formattedCards = cards.map((c) => {
      const scheduleState: CardFSRSState = {
        state: (c.schedule?.state as any) || 'new',
        due: c.schedule?.due || now,
        stability: c.schedule?.stability || 0,
        difficulty: c.schedule?.difficulty || 0,
        elapsedDays: c.schedule?.elapsedDays || 0,
        scheduledDays: c.schedule?.scheduledDays || 0,
        reps: c.schedule?.reps || 0,
        lapses: c.schedule?.lapses || 0,
        lastReview: c.schedule?.lastReview,
      };

      const nextIntervals = defaultFSRS.predictNextIntervals(scheduleState, now);

      return {
        ...c,
        nextIntervals,
      };
    });

    res.json({
      success: true,
      cards: formattedCards,
      totalDue: formattedCards.length,
    });
  } catch (error) {
    console.error('Lỗi lấy thẻ học:', error);
    res.status(500).json({ success: false, message: 'Lỗi tải danh sách thẻ học.' });
  }
};

// 2. Chấm điểm thẻ (Review SRS) với FSRS v4
export const reviewCard = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const userId = req.user?.userId;
    const { id: cardId } = req.params;
    const { rating, reviewTimeMs = 0 } = req.body; // rating: 1 | 2 | 3 | 4

    if (![1, 2, 3, 4].includes(Number(rating))) {
      res.status(400).json({ success: false, message: 'Mức đánh giá rating phải từ 1 đến 4.' });
      return;
    }

    const card = await prisma.card.findFirst({
      where: { id: cardId, isDeleted: false, deck: { userId } },
      include: { schedule: true },
    });

    if (!card) {
      res.status(404).json({ success: false, message: 'Không tìm thấy thẻ.' });
      return;
    }

    const now = new Date();
    const currentSchedule = card.schedule;

    const fsrsState: CardFSRSState = {
      state: (currentSchedule?.state as any) || 'new',
      due: currentSchedule?.due || now,
      stability: currentSchedule?.stability || 0,
      difficulty: currentSchedule?.difficulty || 0,
      elapsedDays: currentSchedule?.elapsedDays || 0,
      scheduledDays: currentSchedule?.scheduledDays || 0,
      reps: currentSchedule?.reps || 0,
      lapses: currentSchedule?.lapses || 0,
      lastReview: currentSchedule?.lastReview,
    };

    // Tính toán bằng FSRS v4
    const result = defaultFSRS.schedule(fsrsState, rating as Rating, now);

    // Cập nhật CardSchedule
    const updatedSchedule = await prisma.cardSchedule.upsert({
      where: { cardId },
      create: {
        cardId,
        state: result.nextState,
        due: result.nextDue,
        stability: result.nextStability,
        difficulty: result.nextDifficulty,
        elapsedDays: fsrsState.elapsedDays,
        scheduledDays: result.scheduledDays,
        reps: fsrsState.reps + 1,
        lapses: rating === 1 ? fsrsState.lapses + 1 : fsrsState.lapses,
        lastReview: now,
      },
      update: {
        state: result.nextState,
        due: result.nextDue,
        stability: result.nextStability,
        difficulty: result.nextDifficulty,
        scheduledDays: result.scheduledDays,
        reps: { increment: 1 },
        lapses: rating === 1 ? { increment: 1 } : undefined,
        lastReview: now,
      },
    });

    // Tạo nhật ký ôn tập ReviewLog
    const reviewLog = await prisma.reviewLog.create({
      data: {
        cardId,
        userId: userId!,
        rating: Number(rating),
        state: fsrsState.state,
        due: result.nextDue,
        stability: result.nextStability,
        difficulty: result.nextDifficulty,
        reviewTimeMs: Number(reviewTimeMs) || 0,
        reviewedAt: now,
      },
    });

    // Cộng điểm kinh nghiệm XP & cập nhật Streak
    const xpGain = rating === 4 ? 20 : rating === 3 ? 15 : rating === 2 ? 12 : 8;
    const todayStr = now.toISOString().slice(0, 10);

    const user = await prisma.user.findUnique({ where: { id: userId } });
    if (user) {
      let streakCount = user.streakCount;
      let lastStudyDate = user.lastStudyDate;

      if (lastStudyDate !== todayStr) {
        // Ngày học mới
        const yesterday = new Date(now);
        yesterday.setDate(yesterday.getDate() - 1);
        const yesterdayStr = yesterday.toISOString().slice(0, 10);

        if (lastStudyDate === yesterdayStr) {
          streakCount += 1;
        } else if (!lastStudyDate) {
          streakCount = 1;
        } else {
          // Bỏ lỡ > 1 ngày: Kiểm tra lượt đóng băng chuỗi (Streak Freeze)
          if (user.streakFreezes > 0) {
            streakCount += 1;
            await prisma.user.update({
              where: { id: userId },
              data: { streakFreezes: { decrement: 1 } },
            });
          } else {
            streakCount = 1;
          }
        }
        lastStudyDate = todayStr;
      }

      const newXp = user.xp + xpGain;
      const newLevel = Math.floor(newXp / 300) + 1; // Mỗi 300 XP lên 1 cấp
      const longestStreak = Math.max(user.longestStreak, streakCount);

      await prisma.user.update({
        where: { id: userId },
        data: {
          xp: newXp,
          level: newLevel,
          streakCount,
          longestStreak,
          lastStudyDate,
        },
      });
    }

    // Dự báo tiếp theo
    const nextIntervals = defaultFSRS.predictNextIntervals(
      {
        state: updatedSchedule.state as any,
        due: updatedSchedule.due,
        stability: updatedSchedule.stability,
        difficulty: updatedSchedule.difficulty,
        elapsedDays: 0,
        scheduledDays: updatedSchedule.scheduledDays,
        reps: updatedSchedule.reps,
        lapses: updatedSchedule.lapses,
        lastReview: updatedSchedule.lastReview,
      },
      now
    );

    res.json({
      success: true,
      message: 'Đã lưu kết quả ôn tập ✨',
      schedule: updatedSchedule,
      reviewLog,
      nextIntervals,
      xpGained: xpGain,
    });
  } catch (error) {
    console.error('Lỗi khi chấm điểm thẻ:', error);
    res.status(500).json({ success: false, message: 'Lỗi ghi nhận kết quả ôn.' });
  }
};

// 3. Hoàn tác (Undo) lần chấm điểm gần nhất của thẻ
export const undoReview = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const userId = req.user?.userId;
    const { id: cardId } = req.params;

    const lastLog = await prisma.reviewLog.findFirst({
      where: { cardId, userId },
      orderBy: { reviewedAt: 'desc' },
    });

    if (!lastLog) {
      res.status(404).json({ success: false, message: 'Không có lượt ôn nào để hoàn tác.' });
      return;
    }

    // Xóa ReviewLog gần nhất
    await prisma.reviewLog.delete({ where: { id: lastLog.id } });

    // Khôi phục schedule về trạng thái trước đó
    const previousLog = await prisma.reviewLog.findFirst({
      where: { cardId, userId },
      orderBy: { reviewedAt: 'desc' },
    });

    if (previousLog) {
      await prisma.cardSchedule.update({
        where: { cardId },
        data: {
          state: previousLog.state,
          due: previousLog.due,
          stability: previousLog.stability,
          difficulty: previousLog.difficulty,
          reps: { decrement: 1 },
          lastReview: previousLog.reviewedAt,
        },
      });
    } else {
      // Đưa về trạng thái new ban đầu
      await prisma.cardSchedule.update({
        where: { cardId },
        data: {
          state: 'new',
          due: new Date(),
          stability: 0,
          difficulty: 0,
          reps: 0,
          lapses: 0,
          lastReview: null,
        },
      });
    }

    res.json({
      success: true,
      message: 'Đã hoàn tác lần chấm điểm thành công ↩️',
    });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Lỗi khi hoàn tác.' });
  }
};

// 4. Tạm hoãn / Bỏ tạm hoãn thẻ (Suspend / Unsuspend)
export const toggleSuspend = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const userId = req.user?.userId;
    const { id: cardId } = req.params;

    const card = await prisma.card.findFirst({
      where: { id: cardId, isDeleted: false, deck: { userId } },
      include: { schedule: true },
    });

    if (!card) {
      res.status(404).json({ success: false, message: 'Không tìm thấy thẻ.' });
      return;
    }

    const currentSuspended = card.schedule?.isSuspended || false;
    const updated = await prisma.cardSchedule.upsert({
      where: { cardId },
      create: {
        cardId,
        isSuspended: !currentSuspended,
      },
      update: {
        isSuspended: !currentSuspended,
      },
    });

    res.json({
      success: true,
      isSuspended: updated.isSuspended,
      message: updated.isSuspended ? 'Đã tạm hoãn thẻ này.' : 'Đã bỏ tạm hoãn thẻ.',
    });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Lỗi cập nhật trạng thái tạm hoãn.' });
  }
};
