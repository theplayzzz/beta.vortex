const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

// Dados de exemplo de tarefas geradas pela IA
const exampleBacklogData = {
  nome_do_backlog: "Backlog Estratégico 60 dias - Advocacia Info-produtor",
  objetivo_do_backlog: "Estruturar e profissionalizar o marketing e o comercial para aumentar vendas de cursos jurídicos online, melhorar presença digital e automatizar processos de captação de leads qualificados.",
  tarefas: [
    {
      nome: "Configuração do Gerenciador de Anúncios (Meta Ads)",
      descricao: "Criar e configurar a conta de anúncios no Meta Ads para começar as campanhas de mídia paga de forma profissional.",
      prioridade: "alta",
      selecionada: true,
      detalhamentos: []
    },
    {
      nome: "Criação de Landing Page Otimizada",
      descricao: "Desenvolver uma página de captura focada na conversão de visitantes em leads qualificados para os cursos jurídicos.",
      prioridade: "alta", 
      selecionada: true,
      detalhamentos: []
    },
    {
      nome: "Setup do CRM para Advocacia",
      descricao: "Implementar e configurar um sistema de CRM especializado para escritórios de advocacia, organizando contatos e oportunidades.",
      prioridade: "média",
      selecionada: true,
      detalhamentos: []
    },
    {
      nome: "Estratégia de Conteúdo Jurídico",
      descricao: "Desenvolver cronograma editorial com conteúdo especializado em direito, incluindo artigos, vídeos e posts para redes sociais.",
      prioridade: "normal",
      selecionada: true,
      detalhamentos: []
    },
    {
      nome: "Automação de E-mail Marketing",
      descricao: "Criar sequências automatizadas de e-mails para nutrição de leads interessados em cursos jurídicos.",
      prioridade: "média",
      selecionada: false,
      detalhamentos: []
    },
    {
      nome: "Implementação de Chatbot Jurídico",
      descricao: "Configurar chatbot inteligente para atendimento inicial e qualificação de prospects interessados em serviços jurídicos.",
      prioridade: "normal",
      selecionada: false,
      detalhamentos: []
    },
    {
      nome: "Otimização SEO para Palavras-chave Jurídicas",
      descricao: "Implementar estratégia de SEO focada em termos relacionados ao direito e advocacia para melhorar ranqueamento orgânico.",
      prioridade: "normal",
      selecionada: true,
      detalhamentos: []
    },
    {
      nome: "Criação de Webinários Educativos",
      descricao: "Planejar e executar webinários gratuitos sobre temas jurídicos relevantes para captar e educar potenciais clientes.",
      prioridade: "média",
      selecionada: true,
      detalhamentos: []
    },
    {
      nome: "Dashboard de Métricas e KPIs",
      descricao: "Configurar painel de controle para monitorar métricas de marketing e vendas, incluindo CAC, LTV e taxa de conversão.",
      prioridade: "alta",
      selecionada: true,
      detalhamentos: []
    },
    {
      nome: "Envio de Feedback Semanal à Agência",
      descricao: "Enviar relatórios informais sobre evolução dos leads, vendas e dúvidas à agência, facilitando ajustes rápidos de estratégia.",
      prioridade: "normal",
      selecionada: false,
      detalhamentos: []
    }
  ]
};

async function populatePlanningWithTasks() {
  try {
    console.log('🚀 Iniciando população de dados de planejamento com tarefas...');
    
    // Buscar um usuário existente
    const user = await prisma.user.findFirst({
      include: {
        Client: true
      }
    });
    
    if (!user) {
      console.error('❌ Nenhum usuário encontrado. Execute primeiro o script de população de clientes.');
      return;
    }
    
    console.log(`✅ Usuário encontrado: ${user.firstName} ${user.lastName}`);
    
    // Buscar um cliente do usuário
    const client = user.Client.length > 0 ? user.Client[0] : null;
    
    if (!client) {
      console.error('❌ Nenhum cliente encontrado para este usuário.');
      return;
    }
    
    console.log(`✅ Cliente encontrado: ${client.name}`);
    
    // Criar planejamento com tarefas estruturadas
    const planning = await prisma.strategicPlanning.create({
      data: {
        title: "Planejamento Estratégico - Advocacia Digital",
        description: "Estratégia completa para transformação digital de escritório de advocacia especializado em info-produtos jurídicos",
        status: "AI_BACKLOG_VISIBLE",
        userId: user.id,
        clientId: client.id,
        specificObjectives: JSON.stringify(exampleBacklogData),
        formDataJSON: {
          informacoes_basicas: {
            titulo_planejamento: "Planejamento Estratégico - Advocacia Digital",
            descricao_objetivo: "Transformar escritório tradicional em referência digital com foco em info-produtos jurídicos"
          },
          detalhes_do_setor: {
            advocacia_area_atuacao: "Direito Digital e Empresarial",
            advocacia_numero_clientes: "50-100",
            advocacia_ticket_medio: "R$ 2.500"
          },
          marketing: {
            maturidade_marketing: "Iniciante - poucas ações estruturadas",
            meta_marketing: "Aumentar reconhecimento da marca e captar leads qualificados"
          },
          comercial: {
            maturidade_comercial: "Processo básico, sem funil estruturado",
            meta_comercial: "Estruturar funil de vendas e aumentar conversão"
          }
        },
        clientSnapshot: {
          id: client.id,
          name: client.name,
          industry: client.industry,
          richnessScore: client.richnessScore,
          snapshot_timestamp: new Date().toISOString()
        }
      },
      include: {
        Client: true
      }
    });
    
    console.log(`✅ Planejamento criado com sucesso:`);
    console.log(`   ID: ${planning.id}`);
    console.log(`   Título: ${planning.title}`);
    console.log(`   Status: ${planning.status}`);
    console.log(`   Cliente: ${planning.Client.name}`);
    console.log(`   Tarefas: ${exampleBacklogData.tarefas.length} tarefas geradas pela IA`);
    console.log(`   URL: http://localhost:3000/planejamentos/${planning.id}`);
    
    console.log('\n🎯 Sistema de Refinamento de Tarefas pronto para teste!');
    console.log('   - Acesse a URL acima');
    console.log('   - Clique na aba "Objetivos Específicos"');
    console.log('   - Teste as funcionalidades de seleção, edição e aprovação');
    
  } catch (error) {
    console.error('❌ Erro ao criar planejamento:', error);
  } finally {
    await prisma.$disconnect();
  }
}

// Executar se chamado diretamente
if (require.main === module) {
  populatePlanningWithTasks();
}

module.exports = { populatePlanningWithTasks, exampleBacklogData }; 