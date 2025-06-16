import { describe, test, expect, beforeAll, afterAll, jest } from '@jest/globals'
import { checkAutoApproval } from '@/utils/auto-approval-webhook'
import { withDatabaseRetry } from '@/utils/retry-mechanism'
import { prisma } from '@/lib/prisma/client'

// Mock do fetch para testes de webhook
const mockFetch = jest.fn()
global.fetch = mockFetch as any

describe('Approval System Resilience', () => {
  beforeAll(() => {
    // Configurar variáveis de ambiente para testes
    process.env.APROVACAO_WEBHOOK_URL = 'https://test-webhook.example.com/webhook'
  })

  afterAll(async () => {
    await prisma.$disconnect()
    jest.restoreAllMocks()
  })

  beforeEach(() => {
    mockFetch.mockClear()
  })

  test('should handle webhook timeout gracefully', async () => {
    // Mock webhook timeout
    mockFetch.mockImplementation(() => 
      new Promise((_, reject) => {
        const error = new Error('Request timeout')
        ;(error as any).name = 'AbortError'
        setTimeout(() => reject(error), 100)
      })
    )

    const result = await checkAutoApproval('test@example.com')
    
    expect(result.shouldApprove).toBe(false)
    expect(result.error).toContain('timeout')
    expect(mockFetch).toHaveBeenCalledTimes(3) // Initial + 2 retries
  })

  test('should handle webhook server error with retry', async () => {
    let attempts = 0
    
    mockFetch.mockImplementation(() => {
      attempts++
      if (attempts < 3) {
        return Promise.resolve({
          status: 500,
          json: () => Promise.resolve({ error: 'Internal Server Error' })
        })
      }
      return Promise.resolve({
        status: 200,
        json: () => Promise.resolve({ 
          'email contato': 'test@example.com',
          'row_number': 1 
        })
      })
    })

    const result = await checkAutoApproval('test@example.com')
    
    expect(result.shouldApprove).toBe(true)
    expect(result.webhookData).toHaveProperty('email contato', 'test@example.com')
    expect(attempts).toBe(3)
  })

  test('should handle webhook not configured', async () => {
    const originalUrl = process.env.APROVACAO_WEBHOOK_URL
    delete process.env.APROVACAO_WEBHOOK_URL

    const result = await checkAutoApproval('test@example.com')
    
    expect(result.shouldApprove).toBe(false)
    expect(result.error).toBe('APROVACAO_WEBHOOK_URL not configured')
    expect(mockFetch).not.toHaveBeenCalled()

    // Restaurar variável de ambiente
    process.env.APROVACAO_WEBHOOK_URL = originalUrl
  })

  test('should handle invalid JSON response', async () => {
    mockFetch.mockResolvedValue({
      status: 200,
      json: () => Promise.reject(new Error('Invalid JSON'))
    })

    const result = await checkAutoApproval('test@example.com')
    
    expect(result.shouldApprove).toBe(false)
    expect(result.error).toBe('Invalid JSON response')
  })

  test('should approve when webhook returns valid response', async () => {
    mockFetch.mockResolvedValue({
      status: 200,
      json: () => Promise.resolve({
        'row_number': 101,
        'email contato': 'approved@example.com',
        'nome contato': 'Test User'
      })
    })

    const result = await checkAutoApproval('approved@example.com')
    
    expect(result.shouldApprove).toBe(true)
    expect(result.webhookData).toHaveProperty('email contato', 'approved@example.com')
    expect(result.webhookData).toHaveProperty('row_number', 101)
  })

  test('should not approve when webhook returns 500', async () => {
    mockFetch.mockResolvedValue({
      status: 500,
      json: () => Promise.resolve({
        code: 0,
        message: 'No item to return got found'
      })
    })

    const result = await checkAutoApproval('notfound@example.com')
    
    expect(result.shouldApprove).toBe(false)
    expect(result.error).toContain('failed after retries')
  })

  test('should maintain data consistency during failures', async () => {
    const testEmail = `consistency-test-${Date.now()}@example.com`
    const testClerkId = `test_clerk_${Date.now()}`
    
    try {
      // Simular criação de usuário que pode falhar
      const user = await withDatabaseRetry(async () => {
        return await prisma.user.create({
          data: {
            clerkId: testClerkId,
            email: testEmail,
            firstName: 'Test',
            lastName: 'User',
            approvalStatus: 'PENDING',
            creditBalance: 0,
            version: 0,
            updatedAt: new Date()
          }
        })
      }, 'test user creation')

      expect(user).toHaveProperty('id')
      expect(user.email).toBe(testEmail)
      
      // Verificar que não há transações de crédito para usuário PENDING
      const transactions = await prisma.creditTransaction.findMany({ 
        where: { userId: user.id } 
      })
      
      expect(transactions).toHaveLength(0)
      
      // Simular aprovação e verificar consistência
      const updatedUser = await withDatabaseRetry(async () => {
        return await prisma.user.update({
          where: { id: user.id },
          data: {
            approvalStatus: 'APPROVED',
            creditBalance: 100,
            approvedAt: new Date(),
            approvedBy: 'TEST_SYSTEM'
          }
        })
      }, 'user approval')

      expect(updatedUser.approvalStatus).toBe('APPROVED')
      expect(updatedUser.creditBalance).toBe(100)
      
      // Criar transação de crédito
      await withDatabaseRetry(async () => {
        await prisma.creditTransaction.create({
          data: {
            userId: user.id,
            amount: 100,
            type: 'INITIAL_GRANT',
            description: 'Test credit grant'
          }
        })
      }, 'credit transaction')
      
      // Verificar consistência final
      const finalTransactions = await prisma.creditTransaction.findMany({ 
        where: { userId: user.id } 
      })
      
      expect(finalTransactions).toHaveLength(1)
      expect(finalTransactions[0].amount).toBe(100)
      expect(finalTransactions[0].type).toBe('INITIAL_GRANT')
      
      // Limpar dados de teste
      await prisma.creditTransaction.deleteMany({
        where: { userId: user.id }
      })
      await prisma.user.delete({
        where: { id: user.id }
      })
      
    } catch (error) {
      // Se falhar, garantir que não há dados órfãos
      const orphanUser = await prisma.user.findUnique({
        where: { email: testEmail }
      })
      
      if (orphanUser) {
        await prisma.creditTransaction.deleteMany({
          where: { userId: orphanUser.id }
        })
        await prisma.user.delete({
          where: { id: orphanUser.id }
        })
      }
      
      throw error
    }
  })

  test('should handle concurrent approval requests', async () => {
    const testEmails = Array.from({ length: 5 }, (_, i) => 
      `concurrent-test-${i}-${Date.now()}@example.com`
    )

    // Mock webhook para aprovar alguns e rejeitar outros
    mockFetch.mockImplementation((url, options) => {
      const body = JSON.parse(options?.body as string)
      const email = body.data.email
      
      if (email.includes('concurrent-test-0') || email.includes('concurrent-test-2')) {
        return Promise.resolve({
          status: 200,
          json: () => Promise.resolve({
            'email contato': email,
            'row_number': 1
          })
        })
      } else {
        return Promise.resolve({
          status: 500,
          json: () => Promise.resolve({
            code: 0,
            message: 'No item to return got found'
          })
        })
      }
    })

    // Executar verificações em paralelo
    const results = await Promise.allSettled(
      testEmails.map(email => checkAutoApproval(email))
    )

    expect(results).toHaveLength(5)
    
    // Verificar que todas as requests foram processadas
    const successfulResults = results.filter(r => r.status === 'fulfilled')
    expect(successfulResults).toHaveLength(5)
    
    // Verificar aprovações corretas
    const approvals = successfulResults
      .map(r => (r as any).value)
      .filter(result => result.shouldApprove)
    
    expect(approvals).toHaveLength(2) // Apenas emails 0 e 2 devem ser aprovados
  })

  test('should handle database connection issues during user creation', async () => {
    const testEmail = `db-error-test-${Date.now()}@example.com`
    let attempts = 0

    // Simular falha de conexão seguida de sucesso
    const createUserWithRetry = async () => {
      return await withDatabaseRetry(async () => {
        attempts++
        if (attempts === 1) {
          const error = new Error('Timed out fetching a new connection from the connection pool')
          ;(error as any).code = 'P2024'
          throw error
        }
        
        return await prisma.user.create({
          data: {
            clerkId: `test_db_error_${Date.now()}`,
            email: testEmail,
            firstName: 'DB Error',
            lastName: 'Test',
            approvalStatus: 'PENDING',
            creditBalance: 0,
            version: 0,
            updatedAt: new Date()
          }
        })
      }, 'user creation with connection error')
    }

    const user = await createUserWithRetry()
    
    expect(user).toHaveProperty('id')
    expect(user.email).toBe(testEmail)
    expect(attempts).toBe(2) // Initial failure + successful retry
    
    // Limpar dados de teste
    await prisma.user.delete({
      where: { id: user.id }
    })
  })

  test('should handle webhook payload validation', async () => {
    const testCases = [
      {
        name: 'valid email with special characters',
        email: 'test+special@example.com',
        shouldWork: true
      },
      {
        name: 'email with unicode characters',
        email: 'tëst@éxample.com',
        shouldWork: true
      },
      {
        name: 'very long email',
        email: 'a'.repeat(100) + '@example.com',
        shouldWork: true
      }
    ]

    for (const testCase of testCases) {
      mockFetch.mockResolvedValueOnce({
        status: 200,
        json: () => Promise.resolve({
          'email contato': testCase.email,
          'row_number': 1
        })
      })

      const result = await checkAutoApproval(testCase.email)
      
      if (testCase.shouldWork) {
        expect(result.shouldApprove).toBe(true)
        expect(result.webhookData).toHaveProperty('email contato', testCase.email)
      } else {
        expect(result.shouldApprove).toBe(false)
      }
    }
  })
})

