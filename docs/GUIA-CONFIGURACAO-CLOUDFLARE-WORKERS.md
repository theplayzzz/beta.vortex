# Guia Completo - Configuração Cloudflare Workers

## 🎯 **OBJETIVO**
Configurar Cloudflare Workers como proxy transparente para contornar o bloqueio de IP da Hetzner na API Deepgram.

## 📋 **PRÉ-REQUISITOS**
- ✅ Conta no Cloudflare (gratuita)
- ✅ Domínio (pode usar subdomínio gratuito do Cloudflare)
- ✅ 30 minutos de tempo

## 🚀 **PASSO 1: CRIAR CONTA CLOUDFLARE**

### **1.1 Acessar Cloudflare:**
```
https://dash.cloudflare.com/sign-up
```

### **1.2 Criar conta:**
- Email: seu-email@dominio.com
- Senha: (criar senha forte)
- Confirmar email

### **1.3 Login:**
```
https://dash.cloudflare.com/login
```

## 🌐 **PASSO 2: CONFIGURAR DOMÍNIO**

### **Opção A: Usar domínio existente**
1. **Adicionar site** no painel Cloudflare
2. **Inserir domínio:** `seudominio.com`
3. **Escolher plano:** Free (gratuito)
4. **Seguir instruções** para alterar nameservers

### **Opção B: Usar subdomínio gratuito (workers.dev)**
1. **Pular configuração de domínio** por enquanto
2. **Usar subdomínio automático:** `seu-worker.workers.dev`
3. **Mais simples para teste**

## ⚙️ **PASSO 3: CRIAR CLOUDFLARE WORKER**

### **3.1 Acessar Workers:**
1. **Dashboard Cloudflare** → **Workers & Pages**
2. **Clicar em "Create"**
3. **Selecionar "Create Worker"**

### **3.2 Configurar Worker:**
1. **Nome:** `deepgram-proxy`
2. **Clicar "Deploy"**
3. **Depois "Edit code"**

### **3.3 Código do Worker:**
```javascript
// Cloudflare Worker - Proxy para Deepgram
export default {
  async fetch(request, env, ctx) {
    const url = new URL(request.url);
    
    // Log para debug
    console.log('Request URL:', url.toString());
    console.log('Request method:', request.method);
    
    // Verificar se é uma requisição para o proxy
    if (url.pathname.startsWith('/v1/listen') || 
        url.pathname.startsWith('/v1/projects') ||
        url.pathname === '/') {
      
      // Construir URL da Deepgram
      const deepgramUrl = `https://api.deepgram.com${url.pathname}${url.search}`;
      console.log('Proxying to:', deepgramUrl);
      
      // Criar nova requisição
      const modifiedRequest = new Request(deepgramUrl, {
        method: request.method,
        headers: request.headers,
        body: request.body
      });
      
      try {
        // Fazer chamada para Deepgram
        const response = await fetch(modifiedRequest);
        
        // Criar resposta com headers CORS
        const modifiedResponse = new Response(response.body, {
          status: response.status,
          statusText: response.statusText,
          headers: {
            ...response.headers,
            'Access-Control-Allow-Origin': '*',
            'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
            'Access-Control-Allow-Headers': 'Content-Type, Authorization',
          }
        });
        
        console.log('Response status:', response.status);
        return modifiedResponse;
        
      } catch (error) {
        console.error('Proxy error:', error);
        return new Response(JSON.stringify({ 
          error: 'Proxy error', 
          message: error.message 
        }), {
          status: 500,
          headers: { 'Content-Type': 'application/json' }
        });
      }
    }
    
    // Para outras rotas, retornar informações do proxy
    return new Response(JSON.stringify({
      message: 'Deepgram Proxy Worker',
      usage: 'Use /v1/listen ou /v1/projects endpoints',
      timestamp: new Date().toISOString()
    }), {
      headers: { 'Content-Type': 'application/json' }
    });
  }
};
```

### **3.4 Salvar e Deploy:**
1. **Clicar "Save and Deploy"**
2. **Aguardar deploy** (30 segundos)
3. **Anotar URL:** `https://deepgram-proxy.SEU-USUARIO.workers.dev`

