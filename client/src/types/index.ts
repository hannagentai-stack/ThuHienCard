export interface CardSchedule {
  id?: string;
  cardId?: string;
  state: 'new' | 'learning' | 'review' | 'relearning';
  due: string;
  stability: number;
  difficulty: number;
  elapsedDays?: number;
  scheduledDays?: number;
  reps: number;
  lapses: number;
  lastReview?: string | null;
  isSuspended?: boolean;
}

export interface Card {
  id: string;
  deckId: string;
  front: string;
  back: string;
  phonetic?: string | null;
  wordType?: string | null;
  example?: string | null;
  exampleTrans?: string | null;
  notes?: string | null;
  tagsJson?: string | null;
  imageUrl?: string | null;
  audioUrl?: string | null;
  level?: string | null;
  cardType?: string; // 'standard' | 'cloze'
  createdAt?: string;
  updatedAt?: string;
  schedule?: CardSchedule | null;
}

export interface DeckStats {
  totalCards: number;
  newCards: number;
  dueCards: number;
  learnedCards: number;
}

export interface Deck {
  id: string;
  userId?: string;
  title: string;
  description?: string | null;
  language: 'zh' | 'en';
  icon?: string | null;
  color?: string | null;
  isArchived?: boolean;
  settingsJson?: string | null;
  createdAt?: string;
  updatedAt?: string;
  stats?: DeckStats;
  cards?: Card[];
}
