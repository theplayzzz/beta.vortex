const { PrismaClient } = require('@prisma/client');

async function checkRLSStatus() {
  const prisma = new PrismaClient();
  
  try {
    console.log('🛡️ VERIFICANDO STATUS RLS');
    console.log('='.repeat(50));
    
    // Verificar se RLS está habilitado
    const rlsStatus = await prisma.$queryRaw`
      SELECT schemaname, tablename, rowsecurity 
      FROM pg_tables 
      WHERE tablename IN ('Client', 'ClientNote', 'StrategicPlanning')
      AND schemaname = 'public'
    `;
    
    console.log('\n📊 Status RLS por tabela:');
    rlsStatus.forEach(table => {
      console.log(`   ${table.tablename}: ${table.rowsecurity ? 'HABILITADO' : 'DESABILITADO'}`);
    });
    
    // Verificar políticas ativas
    const policies = await prisma.$queryRaw`
      SELECT schemaname, tablename, policyname, permissive, cmd, roles
      FROM pg_policies 
      WHERE tablename IN ('Client', 'ClientNote', 'StrategicPlanning')
      ORDER BY tablename, policyname
    `;
    
    console.log('\n🔒 Políticas RLS ativas:');
    policies.forEach(policy => {
      console.log(`   ${policy.tablename}.${policy.policyname}: ${policy.cmd} (${policy.permissive})`);
    });
    
    // Testar inserção direta sem RLS bypass
    console.log('\n🧪 Testando inserção direta...');
    
    try {
      const testResult = await prisma.$executeRaw`
        INSERT INTO "Client" (
          "id", "name", "industry", "userId", "richnessScore", "createdAt", "updatedAt"
        ) VALUES (
          'test-api-client-123', 'Test API Client', 'Test Industry', 
          'cmbmazoja000909yox6gv567p', 50, NOW(), NOW()
        )
      `;
      console.log('   ✅ Inserção bem-sucedida');
      
      // Limpar teste
      await prisma.$executeRaw`DELETE FROM "Client" WHERE "id" = 'test-api-client-123'`;
      
    } catch (insertError) {
      console.log('   ❌ Erro na inserção:', insertError.message);
      console.log('   🔍 Código de erro:', insertError.code);
    }
    
  } catch (error) {
    console.error('❌ Erro geral:', error.message);
  } finally {
    await prisma.$disconnect();
  }
}

checkRLSStatus(); 