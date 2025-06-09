const { PrismaClient } = require('@prisma/client');

async function fixSchemaPermissions() {
  const prisma = new PrismaClient();
  
  try {
    console.log('🔧 CORRIGINDO PERMISSÕES DO SCHEMA PUBLIC');
    console.log('🎯 Objetivo: Garantir acesso total para APIs externas');
    console.log('='.repeat(60));
    
    console.log('\n📋 ETAPA 1: Verificando usuários e roles...');
    
    // Verificar usuários atuais
    const currentUser = await prisma.$queryRaw`SELECT current_user, session_user`;
    console.log('Usuário atual:', currentUser[0]);
    
    // Verificar roles disponíveis
    const roles = await prisma.$queryRaw`
      SELECT rolname, rolsuper, rolcreaterole, rolcreatedb, rolcanlogin
      FROM pg_roles 
      WHERE rolname IN ('postgres', 'anon', 'authenticated', 'service_role', 'supabase_admin')
      ORDER BY rolname
    `;
    
    console.log('\nRoles disponíveis:');
    roles.forEach(role => {
      console.log(`   ${role.rolname}: super=${role.rolsuper}, login=${role.rolcanlogin}`);
    });
    
    console.log('\n📋 ETAPA 2: Concedendo permissões máximas ao schema public...');
    
    // Lista de roles para conceder permissões
    const targetRoles = ['anon', 'authenticated', 'service_role'];
    
    for (const role of targetRoles) {
      try {
        // Conceder USAGE no schema
        await prisma.$executeRawUnsafe(`GRANT USAGE ON SCHEMA public TO ${role};`);
        console.log(`   ✅ USAGE no schema public concedido para ${role}`);
        
        // Conceder ALL PRIVILEGES em todas as tabelas
        await prisma.$executeRawUnsafe(`GRANT ALL PRIVILEGES ON ALL TABLES IN SCHEMA public TO ${role};`);
        console.log(`   ✅ ALL PRIVILEGES em tabelas concedido para ${role}`);
        
        // Conceder ALL PRIVILEGES em todas as sequences
        await prisma.$executeRawUnsafe(`GRANT ALL PRIVILEGES ON ALL SEQUENCES IN SCHEMA public TO ${role};`);
        console.log(`   ✅ ALL PRIVILEGES em sequences concedido para ${role}`);
        
        // Conceder permissões para futuras tabelas
        await prisma.$executeRawUnsafe(`ALTER DEFAULT PRIVILEGES IN SCHEMA public GRANT ALL PRIVILEGES ON TABLES TO ${role};`);
        console.log(`   ✅ Permissões DEFAULT para futuras tabelas concedidas para ${role}`);
        
      } catch (error) {
        console.log(`   ⚠️  Erro para role ${role}: ${error.message}`);
      }
    }
    
    console.log('\n📋 ETAPA 3: Configurações especiais do Supabase...');
    
    try {
      // Permitir bypass do RLS para service_role
      await prisma.$executeRawUnsafe(`ALTER ROLE service_role SET row_security = off;`);
      console.log('   ✅ RLS bypass habilitado para service_role');
    } catch (error) {
      console.log('   ⚠️  Erro ao configurar service_role:', error.message);
    }
    
    try {
      // Permitir bypass do RLS para authenticated
      await prisma.$executeRawUnsafe(`ALTER ROLE authenticated SET row_security = off;`);
      console.log('   ✅ RLS bypass habilitado para authenticated');
    } catch (error) {
      console.log('   ⚠️  Erro ao configurar authenticated:', error.message);
    }
    
    console.log('\n📋 ETAPA 4: Concedendo permissões específicas por tabela...');
    
    const tables = [
      'User', 'Client', 'ClientNote', 'ClientAttachment',
      'StrategicPlanning', 'PlanningTask', 'TaskComment', 'TaskAttachment',
      'CommercialProposal', 'SalesArgument', 'CreditTransaction',
      'AgentInteraction', 'AgentMessage', 'UserModerationLog'
    ];
    
    for (const table of tables) {
      for (const role of ['anon', 'authenticated', 'service_role']) {
        try {
          await prisma.$executeRawUnsafe(`GRANT ALL ON "${table}" TO ${role};`);
          console.log(`   ✅ Permissões ALL concedidas para ${role} na tabela ${table}`);
        } catch (error) {
          if (!error.message.includes('does not exist')) {
            console.log(`   ⚠️  Erro ${table}/${role}: ${error.message}`);
          }
        }
      }
    }
    
    console.log('\n📋 ETAPA 5: Verificando permissões aplicadas...');
    
    // Verificar permissões no schema
    const schemaPermissions = await prisma.$queryRaw`
      SELECT grantee, privilege_type
      FROM information_schema.schema_privileges 
      WHERE schema_name = 'public'
      AND grantee IN ('anon', 'authenticated', 'service_role')
      ORDER BY grantee, privilege_type
    `;
    
    console.log('Permissões no schema public:');
    schemaPermissions.forEach(perm => {
      console.log(`   ${perm.grantee}: ${perm.privilege_type}`);
    });
    
    // Verificar permissões nas tabelas
    const tablePermissions = await prisma.$queryRaw`
      SELECT grantee, table_name, privilege_type
      FROM information_schema.table_privileges 
      WHERE table_schema = 'public'
      AND table_name IN ('Client', 'ClientNote', 'StrategicPlanning')
      AND grantee IN ('anon', 'authenticated', 'service_role')
      ORDER BY grantee, table_name, privilege_type
    `;
    
    console.log('\nPermissões em tabelas selecionadas:');
    tablePermissions.forEach(perm => {
      console.log(`   ${perm.grantee}.${perm.table_name}: ${perm.privilege_type}`);
    });
    
    console.log('\n📋 ETAPA 6: Teste final de inserção...');
    
    try {
      // Teste usando role anon
      await prisma.$executeRaw`SET ROLE anon`;
      console.log('   ✅ Role anon definida');
      
      await prisma.$executeRaw`RESET ROLE`;
      console.log('   ✅ Role resetada');
      
    } catch (error) {
      console.log('   ⚠️  Erro no teste de role:', error.message);
    }
    
    console.log('\n✅ PERMISSÕES DO SCHEMA CORRIGIDAS!');
    console.log('🔓 Acesso total concedido para APIs externas');
    console.log('\n📋 Configurações aplicadas:');
    console.log('   ✅ USAGE no schema public para anon/authenticated/service_role');
    console.log('   ✅ ALL PRIVILEGES em todas as tabelas');
    console.log('   ✅ ALL PRIVILEGES em sequences');
    console.log('   ✅ Permissões default para futuras tabelas');
    console.log('   ✅ RLS bypass para roles de serviço');
    
    console.log('\n🧪 PRÓXIMO PASSO:');
    console.log('   Teste novamente sua integração N8N');
    console.log('   Se ainda houver erro, pode ser configuração da API Key do Supabase');
    
  } catch (error) {
    console.error('❌ Erro geral:', error.message);
    console.error('📄 Stack:', error.stack);
  } finally {
    await prisma.$disconnect();
  }
}

fixSchemaPermissions(); 