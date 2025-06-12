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
  titulo_da_proposta: string;
  tipo_de_proposta: TipoProposta | '';
  nome_da_contratada: string;
  membros_da_equipe?: string;
  
  // Aba 2: Escopo de Serviços
  modalidade_entrega: ModalidadeEntrega | '';
  servicos_incluidos: ServicoIncluido[];
  requisitos_especiais?: string;
  
  // Aba 3: Contexto Comercial
  orcamento_estimado: string;
  forma_prazo_pagamento: string;
  urgencia_do_projeto: UrgenciaProjeto | '';
  tomador_de_decisao: string;
  resumo_dor_problema_cliente: string;
  contexto_adicional?: string;
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

// Interface para dados completos da proposta
export interface ProposalData extends ProposalFormData {
  clientId: string;
}

// Interface para resposta da API
export interface ProposalResponse {
  id: string;
  title: string;
  status: string;
  createdAt: string;
  updatedAt: string;
  Client: {
    id: string;
    name: string;
    industry: string;
  };
}

// Interface para metadata da IA
export interface AIMetadata {
  generatedAt: string;
  modelUsed: string;
  tokensUsed: number;
  processingTime?: number;
  qualityScore?: number;
}

// Interface para conteúdo gerado pela IA
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
  metadata: AIMetadata;
}

// Payload para webhook ATUALIZADO
export interface ProposalWebhookPayload {
  proposal_id: string;
  timestamp: string;
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
    contactEmail?: string;
    website?: string;
    targetAudience?: string;
    competitors?: string;
    data_quality: "alto" | "médio" | "baixo";
  };
  submission_metadata: {
    titulo_da_proposta: string;
    tipo_de_proposta: string; 
    nome_da_contratada: string;
    membros_da_equipe?: string;
  };
  context_enrichment: {
    urgencia_do_projeto: string;
    tomador_de_decisao: string;
    resumo_dor_problema_cliente: string;
    contexto_adicional?: string;
  };
  proposal_requirements: {
    orcamento_estimado: string;
    forma_prazo_pagamento: string;
    escopo_detalhado: string;
    deliverables: ServicoIncluido[];
    modalidade_entrega: string;
    requisitos_especiais?: string;
  };
}

// 🆕 INTERFACES PARA CONTEÚDO DA IA
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