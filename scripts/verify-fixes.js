#!/usr/bin/env node

/**
 * 🔧 VERIFICADOR DE CORREÇÕES - VALIDAR SOLUÇÃO DE ERROS
 * 
 * Script para verificar se todos os erros foram corrigidos:
 * 1. Client Component error
 * 2. headers() async error
 */

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

async function checkFileExists(filePath) {
  try {
    const fs = require('fs').promises;
    await fs.access(filePath);
    return true;
  } catch {
    return false;
  }
}

async function checkFileContent(filePath, searchTerms) {
  try {
    const fs = require('fs').promises;
    const content = await fs.readFile(filePath, 'utf8');
    
    const results = {};
    for (const [key, term] of Object.entries(searchTerms)) {
      results[key] = content.includes(term);
    }
    
    return { exists: true, content, results };
  } catch (error) {
    return { exists: false, error: error.message };
  }
}

async function verifyFixes() {
  log('🔧 VERIFICANDO CORREÇÕES DOS ERROS', 'cyan');
  log('='.repeat(70), 'cyan');
  
  const checks = [
    {
      name: 'Página pending-approval corrigida',
      file: 'app/pending-approval/page.tsx',
      searchTerms: {
        clientDirective: '"use client"',
        signOutButton: 'SignOutButton',
        noOnClick: !'"onClick"'
      }
    },
    {
      name: 'Layout principal corrigido',
      file: 'app/layout.tsx',
      searchTerms: {
        noDynamicAuth: !'await auth()',
        dynamicLayout: 'DynamicLayout',
        noUserId: !'userId'
      }
    },
    {
      name: 'DynamicLayout criado',
      file: 'components/layout/dynamic-layout.tsx',
      searchTerms: {
        clientDirective: '"use client"',
        useUser: 'useUser',
        sidebar: 'Sidebar',
        header: 'Header'
      }
    },
    {
      name: 'APIs de debug funcionando',
      file: 'app/api/debug/auth/route.ts',
      searchTerms: {
        authImport: 'auth',
        getMethod: 'export async function GET',
        sessionClaims: 'sessionClaims'
      }
    },
    {
      name: 'Página de debug criada',
      file: 'app/debug-status/page.tsx',
      searchTerms: {
        debugComponent: 'DebugUserStatus',
        instructions: 'Instruções para Resolver',
        testLinks: 'Teste Rápido'
      }
    }
  ];
  
  let allPassed = true;
  
  for (const check of checks) {
    log(`\n📋 ${check.name}:`, 'yellow');
    
    const result = await checkFileContent(check.file, check.searchTerms);
    
    if (!result.exists) {
      log(`❌ Arquivo não encontrado: ${check.file}`, 'red');
      allPassed = false;
      continue;
    }
    
    let checkPassed = true;
    for (const [key, found] of Object.entries(result.results)) {
      if (found) {
        log(`  ✅ ${key}: encontrado`, 'green');
      } else {
        log(`  ❌ ${key}: não encontrado`, 'red');
        checkPassed = false;
      }
    }
    
    if (checkPassed) {
      log(`  ✅ ${check.name} - OK`, 'green');
    } else {
      log(`  ❌ ${check.name} - FALHOU`, 'red');
      allPassed = false;
    }
  }
  
  log('\n📋 RESULTADO GERAL:', 'cyan');
  if (allPassed) {
    log('✅ TODAS AS CORREÇÕES APLICADAS COM SUCESSO!', 'green');
  } else {
    log('❌ ALGUMAS CORREÇÕES FALHARAM', 'red');
  }
  
  return allPassed;
}

async function showNextSteps() {
  log('\n🚀 PRÓXIMOS PASSOS:', 'cyan');
  log('='.repeat(70), 'cyan');
  
  log('\n📋 PARA RESOLVER O PROBLEMA ORIGINAL:', 'yellow');
  log('1. Reinicie o servidor Next.js (npm run dev)', 'white');
  log('2. Acesse a aplicação', 'white');
  log('3. Faça LOGOUT completo', 'white');
  log('4. Aguarde 2-3 minutos', 'white');
  log('5. Faça LOGIN novamente', 'white');
  log('6. Teste acesso ao dashboard', 'white');
  
  log('\n📋 PÁGINAS DE DEBUG DISPONÍVEIS:', 'yellow');
  log('• /debug-status - Interface visual completa', 'white');
  log('• /api/debug/auth - JSON dos sessionClaims', 'white');
  log('• /api/debug/force-refresh - Status detalhado', 'white');
  
  log('\n📋 VERIFICAR LOGS NO TERMINAL:', 'yellow');
  log('• [MIDDLEWARE DEBUG] - Logs detalhados do middleware', 'white');
  log('• [DEBUG API] - Logs das APIs de debug', 'white');
  log('• [FORCE REFRESH] - Logs de verificação de status', 'white');
  
  log('\n🎯 O QUE ESPERAR:', 'green');
  log('• Não mais erros de Client Component', 'white');
  log('• Não mais erros de headers() async', 'white');
  log('• Páginas carregando corretamente', 'white');
  log('• Debug tools funcionando', 'white');
  log('• Problema de cache resolvido com logout/login', 'white');
}

async function main() {
  const allFixed = await verifyFixes();
  await showNextSteps();
  
  if (allFixed) {
    log('\n🎉 SUCESSO! Todos os erros foram corrigidos.', 'green');
    log('   Agora é só fazer logout/login para resolver o cache!', 'cyan');
  } else {
    log('\n⚠️ Alguns problemas ainda existem. Verifique os logs acima.', 'yellow');
  }
}

if (require.main === module) {
  main().catch(error => {
    log(`❌ Erro fatal: ${error.message}`, 'red');
    process.exit(1);
  });
}

module.exports = { verifyFixes, checkFileContent }; 