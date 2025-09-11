const { PrismaClient } = require('@prisma/client')

const prisma = new PrismaClient()

async function createDurationPlans() {
  try {
    console.log('🚀 Criando planos de 3, 6 e 12 meses...')

    // Dados base dos planos
    const basePlans = [
      {
        name: 'Plano Básico',
        description: 'Plano padrão para usuários regulares',
        maxPlanningsMonth: 25,
        maxTranscriptionMinMonth: 28800,
        maxProposalsMonth: 30,
        baseOrder: 1
      },
      {
        name: 'Plano Aluno',
        description: 'Plano especial para estudantes',
        maxPlanningsMonth: 2,
        maxTranscriptionMinMonth: 0,
        maxProposalsMonth: 5,
        baseOrder: 2
      },
      {
        name: 'Trial Spalla',
        description: 'Plano trial focado em transcrição',
        maxPlanningsMonth: 0,
        maxTranscriptionMinMonth: 3600,
        maxProposalsMonth: 0,
        baseOrder: 3
      },
      {
        name: 'Plano Admin Ilimitado',
        description: 'Plano sem limites para administradores',
        maxPlanningsMonth: 999999,
        maxTranscriptionMinMonth: 999999,
        maxProposalsMonth: 999999,
        baseOrder: 4
      }
    ]

    const durations = [
      { months: 3, type: 'QUARTERLY', suffix: ' - 3 meses' },
      { months: 6, type: 'SEMIANNUAL', suffix: ' - 6 meses' },
      { months: 12, type: 'ANNUAL', suffix: ' - 12 meses' }
    ]

    let createdCount = 0

    for (const duration of durations) {
      console.log(`\n📅 Criando planos de ${duration.months} meses...`)
      
      for (const basePlan of basePlans) {
        const planData = {
          name: basePlan.name + duration.suffix,
          description: basePlan.description + ` (${duration.months} meses)`,
          maxPlanningsMonth: basePlan.maxPlanningsMonth,
          maxTranscriptionMinMonth: basePlan.maxTranscriptionMinMonth,
          maxProposalsMonth: basePlan.maxProposalsMonth,
          planType: duration.type,
          durationMonths: duration.months,
          isActive: true,
          displayOrder: (basePlan.baseOrder * 10) + duration.months // 11, 13, 16, 112 etc
        }

        const createdPlan = await prisma.plan.create({
          data: planData
        })

        console.log(`✅ ${planData.name} criado: ${createdPlan.id}`)
        createdCount++
      }
    }

    console.log(`\n🎉 Total de ${createdCount} planos criados com sucesso!`)

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

    console.log(`\n📊 Total de planos no sistema: ${allPlans.length}`)

  } catch (error) {
    console.error('❌ Erro ao criar planos:', error)
  } finally {
    await prisma.$disconnect()
  }
}

createDurationPlans()