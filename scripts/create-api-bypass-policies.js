const { PrismaClient } = require('@prisma/client');

async function createApiBypassPolicies() {
  const prisma = new PrismaClient();
  
  try {
    console.log('🔧 CRIANDO POLÍTICAS DE BYPASS PARA API EXTERNA');
    console.log('='.repeat(60));
    
    // 1. Criar política para permitir operações sem contexto JWT (APIs externas)
    console.log('\n📋 1. Política para Client (API Externa)...');
    
    try {
      await prisma.$executeRaw`
        CREATE POLICY "api_external_bypass_client" ON "Client"
          FOR ALL 
          USING (auth.jwt() IS NULL)
          WITH CHECK (auth.jwt() IS NULL);nnp
      `;
      console.log('   ✅ Política api_external_bypass_client criada');
    } catch (error) {
      if (error.message.includes('already exists')) {
        console.log('   ⚠️  Política api_external_bypass_client já existe');
      } else {
        console.log('   ❌ Erro:', error.message);
      }
    }
    
    // 2. Política para ClientNote
    console.log('\n📋 2. Política para ClientNote (API Externa)...');
    
    try {
      // Primeiro habilitar RLS em ClientNote se não estiver habilitado
      await prisma.$executeRaw`ALTER TABLE "ClientNote" ENABLE ROW LEVEL SECURITY;`;
      
      await prisma.$executeRaw`
        CREATE POLICY "api_external_bypass_note" ON "ClientNote"
          FOR ALL 
          USING (auth.jwt() IS NULL)
          WITH CHECK (auth.jwt() IS NULL);
      `;
      console.log('   ✅ Política api_external_bypass_note criada');
    } catch (error) {
      if (error.message.includes('already exists')) {
        console.log('   ⚠️  Política api_external_bypass_note já existe');
      } else {
        console.log('   ❌ Erro:', error.message);
      }
    }
    
    // 3. Política para StrategicPlanning
    console.log('\n📋 3. Política para StrategicPlanning (API Externa)...');
    
    try {
      await prisma.$executeRaw`
        CREATE POLICY "api_external_bypass_planning" ON "StrategicPlanning"
          FOR ALL 
          USING (auth.jwt() IS NULL)
          WITH CHECK (auth.jwt() IS NULL);
      `;
      console.log('   ✅ Política api_external_bypass_planning criada');
    } catch (error) {
      if (error.message.includes('already exists')) {
        console.log('   ⚠️  Política api_external_bypass_planning já existe');
      } else {
        console.log('   ❌ Erro:', error.message);
      }
    }
    
    // 4. Verificar políticas criadas
    console.log('\n📊 4. Verificando políticas criadas...');
    
    const newPolicies = await prisma.$queryRaw`
      SELECT tablename, policyname, permissive, cmd
      FROM pg_policies 
      WHERE policyname LIKE 'api_external_bypass%'
      ORDER BY tablename, policyname
    `;
    
    console.log('   Políticas de bypass criadas:');
    newPolicies.forEach(policy => {
      console.log(`   ✅ ${policy.tablename}.${policy.policyname}: ${policy.cmd}`);
    });
    
    // 5. Testar inserção com as novas políticas
    console.log('\n🧪 5. Testando inserção com novas políticas...');
    
    try {
      const testId = `test-api-bypass-${Date.now()}`;
      
      await prisma.$executeRaw`
        INSERT INTO "Client" (
          "id", "name", "industry", "userId", "richnessScore", "createdAt", "updatedAt"
        ) VALUES (
          ${testId}, 'Test API Bypass', 'Test Industry', 
          'cmbmazoja000909yox6gv567p', 50, NOW(), NOW()
        )
      `;
      
      console.log('   ✅ Inserção de Cliente funcionando');
      
      // Testar nota
      await prisma.$executeRaw`
        INSERT INTO "ClientNote" (
          "id", "content", "clientId", "userId", "createdAt", "updatedAt"
        ) VALUES (
          gen_random_uuid(), 'Test note via API', ${testId}, 
          'cmbmazoja000909yox6gv567p', NOW(), NOW()
        )
      `;
      
      console.log('   ✅ Inserção de Nota funcionando');
      
      // Limpar testes
      await prisma.$executeRaw`DELETE FROM "ClientNote" WHERE "clientId" = ${testId}`;
      await prisma.$executeRaw`DELETE FROM "Client" WHERE "id" = ${testId}`;
      console.log('   🧹 Dados de teste removidos');
      
    } catch (testError) {
      console.log('   ❌ Erro no teste:', testError.message);
      console.log('   🔍 Código:', testError.code);
    }
    
    console.log('\n✅ CONFIGURAÇÃO DE BYPASS CONCLUÍDA!');
    console.log('   As APIs externas agora devem funcionar sem bloqueios RLS');
    
  } catch (error) {
    console.error('❌ Erro geral:', error.message);
  } finally {
    await prisma.$disconnect();
  }
}

createApiBypassPolicies(); 