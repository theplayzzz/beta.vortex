---
id: plan-017
title: Reorganização do Header da Tela de Planejamentos
createdAt: 2025-06-05
author: theplayzzz
status: draft
---

## 🧩 Scope

Realizar a reorganização da parte superior da tela de "Planejamentos" com foco em melhorar a hierarquia visual e economizar espaço vertical. Em telas grandes, alinhar o título "Planejamentos" e o botão "+ Novo Planejamento" horizontalmente, com o subtítulo abaixo do título. Abaixo disso, dispor a barra de pesquisa e os filtros em linha. Em telas menores (até 768px), usar layout empilhado: título, subtítulo, botão centralizado ou no topo direito, seguido da busca e filtros em colunas. Garantir que o botão não fique visualmente isolado nem desalinhado com o restante do layout. Aplicar grid/flex container para manter coesão entre os elementos e considerar agrupamento visual com fundo `#171818` para filtros e busca.

## ✅ Functional Requirements

### 📱 Layout Mobile (≤ 768px)
- Implementar layout empilhado (stacked) com elementos verticalmente organizados
- Título "Planejamentos" centralizado ou alinhado à esquerda
- Subtítulo "Gerencie todos os seus planejamentos..." abaixo do título
- Botão "+ Novo Planejamento" centralizado ou posicionado no topo direito com margem adequada
- Barra de pesquisa em largura total
- Filtros (Status, Clientes) empilhados verticalmente
- Opção de implementar FAB (Floating Action Button) para o botão "+ Novo Planejamento"

### 💻 Layout Desktop (≥ 1024px)
- Implementar layout horizontal otimizado em 2 colunas
- Título "Planejamentos" e botão "+ Novo Planejamento" alinhados horizontalmente
- Subtítulo posicionado abaixo do título, mantendo hierarquia visual
- Barra de pesquisa e filtros dispostos horizontalmente na mesma linha
- Botão "Resetar" integrado com os filtros
- Contador de resultados visível ("X planejamentos encontrados")

### 🎨 Design e UX
- Container com fundo `#171818` para agrupar visualmente busca e filtros
- Padding e bordas sutis para delimitar áreas funcionais
- Espaçamento consistente entre elementos
- Transições suaves entre breakpoints responsivos
- Evitar isolamento visual do botão "+ Novo Planejamento"

## ⚙️ Non-Functional Requirements

- **Performance**: Renderização otimizada com CSS Grid/Flexbox para evitar reflows
- **Responsividade**: Breakpoints em 768px e 1024px com transições fluidas
- **Acessibilidade**: Manter hierarquia semântica (H1, H2) e navegação por teclado
- **Usabilidade**: Reduzir cliques necessários para ações principais
- **Consistência**: Seguir design system existente do projeto

## 📚 Guidelines & Packages

- **CSS Framework**: Utilizar Tailwind CSS ou CSS modules existentes no projeto
- **Layout**: CSS Grid para estrutura principal, Flexbox para alinhamentos internos
- **Responsividade**: Mobile-first approach com media queries
- **Componentes**: Manter componentização React existente
- **Cores**: Usar palette existente do projeto (`#171818` para backgrounds)
- **Tipografia**: Manter hierarquia de fontes estabelecida

## 🔐 Threat Model (Stub)

- **Layout Shift**: Evitar mudanças bruscas de layout durante carregamento
- **Performance Mobile**: Garantir que layouts complexos não impactem performance em dispositivos menos potentes
- **Acessibilidade**: Manter ordem de foco lógica em todos os breakpoints
- **Cross-browser**: Testar compatibilidade com Grid/Flexbox em navegadores mais antigos

## 🔢 Execution Plan

1. **Análise e Setup**
   - Mapear componentes existentes da tela de Planejamentos
   - Identificar breakpoints e classes CSS atuais
   - Documentar estrutura HTML/JSX atual

2. **Implementação Mobile-First**
   - Criar estrutura base empilhada para mobile
   - Implementar título + subtítulo + botão em layout vertical
   - Configurar barra de pesquisa em largura total
   - Organizar filtros em layout de coluna

3. **Implementação Desktop**
   - Aplicar media queries para ≥ 1024px
   - Reorganizar título e botão em layout horizontal (2 colunas)
   - Alinhar busca e filtros em linha horizontal
   - Implementar container com fundo `#171818` para filtros

4. **Refinamentos e Polimento**
   - Ajustar espaçamentos e paddings
   - Implementar transições suaves entre breakpoints
   - Adicionar estados hover/focus para botões
   - Testar e ajustar hierarquia visual

5. **Testes e Validação**
   - Testar responsividade em dispositivos reais
   - Validar acessibilidade (screen readers, navegação por teclado)
   - Testar performance (Core Web Vitals)
   - Review de código e aprovação final
