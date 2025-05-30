interface PollingLogData {
  planningId: string;
  action: 'start' | 'stop' | 'success' | 'error' | 'retry';
  timestamp?: Date;
  data?: any;
  error?: Error;
  retryCount?: number;
  interval?: number;
}

class PollingLogger {
  private history: PollingLogData[] = [];
  private maxHistorySize = 100;

  logPollingEvent(data: PollingLogData): void {
    const logEntry: PollingLogData = {
      ...data,
      timestamp: new Date()
    };

    this.history.unshift(logEntry);
    
    // Manter apenas os últimos registros
    if (this.history.length > this.maxHistorySize) {
      this.history = this.history.slice(0, this.maxHistorySize);
    }

    // Log estruturado no console
    const emoji = this.getEmojiForAction(data.action);
    const message = this.formatLogMessage(logEntry);
    
    switch (data.action) {
      case 'error':
        console.error(`${emoji} ${message}`, logEntry);
        break;
      case 'success':
        console.log(`${emoji} ${message}`, logEntry);
        break;
      case 'retry':
        console.warn(`${emoji} ${message}`, logEntry);
        break;
      default:
        console.log(`${emoji} ${message}`, logEntry);
    }
  }

  getPollingHistory(planningId?: string): PollingLogData[] {
    if (planningId) {
      return this.history.filter(log => log.planningId === planningId);
    }
    return [...this.history];
  }

  clearHistory(): void {
    this.history = [];
    console.log('🧹 Histórico de polling limpo');
  }

  getLastError(planningId: string): PollingLogData | null {
    return this.history.find(
      log => log.planningId === planningId && log.action === 'error'
    ) || null;
  }

  getPollingStats(planningId: string): {
    totalAttempts: number;
    errors: number;
    successes: number;
    retries: number;
    averageInterval: number;
  } {
    const logs = this.getPollingHistory(planningId);
    
    const stats = {
      totalAttempts: logs.filter(log => ['start', 'retry'].includes(log.action)).length,
      errors: logs.filter(log => log.action === 'error').length,
      successes: logs.filter(log => log.action === 'success').length,
      retries: logs.filter(log => log.action === 'retry').length,
      averageInterval: 0
    };

    // Calcular intervalo médio
    const intervals = logs
      .filter(log => log.interval)
      .map(log => log.interval!);
    
    if (intervals.length > 0) {
      stats.averageInterval = intervals.reduce((sum, interval) => sum + interval, 0) / intervals.length;
    }

    return stats;
  }

  private getEmojiForAction(action: string): string {
    const emojis = {
      start: '🔄',
      stop: '🛑',
      success: '✅',
      error: '❌',
      retry: '🔁'
    };
    return emojis[action as keyof typeof emojis] || '📊';
  }

  private formatLogMessage(log: PollingLogData): string {
    const time = log.timestamp?.toLocaleTimeString('pt-BR') || 'Não disponível';
    
    switch (log.action) {
      case 'start':
        return `[${time}] Polling iniciado para planejamento ${log.planningId}`;
      case 'stop':
        return `[${time}] Polling parado para planejamento ${log.planningId}`;
      case 'success':
        return `[${time}] Polling bem-sucedido para planejamento ${log.planningId}`;
      case 'error':
        return `[${time}] Erro no polling para planejamento ${log.planningId}: ${log.error?.message}`;
      case 'retry':
        return `[${time}] Retry ${log.retryCount} para planejamento ${log.planningId}`;
      default:
        return `[${time}] Ação ${log.action} para planejamento ${log.planningId}`;
    }
  }

  // Método para debug - exportar logs como JSON
  exportLogs(): string {
    return JSON.stringify(this.history, null, 2);
  }

  // Método para limpar logs antigos (mais de 24h)
  cleanOldLogs(): void {
    const oneDayAgo = new Date(Date.now() - 24 * 60 * 60 * 1000);
    const initialCount = this.history.length;
    
    this.history = this.history.filter(log => log.timestamp && log.timestamp > oneDayAgo);
    
    const removedCount = initialCount - this.history.length;
    if (removedCount > 0) {
      console.log(`🧹 Removidos ${removedCount} logs antigos do histórico`);
    }
  }
}

// Instância singleton
export const pollingLogger = new PollingLogger();

// Auto-limpeza de logs antigos a cada hora
if (typeof window !== 'undefined') {
  setInterval(() => {
    pollingLogger.cleanOldLogs();
  }, 60 * 60 * 1000); // 1 hora
} 