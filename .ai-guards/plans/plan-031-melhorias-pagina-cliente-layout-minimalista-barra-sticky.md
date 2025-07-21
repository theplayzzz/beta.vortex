---
id: plan-031
title: Melhorias na Página de Cliente - Layout Minimalista e Barra Sticky
createdAt: 2025-01-27
author: theplayzzz
status: draft
---

## 🧩 Scope

Implementar melhorias visuais e funcionais na página de detalhes do cliente (`/clientes/[id]`) para tornar o layout mais minimalista, organizado e elegante. Inclui implementação de barra de progresso sticky, redução de elementos visuais, desabilitação temporária de funcionalidades de notas e anexos, e aplicação rigorosa das regras de design da aplicação.

**Problema Original Identificado**: A página atual tem elementos muito grandes, espaçamentos excessivos, e a barra de progresso não acompanha o usuário durante a navegação, resultando em uma experiência visual pesada e pouco otimizada.

## ✅ Functional Requirements

### Layout e Design Minimalista
- Reduzir tamanhos de elementos para layout mais compacto
- Implementar hierarquia visual clara e minimalista
- Otimizar espaçamentos e paddings em todos os componentes
- Melhorar responsividade em diferentes dispositivos
- Aplicar regras de design obrigatórias da aplicação

### Barra de Progresso Sticky
- Implementar barra que acompanha o scroll do usuário
- Alterar título de "Completude do Perfil" para "Informações do Cliente"
- Ativar apenas após scroll inicial (threshold de 100px)
- Design sutil e elegante com backdrop blur
- Animações suaves de entrada/saída
- Posicionamento inteligente: não sobrepor conteúdo no topo da página
- Z-index apropriado para não interferir com outros elementos

### Desabilitação Temporária de Funcionalidades
- Bloquear funcionalidades de notas e anexos
- Cursor bloqueado (`cursor-not-allowed`) nas áreas desabilitadas
- Campos de texto não editáveis
- Mensagem sutil: "Em breve nas próximas atualizações"
- Overlay elegante sem interferir na UX
- Ícone de bloqueio visual discreto

### Melhorias Específicas Detalhadas
- **Header**: título `text-3xl` → `text-2xl`, subtítulo compacto em linha única
- **Seções**: padding `p-6` → `p-4`, títulos `text-lg` → `text-base`
- **Campos**: altura `py-3` → `py-2.5`, labels `text-sm` → `text-xs`
- **Ícones**: tamanho `h-5 w-5` → `h-4 w-4`
- **Espaçamentos**: `space-y-4` → `space-y-3`, `gap-y-4` → `gap-y-3`
- **Barra de progresso**: altura `h-3` → `h-2` para ser mais sutil
- **Percentual de completude**: `text-3xl` → `text-2xl`
- **Notas e anexos**: margem superior `mt-12` → `mt-8`

### Organização Visual Aprimorada
- Melhor aproveitamento do espaço vertical
- Elementos mais próximos para reduzir scrolling
- Hierarquia tipográfica mais clara
- Bordas e sombras mais sutis
- Transições suaves entre estados

## ⚙️ Non-Functional Requirements

### Performance
- Scroll suave sem lag durante navegação
- Animações otimizadas (60fps)
- Detecção de scroll eficiente com throttling
- Sem vazamentos de memória em event listeners
- Throttling de scroll events para prevenir sobrecarga

### Usabilidade
- Transições suaves entre estados
- Feedback visual claro para ações do usuário
- Mensagens informativas não intrusivas
- Manutenção de acessibilidade
- Estados de foco visíveis conforme regras de design

### Responsividade
- Mobile (< 768px): layout single column, barra sticky compacta
- Tablet (768px - 1024px): layout híbrido otimizado
- Desktop (> 1024px): layout completo com 2 colunas

### Compatibilidade
- Suporte a `prefers-reduced-motion` para animações
- Contraste mínimo 7:1 mantido
- Navegação por teclado preservada

## 📚 Guidelines & Packages

### Regras de Design Obrigatórias da Aplicação

#### Paleta de Cores Obrigatória
```css
:root {
  --night: #0e0f0f;          /* Fundo principal */
  --eerie-black: #171818;    /* Sidebar, cards, containers */
  --sgbus-green: #6be94c;    /* Cor primária, botões principais */
  --seasalt: #f9fbfc;        /* Texto principal */
  --periwinkle: #cfc6fe;     /* Elementos secundários */
}
```

