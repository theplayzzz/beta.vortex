/**
 * Função para gerar UUID compatível com todos os ambientes
 * 
 * Utiliza crypto.randomUUID() quando disponível (Node.js 14.17.0+ e browsers modernos)
 * e fallback para implementação baseada em Math.random() em ambientes mais antigos
 */
export function generateUUID(): string {
  // Tenta usar crypto.randomUUID() se disponível
  if (typeof crypto !== 'undefined' && crypto.randomUUID) {
    return crypto.randomUUID();
  }
  
  // Fallback para ambientes que não suportam crypto.randomUUID
  // Implementa RFC 4122 versão 4 (aleatório)
  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function(c) {
    const r = Math.random() * 16 | 0;
    const v = c === 'x' ? r : (r & 0x3 | 0x8);
    return v.toString(16);
  });
}

/**
 * Gera um UUID curto para sessões ou identificadores temporários
 */
export function generateShortUUID(): string {
  return generateUUID().substring(0, 8);
} 