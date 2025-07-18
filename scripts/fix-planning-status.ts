/**
 * Script para corrigir registros de StrategicPlanning com status inconsistente
 * Executa via Prisma para corrigir o erro: Value 'AWAITING_APPROVAL' not found in enum 'PlanningStatus'
 */

import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function fixPlanningStatus() {
  console.log('🔍 Iniciando correção de status de planejamentos...');
  
  try {
    // 1. Verificar registros problemáticos
    console.log('\n📊 Verificando registros com status inconsistente...');
    
    const problematicPlannings = await prisma.$queryRaw`
      SELECT status, COUNT(*) as total
      FROM "StrategicPlanning" 
      WHERE status::text NOT IN ('DRAFT', 'ACTIVE', 'COMPLETED', 'ARCHIVED', 'PENDING_AI_BACKLOG_GENERATION', 'AI_BACKLOG_VISIBLE', 'PENDING_AI_REFINED_LIST', 'AI_REFINED_LIST_VISIBLE')
      GROUP BY status
    `;
    
    console.log('Registros problemáticos encontrados:', problematicPlannings);
    
    if (Array.isArray(problematicPlannings) && problematicPlannings.length === 0) {
      console.log('✅ Nenhum registro problemático encontrado. Banco de dados está consistente!');
      return;
    }
    
    // 2. Corrigir registros específicos (AWAITING_APPROVAL → DRAFT)
    console.log('\n🔧 Corrigindo registros com status "AWAITING_APPROVAL"...');
    
    const result1 = await prisma.$executeRaw`
      UPDATE "StrategicPlanning" 
      SET 
        status = 'DRAFT'::"PlanningStatus",
        "updatedAt" = NOW()
      WHERE status::text = 'AWAITING_APPROVAL'
    `;
    
    console.log(`✅ ${result1} registros corrigidos (AWAITING_APPROVAL → DRAFT)`);
    
    // 3. Corrigir outros registros inconsistentes (fallback para DRAFT)
    console.log('\n🔧 Corrigindo outros registros inconsistentes...');
    
    const result2 = await prisma.$executeRaw`
      UPDATE "StrategicPlanning" 
      SET 
        status = 'DRAFT'::"PlanningStatus",
        "updatedAt" = NOW()
      WHERE status::text NOT IN ('DRAFT', 'ACTIVE', 'COMPLETED', 'ARCHIVED', 'PENDING_AI_BACKLOG_GENERATION', 'AI_BACKLOG_VISIBLE', 'PENDING_AI_REFINED_LIST', 'AI_REFINED_LIST_VISIBLE')
    `;
    
    console.log(`✅ ${result2} registros adicionais corrigidos`);
    
    // 4. Verificar resultado final
    console.log('\n📊 Verificando status após correção...');
    
    const finalStatus = await prisma.$queryRaw`
      SELECT status, COUNT(*) as total
      FROM "StrategicPlanning" 
      GROUP BY status
      ORDER BY status
    `;
    
    console.log('Status finais dos planejamentos:');
    console.table(finalStatus);
    
    // 5. Teste de validação - tentar fazer uma query normal
    console.log('\n🧪 Testando query normal após correção...');
    
    const testQuery = await prisma.strategicPlanning.findMany({
      select: { id: true, status: true },
      take: 5
    });
    
    console.log(`✅ Teste bem-sucedido! ${testQuery.length} registros retornados sem erro.`);
    
    console.log('\n🎉 Correção concluída com sucesso!');
    console.log('💡 Agora você pode testar a API /api/plannings novamente.');
    
  } catch (error) {
    console.error('❌ Erro durante a correção:', error);
    throw error;
  } finally {
    await prisma.$disconnect();
  }
}

// Executar se for chamado diretamente
if (require.main === module) {
  fixPlanningStatus()
    .then(() => {
      console.log('\n🏁 Script executado com sucesso!');
      process.exit(0);
    })
    .catch((error) => {
      console.error('\n💥 Script falhou:', error);
      process.exit(1);
    });
}

export { fixPlanningStatus }; 