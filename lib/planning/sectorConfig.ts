/**
 * Configuração dos setores permitidos no sistema
 * Baseado no campo Client.industry do schema Prisma
 */

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

/**
 * Validação se um setor é válido
 */
export function isValidSector(sector: string): sector is SetorPermitido {
  return SETORES_PERMITIDOS.includes(sector as SetorPermitido);
}

/**
 * Obter label amigável para o setor
 */
export function getSectorLabel(sector: SetorPermitido): string {
  const labels: Record<SetorPermitido, string> = {
    "Alimentação": "Alimentação",
    "Saúde e Bem-estar": "Saúde e Bem-estar",
    "Educação": "Educação", 
    "Varejo físico": "Varejo Físico",
    "E-commerce": "E-commerce",
    "Serviços locais": "Serviços Locais",
    "Serviços B2B": "Serviços B2B",
    "Tecnologia / SaaS": "Tecnologia / SaaS",
    "Imobiliário": "Imobiliário",
    "Indústria": "Indústria",
    "Outro": "Outro"
  };
  
  return labels[sector] || sector;
} 