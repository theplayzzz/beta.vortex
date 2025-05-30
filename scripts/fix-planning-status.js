const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

async function fixPlanningStatus() {
  try {
    console.log('🔧 Corrigindo status de planejamentos com dados refinados...\n');

    // 1. Buscar planejamentos com status PENDING_AI_REFINED_LIST que já têm dados no scope
    const planningsToFix = await prisma.strategicPlanning.findMany({
      where: {
        status: 'PENDING_AI_REFINED_LIST',
        scope: {
          not: null
        }
      },
      select: {
        id: true,
        title: true,
        status: true,
        scope: true
      }
    });

    if (planningsToFix.length === 0) {
      console.log('✅ Nenhum planejamento encontrado para correção.');
      return;
    }

    console.log(`📋 Encontrados ${planningsToFix.length} planejamento(s) para correção:`);
    
    for (const planning of planningsToFix) {
      console.log(`\n📄 Processando: ${planning.title}`);
      console.log(`   ID: ${planning.id}`);
      console.log(`   Status atual: ${planning.status}`);
      
      // Verificar se o scope realmente contém tarefas refinadas válidas
      let hasValidTasks = false;
      try {
        const parsed = JSON.parse(planning.scope);
        hasValidTasks = parsed.tarefas_refinadas && 
                       Array.isArray(parsed.tarefas_refinadas) && 
                       parsed.tarefas_refinadas.length > 0;
      } catch (error) {
        console.log(`   ❌ Erro ao parsear scope: ${error.message}`);
        continue;
      }

      if (hasValidTasks) {
        // Atualizar status para AI_REFINED_LIST_VISIBLE
        const updated = await prisma.strategicPlanning.update({
          where: { id: planning.id },
          data: {
            status: 'AI_REFINED_LIST_VISIBLE'
          }
        });

        console.log(`   ✅ Status atualizado para: ${updated.status}`);
        
        const parsed = JSON.parse(planning.scope);
        console.log(`   📊 Contém ${parsed.tarefas_refinadas.length} tarefa(s) refinada(s)`);
      } else {
        console.log(`   ⚠️  Scope não contém tarefas refinadas válidas - pulando`);
      }
    }

    console.log('\n🎉 Correção concluída!');
    console.log('\n💡 Agora você pode:');
    console.log('1. Recarregar a página do planejamento');
    console.log('2. Ou aguardar o polling detectar automaticamente (até 10 segundos)');

  } catch (error) {
    console.error('❌ Erro ao corrigir status:', error);
  } finally {
    await prisma.$disconnect();
  }
}

// Executar apenas se chamado diretamente
if (require.main === module) {
  fixPlanningStatus();
}

module.exports = { fixPlanningStatus }; 