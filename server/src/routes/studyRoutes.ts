import { Router } from 'express';
import {
  getStudyCards,
  reviewCard,
  undoReview,
  toggleSuspend,
  recordPracticeReward,
} from '../controllers/studyController';
import { authenticateJWT } from '../middlewares/authMiddleware';

const router = Router();

router.use(authenticateJWT);

router.get('/cards', getStudyCards);
router.post('/cards/:id/review', reviewCard);
router.post('/cards/:id/undo', undoReview);
router.put('/cards/:id/suspend', toggleSuspend);
router.post('/practice-reward', recordPracticeReward);

export default router;
