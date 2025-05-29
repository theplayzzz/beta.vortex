import { z } from "zod";
import { SETORES_PERMITIDOS } from "./sectorConfig";
import { MATURIDADE_MARKETING } from './marketingConfig';
import { MATURIDADE_COMERCIAL } from './commercialConfig';

/**
 * Schema para a aba de informações básicas
 */
const informacoesBasicasSchema = z.object({
  titulo_planejamento: z
    .string()
    .min(1, "Título é obrigatório")
    .min(3, "Título deve ter pelo menos 3 caracteres")
    .max(100, "Título deve ter no máximo 100 caracteres"),
  descricao_objetivo: z
    .string()
    .min(1, "Descrição é obrigatória")
    .min(10, "Descrição deve ter pelo menos 10 caracteres")
    .max(500, "Descrição deve ter no máximo 500 caracteres"),
  setor: z.enum(SETORES_PERMITIDOS)
});

/**
 * Schema para detalhes específicos do setor
 * Será validado dinamicamente baseado no setor selecionado
 */
const detalhesSetorSchema = z.record(z.any());

/**
 * Schema para a aba de marketing
 */
const marketingSchema = z.object({
  maturidade_marketing: z.enum(MATURIDADE_MARKETING, {
    errorMap: () => ({ message: "Selecione uma maturidade de marketing" })
  }),
  meta_marketing: z.string().min(1, "Selecione uma meta de marketing"),
  meta_marketing_personalizada: z.string().optional()
}).refine((data) => {
  // Se meta_marketing for "Outro", meta_marketing_personalizada é obrigatória
  if (data.meta_marketing === "Outro") {
    return data.meta_marketing_personalizada && data.meta_marketing_personalizada.length > 0;
  }
  return true;
}, {
  message: "Meta personalizada é obrigatória quando 'Outro' é selecionado",
  path: ["meta_marketing_personalizada"]
});

/**
 * Schema para a aba comercial
 */
const comercialSchema = z.object({
  maturidade_comercial: z.enum(MATURIDADE_COMERCIAL, {
    errorMap: () => ({ message: "Selecione uma maturidade comercial" })
  }),
  meta_comercial: z.string().min(1, "Selecione uma meta comercial"),
  meta_comercial_personalizada: z.string().optional()
}).refine((data) => {
  // Se meta_comercial for "Outro", meta_comercial_personalizada é obrigatória
  if (data.meta_comercial === "Outro") {
    return data.meta_comercial_personalizada && data.meta_comercial_personalizada.length > 0;
  }
  return true;
}, {
  message: "Meta personalizada é obrigatória quando 'Outro' é selecionado",
  path: ["meta_comercial_personalizada"]
});

/**
 * Schema principal do formulário de planejamento
 */
export const planningFormSchema = z.object({
  informacoes_basicas: informacoesBasicasSchema,
  detalhes_do_setor: detalhesSetorSchema,
  marketing: marketingSchema,
  comercial: comercialSchema
});

/**
 * Tipo TypeScript inferido do schema
 */
export type PlanningFormData = z.infer<typeof planningFormSchema>;

/**
 * Schema para validação parcial por aba
 */
export const tabSchemas = {
  informacoes_basicas: informacoesBasicasSchema,
  detalhes_do_setor: detalhesSetorSchema,
  marketing: marketingSchema,
  comercial: comercialSchema
} as const;

/**
 * Tipo para as chaves das abas
 */
export type TabKey = keyof typeof tabSchemas;

/**
 * Função para validar uma aba específica
 */
export function validateTab(tabKey: TabKey, data: any) {
  return tabSchemas[tabKey].safeParse(data);
}

/**
 * Schema para o payload final que será enviado para o banco
 */
export const finalPayloadSchema = z.object({
  formDataJSON: z.object({
    client_context: z.object({
      client_id: z.string(),
      client_name: z.string(),
      industry: z.string(),
      richness_score: z.number().min(0).max(100),
      business_details: z.string().optional()
    }),
    informacoes_basicas: informacoesBasicasSchema,
    detalhes_do_setor: detalhesSetorSchema,
    marketing: marketingSchema,
    comercial: comercialSchema
  }),
  clientSnapshot: z.object({
    id: z.string(),
    name: z.string(),
    industry: z.string(),
    richnessScore: z.number().min(0).max(100),
    businessDetails: z.string().optional(),
    createdAt: z.string().or(z.date()),
    snapshot_timestamp: z.string()
  })
});

