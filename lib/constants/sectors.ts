export const SETORES_PERMITIDOS = [
  "Alimentação",
  "Saúde e Bem-estar", 
  "Educação",
  "Varejo físico",
  "E-commerce",
  "Serviços locais",
  "Serviços B2B",
  "Tecnologia / SaaS",
  "Imobiliário",
  "Indústria",
  "Outro"
] as const;

export type SetorPermitido = typeof SETORES_PERMITIDOS[number];

// Mapeamento para exibição (se necessário)
export const SETORES_DISPLAY_MAP: Record<SetorPermitido, string> = {
  "Alimentação": "Alimentação",
  "Saúde e Bem-estar": "Saúde e Bem-estar",
  "Educação": "Educação", 
  "Varejo físico": "Varejo físico",
  "E-commerce": "E-commerce",
  "Serviços locais": "Serviços locais",
  "Serviços B2B": "Serviços B2B",
  "Tecnologia / SaaS": "Tecnologia / SaaS",
  "Imobiliário": "Imobiliário",
  "Indústria": "Indústria",
  "Outro": "Outro"
};
