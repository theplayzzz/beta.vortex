#!/usr/bin/env node

/**
 * 🔍 PRODUCTION MONITORING SCRIPT
 * 
 * Este script monitora o sistema em produção baseado nos resultados da Phase 8:
 * - Health checks contínuos
 * - Monitoramento de APIs externas
 * - Alertas para problemas críticos
 * - Métricas de performance
 */

const fetch = require('node-fetch');
const fs = require('fs').promises;

// Configurações
const BASE_URL = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3003';
const MONITORING_INTERVAL = 60000; // 1 minuto
const LOG_FILE = 'monitoring.log';

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
  const coloredMessage = `${colors[color] || ''}${message}${colors.reset}`;
  console.log(`[${timestamp}] ${coloredMessage}`);
}

async function logToFile(data) {
  try {
    const timestamp = new Date().toISOString();
    const logEntry = `${timestamp}: ${JSON.stringify(data)}\n`;
    await fs.appendFile(LOG_FILE, logEntry);
  } catch (error) {
    log(`Erro ao salvar log: ${error.message}`, 'red');
  }
}

// Função para health check
async function healthCheck() {
  try {
    const start = Date.now();
    const response = await fetch(`${BASE_URL}/api/health`, {
      timeout: 10000
    });
    const responseTime = Date.now() - start;
    
    const result = {
      status: response.status === 200 ? 'OK' : 'ERROR',
      statusCode: response.status,
      responseTime,
      timestamp: new Date().toISOString()
    };
    
    if (response.status === 200) {
      log(`✅ Health Check OK - ${responseTime}ms`, 'green');
    } else {
      log(`❌ Health Check FAILED - Status ${response.status}`, 'red');
    }
    
    await logToFile({ type: 'health_check', ...result });
    return result;
  } catch (error) {
    const result = {
      status: 'ERROR',
      error: error.message,
      timestamp: new Date().toISOString()
    };
    
    log(`❌ Health Check ERROR: ${error.message}`, 'red');
    await logToFile({ type: 'health_check', ...result });
    return result;
  }
}

// Função para verificar APIs externas
async function checkExternalAPIs() {
  if (!process.env.EXTERNAL_API_KEY) {
    log('⚠️ API key externa não configurada', 'yellow');
    return { status: 'SKIPPED', reason: 'API key not configured' };
  }
  
  try {
    const start = Date.now();
    const response = await fetch(`${BASE_URL}/api/external/clients?userEmail=play-felix@hotmail.com&limit=1`, {
      headers: {
        'X-API-Key': process.env.EXTERNAL_API_KEY
      },
      timeout: 10000
    });
    const responseTime = Date.now() - start;
    
    const result = {
      status: response.status === 200 ? 'OK' : 'ERROR',
      statusCode: response.status,
      responseTime,
      timestamp: new Date().toISOString()
    };
    
    if (response.status === 200) {
      log(`✅ External APIs OK - ${responseTime}ms`, 'green');
    } else {
      log(`❌ External APIs FAILED - Status ${response.status}`, 'red');
    }
    
    await logToFile({ type: 'external_apis', ...result });
    return result;
  } catch (error) {
    const result = {
      status: 'ERROR',
      error: error.message,
      timestamp: new Date().toISOString()
    };
    
    log(`❌ External APIs ERROR: ${error.message}`, 'red');
    await logToFile({ type: 'external_apis', ...result });
    return result;
  }
}

// Função para verificar rotas protegidas
async function checkSecurityEndpoints() {
  try {
    const endpoints = [
      '/api/admin/users',
      '/api/admin/metrics',
      '/api/admin/moderation-log'
    ];
    
    let protectedCount = 0;
    
    for (const endpoint of endpoints) {
      try {
        const response = await fetch(`${BASE_URL}${endpoint}`, {
          timeout: 5000
        });
        
        if (response.status === 401 || response.status === 403) {
          protectedCount++;
        }
      } catch (error) {
        // Ignorar erros de conectividade
      }
    }
    
    const result = {
      status: protectedCount === endpoints.length ? 'OK' : 'WARNING',
      protectedEndpoints: protectedCount,
      totalEndpoints: endpoints.length,
      timestamp: new Date().toISOString()
    };
    
    if (protectedCount === endpoints.length) {
      log(`✅ Security OK - ${protectedCount}/${endpoints.length} endpoints protected`, 'green');
    } else {
      log(`⚠️ Security WARNING - Only ${protectedCount}/${endpoints.length} endpoints protected`, 'yellow');
    }
    
    await logToFile({ type: 'security_check', ...result });
    return result;
  } catch (error) {
    const result = {
      status: 'ERROR',
      error: error.message,
      timestamp: new Date().toISOString()
    };
    
    log(`❌ Security Check ERROR: ${error.message}`, 'red');
    await logToFile({ type: 'security_check', ...result });
    return result;
  }
}

