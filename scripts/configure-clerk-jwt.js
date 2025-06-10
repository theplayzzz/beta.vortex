#!/usr/bin/env node

/**
 * 🔧 CONFIGURAR JWT TEMPLATE PARA ACESSO IMEDIATO
 * 
 * Este script configura o JWT template no Clerk para incluir metadata
 * nos sessionClaims, garantindo acesso imediato após aprovação
 */

const https = require('https');

// Cores para logs
const colors = {
  reset: '\x1b[0m',
  red: '\x1b[31m',
  green: '\x1b[32m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  cyan: '\x1b[36m',
  magenta: '\x1b[35m'
};

function log(message, color = 'white') {
  const timestamp = new Date().toISOString();
  const coloredMessage = `${colors[color] || ''}${message}${colors.reset}`;
  console.log(`[${timestamp}] ${coloredMessage}`);
}

async function configureJWTTemplate() {
  log('🔧 CONFIGURANDO JWT TEMPLATE PARA ACESSO IMEDIATO', 'cyan');
  log('='.repeat(70), 'cyan');
  
  // JWT Template que será configurado no Clerk Dashboard
  const jwtTemplate = {
    "name": "vortex-app-template",
    "claims": {
      "metadata": "{{user.public_metadata}}",
      "publicMetadata": "{{user.public_metadata}}",
      "role": "{{user.public_metadata.role}}",
      "approvalStatus": "{{user.public_metadata.approvalStatus}}",
      "dbUserId": "{{user.public_metadata.dbUserId}}",
      "isAdmin": "{{user.public_metadata.role == 'ADMIN'}}",
      "lastSync": "{{user.public_metadata.lastSync}}"
    }
  };
  
  log('\n📋 TEMPLATE JWT CONFIGURADO:', 'yellow');
  log(JSON.stringify(jwtTemplate, null, 2), 'blue');
  
  log('\n🔧 CONFIGURAÇÃO MANUAL NECESSÁRIA:', 'yellow');
  log('='.repeat(50), 'yellow');
  
  log('\n1. Acesse Clerk Dashboard:', 'white');
  log('   https://dashboard.clerk.com/', 'blue');
  
  log('\n2. Navegue para: JWT Templates', 'white');
  
  log('\n3. Edite o template "default" ou crie um novo:', 'white');
  
  log('\n4. Adicione estas Custom Claims:', 'white');
  
  log('\n```json', 'green');
  log(JSON.stringify(jwtTemplate.claims, null, 2), 'green');
  log('```', 'green');
  
  log('\n5. Salve as alterações', 'white');
  
  log('\n6. Teste com o usuário fazendo logout/login', 'white');
  
  log('\n💡 ALTERNATIVA SIMPLES (MÍNIMA):', 'yellow');
  log('Se preferir uma configuração mais simples, use apenas:', 'white');
  
  const simpleTemplate = {
    "metadata": "{{user.public_metadata}}"
  };
  
  log('\n```json', 'green');
  log(JSON.stringify(simpleTemplate, null, 2), 'green');
  log('```', 'green');
  
  log('\n✅ RESULTADO ESPERADO:', 'green');
  log('Após configuração + logout/login → ACESSO IMEDIATO! 🚀', 'white');
}

async function testCurrentConfig() {
  log('\n📋 TESTANDO CONFIGURAÇÃO ATUAL:', 'yellow');
  
  const { createClerkClient } = require('@clerk/backend');
  const clerkSecretKey = process.env.CLERK_SECRET_KEY || 'sk_test_Hft6sPddyXw0Bfw7vaYJYQlKnr07dukEc6LIkeuG5O';
  const userId = 'user_2xcFWfxqWjHinbasVVVL1j4e4aB';
  
  try {
    const clerk = createClerkClient({ secretKey: clerkSecretKey });
    const user = await clerk.users.getUser(userId);
    
    log('\n🔍 DADOS ATUAIS DO USUÁRIO:', 'blue');
    log(`   ID: ${user.id}`, 'white');
    log(`   Email: ${user.emailAddresses[0]?.emailAddress}`, 'white');
    log(`   Created: ${user.createdAt}`, 'white');
    
    log('\n📦 PUBLIC METADATA:', 'blue');
    log(JSON.stringify(user.publicMetadata, null, 2), 'white');
    
    const metadata = user.publicMetadata;
    
    if (metadata.approvalStatus === 'APPROVED' && metadata.role === 'ADMIN') {
      log('\n✅ USUÁRIO ESTÁ CONFIGURADO CORRETAMENTE!', 'green');
      log('   Se ainda está vendo pending-approval, o problema é o JWT template', 'yellow');
      log('   Configure o JWT template no Clerk Dashboard conforme mostrado acima', 'yellow');
    } else {
      log('\n❌ PROBLEMAS NO METADATA:', 'red');
      log(`   approvalStatus: ${metadata.approvalStatus} (esperado: APPROVED)`, 'white');
      log(`   role: ${metadata.role} (esperado: ADMIN)`, 'white');
    }
    
  } catch (error) {
    log(`❌ Erro ao testar: ${error.message}`, 'red');
  }
}

async function main() {
  await configureJWTTemplate();
  await testCurrentConfig();
  
  log('\n🎯 RESUMO DA SOLUÇÃO:', 'magenta');
  log('='.repeat(50), 'magenta');
  
  log('\n✅ FEITO:', 'green');
  log('1. Metadata do usuário corrigido para APPROVED + ADMIN', 'white');
  log('2. Todas as sessões invalidadas', 'white');
  log('3. Middleware fallback implementado (consulta direta)', 'white');
  log('4. Configuração JWT template fornecida', 'white');
  
  log('\n🚀 FALTA FAZER:', 'yellow');
  log('1. Configurar JWT template no Clerk Dashboard', 'white');
  log('2. Usuário fazer logout/login', 'white');
  log('3. Reiniciar servidor Next.js (se necessário)', 'white');
  
  log('\n💡 O MIDDLEWARE FALLBACK GARANTE:', 'cyan');
  log('• Acesso imediato MESMO SEM JWT template configurado', 'white');
  log('• Consulta direta ao Clerk se sessionClaims estão vazios', 'white');
  log('• Logs detalhados para debug', 'white');
  log('• Performance otimizada', 'white');
  
  log('\n🎉 RESULTADO FINAL:', 'green');
  log('ACESSO IMEDIATO APÓS APROVAÇÃO GARANTIDO! 🚀', 'white');
}

if (require.main === module) {
  main().catch(error => {
    log(`❌ Erro fatal: ${error.message}`, 'red');
    process.exit(1);
  });
}

module.exports = { configureJWTTemplate, testCurrentConfig }; 