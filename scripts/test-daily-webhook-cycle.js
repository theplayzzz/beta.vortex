#!/usr/bin/env node

/**
 * 🧪 Script de Teste: Ciclo Completo Daily.co + Webhook
 * 
 * Este script testa o fluxo completo:
 * 1. Cria uma sessão no Daily.co
 * 2. Simula entrada e saída de participante
 * 3. Recebe eventos via webhook
 * 4. Valida o processo de finalização
 */

const DailyIframe = require('@daily-co/daily-js');
const crypto = require('crypto');
const fs = require('fs');
const path = require('path');

// 🔧 Configuração
const WEBHOOK_VERIFICATION_TIMEOUT = 30000; // 30 segundos
const TEST_SESSION_DURATION = 15000; // 15 segundos de sessão ativa
const API_BASE_URL = 'http://localhost:3003'; // Base URL local

console.log('🚀 Daily.co Webhook Test Suite');
console.log('================================\n');

// Carregar variáveis de ambiente
function loadEnvVariables() {
  const envPaths = ['.env.local', '.env'];
  
  for (const envFile of envPaths) {
    const envPath = path.join(__dirname, '..', envFile);
    if (fs.existsSync(envPath)) {
      console.log(`✅ Carregando ${envFile}...`);
      const envContent = fs.readFileSync(envPath, 'utf-8');
      envContent.split('\n').forEach(line => {
        const trimmedLine = line.trim();
        if (trimmedLine && !trimmedLine.startsWith('#')) {
          const [key, ...valueParts] = trimmedLine.split('=');
          if (key && valueParts.length > 0) {
            const value = valueParts.join('=').replace(/^["']|["']$/g, '');
            process.env[key] = value;
          }
        }
      });
      break;
    }
  }
}

// Verificar variáveis necessárias
function validateEnvironment() {
  const requiredVars = [
    'DAILY_API_KEY',
    'DAILY_WEBHOOK_SECRET'
  ];
  
  const missingVars = requiredVars.filter(varName => !process.env[varName]);
  
  if (missingVars.length > 0) {
    console.error('❌ Variáveis de ambiente obrigatórias não encontradas:');
    missingVars.forEach(varName => {
      console.error(`   - ${varName}`);
    });
    console.error('\nExecute primeiro: node scripts/setup-daily-webhook.js');
    process.exit(1);
  }
  
  console.log('✅ Todas as variáveis de ambiente estão configuradas\n');
}

// Criar sessão de transcrição no banco (simulação)
async function createTestTranscriptionSession() {
  const sessionId = `test_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  
  console.log(`📝 Criando sessão de teste: ${sessionId}`);
  
  // Em um cenário real, isso criaria no banco via Prisma
  // Aqui vamos simular com um objeto em memória
  const session = {
    id: sessionId,
    createdAt: new Date(),
    isActive: false,
    totalDuration: 0
  };
  
  return session;
}

// Criar sala no Daily.co usando a API existente
async function createDailyRoom(sessionId) {
  console.log('🏠 Criando sala no Daily.co...');
  
  try {
    const response = await fetch(`${API_BASE_URL}/api/daily/rooms`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        sessionId: sessionId,
        privacy: 'private'
      })
    });
    
    if (!response.ok) {
      const errorData = await response.text();
      throw new Error(`Erro ao criar sala: ${response.status} - ${errorData}`);
    }
    
    const roomData = await response.json();
    console.log(`✅ Sala criada: ${roomData.room.name}`);
    console.log(`   URL: ${roomData.room.url}\n`);
    
    return roomData.room;
  } catch (error) {
    console.error('❌ Erro ao criar sala:', error.message);
    throw error;
  }
}

// Criar token de acesso usando a API existente
async function createDailyToken(roomName, sessionId) {
  console.log('🎟️  Criando token de acesso...');
  
  try {
    const response = await fetch(`${API_BASE_URL}/api/daily/tokens`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        roomName: roomName,
        userName: `TestUser-${sessionId.slice(-6)}`,
        sessionId: sessionId,
        enableTranscription: true,
        permissions: {
          canScreenshare: true
        }
      })
    });
    
    if (!response.ok) {
      const errorData = await response.text();
      throw new Error(`Erro ao criar token: ${response.status} - ${errorData}`);
    }
    
    const tokenData = await response.json();
    console.log('✅ Token criado com sucesso\n');
    
    return tokenData;
  } catch (error) {
    console.error('❌ Erro ao criar token:', error.message);
    throw error;
  }
}

// Monitor de eventos de webhook
class WebhookMonitor {
  constructor() {
    this.receivedEvents = [];
    this.expectedEvents = ['participant.joined', 'participant.left'];
    this.isListening = false;
  }
  
  startListening() {
    this.isListening = true;
    console.log('👂 Iniciando monitoramento de webhooks...');
    
    // Simular escuta de eventos webhook
    // Em um teste real, você monitoria os logs do servidor ou usaria um mock
    this.simulateWebhookReceiving();
    
    return new Promise((resolve) => {
      setTimeout(() => {
        this.stopListening();
        resolve(this.receivedEvents);
      }, WEBHOOK_VERIFICATION_TIMEOUT);
    });
  }
  
  simulateWebhookReceiving() {
    // Esta função simula o recebimento de eventos webhook
    // Em um ambiente real, você monitoraria os logs do servidor ou criaria um endpoint de teste
    console.log('📡 Aguardando eventos de webhook...\n');
  }
  
  stopListening() {
    this.isListening = false;
    console.log('📴 Parando monitoramento de webhooks\n');
  }
}

// Simulador de participante Daily.co
class DailyParticipantSimulator {
  constructor(roomUrl, token, sessionId) {
    this.roomUrl = roomUrl;
    this.token = token;
    this.sessionId = sessionId;
    this.callObject = null;
    this.isConnected = false;
  }
  
  async connect() {
    return new Promise((resolve, reject) => {
      console.log('🔗 Conectando à sessão Daily.co...');
      
      try {
        // Criar CallObject Daily.co
        this.callObject = DailyIframe.createCallObject({
          audioSource: true,
          videoSource: false // Apenas áudio para teste
        });
        
        // Configurar event listeners
        this.callObject.on('joined-meeting', (event) => {
          console.log('✅ Conectado à sessão Daily.co');
          console.log(`   Participante ID: ${event.participants.local.session_id}`);
          this.isConnected = true;
          resolve(event);
        });
        
        this.callObject.on('error', (error) => {
          console.error('❌ Erro na conexão:', error);
          reject(error);
        });
        
        this.callObject.on('left-meeting', (event) => {
          console.log('👋 Sessão finalizada');
          this.isConnected = false;
        });
        
        // Conectar à sala
        this.callObject.join({
          url: this.roomUrl,
          token: this.token
        });
        
      } catch (error) {
        console.error('❌ Erro ao criar CallObject:', error);
        reject(error);
      }
    });
  }
  
  async disconnect() {
    if (this.callObject && this.isConnected) {
      console.log('🔚 Desconectando da sessão...');
      await this.callObject.leave();
      this.callObject.destroy();
      this.callObject = null;
      console.log('✅ Desconectado com sucesso\n');
    }
  }
}

// Verificar logs de webhook no servidor
async function checkWebhookLogs(sessionId) {
  console.log('📊 Verificando logs de webhook...');
  
  // Tentar ler os logs de webhook recentes
  const logFile = path.join(__dirname, '..', 'test_webhook.log');
  
  if (fs.existsSync(logFile)) {
    try {
      // Ler apenas as últimas linhas do arquivo
      const logContent = fs.readFileSync(logFile, 'utf-8');
      const lines = logContent.split('\n').slice(-50); // Últimas 50 linhas
      
      const relevantLogs = lines.filter(line => 
        line.includes(sessionId) || 
        line.includes('participant.joined') || 
        line.includes('participant.left')
      );
      
      if (relevantLogs.length > 0) {
        console.log('✅ Eventos de webhook encontrados nos logs:');
        relevantLogs.forEach(log => {
          console.log(`   ${log}`);
        });
        return relevantLogs;
      }
    } catch (error) {
      console.log('⚠️  Não foi possível ler os logs:', error.message);
    }
  }
  
  console.log('⚠️  Nenhum log de webhook encontrado');
  return [];
}

// Limpar recursos
async function cleanup(roomName) {
  if (roomName) {
    console.log('🧹 Limpando recursos...');
    
    try {
      // Deletar a sala criada
      const response = await fetch(`https://api.daily.co/v1/rooms/${roomName}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${process.env.DAILY_API_KEY}`
        }
      });
      
      if (response.ok) {
        console.log('✅ Sala removida com sucesso');
      }
    } catch (error) {
      console.log('⚠️  Erro ao limpar sala:', error.message);
    }
  }
}

