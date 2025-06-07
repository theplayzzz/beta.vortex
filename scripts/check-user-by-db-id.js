#!/usr/bin/env node

/**
 * VERIFICAÇÃO POR ID INTERNO DO BANCO
 * Analisa usuário usando o ID interno do Supabase, não o clerkId
 */

require('dotenv').config();

const { createClerkClient } = require('@clerk/backend');
const { PrismaClient } = require('@prisma/client');

async function checkUserByDbId(dbUserId = 'cmbmazoja000909yox6gv567p') {
  const prisma = new PrismaClient();
  const clerkClient = createClerkClient({ 
    secretKey: process.env.CLERK_SECRET_KEY 
  });
  
  console.log('🔍 VERIFICAÇÃO POR ID INTERNO DO BANCO');
  console.log('='.repeat(50));
  console.log(`ID do banco: ${dbUserId}`);
  console.log(`Timestamp: ${new Date().toISOString()}`);
  console.log('');

  try {
    // 1. Buscar no banco pelo ID interno
    console.log('1️⃣ BUSCA NO BANCO (ID INTERNO)');
    console.log('-'.repeat(40));
    
    const dbUser = await prisma.user.findUnique({
      where: { id: dbUserId },
      include: {
        CreditTransaction: {
          take: 3,
          orderBy: { createdAt: 'desc' }
        }
      }
    });

    if (!dbUser) {
      console.log(`❌ Usuário não encontrado com ID: ${dbUserId}`);
      return;
    }

    console.log(`✅ Usuário encontrado:`);
    console.log(`   ID interno: ${dbUser.id}`);
    console.log(`   ClerkId: ${dbUser.clerkId}`);
    console.log(`   Email: ${dbUser.email}`);
    console.log(`   Status: ${dbUser.approvalStatus}`);
    console.log(`   Créditos: ${dbUser.creditBalance}`);
    console.log(`   Versão: ${dbUser.version}`);
    console.log(`   Criado: ${new Date(dbUser.createdAt).toLocaleString()}`);
    console.log(`   Atualizado: ${new Date(dbUser.updatedAt).toLocaleString()}`);

    // 2. Verificar no Clerk usando o clerkId
    console.log('\n2️⃣ VERIFICAÇÃO NO CLERK');
    console.log('-'.repeat(40));
    
    let clerkUser = null;
    try {
      clerkUser = await clerkClient.users.getUser(dbUser.clerkId);
      console.log(`✅ Encontrado no Clerk:`);
      console.log(`   Email: ${clerkUser.emailAddresses[0]?.emailAddress}`);
      console.log(`   Nome: ${clerkUser.firstName} ${clerkUser.lastName}`);
      
      const publicMetadata = clerkUser.publicMetadata || {};
      console.log(`   Metadata:`);
      console.log(`     approvalStatus: "${publicMetadata.approvalStatus}"`);
      console.log(`     role: "${publicMetadata.role}"`);
      console.log(`     dbUserId: "${publicMetadata.dbUserId}"`);
      
    } catch (clerkError) {
      console.log(`❌ Erro no Clerk: ${clerkError.message}`);
    }

    // 3. Análise de inconsistências
    console.log('\n3️⃣ ANÁLISE DE CONSISTÊNCIA');
    console.log('-'.repeat(40));
    
    if (clerkUser) {
      const clerkStatus = clerkUser.publicMetadata?.approvalStatus;
      const clerkDbUserId = clerkUser.publicMetadata?.dbUserId;
      const clerkRole = clerkUser.publicMetadata?.role;
      
      // Verificar se o dbUserId no metadata do Clerk bate com o ID real
      if (clerkDbUserId !== dbUser.id) {
        console.log(`❌ INCONSISTÊNCIA: dbUserId no Clerk (${clerkDbUserId}) ≠ ID real (${dbUser.id})`);
      } else {
        console.log(`✅ dbUserId no metadata está correto`);
      }
      
      // Verificar status
      if (clerkStatus !== dbUser.approvalStatus) {
        console.log(`❌ INCONSISTÊNCIA: Status Clerk (${clerkStatus}) ≠ Status Banco (${dbUser.approvalStatus})`);
      } else {
        console.log(`✅ Status de aprovação está consistente: ${dbUser.approvalStatus}`);
      }

      // Análise do middleware
      console.log('\n4️⃣ SIMULAÇÃO DO MIDDLEWARE');
      console.log('-'.repeat(40));
      
      const isAdmin = clerkRole === 'ADMIN' || clerkRole === 'SUPER_ADMIN';
      console.log(`   Role: "${clerkRole}"`);
      console.log(`   É admin: ${isAdmin}`);
      console.log(`   Status: "${clerkStatus}"`);
      
      if (isAdmin) {
        console.log(`   🎯 MIDDLEWARE: Admin deve bypassar verificação de approval`);
        console.log(`   📍 ESPERADO: Não deve ver /pending-approval`);
      } else if (clerkStatus === 'APPROVED') {
        console.log(`   🎯 MIDDLEWARE: Usuário aprovado deve ter acesso normal`);
        console.log(`   📍 ESPERADO: Não deve ver /pending-approval`);
      } else {
        console.log(`   🎯 MIDDLEWARE: Usuário deve ser redirecionado para /pending-approval`);
        console.log(`   📍 ESPERADO: Ver tela de pending-approval`);
      }

      // 5. Possíveis problemas
      console.log('\n5️⃣ POSSÍVEIS PROBLEMAS');
      console.log('-'.repeat(40));
      
      if (isAdmin && clerkStatus === 'APPROVED') {
        console.log(`⚠️  USUÁRIO CORRETO mas ainda vê pending-approval:`);
        console.log(`   1. JWT token desatualizado`);
        console.log(`   2. Cache de sessão`);
        console.log(`   3. Problema no middleware`);
        console.log(`   4. Cookies antigos`);
        console.log(`   5. Servidor precisa restart`);
      }

      // 6. Comandos de correção
      console.log('\n6️⃣ COMANDOS DE CORREÇÃO');
      console.log('-'.repeat(40));
      
      console.log(`🔧 Forçar atualização do metadata no Clerk:`);
      console.log(`   node scripts/fix-session-cache.js ${dbUser.clerkId}`);
      console.log(``);
      console.log(`🔧 Debug específico do middleware:`);
      console.log(`   node scripts/debug-admin-middleware.js ${dbUser.clerkId}`);
      console.log(``);
      console.log(`🔧 Teste de sessão:`);
      console.log(`   curl http://localhost:3003/api/debug/session`);

    }

  } catch (error) {
    console.error('❌ Erro durante verificação:', error.message);
  } finally {
    await prisma.$disconnect();
  }
}

// Executar verificação
if (require.main === module) {
  const targetDbId = process.argv[2] || 'cmbmazoja000909yox6gv567p';
  checkUserByDbId(targetDbId)
    .then(() => {
      console.log('\n✅ Verificação concluída');
      process.exit(0);
    })
    .catch(error => {
      console.error('❌ Falha na verificação:', error.message);
      process.exit(1);
    });
}

module.exports = { checkUserByDbId }; 