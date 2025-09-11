const { PrismaClient } = require('@prisma/client')

const prisma = new PrismaClient()

async function migrateUsersWithApprovalLogic() {
  try {
    console.log('🚀 FASE 5: Iniciando cópia de usuários para planos baseada em status de aprovação...')
    console.log('⚠️ IMPORTANTE: Isso é uma CÓPIA, não migração. Dados originais da tabela User permanecem intocados.')

    // FASE 5.1: Identificar categorias de usuários
    console.log('\n📋 FASE 5.1: Identificando usuários por categoria...')
    
    // Usuários ADMIN independente de aprovação -> Plano Admin Ilimitado
    const adminUsers = await prisma.user.findMany({
      where: {
        role: {
          in: ['ADMIN', 'SUPER_ADMIN']
        }
      },
      select: {
        id: true,
        email: true,
        role: true,
        approvalStatus: true
      }
    })

    // Usuários USER com status APPROVED -> Plano Básico 12 meses
    const approvedUsers = await prisma.user.findMany({
      where: {
        role: 'USER',
        approvalStatus: 'APPROVED'
      },
      select: {
        id: true,
        email: true,
        role: true,
        approvalStatus: true
      }
    })

    // Usuários USER com status PENDING -> Trial Spalla
    const pendingUsers = await prisma.user.findMany({
      where: {
        role: 'USER',
        approvalStatus: 'PENDING'
      },
      select: {
        id: true,
        email: true,
        role: true,
        approvalStatus: true
      }
    })

    // Outros usuários (REJECTED, SUSPENDED) -> não recebem plano inicialmente
    const otherUsers = await prisma.user.findMany({
      where: {
        role: 'USER',
        approvalStatus: {
          in: ['REJECTED', 'SUSPENDED']
        }
      },
      select: {
        id: true,
        email: true,
        role: true,
        approvalStatus: true
      }
    })

    console.log(`✅ Encontrados ${adminUsers.length} administradores`)
    console.log(`✅ Encontrados ${approvedUsers.length} usuários aprovados`)
    console.log(`✅ Encontrados ${pendingUsers.length} usuários pendentes`)
    console.log(`⚠️ Encontrados ${otherUsers.length} usuários rejeitados/suspensos (não receberão planos)`)

    // Buscar os planos necessários
    const adminPlan = await prisma.plan.findFirst({
      where: {
        name: 'Plano Admin Ilimitado',
        durationMonths: 1
      }
    })

    const basicPlan12Months = await prisma.plan.findFirst({
      where: {
        name: 'Plano Básico - 12 meses',
        durationMonths: 12
      }
    })

    const trialPlan = await prisma.plan.findFirst({
      where: {
        name: 'Trial Spalla',
        durationMonths: 1
      }
    })

    if (!adminPlan) {
      throw new Error('Plano Admin Ilimitado não encontrado!')
    }

    if (!basicPlan12Months) {
      throw new Error('Plano Básico - 12 meses não encontrado!')
    }

    if (!trialPlan) {
      throw new Error('Trial Spalla não encontrado!')
    }

    console.log(`📋 Plano Admin ID: ${adminPlan.id}`)
    console.log(`📋 Plano Básico 12 meses ID: ${basicPlan12Months.id}`)
    console.log(`📋 Plano Trial Spalla ID: ${trialPlan.id}`)

    // FASE 5.2: Copiar administradores para Plano Admin Ilimitado
    console.log('\n👑 FASE 5.2: Copiando administradores para Plano Admin Ilimitado...')
    
    let adminsCopied = 0
    const totalAdmins = adminUsers.length
    
    for (let i = 0; i < totalAdmins; i++) {
      const admin = adminUsers[i]
      try {
        await prisma.userPlan.create({
          data: {
            userId: admin.id,
            planId: adminPlan.id,
            startsAt: new Date(),
            isActive: true
          }
        })
        console.log(`✅ Admin copiado (${i + 1}/${totalAdmins}): ${admin.email} (${admin.role}, ${admin.approvalStatus})`)
        adminsCopied++
      } catch (error: any) {
        if (error.code === 'P2002') {
          console.log(`⚠️ Admin já tem plano ativo: ${admin.email}`)
        } else {
          console.error(`❌ Erro ao copiar admin ${admin.email}:`, error.message)
        }
      }
    }

    // FASE 5.3: Copiar usuários aprovados para Plano Básico 12 meses
    console.log('\n👤 FASE 5.3: Copiando usuários aprovados para Plano Básico 12 meses...')
    
    let approvedUsersCopied = 0
    const totalApproved = approvedUsers.length
    
    for (let i = 0; i < totalApproved; i++) {
      const user = approvedUsers[i]
      try {
        await prisma.userPlan.create({
          data: {
            userId: user.id,
            planId: basicPlan12Months.id,
            startsAt: new Date(),
            // Calcular data de fim para 12 meses
            endsAt: new Date(new Date().setMonth(new Date().getMonth() + 12)),
            isActive: true
          }
        })
        console.log(`✅ Usuário aprovado copiado (${i + 1}/${totalApproved}): ${user.email}`)
        approvedUsersCopied++
      } catch (error: any) {
        if (error.code === 'P2002') {
          console.log(`⚠️ Usuário aprovado já tem plano ativo: ${user.email}`)
        } else {
          console.error(`❌ Erro ao copiar usuário aprovado ${user.email}:`, error.message)
        }
      }

      // Log de progresso a cada 50 usuários
      if ((i + 1) % 50 === 0) {
        console.log(`📊 Progresso usuários aprovados: ${i + 1}/${totalApproved}`)
      }
    }

    // FASE 5.4: Copiar usuários pendentes para Trial Spalla
    console.log('\n⏳ FASE 5.4: Copiando usuários pendentes para Trial Spalla...')
    
    let pendingUsersCopied = 0
    const totalPending = pendingUsers.length
    
    for (let i = 0; i < totalPending; i++) {
      const user = pendingUsers[i]
      try {
        await prisma.userPlan.create({
          data: {
            userId: user.id,
            planId: trialPlan.id,
            startsAt: new Date(),
            isActive: true
          }
        })
        console.log(`✅ Usuário pendente copiado (${i + 1}/${totalPending}): ${user.email}`)
        pendingUsersCopied++
      } catch (error: any) {
        if (error.code === 'P2002') {
          console.log(`⚠️ Usuário pendente já tem plano ativo: ${user.email}`)
        } else {
          console.error(`❌ Erro ao copiar usuário pendente ${user.email}:`, error.message)
        }
      }

      // Log de progresso a cada 25 usuários
      if ((i + 1) % 25 === 0) {
        console.log(`📊 Progresso usuários pendentes: ${i + 1}/${totalPending}`)
      }
    }

    console.log('\\n📊 RESULTADO DA CÓPIA:')
    console.log(`👑 Administradores copiados: ${adminsCopied}/${adminUsers.length}`)
    console.log(`✅ Usuários aprovados copiados: ${approvedUsersCopied}/${approvedUsers.length}`)
    console.log(`⏳ Usuários pendentes copiados: ${pendingUsersCopied}/${pendingUsers.length}`)
    console.log(`❌ Usuários rejeitados/suspensos não copiados: ${otherUsers.length}`)
    console.log(`📈 Total copiado: ${adminsCopied + approvedUsersCopied + pendingUsersCopied}`)

    // FASE 5.5: Verificação final
    console.log('\\n🔍 FASE 5.5: Verificação final...')
    
    const totalUsersWithPlans = await prisma.userPlan.count({
      where: { isActive: true }
    })

    const totalUsers = await prisma.user.count()
    const usersEligibleForPlans = adminUsers.length + approvedUsers.length + pendingUsers.length

    console.log(`📋 Total de usuários no sistema: ${totalUsers}`)
    console.log(`📋 Usuários elegíveis para planos: ${usersEligibleForPlans}`)
    console.log(`📋 Total de usuários com planos ativos: ${totalUsersWithPlans}`)
    console.log(`📋 Usuários sem planos (rejeitados/suspensos): ${otherUsers.length}`)

    // Verificar distribuição por plano
    const planDistribution = await prisma.userPlan.groupBy({
      by: ['planId'],
      where: { isActive: true },
      _count: { planId: true }
    })

    console.log('\\n📊 Distribuição por plano:')
    for (const dist of planDistribution) {
      const plan = await prisma.plan.findUnique({
        where: { id: dist.planId },
        select: { name: true, durationMonths: true }
      })
      console.log(`- ${plan?.name} (${plan?.durationMonths} meses): ${dist._count.planId} usuários`)
    }

    // Verificar usuários sem planos por status
    if (otherUsers.length > 0) {
      console.log('\\n❌ Usuários sem planos por status:')
      const statusCounts = otherUsers.reduce((acc: any, user: any) => {
        acc[user.approvalStatus] = (acc[user.approvalStatus] || 0) + 1
        return acc
      }, {})
      
      Object.entries(statusCounts).forEach(([status, count]) => {
        console.log(`- ${status}: ${count} usuários`)
      })
    }

    console.log('\\n🎉 FASE 5 CONCLUÍDA!')
    console.log('📋 DADOS ORIGINAIS DA TABELA USER: PRESERVADOS ✅')
    console.log('📋 SISTEMA DE PLANOS: FUNCIONANDO ✅')
    console.log('📋 LÓGICA DE APROVAÇÃO: IMPLEMENTADA ✅')

  } catch (error) {
    console.error('❌ Erro na FASE 5:', error)
  } finally {
    await prisma.$disconnect()
  }
}

migrateUsersWithApprovalLogic()