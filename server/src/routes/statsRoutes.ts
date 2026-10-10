import { Router } from 'express';
import {
  getSummaryStats,
  getForecastStats,
  getHeatmapStats,
  getBadgesAndRetention,
  buyStreakFreeze,
} from '../controllers/statsController';
import { authenticateJWT } from '../middlewares/authMiddleware';

const router = Router();

router.use(authenticateJWT);

router.get('/summary', getSummaryStats);
router.get('/forecast', getForecastStats);
router.get('/heatmap', getHeatmapStats);
router.get('/badges', getBadgesAndRetention);
router.post('/buy-freeze', buyStreakFreeze);

export default router;
