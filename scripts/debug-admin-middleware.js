#!/usr/bin/env node

/**
 * DEBUG MIDDLEWARE ADMIN
 * Verifica problema específico com middleware não reconhecendo usuários admin
 */

require('dotenv').config();

const { createClerkClient } = require('@clerk/backend');
const { PrismaClient } = require('@prisma/client');

async function debugAdminMiddleware(clerkUserId = 'user_2xcFWfxqWjHinbasVVVL1j4e4aB') {
  const prisma = new PrismaClient();
  const clerkClient = createClerkClient({ 
    secretKey: process.env.CLERK_SECRET_KEY 
  });
  
  console.log('🔧 DEBUG MIDDLEWARE ADMIN');
  console.log('='.repeat(50));
  console.log(`Usuário: ${clerkUserId}`);
  console.log(`Timestamp: ${new Date().toISOString()}`);
  console.log('');

  try {
    // 1. Verificar dados no Clerk
    console.log('1️⃣ DADOS NO CLERK');
    console.log('-'.repeat(30));
    
    const clerkUser = await clerkClient.users.getUser(clerkUserId);
    const publicMetadata = clerkUser.publicMetadata || {};
    
    console.log(`Email: ${clerkUser.emailAddresses[0]?.emailAddress}`);
    console.log(`Public Metadata:`, JSON.stringify(publicMetadata, null, 2));
    
    const approvalStatus = publicMetadata.approvalStatus;
    const userRole = publicMetadata.role;
    
    console.log(`Approval Status: "${approvalStatus}"`);
    console.log(`User Role: "${userRole}"`);
    
    // 2. Simular lógica do middleware
    console.log('\n2️⃣ SIMULAÇÃO DO MIDDLEWARE');
    console.log('-'.repeat(30));
    
    const isAdmin = userRole === 'ADMIN' || userRole === 'SUPER_ADMIN';
    console.log(`userRole === 'ADMIN': ${userRole === 'ADMIN'}`);
    console.log(`userRole === 'SUPER_ADMIN': ${userRole === 'SUPER_ADMIN'}`);
    console.log(`isAdmin (final): ${isAdmin}`);
    
    // 3. Verificar problema específico
    console.log('\n3️⃣ ANÁLISE DO PROBLEMA');
    console.log('-'.repeat(30));
    
    if (!isAdmin && approvalStatus !== 'APPROVED') {
      console.log('❌ PROBLEMA: Usuário não é admin E não está aprovado');
      console.log('   → Middleware vai redirecionar para /pending-approval');
    } else if (!isAdmin && approvalStatus === 'APPROVED') {
      console.log('✅ OK: Usuário não é admin mas está aprovado');
      console.log('   → Middleware deveria permitir acesso');
    } else if (isAdmin) {
      console.log('✅ OK: Usuário é admin');
      console.log('   → Middleware deve bypassar verificação de approval');
    } else {
      console.log('⚠️  EDGE CASE: Situação não esperada');
    }
    
    // 4. Verificar se há problema com string/tipo
    console.log('\n4️⃣ VERIFICAÇÃO DE TIPOS');
    console.log('-'.repeat(30));
    
    console.log(`typeof userRole: ${typeof userRole}`);
    console.log(`userRole length: ${userRole?.length}`);
    console.log(`userRole === "ADMIN": ${userRole === "ADMIN"}`);
    console.log(`userRole.trim() === "ADMIN": ${userRole?.trim?.() === "ADMIN"}`);
    
    // 5. Verificar encoding/caracteres especiais
    const roleBytes = userRole ? Array.from(userRole).map(c => c.charCodeAt(0)) : [];
    console.log(`Role bytes: [${roleBytes.join(', ')}]`);
    console.log(`Expected "ADMIN" bytes: [65, 68, 77, 73, 78]`);
    
    // 6. Corrrigir se necessário
    console.log('\n5️⃣ CORREÇÃO');
    console.log('-'.repeat(30));
    
    let needsCorrection = false;
    let correctedMetadata = { ...publicMetadata };
    
    // Verificar se role tem problemas
    if (userRole && userRole.trim() === 'ADMIN' && userRole !== 'ADMIN') {
      console.log('🔧 Corrigindo role com espaços/caracteres extras');
      correctedMetadata.role = 'ADMIN';
      needsCorrection = true;
    }
    
    // Garantir que approvalStatus está correto
    if (approvalStatus !== 'APPROVED') {
      console.log('🔧 Corrigindo approvalStatus para APPROVED');
      correctedMetadata.approvalStatus = 'APPROVED';
      needsCorrection = true;
    }
    
    // Adicionar timestamp para forçar refresh
    correctedMetadata.lastDebugFix = new Date().toISOString();
    correctedMetadata.debugSource = 'admin-middleware-fix';
    needsCorrection = true;
    
    if (needsCorrection) {
      console.log('🚀 Aplicando correção...');
      console.log('Novo metadata:', JSON.stringify(correctedMetadata, null, 2));
      
      await clerkClient.users.updateUserMetadata(clerkUserId, {
        publicMetadata: correctedMetadata
      });
      
      console.log('✅ Metadata corrigido no Clerk');
    } else {
      console.log('ℹ️  Nenhuma correção necessária');
    }
    
    // 7. Instruções para o usuário
    console.log('\n6️⃣ INSTRUÇÕES PARA O USUÁRIO');
    console.log('-'.repeat(30));
    console.log('');
    console.log('🔄 PRÓXIMOS PASSOS:');
    console.log('1. Fazer LOGOUT COMPLETO da aplicação');
    console.log('2. Limpar ALL COOKIES do navegador para o domínio');
    console.log('3. Fechar TODAS as abas da aplicação');
    console.log('4. Aguardar 30 segundos');
    console.log('5. Abrir nova aba incógnita');
    console.log('6. Fazer login novamente');
    console.log('');
    console.log('🎯 RESULTADO ESPERADO:');
    console.log('• Deve ir direto para a página principal (/)');
    console.log('• NÃO deve mostrar /pending-approval');
    console.log('• Como é ADMIN, deve ter acesso a /admin/*');
    
    return {
      isAdmin,
      approvalStatus,
      userRole,
      needsCorrection,
      correctedMetadata: needsCorrection ? correctedMetadata : null
    };

  } catch (error) {
    console.error('❌ Erro durante debug:', error.message);
    return { error: error.message };
  } finally {
    await prisma.$disconnect();
  }
}

// Executar debug
if (require.main === module) {
  const targetUserId = process.argv[2] || 'user_2xcFWfxqWjHinbasVVVL1j4e4aB';
  debugAdminMiddleware(targetUserId)
    .then(result => {
      console.log('\n🏁 DEBUG CONCLUÍDO');
      if (result.error) {
        console.log('❌ Falhou:', result.error);
        process.exit(1);
      } else {
        console.log('✅ Sucesso');
        process.exit(0);
      }
    })
    .catch(error => {
      console.error('❌ Falha no debug:', error.message);
      process.exit(1);
    });
}

module.exports = { debugAdminMiddleware }; 