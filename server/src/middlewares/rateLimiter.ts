import rateLimit from 'express-rate-limit';

// Chống brute-force vào các endpoint đăng nhập/đăng ký
export const authRateLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 phút
  max: 30, // Tối đa 30 lần thử trong 15 phút từ 1 IP
  message: {
    success: false,
    message: 'Bạn đã thực hiện quá nhiều yêu cầu xác thực. Vui lòng thử lại sau 15 phút.',
  },
  standardHeaders: true,
  legacyHeaders: false,
});

// Giới hạn chung cho API
export const apiRateLimiter = rateLimit({
  windowMs: 1 * 60 * 1000, // 1 phút
  max: 200, // 200 requests/phút
  standardHeaders: true,
  legacyHeaders: false,
});
