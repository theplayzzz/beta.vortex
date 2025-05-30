import { z } from 'zod';
import { 
  TIPOS_PROPOSTA, 
  MODALIDADES_ENTREGA, 
  SERVICOS_INCLUIDOS,
  URGENCIA_PROJETO,
  ORCAMENTO_ESTIMADO
} from './proposalConfig';

// Schema para Aba 1: Informações Básicas
export const basicInfoSchema = z.object({
  titulo_proposta: z
    .string()
    .min(5, 'Título deve ter pelo menos 5 caracteres')
    .max(200, 'Título deve ter no máximo 200 caracteres'),
  
  tipo_proposta: z
    .string()
    .refine((val) => val !== '', 'Selecione um tipo de proposta')
    .refine((val) => TIPOS_PROPOSTA.includes(val as any), 'Tipo de proposta inválido'),
  
  descricao_objetivo: z
    .string()
    .min(20, 'Descrição deve ter pelo menos 20 caracteres')
    .max(1000, 'Descrição deve ter no máximo 1000 caracteres'),
  
  prazo_estimado: z
    .string()
    .min(3, 'Prazo estimado é obrigatório')
    .max(100, 'Prazo deve ter no máximo 100 caracteres')
});

// Schema para Aba 2: Escopo de Serviços
export const scopeSchema = z.object({
  modalidade_entrega: z
    .string()
    .refine((val) => val !== '', 'Selecione uma modalidade de entrega')
    .refine((val) => MODALIDADES_ENTREGA.includes(val as any), 'Modalidade de entrega inválida'),
  
  servicos_incluidos: z
    .array(z.string())
    .min(1, 'Selecione pelo menos um serviço')
    .refine((arr) => arr.every(service => SERVICOS_INCLUIDOS.includes(service as any)), 'Serviço inválido selecionado'),
  
  requisitos_especiais: z
    .string()
    .max(500, 'Requisitos especiais devem ter no máximo 500 caracteres')
    .optional()
    .or(z.literal(''))
});

// Schema para Aba 3: Contexto Comercial
export const commercialSchema = z.object({
  orcamento_estimado: z
    .string()
    .optional()
    .or(z.literal(''))
    .refine((val) => !val || ORCAMENTO_ESTIMADO.includes(val as any), 'Faixa de orçamento inválida'),
  
  concorrentes_considerados: z
    .string()
    .max(300, 'Campo deve ter no máximo 300 caracteres')
    .optional()
    .or(z.literal('')),
  
  urgencia_projeto: z
    .string()
    .refine((val) => val !== '', 'Selecione uma urgência')
    .refine((val) => URGENCIA_PROJETO.includes(val as any), 'Urgência inválida'),
  
  tomador_decisao: z
    .string()
    .min(2, 'Nome do tomador de decisão é obrigatório')
    .max(100, 'Nome deve ter no máximo 100 caracteres'),
  
  contexto_adicional: z
    .string()
    .max(800, 'Contexto adicional deve ter no máximo 800 caracteres')
    .optional()
    .or(z.literal(''))
});

// Schema completo do formulário
export const proposalFormSchema = z.object({
  // Aba 1
  ...basicInfoSchema.shape,
  // Aba 2
  ...scopeSchema.shape,
  // Aba 3
  ...commercialSchema.shape,
});

export type ProposalFormSchema = z.infer<typeof proposalFormSchema>;

// Função para validar uma aba específica
export function validateTab(tabIndex: number, data: Partial<ProposalFormSchema>) {
  try {
    switch (tabIndex) {
      case 0:
        basicInfoSchema.parse(data);
        return { isValid: true, errors: [] };
      case 1:
        scopeSchema.parse(data);
        return { isValid: true, errors: [] };
      case 2:
        commercialSchema.parse(data);
        return { isValid: true, errors: [] };
      default:
        return { isValid: false, errors: ['Aba inválida'] };
    }
  } catch (error) {
    if (error instanceof z.ZodError) {
      return {
        isValid: false,
        errors: error.errors.map(err => err.message)
      };
    }
    return { isValid: false, errors: ['Erro de validação'] };
  }
}

// Função para calcular o progresso de uma aba
export function calculateTabProgress(tabIndex: number, data: Partial<ProposalFormSchema>): number {
  const getFieldCount = (obj: any): number => Object.keys(obj.shape).length;
  const getFilledFields = (tabData: any, tabSchema: any): number => {
    let filled = 0;
    Object.keys(tabSchema.shape).forEach(key => {
      const value = tabData[key];
      if (value !== undefined && value !== '' && value !== null) {
        if (Array.isArray(value)) {
          if (value.length > 0) filled++;
        } else {
          filled++;
        }
      }
    });
    return filled;
  };

  switch (tabIndex) {
    case 0:
      return Math.round((getFilledFields(data, basicInfoSchema) / getFieldCount(basicInfoSchema)) * 100);
    case 1:
      return Math.round((getFilledFields(data, scopeSchema) / getFieldCount(scopeSchema)) * 100);
    case 2:
      return Math.round((getFilledFields(data, commercialSchema) / getFieldCount(commercialSchema)) * 100);
    default:
      return 0;
  }
} 