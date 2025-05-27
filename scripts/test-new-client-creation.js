const { PrismaClient } = require('@prisma/client')

const prisma = new PrismaClient()

async function testNewClientCreation() {
  try {
    console.log('🧪 Testando criação de cliente com richnessScore correto...')
    
    // Buscar um usuário existente
    const user = await prisma.user.findFirst()
    if (!user) {
      console.log('❌ Nenhum usuário encontrado')
      return
    }
    
    console.log(`✅ Usuário encontrado: ${user.email}`)
    
    // Simular dados que viriam da API (apenas campos aceitos na criação)
    const validatedData = {
      name: 'Cliente Teste Novo',
      industry: 'Tecnologia',
      serviceOrProduct: 'Software',
      initialObjective: 'Aumentar vendas'
    }
    
    // Calcular richnessScore como a API faz (baseado em todos os 16 campos)
    const allFields = [
      'industry', 'serviceOrProduct', 'initialObjective', 'contactEmail', 
      'contactPhone', 'website', 'address', 'businessDetails', 'targetAudience',
      'marketingObjectives', 'historyAndStrategies', 'challengesOpportunities',
      'competitors', 'resourcesBudget', 'toneOfVoice', 'preferencesRestrictions'
    ]
    
    const filledFields = allFields.filter(field => {
      const value = validatedData[field]
      return value && value.toString().trim().length > 0
    })

    const initialRichnessScore = Math.round((filledFields.length / allFields.length) * 100)
    
    console.log(`📊 Cálculo do richnessScore:`)
    console.log(`  Campos considerados: ${allFields.length} campos totais`)
    console.log(`  Campos preenchidos: ${filledFields.length}/${allFields.length}`)
    console.log(`  RichnessScore calculado: ${initialRichnessScore}%`)
    
    // Criar cliente
    const client = await prisma.client.create({
      data: {
        name: validatedData.name,
        industry: validatedData.industry || null,
        serviceOrProduct: validatedData.serviceOrProduct || null,
        initialObjective: validatedData.initialObjective || null,
        richnessScore: initialRichnessScore,
        userId: user.id,
      },
    })
    
    console.log(`✅ Cliente criado:`)
    console.log(`   - ID: ${client.id}`)
    console.log(`   - Nome: ${client.name}`)
    console.log(`   - Industry: ${client.industry}`)
    console.log(`   - ServiceOrProduct: ${client.serviceOrProduct}`)
    console.log(`   - InitialObjective: ${client.initialObjective}`)
    console.log(`   - RichnessScore: ${client.richnessScore}% (esperado: ${initialRichnessScore}%)`)
    
    // Verificar se está correto
    if (client.richnessScore === initialRichnessScore) {
      console.log(`✅ RichnessScore está correto!`)
    } else {
      console.log(`❌ RichnessScore incorreto! Esperado: ${initialRichnessScore}%, Atual: ${client.richnessScore}%`)
    }
    
    // Limpar dados de teste
    await prisma.client.delete({ where: { id: client.id } })
    console.log('\n✅ Dados de teste removidos')
    
  } catch (error) {
    console.error('❌ Erro no teste:', error)
  } finally {
    await prisma.$disconnect()
  }
}

testNewClientCreation() 