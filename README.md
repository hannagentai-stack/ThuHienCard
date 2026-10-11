# 🌸 Thu Hiền EDU - Web Học Tiếng Trung & Tiếng Anh Bằng Flashcard Thông Minh

> **Ứng dụng học từ vựng ngoại ngữ hoàn chỉnh, hiện đại theo chuẩn FSRS v4, hỗ trợ tập viết chữ Hán, nhập/xuất Excel thông minh, hệ thống Gamification lôi cuốn và khả năng học Offline PWA.**

![Thu Hiền EDU](client/public/pwa-icon.svg)

---

## 🌟 Điểm Nổi Bật & Tính Năng Chính

### 1. 🎨 Thiết Kế Kawaii Pastel & Dark Mode Đẳng Cấp
- **Aesthetic Hồng Pastel & Nhật Bản**: Tông màu chủ đạo `#FF5C9E`, `#FF8FB8`, `#FFD6E8` kết hợp bo tròn mềm mại (`rounded-3xl`, `rounded-pill`), hiệu ứng kính mờ (Glassmorphism), bóng đổ mềm (`shadow-kawaii`).
- **Dark Mode Chuẩn WCAG AA**: Chuyển đổi mượt mà giữa chế độ sáng và chế độ tối sang trọng, giảm mỏi mắt khi học vào ban đêm.
- **Hệ thống Linh vật (Mascots)**: 4 người bạn đồng hành dễ thương (Thỏ Sakura Bunny, Mèo Tím Kitty, Ngôi Sao Vàng Star, Trà Sữa Boba) với các biểu cảm sinh động theo ngữ cảnh học tập.

### 2. 🧠 Thuật Toán Lặp Lại Ngắt Quãng FSRS v4 (Free Spaced Repetition Scheduler)
- Thuật toán khoa học hiện đại, **tối ưu hơn 20 - 30%** so với Anki SM-2 cổ điển.
- Tự động tính toán các tham số chuẩn xác:
  - **Difficulty ($D$)**: Độ khó nội tại của từng từ vựng.
  - **Stability ($S$)**: Thời gian bán rã của trí nhớ (tính theo ngày).
  - **Retrievability ($R$)**: Khả năng nhớ lại tại thời điểm hiện tại.
- 4 nút đánh giá trực quan kèm ước lượng thời gian lặp lại:
  - 🔄 **Lại (Again)**: `<10 phút` (Quên hoàn toàn, đưa vào hàng đợi học lại)
  - 🧩 **Khó (Hard)**: `1 - 2 ngày`
  - ⭐ **Tốt (Good)**: `3 - 5 ngày`
  - 🚀 **Dễ (Easy)**: `7 - 14 ngày`
- Hỗ trợ **Hoàn tác (Undo)** thẻ vừa đánh giá nhầm, **Tạm hoãn (Suspend)** thẻ, và tự động gắn cờ **Leech** cho các từ sai quá nhiều lần.

### 3. ✍️ Luyện Viết Chữ Hán Động (Hanzi Writer)
- Tích hợp thư viện đồ họa **Hanzi Writer** trên Canvas:
  - **Chế độ diễn hoạt (Animation)**: Hiển thị thứ tự nét bút chuẩn theo quy tắc Hán tự.
  - **Chế độ tập viết (Handwriting Quiz)**: Người học tự vẽ từng nét bằng chuột hoặc màn hình cảm ứng, nhận phản hồi màu sắc và âm thanh ngay tức thì.

### 4. 📂 Nhập & Xuất Excel Thông Minh (SheetJS)
- Kéo thả file Excel (`.xlsx`, `.xls`, `.csv`).
- **Tự động nhận diện cột (Smart Mapping)**: Tự động ghép cột Tiếng Trung / Tiếng Anh, Pinyin, IPA, Nghĩa tiếng Việt, Ví dụ.
- **Tự động sinh Pinyin**: Tích hợp thư viện `pinyin-pro` tự động tạo phiên âm Pinyin kèm thanh điệu nếu file nguồn chưa có cột này!
- Tải file mẫu chuẩn chỉ với 1 cú nhấp chuột.
- Xuất toàn bộ dữ liệu ra Excel, CSV hoặc JSON để sao lưu.

