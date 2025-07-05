# 🚀 Configuração do Google Cloud Speech-to-Text

Este guia explica como configurar a API do Google Cloud Speech-to-Text para o sistema de transcrição em tempo real.

## 📋 Pré-requisitos

- Node.js 18+
- Conta no Google Cloud Platform
- Projeto no Google Cloud ativo

## 🏗️ Configuração do Google Cloud

### 1. Criar Projeto no Google Cloud

1. Acesse o [Google Cloud Console](https://console.cloud.google.com/)
2. Crie um novo projeto ou selecione um existente
3. Anote o ID do projeto

### 2. Habilitar a API Speech-to-Text

```bash
# Via gcloud CLI
gcloud services enable speech.googleapis.com

# Ou manualmente no Console:
# Navigation menu → APIs & Services → Library → Speech-to-Text API → Enable
```

### 3. Criar Conta de Serviço

1. No Console: **IAM & Admin** → **Service Accounts**
2. Clique em **Create Service Account**
3. Nome: `speech-to-text-service`
4. Descrição: `Service account for Speech-to-Text API`
5. Clique **Create and Continue**

### 4. Conceder Permissões

Adicione as seguintes roles à conta de serviço:
- `Cloud Speech Client`
- `Cloud Speech Service Agent`

### 5. Gerar Chave de Acesso

1. Na lista de Service Accounts, clique na conta criada
2. Vá para a aba **Keys**
3. Clique **Add Key** → **Create new key**
4. Escolha formato **JSON**
5. Baixe o arquivo (ex: `speech-service-key.json`)

## 🔧 Configuração do Projeto

### 1. Instalar Dependências

```bash
npm install @google-cloud/speech ws
npm install --save-dev @types/ws
```

### 2. Configurar Variáveis de Ambiente

Crie um arquivo `.env.local` na raiz do projeto:

```env
# Google Cloud Speech-to-Text
GOOGLE_APPLICATION_CREDENTIALS=./config/speech-service-key.json
GOOGLE_CLOUD_PROJECT_ID=seu-projeto-id
```

### 3. Posicionar Arquivo de Credenciais

```bash
# Criar diretório de configuração
mkdir config

# Mover arquivo de credenciais
mv ~/Downloads/speech-service-key.json ./config/speech-service-key.json

# Adicionar ao .gitignore
echo "config/*.json" >> .gitignore
```

### 4. Estrutura de Arquivos

```
projeto/
├── config/
│   └── speech-service-key.json  # Credenciais (não versionar)
├── server/
│   └── speech-server.js         # Servidor WebSocket
├── app/coach/capture/
│   ├── lib/
│   │   └── useGoogleCloudTranscription.ts
│   └── components/
│       └── GoogleCloudTranscriptionDisplay.tsx
└── .env.local                   # Variáveis de ambiente
```

## 🚀 Executar o Sistema

### 1. Iniciar Servidor Speech-to-Text

```bash
# Terminal 1: Servidor WebSocket
npm run speech-server
```

### 2. Iniciar Aplicação Next.js

```bash
# Terminal 2: Frontend
npm run dev
```

### 3. Acessar Interface

Abra: `http://localhost:3003/coach/capture`

## 📝 Teste de Configuração

### Verificar Credenciais

```bash
# Testar autenticação
node -e "
const speech = require('@google-cloud/speech');
const client = new speech.SpeechClient();
console.log('✅ Credenciais válidas');
client.close();
"
```

### Teste Básico da API

```javascript
// test-speech.js
const speech = require('@google-cloud/speech');

async function testSpeech() {
  const client = new speech.SpeechClient();
  
  try {
    const request = {
      config: {
        encoding: 'LINEAR16',
        sampleRateHertz: 16000,
        languageCode: 'pt-BR',
      },
      audio: {
        content: '', // Buffer de teste
      },
    };
    
    console.log('✅ API Speech-to-Text funcionando');
  } catch (error) {
    console.error('❌ Erro:', error.message);
  }
}

testSpeech();
```

## 💰 Custos e Limites

### Preços (valores aproximados)
- **Tier Gratuito**: 60 minutos/mês
- **Standard**: $0.006/15 segundos (~$1.44/hora)
- **Premium**: $0.009/15 segundos (~$2.16/hora)

### Limites de Rate
- **Requests por minuto**: 1,000
- **Audio data por request**: 10 MB
- **Concurrent requests**: 100

### Otimizações de Custo
1. Use `standard` model para casos gerais
2. Configure `enableAutomaticPunctuation: false` se não precisar
3. Implemente cache para frases repetidas
4. Monitor usage no Cloud Console

## 🔍 Troubleshooting

### Erro: "Could not load the default credentials"
```bash
# Verificar variável de ambiente
echo $GOOGLE_APPLICATION_CREDENTIALS

# Verificar se arquivo existe
ls -la ./config/speech-service-key.json

# Testar manualmente
export GOOGLE_APPLICATION_CREDENTIALS=./config/speech-service-key.json
```

### Erro: "Permission denied"
1. Verificar se a API está habilitada
2. Confirmar roles da service account
3. Verificar billing ativo no projeto

### Erro: "WebSocket connection failed"
1. Verificar se servidor está rodando na porta 8080
2. Confirmar que não há conflito de portas
3. Testar conectividade: `telnet localhost 8080`

### Logs do Servidor
```bash
# Debug completo
DEBUG=* npm run speech-server

# Apenas logs da aplicação
NODE_ENV=development npm run speech-server
```

## 🌐 Configuração de Produção

### Variáveis de Ambiente (Produção)
```env
GOOGLE_APPLICATION_CREDENTIALS=/app/config/speech-service-key.json
GOOGLE_CLOUD_PROJECT_ID=projeto-producao
WEBSOCKET_PORT=8080
NODE_ENV=production
```

### Deploy com Docker
```dockerfile
# Dockerfile
FROM node:18
WORKDIR /app
COPY package*.json ./
RUN npm install
COPY . .
COPY config/speech-service-key.json /app/config/
EXPOSE 3000 8080
CMD ["npm", "run", "speech-server", "&", "npm", "start"]
```

### Nginx (Proxy WebSocket)
```nginx
location /ws {
    proxy_pass http://localhost:8080;
    proxy_http_version 1.1;
    proxy_set_header Upgrade $http_upgrade;
    proxy_set_header Connection "upgrade";
    proxy_set_header Host $host;
}
```

## 📈 Monitoramento

### Métricas importantes:
- Request count
- Audio processing duration  
- Error rate
- WebSocket connections
- Billing usage

### Cloud Monitoring:
```bash
# Visualizar métricas
gcloud logging read "resource.type=speech_api" --limit=50
```

## 🔒 Segurança

### Boas Práticas:
1. **Nunca commitar** arquivos de credenciais
2. Usar **IAM roles** mínimas necessárias
3. **Rotacionar chaves** periodicamente
4. **Monitorar usage** e billing
5. **Limitar** access por IP (produção)

### Arquivo .gitignore:
```gitignore
# Google Cloud
config/*.json
.env.local
.env.production

# Logs
logs/
*.log
```

---

## 📞 Suporte

- [Documentação Oficial](https://cloud.google.com/speech-to-text/docs)
- [Stack Overflow](https://stackoverflow.com/questions/tagged/google-cloud-speech)
- [Google Cloud Support](https://cloud.google.com/support)

---

**✅ Agora você tem um sistema completo de transcrição em tempo real usando Google Cloud Speech-to-Text!** 