#### Hierarquia de Fundos
1. **Fundo Principal**: `--night` (#0e0f0f)
2. **Containers/Cards**: `--eerie-black` (#171818)
3. **Elementos Elevados**: Gradiente entre Night e Eerie Black

#### Elementos Interativos
- **Botões Primários**: `--sgbus-green` com texto `--night`
- **Estados Hover**: Brightness 110%
- **Estados Foco**: Border `--sgbus-green` + box-shadow rgba(107, 233, 76, 0.3)

#### Texto e Tipografia
- **Texto Principal**: `--seasalt` (#f9fbfc)
- **Texto Secundário**: `--periwinkle` (#cfc6fe)
- **Texto de Destaque**: `--sgbus-green` (#6be94c)

### Packages Existentes
- `framer-motion`: Para animações da barra sticky e transições
- `lucide-react`: Ícones otimizados já em uso
- `tailwindcss`: Classes utilitárias para styling
- `react`: Hooks useState, useEffect para scroll detection

### Diretrizes de Design Específicas
- Seguir paleta de cores obrigatória (nunca usar cores hardcoded)
- Manter consistência com design system atual
- Usar backdrop-filter para efeitos de blur
- Implementar z-index hierarchy apropriada
- Transições padrão: `transition: all 0.2s ease`
- Bordas sutis com transparência: `border-seasalt/10`

### Estrutura de Componentes
- Manter arquitetura de componentes existente
- Criar componentes reutilizáveis para funcionalidades novas
- Seguir padrões de nomenclatura do projeto

### Proibições de Design
❌ **NUNCA** usar cores fora da paleta definida
❌ **NUNCA** comprometer o contraste - sempre testar legibilidade
❌ **NUNCA** usar animações sem considerar `prefers-reduced-motion`
❌ **NUNCA** misturar múltiplas cores de destaque no mesmo elemento

## 🔐 Threat Model (Stub)

### Segurança de Interface
- Validar que campos desabilitados não aceitem input malicioso
- Garantir que event listeners não exponham dados sensíveis
- Verificar que animações não causem memory leaks
- Sanitização de dados em mensagens de feedback

### Performance Security
- Throttling adequado para prevenir DoS em scroll events
- Limitação de re-renders durante scroll intensivo
- Cleanup adequado de event listeners para evitar memory leaks

### Acessibilidade e Segurança
- Manter contraste mínimo 7:1 em todos os elementos
- Estados de foco sempre visíveis
- Navegação por teclado funcional mesmo com elementos desabilitados

## 🔢 Execution Plan

### Fase 1: Layout Base e Aplicação das Regras de Design (2-3 horas)
1. **Reduzir tamanhos de elementos conforme regras**
   - Alterar classes de texto: `text-3xl` → `text-2xl`
   - Ajustar paddings: `p-6` → `p-4`
   - Compactar campos: `py-3` → `py-2.5`
   - Redimensionar ícones: `h-5 w-5` → `h-4 w-4`
   - Aplicar cores obrigatórias: `--seasalt`, `--periwinkle`, `--sgbus-green`

2. **Ajustar espaçamentos seguindo hierarquia visual**
   - Modificar gaps entre seções: `space-y-4` → `space-y-3`
   - Otimizar grid gaps: `gap-y-4` → `gap-y-3`
   - Reduzir margens desnecessárias
   - Aplicar bordas sutis: `border-seasalt/10`

3. **Melhorar tipografia conforme regras**
   - Labels de campos: `text-sm` → `text-xs`
   - Títulos de seções: `text-lg` → `text-base`
   - Padronizar hierarquia visual
   - Garantir contraste 7:1 em todos os textos

### Fase 2: Barra Sticky com Design Elegante (2-3 horas)
1. **Implementar detecção de scroll inteligente**
   ```typescript
   const [isSticky, setIsSticky] = useState(false);
   const [scrollY, setScrollY] = useState(0);
   
   useEffect(() => {
     const handleScroll = throttle(() => {
       const currentScrollY = window.scrollY;
       setScrollY(currentScrollY);
       setIsSticky(currentScrollY > 100); // Threshold para ativação
     }, 16); // 60fps throttling
     
     window.addEventListener('scroll', handleScroll);
     return () => window.removeEventListener('scroll', handleScroll);
   }, []);
   ```

2. **Criar componente sticky seguindo regras de design**
   - Estrutura HTML com `position: sticky`
   - Classes CSS: `sticky top-0 z-40`
   - Background: `bg-eerie-black/80` (seguindo paleta)
   - Backdrop blur: `backdrop-blur-md`
   - Borda sutil: `border-b border-seasalt/10`
   - Alterar título para "Informações do Cliente"

3. **Adicionar animações suaves**
   - Transição de entrada/saída: `transition: all 0.3s cubic-bezier(0.25, 0.8, 0.25, 1)`
   - Animação da barra de progresso com `framer-motion`
   - Estados de hover elegantes
   - Barra mais fina: `h-3` → `h-2`

### Fase 3: Desabilitação Elegante de Funcionalidades (1-2 horas)
1. **Criar componente de overlay seguindo design system**
   ```typescript
   const DisabledSection = ({ children, message }) => (
     <div className="relative">
       <div className="opacity-60 pointer-events-none cursor-not-allowed">
         {children}
       </div>
       <div className="absolute inset-0 flex items-center justify-center bg-night/20 rounded-lg">
         <div className="bg-eerie-black px-3 py-1 rounded-full border border-seasalt/10">
           <span className="text-xs text-periwinkle">{message}</span>
         </div>
       </div>
     </div>
   );
   ```

2. **Implementar mensagem informativa**
   - Texto: "Em breve nas próximas atualizações"
   - Posicionamento centralizado
   - Cores conforme paleta: `text-periwinkle`
   - Fundo: `bg-eerie-black`

3. **Aplicar estilos de desabilitação**
   - Opacity reduzida: `opacity-60`
   - Cursor bloqueado: `cursor-not-allowed`
   - Pointer events desabilitados: `pointer-events-none`
   - Ícone de bloqueio discreto

### Fase 4: Polimento e Validação (1-2 horas)
1. **Ajustes finais de design**
   - Refinar cores conforme paleta obrigatória
   - Ajustar sombras e bordas para sutileza
   - Otimizar estados de hover/focus
   - Validar contraste em todos os elementos

2. **Testes de responsividade**
   - Validar comportamento em mobile (< 768px)
   - Testar em tablet (768px - 1024px)
   - Confirmar funcionamento em desktop (> 1024px)
   - Testar barra sticky em diferentes tamanhos

3. **Otimizações de performance e acessibilidade**
   - Throttling de scroll events
   - Memoização de componentes
   - Cleanup de event listeners
   - Validar `prefers-reduced-motion`
   - Testar navegação por teclado

### Arquivos a Modificar
```
app/clientes/[id]/page.tsx                    # Página principal
components/client/notes-and-attachments.tsx  # Componente de notas/anexos
```

### Novos Componentes (se necessário)
```
components/ui/sticky-progress-bar.tsx    # Barra de progresso sticky
components/ui/disabled-section.tsx      # Wrapper para seções desabilitadas
```

### Validações Obrigatórias
- [ ] Todas as cores seguem a paleta obrigatória
- [ ] Contraste mínimo 7:1 em todos os textos
- [ ] Transições seguem padrões definidos
- [ ] Estados de foco visíveis com `--sgbus-green`
- [ ] Bordas sutis com transparência aplicadas
- [ ] Animações respeitam `prefers-reduced-motion`

### Checklist de Conclusão
- [ ] Elementos menores e mais organizados
- [ ] Hierarquia visual clara implementada
- [ ] Layout minimalista aplicado
- [ ] Barra sticky funcionando corretamente
- [ ] Detecção de scroll precisa (threshold 100px)
- [ ] Notas/anexos desabilitados elegantemente
- [ ] Scroll suave mantido
- [ ] Animações otimizadas (60fps)
- [ ] Responsividade validada em todos os dispositivos
- [ ] Performance adequada sem memory leaks
- [ ] Regras de design da aplicação aplicadas
- [ ] Paleta de cores obrigatória seguida
- [ ] Contraste e acessibilidade validados
- [ ] Mensagem "Em breve nas próximas atualizações" implementada
- [ ] Título alterado para "Informações do Cliente"
- [ ] Barra de progresso mais sutil (h-2)
- [ ] Espaçamentos otimizados conforme especificado
