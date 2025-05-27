const { PrismaClient } = require('@prisma/client')

const prisma = new PrismaClient()

async function fixAllRichnessScores() {
  try {
    console.log('🔧 Corrigindo richnessScore de todos os clientes...')
    
    // Buscar todos os clientes
    const clients = await prisma.client.findMany({
      select: {
        id: true,
        name: true,
        industry: true,
        serviceOrProduct: true,
        initialObjective: true,
        contactEmail: true,
        contactPhone: true,
        website: true,
        address: true,
        businessDetails: true,
        targetAudience: true,
        marketingObjectives: true,
        historyAndStrategies: true,
        challengesOpportunities: true,
        competitors: true,
        resourcesBudget: true,
        toneOfVoice: true,
        preferencesRestrictions: true,
        richnessScore: true,
      }
    })
    
    console.log(`📊 Encontrados ${clients.length} clientes`)
    
    const fields = [
      'industry', 'serviceOrProduct', 'initialObjective', 'contactEmail', 
      'contactPhone', 'website', 'address', 'businessDetails', 'targetAudience',
      'marketingObjectives', 'historyAndStrategies', 'challengesOpportunities',
      'competitors', 'resourcesBudget', 'toneOfVoice', 'preferencesRestrictions'
    ]
    
    let correctedCount = 0
    
    for (const client of clients) {
      // Calcular richnessScore correto
      const filledFields = fields.filter(field => {
        const value = client[field]
        return value && value.toString().trim().length > 0
      })
      
      const correctScore = Math.round((filledFields.length / fields.length) * 100)
      
      if (client.richnessScore !== correctScore) {
        console.log(`\n🔧 Corrigindo cliente: ${client.name}`)
        console.log(`   - Score atual: ${client.richnessScore}%`)
        console.log(`   - Score correto: ${correctScore}%`)
        console.log(`   - Campos preenchidos: ${filledFields.length}/${fields.length}`)
        
        await prisma.client.update({
          where: { id: client.id },
          data: { richnessScore: correctScore }
        })
        
        correctedCount++
      } else {
        console.log(`✅ ${client.name}: ${client.richnessScore}% (correto)`)
      }
    }
    
    console.log(`\n📈 Resumo:`)
    console.log(`   - Total de clientes: ${clients.length}`)
    console.log(`   - Clientes corrigidos: ${correctedCount}`)
    console.log(`   - Clientes já corretos: ${clients.length - correctedCount}`)
    
    if (correctedCount > 0) {
      console.log(`\n✅ ${correctedCount} clientes tiveram o richnessScore corrigido!`)
    } else {
      console.log(`\n✅ Todos os clientes já tinham richnessScore correto!`)
    }
    
  } catch (error) {
    console.error('❌ Erro:', error)
  } finally {
    await prisma.$disconnect()
  }
}

fixAllRichnessScores() 