import express from 'express';
import cors from 'cors';
import path from 'path';
import fs from 'fs';
import { config } from './config';
import authRoutes from './routes/authRoutes';
import deckRoutes from './routes/deckRoutes';
import cardRoutes from './routes/cardRoutes';
import studyRoutes from './routes/studyRoutes';
import statsRoutes from './routes/statsRoutes';
import syncRoutes from './routes/syncRoutes';
import { errorHandler } from './middlewares/errorHandler';
import { apiRateLimiter } from './middlewares/rateLimiter';

const app = express();

// Middlewares cơ bản
app.use(cors({
  origin: '*', // Trong môi trường dev hoặc PWA cho phép kết nối linh hoạt
  credentials: true,
}));

app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// Áp dụng giới hạn tần suất gọi API
app.use('/api', apiRateLimiter);

// Endpoint kiểm tra hoạt động (Healthcheck)
app.get('/api/health', (req, res) => {
  res.json({
    status: 'ok',
    app: 'Web Flashcard API (Chinese & English SRS)',
    version: '1.0.0',
    timestamp: new Date().toISOString(),
  });
});

// Các tuyến API chính
app.use('/api/auth', authRoutes);
app.use('/api/decks', deckRoutes);
app.use('/api/cards', cardRoutes);
app.use('/api/study', studyRoutes);
app.use('/api/stats', statsRoutes);
app.use('/api/sync', syncRoutes);

// Phục vụ frontend tĩnh khi triển khai production
const clientDistPath = path.resolve(__dirname, '../../client/dist');
if (fs.existsSync(clientDistPath)) {
  app.use(express.static(clientDistPath));
  app.get('*', (req, res, next) => {
    if (req.path.startsWith('/api')) return next();
    res.sendFile(path.join(clientDistPath, 'index.html'));
  });
}

// Middleware bắt lỗi tập trung
app.use(errorHandler);

// Khởi chạy server
app.listen(config.port, () => {
  console.log(`🌸 Máy chủ WebFlashCard đang chạy tại: http://localhost:${config.port}`);
  console.log(`📡 Healthcheck: http://localhost:${config.port}/api/health`);
});

export default app;
