---
id: plan-003
title: Implementação da Estrutura Visual Completa - Dashboard Vortex Vault
createdAt: 2025-05-26
author: theplayzzz
status: draft
---

## 🧩 Scope

Implementar estrutura visual completa seguindo `/root/Vortex/precedent/docs/analise-estrutura-visual.md` e `guia-de-cores-e-estilos.md`. Transformar o template Next.js atual em uma aplicação dashboard funcional com sidebar animado, header com funcionalidades e sistema de cores personalizado.

**Objetivo Principal**: Criar a base visual e estrutural para o Vortex Vault Dashboard, mantendo alta qualidade de UX e seguindo exatamente as especificações de design.

## ✅ Functional Requirements

### Layout Base
- Container principal: `flex h-screen overflow-hidden bg-background`
- Estrutura horizontal: Sidebar + Main Content Area
- Sidebar colapsável: 72px → 200px com animações Framer Motion
- Header fixo: altura 64px com funcionalidades completas

### Sidebar Funcional
- **Estados**: Colapsado (72px) e Expandido (200px)
- **Menu Items**: Home, Planejamento (com submenus), Lista Refinada, Vendas (disabled)
- **Animações**: Transições suaves com Framer Motion
- **Persistência**: Estado salvo em localStorage
- **Responsividade**: Comportamento específico para mobile

