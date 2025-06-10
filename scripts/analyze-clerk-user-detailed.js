#!/usr/bin/env node

/**
 * 🔍 ANÁLISE DETALHADA DO USUÁRIO NO CLERK
 * 
 * Investigar discrepância entre metadata do Clerk e sessionClaims
 * Usuário específico: user_2xcFWfxqWjHinbasVVVL1j4e4aB
 */

const { createClerkClient } = require('@clerk/backend');

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

async function analyzeClerkUser() {
  log('🔍 ANÁLISE DETALHADA DO USUÁRIO NO CLERK', 'cyan');
  log('='.repeat(70), 'cyan');
  
  const clerkSecretKey = process.env.CLERK_SECRET_KEY;
  const userId = 'user_2xcFWfxqWjHinbasVVVL1j4e4aB';
  
  if (!clerkSecretKey) {
    log('❌ CLERK_SECRET_KEY não encontrada no .env', 'red');
    log('   Verifique se a chave secreta está configurada', 'yellow');
    return;
  }
  
  try {
    const clerk = createClerkClient({ secretKey: clerkSecretKey });
    
    log(`\n📋 BUSCANDO USUÁRIO: ${userId}`, 'yellow');
    
    const user = await clerk.users.getUser(userId);
    
    log('\n📋 DADOS COMPLETOS DO USUÁRIO:', 'cyan');
    log('='.repeat(50), 'cyan');
    
    // Informações básicas
    log(`ID: ${user.id}`, 'blue');
    log(`Email: ${user.emailAddresses[0]?.emailAddress}`, 'blue');
    log(`Username: ${user.username || 'N/A'}`, 'blue');
    log(`Criado em: ${user.createdAt}`, 'blue');
    log(`Atualizado em: ${user.updatedAt}`, 'blue');
    log(`Último sign-in: ${user.lastSignInAt}`, 'blue');
    
    // PUBLIC METADATA - O mais importante
    log('\n📋 PUBLIC METADATA (sessionClaims source):', 'green');
    log('='.repeat(50), 'green');
    log(JSON.stringify(user.publicMetadata, null, 2), 'white');
    
    // Verificar se metadata está vazio
    if (Object.keys(user.publicMetadata).length === 0) {
      log('🚨 PROBLEMA ENCONTRADO: publicMetadata está VAZIO!', 'red');
      log('   Isso explica por que sessionClaims tem approvalStatus: PENDING', 'red');
      log('   O middleware está lendo publicMetadata vazio', 'red');
    } else {
      log('✅ publicMetadata está populado', 'green');
    }
    
    // PRIVATE METADATA
    log('\n📋 PRIVATE METADATA:', 'yellow');
    log('='.repeat(50), 'yellow');
    log(JSON.stringify(user.privateMetadata, null, 2), 'white');
    
    // UNSAFE METADATA
    log('\n📋 UNSAFE METADATA:', 'magenta');
    log('='.repeat(50), 'magenta');
    log(JSON.stringify(user.unsafeMetadata, null, 2), 'white');
    
    // Análise detalhada do metadata esperado
    log('\n📋 ANÁLISE COMPARATIVA:', 'cyan');
    log('='.repeat(50), 'cyan');
    
    const expectedMetadata = {
      "role": "ADMIN",
      "dbUserId": "cmbmazoja000909yox6gv567p",
      "lastSync": "2025-06-07T15:12:56.214Z",
      "debugSource": "admin-middleware-fix",
      "forceUpdate": true,
      "forceRefresh": 1749310766302,
      "lastDebugFix": "2025-06-07T15:13:52.222Z",
      "approvalStatus": "APPROVED",
      "lastForceRefresh": "2025-06-07T15:57:46.492Z",
      "sessionRefreshToken": 1749311866492
    };
    
    log('METADATA ESPERADO:', 'green');
    log(JSON.stringify(expectedMetadata, null, 2), 'white');
    
    log('\nMETADATA ATUAL:', 'red');
    log(JSON.stringify(user.publicMetadata, null, 2), 'white');
    
    // Comparação campo por campo
    log('\n📋 COMPARAÇÃO CAMPO POR CAMPO:', 'yellow');
    for (const [key, expectedValue] of Object.entries(expectedMetadata)) {
      const actualValue = user.publicMetadata[key];
      const matches = actualValue === expectedValue;
      
      if (matches) {
        log(`✅ ${key}: ${actualValue} (correto)`, 'green');
      } else {
        log(`❌ ${key}: esperado="${expectedValue}", atual="${actualValue}"`, 'red');
      }
    }
    
    // Verificar se precisa atualizar
    const needsUpdate = Object.keys(user.publicMetadata).length === 0 ||
                       user.publicMetadata.approvalStatus !== 'APPROVED';
    
    if (needsUpdate) {
      log('\n🔧 APLICANDO CORREÇÃO AUTOMÁTICA...', 'yellow');
      
      try {
        await clerk.users.updateUser(userId, {
          publicMetadata: expectedMetadata
        });
        
        log('✅ Metadata atualizado com sucesso!', 'green');
        log('   O usuário deve fazer logout/login para ver as mudanças', 'cyan');
        
        // Verificar se foi atualizado
        const updatedUser = await clerk.users.getUser(userId);
        log('\n📋 METADATA APÓS ATUALIZAÇÃO:', 'green');
        log(JSON.stringify(updatedUser.publicMetadata, null, 2), 'white');
        
      } catch (updateError) {
        log(`❌ Erro ao atualizar metadata: ${updateError.message}`, 'red');
      }
    } else {
      log('\n✅ Metadata já está correto', 'green');
    }
    
  } catch (error) {
    log(`❌ Erro ao conectar com Clerk: ${error.message}`, 'red');
    log(`   Stack: ${error.stack}`, 'red');
  }
}