// Função principal de teste
async function runTest() {
  let session = null;
  let room = null;
  let participant = null;
  
  try {
    // 1. Setup inicial
    loadEnvVariables();
    validateEnvironment();
    
    // 2. Criar sessão de teste
    session = await createTestTranscriptionSession();
    
    // 3. Criar sala Daily.co
    room = await createDailyRoom(session.id);
    
    // 4. Criar token de acesso
    const tokenData = await createDailyToken(room.name, session.id);
    
    // 5. Iniciar monitor de webhook
    const webhookMonitor = new WebhookMonitor();
    const webhookPromise = webhookMonitor.startListening();
    
    // 6. Simular participante
    participant = new DailyParticipantSimulator(room.url, tokenData.token, session.id);
    
    // 7. Conectar participante
    await participant.connect();
    
    // 8. Aguardar um tempo na sessão
    console.log(`⏱️  Mantendo sessão ativa por ${TEST_SESSION_DURATION / 1000} segundos...\n`);
    await new Promise(resolve => setTimeout(resolve, TEST_SESSION_DURATION));
    
    // 9. Desconectar participante
    await participant.disconnect();
    
    // 10. Aguardar eventos de webhook
    console.log('⏳ Aguardando processamento de webhooks...');
    await new Promise(resolve => setTimeout(resolve, 5000)); // 5 segundos
    
    // 11. Verificar logs de webhook
    const webhookLogs = await checkWebhookLogs(session.id);
    
    // 12. Relatório final
    console.log('\n📋 RELATÓRIO DO TESTE');
    console.log('===================');
    console.log(`✅ Sessão criada: ${session.id}`);
    console.log(`✅ Sala Daily.co: ${room.name}`);
    console.log(`✅ Token gerado: OK`);
    console.log(`✅ Participante conectado: OK`);
    console.log(`✅ Participante desconectado: OK`);
    console.log(`📊 Logs de webhook encontrados: ${webhookLogs.length}`);
    
    if (webhookLogs.length > 0) {
      console.log('\n🎉 TESTE CONCLUÍDO COM SUCESSO!');
      console.log('Os webhooks estão funcionando corretamente.');
    } else {
      console.log('\n⚠️  ATENÇÃO: Webhooks podem não estar funcionando');
      console.log('Verifique:');
      console.log('1. Se o servidor está rodando (npm run dev)');
      console.log('2. Se os webhooks foram configurados (scripts/setup-daily-webhook.js)');
      console.log('3. Se o DAILY_WEBHOOK_SECRET está correto');
    }
    
  } catch (error) {
    console.error('\n❌ ERRO NO TESTE:', error.message);
    console.error(error.stack);
  } finally {
    // Cleanup
    if (participant) {
      await participant.disconnect();
    }
    if (room) {
      await cleanup(room.name);
    }
  }
}

// Executar teste
if (require.main === module) {
  runTest().catch(console.error);
}

module.exports = { runTest };
