import { Router } from 'express';
import {
  getDecks,
  createDeck,
  getDeckById,
  updateDeck,
  deleteDeck,
} from '../controllers/deckController';
import { createCard } from '../controllers/cardController';
import { authenticateJWT } from '../middlewares/authMiddleware';

const router = Router();

// Toàn bộ route bộ thẻ yêu cầu xác thực JWT
router.use(authenticateJWT);

router.get('/', getDecks);
router.post('/', createDeck);
router.get('/:id', getDeckById);
router.put('/:id', updateDeck);
router.delete('/:id', deleteDeck);

// Tạo thẻ bên trong bộ
router.post('/:deckId/cards', createCard);

export default router;
