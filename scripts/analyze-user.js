#!/usr/bin/env node

/**
 * 🔍 ANÁLISE DE USUÁRIO ESPECÍFICO
 * 
 * Este script analisa um usuário específico no Clerk e Supabase
 * para determinar o status atual e comportamento esperado
 */

// Configurar Clerk
const { createClerkClient } = require('@clerk/backend');
const clerkClient = createClerkClient({
  secretKey: process.env.CLERK_SECRET_KEY
});
const { PrismaClient } = require('@prisma/client');

// Cores para logs
const colors = {
  reset: '\x1b[0m',
  red: '\x1b[31m',
  green: '\x1b[32m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  cyan: '\x1b[36m',
  magenta: '\x1b[35m'
};

function log(message, color = 'white') {
  const timestamp = new Date().toISOString();
  const coloredMessage = `${colors[color] || ''}${message}${colors.reset}`;
  console.log(`[${timestamp}] ${coloredMessage}`);
}

async function analyzeUser(clerkId, supabaseUserId) {
  log('🔍 INICIANDO ANÁLISE DE USUÁRIO', 'cyan');
  log(`Clerk ID: ${clerkId}`, 'blue');
  log(`Supabase User ID: ${supabaseUserId}`, 'blue');
  log('='.repeat(70), 'cyan');

  const analysis = {
    clerkId,
    supabaseUserId,
    clerkData: null,
    supabaseData: null,
    approvalStatus: null,
    expectedBehavior: null,
    issues: [],
    recommendations: []
  };

  try {
    // 1. Buscar dados no Clerk
    log('\n📋 1. ANÁLISE DO CLERK', 'yellow');
    try {
      const clerkUser = await clerkClient.users.getUser(clerkId);
      analysis.clerkData = {
        id: clerkUser.id,
        email: clerkUser.emailAddresses?.[0]?.emailAddress,
        firstName: clerkUser.firstName,
        lastName: clerkUser.lastName,
        createdAt: clerkUser.createdAt,
        lastSignInAt: clerkUser.lastSignInAt,
        publicMetadata: clerkUser.publicMetadata,
        privateMetadata: clerkUser.privateMetadata
      };

      log(`✅ Usuário encontrado no Clerk`, 'green');
      log(`   Email: ${analysis.clerkData.email}`, 'white');
      log(`   Nome: ${analysis.clerkData.firstName} ${analysis.clerkData.lastName}`, 'white');
      log(`   Criado em: ${new Date(analysis.clerkData.createdAt).toLocaleString()}`, 'white');
      log(`   Último login: ${analysis.clerkData.lastSignInAt ? new Date(analysis.clerkData.lastSignInAt).toLocaleString() : 'Nunca'}`, 'white');

      // Analisar metadata
      const publicMetadata = analysis.clerkData.publicMetadata || {};
      analysis.approvalStatus = publicMetadata.approvalStatus || 'PENDING';
      
      log(`\n📊 METADATA PÚBLICO:`, 'cyan');
      log(`   approvalStatus: ${analysis.approvalStatus}`, analysis.approvalStatus === 'APPROVED' ? 'green' : analysis.approvalStatus === 'REJECTED' ? 'red' : 'yellow');
      log(`   role: ${publicMetadata.role || 'USER'}`, 'white');
      log(`   dbUserId: ${publicMetadata.dbUserId || 'N/A'}`, 'white');
      log(`   approvedAt: ${publicMetadata.approvedAt || 'N/A'}`, 'white');
      log(`   approvedBy: ${publicMetadata.approvedBy || 'N/A'}`, 'white');
      log(`   creditBalance: ${publicMetadata.creditBalance || 'N/A'}`, 'white');

      if (analysis.clerkData.privateMetadata && Object.keys(analysis.clerkData.privateMetadata).length > 0) {
        log(`\n📊 METADATA PRIVADO:`, 'cyan');
        Object.entries(analysis.clerkData.privateMetadata).forEach(([key, value]) => {
          log(`   ${key}: ${value}`, 'white');
        });
      }

    } catch (error) {
      analysis.issues.push(`Erro ao buscar usuário no Clerk: ${error.message}`);
      log(`❌ Erro ao buscar no Clerk: ${error.message}`, 'red');
    }

    // 2. Buscar dados no Supabase
    log('\n📋 2. ANÁLISE DO SUPABASE', 'yellow');
    const prisma = new PrismaClient();
    
    try {
      const supabaseUser = await prisma.user.findUnique({
        where: { id: supabaseUserId },
        include: {
          ModeratedUsers: {
            orderBy: { createdAt: 'desc' },
            take: 5
          },
          Client: { take: 3 },
          ClientNote: { take: 3 },
          StrategicPlanning: { take: 3 }
        }
      });

      if (supabaseUser) {
        analysis.supabaseData = {
          id: supabaseUser.id,
          clerkId: supabaseUser.clerkId,
          email: supabaseUser.email,
          firstName: supabaseUser.firstName,
          lastName: supabaseUser.lastName,
          approvalStatus: supabaseUser.approvalStatus,
          approvedAt: supabaseUser.approvedAt,
          approvedBy: supabaseUser.approvedBy,
          createdAt: supabaseUser.createdAt,
          updatedAt: supabaseUser.updatedAt,
          creditBalance: supabaseUser.creditBalance,
          clientsCount: supabaseUser.Client.length,
          notesCount: supabaseUser.ClientNote.length,
          planningsCount: supabaseUser.StrategicPlanning.length,
          moderationLogs: supabaseUser.ModeratedUsers
        };

        log(`✅ Usuário encontrado no Supabase`, 'green');
        log(`   Email: ${analysis.supabaseData.email}`, 'white');
        log(`   Nome: ${analysis.supabaseData.firstName} ${analysis.supabaseData.lastName}`, 'white');
        log(`   Clerk ID: ${analysis.supabaseData.clerkId}`, 'white');
        log(`   Status de Aprovação: ${analysis.supabaseData.approvalStatus}`, 
            analysis.supabaseData.approvalStatus === 'APPROVED' ? 'green' : 
            analysis.supabaseData.approvalStatus === 'REJECTED' ? 'red' : 'yellow');
        log(`   Aprovado em: ${analysis.supabaseData.approvedAt || 'N/A'}`, 'white');
        log(`   Aprovado por: ${analysis.supabaseData.approvedBy || 'N/A'}`, 'white');
        log(`   Saldo de créditos: ${analysis.supabaseData.creditBalance}`, 'white');
        log(`   Clientes: ${analysis.supabaseData.clientsCount}`, 'white');
        log(`   Notas: ${analysis.supabaseData.notesCount}`, 'white');
        log(`   Planejamentos: ${analysis.supabaseData.planningsCount}`, 'white');

        // Logs de moderação
        if (analysis.supabaseData.moderationLogs.length > 0) {
          log(`\n📋 LOGS DE MODERAÇÃO (últimos 5):`, 'cyan');
          analysis.supabaseData.moderationLogs.forEach((logEntry, index) => {
            log(`   ${index + 1}. ${logEntry.action} - ${logEntry.reason || 'Sem motivo'} (${new Date(logEntry.createdAt).toLocaleString()})`, 'white');
          });
        }

        // Verificar inconsistências
        if (analysis.clerkData && analysis.supabaseData.clerkId !== clerkId) {
          analysis.issues.push(`Inconsistência: Clerk ID no Supabase (${analysis.supabaseData.clerkId}) diferente do fornecido (${clerkId})`);
        }

        if (analysis.clerkData && analysis.approvalStatus !== analysis.supabaseData.approvalStatus) {
          analysis.issues.push(`Inconsistência: Status no Clerk (${analysis.approvalStatus}) diferente do Supabase (${analysis.supabaseData.approvalStatus})`);
        }

      } else {
        analysis.issues.push('Usuário não encontrado no Supabase');
        log(`❌ Usuário não encontrado no Supabase`, 'red');
      }

    } catch (error) {
      analysis.issues.push(`Erro ao buscar usuário no Supabase: ${error.message}`);
      log(`❌ Erro ao buscar no Supabase: ${error.message}`, 'red');
    } finally {
      await prisma.$disconnect();
    }

    // 3. Determinar comportamento esperado
    log('\n📋 3. ANÁLISE DE COMPORTAMENTO ESPERADO', 'yellow');
    
    // Se não conseguiu dados do Clerk, usar dados do Supabase
    const currentStatus = analysis.approvalStatus || analysis.supabaseData?.approvalStatus;
    
    switch (currentStatus) {
      case 'PENDING':
        analysis.expectedBehavior = {
          access: 'BLOCKED',
          redirect: '/pending-approval',
          message: 'Usuário deve ser redirecionado para página de aprovação pendente',
          adminActions: ['Aprovar usuário', 'Rejeitar usuário'],
          middlewareBehavior: 'Middleware deve interceptar e redirecionar'
        };
        break;
        
      case 'APPROVED':
        analysis.expectedBehavior = {
          access: 'ALLOWED',
          redirect: 'NONE',
          message: 'Usuário tem acesso completo à aplicação',
          adminActions: ['Suspender usuário', 'Modificar role'],
          middlewareBehavior: 'Middleware permite acesso livre'
        };
        break;
        
      case 'REJECTED':
        analysis.expectedBehavior = {
          access: 'BLOCKED',
          redirect: '/account-rejected',
          message: 'Usuário deve ser redirecionado para página de conta rejeitada',
          adminActions: ['Revisar rejeição', 'Aprovar usuário'],
          middlewareBehavior: 'Middleware deve interceptar e redirecionar'
        };
        break;
        
      case 'SUSPENDED':
        analysis.expectedBehavior = {
          access: 'BLOCKED',
          redirect: '/account-suspended',
          message: 'Usuário deve ser bloqueado (conta suspensa)',
          adminActions: ['Remover suspensão', 'Revisar caso'],
          middlewareBehavior: 'Middleware deve interceptar e bloquear'
        };
        break;
        
      default:
        analysis.expectedBehavior = {
          access: 'BLOCKED',
          redirect: '/pending-approval',
          message: 'Status desconhecido - tratar como PENDING por segurança',
          adminActions: ['Definir status correto'],
          middlewareBehavior: 'Middleware deve tratar como PENDING'
        };
        analysis.issues.push(`Status de aprovação desconhecido: ${currentStatus}`);
    }

    log(`🎯 Status Atual: ${currentStatus}`, currentStatus === 'APPROVED' ? 'green' : currentStatus === 'REJECTED' ? 'red' : 'yellow');
    log(`🚪 Acesso: ${analysis.expectedBehavior.access}`, analysis.expectedBehavior.access === 'ALLOWED' ? 'green' : 'red');
    log(`🔀 Redirecionamento: ${analysis.expectedBehavior.redirect}`, 'cyan');
    log(`💬 Comportamento: ${analysis.expectedBehavior.message}`, 'white');
    log(`🛠️  Middleware: ${analysis.expectedBehavior.middlewareBehavior}`, 'blue');

    if (analysis.expectedBehavior.adminActions.length > 0) {
      log(`\n🔧 AÇÕES ADMINISTRATIVAS DISPONÍVEIS:`, 'magenta');
      analysis.expectedBehavior.adminActions.forEach((action, index) => {
        log(`   ${index + 1}. ${action}`, 'white');
      });
    }

    // 4. Recomendações
    log('\n📋 4. RECOMENDAÇÕES', 'yellow');
    
    if (analysis.issues.length > 0) {
      log(`⚠️  PROBLEMAS ENCONTRADOS:`, 'red');
      analysis.issues.forEach((issue, index) => {
        log(`   ${index + 1}. ${issue}`, 'red');
      });
    }

    // Gerar recomendações baseadas na análise
    if (!analysis.clerkData) {
      analysis.recommendations.push('Verificar se o Clerk ID está correto ou se o usuário foi deletado do Clerk');
    }

    if (!analysis.supabaseData) {
      analysis.recommendations.push('Verificar se o usuário foi criado no Supabase via webhook do Clerk');
    }

    if (analysis.clerkData && analysis.supabaseData) {
      if (analysis.approvalStatus !== analysis.supabaseData.approvalStatus) {
        analysis.recommendations.push('Sincronizar status entre Clerk e Supabase - usar Clerk como fonte de verdade');
      }

      if (analysis.approvalStatus === 'PENDING' && analysis.supabaseData.moderationLogs.length === 0) {
        analysis.recommendations.push('Usuário aguardando primeira avaliação administrativa');
      }

      if (analysis.approvalStatus === 'APPROVED' && !analysis.supabaseData.approvedAt) {
        analysis.recommendations.push('Atualizar dados de aprovação no Supabase');
      }
    }

    if (analysis.recommendations.length > 0) {
      log(`💡 RECOMENDAÇÕES:`, 'green');
      analysis.recommendations.forEach((rec, index) => {
        log(`   ${index + 1}. ${rec}`, 'green');
      });
    } else {
      log(`✅ Nenhum problema encontrado - usuário em estado consistente`, 'green');
    }

    // 5. Resumo final
    log('\n📊 RESUMO FINAL', 'cyan');
    log('='.repeat(70), 'cyan');
    log(`👤 Usuário: ${analysis.clerkData?.email || 'N/A'}`, 'white');
    log(`📋 Status: ${currentStatus}`, currentStatus === 'APPROVED' ? 'green' : currentStatus === 'REJECTED' ? 'red' : 'yellow');
    log(`🚪 Acesso: ${analysis.expectedBehavior.access}`, analysis.expectedBehavior.access === 'ALLOWED' ? 'green' : 'red');
    log(`🔀 Redirecionamento: ${analysis.expectedBehavior.redirect || 'Nenhum'}`, 'cyan');
    log(`⚠️  Problemas: ${analysis.issues.length}`, analysis.issues.length > 0 ? 'red' : 'green');
    log(`💡 Recomendações: ${analysis.recommendations.length}`, analysis.recommendations.length > 0 ? 'yellow' : 'green');

    return analysis;

  } catch (error) {
    log(`❌ Erro fatal na análise: ${error.message}`, 'red');
    throw error;
  }
}

// Executar análise se chamado diretamente
if (require.main === module) {
  const args = process.argv.slice(2);
  
  if (args.length < 2) {
    console.log('Uso: node analyze-user.js <clerkId> <supabaseUserId>');
    console.log('Exemplo: node analyze-user.js user_2yHwYWeOuZ6AESqKkDyQi47XusG cmbpm0pyj000009o9gxczrouq');
    process.exit(1);
  }

  const [clerkId, supabaseUserId] = args;
  
  analyzeUser(clerkId, supabaseUserId)
    .then(analysis => {
      console.log('\n✅ Análise concluída com sucesso!');
    })
    .catch(error => {
      console.error(`❌ Erro fatal: ${error.message}`);
      process.exit(1);
    });
}

module.exports = { analyzeUser }; 