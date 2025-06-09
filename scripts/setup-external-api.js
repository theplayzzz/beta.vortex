#!/usr/bin/env node

/**
 * 🔑 Setup de API Keys Externas para N8N e Automações
 * 
 * Este script:
 * 1. Gera API keys seguras
 * 2. Mostra como configurar as variáveis de ambiente
 * 3. Testa os endpoints externos
 * 4. Fornece exemplos de uso para N8N
 */

const crypto = require('crypto');
const { PrismaClient } = require('@prisma/client');

function generateApiKey() {
  return crypto.randomBytes(32).toString('hex');
}

function showEnvironmentConfig() {
  const apiKey = generateApiKey();
  
  console.log('\n🔑 CONFIGURAÇÃO DE API KEYS EXTERNAS');
  console.log('='.repeat(50));
  
  console.log('\n📋 VARIÁVEIS DE AMBIENTE (.env.local):');
  console.log('-'.repeat(40));
  console.log(`EXTERNAL_API_KEY=${apiKey}`);
  console.log(`N8N_API_KEY=${apiKey}`);
  console.log(`AUTOMATION_API_KEY=${apiKey}`);
  
  console.log('\n⚠️  IMPORTANTE:');
  console.log('   1. Adicione UMA dessas variáveis ao seu .env.local');
  console.log('   2. Reinicie o servidor após adicionar');
  console.log('   3. Use essa chave em todas as requisições do N8N');
  
  return apiKey;
}

function showApiUsageExamples(apiKey) {
  console.log('\n📡 EXEMPLOS DE USO - N8N/CURL');
  console.log('='.repeat(50));
  
  console.log('\n🌐 BASE URL (ajustar conforme seu ambiente):');
  console.log('   Desenvolvimento: http://localhost:3003');
  console.log('   Produção: https://seu-dominio.com');
  
  console.log('\n📝 1. CRIAR CLIENTE:');
  console.log('-'.repeat(30));
  console.log('POST /api/external/clients');
  console.log('Headers:');
  console.log(`   X-API-Key: ${apiKey}`);
  console.log('   Content-Type: application/json');
  console.log('\nBody:');
  console.log(`{
  "name": "Cliente Teste",
  "industry": "Tecnologia",
  "contactEmail": "cliente@empresa.com",
  "businessDetails": "Empresa de software",
  "userEmail": "seu-usuario@email.com"
}`);
  
  console.log('\n📋 2. CRIAR NOTA:');
  console.log('-'.repeat(30));
  console.log('POST /api/external/notes');
  console.log('Headers:');
  console.log(`   X-API-Key: ${apiKey}`);
  console.log('   Content-Type: application/json');
  console.log('\nBody:');
  console.log(`{
  "content": "Nota importante sobre o cliente",
  "clientId": "ID_DO_CLIENTE",
  "userEmail": "seu-usuario@email.com"
}`);
  
  console.log('\n📊 3. LISTAR CLIENTES:');
  console.log('-'.repeat(30));
  console.log('GET /api/external/clients?userEmail=seu-usuario@email.com&limit=10');
  console.log('Headers:');
  console.log(`   X-API-Key: ${apiKey}`);
  
  console.log('\n🔍 4. LISTAR NOTAS:');
  console.log('-'.repeat(30));
  console.log('GET /api/external/notes?userEmail=seu-usuario@email.com&clientId=ID_CLIENTE');
  console.log('Headers:');
  console.log(`   X-API-Key: ${apiKey}`);
}

function showCurlExamples(baseUrl, apiKey) {
  console.log('\n💻 EXEMPLOS CURL PARA TESTE');
  console.log('='.repeat(50));
  
  console.log('\n1. Testar criação de cliente:');
  console.log(`curl -X POST "${baseUrl}/api/external/clients" \\
  -H "X-API-Key: ${apiKey}" \\
  -H "Content-Type: application/json" \\
  -d '{
    "name": "Cliente API Test",
    "industry": "Teste",
    "contactEmail": "teste@exemplo.com",
    "userEmail": "play-felix@hotmail.com"
  }'`);
  
  console.log('\n2. Listar clientes:');
  console.log(`curl -X GET "${baseUrl}/api/external/clients?userEmail=play-felix@hotmail.com" \\
  -H "X-API-Key: ${apiKey}"`);
}

