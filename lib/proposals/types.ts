import { 
  TipoProposta, 
  ModalidadeEntrega, 
  ServicoIncluido,
  UrgenciaProjeto,
  OrcamentoEstimado 
} from './proposalConfig';

export interface Client {
  id: string;
  name: string;
  industry: string;
  richnessScore: number;
  businessDetails?: string;
  createdAt?: Date;
}

// Dados do formulário de proposta
export interface ProposalFormData {
  // Aba 1: Informações Básicas
  titulo_proposta: string;
  tipo_proposta: TipoProposta | '';
  descricao_objetivo: string;
  prazo_estimado: string;
  
  // Aba 2: Escopo de Serviços
  modalidade_entrega: ModalidadeEntrega | '';
  servicos_incluidos: ServicoIncluido[];
  requisitos_especiais: string;
  
  // Aba 3: Contexto Comercial
  orcamento_estimado?: OrcamentoEstimado | '';
  concorrentes_considerados: string;
  urgencia_projeto: UrgenciaProjeto | '';
  tomador_decisao: string;
  contexto_adicional: string;
}

// Estado de validação por aba
export interface TabValidation {
  isValid: boolean;
  completionPercentage: number;
}

export interface FormValidationState {
  basicInfo: TabValidation;
  scope: TabValidation;
  commercial: TabValidation;
  overall: {
    isValid: boolean;
    completionPercentage: number;
  };
}

// Payload para webhook
export interface ProposalWebhookPayload {
  proposal_id: string;
  user_info: {
    id: string;
    name: string;
    email: string;
  };
  client_info: {
    id: string;
    name: string;
    industry: string;
    richnessScore: number;
    businessDetails?: string;
  };
  proposal_requirements: ProposalFormData;
} 