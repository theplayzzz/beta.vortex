#!/usr/bin/env node

const http = require('http');

// Servidor HTTP simples que sempre retorna 200
const server = http.createServer((req, res) => {
  console.log('\n=== WEBHOOK REQUEST ===');
  console.log('Method:', req.method);
  console.log('URL:', req.url);
  console.log('Headers:', JSON.stringify(req.headers, null, 2));
  
  let body = '';
  req.on('data', chunk => {
    body += chunk.toString();
  });
  
  req.on('end', () => {
    console.log('Body:', body);
    console.log('Body length:', body.length);
    
    // SEMPRE retorna 200
    res.writeHead(200, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify({ 
      status: 'ok', 
      message: 'Simple webhook received',
      timestamp: new Date().toISOString()
    }));
    
    console.log('Response: 200 OK sent');
    console.log('====================\n');
  });
});

const PORT = 8080;
server.listen(PORT, '0.0.0.0', () => {
  console.log(`🚀 Simple webhook server running on http://0.0.0.0:${PORT}`);
  console.log(`📡 Ready to receive Daily.co webhook verification`);
  console.log(`🔗 Use: http://5.161.64.137:${PORT}/webhook`);
  console.log('');
});

// Handle SIGINT gracefully
process.on('SIGINT', () => {
  console.log('\n📴 Shutting down webhook server...');
  server.close(() => {
    console.log('✅ Server closed');
    process.exit(0);
  });
});