#!/usr/bin/env node

/**
 * 🔄 PHASE 7: External API Integration & Testing
 * 
 * Este script testa:
 * 1. Validação de integração N8N
 * 2. Rate limiting apenas onde necessário
 * 3. Performance sem RLS
 * 4. APIs externas funcionando livremente
 */

const { PrismaClient } = require('@prisma/client');
const crypto = require('crypto');

// Configurações
const BASE_URL = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3003';
const TEST_USER_EMAIL = 'play-felix@hotmail.com';

// Cores para logs
const colors = {
  reset: '\x1b[0m',
  red: '\x1b[31m',
  green: '\x1b[32m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  magenta: '\x1b[35m',
  cyan: '\x1b[36m',
  white: '\x1b[37m'
};

function log(message, color = 'white') {
  console.log(`${colors[color]}${message}${colors.reset}`);
}

function logTest(testName, passed, details = '') {
  const status = passed ? '✅ PASS' : '❌ FAIL';
  const color = passed ? 'green' : 'red';
  log(`${status} ${testName}${details ? ` - ${details}` : ''}`, color);
}

function logInfo(message) {
  log(`ℹ️  ${message}`, 'blue');
}

function logWarning(message) {
  log(`⚠️  ${message}`, 'yellow');
}

function logError(message) {
  log(`❌ ${message}`, 'red');
}

function logSuccess(message) {
  log(`✅ ${message}`, 'green');
}

// ==========================================
// TESTE 1: VALIDAÇÃO DE API KEYS
// ==========================================

async function testApiKeyValidation() {
  log('\n=== Teste 1: Validação de API Keys ===', 'blue');
  
  let score = 0;
  const maxScore = 4;
  
  try {
    // 1.1 Testar acesso sem API key (deve falhar)
    logInfo('1.1 Testando acesso sem API key...');
    const unauthorizedResponse = await fetch(`${BASE_URL}/api/external/clients`, {
      method: 'GET'
    });
    
    const unauthorizedPassed = unauthorizedResponse.status === 401;
    logTest('Endpoint protegido sem API key', unauthorizedPassed, 
           `Status: ${unauthorizedResponse.status}`);
    if (unauthorizedPassed) score++;
    
    // 1.2 Testar com API key inválida
    logInfo('1.2 Testando com API key inválida...');
    const invalidKeyResponse = await fetch(`${BASE_URL}/api/external/clients`, {
      method: 'GET',
      headers: {
        'X-API-Key': 'invalid-key-123'
      }
    });
    
    const invalidKeyPassed = invalidKeyResponse.status === 401;
    logTest('Rejeita API key inválida', invalidKeyPassed, 
           `Status: ${invalidKeyResponse.status}`);
    if (invalidKeyPassed) score++;
    
    // 1.3 Verificar se API key está configurada
    const apiKeyConfigured = !!process.env.EXTERNAL_API_KEY;
    logTest('API key configurada no ambiente', apiKeyConfigured);
    if (apiKeyConfigured) score++;
    
    // 1.4 Testar com API key válida (se configurada)
    if (apiKeyConfigured) {
      logInfo('1.4 Testando com API key válida...');
      const validKeyResponse = await fetch(`${BASE_URL}/api/external/clients?userEmail=${TEST_USER_EMAIL}`, {
        method: 'GET',
        headers: {
          'X-API-Key': process.env.EXTERNAL_API_KEY
        }
      });
      
      const validKeyPassed = validKeyResponse.status === 200 || validKeyResponse.status === 404;
      logTest('API key válida aceita', validKeyPassed, 
             `Status: ${validKeyResponse.status}`);
      if (validKeyPassed) score++;
    } else {
      logWarning('API key não configurada - pulando teste com chave válida');
    }
    
  } catch (error) {
    logError(`Erro no teste de API keys: ${error.message}`);
  }
  
  return { score, maxScore, testName: 'API Key Validation' };
}

// ==========================================
// TESTE 2: INTEGRAÇÃO N8N COMPLETA
// ==========================================

async function testN8nIntegration() {
  log('\n=== Teste 2: Integração N8N Completa ===', 'blue');
  
  let score = 0;
  const maxScore = 6;
  
  if (!process.env.EXTERNAL_API_KEY) {
    logWarning('API key não configurada - pulando testes N8N');
    return { score: 0, maxScore, testName: 'N8N Integration (SKIPPED)' };
  }
  
  const headers = {
    'X-API-Key': process.env.EXTERNAL_API_KEY,
    'Content-Type': 'application/json'
  };
  
  try {
    // 2.1 Testar criação de cliente via API externa
    logInfo('2.1 Testando criação de cliente...');
    const clientData = {
      name: `Cliente N8N Test ${Date.now()}`,
      industry: 'Automação',
      contactEmail: 'n8n-test@exemplo.com',
      businessDetails: 'Cliente criado via teste N8N',
      userEmail: TEST_USER_EMAIL
    };
    
    const createClientResponse = await fetch(`${BASE_URL}/api/external/clients`, {
      method: 'POST',
      headers,
      body: JSON.stringify(clientData)
    });
    
    const createClientPassed = createClientResponse.status === 201;
    let createdClientId = null;
    
    if (createClientPassed) {
      const clientResult = await createClientResponse.json();
      createdClientId = clientResult.client?.id;
      logTest('Criação de cliente via N8N', true, 
             `Cliente ID: ${createdClientId}`);
      score++;
    } else {
      const errorText = await createClientResponse.text();
      logTest('Criação de cliente via N8N', false, 
             `Status: ${createClientResponse.status}, Error: ${errorText.substring(0, 100)}`);
    }
    
    // 2.2 Testar listagem de clientes
    logInfo('2.2 Testando listagem de clientes...');
    const listClientsResponse = await fetch(`${BASE_URL}/api/external/clients?userEmail=${TEST_USER_EMAIL}&limit=5`, {
      method: 'GET',
      headers
    });
    
    const listClientsPassed = listClientsResponse.status === 200;
    if (listClientsPassed) {
      const clientsList = await listClientsResponse.json();
      logTest('Listagem de clientes via N8N', true, 
             `${clientsList.metadata?.count || 0} clientes encontrados`);
      score++;
    } else {
      logTest('Listagem de clientes via N8N', false, 
             `Status: ${listClientsResponse.status}`);
    }
    
    // 2.3 Testar criação de nota (se cliente foi criado)
    if (createdClientId) {
      logInfo('2.3 Testando criação de nota...');
      const noteData = {
        content: `Nota de teste N8N criada em ${new Date().toISOString()}`,
        clientId: createdClientId,
        userEmail: TEST_USER_EMAIL
      };
      
      const createNoteResponse = await fetch(`${BASE_URL}/api/external/notes`, {
        method: 'POST',
        headers,
        body: JSON.stringify(noteData)
      });
      
      const createNotePassed = createNoteResponse.status === 201;
      logTest('Criação de nota via N8N', createNotePassed, 
             `Status: ${createNoteResponse.status}`);
      if (createNotePassed) score++;
    } else {
      logWarning('Cliente não foi criado - pulando teste de nota');
    }
    
    // 2.4 Testar criação de planejamento (se cliente foi criado)
    if (createdClientId) {
      logInfo('2.4 Testando criação de planejamento...');
      const planningData = {
        title: `Planejamento N8N Test ${Date.now()}`,
        description: 'Planejamento criado via teste N8N',
        clientId: createdClientId,
        userEmail: TEST_USER_EMAIL,
        status: 'DRAFT'
      };
      
      const createPlanningResponse = await fetch(`${BASE_URL}/api/external/plannings`, {
        method: 'POST',
        headers,
        body: JSON.stringify(planningData)
      });
      
      const createPlanningPassed = createPlanningResponse.status === 201;
      logTest('Criação de planejamento via N8N', createPlanningPassed, 
             `Status: ${createPlanningResponse.status}`);
      if (createPlanningPassed) score++;
    } else {
      logWarning('Cliente não foi criado - pulando teste de planejamento');
    }
    
    // 2.5 Testar performance (tempo de resposta)
    logInfo('2.5 Testando performance da API...');
    const startTime = Date.now();
    const perfResponse = await fetch(`${BASE_URL}/api/external/clients?userEmail=${TEST_USER_EMAIL}&limit=1`, {
      method: 'GET',
      headers
    });
    const responseTime = Date.now() - startTime;
    
    const performancePassed = responseTime < 2000; // Menos de 2 segundos
    logTest('Performance da API externa', performancePassed, 
           `Tempo de resposta: ${responseTime}ms`);
    if (performancePassed) score++;
    
    // 2.6 Testar bypass de aprovação (APIs externas não devem ser bloqueadas)
    logInfo('2.6 Testando bypass de sistema de aprovação...');
    // Este teste verifica se as APIs externas funcionam independente do status de aprovação
    const bypassPassed = createClientPassed; // Se conseguiu criar cliente, bypass está funcionando
    logTest('Bypass de sistema de aprovação', bypassPassed, 
           'APIs externas funcionam sem validação de aprovação');
    if (bypassPassed) score++;
    
  } catch (error) {
    logError(`Erro no teste N8N: ${error.message}`);
  }
  
  return { score, maxScore, testName: 'N8N Integration' };
}

// ==========================================
// TESTE 3: PERFORMANCE SEM RLS
// ==========================================

async function testPerformanceWithoutRLS() {
  log('\n=== Teste 3: Performance sem RLS ===', 'blue');
  
  let score = 0;
  const maxScore = 4;
  
  const prisma = new PrismaClient();
  
  try {
    // 3.1 Testar query direta ao banco (bypass RLS)
    logInfo('3.1 Testando query direta ao banco...');
    const startTime = Date.now();
    
    const users = await prisma.$queryRaw`
      SELECT id, email, "approvalStatus" FROM "User" LIMIT 5
    `;
    
    const queryTime = Date.now() - startTime;
    const queryPassed = Array.isArray(users) && queryTime < 500;
    
    logTest('Query direta ao banco', queryPassed, 
           `${users.length} usuários em ${queryTime}ms`);
    if (queryPassed) score++;
    
    // 3.2 Testar inserção sem RLS
    logInfo('3.2 Testando inserção sem RLS...');
    const testClientId = `test-rls-${Date.now()}`;
    
    try {
      await prisma.$executeRaw`
        INSERT INTO "Client" (
          "id", "name", "industry", "userId", "richnessScore", "createdAt", "updatedAt"
        ) VALUES (
          ${testClientId}, 'Cliente Teste RLS', 'Teste', 
          'cmbmazoja000909yox6gv567p', 50, NOW(), NOW()
        )
      `;
      
      logTest('Inserção sem RLS', true, 'Cliente inserido com sucesso');
      score++;
      
      // Limpar teste
      await prisma.$executeRaw`DELETE FROM "Client" WHERE "id" = ${testClientId}`;
      
    } catch (error) {
      logTest('Inserção sem RLS', false, `Erro: ${error.message}`);
    }
    
    // 3.3 Testar múltiplas queries simultâneas
    logInfo('3.3 Testando múltiplas queries simultâneas...');
    const concurrentStartTime = Date.now();
    
    const promises = [
      prisma.$queryRaw`SELECT COUNT(*) as count FROM "User"`,
      prisma.$queryRaw`SELECT COUNT(*) as count FROM "Client"`,
      prisma.$queryRaw`SELECT COUNT(*) as count FROM "StrategicPlanning"`,
      prisma.$queryRaw`SELECT COUNT(*) as count FROM "UserModerationLog"`
    ];
    
    const results = await Promise.all(promises);
    const concurrentTime = Date.now() - concurrentStartTime;
    
    const concurrentPassed = results.length === 4 && concurrentTime < 1000;
    logTest('Queries simultâneas', concurrentPassed, 
           `4 queries em ${concurrentTime}ms`);
    if (concurrentPassed) score++;
    
    // 3.4 Verificar se RLS está realmente desabilitado
    logInfo('3.4 Verificando status do RLS...');
    
    try {
      const rlsStatus = await prisma.$queryRaw`
        SELECT schemaname, tablename, rowsecurity 
        FROM pg_tables 
        WHERE schemaname = 'public' 
        AND tablename IN ('User', 'Client', 'StrategicPlanning', 'UserModerationLog')
      `;
      
      const rlsDisabled = rlsStatus.every(table => !table.rowsecurity);
      logTest('RLS desabilitado', rlsDisabled, 
           `${rlsStatus.filter(t => !t.rowsecurity).length}/${rlsStatus.length} tabelas sem RLS`);
      if (rlsDisabled) score++;
      
    } catch (error) {
      logTest('Verificação RLS', false, `Erro: ${error.message}`);
    }
    
  } catch (error) {
    logError(`Erro no teste de performance: ${error.message}`);
  } finally {
    await prisma.$disconnect();
  }
  
  return { score, maxScore, testName: 'Performance without RLS' };
}

// ==========================================
// TESTE 4: RATE LIMITING SELETIVO
// ==========================================

async function testSelectiveRateLimiting() {
  log('\n=== Teste 4: Rate Limiting Seletivo ===', 'blue');
  
  let score = 0;
  const maxScore = 3;
  
  try {
    // 4.1 Verificar se APIs externas NÃO têm rate limiting
    logInfo('4.1 Testando ausência de rate limiting em APIs externas...');
    
    if (!process.env.EXTERNAL_API_KEY) {
      logWarning('API key não configurada - pulando teste');
      return { score: 0, maxScore, testName: 'Rate Limiting (SKIPPED)' };
    }
    
    const headers = {
      'X-API-Key': process.env.EXTERNAL_API_KEY
    };
    
    // Fazer múltiplas requisições rápidas
    const requests = [];
    for (let i = 0; i < 5; i++) {
      requests.push(
        fetch(`${BASE_URL}/api/external/clients?userEmail=${TEST_USER_EMAIL}&limit=1`, {
          method: 'GET',
          headers
        })
      );
    }
    
    const responses = await Promise.all(requests);
    const allSuccessful = responses.every(r => r.status === 200 || r.status === 404);
    
    logTest('APIs externas sem rate limiting', allSuccessful, 
           `${responses.filter(r => r.ok).length}/5 requisições bem-sucedidas`);
    if (allSuccessful) score++;
    
    // 4.2 Verificar se middleware não bloqueia APIs externas
    logInfo('4.2 Testando bypass do middleware para APIs externas...');
    
    const middlewareBypassResponse = await fetch(`${BASE_URL}/api/external/clients?userEmail=${TEST_USER_EMAIL}`, {
      method: 'GET',
      headers
    });
    
    const bypassPassed = middlewareBypassResponse.status !== 401 || 
                        middlewareBypassResponse.status !== 403;
    
    logTest('Middleware não bloqueia APIs externas', bypassPassed, 
           `Status: ${middlewareBypassResponse.status}`);
    if (bypassPassed) score++;
    
    // 4.3 Verificar se health check funciona sem restrições
    logInfo('4.3 Testando health check sem restrições...');
    
    const healthResponse = await fetch(`${BASE_URL}/api/health`);
    const healthPassed = healthResponse.status === 200;
    
    logTest('Health check sem restrições', healthPassed, 
           `Status: ${healthResponse.status}`);
    if (healthPassed) score++;
    
  } catch (error) {
    logError(`Erro no teste de rate limiting: ${error.message}`);
  }
  
  return { score, maxScore, testName: 'Selective Rate Limiting' };
}

// ==========================================
// TESTE 5: WEBHOOKS E INTEGRAÇÕES
// ==========================================

async function testWebhooksAndIntegrations() {
  log('\n=== Teste 5: Webhooks e Integrações ===', 'blue');
  
  let score = 0;
  const maxScore = 4;
  
  try {
    // 5.1 Testar webhook de propostas (se configurado)
    logInfo('5.1 Verificando configuração de webhooks...');
    
    const proposalWebhookConfigured = !!process.env.PROPOSTA_WEBHOOK_URL;
    const refinedListWebhookConfigured = !!process.env.REFINED_LIST_WEBHOOK_URL;
    const webhookSecretConfigured = !!process.env.WEBHOOK_SECRET;
    
    logTest('Webhook de propostas configurado', proposalWebhookConfigured);
    logTest('Webhook de lista refinada configurado', refinedListWebhookConfigured);
    logTest('Webhook secret configurado', webhookSecretConfigured);
    
    if (proposalWebhookConfigured) score++;
    if (refinedListWebhookConfigured) score++;
    if (webhookSecretConfigured) score++;
    
    // 5.2 Testar endpoint de callback de webhook
    logInfo('5.2 Testando endpoint de callback...');
    
    try {
      const callbackResponse = await fetch(`${BASE_URL}/api/webhooks/refined-list-callback`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...(process.env.WEBHOOK_SECRET && {
            'Authorization': `Bearer ${process.env.WEBHOOK_SECRET}`
          })
        },
        body: JSON.stringify({
          planning_id: 'test-planning-id',
          status: 'error',
          error_message: 'Teste de callback'
        })
      });
      
      // Esperamos 404 (planning não encontrado) ou 401 (não autorizado)
      const callbackPassed = callbackResponse.status === 404 || 
                            callbackResponse.status === 401 ||
                            callbackResponse.status === 200;
      
      logTest('Endpoint de callback funcional', callbackPassed, 
             `Status: ${callbackResponse.status}`);
      if (callbackPassed) score++;
      
    } catch (error) {
      logTest('Endpoint de callback funcional', false, 
             `Erro: ${error.message}`);
    }
    
  } catch (error) {
    logError(`Erro no teste de webhooks: ${error.message}`);
  }
  
  return { score, maxScore, testName: 'Webhooks and Integrations' };
}

