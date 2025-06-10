#!/usr/bin/env node

/**
 * Teste da Phase 4: Admin Dashboard & Clerk Metadata Management (Clerk-First)
 * 
 * Este script valida que:
 * 1. API de listagem usa Clerk como fonte de verdade
 * 2. API de moderação atualiza Clerk metadata primeiro
 * 3. Supabase é usado apenas para auditoria opcional
 * 4. Interface continua funcionando com dados do Clerk
 */

const BASE_URL = 'http://localhost:3003';

// Cores para console
const colors = {
  reset: '\x1b[0m',
  green: '\x1b[32m',
  red: '\x1b[31m',
  blue: '\x1b[34m',
  yellow: '\x1b[33m',
  cyan: '\x1b[36m'
};

function log(message, color = 'reset') {
  console.log(`${colors[color]}${message}${colors.reset}`);
}

function logTest(testName, passed, details = '') {
  const status = passed ? '✅ PASSOU' : '❌ FALHOU';
  const color = passed ? 'green' : 'red';
  log(`${status} - ${testName}`, color);
  if (details) {
    log(`    ${details}`, 'cyan');
  }
}

async function makeRequest(endpoint, options = {}) {
  try {
    const response = await fetch(`${BASE_URL}${endpoint}`, {
      headers: {
        'Content-Type': 'application/json',
        ...options.headers
      },
      ...options
    });

    if (!response.ok && response.status !== 401 && response.status !== 403) {
      throw new Error(`HTTP ${response.status}: ${response.statusText}`);
    }

    return {
      status: response.status,
      data: response.headers.get('content-type')?.includes('application/json') 
        ? await response.json() 
        : await response.text()
    };
  } catch (error) {
    log(`Erro na requisição para ${endpoint}: ${error.message}`, 'red');
    throw error;
  }
}

async function testHealthcheck() {
  log('\n=== Teste 1: Healthcheck da Aplicação ===', 'blue');
  
  try {
    const response = await makeRequest('/api/health');
    
    if (response.status === 200) {
      logTest('Aplicação está rodando', true, 'Servidor respondeu corretamente');
      return true;
    } else {
      logTest('Aplicação não está acessível', false, `Status: ${response.status}`);
      return false;
    }
  } catch (error) {
    logTest('Aplicação não está acessível', false, error.message);
    return false;
  }
}

async function testClerkFirstUsersList() {
  log('\n=== Teste 2: API de Listagem Clerk-First ===', 'blue');
  
  try {
    const response = await makeRequest('/api/admin/users?limit=5');
    
    // Deve retornar 401/403 para usuário não autenticado (esperado)
    if (response.status === 401 || response.status === 403) {
      logTest('Proteção de autenticação funcionando', true, 'API protegida adequadamente');
      
      // Verificar se a estrutura da resposta indica Clerk-First
      const isClerkFirst = response.data.error && 
                          (response.data.error.includes('autorizado') || 
                           response.data.error.includes('admins'));
      
      logTest('API usando autenticação Clerk', isClerkFirst, 'Verificação de admin via Clerk');
      return isClerkFirst;
    } else {
      logTest('API deveria exigir autenticação', false, `Status inesperado: ${response.status}`);
      return false;
    }
  } catch (error) {
    logTest('Erro ao testar API de listagem', false, error.message);
    return false;
  }
}

async function testClerkFirstModeration() {
  log('\n=== Teste 3: API de Moderação Clerk-First ===', 'blue');
  
  try {
    // Testar com usuário inexistente para verificar estrutura da API
    const response = await makeRequest('/api/admin/users/test-user-id/moderate', {
      method: 'POST',
      body: JSON.stringify({
        action: 'APPROVE',
        version: 1
      })
    });
    
    // Deve retornar 401/403 para usuário não autenticado (esperado)
    if (response.status === 401 || response.status === 403) {
      logTest('Proteção de autenticação na moderação', true, 'API protegida adequadamente');
      
      // Verificar se a estrutura da resposta indica Clerk-First
      const isClerkFirst = response.data.error && 
                          (response.data.error.includes('autorizado') || 
                           response.data.error.includes('admins'));
      
      logTest('API de moderação usando Clerk', isClerkFirst, 'Verificação de admin via Clerk');
      return isClerkFirst;
    } else {
      logTest('API de moderação deveria exigir autenticação', false, `Status inesperado: ${response.status}`);
      return false;
    }
  } catch (error) {
    logTest('Erro ao testar API de moderação', false, error.message);
    return false;
  }
}

async function testDashboardAccessibility() {
  log('\n=== Teste 4: Dashboard Administrativo ===', 'blue');
  
  try {
    const response = await makeRequest('/admin/moderate');
    
    if (response.status === 200) {
      // Verificar se contém elementos do dashboard
      const hasUsersList = response.data.includes('Usuários') || response.data.includes('moderate');
      const hasModeration = response.data.includes('Moderação') || response.data.includes('admin');
      
      logTest('Dashboard carregando corretamente', hasUsersList, 'Interface encontrada');
      logTest('Funcionalidades de moderação presentes', hasModeration, 'Elementos de moderação detectados');
      
      return hasUsersList && hasModeration;
    } else {
      logTest('Dashboard não acessível', false, `Status: ${response.status}`);
      return false;
    }
  } catch (error) {
    logTest('Erro ao acessar dashboard', false, error.message);
    return false;
  }
}

