---
id: plan-027
title: Export PDF das Propostas - jsPDF + html2canvas  
createdAt: 2025-06-14
author: theplayzzz
status: draft
---

## 🧩 Scope

Implementar funcionalidade de export PDF para propostas comerciais geradas pela IA, permitindo download direto no navegador sem armazenamento no servidor. A solução deve ser robusta, com alta qualidade visual e preparada para futuro editor de markdown.

## ✅ Functional Requirements

### **Core Requirements**
- Converter propostas HTML→PDF e iniciar download automático
- Usar `proposalHtml` como fonte principal (já processado e formatado)
- Fallback simples para `proposalMarkdown` apenas se HTML não existir
- Manter formatação profissional idêntica à visualização web
- Não salvar PDFs no servidor (100% client-side)
- Nome do arquivo baseado no título da proposta

### **Quality Requirements**
- PDF em formato A4 com qualidade de impressão (300 DPI)
- Paginação automática para conteúdo longo
- Estilos consistentes com a identidade visual atual
- Feedback visual durante geração (toast notifications)
- Tratamento robusto de erros

### **Future-Proofing**
- Arquitetura preparada para editor de markdown futuro
- Separação clara entre lógica de renderização e exportação
- Hooks reutilizáveis para diferentes tipos de export

## ⚙️ Non-Functional Requirements

### **Performance**
- Geração de PDF em menos de 3 segundos para propostas típicas
- Import dinâmico das bibliotecas para reduzir bundle inicial
- Otimização de memory usage durante renderização

### **Security** 
- Sanitização HTML antes da renderização
- Validação de conteúdo antes da conversão
- Limpeza automática de elementos DOM temporários

### **UX/UI**
- Loading states informativos
- Error handling gracioso com fallbacks
- Feedback visual claro sobre sucesso/falha

## 📚 Guidelines & Packages

### **Libraries to Use**
- **jsPDF** (^2.5.1) - Geração de PDF client-side [MIT License]
- **html2canvas** (^1.4.1) - Captura HTML como canvas [MIT License]
- Bibliotecas já existentes: DOMPurify, marked (para fallbacks)

### **Architectural Guidelines**
- Seguir padrão de hooks existente (`useProposals`)
- Manter consistência com sistema de toast atual
- Integrar com o ContentRenderer existente
- Seguir estrutura de tipos TypeScript estabelecida

## 🔐 Threat Model (Stub)

### **Client-Side Security**
- **XSS via HTML Content**: Sanitização com DOMPurify antes renderização
- **Memory Leaks**: Limpeza obrigatória de elementos DOM temporários  
- **Bundle Size**: Import dinâmico para evitar bloating

### **Data Integrity**
- **Content Validation**: Verificação de conteúdo HTML válido antes export
- **Simple Fallback**: HTML direto → PDF, markdown apenas em casos extremos

## 🔢 Execution Plan

### **Phase 1: Dependency Setup & Base Structure**

**1.1 Install Dependencies**
```bash
pnpm install jspdf html2canvas @types/jspdf
```

**1.2 Create Export Hook**
- Arquivo: `hooks/useExportPDF.ts`
- Funcionalidades:
  - Dynamic import management (jsPDF + html2canvas)
  - HTML content validation & sanitization
  - Direct HTML→PDF conversion with A4 formatting
  - Error handling with toast integration
  - Memory cleanup (remove temp DOM elements)

**1.3 Update ProposalActions Interface**
- Integrar hook no `ProposalActions.tsx`
- Substituir placeholder por implementação real
- Manter loading states existentes

### **Phase 2: Core PDF Generation Logic**

**2.1 Content Processing Pipeline**
```typescript
// FOCO NO HTML: Usar HTML processado diretamente
const htmlContent = proposal.proposalHtml;

if (!htmlContent) {
  // Fallback simples apenas se necessário
  if (proposal.proposalMarkdown) {
    throw new Error('HTML não disponível. Use a visualização web para gerar o PDF.');
  }
  throw new Error('Conteúdo da proposta não disponível para export');
}
```

**2.2 HTML Rendering for PDF**
- Usar HTML já processado (proposalHtml) diretamente
- Criar elemento temporário invisível no DOM
- Aplicar estilos CSS específicos para PDF:
  - Width: 210mm (A4), padding: 20mm
  - Background: #ffffff, color: #000000
  - Font: 'Inter' 12px, line-height: 1.6
  - Remover cores da marca, usar preto/cinza profissional

**2.3 Canvas Generation** 
- `html2canvas` com configurações otimizadas:
  - Scale: 2 (alta resolução)
  - Background: #ffffff
  - useCORS: true para imagens
- Dimensões calculadas para A4 (210x295mm)

**2.4 PDF Assembly**
- Página única ou múltiplas páginas automáticas
- Header opcional com logo/título
- Footer com paginação se necessário

### **Phase 3: Integration & User Experience**

**3.1 Button State Management**
- Loading: "Gerando PDF..."
- Success: "PDF exportado"  
- Error: Mensagem específica do erro
- Disabled state durante processamento

**3.2 File Naming Strategy**
```typescript
const fileName = `proposta-${proposal.title
  .replace(/[^a-zA-Z0-9]/g, '-')
  .toLowerCase()
  .substring(0, 50)}.pdf`;
```

