import { Response } from 'express';
import { prisma } from '../db';
import { AuthRequest } from '../middlewares/authMiddleware';

// 1. Tạo 1 thẻ đơn lẻ trong bộ thẻ
export const createCard = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const userId = req.user?.userId;
    const { deckId } = req.params;
    const {
      front,
      back,
      phonetic,
      wordType,
      example,
      exampleTrans,
      notes,
      tagsJson,
      imageUrl,
      audioUrl,
      level,
      cardType,
    } = req.body;

    if (!front || !front.trim() || !back || !back.trim()) {
      res.status(400).json({ success: false, message: 'Mặt trước và mặt sau không được để trống.' });
      return;
    }

    // Kiểm tra quyền sở hữu bộ thẻ
    const deck = await prisma.deck.findFirst({
      where: { id: deckId, userId, isDeleted: false },
    });

    if (!deck) {
      res.status(404).json({ success: false, message: 'Bộ thẻ không tồn tại hoặc không thuộc quyền của bạn.' });
      return;
    }

    const card = await prisma.card.create({
      data: {
        deckId,
        front: front.trim(),
        back: back.trim(),
        phonetic: phonetic?.trim() || null,
        wordType: wordType?.trim() || null,
        example: example?.trim() || null,
        exampleTrans: exampleTrans?.trim() || null,
        notes: notes?.trim() || null,
        tagsJson: tagsJson ? (typeof tagsJson === 'string' ? tagsJson : JSON.stringify(tagsJson)) : null,
        imageUrl: imageUrl || null,
        audioUrl: audioUrl || null,
        level: level || null,
        cardType: cardType || 'standard',
        schedule: {
          create: {
            state: 'new',
            due: new Date(),
            stability: 0,
            difficulty: 0,
            reps: 0,
            lapses: 0,
          },
        },
      },
      include: { schedule: true },
    });

    res.status(201).json({
      success: true,
      message: 'Thêm thẻ thành công ✨',
      card,
    });
  } catch (error) {
    console.error('Lỗi tạo thẻ:', error);
    res.status(500).json({ success: false, message: 'Lỗi khi tạo thẻ.' });
  }
};

// 2. Nhập hàng loạt thẻ (Hỗ trợ Import Excel / Dán văn bản)
export const batchCreateCards = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const userId = req.user?.userId;
    const { deckId, cards, duplicateAction = 'keep' } = req.body; // duplicateAction: 'skip' | 'overwrite' | 'keep'

    if (!deckId || !Array.isArray(cards) || cards.length === 0) {
      res.status(400).json({ success: false, message: 'Dữ liệu thẻ không hợp lệ.' });
      return;
    }

    const deck = await prisma.deck.findFirst({
      where: { id: deckId, userId, isDeleted: false },
    });

    if (!deck) {
      res.status(404).json({ success: false, message: 'Bộ thẻ không tồn tại.' });
      return;
    }

    // Lấy danh sách từ mặt trước hiện tại để xử lý trùng lặp
    const existingCards = await prisma.card.findMany({
      where: { deckId, isDeleted: false },
      select: { id: true, front: true },
    });

    const existingMap = new Map<string, string>();
    for (const ec of existingCards) {
      existingMap.set(ec.front.toLowerCase().trim(), ec.id);
    }

    let createdCount = 0;
    let updatedCount = 0;
    let skippedCount = 0;

    // Thực hiện thêm thẻ theo đợt
    for (const c of cards) {
      const front = String(c.front || '').trim();
      const back = String(c.back || '').trim();

      if (!front || !back) {
        skippedCount++;
        continue;
      }

      const key = front.toLowerCase();
      const existingId = existingMap.get(key);

      if (existingId) {
        if (duplicateAction === 'skip') {
          skippedCount++;
          continue;
        } else if (duplicateAction === 'overwrite') {
          await prisma.card.update({
            where: { id: existingId },
            data: {
              back,
              phonetic: c.phonetic ? String(c.phonetic).trim() : null,
              wordType: c.wordType ? String(c.wordType).trim() : null,
              example: c.example ? String(c.example).trim() : null,
              exampleTrans: c.exampleTrans ? String(c.exampleTrans).trim() : null,
              notes: c.notes ? String(c.notes).trim() : null,
              level: c.level || null,
              tagsJson: c.tagsJson ? (typeof c.tagsJson === 'string' ? c.tagsJson : JSON.stringify(c.tagsJson)) : null,
            },
          });
          updatedCount++;
          continue;
        }
      }

      // 'keep' hoặc thẻ mới hoàn toàn
      const newCard = await prisma.card.create({
        data: {
          deckId,
          front,
          back,
          phonetic: c.phonetic ? String(c.phonetic).trim() : null,
          wordType: c.wordType ? String(c.wordType).trim() : null,
          example: c.example ? String(c.example).trim() : null,
          exampleTrans: c.exampleTrans ? String(c.exampleTrans).trim() : null,
          notes: c.notes ? String(c.notes).trim() : null,
          level: c.level || null,
          tagsJson: c.tagsJson ? (typeof c.tagsJson === 'string' ? c.tagsJson : JSON.stringify(c.tagsJson)) : null,
          schedule: {
            create: {
              state: 'new',
              due: new Date(),
              stability: 0,
              difficulty: 0,
              reps: 0,
              lapses: 0,
            },
          },
        },
      });

      existingMap.set(key, newCard.id);
      createdCount++;
    }

    res.json({
      success: true,
      message: `Đã nhập thành công! Thêm mới: ${createdCount}, Ghi đè: ${updatedCount}, Bỏ qua: ${skippedCount} thẻ.`,
      stats: { createdCount, updatedCount, skippedCount },
    });
  } catch (error) {
    console.error('Lỗi nhập hàng loạt:', error);
    res.status(500).json({ success: false, message: 'Lỗi khi nhập hàng loạt thẻ.' });
  }
};

