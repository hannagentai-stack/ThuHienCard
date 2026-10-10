import Dexie, { type Table } from 'dexie';

// Định nghĩa cấu trúc lưu trữ dữ liệu ngoại tuyến (Offline IndexedDB)
export interface LocalDeck {
  id: string;
  userId: string;
  name: string;
  language: 'CHINESE' | 'ENGLISH';
  description?: string;
  icon?: string;
  color?: string;
  isDeleted?: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface LocalCard {
  id: string;
  deckId: string;
  cardType: string;
  term: string;
  pinyin?: string;
  ipa?: string;
  meaning: string;
  exampleSentence?: string;
  exampleMeaning?: string;
  notes?: string;
  audioUrl?: string;
  imageUrl?: string;
  tags?: string;
  isDeleted?: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface LocalCardSchedule {
  id: string;
  cardId: string;
  state: 'NEW' | 'LEARNING' | 'REVIEW' | 'RELEARNING';
  stability: number;
  difficulty: number;
  elapsedDays: number;
  scheduledDays: number;
  reps: number;
  lapses: number;
  lastReview?: string;
  due: string;
  isSuspended: boolean;
  isLeech: boolean;
  updatedAt: string;
}

export interface LocalReviewLog {
  id: string;
  cardId: string;
  rating: number;
  state: string;
  due: string;
  stability: number;
  difficulty: number;
  elapsedDays: number;
  lastElapsedDays: number;
  scheduledDays: number;
  reviewTime: number;
  createdAt: string;
}

export interface LocalSyncQueueItem {
  id?: number;
  entity: 'deck' | 'card' | 'reviewLog';
  entityId: string;
  action: 'create' | 'update' | 'delete';
  payload: any;
  createdAt: string;
}

export class SakuraFlashcardDB extends Dexie {
  decks!: Table<LocalDeck, string>;
  cards!: Table<LocalCard, string>;
  cardSchedules!: Table<LocalCardSchedule, string>;
  reviewLogs!: Table<LocalReviewLog, string>;
  syncQueue!: Table<LocalSyncQueueItem, number>;

  constructor() {
    super('SakuraFlashcardDB');
    this.version(1).stores({
      decks: 'id, userId, language, updatedAt, isDeleted',
      cards: 'id, deckId, term, updatedAt, isDeleted',
      cardSchedules: 'id, cardId, state, due, isSuspended, isLeech',
      reviewLogs: 'id, cardId, createdAt',
      syncQueue: '++id, entity, entityId, createdAt',
    });
  }
}

export const db = new SakuraFlashcardDB();