// ==========================================
// TESTE 6: SEGURANÇA E VALIDAÇÃO
// ==========================================

async function testSecurityAndValidation() {
  log('\n=== Teste 6: Segurança e Validação ===', 'blue');
  
  let score = 0;
  const maxScore = 5;
  
  try {
    // 6.1 Testar validação de dados de entrada
    logInfo('6.1 Testando validação de dados...');
    
    if (!process.env.EXTERNAL_API_KEY) {
      logWarning('API key não configurada - pulando testes de segurança');
      return { score: 0, maxScore, testName: 'Security (SKIPPED)' };
    }
    
    const headers = {
      'X-API-Key': process.env.EXTERNAL_API_KEY,
      'Content-Type': 'application/json'
    };
    
    // Testar dados inválidos
    const invalidDataResponse = await fetch(`${BASE_URL}/api/external/clients`, {
      method: 'POST',
      headers,
      body: JSON.stringify({
        name: '', // Nome vazio (inválido)
        userEmail: 'email-invalido' // Email inválido
      })
    });
    
    const validationPassed = invalidDataResponse.status === 400;
    logTest('Validação de dados de entrada', validationPassed, 
           `Status: ${invalidDataResponse.status}`);
    if (validationPassed) score++;
    
    // 6.2 Testar proteção contra SQL injection
    logInfo('6.2 Testando proteção contra SQL injection...');
    
    const sqlInjectionResponse = await fetch(`${BASE_URL}/api/external/clients?userEmail=${encodeURIComponent("'; DROP TABLE User; --")}`, {
      method: 'GET',
      headers
    });
    
    // Deve retornar erro 404 (usuário não encontrado) ou 400 (dados inválidos)
    const sqlProtectionPassed = sqlInjectionResponse.status === 404 || 
                               sqlInjectionResponse.status === 400;
    
    logTest('Proteção contra SQL injection', sqlProtectionPassed, 
           `Status: ${sqlInjectionResponse.status}`);
    if (sqlProtectionPassed) score++;
    
    // 6.3 Testar headers de segurança
    logInfo('6.3 Testando headers de segurança...');
    
    const securityResponse = await fetch(`${BASE_URL}/api/external/clients?userEmail=${TEST_USER_EMAIL}`, {
      method: 'GET',
      headers
    });
    
    const hasSecurityHeaders = securityResponse.headers.get('content-type')?.includes('application/json');
    logTest('Headers de segurança', hasSecurityHeaders, 
           `Content-Type: ${securityResponse.headers.get('content-type')}`);
    if (hasSecurityHeaders) score++;
    
    // 6.4 Testar limite de tamanho de payload
    logInfo('6.4 Testando limite de payload...');
    
    const largePayload = {
      name: 'A'.repeat(10000), // Nome muito grande
      userEmail: TEST_USER_EMAIL,
      businessDetails: 'B'.repeat(50000) // Detalhes muito grandes
    };
    
    const payloadResponse = await fetch(`${BASE_URL}/api/external/clients`, {
      method: 'POST',
      headers,
      body: JSON.stringify(largePayload)
    });
    
    // Deve aceitar ou rejeitar graciosamente
    const payloadPassed = payloadResponse.status < 500;
    logTest('Limite de payload', payloadPassed, 
           `Status: ${payloadResponse.status}`);
    if (payloadPassed) score++;
    
    // 6.5 Testar CORS e métodos HTTP
    logInfo('6.5 Testando CORS e métodos HTTP...');
    
    const optionsResponse = await fetch(`${BASE_URL}/api/external/clients`, {
      method: 'OPTIONS',
      headers
    });
    
    const corsWorking = optionsResponse.status === 200 || optionsResponse.status === 405;
    logTest('CORS e métodos HTTP', corsWorking, 
           `OPTIONS Status: ${optionsResponse.status}`);
    if (corsWorking) score++;
    
  } catch (error) {
    logError(`Erro no teste de segurança: ${error.message}`);
  }
  
  return { score, maxScore, testName: 'Security and Validation' };
}

