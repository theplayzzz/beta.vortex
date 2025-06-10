#!/usr/bin/env node

/**
 * 🔍 Monitor de APIs Externas - Phase 7 Complement
 * 
 * Este script monitora:
 * 1. Saúde das APIs externas
 * 2. Performance e latência
 * 3. Rate de sucesso/erro
 * 4. Uso de API keys
 */

const { PrismaClient } = require('@prisma/client');

// Configurações
const BASE_URL = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3003';
const MONITOR_INTERVAL = 30000; // 30 segundos
const TEST_USER_EMAIL = 'play-felix@hotmail.com';

// Cores para logs
const colors = {
  reset: '\x1b[0m',
  red: '\x1b[31m',
  green: '\x1b[32m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  cyan: '\x1b[36m'
};

function log(message, color = 'white') {
  const timestamp = new Date().toISOString();
  console.log(`${colors[color]}[${timestamp}] ${message}${colors.reset}`);
}

// Métricas globais
const metrics = {
  totalRequests: 0,
  successfulRequests: 0,
  failedRequests: 0,
  averageResponseTime: 0,
  responseTimes: [],
  lastCheck: null,
  uptime: 0,
  startTime: Date.now()
};

// ==========================================
// MONITORAMENTO DE SAÚDE
// ==========================================

async function checkApiHealth() {
  if (!process.env.EXTERNAL_API_KEY) {
    log('⚠️  API key não configurada - pulando monitoramento', 'yellow');
    return false;
  }

  const headers = {
    'X-API-Key': process.env.EXTERNAL_API_KEY
  };

  try {
    // Teste de listagem (operação leve)
    const startTime = Date.now();
    const response = await fetch(`${BASE_URL}/api/external/clients?userEmail=${TEST_USER_EMAIL}&limit=1`, {
      method: 'GET',
      headers,
      timeout: 5000 // 5 segundos timeout
    });

    const responseTime = Date.now() - startTime;
    metrics.totalRequests++;
    metrics.responseTimes.push(responseTime);

    // Manter apenas os últimos 100 tempos de resposta
    if (metrics.responseTimes.length > 100) {
      metrics.responseTimes.shift();
    }

    // Calcular média
    metrics.averageResponseTime = Math.round(
      metrics.responseTimes.reduce((sum, time) => sum + time, 0) / metrics.responseTimes.length
    );

    if (response.ok) {
      metrics.successfulRequests++;
      metrics.lastCheck = new Date();
      
      log(`✅ API Externa OK - ${responseTime}ms - Success Rate: ${((metrics.successfulRequests / metrics.totalRequests) * 100).toFixed(1)}%`, 'green');
      return true;
    } else {
      metrics.failedRequests++;
      log(`❌ API Externa ERRO - Status: ${response.status} - ${responseTime}ms`, 'red');
      return false;
    }

  } catch (error) {
    metrics.failedRequests++;
    metrics.totalRequests++;
    log(`❌ API Externa FALHA - ${error.message}`, 'red');
    return false;
  }
}

// ==========================================
// MONITORAMENTO DE PERFORMANCE
// ==========================================

async function checkDatabasePerformance() {
  const prisma = new PrismaClient();
  
  try {
    const startTime = Date.now();
    
    // Query simples para testar performance
    const result = await prisma.$queryRaw`SELECT COUNT(*) as count FROM "User"`;
    
    const queryTime = Date.now() - startTime;
    
    if (queryTime < 1000) {
      log(`✅ Database OK - ${queryTime}ms`, 'green');
    } else if (queryTime < 3000) {
      log(`⚠️  Database LENTO - ${queryTime}ms`, 'yellow');
    } else {
      log(`❌ Database MUITO LENTO - ${queryTime}ms`, 'red');
    }
    
    return queryTime;
    
  } catch (error) {
    log(`❌ Database ERRO - ${error.message}`, 'red');
    return -1;
  } finally {
    await prisma.$disconnect();
  }
}

// ==========================================
// RELATÓRIO DE STATUS
// ==========================================

function generateStatusReport() {
  const uptime = Math.round((Date.now() - metrics.startTime) / 1000);
  const successRate = metrics.totalRequests > 0 ? 
    ((metrics.successfulRequests / metrics.totalRequests) * 100).toFixed(1) : '0';

  log('\n📊 RELATÓRIO DE STATUS - APIs Externas', 'cyan');
  log('='.repeat(50), 'cyan');
  log(`🕐 Uptime: ${uptime}s`);
  log(`📈 Total Requests: ${metrics.totalRequests}`);
  log(`✅ Successful: ${metrics.successfulRequests}`);
  log(`❌ Failed: ${metrics.failedRequests}`);
  log(`📊 Success Rate: ${successRate}%`);
  log(`⏱️  Avg Response Time: ${metrics.averageResponseTime}ms`);
  log(`🔄 Last Check: ${metrics.lastCheck ? metrics.lastCheck.toLocaleString() : 'Never'}`);
  
  // Status geral
  if (parseFloat(successRate) >= 95) {
    log('🟢 Status: EXCELENTE', 'green');
  } else if (parseFloat(successRate) >= 80) {
    log('🟡 Status: BOM', 'yellow');
  } else {
    log('🔴 Status: CRÍTICO', 'red');
  }
  
  log('='.repeat(50), 'cyan');
}

// ==========================================
// ALERTAS
// ==========================================

function checkAlerts() {
  const successRate = metrics.totalRequests > 0 ? 
    (metrics.successfulRequests / metrics.totalRequests) * 100 : 100;

  // Alerta de taxa de sucesso baixa
  if (successRate < 80 && metrics.totalRequests >= 5) {
    log(`🚨 ALERTA: Taxa de sucesso baixa (${successRate.toFixed(1)}%)`, 'red');
  }

  // Alerta de tempo de resposta alto
  if (metrics.averageResponseTime > 3000) {
    log(`🚨 ALERTA: Tempo de resposta alto (${metrics.averageResponseTime}ms)`, 'red');
  }

  // Alerta de falhas consecutivas
  const recentResults = metrics.responseTimes.slice(-5);
  if (recentResults.length >= 5 && recentResults.every(time => time === -1)) {
    log('🚨 ALERTA: 5 falhas consecutivas detectadas!', 'red');
  }
}

// ==========================================
// TESTE DE CARGA SIMPLES
// ==========================================

async function performLoadTest() {
  if (!process.env.EXTERNAL_API_KEY) {
    log('⚠️  API key não configurada - pulando teste de carga', 'yellow');
    return;
  }

  log('🔄 Iniciando teste de carga (5 requisições simultâneas)...', 'blue');
  
  const headers = {
    'X-API-Key': process.env.EXTERNAL_API_KEY
  };

  const promises = [];
  const startTime = Date.now();

  for (let i = 0; i < 5; i++) {
    promises.push(
      fetch(`${BASE_URL}/api/external/clients?userEmail=${TEST_USER_EMAIL}&limit=1`, {
        method: 'GET',
        headers
      })
    );
  }

  try {
    const responses = await Promise.all(promises);
    const totalTime = Date.now() - startTime;
    const successCount = responses.filter(r => r.ok).length;

    log(`📊 Teste de Carga: ${successCount}/5 sucessos em ${totalTime}ms`, 
        successCount === 5 ? 'green' : 'yellow');

  } catch (error) {
    log(`❌ Teste de Carga FALHOU: ${error.message}`, 'red');
  }
}

// ==========================================
// FUNÇÃO PRINCIPAL
// ==========================================

async function monitorLoop() {
  log('🚀 Iniciando Monitor de APIs Externas', 'cyan');
  log(`📍 Base URL: ${BASE_URL}`, 'blue');
  log(`⏰ Intervalo: ${MONITOR_INTERVAL / 1000}s`, 'blue');
  
  // Teste inicial
  await checkApiHealth();
  await checkDatabasePerformance();
  
  // Loop de monitoramento
  setInterval(async () => {
    await checkApiHealth();
    
    // A cada 5 verificações, fazer teste de performance do banco
    if (metrics.totalRequests % 5 === 0) {
      await checkDatabasePerformance();
    }
    
    // A cada 10 verificações, fazer teste de carga
    if (metrics.totalRequests % 10 === 0) {
      await performLoadTest();
    }
    
    // Verificar alertas
    checkAlerts();
    
    // Relatório a cada 20 verificações
    if (metrics.totalRequests % 20 === 0) {
      generateStatusReport();
    }
    
  }, MONITOR_INTERVAL);

  // Relatório inicial após 1 minuto
  setTimeout(generateStatusReport, 60000);
}

// ==========================================
// MODO SINGLE CHECK
// ==========================================

async function singleCheck() {
  log('🔍 Verificação única de APIs Externas', 'cyan');
  
  const apiHealth = await checkApiHealth();
  const dbPerformance = await checkDatabasePerformance();
  
  log('\n📋 RESULTADO DA VERIFICAÇÃO:', 'cyan');
  log(`API Externa: ${apiHealth ? '✅ OK' : '❌ FALHA'}`);
  log(`Database: ${dbPerformance > 0 ? `✅ OK (${dbPerformance}ms)` : '❌ FALHA'}`);
  
  if (apiHealth && dbPerformance > 0) {
    log('🎉 Sistema funcionando corretamente!', 'green');
    return true;
  } else {
    log('⚠️  Problemas detectados no sistema', 'yellow');
    return false;
  }
}

// ==========================================
// CLI
// ==========================================

async function main() {
  const args = process.argv.slice(2);
  
  if (args.includes('--check') || args.includes('-c')) {
    // Verificação única
    const success = await singleCheck();
    process.exit(success ? 0 : 1);
  } else if (args.includes('--load-test') || args.includes('-l')) {
    // Apenas teste de carga
    await performLoadTest();
    process.exit(0);
  } else {
    // Monitoramento contínuo
    await monitorLoop();
  }
}

// Tratamento de sinais
process.on('SIGINT', () => {
  log('\n👋 Parando monitor...', 'yellow');
  generateStatusReport();
  process.exit(0);
});

process.on('SIGTERM', () => {
  log('\n👋 Parando monitor...', 'yellow');
  generateStatusReport();
  process.exit(0);
});

// Executar apenas se chamado diretamente
if (require.main === module) {
  main().catch(error => {
    log(`❌ Erro fatal: ${error.message}`, 'red');
    process.exit(1);
  });
}

module.exports = {
  checkApiHealth,
  checkDatabasePerformance,
  performLoadTest,
  generateStatusReport,
  singleCheck
}; 