import { PrismaClient } from '@prisma/client'

const globalForPrisma = globalThis as unknown as {
  prisma: PrismaClient | undefined
}

export const prisma =
  globalForPrisma.prisma ??
  new PrismaClient({
    log: process.env.NODE_ENV === 'development' ? ['query', 'info', 'warn', 'error'] : ['error'],
    datasources: {
      db: {
        url: process.env.DATABASE_URL,
      },
    },
  })

// Configurar logs em desenvolvimento
if (process.env.NODE_ENV === 'development') {
  prisma.$on('query', (e) => {
    if (e.query.includes('SELECT') && e.duration > 1000) {
      console.log('🐌 [SLOW_QUERY]', `${e.duration}ms:`, e.query.substring(0, 100))
    }
  })
}

if (process.env.NODE_ENV !== 'production') globalForPrisma.prisma = prisma 