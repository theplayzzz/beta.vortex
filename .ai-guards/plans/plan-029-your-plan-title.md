---
id: plan-029
title: Implementação de Transcrição em Tempo Real - Screen Sharing
createdAt: 2025-06-27
author: theplayzzz
status: in-progress
---

## 🧩 Scope

Implementar um sistema de transcrição em tempo real de áudio de tela compartilhada na rota `/coach/capture` da aplicação principal, baseado no repositório subtitle-chan. O sistema deve capturar áudio da tela compartilhada e transcrever usando a Web Speech API nativa do browser.

## ✅ Functional Requirements

- Botão "Compartilhar Tela" que inicia captura de áudio da tela
- Transcrição em tempo real do áudio capturado
- Interface para exibir transcrições ao vivo
- Controles de início/parada da transcrição
- Tratamento de erros e reconexão automática
- Integração com Web Speech API nativa do browser
- Página acessível em `/coach/capture` (não listada no menu principal)

## ⚙️ Non-Functional Requirements

- Performance: Transcrição com latência máxima de 2 segundos
- Security: Dados de áudio processados apenas no browser (não enviados para servidor)
- Scalability: Suporte a múltiplas sessões simultâneas
- Usability: Interface intuitiva com feedback visual claro
- Compatibility: Funcionar em Chrome, Edge (Web Speech API suportada, requer internet)
- Limitation: Firefox não suporta Speech Recognition

## 📚 Guidelines & Packages

- Follow project guidelines: Next.js 15, TypeScript, Tailwind CSS
- Packages do subtitle-chan: React, TypeScript, Vite, Tailwind (MIT License)
- Web Speech API nativa do browser
- Web API: getDisplayMedia() para captura de tela
- Sem dependências externas de transcrição

## 🔐 Threat Model (Stub)

- Audio data privacy: Dados processados apenas no browser, não armazenados
- Screen sharing permission: Usuário deve autorizar captura de tela
- Browser compatibility: Verificar suporte à Web Speech API
- Resource exhaustion: Limitar duração máxima de sessões
- Internet dependency: Chrome requer conexão para Speech Recognition

## ⚠️ Desafios Técnicos Identificados

- **Web Speech API + Screen Sharing**: SpeechRecognition normalmente só funciona com getUserMedia()
- **Compatibilidade**: Firefox não suporta Speech Recognition
- **Offline**: Chrome requer servidor para reconhecimento
- **Integração**: Necessário MediaRecorder para conectar áudio da tela ao SpeechRecognition

## 🔢 Execution Plan

### **Etapa 1: Setup e Clone do Repositório Base** ✅
- [x] Clonar subtitle-chan em diretório temporário
- [x] Analisar estrutura do projeto e arquivos principais
- [x] Identificar componentes React reutilizáveis
- [x] Extrair bibliotecas e utilitários necessários
- [x] Documentar arquitetura e fluxo de dados

### **Etapa 2: Criação da Estrutura Base** ✅
- [x] Criar página `/coach/capture` no Next.js
- [x] Configurar rota protegida (não listada)
- [x] Implementar layout básico da página
- [x] Configurar componentes base extraídos do subtitle-chan
- [x] Teste: Página acessível e renderizando corretamente

### **Etapa 3: Implementação de Screen Sharing** ✅
- [x] Adaptar componente AudioRecorder para getDisplayMedia()
- [x] Investigar como conectar áudio da tela ao SpeechRecognition
- [x] Implementar MediaRecorder para processamento de áudio
- [x] Adicionar controles de início/parada
- [x] Implementar preview da tela compartilhada
- [x] Teste: Captura de áudio da tela funcionando

**Implementações realizadas na Etapa 3:**
- ✅ **Preview da tela compartilhada**: Video element com stream em tempo real
- ✅ **MediaRecorder**: Gravação de áudio em chunks de 1 segundo
- ✅ **AudioContext**: Processamento de áudio da tela compartilhada
- ✅ **Download de áudio**: Funcionalidade para baixar áudio gravado (.webm)
- ✅ **Controles aprimorados**: Botões com ícones e estados visuais melhorados
- ✅ **Verificação de compatibilidade**: Detecção de getDisplayMedia() e Web Speech API
- ✅ **Cleanup automático**: Liberação de recursos ao parar captura
- ✅ **Interface responsiva**: Design seguindo paleta de cores do projeto

