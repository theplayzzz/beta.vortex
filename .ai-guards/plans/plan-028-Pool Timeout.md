---
id: plan-028
title: Correção de Connection Pool Timeout e Otimização do Sistema de Aprovação
createdAt: 2025-06-15
author: theplayzzz
status: draft
---

## 🧩 Scope

Corrigir os problemas de **Connection Pool Timeout (P2024)** que estão causando erros 401 falsos na Vercel e otimizar o sistema de aprovação de usuários para garantir funcionamento robusto em ambiente serverless.

## ✅ Functional Requirements

### 🔧 **Correção de Connection Pool**
- Configurar `pool_timeout` e `connection_limit` adequados para Vercel
- Implementar retry mechanism para operações críticas
- Otimizar configuração do Prisma Client para serverless
- Adicionar monitoramento de connection pool

### 🔄 **Sistema de Aprovação Robusto**
- Garantir que webhook de aprovação automática funcione mesmo com timeouts
- Implementar fallback para aprovação manual quando webhook falha
- Adicionar retry logic para operações de banco de dados
- Preservar integridade do sistema de créditos

### 📊 **Monitoramento e Observabilidade**
- Logs detalhados de connection pool
- Métricas de performance do banco
- Alertas para problemas de conectividade
- Dashboard de saúde do sistema

## ⚙️ Non-Functional Requirements

- **Performance**: Reduzir timeouts de 10s para <3s
- **Reliability**: 99.9% de sucesso em operações críticas
- **Scalability**: Suportar picos de tráfego sem degradação
- **Monitoring**: Visibilidade completa de connection pool

## 📚 Guidelines & Packages

- **Prisma**: Configuração otimizada para Vercel serverless
- **Supabase**: Connection pooling com pgbouncer
- **Clerk**: Webhook retry mechanism
- **Vercel**: Edge runtime considerations

## 🔐 Threat Model

### **Riscos Identificados**
- **Connection Pool Exhaustion**: Pode causar falhas em cascata
- **Webhook Failures**: Usuários podem ficar presos em PENDING
- **Data Inconsistency**: Entre Clerk e Supabase durante timeouts
- **Credit System Integrity**: Transações podem falhar parcialmente

### **Mitigações**
- Connection pool monitoring e alertas
- Retry mechanisms com exponential backoff
- Transações atômicas para operações críticas
- Fallback procedures para cada componente

## 🔢 Execution Plan

### **FASE 1: ANÁLISE E CONFIGURAÇÃO BÁSICA** ⏱️ 2h

#### 1.1 Configurar Connection Pool Otimizado
```prisma
datasource db {
  provider  = "postgresql"
  url       = env("DATABASE_URL")
  directUrl = env("DIRECT_URL")
}
```

**Variáveis de ambiente:**
```env
# Supabase com pooling otimizado para Vercel
DATABASE_URL="postgresql://postgres.[project]:password@[region].pooler.supabase.com:6543/postgres?pgbouncer=true&connection_limit=1&pool_timeout=20&connect_timeout=15"
DIRECT_URL="postgresql://postgres.[project]:password@[region].supabase.com:5432/postgres"
```

#### 1.2 Atualizar Prisma Client Configuration
```typescript
// lib/prisma/client.ts
export const prisma = new PrismaClient({
  log: process.env.NODE_ENV === 'development' ? ['query', 'info', 'warn', 'error'] : ['error'],
  datasources: {
    db: {
      url: process.env.DATABASE_URL,
    },
  },
})

// Configurar métricas em desenvolvimento
if (process.env.NODE_ENV === 'development') {
  prisma.$on('info', (e) => {
    if (e.message.includes('pool')) {
      console.log('🔗 [POOL]', e.message)
    }
  })
}
```

#### 1.3 Implementar Connection Pool Monitoring
```typescript
// utils/database-health.ts
export async function checkDatabaseHealth() {
  const start = Date.now()
  try {
    await prisma.$queryRaw`SELECT 1 as health_check`
    const latency = Date.now() - start
    
    return {
      status: 'healthy',
      latency,
      timestamp: new Date().toISOString()
    }
  } catch (error) {
    return {
      status: 'unhealthy',
      error: error.message,
      latency: Date.now() - start,
      timestamp: new Date().toISOString()
    }
  }
}
```

