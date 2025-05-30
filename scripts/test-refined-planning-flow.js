const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

async function testRefinedPlanningFlow() {
  try {
    console.log('🧪 TESTE DO FLUXO DE PLANEJAMENTO REFINADO');
    console.log('=====================================');

    // 1. Buscar um planejamento existente ou criar um
    let planning = await prisma.strategicPlanning.findFirst({
      where: {
        status: 'PENDING_AI_REFINED_LIST'
      }
    });

    if (!planning) {
      console.log('⚠️  Nenhum planejamento com status PENDING_AI_REFINED_LIST encontrado');
      
      // Buscar qualquer planejamento para teste
      planning = await prisma.strategicPlanning.findFirst({
        where: {
          specificObjectives: {
            not: null
          }
        }
      });

      if (!planning) {
        console.log('❌ Nenhum planejamento encontrado para teste');
        return;
      }

      // Atualizar status para PENDING_AI_REFINED_LIST
      planning = await prisma.strategicPlanning.update({
        where: { id: planning.id },
        data: { status: 'PENDING_AI_REFINED_LIST' }
      });

      console.log(`✅ Planejamento ${planning.id} atualizado para PENDING_AI_REFINED_LIST`);
    }

    console.log(`📋 Testando com planejamento: ${planning.id}`);
    console.log(`📊 Status atual: ${planning.status}`);

    // 2. Simular webhook de retorno com dados refinados
    const callbackPayload = {
      planning_id: planning.id,
      status: 'success',
      refined_tasks: [
        {
          nome: 'Tarefa Refinada 1',
          descricao: 'Descrição detalhada da tarefa 1 gerada pela IA',
          prioridade: 'alta',
          output: 'Output específico da IA para esta tarefa'
        },
        {
          nome: 'Tarefa Refinada 2', 
          descricao: 'Descrição detalhada da tarefa 2 gerada pela IA',
          prioridade: 'média',
          output: 'Output específico da IA para esta tarefa'
        },
        {
          nome: 'Tarefa Refinada 3',
          descricao: 'Descrição detalhada da tarefa 3 gerada pela IA', 
          prioridade: 'normal',
          output: 'Output específico da IA para esta tarefa'
        }
      ]
    };

    console.log('📤 Simulando callback do webhook...');

    // 3. Chamar nosso endpoint de callback
    const response = await fetch('http://localhost:3000/api/webhooks/refined-list-callback', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${process.env.WEBHOOK_SECRET || 'test-secret'}`
      },
      body: JSON.stringify(callbackPayload)
    });

    if (response.ok) {
      const result = await response.json();
      console.log('✅ Callback processado com sucesso:', result);
    } else {
      const error = await response.text();
      console.error('❌ Erro no callback:', error);
    }

    // 4. Verificar se o planejamento foi atualizado
    const updatedPlanning = await prisma.strategicPlanning.findUnique({
      where: { id: planning.id }
    });

    console.log('📊 Status após callback:', updatedPlanning.status);
    console.log('📋 Scope atualizado:', updatedPlanning.scope ? 'SIM' : 'NÃO');

    if (updatedPlanning.scope) {
      const scopeData = JSON.parse(updatedPlanning.scope);
      console.log(`🎯 Tarefas refinadas encontradas: ${scopeData.tarefas_refinadas?.length || 0}`);
      
      if (scopeData.tarefas_refinadas) {
        scopeData.tarefas_refinadas.forEach((task, index) => {
          console.log(`   ${index + 1}. ${task.nome} (${task.prioridade})`);
        });
      }
    }

    console.log('');
    console.log('🎉 TESTE CONCLUÍDO!');
    console.log('Agora você pode:');
    console.log('1. Acessar o planejamento no frontend');
    console.log('2. Verificar se a aba "Planejamento Refinado" aparece');
    console.log('3. Verificar se o polling para automaticamente');
    console.log('4. Verificar se a lista de tarefas refinadas é exibida');

  } catch (error) {
    console.error('❌ Erro no teste:', error);
  } finally {
    await prisma.$disconnect();
  }
}

// Executar o teste
testRefinedPlanningFlow(); 