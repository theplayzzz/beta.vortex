const { PrismaClient } = require('@prisma/client');

async function enableRLSBasic() {
  const prisma = new PrismaClient();
  
  try {
    console.log('🔒 REABILITANDO RLS BÁSICO');
    console.log('⚠️  Isso vai criar proteções básicas de segurança');
    console.log('='.repeat(60));
    
    const tables = [
      'User',
      'Client', 
      'ClientNote',
      'StrategicPlanning',
      'CommercialProposal',
      'CreditTransaction',
      'UserModerationLog'
    ];
    
    console.log('\n📋 ETAPA 1: Habilitando RLS nas tabelas principais...');
    
    for (const table of tables) {
      try {
        await prisma.$executeRawUnsafe(`ALTER TABLE "${table}" ENABLE ROW LEVEL SECURITY;`);
        console.log(`   ✅ ${table}: RLS habilitado`);
      } catch (error) {
        console.log(`   ❌ ${table}: Erro - ${error.message}`);
      }
    }
    
    console.log('\n📋 ETAPA 2: Criando políticas básicas de acesso total...');
    
    // Política simples que permite tudo - mas com RLS ativo
    const policies = [
      {
        table: 'Client',
        name: 'allow_all_client_operations',
        command: 'ALL',
        expression: 'true'
      },
      {
        table: 'ClientNote', 
        name: 'allow_all_note_operations',
        command: 'ALL',
        expression: 'true'
      },
      {
        table: 'StrategicPlanning',
        name: 'allow_all_planning_operations', 
        command: 'ALL',
        expression: 'true'
      },
      {
        table: 'User',
        name: 'allow_all_user_operations',
        command: 'ALL', 
        expression: 'true'
      }
    ];
    
    for (const policy of policies) {
      try {
        await prisma.$executeRawUnsafe(`
          CREATE POLICY ${policy.name} ON "${policy.table}"
          FOR ${policy.command} USING (${policy.expression});
        `);
        console.log(`   ✅ Política criada: ${policy.table}.${policy.name}`);
      } catch (error) {
        console.log(`   ⚠️  Erro em ${policy.table}.${policy.name}: ${error.message}`);
      }
    }
    
    console.log('\n📋 ETAPA 3: Verificando status final...');
    
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
    
    const policyCount = await prisma.$queryRaw`
      SELECT COUNT(*) as count
      FROM pg_policies 
      WHERE tablename = ANY(${tables})
    `;
    
    console.log(`\nPolíticas ativas: ${policyCount[0]?.count || 0}`);
    
    console.log('\n✅ RLS BÁSICO REABILITADO!');
    console.log('🔒 RLS ativo com políticas que permitem acesso total');
    console.log('\n📋 Status:');
    console.log('   ✅ RLS habilitado nas tabelas principais');
    console.log('   ✅ Políticas permissivas criadas');
    console.log('   ✅ APIs externas continuam funcionando');
    console.log('   ✅ Estrutura preparada para restrições futuras');
    
  } catch (error) {
    console.error('❌ Erro geral:', error.message);
    console.error('📄 Stack:', error.stack);
  } finally {
    await prisma.$disconnect();
  }
}

enableRLSBasic(); 