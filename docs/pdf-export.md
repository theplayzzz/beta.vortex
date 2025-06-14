# 📄 Sistema de Export PDF - Documentação

## 🎯 Visão Geral

Sistema de exportação de propostas comerciais para PDF implementado com **jsPDF + html2canvas**, oferecendo conversão HTML→PDF client-side com alta qualidade profissional.

## 🚀 Recursos

- ✅ **Export HTML→PDF direto** - Usa `proposalHtml` como fonte principal
- ✅ **Formatação profissional A4** - Layout otimizado para impressão
- ✅ **Paginação automática** - Propostas grandes dividem em múltiplas páginas
- ✅ **Retry com fallback** - Configurações simplificadas em caso de erro
- ✅ **Timeout inteligente** - Evita travamentos com timeout de 10s
- ✅ **Clean DOM** - Limpeza automática de elementos temporários
- ✅ **Performance monitoring** - Rastreamento de performance em dev

## 📱 Como Usar

### Para Usuários

1. **Acesse uma proposta** com conteúdo gerado
2. **Clique no botão "Exportar PDF"** na área de ações
3. **Aguarde a geração** (até 10 segundos para propostas grandes)
4. **Download automático** será iniciado

### Estados do Botão

- **Normal**: Botão disponível para propostas com conteúdo
- **Loading**: "Gerando PDF..." durante processamento
- **Success**: Toast verde com confirmação
- **Error**: Toast vermelho com erro específico

### Formato do Arquivo

- **Nome**: `proposta-titulo-da-proposta.pdf`
- **Formato**: A4 (210mm × 297mm)
- **Resolução**: 300 DPI (qualidade de impressão)
- **Fontes**: Inter (primary), Arial (fallback)

## 🔧 Arquitetura Técnica

### Componentes Principais

```
hooks/useExportPDF.ts          # Hook principal de export
lib/proposals/pdfGenerator.ts  # Utilitários e configurações
styles/pdf-styles.css          # Estilos específicos para PDF
components/proposals/view/     # Integração com UI
  ProposalActions.tsx
```

### Fluxo de Processamento

```
1. Validação HTML
2. Sanitização com DOMPurify
3. Criação de elemento DOM temporário
4. Aplicação de estilos PDF
5. Captura com html2canvas
6. Geração PDF com jsPDF  
7. Download automático
8. Cleanup DOM
```

### Configurações PDF

```typescript
const PDF_CONFIG = {
  A4_WIDTH: 210,           // mm
  A4_HEIGHT: 297,          // mm  
  PADDING: 20,             // mm
  SCALE: 2,                // Alta resolução
  FONT_SIZE: 12,           // px
  LINE_HEIGHT: 1.6,        // Legibilidade
  GENERATION_TIMEOUT: 10000 // ms
}
```

## 🎨 Estilos e Formatação

### Cores Profissionais
- **Texto principal**: `#000000` (preto)
- **Cabeçalhos**: `#2d2d2d` (cinza escuro)
- **Bordas**: `#cccccc` (cinza claro)
- **Backgrounds**: `#ffffff` (branco)

### Tipografia
- **Fonte principal**: Inter, Arial, sans-serif
- **Tamanho base**: 12px
- **Line height**: 1.6 (legibilidade otimizada)
- **Hierarquia**: H1(24px) → H2(20px) → H3(16px)

### Elementos Suportados
- Cabeçalhos (H1-H6)
- Parágrafos com justificação
- Listas ordenadas e não-ordenadas
- Tabelas com bordas
- Blockquotes estilizados
- Links com URLs impressas
- Código inline e blocos

## ⚡ Performance

### Benchmarks Típicos
- **Proposta pequena** (1-2 páginas): < 2s
- **Proposta média** (3-4 páginas): < 4s
- **Proposta grande** (5+ páginas): < 8s
- **Timeout**: 10s (cancelamento automático)