### 5. 🎯 8 Chế Độ Luyện Tập Đa Giác Quan
1. **SRS Ôn tập chuẩn (FSRS v4)**: Lật thẻ 3D, tính toán chu kỳ ngắt quãng tối ưu.
2. **Trắc nghiệm 4 đáp án (Multiple Choice)**: Rèn phản xạ chọn nghĩa chuẩn xác.
3. **Gõ từ chính xác (Spelling / Typing)**: Luyện nhớ mặt chữ và cách viết chi tiết.
4. **Luyện nghe & Nhận diện (Listening Quiz)**: Phát âm chuẩn bản xứ (Web Speech API) và đoán từ.
5. **Ghép thẻ tương ứng (Matching Game)**: Trò chơi tìm cặp từ - nghĩa để giải trí và nhớ nhanh.
6. **Tập viết chữ Hán (Hanzi Stroke Writing)**: Luyện viết từng nét quy chuẩn.
7. **Thử thách 60 giây (Speed Challenge)**: Ôn tập thần tốc tối đa số từ trước khi hết giờ.
8. **Ôn tập từ khó (Leech Review)**: Tập trung tiêu diệt các từ vựng hay quên nhất.

### 6. 🏆 Hệ Thống Gamification & Thống Kê
- **Daily Streak & Streak Freeze**: Theo dõi số ngày học liên tục, hỗ trợ tính năng "Đóng băng chuỗi học" bảo vệ streak khi bận rộn.
- **Cấp độ (Level) & Điểm kinh nghiệm (XP)**: Nhận XP sau mỗi lượt ôn tập, tăng cấp độ kèm hiệu ứng pháo hoa Confetti rực rỡ.
- **8 Huy hiệu thành tựu (Badges)**: Người mới bắt đầu, Chăm chỉ, Thần tốc, Trùm Hán tự, Chiến binh bền bỉ,...
- **Biểu đồ dự báo ôn tập (Recharts)**: Dự báo số thẻ cần ôn trong 7 ngày và 30 ngày tới theo phân bố FSRS.
- **Bản đồ nhiệt học tập (Heatmap Calendar)**: Lưới 52 tuần (365 ngày) phong cách GitHub ghi nhận mật độ ôn tập theo ngày.

### 7. 📱 Offline PWA & Đồng Bộ 2 Chiều (IndexedDB Dexie.js)
- Cài đặt trực tiếp thành ứng dụng di động hoặc máy tính (Progressive Web App).
- Toàn bộ bộ thẻ và lượt ôn tập được lưu trữ ngoại tuyến qua **Dexie.js (IndexedDB)**.
- Khi có Internet trở lại, hệ thống hàng đợi `SyncQueue` tự động gửi dữ liệu lên máy chủ và cập nhật dữ liệu mới nhất từ đám mây về thiết bị.

---

## 🚀 Khởi Chạy Nhanh (Chỉ Với 1 Lệnh)

### Yêu cầu môi trường
- **Node.js**: Phiên bản 18+ hoặc 20+ (Khuyến nghị Node.js 20 LTS).
- **npm**: Đi kèm với Node.js.

### 1. Cài đặt và chạy môi trường Development:
Chỉ cần chạy lệnh sau tại thư mục gốc của dự án:
```bash
npm install && npm run dev
```

Lệnh trên sẽ tự động cài đặt các gói phụ thuộc cho cả `server` và `client`, đồng thời kích hoạt song song 2 dịch vụ:
- 🌸 **Frontend Web App**: `http://localhost:3000`
- 📡 **Backend REST API**: `http://localhost:5000`
- 🩺 **API Healthcheck**: `http://localhost:5000/api/health`

### 2. Tài khoản thử nghiệm có sẵn:
Hệ thống đã tự động nạp sẵn dữ liệu mẫu (10 thẻ HSK 1 Tiếng Trung và 10 thẻ Tiếng Anh giao tiếp):
- **Tên đăng nhập**: `demo`
- **Mật khẩu**: `password123`

*(Bạn cũng có thể tự đăng ký tài khoản mới bất kỳ lúc nào trên giao diện web).*

---

## ⌨️ Phím Tắt Tiện Lợi Khi Học Thẻ (Keyboard Shortcuts)

