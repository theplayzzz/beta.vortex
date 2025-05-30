export const TIPOS_PROPOSTA = [
  "Consultoria Estratégica",
  "Implementação de Marketing",
  "Gestão de Campanhas", 
  "Desenvolvimento Web",
  "Auditoria e Análise",
  "Treinamento e Capacitação",
  "Outro"
] as const;

export const MODALIDADES_ENTREGA = [
  "Projeto único",
  "Retainer mensal", 
  "Pacote de horas",
  "Performance-based",
  "Híbrido"
] as const;

// Reorganização dos serviços em grupos
export const SERVICOS_MARKETING = [
  "Tráfego pago (Google Ads, Meta Ads, etc)",
  "Copywriting (anúncios, e-mails, landing pages)",
  "Criação e gestão de landing pages e websites",
  "Planejamento de campanhas e conteúdo",
  "Design gráfico e soluções criativas",
  "SEO e CRO (otimizações e testes A/B)",
  "Email marketing e automações",
  "Análise de dados (dashboards e relatórios)"
] as const;

export const SERVICOS_COMERCIAIS = [
  "Diagnóstico do processo comercial",
  "Estruturação de BDRs e Closers", 
  "Elaboração de scripts comerciais",
  "Treinamentos e reciclagens",
  "Implementação de Playbook",
  "Acompanhamento e gestão de metas",
  "Análise de performance",
  "Simulações de vendas"
] as const;

export const SERVICOS_IMPLEMENTACAO = [
  "Implementação de CRM",
  "Automações comerciais",
  "Tracking avançado",
  "Implementação de VoIP",
  "Agentes de IA para atendimento"
] as const;

// Array combinado para compatibilidade
export const SERVICOS_INCLUIDOS = [
  ...SERVICOS_MARKETING,
  ...SERVICOS_COMERCIAIS,
  ...SERVICOS_IMPLEMENTACAO
] as const;

export const URGENCIA_PROJETO = [
  "Baixa - Mais de 6 meses",
  "Média - 3 a 6 meses",
  "Alta - 1 a 3 meses",
  "Crítica - Menos de 1 mês"
] as const;

export const ORCAMENTO_ESTIMADO = [
  "Até R$ 5.000",
  "R$ 5.000 - R$ 15.000",
  "R$ 15.000 - R$ 30.000",
  "R$ 30.000 - R$ 50.000",
  "R$ 50.000 - R$ 100.000",
  "Acima de R$ 100.000",
  "A definir"
] as const;

export type TipoProposta = typeof TIPOS_PROPOSTA[number];
export type ModalidadeEntrega = typeof MODALIDADES_ENTREGA[number];
export type ServicoIncluido = typeof SERVICOS_INCLUIDOS[number];
export type ServicoMarketing = typeof SERVICOS_MARKETING[number];
export type ServicoComercial = typeof SERVICOS_COMERCIAIS[number];
export type ServicoImplementacao = typeof SERVICOS_IMPLEMENTACAO[number];
export type UrgenciaProjeto = typeof URGENCIA_PROJETO[number];
export type OrcamentoEstimado = typeof ORCAMENTO_ESTIMADO[number]; 