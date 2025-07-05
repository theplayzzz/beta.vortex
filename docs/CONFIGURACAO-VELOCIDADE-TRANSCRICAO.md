# 🚀 Configuração de Velocidade de Transcrição

## Visão Geral

O Google Cloud Speech-to-Text permite configurar quando os resultados **interim** se tornam **final**. Isso afeta diretamente a velocidade da transcrição e a responsividade da interface.

## ⚡ Perfis de Velocidade Disponíveis

### 1. 🏃‍♂️ ULTRA_FAST (1-2 segundos)
- **Finalização:** ~1-2 segundos após parar de falar
- **Uso:** Comandos rápidos, respostas sim/não, interações rápidas
- **Precisão:** Boa para frases curtas
- **Configuração:**
  ```javascript
  {
    model: 'latest_short',
    useEnhanced: true,
    maxAlternatives: 1,
    enableWordTimeOffsets: true,
    enableWordConfidence: true,
    speechContexts: [
      {
        phrases: ['sim', 'não', 'ok', 'pronto', 'finalizar'],
        boost: 25.0,
      }
    ],
  }
  ```

### 2. 🚀 FAST (2-3 segundos)
- **Finalização:** ~2-3 segundos após parar de falar
- **Uso:** Diálogos curtos, perguntas e respostas
- **Precisão:** Balanceada para frases médias
- **Configuração:**
  ```javascript
  {
    model: 'latest_short',
    useEnhanced: false,
    maxAlternatives: 2,
    enableAutomaticPunctuation: true,
    speechContexts: [
      {
        phrases: ['ponto', 'vírgula', 'parágrafo'],
        boost: 20.0,
      }
    ],
  }
  ```

### 3. ⚖️ BALANCED (3-5 segundos) - PADRÃO ATUAL
- **Finalização:** ~3-5 segundos após parar de falar
- **Uso:** Conversas normais, ditado geral
- **Precisão:** Equilibrada para uso geral
- **Configuração:**
  ```javascript
  {
    model: 'latest_long',
    useEnhanced: true,
    maxAlternatives: 3,
    enableAutomaticPunctuation: true,
    enableWordConfidence: true,
  }
  ```

### 4. 🎯 PRECISE (5-8 segundos)
- **Finalização:** ~5-8 segundos após parar de falar
- **Uso:** Transcrição de documentos, textos longos
- **Precisão:** Máxima precisão
- **Configuração:**
  ```javascript
  {
    model: 'latest_long',
    useEnhanced: true,
    maxAlternatives: 5,
    enableAutomaticPunctuation: true,
    enableWordConfidence: true,
    enableWordTimeOffsets: true,
  }
  ```

## 🛠️ Como Usar

### Opção 1: Scripts NPM
```bash
# Ultra rápido (1-2s)
npm run speech-server-ultra-fast

# Rápido (2-3s)
npm run speech-server-fast

# Balanceado (3-5s) - padrão
npm run speech-server-balanced

# Preciso (5-8s)
npm run speech-server-precise
```

### Opção 2: Modificar Servidor Atual
Edite o arquivo `server/speech-server.js` e substitua a configuração:

```javascript
// Configuração atual
const audioConfig = {
  encoding: 'LINEAR16',
  sampleRateHertz: 16000,
  languageCode: 'pt-BR',
  enableAutomaticPunctuation: true,
  model: 'latest_long',
};

// Para ULTRA_FAST, substitua por:
const audioConfig = {
  encoding: 'LINEAR16',
  sampleRateHertz: 16000,
  languageCode: 'pt-BR',
  model: 'latest_short',        // ← Modelo mais rápido
  useEnhanced: true,
  maxAlternatives: 1,           // ← Menos alternativas
  enableWordTimeOffsets: true,
  enableWordConfidence: true,
  speechContexts: [             // ← Palavras que aceleram
    {
      phrases: ['sim', 'não', 'ok', 'pronto', 'finalizar'],
      boost: 25.0,
    }
  ],
};
```

