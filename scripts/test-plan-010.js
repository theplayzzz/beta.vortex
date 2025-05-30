const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

async function createTestData() {
  try {
    console.log('🧪 Criando dados de teste para Plan-010...\n');

    // 1. Buscar primeiro usuário existente
    const user = await prisma.user.findFirst();
    
    if (!user) {
      console.log('❌ Nenhum usuário encontrado no banco. Execute o seed primeiro.');
      return;
    }

    console.log('✅ Usuário encontrado:', user.email);

    // 2. Criar cliente de teste
    const testClient = await prisma.client.create({
      data: {
        name: 'Empresa Teste Plan-010',
        industry: 'Tecnologia',
        richnessScore: 75,
        businessDetails: 'Empresa de tecnologia focada em soluções digitais',
        contactEmail: 'contato@empresateste.com',
        website: 'https://empresateste.com',
        userId: user.id
      }
    });

    console.log('✅ Cliente de teste criado:', testClient.name);

    // 3. Criar planejamento com tarefas estruturadas (status AI_BACKLOG_VISIBLE)
    const planningWithTasks = await prisma.strategicPlanning.create({
      data: {
        title: 'Planejamento Estratégico - Teste Plan-010',
        description: 'Planejamento para testar funcionalidades do Plan-010',
        status: 'AI_BACKLOG_VISIBLE',
        clientId: testClient.id,
        userId: user.id,
        formDataJSON: {
          informacoes_basicas: {
            titulo_planejamento: 'Planejamento Estratégico - Teste Plan-010',
            descricao_objetivo: 'Testar funcionalidades do Plan-010',
            setor: 'Tecnologia'
          }
        },
        specificObjectives: JSON.stringify({
          nome_do_backlog: 'Backlog Estratégico - Teste Plan-010',
          objetivo_do_backlog: 'Implementar melhorias no sistema de aprovação com nova aba de planejamento refinado',
          tarefas: [
            {
              nome: 'Implementar Pop-up de Confirmação',
              descricao: 'Criar modal de confirmação antes da aprovação das tarefas selecionadas',
              prioridade: 'alta'
            },
            {
              nome: 'Criar Nova Aba Planejamento Refinado',
              descricao: 'Adicionar nova aba ao lado direito da aba Objetivos Específicos',
              prioridade: 'alta'
            },
            {
              nome: 'Sistema de Loading Dinâmico',
              descricao: 'Implementar animações de loading e feedback visual durante processamento',
              prioridade: 'média'
            },
            {
              nome: 'Lista de Tarefas Estilo ClickUp',
              descricao: 'Criar componente para exibir tarefas refinadas em formato similar ao ClickUp',
              prioridade: 'média'
            },
            {
              nome: 'Modal de Detalhes da Tarefa',
              descricao: 'Implementar modal para exibir detalhes completos ao clicar em uma tarefa',
              prioridade: 'normal'
            }
          ]
        })
      }
    });

    console.log('✅ Planejamento com tarefas criado:', planningWithTasks.title);

    // 4. Criar planejamento com status PENDING_AI_REFINED_LIST (para testar loading)
    const planningProcessing = await prisma.strategicPlanning.create({
      data: {
        title: 'Planejamento em Processamento - Plan-010',
        description: 'Planejamento para testar estado de loading da nova aba',
        status: 'PENDING_AI_REFINED_LIST',
        clientId: testClient.id,
        userId: user.id,
        formDataJSON: {
          informacoes_basicas: {
            titulo_planejamento: 'Planejamento em Processamento - Plan-010',
            descricao_objetivo: 'Testar estado de loading',
            setor: 'Tecnologia'
          }
        },
        specificObjectives: JSON.stringify({
          nome_do_backlog: 'Backlog em Processamento',
          objetivo_do_backlog: 'Testar estados de loading',
          tarefas: [
            {
              nome: 'Tarefa Aprovada 1',
              descricao: 'Primeira tarefa aprovada para processamento',
              prioridade: 'alta',
              selecionada: true
            },
            {
              nome: 'Tarefa Aprovada 2',
              descricao: 'Segunda tarefa aprovada para processamento',
              prioridade: 'média',
              selecionada: true
            }
          ]
        })
      }
    });

    console.log('✅ Planejamento em processamento criado:', planningProcessing.title);

    // 5. Criar planejamento com tarefas refinadas (para testar lista ClickUp)
    const planningWithRefinedTasks = await prisma.strategicPlanning.create({
      data: {
        title: 'Planejamento com Tarefas Refinadas - Plan-010',
        description: 'Planejamento para testar exibição de tarefas refinadas',
        status: 'AI_REFINED_LIST_VISIBLE',
        clientId: testClient.id,
        userId: user.id,
        formDataJSON: {
          informacoes_basicas: {
            titulo_planejamento: 'Planejamento com Tarefas Refinadas - Plan-010',
            descricao_objetivo: 'Testar lista de tarefas refinadas',
            setor: 'Tecnologia'
          }
        },
        specificObjectives: JSON.stringify({
          nome_do_backlog: 'Backlog Original',
          objetivo_do_backlog: 'Backlog original antes do refinamento',
          tarefas: [
            {
              nome: 'Tarefa Original 1',
              descricao: 'Primeira tarefa original',
              prioridade: 'alta'
            }
          ]
        }),
        scope: JSON.stringify({
          tarefas_refinadas: [
            {
              nome: 'Configuração Avançada do Sistema de Autenticação',
              descricao: 'Implementar sistema de autenticação robusto com suporte a múltiplos provedores, incluindo Google, GitHub e autenticação por email/senha com verificação em duas etapas.',
              prioridade: 'alta',
              output: 'Sistema de autenticação completo configurado com:\n- Integração com Clerk\n- Suporte a OAuth (Google, GitHub)\n- Autenticação por email/senha\n- Verificação em duas etapas\n- Middleware de proteção de rotas\n- Documentação de uso'
            },
            {
              nome: 'Dashboard de Métricas em Tempo Real',
              descricao: 'Criar dashboard interativo para visualização de métricas de negócio em tempo real, incluindo gráficos, KPIs e alertas automáticos.',
              prioridade: 'média',
              output: 'Dashboard completo com:\n- Gráficos interativos (Chart.js/D3.js)\n- KPIs principais em cards\n- Sistema de alertas\n- Filtros por período\n- Exportação de relatórios\n- Responsividade mobile'
            },
            {
              nome: 'API de Integração com Sistemas Externos',
              descricao: 'Desenvolver API RESTful para integração com sistemas de terceiros, incluindo webhooks, autenticação por API key e documentação completa.',
              prioridade: 'normal',
              output: 'API completa com:\n- Endpoints RESTful documentados\n- Sistema de webhooks\n- Autenticação por API key\n- Rate limiting\n- Logs de auditoria\n- Documentação Swagger/OpenAPI'
            },
            {
              nome: 'Sistema de Notificações Push',
              descricao: 'Implementar sistema de notificações push para web e mobile, com personalização de preferências e histórico de notificações.',
              prioridade: 'normal',
              output: 'Sistema de notificações com:\n- Push notifications para web\n- Integração com Firebase\n- Preferências de usuário\n- Templates personalizáveis\n- Histórico de notificações\n- Analytics de engajamento'
            }
          ]
        })
      }
    });

    console.log('✅ Planejamento com tarefas refinadas criado:', planningWithRefinedTasks.title);

    console.log('\n🎯 Dados de teste criados com sucesso!');
    console.log('\n📋 URLs para teste:');
    console.log(`1. Planejamento com tarefas para aprovação:`);
    console.log(`   http://localhost:3000/planejamentos/${planningWithTasks.id}`);
    console.log(`\n2. Planejamento em processamento (loading):`);
    console.log(`   http://localhost:3000/planejamentos/${planningProcessing.id}`);
    console.log(`\n3. Planejamento com tarefas refinadas (lista ClickUp):`);
    console.log(`   http://localhost:3000/planejamentos/${planningWithRefinedTasks.id}`);

    console.log('\n🧪 Cenários de teste:');
    console.log('1. Teste do pop-up de confirmação: Acesse o primeiro link, vá para aba "Objetivos Específicos", selecione tarefas e clique "Aprovar selecionadas"');
    console.log('2. Teste do loading: Acesse o segundo link e veja a nova aba "Planejamento Refinado" com animação');
    console.log('3. Teste da lista ClickUp: Acesse o terceiro link e veja as tarefas refinadas na nova aba');

  } catch (error) {
    console.error('❌ Erro ao criar dados de teste:', error);
  } finally {
    await prisma.$disconnect();
  }
}

createTestData(); 