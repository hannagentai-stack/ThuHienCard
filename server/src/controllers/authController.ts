import { Request, Response } from 'express';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { z } from 'zod';
import { prisma } from '../db';
import { config } from '../config';
import { AuthRequest } from '../middlewares/authMiddleware';

// Schema xác thực dữ liệu đầu vào khi Đăng ký
const registerSchema = z.object({
  username: z
    .string()
    .trim()
    .min(3, 'Tên đăng nhập phải có ít nhất 3 ký tự')
    .max(30, 'Tên đăng nhập không được quá 30 ký tự')
    .regex(/^[a-zA-Z0-9_]+$/, 'Tên đăng nhập chỉ được chứa chữ cái, số và dấu gạch dưới'),
  password: z
    .string()
    .min(6, 'Mật khẩu phải có ít nhất 6 ký tự')
    .max(100, 'Mật khẩu quá dài'),
  displayName: z.string().trim().max(50).optional(),
});

// Schema xác thực khi Đăng nhập
const loginSchema = z.object({
  username: z.string().trim().min(1, 'Vui lòng nhập tên đăng nhập'),
  password: z.string().min(1, 'Vui lòng nhập mật khẩu'),
});

// Tạo Access Token & Refresh Token
const generateTokens = (user: { id: string; username: string }) => {
  const accessToken = jwt.sign(
    { userId: user.id, username: user.username },
    config.jwtSecret,
    { expiresIn: '7d' }
  );

  const refreshToken = jwt.sign(
    { userId: user.id, username: user.username },
    config.jwtRefreshSecret,
    { expiresIn: '30d' }
  );

  return { accessToken, refreshToken };
};

// 1. Đăng ký tài khoản mới (không yêu cầu email)
export const register = async (req: Request, res: Response): Promise<void> => {
  try {
    const parseResult = registerSchema.safeParse(req.body);
    if (!parseResult.success) {
      res.status(400).json({
        success: false,
        message: parseResult.error.errors[0]?.message || 'Dữ liệu không hợp lệ',
      });
      return;
    }

    const { username, password, displayName } = parseResult.data;

    // Kiểm tra tên đăng nhập đã tồn tại chưa
    const existingUser = await prisma.user.findUnique({
      where: { username: username.toLowerCase() },
    });

    if (existingUser) {
      res.status(409).json({
        success: false,
        message: 'Tên đăng nhập này đã được sử dụng. Vui lòng chọn tên khác nhé!',
      });
      return;
    }

    // Băm mật khẩu bằng bcrypt (10 salt rounds)
    const passwordHash = await bcrypt.hash(password, 10);

    const user = await prisma.user.create({
      data: {
        username: username.toLowerCase(),
        passwordHash,
        displayName: displayName || username,
        avatar: 'bunny_pink', // Mascot mặc định
        dailyGoal: 20,
        streakCount: 0,
        streakFreezes: 2,
        xp: 0,
        level: 1,
      },
      select: {
        id: true,
        username: true,
        displayName: true,
        avatar: true,
        dailyGoal: true,
        streakCount: true,
        longestStreak: true,
        streakFreezes: true,
        xp: true,
        level: true,
        settingsJson: true,
        createdAt: true,
      },
    });

    const tokens = generateTokens(user);

    res.status(201).json({
      success: true,
      message: 'Chào mừng bạn! Đăng ký tài khoản thành công 🌸',
      user,
      tokens,
    });
  } catch (error) {
    console.error('Lỗi đăng ký:', error);
    res.status(500).json({
      success: false,
      message: 'Không thể tạo tài khoản. Vui lòng thử lại sau.',
    });
  }
};

// 2. Đăng nhập
export const login = async (req: Request, res: Response): Promise<void> => {
  try {
    const parseResult = loginSchema.safeParse(req.body);
    if (!parseResult.success) {
      res.status(400).json({
        success: false,
        message: parseResult.error.errors[0]?.message || 'Vui lòng điền đủ thông tin',
      });
      return;
    }

    const { username, password } = parseResult.data;

    const user = await prisma.user.findUnique({
      where: { username: username.toLowerCase() },
    });

    if (!user) {
      res.status(401).json({
        success: false,
        message: 'Tên đăng nhập hoặc mật khẩu không chính xác.',
      });
      return;
    }

    const isPasswordValid = await bcrypt.compare(password, user.passwordHash);
    if (!isPasswordValid) {
      res.status(401).json({
        success: false,
        message: 'Tên đăng nhập hoặc mật khẩu không chính xác.',
      });
      return;
    }

    const tokens = generateTokens(user);

    const userData = {
      id: user.id,
      username: user.username,
      displayName: user.displayName,
      avatar: user.avatar,
      dailyGoal: user.dailyGoal,
      streakCount: user.streakCount,
      longestStreak: user.longestStreak,
      streakFreezes: user.streakFreezes,
      xp: user.xp,
      level: user.level,
      settingsJson: user.settingsJson,
      createdAt: user.createdAt,
    };

    res.json({
      success: true,
      message: 'Đăng nhập thành công! Chúc bạn học tập vui vẻ 🐰',
      user: userData,
      tokens,
    });
  } catch (error) {
    console.error('Lỗi đăng nhập:', error);
    res.status(500).json({
      success: false,
      message: 'Có lỗi xảy ra khi đăng nhập. Vui lòng thử lại.',
    });
  }
};

