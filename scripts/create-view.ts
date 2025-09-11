const { PrismaClient } = require('@prisma/client')

const prisma = new PrismaClient()

async function createView() {
  try {
    console.log('🚀 Criando view CurrentUserPlan...')

    await prisma.$executeRawUnsafe(`
      CREATE VIEW "CurrentUserPlan" AS
      SELECT 
        up."userId", 
        p.id as "planId",
        p.name as "planName",
        p.description,
        p."maxPlanningsMonth",
        p."maxTranscriptionMinMonth", 
        p."maxProposalsMonth",
        p."planType",
        p."durationMonths",
        up."startsAt", 
        up."endsAt",
        up."createdAt" as "userPlanCreatedAt"
      FROM "UserPlan" up
      JOIN "Plan" p ON up."planId" = p.id
      WHERE up."isActive" = true 
        AND (up."endsAt" IS NULL OR up."endsAt" > NOW())
    `)

    console.log('✅ View CurrentUserPlan criada com sucesso!')

  } catch (error) {
    console.error('❌ Erro ao criar view:', error)
  } finally {
    await prisma.$disconnect()
  }
}

createView()