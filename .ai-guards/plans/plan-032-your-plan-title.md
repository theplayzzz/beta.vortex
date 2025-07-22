---
id: plan-032
title: Daily.co Híbrido - Sistema de Transcrição com Interface Deepgram
createdAt: 2025-07-22
author: theplayzzz
status: in-progress
---

## 🧩 Scope

Implementar sistema híbrido de transcrição usando Daily.co como backend, mantendo a interface atual **identicamente igual** ao sistema Deepgram. O objetivo é aproveitar a infraestrutura gerenciada do Daily.co para capturar áudio do microfone e da tela compartilhada, processando a transcrição através da integração nativa Deepgram do Daily.co, enquanto mantém a experiência visual completamente familiar do usuário.

## ✅ Functional Requirements

- Manter interface visual **100% idêntica** ao `DeepgramTranscriptionDisplay.tsx`
- Capturar áudio do microfone do usuário automaticamente via Daily.co
- Capturar áudio da tela compartilhada automaticamente via Daily.co  
- Processar transcrição em tempo real via Daily.co + Deepgram integrado
- Implementar controles Start/Stop/Pause de transcrição
- Manter funcionalidade de análise de IA existente via `/api/analyze-context`
- Implementar force-finalize para análise imediata usando Daily.co APIs
- Preservar sistema de histórico e exportação de análises
- Suporte a transcrição em português brasileiro
- Controle de níveis de áudio e indicadores visuais
- Preservar layout em 2 colunas e todos os componentes visuais

## ⚙️ Non-Functional Requirements

- **Performance**: Latência de transcrição < 300ms, reconnect automático em < 5s
- **Security**: API Keys seguras, tokens temporários para salas Daily, permissões de mídia controladas
- **Scalability**: Infraestrutura Daily.co gerenciada, cleanup automático de salas
- **Reliability**: Error handling robusto, fallback para reconexão, logs detalhados
- **Usability**: Interface responsiva, feedback visual de status, controles acessíveis
- **Compatibility**: Hook interface 100% compatível com `useDeepgramTranscription`

## 📚 Guidelines & Packages

- **Framework**: Next.js com TypeScript (manter padrão atual)
- **Packages principais**: 
  - `@daily-co/daily-js` (MIT License) - SDK principal Daily.co
  - `@daily-co/daily-react` (MIT License) - Hooks React opcionais
- **Manter packages existentes**: Para comparação e fallback durante transição
- **Seguir convenções**: Estrutura de arquivos atual, padrões de nomenclatura, estilo de código
- **Compatibilidade**: Manter interface de hooks compatível com sistema atual
- **CSS Variables**: Usar mesmas variáveis CSS (`--eerie-black`, `--seasalt`, `--periwinkle`, etc.)

## 🔐 Threat Model (Stub)

- **API Key exposure**: Daily API Key deve ficar apenas no servidor, nunca no frontend
- **Room hijacking**: Tokens de sala temporários com TTL curto, cleanup automático
- **Media permissions**: Controle adequado de permissões de microfone e tela
- **Data leakage**: Transcrições sensíveis devem ser tratadas conforme LGPD
- **Session hijacking**: Validação de usuário via Clerk mantida

## 📊 Interface Atual Analisada

### **Componente Principal**: `DeepgramTranscriptionDisplay.tsx`
- **Layout**: Grid 2 colunas (`lg:grid-cols-2`)
- **Coluna Esquerda**: Controles + Transcrição
  - Parte Superior: Status, botões, estatísticas (altura fixa: 196px)
  - Parte Inferior: Área de transcrição (flexível)
- **Coluna Direita**: Análise de IA
  - Parte Superior: Campo de análise + botão (altura fixa: 196px)  
  - Parte Inferior: Histórico de análises (flexível)

### **Estados do Hook** (`useDeepgramTranscription`):
```typescript
interface TranscriptionState {
  transcript: string;           // Texto final transcrito
  interimTranscript: string;   // Texto em progresso
  isListening: boolean;        // Se está ouvindo
  userIsTranscribing: boolean; // Se usuário iniciou transcrição
  isConnected: boolean;        // Conexão WebSocket ativa
  error: string | null;        // Erros do sistema
  confidence: number;          // Confiança da transcrição (0-1)
  micLevel: number;           // Nível do microfone (0-1)
  screenLevel: number;        // Nível áudio da tela (0-1)
  isMicrophoneEnabled: boolean; // Se microfone está habilitado
  isForceFinalizingActive: boolean; // Se force-finalize ativo
  provider: string;           // "deepgram"
  model: string;             // "nova-2"
  stats: {                   // Estatísticas em tempo real
    duration: number;
    interimResults: number;
    finalResults: number;
    audioChunks: number;
    errors: number;
  };
}
```

