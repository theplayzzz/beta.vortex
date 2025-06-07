/**
 * Sistema de Monitoring e Logging Estruturado
 * Phase 8: Monitoring & Documentation
 */

import { environmentLogger, getEnvironmentConfig } from './environment-config';

export interface LogEntry {
  timestamp: string;
  level: 'info' | 'warn' | 'error' | 'debug';
  message: string;
  component: string;
  userId?: string;
  sessionId?: string;
  metadata?: Record<string, any>;
}

export interface ApprovalMetrics {
  totalUsers: number;
  pendingUsers: number;
  approvedUsers: number;
  rejectedUsers: number;
  suspendedUsers: number;
  approvalRate: number;
  avgApprovalTime: number;
  totalModerationActions: number;
}

/**
 * Logger estruturado para sistema de aprovação
 */
export class ApprovalSystemLogger {
  private static instance: ApprovalSystemLogger;
  private environment = getEnvironmentConfig();

  static getInstance(): ApprovalSystemLogger {
    if (!ApprovalSystemLogger.instance) {
      ApprovalSystemLogger.instance = new ApprovalSystemLogger();
    }
    return ApprovalSystemLogger.instance;
  }

  private createLogEntry(
    level: LogEntry['level'],
    message: string,
    component: string,
    metadata?: Record<string, any>,
    userId?: string
  ): LogEntry {
    return {
      timestamp: new Date().toISOString(),
      level,
      message,
      component,
      userId,
      sessionId: this.generateSessionId(),
      metadata: {
        environment: this.environment.environment,
        domain: this.environment.domain,
        ...metadata
      }
    };
  }

