#!/usr/bin/env node

/**
 * DIAGNÓSTICO COMPLETO: Sistema de Aprovação de Usuários
 * Analisa status detalhado de um usuário específico e do sistema como um todo
 */

require('dotenv').config();

const { createClerkClient } = require('@clerk/backend');
const { PrismaClient } = require('@prisma/client');

async function diagnosticoCompleto(clerkUserId = 'cmbmazoja000909yox6gv567p') {
  const prisma = new PrismaClient();
  const clerkClient = createClerkClient({ 
    secretKey: process.env.CLERK_SECRET_KEY 
  });
  
  console.log('🔍 DIAGNÓSTICO COMPLETO - SISTEMA DE APROVAÇÃO');
  console.log('='.repeat(60));
  console.log(`Usuário alvo: ${clerkUserId}`);
  console.log(`Timestamp: ${new Date().toISOString()}`);
  console.log('');

  try {
    // 1. Verificar configurações do sistema
    console.log('1️⃣ CONFIGURAÇÕES DO SISTEMA');
    console.log('-'.repeat(40));
    
    const config = {
      approvalRequired: process.env.APPROVAL_REQUIRED === 'true',
      defaultStatus: process.env.DEFAULT_USER_STATUS || 'PENDING',
      adminIds: process.env.ADMIN_CLERK_USER_IDS || 'não configurado',
      environment: process.env.NODE_ENV || 'development',
      clerkConfigured: !!process.env.CLERK_SECRET_KEY,
      webhookConfigured: !!process.env.CLERK_WEBHOOK_SECRET
    };
    
    console.log(`   APPROVAL_REQUIRED: ${config.approvalRequired}`);
    console.log(`   DEFAULT_USER_STATUS: ${config.defaultStatus}`);
    console.log(`   ADMIN_CLERK_USER_IDS: ${config.adminIds}`);
    console.log(`   NODE_ENV: ${config.environment}`);
    console.log(`   Clerk configurado: ${config.clerkConfigured ? '✅' : '❌'}`);
    console.log(`   Webhook configurado: ${config.webhookConfigured ? '✅' : '❌'}`);
    
    // 2. Estado geral do sistema
    console.log('\n2️⃣ ESTADO GERAL DO SISTEMA');
    console.log('-'.repeat(40));
    
    const userStats = await prisma.user.groupBy({
      by: ['approvalStatus'],
      _count: { id: true }
    });
    
    const totalUsers = await prisma.user.count();
    console.log(`   Total de usuários: ${totalUsers}`);
    
    userStats.forEach(stat => {
      console.log(`   ${stat.approvalStatus}: ${stat._count.id} usuários`);
    });

    // 3. Verificar usuário específico
    console.log('\n3️⃣ USUÁRIO ESPECÍFICO NO BANCO');
    console.log('-'.repeat(40));
    
    const dbUser = await prisma.user.findUnique({
      where: { clerkId: clerkUserId },
      include: {
        CreditTransaction: {
          take: 3,
          orderBy: { createdAt: 'desc' }
        }
      }
    });

    if (dbUser) {
      console.log(`   ✅ Encontrado no banco`);
      console.log(`   ID: ${dbUser.id}`);
      console.log(`   Email: ${dbUser.email}`);
      console.log(`   Status: ${dbUser.approvalStatus}`);
      console.log(`   Créditos: ${dbUser.creditBalance}`);
      console.log(`   Versão: ${dbUser.version}`);
      console.log(`   Criado: ${new Date(dbUser.createdAt).toLocaleString()}`);
      console.log(`   Atualizado: ${new Date(dbUser.updatedAt).toLocaleString()}`);
      
      if (dbUser.approvedAt) {
        console.log(`   Aprovado em: ${new Date(dbUser.approvedAt).toLocaleString()}`);
        console.log(`   Aprovado por: ${dbUser.approvedBy || 'N/A'}`);
      }
      
      if (dbUser.CreditTransaction.length > 0) {
        console.log(`   Últimas transações:`);
        dbUser.CreditTransaction.forEach((t, i) => {
          console.log(`     ${i+1}. ${t.type}: ${t.amount} (${new Date(t.createdAt).toLocaleDateString()})`);
        });
      }
    } else {
      console.log(`   ❌ Usuário NÃO encontrado no banco`);
    }

    // 4. Verificar usuário no Clerk
    console.log('\n4️⃣ USUÁRIO ESPECÍFICO NO CLERK');
    console.log('-'.repeat(40));
    
    let clerkUser = null;
    try {
      clerkUser = await clerkClient.users.getUser(clerkUserId);
      console.log(`   ✅ Encontrado no Clerk`);
      console.log(`   Email: ${clerkUser.emailAddresses[0]?.emailAddress}`);
      console.log(`   Nome: ${clerkUser.firstName} ${clerkUser.lastName}`);
      console.log(`   Criado: ${new Date(clerkUser.createdAt).toLocaleString()}`);
      
      const publicMetadata = clerkUser.publicMetadata || {};
      console.log(`   Metadata público:`);
      console.log(`     approvalStatus: ${publicMetadata.approvalStatus || 'undefined'}`);
      console.log(`     dbUserId: ${publicMetadata.dbUserId || 'undefined'}`);
      console.log(`     role: ${publicMetadata.role || 'undefined'}`);
      
    } catch (clerkError) {
      console.log(`   ❌ Usuário NÃO encontrado no Clerk`);
      console.log(`   Erro: ${clerkError.message}`);
    }

    // 5. Verificar logs de moderação
    if (dbUser) {
      console.log('\n5️⃣ LOGS DE MODERAÇÃO');
      console.log('-'.repeat(40));
      
      const logs = await prisma.userModerationLog.findMany({
        where: { userId: dbUser.id },
        orderBy: { createdAt: 'desc' },
        take: 5
      });
      
      if (logs.length > 0) {
        console.log(`   Encontrados ${logs.length} logs:`);
        logs.forEach((log, i) => {
          console.log(`   ${i+1}. ${log.action}: ${log.previousStatus} → ${log.newStatus}`);
          console.log(`      Data: ${new Date(log.createdAt).toLocaleString()}`);
          console.log(`      Moderador: ${log.moderatorId}`);
          if (log.reason) console.log(`      Motivo: ${log.reason}`);
        });
      } else {
        console.log(`   Nenhum log de moderação encontrado`);
      }
    }

    // 6. Diagnóstico e recomendações
    console.log('\n6️⃣ DIAGNÓSTICO E RECOMENDAÇÕES');
    console.log('-'.repeat(40));
    
    if (!config.clerkConfigured) {
      console.log('❌ CLERK_SECRET_KEY não configurado');
      console.log('🔧 Configure a variável de ambiente CLERK_SECRET_KEY');
      return { status: 'error', issue: 'clerk_not_configured' };
    }

    if (!dbUser) {
      console.log('❌ Usuário não existe no banco, mas existe no Clerk');
      console.log('🔧 Execute: npm run migrate-users');
      return { status: 'error', issue: 'user_not_in_db', solution: 'migrate_users' };
    }

    // Verificar inconsistências
    if (clerkUser) {
      const clerkStatus = clerkUser.publicMetadata?.approvalStatus;
      const dbStatus = dbUser.approvalStatus;

      if (clerkStatus !== dbStatus) {
        console.log('❌ INCONSISTÊNCIA DETECTADA:');
        console.log(`   Clerk: ${clerkStatus || 'undefined'}`);
        console.log(`   Banco: ${dbStatus}`);
        console.log('🔧 SOLUÇÕES:');
        console.log('   1. Sincronizar metadata do Clerk');
        console.log('   2. Forçar logout/login do usuário');
        console.log(`   3. Atualizar manualmente via API admin`);
        
        return { 
          status: 'inconsistent', 
          issue: 'clerk_db_mismatch',
          clerkStatus, 
          dbStatus, 
          dbUser,
          solution: 'sync_metadata'
        };
      } else if (dbStatus === 'PENDING') {
        console.log('⚠️  USUÁRIO COM STATUS PENDING');
        console.log('🔧 OPÇÕES:');
        console.log('   1. Aprovar manualmente via /admin/moderate');
        console.log('   2. Alterar APPROVAL_REQUIRED=false no .env');
        console.log('   3. Executar migração com aprovação automática');
        
        return { 
          status: 'pending', 
          issue: 'user_pending',
          dbUser,
          solution: 'approve_user'
        };
        
      } else if (dbStatus === 'APPROVED' && clerkStatus === 'APPROVED') {
        console.log('✅ STATUS CORRETO EM AMBOS OS SISTEMAS');
        console.log('⚠️  POSSÍVEIS CAUSAS DO PROBLEMA:');
        console.log('   1. Cache de sessão desatualizado');
        console.log('   2. Middleware com cache');
        console.log('   3. JWT token desatualizado');
        console.log('\n🔧 SOLUÇÕES:');
        console.log('   1. Usuário deve fazer logout/login');
        console.log('   2. Limpar cookies do navegador');
        console.log('   3. Verificar middleware.ts para cache');
        
        return { 
          status: 'session_cache', 
          issue: 'outdated_session',
          solution: 'refresh_session'
        };
      }
    }

    return { status: 'unknown', issue: 'unidentified' };

  } catch (error) {
    console.error('❌ Erro durante diagnóstico:', error.message);
    return { status: 'error', issue: 'diagnostic_error', error: error.message };
  } finally {
    await prisma.$disconnect();
  }
}

// Executar diagnóstico
if (require.main === module) {
  const targetUserId = process.argv[2] || 'cmbmazoja000909yox6gv567p';
  diagnosticoCompleto(targetUserId)
    .then(result => {
      console.log('\n📋 RESULTADO DO DIAGNÓSTICO:', result.status);
      process.exit(0);
    })
    .catch(error => {
      console.error('❌ Falha no diagnóstico:', error.message);
      process.exit(1);
    });
}

module.exports = { diagnosticoCompleto }; 