#!/usr/bin/env node

const http = require('http');
const https = require('https');
const fs = require('fs');

// Servidor HTTP simples para debug detalhado
const server = http.createServer((req, res) => {
  console.log('\n🔍 === WEBHOOK DEBUG REQUEST ===');
  console.log('🕐 Timestamp:', new Date().toISOString());
  console.log('📍 Method:', req.method);
  console.log('📍 URL:', req.url);
  console.log('📍 HTTP Version:', req.httpVersion);
  console.log('📍 Remote Address:', req.connection.remoteAddress);
  console.log('📍 User Agent:', req.headers['user-agent']);
  
  console.log('\n📋 Headers:');
  Object.keys(req.headers).forEach(key => {
    console.log(`  ${key}: ${req.headers[key]}`);
  });
  
  let body = '';
  req.on('data', chunk => {
    body += chunk.toString();
  });
  
  req.on('end', () => {
    console.log('\n📄 Body:', body || '(vazio)');
    console.log('📄 Body length:', body.length);
    console.log('📄 Content-Type:', req.headers['content-type'] || '(não informado)');
    
    // Resposta minimalista
    res.writeHead(200, { 
      'Content-Type': 'text/plain',
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
      'Access-Control-Allow-Headers': '*'
    });
    res.end('OK');
    
    console.log('✅ Response: 200 OK enviado');
    console.log('================================\n');
  });
});

const PORT = 8080;
server.listen(PORT, '0.0.0.0', () => {
  console.log(`🚀 Debug webhook server rodando em http://0.0.0.0:${PORT}`);
  console.log(`📡 Pronto para capturar requests do Daily.co`);
  console.log(`🔗 URL externa: http://5.161.64.137:${PORT}/webhook`);
  console.log('');
});

// Handle SIGINT gracefully
process.on('SIGINT', () => {
  console.log('\n📴 Encerrando debug server...');
  server.close(() => {
    console.log('✅ Server fechado');
    process.exit(0);
  });
});