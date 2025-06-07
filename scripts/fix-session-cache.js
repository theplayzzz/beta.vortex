#!/usr/bin/env node

/**
 * CORREÇÃO DE CACHE DE SESSÃO
 * Força atualização do metadata no Clerk para resolver problemas de cache
 */

require('dotenv').config();

const { createClerkClient } = require('@clerk/backend');
const { PrismaClient } = require('@prisma/client');

async function fixSessionCache(clerkUserId = null) {
  const prisma = new PrismaClient();
  const clerkClient = createClerkClient({ 
    secretKey: process.env.CLERK_SECRET_KEY 
  });
  
  console.log('🔄 CORREÇÃO DE CACHE DE SESSÃO');
  console.log('='.repeat(50));
  console.log(`Timestamp: ${new Date().toISOString()}`);
  console.log('');

  try {
    // Se não especificou usuário, corrigir todos
    let usersToFix = [];
    
    if (clerkUserId) {
      // Usuário específico
      const dbUser = await prisma.user.findUnique({
        where: { clerkId: clerkUserId }
      });
      
      if (dbUser) {
        usersToFix = [dbUser];
        console.log(`🎯 Corrigindo usuário específico: ${dbUser.email}`);
      } else {
        console.log(`❌ Usuário ${clerkUserId} não encontrado no banco`);
        return;
      }
    } else {
      // Todos os usuários
      usersToFix = await prisma.user.findMany({
        where: { approvalStatus: 'APPROVED' }
      });
      console.log(`🔄 Corrigindo ${usersToFix.length} usuários aprovados`);
    }

    console.log('\n📝 Processando usuários...\n');

    for (const user of usersToFix) {
      try {
        console.log(`🔧 Corrigindo: ${user.email}`);
        
        // Buscar dados atuais do Clerk
        const clerkUser = await clerkClient.users.getUser(user.clerkId);
        const currentMetadata = clerkUser.publicMetadata || {};
        
        console.log(`   Status atual no Clerk: ${currentMetadata.approvalStatus || 'undefined'}`);
        console.log(`   Status no banco: ${user.approvalStatus}`);
        
        // Forçar atualização do metadata para garantir consistência
        const updatedMetadata = {
          ...currentMetadata,
          approvalStatus: user.approvalStatus,
          dbUserId: user.id,
          role: currentMetadata.role || 'USER',
          lastSync: new Date().toISOString(),
          forceUpdate: true // Flag para forçar atualização
        };
        
        await clerkClient.users.updateUserMetadata(user.clerkId, {
          publicMetadata: updatedMetadata
        });
        
        console.log(`   ✅ Metadata atualizado no Clerk`);
        
        // Atualizar timestamp no banco para tracking
        await prisma.user.update({
          where: { id: user.id },
          data: { updatedAt: new Date() }
        });
        
        console.log(`   ✅ Timestamp atualizado no banco`);
        
      } catch (userError) {
        console.log(`   ❌ Erro para usuário ${user.email}: ${userError.message}`);
      }
      
      console.log('');
    }

    console.log('🎉 CORREÇÃO CONCLUÍDA');
    console.log('-'.repeat(30));
    console.log('');
    console.log('📋 PRÓXIMOS PASSOS PARA O USUÁRIO:');
    console.log('1. Fazer logout completo da aplicação');
    console.log('2. Limpar cookies do navegador');
    console.log('3. Fazer login novamente');
    console.log('4. Verificar se o redirecionamento para /pending-approval parou');
    console.log('');
    console.log('⚠️  Se o problema persistir:');
    console.log('1. Verificar se há cache no middleware.ts');
    console.log('2. Reiniciar o servidor de desenvolvimento');
    console.log('3. Verificar se há erro no console do navegador');

  } catch (error) {
    console.error('❌ Erro durante correção:', error.message);
  } finally {
    await prisma.$disconnect();
  }
}

// Executar correção
if (require.main === module) {
  const targetUserId = process.argv[2] || null;
  
  if (targetUserId === 'all') {
    console.log('🔄 Modo: Corrigir todos os usuários');
    fixSessionCache(null);
  } else if (targetUserId) {
    console.log(`🎯 Modo: Corrigir usuário específico - ${targetUserId}`);
    fixSessionCache(targetUserId);
  } else {
    console.log('🔄 Modo: Corrigir todos os usuários (padrão)');
    fixSessionCache(null);
  }
}

module.exports = { fixSessionCache }; 