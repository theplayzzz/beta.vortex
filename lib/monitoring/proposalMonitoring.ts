import { prisma } from '@/lib/prisma/client';

export interface ProposalErrorStats {
  totalErrors: number;
  timeoutErrors: number;
  networkErrors: number;
  otherErrors: number;
  errorRate: number;
  recentErrors: number;
}

/**
 * 📊 Calcular estatísticas de erro das propostas
 */
export async function getProposalErrorStats(userId: string, hoursBack: number = 24): Promise<ProposalErrorStats> {
  const since = new Date(Date.now() - hoursBack * 60 * 60 * 1000);

  // Buscar todas as propostas do usuário desde o período especificado
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

  // Analisar erros
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
        
        // Classificar tipo de erro
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

        // Contar erros recentes (última hora)
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
    totalErrors,
    timeoutErrors,
    networkErrors,
    otherErrors,
    errorRate,
    recentErrors
  };
}

/**
 * 🚨 Verificar se deve enviar alerta baseado nas estatísticas
 */
export function shouldSendAlert(stats: ProposalErrorStats): boolean {
  // Critérios para alerta:
  // 1. Taxa de erro > 50% nas últimas 24h
  // 2. Mais de 3 erros recentes (última hora)
  // 3. Mais de 10 erros de timeout (indica problema de infraestrutura)
  
  return (
    stats.errorRate > 50 ||
    stats.recentErrors > 3 ||
    stats.timeoutErrors > 10
  );
}

/**
 * 📧 Gerar relatório de erro para alerta
 */
export function generateErrorReport(stats: ProposalErrorStats): string {
  const report = [
    '🚨 ALERTA: Problemas detectados na geração de propostas',
    '',
    '📊 Estatísticas (últimas 24h):',
    `• Total de erros: ${stats.totalErrors}`,
    `• Taxa de erro: ${stats.errorRate.toFixed(1)}%`,
    `• Erros recentes (1h): ${stats.recentErrors}`,
    '',
    '🔍 Detalhamento por tipo:',
    `• Timeout: ${stats.timeoutErrors} (${((stats.timeoutErrors / stats.totalErrors) * 100).toFixed(1)}%)`,
    `• Rede: ${stats.networkErrors} (${((stats.networkErrors / stats.totalErrors) * 100).toFixed(1)}%)`,
    `• Outros: ${stats.otherErrors} (${((stats.otherErrors / stats.totalErrors) * 100).toFixed(1)}%)`,
    '',
    '💡 Ações recomendadas:',
    stats.timeoutErrors > stats.networkErrors ? 
      '• Verificar performance do serviço de IA externo' :
      '• Verificar conectividade de rede',
    '• Monitorar logs de aplicação',
    '• Considerar aumentar timeout se necessário',
    '',
    `Timestamp: ${new Date().toISOString()}`
  ].join('\n');

  return report;
}

/**
 * 📝 Log de monitoramento estruturado
 */
export function logProposalError(proposalId: string, error: any, context: any = {}) {
  const logEntry = {
    timestamp: new Date().toISOString(),
    proposalId,
    errorType: error.name || 'Unknown',
    errorMessage: error.message,
    errorStack: error.stack,
    context,
    severity: error.name === 'AbortError' ? 'warning' : 'error'
  };

  console.error('🚨 [ProposalMonitoring]', JSON.stringify(logEntry, null, 2));
  
  // Aqui você pode integrar com serviços de monitoramento externos:
  // - Sentry
  // - DataDog
  // - New Relic
  // - CloudWatch
}

/**
 * 🔄 Monitoramento contínuo (pode ser chamado via cron job)
 */
export async function runProposalHealthCheck(userId?: string) {
  try {
    console.log('🏥 [Monitoring] Iniciando verificação de saúde das propostas...');

    let usersToCheck = [];

    if (userId) {
      usersToCheck = [{ id: userId }];
    } else {
      // Buscar todos os usuários ativos (que criaram propostas nas últimas 48h)
      const activeUsers = await prisma.user.findMany({
        where: {
          CommercialProposal: {
            some: {
              updatedAt: {
                gte: new Date(Date.now() - 48 * 60 * 60 * 1000)
              }
            }
          }
        },
        select: {
          id: true,
          email: true
        }
      });
      usersToCheck = activeUsers;
    }

    const alerts = [];

    for (const user of usersToCheck) {
      const stats = await getProposalErrorStats(user.id);
      
      if (shouldSendAlert(stats)) {
        const report = generateErrorReport(stats);
        alerts.push({
          userId: user.id,
          userEmail: (user as any).email,
          report
        });
      }
    }

    if (alerts.length > 0) {
      console.warn('🚨 [Monitoring] Alertas detectados:', alerts.length);
      alerts.forEach((alert, index) => {
        console.warn(`📧 [Monitoring] Alerta ${index + 1}/${alerts.length}:`);
        console.warn(alert.report);
      });
    } else {
      console.log('✅ [Monitoring] Nenhum problema detectado');
    }

    return {
      success: true,
      alertsCount: alerts.length,
      alerts
    };

  } catch (error: any) {
    console.error('❌ [Monitoring] Erro na verificação de saúde:', error);
    return {
      success: false,
      error: error.message
    };
  }
} 