| Phím | Chức năng |
| :--- | :--- |
| <kbd>Space</kbd> / <kbd>Enter</kbd> | Lật mặt trước / mặt sau của thẻ |
| <kbd>1</kbd> | Đánh giá: **Lại (Again)** |
| <kbd>2</kbd> | Đánh giá: **Khó (Hard)** |
| <kbd>3</kbd> | Đánh giá: **Tốt (Good)** |
| <kbd>4</kbd> | Đánh giá: **Dễ (Easy)** |
| <kbd>Z</kbd> | Hoàn tác (Undo) thẻ vừa đánh giá |
| <kbd>S</kbd> | Tạm hoãn (Suspend) thẻ đang xem |
| <kbd>E</kbd> | Chỉnh sửa nhanh thông tin thẻ |
| <kbd>R</kbd> | Phát lại âm thanh từ vựng |
| <kbd>Esc</kbd> | Đóng thẻ học / Trở về danh sách |
| <kbd>?</kbd> | Bật bảng phím tắt trợ giúp |

---

## 📁 Cấu Trúc Thư Mục Dự Án (Monorepo)

```text
WebFlashCard/
├── client/                           # Ứng dụng Frontend React + Vite + PWA
│   ├── public/                       # Favicon, PWA icons, manifest
│   ├── src/
│   │   ├── components/
│   │   │   ├── auth/                 # Modal đăng nhập / đăng ký
│   │   │   ├── cards/                # HanziWriterCanvas, thẻ 3D
│   │   │   ├── common/               # Mascot, ShortcutsModal, OnboardingTour
│   │   │   ├── editor/               # RichCardEditor, ExcelImportModal
│   │   │   ├── layout/               # Header, Sidebar, BottomTabBar
│   │   │   └── stats/                # HeatmapCalendar, biểu đồ
│   │   ├── db/                       # indexedDB.ts (Dexie database cho Offline)
│   │   ├── pages/                    # Landing, Decks, Study, Practice, Stats, Profile, Guide
│   │   ├── services/                 # excelService, ttsService, syncService
│   │   ├── stores/                   # authStore, deckStore, studyStore, themeStore
│   │   ├── App.tsx                   # Routing và điều phối giao diện
│   │   └── index.css                 # Bảng màu Kawaii, hiệu ứng kính và hoạt họa
│   ├── tailwind.config.js            # Cấu hình màu sắc pastel, font Outfit/Nunito
│   └── vite.config.ts                # Cấu hình Vite, Proxy API và vite-plugin-pwa
│
├── server/                           # Máy chủ Backend Node.js + Express + Prisma
│   ├── prisma/
│   │   ├── schema.prisma             # CSDL (User, Deck, Card, CardSchedule, ReviewLog)
│   │   └── seed.ts                   # Nạp dữ liệu mẫu ban đầu
│   ├── src/
│   │   ├── controllers/              # auth, deck, card, study, stats, sync controllers
│   │   ├── middlewares/              # authMiddleware (JWT), errorHandler, rateLimiter
│   │   ├── routes/                   # auth, deck, card, study, stats, sync routes
│   │   ├── services/                 # fsrsAlgorithm.ts (Thuật toán FSRS v4 + Unit Tests)
│   │   ├── config.ts                 # Cấu hình biến môi trường
│   │   └── server.ts                 # Điểm khởi chạy Express server & phục vụ tĩnh
│   └── tsconfig.json
│
├── Dockerfile                        # Multi-stage Dockerfile triển khai sản phẩm
├── docker-compose.yml                # File chạy container 1 lệnh với Docker Compose
├── package.json                      # Monorepo scripts (dev, build, start, db:seed)
└── README.md                         # Hướng dẫn chi tiết dự án
```

---

## 📡 Danh Sách API Endpoints Chính

### 1. Xác thực & Tài khoản (`/api/auth`)
- `POST /api/auth/register`: Đăng ký tài khoản mới.
- `POST /api/auth/login`: Đăng nhập, nhận JWT Token.
- `GET /api/auth/me`: Lấy thông tin cá nhân người dùng hiện tại.
- `PUT /api/auth/profile`: Cập nhật tên hiển thị, linh vật đại diện (avatar).