describe('Credit System Consistency', () => {
  test('should maintain credit balance consistency during retries', async () => {
    const testEmail = `credit-test-${Date.now()}@example.com`
    
    try {
      // Criar usuário
      const user = await withDatabaseRetry(async () => {
        return await prisma.user.create({
          data: {
            clerkId: `credit_test_${Date.now()}`,
            email: testEmail,
            firstName: 'Credit',
            lastName: 'Test',
            approvalStatus: 'APPROVED',
            creditBalance: 100,
            version: 0,
            updatedAt: new Date()
          }
        })
      }, 'credit test user creation')

      // Criar transação de crédito com retry
      const transaction = await withDatabaseRetry(async () => {
        return await prisma.creditTransaction.create({
          data: {
            userId: user.id,
            amount: 100,
            type: 'INITIAL_GRANT',
            description: 'Test initial credits'
          }
        })
      }, 'credit transaction creation')

      expect(transaction.amount).toBe(100)
      expect(transaction.userId).toBe(user.id)
      
      // Verificar consistência
      const userWithTransactions = await prisma.user.findUnique({
        where: { id: user.id },
        include: {
          CreditTransaction: true
        }
      })

      expect(userWithTransactions?.creditBalance).toBe(100)
      expect(userWithTransactions?.CreditTransaction).toHaveLength(1)
      expect(userWithTransactions?.CreditTransaction[0].amount).toBe(100)
      
      // Limpar dados de teste
      await prisma.creditTransaction.delete({
        where: { id: transaction.id }
      })
      await prisma.user.delete({
        where: { id: user.id }
      })
      
    } catch (error) {
      // Limpar dados órfãos em caso de erro
      const orphanUser = await prisma.user.findUnique({
        where: { email: testEmail }
      })
      
      if (orphanUser) {
        await prisma.creditTransaction.deleteMany({
          where: { userId: orphanUser.id }
        })
        await prisma.user.delete({
          where: { id: orphanUser.id }
        })
      }
      
      throw error
    }
  })
}) 