### Header Completo
- **Barra de Pesquisa**: bg-[#2A1B45], w-[360px], h-[40px], centralizada
- **Menu Usuário**: Integração com Clerk (avatar, perfil, logout)
- **Notificações**: Sistema preparado para implementação futura
- **Layout**: Altura fixa 64px, border-b border-accent/20

### Sistema de Roteamento
- Páginas: Dashboard (/), Planejamento (/backlog), Lista Refinada (/tarefas)
- Roteamento protegido com Clerk
- Indicadores visuais de página ativa no sidebar

## ⚙️ Non-Functional Requirements

### Performance
- Animações otimizadas com Framer Motion (60fps)
- Lazy loading para componentes pesados
- Debounce na barra de pesquisa (300ms)
- Transições CSS para micro-interações (<200ms)

### Acessibilidade
- Contraste mínimo WCAG AA (4.5:1)
- Navegação por teclado completa
- Screen reader support
- Focus indicators visíveis

### Responsividade
- Mobile-first approach
- Breakpoints: sm (640px), md (768px), lg (1024px), xl (1280px)
- Sidebar responsivo: drawer em mobile, colapso em desktop
- Header adaptativo para diferentes tamanhos de tela

## 📚 Guidelines & Packages

### Cores Obrigatórias (guia-de-cores-e-estilos.md)
```js
colors: {
  'night': '#0e0f0f',           // Fundo principal
  'eerie-black': '#171818',     // Sidebar, cards
  'sgbus-green': '#6be94c',     // Primária, CTAs
  'seasalt': '#f9fbfc',         // Texto principal
  'periwinkle': '#cfc6fe',      // Secundária, acentos
}
```

### Packages Utilizados
- **Framer Motion** (^8.5.5): Animações do sidebar e transições
- **Tailwind CSS** (^3.3.3): Sistema de design e responsividade
- **Radix UI**: Componentes acessíveis (Dialog, Popover, Tooltip)
- **Clerk** (^5.6.2): Autenticação e menu do usuário
- **Lucide React**: Ícones consistentes
- **clsx + tailwind-merge**: Utilitários de className

### Padrões de Código
- TypeScript strict mode
- Componentes funcionais com hooks
- Props tipadas com interfaces
- Naming convention: PascalCase para componentes, camelCase para funções

## 🔐 Threat Model (Stub)

### Segurança de Autenticação
- Rotas protegidas com Clerk middleware
- Validação de sessão em componentes sensíveis
- Logout seguro com limpeza de estado local

### Proteção de Estado
- localStorage sanitizado antes de uso
- Validação de dados persistidos
- Fallbacks para estados corrompidos

### XSS Prevention
- Sanitização de inputs na barra de pesquisa
- Validação de props em componentes dinâmicos

## 🔢 Execution Plan

### Fase 1: Configuração Base
1. **Atualizar Tailwind Config**
   - Adicionar cores: night, eerie-black, sgbus-green, seasalt, periwinkle
   - Configurar animações: sidebar-expand, fade-in, slide-up
   - Adicionar variáveis CSS customizadas para consistência
   - Configurar breakpoints responsivos

2. **Criar Estrutura de Layout**
   - Layout principal: `app/(dashboard)/layout.tsx`
   - Componente ProtectedRoute com Clerk
   - Roteamento: /, /backlog, /tarefas
   - Middleware de autenticação

### Fase 2: Implementação do Sidebar
3. **Sidebar Base**
   - Arquivo: `components/layout/sidebar.tsx`
   - Framer Motion: `motion.div` com `animate` prop
   - Estados: `isExpanded` boolean + localStorage
   - Larguras: 72px colapsado, 200px expandido
   - Background: `bg-eerie-black` com `border-r border-accent/20`

4. **Menu de Navegação**
   - Items array: `{icon, label, href, disabled?, submenu?}`
   - Hook `usePathname()` para estado ativo
   - Componente `MenuItem` reutilizável
   - Tooltips com Radix UI para estado colapsado
   - Ícones: Home, FileText, CheckSquare, BarChart2

5. **Submenus Animados**
   - Submenu Planejamento: Lista, Criar Novo, Histórico
   - AnimatePresence para mount/unmount
   - Chevron rotativo com `transform: rotate(180deg)`
   - Container: `bg-[#2A1B45] rounded-md p-2 ml-12 mt-2`

### Fase 3: Header Funcional
6. **Header Base**
   - Arquivo: `components/layout/header.tsx`
   - Container: `h-16 bg-background border-b border-accent/20`
   - Layout: `flex items-center justify-between px-6`
   - Z-index: `z-20` para ficar acima do conteúdo

7. **Barra de Pesquisa**
   - Container: `bg-[#2A1B45] w-[360px] h-[40px] px-4 rounded-full`
   - Input: `bg-transparent text-seasalt placeholder-[#A39FAF]`
   - Ícone Search: `lucide-react` 16px, cor `#A39FAF`
   - Hook `useDebounce` para otimização

8. **Menu do Usuário**
   - Clerk `<UserButton />` customizado
   - Dropdown: perfil, configurações, logout
   - Avatar fallback com iniciais
   - Posicionamento: `absolute right-6`

### Fase 4: Páginas Base
9. **Página Dashboard**
   - Arquivo: `app/(dashboard)/page.tsx`
   - Layout: `<div className="p-6 space-y-6">`
   - Header: título + breadcrumbs
   - Grid de widgets placeholder
   - Cards com `bg-eerie-black rounded-lg p-4`

10. **Páginas Planejamento e Tarefas**
    - `app/(dashboard)/backlog/page.tsx`
    - `app/(dashboard)/tarefas/page.tsx`
    - Layout consistente com Dashboard
    - Headers específicos por página
    - Estrutura preparada para conteúdo futuro

### Fase 5: Responsividade e Polimento
11. **Mobile Responsiveness**
    - Breakpoint: `md:` para desktop, mobile-first
    - Sidebar mobile: Drawer com `vaul` library
    - Header mobile: barra de pesquisa adaptativa
    - Touch gestures: swipe para abrir/fechar sidebar

12. **Animações e Micro-interações**
    - Sidebar: `transition: width 0.2s ease-in-out`
    - Menu items: `hover:bg-white/5 transition-colors`
    - Loading states: skeleton components
    - Focus states: `focus-visible:ring-2 ring-sgbus-green`

13. **Validação e Testes**
    - Teste responsividade: 320px até 1920px
    - Validação acessibilidade: contraste, navegação teclado
    - Performance: animações 60fps, bundle size
    - Cross-browser: Chrome, Firefox, Safari

## 🚨 Erros Críticos a Evitar

### ❌ Design System
- **NÃO** usar cores diferentes das especificadas no guia
- **NÃO** implementar animações bruscas ou sem easing
- **NÃO** quebrar a consistência visual entre componentes

### ❌ UX/Performance
- **NÃO** implementar sidebar sem animações (UX ruim)
- **NÃO** fazer sidebar não responsivo para mobile
- **NÃO** deixar transições lentas (>300ms para micro-interações)

### ❌ Código
- **NÃO** usar valores hardcoded para cores
- **NÃO** implementar estado local sem persistência
- **NÃO** esquecer tratamento de erros em localStorage

## 📋 Definition of Done

- [ ] Layout base implementado conforme especificação
- [ ] Sidebar funcional com animações e persistência
- [ ] Header completo com barra de pesquisa e menu usuário
- [ ] Sistema de cores aplicado corretamente
- [ ] Responsividade testada em mobile e desktop
- [ ] Navegação entre páginas funcionando
- [ ] Acessibilidade validada (contraste, teclado, screen reader)
- [ ] Performance otimizada (animações 60fps)
- [ ] Código documentado e tipado
- [ ] Testes manuais em diferentes browsers

## 🎯 Success Metrics

- **Visual**: 100% aderência ao guia de cores e estrutura
- **Performance**: Animações consistentes a 60fps
- **Acessibilidade**: Contraste WCAG AA em todos os elementos
- **Responsividade**: Funcional em dispositivos 320px-1920px
- **UX**: Transições suaves e intuitivas em todas as interações
