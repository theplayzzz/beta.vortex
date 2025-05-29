import { z } from "zod";
import { SETORES_PERMITIDOS } from "./sectorConfig";

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
  setor: z
    .string()
    .refine((val) => SETORES_PERMITIDOS.includes(val as any), {
      message: "Setor inválido"
    })
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
  maturidade_marketing: z
    .string()
    .min(1, "Selecione uma maturidade de marketing"),
  meta_marketing: z
    .string()
    .optional(),
  meta_marketing_personalizada: z
    .string()
    .optional()
}).refine((data) => {
  // Se meta_marketing for "Outro", meta_marketing_personalizada é obrigatória
  if (data.meta_marketing === "Outro") {
    return data.meta_marketing_personalizada && data.meta_marketing_personalizada.trim().length > 0;
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
  maturidade_comercial: z
    .string()
    .min(1, "Selecione uma maturidade comercial"),
  meta_comercial: z
    .string()
    .optional(),
  meta_comercial_personalizada: z
    .string()
    .optional()
}).refine((data) => {
  // Se meta_comercial for "Outro", meta_comercial_personalizada é obrigatória
  if (data.meta_comercial === "Outro") {
    return data.meta_comercial_personalizada && data.meta_comercial_personalizada.trim().length > 0;
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