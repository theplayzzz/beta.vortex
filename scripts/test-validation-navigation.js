/**
 * Script de teste para validação com navegação automática
 * Execute no console do browser: copy(window.testValidationNavigation())
 */

window.testValidationNavigation = function() {
  console.log('🧪 TESTANDO VALIDAÇÃO COM NAVEGAÇÃO AUTOMÁTICA');
  console.log('='.repeat(50));

  // Test data - formulário com erro na primeira aba
  const formDataWithError = {
    informacoes_basicas: {
      titulo_planejamento: '', // Campo obrigatório vazio
      descricao_objetivo: 'Teste de objetivo'
    },
    detalhes_do_setor: {
      setor: 'tecnologia'
    },
    marketing: {
      maturidade_marketing: 'Não fazemos marketing',
      meta_marketing: 'Estruturar área de marketing'
    },
    comercial: {
      maturidade_comercial: 'Não temos processo comercial estruturado',
      meta_comercial: 'Estruturar funil de vendas'
    }
  };

  // Test data - formulário válido
  const validFormData = {
    informacoes_basicas: {
      titulo_planejamento: 'Planejamento de Teste',
      descricao_objetivo: 'Teste de objetivo detalhado'
    },
    detalhes_do_setor: {
      setor: 'tecnologia'
    },
    marketing: {
      maturidade_marketing: 'Não fazemos marketing',
      meta_marketing: 'Estruturar área de marketing'
    },
    comercial: {
      maturidade_comercial: 'Não temos processo comercial estruturado',
      meta_comercial: 'Estruturar funil de vendas'
    }
  };

  const results = [];

  // Verificar se as funções existem
  if (typeof window.validateFormWithNavigation === 'function') {
    console.log('✅ validateFormWithNavigation encontrada');
    
    // Teste 1: Formulário com erro
    console.log('\n🔍 TESTE 1: Formulário com erro na primeira aba');
    try {
      const errorResult = window.validateFormWithNavigation(formDataWithError);
      console.log('Resultado:', errorResult);
      
      if (!errorResult.isValid && errorResult.errorTab === 0) {
        console.log('✅ PASSOU: Erro detectado na primeira aba');
        results.push('✅ Teste 1: PASSOU');
      } else {
        console.log('❌ FALHOU: Erro não detectado corretamente');
        results.push('❌ Teste 1: FALHOU');
      }
    } catch (error) {
      console.log('❌ ERRO no teste 1:', error);
      results.push('❌ Teste 1: ERRO');
    }

    // Teste 2: Formulário válido
    console.log('\n🔍 TESTE 2: Formulário completamente válido');
    try {
      const validResult = window.validateFormWithNavigation(validFormData);
      console.log('Resultado:', validResult);
      
      if (validResult.isValid && validResult.totalErrors === 0) {
        console.log('✅ PASSOU: Formulário válido detectado');
        results.push('✅ Teste 2: PASSOU');
      } else {
        console.log('❌ FALHOU: Formulário válido não reconhecido');
        results.push('❌ Teste 2: FALHOU');
      }
    } catch (error) {
      console.log('❌ ERRO no teste 2:', error);
      results.push('❌ Teste 2: ERRO');
    }

  } else {
    console.log('❌ validateFormWithNavigation NÃO encontrada');
    console.log('💡 Certifique-se de estar na página de criação de planejamento');
    results.push('❌ Função não encontrada');
  }

  console.log('\n' + '='.repeat(50));
  console.log('📊 RESUMO DOS TESTES:');
  results.forEach(result => console.log(result));
  console.log('='.repeat(50));

  return {
    summary: results,
    timestamp: new Date().toISOString(),
    instructions: [
      '1. Acesse /planejamentos/novo com um cliente válido',
      '2. Abra Developer Tools (F12)',
      '3. Execute: testValidationNavigation()',
      '4. Verifique os resultados no console'
    ]
  };
};

// Auto-executar se estiver na página certa
if (window.location.pathname.includes('/planejamentos/novo')) {
  console.log('🎯 Página detectada: /planejamentos/novo');
  console.log('💡 Execute: testValidationNavigation() para testar a validação');
} else {
  console.log('ℹ️ Para testar, navegue para /planejamentos/novo e execute: testValidationNavigation()');
} 