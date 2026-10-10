import { create } from 'zustand';
import { db, type LocalSyncQueueItem, type LocalDeck, type LocalCard } from '../db/indexedDB';

interface SyncState {
  isOnline: boolean;
  isSyncing: boolean;
  pendingCount: number;
  lastSyncAt: string | null;
  syncError: string | null;
  syncNow: () => Promise<void>;
  enqueueAction: (
    entity: 'deck' | 'card' | 'reviewLog',
    entityId: string,
    action: 'create' | 'update' | 'delete',
    payload: any
  ) => Promise<void>;
  refreshPendingCount: () => Promise<void>;
}

export const useSyncStore = create<SyncState>((set, get) => ({
  isOnline: typeof navigator !== 'undefined' ? navigator.onLine : true,
  isSyncing: false,
  pendingCount: 0,
  lastSyncAt: typeof localStorage !== 'undefined' ? localStorage.getItem('last_sync_at') : null,
  syncError: null,

  refreshPendingCount: async () => {
    try {
      const count = await db.syncQueue.count();
      set({ pendingCount: count });
    } catch {
      // Bỏ qua lỗi nếu IndexedDB chưa sẵn sàng
    }
  },

  enqueueAction: async (entity, entityId, action, payload) => {
    try {
      const item: LocalSyncQueueItem = {
        entity,
        entityId,
        action,
        payload,
        createdAt: new Date().toISOString(),
      };
      await db.syncQueue.add(item);
      await get().refreshPendingCount();

      // Nếu đang online thì tự động kích hoạt đồng bộ
      if (navigator.onLine) {
        get().syncNow();
      }
    } catch (err) {
      console.error('Không thể thêm vào hàng đợi đồng bộ:', err);
    }
  },

  syncNow: async () => {
    const { isSyncing } = get();
    if (isSyncing || !navigator.onLine) return;

    const token = localStorage.getItem('token');
    if (!token) {
      // Người dùng chưa đăng nhập, chỉ lưu offline
      return;
    }

    set({ isSyncing: true, syncError: null });

    try {
      const queueItems = await db.syncQueue.toArray();
      const lastSyncAt = localStorage.getItem('last_sync_at');

      const response = await fetch('/api/sync', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          queue: queueItems,
          lastSyncAt,
        }),
      });

      if (!response.ok) {
        throw new Error(`Đồng bộ thất bại với mã: ${response.status}`);
      }

      const data = await response.json();
      if (data.success) {
        // 1. Xoá các mục đã đồng bộ thành công khỏi Dexie queue
        if (data.processedIds && data.processedIds.length > 0) {
          await db.syncQueue.bulkDelete(data.processedIds);
        }

        // 2. Cập nhật dữ liệu từ Server vào IndexedDB
        if (data.serverUpdates) {
          if (data.serverUpdates.decks && data.serverUpdates.decks.length > 0) {
            await db.decks.bulkPut(data.serverUpdates.decks as LocalDeck[]);
          }
          if (data.serverUpdates.cards && data.serverUpdates.cards.length > 0) {
            await db.cards.bulkPut(data.serverUpdates.cards as LocalCard[]);
          }
        }

        // 3. Cập nhật mốc thời gian đồng bộ
        if (data.serverTime) {
          localStorage.setItem('last_sync_at', data.serverTime);
          set({ lastSyncAt: data.serverTime });
        }
      }

      await get().refreshPendingCount();
    } catch (err: any) {
      console.warn('Lỗi trong quá trình đồng bộ hóa:', err.message);
      set({ syncError: err.message || 'Lỗi đồng bộ' });
    } finally {
      set({ isSyncing: false });
    }
  },
}));

// Thiết lập lắng nghe sự kiện mạng (Online / Offline)
if (typeof window !== 'undefined') {
  window.addEventListener('online', () => {
    useSyncStore.setState({ isOnline: true });
    // Tự động đồng bộ ngay khi có mạng trở lại
    useSyncStore.getState().syncNow();
  });

  window.addEventListener('offline', () => {
    useSyncStore.setState({ isOnline: false });
  });

  // Khởi tạo số lượng hàng đợi ban đầu
  useSyncStore.getState().refreshPendingCount();
}
