import { proposalFormSchema, basicInfoSchema, scopeSchema, commercialSchema, type ProposalFormSchema } from './formSchema';
import { z } from 'zod';

// Interface para resultado de validação de aba
export interface TabValidationResult {
  isValid: boolean;
  errors: string[];
  progress: number;
}

// Função para validar uma aba específica
export function validateTab(tabIndex: number, formData: Partial<ProposalFormSchema>): TabValidationResult {
  let schema: z.ZodSchema;
  let tabData: any = {};

  switch (tabIndex) {
    case 0: // Informações Básicas
      schema = basicInfoSchema;
      tabData = {
        titulo_da_proposta: formData.titulo_da_proposta,
        tipo_de_proposta: formData.tipo_de_proposta,
        nome_da_contratada: formData.nome_da_contratada,
        membros_da_equipe: formData.membros_da_equipe,
      };
      break;
    case 1: // Escopo de Serviços
      schema = scopeSchema;
      tabData = {
        modalidade_entrega: formData.modalidade_entrega,
        servicos_incluidos: formData.servicos_incluidos,
        requisitos_especiais: formData.requisitos_especiais,
      };
      break;
    case 2: // Contexto Comercial
      schema = commercialSchema;
      tabData = {
        orcamento_estimado: formData.orcamento_estimado,
        forma_prazo_pagamento: formData.forma_prazo_pagamento,
        urgencia_do_projeto: formData.urgencia_do_projeto,
        tomador_de_decisao: formData.tomador_de_decisao,
        resumo_dor_problema_cliente: formData.resumo_dor_problema_cliente,
        contexto_adicional: formData.contexto_adicional,
      };
      break;
    default:
      return {
        isValid: false,
        errors: ['Aba inválida'],
        progress: 0,
      };
  }

  const validation = schema.safeParse(tabData);

  if (validation.success) {
    return {
      isValid: true,
      errors: [],
      progress: 100,
    };
  }

  const errors = validation.error.issues.map(issue => issue.message);
  const totalFields = Object.keys(tabData).length;
  const validFields = totalFields - validation.error.issues.length;
  const progress = Math.round((validFields / totalFields) * 100);

  return {
    isValid: false,
    errors,
    progress: Math.max(progress, 0),
  };
}

// Função para calcular o progresso de uma aba
export function calculateTabProgress(tabIndex: number, formData: Partial<ProposalFormSchema>): number {
  const validation = validateTab(tabIndex, formData);
  return validation.progress;
}

// Função para verificar se o formulário está completo
export function isFormComplete(formData: Partial<ProposalFormSchema>): boolean {
  const tab0Valid = validateTab(0, formData).isValid;
  const tab1Valid = validateTab(1, formData).isValid;
  const tab2Valid = validateTab(2, formData).isValid;

  return tab0Valid && tab1Valid && tab2Valid;
}

// Função para obter resumo de validação de todas as abas
export function getFormValidationSummary(formData: Partial<ProposalFormSchema>) {
  const tab0 = validateTab(0, formData);
  const tab1 = validateTab(1, formData);
  const tab2 = validateTab(2, formData);

  const totalProgress = Math.round((tab0.progress + tab1.progress + tab2.progress) / 3);
  const isComplete = tab0.isValid && tab1.isValid && tab2.isValid;
  const totalErrors = tab0.errors.length + tab1.errors.length + tab2.errors.length;

  return {
    isComplete,
    totalProgress,
    totalErrors,
    tabResults: {
      basic: tab0,
      scope: tab1,
      commercial: tab2,
    },
  };
} 