import { create } from 'zustand';
import { type Card } from '../types';
import { useAuthStore } from './authStore';

interface StudyState {
  cards: (Card & { nextIntervals?: any })[];
  currentIndex: number;
  isFlipped: boolean;
  isLoading: boolean;
  isCompleted: boolean;
  xpEarned: number;
  reviewedCount: number;
  lastCardId: string | null;

  fetchStudyCards: (deckId?: string, mode?: string) => Promise<void>;
  flipCard: () => void;
  reviewCard: (rating: 1 | 2 | 3 | 4, reviewTimeMs?: number) => Promise<void>;
  undoReview: () => Promise<boolean>;
  suspendCard: () => Promise<boolean>;
  resetSession: () => void;
}

export const useStudyStore = create<StudyState>((set, get) => ({
  cards: [],
  currentIndex: 0,
  isFlipped: false,
  isLoading: false,
  isCompleted: false,
  xpEarned: 0,
  reviewedCount: 0,
  lastCardId: null,

  fetchStudyCards: async (deckId?: string, mode = 'srs') => {
    const token = localStorage.getItem('token') || sessionStorage.getItem('token');
    if (!token) return;

    set({ isLoading: true, isCompleted: false, currentIndex: 0, isFlipped: false, xpEarned: 0, reviewedCount: 0 });
    try {
      const url = new URL('/api/study/cards', window.location.origin);
      if (deckId) url.searchParams.append('deckId', deckId);
      if (mode) url.searchParams.append('mode', mode);

      const res = await fetch(url.toString(), {
        headers: { Authorization: `Bearer ${token}` },
      });

      const data = await res.json();
      if (res.ok) {
        set({
          cards: data.cards || [],
          isLoading: false,
          isCompleted: (data.cards || []).length === 0,
        });
      } else {
        set({ isLoading: false });
      }
    } catch {
      set({ isLoading: false });
    }
  },

  flipCard: () => {
    set({ isFlipped: !get().isFlipped });
  },

  reviewCard: async (rating: 1 | 2 | 3 | 4, reviewTimeMs = 0) => {
    const token = localStorage.getItem('token') || sessionStorage.getItem('token');
    const { cards, currentIndex } = get();
    const currentCard = cards[currentIndex];
    if (!currentCard || !token) return;

    try {
      const res = await fetch(`/api/study/cards/${currentCard.id}/review`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ rating, reviewTimeMs }),
      });

      const data = await res.json();
      if (res.ok) {
        // Cập nhật lại user XP & Streak trong authStore
        useAuthStore.getState().checkAuth();

        const xpGained = data.xpGained || 15;
        const newXpEarned = get().xpEarned + xpGained;
        const newReviewedCount = get().reviewedCount + 1;

        // Nếu bấm Again (rating 1): đưa thẻ về cuối hàng đợi của phiên học này
        let nextCards = [...cards];
        if (rating === 1) {
          nextCards.push(currentCard);
        }

        const nextIndex = currentIndex + 1;
        const isDone = nextIndex >= nextCards.length;

        set({
          cards: nextCards,
          currentIndex: nextIndex,
          isFlipped: false,
          isCompleted: isDone,
          xpEarned: newXpEarned,
          reviewedCount: newReviewedCount,
          lastCardId: currentCard.id,
        });
      }
    } catch (err) {
      console.error('Lỗi khi gửi kết quả chấm:', err);
    }
  },

  undoReview: async () => {
    const token = localStorage.getItem('token') || sessionStorage.getItem('token');
    const { lastCardId, currentIndex } = get();
    if (!lastCardId || !token || currentIndex === 0) return false;

    try {
      const res = await fetch(`/api/study/cards/${lastCardId}/undo`, {
        method: 'POST',
        headers: { Authorization: `Bearer ${token}` },
      });

      if (res.ok) {
        set({
          currentIndex: Math.max(0, currentIndex - 1),
          isFlipped: false,
          isCompleted: false,
          lastCardId: null,
        });
        return true;
      }
      return false;
    } catch {
      return false;
    }
  },

  suspendCard: async () => {
    const token = localStorage.getItem('token') || sessionStorage.getItem('token');
    const { cards, currentIndex } = get();
    const currentCard = cards[currentIndex];
    if (!currentCard || !token) return false;

    try {
      const res = await fetch(`/api/study/cards/${currentCard.id}/suspend`, {
        method: 'PUT',
        headers: { Authorization: `Bearer ${token}` },
      });

      if (res.ok) {
        const nextIndex = currentIndex + 1;
        const isDone = nextIndex >= cards.length;
        set({
          currentIndex: nextIndex,
          isFlipped: false,
          isCompleted: isDone,
        });
        return true;
      }
      return false;
    } catch {
      return false;
    }
  },

  resetSession: () => {
    set({
      cards: [],
      currentIndex: 0,
      isFlipped: false,
      isCompleted: false,
      xpEarned: 0,
      reviewedCount: 0,
      lastCardId: null,
    });
  },
}));
