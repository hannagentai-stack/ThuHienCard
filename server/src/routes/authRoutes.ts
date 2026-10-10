import { Router } from 'express';
import {
  register,
  login,
  getMe,
  updateProfile,
  changePassword,
  exportBackup,
  deleteAccount,
} from '../controllers/authController';
import { authenticateJWT } from '../middlewares/authMiddleware';
import { authRateLimiter } from '../middlewares/rateLimiter';

const router = Router();

// Routes công khai (có rate-limit chống brute-force)
router.post('/register', authRateLimiter, register);
router.post('/login', authRateLimiter, login);

// Routes yêu cầu xác thực JWT Bearer Token
router.get('/me', authenticateJWT, getMe);
router.put('/profile', authenticateJWT, updateProfile);
router.put('/change-password', authenticateJWT, changePassword);
router.get('/backup', authenticateJWT, exportBackup);
router.delete('/account', authenticateJWT, deleteAccount);

export default router;
