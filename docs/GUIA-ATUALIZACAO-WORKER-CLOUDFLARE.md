# 🔧 Guia de Atualização do Worker Cloudflare

## 🚨 Problema Identificado

O erro 500 no WebSocket ocorre porque o Worker atual tem problemas na configuração WebSocket. A versão corrigida resolve:

- ✅ Validação adequada de headers WebSocket
- ✅ Configuração correta do WebSocketPair
- ✅ Tratamento assíncrono da conexão Deepgram
- ✅ Melhor tratamento de erros
- ✅ CORS adequado para WebSocket

## 📋 Passos para Atualizar

### 1. Acessar o Dashboard Cloudflare
1. Acesse: https://dash.cloudflare.com
2. Faça login na sua conta
3. Vá para **Workers & Pages**

### 2. Localizar o Worker
1. Encontre o worker `deepgram-proxy`
2. Clique em **Edit code**

### 3. Substituir o Código
1. **Selecione TODO o código atual** (Ctrl+A)
2. **Delete tudo**
3. **Cole o código corrigido** (disponível em `docs/cloudflare-worker-websocket-fixed.js`)

### 4. Código Corrigido para Colar

```javascript
// Cloudflare Worker - Versão CORRIGIDA para WebSocket Deepgram
// Esta versão resolve o erro 500 que estava ocorrendo

export default {
  async fetch(request, env, ctx) {
    const url = new URL(request.url);
    
    // Log da requisição
    console.log(`[${new Date().toISOString()}] ${request.method} ${url.pathname}`);
    
    // Adicionar CORS para todas as requisições
    if (request.method === 'OPTIONS') {
      return new Response(null, {
        status: 200,
        headers: {
          'Access-Control-Allow-Origin': '*',
          'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
          'Access-Control-Allow-Headers': 'Content-Type, Authorization, Upgrade, Connection, Sec-WebSocket-Key, Sec-WebSocket-Version, Sec-WebSocket-Protocol',
        }
      });
    }
    
    // Verificar se é requisição WebSocket
    const upgradeHeader = request.headers.get('Upgrade');
    if (upgradeHeader && upgradeHeader.toLowerCase() === 'websocket') {
      return handleWebSocketUpgrade(request);
    }
    
    // Requisições HTTP normais
    return handleHTTPRequest(request);
  }
};

async function handleWebSocketUpgrade(request) {
  const url = new URL(request.url);
  
  // Construir URL WebSocket do Deepgram
  const deepgramUrl = `wss://api.deepgram.com${url.pathname}${url.search}`;
  
  console.log(`🔌 WebSocket upgrade para: ${deepgramUrl}`);
  
  // Verificar headers necessários para WebSocket
  const connectionHeader = request.headers.get('Connection');
  const wsKeyHeader = request.headers.get('Sec-WebSocket-Key');
  
  if (!connectionHeader || !connectionHeader.toLowerCase().includes('upgrade')) {
    return new Response('Bad Request: Missing Connection header', { status: 400 });
  }
  
  if (!wsKeyHeader) {
    return new Response('Bad Request: Missing Sec-WebSocket-Key', { status: 400 });
  }
  
  // Criar par de WebSockets
  const webSocketPair = new WebSocketPair();
  const [client, server] = Object.values(webSocketPair);
  
  // Configurar conexão com o servidor
  server.accept();
  
  // Conectar ao Deepgram em uma Promise para evitar bloqueio
  connectToDeepgram(server, deepgramUrl, request.headers);
  
  // Retornar resposta WebSocket
  return new Response(null, {
    status: 101,
    webSocket: client,
    headers: {
      'Access-Control-Allow-Origin': '*',
    }
  });
}

