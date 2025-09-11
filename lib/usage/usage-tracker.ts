import { prisma } from '@/lib/prisma/client'

/**
 * Helper centralizado para tracking de uso na tabela UsageMonthly
 * 
 * Princípios:
 * - Apenas incrementa valores (nunca decrementa)
 * - UsageMonthly é um contador acumulativo histórico
 * - Contabiliza uso efetivo de recursos
 */
export class UsageTracker {
  
  /**
   * Obtém o período mensal atual no formato YYYY-MM
   */
  private getCurrentPeriod(): string {
    const now = new Date()
    return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`
  }

  /**
   * Garante que existe um registro UsageMonthly para o usuário no período
   */
  private async ensureUsageRecord(userId: string, periodMonth?: string): Promise<void> {
    const period = periodMonth || this.getCurrentPeriod()
    
    try {
      // Verifica se já existe
      const existing = await prisma.usageMonthly.findUnique({
        where: {
          userId_periodMonth: {
            userId,
            periodMonth: period
          }
        }
      })

      if (existing) {
        return // Já existe
      }

      // Busca plano ativo para obter limites
      const userPlan = await prisma.userPlan.findFirst({
        where: {
          userId,
          isActive: true
        },
        include: {
          Plan: true
        }
      })

      const planLimits = userPlan ? {
        maxPlanningsMonth: userPlan.Plan.maxPlanningsMonth,
        maxProposalsMonth: userPlan.Plan.maxProposalsMonth,
        maxTranscriptionMinMonth: userPlan.Plan.maxTranscriptionMinMonth
      } : {
        maxPlanningsMonth: 0,
        maxProposalsMonth: 0,
        maxTranscriptionMinMonth: 0
      }

      // Cria novo registro
      await prisma.usageMonthly.create({
        data: {
          userId,
          periodMonth: period,
          usedPlannings: 0,
          usedProposals: 0,
          usedTranscriptionMinutes: 0,
          limitSnapshotPlannings: planLimits.maxPlanningsMonth,
          limitSnapshotProposals: planLimits.maxProposalsMonth,
          limitSnapshotTranscriptionMinutes: planLimits.maxTranscriptionMinMonth
        }
      })

      console.log(`📊 [UsageTracker] Criado registro UsageMonthly para userId=${userId}, period=${period}`)

    } catch (error) {
      // Pode falhar por race condition se outro processo criar ao mesmo tempo
      // Isso é esperado e não é um problema
      if (error instanceof Error && error.message.includes('Unique constraint')) {
        console.log(`📊 [UsageTracker] Registro já existe (race condition) - userId=${userId}, period=${period}`)
        return
      }
      throw error
    }
  }

  /**
   * Incrementa contador de planejamentos finalizados
   * Deve ser chamado quando um planejamento muda status para FINALIZADO
   */
  async incrementPlanning(userId: string, planningId?: string): Promise<void> {
    const period = this.getCurrentPeriod()
    
    try {
      await prisma.$transaction(async (tx) => {
        // Garantir que registro existe
        await this.ensureUsageRecord(userId, period)
        
        // Incrementar contador
        await tx.usageMonthly.update({
          where: {
            userId_periodMonth: {
              userId,
              periodMonth: period
            }
          },
          data: {
            usedPlannings: {
              increment: 1
            }
          }
        })

        console.log(`📊 [UsageTracker] Incrementado planejamento - userId=${userId}, planningId=${planningId}, period=${period}`)
      })
    } catch (error) {
      console.error(`❌ [UsageTracker] Erro ao incrementar planejamento:`, error)
      throw error
    }
  }

  /**
   * Incrementa contador de minutos de transcrição
   * Deve ser chamado quando minutos são adicionados a uma sessão
   */
  async incrementTranscriptionMinutes(userId: string, minutesToAdd: number, sessionId?: string): Promise<void> {
    if (minutesToAdd <= 0) {
      return // Nada para incrementar
    }

    const period = this.getCurrentPeriod()
    
    try {
      await prisma.$transaction(async (tx) => {
        // Garantir que registro existe
        await this.ensureUsageRecord(userId, period)
        
        // Incrementar contador
        await tx.usageMonthly.update({
          where: {
            userId_periodMonth: {
              userId,
              periodMonth: period
            }
          },
          data: {
            usedTranscriptionMinutes: {
              increment: minutesToAdd
            }
          }
        })

        console.log(`📊 [UsageTracker] Incrementados ${minutesToAdd} minutos - userId=${userId}, sessionId=${sessionId}, period=${period}`)
      })
    } catch (error) {
      console.error(`❌ [UsageTracker] Erro ao incrementar transcrição:`, error)
      throw error
    }
  }

  /**
   * Incrementa contador de propostas
   * Deve ser chamado quando uma proposta é criada
   */
  async incrementProposal(userId: string, proposalId?: string): Promise<void> {
    const period = this.getCurrentPeriod()
    
    try {
      await prisma.$transaction(async (tx) => {
        // Garantir que registro existe
        await this.ensureUsageRecord(userId, period)
        
        // Incrementar contador
        await tx.usageMonthly.update({
          where: {
            userId_periodMonth: {
              userId,
              periodMonth: period
            }
          },
          data: {
            usedProposals: {
              increment: 1
            }
          }
        })

        console.log(`📊 [UsageTracker] Incrementada proposta - userId=${userId}, proposalId=${proposalId}, period=${period}`)
      })
    } catch (error) {
      console.error(`❌ [UsageTracker] Erro ao incrementar proposta:`, error)
      throw error
    }
  }

  /**
   * Verifica se o usuário pode consumir mais recursos do tipo especificado
   * Retorna true se pode consumir, false se excedeu o limite
   */
  async checkLimit(userId: string, feature: 'plannings' | 'proposals' | 'transcription', amountToAdd: number = 1): Promise<{canConsume: boolean, currentUsage: number, limit: number}> {
    const period = this.getCurrentPeriod()
    
    try {
      await this.ensureUsageRecord(userId, period)
      
      const usage = await prisma.usageMonthly.findUnique({
        where: {
          userId_periodMonth: {
            userId,
            periodMonth: period
          }
        }
      })

      if (!usage) {
        throw new Error('Registro de uso não encontrado após criação')
      }

      let currentUsage: number
      let limit: number

      switch (feature) {
        case 'plannings':
          currentUsage = usage.usedPlannings
          limit = usage.limitSnapshotPlannings
          break
        case 'proposals':
          currentUsage = usage.usedProposals
          limit = usage.limitSnapshotProposals
          break
        case 'transcription':
          currentUsage = usage.usedTranscriptionMinutes
          limit = usage.limitSnapshotTranscriptionMinutes
          break
      }

      const canConsume = (currentUsage + amountToAdd) <= limit
      
      console.log(`📊 [UsageTracker] Verificação de limite - userId=${userId}, feature=${feature}, current=${currentUsage}, limit=${limit}, canConsume=${canConsume}`)

      return {
        canConsume,
        currentUsage,
        limit
      }
    } catch (error) {
      console.error(`❌ [UsageTracker] Erro ao verificar limite:`, error)
      throw error
    }
  }

  /**
   * Recalcula totais de uso baseado nas tabelas fonte
   * Útil para corrigir discrepâncias
   */
  async recalculateUsage(userId: string, periodMonth?: string): Promise<{plannings: number, proposals: number, transcriptionMinutes: number}> {
    const period = periodMonth || this.getCurrentPeriod()
    
    // Calcular datas do período
    const [year, month] = period.split('-').map(Number)
    const startOfMonth = new Date(year, month - 1, 1)
    const endOfMonth = new Date(year, month, 1)

    try {
      const [planningsCount, transcriptionSum] = await Promise.all([
        // Contar planejamentos que passaram pela aprovação de tarefas no período
        // Planejamentos são contabilizados quando status >= 'PENDING_AI_REFINED_LIST' (pós-aprovação)
        prisma.strategicPlanning.count({
          where: {
            userId,
            status: {
              in: [
                'PENDING_AI_REFINED_LIST', 
                'AI_REFINED_LIST_VISIBLE', 
                'ACTIVE', 
                'COMPLETED', 
                'ARCHIVED'
              ]
            },
            createdAt: {
              gte: startOfMonth,
              lt: endOfMonth
            }
          }
        }),
        
        // Somar minutos de transcrição no período
        prisma.transcriptionSession.aggregate({
          where: {
            userId,
            createdAt: {
              gte: startOfMonth,
              lt: endOfMonth
            }
          },
          _sum: {
            totalDuration: true
          }
        })
      ])

      // TODO: Quando Proposals for implementado, adicionar aqui
      const proposalsCount = 0

      // Converter segundos para minutos (arredondar para baixo)
      const transcriptionMinutes = Math.floor((transcriptionSum._sum.totalDuration || 0) / 60)

      // Garantir que registro existe e atualizar
      await this.ensureUsageRecord(userId, period)
      
      await prisma.usageMonthly.update({
        where: {
          userId_periodMonth: {
            userId,
            periodMonth: period
          }
        },
        data: {
          usedPlannings: planningsCount,
          usedProposals: proposalsCount,
          usedTranscriptionMinutes: transcriptionMinutes
        }
      })

      console.log(`📊 [UsageTracker] Recalculado uso - userId=${userId}, period=${period}, plannings=${planningsCount}, transcription=${transcriptionMinutes}min`)

      return {
        plannings: planningsCount,
        proposals: proposalsCount,
        transcriptionMinutes
      }
    } catch (error) {
      console.error(`❌ [UsageTracker] Erro ao recalcular uso:`, error)
      throw error
    }
  }
}

// Instância singleton para uso na aplicação
export const usageTracker = new UsageTracker()