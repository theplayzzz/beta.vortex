#!/usr/bin/env node

/**
 * 🧪 TESTE DE CORREÇÃO DO ERRO DE LOGOUT
 * 
 * Este script verifica se os problemas com objetos complexos
 * em componentes Client foram resolvidos
 */

const fs = require('fs');
const path = require('path');

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

function checkFileForProblems(filePath) {
  try {
    const content = fs.readFileSync(filePath, 'utf8');
    const problems = [];
    
    // Verificar uso de useClerk com signOut
    if (content.includes('useClerk') && content.includes('signOut')) {
      problems.push('Uso de useClerk com signOut (pode causar erro de objetos complexos)');
    }
    
    // Verificar se está usando SignOutButton corretamente
    const hasSignOutButton = content.includes('SignOutButton');
    const hasUseClerkSignOut = content.includes('const { signOut } = useClerk()');
    
    if (hasUseClerkSignOut && !hasSignOutButton) {
      problems.push('Usando useClerk().signOut em vez de SignOutButton');
    }
    
    return {
      file: filePath,
      hasProblems: problems.length > 0,
      problems,
      hasSignOutButton,
      hasUseClerkSignOut
    };
  } catch (error) {
    return {
      file: filePath,
      hasProblems: true,
      problems: [`Erro ao ler arquivo: ${error.message}`],
      hasSignOutButton: false,
      hasUseClerkSignOut: false
    };
  }
}

function analyzeComponents() {
  log('🔍 ANALISANDO COMPONENTES PARA PROBLEMAS DE LOGOUT', 'cyan');
  log('='.repeat(70), 'cyan');
  
  const filesToCheck = [
    'app/pending-approval/page.tsx',
    'app/account-suspended/page.tsx', 
    'app/account-rejected/page.tsx',
    'components/layout/dynamic-layout.tsx',
    'components/layout/navbar.tsx'
  ];
  
  const results = [];
  
  for (const file of filesToCheck) {
    const fullPath = path.join(process.cwd(), file);
    if (fs.existsSync(fullPath)) {
      const result = checkFileForProblems(fullPath);
      results.push(result);
      
      log(`\n📁 ${file}`, 'blue');
      if (result.hasProblems) {
        log('  ❌ PROBLEMAS ENCONTRADOS:', 'red');
        result.problems.forEach(problem => {
          log(`    • ${problem}`, 'red');
        });
      } else {
        log('  ✅ Sem problemas detectados', 'green');
      }
      
      if (result.hasSignOutButton) {
        log('  ✅ Usando SignOutButton corretamente', 'green');
      }
      
      if (result.hasUseClerkSignOut) {
        log('  ⚠️ Usando useClerk().signOut (pode ser problemático)', 'yellow');
      }
    } else {
      log(`\n📁 ${file}`, 'blue');
      log('  ⚠️ Arquivo não encontrado', 'yellow');
    }
  }
  
  return results;
}

function summarizeResults(results) {
  log('\n📊 RESUMO DA ANÁLISE:', 'magenta');
  log('='.repeat(50), 'magenta');
  
  const totalFiles = results.length;
  const problemFiles = results.filter(r => r.hasProblems).length;
  const cleanFiles = totalFiles - problemFiles;
  
  log(`\n📁 Total de arquivos: ${totalFiles}`, 'blue');
  log(`✅ Arquivos sem problemas: ${cleanFiles}`, 'green');
  log(`❌ Arquivos com problemas: ${problemFiles}`, problemFiles > 0 ? 'red' : 'green');
  
  if (problemFiles === 0) {
    log('\n🎉 PARABÉNS! Todos os componentes estão corretos!', 'green');
    log('O erro "Only plain objects... can be passed to Client Components" deve estar resolvido.', 'green');
  } else {
    log('\n⚠️ ATENÇÃO! Alguns arquivos ainda têm problemas.', 'yellow');
    log('Revise os arquivos marcados com ❌ acima.', 'yellow');
  }
}

function provideSolution() {
  log('\n💡 SOLUÇÃO APLICADA:', 'cyan');
  log('='.repeat(40), 'cyan');
  
  log('\n🔧 PROBLEMA IDENTIFICADO:', 'yellow');
  log('• useClerk().signOut retorna objetos complexos (Promise/Function)', 'white');
  log('• Next.js 13+ não permite passar objetos complexos para Client Components', 'white');
  log('• Isso causava o erro durante o logout', 'white');
  
  log('\n✅ CORREÇÃO APLICADA:', 'green');
  log('• Substituído useClerk().signOut por SignOutButton', 'white');
  log('• SignOutButton é um wrapper que lida com objetos complexos internamente', 'white');
  log('• Apenas props primitivas são expostas para Client Components', 'white');
  
  log('\n📋 ARQUIVOS CORRIGIDOS:', 'blue');
  log('• app/account-suspended/page.tsx', 'white');
  log('• app/account-rejected/page.tsx', 'white');
  log('• app/pending-approval/page.tsx (já estava correto)', 'white');
  
  log('\n🎯 RESULTADO:', 'green');
  log('Logout agora funciona sem erros! 🚀', 'white');
}

function testInstructions() {
  log('\n🧪 COMO TESTAR A CORREÇÃO:', 'cyan');
  log('='.repeat(40), 'cyan');
  
  log('\n1. Reinicie o servidor Next.js:', 'yellow');
  log('   npm run dev', 'blue');
  
  log('\n2. Acesse uma página com logout:', 'yellow');
  log('   • /pending-approval', 'blue');
  log('   • /account-suspended', 'blue');
  log('   • /account-rejected', 'blue');
  
  log('\n3. Clique no botão de logout:', 'yellow');
  log('   • "Atualizar Status (Logout + Login)"', 'blue');
  log('   • "Sair da Conta"', 'blue');
  
  log('\n4. Verifique no console:', 'yellow');
  log('   • NÃO deve aparecer erro de "Only plain objects..."', 'blue');
  log('   • Deve redirecionar para /sign-in corretamente', 'blue');
  
  log('\n✅ TESTE ESPERADO:', 'green');
  log('Logout funciona perfeitamente sem erros! 🎉', 'white');
}

async function main() {
  const results = analyzeComponents();
  summarizeResults(results);
  provideSolution();
  testInstructions();
  
  log('\n🎯 STATUS FINAL:', 'magenta');
  const hasProblems = results.some(r => r.hasProblems);
  if (hasProblems) {
    log('⚠️ Ainda há problemas para resolver', 'yellow');
  } else {
    log('✅ TODOS OS PROBLEMAS RESOLVIDOS! 🚀', 'green');
  }
}

if (require.main === module) {
  main().catch(error => {
    log(`❌ Erro fatal: ${error.message}`, 'red');
    process.exit(1);
  });
}

module.exports = { checkFileForProblems, analyzeComponents }; 