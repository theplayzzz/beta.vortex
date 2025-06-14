# 📄 Sistema de Export PDF - Documentação

## 🎯 Visão Geral

Sistema de exportação de propostas comerciais para PDF implementado com **jsPDF + html2canvas**, oferecendo conversão HTML→PDF client-side com alta qualidade profissional e **quebras de página inteligentes**.

## 🚀 Recursos

- ✅ **Export HTML→PDF direto** - Usa `proposalHtml` como fonte principal
- ✅ **Formatação profissional A4** - Layout otimizado para impressão
- ✅ **🧠 QUEBRAS DE PÁGINA INTELIGENTES** - Sistema híbrido CSS + análise HTML
- ✅ **Paginação automática** - Propostas grandes dividem em múltiplas páginas
- ✅ **Retry com fallback** - Configurações simplificadas em caso de erro
- ✅ **Timeout inteligente** - Evita travamentos com timeout de 10s
- ✅ **Clean DOM** - Limpeza automática de elementos temporários
- ✅ **Performance monitoring** - Rastreamento de performance em dev

## 🧠 Quebras de Página Inteligentes

### **Abordagem Híbrida**
Combinação de **CSS Page-Break Properties** (80% dos casos) + **Análise HTML** (20% dos casos) para quebras otimizadas.

### **Regras Aplicadas Automaticamente**

#### **CSS Page-Break (Básico)**
- **Headers nunca ficam órfãos** no final da página
- **Tabelas não quebram** no meio
- **Listas pequenas ficam juntas**
- **Blockquotes não quebram**
- **Controle de orphans/widows** em parágrafos

#### **Análise HTML (Avançado)**
- **Análise de estrutura** do conteúdo
- **Estimativa de alturas** dos elementos
- **Agrupamento inteligente** de conteúdo relacionado
- **Headers com conteúdo** mantidos juntos
- **Seções pequenas** agrupadas

### **Classes CSS Especiais**
```css
.pdf-keep-together     /* Mantém elemento junto (não quebra) */
.pdf-new-page          /* Força nova página antes do elemento */
.pdf-avoid-break-after /* Evita quebra após o elemento */
```

### **Configurações Inteligentes**
```typescript
PDF_CONFIG = {
  MIN_SECTION_HEIGHT: 80,    // px - altura mínima para manter junto
  ORPHAN_THRESHOLD: 60,      // px - conteúdo mínimo após header
  WIDOW_THRESHOLD: 40,       // px - conteúdo mínimo antes de quebra
}
```

## 📱 Como Usar

### Para Usuários

1. **Acesse uma proposta** com conteúdo gerado
2. **Clique no botão "Exportar PDF"** na área de ações
3. **Aguarde a geração** (até 10 segundos para propostas grandes)
4. **Download automático** será iniciado com quebras otimizadas

### Estados do Botão

- **Normal**: Botão disponível para propostas com conteúdo
- **Loading**: "Gerando PDF..." durante processamento
- **Success**: Toast verde com "quebras de página inteligentes"
- **Error**: Toast vermelho com erro específico

### Formato do Arquivo

- **Nome**: `proposta-titulo-da-proposta.pdf`
- **Formato**: A4 (210mm × 297mm)
- **Resolução**: 300 DPI (qualidade de impressão)
- **Fontes**: Inter (primary), Arial (fallback)
- **Quebras**: Otimizadas para leitura profissional

## 🔧 Arquitetura Técnica

### Componentes Principais

```
hooks/useExportPDF.ts          # Hook principal de export
lib/proposals/pdfGenerator.ts  # Utilitários e configurações
├── applySmartPageBreaks()     # 🧠 Quebras inteligentes
├── analyzeContentStructure()  # Análise de estrutura
├── estimateElementHeight()    # Cálculo de alturas
└── PDF_CONFIG                 # Configurações avançadas
styles/pdf-styles.css          # Estilos específicos para PDF
components/proposals/view/     # Integração com UI
  ProposalActions.tsx
```

### Fluxo de Processamento (Atualizado)

```
1. Validação HTML
2. Sanitização com DOMPurify
3. Criação de elemento DOM temporário
4. 🧠 ANÁLISE DE ESTRUTURA (novo)
   ├── Identificação de seções
   ├── Estimativa de alturas
   ├── Classificação de elementos
   └── Aplicação de regras inteligentes
5. 🎨 APLICAÇÃO DE ESTILOS + CSS PAGE-BREAK
6. Captura com html2canvas
7. Geração PDF com jsPDF  
8. Download automático
9. Cleanup DOM
```

### Configurações PDF (Atualizada)

