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