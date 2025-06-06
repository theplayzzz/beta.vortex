const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

async function testRealAuthFlow() {
  console.log('🔍 DIAGNÓSTICO: PROBLEMA REAL DE AUTENTICAÇÃO');
  console.log('=' .repeat(60));

  try {
    await prisma.$connect();
    console.log('✅ Conectado ao banco de dados');

    // 1. Verificar usuários existentes
    const users = await prisma.user.findMany({
      select: {
        id: true,
        clerkId: true,
        email: true,
        creditBalance: true,
        createdAt: true
      },
      orderBy: { createdAt: 'desc' }
    });

    console.log(`\n👥 USUÁRIOS NO BANCO (${users.length} total):`);
    users.forEach((user, index) => {
      console.log(`${index + 1}. ${user.email}`);
      console.log(`   ClerkID: ${user.clerkId}`);
      console.log(`   Créditos: ${user.creditBalance}`);
      console.log(`   Criado: ${user.createdAt.toISOString()}`);
      console.log('');
    });

    // 2. Simular o problema: usuário autenticado no Clerk mas não consegue acessar dados
    console.log('🧪 SIMULANDO PROBLEMA DE ACESSO...');
    
    if (users.length > 0) {
      const testUser = users[0]; // Pegar o usuário mais recente
      console.log(`📋 Testando com usuário: ${testUser.email}`);

      // Simular getCurrentUser()
      const foundUser = await prisma.user.findUnique({
        where: { clerkId: testUser.clerkId }
      });

      if (foundUser) {
        console.log('✅ getCurrentUser() funcionaria corretamente');
        
        // Testar acesso a clientes (principal funcionalidade)
        const clients = await prisma.client.findMany({
          where: { userId: foundUser.id },
          select: {
            id: true,
            name: true,
            industry: true,
            richnessScore: true,
            createdAt: true
          }
        });

        console.log(`📊 Clientes do usuário: ${clients.length}`);
        
        if (clients.length > 0) {
          console.log('✅ Usuário tem clientes cadastrados');
          clients.forEach((client, index) => {
            console.log(`   ${index + 1}. ${client.name} (${client.industry}) - Score: ${client.richnessScore}`);
          });
        } else {
          console.log('⚠️ Usuário não tem clientes cadastrados');
          console.log('💡 Isso pode explicar problemas na interface');
        }

        // Testar outras funcionalidades
        const [plannings, proposals, tasks] = await Promise.all([
          prisma.strategicPlanning.count({ where: { userId: foundUser.id } }),
          prisma.commercialProposal.count({ where: { userId: foundUser.id } }),
          prisma.planningTask.count({ where: { ownerId: foundUser.id } })
        ]);

        console.log(`📋 Planejamentos: ${plannings}`);
        console.log(`💼 Propostas: ${proposals}`);
        console.log(`✅ Tarefas: ${tasks}`);

      } else {
        console.log('❌ getCurrentUser() NÃO encontraria o usuário');
        console.log('🚨 PROBLEMA IDENTIFICADO: Usuário existe mas não pode ser encontrado');
      }
    } else {
      console.log('⚠️ Nenhum usuário encontrado no banco');
      console.log('💡 Isso indica que o webhook nunca funcionou ou usuários foram deletados');
    }

    // 3. Verificar RLS policies (se possível)
    console.log('\n🛡️ VERIFICANDO RLS POLICIES...');
    
    try {
      const rlsStatus = await prisma.$queryRawUnsafe(`
        SELECT tablename, rowsecurity 
        FROM pg_tables 
        WHERE tablename IN ('User', 'Client', 'StrategicPlanning')
        AND schemaname = 'public'
      `);
      
      console.log('📊 Status RLS:');
      rlsStatus.forEach(table => {
        console.log(`   ${table.tablename}: ${table.rowsecurity ? 'HABILITADO' : 'DESABILITADO'}`);
      });

      // Verificar função helper
      const functionExists = await prisma.$queryRawUnsafe(`
        SELECT EXISTS(
          SELECT 1 FROM pg_proc 
          WHERE proname = 'get_user_id_from_clerk'
        ) as exists
      `);

      if (functionExists[0]?.exists) {
        console.log('✅ Função get_user_id_from_clerk existe');
      } else {
        console.log('❌ Função get_user_id_from_clerk NÃO existe');
        console.log('🚨 PROBLEMA CRÍTICO: RLS não pode funcionar sem esta função');
      }

    } catch (error) {
      console.log('⚠️ Não foi possível verificar RLS:', error.message);
    }

    // 4. Testar cenário de novo usuário (getCurrentUserOrCreate)
    console.log('\n🆕 TESTANDO CENÁRIO: NOVO USUÁRIO SEM REGISTRO...');
    
    const newClerkId = `user_new_test_${Date.now()}`;
    console.log(`📋 Simulando clerkId: ${newClerkId}`);

    // Verificar se usuário NÃO existe
    const existingUser = await prisma.user.findUnique({
      where: { clerkId: newClerkId }
    });

    if (!existingUser) {
      console.log('✅ Usuário não existe (cenário correto)');
      console.log('💡 Aqui o getCurrentUserOrCreate() deveria criar o usuário');
      console.log('💡 Se isso não acontece, o problema está na função de fallback');
    } else {
      console.log('❌ Usuário já existe (não deveria)');
    }

    // 5. Diagnóstico final
    console.log('\n📋 DIAGNÓSTICO FINAL:');
    console.log('=' .repeat(50));

    if (users.length > 0) {
      console.log('✅ Webhook funcionou pelo menos uma vez (usuários existem)');
      console.log('✅ Banco de dados está funcionando corretamente');
      console.log('✅ Estrutura de dados está correta');
      
      console.log('\n🔍 POSSÍVEIS CAUSAS DO PROBLEMA:');
      console.log('1. 🛡️ RLS policies bloqueando acesso');
      console.log('2. 🔄 getCurrentUserOrCreate() não sendo usado nas páginas');
      console.log('3. 🎯 Middleware redirecionando incorretamente');
      console.log('4. 🔐 JWT do Clerk não sendo passado corretamente');
      console.log('5. ⏱️ Timing: usuário tenta acessar antes do webhook processar');
      
      console.log('\n🔧 PRÓXIMOS PASSOS RECOMENDADOS:');
      console.log('1. Testar login com conta existente');
      console.log('2. Verificar logs do browser (Network/Console)');
      console.log('3. Verificar se RLS está aplicado corretamente');
      console.log('4. Testar com conta nova em ambiente controlado');
      
    } else {
      console.log('❌ Webhook nunca funcionou ou usuários foram deletados');
      console.log('🔧 AÇÃO NECESSÁRIA: Configurar webhook no painel do Clerk');
    }

  } catch (error) {
    console.error('❌ ERRO NO DIAGNÓSTICO:', error.message);
  } finally {
    await prisma.$disconnect();
  }
}

// Executar diagnóstico
testRealAuthFlow(); 