/**
 * Tipo para o payload final
 */
export type FinalPayload = z.infer<typeof finalPayloadSchema>;

/**
 * Valores padrão para o formulário
 */
export function getDefaultValues(clientIndustry?: string): {
  informacoes_basicas?: Partial<PlanningFormData['informacoes_basicas']>;
  detalhes_do_setor?: Partial<PlanningFormData['detalhes_do_setor']>;
  marketing?: Partial<PlanningFormData['marketing']>;
  comercial?: Partial<PlanningFormData['comercial']>;
} {
  return {
    informacoes_basicas: {
      titulo_planejamento: "",
      descricao_objetivo: "",
      setor: clientIndustry as any || ""
    },
    detalhes_do_setor: {},
    marketing: {
      meta_marketing: "",
      meta_marketing_personalizada: ""
    },
    comercial: {
      meta_comercial: "",
      meta_comercial_personalizada: ""
    }
  };
}

/**
 * Função para validar apenas uma seção específica
 */
export function validateSection(section: keyof PlanningFormData, data: any): { success: boolean; errors: any } {
  try {
    switch (section) {
      case 'informacoes_basicas':
        informacoesBasicasSchema.parse(data);
        break;
      case 'detalhes_do_setor':
        detalhesSetorSchema.parse(data);
        break;
      case 'marketing':
        marketingSchema.parse(data);
        break;
      case 'comercial':
        comercialSchema.parse(data);
        break;
      default:
        throw new Error(`Seção desconhecida: ${section}`);
    }
    return { success: true, errors: null };
  } catch (error) {
    if (error instanceof z.ZodError) {
      return { success: false, errors: error.flatten().fieldErrors };
    }
    return { success: false, errors: { _form: ["Erro de validação"] } };
  }
}

/**
 * Função para calcular progresso baseado nos dados preenchidos
 */
export function calculateProgress(data: Partial<PlanningFormData>): number {
  const sectionWeights = {
    informacoes_basicas: 25,
    detalhes_do_setor: 25,
    marketing: 25,
    comercial: 25
  };

  let totalProgress = 0;

  // Progresso das informações básicas
  if (data.informacoes_basicas) {
    const basicInfo = data.informacoes_basicas;
    let basicProgress = 0;
    const basicFields = ['titulo_planejamento', 'descricao_objetivo', 'setor'];
    const filledBasicFields = basicFields.filter(field => basicInfo[field as keyof typeof basicInfo]);
    basicProgress = (filledBasicFields.length / basicFields.length) * sectionWeights.informacoes_basicas;
    totalProgress += basicProgress;
  }

  // Progresso dos detalhes do setor (baseado na quantidade de campos preenchidos)
  if (data.detalhes_do_setor) {
    const sectorDetails = data.detalhes_do_setor;
    const filledSectorFields = Object.values(sectorDetails).filter(value => 
      value !== null && value !== undefined && value !== ""
    );
    // Assumindo 8 perguntas por setor em média
    const expectedSectorFields = 8;
    const sectorProgress = Math.min(filledSectorFields.length / expectedSectorFields, 1) * sectionWeights.detalhes_do_setor;
    totalProgress += sectorProgress;
  }

  // Progresso do marketing
  if (data.marketing) {
    const marketing = data.marketing;
    let marketingProgress = 0;
    if (marketing.maturidade_marketing) marketingProgress += 0.5;
    if (marketing.meta_marketing) marketingProgress += 0.5;
    totalProgress += marketingProgress * sectionWeights.marketing;
  }

  // Progresso do comercial
  if (data.comercial) {
    const comercial = data.comercial;
    let comercialProgress = 0;
    if (comercial.maturidade_comercial) comercialProgress += 0.5;
    if (comercial.meta_comercial) comercialProgress += 0.5;
    totalProgress += comercialProgress * sectionWeights.comercial;
  }

  return Math.round(totalProgress);
} 