// Função para verificar banco de dados
async function checkDatabase() {
  try {
    // Tentar conectar via health endpoint que usa banco
    const start = Date.now();
    const response = await fetch(`${BASE_URL}/api/health`, {
      timeout: 10000
    });
    const responseTime = Date.now() - start;
    
    const result = {
      status: response.status === 200 ? 'OK' : 'ERROR',
      responseTime,
      timestamp: new Date().toISOString()
    };
    
    if (response.status === 200) {
      log(`✅ Database OK - ${responseTime}ms`, 'green');
    } else {
      log(`❌ Database connection FAILED`, 'red');
    }
    
    await logToFile({ type: 'database_check', ...result });
    return result;
  } catch (error) {
    const result = {
      status: 'ERROR',
      error: error.message,
      timestamp: new Date().toISOString()
    };
    
    log(`❌ Database ERROR: ${error.message}`, 'red');
    await logToFile({ type: 'database_check', ...result });
    return result;
  }
}

// Função principal de monitoramento
async function runMonitoring() {
  log('🔍 Iniciando monitoramento de produção...', 'cyan');
  
  const results = {
    timestamp: new Date().toISOString(),
    checks: {}
  };
  
  // Executar todos os checks
  results.checks.health = await healthCheck();
  results.checks.externalAPIs = await checkExternalAPIs();
  results.checks.security = await checkSecurityEndpoints();
  results.checks.database = await checkDatabase();
  
  // Calcular status geral
  const statuses = Object.values(results.checks).map(check => check.status);
  const errorCount = statuses.filter(status => status === 'ERROR').length;
  const warningCount = statuses.filter(status => status === 'WARNING').length;
  
  if (errorCount > 0) {
    results.overallStatus = 'CRITICAL';
    log(`🚨 STATUS CRÍTICO: ${errorCount} erro(s) detectado(s)`, 'red');
  } else if (warningCount > 0) {
    results.overallStatus = 'WARNING';
    log(`⚠️ STATUS WARNING: ${warningCount} aviso(s)`, 'yellow');
  } else {
    results.overallStatus = 'OK';
    log(`✅ STATUS OK: Todos os sistemas funcionando`, 'green');
  }
  
  await logToFile({ type: 'monitoring_summary', ...results });
  
  return results;
}

// Função para executar monitoramento contínuo
async function startMonitoring() {
  log(`🚀 Iniciando monitoramento contínuo - Intervalo: ${MONITORING_INTERVAL/1000}s`, 'blue');
  log(`📍 Base URL: ${BASE_URL}`, 'blue');
  log(`📝 Log file: ${LOG_FILE}`, 'blue');
  
  // Executar primeira verificação
  await runMonitoring();
  
  // Configurar intervalo de monitoramento
  setInterval(async () => {
    log('---', 'blue');
    await runMonitoring();
  }, MONITORING_INTERVAL);
}

// Função para verificação única
async function singleCheck() {
  log('🔍 Executando verificação única...', 'cyan');
  const results = await runMonitoring();
  
  // Exibir resumo final
  log('\n📊 RESUMO FINAL:', 'cyan');
  log(`Status Geral: ${results.overallStatus}`, 
      results.overallStatus === 'OK' ? 'green' : 
      results.overallStatus === 'WARNING' ? 'yellow' : 'red');
  
  Object.entries(results.checks).forEach(([key, check]) => {
    const icon = check.status === 'OK' ? '✅' : 
                 check.status === 'WARNING' ? '⚠️' : '❌';
    log(`${icon} ${key}: ${check.status}`, 
        check.status === 'OK' ? 'green' : 
        check.status === 'WARNING' ? 'yellow' : 'red');
  });
  
  return results.overallStatus === 'OK';
}

// Executar baseado nos argumentos
const args = process.argv.slice(2);

if (args.includes('--continuous')) {
  startMonitoring().catch(error => {
    log(`Erro fatal no monitoramento: ${error.message}`, 'red');
    process.exit(1);
  });
} else {
  singleCheck().then(success => {
    process.exit(success ? 0 : 1);
  }).catch(error => {
    log(`Erro fatal: ${error.message}`, 'red');
    process.exit(1);
  });
}

module.exports = {
  healthCheck,
  checkExternalAPIs,
  checkSecurityEndpoints,
  checkDatabase,
  runMonitoring,
  singleCheck
}; 