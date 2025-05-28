import { z } from 'zod'
import { SETORES_PERMITIDOS } from '@/lib/constants/sectors'

// Schema base para Client
export const ClientSchema = z.object({
  id: z.string().cuid(),
  name: z.string().min(1, 'Nome é obrigatório'),
  industry: z.enum(SETORES_PERMITIDOS, {
    errorMap: () => ({ message: "Selecione um setor válido" })
  }).nullable(),
  serviceOrProduct: z.string().nullable(),
  initialObjective: z.string().nullable(),
  
  // Informações detalhadas
  contactEmail: z.string().email().nullable(),
  contactPhone: z.string().nullable(),
  website: z.string().url().nullable(),
  address: z.string().nullable(),
  businessDetails: z.string().nullable(),
  targetAudience: z.string().nullable(),
  marketingObjectives: z.string().nullable(),
  historyAndStrategies: z.string().nullable(),
  challengesOpportunities: z.string().nullable(),
  competitors: z.string().nullable(),
  resourcesBudget: z.string().nullable(),
  toneOfVoice: z.string().nullable(),
  preferencesRestrictions: z.string().nullable(),
  
  richnessScore: z.number().int().min(0).max(100).default(0),
  userId: z.string().cuid(),
  createdAt: z.date(),
  updatedAt: z.date(),
})

// Schema para criação de cliente (campos obrigatórios mínimos)
export const CreateClientSchema = z.object({
  name: z.string().min(1, 'Nome é obrigatório'),
  industry: z.enum(SETORES_PERMITIDOS, {
    errorMap: () => ({ message: "Selecione um setor válido" })
  }).optional(),
  serviceOrProduct: z.string().optional(),
  initialObjective: z.string().optional(),
  businessDetails: z.string().optional(), // Para campo "Outro"
  userId: z.string().cuid(),
})

// Schema para atualização de cliente
export const UpdateClientSchema = z.object({
  name: z.string().min(1, 'Nome é obrigatório').optional(),
  industry: z.enum(SETORES_PERMITIDOS, {
    errorMap: () => ({ message: "Selecione um setor válido" })
  }).nullable().optional(),
  serviceOrProduct: z.string().nullable().optional(),
  initialObjective: z.string().nullable().optional(),
  
  // Informações detalhadas - simplificadas para debug
  contactEmail: z.string().nullable().optional(),
  contactPhone: z.string().nullable().optional(),
  website: z.string().nullable().optional(),
  address: z.string().nullable().optional(),
  businessDetails: z.string().nullable().optional(),
  targetAudience: z.string().nullable().optional(),
  marketingObjectives: z.string().nullable().optional(),
  historyAndStrategies: z.string().nullable().optional(),
  challengesOpportunities: z.string().nullable().optional(),
  competitors: z.string().nullable().optional(),
  resourcesBudget: z.string().nullable().optional(),
  toneOfVoice: z.string().nullable().optional(),
  preferencesRestrictions: z.string().nullable().optional(),
  
  richnessScore: z.number().int().min(0).max(100).optional(),
})

// Schema para o formulário inicial de cliente (pop-up)
export const ClientInitialFormSchema = z.object({
  name: z.string().min(1, 'Nome é obrigatório'),
  industry: z.enum(SETORES_PERMITIDOS, {
    errorMap: () => ({ message: "Selecione um setor válido" })
  }).optional(),
  serviceOrProduct: z.string().optional(),
  initialObjective: z.string().optional(),
  businessDetails: z.string().optional(), // Para campo "Outro"
})

// Schema para enriquecimento progressivo
export const ClientEnrichmentSchema = z.object({
  contactEmail: z.string().email().optional(),
  contactPhone: z.string().optional(),
  website: z.string().url().optional(),
  address: z.string().optional(),
  businessDetails: z.string().optional(),
  targetAudience: z.string().optional(),
  marketingObjectives: z.string().optional(),
  historyAndStrategies: z.string().optional(),
  challengesOpportunities: z.string().optional(),
  competitors: z.string().optional(),
  resourcesBudget: z.string().optional(),
  toneOfVoice: z.string().optional(),
  preferencesRestrictions: z.string().optional(),
})

// Tipos TypeScript derivados dos schemas
export type Client = z.infer<typeof ClientSchema>
export type CreateClient = z.infer<typeof CreateClientSchema>
export type UpdateClient = z.infer<typeof UpdateClientSchema>
export type ClientInitialForm = z.infer<typeof ClientInitialFormSchema>
export type ClientEnrichment = z.infer<typeof ClientEnrichmentSchema> 