#!/usr/bin/env node

/**
 * Script para Popular Dados dos Clientes Existentes
 * Adiciona dados ricos aos clientes para melhorar a experiência na aplicação
 */

const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

// Dados de exemplo para enriquecer os clientes
const clientEnrichmentData = {
  'TechNova Solutions': {
    industry: 'Tecnologia',
    serviceOrProduct: 'Soluções de software empresarial e consultoria em transformação digital',
    initialObjective: 'Expandir presença no mercado B2B e aumentar vendas de soluções SaaS',
    contactEmail: 'contato@technova.com.br',
    contactPhone: '(11) 3456-7890',
    website: 'https://www.technova.com.br',
    address: 'Av. Paulista, 1000 - São Paulo, SP',
    businessDetails: 'Empresa especializada em desenvolvimento de software empresarial, com foco em soluções de gestão, automação de processos e transformação digital. Atende principalmente empresas de médio e grande porte.',
    targetAudience: 'Empresas de médio e grande porte (500+ funcionários) dos setores financeiro, industrial e varejo que buscam modernizar seus processos através da tecnologia.',
    marketingObjectives: 'Aumentar reconhecimento da marca no setor B2B, gerar 50% mais leads qualificados e posicionar-se como líder em transformação digital.',
    historyAndStrategies: 'Empresa fundada em 2018, cresceu 200% nos últimos 2 anos. Estratégias anteriores focaram em marketing de conteúdo e eventos do setor.',
    challengesOpportunities: 'Desafio: competição acirrada no setor tech. Oportunidade: crescente demanda por digitalização pós-pandemia.',
    competitors: 'IBM, Accenture, Deloitte Digital, empresas locais como Stefanini e CI&T',
    resourcesBudget: 'Orçamento anual de marketing: R$ 500.000. Equipe interna de 3 pessoas + agências parceiras.',
    toneOfVoice: 'Profissional, inovador, confiável. Linguagem técnica mas acessível, focada em resultados e ROI.',
    preferencesRestrictions: 'Evitar comparações diretas com concorrentes. Foco em cases de sucesso e métricas concretas.'
  },
  'Sabor & Arte Gastronomia': {
    industry: 'Alimentação',
    serviceOrProduct: 'Restaurante gourmet especializado em culinária contemporânea brasileira',
    initialObjective: 'Aumentar movimento nos dias de semana e expandir delivery',
    contactEmail: 'contato@saborarte.com.br',
    contactPhone: '(11) 2345-6789',
    website: 'https://www.saborarte.com.br',
    address: 'Rua Augusta, 500 - Vila Madalena, São Paulo, SP',
    businessDetails: 'Restaurante gourmet com 8 anos de mercado, especializado em culinária brasileira contemporânea. Chef premiado, ambiente sofisticado, foco em experiência gastronômica única.',
    targetAudience: 'Público A/B, 25-55 anos, apreciadores de gastronomia, casais, grupos de amigos, executivos para almoços de negócios.',
    marketingObjectives: 'Aumentar ocupação em 30% nos dias úteis, crescer delivery em 50%, fortalecer presença digital e conquistar novos clientes.',
    historyAndStrategies: 'Marketing tradicional (revistas gastronômicas), parcerias com influencers locais, eventos temáticos sazonais.',
    challengesOpportunities: 'Desafio: alta concorrência na região. Oportunidade: crescimento do delivery e turismo gastronômico em SP.',
    competitors: 'D.O.M., Maní, Mocotó, outros restaurantes da Vila Madalena e Jardins',
    resourcesBudget: 'Orçamento mensal: R$ 15.000. Equipe: proprietário + freelancer para redes sociais.',
    toneOfVoice: 'Sofisticado mas acolhedor, apaixonado por gastronomia, valoriza tradição e inovação.',
    preferencesRestrictions: 'Manter elegância da marca. Evitar promoções que desvalorizem a experiência premium.'
  },
  'FitMax Academia': {
    industry: 'Fitness e Bem-estar',
    serviceOrProduct: 'Academia completa com musculação, aulas coletivas e personal training',
    initialObjective: 'Aumentar número de alunos e reduzir cancelamentos',
    contactEmail: 'contato@fitmax.com.br',
    contactPhone: '(11) 4567-8901',
    website: 'https://www.fitmax.com.br',
    address: 'Av. Rebouças, 1200 - Pinheiros, São Paulo, SP',
    businessDetails: 'Academia moderna com 1500m², equipamentos de última geração, aulas coletivas variadas, personal trainers qualificados. Foco em resultados e acompanhamento personalizado.',
    targetAudience: 'Homens e mulheres, 18-50 anos, classes B/C, moradores da região, profissionais que buscam qualidade de vida e resultados.',
    marketingObjectives: 'Aumentar base de alunos em 25%, reduzir churn em 15%, posicionar como referência em resultados na região.',
    historyAndStrategies: 'Marketing local (panfletagem), parcerias com empresas, campanhas sazonais (verão, ano novo).',
         challengesOpportunities: 'Desafio: alta rotatividade típica do setor. Oportunidade: crescente consciência sobre saúde e bem-estar.',
    competitors: 'Smart Fit, Bio Ritmo, Bodytech, academias locais da região',
    resourcesBudget: 'Orçamento mensal: R$ 8.000. Equipe interna para marketing digital.',
    toneOfVoice: 'Motivacional, energético, focado em resultados. Linguagem direta e inspiradora.',
    preferencesRestrictions: 'Evitar promessas irreais. Foco em saúde e bem-estar, não apenas estética.'
  },
  'EcoVerde Consultoria': {
    industry: 'Sustentabilidade',
    serviceOrProduct: 'Consultoria em sustentabilidade e certificações ambientais para empresas',
    initialObjective: 'Expandir atuação para novos setores e aumentar reconhecimento da marca',
    contactEmail: 'contato@ecoverde.com.br',
    contactPhone: '(11) 5678-9012',
    website: 'https://www.ecoverde.com.br',
    address: 'Rua Vergueiro, 800 - Vila Mariana, São Paulo, SP',
    businessDetails: 'Consultoria especializada em sustentabilidade empresarial, certificações ISO 14001, relatórios ESG, economia circular. 12 anos de experiência, equipe multidisciplinar.',
    targetAudience: 'Empresas médias e grandes de todos os setores que buscam certificações ambientais, compliance ESG ou redução de impacto ambiental.',
    marketingObjectives: 'Posicionar como referência em ESG, aumentar carteira de clientes em 40%, expandir para setor financeiro e agronegócio.',
         historyAndStrategies: 'Marketing B2B tradicional, participação em eventos do setor, conteúdo técnico especializado.',
    challengesOpportunities: 'Desafio: mercado ainda em educação sobre ESG. Oportunidade: regulamentações crescentes e pressão de investidores.',
    competitors: 'KPMG, EY, PwC (grandes consultorias), Bureau Veritas, SGS',
    resourcesBudget: 'Orçamento anual: R$ 120.000. Equipe: sócio-diretor + assistente de marketing.',
    toneOfVoice: 'Técnico, confiável, visionário. Linguagem especializada mas didática.',
    preferencesRestrictions: 'Manter credibilidade técnica. Evitar greenwashing ou promessas exageradas.'
  },
  'Bella Vita Estética': {
    industry: 'Estética e Beleza',
    serviceOrProduct: 'Clínica de estética avançada com tratamentos faciais e corporais',
    initialObjective: 'Aumentar agendamentos e fidelizar clientes',
    contactEmail: 'contato@bellavita.com.br',
    contactPhone: '(11) 6789-0123',
    website: 'https://www.bellavita.com.br',
    address: 'Rua Oscar Freire, 300 - Jardins, São Paulo, SP',
    businessDetails: 'Clínica de estética premium com equipamentos de última geração, profissionais especializados, ambiente luxuoso. Foco em tratamentos anti-idade e harmonização facial.',
    targetAudience: 'Mulheres 25-60 anos, classe A/B, que valorizam autocuidado e investem em beleza e bem-estar.',
    marketingObjectives: 'Aumentar agendamentos em 35%, melhorar retenção de clientes, posicionar como referência em estética avançada.',
         historyAndStrategies: 'Marketing digital focado em Instagram, parcerias com influencers, campanhas sazonais.',
    challengesOpportunities: 'Desafio: mercado saturado na região. Oportunidade: crescimento do mercado de estética masculina.',
    competitors: 'Clínicas dos Jardins, Paulista, outras clínicas premium da região',
    resourcesBudget: 'Orçamento mensal: R$ 12.000. Agência especializada em estética.',
    toneOfVoice: 'Elegante, sofisticado, acolhedor. Foco em autoestima e bem-estar.',
    preferencesRestrictions: 'Manter discrição e elegância. Evitar antes/depois muito explícitos.'
  }
};

