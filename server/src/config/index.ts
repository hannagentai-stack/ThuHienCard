import dotenv from 'dotenv';
dotenv.config();

export const config = {
  port: parseInt(process.env.PORT || '5000', 10),
  jwtSecret: process.env.JWT_SECRET || 'kawaii_flashcard_jwt_secret_dev_2026',
  jwtRefreshSecret: process.env.JWT_REFRESH_SECRET || 'kawaii_flashcard_jwt_refresh_dev_2026',
  jwtExpiresIn: '7d',          // Thời hạn access token
  jwtRefreshExpiresIn: '30d',   // Thời hạn refresh token
  isDev: process.env.NODE_ENV !== 'production',
};
