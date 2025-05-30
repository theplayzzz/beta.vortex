const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

async function testStatusFlow() {
  try {
    console.log('🧪 TESTE DOS 3 STATUS DA ABA PLANEJAMENTO REFINADO');
    console.log('===================================================');

    const planningId = 'cmbaqdkgw000309x06rxft5rv';

    // ✅ STATUS 1: AGUARDANDO PLANEJAMENTO
    console.log('\n🔄 1. TESTANDO STATUS: AGUARDANDO PLANEJAMENTO');
    console.log('=============================================');
    
    await prisma.strategicPlanning.update({
      where: { id: planningId },
      data: {
        status: 'AI_BACKLOG_VISIBLE', // Status normal
        scope: null, // Sem dados refinados
        specificObjectives: JSON.stringify({
          nome_do_backlog: 'Teste Backlog',
          objetivo_do_backlog: 'Objetivo de teste',
          tarefas: [
            { nome: 'Tarefa 1', descricao: 'Descrição 1', prioridade: 'alta' },
            { nome: 'Tarefa 2', descricao: 'Descrição 2', prioridade: 'media' }
          ]
        })
      }
    });

    console.log('✅ Configurado: Tarefas disponíveis + Sem processamento + Sem dados');
    console.log('📱 Interface deve mostrar: STATUS = AGUARDANDO PLANEJAMENTO');
    console.log('   → Aba visível, aguardando aprovação de tarefas');

    // ✅ STATUS 2: IA GERANDO
    console.log('\n🔄 2. TESTANDO STATUS: IA GERANDO');
    console.log('================================');
    
    await prisma.strategicPlanning.update({
      where: { id: planningId },
      data: {
        status: 'PENDING_AI_REFINED_LIST', // EM PROCESSAMENTO
        scope: null // AINDA sem dados refinados
      }
    });

    console.log('✅ Configurado: Em processamento + Sem dados refinados');
    console.log('📱 Interface deve mostrar: STATUS = IA GERANDO');
    console.log('   → Aba mostrando "IA está gerando seu planejamento..."');
    console.log('   → Polling ativo verificando mudanças');

    // Simular dados chegando gradualmente
    console.log('\n⏳ Simulando processamento em andamento...');
    await new Promise(resolve => setTimeout(resolve, 2000));

    // ✅ STATUS 3: PRONTO
    console.log('\n🔄 3. TESTANDO STATUS: PRONTO');
    console.log('============================');
    
    const refinedData = {
      tarefas_refinadas: [
        {
          nome: 'Análise Estratégica Completa do Funil',
          descricao: 'Análise profunda do funil de vendas com identificação de gargalos e oportunidades de otimização.',
          prioridade: 'alta',
          output: 'Relatório estratégico com mapa do funil, KPIs e plano de ação detalhado',
          contexto_adicional: 'Incluir análise de conversão por estágio'
        },
        {
          nome: 'Sistema de Automação de Campanhas Inteligente',
          descricao: 'Implementação de sistema automatizado de campanhas digitais com IA para segmentação e personalização.',
          prioridade: 'alta',
          output: 'Sistema configurado com campanhas ativas e dashboard de monitoramento',
          contexto_adicional: 'Integrar com ferramentas de CRM existentes'
        }
      ],
      metadata: {
        generated_at: new Date().toISOString(),
        planning_id: planningId,
        status: 'completed'
      }
    };

    await prisma.strategicPlanning.update({
      where: { id: planningId },
      data: {
        status: 'AI_REFINED_LIST_VISIBLE', // PROCESSAMENTO COMPLETO (status correto)
        scope: JSON.stringify(refinedData) // DADOS REFINADOS PRESENTES
      }
    });

    console.log('✅ Configurado: Processamento completo + Dados refinados presentes');
    console.log('📱 Interface deve mostrar: STATUS = PRONTO');
    console.log('   → Lista de tarefas refinadas visível');
    console.log('   → Polling parado (dados encontrados)');
    console.log(`   → ${refinedData.tarefas_refinadas.length} tarefas refinadas disponíveis`);

    // ✅ TESTE DE TRANSIÇÕES
    console.log('\n🔄 4. TESTANDO TRANSIÇÕES DE STATUS');
    console.log('===================================');
    
    console.log('🎯 FLUXO NORMAL:');
    console.log('   AGUARDANDO → Usuário aprova → IA GERANDO → Dados chegam → PRONTO');
    console.log('');

    // Simular o fluxo completo
    console.log('📍 Simulando: AGUARDANDO → IA GERANDO');
    await prisma.strategicPlanning.update({
      where: { id: planningId },
      data: {
        status: 'AI_BACKLOG_VISIBLE',
        scope: null
      }
    });
    
    console.log('   ✅ Estado: AGUARDANDO PLANEJAMENTO');
    await new Promise(resolve => setTimeout(resolve, 1000));

    // Simular approve-tasks + clear-scope
    console.log('   🧹 Executando clear-scope...');
    try {
      const clearResponse = await fetch(`http://5.161.64.137:3003/api/planning/${planningId}/clear-scope`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' }
      });
      
      if (clearResponse.ok) {
        console.log('   ✅ Clear-scope executado com sucesso');
      } else {
        console.log('   ⚠️ Clear-scope falhou (sem autenticação), mas continuando...');
      }
    } catch (error) {
      console.log('   ⚠️ Erro no clear-scope, mas continuando...');
    }

    console.log('   📡 Simulando approve-tasks...');
    await prisma.strategicPlanning.update({
      where: { id: planningId },
      data: { status: 'PENDING_AI_REFINED_LIST' }
    });
    
    console.log('   ✅ Estado: IA GERANDO');
    await new Promise(resolve => setTimeout(resolve, 2000));

    console.log('   📦 Dados refinados chegando...');
    await prisma.strategicPlanning.update({
      where: { id: planningId },
      data: {
        status: 'AI_REFINED_LIST_VISIBLE',
        scope: JSON.stringify(refinedData)
      }
    });
    
    console.log('   ✅ Estado: PRONTO');

    // ✅ VALIDAÇÃO FINAL
    console.log('\n🔍 5. VALIDAÇÃO FINAL');
    console.log('====================');
    
    const finalPlanning = await prisma.strategicPlanning.findUnique({
      where: { id: planningId }
    });

    console.log('📊 Estado final no banco:');
    console.log(`   Status: ${finalPlanning.status}`);
    console.log(`   Scope: ${finalPlanning.scope ? 'PRESENTE' : 'VAZIO'}`);
    console.log(`   SpecificObjectives: ${finalPlanning.specificObjectives ? 'PRESENTE' : 'VAZIO'}`);
    
    if (finalPlanning.scope) {
      try {
        const parsed = JSON.parse(finalPlanning.scope);
        console.log(`   Tarefas refinadas: ${parsed.tarefas_refinadas?.length || 0}`);
      } catch (error) {
        console.log('   Erro ao parsear scope');
      }
    }

    // ✅ RESUMO DOS STATUS
    console.log('\n📋 RESUMO DOS 3 STATUS');
    console.log('======================');
    
    console.log('1️⃣ AGUARDANDO PLANEJAMENTO:');
    console.log('   ✅ Condição: specificObjectives.tarefas exists + status != PENDING_AI_REFINED_LIST + !scope');
    console.log('   📱 Interface: "Aguarde a aprovação das tarefas para gerar o planejamento"');
    console.log('   🔄 Polling: INATIVO');
    console.log('');

    console.log('2️⃣ IA GERANDO:');
    console.log('   ✅ Condição: status = PENDING_AI_REFINED_LIST + !scope.tarefas_refinadas');
    console.log('   📱 Interface: "IA está gerando seu planejamento..." + loading');
    console.log('   🔄 Polling: ATIVO (verificando scope)');
    console.log('');

    console.log('3️⃣ PRONTO:');
    console.log('   ✅ Condição: scope.tarefas_refinadas exists + length > 0');
    console.log('   📱 Interface: Lista de tarefas refinadas');
    console.log('   🔄 Polling: PARADO (dados encontrados)');
    console.log('');

    console.log('🎉 TESTE DOS STATUS CONCLUÍDO!');
    console.log('💡 Agora a interface deve detectar e exibir os status corretamente');

  } catch (error) {
    console.error('❌ Erro no teste:', error);
  } finally {
    await prisma.$disconnect();
  }
}

// Executar teste
testStatusFlow(); 