```typescript
const PDF_CONFIG = {
  A4_WIDTH: 210,                // mm
  A4_HEIGHT: 297,               // mm  
  PADDING: 20,                  // mm
  SCALE: 2,                     // Alta resolução
  FONT_SIZE: 12,                // px
  LINE_HEIGHT: 1.6,             // Legibilidade
  GENERATION_TIMEOUT: 10000,    // ms
  
  // 🧠 CONFIGURAÇÕES INTELIGENTES
  MIN_SECTION_HEIGHT: 80,       // px - seções pequenas
  ORPHAN_THRESHOLD: 60,         // px - órfãos
  WIDOW_THRESHOLD: 40,          // px - viúvas
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
- **Orphans/Widows**: Controlados automaticamente

### Elementos Suportados (com quebras inteligentes)
- ✅ **Cabeçalhos (H1-H6)** - nunca órfãos, agrupados com conteúdo
- ✅ **Parágrafos** - controle orphan/widow automático
- ✅ **Listas** - mantidas juntas quando pequenas
- ✅ **Tabelas** - nunca quebram no meio
- ✅ **Blockquotes** - sempre mantidos juntos
- ✅ **Links** com URLs impressas
- ✅ **Código** inline e blocos

## ⚡ Performance

### Benchmarks Típicos
- **Proposta pequena** (1-2 páginas): < 2s
- **Proposta média** (3-4 páginas): < 4s
- **Proposta grande** (5+ páginas): < 8s
- **Timeout**: 10s (cancelamento automático)
- **🧠 Análise estrutural**: +0.2-0.5s (overhead mínimo)

### Otimizações
- **Dynamic imports** - Bibliotecas carregadas sob demanda
- **Memory cleanup** - Limpeza automática de DOM temporário
- **Progressive retry** - Fallback com configurações simplificadas
- **Efficient pagination** - Divisão inteligente de páginas
- **🧠 Smart caching** - Cálculos de altura reutilizados

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
1. **Retry simplificado** - Configurações de canvas reduzidas (mantém quebras)
2. **Print fallback** - window.print() como último recurso
3. **User feedback** - Mensagens específicas por tipo de erro

### Mensagens de Erro
- **HTML não disponível**: "Aguarde o processamento da proposta"
- **Conteúdo vazio**: "Esta proposta não possui conteúdo para exportar"
- **Timeout**: "A geração demorou muito. Tente novamente"
- **Canvas**: "Tentando modo simplificado..."
- **Generic**: "Erro inesperado durante a geração"

## 🧪 Testes e Validação

### Cenários Testados (com quebras inteligentes)
- ✅ **HTML válido** → PDF gerado com quebras otimizadas
- ✅ **Headers isolados** → Automaticamente agrupados com conteúdo
- ✅ **Tabelas grandes** → Nunca quebram no meio
- ✅ **Listas longas** → Divididas inteligentemente
- ✅ **Seções pequenas** → Agrupadas automaticamente
- ✅ **Conteúdo misto** → Análise estrutural aplicada
- ✅ **Proposta grande** → Múltiplas páginas com quebras otimizadas

### Compatibilidade
- **Chrome/Edge**: Suporte completo + quebras inteligentes
- **Firefox**: Suporte completo + quebras inteligentes
- **Safari**: Suporte básico + quebras CSS
- **Mobile**: Degradação graceful

## 📞 Suporte e Troubleshooting

### Problemas Comuns

**"Headers ficam sozinhos no final da página"**
- ✅ **RESOLVIDO**: Sistema de quebras inteligentes agrupa automaticamente

**"Tabelas cortadas no meio"**
- ✅ **RESOLVIDO**: CSS page-break-inside: avoid aplicado

**"Conteúdo mal distribuído"**
- ✅ **RESOLVIDO**: Análise estrutural otimiza distribuição

**"PDF com qualidade baixa"**
- Retry automático mantém quebras inteligentes mesmo em modo simplificado

**"Timeout muito frequente"**
- Análise estrutural adiciona overhead mínimo (~0.5s)
- Considere dividir propostas muito grandes

### Debug Mode
Em desenvolvimento, logs detalhados são exibidos:
```javascript
// Console logs automáticos
🧠 Applying smart page breaks...
🔗 Keeping header "Introdução..." with next content
🪜 Grouping small element "Lista de..." with next content
📄 New page for section "Conclusão..."
✅ Smart page breaks applied: 12 sections analyzed

📊 PDF Generation Performance: {
  totalTime: "3247.23ms",
  steps: [
    { name: "Content validation", time: "2.45ms" },
    { name: "Smart page breaks applied", time: "156.78ms" },
    { name: "Canvas generation", time: "2234.67ms" },
    // ... outros steps
  ]
}
```

## 🔮 Futuro e Extensibilidade

### Preparado Para
- **Editor de Markdown** - Interface `ExportableContent` genérica
- **Múltiplos formatos** - DOC, EPUB, etc.
- **Headers/footers** - Personalização avançada
- **Watermarks** - Marcas d'água
- **Batch export** - Múltiplas propostas
- **🧠 IA para quebras** - Machine learning para otimização

### Quebras Inteligentes Avançadas (Futuro)
```typescript
// Próximas funcionalidades
interface SmartPageBreaksConfig {
  aiOptimization: boolean;        // IA para otimizar quebras
  customRules: BreakRule[];       // Regras personalizadas
  contentAwareBreaks: boolean;    // Quebras baseadas em semântica
  readabilityScore: number;       // Score de legibilidade
}
```

---

**Implementado em**: Dezembro 2024  
**Versão**: 2.0.0 (com Quebras Inteligentes)  
**Arquitetura**: Next.js + TypeScript + jsPDF + html2canvas + Smart Page Breaks 