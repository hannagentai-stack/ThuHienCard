import { PrismaClient } from '@prisma/client';

// Khởi tạo Prisma Client dạng Singleton để tránh tạo nhiều connection pool trong môi trường dev
const globalForPrisma = globalThis as unknown as { prisma: PrismaClient };

export const prisma = globalForPrisma.prisma || new PrismaClient();

if (process.env.NODE_ENV !== 'production') globalForPrisma.prisma = prisma;
