import { proposalFormSchema, basicInfoSchema, scopeSchema, commercialSchema, type ProposalFormSchema } from './formSchema';
import { z } from 'zod';

// Definição dos tipos de aba para propostas
export type ProposalTabKey = 'basic' | 'scope' | 'commercial';

export interface ProposalValidationError {
  tab: ProposalTabKey;
  tabIndex: number;
  tabLabel: string;
  fieldErrors: Record<string, string>;
  hasErrors: boolean;
}

export interface ProposalFormValidationResult {
  isValid: boolean;
  errors: ProposalValidationError[];
  firstErrorTab?: number;
  totalErrors: number;
}

// Schemas para cada aba
const tabSchemas = {
  basic: basicInfoSchema,
  scope: scopeSchema,
  commercial: commercialSchema,
};

// Configuração das abas
const proposalTabs: Array<{ key: ProposalTabKey; label: string }> = [
  { key: 'basic', label: 'Informações Básicas' },
  { key: 'scope', label: 'Escopo de Serviços' },
  { key: 'commercial', label: 'Contexto Comercial' },
];

/**
 * Valida todo o formulário de propostas e retorna informações detalhadas sobre erros
 */
export function validateCompleteProposalForm(
  formData: Partial<ProposalFormSchema>
): ProposalFormValidationResult {
  console.log('🔍 validateCompleteProposalForm: Iniciando...');
  console.log('🔍 DEBUG - formData:', formData);

  const errors: ProposalValidationError[] = [];
  let firstErrorTab: number | undefined;
  let totalErrors = 0;

  proposalTabs.forEach((tab, index) => {
    console.log(`🔍 DEBUG - Validando aba ${index}: ${tab.label}`);
    
    // Extrair dados relevantes para esta aba
    let tabData: any = {};
    
    if (tab.key === 'basic') {
      tabData = {
        titulo_proposta: formData.titulo_proposta,
        tipo_proposta: formData.tipo_proposta,
        descricao_objetivo: formData.descricao_objetivo,
        prazo_estimado: formData.prazo_estimado,
      };
    } else if (tab.key === 'scope') {
      tabData = {
        modalidade_entrega: formData.modalidade_entrega,
        servicos_incluidos: formData.servicos_incluidos,
        requisitos_especiais: formData.requisitos_especiais,
      };
    } else if (tab.key === 'commercial') {
      tabData = {
        orcamento_estimado: formData.orcamento_estimado,
        concorrentes_considerados: formData.concorrentes_considerados,
        urgencia_projeto: formData.urgencia_projeto,
        tomador_decisao: formData.tomador_decisao,
        contexto_adicional: formData.contexto_adicional,
      };
    }

    console.log(`🔍 DEBUG - Dados da aba ${tab.label}:`, tabData);
    
    const validation = tabSchemas[tab.key].safeParse(tabData);
    console.log(`🔍 DEBUG - Resultado validação ${tab.label}:`, validation);
    
    const tabError: ProposalValidationError = {
      tab: tab.key,
      tabIndex: index,
      tabLabel: tab.label,
      fieldErrors: {},
      hasErrors: false,
    };

    if (!validation.success) {
      console.log(`❌ DEBUG - Aba ${tab.label} tem erros:`, validation.error);
      const fieldErrors = validation.error.flatten().fieldErrors;
      console.log(`🔍 DEBUG - Field errors ${tab.label}:`, fieldErrors);
      
      // Converter array de strings para strings únicas
      Object.entries(fieldErrors || {}).forEach(([field, errorMessages]) => {
        if (errorMessages && Array.isArray(errorMessages) && errorMessages.length > 0) {
          tabError.fieldErrors[field] = errorMessages[0];
          tabError.hasErrors = true;
          totalErrors++;
          console.log(`❌ DEBUG - Campo ${field} tem erro: ${errorMessages[0]}`);
        }
      });

      if (tabError.hasErrors && firstErrorTab === undefined) {
        firstErrorTab = index;
        console.log(`🎯 DEBUG - Primeira aba com erro definida: ${index} (${tab.label})`);
      }
    } else {
      console.log(`✅ DEBUG - Aba ${tab.label} está válida`);
    }

    errors.push(tabError);
  });

  const result = {
    isValid: totalErrors === 0,
    errors,
    firstErrorTab,
    totalErrors,
  };
  
  console.log('🔍 DEBUG - Resultado final validateCompleteProposalForm:', result);
  return result;
}

/**
 * Interface para resultado de validação com navegação automática para propostas
 */
export interface ProposalFormValidationWithNavigationResult {
  isValid: boolean;
  totalErrors: number;
  errorTab?: number;
  errorTabName?: string;
  errorField?: string;
  errorMessage?: string;
  errors: ProposalValidationError[];
}

/**
 * Valida formulário de propostas completo e retorna informações para navegação automática
 * Otimizada para o fluxo de submissão com navegação imediata para erros
 */
