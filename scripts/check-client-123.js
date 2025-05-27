const { PrismaClient } = require('@prisma/client')

const prisma = new PrismaClient()

async function checkClient123() {
  try {
    console.log('🔍 Verificando cliente "123"...')
    
    const client = await prisma.client.findFirst({
      where: {
        name: '123'
      }
    })
    
    if (!client) {
      console.log('❌ Cliente "123" não encontrado')
      return
    }
    
    console.log('📋 Dados do cliente:')
    console.log(`  ID: ${client.id}`)
    console.log(`  Nome: ${client.name}`)
    console.log(`  Industry: ${client.industry}`)
    console.log(`  ServiceOrProduct: ${client.serviceOrProduct}`)
    console.log(`  InitialObjective: ${client.initialObjective}`)
    console.log(`  ContactEmail: ${client.contactEmail}`)
    console.log(`  ContactPhone: ${client.contactPhone}`)
    console.log(`  Website: ${client.website}`)
    console.log(`  Address: ${client.address}`)
    console.log(`  BusinessDetails: ${client.businessDetails}`)
    console.log(`  TargetAudience: ${client.targetAudience}`)
    console.log(`  MarketingObjectives: ${client.marketingObjectives}`)
    console.log(`  HistoryAndStrategies: ${client.historyAndStrategies}`)
    console.log(`  ChallengesOpportunities: ${client.challengesOpportunities}`)
    console.log(`  Competitors: ${client.competitors}`)
    console.log(`  ResourcesBudget: ${client.resourcesBudget}`)
    console.log(`  ToneOfVoice: ${client.toneOfVoice}`)
    console.log(`  PreferencesRestrictions: ${client.preferencesRestrictions}`)
    console.log(`  RichnessScore Atual: ${client.richnessScore}%`)
    
    // Recalcular richnessScore
    const fields = [
      'industry', 'serviceOrProduct', 'initialObjective', 'contactEmail', 
      'contactPhone', 'website', 'address', 'businessDetails', 'targetAudience',
      'marketingObjectives', 'historyAndStrategies', 'challengesOpportunities',
      'competitors', 'resourcesBudget', 'toneOfVoice', 'preferencesRestrictions'
    ]
    
    const filledFields = fields.filter(field => {
      const value = client[field]
      return value && value.toString().trim().length > 0
    })
    
    const correctScore = Math.round((filledFields.length / fields.length) * 100)
    
    console.log(`\n📊 Recálculo do RichnessScore:`)
    console.log(`  Campos preenchidos: ${filledFields.length}/${fields.length}`)
    console.log(`  RichnessScore correto: ${correctScore}%`)
    console.log(`  RichnessScore atual: ${client.richnessScore}%`)
    console.log(`  Diferença: ${client.richnessScore - correctScore}%`)
    
    if (client.richnessScore !== correctScore) {
      console.log(`\n🔧 Corrigindo richnessScore...`)
      
      await prisma.client.update({
        where: { id: client.id },
        data: { richnessScore: correctScore }
      })
      
      console.log(`✅ RichnessScore corrigido de ${client.richnessScore}% para ${correctScore}%`)
    } else {
      console.log(`\n✅ RichnessScore está correto`)
    }
    
  } catch (error) {
    console.error('❌ Erro:', error)
  } finally {
    await prisma.$disconnect()
  }
}

checkClient123() 