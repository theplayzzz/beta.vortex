#!/usr/bin/env node

/**
 * 🔍 Script de Verificação da Saúde do Sistema de Sincronização
 * 
 * Este script verifica se há problemas de sincronização e detecta
 * possíveis usuários dessincronizados ou problemas no sistema.
 * 
 * Uso:
 * node scripts/verify-sync-health.js
 * node scripts/verify-sync-health.js --detailed
 * 
 * Cron exemplo (a cada hora):
 * 0 * * * * cd /path/to/app && node scripts/verify-sync-health.js
 */

require('dotenv').config({ path: '.env.local' });
const { PrismaClient } = require('@prisma/client');
const { clerkClient } = require('@clerk/nextjs/server');

const prisma = new PrismaClient();

async function verifysyncHealth() {
  console.log('🔍 ===== VERIFICAÇÃO DE SAÚDE - SISTEMA DE SINCRONIZAÇÃO =====');
  console.log(`📅 Data: ${new Date().toLocaleString('pt-BR')}`);
  console.log('');

  const results = {
    totalUsers: 0,
    syncedUsers: 0,
    desyncedUsers: 0,
    orphanUsers: 0,
    recentSyncs: 0,
    potentialIssues: [],
    recommendations: []
  };

  try {
    // 1. Verificar usuários no banco de dados
    console.log('💾 1. Analisando usuários no banco de dados...');
    const dbUsers = await prisma.user.findMany({
      select: {
        id: true,
        email: true,
        clerkId: true,
        approvalStatus: true,
        createdAt: true,
        updatedAt: true,
        _count: {
          select: {
            Client: true,
            StrategicPlanning: true,
            CommercialProposal: true
          }
        }
      }
    });
    
    results.totalUsers = dbUsers.length;
    console.log(`   📊 Total de usuários no banco: ${results.totalUsers}`);

    // 2. Verificar sincronizações recentes
    console.log('\n⏰ 2. Verificando atividade recente...');
    const recentSyncs = await prisma.user.count({
      where: {
        updatedAt: {
          gte: new Date(Date.now() - 60 * 60 * 1000) // Última hora
        }
      }
    });
    
    results.recentSyncs = recentSyncs;
    console.log(`   🔄 Sincronizações na última hora: ${recentSyncs}`);
    
    if (recentSyncs > 10) {
      results.potentialIssues.push(`⚠️ Muitas sincronizações recentes (${recentSyncs}) - possível atividade em massa`);
    }

    // 3. Verificar usuários com dados históricos
    console.log('\n📊 3. Analisando usuários com dados históricos...');
    const usersWithData = dbUsers.filter(user => 
      user._count.Client > 0 || 
      user._count.StrategicPlanning > 0 || 
      user._count.CommercialProposal > 0
    );
    
    console.log(`   💾 Usuários com dados históricos: ${usersWithData.length}`);
    
    // 4. Verificar possíveis usuários órfãos (sem clerkId válido)
    console.log('\n🔍 4. Verificando usuários órfãos...');
    const orphanUsers = dbUsers.filter(user => !user.clerkId || user.clerkId.length < 10);
    results.orphanUsers = orphanUsers.length;
    
    console.log(`   👻 Usuários órfãos (sem clerkId válido): ${results.orphanUsers}`);
    
    if (results.orphanUsers > 0) {
      results.potentialIssues.push(`⚠️ ${results.orphanUsers} usuários órfãos encontrados`);
      console.log('   📋 Usuários órfãos:');
      orphanUsers.slice(0, 5).forEach(user => {
        console.log(`      - ${user.email} (ID: ${user.id}, ClerkId: ${user.clerkId || 'N/A'})`);
      });
      if (orphanUsers.length > 5) {
        console.log(`      ... e mais ${orphanUsers.length - 5} usuários`);
      }
    }

    // 5. Verificar usuários com dados mas possivelmente dessincronizados
    console.log('\n🎯 5. Verificando possíveis dessincronizações...');
    const potentialDesync = usersWithData.filter(user => {
      // Usuários com dados históricos mas clerkId suspeito
      return !user.clerkId || 
             user.clerkId.length < 10 || 
             user.updatedAt < new Date(Date.now() - 7 * 24 * 60 * 60 * 1000); // Não atualizado há 7 dias
    });
    
    results.desyncedUsers = potentialDesync.length;
    console.log(`   ⚠️ Possíveis usuários dessincronizados: ${results.desyncedUsers}`);
    
    if (results.desyncedUsers > 0) {
      results.potentialIssues.push(`🚨 ${results.desyncedUsers} usuários com dados históricos possivelmente dessincronizados`);
      console.log('   📋 Usuários possivelmente dessincronizados:');
      potentialDesync.slice(0, 3).forEach(user => {
        console.log(`      - ${user.email}`);
        console.log(`        📊 Dados: ${user._count.Client} clientes, ${user._count.StrategicPlanning} planejamentos`);
        console.log(`        🆔 ClerkId: ${user.clerkId || 'N/A'}`);
        console.log(`        📅 Última atualização: ${user.updatedAt.toLocaleString('pt-BR')}`);
      });
      if (potentialDesync.length > 3) {
        console.log(`      ... e mais ${potentialDesync.length - 3} usuários`);
      }
    }

    // 6. Verificar distribuição de status
    console.log('\n📈 6. Distribuição de status de aprovação...');
    const statusDistribution = {};
    dbUsers.forEach(user => {
      statusDistribution[user.approvalStatus] = (statusDistribution[user.approvalStatus] || 0) + 1;
    });
    
    Object.entries(statusDistribution).forEach(([status, count]) => {
      console.log(`   ${status}: ${count} usuários`);
    });

    // 7. Verificar usuários criados recentemente
    console.log('\n🆕 7. Usuários criados nas últimas 24 horas...');
    const recentUsers = await prisma.user.count({
      where: {
        createdAt: {
          gte: new Date(Date.now() - 24 * 60 * 60 * 1000)
        }
      }
    });
    
    console.log(`   👥 Novos usuários (24h): ${recentUsers}`);
    
    if (recentUsers > 20) {
      results.potentialIssues.push(`⚠️ Muitos usuários novos (${recentUsers}) - verificar se não são convites em massa`);
    }

    // 8. Gerar recomendações
    console.log('\n💡 8. Gerando recomendações...');
    
    if (results.orphanUsers > 0) {
      results.recommendations.push('🔧 Executar sincronização segura para usuários órfãos');
    }
    
    if (results.desyncedUsers > 0) {
      results.recommendations.push('🔄 Verificar manualmente usuários dessincronizados com dados históricos');
    }
    
    if (results.recentSyncs > 15) {
      results.recommendations.push('⏸️ Aguardar antes de executar novas sincronizações');
    }
    
    if (results.potentialIssues.length === 0) {
      results.recommendations.push('✅ Sistema funcionando normalmente');
    }

    // 9. Resumo final
    console.log('\n🏆 ===== RESUMO DA VERIFICAÇÃO =====');
    console.log(`📊 Total de usuários: ${results.totalUsers}`);
    console.log(`✅ Usuários sincronizados: ${results.totalUsers - results.orphanUsers - results.desyncedUsers}`);
    console.log(`⚠️ Usuários órfãos: ${results.orphanUsers}`);
    console.log(`🚨 Possíveis dessincronizados: ${results.desyncedUsers}`);
    console.log(`🔄 Sincronizações recentes: ${results.recentSyncs}`);
    
    // 10. Problemas encontrados
    if (results.potentialIssues.length > 0) {
      console.log('\n🚨 PROBLEMAS IDENTIFICADOS:');
      results.potentialIssues.forEach((issue, index) => {
        console.log(`   ${index + 1}. ${issue}`);
      });
    }
    
    // 11. Recomendações
    console.log('\n💡 RECOMENDAÇÕES:');
    results.recommendations.forEach((rec, index) => {
      console.log(`   ${index + 1}. ${rec}`);
    });
    
    // 12. Comandos sugeridos
    if (results.orphanUsers > 0 || results.desyncedUsers > 0) {
      console.log('\n🔧 COMANDOS SUGERIDOS:');
      console.log('   # Verificar em modo simulação:');
      console.log('   node scripts/sync-invited-users.js --dry-run --admin=seu@email.com --max=10');
      console.log('');
      console.log('   # Sincronizar poucos usuários:');
      console.log('   node scripts/sync-invited-users.js --admin=seu@email.com --max=5');
    }

    return results;

  } catch (error) {
    console.error('❌ Erro na verificação:', error.message);
    throw error;
  } finally {
    await prisma.$disconnect();
  }
}

// Executar verificação
if (require.main === module) {
  const isDetailed = process.argv.includes('--detailed');
  
  verifysyncHealth()
    .then((results) => {
      console.log('\n✅ Verificação concluída!');
      
      // Status geral
      const healthScore = Math.max(0, 100 - (results.orphanUsers * 5) - (results.desyncedUsers * 10) - (results.potentialIssues.length * 15));
      console.log(`🏥 Saúde do sistema: ${healthScore}%`);
      
      if (healthScore >= 90) {
        console.log('🟢 Sistema saudável');
      } else if (healthScore >= 70) {
        console.log('🟡 Sistema com problemas menores');
      } else {
        console.log('🔴 Sistema com problemas sérios - ação necessária');
      }
      
      process.exit(results.potentialIssues.length > 0 ? 1 : 0);
    })
    .catch((error) => {
      console.error('\n❌ Falha na verificação:', error.message);
      process.exit(1);
    });
}

module.exports = { verifysyncHealth }; 