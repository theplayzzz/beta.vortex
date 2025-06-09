const { PrismaClient } = require('@prisma/client');

async function disableRLSCompletely() {
  const prisma = new PrismaClient();
  
  try {
    console.log('🚨 DESABILITANDO RLS COMPLETAMENTE');
    console.log('⚠️  ATENÇÃO: Isso remove todas as restrições de segurança!');
    console.log('='.repeat(60));
    
    // Lista de todas as tabelas principais
    const tables = [
      'User',
      'Client', 
      'ClientNote',
      'ClientAttachment',
      'StrategicPlanning',
      'PlanningTask',
      'TaskComment',
      'TaskAttachment',
      'AgentInteraction',
      'AgentMessage',
      'CommercialProposal',
      'SalesArgument',
      'CreditTransaction',
      'UserModerationLog'
    ];
    
    console.log('\n📋 ETAPA 1: Verificando status atual do RLS...');
    
    // Verificar status atual
    const currentStatus = await prisma.$queryRaw`
      SELECT schemaname, tablename, rowsecurity 
      FROM pg_tables 
      WHERE tablename = ANY(${tables})
      AND schemaname = 'public'
      ORDER BY tablename
    `;
    
    console.log('Status atual do RLS:');
    currentStatus.forEach(table => {
      const status = table.rowsecurity ? '🔒 HABILITADO' : '🔓 DESABILITADO';
      console.log(`   ${table.tablename}: ${status}`);
    });
    
    console.log('\n📋 ETAPA 2: Desabilitando RLS em todas as tabelas...');
    
    for (const table of tables) {
      try {
        await prisma.$executeRawUnsafe(`ALTER TABLE "${table}" DISABLE ROW LEVEL SECURITY;`);
        console.log(`   ✅ ${table}: RLS desabilitado`);
      } catch (error) {
        if (error.message.includes('does not exist')) {
          console.log(`   ⚠️  ${table}: Tabela não existe`);
        } else {
          console.log(`   ❌ ${table}: Erro - ${error.message}`);
        }
      }
    }
    
    console.log('\n📋 ETAPA 3: Removendo políticas restritivas...');
    
    // Listar todas as políticas existentes
    const existingPolicies = await prisma.$queryRaw`
      SELECT schemaname, tablename, policyname, permissive
      FROM pg_policies 
      WHERE tablename = ANY(${tables})
      ORDER BY tablename, policyname
    `;
    
    console.log(`Encontradas ${existingPolicies.length} políticas para remover:`);
    
    // Remover cada política
    for (const policy of existingPolicies) {
      try {
        await prisma.$executeRawUnsafe(`DROP POLICY IF EXISTS "${policy.policyname}" ON "${policy.tablename}";`);
        console.log(`   ✅ Removida: ${policy.tablename}.${policy.policyname}`);
      } catch (error) {
        console.log(`   ❌ Erro ao remover ${policy.tablename}.${policy.policyname}: ${error.message}`);
      }
    }
    
    console.log('\n📋 ETAPA 4: Removendo funções RLS auxiliares...');
    
    const functions = [
      'get_user_id_from_clerk',
      'get_current_user_approval_status', 
      'is_current_user_admin'
    ];
    
    for (const funcName of functions) {
      try {
        await prisma.$executeRawUnsafe(`DROP FUNCTION IF EXISTS ${funcName}() CASCADE;`);
        console.log(`   ✅ Função removida: ${funcName}`);
      } catch (error) {
        console.log(`   ⚠️  Erro ao remover função ${funcName}: ${error.message}`);
      }
    }
    
    console.log('\n📋 ETAPA 5: Verificando status final...');
    
    const finalStatus = await prisma.$queryRaw`
      SELECT schemaname, tablename, rowsecurity 
      FROM pg_tables 
      WHERE tablename = ANY(${tables})
      AND schemaname = 'public'
      ORDER BY tablename
    `;
    
    console.log('Status final do RLS:');
    finalStatus.forEach(table => {
      const status = table.rowsecurity ? '🔒 HABILITADO' : '🔓 DESABILITADO';
      console.log(`   ${table.tablename}: ${status}`);
    });
    
    // Verificar se ainda há políticas
    const remainingPolicies = await prisma.$queryRaw`
      SELECT COUNT(*) as count
      FROM pg_policies 
      WHERE tablename = ANY(${tables})
    `;
    
    const policyCount = remainingPolicies[0]?.count || 0;
    console.log(`\nPolíticas restantes: ${policyCount}`);
    
    console.log('\n📋 ETAPA 6: Testando acesso total...');
    
    try {
      // Teste 1: Inserção direta de cliente
      const testClientId = `test-no-rls-${Date.now()}`;
      
      await prisma.$executeRaw`
        INSERT INTO "Client" (
          "id", "name", "industry", "userId", "richnessScore", "createdAt", "updatedAt"
        ) VALUES (
          ${testClientId}, 'Test No RLS', 'Test Industry', 
          'any-user-id', 100, NOW(), NOW()
        )
      `;
      console.log('   ✅ Cliente criado sem restrições');
      
      // Teste 2: Inserção de nota
      await prisma.$executeRaw`
        INSERT INTO "ClientNote" (
          "id", "content", "clientId", "userId", "createdAt", "updatedAt"
        ) VALUES (
          gen_random_uuid(), 'Test note no RLS', ${testClientId}, 
          'any-user-id', NOW(), NOW()
        )
      `;
      console.log('   ✅ Nota criada sem restrições');
      
      // Teste 3: Inserção de planejamento
      await prisma.$executeRaw`
        INSERT INTO "StrategicPlanning" (
          "id", "title", "description", "clientId", "userId", "status", "createdAt", "updatedAt"
        ) VALUES (
          gen_random_uuid(), 'Test Planning No RLS', 'Test Description', 
          ${testClientId}, 'any-user-id', 'DRAFT'::"PlanningStatus", NOW(), NOW()
        )
      `;
      console.log('   ✅ Planejamento criado sem restrições');
      
      // Limpar testes
      await prisma.$executeRaw`DELETE FROM "StrategicPlanning" WHERE "clientId" = ${testClientId}`;
      await prisma.$executeRaw`DELETE FROM "ClientNote" WHERE "clientId" = ${testClientId}`;
      await prisma.$executeRaw`DELETE FROM "Client" WHERE "id" = ${testClientId}`;
      console.log('   🧹 Dados de teste removidos');
      
    } catch (testError) {
      console.log('   ❌ Erro no teste final:', testError.message);
    }
    
    console.log('\n✅ RLS COMPLETAMENTE DESABILITADO!');
    console.log('🔓 Agora qualquer API externa pode inserir dados livremente');
    console.log('\n⚠️  IMPORTANTE:');
    console.log('   - Todas as restrições de segurança foram removidas');
    console.log('   - APIs externas têm acesso total ao banco');
    console.log('   - Certifique-se de que isso é realmente necessário');
    
    console.log('\n🔄 Para reabilitar RLS no futuro, execute:');
    console.log('   node scripts/enable-rls-basic.js');
    
  } catch (error) {
    console.error('❌ Erro geral:', error.message);
    console.error('📄 Stack:', error.stack);
  } finally {
    await prisma.$disconnect();
  }
}

disableRLSCompletely(); 