### Otimizações
- **Dynamic imports** - Bibliotecas carregadas sob demanda
- **Memory cleanup** - Limpeza automática de DOM temporário
- **Progressive retry** - Fallback com configurações simplificadas
- **Efficient pagination** - Divisão inteligente de páginas

## 🔒 Segurança

### Sanitização HTML
- **DOMPurify** - Remove scripts e elementos perigosos
- **Tags permitidas** - Whitelist de elementos seguros
- **Atributos filtrados** - Apenas href, target, rel, class

### Client-Side Only
- **Zero servidor** - Processamento 100% no navegador
- **Privacy-first** - Nenhum dado enviado para servidor
- **No storage** - PDFs não são salvos no sistema

## 🐛 Tratamento de Erros

### Tipos de Erro
1. **Content Error** - HTML inválido ou vazio
2. **Canvas Error** - Falha no html2canvas
3. **PDF Error** - Falha no jsPDF
4. **Timeout Error** - Geração muito demorada

### Estratégias de Recuperação
1. **Retry simplificado** - Configurações de canvas reduzidas
2. **Print fallback** - window.print() como último recurso
3. **User feedback** - Mensagens específicas por tipo de erro

### Mensagens de Erro
- **HTML não disponível**: "Aguarde o processamento da proposta"
- **Conteúdo vazio**: "Esta proposta não possui conteúdo para exportar"
- **Timeout**: "A geração demorou muito. Tente novamente"
- **Canvas**: "Tentando modo simplificado..."
- **Generic**: "Erro inesperado durante a geração"

## 🔮 Futuro e Extensibilidade

### Preparado Para
- **Editor de Markdown** - Interface `ExportableContent` genérica
- **Múltiplos formatos** - DOC, EPUB, etc.
- **Headers/footers** - Personalização avançada
- **Watermarks** - Marcas d'água
- **Batch export** - Múltiplas propostas

### Hook Genérico
```typescript
// Future-ready interface
interface ExportableContent {
  html: string;
  title: string;
  metadata?: Record<string, any>;
}

// Extensible hook
function useExportPDF<T extends ExportableContent>() {
  // Implementation ready for different content types
}
```

## 🧪 Testes e Validação

### Cenários Testados
- ✅ HTML válido → PDF gerado
- ✅ HTML vazio → Erro específico
- ✅ HTML malformado → Sanitização + PDF
- ✅ Proposta grande → Múltiplas páginas
- ✅ Caracteres especiais → UTF-8 preservado
- ✅ Timeout → Cancelamento gracioso
- ✅ Retry → Fallback funcional

### Compatibilidade
- **Chrome/Edge**: Suporte completo
- **Firefox**: Suporte completo
- **Safari**: Suporte básico
- **Mobile**: Degradação graceful

## 📞 Suporte e Troubleshooting

### Problemas Comuns

**"Conteúdo não disponível"**
- Aguarde o processamento da proposta pela IA
- Verifique se existe conteúdo em `proposalHtml`

**"PDF com qualidade baixa"**
- Retry automático já aplicou configurações simplificadas
- Funcionalidade normal, quality reduzida para compatibilidade

**"Timeout muito frequente"**
- Proposta muito grande ou navegador lento
- Considere dividir conteúdo em seções menores

**"Botão não aparece"**
- Proposta precisa ter `proposalHtml` válido
- Status deve ser diferente de DRAFT

### Debug Mode
Em desenvolvimento, logs detalhados são exibidos:
```javascript
// Console logs automáticos
📊 PDF Generation Performance: {
  totalTime: "3247.23ms",
  steps: [
    { name: "Content validation", time: "2.45ms" },
    { name: "Dependencies loaded", time: "234.67ms" },
    // ... outros steps
  ]
}
```

---

**Implementado em**: Dezembro 2024  
**Versão**: 1.0.0  
**Arquitetura**: Next.js + TypeScript + jsPDF + html2canvas 