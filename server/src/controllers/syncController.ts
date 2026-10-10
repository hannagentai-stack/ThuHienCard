import { Response } from 'express';
import { prisma } from '../db';
import { AuthRequest } from '../middlewares/authMiddleware';

export interface SyncItem {
  id?: number;
  entity: 'deck' | 'card' | 'reviewLog';
  entityId: string;
  action: 'create' | 'update' | 'delete';
  payload: any;
  createdAt: string;
}

// Đồng bộ 2 chiều (Sync Endpoint)
export const syncData = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const userId = req.user?.userId;
    if (!userId) {
      res.status(401).json({ success: false, message: 'Chưa xác thực.' });
      return;
    }

    const { queue = [], lastSyncAt } = req.body;
    const processedIds: number[] = [];

    // 1. Đẩy các thay đổi từ hàng đợi offline của Client lên Server
    for (const item of queue as SyncItem[]) {
      try {
        if (item.entity === 'deck') {
          if (item.action === 'create') {
            await prisma.deck.upsert({
              where: { id: item.entityId },
              create: { ...item.payload, userId },
              update: item.payload,
            });
          } else if (item.action === 'update') {
            await prisma.deck.update({
              where: { id: item.entityId },
              data: item.payload,
            });
          } else if (item.action === 'delete') {
            await prisma.deck.update({
              where: { id: item.entityId },
              data: { isDeleted: true },
            });
          }
        } else if (item.entity === 'card') {
          if (item.action === 'create') {
            await prisma.card.upsert({
              where: { id: item.entityId },
              create: item.payload,
              update: item.payload,
            });
          } else if (item.action === 'update') {
            await prisma.card.update({
              where: { id: item.entityId },
              data: item.payload,
            });
          } else if (item.action === 'delete') {
            await prisma.card.update({
              where: { id: item.entityId },
              data: { isDeleted: true },
            });
          }
        } else if (item.entity === 'reviewLog') {
          // ReviewLog chỉ thêm (Append-only)
          await prisma.reviewLog.upsert({
            where: { id: item.entityId },
            create: { ...item.payload, userId },
            update: item.payload,
          });
        }

        if (item.id) processedIds.push(item.id);
      } catch (err) {
        console.warn(`Lỗi đồng bộ item ${item.entity}:${item.entityId}`, err);
      }
    }

    // 2. Kéo các thay đổi từ Server về Client kể từ thời điểm lastSyncAt
    const sinceDate = lastSyncAt ? new Date(lastSyncAt) : new Date(0);

    const [updatedDecks, updatedCards] = await Promise.all([
      prisma.deck.findMany({
        where: { userId, updatedAt: { gte: sinceDate } },
      }),
      prisma.card.findMany({
        where: { deck: { userId }, updatedAt: { gte: sinceDate } },
        include: { schedule: true },
      }),
    ]);

    res.json({
      success: true,
      processedIds,
      serverTime: new Date().toISOString(),
      serverUpdates: {
        decks: updatedDecks,
        cards: updatedCards,
      },
    });
  } catch (error) {
    console.error('Lỗi quá trình đồng bộ:', error);
    res.status(500).json({ success: false, message: 'Lỗi đồng bộ dữ liệu.' });
  }
};
