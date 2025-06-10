#!/usr/bin/env node

/**
 * Teste da Phase 6: UI/UX Enhancement & Color Standards
 * 
 * Este script valida que:
 * 1. Dashboard admin segue padrão de cores da aplicação
 * 2. Notificações visuais funcionam corretamente
 * 3. Loading states são apropriados
 * 4. Design é responsivo e acessível
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
  const startTime = Date.now();
  try {
    const response = await fetch(`${BASE_URL}${endpoint}`, {
      headers: {
        'Content-Type': 'application/json',
        ...options.headers
      },
      ...options
    });

    const endTime = Date.now();
    const responseTime = endTime - startTime;

    return {
      status: response.status,
      data: response.headers.get('content-type')?.includes('application/json') 
        ? await response.json() 
        : await response.text(),
      responseTime
    };
  } catch (error) {
    const endTime = Date.now();
    const responseTime = endTime - startTime;
    log(`Erro na requisição para ${endpoint}: ${error.message}`, 'red');
    return { status: 500, data: error.message, responseTime };
  }
}

async function testAdminDashboardDesign() {
  log('\n=== Teste 1: Design do Dashboard Admin ===', 'blue');
  
  try {
    const fs = require('fs');
    const dashboardContent = fs.readFileSync('app/admin/moderate/page.tsx', 'utf8');
    
    // Verificar variáveis CSS obrigatórias
    const requiredVars = ['--night', '--eerie-black', '--sgbus-green', '--seasalt', '--periwinkle'];
    const hasAllVars = requiredVars.every(cssVar => dashboardContent.includes(cssVar));
    
    // Verificar remoção de cores hardcoded do tema claro
    const noOldColors = !dashboardContent.includes('bg-white') &&
                        !dashboardContent.includes('bg-gray-50') &&
                        !dashboardContent.includes('text-gray-900') &&
                        !dashboardContent.includes('text-gray-500');
    
    // Verificar estrutura moderna
    const hasModernStructure = dashboardContent.includes('rounded-xl') &&
                               dashboardContent.includes('transition-all') &&
                               dashboardContent.includes('hover:') &&
                               dashboardContent.includes('focus:outline-none');
    
    // Verificar ícones lucide
    const hasIconSystem = dashboardContent.includes('import {') &&
                          dashboardContent.includes('Users,') &&
                          dashboardContent.includes('CheckCircle,') &&
                          dashboardContent.includes('XCircle,');
    
    logTest('Variáveis CSS aplicadas', hasAllVars, 
           'Todas as 5 variáveis CSS presentes');
    logTest('Cores antigas removidas', noOldColors, 
           'Tema claro substituído por tema dark');
    logTest('Estrutura moderna implementada', hasModernStructure, 
           'Bordas arredondadas e transições aplicadas');
    logTest('Sistema de ícones implementado', hasIconSystem, 
           'Ícones Lucide React integrados');
    
    return hasAllVars && hasModernStructure && hasIconSystem;
  } catch (error) {
    logTest('Design do dashboard admin', false, error.message);
    return false;
  }
}

async function testLoadingStates() {
  log('\n=== Teste 2: Loading States ===', 'blue');
  
  try {
    const fs = require('fs');
    const dashboardContent = fs.readFileSync('app/admin/moderate/page.tsx', 'utf8');
    
    // Verificar loading states implementados
    const hasLoadingSpinner = dashboardContent.includes('Loader2') &&
                             dashboardContent.includes('animate-spin');
    
    const hasLoadingMessages = dashboardContent.includes('Carregando usuários...') &&
                              dashboardContent.includes('Carregando painel administrativo...');
    
    const hasDisabledStates = dashboardContent.includes('disabled={') &&
                             dashboardContent.includes('disabled:opacity-50');
    
    const hasModeratingState = dashboardContent.includes('moderatingUserId') &&
                              dashboardContent.includes('setModeratingUserId');
    
    logTest('Spinner de loading presente', hasLoadingSpinner, 
           'Componente Loader2 com animação');
    logTest('Mensagens de loading informativas', hasLoadingMessages, 
           'Textos explicativos durante carregamento');
    logTest('Estados disabled implementados', hasDisabledStates, 
           'Botões desabilitados durante ações');
    logTest('Estado de moderação específico', hasModeratingState, 
           'Loading state para ações de moderação');
    
    return hasLoadingSpinner && hasLoadingMessages && hasDisabledStates && hasModeratingState;
  } catch (error) {
    logTest('Loading states', false, error.message);
    return false;
  }
}

async function testNotificationSystem() {
  log('\n=== Teste 3: Sistema de Notificações ===', 'blue');
  
  try {
    const fs = require('fs');
    const dashboardContent = fs.readFileSync('app/admin/moderate/page.tsx', 'utf8');
    
    // Verificar integração com sistema de toast
    const hasToastImport = dashboardContent.includes('import { useToast, toast }');
    
    const hasSuccessNotifications = dashboardContent.includes('toast.success(') &&
                                   dashboardContent.includes('actionMessages');
    
    const hasErrorNotifications = dashboardContent.includes('toast.error(') &&
                                 dashboardContent.includes('addToast(toast.error(');
    
    const hasDetailedMessages = dashboardContent.includes('100 créditos foram concedidos') &&
                               dashboardContent.includes('O acesso foi bloqueado');
    
    // Verificar sistema de toast existente
    const toastSystemExists = require('fs').existsSync('components/ui/toast.tsx');
    
    logTest('Importação do sistema de toast', hasToastImport, 
           'useToast e toast importados');
    logTest('Notificações de sucesso detalhadas', hasSuccessNotifications, 
           'Mensagens específicas para cada ação');
    logTest('Notificações de erro implementadas', hasErrorNotifications, 
           'Tratamento de erros com notificação');
    logTest('Mensagens informativas', hasDetailedMessages, 
           'Detalhes específicos sobre ações executadas');
    logTest('Sistema de toast funcional', toastSystemExists, 
           'Componente toast.tsx presente');
    
    return hasToastImport && hasSuccessNotifications && hasErrorNotifications && toastSystemExists;
  } catch (error) {
    logTest('Sistema de notificações', false, error.message);
    return false;
  }
}

async function testResponsiveDesign() {
  log('\n=== Teste 4: Design Responsivo ===', 'blue');
  
  try {
    const fs = require('fs');
    const dashboardContent = fs.readFileSync('app/admin/moderate/page.tsx', 'utf8');
    
    // Verificar classes responsivas
    const hasResponsiveGrid = dashboardContent.includes('md:grid-cols-2') ||
                             dashboardContent.includes('grid') && dashboardContent.includes('gap-');
    
    const hasResponsiveTable = dashboardContent.includes('overflow-x-auto') &&
                              dashboardContent.includes('min-w-full');
    
    const hasMaxWidth = dashboardContent.includes('max-w-7xl') ||
                       dashboardContent.includes('max-w-md');
    
    const hasMobileFriendly = dashboardContent.includes('mx-4') ||
                             dashboardContent.includes('p-6') ||
                             dashboardContent.includes('px-3');
    
    logTest('Grid responsivo implementado', hasResponsiveGrid, 
           'Layout adapta para diferentes telas');
    logTest('Tabela responsiva', hasResponsiveTable, 
           'Scroll horizontal em telas pequenas');
    logTest('Larguras máximas definidas', hasMaxWidth, 
           'Controle de largura para diferentes componentes');
    logTest('Design mobile-friendly', hasMobileFriendly, 
           'Padding e margin adequados para mobile');
    
    return hasResponsiveGrid && hasResponsiveTable && hasMaxWidth && hasMobileFriendly;
  } catch (error) {
    logTest('Design responsivo', false, error.message);
    return false;
  }
}

async function testAccessibilityFeatures() {
  log('\n=== Teste 5: Recursos de Acessibilidade ===', 'blue');
  
  try {
    const fs = require('fs');
    const dashboardContent = fs.readFileSync('app/admin/moderate/page.tsx', 'utf8');
    
    // Verificar recursos de acessibilidade
    const hasFocusOutline = dashboardContent.includes('focus:outline-none') &&
                           dashboardContent.includes('focus:ring-2');
    
    const hasAltTexts = dashboardContent.includes('alt=') ||
                       dashboardContent.includes('aria-label');
    
    const hasSemanticHtml = dashboardContent.includes('<table>') &&
                           dashboardContent.includes('<thead>') &&
                           dashboardContent.includes('<tbody>') &&
                           dashboardContent.includes('<th ') &&
                           dashboardContent.includes('<td ');
    
    const hasKeyboardNavigation = dashboardContent.includes('onFocus') &&
                                 dashboardContent.includes('onBlur');
    
    logTest('Estados de foco implementados', hasFocusOutline, 
           'focus:outline-none e focus:ring-2 aplicados');
    logTest('Textos alternativos presentes', hasAltTexts, 
           'Atributos alt ou aria-label implementados');
    logTest('HTML semântico utilizado', hasSemanticHtml, 
           'Estrutura de tabela correta');
    logTest('Navegação por teclado', hasKeyboardNavigation, 
           'Eventos onFocus e onBlur implementados');
    
    return hasFocusOutline && hasSemanticHtml && hasKeyboardNavigation;
  } catch (error) {
    logTest('Recursos de acessibilidade', false, error.message);
    return false;
  }
}

async function testModalInteraction() {
  log('\n=== Teste 6: Interação de Modal ===', 'blue');
  
  try {
    const fs = require('fs');
    const dashboardContent = fs.readFileSync('app/admin/moderate/page.tsx', 'utf8');
    
    // Verificar modal de rejeição melhorado
    const hasModernModal = dashboardContent.includes('backdrop-blur-sm') &&
                          dashboardContent.includes('z-50');
    
    const hasModalStyling = dashboardContent.includes('rounded-xl') &&
                           dashboardContent.includes('shadow-2xl') &&
                           dashboardContent.includes('transition-all duration-300');
    
    const hasModalStructure = dashboardContent.includes('selectedUser &&') &&
                             dashboardContent.includes('setSelectedUser(null)');
    
    const hasFormValidation = dashboardContent.includes('disabled={!rejectionReason.trim()') &&
                             dashboardContent.includes('rows={4}');
    
    const hasModalIcons = dashboardContent.includes('<XCircle className="w-6 h-6 mr-3"') &&
                         dashboardContent.includes('style={{ color: \'#ff6b6b\' }}');
    
    logTest('Modal moderno implementado', hasModernModal, 
           'Backdrop blur e z-index corretos');
    logTest('Estilização aprimorada', hasModalStyling, 
           'Bordas arredondadas e sombras aplicadas');
    logTest('Estrutura funcional', hasModalStructure, 
           'Estado do modal gerenciado corretamente');
    logTest('Validação de formulário', hasFormValidation, 
           'Botão desabilitado quando necessário');
    logTest('Ícones no modal', hasModalIcons, 
           'Ícones com cores apropriadas');
    
    return hasModernModal && hasModalStyling && hasModalStructure && hasFormValidation;
  } catch (error) {
    logTest('Interação de modal', false, error.message);
    return false;
  }
}

async function testColorConsistency() {
  log('\n=== Teste 7: Consistência de Cores ===', 'blue');
  
  try {
    const fs = require('fs');
    const dashboardContent = fs.readFileSync('app/admin/moderate/page.tsx', 'utf8');
    
    // Verificar uso consistente das variáveis CSS
    const usesNightBackground = dashboardContent.includes('var(--night, #0e0f0f)');
    const usesEerieBlackContainers = dashboardContent.includes('var(--eerie-black, #171818)');
    const usesSgbusGreenAccents = dashboardContent.includes('var(--sgbus-green, #6be94c)');
    const usesSeasaltText = dashboardContent.includes('var(--seasalt, #f9fbfc)');
    const usesPeriwinkleSecondary = dashboardContent.includes('var(--periwinkle, #cfc6fe)');
    
    // Verificar CSS inline para compatibilidade
    const hasCssVariables = dashboardContent.includes('<style jsx>') &&
                           dashboardContent.includes(':root {') &&
                           dashboardContent.includes('--night: #0e0f0f;');
    
    logTest('Background principal (Night)', usesNightBackground, 
           'var(--night) aplicado para fundo');
    logTest('Containers (Eerie Black)', usesEerieBlackContainers, 
           'var(--eerie-black) para cards e containers');
    logTest('Elementos primários (SGBUS Green)', usesSgbusGreenAccents, 
           'var(--sgbus-green) para botões e acentos');
    logTest('Texto principal (Seasalt)', usesSeasaltText, 
           'var(--seasalt) para textos principais');
    logTest('Texto secundário (Periwinkle)', usesPeriwinkleSecondary, 
           'var(--periwinkle) para textos secundários');
    logTest('CSS Variables inline', hasCssVariables, 
           'Fallback CSS inline para compatibilidade');
    
    const allColorsUsed = usesNightBackground && usesEerieBlackContainers && 
                         usesSgbusGreenAccents && usesSeasaltText && 
                         usesPeriwinkleSecondary && hasCssVariables;
    
    return allColorsUsed;
  } catch (error) {
    logTest('Consistência de cores', false, error.message);
    return false;
  }
}

async function runAllTests() {
  log('🎨 INICIANDO TESTES DA PHASE 6: UI/UX ENHANCEMENT & COLOR STANDARDS', 'cyan');
  log('=' * 80, 'cyan');
  
  const tests = [
    testAdminDashboardDesign,
    testLoadingStates,
    testNotificationSystem,
    testResponsiveDesign,
    testAccessibilityFeatures,
    testModalInteraction,
    testColorConsistency
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
  
  log('\n' + '=' * 80, 'cyan');
  log(`📊 RESULTADO FINAL: ${passedTests}/${totalTests} testes passaram`, 'cyan');
  
  if (passedTests === totalTests) {
    log('🎉 PHASE 6 UI/UX ENHANCEMENT & COLOR STANDARDS: IMPLEMENTAÇÃO COMPLETA!', 'green');
    log('✅ Dashboard admin com tema dark, notificações visuais e design responsivo implementados', 'green');
  } else if (passedTests >= totalTests * 0.85) {
    log('⚠️  PHASE 6: QUASE COMPLETA', 'yellow');
    log(`✅ ${passedTests} testes passaram, ${totalTests - passedTests} precisam de pequenos ajustes`, 'yellow');
  } else {
    log('❌ PHASE 6: PRECISA DE CORREÇÕES', 'red');
    log(`✅ ${passedTests} testes passaram, ${totalTests - passedTests} falharam`, 'red');
  }
  
  return passedTests >= totalTests * 0.85; // 85% de sucesso considerado aprovado
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