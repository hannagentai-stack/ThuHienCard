# ==========================================
# Multi-stage Dockerfile cho Thu Hiền EDU
# ==========================================

# Bước 1: Build Frontend & Backend
FROM node:20-alpine AS builder

WORKDIR /app

# Sao chép file cấu hình phụ thuộc
COPY package*.json ./
COPY server/package*.json ./server/
COPY client/package*.json ./client/

# Cài đặt toàn bộ dependencies
RUN npm install
RUN npm install --prefix server
RUN npm install --prefix client

# Sao chép mã nguồn toàn bộ dự án
COPY . .

# Generate Prisma Client & Build Server
WORKDIR /app/server
RUN npx prisma generate
RUN npm run build

# Build Client (Vite + PWA)
WORKDIR /app/client
RUN npm run build

# Bước 2: Image chạy Production gọn nhẹ
FROM node:20-alpine AS runner

WORKDIR /app
ENV NODE_ENV=production
ENV PORT=5000

# Cài đặt OpenSSL cho Prisma chạy trên Alpine
RUN apk add --no-cache openssl

# Sao chép các tệp cần thiết từ builder
COPY --from=builder /app/package*.json ./
COPY --from=builder /app/server/package*.json ./server/
COPY --from=builder /app/server/dist ./server/dist
COPY --from=builder /app/server/prisma ./server/prisma
COPY --from=builder /app/server/node_modules ./server/node_modules
COPY --from=builder /app/client/dist ./client/dist

# Thiết lập thư mục dữ liệu và prisma
RUN mkdir -p /app/server/prisma

# Khởi tạo database và chạy server
EXPOSE 5000

CMD ["sh", "-c", "cd server && npx prisma db push && node dist/server.js"]
