import { Client } from '@/components/planning/ClientFormContext';
import { PlanningFormData, getDefaultValues } from './formSchema';
import { generateUUID } from '@/lib/utils/uuid';

/**
 * Interface para o contexto do cliente no formulário
 */
export interface ClientContext {
  client_id: string;
  client_name: string;
  industry: string;
  richness_score: number;
  business_details?: string;
  snapshot_timestamp: string;
}

/**
 * Interface para o payload final que será enviado para o banco
 */
export interface FormSubmissionPayload {
  title: string;
  description?: string;
  clientId: string;
  formDataJSON: {
    client_context: ClientContext;
    form_data: PlanningFormData;
    submission_metadata: {
      submitted_at: string;
      form_version: string;
      session_id: string;
    };
  };
  clientSnapshot: {
    id: string;
    name: string;
    industry: string;
    richnessScore: number;
    businessDetails?: string;
    createdAt?: Date | string;
    snapshot_timestamp: string;
  };
}

/**
 * Mapeia dados do cliente para o contexto do formulário
 */
export function mapClientToFormContext(client: Client): ClientContext {
  return {
    client_id: client.id,
    client_name: client.name,
    industry: client.industry,
    richness_score: client.richnessScore,
    business_details: client.businessDetails || '',
    snapshot_timestamp: new Date().toISOString(),
  };
}

/**
 * Cria snapshot do cliente para o banco de dados
 */
export function createClientSnapshot(client: Client) {
  return {
    id: client.id,
    name: client.name,
    industry: client.industry,
    richnessScore: client.richnessScore,
    businessDetails: client.businessDetails || '',
    createdAt: client.createdAt || new Date(),
    snapshot_timestamp: new Date().toISOString(),
  };
}

/**
 * Inicializa dados padrão do formulário com contexto do cliente
 */
export function initializeFormWithClient(client: Client): any {
  const defaultValues = getDefaultValues(client.industry);
  
  return {
    ...defaultValues,
    informacoes_basicas: {
      ...defaultValues.informacoes_basicas,
      titulo_planejamento: `Planejamento Estratégico - ${client.name}`,
      descricao_objetivo: `Planejamento estratégico desenvolvido para ${client.name} no setor de ${client.industry}`,
      setor: client.industry as any,
    },
  };
}

/**
 * Prepara o payload final para submissão
 */
export function prepareFinalSubmissionPayload(
  client: Client,
  formData: PlanningFormData,
  sessionId: string = generateUUID()
): FormSubmissionPayload {
  const clientContext = mapClientToFormContext(client);
  const clientSnapshot = createClientSnapshot(client);
  
  return {
    title: formData.informacoes_basicas.titulo_planejamento,
    description: formData.informacoes_basicas.descricao_objetivo,
    clientId: client.id,
    formDataJSON: {
      client_context: clientContext,
      form_data: formData,
      submission_metadata: {
        submitted_at: new Date().toISOString(),
        form_version: '1.0.0',
        session_id: sessionId,
      },
    },
    clientSnapshot,
  };
}

/**
 * Função para validar se o cliente é compatível com o formulário
 */
export function validateClientForForm(client: Client): {
  isValid: boolean;
  errors: string[];
  warnings: string[];
} {
  const errors: string[] = [];
  const warnings: string[] = [];

  // Validações obrigatórias
  if (!client.id) {
    errors.push('Cliente deve ter um ID válido');
  }

  if (!client.name || client.name.trim().length === 0) {
    errors.push('Cliente deve ter um nome');
  }

  if (!client.industry || client.industry.trim().length === 0) {
    errors.push('Cliente deve ter um setor/indústria definido');
  }

  // Validações de aviso
  if (client.richnessScore < 50) {
    warnings.push('Cliente com baixa qualificação (richness score < 30). Considere coletar mais informações.');
  }

  if (!client.businessDetails || client.businessDetails.trim().length === 0) {
    warnings.push('Cliente sem detalhes de negócio. Isso pode afetar a qualidade das perguntas do setor.');
  }

  return {
    isValid: errors.length === 0,
    errors,
    warnings,
  };
}

/**
 * Gera um título automático baseado no cliente e tipo de planejamento
 */
export function generateAutomaticTitle(
  client: Client, 
  planningType: 'estrategico' | 'marketing' | 'comercial' = 'estrategico'
): string {
  const typeMap = {
    estrategico: 'Planejamento Estratégico',
    marketing: 'Planejamento de Marketing',
    comercial: 'Planejamento Comercial',
  };

  const currentDate = new Date();
  const year = currentDate.getFullYear();
  const month = String(currentDate.getMonth() + 1).padStart(2, '0');

  return `${typeMap[planningType]} - ${client.name} (${month}/${year})`;
} 