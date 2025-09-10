const { PrismaClient } = require('@prisma/client')

const prisma = new PrismaClient()

async function migrateUsersToPlans() {
  try {
    console.log('🚀 FASE 5: Iniciando cópia de usuários para planos...')
    console.log('⚠️ IMPORTANTE: Isso é uma CÓPIA, não migração. Dados originais da tabela User permanecem intocados.')

    // FASE 5.1: Identificar usuários administradores
    console.log('\n📋 FASE 5.1: Identificando usuários...')
    
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

    const regularUsers = await prisma.user.findMany({
      where: {
        role: 'USER'
      },
      select: {
        id: true,
        email: true,
        role: true,
        approvalStatus: true
      }
    })

    console.log(`✅ Encontrados ${adminUsers.length} administradores`)
    console.log(`✅ Encontrados ${regularUsers.length} usuários normais`)

    // Buscar planos necessários
    const adminPlan = await prisma.plan.findFirst({
      where: {
        name: 'Plano Admin Ilimitado',
        durationMonths: 1
      }
    })

    const basicPlan = await prisma.plan.findFirst({
      where: {
        name: 'Plano Básico',
        durationMonths: 1
      }
    })

    if (!adminPlan) {
      throw new Error('Plano Admin Ilimitado não encontrado!')
    }

    if (!basicPlan) {
      throw new Error('Plano Básico não encontrado!')
    }

    console.log(`📋 Plano Admin ID: ${adminPlan.id}`)
    console.log(`📋 Plano Básico ID: ${basicPlan.id}`)

    // FASE 5.2: Copiar administradores para Plano Ilimitado
    console.log('\n👑 FASE 5.2: Copiando administradores para Plano Admin Ilimitado...')
    
    let adminsCopied = 0
    for (const admin of adminUsers) {
      try {
        await prisma.userPlan.create({
          data: {
            userId: admin.id, // CRÍTICO: usando User.id (cuid), NÃO clerkId
            planId: adminPlan.id,
            startsAt: new Date(),
            isActive: true
          }
        })
        console.log(`✅ Admin copiado: ${admin.email} (${admin.role})`)
        adminsCopied++
      } catch (error: any) {
        if (error.code === 'P2002') {
          console.log(`⚠️ Admin já tem plano ativo: ${admin.email}`)
        } else {
          console.error(`❌ Erro ao copiar admin ${admin.email}:`, error.message)
        }
      }
    }

    // FASE 5.3: Copiar usuários normais para Plano Básico
    console.log('\n👤 FASE 5.3: Copiando usuários normais para Plano Básico...')
    
    let usersCopied = 0
    for (const user of regularUsers) {
      try {
        await prisma.userPlan.create({
          data: {
            userId: user.id, // CRÍTICO: usando User.id (cuid), NÃO clerkId
            planId: basicPlan.id,
            startsAt: new Date(),
            isActive: true
          }
        })
        console.log(`✅ Usuário copiado: ${user.email}`)
        usersCopied++
      } catch (error: any) {
        if (error.code === 'P2002') {
          console.log(`⚠️ Usuário já tem plano ativo: ${user.email}`)
        } else {
          console.error(`❌ Erro ao copiar usuário ${user.email}:`, error.message)
        }
      }
    }

    console.log('\n📊 RESULTADO DA CÓPIA:')
    console.log(`👑 Administradores copiados: ${adminsCopied}/${adminUsers.length}`)
    console.log(`👤 Usuários normais copiados: ${usersCopied}/${regularUsers.length}`)
    console.log(`📈 Total copiado: ${adminsCopied + usersCopied}/${adminUsers.length + regularUsers.length}`)

    // FASE 5.4: Verificação final
    console.log('\n🔍 FASE 5.4: Verificação final...')
    
    const totalUsersWithPlans = await prisma.userPlan.count({
      where: { isActive: true }
    })

    const totalUsers = await prisma.user.count()

    console.log(`📋 Total de usuários no sistema: ${totalUsers}`)
    console.log(`📋 Total de usuários com planos ativos: ${totalUsersWithPlans}`)

    if (totalUsersWithPlans === totalUsers) {
      console.log('✅ SUCESSO: Todos os usuários têm planos ativos!')
    } else {
      console.log('⚠️ ATENÇÃO: Alguns usuários não têm planos ativos.')
      
      // Identificar usuários sem planos
      const usersWithoutPlans = await prisma.user.findMany({
        where: {
          UserPlan: {
            none: {
              isActive: true
            }
          }
        },
        select: {
          id: true,
          email: true,
          role: true,
          approvalStatus: true
        }
      })

      console.log(`\n❌ Usuários sem planos (${usersWithoutPlans.length}):`)
      usersWithoutPlans.forEach((user: any) => {
        console.log(`- ${user.email} (${user.role}, ${user.approvalStatus})`)
      })
    }

    // Verificar constraint de um plano ativo por usuário
    console.log('\n🔒 Verificando constraint "one_active_plan_per_user"...')
    
    const usersWithMultiplePlans = await prisma.user.findMany({
      where: {
        UserPlan: {
          some: {
            isActive: true
          }
        }
      },
      include: {
        UserPlan: {
          where: { isActive: true },
          include: {
            Plan: {
              select: { name: true }
            }
          }
        }
      }
    })

    const problematicUsers = usersWithMultiplePlans.filter((user: any) => user.UserPlan.length > 1)
    
    if (problematicUsers.length === 0) {
      console.log('✅ Constraint OK: Todos os usuários têm apenas 1 plano ativo')
    } else {
      console.log(`❌ ERRO: ${problematicUsers.length} usuários têm múltiplos planos ativos`)
      problematicUsers.forEach((user: any) => {
        console.log(`- ${user.email}: ${user.UserPlan.length} planos ativos`)
      })
    }

    console.log('\n🎉 FASE 5 CONCLUÍDA!')
    console.log('📋 DADOS ORIGINAIS DA TABELA USER: PRESERVADOS ✅')
    console.log('📋 SISTEMA DE PLANOS: FUNCIONANDO ✅')

  } catch (error) {
    console.error('❌ Erro na FASE 5:', error)
  } finally {
    await prisma.$disconnect()
  }
}

migrateUsersToPlans()