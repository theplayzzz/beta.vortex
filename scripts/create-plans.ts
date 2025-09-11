const { PrismaClient } = require('@prisma/client')

const prisma = new PrismaClient()

async function createPlans() {
  try {
    console.log('🚀 Criando planos iniciais...')

    // 1. Plano Básico
    const basicPlan = await prisma.plan.create({
      data: {
        name: 'Plano Básico',
        description: 'Plano padrão para usuários regulares',
        maxPlanningsMonth: 25,
        maxTranscriptionMinMonth: 28800, // 8 horas em segundos
        maxProposalsMonth: 30,
        planType: 'MONTHLY',
        durationMonths: 1,
        isActive: true,
        displayOrder: 1
      }
    })
    console.log('✅ Plano Básico criado:', basicPlan.id)

    // 2. Plano Aluno
    const studentPlan = await prisma.plan.create({
      data: {
        name: 'Plano Aluno',
        description: 'Plano especial para estudantes',
        maxPlanningsMonth: 2,
        maxTranscriptionMinMonth: 0, // Zero minutos
        maxProposalsMonth: 5,
        planType: 'MONTHLY',
        durationMonths: 1,
        isActive: true,
        displayOrder: 2
      }
    })
    console.log('✅ Plano Aluno criado:', studentPlan.id)

    // 3. Trial Spalla
    const trialPlan = await prisma.plan.create({
      data: {
        name: 'Trial Spalla',
        description: 'Plano trial focado em transcrição',
        maxPlanningsMonth: 0, // Zero planejamentos
        maxTranscriptionMinMonth: 3600, // 1 hora em segundos
        maxProposalsMonth: 0, // Zero propostas
        planType: 'MONTHLY',
        durationMonths: 1,
        isActive: true,
        displayOrder: 3
      }
    })
    console.log('✅ Trial Spalla criado:', trialPlan.id)

    // 4. Plano Admin Ilimitado
    const adminPlan = await prisma.plan.create({
      data: {
        name: 'Plano Admin Ilimitado',
        description: 'Plano sem limites para administradores',
        maxPlanningsMonth: 999999, // Ilimitado
        maxTranscriptionMinMonth: 999999, // Ilimitado
        maxProposalsMonth: 999999, // Ilimitado
        planType: 'MONTHLY',
        durationMonths: 1,
        isActive: true,
        displayOrder: 4
      }
    })
    console.log('✅ Plano Admin Ilimitado criado:', adminPlan.id)

    console.log('🎉 Todos os planos foram criados com sucesso!')

    // Listar planos criados
    const allPlans = await prisma.plan.findMany({
      orderBy: { displayOrder: 'asc' }
    })

    console.log('\n📋 Planos criados:')
    allPlans.forEach((plan: any) => {
      console.log(`- ${plan.name}: ${plan.maxPlanningsMonth} planejamentos, ${plan.maxTranscriptionMinMonth}s transcrição, ${plan.maxProposalsMonth} propostas`)
    })

  } catch (error) {
    console.error('❌ Erro ao criar planos:', error)
  } finally {
    await prisma.$disconnect()
  }
}

createPlans()