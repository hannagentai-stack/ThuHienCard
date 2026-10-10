import { Request, Response, NextFunction } from 'express';

// Middleware xử lý lỗi tập trung, trả về format JSON đồng nhất
export const errorHandler = (err: any, req: Request, res: Response, next: NextFunction): void => {
  console.error('Lỗi Server:', err);

  const statusCode = err.status || err.statusCode || 500;
  const message = err.message || 'Đã có lỗi không mong muốn xảy ra từ phía máy chủ.';

  res.status(statusCode).json({
    success: false,
    message,
    stack: process.env.NODE_ENV === 'development' ? err.stack : undefined,
  });
};
