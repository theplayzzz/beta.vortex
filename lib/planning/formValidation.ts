import { planningFormSchema, tabSchemas, type PlanningFormData, type TabKey } from './formSchema';
import { z } from 'zod';

export interface ValidationError {
  tab: TabKey;
  tabIndex: number;
  tabLabel: string;
  fieldErrors: Record<string, string>;
  hasErrors: boolean;
}

export interface FormValidationResult {
  isValid: boolean;
  errors: ValidationError[];
  firstErrorTab?: number;
  totalErrors: number;
}

/**
 * Valida todo o formulário e retorna informações detalhadas sobre erros
 */
export function validateCompleteForm(
  formData: Partial<PlanningFormData>
): FormValidationResult {
  console.log('🔍 validateCompleteForm: Iniciando...');
  console.log('🔍 DEBUG - formData:', formData);
  
  const tabs: Array<{ key: TabKey; label: string }> = [
    { key: 'informacoes_basicas', label: 'Informações Básicas' },
    { key: 'detalhes_do_setor', label: 'Detalhes do Setor' },
    { key: 'marketing', label: 'Marketing' },
    { key: 'comercial', label: 'Comercial' },
  ];

  const errors: ValidationError[] = [];
  let firstErrorTab: number | undefined;
  let totalErrors = 0;

  tabs.forEach((tab, index) => {
    console.log(`🔍 DEBUG - Validando aba ${index}: ${tab.label}`);
    const tabData = formData[tab.key];
    console.log(`🔍 DEBUG - Dados da aba ${tab.label}:`, tabData);
    
    const validation = tabSchemas[tab.key].safeParse(tabData);
    console.log(`🔍 DEBUG - Resultado validação ${tab.label}:`, validation);
    
    const tabError: ValidationError = {
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
      
      // Converter array de strings para strings únicas com tipagem segura
      Object.entries(fieldErrors).forEach(([field, errorMessages]) => {
        if (errorMessages && errorMessages.length > 0) {
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
  
  console.log('🔍 DEBUG - Resultado final validateCompleteForm:', result);
  return result;
}

/**
 * Valida uma aba específica
 */
export function validateTab(
  tabKey: TabKey,
  tabData: any
): { isValid: boolean; errors: Record<string, string> } {
  const validation = tabSchemas[tabKey].safeParse(tabData);
  
  if (validation.success) {
    return { isValid: true, errors: {} };
  }

  const fieldErrors = validation.error.flatten().fieldErrors;
  const errors: Record<string, string> = {};
  
  // Usar Object.entries para tipagem segura
  Object.entries(fieldErrors).forEach(([field, errorMessages]) => {
    if (errorMessages && errorMessages.length > 0) {
      errors[field] = errorMessages[0];
    }
  });

  return { isValid: false, errors };
}

/**
 * Gera mensagem de erro amigável para a aba
 */
export function getTabErrorMessage(error: ValidationError): string {
  const errorCount = Object.keys(error.fieldErrors).length;
  
  if (errorCount === 0) return '';
  
  if (errorCount === 1) {
    return `1 campo obrigatório em "${error.tabLabel}"`;
  }
  
  return `${errorCount} campos obrigatórios em "${error.tabLabel}"`;
}

/**
 * Gera resumo completo dos erros para exibição
 */
export function getValidationErrorSummary(result: FormValidationResult): {
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

  const details = tabsWithErrors.map(error => getTabErrorMessage(error));

  return { summary, details };
}

/**
 * Verifica se os campos obrigatórios de uma aba estão preenchidos
 */
export function checkRequiredFields(
  tabKey: TabKey,
  tabData: any
): { field: string; message: string }[] {
  const validation = tabSchemas[tabKey].safeParse(tabData);
  
  if (validation.success) {
    return [];
  }

  const errors: { field: string; message: string }[] = [];
  const fieldErrors = validation.error.flatten().fieldErrors;
  
  // Usar Object.entries para tipagem segura
  Object.entries(fieldErrors).forEach(([field, errorMessages]) => {
    if (errorMessages && errorMessages.length > 0) {
      errors.push({
        field,
        message: errorMessages[0],
      });
    }
  });

  return errors;
}

/**
 * Função utilitária para scroll suave até um elemento
 */
export function scrollToField(fieldName: string) {
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

    // Adicionar highlight temporário
    element.style.outline = '2px solid #6be94c';
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
 * Navegar para a primeira aba com erro e destacar o primeiro campo
 */
export function navigateToFirstError(
  result: FormValidationResult,
  setCurrentTab: (tab: number) => void
): boolean {
  if (result.isValid || result.firstErrorTab === undefined) {
    return false;
  }

  // Navegar para a aba com erro
  setCurrentTab(result.firstErrorTab);

  // Aguardar a renderização da aba e então focar no primeiro campo com erro
  setTimeout(() => {
    const firstErrorTab = result.errors[result.firstErrorTab!];
    const firstErrorField = Object.keys(firstErrorTab.fieldErrors)[0];
    
    if (firstErrorField) {
      scrollToField(firstErrorField);
    }
  }, 100);

  return true;
}

/**
 * Valida se todas as abas anteriores à atual estão válidas
 */
export function validatePreviousTabs(
  formData: Partial<PlanningFormData>,
  currentTabIndex: number
): { isValid: boolean; firstErrorTab?: number } {
  const tabs: TabKey[] = ['informacoes_basicas', 'detalhes_do_setor', 'marketing', 'comercial'];
  
  for (let i = 0; i < currentTabIndex; i++) {
    const tabKey = tabs[i];
    const tabData = formData[tabKey];
    const validation = tabSchemas[tabKey].safeParse(tabData);
    
    if (!validation.success) {
      return { isValid: false, firstErrorTab: i };
    }
  }
  
  return { isValid: true };
}

/**
 * Interface para resultado de validação com navegação automática
 */
export interface FormValidationWithNavigationResult {
  isValid: boolean;
  totalErrors: number;
  errorTab?: number;
  errorTabName?: string;
  errorField?: string;
  errorMessage?: string;
  errors: ValidationError[];
}

/**
 * Valida formulário completo e retorna informações para navegação automática
 * Otimizada para o fluxo de submissão com navegação imediata para erros
 */
export function validateFormWithNavigation(
  formData: PlanningFormData
): FormValidationWithNavigationResult {
  console.log('🔍 validateFormWithNavigation: Iniciando validação completa...');
  console.log('🔍 DEBUG - formData recebido:', formData);
  
  // 🔍 DEBUG: Verificar se os dados básicos existem
  console.log('🔍 DEBUG - informacoes_basicas:', formData?.informacoes_basicas);
  console.log('🔍 DEBUG - titulo_planejamento:', formData?.informacoes_basicas?.titulo_planejamento);
  console.log('🔍 DEBUG - titulo vazio?:', !formData?.informacoes_basicas?.titulo_planejamento || formData?.informacoes_basicas?.titulo_planejamento === '');
  
  // Usar a função existente de validação completa
  const completeValidation = validateCompleteForm(formData);
  
  console.log('🔍 DEBUG - Resultado validateCompleteForm:', completeValidation);
  
  if (completeValidation.isValid) {
    console.log('✅ validateFormWithNavigation: Formulário totalmente válido');
    return {
      isValid: true,
      totalErrors: 0,
      errors: completeValidation.errors,
    };
  }

  console.log('❌ validateFormWithNavigation: Erros encontrados:', completeValidation.totalErrors);
  console.log('🔍 DEBUG - Detalhes dos erros:', completeValidation.errors);

  // Encontrar primeira aba com erro
  const firstErrorTab = completeValidation.errors.find(error => error.hasErrors);
  
  if (!firstErrorTab) {
    console.log('⚠️ validateFormWithNavigation: Nenhuma aba específica com erro encontrada');
    return {
      isValid: false,
      totalErrors: completeValidation.totalErrors,
      errors: completeValidation.errors,
    };
  }

  console.log(`🎯 validateFormWithNavigation: Primeira aba com erro: ${firstErrorTab.tabLabel} (índice ${firstErrorTab.tabIndex})`);
  console.log('🔍 DEBUG - Erros da aba:', firstErrorTab.fieldErrors);

  // Encontrar primeiro campo com erro na aba
  const firstFieldWithError = Object.keys(firstErrorTab.fieldErrors)[0];
  const firstErrorMessage = firstErrorTab.fieldErrors[firstFieldWithError];

  console.log(`📍 validateFormWithNavigation: Primeiro campo com erro: ${firstFieldWithError}`);
  console.log(`📍 validateFormWithNavigation: Mensagem do erro: ${firstErrorMessage}`);

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
 * Executa navegação automática para erro e destaque do campo
 */
export function executeAutoNavigation(
  result: FormValidationWithNavigationResult,
  navigateToTab: (tabIndex: number) => void
): boolean {
  if (result.isValid || result.errorTab === undefined) {
    return false;
  }

  console.log(`🎯 executeAutoNavigation: Navegando para aba ${result.errorTab}`);
  
  // Navegar para aba com erro
  navigateToTab(result.errorTab);

  // Aguardar renderização e destacar campo se existir
  if (result.errorField) {
    const fieldName = result.errorField;
    setTimeout(() => {
      console.log(`📍 executeAutoNavigation: Destacando campo ${fieldName}`);
      scrollToField(fieldName);
    }, 150);
  }

  return true;
} 