### **FASE 2: RETRY MECHANISMS E RESILÊNCIA** ⏱️ 3h

#### 2.1 Implementar Retry Utility
```typescript
// utils/retry-mechanism.ts
export async function withRetry<T>(
  operation: () => Promise<T>,
  options: {
    maxRetries?: number
    baseDelay?: number
    maxDelay?: number
    backoffFactor?: number
    retryCondition?: (error: any) => boolean
  } = {}
): Promise<T> {
  const {
    maxRetries = 3,
    baseDelay = 1000,
    maxDelay = 10000,
    backoffFactor = 2,
    retryCondition = (error) => 
      error.code === 'P2024' || // Connection timeout
      error.code === 'P1001' || // Database unreachable
      error.message?.includes('timeout') ||
      error.message?.includes('connection')
  } = options

  let lastError: any
  
  for (let attempt = 0; attempt <= maxRetries; attempt++) {
    try {
      return await operation()
    } catch (error) {
      lastError = error
      
      if (attempt === maxRetries || !retryCondition(error)) {
        throw error
      }
      
      const delay = Math.min(baseDelay * Math.pow(backoffFactor, attempt), maxDelay)
      console.log(`🔄 [RETRY] Attempt ${attempt + 1}/${maxRetries + 1} failed, retrying in ${delay}ms:`, error.message)
      
      await new Promise(resolve => setTimeout(resolve, delay))
    }
  }
  
  throw lastError
}
```

#### 2.2 Atualizar Webhook de Aprovação com Retry
```typescript
// utils/auto-approval-webhook.ts (ATUALIZADO)
export async function checkAutoApproval(email: string): Promise<AutoApprovalResult> {
  const webhookUrl = process.env.APROVACAO_WEBHOOK_URL
  if (!webhookUrl) {
    return { shouldApprove: false, error: 'APROVACAO_WEBHOOK_URL not configured' }
  }

  return withRetry(async () => {
    const controller = new AbortController()
    const timeoutId = setTimeout(() => controller.abort(), 8000) // Aumentado para 8s

    try {
      const response = await fetch(webhookUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'User-Agent': 'vortex-auto-approval',
        },
        body: JSON.stringify({
          event: "new_user_registered",
          data: { email, timestamp: new Date().toISOString() }
        }),
        signal: controller.signal
      })

      clearTimeout(timeoutId)
      
      let data: any = {}
      try {
        data = await response.json()
      } catch (parseError) {
        console.log('[WEBHOOK_AUTO_APPROVAL] Response is not valid JSON')
        return { shouldApprove: false, error: 'Invalid JSON response' }
      }

      const shouldApprove = response.status === 200 && !!data["email contato"]
      
      return {
        shouldApprove,
        webhookData: shouldApprove ? data : undefined
      }
    } finally {
      clearTimeout(timeoutId)
    }
  }, {
    maxRetries: 2,
    baseDelay: 2000,
    retryCondition: (error) => 
      error.name === 'AbortError' || 
      error.message?.includes('timeout') ||
      error.message?.includes('fetch')
  })
}
```

#### 2.3 Atualizar Webhook Clerk com Database Retry
```typescript
// app/api/webhooks/clerk/route.ts (SEÇÃO CRÍTICA)
async function handleUserCreated(data: ClerkWebhookEvent['data']) {
  // ... código existente ...

  // 🆕 OPERAÇÃO CRÍTICA COM RETRY
  const user = await withRetry(async () => {
    return await prisma.user.create({
      data: {
        clerkId: data.id,
        email: primaryEmail.email_address,
        firstName: data.first_name || null,
        lastName: data.last_name || null,
        profileImageUrl: data.image_url || null,
        approvalStatus: initialStatus,
        creditBalance: initialStatus === APPROVAL_STATUS.APPROVED ? 100 : 0,
        version: 0,
        updatedAt: new Date(),
        ...(autoApprovalData && {
          approvedAt: new Date(),
          approvedBy: 'SYSTEM_AUTO_WEBHOOK'
        })
      },
    })
  }, {
    maxRetries: 3,
    baseDelay: 1500
  })

  // 🆕 TRANSAÇÃO DE CRÉDITOS COM RETRY
  if (initialStatus === APPROVAL_STATUS.APPROVED) {
    await withRetry(async () => {
      await prisma.creditTransaction.create({
        data: {
          userId: user.id,
          amount: 100,
          type: 'INITIAL_GRANT',
          description: autoApprovalData ? 
            'Créditos iniciais - aprovação automática via webhook' : 
            'Créditos iniciais de boas-vindas',
        },
      })
    }, { maxRetries: 2 })
  }

  // ... resto do código ...
}
```

