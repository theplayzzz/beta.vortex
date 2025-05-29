export interface TarefaAI {
  nome: string;
  descricao: string;
  prioridade: 'alta' | 'média' | 'normal';
  selecionada?: boolean;
  detalhamentos?: Array<{
    texto: string;
    origem: string;
  }>;
  contexto_adicional?: string;
}

export interface BacklogAI {
  nome_do_backlog: string;
  objetivo_do_backlog: string;
  tarefas: TarefaAI[];
}

export interface Client {
  id: string;
  name: string;
  industry?: string;
  richnessScore: number;
  businessDetails?: string;
  contactEmail?: string;
  website?: string;
}

export interface Planning {
  id: string;
  title: string;
  description?: string;
  status: string;
  createdAt: string;
  updatedAt: string;
  formDataJSON?: any;
  clientSnapshot?: any;
  specificObjectives?: string;
  Client: Client;
} 