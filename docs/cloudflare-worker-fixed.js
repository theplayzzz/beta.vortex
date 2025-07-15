// Cloudflare Worker - Versão Corrigida para Deepgram WebSocket
export default {
  async fetch(request, env, ctx) {
    const url = new URL(request.url);
    
    // Log da requisição
    console.log(`[${new Date().toISOString()}] ${request.method} ${url.pathname}`);
    
    // Verificar se é requisição para Deepgram
    if (url.pathname.startsWith('/v1/listen')) {
      return handleDeepgramWebSocket(request);
    }
    
    // Outras requisições da API Deepgram
    return handleDeepgramAPI(request);
  }
};

async function handleDeepgramWebSocket(request) {
  const url = new URL(request.url);
  
  // Construir URL do Deepgram
  const deepgramUrl = `wss://api.deepgram.com${url.pathname}${url.search}`;
  
  console.log(`🔄 Proxy WebSocket: ${deepgramUrl}`);
  
  // Verificar se é upgrade para WebSocket
  if (request.headers.get('Upgrade') !== 'websocket') {
    return new Response('Expected WebSocket upgrade', { status: 400 });
  }
  
  // Criar par de WebSockets
  const webSocketPair = new WebSocketPair();
  const [client, server] = Object.values(webSocketPair);
  
  // Aceitar conexão do cliente
  server.accept();
  
  // Conectar ao Deepgram
  try {
    const deepgramHeaders = new Headers();
    
    // Copiar headers importantes
    const authHeader = request.headers.get('Authorization');
    if (authHeader) {
      deepgramHeaders.set('Authorization', authHeader);
    }
    
    // Headers adicionais necessários
    deepgramHeaders.set('User-Agent', 'Cloudflare-Worker-Proxy/1.0');
    deepgramHeaders.set('Origin', 'https://deepgram-proxy.agencia-5e2.workers.dev');
    
    // Conectar ao Deepgram WebSocket
    const deepgramWS = new WebSocket(deepgramUrl, {
      headers: deepgramHeaders
    });
    
    // Relay mensagens: Cliente -> Deepgram
    server.addEventListener('message', event => {
      if (deepgramWS.readyState === WebSocket.OPEN) {
        deepgramWS.send(event.data);
      }
    });
    
    // Relay mensagens: Deepgram -> Cliente
    deepgramWS.addEventListener('message', event => {
      if (server.readyState === WebSocket.OPEN) {
        server.send(event.data);
      }
    });
    
    // Gerenciar fechamento de conexões
    server.addEventListener('close', () => {
      if (deepgramWS.readyState === WebSocket.OPEN) {
        deepgramWS.close();
      }
    });
    
    deepgramWS.addEventListener('close', () => {
      if (server.readyState === WebSocket.OPEN) {
        server.close();
      }
    });
    
    // Gerenciar erros
    deepgramWS.addEventListener('error', (error) => {
      console.error('Erro Deepgram WebSocket:', error);
      if (server.readyState === WebSocket.OPEN) {
        server.close(1011, 'Deepgram connection error');
      }
    });
    
    server.addEventListener('error', (error) => {
      console.error('Erro Client WebSocket:', error);
      if (deepgramWS.readyState === WebSocket.OPEN) {
        deepgramWS.close();
      }
    });
    
    return new Response(null, {
      status: 101,
      webSocket: client,
    });
    
  } catch (error) {
    console.error('Erro ao conectar WebSocket:', error);
    return new Response('WebSocket connection failed', { status: 500 });
  }
}

async function handleDeepgramAPI(request) {
  const url = new URL(request.url);
  
  // Construir URL do Deepgram
  const deepgramUrl = `https://api.deepgram.com${url.pathname}${url.search}`;
  
  console.log(`🔄 Proxy API: ${deepgramUrl}`);
  
  // Copiar headers
  const headers = new Headers();
  for (const [key, value] of request.headers.entries()) {
    // Não copiar headers específicos do Cloudflare
    if (!key.startsWith('cf-') && key !== 'host') {
      headers.set(key, value);
    }
  }
  
  // Adicionar headers necessários
  headers.set('Host', 'api.deepgram.com');
  headers.set('User-Agent', 'Cloudflare-Worker-Proxy/1.0');
  
  try {
    // Fazer requisição para Deepgram
    const response = await fetch(deepgramUrl, {
      method: request.method,
      headers: headers,
      body: request.body,
    });
    
    // Copiar response headers
    const responseHeaders = new Headers();
    for (const [key, value] of response.headers.entries()) {
      responseHeaders.set(key, value);
    }
    
    // Adicionar CORS headers
    responseHeaders.set('Access-Control-Allow-Origin', '*');
    responseHeaders.set('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
    responseHeaders.set('Access-Control-Allow-Headers', 'Content-Type, Authorization');
    
    return new Response(response.body, {
      status: response.status,
      statusText: response.statusText,
      headers: responseHeaders,
    });
    
  } catch (error) {
    console.error('Erro na requisição API:', error);
    return new Response('API request failed', { status: 500 });
  }
} 