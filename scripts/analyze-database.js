#!/usr/bin/env node

/**
 * Análise Pré-Migração - Fase 4: Otimização de Índices
 * Script alternativo usando Prisma Client para análise do banco
 */

const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

async function analyzeDatabase() {
  console.log('=== ANÁLISE PRÉ-MIGRAÇÃO - FASE 4 ===');
  console.log('Data:', new Date().toISOString());
  console.log('');

  try {
    // 1. Análise da tabela Client
    console.log('=== ANÁLISE DA TABELA CLIENT ===');
    
    const totalClients = await prisma.client.count();
    const activeClients = await prisma.client.count({
      where: { deletedAt: null }
    });
    const deletedClients = await prisma.client.count({
      where: { deletedAt: { not: null } }
    });

    console.log(`Total de Clientes: ${totalClients}`);
    console.log(`Clientes Ativos: ${activeClients}`);
    console.log(`Clientes Arquivados: ${deletedClients}`);
    console.log('');

    // 2. Distribuição por usuário (top 10)
    console.log('=== DISTRIBUIÇÃO POR USUÁRIO (TOP 10) ===');
    const userDistribution = await prisma.client.groupBy({
      by: ['userId'],
      _count: {
        id: true
      },
      orderBy: {
        _count: {
          id: 'desc'
        }
      },
      take: 10
    });

    userDistribution.forEach((user, index) => {
      console.log(`${index + 1}. UserId: ${user.userId} - Clientes: ${user._count.id}`);
    });
    console.log('');

    // 3. Análise de performance estimada
    console.log('=== ESTIMATIVAS DE PERFORMANCE ===');
    
    let riskLevel, estimatedTime, recommendation;
    
    if (totalClients < 1000) {
      riskLevel = 'BAIXO RISCO';
      estimatedTime = '1-2 minutos';
      recommendation = 'Pode executar a qualquer momento';
    } else if (totalClients < 10000) {
      riskLevel = 'MÉDIO RISCO';
      estimatedTime = '5-10 minutos';
      recommendation = 'Executar em horário de baixo tráfego';
    } else if (totalClients < 100000) {
      riskLevel = 'ALTO RISCO';
      estimatedTime = '15-30 minutos';
      recommendation = 'Executar apenas em janela de manutenção';
    } else {
      riskLevel = 'MUITO ALTO RISCO';
      estimatedTime = '30+ minutos';
      recommendation = 'Planejar cuidadosamente';
    }

    console.log(`📊 RESUMO DA ANÁLISE:`);
    console.log(`   • Total de registros: ${totalClients}`);
    console.log(`   • Tempo estimado: ${estimatedTime}`);
    console.log(`   • Nível de risco: ${riskLevel}`);
    console.log(`   • Recomendação: ${recommendation}`);
    console.log('');

    // 4. Verificar índices existentes (simulado)
    console.log('=== ÍNDICES A SEREM CRIADOS ===');
    console.log('1. Client_userId_deletedAt_createdAt_idx - Para listagem principal');
    console.log('2. Client_userId_name_idx - Para busca por nome');
    console.log('3. Client_userId_industry_richnessScore_idx - Para filtros avançados');
    console.log('');

    // 5. Recomendações finais
    console.log('=== RECOMENDAÇÕES ===');
    if (totalClients > 10000) {
      console.log('⚠️  ATENÇÃO: Tabela com muitos registros detectada!');
      console.log('   • Fazer backup completo antes da migração');
      console.log('   • Executar apenas em horário de manutenção');
      console.log('   • Monitorar espaço em disco durante execução');
    } else {
      console.log('✅ Tabela de tamanho moderado, migração pode prosseguir');
    }
    console.log('');

    console.log('=== ANÁLISE CONCLUÍDA ===');
    console.log('Próximo passo: Revisar os resultados e decidir sobre a execução da migração');
    
    return {
      totalClients,
      activeClients,
      deletedClients,
      riskLevel,
      estimatedTime,
      recommendation,
      canProceed: true
    };

  } catch (error) {
    console.error('❌ Erro durante análise:', error.message);
    return {
      error: error.message,
      canProceed: false
    };
  } finally {
    await prisma.$disconnect();
  }
}

// Executar análise se chamado diretamente
if (require.main === module) {
  analyzeDatabase()
    .then((result) => {
      if (result.canProceed) {
        console.log('\n✅ Análise concluída com sucesso!');
        process.exit(0);
      } else {
        console.log('\n❌ Análise falhou!');
        process.exit(1);
      }
    })
    .catch((error) => {
      console.error('❌ Erro fatal:', error);
      process.exit(1);
    });
}

module.exports = { analyzeDatabase }; 