function showN8nSetup(apiKey) {
  console.log('\n⚙️  CONFIGURAÇÃO NO N8N');
  console.log('='.repeat(50));
  
  console.log('\n📋 HTTP Request Node:');
  console.log('   Method: POST');
  console.log('   URL: {{$vars.VORTEX_BASE_URL}}/api/external/clients');
  console.log('   Headers:');
  console.log(`     X-API-Key: ${apiKey}`);
  console.log('     Content-Type: application/json');
  
  console.log('\n📋 Authentication:');
  console.log('   Type: Generic Credential Type');
  console.log('   Name: Vortex External API');
  console.log(`   API Key: ${apiKey}`);
  
  console.log('\n📋 Environment Variables (N8N):');
  console.log('   VORTEX_BASE_URL=http://localhost:3003 (ou sua URL)');
  console.log(`   VORTEX_API_KEY=${apiKey}`);
}

async function testApiEndpoints(baseUrl, apiKey) {
  console.log('\n🧪 TESTE AUTOMÁTICO DOS ENDPOINTS');
  console.log('='.repeat(50));
  
  try {
    // Teste de acesso sem API key (deve falhar)
    console.log('\n1. Testando acesso sem API key (deve falhar)...');
    const unauthorizedResponse = await fetch(`${baseUrl}/api/external/clients`, {
      method: 'GET'
    });
    
    if (unauthorizedResponse.status === 401) {
      console.log('   ✅ Endpoint protegido corretamente (401 Unauthorized)');
    } else {
      console.log('   ❌ Endpoint não está protegido!');
    }
    
    // Teste de acesso com API key
    console.log('\n2. Testando acesso com API key...');
    const authorizedResponse = await fetch(`${baseUrl}/api/external/clients?userEmail=play-felix@hotmail.com`, {
      headers: {
        'X-API-Key': apiKey
      }
    });
    
    if (authorizedResponse.ok) {
      console.log('   ✅ API key funcionando corretamente');
      const data = await authorizedResponse.json();
      console.log(`   📊 Resposta: ${data.success ? 'Success' : 'Error'}`);
    } else {
      console.log(`   ⚠️  Status: ${authorizedResponse.status}`);
      const error = await authorizedResponse.text();
      console.log(`   📄 Erro: ${error.substring(0, 100)}...`);
    }
    
  } catch (error) {
    console.log('   ❌ Erro no teste:', error.message);
    console.log('   💡 Certifique-se que o servidor está rodando');
  }
}

async function checkDatabaseRLS() {
  console.log('\n🛡️  VERIFICAÇÃO DE RLS (BYPASS)');
  console.log('='.repeat(50));
  
  const prisma = new PrismaClient();
  
  try {
    // Verificar se consegue executar query raw (bypass RLS)
    const users = await prisma.$queryRaw`
      SELECT id, email, "approvalStatus" FROM "User" LIMIT 1
    `;
    
    if (Array.isArray(users) && users.length > 0) {
      console.log('   ✅ Query RAW funcionando (RLS bypass ativo)');
      console.log(`   👤 Usuário teste: ${users[0].email}`);
    } else {
      console.log('   ⚠️  Nenhum usuário encontrado para teste');
    }
    
  } catch (error) {
    console.log('   ❌ Erro na query RAW:', error.message);
    console.log('   💡 Verifique a conexão com o banco');
  } finally {
    await prisma.$disconnect();
  }
}

async function main() {
  console.log('\n🚀 SETUP DE API EXTERNAS - VORTEX');
  console.log('Configuração para N8N e outras automações');
  console.log('='.repeat(60));
  console.log(`Timestamp: ${new Date().toISOString()}`);
  
  // 1. Gerar e mostrar configuração
  const apiKey = showEnvironmentConfig();
  
  // 2. Mostrar exemplos de uso
  showApiUsageExamples(apiKey);
  
  // 3. Exemplos CURL
  const baseUrl = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3003';
  showCurlExamples(baseUrl, apiKey);
  
  // 4. Configuração N8N
  showN8nSetup(apiKey);
  
  // 5. Verificar RLS
  await checkDatabaseRLS();
  
  // 6. Testar endpoints (se disponível)
  if (process.env.EXTERNAL_API_KEY) {
    await testApiEndpoints(baseUrl, process.env.EXTERNAL_API_KEY);
  } else {
    console.log('\n⚠️  Para testar os endpoints:');
    console.log('   1. Adicione a API key ao .env.local');
    console.log('   2. Reinicie o servidor');
    console.log('   3. Execute este script novamente');
  }
  
  console.log('\n✅ SETUP CONCLUÍDO!');
  console.log('Próximos passos:');
  console.log('   1. Adicione a API key ao .env.local');
  console.log('   2. Reinicie o servidor Next.js');
  console.log('   3. Configure o N8N com os exemplos acima');
  console.log('   4. Teste com os comandos curl fornecidos');
}

// Executar apenas se chamado diretamente
if (require.main === module) {
  main().catch(console.error);
}

module.exports = {
  generateApiKey,
  showEnvironmentConfig,
  showApiUsageExamples,
  testApiEndpoints
}; 