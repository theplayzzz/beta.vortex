---
id: plan-011
title: Sistema de Atualização da Aba Planejamento Refinado - Implementação do Zero
createdAt: 2025-05-30
author: theplayzzz
status: draft
---

## 🧩 Scope

Implementar um sistema completo de gerenciamento de estados da aba "Planejamento Refinado" que funcione de forma dinâmica e responsiva, sem necessidade de refresh da página. O sistema deve gerenciar a transição entre estados (semitransparente → IA gerando → pronto → novo) baseado nas ações do usuário e retorno de dados do agente IA.

## ✅ Functional Requirements

### 1. Remoção do Sistema Atual
- Remover todos os gatilhos atuais de atualização da aba planejamento refinado
- Remover todos os recursos de gerenciamento existentes
- Remover escuta de resposta do webhook atual

### 2. Sistema de Estados da Aba
- **Estado Inicial (Semitransparente)**: Aba visível mas não clicável, parcialmente transparente
- **Estado "IA Gerando"**: Aba totalmente visível, mostra indicador de carregamento
- **Estado "Pronto"**: Aba totalmente visível, conteúdo disponível para visualização
- **Estado "Novo"**: Indicador visual de novo conteúdo disponível

### 3. Fluxo de Aprovação de Planejamento
- Verificar informação na coluna scope do planejamento selecionado
- Se scope != null: excluir conteúdo existente antes de enviar webhook
- Disparar webhook apenas após exclusão (se necessária)
- Atualizar aba para estado "IA Gerando" imediatamente

### 4. Sistema de Polling
- Ativar polling quando entrar em estado "IA Gerando"
- Verificar continuamente se dados chegaram no banco (scope != null)
- Desativar polling quando dados forem detectados
- Transicionar para estado "Pronto" automaticamente

### 5. Gerenciamento de Múltiplas Aprovações
- Para segunda+ aprovação: verificar scope existente
- Excluir scope se existir → disparar webhook → "IA Gerando"
- Reativar polling para nova geração

### 6. Visualização de Novo Conteúdo
- Estado "Novo" ativado quando novo planejamento é gerado
- Removido automaticamente na primeira visualização do usuário

## ⚙️ Non-Functional Requirements

### Performance
- Polling com intervalo otimizado (3-5 segundos) para não sobrecarregar
- Transições de estado instantâneas na UI
- Timeout de 5 minutos para polling (fallback de erro)

### UX/UI
- Transições suaves entre estados sem quebra visual
- Indicadores visuais claros para cada estado
- Feedback imediato nas ações do usuário
- Prevenção de ansiedade durante espera (1-2 minutos)

### Robustez
- Tratamento de erros de rede no polling
- Fallback para estados anteriores em caso de falha
- Logs detalhados para debugging
- Prevenção de múltiplos webhooks simultâneos

## 📚 Guidelines & Packages

### Tecnologias Base
- React hooks para gerenciamento de estado local
- Context API para estado global da aba
- Axios para requisições HTTP com retry
- React Query ou SWR para polling otimizado

### Padrões de Código
- Custom hooks para lógica de estado da aba
- Componentes reutilizáveis para indicadores visuais
- TypeScript para tipagem forte dos estados
- Error boundaries para captura de erros

### Estrutura de Estados
```typescript
type TabState = 'transparent' | 'generating' | 'ready' | 'new';
type ScopeData = string | null;
type PollingStatus = 'idle' | 'active' | 'stopped' | 'error';
```

## 🔢 Execution Plan

### Fase 1: Limpeza e Preparação (1-2 horas)
1. **Remoção Completa do Sistema Atual**
   - Identificar todos os arquivos com lógica de atualização da aba
   - Remover event listeners de webhook
   - Remover componentes de polling existentes
   - Remover estados relacionados no Redux/Context

2. **Setup da Nova Arquitetura**
   - Criar hook personalizado `useRefinedPlanningTab`
   - Criar context `RefinedPlanningProvider`
   - Definir tipos TypeScript para estados
   - Setup de estrutura de pastas

### Fase 2: Implementação do Core (3-4 horas)
3. **Sistema de Estados Base**
   - Implementar máquina de estados da aba
   - Criar transições válidas entre estados
   - Implementar validações de estado

4. **Lógica de Aprovação de Planejamento**
   - Interceptar evento de aprovação
   - Implementar verificação de scope existente
   - Criar função de exclusão de scope
   - Implementar envio de webhook pós-exclusão

5. **Sistema de Polling**
   - Criar hook `usePolling` com controle fino
   - Implementar verificação de dados no banco
   - Configurar intervalos e timeouts
   - Adicionar tratamento de erros

### Fase 3: Interface e UX (2-3 horas)
6. **Componentes Visuais**
   - Componente de aba com estados visuais
   - Indicadores de carregamento
   - Transições CSS suaves
   - Indicador de "novo conteúdo"

7. **Integração com UI Existente**
   - Conectar com botão de aprovação
   - Integrar com visualização de planejamento
   - Teste de responsividade

### Fase 4: Testes e Refinamento (2 horas)
8. **Testes de Fluxo Completo**
   - Teste de primeira aprovação (transparente → gerando → pronto)
   - Teste de segunda aprovação (pronto → gerando → pronto)
   - Teste de visualização (remoção do estado "novo")

9. **Otimizações e Polimento**
   - Ajustar timings de polling
   - Otimizar transições visuais
   - Adicionar logs para debugging
   - Documentação do sistema

### Fase 5: Deploy e Monitoramento (1 hora)
10. **Preparação para Produção**
    - Testes finais em ambiente de desenvolvimento
    - Deploy gradual (feature flag se possível)
    - Monitoramento de erros
    - Documentação para usuários

## 📊 Arquitetura Técnica

### Fluxo de Dados
```
Usuário clica "Aprovar" → 
Verificar scope existente → 
[Se existe] Excluir scope → 
Disparar webhook → 
Atualizar aba para "IA Gerando" → 
Iniciar polling → 
Detectar dados no banco → 
Parar polling → 
Atualizar para "Pronto" → 
[Na visualização] Remover "Novo"
```

### Componentes Principais
- `RefinedPlanningTab`: Componente principal da aba
- `useRefinedPlanningState`: Hook de gerenciamento de estado
- `usePlanningPolling`: Hook de polling de dados
- `PlanningApprovalHandler`: Interceptor de aprovação
- `ScopeDataManager`: Gerenciador de dados do scope

## 🔍 Critérios de Sucesso

### Funcionais
- ✅ Aba atualiza estados sem refresh da página
- ✅ Polling funciona corretamente (3-5s de intervalo)
- ✅ Exclusão de scope antes de webhook funciona
- ✅ Transições de estado são imediatas na UI
- ✅ Estado "novo" é removido na primeira visualização

### Não-Funcionais
- ✅ Tempo de resposta da UI < 100ms
- ✅ Polling não causa lag na interface
- ✅ Sistema robusto com tratamento de erros
- ✅ UX fluida sem causar ansiedade no usuário
- ✅ Compatibilidade com browsers modernos
