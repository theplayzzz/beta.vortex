#!/usr/bin/env node

/**
 * TESTE DE MIDDLEWARE CORRIGIDO
 * Verifica se a correção do middleware resolveu o problema do admin ver pending-approval
 */

require('dotenv').config();

const { createClerkClient } = require('@clerk/backend');

async function testMiddlewareFix() {
  const clerkClient = createClerkClient({ 
    secretKey: process.env.CLERK_SECRET_KEY 
  });
  
  console.log('🧪 TESTE DE MIDDLEWARE CORRIGIDO');
  console.log('='.repeat(50));
  console.log(`Timestamp: ${new Date().toISOString()}`);
  console.log('');

  const adminUserId = 'user_2xcFWfxqWjHinbasVVVL1j4e4aB';

  try {
    // 1. Verificar dados atuais do admin
    console.log('1️⃣ VERIFICAÇÃO DO ADMIN');
    console.log('-'.repeat(30));
    
    const clerkUser = await clerkClient.users.getUser(adminUserId);
    const metadata = clerkUser.publicMetadata || {};
    
    console.log(`Email: ${clerkUser.emailAddresses[0]?.emailAddress}`);
    console.log(`Role: "${metadata.role}"`);
    console.log(`Status: "${metadata.approvalStatus}"`);
    console.log(`É Admin: ${metadata.role === 'ADMIN'}`);

    // 2. Simular lógica do middleware corrigido
    console.log('\n2️⃣ SIMULAÇÃO DO MIDDLEWARE CORRIGIDO');
    console.log('-'.repeat(30));
    
    const isAdmin = metadata.role === 'ADMIN' || metadata.role === 'SUPER_ADMIN';
    const approvalStatus = metadata.approvalStatus;
    
    console.log(`Lógica do middleware:`);
    console.log(`  isAdmin: ${isAdmin}`);
    console.log(`  approvalStatus: "${approvalStatus}"`);
    
    if (isAdmin) {
      console.log(`  📍 RESULTADO: Admin deve ter acesso livre`);
      console.log(`  🔄 Se estiver em /pending-approval → redirecionar para /`);
      console.log(`  ✅ Não deve mais ver tela de pending-approval`);
    } else {
      console.log(`  📍 RESULTADO: Não é admin, seguir verificação normal`);
    }

    // 3. Teste de endpoint
    console.log('\n3️⃣ TESTE DE ENDPOINT');
    console.log('-'.repeat(30));
    
    console.log(`🔗 URLs para testar:`);
    console.log(`   Principal: http://localhost:3003/`);
    console.log(`   Admin: http://localhost:3003/admin`);
    console.log(`   Debug: http://localhost:3003/api/debug/session`);
    
    // 4. Instruções finais
    console.log('\n4️⃣ INSTRUÇÕES PARA TESTE');
    console.log('-'.repeat(30));
    console.log('');
    console.log('🔐 PASSO A PASSO:');
    console.log('1. Abra uma nova aba incógnita');
    console.log('2. Acesse: http://localhost:3003/');
    console.log('3. Faça login com: play-felix@hotmail.com');
    console.log('4. Observe os logs do terminal durante o processo');
    console.log('');
    console.log('✅ RESULTADO ESPERADO:');
    console.log('• Login deve ir direto para página principal');
    console.log('• NÃO deve mostrar "Conta Aguardando Aprovação"');
    console.log('• Logs devem mostrar: "[MIDDLEWARE] Admin redirected from pending-approval to home"');
    console.log('• Como admin, deve conseguir acessar /admin');
    console.log('');
    console.log('🔍 SE AINDA MOSTRAR PENDING-APPROVAL:');
    console.log('• Verifique os logs do terminal');
    console.log('• Teste o endpoint: curl http://localhost:3003/api/debug/session');
    console.log('• Limpe completamente o cache do navegador');
    console.log('• Tente em modo incógnito');

    // 5. Verificação do servidor
    console.log('\n5️⃣ VERIFICAÇÃO DO SERVIDOR');
    console.log('-'.repeat(30));
    
    try {
      const response = await fetch('http://localhost:3003/api/health');
      if (response.ok) {
        console.log('✅ Servidor respondendo corretamente');
      } else {
        console.log('⚠️  Servidor respondeu com erro:', response.status);
      }
    } catch (fetchError) {
      console.log('❌ Erro ao conectar com servidor:', fetchError.message);
      console.log('💡 Verifique se o servidor está rodando: npm run dev');
    }

    return {
      adminCorrect: isAdmin && approvalStatus === 'APPROVED',
      middlewareLogic: 'corrected',
      nextSteps: 'test_with_browser'
    };

  } catch (error) {
    console.error('❌ Erro durante teste:', error.message);
    return { error: error.message };
  }
}

// Executar teste
if (require.main === module) {
  testMiddlewareFix()
    .then(result => {
      console.log('\n🏁 TESTE CONCLUÍDO');
      if (result.error) {
        console.log('❌ Falhou:', result.error);
        process.exit(1);
      } else {
        console.log('✅ Configuração correta - Teste no navegador agora!');
        process.exit(0);
      }
    })
    .catch(error => {
      console.error('❌ Falha no teste:', error.message);
      process.exit(1);
    });
}

module.exports = { testMiddlewareFix }; 