### **FASE 3: OTIMIZAÇÃO DE MIDDLEWARE E ROTAS** ⏱️ 2h

#### 3.1 Otimizar Middleware com Cache Inteligente
```typescript
// middleware.ts (OTIMIZADO)
const userCache = new Map<string, { data: any; timestamp: number }>()
const CACHE_TTL = 30000 // 30 segundos

export default clerkMiddleware(async (auth, req) => {
  // ... código existente ...

  // 🆕 CACHE INTELIGENTE PARA REDUZIR QUERIES
  const cacheKey = userId
  const cached = userCache.get(cacheKey)
  const now = Date.now()

  if (cached && (now - cached.timestamp) < CACHE_TTL) {
    console.log('[MIDDLEWARE CACHE] Hit para usuário:', userId)
    // Usar dados do cache
    const { approvalStatus, userRole, isAdmin } = cached.data
    // ... lógica de redirecionamento ...
    return
  }

  // 🆕 FALLBACK COM RETRY PARA QUERIES CRÍTICAS
  let fallbackResult = null
  try {
    fallbackResult = await withRetry(async () => {
      const clerkUser = await clerkClient.users.getUser(userId)
      return {
        userId,
        approvalStatus: clerkUser.publicMetadata?.approvalStatus || 'PENDING',
        userRole: clerkUser.publicMetadata?.role || 'USER',
        isAdmin: ['ADMIN', 'SUPER_ADMIN'].includes(clerkUser.publicMetadata?.role as string)
      }
    }, {
      maxRetries: 2,
      baseDelay: 1000
    })

    // Atualizar cache
    userCache.set(cacheKey, {
      data: fallbackResult,
      timestamp: now
    })

  } catch (error) {
    console.error('[MIDDLEWARE] Fallback failed:', error)
    // Em caso de falha total, permitir acesso limitado
    fallbackResult = {
      userId,
      approvalStatus: 'PENDING',
      userRole: 'USER',
      isAdmin: false
    }
  }

  // ... resto da lógica ...
})
```

#### 3.2 Implementar Health Check Endpoint Robusto
```typescript
// app/api/health/route.ts (NOVO)
export async function GET() {
  const checks = await Promise.allSettled([
    checkDatabaseHealth(),
    checkClerkHealth(),
    checkWebhookHealth()
  ])

  const results = checks.map((check, index) => ({
    service: ['database', 'clerk', 'webhook'][index],
    status: check.status === 'fulfilled' ? check.value.status : 'error',
    ...(check.status === 'fulfilled' ? check.value : { error: check.reason?.message })
  }))

  const overallStatus = results.every(r => r.status === 'healthy') ? 'healthy' : 'degraded'

  return Response.json({
    status: overallStatus,
    timestamp: new Date().toISOString(),
    checks: results,
    environment: process.env.VERCEL_ENV || 'development'
  }, {
    status: overallStatus === 'healthy' ? 200 : 503
  })
}

async function checkClerkHealth() {
  try {
    const start = Date.now()
    // Teste simples de conectividade
    await fetch('https://api.clerk.dev/v1/health', {
      headers: { 'Authorization': `Bearer ${process.env.CLERK_SECRET_KEY}` },
      timeout: 5000
    })
    return { status: 'healthy', latency: Date.now() - start }
  } catch (error) {
    return { status: 'unhealthy', error: error.message }
  }
}

async function checkWebhookHealth() {
  const webhookUrl = process.env.APROVACAO_WEBHOOK_URL
  if (!webhookUrl) return { status: 'not_configured' }

  try {
    const start = Date.now()
    const response = await fetch(webhookUrl, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ event: 'health_check' }),
      timeout: 5000
    })
    return { 
      status: response.status < 500 ? 'healthy' : 'degraded',
      latency: Date.now() - start,
      statusCode: response.status
    }
  } catch (error) {
    return { status: 'unhealthy', error: error.message }
  }
}
```

