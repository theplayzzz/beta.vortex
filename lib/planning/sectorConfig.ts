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

/**
 * Mapear valores antigos de setores para valores válidos
 * Usado para compatibilidade com dados existentes no banco
 */
export function mapLegacySectorToValid(sector: string): SetorPermitido {
  const legacyMapping: Record<string, SetorPermitido> = {
    // Valores antigos que podem existir no banco
    "foodtruck": "Alimentação",
    "food truck": "Alimentação", 
    "restaurante": "Alimentação",
    "lanchonete": "Alimentação",
    "tecnologia": "Tecnologia / SaaS",
    "tech": "Tecnologia / SaaS",
    "saas": "Tecnologia / SaaS",
    "software": "Tecnologia / SaaS",
    "saude": "Saúde e Bem-estar",
    "medicina": "Saúde e Bem-estar",
    "clinica": "Saúde e Bem-estar",
    "educacao": "Educação",
    "ensino": "Educação",
    "escola": "Educação",
    "varejo": "Varejo físico",
    "loja": "Varejo físico",
    "comercio": "Varejo físico",
    "ecommerce": "E-commerce",
    "loja online": "E-commerce",
    "servicos": "Serviços locais",
    "consultoria": "Serviços B2B",
    "imoveis": "Imobiliário",
    "imobiliaria": "Imobiliário",
    "industria": "Indústria",
    "industrial": "Indústria",
    "outro": "Outro",
    "others": "Outro"
  };

  // Primeiro tenta o mapeamento direto
  const normalizedSector = sector.toLowerCase().trim();
  if (legacyMapping[normalizedSector]) {
    return legacyMapping[normalizedSector];
  }

  // Se o valor já é válido, retorna ele mesmo
  if (isValidSector(sector)) {
    return sector as SetorPermitido;
  }

  // Caso contrário, retorna "Outro"
  console.warn(`⚠️ Setor não reconhecido: "${sector}", usando "Outro"`);
  return "Outro";
}

/**
 * Validar e normalizar setor do cliente
 * Usado no formulário para garantir que sempre temos um valor válido
 */
export function validateAndNormalizeSector(sector: string | null | undefined): SetorPermitido {
  if (!sector) {
    return "Outro";
  }

  return mapLegacySectorToValid(sector);
} 