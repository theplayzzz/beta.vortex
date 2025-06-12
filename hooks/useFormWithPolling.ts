import { useState, useCallback } from 'react';
import { useProposalPollingContext } from '@/components/proposals/ProposalPollingProvider';

interface FormSubmitResponse {
  proposal: {
    id: string;
    title: string;
    clientId: string;
    status: string;
  };
  message: string;
  status: string;
}

interface UseFormWithPollingOptions {
  onSuccess?: (response: FormSubmitResponse) => void;
  onError?: (error: any) => void;
  redirectAfterSubmit?: boolean;
  redirectUrl?: string;
}

export function useFormWithPolling(options: UseFormWithPollingOptions = {}) {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const { startPolling } = useProposalPollingContext();

  const submitForm = useCallback(async (formData: any, endpoint: string) => {
    setIsSubmitting(true);
    setError(null);

    try {
      console.log('🚀 [Form] Enviando formulário para:', endpoint);

      const response = await fetch(endpoint, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(formData),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || `HTTP ${response.status}`);
      }

      const result: FormSubmitResponse = await response.json();
      
      console.log('✅ [Form] Formulário enviado com sucesso:', result);

      // Iniciar polling imediatamente após criar a proposta
      if (result.proposal?.id) {
        console.log('🔄 [Form] Iniciando polling para proposta:', result.proposal.id);
        startPolling(result.proposal.id);
      }

      // Callback de sucesso
      options.onSuccess?.(result);

      // Redirecionamento opcional
      if (options.redirectAfterSubmit) {
        const redirectUrl = options.redirectUrl || `/proposals/${result.proposal.id}`;
        console.log('🔀 [Form] Redirecionando para:', redirectUrl);
        
        // Pequeno delay para garantir que o polling começou
        setTimeout(() => {
          window.location.href = redirectUrl;
        }, 500);
      }

      return result;

    } catch (error: any) {
      console.error('❌ [Form] Erro no envio do formulário:', error);
      setError(error.message);
      options.onError?.(error);
      throw error;
    } finally {
      setIsSubmitting(false);
    }
  }, [startPolling, options]);

  const reset = useCallback(() => {
    setError(null);
    setIsSubmitting(false);
  }, []);

  return {
    submitForm,
    isSubmitting,
    error,
    reset
  };
}

// Hook específico para propostas
export function useProposalFormWithPolling(options: UseFormWithPollingOptions = {}) {
  const formHook = useFormWithPolling({
    ...options,
    redirectAfterSubmit: options.redirectAfterSubmit ?? true, // Default true para propostas
  });

  const submitProposal = useCallback((formData: any) => {
    return formHook.submitForm(formData, '/api/proposals/generate');
  }, [formHook]);

  return {
    ...formHook,
    submitProposal
  };
} 