import { z } from 'zod'

// Enum para status de planejamento
export const PlanningStatusSchema = z.enum([
  // Status básicos
  'DRAFT', 'ACTIVE', 'COMPLETED', 'ARCHIVED',
  // Status reais do banco (249 planejamentos)
  'AWAITING_APPROVAL', 'GENERATING_REFINED', 'REFINED_COMPLETED',
  // Status de IA (reservados)
  'PENDING_AI_BACKLOG_GENERATION', 'AI_BACKLOG_VISIBLE', 'PENDING_AI_REFINED_LIST', 'AI_REFINED_LIST_VISIBLE'
])

// Enum para status de tarefa
export const TaskStatusSchema = z.enum(['TODO', 'IN_PROGRESS', 'REVIEW', 'DONE', 'BLOCKED'])

// Enum para prioridade de tarefa
export const TaskPrioritySchema = z.enum(['LOW', 'MEDIUM', 'HIGH', 'URGENT'])

// Enum para role de mensagem
export const MessageRoleSchema = z.enum(['USER', 'AI'])

// Enum para status de proposta
export const ProposalStatusSchema = z.enum([
  'DRAFT',
  'SENT', 
  'VIEWED',
  'ACCEPTED',
  'REJECTED',
  'NEGOTIATION',
  'ARCHIVED'
])

// Enum para tipo de transação de crédito
export const CreditTransactionTypeSchema = z.enum([
  'PURCHASE',
  'CONSUMPTION_PLANNING_INITIAL',
  'CONSUMPTION_PLANNING_DETAILED',
  'CONSUMPTION_AGENT_IA_MESSAGE',
  'CONSUMPTION_PROPOSAL_GENERATION',
  'CONSUMPTION_TASK_IA_ASSIST',
  'CONSUMPTION_SALES_ARGUMENT_IA',
  'CONSUMPTION_MEETING_INSIGHTS_IA',
  'CONSUMPTION_PITCH_ANALYSIS_IA',
  'ADJUSTMENT_ADMIN',
  'INITIAL_GRANT'
])

// Tipos TypeScript derivados dos schemas
export type PlanningStatus = z.infer<typeof PlanningStatusSchema>
export type TaskStatus = z.infer<typeof TaskStatusSchema>
export type TaskPriority = z.infer<typeof TaskPrioritySchema>
export type MessageRole = z.infer<typeof MessageRoleSchema>
export type ProposalStatus = z.infer<typeof ProposalStatusSchema>
export type CreditTransactionType = z.infer<typeof CreditTransactionTypeSchema> 