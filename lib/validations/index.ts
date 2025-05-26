// Exportar todos os schemas e tipos de validação

// User schemas e tipos
export * from './user'

// Client schemas e tipos
export * from './client'

// Enums schemas e tipos
export * from './enums'

// Re-exportar Prisma types para conveniência
export type { 
  User as PrismaUser,
  Client as PrismaClient,
  ClientNote,
  ClientAttachment,
  StrategicPlanning,
  PlanningTask,
  TaskComment,
  TaskAttachment,
  AgentInteraction,
  AgentMessage,
  CommercialProposal,
  SalesArgument,
  CreditTransaction,
  PlanningStatus as PrismaPlanningStatus,
  TaskStatus as PrismaTaskStatus,
  TaskPriority as PrismaTaskPriority,
  MessageRole as PrismaMessageRole,
  ProposalStatus as PrismaProposalStatus,
  CreditTransactionType as PrismaCreditTransactionType
} from '@prisma/client' 