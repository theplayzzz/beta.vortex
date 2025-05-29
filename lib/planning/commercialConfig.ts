export const MATURIDADE_COMERCIAL = [
  "Não temos processo comercial estruturado",
  "Vendas baseadas em relacionamento pessoal",
  "Possuímos um funil de vendas claro",
  "Processo comercial com métricas e CRM",
  "Vendas otimizadas com automação e IA"
] as const;

export type MaturidadeComercial = typeof MATURIDADE_COMERCIAL[number];

export const METAS_COMERCIAL: Record<MaturidadeComercial, string[]> = {
  "Não temos processo comercial estruturado": [
    "Criar processo básico de vendas",
    "Definir perfil do cliente ideal",
    "Estabelecer script de vendas",
    "Organizar pipeline de vendas",
    "Implementar follow-up sistemático",
    "Outro"
  ],
  "Vendas baseadas em relacionamento pessoal": [
    "Estruturar processo de prospecção",
    "Criar materiais de vendas",
    "Definir etapas do funil",
    "Implementar sistema de CRM básico",
    "Treinar equipe em técnicas de vendas",
    "Outro"
  ],
  "Possuímos um funil de vendas claro": [
    "Implementar métricas de conversão",
    "Otimizar taxa de fechamento",
    "Automatizar follow-ups",
    "Criar processo de qualificação",
    "Melhorar time de resposta",
    "Outro"
  ],
  "Processo comercial com métricas e CRM": [
    "Aumentar produtividade da equipe",
    "Implementar vendas consultivas",
    "Otimizar ciclo de vendas",
    "Criar programa de incentivos",
    "Expandir canais de venda",
    "Outro"
  ],
  "Vendas otimizadas com automação e IA": [
    "Implementar sales intelligence",
    "Personalização predictiva",
    "Automação de nurturing",
    "Revenue operations avançado",
    "AI-powered sales coaching",
    "Outro"
  ]
};

/**
 * Obter metas disponíveis para uma maturidade comercial específica
 */
export function getMetasForMaturidadeComercial(maturidade: MaturidadeComercial): string[] {
  return METAS_COMERCIAL[maturidade] || [];
}

/**
 * Validar se uma maturidade comercial é válida
 */
export function isValidMaturidadeComercial(maturidade: string): maturidade is MaturidadeComercial {
  return MATURIDADE_COMERCIAL.includes(maturidade as MaturidadeComercial);
}

/**
 * Obter descrição contextual para cada nível de maturidade comercial
 */
export const DESCRICOES_MATURIDADE_COMERCIAL: Record<MaturidadeComercial, string> = {
  "Não temos processo comercial estruturado": "Vendas acontecem sem processo definido ou metodologia clara",
  "Vendas baseadas em relacionamento pessoal": "Vendas dependem muito do relacionamento e networking pessoal",
  "Possuímos um funil de vendas claro": "Processo comercial estruturado com etapas bem definidas",
  "Processo comercial com métricas e CRM": "Vendas profissionalizadas com acompanhamento sistemático",
  "Vendas otimizadas com automação e IA": "Processo comercial avançado com tecnologia e automação"
}; 