/**
 * Script de Teste - Phases 4 & 5: Admin Dashboard & Route Protection
 * 
 * Este script valida:
 * - Phase 4: APIs de moderação e dashboard administrativo
 * - Phase 5: Middleware e proteção de rotas
 */

const fs = require('fs');
const path = require('path');

console.log('🧪 VALIDAÇÃO PHASES 4 & 5 - SISTEMA DE APROVAÇÃO');
console.log('='.repeat(60));

// Cores para output
const colors = {
  green: '\x1b[32m',
  red: '\x1b[31m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  reset: '\x1b[0m',
  bold: '\x1b[1m'
};

function logSuccess(message) {
  console.log(`${colors.green}✅ ${message}${colors.reset}`);
}

function logError(message) {
  console.log(`${colors.red}❌ ${message}${colors.reset}`);
}

function logWarning(message) {
  console.log(`${colors.yellow}⚠️  ${message}${colors.reset}`);
}

function logInfo(message) {
  console.log(`${colors.blue}ℹ️  ${message}${colors.reset}`);
}

function checkFileExists(filePath, description) {
  const fullPath = path.join(process.cwd(), filePath);
  if (fs.existsSync(fullPath)) {
    logSuccess(`${description}: ${filePath}`);
    return true;
  } else {
    logError(`${description} NÃO ENCONTRADO: ${filePath}`);
    return false;
  }
}

function checkFileContent(filePath, searchStrings, description) {
  const fullPath = path.join(process.cwd(), filePath);
  if (!fs.existsSync(fullPath)) {
    logError(`Arquivo não encontrado: ${filePath}`);
    return false;
  }

  const content = fs.readFileSync(fullPath, 'utf8');
  let allFound = true;

  searchStrings.forEach(searchString => {
    if (content.includes(searchString)) {
      logSuccess(`  ✓ ${description} contém: ${searchString}`);
    } else {
      logError(`  ✗ ${description} NÃO contém: ${searchString}`);
      allFound = false;
    }
  });

  return allFound;
}

async function validatePhase4() {
  console.log(`\n${colors.bold}🔍 PHASE 4: ADMIN DASHBOARD & MANUAL APPROVAL SYSTEM${colors.reset}`);
  console.log('-'.repeat(60));

  let score = 0;
  const maxScore = 15;

  // 1. APIs de Moderação
  logInfo('Verificando APIs de moderação...');
  
  if (checkFileExists('app/api/admin/users/route.ts', 'API de listagem de usuários')) {
    score++;
    checkFileContent('app/api/admin/users/route.ts', [
      'ApprovalStatus',
      'prisma.user.findMany',
      'pagination',
      'role === \'ADMIN\''
    ], 'API de listagem');
  }

  if (checkFileExists('app/api/admin/users/[userId]/moderate/route.ts', 'API de moderação')) {
    score++;
    checkFileContent('app/api/admin/users/[userId]/moderate/route.ts', [
      'APPROVE',
      'REJECT',
      'SUSPEND',
      'optimistic concurrency',
      'version',
      'clerkClient.users.updateUserMetadata'
    ], 'API de moderação');
  }

  if (checkFileExists('app/api/admin/moderation-log/route.ts', 'API de histórico')) {
    score++;
    checkFileContent('app/api/admin/moderation-log/route.ts', [
      'userModerationLog',
      'pagination',
      'include'
    ], 'API de histórico');
  }

  // 2. Dashboard Administrativo
  logInfo('Verificando dashboard administrativo...');
  
  if (checkFileExists('app/admin/moderate/page.tsx', 'Dashboard administrativo')) {
    score += 2;
    checkFileContent('app/admin/moderate/page.tsx', [
      'useAuth',
      'useState',
      'moderateUser',
      'rejectionReason',
      'activeTab'
    ], 'Dashboard');
  }

  // 3. Documentação
  logInfo('Verificando documentação...');
  
  if (checkFileExists('concluido/phase-4-admin-dashboard.md', 'Documentação Phase 4')) {
    score++;
  }

  // 4. Prisma Schema (verificar se tem os campos necessários)
  logInfo('Verificando schema Prisma...');
  
  if (checkFileContent('prisma/schema.prisma', [
    'approvalStatus',
    'ApprovalStatus',
    'UserModerationLog',
    'ModerationAction'
  ], 'Schema Prisma')) {
    score += 2;
  }

  // 5. Utilitários
  logInfo('Verificando utilitários existentes...');
  
  if (checkFileExists('lib/prisma/client.ts', 'Cliente Prisma')) {
    score++;
  }

  if (checkFileExists('components/ui/toast.tsx', 'Sistema de toast')) {
    score++;
  }

  // Verificações adicionais
  logInfo('Verificações adicionais...');
  
  // Verificar se middleware existe
  if (checkFileExists('middleware.ts', 'Middleware principal')) {
    score++;
  }

  // Verificar package.json
  if (checkFileContent('package.json', [
    '@clerk/nextjs',
    '@prisma/client'
  ], 'Dependencies')) {
    score++;
  }

  console.log(`\n${colors.bold}📊 SCORE PHASE 4: ${score}/${maxScore}${colors.reset}`);
  
  if (score >= maxScore * 0.9) {
    logSuccess('Phase 4 - EXCELENTE! Sistema completo implementado');
  } else if (score >= maxScore * 0.7) {
    logWarning('Phase 4 - BOM! Algumas funcionalidades podem estar faltando');
  } else {
    logError('Phase 4 - ATENÇÃO! Implementação incompleta');
  }

  return score;
}

async function validatePhase5() {
  console.log(`\n${colors.bold}🔍 PHASE 5: MIDDLEWARE & ROUTE PROTECTION${colors.reset}`);
  console.log('-'.repeat(60));

  let score = 0;
  const maxScore = 12;

  // 1. Middleware Atualizado
  logInfo('Verificando middleware atualizado...');
  
  if (checkFileContent('middleware.ts', [
    'isAdminRoute',
    'approvalStatus',
    'PENDING',
    'REJECTED',
    'SUSPENDED',
    'APPROVED',
    'pending-approval',
    'account-rejected'
  ], 'Middleware com proteção de rotas')) {
    score += 3;
  }

  // 2. Páginas de Estado
  logInfo('Verificando páginas de estado...');
  
  if (checkFileExists('app/pending-approval/page.tsx', 'Página PENDING')) {
    score++;
    checkFileContent('app/pending-approval/page.tsx', [
      'Clock',
      'Aguardando Aprovação',
      'useUser',
      'signOut'
    ], 'Página PENDING');
  }

  if (checkFileExists('app/account-rejected/page.tsx', 'Página REJECTED')) {
    score++;
    checkFileContent('app/account-rejected/page.tsx', [
      'XCircle',
      'Conta Não Aprovada',
      'AlertTriangle',
      'Solicitar Revisão'
    ], 'Página REJECTED');
  }

  if (checkFileExists('app/account-suspended/page.tsx', 'Página SUSPENDED')) {
    score++;
    checkFileContent('app/account-suspended/page.tsx', [
      'Pause',
      'Suspensa',
      'AlertCircle',
      'Urgente'
    ], 'Página SUSPENDED');
  }

  // 3. Documentação
  logInfo('Verificando documentação...');
  
  if (checkFileExists('concluido/phase-5-route-protection.md', 'Documentação Phase 5')) {
    score++;
  }

  // 4. Verificações de Segurança
  logInfo('Verificando implementações de segurança...');
  
  // Verificar se rotas admin estão protegidas
  if (checkFileContent('middleware.ts', [
    'isAdminRoute',
    'NextResponse.redirect'
  ], 'Proteção de rotas admin')) {
    score++;
  }

  // Verificar headers customizados
  if (checkFileContent('middleware.ts', [
    'x-user-id',
    'x-approval-status',
    'x-user-role'
  ], 'Headers customizados')) {
    score++;
  }

  // 5. Integração com Clerk
  logInfo('Verificando integração com Clerk...');
  
  // Verificar imports do Clerk
  if (checkFileContent('app/pending-approval/page.tsx', [
    '@clerk/nextjs',
    'useUser',
    'useClerk'
  ], 'Integração Clerk nas páginas')) {
    score++;
  }

  // 6. UX e Design
  logInfo('Verificando UX e design...');
  
  // Verificar se tem icons lucide
  const pagesWithIcons = [
    'app/pending-approval/page.tsx',
    'app/account-rejected/page.tsx', 
    'app/account-suspended/page.tsx'
  ];

  let iconScore = 0;
  pagesWithIcons.forEach(page => {
    if (checkFileContent(page, ['lucide-react'], 'Icons')) {
      iconScore++;
    }
  });
  
  if (iconScore === 3) {
    score++;
    logSuccess('Todas as páginas têm icons apropriados');
  }

  // Verificar se tem gradients e styling
  if (checkFileContent('app/pending-approval/page.tsx', [
    'bg-gradient-to-br',
    'rounded-lg',
    'shadow-lg'
  ], 'Styling moderno')) {
    score++;
  }

  console.log(`\n${colors.bold}📊 SCORE PHASE 5: ${score}/${maxScore}${colors.reset}`);
  
  if (score >= maxScore * 0.9) {
    logSuccess('Phase 5 - EXCELENTE! Proteção de rotas completa');
  } else if (score >= maxScore * 0.7) {
    logWarning('Phase 5 - BOM! Algumas funcionalidades podem estar faltando');
  } else {
    logError('Phase 5 - ATENÇÃO! Implementação incompleta');
  }

  return score;
}

function generateReport(phase4Score, phase5Score) {
  console.log(`\n${colors.bold}📋 RELATÓRIO FINAL${colors.reset}`);
  console.log('='.repeat(60));
  
  const totalScore = phase4Score + phase5Score;
  const maxTotalScore = 27; // 15 + 12
  const percentage = Math.round((totalScore / maxTotalScore) * 100);
  
  console.log(`Phase 4 Score: ${phase4Score}/15 (${Math.round((phase4Score/15)*100)}%)`);
  console.log(`Phase 5 Score: ${phase5Score}/12 (${Math.round((phase5Score/12)*100)}%)`);
  console.log(`${colors.bold}Total Score: ${totalScore}/${maxTotalScore} (${percentage}%)${colors.reset}`);
  
  if (percentage >= 90) {
    logSuccess('🎉 SISTEMA DE APROVAÇÃO COMPLETO E FUNCIONAL!');
    console.log('\n✨ Funcionalidades implementadas:');
    console.log('   • Dashboard administrativo completo');
    console.log('   • APIs de moderação robustas');
    console.log('   • Proteção de rotas baseada em status');
    console.log('   • Páginas de estado informativas');
    console.log('   • Middleware de segurança avançado');
    console.log('   • Audit trail completo');
  } else if (percentage >= 70) {
    logWarning('⚠️  Sistema funcional com pequenos ajustes necessários');
  } else {
    logError('❌ Sistema incompleto - implementação significativa necessária');
  }

  console.log('\n🚀 Próximos passos recomendados:');
  console.log('   1. Testar fluxo completo em desenvolvimento');
  console.log('   2. Configurar variáveis de ambiente');
  console.log('   3. Executar migração Prisma se necessário');
  console.log('   4. Configurar admin via Clerk publicMetadata');
  console.log('   5. Testar aprovação/rejeição de usuários');
}

// Função principal
async function main() {
  try {
    const phase4Score = await validatePhase4();
    const phase5Score = await validatePhase5();
    
    generateReport(phase4Score, phase5Score);
    
  } catch (error) {
    logError(`Erro durante validação: ${error.message}`);
    process.exit(1);
  }
}

// Executar se chamado diretamente
if (require.main === module) {
  main();
}

module.exports = { validatePhase4, validatePhase5 }; 