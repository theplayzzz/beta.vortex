const { PrismaClient } = require('@prisma/client')

const prisma = new PrismaClient()

async function testClientCreation() {
  try {
    console.log('🧪 Testando criação de cliente...')
    
    // Buscar um usuário existente
    const user = await prisma.user.findFirst()
    if (!user) {
      console.log('❌ Nenhum usuário encontrado')
      return
    }
    
    console.log(`✅ Usuário encontrado: ${user.email}`)
    
    // Criar cliente com dados mínimos (apenas nome)
    const clientMinimal = await prisma.client.create({
      data: {
        name: 'Cliente Teste Mínimo',
        userId: user.id,
      },
    })
    
    console.log(`✅ Cliente mínimo criado:`)
    console.log(`   - ID: ${clientMinimal.id}`)
    console.log(`   - Nome: ${clientMinimal.name}`)
    console.log(`   - RichnessScore: ${clientMinimal.richnessScore}% (esperado: 0%)`)
    
    // Criar cliente com alguns dados
    const clientPartial = await prisma.client.create({
      data: {
        name: 'Cliente Teste Parcial',
        industry: 'Tecnologia',
        serviceOrProduct: 'Software',
        initialObjective: 'Aumentar vendas',
        contactEmail: 'teste@exemplo.com',
        userId: user.id,
      },
    })
    
    console.log(`✅ Cliente parcial criado:`)
    console.log(`   - ID: ${clientPartial.id}`)
    console.log(`   - Nome: ${clientPartial.name}`)
    console.log(`   - RichnessScore: ${clientPartial.richnessScore}% (esperado: 25% = 4/16 campos)`)
    
    // Testar busca de cliente específico
    console.log('\n🔍 Testando busca de cliente específico...')
    
    const foundClient = await prisma.client.findFirst({
      where: {
        id: clientPartial.id,
        userId: user.id,
        deletedAt: null
      },
      include: {
        _count: {
          select: {
            ClientNote: true,
            ClientAttachment: true,
            StrategicPlanning: true,
            PlanningTask: true,
          },
        },
      },
    })
    
    if (foundClient) {
      console.log(`✅ Cliente encontrado via Prisma:`)
      console.log(`   - ID: ${foundClient.id}`)
      console.log(`   - Nome: ${foundClient.name}`)
      console.log(`   - RichnessScore: ${foundClient.richnessScore}%`)
      console.log(`   - Contadores:`, foundClient._count)
    } else {
      console.log('❌ Cliente não encontrado via Prisma')
    }
    
    // Limpar dados de teste
    await prisma.client.delete({ where: { id: clientMinimal.id } })
    await prisma.client.delete({ where: { id: clientPartial.id } })
    
    console.log('\n✅ Dados de teste removidos')
    
  } catch (error) {
    console.error('❌ Erro no teste:', error)
  } finally {
    await prisma.$disconnect()
  }
}

testClientCreation() 