async function connectToDeepgram(clientWS, deepgramUrl, requestHeaders) {
  try {
    // Preparar headers para Deepgram
    const authHeader = requestHeaders.get('Authorization');
    if (!authHeader) {
      console.error('❌ Authorization header não encontrado');
      clientWS.close(1008, 'Authorization required');
      return;
    }
    
    console.log(`🔗 Conectando ao Deepgram: ${deepgramUrl}`);
    
    // Conectar ao Deepgram WebSocket
    const deepgramWS = new WebSocket(deepgramUrl, [], {
      headers: {
        'Authorization': authHeader,
        'User-Agent': 'Cloudflare-Worker-Proxy/1.0'
      }
    });
    
    // Configurar eventos do Deepgram WebSocket
    deepgramWS.addEventListener('open', () => {
      console.log('✅ Conectado ao Deepgram');
    });
    
    deepgramWS.addEventListener('message', (event) => {
      try {
        if (clientWS.readyState === WebSocket.OPEN) {
          clientWS.send(event.data);
        }
      } catch (error) {
        console.error('Erro enviando para cliente:', error);
      }
    });
    
    deepgramWS.addEventListener('close', (event) => {
      console.log(`🔌 Deepgram fechou conexão: ${event.code} ${event.reason}`);
      if (clientWS.readyState === WebSocket.OPEN) {
        clientWS.close(event.code, event.reason);
      }
    });
    
    deepgramWS.addEventListener('error', (error) => {
      console.error('❌ Erro Deepgram:', error);
      if (clientWS.readyState === WebSocket.OPEN) {
        clientWS.close(1011, 'Deepgram error');
      }
    });
    
    // Configurar eventos do cliente WebSocket
    clientWS.addEventListener('message', (event) => {
      try {
        if (deepgramWS.readyState === WebSocket.OPEN) {
          deepgramWS.send(event.data);
        }
      } catch (error) {
        console.error('Erro enviando para Deepgram:', error);
      }
    });
    
    clientWS.addEventListener('close', (event) => {
      console.log(`🔌 Cliente fechou conexão: ${event.code} ${event.reason}`);
      if (deepgramWS.readyState === WebSocket.OPEN) {
        deepgramWS.close();
      }
    });
    
    clientWS.addEventListener('error', (error) => {
      console.error('❌ Erro cliente:', error);
      if (deepgramWS.readyState === WebSocket.OPEN) {
        deepgramWS.close();
      }
    });
    
  } catch (error) {
    console.error('❌ Erro conectando ao Deepgram:', error);
    if (clientWS.readyState === WebSocket.OPEN) {
      clientWS.close(1011, 'Connection failed');
    }
  }
}

async function handleHTTPRequest(request) {
  const url = new URL(request.url);
  
  // Construir URL HTTP do Deepgram
  const deepgramUrl = `https://api.deepgram.com${url.pathname}${url.search}`;
  
  console.log(`🌐 HTTP request para: ${deepgramUrl}`);
  
  // Preparar headers
  const headers = new Headers();
  
  // Copiar headers importantes
  for (const [key, value] of request.headers.entries()) {
    if (!key.startsWith('cf-') && 
        !key.startsWith('x-forwarded-') && 
        key !== 'host' && 
        key !== 'origin') {
      headers.set(key, value);
    }
  }
  
  // Definir host correto
  headers.set('Host', 'api.deepgram.com');
  headers.set('User-Agent', 'Cloudflare-Worker-Proxy/1.0');
  
  try {
    // Fazer requisição para Deepgram
    const response = await fetch(deepgramUrl, {
      method: request.method,
      headers: headers,
      body: request.body,
    });
    
    // Preparar headers de resposta
    const responseHeaders = new Headers();
    
    // Copiar headers da resposta
    for (const [key, value] of response.headers.entries()) {
      responseHeaders.set(key, value);
    }
    
    // Adicionar CORS
    responseHeaders.set('Access-Control-Allow-Origin', '*');
    responseHeaders.set('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
    responseHeaders.set('Access-Control-Allow-Headers', 'Content-Type, Authorization');
    
    return new Response(response.body, {
      status: response.status,
      statusText: response.statusText,
      headers: responseHeaders,
    });
    
  } catch (error) {
    console.error('❌ Erro HTTP request:', error);
    
    return new Response(JSON.stringify({
      error: 'Proxy request failed',
      message: error.message
    }), {
      status: 500,
      headers: {
        'Content-Type': 'application/json',
        'Access-Control-Allow-Origin': '*',
      }
    });
  }
}
```

### 5. Salvar e Deploy
1. Clique em **Save and Deploy**
2. Aguarde a confirmação de deploy
3. O Worker será atualizado automaticamente

## 🧪 Teste Após Atualização

Após atualizar o Worker, teste novamente:

```bash
# Teste HTTP (deve funcionar)
curl -H "Authorization: Token SUA_API_KEY" https://deepgram-proxy.agencia-5e2.workers.dev/v1/listen

# Teste WebSocket (deve conectar sem erro 500)
node test-websocket-cloudflare.js
```

## ✅ Principais Correções

### 1. **Validação WebSocket Adequada**
- Verifica headers `Upgrade` e `Connection`
- Valida `Sec-WebSocket-Key`

### 2. **Configuração Assíncrona**
- Conexão Deepgram não bloqueia resposta
- Evita timeout na inicialização

### 3. **Tratamento de Erros Robusto**
- Logs detalhados para debug
- Cleanup adequado de conexões

### 4. **CORS Completo**
- Headers WebSocket incluídos
- Suporte a requisições OPTIONS

## 🎯 Resultado Esperado

Após a atualização:
- ✅ HTTP: Status 400 (esperado para GET simples)
- ✅ WebSocket: Conexão estabelecida sem erro 500
- ✅ Logs no Cloudflare mostrando conexões

## 📞 Próximos Passos

1. **Atualizar Worker** (seguir este guia)
2. **Testar conectividade** WebSocket
3. **Verificar servidor** Deepgram local
4. **Testar aplicação** completa 