### **FASE 4: TESTES E VALIDAÇÃO** ⏱️ 3h

#### 4.1 Testes de Connection Pool
```typescript
// tests/connection-pool.test.ts
describe('Connection Pool Tests', () => {
  test('should handle concurrent requests without timeout', async () => {
    const concurrentRequests = Array.from({ length: 10 }, (_, i) => 
      prisma.user.findFirst({ where: { id: `test-${i}` } })
    )

    const start = Date.now()
    const results = await Promise.allSettled(concurrentRequests)
    const duration = Date.now() - start

    expect(duration).toBeLessThan(5000) // Menos de 5 segundos
    expect(results.filter(r => r.status === 'rejected')).toHaveLength(0)
  })

  test('should recover from connection timeout', async () => {
    // Simular timeout e verificar recovery
    const result = await withRetry(async () => {
      return await prisma.$queryRaw`SELECT 1 as test`
    })

    expect(result).toBeDefined()
  })
})
```

#### 4.2 Testes de Sistema de Aprovação
```typescript
// tests/approval-system.test.ts
describe('Approval System Resilience', () => {
  test('should handle webhook timeout gracefully', async () => {
    // Mock webhook timeout
    jest.spyOn(global, 'fetch').mockImplementation(() => 
      new Promise((_, reject) => 
        setTimeout(() => reject(new Error('timeout')), 1000)
      )
    )

    const result = await checkAutoApproval('test@example.com')
    
    expect(result.shouldApprove).toBe(false)
    expect(result.error).toContain('timeout')
  })

  test('should maintain data consistency during failures', async () => {
    // Testar que falhas não deixam dados inconsistentes
    const testEmail = 'consistency-test@example.com'
    
    try {
      await handleUserCreated({
        id: 'test-user-123',
        email_addresses: [{ email_address: testEmail }],
        // ... outros campos necessários
      })
    } catch (error) {
      // Verificar que não há dados órfãos
      const user = await prisma.user.findUnique({ where: { email: testEmail } })
      const transactions = await prisma.creditTransaction.findMany({ 
        where: { userId: user?.id } 
      })
      
      // Se usuário existe, deve ter transações consistentes
      if (user && user.creditBalance > 0) {
        expect(transactions.length).toBeGreaterThan(0)
      }
    }
  })
})
```

#### 4.3 Testes de Performance
```typescript
// tests/performance.test.ts
describe('Performance Tests', () => {
  test('middleware should respond within acceptable time', async () => {
    const start = Date.now()
    
    // Simular request do middleware
    const mockRequest = new Request('http://localhost:3000/api/clients')
    const response = await middleware(mockRequest)
    
    const duration = Date.now() - start
    expect(duration).toBeLessThan(2000) // Menos de 2 segundos
  })

  test('database operations should complete within SLA', async () => {
    const operations = [
      () => prisma.user.findMany({ take: 10 }),
      () => prisma.client.findMany({ take: 10 }),
      () => prisma.creditTransaction.findMany({ take: 10 })
    ]

    for (const operation of operations) {
      const start = Date.now()
      await operation()
      const duration = Date.now() - start
      
      expect(duration).toBeLessThan(1500) // Menos de 1.5 segundos
    }
  })
})
```

### **FASE 5: MONITORAMENTO E ALERTAS** ⏱️ 2h

#### 5.1 Implementar Logging Estruturado
```typescript
// utils/structured-logging.ts
export class DatabaseLogger {
  static logConnectionEvent(event: 'open' | 'close' | 'timeout' | 'error', metadata: any) {
    const logEntry = {
      timestamp: new Date().toISOString(),
      level: event === 'error' || event === 'timeout' ? 'error' : 'info',
      event: `database_connection_${event}`,
      metadata: {
        environment: process.env.VERCEL_ENV || 'development',
        region: process.env.VERCEL_REGION || 'local',
        ...metadata
      }
    }

    if (event === 'error' || event === 'timeout') {
      console.error('🔴 [DB_CONNECTION]', JSON.stringify(logEntry))
    } else {
      console.log('🟢 [DB_CONNECTION]', JSON.stringify(logEntry))
    }
  }

  static logApprovalEvent(event: string, userId: string, metadata: any) {
    console.log('👤 [APPROVAL]', JSON.stringify({
      timestamp: new Date().toISOString(),
      event,
      userId,
      metadata
    }))
  }
}
```

