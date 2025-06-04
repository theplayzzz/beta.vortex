/**
 * Teste simples de validação
 * Execute no console do browser na página /planejamentos/novo
 */

// Teste simples - dados com campo obrigatório vazio
const testeFormDataVazio = {
  informacoes_basicas: {
    titulo_planejamento: '', // Campo obrigatório vazio
    descricao_objetivo: 'Teste de descrição',
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

// Teste simples - dados completos e válidos
const testeFormDataValido = {
  informacoes_basicas: {
    titulo_planejamento: 'Planejamento de Teste Válido',
    descricao_objetivo: 'Esta é uma descrição válida com mais de 10 caracteres',
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

function testeValidacaoSimples() {
  console.log('🧪 TESTANDO VALIDAÇÃO SIMPLES');
  console.log('='.repeat(50));
  
  // Verificar se a função existe
  if (typeof validateFormWithNavigation === 'undefined') {
    console.log('❌ Função validateFormWithNavigation não encontrada no escopo global');
    console.log('💡 Tentando importar...');
    
    // Tentar acessar via módulos
    try {
      // Verificar se existe no window
      if (window.validateFormWithNavigation) {
        console.log('✅ Função encontrada em window.validateFormWithNavigation');
      } else {
        console.log('❌ Função não encontrada nem no escopo nem no window');
        return;
      }
    } catch (error) {
      console.log('❌ Erro ao verificar função:', error);
      return;
    }
  }

  console.log('\n🔍 TESTE 1: Dados com campo vazio');
  console.log('Dados:', testeFormDataVazio);
  
  try {
    const resultado1 = validateFormWithNavigation(testeFormDataVazio);
    console.log('Resultado:', resultado1);
    
    if (!resultado1.isValid) {
      console.log('✅ CORRETO: Campo vazio detectado como inválido');
      console.log(`Aba com erro: ${resultado1.errorTabName} (índice ${resultado1.errorTab})`);
      console.log(`Campo com erro: ${resultado1.errorField}`);
    } else {
      console.log('❌ PROBLEMA: Campo vazio não foi detectado como erro!');
    }
  } catch (error) {
    console.log('❌ ERRO no teste 1:', error);
  }

  console.log('\n🔍 TESTE 2: Dados válidos');
  console.log('Dados:', testeFormDataValido);
  
  try {
    const resultado2 = validateFormWithNavigation(testeFormDataValido);
    console.log('Resultado:', resultado2);
    
    if (resultado2.isValid) {
      console.log('✅ CORRETO: Dados válidos reconhecidos');
    } else {
      console.log('❌ PROBLEMA: Dados válidos detectados como inválidos!');
      console.log(`Erros encontrados: ${resultado2.totalErrors}`);
    }
  } catch (error) {
    console.log('❌ ERRO no teste 2:', error);
  }

  console.log('\n' + '='.repeat(50));
  console.log('📊 TESTE SIMPLES CONCLUÍDO');
}

// Exportar para usar facilmente
window.testeValidacaoSimples = testeValidacaoSimples;
window.testeFormDataVazio = testeFormDataVazio;
window.testeFormDataValido = testeFormDataValido;

console.log('💡 Execute: testeValidacaoSimples() para testar a validação'); 