const { PrismaClient } = require('@prisma/client')

const prisma = new PrismaClient()

async function createNoUserPlan() {
  try {
    console.log('🚀 Criando plano NoUser (plano padrão)...')

    const noUserPlan = await prisma.plan.create({
      data: {
        name: 'Plano NoUser',
        description: 'Plano padrão para usuários sem plano estabelecido',
        maxPlanningsMonth: 0,
        maxTranscriptionMinMonth: 0,
        maxProposalsMonth: 0,
        planType: 'MONTHLY',
        durationMonths: 1,
        isActive: true,
        displayOrder: 0 // Menor ordem para ser o primeiro/padrão
      }
    })

    console.log(`✅ Plano NoUser criado: ${noUserPlan.id}`)
    console.log(`📋 Plano: ${noUserPlan.name}`)
    console.log(`📋 Limites: ${noUserPlan.maxPlanningsMonth} planejamentos, ${noUserPlan.maxTranscriptionMinMonth}s transcrição, ${noUserPlan.maxProposalsMonth} propostas`)

    // Criar versões de 3, 6 e 12 meses também
    const durations = [
      { months: 3, type: 'QUARTERLY', suffix: ' - 3 meses' },
      { months: 6, type: 'SEMIANNUAL', suffix: ' - 6 meses' },
      { months: 12, type: 'ANNUAL', suffix: ' - 12 meses' }
    ]

    console.log('\n📅 Criando versões de diferentes durações...')
    
    for (const duration of durations) {
      const planData = {
        name: 'Plano NoUser' + duration.suffix,
        description: 'Plano padrão para usuários sem plano estabelecido' + ` (${duration.months} meses)`,
        maxPlanningsMonth: 0,
        maxTranscriptionMinMonth: 0,
        maxProposalsMonth: 0,
        planType: duration.type,
        durationMonths: duration.months,
        isActive: true,
        displayOrder: duration.months // 3, 6, 12
      }

      const createdPlan = await prisma.plan.create({
        data: planData
      })

      console.log(`✅ ${planData.name} criado: ${createdPlan.id}`)
    }

    // Listar todos os planos ordenados
    const allPlans = await prisma.plan.findMany({
      orderBy: [
        { displayOrder: 'asc' },
        { durationMonths: 'asc' }
      ]
    })

    console.log('\n📋 Todos os planos no sistema:')
    allPlans.forEach((plan: any) => {
      const duracao = plan.durationMonths === 1 ? '1 mês' : `${plan.durationMonths} meses`
      console.log(`- ${plan.name} (${duracao}): ${plan.maxPlanningsMonth} planejamentos, ${plan.maxTranscriptionMinMonth}s transcrição, ${plan.maxProposalsMonth} propostas`)
    })

    console.log(`\n🎉 Total de planos no sistema: ${allPlans.length}`)
    console.log('✅ Plano NoUser criado como plano padrão para usuários sem plano!')

  } catch (error) {
    console.error('❌ Erro ao criar plano NoUser:', error)
  } finally {
    await prisma.$disconnect()
  }
}

createNoUserPlan()