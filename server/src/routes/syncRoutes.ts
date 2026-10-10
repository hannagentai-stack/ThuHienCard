import { Router } from 'express';
import { syncData } from '../controllers/syncController';
import { authenticateJWT } from '../middlewares/authMiddleware';

const router = Router();

// Tất cả thao tác đồng bộ yêu cầu người dùng đã đăng nhập
router.use(authenticateJWT);

// Tuyến đồng bộ 2 chiều: gửi hàng đợi offline và nhận dữ liệu mới nhất
router.post('/', syncData);

export default router;