**3.3 Error Scenarios & Fallbacks**
- Sem HTML: Erro claro "Conteúdo não disponível para export"
- HTML malformado: Sanitização com DOMPurify antes da renderização
- Falha no html2canvas: Retry com configurações simplificadas
- Falha no jsPDF: Fallback para window.print()
- Timeout (>10s): Cancelar operação e mostrar erro

### **Phase 4: Future-Ready Architecture**

**4.1 Markdown Editor Preparation**
- Interface `ExportableContent` para diferentes fontes
- Hook `useExportPDF<T>` genérico para diversos content types
- Separação clara: content source → rendering → PDF generation

**4.2 Advanced PDF Features (Future)**
- Estrutura preparada para:
  - Headers/footers customizáveis
  - Watermarks
  - Multi-format export (PDF, DOC, etc.)
  - Batch export de múltiplas propostas

### **Phase 5: Testing & Polish**

**5.1 Content Testing Matrix**
| Scenario | proposalHtml | Expected Result |
|----------|--------------|-----------------|
| Valid HTML | ✅ Valid HTML | Generate PDF directly |
| Empty HTML | ❌ null/empty | Error: "Conteúdo não disponível" |
| Malformed HTML | ⚠️ Invalid tags | Sanitize with DOMPurify → PDF |
| Large HTML | ✅ 5+ pages | Multi-page PDF with pagination |
| Special chars | ✅ UTF-8/emojis | PDF with proper encoding |

**5.2 Performance Testing**
- Small proposal (1-2 pages): < 2s
- Large proposal (5+ pages): < 5s  
- Memory usage: < 50MB peak
- Bundle size impact: < 200KB added

**5.3 Browser Compatibility**
- Chrome/Edge: Primary target
- Firefox: Full support
- Safari: Basic support
- Mobile: Graceful degradation

### **Phase 6: Documentation & Deployment**

**6.1 Developer Documentation**
- Hook usage examples
- Error handling patterns
- Performance considerations
- Future extension points

**6.2 User Documentation**  
- Botão de export visível apenas para propostas com conteúdo
- Toast notifications claras
- Troubleshooting common issues

## 📋 Implementation Details

### **Key Files to Modify**
1. `hooks/useExportPDF.ts` - Core export logic (NEW)
2. `components/proposals/view/ProposalActions.tsx` - UI integration 
3. `lib/proposals/pdfGenerator.ts` - PDF generation utilities (NEW)
4. `styles/pdf-styles.css` - PDF-specific CSS (NEW)
5. `package.json` - Dependencies

### **Prisma Schema Analysis**
```sql
-- Campos relevantes do CommercialProposal
model CommercialProposal {
  proposalHtml     String?  -- HTML processado (PRIORIDADE 1)
  proposalMarkdown String?  -- Markdown original (FALLBACK)
  title           String   -- Para nome do arquivo
  status          ProposalStatus -- Validar se gerado
}
```

### **Content Flow Analysis**
```
[AI Generation] → proposalMarkdown (raw)
       ↓
[markdownConverter] → proposalHtml (processed) ✅ FONTE PRINCIPAL
       ↓
[ContentRenderer] → Visual display (mesmo HTML)
       ↓
[PDF Export] → Direct HTML→PDF → User download
```

### **Integration Points**
- **Toast System**: `useToast` hook existente para feedback
- **HTML Content**: Uso direto de `proposal.proposalHtml`
- **Sanitization**: Reuso de DOMPurify (já implementado)
- **Type Safety**: Interfaces do `hooks/use-proposals.ts`
- **Error Patterns**: Consistente com sistema atual
- **CSS Styles**: Reuso de estilos do ContentRenderer

## 🎯 Success Criteria

1. ✅ Botão "Exportar PDF" funcional em todas as propostas com conteúdo
2. ✅ PDF gerado com qualidade profissional e formatação correta  
3. ✅ Performance aceitável (< 5s para propostas típicas)
4. ✅ Error handling robusto com feedback claro
5. ✅ Arquitetura preparada para editor de markdown futuro
6. ✅ Zero dependências no servidor para PDF generation
7. ✅ Compatibilidade com principais navegadores

## 🚀 Ready for Implementation

Esta especificação está pronta para implementação imediata, com:
- ✅ **Foco em HTML**: Abordagem simplificada usando `proposalHtml` diretamente
- ✅ **Menor complexidade**: Eliminação de conversões MD→HTML desnecessárias
- ✅ **Compatibilidade garantida**: Prisma schema e estrutura atual mapeados
- ✅ **Integration points claros**: Hooks e componentes identificados
- ✅ **Performance otimizada**: HTML→PDF direto, sem etapas intermediárias
- ✅ **Error handling robusto**: Cenários mapeados e fallbacks definidos

### **🎯 Vantagens da Abordagem HTML-First**
- ✅ **Menos pontos de falha**: HTML já processado e validado
- ✅ **Formatação garantida**: Mesma fonte usada na visualização web
- ✅ **Performance superior**: Elimina conversão MD→HTML no export
- ✅ **Manutenção simplificada**: Lógica de conversão centralizada no backend