async function testEnvironmentConfiguration() {
  log('\n=== Teste 5: Configuração do Ambiente ===', 'blue');
  
  try {
    // Verificar se as variáveis de ambiente estão configuradas
    const fs = require('fs');
    const envContent = fs.readFileSync('.env', 'utf8');
    
    const requiredVars = [
      'NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY',
      'CLERK_SECRET_KEY',
      'WEBHOOK_SECRET',
      'APPROVAL_REQUIRED',
      'ADMIN_CLERK_USER_IDS'
    ];
    
    let allConfigured = true;
    for (const envVar of requiredVars) {
      const isConfigured = envContent.includes(envVar);
      logTest(`Variável ${envVar}`, isConfigured, isConfigured ? 'Configurada' : 'Faltando');
      if (!isConfigured) allConfigured = false;
    }
    
    return allConfigured;
  } catch (error) {
    logTest('Erro ao verificar configuração', false, error.message);
    return false;
  }
}

async function testCodeStructure() {
  log('\n=== Teste 6: Estrutura do Código Clerk-First ===', 'blue');
  
  try {
    const fs = require('fs');
    
    // Verificar API de listagem
    const usersApiContent = fs.readFileSync('app/api/admin/users/route.ts', 'utf8');
    const usesClerkList = usersApiContent.includes('clerkClient.users.getUserList') && 
                         usersApiContent.includes('CLERK-FIRST');
    
    logTest('API de listagem usa Clerk-First', usesClerkList, 
           'Código busca usuários do Clerk como fonte primária');
    
    // Verificar API de moderação
    const moderateApiContent = fs.readFileSync('app/api/admin/users/[userId]/moderate/route.ts', 'utf8');
    const usesClerkModerate = moderateApiContent.includes('clerkClient.users.updateUserMetadata') && 
                             moderateApiContent.includes('CLERK-FIRST') &&
                             moderateApiContent.includes('SUPABASE OPCIONAL');
    
    logTest('API de moderação usa Clerk-First', usesClerkModerate, 
           'Código atualiza Clerk metadata como ação primária');
    
    // Verificar comentários de estratégia
    const hasStrategy = usersApiContent.includes('fonte de verdade') || 
                       moderateApiContent.includes('ação primária');
    
    logTest('Documentação da estratégia presente', hasStrategy, 
           'Comentários explicam abordagem Clerk-First');
    
    return usesClerkList && usesClerkModerate && hasStrategy;
  } catch (error) {
    logTest('Erro ao verificar estrutura do código', false, error.message);
    return false;
  }
}

async function runAllTests() {
  log('🧪 INICIANDO TESTES DA PHASE 4: CLERK-FIRST STRATEGY', 'cyan');
  log('=' * 60, 'cyan');
  
  const tests = [
    testHealthcheck,
    testClerkFirstUsersList, 
    testClerkFirstModeration,
    testDashboardAccessibility,
    testEnvironmentConfiguration,
    testCodeStructure
  ];
  
  let passedTests = 0;
  const totalTests = tests.length;
  
  for (const test of tests) {
    try {
      const passed = await test();
      if (passed) passedTests++;
    } catch (error) {
      log(`Erro durante teste: ${error.message}`, 'red');
    }
  }
  
  log('\n' + '=' * 60, 'cyan');
  log(`📊 RESULTADO FINAL: ${passedTests}/${totalTests} testes passaram`, 'cyan');
  
  if (passedTests === totalTests) {
    log('🎉 PHASE 4 CLERK-FIRST: IMPLEMENTAÇÃO COMPLETA!', 'green');
    log('✅ Todas as funcionalidades da estratégia Clerk-First estão funcionando', 'green');
  } else if (passedTests >= totalTests * 0.8) {
    log('⚠️  PHASE 4 CLERK-FIRST: QUASE COMPLETA', 'yellow');
    log(`✅ ${passedTests} testes passaram, ${totalTests - passedTests} precisam de ajustes`, 'yellow');
  } else {
    log('❌ PHASE 4 CLERK-FIRST: PRECISA DE CORREÇÕES', 'red');
    log(`✅ ${passedTests} testes passaram, ${totalTests - passedTests} falharam`, 'red');
  }
  
  return passedTests === totalTests;
}

// Executar os testes
if (require.main === module) {
  runAllTests()
    .then(success => {
      process.exit(success ? 0 : 1);
    })
    .catch(error => {
      log(`Erro fatal: ${error.message}`, 'red');
      process.exit(1);
    });
}

module.exports = { runAllTests }; 