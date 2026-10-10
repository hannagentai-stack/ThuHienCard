import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import { config } from '../config';

export interface AuthRequest extends Request {
  user?: {
    userId: string;
    username: string;
  };
}

// Middleware xác thực JWT token gửi lên từ client qua Header Bearer
export const authenticateJWT = (req: AuthRequest, res: Response, next: NextFunction): void => {
  const authHeader = req.headers.authorization;

  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    res.status(401).json({
      success: false,
      message: 'Bạn chưa đăng nhập hoặc phiên đăng nhập đã hết hạn.',
    });
    return;
  }

  const token = authHeader.split(' ')[1];

  try {
    const decoded = jwt.verify(token, config.jwtSecret) as { userId: string; username: string };
    req.user = decoded;
    next();
  } catch (error) {
    res.status(401).json({
      success: false,
      message: 'Mã xác thực không hợp lệ hoặc đã hết hạn. Vui lòng đăng nhập lại.',
    });
  }
};