## 📊 Comparação de Configurações

| Parâmetro | ULTRA_FAST | FAST | BALANCED | PRECISE |
|-----------|------------|------|----------|---------|
| **Modelo** | `latest_short` | `latest_short` | `latest_long` | `latest_long` |
| **Finalização** | 1-2s | 2-3s | 3-5s | 5-8s |
| **Precisão** | ⭐⭐⭐ | ⭐⭐⭐⭐ | ⭐⭐⭐⭐⭐ | ⭐⭐⭐⭐⭐ |
| **Velocidade** | ⭐⭐⭐⭐⭐ | ⭐⭐⭐⭐ | ⭐⭐⭐ | ⭐⭐ |
| **Uso de CPU** | Baixo | Médio | Médio | Alto |
| **Melhor para** | Comandos | Perguntas | Conversa | Documentos |

## 🎯 Técnicas para Acelerar Finalização

### 1. Speech Contexts (Contextos de Fala)
Adicione palavras que você espera ouvir com frequência:

```javascript
speechContexts: [
  {
    phrases: ['sim', 'não', 'ok', 'obrigado', 'por favor'],
    boost: 20.0, // Aumenta probabilidade
  },
  {
    phrases: ['ponto', 'vírgula', 'parágrafo', 'enter'],
    boost: 15.0, // Palavras que forçam finalização
  }
]
```

### 2. Reduzir Alternativas
Menos alternativas = processamento mais rápido:

```javascript
maxAlternatives: 1, // Mais rápido
// vs
maxAlternatives: 5, // Mais lento, mas mais preciso
```

### 3. Usar Modelo Otimizado
```javascript
model: 'latest_short',  // Otimizado para velocidade
useEnhanced: true,      // Usar versão melhorada
```

### 4. Configurar Word-Level Features
```javascript
enableWordTimeOffsets: true,  // Timestamps por palavra
enableWordConfidence: true,   // Confiança por palavra
```

## 🔧 Configuração Personalizada

Você pode criar sua própria configuração combinando diferentes opções:

```javascript
const customConfig = {
  model: 'latest_short',              // Velocidade
  useEnhanced: true,                  // Qualidade
  maxAlternatives: 2,                 // Equilíbrio
  enableAutomaticPunctuation: true,   // Pontuação automática
  enableWordConfidence: true,         // Confiança
  speechContexts: [                   // Contextos específicos
    {
      phrases: ['suas', 'palavras', 'específicas'],
      boost: 20.0,
    }
  ],
};
```

## 🏃‍♂️ Teste Prático

Para testar diferentes velocidades:

1. **Inicie o servidor com perfil desejado:**
   ```bash
   npm run speech-server-ultra-fast
   ```

2. **Acesse a interface:**
   ```
   http://localhost:3003/coach/capture/google-cloud
   ```

3. **Fale frases curtas e observe:**
   - Tempo para texto ficar em modo normal
   - Precisão da transcrição
   - Responsividade da interface

## 📈 Monitoramento

O servidor avançado inclui estatísticas:
- Contagem de resultados interim
- Contagem de resultados finais
- Tempo médio de finalização
- Confiança por resultado

## 🤝 Recomendações

- **Para comandos de voz:** Use `ULTRA_FAST`
- **Para perguntas e respostas:** Use `FAST`
- **Para conversas normais:** Use `BALANCED` (padrão)
- **Para ditado de documentos:** Use `PRECISE`

## 🔄 Alternando Durante Uso

Você pode criar uma interface que permita alternar entre perfis dinamicamente enviando uma mensagem especial via WebSocket:

```javascript
ws.send(JSON.stringify({
  type: 'change_profile',
  profile: 'ULTRA_FAST'
}));
```

Esta funcionalidade pode ser implementada como uma extensão futura do sistema. 