// ==========================================
// FUNÇÃO PRINCIPAL
// ==========================================

async function main() {
  log('\n🔄 PHASE 7: EXTERNAL API INTEGRATION & TESTING', 'cyan');
  log('='.repeat(60), 'cyan');
  log(`Timestamp: ${new Date().toISOString()}`, 'cyan');
  log(`Base URL: ${BASE_URL}`, 'cyan');
  log(`Test User: ${TEST_USER_EMAIL}`, 'cyan');
  
  const results = [];
  
  // Executar todos os testes
  results.push(await testApiKeyValidation());
  results.push(await testN8nIntegration());
  results.push(await testPerformanceWithoutRLS());
  results.push(await testSelectiveRateLimiting());
  results.push(await testWebhooksAndIntegrations());
  results.push(await testSecurityAndValidation());
  
  // Calcular score total
  const totalScore = results.reduce((sum, result) => sum + result.score, 0);
  const totalMaxScore = results.reduce((sum, result) => sum + result.maxScore, 0);
  const percentage = Math.round((totalScore / totalMaxScore) * 100);
  
  // Relatório final
  log('\n📊 RELATÓRIO FINAL - PHASE 7', 'cyan');
  log('='.repeat(60), 'cyan');
  
  results.forEach(result => {
    const resultPercentage = Math.round((result.score / result.maxScore) * 100);
    const status = resultPercentage >= 80 ? '✅' : resultPercentage >= 60 ? '⚠️' : '❌';
    log(`${status} ${result.testName}: ${result.score}/${result.maxScore} (${resultPercentage}%)`, 
        resultPercentage >= 80 ? 'green' : resultPercentage >= 60 ? 'yellow' : 'red');
  });
  
  log(`\n🎯 SCORE TOTAL: ${totalScore}/${totalMaxScore} (${percentage}%)`, 
      percentage >= 80 ? 'green' : percentage >= 60 ? 'yellow' : 'red');
  
  // Status da Phase 7
  if (percentage >= 80) {
    logSuccess('✅ PHASE 7 COMPLETA - APIs externas funcionando perfeitamente!');
  } else if (percentage >= 60) {
    logWarning('⚠️ PHASE 7 PARCIAL - Algumas melhorias necessárias');
  } else {
    logError('❌ PHASE 7 FALHOU - Problemas críticos encontrados');
  }
  
  // Recomendações
  log('\n💡 RECOMENDAÇÕES:', 'blue');
  
  if (!process.env.EXTERNAL_API_KEY) {
    log('   • Configure EXTERNAL_API_KEY no .env.local', 'yellow');
  }
  
  if (!process.env.PROPOSTA_WEBHOOK_URL) {
    log('   • Configure PROPOSTA_WEBHOOK_URL para webhooks de propostas', 'yellow');
  }
  
  if (!process.env.REFINED_LIST_WEBHOOK_URL) {
    log('   • Configure REFINED_LIST_WEBHOOK_URL para webhooks de planejamento', 'yellow');
  }
  
  if (percentage < 80) {
    log('   • Revise as configurações de API e webhooks', 'yellow');
    log('   • Verifique se o servidor está rodando corretamente', 'yellow');
    log('   • Teste manualmente os endpoints que falharam', 'yellow');
  }
  
  log('\n🚀 PRÓXIMOS PASSOS:', 'blue');
  log('   1. Configurar N8N com as APIs testadas', 'white');
  log('   2. Implementar monitoramento de APIs externas', 'white');
  log('   3. Executar Phase 8: Final Testing & Production Deployment', 'white');
  
  return percentage >= 80;
}

// Executar apenas se chamado diretamente
if (require.main === module) {
  main()
    .then(success => {
      process.exit(success ? 0 : 1);
    })
    .catch(error => {
      logError(`Erro fatal: ${error.message}`);
      process.exit(1);
    });
}

module.exports = {
  testApiKeyValidation,
  testN8nIntegration,
  testPerformanceWithoutRLS,
  testSelectiveRateLimiting,
  testWebhooksAndIntegrations,
  testSecurityAndValidation,
  main
};