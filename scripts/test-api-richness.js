// Simular o cálculo do richnessScore da API

function calculateRichnessScore(clientData) {
  const fields = [
    'industry', 'serviceOrProduct', 'initialObjective', 'contactEmail', 
    'contactPhone', 'website', 'address', 'businessDetails', 'targetAudience',
    'marketingObjectives', 'historyAndStrategies', 'challengesOpportunities',
    'competitors', 'resourcesBudget', 'toneOfVoice', 'preferencesRestrictions'
  ]
  
  console.log('📊 Calculando richnessScore...')
  console.log('Campos considerados:', fields.length)
  
  const filledFields = fields.filter(field => {
    const value = clientData[field]
    const isFilled = value && value.toString().trim().length > 0
    console.log(`  ${field}: "${value}" -> ${isFilled ? '✅' : '❌'}`)
    return isFilled
  })
  
  const score = Math.round((filledFields.length / fields.length) * 100)
  
  console.log(`\n📈 Resultado:`)
  console.log(`  Campos preenchidos: ${filledFields.length}/${fields.length}`)
  console.log(`  RichnessScore: ${score}%`)
  
  return score
}

// Teste 1: Cliente mínimo (apenas nome)
console.log('🧪 TESTE 1: Cliente mínimo')
const clientMinimal = {
  name: 'Cliente Teste Mínimo'
}
calculateRichnessScore(clientMinimal)

console.log('\n' + '='.repeat(50) + '\n')

// Teste 2: Cliente parcial
console.log('🧪 TESTE 2: Cliente parcial')
const clientPartial = {
  name: 'Cliente Teste Parcial',
  industry: 'Tecnologia',
  serviceOrProduct: 'Software',
  initialObjective: 'Aumentar vendas',
  contactEmail: 'teste@exemplo.com'
}
calculateRichnessScore(clientPartial)

console.log('\n' + '='.repeat(50) + '\n')

// Teste 3: Cliente completo
console.log('🧪 TESTE 3: Cliente completo')
const clientComplete = {
  name: 'Cliente Completo',
  industry: 'Tecnologia',
  serviceOrProduct: 'Software',
  initialObjective: 'Aumentar vendas',
  contactEmail: 'teste@exemplo.com',
  contactPhone: '(11) 99999-9999',
  website: 'https://exemplo.com',
  address: 'Rua Exemplo, 123',
  businessDetails: 'Empresa de software',
  targetAudience: 'Empresas B2B',
  marketingObjectives: 'Gerar leads',
  historyAndStrategies: 'Marketing digital',
  challengesOpportunities: 'Competição acirrada',
  competitors: 'Empresa X, Y, Z',
  resourcesBudget: 'R$ 50.000/mês',
  toneOfVoice: 'Profissional e amigável',
  preferencesRestrictions: 'Sem restrições'
}
calculateRichnessScore(clientComplete) 