## 🔧 **PASSO 4: CONFIGURAR WEBSOCKET (OPCIONAL)**

### **4.1 Worker com suporte WebSocket:**
```javascript
// Worker com WebSocket para Deepgram
export default {
  async fetch(request, env, ctx) {
    const url = new URL(request.url);
    const upgradeHeader = request.headers.get('Upgrade');
    
    // Verificar se é WebSocket
    if (upgradeHeader === 'websocket') {
      return handleWebSocket(request);
    }
    
    // Continuar com HTTP normal
    return handleHTTP(request);
  }
};

async function handleWebSocket(request) {
  const url = new URL(request.url);
  
  // Reescrever URL para Deepgram
  const deepgramUrl = url.toString().replace(
    url.origin, 
    'wss://api.deepgram.com'
  );
  
  console.log('WebSocket proxy to:', deepgramUrl);
  
  // Criar nova requisição WebSocket
  return fetch(deepgramUrl, {
    method: request.method,
    headers: request.headers,
  });
}

async function handleHTTP(request) {
  // Código HTTP anterior aqui
  const url = new URL(request.url);
  const deepgramUrl = `https://api.deepgram.com${url.pathname}${url.search}`;
  
  return fetch(deepgramUrl, {
    method: request.method,
    headers: request.headers,
    body: request.body
  });
}
```

## 🧪 **PASSO 5: TESTAR CONFIGURAÇÃO**

### **5.1 Teste básico via curl:**
```bash
# Testar se Worker está funcionando
curl https://deepgram-proxy.SEU-USUARIO.workers.dev

# Testar proxy para Deepgram
curl -X GET \
  "https://deepgram-proxy.SEU-USUARIO.workers.dev/v1/projects" \
  -H "Authorization: Token SUA_API_KEY_DEEPGRAM"
```

### **5.2 Teste via browser:**
```
https://deepgram-proxy.SEU-USUARIO.workers.dev
```

### **5.3 Resultado esperado:**
```json
{
  "message": "Deepgram Proxy Worker",
  "usage": "Use /v1/listen ou /v1/projects endpoints",
  "timestamp": "2024-01-01T12:00:00.000Z"
}
```

## 🔄 **PASSO 6: MODIFICAR SERVIDOR HETZNER**

### **6.1 Criar versão proxy do servidor:**
```bash
cd /root/Vortex/precedent
cp server/deepgram-server-updated.js server/deepgram-server-cloudflare.js
```

### **6.2 Modificar configuração:**
```javascript
// No arquivo server/deepgram-server-cloudflare.js
const { createClient } = require('@deepgram/sdk');

// SUBSTITUIR esta linha:
// const deepgram = createClient(deepgramApiKey);

// POR esta configuração:
const deepgram = createClient(deepgramApiKey, {
  global: {
    url: 'https://deepgram-proxy.SEU-USUARIO.workers.dev'
  }
});

// Ou configurar via variável de ambiente
const DEEPGRAM_PROXY_URL = process.env.DEEPGRAM_PROXY_URL || 'https://deepgram-proxy.SEU-USUARIO.workers.dev';

const deepgram = createClient(deepgramApiKey, {
  global: {
    url: DEEPGRAM_PROXY_URL
  }
});
```

### **6.3 Adicionar ao .env.local:**
```bash
echo "DEEPGRAM_PROXY_URL=https://deepgram-proxy.SEU-USUARIO.workers.dev" >> .env.local
```

## 🧪 **PASSO 7: TESTAR INTEGRAÇÃO COMPLETA**

### **7.1 Parar servidor atual:**
```bash
# Encontrar processo
ps aux | grep deepgram

