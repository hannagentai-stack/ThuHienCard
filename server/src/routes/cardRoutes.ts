import { Router } from 'express';
import {
  batchCreateCards,
  updateCard,
  deleteCard,
  duplicateCard,
  moveCard,
} from '../controllers/cardController';
import { authenticateJWT } from '../middlewares/authMiddleware';

const router = Router();

router.use(authenticateJWT);

router.post('/batch', batchCreateCards);
router.put('/:id', updateCard);
router.delete('/:id', deleteCard);
router.post('/:id/duplicate', duplicateCard);
router.put('/:id/move', moveCard);

export default router;
