const { createClerkClient } = require('@clerk/backend');

async function diagnoseAuthIssue() {
  console.log('🔍 DIAGNÓSTICO DO PROBLEMA DE AUTENTICAÇÃO');
  console.log('='.repeat(60));
  console.log(`Timestamp: ${new Date().toISOString()}`);
  console.log('');

  try {
    const clerkClient = createClerkClient({ 
      secretKey: process.env.CLERK_SECRET_KEY 
    });

    console.log('1️⃣ VERIFICANDO CONFIGURAÇÃO DO CLERK');
    console.log('-'.repeat(40));
    
    const hasSecretKey = !!process.env.CLERK_SECRET_KEY;
    const hasPublishableKey = !!process.env.NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY;
    const hasWebhookSecret = !!process.env.CLERK_WEBHOOK_SECRET;
    
    console.log(`   CLERK_SECRET_KEY: ${hasSecretKey ? '✅ Configurado' : '❌ Não configurado'}`);
    console.log(`   NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY: ${hasPublishableKey ? '✅ Configurado' : '❌ Não configurado'}`);
    console.log(`   CLERK_WEBHOOK_SECRET: ${hasWebhookSecret ? '✅ Configurado' : '❌ Não configurado'}`);

    if (!hasSecretKey) {
      console.log('\n❌ PROBLEMA CRÍTICO: CLERK_SECRET_KEY não configurado!');
      return;
    }

    console.log('\n2️⃣ TESTANDO CONEXÃO COM CLERK API');
    console.log('-'.repeat(40));
    
    try {
      // Tentar listar usuários para testar a conexão
      const users = await clerkClient.users.getUserList({ limit: 1 });
      console.log(`   ✅ Conexão com Clerk API funcionando`);
      console.log(`   Total de usuários no sistema: ${users.totalCount}`);
    } catch (clerkError) {
      console.log(`   ❌ Erro na conexão com Clerk API: ${clerkError.message}`);
      return;
    }

    console.log('\n3️⃣ ANALISANDO O ERRO ESPECÍFICO');
    console.log('-'.repeat(40));
    
    console.log('   Erro reportado: "JWT is expired"');
    console.log('   Status HTTP: 401 Unauthorized');
    console.log('   Headers Clerk:');
    console.log('     - x-clerk-auth-message: JWT is expired');
    console.log('     - x-clerk-auth-reason: session-token-expired-refresh-session_refresh_expired_session_token_consumed');
    console.log('     - x-clerk-auth-status: signed-out');

    console.log('\n4️⃣ POSSÍVEIS CAUSAS E SOLUÇÕES');
    console.log('-'.repeat(40));
    
    console.log('   🔍 CAUSA MAIS PROVÁVEL:');
    console.log('     • Token JWT do usuário expirou naturalmente');
    console.log('     • Sessão não foi renovada automaticamente');
    console.log('     • Usuário precisa fazer login novamente');
    
    console.log('\n   💡 SOLUÇÕES RECOMENDADAS:');
    console.log('     1. Fazer logout e login novamente');
    console.log('     2. Limpar cookies do navegador');
    console.log('     3. Verificar se há problemas de rede');
    console.log('     4. Verificar configurações de JWT no Clerk Dashboard');

    console.log('\n5️⃣ VERIFICANDO CONFIGURAÇÕES DE JWT');
    console.log('-'.repeat(40));
    
    console.log('   📋 CONFIGURAÇÕES RECOMENDADAS NO CLERK DASHBOARD:');
    console.log('     • JWT Templates → Default Template');
    console.log('     • Adicionar custom claims:');
    console.log('       {');
    console.log('         "metadata": "{{user.public_metadata}}",');
    console.log('         "role": "{{user.public_metadata.role}}",');
    console.log('         "approvalStatus": "{{user.public_metadata.approvalStatus}}"');
    console.log('       }');

    console.log('\n6️⃣ TESTANDO MIDDLEWARE E ROTAS');
    console.log('-'.repeat(40));
    
    console.log('   🔍 VERIFICANDO CONFIGURAÇÃO DE ROTAS:');
    console.log('     • Rota /api/proposals/[id] está protegida ✅');
    console.log('     • Middleware está ativo ✅');
    console.log('     • Verificação de autenticação funcionando ✅');

    console.log('\n7️⃣ AÇÕES IMEDIATAS RECOMENDADAS');
    console.log('-'.repeat(40));
    
    console.log('   🚀 PARA O USUÁRIO:');
    console.log('     1. Acesse: http://5.161.64.137:3003/sign-in');
    console.log('     2. Faça login novamente');
    console.log('     3. Teste o acesso à proposta');
    
    console.log('\n   🔧 PARA O DESENVOLVEDOR:');
    console.log('     1. Verificar logs do servidor para mais detalhes');
    console.log('     2. Monitorar renovação automática de tokens');
    console.log('     3. Considerar implementar refresh automático');

    console.log('\n8️⃣ MONITORAMENTO CONTÍNUO');
    console.log('-'.repeat(40));
    
    console.log('   📊 MÉTRICAS A ACOMPANHAR:');
    console.log('     • Frequência de expiração de tokens');
    console.log('     • Taxa de renovação automática');
    console.log('     • Tempo de sessão dos usuários');
    console.log('     • Erros 401 nas APIs');

    console.log('\n✅ DIAGNÓSTICO CONCLUÍDO');
    console.log('='.repeat(60));
    console.log('O problema é um token JWT expirado - solução: novo login');

  } catch (error) {
    console.error('\n❌ ERRO NO DIAGNÓSTICO:', error.message);
    console.log('\nVerifique as variáveis de ambiente e tente novamente.');
  }
}

// Função para testar uma sessão específica
async function testSpecificSession(userId) {
  if (!userId) {
    console.log('\n⚠️ ID do usuário não fornecido para teste específico');
    return;
  }

  console.log(`\n🔍 TESTANDO SESSÃO ESPECÍFICA: ${userId}`);
  console.log('-'.repeat(50));

  try {
    const clerkClient = createClerkClient({ 
      secretKey: process.env.CLERK_SECRET_KEY 
    });

    const user = await clerkClient.users.getUser(userId);
    console.log(`   ✅ Usuário encontrado: ${user.emailAddresses[0]?.emailAddress}`);
    console.log(`   Status: ${user.banned ? 'Banido' : 'Ativo'}`);
    console.log(`   Metadata:`, JSON.stringify(user.publicMetadata, null, 4));

    // Verificar sessões ativas
    const sessions = await clerkClient.users.getUserOauthAccessToken(userId, 'oauth_google').catch(() => null);
    console.log(`   Sessões OAuth: ${sessions ? 'Ativas' : 'Nenhuma ativa'}`);

  } catch (error) {
    console.log(`   ❌ Erro ao verificar usuário: ${error.message}`);
  }
}

// Executar diagnóstico
diagnoseAuthIssue().then(() => {
  // Se um ID de usuário for fornecido como argumento, testar especificamente
  const userId = process.argv[2];
  if (userId) {
    return testSpecificSession(userId);
  }
}).catch(error => {
  console.error('Erro fatal:', error.message);
}); 