### **Funções do Hook**:
- `startListening()` - Iniciar transcrição
- `stopListening()` - Parar transcrição  
- `clearTranscript()` - Limpar texto
- `connectWebSocket()` - Conectar servidor
- `toggleMicrophoneCapture()` - Toggle microfone
- `forceFinalize()` - Forçar finalização (retorna Promise<boolean>)

### **Roteamento Atual**:
- **URL**: `/coach/capture/deepgram`
- **Página**: `app/coach/capture/deepgram/page.tsx`
- **Componente**: `<DeepgramTranscriptionDisplay />`

### **Webhook de IA**: `/api/analyze-context`
- **Método**: POST
- **Body**: `{ contexto: string }`
- **Response**: HTML formatado para análise
- **Uso**: Botão "🧠 ANALISAR CONTEXTO"

## 🔢 Execution Plan

### **✅ FASE 1: Preparação e Setup (1 dia) - CONCLUÍDA**

#### ✅ Etapa 1.1: Configuração Daily.co - CONCLUÍDA
- [x] Criar conta Daily.co e obter API Key
- [x] Adicionar variáveis de ambiente (`DAILY_API_KEY`, `NEXT_PUBLIC_DAILY_DOMAIN`)

#### ✅ Etapa 1.2: Análise da Interface Atual - CONCLUÍDA
- [x] Mapear todos os componentes da interface Deepgram
- [x] Identificar hooks e estados necessários (`useDeepgramTranscription`)  
- [x] Listar todas as funcionalidades a serem mantidas
- [x] Documentar fluxo de dados atual (WebSocket → Estados → UI)

#### 🔄 Etapa 1.3: Instalação de Dependências - EM ANDAMENTO
- [ ] Instalar `@daily-co/daily-js`
- [ ] Instalar `@daily-co/daily-react` (opcional)
- [ ] Configurar tipos TypeScript para Daily.co
- [ ] Atualizar package.json com novas dependências

### **FASE 2: Criação da Base Daily.co (1-2 dias)**

#### Etapa 2.1: Hook de Transcrição Daily
- [ ] Criar `useDailyTranscription.ts` **COM INTERFACE IDÊNTICA** a `useDeepgramTranscription`
- [ ] Implementar **todos os 21 estados** do TranscriptionState
- [ ] Configurar conexão com Daily.co CallFrame (invisível)
- [ ] Mapear eventos Daily (`app-message`, `transcription-started`) para estados locais
- [ ] **CRÍTICO**: Manter assinatura exata de todas as funções

#### Etapa 2.2: Gerenciamento de Salas Daily
- [ ] Criar serviço para criação de salas (`/api/daily/rooms`)
- [ ] Implementar tokens de acesso temporários
- [ ] Configurar permissões de transcrição por usuário  
- [ ] Adicionar cleanup automático de salas (TTL)
- [ ] **Configurar**: `enable_transcription: "deepgram:key"`

#### Etapa 2.3: Integração WebRTC
- [ ] Configurar Daily CallFrame invisível (sem UI, só áudio)
- [ ] Implementar captura automática de microfone via Daily
- [ ] Configurar compartilhamento de tela automático via Daily
- [ ] Gerenciar permissões de mídia com feedback ao usuário
- [ ] **Mapear**: Daily audio events → micLevel/screenLevel states

### **FASE 3: Interface Híbrida (2 dias)**

#### Etapa 3.1: Componente Daily Transcription Display  
- [ ] **COPIAR EXATO**: `DeepgramTranscriptionDisplay.tsx` → `DailyTranscriptionDisplay.tsx`
- [ ] **TROCAR APENAS**: `useDeepgramTranscription` → `useDailyTranscription`
- [ ] **MANTER 100%**: Estrutura visual, cores, layout, botões, textos
- [ ] **PRESERVAR**: Grid layout, altura fixa 196px, scroll automático
- [ ] **ATUALIZAR**: Provider indicator: "DEEPGRAM" → "DAILY+DEEPGRAM"

#### Etapa 3.2: Adaptação de Estados e Props
- [ ] **Garantir compatibilidade total** entre interfaces de estado
- [ ] Mapear eventos Daily (`fromId: 'transcription'`) para formato atual
- [ ] **Manter**: Todos os controles Start/Stop/Pause funcionando
- [ ] **Preservar**: Indicadores de status, loading, erros
- [ ] **Adaptar**: Confidence mapping, audio levels, stats

