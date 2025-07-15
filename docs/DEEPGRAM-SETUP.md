# 🚀 Guia de Configuração do Deepgram

## 📋 Pré-requisitos

Antes de iniciar a migração para Deepgram, você precisa:

1. ✅ Node.js 18+ instalado
2. ✅ Projeto Next.js funcionando
3. ✅ Conta no Deepgram (gratuita)
4. ✅ Sistema atual Google Cloud funcionando (para comparação)

## 🔑 Passo 1: Criar Conta no Deepgram

### **1.1 Registro**
1. Acesse [deepgram.com](https://console.deepgram.com/signup)
2. Crie uma conta gratuita
3. Confirme seu email
4. Faça login no console

### **1.2 Obter API Key**
1. No console Deepgram, acesse **"API Keys"**
2. Clique em **"Create a New API Key"**
3. Nome sugerido: `projeto-transcricao`
4. Copie a API Key (formato: `Token XXXXXXXXXX`)

⚠️ **Importante**: Guarde a API Key com segurança. Ela não será mostrada novamente.

## 🛠️ Passo 2: Instalação de Dependências

### **2.1 Instalar Deepgram SDK**
```bash
npm install @deepgram/sdk
```

### **2.2 Opcional: Manter Google Cloud para Comparação**
```bash
# Manter Google Cloud temporariamente
# npm uninstall @google-cloud/speech  # NÃO executar ainda
```

## ⚙️ Passo 3: Configuração de Variáveis

### **3.1 Atualizar .env.local**
```bash
# Adicionar no final do arquivo .env.local

# Deepgram Configuration
DEEPGRAM_API_KEY=<SUA_CHAVE_DEEPGRAM_AQUI>
```

### **3.2 Exemplo de .env.local Completo**
```bash
# Existentes (Google Cloud)
GOOGLE_APPLICATION_CREDENTIALS=./config/speech-service-key.json
GOOGLE_CLOUD_PROJECT_ID=seu-projeto-google

# Novo (Deepgram)
DEEPGRAM_API_KEY=<SUA_CHAVE_DEEPGRAM_AQUI>
```

## 📁 Passo 4: Estrutura de Arquivos

### **4.1 Arquivos a serem criados:**
```
server/
├── speech-server.js                # Existente (Google Cloud)
├── deepgram-server-updated.js      # 🆕 Novo servidor Deepgram
└── package.json                    # Atualizar dependências

app/coach/capture/
├── lib/
│   ├── useGoogleCloudTranscription.ts  # Existente
│   └── useDeepgramTranscription.ts     # 🆕 Novo hook
├── google-cloud/
│   └── page.tsx              # Existente
├── deepgram/
│   └── page.tsx              # 🆕 Nova página demo
└── ...
```

### **4.2 Scripts no package.json**
```json
{
  "scripts": {
    "dev": "next dev",
    "speech-google": "node server/speech-server.js",
    "speech-deepgram": "node server/deepgram-server-updated.js"
  }
}
```

## 🚀 Passo 5: Iniciar Servidor Deepgram

### **5.1 Terminal 1: Servidor Deepgram**
```bash
npm run speech-deepgram
```

**Saída esperada:**
```
✅ Deepgram API Key configurada
✅ Cliente Deepgram criado com sucesso
🎤 Servidor Deepgram Speech-to-Text iniciado na porta 8080
```

### **5.2 Terminal 2: Frontend Next.js**
```bash
npm run dev
```

## 🧪 Passo 6: Testar Integração

### **6.1 Acesse a Interface Deepgram**
```
http://localhost:3003/coach/capture/deepgram
```

### **6.2 Verificar Status**
- **🟢 Conectado**: Se aparecer verde, configuração está correta
- **🔴 Desconectado**: Verificar logs do servidor

### **6.3 Teste Básico**
1. Clique **"▶️ Iniciar Transcrição"**
2. Permita acesso ao **microfone**
3. Permita **compartilhamento de tela**
4. **Fale normalmente** → Deve aparecer transcrição

## 📊 Passo 7: Comparação com Google Cloud

### **7.1 Teste Lado a Lado**

**Terminal 3: Google Cloud (para comparação)**
```bash
npm run speech-google
```

**Acessar ambas as interfaces:**
- Google Cloud: `http://localhost:3003/coach/capture/google-cloud`
- Deepgram: `http://localhost:3003/coach/capture/deepgram`

### **7.2 Métricas a Comparar**
- **Latência**: Tempo entre fala e transcrição
- **Precisão**: Qualidade da transcrição
- **Estabilidade**: Frequência de erros/reconexões
- **Performance**: Uso de CPU/memória

## 🔧 Passo 8: Configurações Avançadas

### **8.1 Modelos Disponíveis**

**Nova-2 (Padrão - Recomendado)**
```javascript
model: 'nova-2'        // Mais rápido, otimizado para conversação
```

**Enhanced (Máxima Precisão)**
```javascript
model: 'enhanced'      // Mais preciso, para documentos
```

**Base (Balanceado)**
```javascript
model: 'base'          // Equilibrio entre velocidade e precisão
```

### **8.2 Configurações de Idioma**
```javascript
language: 'pt-BR'      // Português brasileiro (padrão)
language: 'en-US'      // Inglês americano
language: 'es'         // Espanhol
// Mais idiomas disponíveis na documentação
```

### **8.3 Configurações de Performance**
```javascript
// server/deepgram-server-updated.js
const DEEPGRAM_CONFIG = {
  language: 'pt-BR',
  model: 'nova-2',
  smart_format: true,          // Formatação automática
  interim_results: true,       // Resultados parciais
  endpointing: 300,            // Tempo para finalizar (ms)
  punctuate: true,             // Pontuação automática
  diarize: false,              // Separação de falantes
  profanity_filter: false,     // Filtro de palavrões
  // ... outras configurações
};
```

## 🛡️ Passo 9: Solução de Problemas

### **9.1 Erros Comuns**

**❌ "DEEPGRAM_API_KEY não encontrada"**
```bash
# Solução: Verificar .env.local
echo $DEEPGRAM_API_KEY  # Deve mostrar a key
```

**❌ "Erro ao criar cliente Deepgram"**
```bash
# Verificar formato da API Key
# Deve começar com "Token "
DEEPGRAM_API_KEY=Token <SUA_CHAVE_DEEPGRAM_AQUI>
```

**❌ "Conexão WebSocket falhou"**
```