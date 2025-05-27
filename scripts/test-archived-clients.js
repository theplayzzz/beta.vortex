const { PrismaClient } = require('@prisma/client')

const prisma = new PrismaClient()

async function testArchivedClients() {
  try {
    console.log('🗂️ Testando clientes arquivados...')
    
    // 1. Buscar clientes arquivados via Prisma
    console.log('\n1️⃣ Buscando clientes arquivados via Prisma...')
    
    const archivedClients = await prisma.client.findMany({
      where: {
        deletedAt: { not: null }
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
    
    console.log(`✅ Encontrados ${archivedClients.length} clientes arquivados via Prisma:`)
    archivedClients.forEach((client, index) => {
      console.log(`   ${index + 1}. ${client.name} (ID: ${client.id})`)
      console.log(`      - Industry: ${client.industry}`)
      console.log(`      - RichnessScore: ${client.richnessScore}%`)
      console.log(`      - Arquivado em: ${client.deletedAt}`)
      console.log(`      - Contadores:`, client._count)
    })
    
    // 2. Testar API com includeArchived=true
    console.log('\n2️⃣ Testando API com includeArchived=true...')
    
    // Simular busca da API (sem autenticação para teste)
    const allClients = await prisma.client.findMany({
      where: {
        // Sem filtro de deletedAt para incluir arquivados
      },
      select: {
        id: true,
        name: true,
        industry: true,
        serviceOrProduct: true,
        initialObjective: true,
        contactEmail: true,
        richnessScore: true,
        isViewed: true,
        createdAt: true,
        updatedAt: true,
        deletedAt: true,
        _count: {
          select: {
            ClientNote: true,
            ClientAttachment: true,
          },
        },
      },
    })
    
    // Filtrar apenas os arquivados (como faz o componente)
    const filteredArchived = allClients.filter(client => client.deletedAt)
    
    console.log(`✅ API simulada retornaria ${filteredArchived.length} clientes arquivados:`)
    filteredArchived.forEach((client, index) => {
      console.log(`   ${index + 1}. ${client.name}`)
      console.log(`      - RichnessScore: ${client.richnessScore}%`)
      console.log(`      - Contadores: Notas: ${client._count.ClientNote}, Anexos: ${client._count.ClientAttachment}`)
    })
    
    // 3. Verificar se há diferenças
    console.log('\n3️⃣ Verificando consistência...')
    
    if (archivedClients.length === filteredArchived.length) {
      console.log(`✅ Consistência OK: ${archivedClients.length} clientes em ambas as consultas`)
    } else {
      console.log(`❌ Inconsistência: Prisma direto: ${archivedClients.length}, API simulada: ${filteredArchived.length}`)
    }
    
    // 4. Testar estrutura de dados
    console.log('\n4️⃣ Verificando estrutura de dados...')
    
    if (filteredArchived.length > 0) {
      const firstClient = filteredArchived[0]
      console.log('✅ Estrutura do primeiro cliente arquivado:')
      console.log('   - Tem ID:', !!firstClient.id)
      console.log('   - Tem nome:', !!firstClient.name)
      console.log('   - Tem deletedAt:', !!firstClient.deletedAt)
      console.log('   - Tem _count:', !!firstClient._count)
      console.log('   - Tem _count.ClientNote:', firstClient._count.hasOwnProperty('ClientNote'))
      console.log('   - Tem _count.ClientAttachment:', firstClient._count.hasOwnProperty('ClientAttachment'))
      
      // Verificar se os nomes estão corretos
      const hasCorrectNames = firstClient._count.hasOwnProperty('ClientNote') && 
                             firstClient._count.hasOwnProperty('ClientAttachment')
      
      if (hasCorrectNames) {
        console.log('✅ Nomes dos relacionamentos estão corretos!')
      } else {
        console.log('❌ Nomes dos relacionamentos estão incorretos!')
        console.log('   Propriedades disponíveis:', Object.keys(firstClient._count))
      }
    }
    
    console.log('\n📋 Resumo:')
    console.log(`   - Clientes arquivados no banco: ${archivedClients.length}`)
    console.log(`   - API retornaria: ${filteredArchived.length}`)
    console.log(`   - Estrutura de dados: ${filteredArchived.length > 0 ? 'OK' : 'N/A'}`)
    
  } catch (error) {
    console.error('❌ Erro no teste:', error)
  } finally {
    await prisma.$disconnect()
  }
}

testArchivedClients() 