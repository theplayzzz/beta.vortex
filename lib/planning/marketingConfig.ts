export const MATURIDADE_MARKETING = [
  "Não fazemos marketing",
  "Fazemos ações pontuais",
  "Temos ações recorrentes, mas sem métricas",
  "Temos estratégia definida com métricas",
  "Marketing avançado com automação"
] as const;

export type MaturidadeMarketing = typeof MATURIDADE_MARKETING[number];

export const METAS_MARKETING: Record<MaturidadeMarketing, string[]> = {
  "Não fazemos marketing": [
    "Criar presença digital básica",
    "Definir público-alvo",
    "Estabelecer identidade visual", 
    "Criar conteúdo inicial",
    "Implementar estratégia de redes sociais",
    "Outro"
  ],
  "Fazemos ações pontuais": [
    "Criar consistência nas ações",
    "Definir calendário de marketing",
    "Estabelecer métricas básicas",
    "Melhorar qualidade do conteúdo",
    "Aumentar frequência de publicações",
    "Outro"
  ],
  "Temos ações recorrentes, mas sem métricas": [
    "Implementar métricas de performance",
    "Criar dashboard de acompanhamento",
    "Otimizar ROI das campanhas",
    "Segmentar melhor o público",
    "Automatizar processos básicos",
    "Outro"
  ],
  "Temos estratégia definida com métricas": [
    "Aumentar reconhecimento da marca",
    "Melhorar taxa de conversão",
    "Expandir para novos canais",
    "Implementar lead scoring",
    "Otimizar customer journey",
    "Outro"
  ],
  "Marketing avançado com automação": [
    "Personalização em escala",
    "Implementar IA/Machine Learning",
    "Marketing predictivo",
    "Omnichannel avançado",
    "Attribution modeling",
    "Outro"
  ]
};

/**
 * Obter metas disponíveis para uma maturidade específica
 */
export function getMetasForMaturidadeMarketing(maturidade: MaturidadeMarketing): string[] {
  return METAS_MARKETING[maturidade] || [];
}

/**
 * Validar se uma maturidade de marketing é válida
 */
export function isValidMaturidadeMarketing(maturidade: string): maturidade is MaturidadeMarketing {
  return MATURIDADE_MARKETING.includes(maturidade as MaturidadeMarketing);
}

/**
 * Obter descrição contextual para cada nível de maturidade
 */
export const DESCRICOES_MATURIDADE_MARKETING: Record<MaturidadeMarketing, string> = {
  "Não fazemos marketing": "Seu negócio ainda não investe em marketing ou faz apenas o básico",
  "Fazemos ações pontuais": "Realiza algumas ações de marketing, mas sem planejamento consistente",
  "Temos ações recorrentes, mas sem métricas": "Marketing regular, mas falta mensuração de resultados",
  "Temos estratégia definida com métricas": "Marketing estruturado com acompanhamento de KPIs",
  "Marketing avançado com automação": "Marketing sofisticado com ferramentas avançadas e automação"
}; 