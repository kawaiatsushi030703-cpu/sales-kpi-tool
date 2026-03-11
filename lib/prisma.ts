import { PrismaClient } from '@prisma/client'
import { PrismaLibSql } from '@prisma/adapter-libsql'

function createPrisma() {
  const url = process.env.TURSO_DATABASE_URL
  const authToken = process.env.TURSO_AUTH_TOKEN

  if (!url) throw new Error('TURSO_DATABASE_URL is not set')

  const adapter = new PrismaLibSql({ url, authToken })
  return new PrismaClient({ adapter } as ConstructorParameters<typeof PrismaClient>[0])
}

// Next.js開発環境でのホットリロード時に複数インスタンス生成を防ぐ
const globalForPrisma = globalThis as unknown as { prisma: PrismaClient }

export const prisma = globalForPrisma.prisma ?? createPrisma()

if (process.env.NODE_ENV !== 'production') globalForPrisma.prisma = prisma