#### 5.2 Dashboard de Métricas
```typescript
// app/api/admin/metrics/route.ts
export async function GET() {
  const metrics = await Promise.all([
    getConnectionPoolMetrics(),
    getApprovalSystemMetrics(),
    getPerformanceMetrics()
  ])

  return Response.json({
    timestamp: new Date().toISOString(),
    connectionPool: metrics[0],
    approvalSystem: metrics[1],
    performance: metrics[2]
  })
}

async function getConnectionPoolMetrics() {
  try {
    const poolMetrics = await prisma.$metrics.json()
    return {
      openConnections: poolMetrics.gauges.find(g => g.key === 'prisma_pool_connections_open')?.value || 0,
      busyConnections: poolMetrics.gauges.find(g => g.key === 'prisma_pool_connections_busy')?.value || 0,
      idleConnections: poolMetrics.gauges.find(g => g.key === 'prisma_pool_connections_idle')?.value || 0,
      status: 'healthy'
    }
  } catch (error) {
    return { status: 'error', error: error.message }
  }
}
```

### **FASE 6: DEPLOYMENT E VALIDAÇÃO FINAL** ⏱️ 1h

#### 6.1 Configuração de Produção
```env
# .env.production
DATABASE_URL="postgresql://postgres.[project]:password@[region].pooler.supabase.com:6543/postgres?pgbouncer=true&connection_limit=1&pool_timeout=20&connect_timeout=15"
DIRECT_URL="postgresql://postgres.[project]:password@[region].supabase.com:5432/postgres"

# Configurações específicas para Vercel
VERCEL_ENV=production
VERCEL_REGION=auto

# Timeouts otimizados
WEBHOOK_TIMEOUT=8000
RETRY_MAX_ATTEMPTS=3
CACHE_TTL=30000
```

#### 6.2 Checklist de Validação Final
- [ ] Connection pool configurado corretamente
- [ ] Retry mechanisms implementados
- [ ] Middleware otimizado com cache
- [ ] Health checks funcionando
- [ ] Logs estruturados ativos
- [ ] Métricas sendo coletadas
- [ ] Testes passando
- [ ] Performance dentro do SLA
- [ ] Sistema de aprovação robusto
- [ ] Integridade de créditos garantida

## 🧪 Testing Strategy

### **Testes Unitários**
- Retry mechanisms
- Connection pool utilities
- Approval system logic
- Cache mechanisms

### **Testes de Integração**
- Webhook flows end-to-end
- Database operations with timeouts
- Clerk integration resilience
- Credit system consistency

### **Testes de Performance**
- Connection pool under load
- Middleware response times
- Database query performance
- Concurrent user scenarios

### **Testes de Resiliência**
- Network timeout simulation
- Database unavailability
- Webhook service down
- High traffic scenarios

## 📊 Success Metrics

### **Performance**
- Database query time: <1.5s (95th percentile)
- Middleware response: <2s (99th percentile)
- Connection pool timeout: <5% of requests
- Overall API response: <3s (95th percentile)

### **Reliability**
- User creation success rate: >99.5%
- Approval system availability: >99.9%
- Credit transaction consistency: 100%
- Webhook processing success: >95%

### **Monitoring**
- Zero false 401 errors
- Connection pool utilization: <80%
- Error rate: <1%
- Recovery time: <30s

## 🚨 Rollback Plan

### **Immediate Rollback Triggers**
- Error rate >5%
- Response time >10s
- Connection pool exhaustion
- Data inconsistency detected

### **Rollback Steps**
1. Revert Prisma configuration
2. Disable retry mechanisms
3. Restore original middleware
4. Monitor for stability
5. Investigate root cause

### **Monitoring During Rollback**
- Real-time error tracking
- Performance metrics
- User impact assessment
- System health validation