### 2. Quản lý Bộ thẻ (`/api/decks`)
- `GET /api/decks`: Danh sách bộ thẻ kèm thống kê số thẻ mới, đang học, cần ôn.
- `POST /api/decks`: Tạo bộ thẻ mới (Chọn Tiếng Trung hoặc Tiếng Anh).
- `GET /api/decks/:id`: Chi tiết bộ thẻ kèm toàn bộ danh sách thẻ.
- `PUT /api/decks/:id`: Cập nhật tên, mô tả, màu sắc, biểu tượng bộ thẻ.
- `DELETE /api/decks/:id`: Xóa bộ thẻ (Soft delete).

### 3. Quản lý Thẻ từ vựng (`/api/cards`)
- `POST /api/cards`: Tạo thẻ mới (hỗ trợ Cloze deletion, Pinyin, IPA, ví dụ).
- `POST /api/cards/batch`: Nhập hàng loạt thẻ (từ Excel / CSV).
- `PUT /api/cards/:id`: Chỉnh sửa nội dung thẻ.
- `DELETE /api/cards/:id`: Xóa thẻ.
- `POST /api/cards/:id/duplicate`: Nhân bản thẻ sang bộ khác.

### 4. Thuật toán Học tập SRS (`/api/study`)
- `GET /api/study/cards?deckId=...`: Lấy danh sách thẻ đến hạn ôn tập hôm nay theo thuật toán FSRS v4.
- `POST /api/study/cards/:id/review`: Gửi kết quả đánh giá (Rating: 1 - Lại, 2 - Khó, 3 - Tốt, 4 - Dễ).
- `POST /api/study/cards/:id/undo`: Hoàn tác lượt đánh giá gần nhất.
- `PUT /api/study/cards/:id/suspend`: Tạm hoãn hoặc bỏ tạm hoãn thẻ.

### 5. Thống kê & Gamification (`/api/stats`)
- `GET /api/stats/summary`: Tổng quan tiến độ, Streak, Level, XP, số thẻ đã thuộc.
- `GET /api/stats/forecast`: Biểu đồ dự báo số thẻ cần ôn trong 7 ngày và 30 ngày.
- `GET /api/stats/heatmap`: Dữ liệu bản đồ nhiệt ôn tập 365 ngày qua.
- `GET /api/stats/badges`: Danh sách 8 huy hiệu thành tựu và trạng thái mở khóa.
- `POST /api/stats/buy-freeze`: Đổi 50 XP để mua thêm 1 lượt đóng băng chuỗi học.

### 6. Đồng bộ Ngoại tuyến (`/api/sync`)
- `POST /api/sync`: Đẩy các thay đổi từ hàng đợi offline lên máy chủ và kéo dữ liệu mới nhất về thiết bị.

---

## 🚢 Hướng Dẫn Triển Khai (Deployment)

### Phương Án 1: Triển khai bằng Docker (Đơn giản nhất)
Chạy ứng dụng trong môi trường container hóa hoàn chỉnh:
```bash
docker-compose up -d --build
```
Ứng dụng sẽ tự động biên dịch và chạy tại cổng `5000` (http://localhost:5000).

---

### Phương Án 2: Triển khai Miễn Phí Trên Render / Railway / Vercel

1. **Deploy Backend (Render.com hoặc Railway.app)**:
   - Tạo New Web Service từ GitHub Repository của bạn.
   - **Root Directory**: `server`
   - **Build Command**: `npm install && npx prisma generate && npx prisma db push && npm run build`
   - **Start Command**: `npm start`
   - **Environment Variables**:
     - `PORT`: `5000`
     - `JWT_SECRET`: `khoa_bi_mat_cua_ban`
     - `DATABASE_URL`: `file:./dev.db` (hoặc chuỗi kết nối PostgreSQL từ Neon / Supabase).

2. **Deploy Frontend (Vercel hoặc Netlify)**:
   - Tạo New Project từ GitHub Repository.
   - **Root Directory**: `client`
   - **Framework Preset**: `Vite`
   - **Build Command**: `npm run build`
   - **Output Directory**: `dist`
   - Thêm file rewrite `vercel.json` để chuyển hướng các yêu cầu `/api/*` về địa chỉ Backend Render của bạn.

---

## 🌸 Chúc bạn có những giờ phút học ngoại ngữ thật vui và hiệu quả cùng Thu Hiền EDU!
