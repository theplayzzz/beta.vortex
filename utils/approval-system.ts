/**
 * 🆕 PLAN-018: Sistema de Aprovação de Usuários
 * Utilitários para configuração dinâmica de ambiente e sistema de aprovação
 */

// ==========================================
// CONFIGURAÇÃO DINÂMICA DE AMBIENTE
// ==========================================

/**
 * Retorna a URL base da aplicação baseada no ambiente
 * - Desenvolvimento local: usa NEXT_PUBLIC_APP_URL ou fallback localhost:3003
 * - Produção Vercel: usa VERCEL_URL automaticamente
 */
export function getBaseUrl(): string {
  // Se estamos no Vercel (produção/preview), usar VERCEL_URL
  if (process.env.VERCEL_URL) {
    return `https://${process.env.VERCEL_URL}`;
  }
  
  // Se temos NEXT_PUBLIC_APP_URL configurado (desenvolvimento)
  if (process.env.NEXT_PUBLIC_APP_URL) {
    return process.env.NEXT_PUBLIC_APP_URL;
  }
  
  // Fallback para desenvolvimento local
  return 'http://localhost:3003';
}

/**
 * Retorna a URL completa do webhook do Clerk baseada no ambiente
 */
export function getClerkWebhookUrl(): string {
  const baseUrl = getBaseUrl();
  return `${baseUrl}/api/webhooks/clerk`;
}

/**
 * Detecta o ambiente atual
 */
export function getEnvironment(): 'development' | 'preview' | 'production' {
  if (process.env.VERCEL_ENV === 'production') return 'production';
  if (process.env.VERCEL_ENV === 'preview') return 'preview';
  return 'development';
}

// ==========================================
// SISTEMA DE APROVAÇÃO - HELPERS
// ==========================================

/**
 * Status de aprovação disponíveis
 */
export const APPROVAL_STATUS = {
  PENDING: 'PENDING',
  APPROVED: 'APPROVED', 
  REJECTED: 'REJECTED',
  SUSPENDED: 'SUSPENDED'
} as const;

export type ApprovalStatus = typeof APPROVAL_STATUS[keyof typeof APPROVAL_STATUS];

/**
 * Ações de moderação disponíveis
 */
export const MODERATION_ACTION = {
  APPROVE: 'APPROVE',
  REJECT: 'REJECT',
  SUSPEND: 'SUSPEND',
  UNSUSPEND: 'UNSUSPEND',
  RESET_TO_PENDING: 'RESET_TO_PENDING'
} as const;

export type ModerationAction = typeof MODERATION_ACTION[keyof typeof MODERATION_ACTION];

/**
 * Verifica se um usuário é admin baseado no Clerk ID
 */
export function isUserAdmin(clerkId: string): boolean {
  const adminIds = process.env.ADMIN_CLERK_USER_IDS?.split(',').map(id => id.trim()) || [];
  return adminIds.includes(clerkId);
}

/**
 * Verifica se o sistema de aprovação está habilitado
 */
export function isApprovalRequired(): boolean {
  return process.env.APPROVAL_REQUIRED === 'true';
}

/**
 * Retorna o status padrão para novos usuários
 */
export function getDefaultUserStatus(): ApprovalStatus {
  const defaultStatus = process.env.DEFAULT_USER_STATUS as ApprovalStatus;
  return defaultStatus || APPROVAL_STATUS.PENDING;
}

/**
 * Valida se um status de aprovação é válido
 */
export function isValidApprovalStatus(status: string): status is ApprovalStatus {
  return Object.values(APPROVAL_STATUS).includes(status as ApprovalStatus);
}

/**
 * Valida se uma ação de moderação é válida
 */
export function isValidModerationAction(action: string): action is ModerationAction {
  return Object.values(MODERATION_ACTION).includes(action as ModerationAction);
}

/**
 * Mapeia ação de moderação para o novo status resultante
 */
export function getNewStatusFromAction(action: ModerationAction): ApprovalStatus {
  switch (action) {
    case MODERATION_ACTION.APPROVE:
      return APPROVAL_STATUS.APPROVED;
    case MODERATION_ACTION.REJECT:
      return APPROVAL_STATUS.REJECTED;
    case MODERATION_ACTION.SUSPEND:
      return APPROVAL_STATUS.SUSPENDED;
    case MODERATION_ACTION.UNSUSPEND:
    case MODERATION_ACTION.RESET_TO_PENDING:
      return APPROVAL_STATUS.PENDING;
    default:
      throw new Error(`Invalid moderation action: ${action}`);
  }
}

// ==========================================
// LOGGING E DEBUG
// ==========================================

/**
 * Log estruturado para auditoria do sistema de aprovação
 */
export function logApprovalAction(data: {
  action: string;
  userId: string;
  moderatorId: string;
  environment: string;
  timestamp: Date;
  metadata?: Record<string, any>;
}) {
  console.log('[APPROVAL_SYSTEM]', JSON.stringify({
    ...data,
    timestamp: data.timestamp.toISOString()
  }));
}

/**
 * Debug das configurações do ambiente atual
 */
export function debugEnvironmentConfig() {
  if (process.env.NODE_ENV === 'development') {
    console.log('[APPROVAL_SYSTEM_DEBUG]', {
      environment: getEnvironment(),
      baseUrl: getBaseUrl(),
      webhookUrl: getClerkWebhookUrl(),
      approvalRequired: isApprovalRequired(),
      defaultStatus: getDefaultUserStatus(),
      adminCount: process.env.ADMIN_CLERK_USER_IDS?.split(',').length || 0
    });
  }
} 