  private generateSessionId(): string {
    return `sess_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  private writeLog(entry: LogEntry): void {
    if (this.environment.isDevelopment) {
      // Desenvolvimento: log colorido
      const color = {
        info: '\x1b[36m',    // cyan
        warn: '\x1b[33m',    // yellow
        error: '\x1b[31m',   // red
        debug: '\x1b[90m'    // gray
      }[entry.level];
      
      console.log(
        `${color}[${entry.level.toUpperCase()}]`,
        `[${entry.component}]`,
        `${entry.message}\x1b[0m`,
        entry.metadata ? JSON.stringify(entry.metadata, null, 2) : ''
      );
    } else {
      // Produção: JSON estruturado
      console.log(JSON.stringify(entry));
    }
  }

  // Logs de sistema de aprovação
  userRegistered(userId: string, email: string, metadata?: Record<string, any>): void {
    this.writeLog(this.createLogEntry(
      'info',
      'Usuário registrado com status PENDING',
      'UserRegistration',
      { email, initialStatus: 'PENDING', ...metadata },
      userId
    ));
  }

  userApproved(userId: string, moderatorId: string, metadata?: Record<string, any>): void {
    this.writeLog(this.createLogEntry(
      'info',
      'Usuário aprovado por moderador',
      'UserApproval',
      { moderatorId, action: 'APPROVE', creditsGranted: 100, ...metadata },
      userId
    ));
  }

  userRejected(userId: string, moderatorId: string, reason: string, metadata?: Record<string, any>): void {
    this.writeLog(this.createLogEntry(
      'warn',
      'Usuário rejeitado por moderador',
      'UserRejection',
      { moderatorId, action: 'REJECT', reason, ...metadata },
      userId
    ));
  }

  userSuspended(userId: string, moderatorId: string, metadata?: Record<string, any>): void {
    this.writeLog(this.createLogEntry(
      'warn',
      'Usuário suspenso por moderador',
      'UserSuspension',
      { moderatorId, action: 'SUSPEND', ...metadata },
      userId
    ));
  }

  middlewareBlocked(userId: string, status: string, requestedPath: string, metadata?: Record<string, any>): void {
    this.writeLog(this.createLogEntry(
      'info',
      'Acesso bloqueado pelo middleware',
      'MiddlewareProtection',
      { status, requestedPath, redirected: true, ...metadata },
      userId
    ));
  }

  adminAccessDenied(userId: string, requestedResource: string, metadata?: Record<string, any>): void {
    this.writeLog(this.createLogEntry(
      'warn',
      'Tentativa de acesso negada a recurso admin',
      'AdminAccessControl',
      { requestedResource, reason: 'INSUFFICIENT_ROLE', ...metadata },
      userId
    ));
  }

  bypassAttempt(userId: string, method: string, metadata?: Record<string, any>): void {
    this.writeLog(this.createLogEntry(
      'error',
      'Tentativa de bypass detectada',
      'SecurityBreach',
      { method, blocked: true, severity: 'HIGH', ...metadata },
      userId
    ));
  }

  webhookReceived(eventType: string, userId?: string, metadata?: Record<string, any>): void {
    this.writeLog(this.createLogEntry(
      'info',
      'Webhook recebido do Clerk',
      'WebhookProcessor',
      { eventType, processed: true, ...metadata },
      userId
    ));
  }

  webhookError(eventType: string, error: string, metadata?: Record<string, any>): void {
    this.writeLog(this.createLogEntry(
      'error',
      'Erro no processamento de webhook',
      'WebhookProcessor',
      { eventType, error, requiresInvestigation: true, ...metadata }
    ));
  }

  performanceAlert(component: string, duration: number, threshold: number, metadata?: Record<string, any>): void {
    this.writeLog(this.createLogEntry(
      'warn',
      'Alerta de performance detectado',
      'PerformanceMonitor',
      { component, duration, threshold, impact: 'MEDIUM', ...metadata }
    ));
  }

  systemError(component: string, error: Error, metadata?: Record<string, any>): void {
    this.writeLog(this.createLogEntry(
      'error',
      'Erro do sistema',
      component,
      {
        error: {
          name: error.name,
          message: error.message,
          stack: error.stack
        },
        severity: 'HIGH',
        requiresAction: true,
        ...metadata
      }
    ));
  }
}

/**
 * Coletor de métricas do sistema de aprovação
 */
export class ApprovalMetricsCollector {
  private static instance: ApprovalMetricsCollector;
  private metrics: Map<string, number> = new Map();
  private timers: Map<string, number> = new Map();

  static getInstance(): ApprovalMetricsCollector {
    if (!ApprovalMetricsCollector.instance) {
      ApprovalMetricsCollector.instance = new ApprovalMetricsCollector();
    }
    return ApprovalMetricsCollector.instance;
  }

  // Contadores
  incrementCounter(metric: string, value: number = 1): void {
    const current = this.metrics.get(metric) || 0;
    this.metrics.set(metric, current + value);
  }

  getCounter(metric: string): number {
    return this.metrics.get(metric) || 0;
  }

  // Timers
  startTimer(operation: string): void {
    this.timers.set(operation, Date.now());
  }

  endTimer(operation: string): number {
    const startTime = this.timers.get(operation);
    if (!startTime) return 0;
    
    const duration = Date.now() - startTime;
    this.timers.delete(operation);
    
    // Salvar métrica de duração
    this.recordDuration(operation, duration);
    
    return duration;
  }

  recordDuration(operation: string, duration: number): void {
    const durationsKey = `${operation}_durations`;
    const countKey = `${operation}_count`;
    const totalKey = `${operation}_total_time`;
    
    this.incrementCounter(countKey);
    this.incrementCounter(totalKey, duration);
  }

  getAverageDuration(operation: string): number {
    const count = this.getCounter(`${operation}_count`);
    const total = this.getCounter(`${operation}_total_time`);
    
    return count > 0 ? total / count : 0;
  }

  // Métricas específicas do sistema de aprovação
  recordUserRegistration(): void {
    this.incrementCounter('users_registered');
    this.incrementCounter('users_pending'); // Inicialmente pending
  }

  recordUserApproval(): void {
    this.incrementCounter('users_approved');
    this.incrementCounter('users_pending', -1); // Remove de pending
  }

  recordUserRejection(): void {
    this.incrementCounter('users_rejected');
    this.incrementCounter('users_pending', -1); // Remove de pending
  }

  recordUserSuspension(): void {
    this.incrementCounter('users_suspended');
  }

  recordMiddlewareBlock(): void {
    this.incrementCounter('middleware_blocks');
  }

  recordAdminAccessDenied(): void {
    this.incrementCounter('admin_access_denied');
  }

  recordBypassAttempt(): void {
    this.incrementCounter('security_bypass_attempts');
  }

  recordWebhookProcessed(): void {
    this.incrementCounter('webhooks_processed');
  }

  recordWebhookError(): void {
    this.incrementCounter('webhook_errors');
  }

  // Gerar relatório de métricas
  generateMetricsReport(): ApprovalMetrics {
    const totalUsers = this.getCounter('users_registered');
    const approvedUsers = this.getCounter('users_approved');
    
    return {
      totalUsers,
      pendingUsers: this.getCounter('users_pending'),
      approvedUsers,
      rejectedUsers: this.getCounter('users_rejected'),
      suspendedUsers: this.getCounter('users_suspended'),
      approvalRate: totalUsers > 0 ? (approvedUsers / totalUsers) * 100 : 0,
      avgApprovalTime: this.getAverageDuration('user_approval'),
      totalModerationActions: this.getCounter('users_approved') + 
                             this.getCounter('users_rejected') + 
                             this.getCounter('users_suspended')
    };
  }

  // Exportar todas as métricas
  exportAllMetrics(): Record<string, number> {
    return Object.fromEntries(this.metrics);
  }
}

/**
 * Sistema de alertas
 */
export class AlertSystem {
  private static instance: AlertSystem;
  private logger = ApprovalSystemLogger.getInstance();
  private metrics = ApprovalMetricsCollector.getInstance();

  static getInstance(): AlertSystem {
    if (!AlertSystem.instance) {
      AlertSystem.instance = new AlertSystem();
    }
    return AlertSystem.instance;
  }

  // Verificar alertas de performance
  checkPerformanceAlerts(): void {
    const avgApprovalTime = this.metrics.getAverageDuration('user_approval');
    if (avgApprovalTime > 5000) { // 5 segundos
      this.logger.performanceAlert(
        'UserApproval',
        avgApprovalTime,
        5000,
        { alert: 'SLOW_APPROVAL_PROCESS' }
      );
    }

    const avgWebhookTime = this.metrics.getAverageDuration('webhook_processing');
    if (avgWebhookTime > 2000) { // 2 segundos
      this.logger.performanceAlert(
        'WebhookProcessor',
        avgWebhookTime,
        2000,
        { alert: 'SLOW_WEBHOOK_PROCESSING' }
      );
    }
  }

  // Verificar alertas de segurança
  checkSecurityAlerts(): void {
    const bypassAttempts = this.metrics.getCounter('security_bypass_attempts');
    if (bypassAttempts > 10) {
      this.logger.systemError(
        'SecurityMonitor',
        new Error(`${bypassAttempts} tentativas de bypass detectadas`),
        {
          alert: 'HIGH_BYPASS_ATTEMPTS',
          severity: 'CRITICAL',
          requiresImmediate: true
        }
      );
    }

    const accessDenied = this.metrics.getCounter('admin_access_denied');
    if (accessDenied > 50) {
      this.logger.systemError(
        'SecurityMonitor',
        new Error(`${accessDenied} tentativas de acesso admin negadas`),
        {
          alert: 'HIGH_ADMIN_ACCESS_ATTEMPTS',
          severity: 'HIGH'
        }
      );
    }
  }

  // Verificar alertas de webhook
  checkWebhookAlerts(): void {
    const webhookErrors = this.metrics.getCounter('webhook_errors');
    const webhooksProcessed = this.metrics.getCounter('webhooks_processed');
    
    if (webhooksProcessed > 0) {
      const errorRate = (webhookErrors / webhooksProcessed) * 100;
      if (errorRate > 10) { // Taxa de erro > 10%
        this.logger.systemError(
          'WebhookMonitor',
          new Error(`Taxa de erro de webhook: ${errorRate.toFixed(2)}%`),
          {
            alert: 'HIGH_WEBHOOK_ERROR_RATE',
            errorRate,
            totalWebhooks: webhooksProcessed,
            errors: webhookErrors
          }
        );
      }
    }
  }

  // Executar verificação completa de alertas
  runHealthCheck(): void {
    this.checkPerformanceAlerts();
    this.checkSecurityAlerts();
    this.checkWebhookAlerts();
  }
}

// Instâncias singleton exportadas
export const logger = ApprovalSystemLogger.getInstance();
export const metrics = ApprovalMetricsCollector.getInstance();
export const alerts = AlertSystem.getInstance(); 