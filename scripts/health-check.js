#!/usr/bin/env node

/**
 * 🏥 Script de Verificação de Saúde das Propostas
 * 
 * Este script pode ser executado periodicamente via cron job para 
 * monitorar problemas na geração de propostas.
 * 
 * Uso:
 * node scripts/health-check.js
 * 
 * Cron exemplo (a cada 30 minutos):
 * */30 * * * * cd /path/to/app && node scripts/health-check.js
 */

const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

async function getProposalErrorStats(userId, hoursBack = 24) {
  const since = new Date(Date.now() - hoursBack * 60 * 60 * 1000);

  const allProposals = await prisma.commercialProposal.findMany({
    where: {
      userId: userId,
      updatedAt: {
        gte: since
      }
    },
    select: {
      id: true,
      generatedContent: true,
      updatedAt: true
    }
  });

  let totalErrors = 0;
  let timeoutErrors = 0;
  let networkErrors = 0;
  let otherErrors = 0;
  let recentErrors = 0;

  const oneHourAgo = new Date(Date.now() - 60 * 60 * 1000);

  for (const proposal of allProposals) {
    try {
      const generatedContent = JSON.parse(proposal.generatedContent || '{}');
      
      if (generatedContent.status === 'error') {
        totalErrors++;
        
        switch (generatedContent.errorType) {
          case 'timeout':
            timeoutErrors++;
            break;
          case 'network':
            networkErrors++;
            break;
          default:
            otherErrors++;
        }

        if (proposal.updatedAt > oneHourAgo) {
          recentErrors++;
        }
      }
    } catch (e) {
      // Ignorar erros de parsing
    }
  }

  const errorRate = allProposals.length > 0 ? (totalErrors / allProposals.length) * 100 : 0;

  return {
    totalProposals: allProposals.length,
    totalErrors,
    timeoutErrors,
    networkErrors,
    otherErrors,
    errorRate,
    recentErrors
  };
}

function shouldSendAlert(stats) {
  return (
    stats.errorRate > 50 ||
    stats.recentErrors > 3 ||
    stats.timeoutErrors > 10
  );
}

function generateErrorReport(stats, userEmail) {
  const report = [
    '🚨 ALERTA: Problemas detectados na geração de propostas',
    `👤 Usuário: ${userEmail}`,
    '',
    '📊 Estatísticas (últimas 24h):',
    `• Total de propostas: ${stats.totalProposals}`,
    `• Total de erros: ${stats.totalErrors}`,
    `• Taxa de erro: ${stats.errorRate.toFixed(1)}%`,
    `• Erros recentes (1h): ${stats.recentErrors}`,
    '',
    '🔍 Detalhamento por tipo:',
    `• Timeout: ${stats.timeoutErrors} (${stats.totalErrors > 0 ? ((stats.timeoutErrors / stats.totalErrors) * 100).toFixed(1) : 0}%)`,
    `• Rede: ${stats.networkErrors} (${stats.totalErrors > 0 ? ((stats.networkErrors / stats.totalErrors) * 100).toFixed(1) : 0}%)`,
    `• Outros: ${stats.otherErrors} (${stats.totalErrors > 0 ? ((stats.otherErrors / stats.totalErrors) * 100).toFixed(1) : 0}%)`,
    '',
    '💡 Ações recomendadas:',
    stats.timeoutErrors > stats.networkErrors ? 
      '• Verificar performance do serviço de IA externo' :
      '• Verificar conectividade de rede',
    '• Monitorar logs de aplicação',
    '• Considerar aumentar timeout se necessário',
    '',
    `🕐 Timestamp: ${new Date().toISOString()}`
  ].join('\n');

  return report;
}

async function runHealthCheck() {
  try {
    console.log('🏥 [Health Check] Iniciando verificação...');
    
    // Buscar usuários ativos (que criaram propostas nas últimas 48h)
    const activeUsers = await prisma.user.findMany({
      where: {
        commercialProposals: {
          some: {
            updatedAt: {
              gte: new Date(Date.now() - 48 * 60 * 60 * 1000)
            }
          }
        }
      },
      select: {
        id: true,
        email: true,
        firstName: true,
        lastName: true
      }
    });

    console.log(`👥 Verificando ${activeUsers.length} usuários ativos...`);

    const alerts = [];
    let totalStats = {
      totalUsers: activeUsers.length,
      totalProposals: 0,
      totalErrors: 0,
      usersWithErrors: 0
    };

    for (const user of activeUsers) {
      const stats = await getProposalErrorStats(user.id);
      
      totalStats.totalProposals += stats.totalProposals;
      totalStats.totalErrors += stats.totalErrors;
      
      if (stats.totalErrors > 0) {
        totalStats.usersWithErrors++;
      }
      
      if (shouldSendAlert(stats)) {
        const userName = `${user.firstName || ''} ${user.lastName || ''}`.trim() || 'Usuário sem nome';
        const report = generateErrorReport(stats, `${userName} (${user.email})`);
        
        alerts.push({
          userId: user.id,
          userName,
          userEmail: user.email,
          stats,
          report
        });
      }
    }

    // Relatório geral
    console.log('📊 RESUMO GERAL:');
    console.log(`• Usuários verificados: ${totalStats.totalUsers}`);
    console.log(`• Total de propostas: ${totalStats.totalProposals}`);
    console.log(`• Total de erros: ${totalStats.totalErrors}`);
    console.log(`• Usuários com erros: ${totalStats.usersWithErrors}`);
    console.log(`• Taxa geral de erro: ${totalStats.totalProposals > 0 ? ((totalStats.totalErrors / totalStats.totalProposals) * 100).toFixed(1) : 0}%`);

    if (alerts.length > 0) {
      console.log('');
      console.warn('🚨 ALERTAS DETECTADOS:', alerts.length);
      console.log('');
      
      alerts.forEach((alert, index) => {
        console.warn(`📧 ALERTA ${index + 1}/${alerts.length}:`);
        console.warn('━'.repeat(60));
        console.warn(alert.report);
        console.warn('━'.repeat(60));
        console.log('');
      });

      // Aqui você pode implementar notificações:
      // - Enviar email
      // - Slack/Discord webhook  
      // - SMS
      // - Integração com PagerDuty, etc.
      
    } else {
      console.log('✅ Nenhum problema crítico detectado');
    }

    return {
      success: true,
      alertsCount: alerts.length,
      totalStats,
      alerts
    };

  } catch (error) {
    console.error('❌ Erro na verificação de saúde:', error);
    return {
      success: false,
      error: error.message
    };
  } finally {
    await prisma.$disconnect();
  }
}

// Executar se chamado diretamente
if (require.main === module) {
  runHealthCheck()
    .then(result => {
      if (result.success) {
        console.log(`\n✅ Verificação concluída. ${result.alertsCount} alertas detectados.`);
        process.exit(result.alertsCount > 0 ? 1 : 0); // Exit code 1 se há alertas
      } else {
        console.error('\n❌ Verificação falhou:', result.error);
        process.exit(2);
      }
    })
    .catch(error => {
      console.error('💥 Erro fatal:', error);
      process.exit(3);
    });
}

module.exports = { runHealthCheck }; 