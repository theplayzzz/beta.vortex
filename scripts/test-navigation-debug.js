/**
 * Script para debug da navegação automática
 * Execute no console da página /planejamentos/novo
 */

function testNavigationDebug() {
  console.log('🔍 TESTE DE DEBUG DA NAVEGAÇÃO');
  console.log('='.repeat(50));
  
  // Verificar se o validateFormWithNavigation existe
  console.log('1. Verificando funções de validação...');
  if (typeof validateFormWithNavigation === 'undefined') {
    console.log('❌ validateFormWithNavigation não encontrada');
    return;
  }
  console.log('✅ validateFormWithNavigation encontrada');
  
  if (typeof executeAutoNavigation === 'undefined') {
    console.log('❌ executeAutoNavigation não encontrada');
    return;
  }
  console.log('✅ executeAutoNavigation encontrada');
  
  // Dados de teste com campo vazio
  const testData = {
    informacoes_basicas: {
      titulo_planejamento: '', // Campo obrigatório vazio
      descricao_objetivo: 'Teste de descrição válida',
      setor: 'tecnologia'
    },
    detalhes_do_setor: {},
    marketing: {
      maturidade_marketing: 'Não fazemos marketing',
      meta_marketing: 'Estruturar área de marketing'
    },
    comercial: {
      maturidade_comercial: 'Não temos processo comercial estruturado',
      meta_comercial: 'Estruturar funil de vendas'
    }
  };
  
  console.log('\n2. Testando validação...');
  console.log('Dados de teste:', testData);
  
  const validationResult = validateFormWithNavigation(testData);
  console.log('Resultado da validação:', validationResult);
  
  if (validationResult.isValid) {
    console.log('❌ PROBLEMA: Validação não detectou o erro!');
    return;
  }
  
  console.log('✅ Validação detectou erro corretamente');
  console.log(`Aba com erro: ${validationResult.errorTabName} (índice ${validationResult.errorTab})`);
  console.log(`Campo com erro: ${validationResult.errorField}`);
  
  // Testar função de navegação
  console.log('\n3. Testando função de navegação...');
  
  let tabNavigationCalled = false;
  let tabNavigationIndex = -1;
  
  const mockNavigateToTab = (tabIndex) => {
    console.log(`🎯 mockNavigateToTab CHAMADA com índice: ${tabIndex}`);
    tabNavigationCalled = true;
    tabNavigationIndex = tabIndex;
  };
  
  const navigationResult = executeAutoNavigation(validationResult, mockNavigateToTab);
  
  console.log('Resultado da navegação:', navigationResult);
  console.log('Navigation called:', tabNavigationCalled);
  console.log('Navigation index:', tabNavigationIndex);
  
  if (!tabNavigationCalled) {
    console.log('❌ PROBLEMA: Função de navegação não foi chamada!');
    return;
  }
  
  if (tabNavigationIndex !== validationResult.errorTab) {
    console.log(`❌ PROBLEMA: Índice de navegação incorreto! Esperado: ${validationResult.errorTab}, Recebido: ${tabNavigationIndex}`);
    return;
  }
  
  console.log('✅ Função de navegação funcionou corretamente');
  
  // Testar se o currentTabRef está configurado
  console.log('\n4. Verificando currentTabRef...');
  
  // Tentar encontrar o componente PlanningForm
  const planningForm = document.querySelector('[data-component="planning-form"]');
  if (!planningForm) {
    console.log('⚠️ Elemento do formulário não encontrado (data-component="planning-form")');
  } else {
    console.log('✅ Elemento do formulário encontrado');
  }
  
  // Verificar se existem abas
  const tabs = document.querySelectorAll('[role="tab"]');
  console.log(`Abas encontradas: ${tabs.length}`);
  
  if (tabs.length === 0) {
    console.log('⚠️ Nenhuma aba encontrada. Verificar estrutura HTML.');
  } else {
    tabs.forEach((tab, index) => {
      console.log(`Aba ${index}: ${tab.textContent?.trim()}`);
    });
  }
  
  console.log('\n' + '='.repeat(50));
  console.log('📊 TESTE DE DEBUG CONCLUÍDO');
  
  return {
    validationResult,
    navigationResult,
    tabNavigationCalled,
    tabNavigationIndex,
    tabsFound: tabs.length
  };
}

// Exportar para uso global
window.testNavigationDebug = testNavigationDebug;

console.log('💡 Execute: testNavigationDebug() para debug detalhado da navegação'); 