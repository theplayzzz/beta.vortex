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

// 🆕 INTERFACES PARA CONTEÚDO DA IA
export interface AIGeneratedContent {
  proposta_html: string;
  proposta_markdown: string;
  dados_extras: {
    valor_total: number;
    prazo_total_dias: number;
    nivel_complexidade: string;
    personalizacao_score: number;
    fatores_decisao: string[];
    riscos_identificados: string[];
    next_steps: string[];
  };
  ai_insights: {
    personalization_score: number;
    industry_match: string;
    urgency_consideration: string;
    budget_alignment: string;
    confidence_level: number;
    recommended_approach: string;
    follow_up_strategy: string[];
  };
  metadata: {
    generated_at: string;
    model_version: string;
    tokens_used: number;
    processing_complexity: string;
    quality_score: number;
  };
}

export interface AIMetadata {
  generated_at: string;
  model_version: string;
  tokens_used: number;
  processing_complexity: string;
  quality_score: number;
}

export interface AIInsights {
  personalization_score: number;
  industry_match: string;
  urgency_consideration: string;
  budget_alignment: string;
  confidence_level: number;
  recommended_approach: string;
  follow_up_strategy: string[];
}

export interface DadosExtras {
  valor_total: number;
  prazo_total_dias: number;
  nivel_complexidade: string;
  personalizacao_score: number;
  fatores_decisao: string[];
  riscos_identificados: string[];
  next_steps: string[];
}

// Interface para proposta com conteúdo da IA
export interface ProposalWithAI {
  id: string;
  title: string;
  generatedContent: string | null;
  status: 'DRAFT' | 'SENT' | 'VIEWED' | 'ACCEPTED' | 'REJECTED' | 'NEGOTIATION' | 'ARCHIVED';
  version: number;
  clientId: string | null;
  userId: string;
  createdAt: string;
  updatedAt: string;
  
  // Novos campos da IA
  aiGeneratedContent: AIGeneratedContent | null;
  proposalHtml: string | null;
  proposalMarkdown: string | null;
  aiMetadata: AIMetadata | null;
  
  Client?: {
    id: string;
    name: string;
    industry: string | null;
    richnessScore: number;
    businessDetails?: string | null;
    contactEmail?: string | null;
    website?: string | null;
  };
} 