// 3. Cập nhật thẻ
export const updateCard = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const userId = req.user?.userId;
    const { id } = req.params;
    const updateData = req.body;

    const existingCard = await prisma.card.findFirst({
      where: {
        id,
        isDeleted: false,
        deck: { userId },
      },
    });

    if (!existingCard) {
      res.status(404).json({ success: false, message: 'Không tìm thấy thẻ.' });
      return;
    }

    const updated = await prisma.card.update({
      where: { id },
      data: {
        ...(updateData.front && { front: String(updateData.front).trim() }),
        ...(updateData.back && { back: String(updateData.back).trim() }),
        ...(updateData.phonetic !== undefined && { phonetic: updateData.phonetic?.trim() || null }),
        ...(updateData.wordType !== undefined && { wordType: updateData.wordType?.trim() || null }),
        ...(updateData.example !== undefined && { example: updateData.example?.trim() || null }),
        ...(updateData.exampleTrans !== undefined && { exampleTrans: updateData.exampleTrans?.trim() || null }),
        ...(updateData.notes !== undefined && { notes: updateData.notes?.trim() || null }),
        ...(updateData.imageUrl !== undefined && { imageUrl: updateData.imageUrl || null }),
        ...(updateData.audioUrl !== undefined && { audioUrl: updateData.audioUrl || null }),
        ...(updateData.level !== undefined && { level: updateData.level || null }),
        ...(updateData.cardType !== undefined && { cardType: updateData.cardType }),
        ...(updateData.tagsJson !== undefined && {
          tagsJson: typeof updateData.tagsJson === 'string' ? updateData.tagsJson : JSON.stringify(updateData.tagsJson),
        }),
      },
      include: { schedule: true },
    });

    res.json({
      success: true,
      message: 'Cập nhật thẻ thành công ✨',
      card: updated,
    });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Lỗi khi cập nhật thẻ.' });
  }
};

// 4. Xóa thẻ (Soft Delete)
export const deleteCard = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const userId = req.user?.userId;
    const { id } = req.params;

    const existingCard = await prisma.card.findFirst({
      where: {
        id,
        isDeleted: false,
        deck: { userId },
      },
    });

    if (!existingCard) {
      res.status(404).json({ success: false, message: 'Không tìm thấy thẻ.' });
      return;
    }

    await prisma.card.update({
      where: { id },
      data: { isDeleted: true },
    });

    res.json({
      success: true,
      message: 'Đã xóa thẻ.',
    });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Lỗi khi xóa thẻ.' });
  }
};

// 5. Nhân bản thẻ (Duplicate Card)
export const duplicateCard = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const userId = req.user?.userId;
    const { id } = req.params;

    const card = await prisma.card.findFirst({
      where: { id, isDeleted: false, deck: { userId } },
    });

    if (!card) {
      res.status(404).json({ success: false, message: 'Không tìm thấy thẻ để nhân bản.' });
      return;
    }

    const newCard = await prisma.card.create({
      data: {
        deckId: card.deckId,
        front: `${card.front} (Bản sao)`,
        back: card.back,
        phonetic: card.phonetic,
        wordType: card.wordType,
        example: card.example,
        exampleTrans: card.exampleTrans,
        notes: card.notes,
        tagsJson: card.tagsJson,
        imageUrl: card.imageUrl,
        audioUrl: card.audioUrl,
        level: card.level,
        cardType: card.cardType,
        schedule: {
          create: {
            state: 'new',
            due: new Date(),
            stability: 0,
            difficulty: 0,
            reps: 0,
            lapses: 0,
          },
        },
      },
      include: { schedule: true },
    });

    res.json({
      success: true,
      message: 'Nhân bản thẻ thành công!',
      card: newCard,
    });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Lỗi nhân bản thẻ.' });
  }
};

// 6. Di chuyển thẻ sang bộ khác (Move Card)
export const moveCard = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const userId = req.user?.userId;
    const { id } = req.params;
    const { targetDeckId } = req.body;

    const [card, targetDeck] = await Promise.all([
      prisma.card.findFirst({ where: { id, isDeleted: false, deck: { userId } } }),
      prisma.deck.findFirst({ where: { id: targetDeckId, userId, isDeleted: false } }),
    ]);

    if (!card || !targetDeck) {
      res.status(404).json({ success: false, message: 'Thẻ hoặc bộ thẻ đích không hợp lệ.' });
      return;
    }

    const updated = await prisma.card.update({
      where: { id },
      data: { deckId: targetDeckId },
    });

    res.json({
      success: true,
      message: `Đã chuyển thẻ sang bộ "${targetDeck.title}"!`,
      card: updated,
    });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Lỗi di chuyển thẻ.' });
  }
};
