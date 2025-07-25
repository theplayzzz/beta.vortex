# PRD - Copiloto de Vendas | Vortex

## 1. Visão Geral

**Produto:** Copiloto de Vendas  
**Plataforma:** Vortex  
**Objetivo:** Assistente inteligente para reuniões de vendas e negociação com transcrição em tempo real e análise por IA

## 2. Problema e Oportunidade

Durante reuniões de vendas, vendedores precisam focar na conversa enquanto simultaneamente analisam informações, tomam notas e pensam em próximos passos. O Copiloto de Vendas resolve essa sobrecarga cognitiva oferecendo suporte inteligente em tempo real através da captura, transcrição e análise automatizada do áudio da reunião.

## 3. Funcionalidades Core

### 3.1 Captura de Áudio Múltipla
- **Fonte Principal:** Áudio da tela compartilhada/reunião via Daily.co WebRTC
- **Fonte Secundária:** Áudio do microfone local do usuário
- **Tecnologia:** Daily.co com Deepgram para transcrição em tempo real
- **Ativação:** Conexão sob demanda quando usuário iniciar sessão
- **Controles:** Mute/unmute independente para microfone e captura de tela

### 3.2 Transcrição em Tempo Real com Identificação de Fonte
- **Processamento:** Deepgram via Daily.co transcription API
- **Segmentação:** Blocos de máximo 500 caracteres por segmento
- **Identificação de Canal:**
  - **Áudio da Tela:** Cor vermelha na exibição
  - **Áudio do Microfone:** Cor azul na exibição
- **Quebras de Linha:** Automáticas na mudança de contexto/canal
- **Evento:** `transcription-message` via `app-message` do Daily.co

### 3.3 Análise Inteligente
- **Input:** Blocos de transcrição selecionados pelo usuário
- **Processamento:** IA interna analisa contexto e gera insights
- **Output:** Sugestões, identificação de objeções, próximos passos
- **Contextualização:** Análise focada em vendas e negociação

## 4. Comportamento dos Elementos

### 4.1 Gestão da Transcrição Multi-Canal
- **Aparição:** Novos blocos aparecem na parte inferior da área de transcrição
- **Identificação Visual:**
  - Transcrição do **áudio da tela**: cor **vermelha**
  - Transcrição do **microfone**: cor **azul**
- **Quebras de Linha:** Inserção automática quando há:
  - Mudança de canal de áudio (tela ↔ microfone)
  - Fechamento de bloco de 500 caracteres
  - Mudança de contexto detectada pelo Deepgram
- **Movimento:** Blocos antigos sobem automaticamente conforme novos chegam
- **Overflow:** Scroll automático quando área atinge capacidade máxima
- **Interação:** Cada bloco é individualmente selecionável para análise
- **Persistência:** Transcrição mantida durante toda a sessão ativa

### 4.2 Sistema de Análise
- **Trigger:** Ativado quando usuário seleciona blocos e clica "ANALISAR"
- **Posicionamento:** Nova análise sempre aparece no topo da área de análise
- **Empilhamento:** Análises anteriores descem automaticamente
- **Histórico:** Todas as análises ficam acessíveis via scroll vertical
- **Contextualização:** Cada análise refere-se especificamente aos blocos selecionados

### 4.3 Fluxo de Trabalho Atualizado
1. **Início da Sessão:** Usuário ativa conexão Daily.co
2. **Captura Dupla:** Sistema inicia captura de áudio da tela + microfone
3. **Transcrição Multi-Canal:** Deepgram processa ambas as fontes simultaneamente
4. **Exibição Diferenciada:** Blocos aparecem com cores distintas (vermelho/azul)
5. **Quebras Automáticas:** Sistema insere quebras de linha na mudança de canal
6. **Seleção Contextual:** Usuário escolhe blocos relevantes (qualquer cor) para análise
7. **Análise sob Demanda:** IA processa contexto selecionado independente da fonte
8. **Insights Disponíveis:** Resultados empilhados para consulta durante reunião
9. **Controles de Mute:** Usuário pode silenciar microfone ou captura da tela independentemente