### **Etapa 4: Integração com Web Speech API do subtitle-chan**
- [ ] Implementar prefixos de compatibilidade (webkit)
- [ ] Configurar SpeechRecognition: continuous=true, lang='pt-BR', interimResults=true
- [ ] Adaptar componente de transcrição do subtitle-chan
- [ ] Implementar eventos: onresult, onstart, onend, onerror
- [ ] Implementar reconexão automática (onend)
- [ ] Adicionar controles de configuração (idioma, etc.)
- [ ] Implementar tratamento de erros específicos
- [ ] Teste: Transcrição funcionando com screen sharing

### **Etapa 5: Melhorias de Interface**
- [ ] Implementar design responsivo
- [ ] Adicionar indicadores visuais de status
- [ ] Implementar histórico de transcrições
- [ ] Adicionar opções de configuração avançadas
- [ ] Teste: Interface completa e polida

### **Etapa 6: Otimização e Testes Finais**
- [ ] Otimizar performance da transcrição
- [ ] Implementar tratamento robusto de erros
- [ ] Adicionar logs para debugging
- [ ] Testes em diferentes navegadores
- [ ] Teste: Sistema completo funcionando

### **Etapa 7: Documentação e Deploy**
- [ ] Documentar setup e funcionamento
- [ ] Criar guia de uso para desenvolvedores
- [ ] Preparar deploy da funcionalidade
- [ ] Teste: Sistema em produção

## 📋 Arquivos Principais a Criar/Modificar

### **Frontend (Next.js)**
```
app/coach/capture/
├── page.tsx                 # Página principal ✅
├── components/
│   ├── ScreenRecorder.tsx   # Componente adaptado do subtitle-chan ✅
│   ├── TranscriptionDisplay.tsx ✅
│   ├── AudioControls.tsx ✅
│   └── StatusIndicator.tsx
└── lib/
    ├── audioUtils.ts        # Utilitários de áudio
    └── useScreenTranscription.ts ✅
```

### **Configuração**
```
next.config.js              # Configuração do Next.js (se necessário)
```

## 🎯 Critérios de Sucesso por Etapa

1. **Etapa 1**: ✅ Compreensão clara da arquitetura do subtitle-chan
2. **Etapa 2**: ✅ Página `/coach/capture` acessível e funcional
3. **Etapa 3**: ✅ Captura de áudio da tela compartilhada
4. **Etapa 4**: Transcrição em tempo real com Web Speech API
5. **Etapa 5**: Interface completa e responsiva
6. **Etapa 6**: Sistema robusto e otimizado
7. **Etapa 7**: Funcionalidade pronta para produção

## 🚀 Comandos Iniciais

```bash
# Clonar subtitle-chan para análise
git clone https://github.com/ae9is/subtitle-chan.git temp/subtitle-chan

# Instalar dependências se necessário
cd temp/subtitle-chan && npm install

# Executar para entender funcionamento
npm run dev
```

## 🔧 Configurações Web Speech API Necessárias

```javascript
// Compatibilidade cross-browser
const SpeechRecognition = 
  window.SpeechRecognition || window.webkitSpeechRecognition;

// Configuração para transcrição contínua
recognition.continuous = true;        // Não para automaticamente
recognition.lang = 'pt-BR';          // Português brasileiro
recognition.interimResults = true;    // Resultados parciais em tempo real
recognition.maxAlternatives = 1;      // Uma alternativa por resultado

// Eventos essenciais
recognition.onresult = (event) => {
  // Processar transcrição em tempo real
};
recognition.onend = () => {
  // Reiniciar automaticamente para transcrição contínua
  recognition.start();
};
```

## 📊 Status Atual

**Progresso**: 3/7 etapas concluídas (43%)
**Próxima**: Etapa 4 - Integração com Web Speech API do subtitle-chan
**Estimativa**: 2-3 etapas restantes para MVP funcional

# Plano de Implementação: Sistema de Transcrição em Tempo Real

## Status: 🔄 Em Progresso - Etapa 3 Concluída com Correção HTTPS

### Contexto
Implementar um sistema de transcrição em tempo real de áudio de tela compartilhada na rota `/coach/capture` usando Web Speech API nativa do navegador.

### Decisões Tomadas
- ✅ **Usar Web Speech API nativa** em vez de Google Cloud Speech-to-Text API
- ✅ **Arquitetura baseada no subtitle-chan** (React + TypeScript + Tailwind)
- ✅ **Configuração HTTPS obrigatória** para APIs de mídia

### Etapas do Projeto