# Parar processo
pkill -f deepgram-server
```

### **7.2 Iniciar servidor com proxy:**
```bash
node server/deepgram-server-cloudflare.js
```

### **7.3 Testar no frontend:**
```
https://localhost:3003/coach/capture/deepgram
```

### **7.4 Verificar logs:**
```bash
# Logs do servidor
tail -f /var/log/deepgram-server.log

# Logs do Cloudflare Worker
# Ver no dashboard: Workers & Pages → deepgram-proxy → Logs
```

## 📊 **PASSO 8: MONITORAMENTO**

### **8.1 Dashboard Cloudflare:**
```
https://dash.cloudflare.com/
Workers & Pages → deepgram-proxy → Metrics
```

### **8.2 Métricas importantes:**
- **Requests:** Número de chamadas
- **Errors:** Taxa de erro
- **Duration:** Latência média
- **CPU Time:** Uso de CPU

### **8.3 Logs em tempo real:**
```
Workers & Pages → deepgram-proxy → Logs → Begin log stream
```

## 💰 **PASSO 9: CONFIGURAR BILLING (SE NECESSÁRIO)**

### **9.1 Limites gratuitos:**
- **100.000 requests/dia** - Gratuito
- **10ms CPU time/request** - Gratuito

### **9.2 Se exceder limites:**
1. **Workers Paid:** $5/mês
2. **10 milhões requests/mês**
3. **50ms CPU time/request**

### **9.3 Configurar billing:**
```
Account → Billing → Workers → Subscribe to Paid
```

## 🔧 **PASSO 10: DOMÍNIO PERSONALIZADO (OPCIONAL)**

### **10.1 Se você tem domínio:**
```
Workers & Pages → deepgram-proxy → Settings → Triggers
Custom Domains → Add Custom Domain
```

### **10.2 Configurar DNS:**
```
Type: CNAME
Name: api
Content: deepgram-proxy.SEU-USUARIO.workers.dev
```

### **10.3 Resultado:**
```
https://api.seudominio.com
```

## 🚨 **TROUBLESHOOTING**

### **Erro comum 1: Worker não encontrado**
```
Error 1101: Worker threw exception
```
**Solução:** Verificar código do Worker, salvar e fazer deploy novamente

### **Erro comum 2: CORS**
```
Access-Control-Allow-Origin error
```
**Solução:** Adicionar headers CORS no Worker (já incluído no código)

### **Erro comum 3: Timeout**
```
Request timeout
```
**Solução:** Verificar se API key está correta e se Deepgram está acessível

### **Erro comum 4: Rate limit**
```
Too many requests
```
**Solução:** Configurar billing pago ou otimizar número de requests

## ✅ **CHECKLIST FINAL**

### **Antes de usar em produção:**
- [ ] Worker criado e funcionando
- [ ] Teste básico com curl funcionando
- [ ] Servidor modificado com proxy URL
- [ ] Teste completo de transcrição funcionando
- [ ] Logs monitorados
- [ ] Billing configurado (se necessário)
- [ ] Domínio personalizado (opcional)

### **URLs importantes:**
- **Worker:** `https://deepgram-proxy.SEU-USUARIO.workers.dev`
- **Dashboard:** `https://dash.cloudflare.com/`
- **Logs:** `Workers & Pages → deepgram-proxy → Logs`

## 🎉 **RESULTADO ESPERADO**

### **Após configuração completa:**
```
✅ Servidor Hetzner → Cloudflare Worker → Deepgram API
✅ Transcrição funcionando normalmente
✅ Latência adicional mínima (~20-50ms)
✅ Custo baixo ou gratuito
✅ Escalabilidade automática
```

---

**🎯 PRÓXIMO PASSO:** Seguir este guia passo a passo e testar cada etapa antes de avançar.

**⏱️ Tempo estimado:** 30-60 minutos para configuração completa

**💡 Dica:** Comece com o Worker básico e teste antes de adicionar funcionalidades avançadas. 