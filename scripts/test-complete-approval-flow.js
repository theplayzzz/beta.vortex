const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

async function testCompleteApprovalFlow() {
  try {
    console.log('🧪 TESTE DO FLUXO DE APROVAÇÃO COMPLETO CORRIGIDO');
    console.log('===============================================');

    const planningId = 'cmbaqdkgw000309x06rxft5rv';

    // 1. Reset do estado para teste limpo
    console.log('🔄 1. Resetando estado para teste...');
    await prisma.strategicPlanning.update({
      where: { id: planningId },
      data: {
        status: 'AI_BACKLOG_VISIBLE', // Estado inicial
        scope: null // Limpar scope anterior
      }
    });
    console.log('✅ Estado resetado');

    // 2. Simular aprovação via API
    console.log('\n📡 2. Simulando aprovação de tarefas...');
    
    const mockApprovedTasks = [
      {
        nome: 'Revisão e mapeamento do funil de vendas atual',
        descricao: 'Analisar e documentar todos os estágios do funil de vendas, identificando pontos de contato críticos e potenciais gargalos.',
        prioridade: 'alta',
        selecionada: true
      },
      {
        nome: 'Configuração de campanhas recorrentes de geração de demanda',
        descricao: 'Planejar, criar e calendarizar campanhas digitais para assegurar consistência nas ações de atração de leads.',
        prioridade: 'alta',
        selecionada: true
      }
    ];

    const payload = {
      approvedTasks: mockApprovedTasks
    };

    try {
      const approvalResponse = await fetch(`http://5.161.64.137:3003/api/planning/${planningId}/approve-tasks`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Cookie': 'test=true' // Simular autenticação
        },
        body: JSON.stringify(payload)
      });

      console.log(`📡 Status da aprovação: ${approvalResponse.status}`);
      
      if (approvalResponse.ok) {
        const result = await approvalResponse.json();
        console.log('✅ Aprovação bem-sucedida:', result);
        console.log(`📊 Polling Status: ${result.pollingStatus}`);
        console.log(`🔗 Webhook Status: ${result.webhookStatus}`);
      } else {
        const error = await approvalResponse.text();
        console.log('❌ Erro na aprovação:', error);
        
        // Testar se o status foi atualizado mesmo com erro de autenticação
        const planningAfterError = await prisma.strategicPlanning.findUnique({
          where: { id: planningId }
        });
        
        console.log(`📊 Status após erro: ${planningAfterError.status}`);
        
        if (planningAfterError.status === 'PENDING_AI_REFINED_LIST') {
          console.log('✅ CORREÇÃO FUNCIONOU: Status atualizado mesmo com erro!');
        } else {
          console.log('❌ PROBLEMA: Status não foi atualizado');
        }
      }
    } catch (apiError) {
      console.error('❌ Erro na API:', apiError.message);
    }

    // 3. Verificar se o status foi atualizado
    console.log('\n📊 3. Verificando se status foi atualizado...');
    
    const planningAfterApproval = await prisma.strategicPlanning.findUnique({
      where: { id: planningId }
    });

    console.log(`📊 Status após aprovação: ${planningAfterApproval.status}`);
    
    if (planningAfterApproval.status === 'PENDING_AI_REFINED_LIST') {
      console.log('✅ SUCESSO: Status atualizado corretamente!');
      console.log('🔄 Polling deve estar ativo agora');
    } else {
      console.log('❌ FALHA: Status não foi atualizado');
      console.log('❓ Possível problema na API');
    }

    // 4. Testar endpoint de polling
    console.log('\n🔍 4. Testando endpoint de polling...');
    
    try {
      const pollingResponse = await fetch(`http://5.161.64.137:3003/api/plannings/${planningId}`);
      console.log(`📡 Status do polling: ${pollingResponse.status}`);
      
      if (pollingResponse.status === 401) {
        console.log('⚠️ Polling retornou 401 (esperado sem autenticação)');
        console.log('💡 No frontend com autenticação, deve funcionar');
      } else if (pollingResponse.ok) {
        const planningData = await pollingResponse.json();
        console.log('✅ Polling funcionando:', planningData.status);
      }
    } catch (pollingError) {
      console.error('❌ Erro no polling:', pollingError.message);
    }

    // 5. Simular recebimento de dados refinados
    console.log('\n🔔 5. Simulando recebimento de webhook callback...');
    
    const mockRefinedData = {
      planning_id: planningId,
      status: 'success',
      refined_tasks: [
        {
          nome: 'Análise Completa do Funil de Vendas',
          descricao: 'Análise detalhada incluindo mapeamento de touchpoints, identificação de gargalos, otimização de conversão e implementação de métricas de acompanhamento.',
          prioridade: 'alta',
          output: 'Relatório completo com recomendações acionáveis e plano de implementação'
        },
        {
          nome: 'Sistema de Campanhas Automatizadas',
          descricao: 'Desenvolvimento de sistema de campanhas digitais automatizadas com segmentação avançada, nurturing de leads e integração com CRM.',
          prioridade: 'alta',
          output: 'Campanhas configuradas e funcionando com dashboard de monitoramento'
        }
      ]
    };

    try {
      const callbackResponse = await fetch('http://5.161.64.137:3003/api/webhooks/refined-list-callback', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(mockRefinedData)
      });

      console.log(`📡 Status do callback: ${callbackResponse.status}`);
      
      if (callbackResponse.ok) {
        const result = await callbackResponse.json();
        console.log('✅ Callback processado:', result.message);
      } else {
        const error = await callbackResponse.text();
        console.log('❌ Erro no callback:', error);
      }
    } catch (callbackError) {
      console.error('❌ Erro no callback:', callbackError.message);
    }

    // 6. Verificar resultado final
    console.log('\n🎯 6. Verificando resultado final...');
    
    const finalPlanning = await prisma.strategicPlanning.findUnique({
      where: { id: planningId }
    });

    console.log(`📊 Status final: ${finalPlanning.status}`);
    
    if (finalPlanning.scope) {
      try {
        const scopeData = JSON.parse(finalPlanning.scope);
        console.log('✅ Scope preenchido com dados refinados!');
        console.log(`📋 Tarefas refinadas: ${scopeData.tasks.length}`);
        
        scopeData.tasks.forEach((task, index) => {
          console.log(`   ${index + 1}. ${task.nome} (${task.prioridade})`);
        });
      } catch (parseError) {
        console.log('❌ Erro ao parsear scope:', parseError.message);
      }
    } else {
      console.log('⚠️ Scope ainda vazio');
    }

    // 7. Resumo do teste
    console.log('\n📋 RESUMO DO TESTE:');
    console.log('==================');
    
    const finalStatus = finalPlanning.status;
    const hasScope = !!finalPlanning.scope;
    
    if (finalStatus === 'PENDING_AI_REFINED_LIST') {
      console.log('✅ STATUS: Corretamente atualizado para PENDING_AI_REFINED_LIST');
      console.log('✅ POLLING: Deve estar funcionando no frontend');
    } else {
      console.log('❌ STATUS: Não foi atualizado corretamente');
    }
    
    if (hasScope && finalStatus === 'AI_REFINED_LIST_VISIBLE') {
      console.log('✅ SCOPE: Dados refinados recebidos e processados');
      console.log('✅ FLUXO COMPLETO: Funcionando perfeitamente');
    } else if (finalStatus === 'PENDING_AI_REFINED_LIST') {
      console.log('⏳ SCOPE: Aguardando dados refinados (normal)');
      console.log('✅ FLUXO: Pronto para receber dados');
    } else {
      console.log('❌ SCOPE: Problema no processamento');
    }

    console.log('\n💡 PRÓXIMOS PASSOS:');
    console.log('1. Testar no frontend com usuário autenticado');
    console.log('2. Verificar se aba muda para "IA Gerando..."');
    console.log('3. Confirmar que polling detecta mudanças');
    console.log('4. Validar navegação automática quando dados chegarem');

  } catch (error) {
    console.error('❌ Erro no teste:', error);
  } finally {
    await prisma.$disconnect();
  }
}

// Executar teste
testCompleteApprovalFlow(); 