// 3. Lấy thông tin người dùng hiện tại (Me)
export const getMe = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    if (!req.user?.userId) {
      res.status(401).json({ success: false, message: 'Chưa xác thực.' });
      return;
    }

    const user = await prisma.user.findUnique({
      where: { id: req.user.userId },
      select: {
        id: true,
        username: true,
        displayName: true,
        avatar: true,
        dailyGoal: true,
        streakCount: true,
        longestStreak: true,
        streakFreezes: true,
        lastStudyDate: true,
        xp: true,
        level: true,
        settingsJson: true,
        createdAt: true,
      },
    });

    if (!user) {
      res.status(404).json({ success: false, message: 'Người dùng không tồn tại.' });
      return;
    }

    res.json({
      success: true,
      user,
    });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Lỗi tải thông tin cá nhân.' });
  }
};

// 4. Cập nhật hồ sơ (displayName, avatar, dailyGoal, settingsJson)
export const updateProfile = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const userId = req.user?.userId;
    if (!userId) {
      res.status(401).json({ success: false, message: 'Chưa xác thực.' });
      return;
    }

    const { displayName, avatar, dailyGoal, settingsJson } = req.body;

    const updatedUser = await prisma.user.update({
      where: { id: userId },
      data: {
        ...(displayName && { displayName: String(displayName).trim() }),
        ...(avatar && { avatar: String(avatar) }),
        ...(dailyGoal !== undefined && { dailyGoal: Math.max(5, Math.min(200, Number(dailyGoal))) }),
        ...(settingsJson !== undefined && {
          settingsJson: typeof settingsJson === 'object' ? JSON.stringify(settingsJson) : settingsJson,
        }),
      },
      select: {
        id: true,
        username: true,
        displayName: true,
        avatar: true,
        dailyGoal: true,
        streakCount: true,
        longestStreak: true,
        streakFreezes: true,
        xp: true,
        level: true,
        settingsJson: true,
      },
    });

    res.json({
      success: true,
      message: 'Cập nhật hồ sơ thành công ✨',
      user: updatedUser,
    });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Lỗi khi cập nhật hồ sơ.' });
  }
};

// 5. Đổi mật khẩu
export const changePassword = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const userId = req.user?.userId;
    if (!userId) {
      res.status(401).json({ success: false, message: 'Chưa xác thực.' });
      return;
    }

    const { oldPassword, newPassword } = req.body;
    if (!oldPassword || !newPassword) {
      res.status(400).json({ success: false, message: 'Vui lòng nhập mật khẩu cũ và mới.' });
      return;
    }

    if (newPassword.length < 6) {
      res.status(400).json({ success: false, message: 'Mật khẩu mới phải có tối thiểu 6 ký tự.' });
      return;
    }

    const user = await prisma.user.findUnique({ where: { id: userId } });
    if (!user) {
      res.status(404).json({ success: false, message: 'Người dùng không tồn tại.' });
      return;
    }

    const isMatch = await bcrypt.compare(oldPassword, user.passwordHash);
    if (!isMatch) {
      res.status(400).json({ success: false, message: 'Mật khẩu hiện tại không chính xác.' });
      return;
    }

    const newHash = await bcrypt.hash(newPassword, 10);
    await prisma.user.update({
      where: { id: userId },
      data: { passwordHash: newHash },
    });

    res.json({ success: true, message: 'Đổi mật khẩu thành công!' });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Lỗi khi đổi mật khẩu.' });
  }
};

// 6. Sao lưu toàn bộ dữ liệu (Export Backup)
export const exportBackup = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const userId = req.user?.userId;
    if (!userId) {
      res.status(401).json({ success: false, message: 'Chưa xác thực.' });
      return;
    }

    const user = await prisma.user.findUnique({
      where: { id: userId },
      include: {
        decks: {
          include: {
            cards: {
              include: {
                schedule: true,
              },
            },
          },
        },
        reviewLogs: true,
        userBadges: true,
      },
    });

    if (!user) {
      res.status(404).json({ success: false, message: 'Không tìm thấy tài khoản.' });
      return;
    }

    // Xóa trường nhạy cảm passwordHash trước khi xuất
    const { passwordHash, ...safeUser } = user;

    res.json({
      success: true,
      exportedAt: new Date().toISOString(),
      version: '1.0',
      data: safeUser,
    });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Lỗi khi xuất dữ liệu sao lưu.' });
  }
};

// 7. Xóa vĩnh viễn tài khoản
export const deleteAccount = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const userId = req.user?.userId;
    if (!userId) {
      res.status(401).json({ success: false, message: 'Chưa xác thực.' });
      return;
    }

    await prisma.user.delete({ where: { id: userId } });
    res.json({ success: true, message: 'Tài khoản của bạn đã được xóa hoàn toàn.' });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Lỗi khi xóa tài khoản.' });
  }
};
