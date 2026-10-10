import { create } from 'zustand';
import { type Deck, type Card } from '../types';

interface DeckState {
  decks: Deck[];
  currentDeck: Deck | null;
  isLoading: boolean;
  error: string | null;

  fetchDecks: () => Promise<void>;
  fetchDeckById: (id: string) => Promise<Deck | null>;
  createDeck: (data: Partial<Deck>) => Promise<Deck | null>;
  updateDeck: (id: string, data: Partial<Deck>) => Promise<boolean>;
  deleteDeck: (id: string) => Promise<boolean>;

  addCard: (deckId: string, cardData: Partial<Card>) => Promise<Card | null>;
  updateCard: (cardId: string, cardData: Partial<Card>) => Promise<boolean>;
  deleteCard: (cardId: string) => Promise<boolean>;
  duplicateCard: (cardId: string) => Promise<boolean>;
  moveCard: (cardId: string, targetDeckId: string) => Promise<boolean>;
  batchImportCards: (deckId: string, cards: any[], duplicateAction?: string) => Promise<any>;
}

export const useDeckStore = create<DeckState>((set, get) => ({
  decks: [],
  currentDeck: null,
  isLoading: false,
  error: null,

  fetchDecks: async () => {
    const token = localStorage.getItem('token') || sessionStorage.getItem('token');
    if (!token) return;

    set({ isLoading: true, error: null });
    try {
      const res = await fetch('/api/decks', {
        headers: { Authorization: `Bearer ${token}` },
      });
      const data = await res.json();
      if (res.ok) {
        set({ decks: data.decks, isLoading: false });
      } else {
        set({ isLoading: false, error: data.message });
      }
    } catch {
      set({ isLoading: false, error: 'Không thể tải danh sách bộ thẻ.' });
    }
  },

  fetchDeckById: async (id: string) => {
    const token = localStorage.getItem('token') || sessionStorage.getItem('token');
    if (!token) return null;

    set({ isLoading: true });
    try {
      const res = await fetch(`/api/decks/${id}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      const data = await res.json();
      if (res.ok) {
        set({ currentDeck: data.deck, isLoading: false });
        return data.deck;
      }
      set({ isLoading: false });
      return null;
    } catch {
      set({ isLoading: false });
      return null;
    }
  },

  createDeck: async (deckData) => {
    const token = localStorage.getItem('token') || sessionStorage.getItem('token');
    if (!token) return null;

    try {
      const res = await fetch('/api/decks', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(deckData),
      });

      const data = await res.json();
      if (res.ok) {
        set({ decks: [data.deck, ...get().decks] });
        return data.deck;
      }
      return null;
    } catch {
      return null;
    }
  },

  updateDeck: async (id, deckData) => {
    const token = localStorage.getItem('token') || sessionStorage.getItem('token');
    if (!token) return false;

    try {
      const res = await fetch(`/api/decks/${id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(deckData),
      });

      if (res.ok) {
        await get().fetchDecks();
        if (get().currentDeck?.id === id) {
          await get().fetchDeckById(id);
        }
        return true;
      }
      return false;
    } catch {
      return false;
    }
  },

  deleteDeck: async (id) => {
    const token = localStorage.getItem('token') || sessionStorage.getItem('token');
    if (!token) return false;

    try {
      const res = await fetch(`/api/decks/${id}`, {
        method: 'DELETE',
        headers: { Authorization: `Bearer ${token}` },
      });

      if (res.ok) {
        set({ decks: get().decks.filter((d) => d.id !== id) });
        if (get().currentDeck?.id === id) set({ currentDeck: null });
        return true;
      }
      return false;
    } catch {
      return false;
    }
  },

  addCard: async (deckId, cardData) => {
    const token = localStorage.getItem('token') || sessionStorage.getItem('token');
    if (!token) return null;

    try {
      const res = await fetch(`/api/decks/${deckId}/cards`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(cardData),
      });

      const data = await res.json();
      if (res.ok) {
        // Cập nhật thẻ vào currentDeck
        const current = get().currentDeck;
        if (current && current.id === deckId) {
          set({
            currentDeck: {
              ...current,
              cards: [data.card, ...(current.cards || [])],
            },
          });
        }
        get().fetchDecks(); // Cập nhật thống kê số lượng
        return data.card;
      }
      return null;
    } catch {
      return null;
    }
  },

  updateCard: async (cardId, cardData) => {
    const token = localStorage.getItem('token') || sessionStorage.getItem('token');
    if (!token) return false;

    try {
      const res = await fetch(`/api/cards/${cardId}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(cardData),
      });

      const data = await res.json();
      if (res.ok) {
        const current = get().currentDeck;
        if (current && current.cards) {
          set({
            currentDeck: {
              ...current,
              cards: current.cards.map((c) => (c.id === cardId ? data.card : c)),
            },
          });
        }
        return true;
      }
      return false;
    } catch {
      return false;
    }
  },

  deleteCard: async (cardId) => {
    const token = localStorage.getItem('token') || sessionStorage.getItem('token');
    if (!token) return false;

    try {
      const res = await fetch(`/api/cards/${cardId}`, {
        method: 'DELETE',
        headers: { Authorization: `Bearer ${token}` },
      });

      if (res.ok) {
        const current = get().currentDeck;
        if (current && current.cards) {
          set({
            currentDeck: {
              ...current,
              cards: current.cards.filter((c) => c.id !== cardId),
            },
          });
        }
        get().fetchDecks();
        return true;
      }
      return false;
    } catch {
      return false;
    }
  },

  duplicateCard: async (cardId) => {
    const token = localStorage.getItem('token') || sessionStorage.getItem('token');
    if (!token) return false;

    try {
      const res = await fetch(`/api/cards/${cardId}/duplicate`, {
        method: 'POST',
        headers: { Authorization: `Bearer ${token}` },
      });

      const data = await res.json();
      if (res.ok) {
        const current = get().currentDeck;
        if (current && current.cards) {
          set({
            currentDeck: {
              ...current,
              cards: [data.card, ...current.cards],
            },
          });
        }
        get().fetchDecks();
        return true;
      }
      return false;
    } catch {
      return false;
    }
  },

  moveCard: async (cardId, targetDeckId) => {
    const token = localStorage.getItem('token') || sessionStorage.getItem('token');
    if (!token) return false;

    try {
      const res = await fetch(`/api/cards/${cardId}/move`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ targetDeckId }),
      });

      if (res.ok) {
        const current = get().currentDeck;
        if (current && current.cards) {
          set({
            currentDeck: {
              ...current,
              cards: current.cards.filter((c) => c.id !== cardId),
            },
          });
        }
        get().fetchDecks();
        return true;
      }
      return false;
    } catch {
      return false;
    }
  },

  batchImportCards: async (deckId, cards, duplicateAction = 'keep') => {
    const token = localStorage.getItem('token') || sessionStorage.getItem('token');
    if (!token) return { success: false, message: 'Chưa đăng nhập.' };

    try {
      const res = await fetch('/api/cards/batch', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ deckId, cards, duplicateAction }),
      });

      const data = await res.json();
      if (res.ok) {
        await get().fetchDeckById(deckId);
        await get().fetchDecks();
      }
      return data;
    } catch {
      return { success: false, message: 'Lỗi khi nhập thẻ vào bộ.' };
    }
  },
}));