export function validateProposalFormWithNavigation(
  formData: ProposalFormSchema
): ProposalFormValidationWithNavigationResult {
  console.log('🔍 validateProposalFormWithNavigation: Iniciando validação completa...');
  
  // Usar a função existente de validação completa
  const completeValidation = validateCompleteProposalForm(formData);
  
  if (completeValidation.isValid) {
    console.log('✅ validateProposalFormWithNavigation: Formulário totalmente válido');
    return {
      isValid: true,
      totalErrors: 0,
      errors: completeValidation.errors,
    };
  }

  console.log('❌ validateProposalFormWithNavigation: Erros encontrados:', completeValidation.totalErrors);

  // Encontrar primeira aba com erro
  const firstErrorTab = completeValidation.errors.find(error => error.hasErrors);
  
  if (!firstErrorTab) {
    return {
      isValid: false,
      totalErrors: completeValidation.totalErrors,
      errors: completeValidation.errors,
    };
  }

  console.log(`🎯 validateProposalFormWithNavigation: Primeira aba com erro: ${firstErrorTab.tabLabel} (índice ${firstErrorTab.tabIndex})`);

  // Encontrar primeiro campo com erro na aba
  const firstFieldWithError = Object.keys(firstErrorTab.fieldErrors)[0];
  const firstErrorMessage = firstErrorTab.fieldErrors[firstFieldWithError];

  return {
    isValid: false,
    totalErrors: completeValidation.totalErrors,
    errorTab: firstErrorTab.tabIndex,
    errorTabName: firstErrorTab.tabLabel,
    errorField: firstFieldWithError,
    errorMessage: firstErrorMessage,
    errors: completeValidation.errors,
  };
}

/**
 * Função utilitária para scroll suave até um elemento
 */
export function scrollToProposalField(fieldName: string) {
  // Tentar encontrar o campo pelo name, id ou data-field
  const selectors = [
    `[name="${fieldName}"]`,
    `#${fieldName}`,
    `[data-field="${fieldName}"]`,
    `[data-testid="${fieldName}"]`,
  ];

  let element: HTMLElement | null = null;
  
  for (const selector of selectors) {
    element = document.querySelector(selector);
    if (element) break;
  }

  if (element) {
    // Scroll suave até o elemento
    element.scrollIntoView({
      behavior: 'smooth',
      block: 'center',
    });

    // Focar no elemento se for um input
    if (element instanceof HTMLInputElement || 
        element instanceof HTMLTextAreaElement || 
        element instanceof HTMLSelectElement) {
      setTimeout(() => element?.focus(), 300);
    }

    // Adicionar highlight temporário com cores do sistema
    element.style.outline = '2px solid #6be94c'; // sgbus-green
    element.style.outlineOffset = '2px';
    
    setTimeout(() => {
      if (element) {
        element.style.outline = '';
        element.style.outlineOffset = '';
      }
    }, 2000);
  }
}

/**
 * Executa navegação automática para erro e destaque do campo
 */
export function executeProposalAutoNavigation(
  result: ProposalFormValidationWithNavigationResult,
  navigateToTab: (tabIndex: number) => void
): boolean {
  if (result.isValid || result.errorTab === undefined) {
    return false;
  }

  console.log(`🎯 executeProposalAutoNavigation: Navegando para aba ${result.errorTab}`);
  
  try {
    // Navegar para aba com erro
    navigateToTab(result.errorTab);
  } catch (error) {
    console.error('❌ executeProposalAutoNavigation: Erro ao chamar navigateToTab:', error);
    return false;
  }

  // Aguardar renderização e destacar campo se existir
  if (result.errorField) {
    const fieldName = result.errorField;
    setTimeout(() => {
      console.log(`📍 executeProposalAutoNavigation: Destacando campo ${fieldName}`);
      scrollToProposalField(fieldName);
    }, 150);
  }

  return true;
}

/**
 * Gera resumo completo dos erros para exibição
 */
export function getProposalValidationErrorSummary(result: ProposalFormValidationResult): {
  summary: string;
  details: string[];
} {
  if (result.isValid) {
    return { summary: '', details: [] };
  }

  const tabsWithErrors = result.errors.filter(e => e.hasErrors);
  
  let summary = '';
  if (tabsWithErrors.length === 1) {
    summary = `Há campos obrigatórios não preenchidos na aba "${tabsWithErrors[0].tabLabel}"`;
  } else {
    summary = `Há campos obrigatórios não preenchidos em ${tabsWithErrors.length} abas`;
  }

  const details = tabsWithErrors.map(error => {
    const errorCount = Object.keys(error.fieldErrors).length;
    if (errorCount === 1) {
      return `1 campo obrigatório em "${error.tabLabel}"`;
    }
    return `${errorCount} campos obrigatórios em "${error.tabLabel}"`;
  });

  return { summary, details };
} 