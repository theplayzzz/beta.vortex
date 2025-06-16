/**
 * 🆕 PLAN-025: Sistema de Aprovação Automática via Webhook
 * Funções para verificar aprovação automática de usuários através de webhook externo
 */

// Interface para a resposta do webhook
interface WebhookResponse {
  "row_number"?: number;
  "nome contato"?: string;
  "email contato"?: string;
  "telefone contato"?: string;
  "Comprovante"?: string;
}

// Interface para o resultado da verificação
interface AutoApprovalResult {
  shouldApprove: boolean;
  webhookData?: WebhookResponse;
  error?: string;
}

/**
 * Verifica se um usuário deve ser aprovado automaticamente via webhook externo
 * 
 * @param email Email do usuário para verificação
 * @returns Resultado da verificação com status de aprovação
 */
export async function checkAutoApproval(email: string): Promise<AutoApprovalResult> {
  // 🛡️ SEGURANÇA: Se URL não configurada, seguir fluxo normal
  const webhookUrl = process.env.APROVACAO_WEBHOOK_URL;
  if (!webhookUrl) {
    console.log('[WEBHOOK_AUTO_APPROVAL] URL not configured, skipping auto approval');
    return { shouldApprove: false, error: 'APROVACAO_WEBHOOK_URL not configured' };
  }

  // Importar retry utility dinamicamente para evitar circular dependency
  const { withWebhookRetry } = await import('./retry-mechanism');

  return withWebhookRetry(async () => {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 8000); // Aumentado para 8s

    try {
      const response = await fetch(webhookUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'User-Agent': 'vortex-auto-approval',
          'Accept': '*/*'
        },
        body: JSON.stringify({
          event: "new_user_registered",
          data: {
            id: Math.floor(Math.random() * 1000),
            username: email,
            name: "Auto Check",
            email: email,
            aprovacao: false,
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString(),
            resetToken: null,
            resetTokenExpiry: null,
            timestamp: new Date().toISOString()
          }
        }),
        signal: controller.signal
      });

      clearTimeout(timeoutId);

      // 🛡️ TRATAMENTO: Não falhar se response não for JSON
      let data: any = {};
      try {
        data = await response.json();
      } catch (parseError) {
        console.log('[WEBHOOK_AUTO_APPROVAL] Response is not valid JSON, treating as not approved');
        return { shouldApprove: false, error: 'Invalid JSON response' };
      }

      // Critério: Status 200 + campo "email contato" presente
      const shouldApprove = response.status === 200 && !!data["email contato"];

      console.log(`[WEBHOOK_AUTO_APPROVAL] Status: ${response.status}, Should approve: ${shouldApprove}, Email: ${email}`);

      return {
        shouldApprove,
        webhookData: shouldApprove ? data : undefined
      };

    } finally {
      clearTimeout(timeoutId);
    }
  }, 'auto-approval-webhook').catch((error: any) => {
    // 🛡️ CRÍTICO: Nunca falhar por causa do webhook
    console.error('[WEBHOOK_AUTO_APPROVAL] All retry attempts failed, proceeding with normal flow:', error);
    return { 
      shouldApprove: false, 
      error: error.message || 'Webhook request failed after retries' 
    };
  });
}

/**
 * Função auxiliar para determinar se deve aprovar baseado na resposta do webhook
 * 
 * @param webhookResponse Resposta do webhook
 * @param statusCode Status code da resposta HTTP
 * @returns true se deve aprovar automaticamente
 */
export function shouldAutoApprove(webhookResponse: any, statusCode: number): boolean {
  // Se status 200 e resposta contém "email contato" = APROVAR
  if (statusCode === 200 && webhookResponse["email contato"]) {
    return true;
  }
  
  // Se status 500 ou não contém "email contato" = NÃO APROVAR
  return false;
}

// Exportar tipos para uso em outros arquivos
export type { WebhookResponse, AutoApprovalResult }; 