## 5. Integração com Ferramentas Externas

### 5.1 Daily.co WebRTC + Deepgram
- **Função:** Plataforma de reunião + transcrição em tempo real
- **Ativação:** Conexão estabelecida quando usuário iniciar sessão
- **Múltiplas Fontes:** Captura simultânea de áudio da tela e microfone
- **API Utilizada:** 
  - `startTranscription()` para iniciar transcrição
  - `transcription-message` event via `app-message` para receber texto
  - Identificação de participante/fonte via participant IDs
- **Status:** Indicador visual de conectado/desconectado
- **Controles:** Início/parada da captura + mute independente por canal

### 5.2 Deepgram via Daily.co
- **Função:** Conversão de áudio em texto estruturado em tempo real
- **Input:** Streams de áudio capturados via Daily.co (tela + microfone)
- **Output:** Blocos de texto de 500 caracteres máximo com identificação de fonte
- **Evento:** Dados recebidos via `transcription-message` do Daily.co
- **Métricas:** FINAL, INTERIM, CONF%, TEMPO exibidas em tempo real
- **Latência:** <300ms conforme especificação Daily.co + Deepgram

### 5.3 IA Interna
- **Input:** Blocos de transcrição selecionados pelo usuário
- **Processamento:** Análise contextual focada em vendas
- **Output:** Insights, sugestões, identificação de padrões
- **Especialização:** Treinada para contextos de negociação e vendas

## 6. Estados e Controles do Sistema

### 6.1 Estados Operacionais
- **Inativo:** Aguardando início de sessão
- **Conectando:** Estabelecendo conexão Daily.co + ativando Deepgram
- **Ativo:** Capturando e transcrevendo ambos os canais em tempo real
- **Microfone Mudo:** Captura apenas áudio da tela (vermelho)
- **Tela Muda:** Captura apenas áudio do microfone (azul)
- **Analisando:** Processando blocos selecionados via IA
- **Finalizado:** Sessão encerrada, dados preservados

### 6.2 Controles Disponíveis
- **Iniciar/Parar:** Controle da sessão de captura geral
- **Mute Microfone:** Silencia apenas canal do microfone
- **Mute Tela:** Silencia apenas canal da captura de tela
- **Seleção de Blocos:** Interface para escolher conteúdo (qualquer cor) para análise
- **Trigger de Análise:** Botão "ANALISAR" para processar seleção
- **Finalizar:** Encerramento da sessão com preservação do histórico

## 7. Objetivos de Performance

### 7.1 Latência
- **Transcrição:** Máximo 2 segundos do áudio ao texto
- **Análise IA:** Máximo 5 segundos do trigger ao resultado
- **Interface:** Atualizações em tempo real sem lag perceptível

### 7.2 Qualidade
- **Precisão da Transcrição:** Mínimo 90% de acurácia em áudio claro
- **Relevância da Análise:** Insights contextualizados para vendas
- **Estabilidade:** Sistema operacional durante reuniões de até 2 horas

## 8. Próximos Passos de Desenvolvimento

### Fase 1 - Integração Multi-Canal (4-6 semanas)
- Implementar conexão Daily.co com múltiplas fontes de áudio
- Integrar pipeline Deepgram via Daily.co transcription API
- Desenvolver sistema de blocos de 500 caracteres com identificação de cor
- Implementar eventos `transcription-message` e `app-message`
- Criar controles independentes de mute para cada canal
- Desenvolver quebras de linha automáticas na mudança de contexto

### Fase 2 - IA e Interface Diferenciada (3-4 semanas)
- Integrar sistema de análise por IA independente da fonte
- Implementar exibição visual diferenciada (vermelho/azul)
- Desenvolver especialização em insights de vendas
- Criar interface de seleção multi-canal
- Otimizar performance para processamento duplo
- Implementar métricas em tempo real (FINAL, INTERIM, CONF%, TEMPO)

### Fase 3 - Refinamento (2 semanas)
- Testes com usuários reais em reuniões
- Ajustes de UX baseados em feedback
- Otimizações de performance final
- Documentação e lançamento