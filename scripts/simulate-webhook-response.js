const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

async function simulateWebhookResponse() {
  try {
    console.log('🔄 Simulando resposta do webhook...\n');

    // 1. Buscar planejamento em processamento
    const processing = await prisma.strategicPlanning.findFirst({
      where: {
        status: 'PENDING_AI_REFINED_LIST'
      },
      orderBy: {
        createdAt: 'desc'
      }
    });

    if (!processing) {
      console.log('❌ Nenhum planejamento em estado PENDING_AI_REFINED_LIST encontrado.');
      console.log('Execute: node scripts/test-plan-010.js primeiro');
      return;
    }

    console.log('✅ Planejamento encontrado:', processing.title);
    console.log('📋 ID:', processing.id);
    console.log('🔄 Status atual:', processing.status);

    // 2. Simular dados refinados da IA
    const refinedTasks = {
      tarefas_refinadas: [
        {
          nome: 'Configuração do Sistema de Autenticação Avançado',
          descricao: 'Implementar sistema completo de autenticação com múltiplas camadas de segurança, incluindo OAuth, 2FA e controle de sessões.',
          prioridade: 'alta',
          output: 'Sistema de autenticação completo com:\n- Integração com provedores OAuth (Google, GitHub, LinkedIn)\n- Autenticação em duas etapas (2FA)\n- Controle de sessões e tokens JWT\n- Middleware de proteção de rotas\n- Logs de auditoria de acesso\n- Documentação completa de implementação'
        },
        {
          nome: 'Dashboard de Analytics e Métricas em Tempo Real',
          descricao: 'Desenvolver dashboard interativo para visualização de métricas de negócio, KPIs e relatórios em tempo real com capacidade de exportação.',
          prioridade: 'média',
          output: 'Dashboard completo contendo:\n- Gráficos interativos (Chart.js/Recharts)\n- Cards de KPIs principais\n- Filtros por período e categorias\n- Sistema de alertas personalizáveis\n- Exportação para PDF e Excel\n- Interface responsiva para mobile\n- Cache de dados para performance'
        },
        {
          nome: 'API RESTful para Integração de Terceiros',
          descricao: 'Construir API robusta para integração com sistemas externos, incluindo webhook, rate limiting e documentação completa.',
          prioridade: 'normal',
          output: 'API completa incluindo:\n- Endpoints RESTful documentados (OpenAPI/Swagger)\n- Sistema de webhooks para notificações\n- Autenticação por API keys\n- Rate limiting e throttling\n- Versionamento de API\n- Logs detalhados de requisições\n- Testes automatizados (Jest/Supertest)'
        },
        {
          nome: 'Sistema de Notificações Push Inteligente',
          descricao: 'Implementar sistema completo de notificações push para web e mobile com personalização avançada e analytics de engajamento.',
          prioridade: 'normal',
          output: 'Sistema de notificações com:\n- Push notifications para PWA\n- Integração com Firebase Cloud Messaging\n- Templates personalizáveis por usuário\n- Agendamento de notificações\n- Analytics de abertura e engajamento\n- Preferências granulares de usuário\n- Fallback para email quando offline'
        }
      ]
    };

    // 3. Aguardar um pouco para simular processamento
    console.log('\n⏳ Aguardando 3 segundos (simulando processamento da IA)...');
    await new Promise(resolve => setTimeout(resolve, 3000));

    // 4. Atualizar planejamento com dados refinados
    const updated = await prisma.strategicPlanning.update({
      where: { id: processing.id },
      data: {
        status: 'AI_REFINED_LIST_VISIBLE',
        scope: JSON.stringify(refinedTasks)
      }
    });

    console.log('\n✅ Webhook simulado com sucesso!');
    console.log('🔄 Status atualizado para:', updated.status);
    console.log('📦 Campo scope preenchido com', refinedTasks.tarefas_refinadas.length, 'tarefas refinadas');
    
    console.log('\n🧪 TESTE O POLLING:');
    console.log('1. Abra o navegador em: http://localhost:3000/planejamentos/' + processing.id);
    console.log('2. Vá para a aba "Planejamento Refinado"');
    console.log('3. A interface deve atualizar automaticamente em até 2 segundos!');
    
    console.log('\n📊 Detalhes das tarefas criadas:');
    refinedTasks.tarefas_refinadas.forEach((task, index) => {
      console.log(`${index + 1}. ${task.nome} (${task.prioridade})`);
    });

  } catch (error) {
    console.error('❌ Erro ao simular webhook:', error);
  } finally {
    await prisma.$disconnect();
  }
}

simulateWebhookResponse(); 