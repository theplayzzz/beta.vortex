#!/usr/bin/env node

/**
 * PLAN-013 - Sistema de Validação e Testes
 * Testes automatizados para validar funcionamento do sistema incremental de 15s
 */

const https = require('https');

const BASE_URL = 'https://5.161.64.137:3003';
const SESSION_ID = process.argv[2] || 'test-session-id';

console.log('🧪 INICIANDO TESTES DE VALIDAÇÃO - PLAN-013');
console.log('================================================');

// 7.1 Testes de Reversão dos Bloqueios
async function testApiUnblocked() {
  console.log('\n📋 7.1 - TESTE: API Desbloqueada (Reversão Plan-012)');
  
  try {
    const response = await fetch(`${BASE_URL}/api/transcription-sessions/${SESSION_ID}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ 
        totalDuration: 30,
        isActive: true 
      })
    });
    
    if (response.ok) {
      console.log('✅ API aceita totalDuration - Bloqueio REMOVIDO com sucesso');
      return true;
    } else {
      console.error('❌ API ainda bloqueada:', response.status);
      return false;
    }
  } catch (error) {
    console.error('❌ Erro no teste API:', error.message);
    return false;
  }
}

// 7.2 Testes de Funcionamento do Sistema de 15s  
async function testIncrementEndpoint() {
  console.log('\n🔄 7.2 - TESTE: Endpoint de Incremento');
  
  try {
    const response = await fetch(`${BASE_URL}/api/transcription-sessions/${SESSION_ID}/increment-time`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ 
        increment: 15,
        source: 'test-validation'
      })
    });
    
    if (response.ok) {
      const data = await response.json();
      console.log('✅ Endpoint funcionando:', data);
      return true;
    } else {
      const error = await response.text();
      console.error('❌ Endpoint falhou:', response.status, error);
      return false;
    }
  } catch (error) {
    console.error('❌ Erro no teste incremento:', error.message);
    return false;
  }
}

// 7.3 Testes de Proteção
async function testProtections() {
  console.log('\n🛡️ 7.3 - TESTE: Proteções contra Spam');
  
  // Teste de rate limiting - múltiplas requisições
  const promises = [];
  for (let i = 0; i < 5; i++) {
    promises.push(
      fetch(`${BASE_URL}/api/transcription-sessions/${SESSION_ID}/increment-time`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ increment: 1, source: `spam-test-${i}` })
      })
    );
  }
  
  try {
    const responses = await Promise.all(promises);
    const successful = responses.filter(r => r.ok).length;
    const blocked = responses.length - successful;
    
    if (blocked > 0) {
      console.log(`✅ Rate limiting funcionando: ${successful} aceitas, ${blocked} bloqueadas`);
      return true;
    } else {
      console.warn('⚠️ Todas as requisições passaram - rate limiting pode estar fraco');
      return false;
    }
  } catch (error) {
    console.error('❌ Erro no teste proteções:', error.message);
    return false;
  }
}

// 7.4 Testes de Compatibilidade com Plan-012
async function testCompatibility() {
  console.log('\n🔄 7.4 - TESTE: Compatibilidade Sistema Híbrido');
  
  try {
    // Teste 1: Sistema funciona com sessão ativa
    await fetch(`${BASE_URL}/api/transcription-sessions/${SESSION_ID}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ isActive: true })
    });
    
    // Teste 2: Incremento funciona com sessão ativa
    const incrementResponse = await fetch(`${BASE_URL}/api/transcription-sessions/${SESSION_ID}/increment-time`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ increment: 5, source: 'compatibility-test' })
    });
    
    // Teste 3: Sistema rejeita sessão inativa
    await fetch(`${BASE_URL}/api/transcription-sessions/${SESSION_ID}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ isActive: false })
    });
    
    const inactiveResponse = await fetch(`${BASE_URL}/api/transcription-sessions/${SESSION_ID}/increment-time`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ increment: 5, source: 'inactive-test' })
    });
    
    if (incrementResponse.ok && !inactiveResponse.ok) {
      console.log('✅ Compatibilidade OK: Aceita sessão ativa, rejeita inativa');
      return true;
    } else {
      console.error('❌ Problemas na compatibilidade');
      return false;
    }
  } catch (error) {
    console.error('❌ Erro no teste compatibilidade:', error.message);
    return false;
  }
}

// Executar todos os testes
async function runAllTests() {
  console.log(`\n🎯 Testando SESSION_ID: ${SESSION_ID}`);
  console.log('Use: node test-plan-013-validation.js <session-id>\n');
  
  const results = {
    apiUnblocked: await testApiUnblocked(),
    incrementEndpoint: await testIncrementEndpoint(),
    protections: await testProtections(),
    compatibility: await testCompatibility()
  };
  
  console.log('\n📊 RELATÓRIO FINAL:');
  console.log('==================');
  
  Object.entries(results).forEach(([test, result]) => {
    console.log(`${result ? '✅' : '❌'} ${test}: ${result ? 'PASSOU' : 'FALHOU'}`);
  });
  
  const passedTests = Object.values(results).filter(Boolean).length;
  const totalTests = Object.keys(results).length;
  
  console.log(`\n🎯 RESULTADO: ${passedTests}/${totalTests} testes passaram`);
  
  if (passedTests === totalTests) {
    console.log('🎉 PLAN-013 VALIDADO COM SUCESSO!');
    process.exit(0);
  } else {
    console.log('⚠️ PLAN-013 precisa de ajustes');
    process.exit(1);
  }
}

// Handle fetch for Node.js
if (!global.fetch) {
  const { default: fetch } = require('node-fetch');
  global.fetch = fetch;
}

// Executar testes
runAllTests().catch(error => {
  console.error('💥 Erro crítico nos testes:', error);
  process.exit(1);
});
