const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

async function debugAuthIssue() {
  try {
    console.log('🔍 DIAGNÓSTICO DE AUTENTICAÇÃO');
    console.log('============================');

    const planningId = 'cmbaqdkgw000309x06rxft5rv';
    
    // 1. Verificar se o planejamento existe no banco
    console.log('📋 Verificando planejamento no banco...');
    const planning = await prisma.strategicPlanning.findUnique({
      where: { id: planningId },
      include: {
        Client: true
      }
    });

    if (!planning) {
      console.log('❌ Planejamento não encontrado no banco!');
      return;
    }

    console.log('✅ Planejamento encontrado:');
    console.log(`   - ID: ${planning.id}`);
    console.log(`   - Title: ${planning.title}`);
    console.log(`   - Status: ${planning.status}`);
    console.log(`   - UserId: ${planning.userId}`);
    console.log(`   - Client: ${planning.Client?.name || 'N/A'}`);

    // 2. Buscar usuário dono do planejamento
    console.log('\n👤 Verificando usuário dono...');
    const user = await prisma.user.findUnique({
      where: { id: planning.userId }
    });

    if (!user) {
      console.log('❌ Usuário dono não encontrado!');
      return;
    }

    console.log('✅ Usuário encontrado:');
    console.log(`   - ID: ${user.id}`);
    console.log(`   - ClerkId: ${user.clerkId}`);
    console.log(`   - Email: ${user.email}`);

    // 3. Testar API diretamente
    console.log('\n🧪 Testando API diretamente...');
    
    try {
      const response = await fetch(`http://5.161.64.137:3003/api/plannings/${planningId}`, {
        method: 'GET',
        headers: {
          'Accept': 'application/json',
          'Content-Type': 'application/json'
        }
      });

      console.log(`📡 Status da resposta: ${response.status}`);
      console.log(`📡 Content-Type: ${response.headers.get('content-type')}`);

      if (response.status === 401) {
        console.log('❌ PROBLEMA: API retornando 401 Unauthorized');
        console.log('💡 CAUSA: Usuário não autenticado ou sessão expirou');
        console.log('🔧 SOLUÇÕES:');
        console.log('   1. Verificar se usuário está logado no frontend');
        console.log('   2. Verificar cookies de sessão do Clerk');
        console.log('   3. Verificar configuração do Clerk');
      } else if (response.status === 404) {
        console.log('❌ PROBLEMA: API retornando 404 Not Found');
        console.log('💡 CAUSA: Planejamento não pertence ao usuário logado');
      } else if (response.ok) {
        const data = await response.json();
        console.log('✅ API funcionando corretamente!');
        console.log('📋 Dados retornados:', {
          id: data.id,
          title: data.title,
          status: data.status
        });
      } else {
        console.log(`❌ Erro inesperado: ${response.status}`);
        const text = await response.text();
        console.log('📄 Resposta:', text.substring(0, 200));
      }

    } catch (apiError) {
      console.error('❌ Erro ao chamar API:', apiError.message);
    }

    // 4. Verificar configuração do ambiente
    console.log('\n⚙️  Verificando configuração...');
    console.log(`🔑 CLERK_SECRET_KEY: ${process.env.CLERK_SECRET_KEY ? 'CONFIGURADO' : 'NÃO CONFIGURADO'}`);
    console.log(`🔑 NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY: ${process.env.NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY ? 'CONFIGURADO' : 'NÃO CONFIGURADO'}`);
    console.log(`🔑 NEXTAUTH_URL: ${process.env.NEXTAUTH_URL || 'NÃO CONFIGURADO'}`);

    console.log('\n💡 PRÓXIMOS PASSOS:');
    console.log('1. Verificar se o usuário está logado no frontend');
    console.log('2. Verificar Network tab no DevTools para ver cookies enviados');
    console.log('3. Verificar logs do servidor para erros de autenticação');
    console.log('4. Testar login/logout no frontend');

  } catch (error) {
    console.error('❌ Erro no diagnóstico:', error);
  } finally {
    await prisma.$disconnect();
  }
}

// Executar diagnóstico
debugAuthIssue(); 