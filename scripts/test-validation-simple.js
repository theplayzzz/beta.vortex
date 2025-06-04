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

// NOVO TESTE - dados com campo obrigatório faltando na aba Detalhes do Setor
const testeDetalhesSetorVazio = {
  informacoes_basicas: {
    titulo_planejamento: 'Planejamento de Teste Válido',
    descricao_objetivo: 'Esta é uma descrição válida com mais de 10 caracteres',
    setor: 'E-commerce' // Setor com perguntas obrigatórias
  },
  detalhes_do_setor: {
    // Campos obrigatórios faltando - exemplo para E-commerce:
    // ecom_categorias_destaque: '', // Deveria estar preenchido
    // ecom_volume_vendas: 0, // Deveria estar preenchido
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

// TESTE PREENCHIDO - dados com todos os campos de Detalhes do Setor preenchidos
const testeDetalhesSetorCompleto = {
  informacoes_basicas: {
    titulo_planejamento: 'Planejamento E-commerce Completo',
    descricao_objetivo: 'Esta é uma descrição válida com mais de 10 caracteres',
    setor: 'E-commerce'
  },
  detalhes_do_setor: {
    ecom_categorias_destaque: 'Eletrônicos e smartphones',
    ecom_volume_vendas: 500,
    ecom_ticket_medio: 150.00,
    ecom_margem_media: 25,
    ecom_canal_vendas: ['Site próprio', 'Marketplace'],
    ecom_logistica: 'Correios',
    ecom_principais_desafios: 'Atrair novos clientes',
    ecom_diferencial: 'Preços competitivos e entrega rápida'
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

  console.log('\n🔍 TESTE 1: Dados com campo vazio na primeira aba');
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

  console.log('\n🔍 TESTE 2: Dados com Detalhes do Setor incompletos');
  console.log('Dados:', testeDetalhesSetorVazio);
  
  try {
    const resultado2 = validateFormWithNavigation(testeDetalhesSetorVazio);
    console.log('Resultado:', resultado2);
    
    if (!resultado2.isValid && resultado2.errorTabName === 'Detalhes do Setor') {
      console.log('✅ CORRETO: Campos obrigatórios da aba Detalhes do Setor detectados como faltando');
      console.log(`Aba com erro: ${resultado2.errorTabName} (índice ${resultado2.errorTab})`);
      console.log(`Campo com erro: ${resultado2.errorField}`);
      console.log(`Total de erros: ${resultado2.totalErrors}`);
    } else if (resultado2.isValid) {
      console.log('❌ PROBLEMA: Detalhes do Setor vazios não foram detectados como erro!');
      console.log('⚠️ Possível causa: Schema dinâmico não está funcionando');
    } else {
      console.log('⚠️ INESPERADO: Erro em aba diferente de Detalhes do Setor');
      console.log(`Aba com erro: ${resultado2.errorTabName}`);
    }
  } catch (error) {
    console.log('❌ ERRO no teste 2:', error);
  }

  console.log('\n🔍 TESTE 3: Dados com Detalhes do Setor completos');
  console.log('Dados:', testeDetalhesSetorCompleto);
  
  try {
    const resultado3 = validateFormWithNavigation(testeDetalhesSetorCompleto);
    console.log('Resultado:', resultado3);
    
    if (resultado3.isValid) {
      console.log('✅ CORRETO: Dados completos reconhecidos como válidos');
    } else {
      console.log('❌ PROBLEMA: Dados completos detectados como inválidos!');
      console.log(`Erros encontrados: ${resultado3.totalErrors}`);
      console.log(`Primeira aba com erro: ${resultado3.errorTabName}`);
    }
  } catch (error) {
    console.log('❌ ERRO no teste 3:', error);
  }

  console.log('\n🔍 TESTE 4: Dados gerais válidos');
  console.log('Dados:', testeFormDataValido);
  
  try {
    const resultado4 = validateFormWithNavigation(testeFormDataValido);
    console.log('Resultado:', resultado4);
    
    if (resultado4.isValid) {
      console.log('✅ CORRETO: Dados válidos reconhecidos');
    } else {
      console.log('❌ PROBLEMA: Dados válidos detectados como inválidos!');
      console.log(`Erros encontrados: ${resultado4.totalErrors}`);
    }
  } catch (error) {
    console.log('❌ ERRO no teste 4:', error);
  }

  console.log('\n' + '='.repeat(50));
  console.log('📊 TESTE SIMPLES CONCLUÍDO');
}

// Exportar para usar facilmente
window.testeValidacaoSimples = testeValidacaoSimples;
window.testeFormDataVazio = testeFormDataVazio;
window.testeDetalhesSetorVazio = testeDetalhesSetorVazio;
window.testeDetalhesSetorCompleto = testeDetalhesSetorCompleto;
window.testeFormDataValido = testeFormDataValido;

console.log('💡 Execute: testeValidacaoSimples() para testar a validação');
console.log('🔥 NOVO: Teste específico para aba Detalhes do Setor incluído!'); 