#### Etapa 3.3: Página de Captura
- [ ] Criar `/coach/capture/daily-co/page.tsx` **IDÊNTICA** à atual
- [ ] Integrar componente Daily Transcription Display
- [ ] **Manter**: Layout, estilos CSS, background `var(--night)`
- [ ] Configurar roteamento no Next.js

### **FASE 4: Funcionalidades Avançadas (1-2 dias)**

#### Etapa 4.1: Captura de Áudio Combinada
- [ ] Configurar captura simultânea (mic + screen audio) via Daily
- [ ] **Mapear**: Daily audio streams → micLevel/screenLevel indicators  
- [ ] **Preservar**: Visualizador de níveis existente
- [ ] **Implementar**: Toggle microfone usando Daily APIs

#### Etapa 4.2: Controles Avançados
- [ ] **CRÍTICO**: Implementar force-finalize usando `stopTranscription()` + `startTranscription()`
- [ ] **Manter**: Botão "🧠 ANALISAR CONTEXTO" funcionando
- [ ] **Preservar**: Controle de microfone (enable/disable) 
- [ ] **Implementar**: Pause/resume usando Daily APIs

#### Etapa 4.3: Eventos e Callbacks
- [ ] **Mapear**: Daily `app-message` events → transcript/interimTranscript states
- [ ] **Implementar**: Handlers para interim/final results do Daily
- [ ] **Manter**: Error handling robusto com mesmas mensagens
- [ ] **Preservar**: Logs e debugging format

### **FASE 5: Integração com IA e Webhook (1 dia)**

#### Etapa 5.1: Análise de IA
- [ ] **MANTER**: Webhook `/api/analyze-context` exatamente igual
- [ ] **PRESERVAR**: Payload format e response handling  
- [ ] **GARANTIR**: Trigger automático e botão manual funcionando
- [ ] **MANTER**: Histórico de análises e UI

#### Etapa 5.2: Force-finalize Daily
- [ ] **Implementar**: Equivalente usando Daily `stopTranscription()` + restart
- [ ] **MANTER**: Promise<boolean> interface exata
- [ ] **PRESERVAR**: Feedback visual "🔄 ANALISANDO..."
- [ ] **MANTER**: Timeout e retry behavior

#### Etapa 5.3: Histórico e Persistência  
- [ ] **MANTER**: Sistema de histórico atual intacto
- [ ] **GARANTIR**: Formato de dados compatível 
- [ ] **PRESERVAR**: Export de transcrições
- [ ] **MANTER**: Limpeza automática de dados

### **FASE 6: Testes e Otimização (1 dia)**

#### Etapa 6.1: Testes Funcionais
- [ ] **Comparar**: Lado a lado com `/coach/capture/deepgram`
- [ ] **Validar**: Captura de microfone isoladamente  
- [ ] **Testar**: Captura de áudio da tela
- [ ] **Verificar**: Qualidade da transcrição em português
- [ ] **GARANTIR**: Force-finalize + análise IA funcionando

#### Etapa 6.2: Testes de Interface
- [ ] **VALIDAR**: Interface visualmente idêntica pixel por pixel
- [ ] **TESTAR**: Todos os botões e controles
- [ ] **VERIFICAR**: Responsividade em diferentes telas
- [ ] **CONFIRMAR**: Acessibilidade mantida

#### Etapa 6.3: Performance e Otimização
- [ ] **Otimizar**: Conexões Daily.co 
- [ ] **Configurar**: Reconnect automático
- [ ] **Implementar**: Lazy loading de componentes
- [ ] **MEDIR**: Latência vs sistema atual
- [ ] **Adicionar**: Métricas de performance

## 📊 Deliverables

1. **Interface Daily.co Híbrida**: Página `/coach/capture/daily-co` **visualmente idêntica**
2. **Hook compatível**: `useDailyTranscription.ts` com **interface 100% igual**
3. **API Routes**: Gerenciamento de salas e tokens Daily
4. **Documentação**: Guia de uso e comparação com sistema atual
5. **Testes**: Comparação side-by-side validando funcionalidade

## ⏱️ Timeline Estimado

- **Total**: 7-9 dias úteis
- **Milestone 1**: Fase 1-2 completas (3 dias) - Base funcional
- **Milestone 2**: Fase 3-4 completas (6 dias) - Interface completa 
- **Milestone 3**: Fase 5-6 completas (8 dias) - Sistema production-ready

## 🎯 Critério de Sucesso

**✅ APROVAÇÃO FINAL**: Usuário não consegue distinguir visualmente entre:
- `/coach/capture/deepgram` (sistema atual)  
- `/coach/capture/daily-co` (sistema novo)

**Performance superior + Interface idêntica = Migração bem-sucedida**
