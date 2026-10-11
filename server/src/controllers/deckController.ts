import { Response } from 'express';
import { prisma } from '../db';
import { AuthRequest } from '../middlewares/authMiddleware';

// 1. Lấy danh sách tất cả bộ thẻ của người dùng (kèm số lượng thẻ và thẻ đến hạn)
export const getDecks = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const userId = req.user?.userId;
    if (!userId) {
      res.status(401).json({ success: false, message: 'Chưa xác thực.' });
      return;
    }

    const now = new Date();

    const decks = await prisma.deck.findMany({
      where: {
        userId,
        isDeleted: false,
      },
      include: {
        cards: {
          where: { isDeleted: false },
          include: { schedule: true },
        },
      },
      orderBy: { updatedAt: 'desc' },
    });

    // Tính toán số thẻ mới, đang học, đến hạn ôn
    const formattedDecks = decks.map((deck) => {
      let totalCards = deck.cards.length;
      let newCards = 0;
      let dueCards = 0;
      let learnedCards = 0;

      for (const card of deck.cards) {
        if (!card.schedule || card.schedule.state === 'new') {
          newCards++;
        } else if (new Date(card.schedule.due) <= now) {
          dueCards++;
        } else {
          learnedCards++;
        }
      }

      return {
        ...deck,
        stats: {
          totalCards,
          newCards,
          dueCards,
          learnedCards,
        },
      };
    });

    res.json({
      success: true,
      decks: formattedDecks,
    });
  } catch (error) {
    console.error('Lỗi lấy danh sách bộ thẻ:', error);
    res.status(500).json({ success: false, message: 'Không thể tải danh sách bộ thẻ.' });
  }
};

// 2. Tạo bộ thẻ mới
export const createDeck = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const userId = req.user?.userId;
    if (!userId) {
      res.status(401).json({ success: false, message: 'Chưa xác thực.' });
      return;
    }

    const { title, description, language, color, icon, settingsJson } = req.body;

    if (!title || !title.trim()) {
      res.status(400).json({ success: false, message: 'Vui lòng nhập tên bộ thẻ.' });
      return;
    }

    const deck = await prisma.deck.create({
      data: {
        userId,
        title: title.trim(),
        description: description?.trim() || null,
        language: language === 'zh' ? 'zh' : 'en',
        color: color || '#FF5C9E',
        icon: icon || (language === 'zh' ? '🇨🇳' : '🇬🇧'),
        settingsJson: settingsJson ? JSON.stringify(settingsJson) : null,
      },
    });

    res.status(201).json({
      success: true,
      message: 'Tạo bộ thẻ thành công 🌸',
      deck: {
        ...deck,
        stats: { totalCards: 0, newCards: 0, dueCards: 0, learnedCards: 0 },
      },
    });
  } catch (error) {
    console.error('Lỗi tạo bộ thẻ:', error);
    res.status(500).json({ success: false, message: 'Lỗi khi tạo bộ thẻ mới.' });
  }
};

// 3. Lấy chi tiết bộ thẻ (kèm danh sách thẻ bên trong)
export const getDeckById = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const userId = req.user?.userId;
    const { id } = req.params;

    const deck = await prisma.deck.findFirst({
      where: {
        id,
        userId,
        isDeleted: false,
      },
      include: {
        cards: {
          where: { isDeleted: false },
          include: { schedule: true },
          orderBy: { createdAt: 'desc' },
        },
      },
    });

    if (!deck) {
      res.status(404).json({ success: false, message: 'Không tìm thấy bộ thẻ.' });
      return;
    }

    res.json({
      success: true,
      deck,
    });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Lỗi khi lấy thông tin bộ thẻ.' });
  }
};

// 4. Cập nhật bộ thẻ
export const updateDeck = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const userId = req.user?.userId;
    const { id } = req.params;
    const { title, description, language, color, icon, settingsJson } = req.body;

    const existingDeck = await prisma.deck.findFirst({
      where: { id, userId, isDeleted: false },
    });

    if (!existingDeck) {
      res.status(404).json({ success: false, message: 'Không tìm thấy bộ thẻ.' });
      return;
    }

    const updated = await prisma.deck.update({
      where: { id },
      data: {
        ...(title && { title: title.trim() }),
        ...(description !== undefined && { description: description?.trim() || null }),
        ...(language && { language }),
        ...(color && { color }),
        ...(icon && { icon }),
        ...(settingsJson !== undefined && {
          settingsJson: typeof settingsJson === 'object' ? JSON.stringify(settingsJson) : settingsJson,
        }),
      },
    });

    res.json({
      success: true,
      message: 'Cập nhật bộ thẻ thành công ✨',
      deck: updated,
    });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Lỗi cập nhật bộ thẻ.' });
  }
};

// 5. Xóa bộ thẻ (Soft Delete)
export const deleteDeck = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const userId = req.user?.userId;
    const { id } = req.params;

    const existingDeck = await prisma.deck.findFirst({
      where: { id, userId, isDeleted: false },
    });

    if (!existingDeck) {
      res.status(404).json({ success: false, message: 'Không tìm thấy bộ thẻ.' });
      return;
    }

    await prisma.deck.update({
      where: { id },
      data: { isDeleted: true },
    });

    res.json({
      success: true,
      message: 'Đã xóa bộ thẻ thành công 🗑️',
    });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Lỗi khi xóa bộ thẻ.' });
  }
};