async function analyzeSessionClaimsIssue() {
  log('\n🔍 ANÁLISE DO PROBLEMA DE SESSION CLAIMS', 'cyan');
  log('='.repeat(70), 'cyan');
  
  log('\n📋 POSSÍVEIS CAUSAS DO PROBLEMA:', 'yellow');
  log('1. Metadata foi perdido durante alguma operação', 'white');
  log('2. Webhook não funcionou corretamente', 'white');
  log('3. Múltiplas atualizações conflitantes', 'white');
  log('4. Cache do Clerk não sincronizado', 'white');
  log('5. Problema na configuração do JWT template', 'white');
  
  log('\n📋 BASEADO NA DOCUMENTAÇÃO DO CLERK:', 'yellow');
  log('• sessionClaims são derivados do publicMetadata', 'white');
  log('• JWT tokens têm cache que pode durar minutos', 'white');
  log('• publicMetadata é a fonte da verdade para sessionClaims', 'white');
  log('• Mudanças no metadata requerem novo login para atualizar JWT', 'white');
  
  log('\n📋 SOLUÇÃO IMEDIATA:', 'green');
  log('1. Corrigir publicMetadata (feito automaticamente acima)', 'white');
  log('2. Usuário fazer LOGOUT completo', 'white');
  log('3. Aguardar 2-3 minutos', 'white');
  log('4. Usuário fazer LOGIN novamente', 'white');
  log('5. sessionClaims serão atualizados automaticamente', 'white');
  
  log('\n📋 CONFIGURAÇÃO JWT TEMPLATE RECOMENDADA:', 'cyan');
  log('JSON para Custom Claims no Clerk Dashboard:', 'white');
  log('```json', 'blue');
  log(JSON.stringify({
    "metadata": "{{user.public_metadata}}"
  }, null, 2), 'blue');
  log('```', 'blue');
}

async function main() {
  await analyzeClerkUser();
  await analyzeSessionClaimsIssue();
  
  log('\n🎯 RESUMO EXECUTIVO:', 'magenta');
  log('='.repeat(70), 'magenta');
  log('• CAUSA: publicMetadata vazio ou incorreto no Clerk', 'white');
  log('• EFEITO: sessionClaims com approvalStatus PENDING', 'white');
  log('• SOLUÇÃO: Corrigir metadata + logout/login obrigatório', 'white');
  log('• PREVENÇÃO: Monitorar webhook e metadata consistency', 'white');
  
  log('\n🚀 PRÓXIMOS PASSOS:', 'cyan');
  log('1. Metadata foi corrigido automaticamente (se necessário)', 'white');
  log('2. Usuário deve fazer LOGOUT da aplicação', 'white');
  log('3. Aguardar 2-3 minutos para cache expirar', 'white');
  log('4. Usuário fazer LOGIN novamente', 'white');
  log('5. Testar acesso ao dashboard - deve funcionar!', 'white');
}

if (require.main === module) {
  main().catch(error => {
    log(`❌ Erro fatal: ${error.message}`, 'red');
    process.exit(1);
  });
}

module.exports = { analyzeClerkUser, analyzeSessionClaimsIssue }; 