async function populateClientData() {
  console.log('=== POPULANDO DADOS DOS CLIENTES ===');
  console.log('Data:', new Date().toISOString());
  console.log('');

  try {
    // Buscar clientes ativos existentes
    const clients = await prisma.client.findMany({
      where: {
        deletedAt: null
      },
      select: {
        id: true,
        name: true,
        industry: true,
        richnessScore: true
      }
    });

    console.log(`Encontrados ${clients.length} clientes ativos para enriquecer`);
    console.log('');

    let updatedCount = 0;

    for (const client of clients) {
      const enrichmentData = clientEnrichmentData[client.name];
      
      if (enrichmentData) {
        console.log(`Enriquecendo cliente: ${client.name}`);
        
        // Calcular novo richnessScore baseado nos campos preenchidos
        const allFields = [
          'industry', 'serviceOrProduct', 'initialObjective', 'contactEmail', 
          'contactPhone', 'website', 'address', 'businessDetails', 'targetAudience',
          'marketingObjectives', 'historyAndStrategies', 'challengesOpportunities',
          'competitors', 'resourcesBudget', 'toneOfVoice', 'preferencesRestrictions'
        ];
        
        const filledFields = allFields.filter(field => {
          const value = enrichmentData[field];
          return value && value.toString().trim().length > 0;
        });
        
        const newRichnessScore = Math.round((filledFields.length / allFields.length) * 100);
        
        await prisma.client.update({
          where: { id: client.id },
          data: {
            ...enrichmentData,
            richnessScore: newRichnessScore,
            updatedAt: new Date()
          }
        });
        
        console.log(`   ✅ Atualizado - RichnessScore: ${client.richnessScore} → ${newRichnessScore}`);
        updatedCount++;
      } else {
        console.log(`   ⚠️  Sem dados de enriquecimento para: ${client.name}`);
      }
    }

    console.log('');
    console.log('=== RESUMO ===');
    console.log(`Clientes processados: ${clients.length}`);
    console.log(`Clientes atualizados: ${updatedCount}`);
    console.log(`Clientes sem dados: ${clients.length - updatedCount}`);

    // Verificar resultado final
    const updatedClients = await prisma.client.findMany({
      where: {
        deletedAt: null
      },
      select: {
        name: true,
        industry: true,
        richnessScore: true,
        contactEmail: true
      },
      orderBy: {
        richnessScore: 'desc'
      }
    });

    console.log('');
    console.log('=== CLIENTES ATUALIZADOS ===');
    updatedClients.forEach((client, index) => {
      console.log(`${index + 1}. ${client.name}`);
      console.log(`   Industry: ${client.industry || 'N/A'}`);
      console.log(`   RichnessScore: ${client.richnessScore}%`);
      console.log(`   Email: ${client.contactEmail || 'N/A'}`);
      console.log('');
    });

    return { success: true, updated: updatedCount, total: clients.length };

  } catch (error) {
    console.error('❌ Erro ao popular dados:', error.message);
    return { success: false, error: error.message };
  } finally {
    await prisma.$disconnect();
  }
}

// Executar se chamado diretamente
if (require.main === module) {
  populateClientData()
    .then((result) => {
      if (result.success) {
        console.log('\n✅ População de dados concluída com sucesso!');
        process.exit(0);
      } else {
        console.log('\n❌ População de dados falhou!');
        process.exit(1);
      }
    })
    .catch((error) => {
      console.error('❌ Erro fatal:', error);
      process.exit(1);
    });
}

module.exports = { populateClientData }; 