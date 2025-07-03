import { Client } from '@prisma/client';
import { waitUntil } from '@vercel/functions';

interface WebhookPayload {
  planning_id: string;
  timestamp: string;
  client_info: {
    id: string;
    name: string;
    industry: string;
    richnessScore: number;
    businessDetails: string;
    contactEmail: string;
    website: string;
    data_quality: string;
  };
  form_submission_data: any;
  context_enrichment: {
    client_richness_level: string;
    industry_specific_insights: boolean;
    personalization_level: string;
    recommended_task_complexity: string;
  };
  submission_metadata: {
    user_id: string;
    submitted_at: string;
    form_version: string;
    session_id: string;
  };
}

interface WebhookOptions {
  maxRetries?: number;
  retryDelay?: number;
  timeout?: number;
}

/**
 * Serviço de Webhook Fire-and-Forget
 * Envia webhook de forma completamente assíncrona e independente do fluxo principal
 */
class WebhookService {
  private static instance: WebhookService;
  private readonly defaultOptions: Required<WebhookOptions> = {
    maxRetries: 3,
    retryDelay: 2000, // 2 segundos
    timeout: 30000, // 30 segundos
  };

  static getInstance(): WebhookService {
    if (!WebhookService.instance) {
      WebhookService.instance = new WebhookService();
    }
    return WebhookService.instance;
  }

  /**
   * Dispara webhook de forma assíncrona sem bloquear o fluxo principal
   */
  async triggerWebhookAsync(
    planningId: string,
    client: Client,
    formData: any,
    userId: string,
    options?: WebhookOptions
  ): Promise<void> {
    // Usar waitUntil do Vercel para garantir execução em ambiente serverless
    waitUntil(
      this.executeWebhookWithRetry(planningId, client, formData, userId, options)
    );
  }

  /**
   * Executa webhook com sistema de retry automático
   */
  private async executeWebhookWithRetry(
    planningId: string,
    client: Client,
    formData: any,
    userId: string,
    options?: WebhookOptions
  ): Promise<void> {
    const opts = { ...this.defaultOptions, ...options };
    const webhookUrl = process.env.PLANNING_WEBHOOK_URL;

    if (!webhookUrl) {
      console.warn(`⚠️ [Webhook ${planningId}] PLANNING_WEBHOOK_URL não configurada - webhook não enviado`);
      return;
    }

    const payload = this.buildWebhookPayload(planningId, client, formData, userId);
    
    console.log(`📡 [Webhook ${planningId}] Iniciando envio assíncrono para: ${webhookUrl}`);
    console.log(`🔄 [Webhook ${planningId}] Configuração: maxRetries=${opts.maxRetries}, timeout=${opts.timeout}ms`);

    for (let attempt = 1; attempt <= opts.maxRetries; attempt++) {
      try {
        const success = await this.sendWebhook(webhookUrl, payload, opts.timeout);
        
        if (success) {
          console.log(`✅ [Webhook ${planningId}] Enviado com sucesso na tentativa ${attempt}/${opts.maxRetries}`);
          return;
        }
        
        if (attempt < opts.maxRetries) {
          console.log(`⏳ [Webhook ${planningId}] Tentativa ${attempt} falhou, aguardando ${opts.retryDelay}ms para retry...`);
          await this.delay(opts.retryDelay);
        }
        
      } catch (error) {
        console.error(`❌ [Webhook ${planningId}] Erro na tentativa ${attempt}/${opts.maxRetries}:`, error);
        
        if (attempt < opts.maxRetries) {
          await this.delay(opts.retryDelay);
        }
      }
    }

    console.error(`🚨 [Webhook ${planningId}] FALHA FINAL - Todas as ${opts.maxRetries} tentativas falharam`);
  }

  /**
   * Envia webhook com timeout
   */
  private async sendWebhook(url: string, payload: WebhookPayload, timeout: number): Promise<boolean> {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), timeout);

    try {
      const originDomain = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3003';
      
      const response = await fetch(url, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'X-Webhook-Secret': process.env.WEBHOOK_SECRET || '',
          'X-Origin-Domain': originDomain,
          'User-Agent': 'Vortex-Planning-System/1.0',
        },
        body: JSON.stringify(payload),
        signal: controller.signal,
      });

      if (response.ok) {
        const responseText = await response.text();
        console.log(`📥 [Webhook ${payload.planning_id}] Resposta recebida: ${response.status} ${response.statusText}`);
        if (responseText) {
          console.log(`📄 [Webhook ${payload.planning_id}] Corpo da resposta:`, responseText);
        }
        return true;
      } else {
        const errorText = await response.text();
        console.error(`❌ [Webhook ${payload.planning_id}] Erro HTTP ${response.status}: ${errorText}`);
        return false;
      }
    } catch (error) {
      if (error instanceof Error && error.name === 'AbortError') {
        console.error(`⏰ [Webhook ${payload.planning_id}] Timeout após ${timeout}ms`);
      } else {
        console.error(`🔌 [Webhook ${payload.planning_id}] Erro de rede:`, error);
      }
      return false;
    } finally {
      clearTimeout(timeoutId);
    }
  }

  /**
   * Constrói payload do webhook
   */
  private buildWebhookPayload(
    planningId: string,
    client: Client,
    formData: any,
    userId: string
  ): WebhookPayload {
    const richnessScore = client.richnessScore || 0;
    const getQualityLevel = (score: number) => 
      score > 80 ? "alto" : score > 50 ? "médio" : "baixo";
    const getComplexityLevel = (score: number) => 
      score > 80 ? "avançado" : "intermediário";

    return {
      planning_id: planningId,
      timestamp: new Date().toISOString(),
      client_info: {
        id: client.id,
        name: client.name,
        industry: client.industry || 'Não informado',
        richnessScore: richnessScore,
        businessDetails: client.businessDetails || 'Não informado',
        contactEmail: client.contactEmail || 'Não informado',
        website: client.website || 'Não informado',
        data_quality: getQualityLevel(richnessScore),
      },
      form_submission_data: formData || {},
      context_enrichment: {
        client_richness_level: getQualityLevel(richnessScore),
        industry_specific_insights: true,
        personalization_level: getComplexityLevel(richnessScore),
        recommended_task_complexity: getComplexityLevel(richnessScore),
      },
      submission_metadata: {
        user_id: userId,
        submitted_at: new Date().toISOString(),
        form_version: "1.0",
        session_id: `session_${planningId}`,
      },
    };
  }

  /**
   * Delay helper para retry
   */
  private delay(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
  }
}

// Export singleton instance
export const webhookService = WebhookService.getInstance();

// Export types
export type { WebhookPayload, WebhookOptions }; 