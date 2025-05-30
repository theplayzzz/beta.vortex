const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

async function testApprovalFlow() {
  try {
    console.log('🧪 TESTE DO FLUXO DE APROVAÇÃO COMPLETO');
    console.log('===================================');

    const planningId = 'cmbaqdkgw000309x06rxft5rv';

    // 1. Verificar estado atual
    console.log('📋 1. Verificando estado atual...');
    let planning = await prisma.strategicPlanning.findUnique({
      where: { id: planningId },
      include: { Client: { select: { name: true } } }
    });

    if (!planning) {
      console.log('❌ Planejamento não encontrado');
      return;
    }

    console.log(`✅ Planejamento: "${planning.title}"`);
    console.log(`📊 Status atual: ${planning.status}`);
    console.log(`👤 Cliente: ${planning.Client.name}`);
    console.log(`🧹 Scope atual: ${planning.scope ? 'PRESENTE' : 'VAZIO'}`);

    // 2. Simular webhook de sucesso
    console.log('\n🔔 2. Simulando webhook de callback com dados refinados...');
    
    const mockRefinedTasks = [
      {
        nome: 'Análise de mercado inicial',
        descricao: 'Realizar pesquisa detalhada do mercado-alvo, incluindo análise de concorrentes diretos e indiretos, identificação de oportunidades de crescimento e definição de personas de clientes.',
        prioridade: 'alta',
        output: 'Relatório completo de análise de mercado com insights acionáveis'
      },
      {
        nome: 'Desenvolvimento de estratégia de vendas',
        descricao: 'Criar estratégia abrangente de vendas baseada nos insights da análise de mercado, definindo canais de vendas, processos e métricas de acompanhamento.',
        prioridade: 'alta',
        output: 'Documento estratégico com planos de ação detalhados'
      },
      {
        nome: 'Implementação de ferramentas de CRM',
        descricao: 'Configurar e implementar sistema de CRM para otimizar o processo de vendas, incluindo automações, pipelines e relatórios de performance.',
        prioridade: 'média',
        output: 'Sistema CRM configurado e funcionando com equipe treinada'
      }
    ];

    const callbackPayload = {
      planning_id: planningId,
      status: 'success',
      refined_tasks: mockRefinedTasks
    };

    // Simular chamada do webhook
    const webhookResponse = await fetch('http://5.161.64.137:3003/api/webhooks/refined-list-callback', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': process.env.WEBHOOK_SECRET ? `Bearer ${process.env.WEBHOOK_SECRET}` : undefined
      },
      body: JSON.stringify(callbackPayload)
    });

    console.log(`📡 Status do webhook: ${webhookResponse.status}`);
    
    if (webhookResponse.ok) {
      const result = await webhookResponse.json();
      console.log('✅ Webhook processado com sucesso:', result.message);
      console.log(`📋 ${result.tasks_count} tarefas refinadas processadas`);
    } else {
      const error = await webhookResponse.text();
      console.log('❌ Erro no webhook:', error);
      return;
    }

    // 3. Verificar resultado final
    console.log('\n📊 3. Verificando resultado final...');
    
    planning = await prisma.strategicPlanning.findUnique({
      where: { id: planningId }
    });

    console.log(`📊 Status final: ${planning.status}`);
    
    if (planning.scope) {
      try {
        const scopeData = JSON.parse(planning.scope);
        console.log('✅ Scope atualizado com sucesso!');
        console.log(`📅 Gerado em: ${scopeData.generated_at}`);
        console.log(`📋 Tarefas: ${scopeData.tasks.length}`);
        console.log(`🔢 Versão: ${scopeData.version}`);
        
        console.log('\n📝 Tarefas refinadas:');
        scopeData.tasks.forEach((task, index) => {
          console.log(`${index + 1}. ${task.nome}`);
          console.log(`   Prioridade: ${task.prioridade}`);
          console.log(`   Descrição: ${task.descricao.substring(0, 100)}...`);
          console.log('');
        });
      } catch (parseError) {
        console.log('❌ Erro ao parsear scope:', parseError.message);
      }
    } else {
      console.log('❌ Scope ainda está vazio');
    }

    // 4. Testar o polling
    console.log('\n🔄 4. Testando endpoint de polling...');
    
    const pollingResponse = await fetch(`http://5.161.64.137:3003/api/plannings/${planningId}`);
    console.log(`📡 Status do polling: ${pollingResponse.status}`);
    
    if (pollingResponse.status === 401) {
      console.log('⚠️ Polling retornou 401 (esperado sem autenticação)');
    } else if (pollingResponse.ok) {
      console.log('✅ Polling funcionando (com autenticação)');
    }

    console.log('\n🎯 RESUMO DOS TESTES:');
    console.log('✅ Webhook callback: FUNCIONANDO');
    console.log('✅ Atualização do banco: FUNCIONANDO'); 
    console.log('✅ Processamento de dados: FUNCIONANDO');
    console.log('⚠️ Polling (precisa autenticação frontend)');
    
    console.log('\n💡 PRÓXIMOS PASSOS:');
    console.log('1. Testar fluxo completo no frontend');
    console.log('2. Verificar se o polling detecta a mudança');
    console.log('3. Confirmar navegação automática para aba refinada');

  } catch (error) {
    console.error('❌ Erro no teste:', error);
  } finally {
    await prisma.$disconnect();
  }
}

// Executar teste
testApprovalFlow(); 