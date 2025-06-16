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

// Configurar métricas e logs em desenvolvimento
if (process.env.NODE_ENV === 'development') {
  prisma.$on('info', (e) => {
    if (e.message.includes('pool')) {
      console.log('🔗 [POOL]', e.message)
    }
  })
  
  prisma.$on('warn', (e) => {
    console.warn('⚠️ [PRISMA_WARN]', e.message)
  })
  
  prisma.$on('error', (e) => {
    console.error('❌ [PRISMA_ERROR]', e.message)
  })
}

if (process.env.NODE_ENV !== 'production') globalForPrisma.prisma = prisma 