#### ✅ Etapa 1: Análise e Estruturação (Concluída)
- [x] Análise do subtitle-chan como base arquitetural
- [x] Mapeamento de componentes e funcionalidades
- [x] Definição da stack tecnológica

#### ✅ Etapa 2: Implementação Base (Concluída)
- [x] Criação da estrutura de diretórios
- [x] Instalação de dependências
- [x] Implementação dos componentes base
- [x] Configuração de rota e middleware

#### ✅ Etapa 3: Screen Sharing + HTTPS (Concluída)
- [x] Implementação de getDisplayMedia()
- [x] Preview em tempo real da tela compartilhada
- [x] MediaRecorder para gravação de áudio
- [x] Download de áudio gravado
- [x] **🔒 CORREÇÃO HTTPS**: Configuração SSL para desenvolvimento
- [x] **🛠️ Scripts de automação**: setup-https.sh e dev:https
- [x] **📚 Documentação**: TRANSCRICAO-README.md

**Problema Identificado e Resolvido:**
- **Causa**: APIs de mídia (getDisplayMedia, getUserMedia) requerem HTTPS
- **Solução**: Certificados SSL autoassinados + servidor HTTPS personalizado
- **Comandos**: `./setup-https.sh` e `npm run dev:https`

#### 🔄 Etapa 4: Integração Web Speech API (Próxima)
- [ ] Configuração completa da Web Speech API
- [ ] Processamento de áudio da tela compartilhada
- [ ] Transcrição em tempo real
- [ ] Tratamento de erros e reconexão

#### ⏳ Etapa 5: Processamento Avançado
- [ ] Sistema de frases automático
- [ ] Controle de qualidade da transcrição
- [ ] Configurações personalizáveis
- [ ] Otimizações de performance

#### ⏳ Etapa 6: Exportação e Histórico
- [ ] Exportação de transcrições (TXT, JSON)
- [ ] Histórico de sessões
- [ ] Marcadores de tempo
- [ ] Metadados da sessão

#### ⏳ Etapa 7: Testes e Otimizações
- [ ] Testes de compatibilidade
- [ ] Otimizações de performance
- [ ] Tratamento de edge cases
- [ ] Documentação final

### Arquitetura Implementada

```
app/coach/capture/
├── page.tsx                    # Página principal
├── components/
│   ├── ScreenRecorder.tsx      # Componente principal
│   ├── TranscriptionDisplay.tsx # Exibição de transcrições
│   └── AudioControls.tsx       # Controles de interface
└── lib/
    └── useScreenTranscription.ts # Hook de transcrição

# Configuração HTTPS
├── server-https.js             # Servidor HTTPS personalizado
├── setup-https.sh              # Script de configuração
└── .ssl/                       # Certificados SSL (ignorado pelo Git)
```

### Tecnologias Utilizadas
- **Framework**: Next.js 15
- **Linguagem**: TypeScript
- **Estilização**: Tailwind CSS + Paleta de cores customizada
- **APIs**: Web Speech API + Screen Capture API
- **Gravação**: MediaRecorder API
- **Segurança**: HTTPS com certificados autoassinados

### Como Executar
```bash
# Configurar HTTPS (primeira vez)
./setup-https.sh

# Executar com HTTPS (obrigatório)
npm run dev:https

# Acessar
https://localhost:3003/coach/capture
```

### Requisitos de Compatibilidade
- **Navegador**: Chrome 74+ ou Edge 79+
- **Protocolo**: HTTPS (obrigatório)
- **Conexão**: Internet (para Web Speech API)
- **Permissões**: Compartilhamento de tela

### Progresso Atual
**3/7 etapas concluídas (43%)**

**Funcionalidades Implementadas:**
- ✅ Compartilhamento de tela com áudio
- ✅ Preview em tempo real
- ✅ Gravação e download de áudio
- ✅ Interface responsiva
- ✅ Verificação de compatibilidade
- ✅ Configuração HTTPS automática
- ✅ Gestão de recursos e cleanup

**Próximos Passos:**
1. **Integração completa com Web Speech API** (Etapa 4)
2. **Processamento avançado de transcrições** (Etapa 5)
3. **Sistema de exportação** (Etapa 6)

### Observações Importantes
- **HTTPS é obrigatório** para todas as APIs de mídia
- **Certificados autoassinados** são seguros para desenvolvimento
- **Web Speech API** processa tudo localmente no navegador
- **Compatibilidade** limitada ao Chrome e Edge por questões de segurança

---

**Última Atualização**: 05/07/2025 - Correção HTTPS implementada
